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

## 2. GitHub Actions Pipeline (explicit CI/CD)

Two workflows live in `.github/workflows/`:

| Workflow | Triggers | Purpose |
|---|---|---|
| `ci.yml` | Push to `main`; pull requests to `main` | `npm ci` + `npm run build` — verifies every update compiles and bundles before it can ship |
| `deploy.yml` | Push to `main`; manual dispatch | Builds and deploys **production** to Vercel via the Vercel CLI action |

### One-time setup for `deploy.yml`

Add these secrets in **GitHub → Settings → Secrets and variables → Actions**:

1. `VERCEL_TOKEN` — Vercel dashboard → **Settings → Tokens → Create**.
2. `VERCEL_ORG_ID` — from `vercel teams ls` (Vercel CLI), or your team page URL.
3. `VERCEL_PROJECT_ID` — run `vercel link` once locally (creates
   `.vercel/project.json`), then take the `projectId`; or from
   `vercel projects ls`.

Until the secrets are added, `ci.yml` still runs (it needs no secrets) and
Vercel's native integration still deploys — the explicit `deploy.yml` simply
becomes the formal pipeline on top.

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
