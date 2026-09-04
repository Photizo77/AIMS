// src/data/knowledgeResources.ts
// ============================================================
// AIMS — Knowledge base resources (shared single source).
// Used by the Knowledge module page and the global Ctrl+K search.
// ============================================================

import type { KnowledgeResource } from '@/types';

export const KNOWLEDGE_RESOURCES: KnowledgeResource[] = [
  { id: 'k1', title: 'Grant Writing Best Practices Guide', type: 'document', category: 'Grants', uploadedBy: 'Sarah Aciro', uploadedAt: '2026-07-20', url: '#', description: 'Comprehensive guide for institutional funders' },
  { id: 'k2', title: 'Ardhi Impact Report 2025', type: 'document', category: 'Reports', uploadedBy: 'Grace Aceng', uploadedAt: '2026-06-15', url: '#', description: 'Annual impact metrics and beneficiary stories' },
  { id: 'k3', title: 'Climate-Smart Agriculture Training', type: 'video', category: 'Training', uploadedBy: 'Pius Odong', uploadedAt: '2026-07-10', url: '#', description: '45-min training session recording for field staff' },
  { id: 'k4', title: 'Donor Pitch Presentation', type: 'video', category: 'Grants', uploadedBy: 'Sarah Aciro', uploadedAt: '2026-08-01', url: '#', description: 'Standard 10-min pitch deck walkthrough' },
  { id: 'k5', title: 'Board Meeting Recording Q2', type: 'audio', category: 'Governance', uploadedBy: 'Nassir Mwanje', uploadedAt: '2026-06-30', url: '#', description: 'Full audio recording of Q2 board meeting' },
  { id: 'k6', title: 'Field Visit Photos - Karamoja', type: 'photo', category: 'Documentation', uploadedBy: 'Janet Apio', uploadedAt: '2026-07-25', url: '#', description: '24 photos from irrigation project site visit' },
  { id: 'k7', title: 'Organizational Theory of Change', type: 'document', category: 'Strategy', uploadedBy: 'Nassir Mwanje', uploadedAt: '2026-05-10', url: '#', description: 'Logic model and impact pathway documentation' },
  { id: 'k8', title: 'Staff Onboarding Orientation', type: 'video', category: 'HR', uploadedBy: 'Grace Aceng', uploadedAt: '2026-04-20', url: '#', description: 'New hire orientation video package' },
];
