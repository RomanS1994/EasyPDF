# DocTra / pdfApp

> Workspace для приватних водіїв і невеликих transfer-команд. Створюйте PDF-договори, зберігайте замовлення, стежте за лімітом плану та керуйте підписками в одному застосунку.

## Що це

DocTra побудований як split-stack система:

| Частина | Що робить |
| --- | --- |
| Frontend | Мультисторінкові Vite-застосунки у `frontend/driverApp/`, `frontend/adminApp/` і `frontend/dispatcherApp/` |
| Backend | Node HTTP API з Prisma та PostgreSQL |
| PDF | HTML-first шаблони, що рендеряться через Puppeteer/Chromium |
| Auth | `Authorization: Bearer <token>` + rotating refresh cookie |
| Ops | Audit logs, health checks, rate limits, secret scanning, deploy-ready scripts |

## Головні можливості

- покроковий wizard для створення transfer-замовлень
- збереження замовлень і повторний доступ до них у кабінеті
- генерація двох типів PDF: `offer` і `confirmation`
- облік місячного ліміту генерацій і статистики використання
- редагування профілю, фото, бізнес-даних і мови інтерфейсу
- ручний запит paid-апгрейду з підтвердженням менеджером
- окремий admin workspace у `frontend/adminApp/`
- PWA-обгортка зі splash screen, manifest та іконками

## Ролі

| Роль | Доступ |
| --- | --- |
| `user` | Створення замовлень, власний профіль, статистика, історія, запит апгрейду |
| `manager` | Керування користувачами, підписками, планами, замовленнями та audit log |
| `admin` | Усе з `manager` + зміна ролей користувачів |

## Поточний набір планів

| Plan | Ліміт на місяць | Поточна ціна | Стара ціна | Знижка |
| --- | --- | --- | --- | --- |
| `plan-free` | 100 | 0 CZK | 199 CZK | -100% |
| `plan-25` | 300 | 229 CZK | 299 CZK | -23% |
| `plan-50` | 500 | 379 CZK | 499 CZK | -24% |
| `plan-100` | 1000 | 699 CZK | 899 CZK | -22% |

Усі плани підтримують обидва типи документів:

- `offer`
- `confirmation`

## Структура репозиторію

```text
backend/   API, Prisma schema, migrations, auth, orders, PDF renderer
frontend/  client apps
  driverApp/      current driver-facing app
  adminApp/       back-office admin app
  dispatcherApp/  future dispatcher app
tools/     dev runner, build/postbuild helpers, hooks
dist/      generated production build output (ignored in git)
```

## Frontend structure

- `frontend/driverApp/src/react-app` contains the isolated driver React app.
- `frontend/driverApp/src/react-app/app` contains the shell, router, store, providers, and layout components.
- `frontend/driverApp/src/react-app/features` contains driver feature slices, RTK Query APIs, hooks, utilities, and UI components.
- `frontend/driverApp/src/react-app/pages` contains the driver route pages.
- `frontend/driverApp/index.html` is the current driver SPA entry point.
- `frontend/adminApp/src/react-app` contains the isolated back-office app.
- `frontend/adminApp/src/react-app/pages` contains the admin route pages.
- `frontend/adminApp/src/react-app/features/admin` contains the back-office admin UI components.
- `frontend/shared/src/react-app/features/admin` contains the shared admin data API used by both apps.
- `frontend/dispatcherApp` is reserved for the future dispatcher app and is built into `/dispatcher/` in the shared Netlify deploy.

## Основні сторінки

| Зона | Шляхи |
| --- | --- |
| Driver app | `/`, `/orders/`, `/history/`, `/stats/`, `/account/`, `/settings/` |
| Admin app | `/admin/`, `/admin/accounts/`, `/admin/accounts/:userId`, `/admin/orders/`, `/admin/orders/users/:userId`, `/admin/orders/view/:orderId`, `/admin/settings/`, `/admin/settings/language/`, `/admin/settings/audit/` |
| Dispatcher app | `/dispatcher/` |

## Локальний запуск

Потрібні Node.js і PostgreSQL.

```bash
cp frontend/driverApp/.env.example frontend/driverApp/.env
cp backend/.env.example backend/.env
npm install
npm --prefix backend install
npm run db:generate
npm run db:migrate
npm run dev
```

Після старту:

- frontend: `http://localhost:5173`
- admin: `http://localhost:4174/admin/`
- dispatcher: `http://localhost:4175/dispatcher/`
- backend: `http://localhost:3001`
- основний mount-point застосунку: `/`

`npm install` на корені також підключає git hooks. Якщо потрібно запустити їх окремо, використовуйте `npm run hooks:install`.

## Змінні середовища

### Frontend (`.env`)

| Variable | Обов’язково | Призначення |
| --- | --- | --- |
| `VITE_API_BASE_URL` | так | Базовий URL API, наприклад `http://localhost:3001/api` |
| `VITE_API_KEY` | ні | Публічний ключ заголовка `X-API-KEY`, якщо він увімкнений на backend |
| `VITE_GOOGLE_MAPS_API_KEY` | ні | Публічний ключ Google Maps Places для автокомпліту адрес |
| `VITE_SUPPORT_WHATSAPP_URL` | ні | Посилання для ручного підтвердження оплати |
| `VITE_SUPPORT_TELEGRAM_URL` | ні | Додаткове посилання підтримки |
| `VITE_ADMIN_APP_URL` | ні | Повний URL або path до admin app, якщо вона окремо від driver app |
| `VITE_DRIVER_APP_URL` | ні | Повний URL або path до driver app, якщо вона відкривається з admin app |

