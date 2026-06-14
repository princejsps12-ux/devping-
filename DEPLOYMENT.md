# Deploying DevPing on Render

Everything runs on Render: **two Web Services** (backend API + Next.js frontend), plus a **PostgreSQL** database and a **Key Value (Redis)** instance. The ping worker runs **in-process** inside the backend Web Service, so you don't need a separate worker service.

```
devping-web (Next.js)  ──►  devping-api (Express + worker)  ──►  devping-db (PostgreSQL)
                                                            ──►  devping-redis (Key Value)
```

Email (Resend) and AI (Groq) are optional — leave their keys blank and the app still runs.

---

## 0. Push to GitHub

Render deploys from a Git repo. The repo root should be `devping/` (the folder with `backend/`, `frontend/`, and `render.yaml`). `.env` files are gitignored; `backend/prisma/migrations/` **is** committed.

> If you push the parent folder instead, prefix every `rootDir` in `render.yaml` with `devping/`.

---

## Fast path — Blueprint (recommended)

1. Render dashboard → **New → Blueprint** → select your repo. Render reads [`render.yaml`](./render.yaml) and creates all four resources.
2. Click **Apply**. Wait for `devping-db` and `devping-redis` to come up, then the two web services build.
3. Once URLs exist, set the values marked `sync: false` (steps 4–5 below), then redeploy the affected service.

Then jump to **step 4**.

---

## Manual path — create each service yourself

Do them in this order so URLs are available when you need them.

### 1. PostgreSQL
- **New → PostgreSQL**. Name `devping-db`, plan **Free**. Create it.
- Copy its **Internal Database URL** (you'll reference it as `DATABASE_URL`).

### 2. Key Value (Redis)
- **New → Key Value**. Name `devping-redis`, plan **Free**, IP allow list **empty** (internal only). Create it.
- Copy its **Internal Connection URL** (`REDIS_URL`).

### 3. Backend API — Web Service
- **New → Web Service** → your repo.
- **Root Directory**: `backend`
- **Runtime**: Node
- **Build Command**: `npm install && npm run prisma:generate && npm run build`
- **Start Command**: `npm start`
- **Health Check Path**: `/api/health`
- **Pre-Deploy Command** (Settings): `npm run prisma:deploy`  ← runs DB migrations
- **Environment** variables:

  | Key | Value |
  | --- | ----- |
  | `NODE_ENV` | `production` |
  | `DATABASE_URL` | Internal URL from step 1 |
  | `REDIS_URL` | Internal URL from step 2 |
  | `JWT_SECRET` | a long random string |
  | `CORS_ORIGIN` | *(set in step 5 — the frontend URL)* |
  | `APP_URL` | *(set in step 5 — the frontend URL)* |
  | `RESEND_API_KEY` | optional (email alerts) |
  | `EMAIL_FROM` | optional, e.g. `DevPing <alerts@yourdomain.com>` |
  | `GROQ_API_KEY` | optional (AI analysis) |
  | `GROQ_MODEL` | `llama-3.3-70b-versatile` |

  > Don't set `PORT` — Render injects it and the app binds to it automatically.
  > Leave `RUN_WORKER` unset so the worker runs in-process. (Set it to `false` only if you add a separate worker service.)

- Create it. Note the URL, e.g. `https://devping-api.onrender.com`.

### 4. Frontend — Web Service
- **New → Web Service** → same repo.
- **Root Directory**: `frontend`
- **Runtime**: Node
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment** variables:

  | Key | Value |
  | --- | ----- |
  | `NODE_ENV` | `production` |
  | `NEXT_PUBLIC_API_URL` | `https://devping-api.onrender.com/api` (your API URL + `/api`) |

- Create it. Note the URL, e.g. `https://devping-web.onrender.com`.

### 5. Close the loop (CORS + links)
- On **devping-api**, set `CORS_ORIGIN` and `APP_URL` to the frontend URL (`https://devping-web.onrender.com`) and **Manual Deploy → Deploy latest commit**.
- `NEXT_PUBLIC_API_URL` is baked at build time — if you change it, redeploy the frontend.

---

## 6. Verify

- `https://devping-api.onrender.com/api/health` → `{ "status": "ok" }`
- Open the frontend URL → sign up → add a monitor. Within ~60s the API logs show `[worker] ✓ … UP …` and the dashboard + chart populate.
- Optional: Resend → down/recovery emails; Groq → "Analyze now" returns a risk level.

---

## Notes & gotchas

- **Free Web Services sleep after ~15 min idle.** Because the worker runs inside the backend Web Service, **checks pause while it's asleep** and resume when the next request wakes it. For continuous monitoring, use a paid instance (or a small external keep-alive that pings `/api/health`). Free PostgreSQL also expires after ~30 days.
- **`prisma migrate deploy`** runs via the API's Pre-Deploy Command on every deploy and applies the committed migrations. New schema changes: `npx prisma migrate dev --name <change>` locally → commit the new folder in `backend/prisma/migrations/`.
- **Redis type**: if your account doesn't show "Key Value", it's the older "Redis" service — same connection string.
- **Scaling the worker** (optional, paid): set `RUN_WORKER=false` on the API and add a **Background Worker** service — Root `backend`, Build same as API, Start `npm run start:worker`, with the same `DATABASE_URL`/`REDIS_URL` env.
- **Local stack**: `docker compose up -d` (Postgres + Redis) — see [docker-compose.yml](./docker-compose.yml).
