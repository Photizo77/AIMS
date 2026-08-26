// src/services/innovationService.ts
import type { InnovationProject, InnovationStage, InnovationMilestone, InnovationComment, InnovationDocument } from '@/types';
import { loadJSON, saveJSON, STORAGE_KEYS } from '@/lib/storage';

// ═══════════════════════════════════════════
// ORGANIZATION INNOVATION PIPELINE
// Single source of truth for all innovation projects.
// In-memory mutations power the persona workflows (no backend yet).
// ═══════════════════════════════════════════

const SEED_PROJECTS: InnovationProject[] = [
  {
    id: 'inv-001',
    title: 'Solar-Powered Grain Dryer',
    description: 'Automated drying system for smallholder farmers using IoT sensors to regulate temperature and humidity, cutting post-harvest losses by up to 40%.',
    stage: 'prototype',
    leadName: 'Pius Odong',
    contributorNames: ['Florence Adong', 'Isaac Tumusiime'],
    progressPercent: 62,
    budget: 18500000,
    budgetSpent: 9800000,
    daysInStage: 9,
    createdAt: '2026-08-01',
    updatedAt: '2026-08-15',
    milestones: [
      { id: 'm1', title: 'Design & CAD', dueDate: '2026-08-15', assigneeName: 'Pius Odong', completed: true },
      { id: 'm2', title: 'Prototype Assembly', dueDate: '2026-09-01', assigneeName: 'Florence Adong', completed: true },
      { id: 'm3', title: 'Field Testing', dueDate: '2026-09-20', assigneeName: 'Pius Odong', completed: false },
    ],
    activityLog: [
      { id: 'a1', timestamp: '2026-08-01T09:00:00Z', actorName: 'Pius Odong', type: 'stage_transition', description: 'Moved from Research to Prototype', fromStage: 'research', toStage: 'prototype' },
    ],
    comments: [
      { id: 'c1', authorId: 'u1', authorName: 'Pius Odong', authorRole: 'INNOVATOR', content: 'Completed testing phase. All safety metrics met.', createdAt: '2026-08-24' },
    ],
    documents: [
      { id: 'd1', title: 'Technical Spec v2', source: 'upload', url: '#', uploadedBy: 'Pius Odong', uploadedAt: '2026-08-10', fileType: 'PDF' },
    ],
  },
  {
    id: 'inv-002',
    title: 'Community Land Mapping Drone',
    description: 'Low-cost drone solution for parcel-level land documentation, reducing survey costs by 60% in rural sub-counties.',
    stage: 'testing',
    leadName: 'Florence Adong',
    contributorNames: ['Pius Odong', 'Grace Nakamya'],
    progressPercent: 78,
    budget: 42000000,
    budgetSpent: 21000000,
    daysInStage: 4,
    createdAt: '2026-07-20',
    updatedAt: '2026-08-10',
    milestones: [
      { id: 'm1', title: 'Flight Test Plan', dueDate: '2026-08-05', assigneeName: 'Florence Adong', completed: true },
      { id: 'm2', title: 'Accuracy Validation', dueDate: '2026-08-25', assigneeName: 'Pius Odong', completed: false },
    ],
    activityLog: [],
    comments: [],
    documents: [],
  },
  {
    id: 'inv-003',
    title: 'Mobile USSD Farmer Advisory',
    description: 'SMS/USSD-based advisory service delivering weather, pricing and agronomy tips to feature-phone farmers.',
    stage: 'concept',
    leadName: 'Pius Odong',
    contributorNames: ['Janet Apio', 'Grace Nakamya'],
    progressPercent: 35,
    daysInStage: 18,
    createdAt: '2026-06-15',
    updatedAt: '2026-08-01',
    milestones: [
      { id: 'm1', title: 'Needs Assessment', dueDate: '2026-07-20', assigneeName: 'Janet Apio', completed: true },
      { id: 'm2', title: 'Service Blueprint', dueDate: '2026-09-05', assigneeName: 'Pius Odong', completed: false },
    ],
    activityLog: [],
    comments: [],
    documents: [],
  },
  {
    id: 'inv-004',
    title: 'Biogas Digester Pilot',
    description: 'Household-scale biogas digesters for 50 farming families, converting manure into cooking fuel.',
    stage: 'research',
    leadName: 'Florence Adong',
    contributorNames: ['Isaac Tumusiime'],
    progressPercent: 15,
    daysInStage: 6,
    createdAt: '2026-08-10',
    updatedAt: '2026-08-16',
    milestones: [
      { id: 'm1', title: 'Literature Review', dueDate: '2026-09-01', assigneeName: 'Florence Adong', completed: false },
    ],
    activityLog: [],
    comments: [],
    documents: [],
  },
  {
    id: 'inv-005',
    title: 'Post-Harvest Loss Tracker App',
    description: 'Mobile app for cooperatives to log and track post-harvest losses across the value chain.',
    stage: 'production',
    leadName: 'Pius Odong',
    contributorNames: ['Grace Nakamya'],
    progressPercent: 91,
    budget: 56000000,
    budgetSpent: 34000000,
    daysInStage: 22,
    createdAt: '2026-04-01',
    updatedAt: '2026-08-12',
    milestones: [
      { id: 'm1', title: 'MVP Build', dueDate: '2026-07-15', assigneeName: 'Pius Odong', completed: true },
      { id: 'm2', title: 'Pilot with 5 Cooperatives', dueDate: '2026-08-10', assigneeName: 'Grace Nakamya', completed: true },
      { id: 'm3', title: 'Public Release', dueDate: '2026-09-30', assigneeName: 'Pius Odong', completed: false },
    ],
    activityLog: [],
    comments: [],
    documents: [],
  },
  {
    id: 'inv-006',
    title: 'Soil Moisture IoT Sensor',
    description: 'Deployed sensor network transmitting soil moisture readings to a central dashboard for irrigation scheduling.',
    stage: 'deployed',
    leadName: 'Florence Adong',
    contributorNames: ['Pius Odong'],
    progressPercent: 100,
    daysInStage: 5,
    createdAt: '2026-02-01',
    updatedAt: '2026-08-20',
    milestones: [
      { id: 'm1', title: 'Sensor Field Installation', dueDate: '2026-08-01', assigneeName: 'Florence Adong', completed: true },
      { id: 'm2', title: 'Dashboard Go-Live', dueDate: '2026-08-20', assigneeName: 'Pius Odong', completed: true },
    ],
    activityLog: [],
    comments: [],
    documents: [],
  },
  {
    id: 'inv-007',
    title: 'Agro-Weather Station Network',
    description: 'Distributed weather stations feeding hyperlocal forecasts to extension officers and farmer groups.',
    stage: 'research',
    leadName: 'Isaac Tumusiime',
    contributorNames: ['Florence Adong'],
    progressPercent: 12,
    daysInStage: 12,
    createdAt: '2026-07-25',
    updatedAt: '2026-08-05',
    milestones: [
      { id: 'm1', title: 'Site Selection Study', dueDate: '2026-09-10', assigneeName: 'Isaac Tumusiime', completed: false },
    ],
    activityLog: [],
    comments: [],
    documents: [],
  },
  {
    id: 'inv-008',
    title: 'AI Crop Disease Detector',
    description: 'On-device image recognition model that identifies common crop diseases from farmer phone photos.',
    stage: 'concept',
    leadName: 'Pius Odong',
    contributorNames: ['Janet Apio'],
    progressPercent: 30,
    daysInStage: 3,
    createdAt: '2026-08-18',
    updatedAt: '2026-08-20',
    milestones: [
      { id: 'm1', title: 'Dataset Curation', dueDate: '2026-09-15', assigneeName: 'Pius Odong', completed: false },
    ],
    activityLog: [],
    comments: [],
    documents: [],
  },
];

