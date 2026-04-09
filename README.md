# pdfApp

Small full-stack app for:

- user registration and login
- plan selection (`25`, `50`, `100` generations per month)
- order storage
- PDF generation for saved orders

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
npm run dev
```

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
- data is stored in `backend/data/db.json`
- passwords are hashed with Node `crypto.scrypt`
- auth uses `Authorization: Bearer <token>`
