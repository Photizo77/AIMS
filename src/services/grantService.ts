// src/services/grantService.ts
// ============================================================
// AIMS — Grant lifecycle service (in-memory mock, no backend yet)
// Lifecycle: identified → drafting → submitted → under_review → awarded
//           (identified → drafting on start drafting)
//           (submitted ⇄ drafting on ED request-changes)
// ============================================================

import { MOCK_GRANTS, type GrantRecord } from '@/data/grants';
import { loadJSON, saveJSON, STORAGE_KEYS } from '@/lib/storage';

const persistedGrants = loadJSON<GrantRecord[] | null>(STORAGE_KEYS.grants, null);
let grants: GrantRecord[] = (persistedGrants && persistedGrants.length > 0 ? persistedGrants : MOCK_GRANTS).map((g) => ({
  ...g,
  milestones: g.milestones.map((m) => ({ ...m })),
  activity: g.activity.map((a) => ({ ...a })),
  documents: g.documents?.map((d) => ({ ...d })),
  comments: g.comments?.map((c) => ({ ...c })),
}));

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function addActivity(g: GrantRecord, actor: string, action: string): void {
  g.activity = [...g.activity, { id: nextId('a'), actor, action, timestamp: nowIso() }];
}

function saveGrants(): void {
  saveJSON(STORAGE_KEYS.grants, grants);
}

