# DevPing

**Uptime monitoring for developers.** Monitor your services, get alerted the moment they go down, predict downtime with AI, and share a public status page — all in a clean, fast dashboard.

DevPing runs multi-region health checks on a distributed queue, opens/resolves incidents automatically, emails you on status changes, and uses an LLM to flag instability *before* it becomes an outage.

---

## Features

- 🟢 **Real-time monitoring** — scheduled HTTP health checks backed by a **BullMQ** queue with auto-retry (2 retries per check).
- 🌍 **Multi-region checks** — every check runs from multiple simulated regions (`us-east`, `eu-west`); a monitor is only marked **DOWN** when *all* regions fail, eliminating false positives.
- 🤖 **AI anomaly detection** — **Groq + LLaMA 3.3** analyzes recent response-time trends and returns a downtime-risk level (`low`/`medium`/`high`) with a reason.
- 📈 **Analytics** — uptime % (24h / 7d / 30d), average response time, and a response-time chart with downtime overlays (Recharts).
- 🚨 **Incident tracking + email alerts** — incidents open/resolve automatically; **Resend** sends professional HTML down/recovery emails (with downtime duration).
- 🌐 **Public status page** — a clean, shareable `/status/:username` page (status.io style) with overall status and per-monitor uptime bars.
- 🔖 **Embeddable SVG badges** — shields.io-style `![status](…/api/badge/:id)` live badges for READMEs.
- 🌓 **Polished UI** — Next.js App Router, Tailwind, dark/light themes, Geist font, responsive, with loading/empty/error states throughout.

---

## Tech stack

| Layer        | Tech |
| ------------ | ---- |
| Frontend     | Next.js 14 (App Router), TypeScript, TailwindCSS, TanStack Query, Zustand, Recharts, next-themes |
| Backend      | Node.js, Express, TypeScript |
| Database     | PostgreSQL via Prisma |
| Queue/Worker | BullMQ + Redis (ioredis) |
| AI           | Groq SDK (LLaMA 3.3) |
| Email        | Resend |
| Auth         | JWT + bcrypt |

---

## Architecture

```
                ┌──────────────┐      REST/JWT      ┌─────────────────┐
   Browser ───► │  Next.js app │ ◄────────────────► │  Express API    │
                └──────────────┘                    │  (:5000)        │
                                                     └───────┬─────────┘
                                                             │ Prisma
                                          ┌──────────────────▼───────────┐
                                          │        PostgreSQL             │
                                          └──────────────────▲───────────┘
                                                             │
   ┌──────────────┐  repeatable "dispatch" job   ┌───────────┴───────────┐
   │   BullMQ      │ ───────────────────────────► │  Worker               │
   │  (Redis)      │  fans out "check" jobs        │  • multi-region check │
   │               │ ◄──────────────────────────  │  • incidents + email  │
   └──────────────┘                                │  • writes pings       │
                                                   └───────────────────────┘
```

- A repeatable **dispatch** job fires every 60s and enqueues a **check** job per active monitor.
- The **worker** runs each check from all regions, writes a `Ping`, and opens/resolves incidents (with email alerts) on status transitions.
- A separate cron re-runs **AI analysis** every 10 minutes (when `GROQ_API_KEY` is set).

The worker can run **in-process** with the API (default) or as a **dedicated process** for horizontal scaling — see `src/worker.ts` and `RUN_WORKER`.

---

## Project structure

```
devping/
├── backend/
│   ├── prisma/schema.prisma     # User, Monitor, Ping, Incident
│   └── src/
│       ├── config/              # env, prisma client
│       ├── controllers/         # auth, monitor, public (status + badge)
│       ├── middleware/          # requireAuth
│       ├── queue/               # BullMQ connection, queue/scheduler, worker
│       ├── services/            # pinger (multi-region check), email, anomaly (AI)
│       ├── utils/               # validation (zod), jwt, username, time
│       ├── index.ts             # API + in-process worker
│       └── worker.ts            # standalone worker entrypoint
└── frontend/
    └── src/
        ├── app/                 # /, /login, /signup, /dashboard, /dashboard/monitors/[id], /status/[username]
        ├── components/          # ui/ primitives, dashboard/, public/, Navbar, ThemeToggle…
        ├── hooks/               # useAuth, useMonitors, usePublicStatus
        ├── lib/                 # axios, config, types, utils
        └── store/               # zustand auth store
```

---

## Local setup

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis (for the ping queue)

The quickest way to get Postgres + Redis locally (see [docker-compose.yml](./docker-compose.yml)):

```bash
docker compose up -d
```

### Backend

```bash
cd backend
cp .env.example .env          # set DATABASE_URL, JWT_SECRET, REDIS_URL (+ optional keys)
npm install
npm run prisma:generate
npm run prisma:migrate        # create tables (requires a running DB)
npm run dev                   # API + in-process worker → http://localhost:5000
```

