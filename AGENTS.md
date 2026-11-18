# Repository Guidelines

## Project Structure & Module Organization

PulseLogic has two npm projects:

- `backend/src/`: NestJS feature modules for authentication, patients, AI, chat, and auditing. Keep controllers, services, DTOs, and TypeORM entities together by feature.
- `frontend/app/`: Next.js App Router pages and API routes; protected screens use `(protected)/dashboard/`.
- `frontend/components/`, `hooks/`, `lib/`, and `types/`: reusable UI, hooks, API/auth utilities, and shared types. Assets belong in `frontend/public/`.
- `frontend/android/` and `frontend/src-tauri/`: Capacitor Android project and Tauri desktop shell.
- `docs/`: platform setup, release instructions, and the manual testing checklist.

## Build, Test, and Development Commands

Use Node.js 20+ and npm 10+. Run `npm install` separately in `backend/` and `frontend/`.

- Root: `docker compose up -d` starts PostgreSQL and Redis.
- Backend: `npm run start:dev` starts the API with watch mode on port 3001; `npm run build` compiles it.
- Frontend: `npm run dev` starts Next.js on port 3000; `npm run build` builds the web application.
- Each project: `npm run lint` runs its configured linter; backend lint applies fixes. Backend also provides `npm run format` using Prettier.
- Frontend: `npm run android:build` builds and syncs Android assets; `npm run desktop:build` builds the Tauri application. See `docs/` for native prerequisites.

## Coding Style & Naming Conventions

Use TypeScript, four-space indentation matching surrounding source, single quotes, and semicolons. Name React components and classes in PascalCase, hooks as `useSomething`, and functions/variables in camelCase. Follow NestJS filenames such as `users.service.ts` and `create-user.dto.ts`. Use Tailwind utilities for UI styling and the frontend `@/` import alias.

## Testing Guidelines

Backend Jest uses ts-jest and discovers `*.spec.ts` under `backend/src/`. Run `npm test` or `npm run test:cov` there. No test files or coverage threshold are currently present; add focused tests for changed behavior. Frontend has no automated test script. Build both projects before pushing and follow `docs/TESTING_CHECKLIST.md` for affected platforms.

## Commit & Pull Request Guidelines

History mixes `fix:` commits and informal subjects; follow README prefixes: `feat:`, `fix:`, `chore:`, `refactor:`, or `docs:` with a description. Sync before working, develop on `pl`, and request team-lead review through a PR into `main`. Avoid the legacy `master` branch and direct pushes to `main`. Describe changes and validation; link relevant issues and include screenshots for UI changes.

## Security & Configuration

Use `backend/.env.example` and frontend environment presets for local configuration. Never commit secrets, signing keys, local environment files, or patient data. Preserve role/clearance checks and audit behavior when modifying protected flows.
