// src/components/layout/GlobalSearch.tsx
// ============================================================
// AIMS — Global search (Ctrl/Cmd+K) across grants, projects, people,
// documents and feed messages. One box to find anything.
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { grantService } from '@/services/grantService';
import { innovationService } from '@/services/innovationService';
import { STAFF_ROSTER } from '@/data/roster';

interface SearchResult {
  id: string;
  kind: 'grant' | 'project' | 'person' | 'document';
  title: string;
  subtitle: string;
  link?: string;
}

export function GlobalSearch() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
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
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const out: SearchResult[] = [];

    grantService.getAllGrants().forEach((g) => {
      if (g.title.toLowerCase().includes(q) || g.funder.toLowerCase().includes(q) || g.id.toLowerCase().includes(q)) {
        out.push({ id: `g-${g.id}`, kind: 'grant', title: g.title, subtitle: `Grant · ${g.funder} · ${g.stage}`, link: `/grants/${g.id}` });
      }
    });
    innovationService.getAllProjects().forEach((p) => {
      if (p.title.toLowerCase().includes(q) || p.leadName.toLowerCase().includes(q)) {
        out.push({ id: `p-${p.id}`, kind: 'project', title: p.title, subtitle: `Innovation · ${p.stage} · ${p.leadName}`, link: `/innovations/${p.id}` });
      }
    });
    STAFF_ROSTER.forEach((s) => {
      if (s.name.toLowerCase().includes(q) || s.position.toLowerCase().includes(q) || s.department.toLowerCase().includes(q)) {
        out.push({ id: `s-${s.id}`, kind: 'person', title: s.name, subtitle: `${s.position} · ${s.department}`, link: '/hr' });
      }
    });
    // Recent documents (static catalogue for searchability)
    ['Leave Request Form', 'Requisition Form Template', 'Employee Handbook SOP', 'ARDHI Brand Assets'].forEach((t) => {
      if (t.toLowerCase().includes(q)) out.push({ id: `d-${t}`, kind: 'document', title: t, subtitle: 'Document · Shared Reference Library', link: '/documents' });
    });
    return out.slice(0, 12);
  }, [query]);

  const KIND_BADGE: Record<SearchResult['kind'], string> = {
    grant: 'bg-aims-green/15 text-aims-green',
    project: 'bg-aims-navy/10 text-aims-navy',
    person: 'bg-aims-orange/15 text-aims-orange',
    document: 'bg-slate-100 text-slate-600',
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm p-4 flex items-start justify-center pt-24" onClick={() => setOpen(false)}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
          <span className="material-symbols-outlined text-slate-400">search</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search grants, projects, people, documents…  (Ctrl+K)"
            className="flex-1 text-sm focus:outline-none"
          />
          <button onClick={() => setOpen(false)} className="text-[10px] font-bold text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">ESC</button>
        </div>
        <div className="max-h-96 overflow-y-auto p-2">
          {query.trim() && results.length === 0 && <p className="text-xs text-slate-400 italic p-4 text-center">No results for "{query}".</p>}
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => { setOpen(false); if (r.link) navigate(r.link); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 text-left"
            >
              <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0', KIND_BADGE[r.kind])}>{r.kind}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 truncate">{r.title}</p>
                <p className="text-[10px] text-slate-500 truncate">{r.subtitle}</p>
              </div>
              <span className="material-symbols-outlined text-slate-300 text-[16px]">open_in_new</span>
            </button>
          ))}
          {!query.trim() && <p className="text-xs text-slate-400 italic p-4 text-center">Type to search across the whole organisation.</p>}
        </div>
      </div>
    </div>
  );
}
