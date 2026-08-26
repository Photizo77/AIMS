# AIMS — ARDHI Internal Management System
## Front-End Design & Architecture Documentation

| | |
|---|---|
| **Document** | Front-End Design & Architecture |
| **Product** | AIMS — ARDHI Internal Management System |
| **App Version** | 1.0.0 |
| **Document Date** | 26 August 2026 |
| **Baseline Commit** | `834446a0` |
| **Audience** | Product owners, developers, reviewers, and implementation partners |

---

## 1. Executive Summary

AIMS is a **front-end–only, browser-delivered operations platform** for ARDHI (a Ugandan
non-governmental organisation). It consolidates grants, finance, HR, attendance, inventory,
innovations, approvals, knowledge, and internal communications into **one role-aware
application** that runs entirely in the browser with zero server runtime for the core
product.

The application is engineered on a modern React + TypeScript + Vite foundation, styled with
a disciplined **ARDHI brand design system**, and governed by a **strict role-based access
model** (8 roles, 20 modules). "AI-Powered" intelligence is provided by a **deterministic
in-house engine** that works on live data and is optionally enhanced by real LLM providers
(Claude, GPT, DeepSeek, Qwen) through secure serverless proxies.

All data persists to the user's browser via a **unified storage layer** (`src/lib/storage.ts`)
which is deliberately designed as the **single swap point** for a future backend, and ships
with a **Data Vault** export/import facility so records are never locked to one browser.

Deployment is fully prepared for **Vercel** (primary) and **Netlify** (fallback), including
SPA routing, serverless AI/email functions, and environment-variable configuration.

---

## 2. Design Principles

1. **Brand discipline** — every screen is rendered from the ARDHI palette (navy, green,
   orange, mint) defined in one Tailwind theme; no ad-hoc colours.
2. **Role-aware surfaces** — each persona sees exactly the modules and actions their role
   allows; navigation, dashboards, and queues are tailored per role.
3. **Formal, professional tone** — copy is institutionally appropriate for an NGO executive
   environment; no casual UI language.
4. **Seamless, front-first** — features work end-to-end in the browser, with graceful
   local fallbacks wherever external services (SMTP, LLM) are not yet configured.
5. **AI as an engine, not a gimmick** — intelligence runs on the organisation's own live
   data (deterministic) and is enriched by LLMs only when keys are present.
6. **No silent timeouts** — the user decides when to log in/out; sessions are not
   auto-terminated by idle timers (attendance is tied to deliberate login/logout).
7. **Everything inspectable** — full record details, exportable datasets (CSV/JSON), and
   a Data Vault backup/restore for every module.

---

## 3. Technology Stack

| Layer | Choice | Notes |
|---|---|---|
| Build tool | **Vite 5** | Dev server + production bundling |
| UI framework | **React 18** | Function components + hooks |
| Language | **TypeScript 5.5** | Strict mode; `noUnusedLocals`; path alias `@/` → `src/` |
| Styling | **Tailwind CSS 3.4** | Design tokens in `tailwind.config.js`; `tailwindcss-animate` |
| Routing | **react-router v6** | SPA; guarded routes |
| Primitives | **Radix UI** | Dialog, dropdown, select, tabs, toast, tooltip, scroll-area, avatar, etc. |
| Icons | **Material Symbols** + **lucide-react** | Icon font + component icons |
| Utilities | **clsx**, **tailwind-merge**, **class-variance-authority** | Class composition |
| Charts/UI | Custom Tailwind components | No heavy chart dependency |
| Serverless | Vercel `api/*.js` / Netlify `netlify/functions/*` | AI proxy + SMTP relay |
| Persistence | Browser `localStorage` | Unified layer, backend-swappable |

---

## 4. Design System

### 4.1 Brand Palette

| Token | Hex | Usage |
|---|---|---|
| `aims-navy` | `#053664` | Primary brand; headers, primary actions, dark surfaces |
| `forest-green` | `#286b25` | Success, growth, approved states |
| `aims-orange` | `#eb3b14` | Alerts, high-priority flags, brand accent |
| `soft-mint` / `aims-mint-card` | `#c1dbc3` | Calm fills, success-tinted containers |
| `aims-mint` | `#f1f6f1` | Subtle background tints |

