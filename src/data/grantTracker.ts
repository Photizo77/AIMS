// src/data/grantTracker.ts
// ============================================================
// GRANTS TRACKER KNOWLEDGE — distilled from
// "Grants_Tracker_Aug2026 (1).xlsx" (compiled 17 August 2026)
// Plus application history from the AIMS grants module.
// Each opportunity now carries pillar alignment, eligibility
// criteria and references to similar applications we have made.
// ============================================================

// ── LIVE / RECENTLY IDENTIFIED OPPORTUNITIES (from the tracker) ──
export interface TrackerGrant {
  id: string;
  title: string;
  funder: string;
  funderType: string;
  programme: string;
  deadline: string;
  award: string;
  /** How the call aligns with ARDHI's pillars (Advocacy/Research/Innovation) and thematic areas */
  alignment: string;
  /** Clear, structured eligibility criteria as published */
  eligibility: string;
  eligibilityStatus: string;
  leadEntity: string;
  priority: 'High' | 'Medium' | 'Low';
  fitScore: number;
  /** Ids of similar grants in APPLIED_HISTORY (applications we have made before) */
  similarIds?: string[];
  nextAction: string;
  sourceLink: string;
  notes: string;
}

export const LIVE_OPPORTUNITIES: TrackerGrant[] = [
  {
    id: 'G-001',
    title: 'IEEE Africa Innovation Summit (AIS) 2026 Call for Innovations',
    funder: 'IEEE Uganda Section (with IEEE TEMS and IEEE Humanitarian Technologies)',
    funderType: 'Professional body',
    programme: 'AIS 2026 Call for Innovations',
    deadline: '2026-08-28',
    award: 'Showcase slot, exhibition and network access (not a cash grant)',
    alignment:
      'Aligns with the Innovation pillar — the call showcases practical, scalable solutions, which is exactly the ARDHI model (prototypes piloted in real communities). Thematic fit: ArdhiAgriculture (AgriTech), ArdhiWaste and clean energy (climate and sustainability track), and ArdhiHealth (HealthTech). Our digital tools (HORIZONS, AIStick, TONE) map directly to the six thematic areas.',
    eligibility:
      'Open to students, researchers, startup founders, innovators and technology enthusiasts with a working idea, prototype, technology or scalable solution mapped to one of the six thematic areas (humanitarian technology, AgriTech/food systems, HealthTech, smart cities/mobility, clean energy, climate action). No legal or sector barrier. Registration through the summit portal; innovation description, thematic area, stage of development, team profile and supporting material required.',
    eligibilityStatus: 'Eligible now',
    leadEntity: 'Kathay Technologies',
    priority: 'High',
    fitScore: 5,
    similarIds: [],
    nextAction: 'Submit online; HORIZONS, AIStick and TONE map cleanly to the six themes',
    sourceLink: 'https://innovsummit.org/innovation-registration/',
    notes: 'Cheapest and fastest win on the list: no audited accounts and no consortium needed. Summit held 1-2 October 2026 at the National ICT Innovation Hub, Kampala.',
  },
  {
    id: 'G-002',
    title: 'Supporting STISA 2034: SGCI Multilateral Research Call',
    funder: 'IDRC (Canada) for the Science Granting Councils Initiative; Uganda funds via UNCST',
    funderType: 'Multilateral research',
    programme: 'SGCI multilateral research call (EOI then full proposal)',
    deadline: '2026-09-25',
    award: 'CAD 50,000-300,000 per consortium member; Uganda ceiling UGX 500,000,000',
    alignment:
      'Strong alignment with the Research pillar — the call funds collaborative research that produces new knowledge and pathways into policy and practice, mirroring ARDHI\'s "Think and Act Tank" model. Streams map to our thematics: Health (ArdhiHealth), Agriculture (ArdhiAgriculture), AI and Digital Technologies (Innovation pillar), Energy and Environment (ArdhiWaste, ArdhiDisasters). It also builds the research track record the 5-Year Strategic Plan calls for.',
    eligibility:
      'Open to public research organisations, public and private universities, and government research organisations (some SGCI countries also allow startups, SMEs, private research bodies and registered NGOs). One lead institution plus at least two and at most four co-applicants, drawn from at least three different participating countries, with no two institutions from the same country. Each institution nominates a principal investigator in full-time employment; one EOI per PI as lead; one primary stream must be selected. Signed institutional letters of commitment from every lead and co-applicant; two-page PI CV from every country and one-page CVs for up to three key team members. Co-funding not required; country ceilings and eligible cost rules apply; indirect costs capped at 13%.',
    eligibilityStatus: 'Eligible with partners',
    leadEntity: 'Kampala International University (KIU)',
    priority: 'Medium',
    fitScore: 4,
    similarIds: ['g1'],
    nextAction: 'Assemble consortium: one lead + 2-4 co-applicants from 3+ SGCI countries; signed letters of commitment',
    sourceLink: 'https://idrc-crdi.ca/en/supporting-stisa-2034-sgci-multilateral-research-call-advancing-africas-science-technology-and',
    notes: 'EOI deadline 25 September 2026 (23:59 EDT); full proposal due 4 December 2026. Uganda eligible for all five streams.',
  },
  {
    id: 'G-003',
    title: 'UCC / UCUSAF Grant for the ICT Circular Economy and E-Waste Ecosystems Project',
    funder: 'Uganda Communications Commission through UCUSAF',
    funderType: 'Government regulator',
    programme: 'UCUSAF grant, FY 2026/2027',
    deadline: '2026-08-21',
    award: 'Not published in the terms of reference',
    alignment:
      'Direct alignment with ArdhiWaste (safe, circular approaches to waste, treated as a health and urban governance issue) and with the Innovation pillar — the call funds digital traceability systems, a public platform or chatbot and a verified service directory, which are exactly the kind of practical digital tools ARDHI builds. Advocacy pillar supports the policy-accountability element. Gap: an e-waste/occupational-safety track record is required.',
    eligibility:
      'Any legally established entity in Uganda, single applicant or consortium (this is the only UCC call that allows a company to lead). Satisfactory financial health with adequate governance, financial, procurement, monitoring and reporting systems. Verifiable experience in e-waste or related environmental, circular economy, ICT repair, youth skilling, digital systems or community engagement work. Experience building or running digital databases, dashboards, mobile apps, traceability systems, chatbots or public information platforms. At least two reference letters or completion certificates. Submission via the UCC eServices portal (https://eservices.ucc.co.ug/web); closes 21 August 2026 at 23:59.',
    eligibilityStatus: 'Eligible, verify',
    leadEntity: 'Kathay Technologies with an e-waste partner',
    priority: 'High',
    fitScore: 4,
    similarIds: ['g3'],
    nextAction: 'Confirm an e-waste co-applicant and two reference letters',
    sourceLink: 'https://eservices.ucc.co.ug/web',
    notes: 'Only UCC call that does not demand a not-for-profit lead, so a company can lead. Closes 23:59 (later than sister calls).',
  },
  {
    id: 'G-004',
    title: 'UCC / UCUSAF Grant for Skilling Youth Groups in ICT and Multimedia 2026/2027',
    funder: 'Uganda Communications Commission through UCUSAF',
    funderType: 'Government regulator',
    programme: 'UCUSAF grant, FY 2026/2027',
    deadline: '2026-08-21',
    award: 'Not published. Performance-based, milestone-linked disbursement',
    alignment:
      'Aligns with the Innovation and Advocacy pillars through community digital-skilling delivery — consistent with ARDHI\'s approach of training local people and building lasting local capacity. Thematic links: digital literacy supports ArdhiAgriculture (farmer learning), ArdhiHealth (digital financial services) and ArdhiLandGovernance (e-government access). Strong content fit with Cradle AI as technical co-applicant.',
    eligibility:
      'Lead must be a registered not-for-profit legally operating in Uganda; sound financial management systems; willingness and ability to work in rural and hard-to-reach areas; at least two years documented experience in ICT and digital-skills programmes; documented experience delivering at national scale in underserved communities; a clear sustainability strategy; only one proposal per applicant. Consortium allowed, with the lead being the registered not-for-profit.',
    eligibilityStatus: 'Eligible with partners',
    leadEntity: 'Not-for-profit partner, Cradle AI as technical co-applicant',
    priority: 'High',
    fitScore: 3,
    similarIds: ['g3'],
    nextAction: 'Decide go/no-go: needs a registered not-for-profit lead with two years ICT skilling evidence',
    sourceLink: 'https://eservices.ucc.co.ug/web',
    notes: 'The not-for-profit lead rule and the short runway were binding constraints in the August round.',
  },
  {
    id: 'G-005',
    title: 'UCC / UCUSAF Grant for Digital Literacy and Skilling of Rural Unserved and Underserved Communities',
    funder: 'Uganda Communications Commission through UCUSAF',
    funderType: 'Government regulator',
    programme: 'UCUSAF grant, FY 2026/2027',
    deadline: '2026-08-21',
    award: 'Not published',
    alignment:
      'Aligns with the Innovation and Advocacy pillars: foundational digital-skills delivery in rural unserved communities, in the languages participants speak — a direct match for ARDHI\'s local-language delivery approach and its work with rural communities. Supports ArdhiAgriculture, ArdhiHealth and ArdhiLandGovernance thematics.',
    eligibility:
      'Not-for-profit lead, legally registered in Uganda; satisfactory financial health and systems; ability to work in unserved and underserved communities; legally binding working relationship between lead and co-applicant for consortia; at least two years documented experience in digital-literacy training; documented national-scale rural delivery experience; a plan to mobilise additional resources for sustainability. Six-month project, 30 districts in two lots of 15.',
    eligibilityStatus: 'Eligible with partners',
    leadEntity: 'Not-for-profit partner, Cradle AI as technical co-applicant',
    priority: 'Medium',
    fitScore: 3,
    similarIds: ['g3'],
    nextAction: 'Identify a not-for-profit lead with rural digital literacy evidence',
    sourceLink: 'https://eservices.ucc.co.ug/web',
    notes: 'At least 100 trained beneficiaries per district across 30 districts. Local-language translation is a genuine differentiator for Cradle AI.',
  },
  {
    id: 'G-006',
    title: 'UCC / UCUSAF Grant for Digital Literacy and Skills Development of the Elderly',
    funder: 'Uganda Communications Commission through UCUSAF',
    funderType: 'Government regulator',
    programme: 'UCUSAF grant, FY 2026/2027',
    deadline: '2026-08-21',
    award: 'Not published',
    alignment:
      'Aligns with the Innovation and Advocacy pillars through community-based digital-literacy training, including training community-based trainers — consistent with ARDHI\'s certified-paralegal and trainer-of-trainers model. Supports ArdhiHealth (mobile money, e-government and telehealth access for older persons).',
    eligibility:
      'Not-for-profit lead, legally registered in Uganda; satisfactory financial health and systems; ability to work in unserved and underserved communities; legally binding working relationship for consortia; at least two years documented experience in digital-literacy training; documented national-scale experience working with the elderly in rural areas (the hardest criterion for a technology-led team); a plan to mobilise additional resources for sustainability. Ten districts, 100 participants each.',
    eligibilityStatus: 'Eligible with partners',
    leadEntity: 'Not-for-profit partner with elderly programming experience',
    priority: 'Low',
    fitScore: 2,
    similarIds: ['g3'],
    nextAction: 'Confirm whether any partner holds elderly programming evidence, otherwise drop',
    sourceLink: 'https://eservices.ucc.co.ug/web',
    notes: 'Weakest fit of the UCC set given the elderly-experience requirement. District list inconsistent in source (Napak vs Apac).',
  },
  {
    id: 'G-007',
    title: 'Phase III of the National e-Booster Programme',
    funder: 'Uganda Communications Commission through UCUSAF',
    funderType: 'Government regulator',
    programme: 'National e-Booster Programme, Phase III, FY 2026/27',
    deadline: '2026-08-24',
    award: 'Not published',
    alignment:
      'Best strategic fit of the UCC set: the three programme components map directly onto ARDHI\'s model — innovation acceleration/incubation (Innovation pillar, matching our pilots), a nationally representative ICT ecosystem assessment and National Innovation Index (Research pillar), and a case-studies publication (knowledge management, Advocacy pillar). The call explicitly allows combined consortium experience.',
    eligibility:
      'Legally registered entity in Uganda; where a consortium applies, the lead applicant must be a not-for-profit organisation. Satisfactory financial health and systems. At least two years experience in innovation management, business incubation or acceleration, entrepreneurship development, digital innovation, technology commercialisation or ICT ecosystem development. Proven experience across all three components: ICT innovation support, large-scale or national research and ecosystem assessment, and knowledge management/publication. Consortium allowed and effectively encouraged.',
    eligibilityStatus: 'Eligible with partners',
    leadEntity: 'Not-for-profit lead, with KIU and Kathay as co-applicants',
    priority: 'High',
    fitScore: 5,
    similarIds: ['g2', 'g8'],
    nextAction: 'Clarify with UCC whether a single non-consortium applicant must also be not-for-profit',
    sourceLink: 'https://www.ucc.co.ug/wp-content/uploads/2026/08/CALL-FOR-PROJECT-PROPOSALS-FOR-IMPLEMENTATION-OF-PHASE-III-OF-THE-NATIONAL-E-BOOSTER-PROGRAMME.pdf',
    notes: 'The eligibility text is ambiguous on whether a single non-consortium applicant must also be not-for-profit — raise at the pre-grant meeting.',
  },
  {
    id: 'G-008',
    title: 'UCC / UCUSAF Grant for Community Basic Digital Skilling for Women',
    funder: 'Uganda Communications Commission through UCUSAF',
    funderType: 'Government regulator',
    programme: 'UCUSAF grant, FY 2026/2027 (sixth phase of the women skilling series)',
    deadline: '2026-08-21',
    award: 'Not published',
    alignment:
      'Aligns with the Innovation and Advocacy pillars and, importantly, with ARDHI\'s gender and social inclusion commitments (Annex 12): mobilisation through women\'s groups, savings groups and cooperatives matches the priority beneficiaries we serve. Supports ArdhiAgriculture (digital livelihoods), ArdhiHealth and ArdhiLandGovernance thematics.',
    eligibility:
      'Not-for-profit lead, legally registered in Uganda; satisfactory financial health and systems; ability to work in unserved and underserved communities; legally binding working relationship for consortia; at least two years documented experience in digital-literacy training; documented national-scale rural delivery experience; a plan to mobilise additional resources for sustainability. Ideally a lead already working with women\'s groups, savings groups and cooperatives.',
    eligibilityStatus: 'Eligible with partners',
    leadEntity: 'Not-for-profit partner working with women\'s groups',
    priority: 'Medium',
    fitScore: 3,
    similarIds: ['g5'],
    nextAction: 'Confirm a women-focused not-for-profit lead',
    sourceLink: 'https://eservices.ucc.co.ug/web',
    notes: 'Leans on the GSMA Mobile Internet Skills Training Toolkit and trainer-of-trainers approach. Portal congestion on 21 August is a real risk.',
  },
  {
    id: 'G-009',
    title: 'UCC / UCUSAF Digital Skilling for MSMEs in Kyotera (Mutukula), Moyo, Masindi and Ntungamo',
    funder: 'Uganda Communications Commission through UCUSAF',
    funderType: 'Government regulator',
    programme: 'UCUSAF grant, FY 2026/2027',
    deadline: '2026-08-21',
    award: 'Not published. Milestone-based grant support',
    alignment:
      'Aligns with the Innovation and Advocacy pillars: practical digital-skills training for MSMEs (digital marketing, e-commerce, digital financial services, EFRIS and formalisation) fits ARDHI\'s enterprise-support and value-chain work under ArdhiAgriculture and ArdhiWaste, and its systems-innovation approach.',
    eligibility:
      'Not-for-profit lead, legally registered in Uganda; satisfactory financial health and systems; at least two years documented experience designing and delivering digital skilling, ICT capacity building and enterprise development for MSMEs; proven practical market-oriented training in digital business tools, e-commerce, digital marketing and digital financial services; documented national-scale rural delivery; a documented two-year prior working relationship between lead and co-applicant (a hard gate); the submission is a Business Plan Proposal rather than a standard technical proposal.',
    eligibilityStatus: 'Eligible with partners',
    leadEntity: 'Not-for-profit partner with a two-year working history',
    priority: 'Low',
    fitScore: 2,
    similarIds: ['g3'],
    nextAction: 'Check whether any existing partner meets the two-year relationship test, otherwise drop',
    sourceLink: 'https://eservices.ucc.co.ug/web',
    notes: 'The two-year prior relationship rule is the deciding constraint — only an existing partner makes this viable.',
  },
  {
    id: 'G-010',
    title: 'Constellations Fellowship, Fall 2026 cohort',
    funder: 'Climate Curve (formerly the Global Warming Mitigation Project)',
    funderType: 'Nonprofit fellowship',
    programme: 'Constellations Fellowship, Fall 2026',
    deadline: '2026-08-23',
    award: 'US$1,000 stipend on completion',
    alignment:
      'Not an institutional grant, so it does not align with ARDHI\'s pillars as a funded programme. Its value is capacity-building: 55 virtual placements across climate, sustainability and circular economy roles for students and recent graduates. Recommended to circulate to KIU students and recent graduates as a talent-development opportunity.',
    eligibility:
      'Individual students and recent graduates, any discipline, worldwide (subject to international sanctions compliance). Each position carries its own desired qualifications and applicants must meet both the general and position-specific requirements. One-page CV in PDF plus a position-specific cover letter in PDF; AI-generated or substantially AI-edited cover letters are prohibited. A separate complete application is needed for every position.',
    eligibilityStatus: 'Refer to students',
    leadEntity: 'Not applicable, individual applicants',
    priority: 'Low',
    fitScore: 1,
    similarIds: [],
    nextAction: 'Circulate to KIU students and recent graduates',
    sourceLink: 'https://www.climatecurve.org/constellations-positions',
    notes: 'Deadline 23 August 2026 (23:59 EST). Several host organisations are African or Global South based (Solar Sister, Wastezon, Takachar, Auto Truck E.A).',
  },
  {
    id: 'G-011',
    title: 'Jonathan Larson Grant Program 2026',
    funder: 'American Theatre Wing (with the Jonathan Larson Performing Arts Foundation and the Saw Island Foundation)',
    funderType: 'Arts foundation',
    programme: 'Jonathan Larson Grants, 2026 cycle',
    deadline: '2026-09-04',
    award: 'US$20,000 unrestricted plus US$2,500 recording grant (2025 cycle amounts)',
    alignment:
      'No alignment with ARDHI\'s pillars — this is a musical-theatre artist award with no research, technology, skilling or institutional component, oriented to US-based artists. Retained on the tracker for the audit trail on why it was not pursued.',
    eligibility:
      'Individual emerging musical-theatre composers, lyricists or librettists, or collaborative writing teams of up to three; applicants may appear on only one application per cycle; teams larger than three must contact the American Theatre Wing first. Work samples expected. US-focused.',
    eligibilityStatus: 'Not a fit',
    leadEntity: 'Not applicable',
    priority: 'Low',
    fitScore: 1,
    similarIds: [],
    nextAction: 'Log and close as not applicable',
    sourceLink: 'https://americantheatrewing.org/program/jonathan-larson-grants/',
    notes: 'Kept for completeness and the audit trail. Award figures are 2025 cycle amounts and may change.',
  },
];

