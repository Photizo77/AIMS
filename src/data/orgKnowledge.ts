// src/data/orgKnowledge.ts
// ============================================================
// ARDHI ORGANISATIONAL KNOWLEDGE BASE
// Distilled from ARDHI source documents (Annex 5 profile, Annex 20 resource
// mobilisation plan, 5-Year Strategic Plan 2026-2031, internal briefings).
// This is the "fine-tuning" context injected into the grants assistant so the
// model answers with the organisation's real details.
// ============================================================

export type KnowledgeCategory =
  | 'identity'
  | 'programmes'
  | 'governance'
  | 'policies'
  | 'strategy'
  | 'fundraising'
  | 'events'
  | 'contacts';

export interface KnowledgeChunk {
  id: string;
  category: KnowledgeCategory;
  title: string;
  /** Keywords used for lightweight retrieval matching */
  keywords: string[];
  content: string;
}

export const ORG_KNOWLEDGE: KnowledgeChunk[] = [
  // ── IDENTITY ──
  {
    id: 'org-identity',
    category: 'identity',
    title: 'Organisation identity',
    keywords: ['ardhi', 'who', 'ngo', 'registered', 'name', 'about', 'law', 'policy', 'initiative'],
    content:
      'ARDHI Law and Policy Initiative (short name: ARDHI) is a non-governmental organisation registered in the Republic of Uganda. Community work started in 2024 and the organisation was fully registered in 2025. ARDHI drives community resilience through advocacy and systems innovations in agriculture and food security, waste management, disaster preparedness, public health and land governance. Physical address: Plot 1207, Ggaba Road, next to the American Embassy, Kampala, Uganda. Website www.ardhi.org.ug, general email info@ardhi.org.ug, telephone 0393104617 / +256 752 504008. ARDHI has approximately 20 staff and operates a lean, mobile, project-driven model without a permanent office building.',
  },
  {
    id: 'org-vision-mission',
    category: 'identity',
    title: 'Vision, mission and values',
    keywords: ['vision', 'mission', 'values', 'purpose', 'goal'],
    content:
      "Vision: 'A future where research informs action, and action delivers justice.' Mission: 'Impacting communities through research, innovations and advocacy — particularly in smart agriculture, waste management, disaster preparedness, health and land governance.' Core values: Sustainability (champion policies and actions that safeguard natural resources); Equity (inclusive environments and fair access to resources, with marginalised voices represented and empowered); Innovation (pioneer creative solutions and leverage emerging technologies); Collaboration (purposeful partnerships to amplify collective impact).",
  },
  {
    id: 'org-theory-of-change',
    category: 'identity',
    title: 'Theory of change',
    keywords: ['theory', 'change', 'think', 'act', 'tank', 'research', 'advocacy', 'innovation', 'model'],
    content:
      "ARDHI describes itself as 'not a Think Tank, but a Think and Act Tank'. The model combines advocacy (to shift rules), research (to generate empirical evidence) and innovation (to pilot practical models) across agriculture, waste, disaster preparedness, health and land governance. Lasting impact requires pressure, proof and prototypes working together. Research identifies where the system fails, innovation designs and tests a fix in a real community, and advocacy gets the tested fix adopted as policy or standard practice.",
  },
  {
    id: 'org-pillars',
    category: 'programmes',
    title: 'Three pillars',
    keywords: ['pillar', 'advocacy', 'research', 'innovation', 'how', 'work'],
    content:
      'ARDHI works through three connected pillars that feed each other: (1) Advocacy — legal empowerment of communities, legal aid and mediation, public interest engagement, policy influencing at district and national level, coalition building; (2) Research — original studies on tenure security, land governance, land conflict, gender and land, plus evaluations and assessments for others; (3) Innovation — designing and testing practical tools and models that make land rights easier to secure, including digital tools, community documentation models and dispute resolution approaches.',
  },
  {
    id: 'org-thematic-areas',
    category: 'programmes',
    title: 'Thematic programmes',
    keywords: ['thematic', 'agriculture', 'waste', 'disaster', 'health', 'land', 'law', 'programme', 'pillar'],
    content:
      "ARDHI's six thematic programmes: ArdhiAgriculture (food security, resilient livelihoods, climate-smart practice); ArdhiWaste (safe, responsible, circular approaches to waste — treated as a health and urban governance issue); ArdhiDisasters (anticipation, readiness and rapid response); ArdhiHealth (the intersection of environment, settlement, land, waste and access to services); ArdhiLandGovernance (fairness, access, tenure awareness, dispute reduction); ArdhiLaw (legal empowerment, policy reform, rights protection, institutional accountability — strengthening every other thematic area).",
  },
  {
    id: 'org-who-we-serve',
    category: 'programmes',
    title: 'Who we serve',
    keywords: ['serve', 'beneficiaries', 'women', 'youth', 'disabled', 'tenants', 'refugees', 'communities'],
    content:
      'ARDHI prioritises: women, particularly widows, separated women and women in customary marriage (they use most agricultural land but hold the weakest documented rights); young people; persons with disabilities; lawful and bona fide occupants and tenants; communal and customary land holders including pastoralists and forest-adjacent communities; refugee and host communities; residents of informal settlements; and land institutions and local government (improving how they work changes outcomes at scale).',
  },

  // ── GOVERNANCE ──
  {
    id: 'org-governance',
    category: 'governance',
    title: 'Governance and leadership',
    keywords: ['governance', 'board', 'director', 'directors', 'leadership', 'cd', 'ed', 'management', 'committee'],
    content:
      'ARDHI is governed by a Board of Directors that sets strategy, approves policy, oversees risk and safeguarding, and holds management to account. Board committees include Finance and Audit, HR and Governance, and Programmes and Strategy. Day-to-day leadership sits with the Country Director (overall accountability for the country programme, compliance, staff and delivery) supported by the Executive Director (strategy, partnerships, resource mobilisation and external representation) and the senior management team. Four operating directorates: Programs & Operations; Finance & Policy; Research & Resource; Partnerships & Mobilisation. Board members serve fixed renewable terms, declare conflicts of interest annually, and the Board meets at least quarterly with a safeguarding and risk report at every meeting.',
  },
  {
    id: 'org-people',
    category: 'governance',
    title: 'Our people and capability',
    keywords: ['people', 'staff', 'team', 'paralegals', 'researchers', 'capacity', 'expertise'],
    content:
      'ARDHI holds in-house capability in: legal (advocates and legal officers experienced in land law, succession, public interest litigation and legal aid); research (quantitative and qualitative researchers); programmes (project managers, field officers, community mobilisers with district-level networks); community-based work (trained and accredited community paralegals and mediators); finance and compliance; MEL (monitoring, evaluation and learning using digital data collection); communications and advocacy; plus a roster of technical associates (academics, surveyors, GIS specialists, consultants). ARDHI applies equal-opportunity recruitment targeting at least 50% women across staff and at least 40% women in senior management.',
  },

  // ── POLICIES ──
  {
    id: 'org-policies',
    category: 'policies',
    title: 'Systems, policies and compliance',
    keywords: ['policy', 'safeguarding', 'gender', 'environmental', 'finance', 'procurement', 'compliance', 'audit', 'mel', 'whistleblowing', 'anti-fraud'],
    content:
      'ARDHI maintains the governance, financial and safeguarding systems institutional funders assess during due diligence: Constitution and governance manual; Human Resource Manual and Code of Conduct; Finance and Accounting Manual; Procurement Policy with thresholds and a procurement committee; Anti-fraud, anti-bribery and whistleblowing policy; Safeguarding Policy covering PSEAH and child protection (Annex 11); Gender and Social Inclusion Policy (Annex 12); Environmental and Social Safeguards framework with grievance mechanism (Annex 13); Monitoring, Evaluation and Learning framework and tools (Annex 14); Risk management framework and register; Beneficiary selection criteria and tools (Annex 19); Data protection and privacy procedure; Partnership and sub-grant management procedure; Sustainability and Resource Mobilisation Plan (Annex 20). Financial management: accrual accounting, segregation of duties, dual signatories, monthly budget-vs-actual reporting, separate bank accounts for restricted funds, annual external audit, and an asset register verified annually.',
  },

  // ── STRATEGY ──
  {
    id: 'org-strategic-plan',
    category: 'strategy',
    title: '5-Year Strategic Plan 2026-2031',
    keywords: ['strategic', 'plan', 'strategy', '2031', 'goals', 'targets', 'kpi', 'five', 'year'],
    content:
      "ARDHI's 5-Year Strategic Plan (2026-2031) grows the organisation from a lean start-up NGO into a recognised systems-change institution across six strategic goals: strengthen legal and policy influence (ArdhiLaw); improve agriculture and food security (ArdhiAgriculture); advance resilient waste management (ArdhiWaste); build community disaster readiness (ArdhiDisasters); promote health (ArdhiHealth); and advance inclusive land governance (ArdhiLandGovernance). Five-year targets (cumulative): reach 150,000+ community members, publish 18 policy briefs/research products, influence 8+ policies or regulatory frameworks, launch 12 innovation pilots and institutionalise 10 proven models, hold 30 active partnerships, diversify to 8+ funding sources, grow core staff to 28 FTE, and build unrestricted reserves to 4 months of operating cost. Annual operating budget grows from about UGX 380 million (Year 1) to UGX 2.3 billion (Year 5); cumulative 5-year budget approximately UGX 5.98 billion (~USD 1.63 million).",
  },
  {
    id: 'org-financial-model',
    category: 'strategy',
    title: 'Financial model and reserve policy',
    keywords: ['finance', 'budget', 'reserve', 'money', 'funding', 'cash', 'financial'],
    content:
      'ARDHI\'s financial sustainability depends on a diversified portfolio: institutional grants, consultancies, training services, research commissions, convening support, innovation grants and strategic partnerships. Unrestricted income is prioritised because it protects core functions. ARDHI maintains a minimum reserve policy of at least three months of essential operating costs, built deliberately into the annual budget. Budget by category (Year 1, UGX millions): Programs & Delivery 209, Staffing 95, Operations & Admin 46, M&E and Learning 19, Reserve Building 11, total 380.',
  },
  {
    id: 'org-fundraising',
    category: 'fundraising',
    title: 'Resource mobilisation strategy',
    keywords: ['fundraising', 'resource', 'mobilisation', 'grants', 'donors', 'funding', 'pipeline', 'income', 'diversify'],
    content:
      "ARDHI pursues funding across five parallel tracks: (1) Institutional grants — multi-year grants from bilateral, multilateral and foundation donors active in land governance, climate resilience and public health in East Africa; target 2-3 active grants by Year 2 and 5+ by Year 5; (2) Consultancies and training — fee-based technical assistance and training for government and private-sector partners (building on the AIMS AI grant-writing assistant to lower proposal turnaround time); (3) Research commissions — commissioned studies, baselines and policy reviews; (4) Partnerships and coalitions — cost-shared and in-kind collaboration with peer NGOs, universities and private sector; (5) Innovation and challenge grants — competitive grants and hackathon-linked funding for digital tools. A rolling 18-month fundraising pipeline is maintained by the Partnerships & Mobilisation directorate and reviewed monthly. No single funder should hold a controlling share.",
  },
  {
    id: 'org-why-fund',
    category: 'fundraising',
    title: 'Why fund ARDHI',
    keywords: ['why', 'fund', 'donor', 'invest', 'case', 'support'],
    content:
      'Why fund ARDHI: Evidence first — advocacy is funded by ARDHI\'s own research so claims survive scrutiny; Innovation with proof — approaches are tested in real communities and the cost per result is published so a funder knows what scale would cost; Local delivery — work is carried out by Ugandan staff and community members from the districts where ARDHI works; Systems that pass due diligence — safeguarding, safeguards, inclusion, MEL, risk and beneficiary selection frameworks are in place and documented; Inclusion that is measured — participation quotas and disaggregated reporting are built into every project; Designed to end well — every project has a sustainability plan, handover memorandum and post-project follow-up.',
  },
  {
    id: 'org-sustainability',
    category: 'fundraising',
    title: 'Sustainability framework',
    keywords: ['sustainability', 'exit', 'handover', 'transition', 'sustain'],
    content:
      'ARDHI plans sustainability across five dimensions for every project: institutional (structures keep working, ideally through existing local institutions); human and technical (skills stay in the community — certified paralegals, trainers-of-trainers, local language materials); financial (low-cost models, modest local revenue, links to district budgets); policy and legal (practice converted into ordinances, byelaws and procedures); social and cultural (community ownership, allies including clan leaders). Every proposal includes a sustainability section answering all five dimensions, reviewed before submission, and every project has an exit plan from day one with a written handover memorandum.',
  },

  // ── EVENTS ──
  {
    id: 'org-events',
    category: 'events',
    title: '2026 Kampala conferences and engagements',
    keywords: ['conference', 'event', 'kampala', 'summit', 'expo', 'forum', '2026', 'network'],
    content:
      'Relevant 2026 engagements in Kampala: 9th Annual AFREhealth Conference (24-26 August 2026, Speke Resort Munyonyo — health systems, community health; registration only, abstract deadlines closed; symposium@afrehealth.org); Agrifood Uganda International Expo (25-27 November 2026, UMA Show Grounds Lugogo — agrifood, food security, agro-tech; free pre-registration for NGO visitors; agrifooduganda.com); International Conference on Plastic Waste Reduction and Sustainable Packaging (15-16 December 2026, Central Kampala — municipal waste, circular economy, community recycling models); International Conference on Hazardous Waste Handling and Environmental Safety (23 December 2026, Kampala hybrid); Uganda National NGO Forum (UNNGOF) Institutional Dialogues (ongoing Fall/Winter 2026 — inclusive land governance, smallholder tenure rights; info@ngoforum.or.ug, +256 414 510 272).',
  },

  // ── CONTACTS ──
  {
    id: 'org-contacts',
    category: 'contacts',
    title: 'Contact points',
    keywords: ['contact', 'email', 'phone', 'address', 'reach', 'call'],
    content:
      'ARDHI contact points: general enquiries info@ardhi.org.ug; website www.ardhi.org.ug; telephone 0393104617 / +256 752 504008; physical address Plot 1207, Ggaba Road, next to the American Embassy, Kampala; safeguarding concerns safeguarding@ardhilaw.org; complaints and grievances grievance@ardhilaw.org; partnerships and funding via the Executive Director.',
  },
];

