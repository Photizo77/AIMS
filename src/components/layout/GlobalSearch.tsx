// src/components/layout/GlobalSearch.tsx
// ============================================================
// AIMS — Global search (Ctrl/Cmd+K from anywhere in the app).
// Searches across grants, innovation projects, people, documents
// and the knowledge base; results are grouped by module with
// counts; recent searches and quick navigation links are offered
// before you type. Selecting a result routes to the target page.
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { ROLE_LABELS } from '@/config/roles';
import { getVisibleNavItems } from '@/config/navigation';
import { grantService } from '@/services/grantService';
import { innovationService } from '@/services/innovationService';
import { listDocs, type DocCategory } from '@/services/docService';
import { listHrDocs } from '@/services/employeeDocsService';
import { getDirectoryEntries } from '@/services/employeeService';
import { STAFF_ROSTER } from '@/data/roster';
import { KNOWLEDGE_RESOURCES } from '@/data/knowledgeResources';

type Kind = 'grant' | 'project' | 'person' | 'document' | 'knowledge';

interface Result {
  key: string;
  kind: Kind;
  title: string;
  subtitle: string;
  href: string;
}

const KIND_META: Record<Kind, { label: string; icon: string; chip: string; iconCls: string }> = {
  grant: { label: 'Grants', icon: 'volunteer_activism', chip: 'bg-aims-green/15 text-aims-green', iconCls: 'text-aims-green' },
  project: { label: 'Projects', icon: 'lightbulb', chip: 'bg-aims-navy/10 text-aims-navy', iconCls: 'text-aims-navy' },
  person: { label: 'People', icon: 'person', chip: 'bg-aims-orange/15 text-aims-orange', iconCls: 'text-aims-orange' },
  document: { label: 'Documents', icon: 'description', chip: 'bg-aims-mint/30 text-aims-navy', iconCls: 'text-aims-navy' },
  knowledge: { label: 'Knowledge Base', icon: 'menu_book', chip: 'bg-slate-100 text-slate-600', iconCls: 'text-slate-600' },
};

const RECENT_KEY = 'aims_recent_searches';

/** Document categories this role may actually open in the Documents hub (full/view/flag) */
function allowedDocCategories(role: string | undefined): Set<DocCategory> {
  const all: DocCategory[] = ['governance', 'hr_contracts', 'hr_confidential', 'finance_procurement', 'grants', 'grants_resource', 'innovations', 'inventory_policy', 'system_security', 'shared_reference'];
  const matrix: Record<string, DocCategory[]> = {
    CD: ['governance', 'hr_contracts', 'finance_procurement', 'grants', 'grants_resource', 'innovations', 'inventory_policy', 'shared_reference'],
    ED: all,
    COMPANY_ADMIN: ['governance', 'hr_contracts', 'hr_confidential', 'inventory_policy', 'shared_reference'],
    SYS_ADMIN: ['system_security', 'shared_reference'],
    FINANCE: ['finance_procurement', 'shared_reference'],
    GRANT_WRITER: ['grants', 'grants_resource', 'shared_reference'],
    GRANTS_MANAGER: ['grants', 'grants_resource', 'shared_reference'],
    INNOVATOR: ['innovations', 'shared_reference'],
  };
  return new Set(matrix[role ?? ''] ?? []);
}

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string').slice(0, 6) : [];
  } catch {
    return [];
  }
}