// ── PLANNED BUT NOT APPLIED (deadline / readiness issues) ──
// Distilled from the tracker's own notes: these calls were logged on
// 17 August 2026 with 4-7 day submission windows, application stage
// "Not started", no owner allocated, an unassembled document pack, and
// binding eligibility gates (not-for-profit lead, experience requirements).
export interface MissedGrant {
  id: string;
  title: string;
  funder: string;
  deadline: string;
  reason: string;
  category: 'deadline' | 'eligibility' | 'fit';
}

export const MISSED_GRANTS: MissedGrant[] = [
  {
    id: 'G-003',
    title: 'UCC / UCUSAF Grant for the ICT Circular Economy and E-Waste Ecosystems Project',
    funder: 'Uganda Communications Commission (UCUSAF)',
    deadline: '2026-08-21',
    reason: 'Logged 17 Aug with a 4-day window; required e-waste/occupational-safety track record and two reference letters were not assembled in time.',
    category: 'deadline',
  },
  {
    id: 'G-004',
    title: 'UCC / UCUSAF Grant for Skilling Youth Groups in ICT and Multimedia 2026/2027',
    funder: 'Uganda Communications Commission (UCUSAF)',
    deadline: '2026-08-21',
    reason: '4-day runway plus a binding not-for-profit lead requirement with two years of ICT skilling evidence; tracker note: "Decide go or no go ... and four days left".',
    category: 'eligibility',
  },
  {
    id: 'G-005',
    title: 'UCC / UCUSAF Grant for Digital Literacy and Skilling of Rural Unserved and Underserved Communities',
    funder: 'Uganda Communications Commission (UCUSAF)',
    deadline: '2026-08-21',
    reason: '4-day runway; a not-for-profit lead with rural digital literacy evidence could not be confirmed before the deadline.',
    category: 'deadline',
  },
  {
    id: 'G-006',
    title: 'UCC / UCUSAF Grant for Digital Literacy and Skills Development of the Elderly',
    funder: 'Uganda Communications Commission (UCUSAF)',
    deadline: '2026-08-21',
    reason: 'Hardest criterion of the UCC set — documented elderly-programming experience; tracker note: "Confirm whether any partner holds elderly programming evidence, otherwise drop". Dropped.',
    category: 'eligibility',
  },
  {
    id: 'G-007',
    title: 'Phase III of the National e-Booster Programme',
    funder: 'Uganda Communications Commission (UCUSAF)',
    deadline: '2026-08-24',
    reason: 'Best strategic fit but the not-for-profit consortium-lead question was unresolved at the pre-grant meeting and the document pack was not ready in 7 days.',
    category: 'deadline',
  },
  {
    id: 'G-008',
    title: 'UCC / UCUSAF Grant for Community Basic Digital Skilling for Women',
    funder: 'Uganda Communications Commission (UCUSAF)',
    deadline: '2026-08-21',
    reason: '4-day runway; required a women-focused not-for-profit lead that was not confirmed in time.',
    category: 'deadline',
  },
  {
    id: 'G-009',
    title: 'UCC / UCUSAF Digital Skilling for MSMEs in Kyotera, Moyo, Masindi and Ntungamo',
    funder: 'Uganda Communications Commission (UCUSAF)',
    deadline: '2026-08-21',
    reason: 'Two hard gates: not-for-profit lead plus a documented two-year prior working relationship; tracker note: "only an existing partner makes this viable". Dropped.',
    category: 'eligibility',
  },
  {
    id: 'G-010',
    title: 'Constellations Fellowship, Fall 2026 cohort',
    funder: 'Climate Curve',
    deadline: '2026-08-23',
    reason: 'Not an institutional grant (individual fellowship); passed to students/recent graduates rather than applied for by ARDHI.',
    category: 'fit',
  },
  {
    id: 'G-011',
    title: 'Jonathan Larson Grant Program 2026',
    funder: 'American Theatre Wing',
    deadline: '2026-09-04',
    reason: 'Sector mismatch — musical-theatre artist award, US-based, no institutional component. Closed as not applicable.',
    category: 'fit',
  },
];

