# pdfApp

Small full-stack app for:

- user registration and login
- plan selection (`25`, `50`, `100` generations per month)
- order storage
- PDF generation for saved orders
- PostgreSQL persistence through Prisma

## Project structure

```text
backend/    local API server, auth, plans, orders, PDF endpoint
src/        frontend app
tools/      local dev runner
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
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

Make sure PostgreSQL is running and `DATABASE_URL` in `.env` points to the target database before starting the app.

URLs:

- frontend: `http://localhost:5173`
- backend: `http://localhost:3001`

## Main API

- `GET /api/health`
- `GET /api/plans`
- `POST /api/auth/register`
- `POST /api/auth/login`
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
- backend data is stored in PostgreSQL
- Prisma schema covers `users`, `sessions`, `plans`, `subscriptions`, `orders`, `audit_logs`
- use `DATABASE_URL` for runtime and optional `DIRECT_DATABASE_URL` for Prisma CLI migrations/introspection
- migrate legacy JSON data with `npm run db:migrate-json -- --input=/path/to/db.json`
- passwords are hashed with Node `crypto.scrypt`
- auth uses `Authorization: Bearer <token>`