export function GlobalSearch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<string[]>(loadRecent);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
      setQuery('');
    }
  }, [open]);

  const recordRecent = (term: string) => {
    const t = term.trim();
    if (!t) return;
    const next = [t, ...recent.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 6);
    setRecent(next);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* private mode */ }
  };

  const clearRecent = () => {
    setRecent([]);
    try { localStorage.removeItem(RECENT_KEY); } catch { /* ignore */ }
  };

  // ── Search every module ──
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out: { kind: Kind; items: Result[] }[] = [];

    // Grants — titles, funders, descriptions
    const grants: Result[] = grantService.getAllGrants()
      .filter((g) => g.title.toLowerCase().includes(q) || g.funder.toLowerCase().includes(q) || (g.description ?? '').toLowerCase().includes(q))
      .map((g) => ({ key: `g-${g.id}`, kind: 'grant', title: g.title, subtitle: `${g.funder} · ${g.stage} · ${g.pillar ?? ''}`.replace(/\s+/g, ' ').trim(), href: `/grants/${g.id}` }));
    if (grants.length) out.push({ kind: 'grant', items: grants });

    // Innovation projects — titles, descriptions, leads
    const projects: Result[] = innovationService.getAllProjects()
      .filter((p) => p.lifecycle?.status !== 'archived')
      .filter((p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.leadName.toLowerCase().includes(q))
      .map((p) => ({ key: `p-${p.id}`, kind: 'project', title: p.title, subtitle: `Innovation · ${p.lifecycle?.status === 'active' || !p.lifecycle ? p.stage : p.lifecycle?.status} · ${p.leadName}`, href: `/innovations/${p.id}` }));
    if (projects.length) out.push({ kind: 'project', items: projects });

    // People — names, roles, departments (roster + onboarding directory)
    const people: Result[] = [];
    STAFF_ROSTER.forEach((s) => {
      const hay = `${s.name} ${s.position} ${s.department} ${ROLE_LABELS[s.role]} ${s.email}`.toLowerCase();
      if (hay.includes(q)) people.push({ key: `s-${s.id}`, kind: 'person', title: s.name, subtitle: `${ROLE_LABELS[s.role]} · ${s.department} · ${s.position}`, href: `/hr?tab=directory&user=${encodeURIComponent(s.id)}` });
    });
    getDirectoryEntries().forEach((e) => {
      const hay = `${e.name} ${e.position} ${e.department} ${ROLE_LABELS[e.role]} ${e.email}`.toLowerCase();
      if (hay.includes(q)) people.push({ key: `e-${e.id}`, kind: 'person', title: e.name, subtitle: `${ROLE_LABELS[e.role]} · ${e.department} · ${e.position}`, href: `/hr?tab=directory&user=${encodeURIComponent(e.id)}` });
    });
    if (people.length) out.push({ kind: 'person', items: people });

    // Documents — filenames + metadata (category, uploader, tags)
    const allowed = allowedDocCategories(user?.role);
    const docs: Result[] = listDocs()
      .filter((d) => allowed.has(d.category))
      .filter((d) => `${d.title} ${d.fileType} ${d.uploadedBy} ${d.tags.join(' ')}`.toLowerCase().includes(q))
      .map((d) => ({ key: `d-${d.id}`, kind: 'document', title: d.title, subtitle: `Document · ${d.category.replace(/_/g, ' ')} · ${d.uploadedBy}`, href: `/documents?doc=${encodeURIComponent(d.id)}` }));
    // HR-confidential personnel files (ED + HR only)
    if (user && (user.role === 'ED' || user.role === 'COMPANY_ADMIN')) {
      listHrDocs()
        .filter((d) => `${d.title} ${d.fileType} ${d.uploadedBy} ${d.tags.join(' ')}`.toLowerCase().includes(q))
        .forEach((d) => docs.push({ key: `hr-${d.id}`, kind: 'document', title: d.title, subtitle: `Document · HR confidential — employee files · ${d.uploadedBy}`, href: '/documents' }));
    }
    if (docs.length) out.push({ kind: 'document', items: docs });

    // Knowledge base — articles & resources
    const knowledge: Result[] = KNOWLEDGE_RESOURCES
      .filter((r) => `${r.title} ${r.description} ${r.category} ${r.type}`.toLowerCase().includes(q))
      .map((r) => ({ key: `k-${r.id}`, kind: 'knowledge', title: r.title, subtitle: `Knowledge Base · ${r.category} · ${r.type}`, href: '/knowledge' }));
    if (knowledge.length) out.push({ kind: 'knowledge', items: knowledge });

    return out;
  }, [query, user?.role]);

  const totalCount = groups.reduce((s, g) => s + g.items.length, 0);
  const firstResult = groups[0]?.items[0];

  const go = (r: Result) => {
    recordRecent(query);
    setOpen(false);
    navigate(r.href);
  };

  const quickNav = user ? getVisibleNavItems(user.role).filter((n) => !n.href.includes('?') || n.href.startsWith('/dashboard')).slice(0, 10) : [];

  return (
    <div className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm p-4 flex items-start justify-center pt-[10vh]" onClick={() => setOpen(false)}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Global search">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200">
          <span className="material-symbols-outlined text-aims-navy text-[22px]">search</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && firstResult) { e.preventDefault(); go(firstResult); }
            }}
            placeholder="Search grants, projects, people, documents, knowledge…"
            className="flex-1 text-sm focus:outline-none placeholder:text-slate-400"
          />
          <button onClick={() => setOpen(false)} className="text-[10px] font-bold text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 hover:text-slate-600">ESC</button>
        </div>

        <div className="max-h-[62vh] overflow-y-auto">
          {/* No query — recent searches + quick navigation */}
          {!query.trim() && (
            <div className="p-4 space-y-5">
              {recent.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><span className="material-symbols-outlined text-[13px]">history</span>Recent Searches</p>
                    <button onClick={clearRecent} className="text-[10px] font-bold text-slate-400 hover:text-red-500 hover:underline">Clear</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recent.map((r) => (
                      <button key={r} onClick={() => setQuery(r)} className="text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-aims-mint/40 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px] text-slate-400">search</span>{r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><span className="material-symbols-outlined text-[13px]">bolt</span>Quick Navigation</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {quickNav.map((n) => (
                    <button key={n.href} onClick={() => { recordRecent(query); setOpen(false); navigate(n.href); }} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-200 hover:border-aims-navy/40 hover:bg-aims-navy/5 transition-colors text-left">
                      <span className="material-symbols-outlined text-[18px] text-aims-navy">{n.icon}</span>
                      <span className="text-xs font-bold text-slate-700 leading-tight">{n.title}</span>
                    </button>
                  ))}
                  {quickNav.length === 0 && <p className="text-xs text-slate-400 italic col-span-3">Sign in to see shortcuts.</p>}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 italic">Press Ctrl+K anywhere to search the whole organisation.</p>
            </div>
          )}

          {/* Query results — grouped by module */}
          {query.trim() && (
            <div className="p-2">
              {groups.length === 0 && (
                <p className="text-xs text-slate-400 italic p-6 text-center">No results for "{query.trim()}". Try a funder, project title, person or document name.</p>
              )}
              {groups.map((group) => {
                const meta = KIND_META[group.kind];
                return (
                  <div key={group.kind} className="mb-1">
                    <div className="flex items-center gap-2 px-3 pt-3 pb-1.5">
                      <span className={cn('material-symbols-outlined text-[15px]', meta.iconCls)}>{meta.icon}</span>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{meta.label}</p>
                      <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full', meta.chip)}>{group.items.length} {group.items.length === 1 ? 'result' : 'results'}</span>
                    </div>
                    {group.items.slice(0, 8).map((r) => (
                      <button key={r.key} onClick={() => go(r)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 text-left group/row">
                        <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0', meta.chip)}>{group.kind}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-900 truncate group-hover/row:text-aims-navy transition-colors">{r.title}</p>
                          <p className="text-[10px] text-slate-500 truncate">{r.subtitle}</p>
                        </div>
                        <span className="material-symbols-outlined text-slate-300 text-[16px]">open_in_new</span>
                      </button>
                    ))}
                    {group.items.length > 8 && <p className="px-3 pb-1 text-[10px] text-slate-400 italic">+ {group.items.length - 8} more {meta.label.toLowerCase()}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[10px] text-slate-400">
          <span>{query.trim() ? `${totalCount} result(s) across ${groups.length} module(s)` : 'Ctrl+K to toggle · Esc to close'}</span>
          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">keyboard</span>Enter opens the first result</span>
        </div>
      </div>
    </div>
  );
}
