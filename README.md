# Authbox TS

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22+-green)](https://nodejs.org/)

A production-ready authentication boilerplate for Node.js. Clone, configure, and ship—without reinventing auth.

---

## The Problem

Building auth from scratch is tedious and risky. You need:

- Email/password with secure hashing
- OAuth (Google, GitHub, etc.) with account linking
- Email verification and password reset
- Session management, refresh token rotation
- Background jobs for emails
- A structure that scales as you add features

Most boilerplates are either too minimal (no OAuth, no queues) or too opinionated. Authbox TS gives you a **complete, battle-tested auth layer** with a **clean architecture** you can extend.

---

## How It Solves It

1. **Out-of-the-box auth** — Register, login, OAuth, email verification, password reset. All wired and tested.
2. **Event-driven emails** — BullMQ + Redis. OTPs, welcome emails, password resets run in workers. Your API stays fast.
3. **Pragmatic architecture (PDDA)** — Controllers → Services → Repositories. No framework lock-in. Business logic never touches HTTP.
4. **Extensible design** — Add providers (GitHub, Twitter), new queues, or modules without touching core code.
5. **Production-ready defaults** — Argon2, JWT rotation, account enumeration prevention, short-lived reset tokens.

---

## Tech Stack & Why

| Layer           | Choice            | Why                                          |
| --------------- | ----------------- | -------------------------------------------- |
| **Runtime**     | Node.js 22+       | LTS, native fetch, performant                |
| **Framework**   | Express 5         | Minimal, widely used, easy to reason about   |
| **Language**    | TypeScript 5      | Type safety, better DX, fewer runtime bugs   |
| **DI**          | tsyringe          | Lightweight, decorator-based, testable       |
| **Database**    | PostgreSQL + Knex | SQL flexibility, migrations, no ORM overhead |
| **Cache/Queue** | Redis + BullMQ    | Reliable queues, cooldowns, session cache    |
| **Validation**  | Zod 4             | Schema-first, type inference, runtime safety |
| **Hashing**     | Argon2id          | OWASP-recommended, resistant to GPU attacks  |

---

## Features

### Auth

- **Email/Password** — Register, login, logout, refresh token rotation
- **OAuth** — Google (extensible to GitHub, Twitter) with account linking by email
- **Email Verification** — OTP-based, 60s resend cooldown, queued delivery
- **Password Reset** — OTP ownership verification, 10-min single-use reset token
- **Sessions** — JWT access + refresh, session storage, tier-based limits, list & revoke

### Users

- **Profile** — GET/PATCH /me with username (3–30 chars, alphanumeric + underscore, unique)
- **Avatar** — Presigned URL upload (MinIO/S3), shareable read link, delete. Toggle via `FILE_UPLOADS_ENABLED`

### Security

- **Argon2id** — Password hashing
- **Account Enumeration Prevention** — Same response for invalid email/password
- **Short-lived Tokens** — Reset tokens expire quickly to limit hijacking risk

### Infrastructure

- **Background Jobs** — BullMQ workers for email verification, welcome emails, password reset
- **Separate Queues** — Each use case has its own queue; no cross-interference
- **Health Check** — `/health` for load balancers and k8s probes

---

## Using This as a Boilerplate

1. **Fork or clone** — Start from a clean slate.
2. **Configure env** — Copy `.env.example`, set `JWT_SECRET`, `FRONTEND_URL`, `BACKEND_URL`, DB credentials.
3. **Run migrations** — `pnpm db:migrate`.
4. **Add your modules** — Follow the same pattern: `modules/<domain>/` with `controllers/`, `services/`, `repositories/`, `routes/`, `schemas/`.
5. **Extend workers** — Add a queue name, processor, and worker definition. See [ARCHITECTURE.md](ARCHITECTURE.md#4-workers-background-jobs).
6. **Wire OAuth** — Add provider IDs for GitHub, Twitter in env; register providers in the OAuth registry.
7. **Customize** — Replace `ConsoleMailer` with Nodemailer/SendGrid for production emails.
8. **File uploads (optional)** — Set `FILE_UPLOADS_ENABLED=true`, create bucket `authbox-uploads`, configure `S3_ENDPOINT` (or omit for AWS). See avatar endpoints at `/docs`.

The architecture is designed so you can add features without refactoring. Controllers stay thin; services hold logic; repositories handle data.

---

## Scale & Efficiency

### Rough Throughput (Single Node)

| Scenario                      | Est. RPS     | Notes                    |
| ----------------------------- | ------------ | ------------------------ |
| Health check                  | ~5,500–6,000 | No DB, Express + Node 22 |
| JWT verify + session lookup   | ~3,000–4,000 | Redis-backed session     |
| Login (Argon2 + DB + session) | ~200–400     | Argon2 is CPU-bound      |
| Register                      | ~150–300     | Similar to login         |
| Profile read (cached)         | ~2,000–3,000 | Redis cache              |

### Why It’s Efficient

- **Stateless API** — JWT + Redis; no sticky sessions
- **Connection pooling** — Knex pool (default 20) for PostgreSQL
- **Background jobs** — Emails don’t block HTTP
- **Node clustering** — `server.ts` forks workers across CPU cores

### Scaling Up

- **Single node** — ~2,000–3,000 sustained RPS for typical auth + profile
- **4-core cluster** — ~8,000–12,000 RPS for read-heavy traffic
- **Horizontal** — Add more API nodes behind a load balancer; Redis and PostgreSQL scale independently
- **Bottlenecks** — Argon2 (CPU), PostgreSQL (connections); Redis is rarely the limit

_These are estimates. We’ll refine them with benchmarks._

---

## Local Development

### Prerequisites

- Node.js 22+
- pnpm
- PostgreSQL
- Redis

### Setup

```bash
git clone https://github.com/devnadeemashraf/authbox-ts.git
cd authbox-ts

pnpm install
cp .env.example .env
# Edit .env: JWT_SECRET, FRONTEND_URL, BACKEND_URL, POSTGRES_PASSWORD

pnpm db:migrate
pnpm dev
```

In another terminal (for background jobs):

```bash
pnpm worker
```

### Scripts

| Command                    | Description             |
| -------------------------- | ----------------------- |
| `pnpm dev`                 | Dev server (tsx watch)  |
| `pnpm worker`              | BullMQ workers          |
| `pnpm build`               | Production build        |
| `pnpm start`               | Run production build    |
| `pnpm db:migrate`          | Run migrations          |
| `pnpm db:migrate:rollback` | Rollback last migration |
| `pnpm db:seed`             | Run seeds               |
| `pnpm type-check`          | TypeScript check        |
| `pnpm lint`                | ESLint                  |
| `pnpm test`                | Jest                    |

---

## Production Deployment

### Checklist

1. **Environment**
   - Set `NODE_ENV=production`
   - Use strong `JWT_SECRET` (e.g. `openssl rand -base64 32`)
   - Set `FRONTEND_URL` and `BACKEND_URL` to HTTPS URLs
   - Configure `POSTGRES_SSL_MODE=verify-full` if using a managed DB

2. **Database**
   - Run migrations: `pnpm db:migrate`
   - Ensure connection pool fits your load (`DATABASE_POOL_MAX`)

3. **Redis**
   - Run Redis (or use a managed service)
   - Set `REDIS_PASSWORD` in production

4. **Workers**
   - Set `RUN_WORKERS=true` to spawn workers with the API, or run `pnpm worker` as a separate process

5. **Process**
   - Build: `pnpm build`
   - Start: `pnpm start` or `node dist/server.js`
   - Use a process manager (PM2, systemd) or container (Docker)

6. **Reverse Proxy**
   - Put NGINX/Traefik in front
   - Set `TRUST_PROXY=true` if behind a proxy

### Docker (Example)

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

Run PostgreSQL and Redis separately (or use docker-compose).

---

## API Documentation

Interactive API docs (Swagger UI) are available at **`/docs`** when the server is running (e.g. `http://localhost:3000/docs` in development or `https://your-api.com/docs` in production). Try endpoints directly from the browser.

---

## Documentation

- **API Docs** — Available at `/docs` when the server is running (Swagger UI)
- [ARCHITECTURE.md](ARCHITECTURE.md) — PDDA, folder structure, workers, layer breakdown
- [CONTRIBUTING.md](CONTRIBUTING.md) — How to contribute
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) — Community guidelines

---

## License

MIT — see [LICENSE](LICENSE).