The Tailwind theme additionally defines a full **Material-3–inspired tonal scale**
(`primary #002141`, `primary-container #053664`, `secondary #4d6451`,
`tertiary #002702`, error/`surface`/`outline` families) for consistent elevation and
state surfaces. Semantic status colours are centralised in `src/lib/uiTheme.ts`
(`CHIP`, `ACCENT`, `FILL` maps) so every badge, card accent, and progress fill shares
one source of truth.

### 4.2 Typography

| Token | Size / Line-height | Weight | Use |
|---|---|---|---|
| `display-lg` | 48 / 56, `-0.02em` | 700 | Page hero numbers |
| `headline-lg` | 32 / 40 | 600 | Section titles |
| `headline-md` | 24 / 32 | 600 | Card titles |
| `title-lg` | 20 / 28 | 600 | Panel titles |
| `body-lg` | 16 / 24 | 400 | Default body |
| `body-md` | 14 / 20 | 400 | Dense content |
| `label-md` | 12 / 16 | 500 | Labels, meta |
| `code` | 13 / 18 | 400 | Identifiers, IDs |

Font family: **Inter** (sans) with monospace fallback for identifiers.

### 4.3 Spacing, Radius, Elevation, Motion

- **Spacing scale**: 4 px base unit (`unit/xs 4`, `sm 8`, `md 16`, `lg 24`, `xl 32`, `2xl 48`),
  page gutter `24 px`, outer margin `32 px`, content max-width `1440 px`.
- **Radius**: default `0.5 rem`; tokens `sm .25`, `md .5`, `lg .75`, `xl 1`, `2xl 1.5`, `full`.
- **Elevation**: `level-1` (soft card shadow) and `level-2` (modal/drawer depth).
- **Motion**: `slide-in-up`, `fade-out`, `accordion-down/up`, `spin-slow` — subtle and
  professional; no gratuitous animation.

### 4.4 Component Library

**UI primitives** (`src/components/ui/`): `StatusChip`, `StatCard`, `PageHeader`,
`FAB` (floating action button), `AnnouncementBanner`, `ProgressBar`, `Toaster`,
shared exports in `index.ts`.

**Layout** (`src/components/layout/`): `AppShell` (shell + modal mounts + global search),
`SideNavBar` (collapsible, single-active-item), `TopNavBar`, `GlobalSearch` (**Ctrl+K**),
`NotificationBell`, `EmailBell`, `ArdhiLogo`, `ProtectedRoute`.

**Domain components**: `dashboard/CheckInCard`, `dashboard/SharedLibraryWidget`,
`ai/AIPanel`, `ai/ExecutiveBrief`, `grants/GrantsAssistant`, `grants/FlagForEDModal`,
`grants/GrantsPipelineBoard`, `grants/GrantReviewQueue`, `grants/ProposalWorkspace`,
`forms/FormLibraryModal`, `forms/FormRenderer`, `forms/FormsShortcut`,
`inventory/InventoryHub`, `inventory/InventoryManager`, `finance/*` (Income/Expense,
Budget Tracker, Expense Tracker, Requisitions, Edit Approvals), `admin/*` (People,
Attendance Management/Summary, Leave, Contracts, Payslips, Performance, Offboarding,
HR Summary), `rbac/RoleManager`, `auth/ProtectedRoute`.

---

## 5. Application Architecture

### 5.1 Source Layout

```
src/
├── main.tsx / App.tsx        # Bootstrap + route table
├── config/                   # roles.ts, navigation.ts, forms.ts, geofence.ts
├── context/                  # AuthContext, AttendanceContext, NotificationContext
├── data/                     # Seed data: roster, grants, grantTracker, orgKnowledge
├── lib/                      # storage.ts, aiEngine.ts, email.ts, uiTheme.ts,
│                             # knowledgeRetrieval.ts, utils.ts
├── services/                 # grant, innovation, finance, requisition, proposal,
│                             # compliance, flag services (persisted stores)
├── pages/                    # One file per route (Dashboard, Grants, Finance, HR, …)
├── components/
│   ├── ui/ layout/ auth/ rbac/
│   ├── dashboard/ ai/ grants/ forms/ finance/ inventory/ admin/
├── types/                    # Shared domain types (index.ts)
api/                          # Vercel serverless: chat.js, email.js
netlify/functions/            # Netlify equivalents (fallback)
```

