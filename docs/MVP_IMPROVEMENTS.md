# Reliable MVP rollout

The application retains its NestJS/Next.js architecture, shared clinical records, and case/document clearance checks. These changes do not establish clinical validation or regulatory compliance.

## Database

Back up the database before rollout. From `backend/`, run `npm run migration:run` against the intended environment before starting the updated application. The additive migration adds nullable patient links to cases and versioned audit-chain fields. It does not infer patient links or rewrite legacy audit records. Configure `DB_SSL` and `DB_SSL_REJECT_UNAUTHORIZED` for the database provider. The application and migration CLI share the same connection settings.

The initial migration now bootstraps an empty database and skips existing installations; additive migrations upgrade existing records. Production startup applies compiled migrations before serving requests. Use a disposable database for testing.

## Verification

- Backend: `npm test -- --runInBand`, then `npm run build`.
- Frontend: `npx tsc --noEmit --incremental false`, then `npm run build`.
- Exercise login, optional MFA, expired sessions, admin approval, suspension, patient symptom recording, case editing/assignment, document failures, report printing, and audit verification.
- Verify as all three roles, including direct unauthorized API requests and lower-clearance access attempts.
- Check 360px, 768px, and desktop layouts, keyboard-only dialogs, and light/dark themes.
- Validate static exports and test navigation on actual native targets before distributing native releases.

## Audit history

New audit entries use a canonical version 2 chain with transaction-serialized appends and ordered sequence numbers. Legacy entries remain visible and are reported as unverifiable. A hash chain alone cannot detect removal of its entire suffix without an externally stored checkpoint; it is not an immutable storage guarantee.

## Deferred

FHIR/EHR integrations, durable offline clinical writes, wearable ingestion, predictive analytics, clinical AI validation, and formal deployment readiness remain separate future work.

## AI configuration and build compatibility

The local backend uses `GEMINI_API_KEY` with `GEMINI_MODEL_ID=gemini-flash-lite-latest`; both a startup probe and a subsequent generation request returned text. Credentials remain in the ignored environment file. Other deployments must configure their own working credential. The admin AI Status page reports actual model availability; guideline fallback remains available when inference fails. Provider integration reference: https://ai.google.dev/gemini-api/docs/openai

Backend TypeScript uses explicit Node16 module resolution and an explicit source root, without deprecated `baseUrl` or suppressed deprecation errors. Runtime output remains CommonJS for this package.

Web build/dev commands explicitly select web mode. Native static builds use an isolated temporary checkout and omit server-only auth routes. The new patient/case detail URLs support static export. Inter and Manrope are bundled locally with their OFL licenses so builds and native clients do not depend on Google Fonts connectivity.

## Verification completed

- Backend production build and 29 Jest tests passed with Node16 resolution and isolated module compilation.
- Five frontend session tests passed, including concurrent refresh and logout during refresh.
- Web production build and native static export passed. Patient/case static detail pages were exported without server auth routes.
- Chromium checked 138 role/page/viewport combinations at 360px, 768px, and 1366px, including dialog focus, report printing, symptom persistence, case editing, and reloads.
- Disposable PostgreSQL verified the additive migration, 25 concurrent audit appends, tamper detection, account protections, clearance checks, assignment, patient linking, and bounded pagination. HTTP checks denied unauthorized document reads/analysis and admin access.
- Gemini Flash Lite returned live text through the application adapter. This verifies connectivity, not clinical accuracy or image-analysis accuracy.

Native installation packages and physical-device behavior were not tested. Run the platform checklist before distributing native releases. Existing populated environment files remain ignored by Git. No production database was migrated or application deployed.

## Local runtime and upstream integration

Local PostgreSQL runs on port 5432 with the application's configured role/database. The rollout migration has been applied locally; `npm run migration:run` reports no pending migrations. The web application uses port 4050 and the backend uses port 3001. Ignored local environment files point the web application to this local backend; native environment presets remain separate.

The integration with the latest main branch retains persistent notifications, the audit-log page/navigation, theme controls, and chart API compatibility. Notification schema creation is included in the additive migration. Multipart uploads now respect `analyzeAfterUpload=false` even with implicit type conversion enabled.