// Mutable in-memory store (replaces MOCK_PROJECTS so persona actions persist during the session)
const persistedProjects = loadJSON<InnovationProject[] | null>(STORAGE_KEYS.projects, null);
let projects: InnovationProject[] = (persistedProjects && persistedProjects.length > 0 ? persistedProjects : SEED_PROJECTS).map((p) => ({
  ...p,
  milestones: p.milestones.map((m) => ({ ...m })),
  activityLog: p.activityLog.map((a) => ({ ...a })),
  comments: p.comments.map((c) => ({ ...c })),
  documents: p.documents.map((d) => ({ ...d })),
}));

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

function saveProjects(): void {
  saveJSON(STORAGE_KEYS.projects, projects);
}

function recomputeProgress(project: InnovationProject): void {
  if (project.milestones.length === 0) {
    project.progressPercent = project.stage === 'deployed' ? 100 : 0;
    return;
  }
  project.progressPercent = Math.round((project.milestones.filter((m) => m.completed).length / project.milestones.length) * 100);
}

export const innovationService = {
  /** Returns ALL projects (org-wide strategic overview — Innovator Dashboard) */
  getAllProjects: (): InnovationProject[] => projects,

  /** Returns ONLY projects where the user is Lead or Contributor (Tasks module) */
  getMyProjects: (userName: string): InnovationProject[] =>
    projects.filter((p) => p.leadName === userName || p.contributorNames.includes(userName)),

  /** Returns a single project by ID (Detail page) */
  getProjectById: (id: string): InnovationProject | undefined => projects.find((p) => p.id === id),

  /** Stage configuration for UI mapping */
  getStages: () => [
    { key: 'research' as const, label: 'Research', color: 'mint' as const },
    { key: 'concept' as const, label: 'Concept', color: 'orange' as const },
    { key: 'prototype' as const, label: 'Prototype', color: 'navy' as const },
    { key: 'testing' as const, label: 'Testing', color: 'mint' as const },
    { key: 'production' as const, label: 'Production', color: 'green' as const },
    { key: 'deployed' as const, label: 'Deployed', color: 'navy' as const },
  ],

  /** Toggle a milestone's completion state; returns the updated project */
  toggleMilestone: (projectId: string, milestoneId: string): InnovationProject | undefined => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return undefined;
    project.milestones = project.milestones.map((m) =>
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );
    recomputeProgress(project);
    project.updatedAt = new Date().toISOString().slice(0, 10);
    saveProjects();
    return project;
  },

  /** Add a comment/update to a project */
  addComment: (projectId: string, comment: Omit<InnovationComment, 'id' | 'createdAt'>): InnovationProject | undefined => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return undefined;
    project.comments = [
      ...project.comments,
      { ...comment, id: nextId('c'), createdAt: new Date().toISOString().slice(0, 10) },
    ];
    project.activityLog = [
      ...project.activityLog,
      { id: nextId('a'), timestamp: new Date().toISOString(), actorName: comment.authorName, type: 'comment', description: comment.content },
    ];
    project.updatedAt = new Date().toISOString().slice(0, 10);
    saveProjects();
    return project;
  },

  /** Attach a document/resource to a project */
  addDocument: (projectId: string, doc: Omit<InnovationDocument, 'id' | 'uploadedAt'>): InnovationProject | undefined => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return undefined;
    project.documents = [
      ...project.documents,
      { ...doc, id: nextId('d'), uploadedAt: new Date().toISOString().slice(0, 10) },
    ];
    project.activityLog = [
      ...project.activityLog,
      { id: nextId('a'), timestamp: new Date().toISOString(), actorName: doc.uploadedBy, type: 'document_linked', description: `Uploaded ${doc.title}` },
    ];
    project.updatedAt = new Date().toISOString().slice(0, 10);
    saveProjects();
    return project;
  },

  /** Push a project to the next stage, reassign the lead to the selected handler, notify via activity log */
  moveToNextStage: (
    projectId: string,
    nextStage: InnovationStage,
    nextHandler: string,
    message: string
  ): InnovationProject | undefined => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return undefined;
    const fromStage = project.stage;
    project.stage = nextStage;
    project.leadName = nextHandler;
    project.daysInStage = 0;
    if (!project.contributorNames.includes(nextHandler)) {
      project.contributorNames = [...project.contributorNames, nextHandler];
    }
    project.activityLog = [
      ...project.activityLog,
      {
        id: nextId('a'),
        timestamp: new Date().toISOString(),
        actorName: project.leadName,
        type: 'stage_transition',
        description: message || `Moved from ${fromStage} to ${nextStage}, handed off to ${nextHandler}`,
        fromStage,
        toStage: nextStage,
      },
    ];
    project.updatedAt = new Date().toISOString().slice(0, 10);
    saveProjects();
    return project;
  },

  /** Add a contributor to a project */
  addContributor: (projectId: string, name: string): InnovationProject | undefined => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return undefined;
    if (!project.contributorNames.includes(name)) {
      project.contributorNames = [...project.contributorNames, name];
      project.activityLog = [
        ...project.activityLog,
        { id: nextId('a'), timestamp: new Date().toISOString(), actorName: name, type: 'comment', description: `Joined the project team as contributor` },
      ];
    }
    project.updatedAt = new Date().toISOString().slice(0, 10);
    saveProjects();
    return project;
  },

  /** Remove a contributor from a project */
  removeContributor: (projectId: string, name: string): InnovationProject | undefined => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return undefined;
    project.contributorNames = project.contributorNames.filter((c) => c !== name);
    project.updatedAt = new Date().toISOString().slice(0, 10);
    saveProjects();
    return project;
  },

  /** Create a brand-new milestone on a project */
  addMilestone: (projectId: string, milestone: Omit<InnovationMilestone, 'id'>): InnovationProject | undefined => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return undefined;
    project.milestones = [...project.milestones, { ...milestone, id: nextId('m') }];
    recomputeProgress(project);
    project.updatedAt = new Date().toISOString().slice(0, 10);
    saveProjects();
    return project;
  },

  /** Set the project budget (UGX) — links innovations to finance */
  setBudget: (projectId: string, budget: number): InnovationProject | undefined => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return undefined;
    project.budget = budget;
    project.updatedAt = new Date().toISOString().slice(0, 10);
    saveProjects();
    return project;
  },
};