### 5.2 Routing Model

React Router v6 with a single guarded shell:

- `/login` — public authentication (MFA-style login surface).
- All other routes render inside `AppShell` behind `ProtectedRoute module="…"` —
  a route is only reachable if the signed-in role has that module in
  `src/config/roles.ts` (`MODULE_ACCESS`).
- Unknown routes redirect to `/dashboard`.

### 5.3 State & Data Flow

- **Auth** (`AuthContext`): persists the signed-in user; login = attendance check-in,
  logout = check-out (session-aligned attendance).
- **Notifications** (`NotificationContext`): role-targeted alerts and badges.
- **Attendance** (`AttendanceContext`): daily status shared across widgets.
- **Domain state**: each service module holds its dataset in memory and persists to
  `localStorage` through `src/lib/storage.ts`. Components subscribe to live bindings
  (e.g., `useRequisitions`) so edits reflect instantly across the app.
- **One-way flow**: UI → service mutator → save to storage → re-render; the AI engine
  and reports always read from the live store, never from stale snapshots.

---

## 6. Role-Based Access Control

### 6.1 Roles & Hierarchy

| Role | Label | Hierarchy |
|---|---|---|
| `CD` | Country Director | 100 |
| `ED` | Executive Director | 95 |
| `SYS_ADMIN` | System Administrator | 90 |
| `COMPANY_ADMIN` | Company Administrator | 80 |
| `FINANCE` | Finance Officer | 70 |
| `GRANTS_MANAGER` | Grants Manager (Team Lead) | 65 |
| `GRANT_WRITER` | Grant Writer | 50 |
| `INNOVATOR` | Innovator / Developer | 40 |

### 6.2 Module Access Matrix

`✓` = module visible to that role. CD = Country Director, ED = Executive Director,
SA = System Admin, CA = Company Admin, FN = Finance, GM = Grants Manager,
GW = Grant Writer, IN = Innovator.

| Module | CD | ED | SA | CA | FN | GM | GW | IN |
|---|---|---|---|---|---|---|---|---|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Feed | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Attendance | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| HR & People (`hr_admin`) | ✓ | ✓ | ✓ | ✓ | – | – | – | – |
| Grants | ✓ | ✓ | ✓ | ✓ | – | ✓ | ✓ | – |
| Innovations | ✓ | ✓ | ✓ | ✓ | – | – | – | ✓ |
| Finance | ✓ | ✓ | ✓ | – | ✓ | – | – | – |
| Procurement | ✓ | ✓ | ✓ | – | ✓ | – | – | – |
| Approvals | ✓* | ✓ | – | – | ✓ | – | – | – |
| Documents | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Knowledge | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Research | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Forms Library | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Inventory | ✓ | ✓ | ✓ | ✓ | – | – | – | – |
| Calendar | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Reports | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – |
| CRM | ✓ | ✓ | – | ✓ | – | – | – | – |
| Analytics | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| RBAC / Audit | – | – | ✓ | – | – | – | – | – |
| Settings | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

\* **CD has view-only access** to the Approvals pipeline (`/approvals?view=readonly`);
only the **ED approves** and **Finance processes** requisitions. CD flags route to the top
of the ED queue as priority interrupts.

### 6.3 Per-Persona Navigation

`getVisibleNavItems(role)` in `src/config/navigation.ts` renders exactly one nav set:

- **CD** — 14 items: Dashboard, Grants, Approvals in Progress (read-only), Finance &
  Procurement, Attendance, HR & Admin Summary, Innovations & Tasks, Documents,
  Inventory, Feed, Email, Calendar, Reports, Settings.
- **ED** — 14 items: Dashboard, Grants, Approvals Queue, Finance & Procurement,
  Attendance, HR & People Management, Innovations & Tasks, Inventory, Documents,
  Feed, Email, Calendar, Reports, Settings.
- **COMPANY_ADMIN** — 9 items: Dashboard, User Management, Attendance, HR,
  Inventory Management, Documents, Feed, Email, Settings.
