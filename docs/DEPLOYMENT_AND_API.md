# Deployment and API Guide

## Deployment branch and services

Use `main` for releases. Develop on `pl`, validate changes, then merge a pull request into `main`. The existing GitHub integrations deploy the Next.js frontend to Vercel and the NestJS API to Railway. A Git push triggers those integrations; confirm their deployment statuses before sharing the site.

The Railway and Vercel URLs in older documentation may be stale. Copy the current public domains from each project's dashboard. Both previously recorded Railway domains returned 404 during verification on 18 November 2026.

## Railway API

Select this repository, branch `main`, and root directory `backend`. Use `npm ci && npm run build` to build and `npm run start:prod` to start. The start command runs compiled TypeORM migrations before serving requests and fails if migration fails. Docker deployments use the same command. Health path: `/health`.

Configure these variables in Railway, never in Git:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Reference the existing PostgreSQL service |
| `DB_SYNCHRONIZE` | `false`; production always disables synchronization |
| `DB_SSL` | Match the PostgreSQL service's TLS requirements |
| `DB_SSL_REJECT_UNAUTHORIZED` | `true` with a trusted certificate; configure the provider's required trust settings otherwise |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Distinct random secrets; preserve existing values during routine releases |
| `ENCRYPTION_KEY` | Preserve the existing encryption key |
| `SEED_DEMO_DATA` | `false` for hosted data; `true` only for an intentional demo installation |
| `GEMINI_API_KEY` | The working key from your ignored `backend/.env` |
| `GEMINI_MODEL_ID` | `gemini-flash-lite-latest`, validated with the local key |

The initial migration creates the schema for an empty database and skips existing installations; subsequent migrations apply additive changes. Back up an existing database before rollout. Never enable schema synchronization on a populated hosted database. Retained additive columns allow application rollback without dropping history. A fresh private installation also needs an administrator provisioned by the database owner; sample accounts are disabled in production by default.

Uploaded files currently live under `backend/uploads` (container: `/app/uploads`). Attach persistent storage at the deployment's actual uploads directory before relying on uploads across deployments. Database storage alone does not preserve these files.

## Vercel website

Select the repository, production branch `main`, root directory `frontend`, and Next.js preset. Build: `npm run build`; output: `.next`. Set the following for the Production environment and redeploy after changing them:

- `BACKEND_URL=https://YOUR-API-DOMAIN` (no `/api` suffix).
- `NEXT_PUBLIC_API_URL=https://YOUR-API-DOMAIN/api`.
- `NEXT_PUBLIC_WS_URL=https://YOUR-API-DOMAIN` for chat.
- `NEXTAUTH_URL=https://YOUR-WEBSITE-DOMAIN`.
- `NEXTAUTH_SECRET`: a persistent random secret.
- `MOBILE_BUILD=false`, `NEXT_PUBLIC_MOBILE_BUILD=false`.

Never put the Gemini key in Vercel client variables or any `NEXT_PUBLIC_*` variable. The browser calls PulseLogic; only the backend calls Google.

## Gemini setup and API use

No additional AI credential is needed for local testing: the existing Gemini key returned live text. Hosting needs that same key configured separately in Railway. `AI_API_KEY`, when populated, takes precedence over Gemini, so leave it unset when selecting Gemini. Hugging Face/BioMistral is optional.

Use Postman or another HTTP client:

1. `POST https://YOUR-API-DOMAIN/api/auth/login`, JSON body `{"username":"YOUR_USERNAME","password":"YOUR_PASSWORD"}`. Add `mfaCode` when enabled. Use an approved account; do not publish demo passwords for a private installation.
2. Copy `accessToken` from the response into the client's Bearer Token field.
3. As an administrator, `GET /api/ai/status` verifies the selected provider/model and availability.
4. `POST /api/ai/query-protocol`, JSON body `{"query":"Explain the purpose of clinical guidelines for an educational demonstration."}`.
5. Check `source`: `model` means live inference; `guidelines-fallback` means local guideline text was returned because inference was unavailable. HTTP 200 alone does not prove Gemini worked.

`POST /api/ai/analyze-symptoms` accepts `symptoms`, optional `vitals`, and `medicalHistory`, and requires CONFIDENTIAL clearance. Use synthetic examples for verification. `POST /api/auth/refresh` takes the **refresh token** as Bearer authorization; application API calls use the **access token**.

A 401 indicates authentication/expiry; 403 indicates account permissions or clearance. For provider 429 errors, wait for quota to reset or inspect the project's limits in AI Studio. A configured key does not guarantee every model has free quota. Review [Google's current limits](https://ai.google.dev/gemini-api/docs/rate-limits) and [billing tiers](https://ai.google.dev/gemini-api/docs/billing) before choosing paid capacity.

## Verification before sharing

Confirm the deployment commit matches `main`, `/health` responds, website login works, admin AI Status reports online, a synthetic protocol request returns `source: model`, and an uploaded synthetic file survives an API restart. Local checks already cover backend tests, token refresh, migrations, concurrent audit writes, 138 browser combinations, and native static export. These checks do not constitute validation for clinical use.