export const grantService = {
  /** ALL grants (org-wide views: dashboard, ED/CD, pipeline board) */
  getAllGrants: (): GrantRecord[] => grants,

  /** Grants assigned to a specific person (handler or contributor) */
  getMyGrants: (userName: string): GrantRecord[] =>
    grants.filter((g) => g.handler === userName || g.contributors.includes(userName)),

  /** Grants with no handler yet (available for Express Interest) */
  getUnassigned: (): GrantRecord[] => grants.filter((g) => !g.handler || g.handler === 'Unassigned'),

  getGrantById: (id: string): GrantRecord | undefined => grants.find((g) => g.id === id),

  /** ANY grant writer can add a new opportunity to the shared pipeline */
  createGrant: (input: {
    title: string;
    funder: string;
    pillar?: string;
    description?: string;
    deadline: string;
    amountRequested: number;
    /** Who the grant starts with — assign to self or leave 'Unassigned' for the team to pick up */
    handler: string;
    createdBy: string;
  }): GrantRecord => {
    const now = nowIso();
    const grant: GrantRecord = {
      id: nextId('g'),
      title: input.title.trim(),
      funder: input.funder.trim(),
      pillar: input.pillar?.trim() || 'Cross-cutting',
      handler: input.handler === 'Unassigned' ? 'Unassigned' : input.handler.trim(),
      contributors: [],
      stage: 'identified',
      deadline: input.deadline,
      amountRequested: input.amountRequested || 0,
      description: input.description?.trim() || undefined,
      milestones: [],
      activity: [{ id: nextId('a'), actor: input.createdBy, action: `Added a new grant opportunity to the shared pipeline (${input.funder.trim()})`, timestamp: now }],
      comments: [],
      documents: [],
    };
    grants = [grant, ...grants];
    saveGrants();
    return grant;
  },

  /** Share a grant with a colleague — they join as contributor and can add resources/comments */
  addContributor: (grantId: string, name: string, actor: string): GrantRecord | undefined => {
    const g = grants.find((x) => x.id === grantId);
    if (!g || !name) return undefined;
    if (name === g.handler || g.contributors.includes(name)) return g;
    g.contributors = [...g.contributors, name];
    addActivity(g, actor, `Shared "${g.title}" with ${name} — joined as contributor`);
    saveGrants();
    return g;
  },

  /** Remove a contributor from the shared grant */
  removeContributor: (grantId: string, name: string, actor: string): GrantRecord | undefined => {
    const g = grants.find((x) => x.id === grantId);
    if (!g) return undefined;
    g.contributors = g.contributors.filter((c) => c !== name);
    addActivity(g, actor, `Removed ${name} from the grant team`);
    saveGrants();
    return g;
  },

  /** EXPRESS INTEREST — auto-assigns the current writer as handler (stage stays Identified) */
  expressInterest: (grantId: string, userName: string): GrantRecord | undefined => {
    const g = grants.find((x) => x.id === grantId);
    if (!g || (g.handler && g.handler !== 'Unassigned')) return g;
    g.handler = userName;
    addActivity(g, userName, `Expressed interest — auto-assigned as handler for this grant`);
    saveGrants();
    return g;
  },

  /** START DRAFTING — Identified → Drafting (writer begins work) */
  startDrafting: (grantId: string, userName: string): GrantRecord | undefined => {
    const g = grants.find((x) => x.id === grantId);
    if (!g) return undefined;
    if (g.stage === 'identified') {
      g.stage = 'drafting';
      addActivity(g, userName, 'Moved from Identified to Drafting');
    }
    saveGrants();
    return g;
  },

  /** PUSH TO ED — Drafting → Submitted; grant becomes read-only for the writer */
  submitToED: (grantId: string, userName: string): GrantRecord | undefined => {
    const g = grants.find((x) => x.id === grantId);
    if (!g) return undefined;
    if (g.stage === 'drafting') {
      g.stage = 'submitted';
      addActivity(g, userName, 'Pushed to ED — awaiting executive review');
    }
    saveGrants();
    return g;
  },

  /** ED DECISION — Submitted/Under Review → Awarded (approve) or → Drafting (request changes) */
  edDecision: (
    grantId: string,
    decision: 'approve' | 'changes',
    note: string,
    edName: string
  ): GrantRecord | undefined => {
    const g = grants.find((x) => x.id === grantId);
    if (!g) return undefined;
    const actionable = g.stage === 'submitted' || g.stage === 'under_review';
    if (!actionable) return g;
    if (decision === 'approve') {
      g.stage = 'awarded';
      g.amountAwarded = g.amountAwarded ?? g.amountRequested;
      g.edNotes = note;
      addActivity(g, edName, `APPROVED — grant moved to Awarded. ${note ? `Notes: ${note}` : ''}`);
    } else {
      g.stage = 'drafting';
      g.edNotes = note;
      addActivity(g, edName, `Requested changes — grant returned to Drafting. ${note ? `Notes: ${note}` : ''}`);
    }
    saveGrants();
    return g;
  },

  /** Toggle a milestone completion state */
  toggleMilestone: (grantId: string, milestoneId: string, userName: string): GrantRecord | undefined => {
    const g = grants.find((x) => x.id === grantId);
    if (!g) return undefined;
    g.milestones = g.milestones.map((m) =>
      m.id === milestoneId ? { ...m, completed: !m.completed, assignee: m.assignee === '—' ? userName : m.assignee } : m
    );
    const m = g.milestones.find((x) => x.id === milestoneId);
    if (m) addActivity(g, userName, `${m.completed ? 'Completed' : 'Reopened'} milestone: ${m.title}`);
    saveGrants();
    return g;
  },

  /** Add a milestone to a grant checklist */
  addMilestone: (grantId: string, title: string, userName: string): GrantRecord | undefined => {
    const g = grants.find((x) => x.id === grantId);
    if (!g) return undefined;
    g.milestones = [
      ...g.milestones,
      { id: nextId('m'), title, dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10), completed: false, assignee: userName },
    ];
    addActivity(g, userName, `Added milestone: ${title}`);
    saveGrants();
    return g;
  },

  /** Add a comment to the grant discussion */
  addComment: (grantId: string, content: string, userName: string, role: string): GrantRecord | undefined => {
    const g = grants.find((x) => x.id === grantId);
    if (!g) return undefined;
    g.comments = [
      ...(g.comments ?? []),
      { id: nextId('c'), author: userName, role, content, timestamp: nowIso() },
    ];
    addActivity(g, userName, 'Added a comment to the grant discussion');
    saveGrants();
    return g;
  },

  /** Attach a document to the grant */
  addDocument: (grantId: string, title: string, userName: string): GrantRecord | undefined => {
    const g = grants.find((x) => x.id === grantId);
    if (!g) return undefined;
    g.documents = [
      ...(g.documents ?? []),
      { id: nextId('d'), title, fileType: title.endsWith('.pdf') ? 'PDF' : title.endsWith('.xlsx') ? 'XLSX' : 'DOCX', size: `${(Math.random() * 900 + 100).toFixed(0)} KB`, uploadedBy: userName, uploadedAt: new Date().toISOString().slice(0, 10), version: (g.documents?.length ?? 0) + 1 },
    ];
    addActivity(g, userName, `Uploaded document: ${title}`);
    saveGrants();
    return g;
  },

  /** Attach a shared resource/file with real metadata (any grant-writer role can add) */
  attachResource: (grantId: string, input: { title: string; fileType: string; size: string; uploadedBy: string }): GrantRecord | undefined => {
    const g = grants.find((x) => x.id === grantId);
    if (!g) return undefined;
    g.documents = [
      ...(g.documents ?? []),
      {
        id: nextId('d'),
        title: input.title,
        fileType: input.fileType || 'FILE',
        size: input.size,
        uploadedBy: input.uploadedBy,
        uploadedAt: new Date().toISOString().slice(0, 10),
        version: (g.documents?.length ?? 0) + 1,
      },
    ];
    addActivity(g, input.uploadedBy, `Shared a resource on "${g.title}": ${input.title}`);
    saveGrants();
    return g;
  },
};