- **SYS_ADMIN** — 10 items: Dashboard, System Telemetry & Logs, Audit & Security Logs,
  System Configuration, Full Route Access, Feed, Calendar, Reports, Email, Settings.
- **FINANCE** — 7 items: Dashboard, Requisition Queue, Cash Flow Analytics,
  My Attendance, Feed, Email, Settings.
- **GRANT_WRITER / GRANTS_MANAGER** — 8 items: Dashboard, Grants, AI Assistant,
  My Attendance, Calendar, Feed, Email, Settings.
- **INNOVATOR** — 7 items: Dashboard, Innovations & Tasks, My Attendance, Calendar,
  Feed, Email, Settings.

---

## 7. Data Layer & Persistence

### 7.1 Unified Storage (`src/lib/storage.ts`)

Every domain persists through `loadJSON` / `saveJSON` under keys from `STORAGE_KEYS`:

| Key constant | localStorage key | Holds |
|---|---|---|
| `grants` | `aims_grants` | Grant records, docs, comments |
| `projects` | `aims_projects` | Innovation projects + budgets |
| `finance` | `aims_finance` | Income, expenses, requisitions, budget |
| `requisitions` | `aims_requisitions` | Requisition queue |
| `proposals` | `aims_proposals` | Proposal sections + versions |
| `compliance` | `aims_compliance_vault` | Compliance vault |
| `notifications` | `aims_notifications` | In-app notifications |
| `feed` | `aims_feed_messages` | Feed messages |
| `attendancePrefix` | `aims_attendance_*` | Per-user attendance |
| `fab` | `aims_fab_pos` | Draggable AI FAB position |
| `sidebar` | `sidebar-collapsed` | Sidebar state |

### 7.2 Data Vault

`exportAllData()` bundles the entire dataset (timestamped, versioned JSON);
`importAllData()` restores it. `downloadFile()` and `toCSV()` provide JSON/CSV exports —
so records can be moved between browsers, backed up, or shared with leadership.

### 7.3 Backend Swap Point

The storage layer is the **single seam for a future backend**: replace
`loadJSON`/`saveJSON` with API calls and the whole product moves to a shared,
multi-user server without touching pages or services. This is the documented
integration point for the roadmap.

### 7.4 Seed Data

`src/data/` provides the initial institutional dataset: `roster.ts` (staff, logins,
emails), `grants.ts` (grant records), `grantTracker.ts` (live opportunities G-001…
G-011 with alignment/eligibility scoring, missed grants, applied history, funder
portals), `orgKnowledge.ts` (organisation knowledge base chunks).

---

## 8. Module Catalogue

| Route | Module | Purpose |
|---|---|---|
| `/dashboard` | Dashboard | Role-specific at-a-glance: CD/ED executive brief, Finance USD overview, HR summaries, innovations pipeline |
| `/approvals` | Approvals | Finance requisition workspace; ED approval queue (flagged items on top); CD read-only view |
| `/grants`, `/grants/:id` | Grants | Grant pipeline board, full record detail, proposal workspace, AI risk & drafting, CD flag-for-ED |
| `/tasks`, `/innovations/:id` | Innovations | Innovation projects, budgets, Request Funding → requisition |
| `/finance` | Finance | Cash flow analytics, income/expense, budget tracker, requisitions (ED-gated edits) |
| `/procurement` | Procurement | Procurement records & approvals |
| `/hr` | HR & People | People, attendance management/summary, leave, contracts, payslips, performance, offboarding |
| `/attendance` | Attendance | Geofenced check-in/out, per-user records |
| `/inventory` | Inventory | Inventory hub & manager |
| `/documents` | Documents | Document library |
| `/knowledge` | Knowledge | Organisation knowledge base with retrieval |
| `/research` | Research | Research module |
| `/crm` | CRM | Partner/contact relationships (CD/ED/CA) |
| `/calendar` | Calendar | Shared calendar |
| `/reports` | Reports | Reporting (CD/ED/SA/CA/FN) |
| `/analytics` | Analytics | System telemetry & analytics |
| `/feed` | Feed | Role-scoped channels; Executive Brief; Ask-AI |
| `/email` | Email | Internal email surface (ARDHI roster addresses) |
| `/user-management` | User Management | Company-admin user administration |
| `/rbac` | RBAC / Audit | System-admin roles, routes, audit logs |
| `/settings` | Settings | Profile, preferences, **Data Vault** |
| `/ai-assistant` | AI Assistant | Dedicated AI workspace (grant-focused) |
| `/forms` | Forms Library | Institutional forms + renderer; shortcut available in every module |