// ── APPLICATION HISTORY (from the AIMS grants module) ──
export interface AppliedGrant {
  id: string;
  title: string;
  funder: string;
  stage: string;
  amountRequested: string;
  amountAwarded?: string;
  handler: string;
  note: string;
}

export const APPLIED_HISTORY: AppliedGrant[] = [
  { id: 'g5', title: 'Women-Led Agri-Business Accelerator', funder: 'UN Women', stage: 'Awarded', amountRequested: 'UGX 380M', amountAwarded: 'UGX 350M', handler: 'Janet Apio', note: 'Awarded — agreement signed and handed to Finance for onboarding.' },
  { id: 'g1', title: 'Community Land Rights Documentation', funder: 'USAID', stage: 'Under Review', amountRequested: 'UGX 450M', handler: 'Sarah Aciro', note: 'Submitted to funder; currently addressing funder feedback.' },
  { id: 'g3', title: 'Youth Digital Literacy Program', funder: 'Mastercard Foundation', stage: 'Submitted', amountRequested: 'UGX 310M', handler: 'Janet Apio', note: 'Submitted; awaiting funder decision by 1 October 2026.' },
  { id: 'g2', title: 'Climate-Smart Farming Initiative', funder: 'EU Delegation', stage: 'Drafting', amountRequested: 'UGX 820M', handler: 'Sarah Aciro', note: 'Full proposal draft in progress; budget validation with Finance next.' },
  { id: 'g7', title: 'Indigenous Knowledge Preservation', funder: 'Ford Foundation', stage: 'Drafting', amountRequested: 'UGX 270M', handler: 'Janet Apio', note: 'Community consultation complete; full proposal draft due 20 September.' },
  { id: 'g4', title: 'Post-Harvest Loss Reduction Pilot', funder: 'WFP', stage: 'Identified', amountRequested: 'UGX 560M', handler: 'Florence Adong', note: 'RFP analysed; concept note drafting.' },
  { id: 'g8', title: 'Solar Irrigation for Smallholders', funder: 'GCF', stage: 'Identified', amountRequested: 'UGX 680M', handler: 'Florence Adong', note: 'Funder criteria assessment in progress.' },
  { id: 'g6', title: 'Rural Water Infrastructure Assessment', funder: 'World Bank', stage: 'Declined', amountRequested: 'UGX 920M', handler: 'Sarah Aciro', note: 'Declined by funder — strategic misalignment cited.' },
];

