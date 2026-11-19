# AIMS — Deployment & CI/CD

This document describes how updates to AIMS are automated and delivered to
production. Two complementary mechanisms are in place.

---

## 1. Vercel Native Git Integration (zero-config, already active)

The project is imported into Vercel from the GitHub repository
(`Photizo77/AIMS`, branch `main`, framework **Vite**, root directory `./`).

- Every **push to `main`** automatically triggers a Vercel production build
  and deployment — no workflow required.
- Environment variables (SMTP, AI keys) are set once in
  **Vercel → Project → Settings → Environment Variables**:

| Variable | Purpose |
|---|---|
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | ARDHI mail relay (`@ardhi.org.ug`) |
| `ANTHROPIC_API_KEY` | Claude enhancement |
| `OPENAI_API_KEY` | GPT enhancement |
| `DEEPSEEK_API_KEY` | DeepSeek enhancement |
| `QWEN_API_KEY` | Qwen enhancement |
| `VITE_API_URL` | AIMS backend base URL (e.g. `https://aims-backend-five.vercel.app`). When set, sign-in authenticates against the backend (JWT) with persona fallback when the server is unreachable. When empty/unset the app runs in demo mode. |

> AIMS API integration: `src/lib/api.ts` is the single client seam. Setting
> `VITE_API_URL` switches login to the real backend; auth tokens persist and
> sessions are restored via `/auth/me`. Data records remain in the browser
> storage layer (`src/lib/storage.ts`) — see its `collections` API counterpart
> for the next integration step.

## 2. GitHub Actions Pipeline (explicit CI/CD)

Two workflows live in `.github/workflows/`:

| Workflow | Triggers | Purpose |
|---|---|---|
| `ci.yml` | Push to `main`; pull requests to `main` | `npm ci` + `npm run build` — verifies every update compiles and bundles before it can ship |
| `deploy.yml` | Push to `main`; manual dispatch | Builds the artifact in CI and promotes it to **production** with the official Vercel CLI |

### How `deploy.yml` behaves

- **With** the three secrets below it deploys the built artifact to production
  (`vercel pull` → `vercel build --prod` → `vercel deploy --prebuilt --prod`),
  publishing the deployment URL into the run summary. A `concurrency` group
  (`production-deploy`) prevents two production deploys from racing.
- **Without** them the job does not fail — it writes a "deploy skipped" notice
  to the run summary and exits green, because Vercel's native Git integration is
  already publishing every push to `main`. So a fresh clone never shows a red
  pipeline just for missing credentials.

### One-time setup for `deploy.yml`

Add these secrets in **GitHub → Settings → Secrets and variables → Actions**:

1. `VERCEL_TOKEN` — Vercel dashboard → **Account Settings → Tokens → Create**.
2. `VERCEL_ORG_ID` — from `vercel teams ls` (Vercel CLI), or your team page URL.
3. `VERCEL_PROJECT_ID` — run `vercel link` once locally (creates
   `.vercel/project.json`), then take the `projectId`; or from
   `vercel projects ls`.

Fastest path (GitHub CLI + Vercel CLI installed locally):

```bash
vercel link                       # writes .vercel/project.json
gh secret set VERCEL_TOKEN --body "<token>"
gh secret set VERCEL_ORG_ID --body "$(node -p "require('./.vercel/project.json').orgId")"
gh secret set VERCEL_PROJECT_ID --body "$(node -p "require('./.vercel/project.json').projectId")"
```

Until the secrets are added, `ci.yml` still runs (it needs no secrets) and
Vercel's native integration still deploys — the explicit `deploy.yml` simply
skips and becomes the formal pipeline on top the moment the secrets appear.

### Manual production deploy

GitHub → **Actions** → **Deploy to Vercel (Production)** → **Run workflow**.

---

## 3. Local checks (same as CI)

```bash
npm install     # or: npm ci (uses package-lock.json)
npm run build   # type-check (tsc) + production bundle (vite)
npm run dev     # local development server
```

## 4. Notes

- `node_modules`, `.netlify` and `dist` are **not** committed; Vercel and CI
  both run a fresh install from `package-lock.json`.
- `.npmrc` sets `allow-scripts=true` and `package.json` declares
  `allowScripts: { esbuild: true }` so esbuild's postinstall runs on Linux
  build environments (Vercel / GitHub Actions).
- The Vercel SPA rewrite (`vercel.json`) keeps all deep links working on
  refresh, excluding `api/*` serverless functions.
