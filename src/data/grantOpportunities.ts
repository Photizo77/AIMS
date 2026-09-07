// src/data/grantOpportunities.ts
// ============================================================
// AIMS — Live grant opportunity watchlist (imported into aims_grants).
// Source: ARDHI tracker — EU Horizon Europe calls (30) + ARDHI open
// web opportunities (8). Import via Grants page → "Import Grant Watchlist".
// ============================================================

export interface GrantOpportunityRow {
  /** EU Action ID (Horizon) or undefined (ARDHI web opportunities) */
  code?: string;
  title?: string;
  link?: string;
  /** Intervention / theme column as recorded in the tracker */
  theme?: string;
  /** Tracker status verbatim: Forth Coming / Open for Submission / Closed / Page Not Found */
  status?: string;
  /** Planned opening (free text, e.g. 10-Feb-26) */
  opening?: string;
  /** Closing date (free text; may be blank or two-stage) */
  closing?: string;
  source: 'Horizon Europe' | 'ARDHI watchlist';
}

const M = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' } as Record<string, string>;

/** Normalise tracker dates ("10-Feb-26", "8 April 2027/14 Sept 2027", ISO) → yyyy-mm-dd or '' */
export function toIsoDate(value?: string): string {
  const raw = (value ?? '').trim();
  if (!raw) return '';
  // two-stage: use the first listed closing date
  const first = raw.split('/')[0].trim();
  const m = first.match(/^(\d{1,2})[\s-]([A-Za-z]+)[\s-](\d{2,4})$/);
  if (m) {
    const month = M[m[2].toLowerCase().slice(0, 3)];
    if (!month) return '';
    let year = m[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${String(Number(m[1])).padStart(2, '0')}`;
  }
  const iso = new Date(first);
  return Number.isNaN(iso.getTime()) ? '' : iso.toISOString().slice(0, 10);
}

const STOP = new Set(['grant', 'grants', 'fund', 'foundation', '2026', '2027', 'the', 'for', 'and', 'to', 'from', 'of', 'on', 'a', 'an', 'in', 'into', 'uk', 'eu']);

/** Best-effort title from a link (ARDHI watchlist rows have no titles) */
export function titleFromLink(link: string, theme?: string): string {
  try {
    const url = new URL(link);
    const segments = url.pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1] ?? '';
    const words = last.replace(/\.(html?|php)$/, '').split(/[-_]+/).filter(Boolean).filter((w) => !STOP.has(w.toLowerCase()));
    if (words.length === 0) {
      const hostWords = url.hostname.split('.')[0].split(/[-_]+/).filter(Boolean);
      words.push(...hostWords.slice(0, 3));
    }
    const base = words.slice(0, 5).map((w) => (w.length <= 3 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1))).join(' ');
    return theme ? `${theme} — ${base}`.trim() : base;
  } catch {
    return (theme ? `${theme} — Opportunity` : 'Grant Opportunity').trim();
  }
}

export const GRANT_OPPORTUNITIES: GrantOpportunityRow[] = [
  // ── EU Horizon Europe calls (ARDHI tracker sheet 1) ──
  { source: 'Horizon Europe', code: 'HORIZON-HLTH-2026-01-ENVHLTH-01', title: 'Towards a better understanding and anticipation of the combined effects of climate change on health', theme: 'Health', status: 'Closed', opening: '10-Feb-26', closing: '16-Apr-26' },
  { source: 'Horizon Europe', code: 'HORIZON-HLTH-2026-01-DISEASE-04', title: 'Development of novel vaccines for viral pathogens with epidemic potential', theme: 'Health', status: 'Closed', opening: '10-Feb-26', closing: '16-Apr-26' },
  { source: 'Horizon Europe', code: 'HORIZON-HLTH-2027-01-DISEASE-05', title: 'Development of novel small molecule antiviral therapeutics for pathogens with epidemic potential', theme: 'Health', status: 'Forth Coming', opening: '10-Feb-27', closing: '13-Apr-27' },
  { source: 'Horizon Europe', code: 'HORIZON-HLTH-2027-01-DISEASE-06', title: 'Development of monoclonal antibodies to prevent and treat infections from Flaviviruses', theme: 'Health', status: 'Forth Coming', opening: '10-Feb-27', closing: '13-Apr-27' },
  { source: 'Horizon Europe', code: 'HORIZON-HLTH-2027-01-DISEASE-07', title: 'Development of monoclonal antibodies to prevent and treat infections from Filo-, Nairo-, Phenui-, Picorna- and Toga viruses', theme: 'Health', status: 'Forth Coming', opening: '10-Feb-27', closing: '13-Apr-27' },
  { source: 'Horizon Europe', code: 'HORIZON-HLTH-2027-01-DISEASE-08', title: 'Development of innovative antimicrobials against pathogens resistant to antimicrobials', theme: 'Health', status: 'Forth Coming', opening: '10-Feb-27', closing: '13-Apr-27' },
  { source: 'Horizon Europe', code: 'HORIZON-CL2-2026-01-HERITAGE-05', title: 'Creative alliances: Fostering global partnerships in cultural policies and CCI innovation', theme: 'HERITAGE', status: 'Page Not Found', opening: '', closing: '' },
  { source: 'Horizon Europe', code: 'HORIZON-CL2-2027-01-DEMOCRACY-08', title: 'Global Human Rights and EU values', theme: 'DEMOCRACY', status: 'Forth Coming', opening: '13-May-27', closing: '23-Sep-27' },
  { source: 'Horizon Europe', code: 'HORIZON-CL2-2027-01-DEMOCRACY-05', title: 'Development aid and democratic governance', theme: 'DEMOCRACY', status: 'Forth Coming', opening: '13-May-27', closing: '23-Sep-27' },
  { source: 'Horizon Europe', code: 'HORIZON-CL2-2026-01-DEMOCRACY-02', title: 'Understanding the forms of local democracy in low-income and low-middle income countries', theme: 'DEMOCRACY', status: 'Open for Submission', opening: '12-May-26', closing: '23-Sep-26' },
  { source: 'Horizon Europe', code: 'HORIZON-CL2-2026-01-DEMOCRACY-07', title: 'Supporting post-conflict democracy and reconstruction', theme: 'DEMOCRACY', status: 'Open for Submission', opening: '12-May-26', closing: '23-Sep-26' },
  { source: 'Horizon Europe', code: 'HORIZON-CL2-2027-01-HERITAGE-06', title: 'Future-proofing sustainable cultural tourism', theme: 'HERITAGE', status: 'Forth Coming', opening: '13-May-27', closing: '23-Sep-27' },
  { source: 'Horizon Europe', code: 'HORIZON-CL4-2026-04-DIGITAL-EMERGING-09', title: 'Advanced Local Digital Twins using AI for Early Warning and Preparedness (IA)', theme: 'DIGITAL', status: 'Closed', opening: '15-Jan-26', closing: '15-Apr-26' },
  { source: 'Horizon Europe', code: 'HORIZON-CL4-2026-01-MAT-PROD-11', title: 'Innovative technologies and tools for exploration and data modelling of raw materials (RIA)', theme: 'MAT', status: 'Closed', opening: '6-Jan-26', closing: '21-Apr-26' },
  { source: 'Horizon Europe', code: 'HORIZON-CL4-2026-01-MAT-PROD-12', title: 'Technologies for innovative extraction of critical raw materials', theme: 'MAT', status: 'Closed', opening: '6-Jan-26', closing: '21-Apr-26' },
  { source: 'Horizon Europe', code: 'HORIZON-CL4-2026-01-MAT-PROD-13', title: 'Monitoring of secondary raw materials', theme: 'MAT', status: 'Closed', opening: '6-Jan-26', closing: '21-Apr-26' },
  { source: 'Horizon Europe', code: 'HORIZON-CL4-2026-01-MAT-PROD-14', title: 'Improving availability of secondary raw materials through recycling (IA)', theme: 'MAT', status: 'Closed', opening: '6-Jan-26', closing: '21-Apr-26' },
  { source: 'Horizon Europe', code: 'HORIZON-CL4-2027-01-MAT-PROD-16', title: 'Technologies for innovative processing of raw materials', theme: 'MAT', status: 'Forth Coming', opening: '22-Sep-26', closing: '2-Feb-27' },
  { source: 'Horizon Europe', code: 'HORIZON-CL4-2027-01-MAT-PROD-17', title: 'Expert network on critical raw materials', theme: 'MAT', status: 'Forth Coming', opening: '22-Sep-26', closing: '2-Feb-27' },
  { source: 'Horizon Europe', code: 'HORIZON-CL4-2027-04-DIGITAL-EMERGING-06', title: 'International cooperation in AI', theme: 'DIGITAL', status: 'Forth Coming', opening: '17-Nov-26', closing: '1-Mar-27' },
  { source: 'Horizon Europe', code: 'HORIZON-CL4-2027-01-MAT-PROD-22', title: 'Innovative advanced materials and new production processes – reducing dependencies on Critical and Strategic Raw Materials (IA) (Innovative Advanced Materials for the EU and Processes4Planet partnerships)', theme: 'MAT', status: 'Forth Coming', opening: '22-Sep-26', closing: '2-Feb-27' },
  { source: 'Horizon Europe', code: 'HORIZON-CL5-2026-07-D1-05', title: 'Improving climate and weather models for Africa', theme: 'Climate', status: 'Closed', opening: '18-Dec-25', closing: '21-Apr-26' },
  { source: 'Horizon Europe', code: 'HORIZON-CL5-2027-01-D1-11', title: 'Africa–EU co-fund action on climate', theme: 'Climate', status: 'Forth Coming', opening: '17-Nov-26', closing: '4-Mar-27' },
  { source: 'Horizon Europe', code: 'HORIZON-CL5-2027-02-D3-10', title: 'Renewable Energy Valleys in Africa to increase energy security and energy access in Africa', theme: 'Climate', status: 'Forth Coming', opening: '3-Dec-26', closing: '31-Mar-27' },
  { source: 'Horizon Europe', code: 'HORIZON-CL6-2026-02-FARM2FORK-13', title: 'Boosting plant health and reducing losses on farm and during storage for sustainable growth in Africa (FNSSA)', theme: 'FARM', status: 'Closed', opening: '14-Jan-26', closing: '14-Apr-26' },
  { source: 'Horizon Europe', code: 'HORIZON-CL6-2026-02-FARM2FORK-14', title: 'Green Transition Food Processing Africa', theme: 'FARM', status: 'Closed', opening: '14-Jan-26', closing: '14-Apr-26' },
  { source: 'Horizon Europe', code: 'HORIZON-CL6-2027-02-FARM2FORK-09', title: 'African Union – European Union Partnership on Food and Nutrition Security and Sustainable Agriculture (FNSSA)', theme: 'FARM', status: 'Forth Coming', opening: '20-Apr-26', closing: '23-Sep-27' },
  { source: 'Horizon Europe', code: 'HORIZON-CL6-2027-02-FARM2FORK-02 (two-stage', title: 'Optimising the water-nutrient-energy nexus for sustainable and climate smart agriculture in Africa (FNSSA)', theme: 'FARM', status: 'Forth Coming', opening: '4-Feb-27', closing: '8 April 2027/14 Sept 2027' },
  { source: 'Horizon Europe', code: 'HORIZON-CL6-2026-03-GOVERNANCE-04', title: 'Supporting All-Atlantic Ocean Research and Innovation Alliance', theme: 'Governance', status: 'Closed', opening: '14-Jan-26', closing: '15-Apr-26' },
  { source: 'Horizon Europe', code: 'HORIZON-INFRA-2026-DEV-01-06', title: 'Strengthening the international dimension of ESFRI and/or ERIC research infrastructures', theme: 'Development', status: 'Closed', opening: '10-Mar-26', closing: '16-Jun-26' },
  // ── ARDHI web opportunities (sheet 2) ──
  { source: 'ARDHI watchlist', link: 'https://opportunitiesforyouth.org/2026/08/21/stem-pathways-fund-2026-up-to-150000-in-grants-to-help-young-people-transition-from-further-education-into-stem-careers/', theme: 'Education', status: 'Open for Submission', opening: '', closing: '' },
  { source: 'ARDHI watchlist', link: 'https://csochallenge.org/#apply', theme: 'CSO', status: 'Open for Submission', opening: '', closing: '15-Sep-26' },
  { source: 'ARDHI watchlist', link: 'https://africanofilter.org/what-we-do/community/voices-for-climate-justice/', theme: 'Climate', status: 'Open for Submission', opening: '', closing: '25-Sep-26' },
  { source: 'ARDHI watchlist', link: 'https://aueuyouth.com/grants/', theme: 'Youth', status: 'Open for Submission', opening: '', closing: '' },
  { source: 'ARDHI watchlist', link: 'https://cybersafefoundation.org/our-programs/cybersafe-sans-ai-security-fellowship/', theme: 'Cyber Security', status: 'Open for Submission', opening: '', closing: '10-Sep-26' },
  { source: 'ARDHI watchlist', link: 'https://about.nike.com/en/mission/initiatives/nike-community-impact-fund', theme: 'Sports', status: 'Open for Submission', opening: '', closing: '' },
  { source: 'ARDHI watchlist', link: 'https://opportunitiesforyouth.org/2026/08/30/cerv-2026-daphne-eu-grants-to-prevent-and-combat-gender-based-violence-and-violence-against-children/', theme: 'Gender & Children', status: 'Open for Submission', opening: '', closing: '' },
  { source: 'ARDHI watchlist', link: 'https://globalebafund.org/', theme: 'Ecosystem', status: 'Open for Submission', opening: '', closing: '' },
];
