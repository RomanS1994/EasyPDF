# pdfApp

Small app split into:

- frontend deployed separately on Netlify
- backend API deployed separately with Prisma + PostgreSQL
- user registration and login
- plan selection (`25`, `50`, `100` generations per month)
- order storage
- PDF generation for saved orders

## Project structure

```text
backend/    isolated API app, Prisma schema, migrations, auth, orders
src/        frontend app for Netlify
tools/      root local dev runner
```

The frontend uses only these active areas:

- `src/cz/pdf`
- `src/js/components/auth`
- `src/js/components/generateContract`
- `src/api`
- `src/css/base`
- `src/css/components/buttons.css`
- `src/css/layout/generateContract/dataContract.css`
- `src/css/utils`

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
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/me`
- `GET /api/me/usage`
- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/:id`
- `PATCH /api/orders/:id`
- `GET /api/admin/users`
- `GET /api/admin/orders`
- `PATCH /api/admin/users/:id/plan`
- `POST /api/contracts/get-pdf`

## Notes

- the first registered user becomes `admin`
- Netlify should deploy only the root frontend package
- Prisma exists only in `backend/`
- backend data is stored in PostgreSQL
- Prisma schema covers `users`, `sessions`, `plans`, `subscriptions`, `orders`, `audit_logs`
- use `DATABASE_URL` for runtime and optional `DIRECT_DATABASE_URL` for Prisma CLI migrations/introspection inside `backend/`
- migrate legacy JSON data with `npm run db:migrate-json -- --input=/path/to/db.json`
- passwords are hashed with Node `crypto.scrypt`
- auth uses a short-lived `Authorization: Bearer <access-token>` plus a rotating refresh token in a secure `HttpOnly` cookie
- `/api/auth/login` and `/api/auth/register` are protected by brute-force lockouts and failed login auditing

## Deploy

Frontend on Netlify:

- base directory: repo root
- install command: `npm install`
- build command: `npm run build`
- publish directory: `dist`
- required env: `VITE_API_BASE_URL`
- optional env: `VITE_API_KEY`

Backend on Render or another Node host:

- root directory: `backend`
- install command: `npm install`
- start command: `npm run db:migrate:deploy && npm run start`
- required env: `DATABASE_URL`
- optional env for Prisma CLI: `DIRECT_DATABASE_URL`