---

## 9. Attendance & Geofencing

- **Session-aligned**: logging in = check-in; logging out = check-out. No idle
  auto-logout; the user controls the working session.
- **Geofence** (`src/config/geofence.ts`): office at **0°19'12"N 32°34'48"E**
  (0.3200, 32.5800) with a **200-metre radius**. `haversineDistance` computes
  distance; `isWithinGeofence` gates check-in.
- **UI**: `CheckInCard` on the dashboard and the Attendance page show live status,
  distance, and in/out controls; HR sees attendance summaries and management views.

---

## 10. AI-Powered Intelligence

### 10.1 Deterministic Engine (`src/lib/aiEngine.ts`)

Works on live app data, with no API keys required:

| Function | Purpose |
|---|---|
| `aiGenerate(prompt, system)` | Orchestrates LLM call with local fallback |
| `grantRiskScore(grantId)` | Risk score, label, flags per grant |
| `funderMatches()` | Best-fit funder recommendations |
| `draftProblemStatement(grantId)` | Drafts narrative from grant data |
| `generateSectionText(sectionKey, grantId)` | Per-proposal-section drafting |
| `stageTransitionConfidence(projectId)` | Stage-readiness confidence + gaps |
| `resourceSuggestions(projectId)` | Resource recommendations |
| `pipelineTrendSummary()` | Grants pipeline insights |
| `requisitionPriceFlags(lineItems)` | Price-anomaly detection (market prices) |
| `cashFlowForecast()` | Monthly burn, runway, gap warnings |
| `sentimentSummary()` | Staff morale signal from feed |
| `contractRenewalAdvice()` | Renewal recommendations |
| `executiveBrief()` | Daily ED/CD brief with severity |
| `answerQuery(query)` | Natural-language Q&A over organisation data |

### 10.2 Optional LLM Enhancement

When API keys exist, the engine routes to `/api/chat` — a **serverless proxy**
(`api/chat.js`) supporting **Claude**, **GPT**, **DeepSeek**, and **Qwen** models.
Keys (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `DEEPSEEK_API_KEY`, `QWEN_API_KEY`)
live only on the server; the browser never sees them. Without keys, the
deterministic engine answers — so AI functionality is never dependent on
external services.

### 10.3 Assistant Surfaces

- **GrantsAssistant** — draggable floating chat button (position persisted in
  `aims_fab_pos`), always available while signed in, provider selectable.
- **ExecutiveBrief** — daily leadership briefing widget.
- **AIPanel / Ask-AI** — inline intelligence on dashboards, grants, and the feed.

---

## 11. Email Subsystem

- **Client** (`src/lib/email.ts`): `sendEmail()` posts to `/api/email`; maps staff
  names/IDs to ARDHI emails from the single roster source; falls back to **local
  mode** (queued simulation) when SMTP is not configured, so the UI always works.
- **Relay** (`api/email.js`): dependency-free SMTP client (`node:net` + `node:tls`,
  **EHLO → STARTTLS → AUTH LOGIN → MAIL/RCPT/DATA**), sending as `@ardhi.org.ug`.