// ─────────────────────────────────────────────
// FAST FACTS — quick one-liners used by the assistant
// ─────────────────────────────────────────────
export const ORG_FAST_FACTS: { question: string; answer: string }[] = [
  { question: 'what is ardhi', answer: 'ARDHI Law and Policy Initiative is a Ugandan NGO (registered 2025, community work since 2024) driving community resilience through advocacy, research and innovation in agriculture, waste management, disaster preparedness, health and land governance.' },
  { question: 'where is ardhi located', answer: 'ARDHI is at Plot 1207, Ggaba Road, next to the American Embassy, Kampala, Uganda. Website: www.ardhi.org.ug. Email: info@ardhi.org.ug. Tel: 0393104617 / +256 752 504008.' },
  { question: 'how many staff', answer: 'ARDHI has approximately 20 staff operating a lean, mobile, project-driven model, supported by volunteers, interns, consultants and a roster of technical associates.' },
  { question: 'what does ardhi do', answer: 'ARDHI works through three connected pillars — Advocacy, Research and Innovation — across six thematic areas: ArdhiAgriculture, ArdhiWaste, ArdhiDisasters, ArdhiHealth, ArdhiLandGovernance and ArdhiLaw.' },
  { question: 'what is the strategic plan', answer: 'The 5-Year Strategic Plan (2026-2031) targets 150,000+ community members reached, 8+ policies influenced, 10 innovations institutionalised and a UGX 5.98 billion cumulative budget by Year 5.' },
];
