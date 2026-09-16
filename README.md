# RakshAI — MVP

Unified **cyber risk, trust & exposure** platform. A buyer (CISO) discovers vendors, invites them, collects a security questionnaire, generates an **AI risk summary**, and approves or requests remediation — with a monitoring view over the whole portfolio.

Built across a 4-week sprint (see [`docs/planning/RakshAI_MVP_Sprint_Tracker.xlsx`](docs/planning/RakshAI_MVP_Sprint_Tracker.xlsx)).

## Stack

- **Next.js 14** (App Router) — frontend + API routes in one repo
- **PostgreSQL + Prisma** — database and type-safe ORM (Neon serverless)
- **NextAuth.js** — dual-role auth (BUYER / VENDOR), JWT sessions
- **OpenAI** via the **Vercel AI SDK** (`ai` + `@ai-sdk/openai`) — structured risk summaries
- **Recharts** — monitoring charts
- **Tailwind CSS** — styling
- **Deployment** — Vercel + Neon (see [`docs/operations/DEPLOYMENT.md`](docs/operations/DEPLOYMENT.md))

## Features

**Buyer (CISO)**
- Dashboard: vendor inventory with risk tier, AI exposure, status; search + tier filter
- Vendor detail: profile, timeline, full questionnaire responses
- **AI risk summary** — executive summary, top 3 risks, gaps, and a risk tier, generated from questionnaire answers
- Approve vendor / request remediation (with note + email notification)
- CSV bulk vendor import
- Vendor invite flow (tokenized email link)
- Monitoring: risk trend, tier distribution, top open action items

**Vendor**
- Invite-link registration → account linked to a vendor record
- NDA acceptance (timestamped) with a hard gate before further access
- Security questionnaire (4 config-driven sections, autosave, progress, submit)
- Onboarding tracker

## Getting started

### 1. Install
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Fill in `.env`:

| Var | Required | Notes |
|-----|----------|-------|
| `DATABASE_URL` | ✅ | Neon Postgres connection string |
| `NEXTAUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | ✅ | `http://localhost:3000` in dev |
| `BUYER_INVITE_CODE` | ✅ | gates buyer signup (`openssl rand -hex 16`) |
| `OPENAI_API_KEY` | optional | omit → deterministic **dev stub** for AI summaries |
| `OPENAI_MODEL` | optional | default `gpt-4o-mini` |
| `RESEND_API_KEY` | optional | omit → invites/emails **log to the server console** |
| `MAIL_FROM` | optional | verified sender for real email |

### 3. Database
```bash
npm run db:push    # sync schema
npm run db:seed    # buyer + vendors + realistic demo data
```

### 4. Run
```bash
npm run dev        # http://localhost:3000
```

## Login credentials (seeded)

| Role | Email | Password |
|------|-------|----------|
| Buyer / CISO | `ciso@acme.com` | `password123` |
| Vendor (CloudFlow) | `vendor@cloudflow.io` | `password123` |

## Commands

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build (runs `prisma generate`) |
| `npm run start` | Serve the production build |
| `npm run db:push` | Sync schema to database |
| `npm run db:seed` | Seed demo data (idempotent) |
| `npm run db:studio` | Prisma Studio (visual DB browser) |

## Project structure

```
src/
  app/
    login/  register/            # auth pages (role selector on register)
    error.tsx  not-found.tsx     # error boundary + 404
    buyer/
      layout.tsx                 # sidebar + mobile bar + session guard
      dashboard/                 # vendor table + stat cards
      monitoring/                # Recharts: trend, tier pie, action items
      vendors/[id]/              # vendor detail + AI summary + review actions
    vendor/
      layout.tsx                 # role guard + NDA gate
      onboard/                   # NDA accept + onboarding steps
      questionnaire/             # 4-section questionnaire
    api/
      auth/  register/           # NextAuth + user creation (+ invite linking)
      vendors/                   # GET/POST list, [id] GET/PATCH
      vendors/import/            # CSV bulk import
      vendors/[id]/invite/       # tokenized invite + email
      vendors/[id]/review/       # approve / request remediation + email
      invite/[token]/            # validate invite link
      nda/accept/                # record NDA acceptance
      questionnaire/             # GET/PATCH draft, POST submit
      risk-summary/[vendorId]/   # generate + store AI risk summary
  components/                    # sidebar, tables, forms, charts, panels
  lib/
    prisma.ts  auth.ts  utils.ts
    rate-limit.ts                # in-memory limiter (login/register/invite)
    invite.ts                    # tokens (sha256 hash at rest)
    mailer.ts                    # Resend + dev console fallback
    questionnaire-config.ts      # 4-section config (UI + validation source)
    risk-summary.ts              # prompt + OpenAI generateObject + dev stub
  middleware.ts                  # role guards + x-pathname for NDA gate
prisma/
  schema.prisma                  # models: User, Vendor, VendorInvite, Nda,
                                 #         Questionnaire, RiskSummary
  seed.ts                        # buyer, vendors, demo states
```

## AI risk summaries

`src/lib/risk-summary.ts` builds a prompt from the vendor's questionnaire and calls OpenAI via `generateObject` (validated structured output: summary, top risks, gaps, tier). Without `OPENAI_API_KEY` it falls back to a deterministic **dev stub** so the full flow works offline. Results are stored in `RiskSummary` and the tier is mirrored onto the vendor.

## Security notes

- Passwords: bcrypt. Buyer signup gated by a server-side invite code (constant-time compare).
- Invite tokens: random, **sha256-hashed at rest**, 7-day expiry, single-use.
- Route guards: middleware enforces role; the vendor layout enforces the NDA gate with a fresh DB read (edge middleware can't run Prisma).
- Rate limiting on login / register / invite (in-memory — swap for Redis at scale).

## Documentation

Full docs live in [`docs/`](docs/README.md).

| Doc | What it covers |
|-----|----------------|
| [Knowledge transfer](docs/onboarding/RakshAI_KT.md) | **Start here if you're new** — product, architecture decisions, done vs remaining, roadmap |
| [API contracts](docs/architecture/API_CONTRACTS.md) | Request/response shapes for every endpoint |
| [Architecture decisions](docs/architecture/WEEK2_PLAN.md) | Why the NDA gate isn't middleware, why invite tokens are hashed, etc. |
| [Deployment](docs/operations/DEPLOYMENT.md) | Vercel + Neon production checklist |
| [Demo script](docs/operations/DEMO_SCRIPT.md) | 5-7 min buyer + vendor walkthrough |
| [Sprint tracker](docs/planning/RakshAI_MVP_Sprint_Tracker.xlsx) | 28-task planner, per-person boards, progress |

## Demo & deployment

- **Demo walkthrough:** [`docs/operations/DEMO_SCRIPT.md`](docs/operations/DEMO_SCRIPT.md)
- **Production deploy (Vercel):** [`docs/operations/DEPLOYMENT.md`](docs/operations/DEPLOYMENT.md)

## Sprint status

Weeks 1–3 complete; Week 4 complete except the live Vercel deploy ([`DEPLOYMENT.md`](docs/operations/DEPLOYMENT.md) ready). See [`docs/planning/RakshAI_MVP_Sprint_Tracker.xlsx`](docs/planning/RakshAI_MVP_Sprint_Tracker.xlsx).
