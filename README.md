# pdfApp

Small app split into:

- frontend deployed separately on Netlify
- backend API deployed separately with Prisma + PostgreSQL
- user registration and login
- free + paid plans (`10`, `25`, `50`, `100` generations per month)
- manual paid activation after manager confirmation
- order storage
- PDF generation for saved orders

## Project structure

```text
backend/    isolated API app, Prisma schema, migrations, auth, orders
src/        frontend app for Netlify
tools/      root local dev runner
```

The frontend uses only these active areas:

- `src/app`
- `src/pages`
- `src/features`
- `src/shared`

## Local run

```bash
cp .env.example .env
cp backend/.env.example backend/.env
npm install
npm --prefix backend install
npm run hooks:install
npm run db:generate
npm run db:migrate
npm run dev
```

Use:

- root `.env` for frontend variables
- `backend/.env` for backend variables and PostgreSQL connection
- set a real `AUTH_TOKEN_SECRET` in `backend/.env` before starting the backend
- keep `VITE_*` variables only in root `.env`, never in `backend/.env`
- use `DB_MODE=file` and `DATA_FILE` only for local development or tests, never for production

Make sure PostgreSQL is running and `DATABASE_URL` in `backend/.env` points to the target database before starting the app.

Security:

- `backend/.env.example` must contain placeholders only, never live credentials
- `backend/.env` stays local and must not be committed
- run `npm run secrets:check` to scan tracked files for accidental secrets
- `npm install` also runs `npm run hooks:install` to enable the local `pre-commit` secret check

URLs:

- frontend: `http://localhost:5173`
- backend: `http://localhost:3001`

## Main API

- `GET /api/health`
- `GET /api/plans`
- `POST /api/contracts/get-pdf`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/me`
- `GET /api/me/usage`
- `POST /api/me/subscription/upgrade-request`
- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/:id`
- `PATCH /api/orders/:id`
- `GET /api/manager/users`
- `GET /api/manager/orders`
- `PATCH /api/manager/users/:id/subscription`
- `POST /api/manager/users/:id/subscription/confirm-payment`

## Notes

- public signup always creates `user`, never `admin`
- public signup always activates `plan-free` with `10` documents/month
- paid plans are requested manually and stay pending until manager confirmation
- create an admin only through `npm run admin:create -- --email=admin@example.com --name=\"Admin\" --password=\"strong-password\"`
- Netlify should deploy only the root frontend package
- Prisma exists only in `backend/`
- backend data is stored in PostgreSQL
- production runs only through Prisma + PostgreSQL, with no JSON fallback
- backend PDF generation is HTML-first and rendered through Puppeteer/Chromium
- every plan exposes two PDF document types: `offer` and `confirmation`
- Prisma schema covers `users`, `sessions`, `plans`, `subscriptions`, `orders`, `audit_logs`
- use `DATABASE_URL` for runtime and optional `DIRECT_DATABASE_URL` for Prisma CLI migrations/introspection inside `backend/`
- `DB_MODE=file`, `DATA_FILE`, and `LEGACY_DATA_FILE` are local/test-only controls
- `/api/contracts/get-pdf` requires auth, uses the active subscription plan, and expects an existing `orderId`
- migrate legacy JSON data with `npm run db:migrate-json -- --input=/path/to/db.json`
- promote an existing account to admin with `npm run admin:create -- --email=user@example.com --promote-existing`
- passwords are hashed with Node `crypto.scrypt`
- auth uses a short-lived `Authorization: Bearer <access-token>` plus a rotating refresh token in a secure `HttpOnly` cookie
- `/api/auth/login` and `/api/auth/register` are protected by brute-force lockouts and failed login auditing
- backend refuses to start without a real `AUTH_TOKEN_SECRET`
- `AUTH_TOKEN_SECRET` and `API_KEY` are separate values and must not be reused for each other
- frontend env is limited to public `VITE_*` keys in root `.env`
- `/api/health` returns `503` when PostgreSQL is unavailable and reports the active database mode

## Deploy

Frontend on Netlify:

- base directory: repo root
- install command: `npm install`
- build command: `npm run build`
- publish directory: `dist`
- required env: `VITE_API_BASE_URL`
- optional env: `VITE_API_KEY`
- optional env: `VITE_SUPPORT_WHATSAPP_URL`, `VITE_SUPPORT_TELEGRAM_URL`

Backend on Render or another Node host:

- root directory: `backend`
- install command: `npm install`
- release command: `npm run db:migrate:deploy`
- start command: `npm run start`
- required env: `AUTH_TOKEN_SECRET`, `DATABASE_URL`
- optional env: `API_KEY`
- optional env for Prisma CLI: `DIRECT_DATABASE_URL`
- optional env for custom browser location: `PUPPETEER_EXECUTABLE_PATH`
- production must not set `DB_MODE=file`, `DATA_FILE`, or `LEGACY_DATA_FILE`
- production health checks should target `/api/health`, which validates the live PostgreSQL connection

If a deployment fails inside `prisma migrate deploy`, do not keep it in the start command.
Resolve the failed migration first with `prisma migrate resolve`, then rerun the release command.