/** Look up similar applications we have made before, by grant id */
export function getSimilarApplied(grantId: string): AppliedGrant[] {
  const grant = LIVE_OPPORTUNITIES.find((g) => g.id === grantId);
  if (!grant?.similarIds) return [];
  return grant.similarIds
    .map((id) => APPLIED_HISTORY.find((a) => a.id === id))
    .filter((a): a is AppliedGrant => Boolean(a));
}

// ── FUNDER PORTALS (for "grants on the internet" exploration) ──
export interface FunderPortal {
  name: string;
  url: string;
  description: string;
}

export const FUNDER_PORTALS: FunderPortal[] = [
  { name: 'UCC e-Services Portal (UCUSAF calls)', url: 'https://eservices.ucc.co.ug/web', description: 'Uganda Communications Commission grant applications' },
  { name: 'IDRC — SGCI STISA 2034', url: 'https://idrc-crdi.ca/en/supporting-stisa-2034-sgci-multilateral-research-call-advancing-africas-science-technology-and', description: 'Multilateral research call for Africa (EOI 25 Sep 2026)' },
  { name: 'IEEE Africa Innovation Summit', url: 'https://innovsummit.org/innovation-registration/', description: 'AIS 2026 call for innovations (deadline 28 Aug 2026)' },
  { name: 'Climate Curve — Constellations Fellowship', url: 'https://www.climatecurve.org/constellations-positions', description: 'Virtual climate fellowships for students and recent graduates' },
  { name: 'USAID Grants & Opportunities', url: 'https://www.usaid.gov/grants', description: 'US government funding opportunities' },
  { name: 'EU Funding & Tenders Portal', url: 'https://ec.europa.eu/info/funding-tenders', description: 'European Commission calls for proposals' },
  { name: 'UN Women Calls for Proposals', url: 'https://www.unwomen.org/en/how-we-work/programme-implementation', description: 'UN Women funding opportunities' },
  { name: 'African Development Bank — Funding', url: 'https://www.afdb.org/en/topics-and-sectors/initiatives-partnerships', description: 'AfDB funding windows and partnerships' },
];