Фронтенд-env файли зберігаються в `frontend/driverApp/.env` та `frontend/driverApp/.env.example`.
Для локальної admin app використовуйте `npm run dev:admin` і окремий `VITE_ADMIN_APP_URL`, наприклад `http://localhost:4174/admin/accounts`. У production на одному домені краще використовувати same-origin path на кшталт `/admin/accounts`.

### Backend (`backend/.env`)

| Variable | Обов’язково | Призначення |
| --- | --- | --- |
| `AUTH_TOKEN_SECRET` | так | Секрет для підпису access token |
| `DATABASE_URL` | так | Runtime connection до PostgreSQL через Prisma |
| `DIRECT_DATABASE_URL` | ні | Direct DB connection для Prisma CLI та runtime fallback |
| `API_KEY` | ні | Перевірка `X-API-KEY` на backend |
| `CLIENT_ORIGIN` | ні | CORS origin override, can be a comma-separated list for local apps |
| `BACKEND_PORT` | ні | Порт сервера, за замовчуванням `3001` |

Додаткові параметри cookie, auth windows і rate limits описані у `backend/.env.example`.

## Скрипти

| Команда | Що робить |
| --- | --- |
| `npm run dev` | Запускає driver app, admin app, dispatcher app і backend одночасно |
| `npm run dev:client` | Запускає лише Vite frontend |
| `npm run dev:admin` | Запускає лише Vite admin frontend на окремому порті |
| `npm run dev:dispatcher` | Запускає лише Vite dispatcher frontend на окремому порті |
| `npm run dev:server` | Запускає лише backend |
| `npm run build` | Збирає production build driver, admin і dispatcher у `dist/` |
| `npm run build:driver` | Збирає production build driver app у `dist/` |
| `npm run build:admin` | Збирає production build admin app у `dist/admin/` |
| `npm run build:dispatcher` | Збирає production build dispatcher app у `dist/dispatcher/` |
| `npm run preview` | Локальний preview зібраного frontend |
| `npm run db:generate` | `prisma generate` у `backend/` |
| `npm run db:migrate` | Локальна Prisma migration |
| `npm run db:migrate:deploy` | Deployment migration для production |
| `npm run admin:create -- --email=...` | Створює або підвищує admin-акаунт |
| `npm run secrets:check` | Сканує tracked files на випадкові секрети |

## API

### Public

- `GET /api/health`
- `GET /api/plans`
- `POST /api/contracts/get-pdf`

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

### My account

- `GET /api/me`
- `GET /api/me/usage`
- `PATCH /api/me/profile`
- `POST /api/me/subscription/upgrade-request`
- `DELETE /api/me`

### Orders

- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/:id`
- `PATCH /api/orders/:id`

### Manager / Admin

- `GET /api/manager/users`
- `GET /api/manager/users/:id`
- `PATCH /api/manager/users/:id/subscription`
- `POST /api/manager/users/:id/subscription/extend`
- `POST /api/manager/users/:id/subscription/cancel`
- `POST /api/manager/users/:id/subscription/confirm-payment`
- `PATCH /api/manager/users/:id/role` - `admin` only
- `GET /api/manager/plans`
- `POST /api/manager/plans`
- `PATCH /api/manager/plans/:id`
- `GET /api/manager/orders`
- `GET /api/manager/audit`

## Операційні правила

- public signup завжди створює `user`
- public signup завжди стартує на `plan-free`
- paid-плани залишаються pending, доки менеджер не підтвердить оплату
- self-service зміна плану вимкнена навмисно
- backend у production працює лише через Prisma + PostgreSQL
- `GET /api/health` повертає `503`, якщо PostgreSQL недоступний
- login і register мають brute-force lockouts та audit logging
- backend не стартує без реального `AUTH_TOKEN_SECRET`

## Деплой

### Frontend на Netlify

Один Netlify site:

- `/` -> driver app
- `/admin/` -> admin app
- `/dispatcher/` -> dispatcher app

- install command: `npm install`
- build command: `npm run build`
- publish directory: `dist`
- required env: `VITE_API_BASE_URL`
- optional env: `VITE_API_KEY`, `VITE_GOOGLE_MAPS_API_KEY`, `VITE_SUPPORT_WHATSAPP_URL`, `VITE_SUPPORT_TELEGRAM_URL`, `VITE_ADMIN_APP_URL`, `VITE_DRIVER_APP_URL`

Netlify rewrites:

- `/admin/*` -> `/admin/index.html`
- `/dispatcher/*` -> `/dispatcher/index.html`
- `/*` -> `/index.html`

### Backend на Render або іншому Node-host

- root directory: `backend`
- install command: `npm install`
- release command: `npm run db:migrate:deploy`
- start command: `npm run start`
- required env: `AUTH_TOKEN_SECRET`, `DATABASE_URL`
- optional env: `API_KEY`, `DIRECT_DATABASE_URL`
- health check: `/api/health`

## Модель даних

| Model | Призначення |
| --- | --- |
| `users` | Акаунти, ролі, профіль |
| `sessions` | Refresh-сесії |
| `plans` | Каталог планів |
| `subscriptions` | Статус підписки, цикл, квота, pending upgrade |
| `orders` | Збережені замовлення та payload для PDF |
| `audit_logs` | Події auth, профілю, підписок, планів і замовлень |

## Ліцензія

ISC