To run the worker as its own process (optional, for scale): set `RUN_WORKER=false` on the API and run:

```bash
npm run dev:worker            # or `npm run start:worker` in production
```

### Frontend

```bash
cd frontend
cp .env.example .env.local    # NEXT_PUBLIC_API_URL defaults to http://localhost:5000/api
npm install
npm run dev                   # http://localhost:3000
```

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `PORT` | no | API port (default `5000`) |
| `NODE_ENV` | no | `development` / `production` |
| `CORS_ORIGIN` | no | Comma-separated allowed origins (default `http://localhost:3000`) |
| `DATABASE_URL` | **yes** | PostgreSQL connection string |
| `REDIS_URL` | **yes** | Redis connection string for BullMQ |
| `JWT_SECRET` | **yes** | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | no | Token lifetime (default `7d`) |
| `RUN_WORKER` | no | `false` to disable the in-process worker (default runs it) |
| `RESEND_API_KEY` | no | Resend key; alerts are skipped (logged) if unset |
| `EMAIL_FROM` | no | From address for alert emails |
| `APP_URL` | no | Frontend URL used in email links |
| `GROQ_API_KEY` | no | Groq key; AI analysis returns 503 if unset |
| `GROQ_MODEL` | no | Default `llama-3.3-70b-versatile` |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `NEXT_PUBLIC_API_URL` | **yes** | Backend API base, e.g. `https://api.yourdomain.com/api` |

---

## API

All `/api/monitors/*` routes require `Authorization: Bearer <token>` and are scoped to the authenticated user.

| Method | Route | Auth | Description |
| ------ | ----- | ---- | ----------- |
| GET | `/api/health` | — | Health check |
| POST | `/api/auth/signup` | — | Create account → `{user, token}` |
| POST | `/api/auth/login` | — | Log in → `{user, token}` |
| GET | `/api/auth/me` | JWT | Current user |
| POST | `/api/monitors` | JWT | Create monitor |
| GET | `/api/monitors` | JWT | List monitors |
| GET | `/api/monitors/:id` | JWT | Get one monitor |
| PATCH | `/api/monitors/:id` | JWT | Update (name, interval, isActive, isPublic) |
| DELETE | `/api/monitors/:id` | JWT | Delete (cascades pings/incidents) |
| GET | `/api/monitors/:id/stats` | JWT | Status + uptime (24h/7d/30d) + avg response |
| GET | `/api/monitors/:id/pings?range=24h` | JWT | Ping history for charts |
| GET | `/api/monitors/:id/incidents` | JWT | Incident history |
| GET | `/api/monitors/:id/anomaly` | JWT | Run AI anomaly analysis |
| GET | `/api/public/status/:username` | — | Public status data |
| GET | `/api/badge/:monitorId` | — | SVG status badge |

---

## Deployment

Everything runs on **Render**: two Web Services (backend API + Next.js frontend), a PostgreSQL database, and a Key Value (Redis) instance. The ping worker runs in-process inside the backend service.

> **One-click:** the [`render.yaml`](./render.yaml) blueprint provisions all four resources. **[`DEPLOYMENT.md`](./DEPLOYMENT.md)** has the full click-by-click walkthrough (blueprint + manual).

| Resource | Render type | Root | Build | Start |
| -------- | ----------- | ---- | ----- | ----- |
| `devping-db` | PostgreSQL | — | — | — |
| `devping-redis` | Key Value | — | — | — |
| `devping-api` | Web Service | `backend` | `npm install && npm run prisma:generate && npm run build` | `npm start` |
| `devping-web` | Web Service | `frontend` | `npm install && npm run build` | `npm start` |

- **API** also needs Pre-Deploy `npm run prisma:deploy`, Health Check `/api/health`, and env: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `CORS_ORIGIN` + `APP_URL` (the frontend URL), plus optional `RESEND_API_KEY` / `GROQ_API_KEY`. Leave `RUN_WORKER` unset (worker runs in-process); don't set `PORT`.
- **Frontend** needs `NEXT_PUBLIC_API_URL` = the API URL + `/api` (baked at build time).
- *Optional (paid, for scale):* split the worker into a Background Worker (`npm run start:worker`) and set `RUN_WORKER=false` on the API.

> **Email/AI in production:** add a verified domain in Resend for `EMAIL_FROM`, and a Groq API key for live AI analysis. Both degrade gracefully when their keys are absent.

---

## Scripts

**Backend**: `dev`, `dev:worker`, `build`, `start`, `start:worker`, `prisma:generate`, `prisma:migrate`, `prisma:studio`
**Frontend**: `dev`, `build`, `start`, `lint`
