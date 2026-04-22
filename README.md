# DocTra / pdfApp

> Workspace для приватних водіїв і невеликих transfer-команд. Створюйте PDF-договори, зберігайте замовлення, стежте за лімітом плану та керуйте підписками в одному застосунку.

## Що це

DocTra побудований як split-stack система:

| Частина | Що робить |
| --- | --- |
| Frontend | Мультисторінковий Vite-застосунок у `src/`, який працює під `/cz/pdf/` |
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
- manager/admin workspace для користувачів, підписок, планів, замовлень і аудиту
- PWA-обгортка зі splash screen, manifest та іконками

## Ролі

| Роль | Доступ |
| --- | --- |
| `user` | Створення замовлень, власний профіль, статистика, історія, запит апгрейду |
| `manager` | Керування користувачами, підписками, планами, замовленнями та audit log |
| `admin` | Усе з `manager` + зміна ролей користувачів |

## Поточний набір планів

| Plan | Ліміт на місяць | Ціна |
| --- | --- | --- |
| `plan-free` | 10 | 0 CZK |
| `plan-25` | 25 | 299 CZK |
| `plan-50` | 50 | 499 CZK |
| `plan-100` | 100 | 899 CZK |

Усі плани підтримують обидва типи документів:

- `offer`
- `confirmation`

## Структура репозиторію

```text
backend/   API, Prisma schema, migrations, auth, orders, PDF renderer
src/       frontend app
tools/     dev runner, build/postbuild helpers, hooks
dist/      production build output
```

## Основні сторінки

| Зона | Шляхи |
| --- | --- |
| User app | `/cz/pdf/`, `/cz/pdf/orders/`, `/cz/pdf/history/`, `/cz/pdf/stats/`, `/cz/pdf/account/`, `/cz/pdf/settings/` |
| Manager/Admin app | `/cz/pdf/admin/accounts/`, `/cz/pdf/admin/subscriptions/`, `/cz/pdf/admin/orders/`, `/cz/pdf/admin/settings/` |
| Додатковий вхід | `/cz/pdf/manager/` |

## Локальний запуск

Потрібні Node.js і PostgreSQL.

```bash
cp .env.example .env
cp backend/.env.example backend/.env
npm install
npm --prefix backend install
npm run db:generate
npm run db:migrate
npm run dev
```

Після старту:

- frontend: `http://localhost:5173`
- backend: `http://localhost:3001`
- основний mount-point застосунку: `/cz/pdf/`

`npm install` на корені також підключає git hooks. Якщо потрібно запустити їх окремо, використовуйте `npm run hooks:install`.

## Змінні середовища

### Frontend (`.env`)

| Variable | Обов’язково | Призначення |
| --- | --- | --- |
| `VITE_API_BASE_URL` | так | Базовий URL API, наприклад `http://localhost:3001/api` |
| `VITE_API_KEY` | ні | Публічний ключ заголовка `X-API-KEY`, якщо він увімкнений на backend |
| `VITE_SUPPORT_WHATSAPP_URL` | ні | Посилання для ручного підтвердження оплати |
| `VITE_SUPPORT_TELEGRAM_URL` | ні | Додаткове посилання підтримки |

### Backend (`backend/.env`)

| Variable | Обов’язково | Призначення |
| --- | --- | --- |
| `AUTH_TOKEN_SECRET` | так | Секрет для підпису access token |
| `DATABASE_URL` | так | Runtime connection до PostgreSQL через Prisma |
| `DIRECT_DATABASE_URL` | ні | Direct DB connection для Prisma CLI |
| `API_KEY` | ні | Перевірка `X-API-KEY` на backend |
| `CLIENT_ORIGIN` | ні | CORS origin override |
| `BACKEND_PORT` | ні | Порт сервера, за замовчуванням `3001` |

Додаткові параметри cookie, auth windows і rate limits описані у `backend/.env.example`.

## Скрипти

| Команда | Що робить |
| --- | --- |
| `npm run dev` | Запускає frontend і backend одночасно |
| `npm run dev:client` | Запускає лише Vite frontend |
| `npm run dev:server` | Запускає лише backend |
| `npm run build` | Збирає production build у `dist/` |
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

- base directory: repo root
- install command: `npm install`
- build command: `npm run build`
- publish directory: `dist`
- required env: `VITE_API_BASE_URL`
- optional env: `VITE_API_KEY`, `VITE_SUPPORT_WHATSAPP_URL`, `VITE_SUPPORT_TELEGRAM_URL`

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