- **Configuration**: environment variables `SMTP_HOST`, `SMTP_PORT` (default 587),
  `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (optional). Once set in the hosting
  dashboard, delivery becomes real with **no code change**.

---

## 12. Key User Flows

1. **Sign-in → workspace**: user logs in; attendance check-in is recorded; the shell
   renders the role's dashboard and navigation.
2. **Geofenced check-in**: dashboard `CheckInCard` verifies the device is within 200 m
   of the office before allowing check-in.
3. **Flag-for-ED**: CD flags a grant/issue; the flag is pushed to the **top of the ED
   Approvals Queue** as a priority interrupt; ED resolves it.
4. **Requisition lifecycle**: team requests funding → requisition enters the Finance
   queue (price-anomaly flags) → Finance reviews → **ED approves** → recorded against
   the project budget.
5. **Proposal workspace**: grant writers build proposals section-by-section with AI
   drafting; versions are preserved; risk and confidence are scored live.
6. **Data Vault**: an admin exports the full dataset (JSON/CSV) for backup or
   migration, and restores it in any browser.

---

## 13. Deployment

### 13.1 Vercel (primary)

- **Framework**: Vite — auto-detected; root directory `./`.
- **SPA routing**: `vercel.json` rewrites all non-`api/` paths to `/index.html` so
  deep links work on refresh.
- **Serverless functions**: `api/chat.js` (AI proxy) and `api/email.js` (SMTP relay),
  ESM default-export handlers.
- **Build**: `tsc && vite build`; `.npmrc` sets `allow-scripts=true` and
  `package.json` declares `allowScripts: { esbuild: true }` so esbuild's postinstall
  runs on Vercel's Linux builder. `node_modules` / build caches are not committed.
- **Environment variables** (set in Vercel dashboard):

| Variable | Purpose |
|---|---|
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | ARDHI email relay |
| `ANTHROPIC_API_KEY` | Claude enhancement |
| `OPENAI_API_KEY` | GPT enhancement |
| `DEEPSEEK_API_KEY` | DeepSeek enhancement |
| `QWEN_API_KEY` | Qwen enhancement |

### 13.2 Netlify (fallback)

Equivalent `netlify.toml` + `netlify/functions/` (chat, email) are retained, so the
product can be published to Netlify with the same behaviour and environment keys.

### 13.3 Local Development

`npm install` → `npm run dev` (Vite dev server) → `npm run build` (type-check +
bundle) → `npm run preview`. The app runs without any backend; API features degrade
gracefully to local mode.

---

## 14. UX Conventions

- **Global search**: Ctrl+K opens cross-module search from anywhere.
- **Forms everywhere**: the Forms Library + `FormsShortcut` is available in every
  relevant module, not only a dedicated page.
- **Full record details**: every list item opens a complete detail view (grants,
  projects, requisitions, people, inventory items).
- **Draggable AI assistant**: the chat FAB is draggable, position-persisted, and
  present whenever the user is signed in.
- **Single-active navigation**: exactly one nav item is highlighted per route.
- **Role-scoped feed channels**: moderators and channels follow the role model.
- **Read-only vs. editable**: viewers (e.g., CD on approvals) see the same data with
  actions disabled; only the ED approves and Finance processes.

---

## 15. Accessibility & Quality

- TypeScript **strict** mode with unused-locals checks; ESLint configured with
  `react-hooks` and `react-refresh` rules.
- Radix UI primitives provide ARIA-correct dialogs, menus, tabs, and toasts.
- Keyboard-first patterns: Ctrl+K search, focus-visible styles, semantic headings.
- Formal, consistent microcopy; statuses always carry colour + text (never colour alone).

---

## 16. Security Considerations

- **Front-end only**: there is no authentication server; RBAC is enforced at the UI
  layer. This is appropriate for an internal tool but must be replaced by real
  server-side auth when a backend is introduced (see roadmap).
- **Data residency**: data lives in the user's browser; the Data Vault is the
  sanctioned backup/migration path.
- **Keys on server only**: AI/email secrets are environment variables read by
  serverless functions; the client bundle never contains them.
- **CSP-ready build**: standard Vite static output with hashed assets.

---

## 17. Roadmap & Integration Notes

1. **Backend swap**: implement `loadJSON`/`saveJSON` in `src/lib/storage.ts` against
   an API (Supabase/Postgres or a custom REST service) to make AIMS multi-user and
   server-authenticated. No page-level changes required.
2. **Real email**: supply `SMTP_*` credentials for `@ardhi.org.ug` in the hosting
   dashboard — delivery activates automatically.
3. **LLM enrichment**: add provider API keys; the AI engine transparently upgrades
   from deterministic to LLM-assisted answers.
4. **Custom domain & TLS**: attach `ardhi.org.ug` (or a subdomain) in Vercel.

---

*End of document — AIMS Front-End Design & Architecture.*
