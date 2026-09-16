# RakshAI — Knowledge Transfer (KT) Document

**Audience:** engineers/PMs taking over or joining the RakshAI MVP
**Repo:** `rakshai` · branch `main` · Next.js 14 App Router (frontend + API in one project)
**Sprint window:** Jul 3 – Jul 30, 2026 (4 weeks, 3 people)
**Status at handover:** Weeks 1–3 complete. Week 4 complete except the live Vercel deploy + custom domain.

---

## 1. What RakshAI is

A unified **third-party cyber risk, trust & AI-exposure platform**.

A **buyer (CISO)** discovers vendors → invites them → collects a security questionnaire → gets an **AI-generated risk summary** → approves or requests remediation — with a **monitoring** view across the whole vendor portfolio.

A **vendor** receives an invite → registers → accepts an NDA → completes a 4-section security questionnaire → is reviewed.

### The core loop (memorize this — everything maps to it)

```
DISCOVERED → INVITED → NDA_SIGNED → QUESTIONNAIRE_SENT → PENDING_REVIEW → APPROVED
                                                                        ↘ REMEDIATION
                                                                        ↘ OFFBOARDED (future)
```

That chain is literally the `VendorStatus` enum in `prisma/schema.prisma`. Every feature moves a vendor one step along it.

---

## 2. Product phase model (important for roadmap questions)

The product is scoped in 8 phases. The MVP deliberately ships **Phases 1, 2, 3 + a Phase 5 stub**. Phases 4, 6, 7, 8 are visible in the buyer sidebar as **locked "coming soon"** items (`src/components/sidebar.tsx`) — intentional roadmap signalling, not dead links.

| Phase | Name | MVP state |
|-------|------|-----------|
| 1 | Vendor discovery & inventory | ✅ Built (dashboard, CRUD API, CSV import) |
| 2 | Invite + NDA onboarding | ✅ Built (tokenized invite, NDA gate) |
| 3 | Questionnaire + **AI risk summary** + approve/remediate | ✅ Built (the headline feature) |
| 4 | Exposure & AI-SPM | 🔒 Locked — not built |
| 5 | Monitoring | ⚠️ **Stub** — charts render, trend line is seeded not real |
| 6 | Remediation workflow | 🔒 Locked — not built |
| 7 | Continuous Trust | 🔒 Locked — not built |
| 8 | Offboarding | 🔒 Locked — enum value exists, no UI |

---

## 3. Tech stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Next.js 14 App Router** | One repo for UI + API routes; server components let us do auth/DB guards without a separate backend |
| DB | **PostgreSQL (Neon serverless)** | Free tier, branchable, Vercel-friendly |
| ORM | **Prisma 6** | Type-safe; `db push` keeps MVP iteration fast |
| Auth | **NextAuth v4**, Credentials provider, JWT sessions | Dual-role (BUYER / VENDOR) in one system |
| AI | **Vercel AI SDK** (`ai` + `@ai-sdk/openai`), `generateObject` | Schema-validated structured output, not free text |
| Charts | **Recharts** | Monitoring dashboard |
| Styling | **Tailwind CSS** + `lucide-react` icons | |
| CSV | **papaparse** | Bulk vendor import |
| Email | **Resend** (optional) | Falls back to console logging in dev |
| Validation | **Zod** | Every API body + the AI output schema |
| Hosting | Vercel + Neon | See [`DEPLOYMENT.md`](../operations/DEPLOYMENT.md) |

> ⚠️ **Naming gotcha:** the sprint tracker says "Claude API integration". The code actually ships **OpenAI** via the Vercel AI SDK (`@ai-sdk/openai`). The provider is isolated behind one function (`generateRiskSummary` in `src/lib/risk-summary.ts`), so swapping providers is a ~10-line change.

---

## 4. Repository map

```
src/
  app/
    page.tsx  login/  register/        # public entry + auth pages (role selector on register)
    error.tsx  global-error.tsx  not-found.tsx
    buyer/
      layout.tsx                       # sidebar + mobile bar + BUYER session guard
      dashboard/                       # stat cards + vendor table (search + tier filter)
      monitoring/                      # Recharts: trend, tier pie, open action items
      vendors/[id]/                    # vendor detail + AI summary + approve/remediate
    vendor/
      layout.tsx                       # VENDOR role guard + **NDA gate**
      onboard/                         # NDA accept + 3-step onboarding tracker
      questionnaire/                   # 4-section questionnaire, autosave, submit
    api/
      auth/[...nextauth]/              # NextAuth handler
      register/                        # user creation (+ buyer invite code, + vendor invite linking)
      vendors/                         # GET list / POST create   (buyer only)
      vendors/[id]/                    # GET detail / PATCH update
      vendors/import/                  # CSV bulk upsert
      vendors/[id]/invite/             # create tokenized invite + email it
      vendors/[id]/review/             # approve / request remediation + email vendor
      invite/[token]/                  # public: validate an invite token
      nda/accept/                      # record NDA acceptance
      questionnaire/                   # GET / PATCH draft / POST submit
      risk-summary/[vendorId]/         # generate + store AI risk summary
  components/                          # sidebar, vendor-table, questionnaire-form,
                                       # nda-accept-form, risk-review-panel,
                                       # monitoring-charts, vendor-nav, providers
  lib/
    prisma.ts        # singleton client
    auth.ts          # NextAuth options + login rate limit
    rate-limit.ts    # in-memory fixed-window limiter + clientIp()
    invite.ts        # token gen, sha256 hash, invite URL builder
    mailer.ts        # Resend + dev console fallback
    questionnaire-config.ts  # THE single source of truth for questions
    risk-summary.ts  # prompt + OpenAI generateObject + deterministic dev stub
    utils.ts         # cn()
  middleware.ts      # role guards + injects x-pathname header
  types/next-auth.d.ts
prisma/
  schema.prisma      # User, Vendor, VendorInvite, Nda, Questionnaire, RiskSummary
  seed.ts            # idempotent demo data
```

**Docs already in the repo:**
- `README.md` — setup + feature list
- [`docs/architecture/API_CONTRACTS.md`](../architecture/API_CONTRACTS.md) — request/response shapes (written so interns could build UI against mocks before endpoints existed)
- [`docs/architecture/WEEK2_PLAN.md`](../architecture/WEEK2_PLAN.md) — the densest architecture-decision record in the repo; read it
- [`docs/operations/DEMO_SCRIPT.md`](../operations/DEMO_SCRIPT.md) — 5–7 min demo walkthrough
- [`docs/operations/DEPLOYMENT.md`](../operations/DEPLOYMENT.md) — Vercel + Neon production checklist
- [`docs/planning/RakshAI_MVP_Sprint_Tracker.xlsx`](../planning/RakshAI_MVP_Sprint_Tracker.xlsx) — 28-task sprint planner, per-intern boards, standup log, progress tracker

---

## 5. Data model (`prisma/schema.prisma`)

| Model | Purpose | Key fields |
|-------|---------|-----------|
| **User** | Auth identity | `email` (unique), `password` (bcrypt), `role` (BUYER/VENDOR), `vendorId?` → links a vendor user to one Vendor |
| **Vendor** | The company being assessed | `name`, `domain` (**unique** — makes CSV upsert deterministic), `category`, `riskTier`, `aiExposure` (0–100), `status`, `remediationNote`, `reviewedAt` |
| **VendorInvite** | Tokenized invite | `token` = **sha256 hash** of the raw token, `email`, `expiresAt` (7d), `usedAt` (single-use) |
| **Nda** | NDA acceptance record | 1:1 with Vendor — `accepted`, `acceptedAt`, `acceptedBy` |
| **Questionnaire** | Answers | 1:1 with Vendor — `answers` **JSON** `{fieldId: value}`, `submitted`, `submittedAt` |
| **RiskSummary** | AI output | 1:1 with Vendor — `summary`, `tier`, `topRisks` JSON, `gaps` JSON, `source` (`"openai"` \| `"stub"`) |

**Enums:** `Role` (BUYER, VENDOR) · `RiskTier` (LOW, MEDIUM, HIGH, CRITICAL) · `VendorStatus` (8 values, see §1)

Schema is managed with **`prisma db push`** (no migration history files). Fine for MVP; see §11 for why that must change before production.

---

## 6. Key architecture decisions (and the reasoning)

These are the decisions a new dev will otherwise re-litigate. All documented in [`WEEK2_PLAN.md`](../architecture/WEEK2_PLAN.md).

### ① The NDA gate is NOT in middleware
`middleware.ts` runs on the **edge runtime — Prisma cannot run there.** A DB read in middleware means a bundling failure or shipping a DB driver to the edge.

**Solution:** middleware handles **auth + role only**, and injects an `x-pathname` header (server components can't read the current path). The **vendor layout server component** (`src/app/vendor/layout.tsx`) does a **fresh DB read** on every navigation: if `vendor.nda.accepted === false` and the path isn't `/vendor/onboard`, it redirects. Zero token-staleness, no bypass.

### ② Invite tokens are hashed at rest
Password-reset discipline: generate 32 random bytes → the **raw** token only ever travels in the emailed link → the DB stores `sha256(raw)`. A leaked database yields no usable invites. 7-day expiry, single-use via `usedAt`. See `src/lib/invite.ts`.

### ③ The mailer has a dev fallback
`src/lib/mailer.ts`: if `RESEND_API_KEY` is set → send a real email; otherwise **print the message + link to the server console**. The entire invite flow is testable locally with zero external config. Same pattern throughout — no required third-party key to run the app.

### ④ The questionnaire is config-driven, not hardcoded
`src/lib/questionnaire-config.ts` defines 4 sections × fields (`{id, label, type, options?, required}`). **The UI renders from it and the API validates against it.** Add/reorder/re-word a question in one file — no component or API change. Answers live in the `Questionnaire.answers` JSON blob keyed by field id.
Helpers: `requiredFieldIds()`, `allFieldIds()` (rejects unknown keys), `missingRequired(answers)` (drives the 422 on incomplete submit).

The 4 sections: **Company Info** · **Security Posture** · **AI Tools Used** · **Compliance**.

### ⑤ AI provider is isolated behind one entry point
`generateRiskSummary(vendorName, answers)` in `src/lib/risk-summary.ts` is the only place a model is called. Without `OPENAI_API_KEY` it returns a **deterministic heuristic stub** so the whole flow works offline with no token spend — and the `source` column records which path produced the result.

### ⑥ Structured output, not streaming free text
Uses `generateObject` with a **Zod schema** (`summary`, `topRisks[]`, `gaps[]`, `tier` enum) — the model cannot return unparseable text. The tracker said "streaming"; the UI instead does a **client-side reveal animation** for the same perceived effect with guaranteed-valid data. The result is stored in `RiskSummary` and the tier is **mirrored onto `Vendor.riskTier`**.

### ⑦ CSV import never fails the whole batch
Per-row try/catch, errors collected and returned as `{created, updated, skipped, errors:[{row,msg}]}`. Row cap (413 over the limit) so one huge upload can't tie up the instance.

---

## 7. How the AI risk summary actually works

1. Buyer clicks **Generate summary** on `/buyer/vendors/[id]`.
2. `POST /api/risk-summary/[vendorId]` (buyer-only, 60s max duration).
3. `buildPrompt()` renders the vendor's questionnaire answers into a readable block, section by section, with `(no answer)` for blanks.
4. The prompt tells the model to weigh heavily: **no MFA, no encryption at rest, no incident response plan, customer data sent to AI models unprotected, missing certifications.**
5. `generateObject` returns schema-validated `{summary, topRisks, gaps, tier}`.
6. Stored in `RiskSummary`; `Vendor.riskTier` updated to match.

**The stub** (`stubSummary()`) mirrors the same five factors as a scoring heuristic (`score >= 5 → CRITICAL`, `>= 3 → HIGH`, `>= 1 → MEDIUM`, else `LOW`) so offline behavior is representative, not random.

---

## 8. Security posture

| Control | Implementation |
|---------|----------------|
| Passwords | bcrypt hash |
| Buyer signup | Gated by server-side `BUYER_INVITE_CODE`, **constant-time compare** (no length short-circuit) |
| Vendor signup | Via tokenized invite link; token sha256-hashed at rest, 7-day expiry, single-use |
| Route guards | `middleware.ts` enforces role on `/buyer/*` and `/vendor/*`; unauthenticated → `/login` |
| NDA gate | Fresh DB read in the vendor layout server component (decision ①) |
| Rate limiting | In-memory fixed-window on **login** (10 / 10 min per IP), register, invite |
| Input validation | Zod on every API body; questionnaire rejects unknown field ids |
| Idempotency | A second NDA accept returns 409, so the timestamp is never overwritten |

---

## 9. Environment variables

| Var | Required | Notes |
|-----|----------|-------|
| `DATABASE_URL` | ✅ | Neon Postgres, `?sslmode=require` |
| `NEXTAUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | ✅ | `http://localhost:3000` in dev; also used to build invite links |
| `BUYER_INVITE_CODE` | ✅ | gates buyer signup — `openssl rand -hex 16` |
| `OPENAI_API_KEY` | optional | omit → deterministic dev stub |
| `OPENAI_MODEL` | optional | default `gpt-4o-mini` |
| `RESEND_API_KEY` | optional | omit → emails log to the server console |
| `MAIL_FROM` | optional | verified sender, e.g. `RakshAI <no-reply@domain.com>` |

> ⚠️ `.env.example` is currently **missing `RESEND_API_KEY` and `MAIL_FROM`** even though [`DEPLOYMENT.md`](../operations/DEPLOYMENT.md) lists them. Add them (see §11).

---

## 10. Getting up and running

```bash
npm install
cp .env.example .env        # then fill DATABASE_URL, NEXTAUTH_SECRET, BUYER_INVITE_CODE
npm run db:push             # sync schema to the database
npm run db:seed             # buyer + vendors + realistic demo states (idempotent)
npm run dev                 # http://localhost:3000
```

| Command | What it does |
|---------|--------------|
| `npm run dev` | Dev server |
| `npm run build` | Prod build (runs `prisma generate` first) |
| `npm run start` | Serve the prod build |
| `npm run db:push` | Sync schema |
| `npm run db:seed` | Reseed demo data — **use this to reset between demos** |
| `npm run db:studio` | Prisma Studio visual DB browser |
| `npm run lint` | Next lint |

### Seeded logins

| Role | Email | Password |
|------|-------|----------|
| Buyer / CISO | `ciso@acme.com` | `password123` |
| Vendor (CloudFlow) | `vendor@cloudflow.io` | `password123` |

### Seeded demo state

| Vendor | Status | Tier | Demo talking point |
|--------|--------|------|--------------------|
| DataMint Analytics | Approved | LOW | Strong posture, has an AI summary |
| CloudFlow Systems | Pending review | HIGH | Review it live on stage |
| SecurePay Gateway | Remediation | CRITICAL | Weak answers → remediation requested |
| InboxAI | NDA signed | HIGH | Mid-onboarding |
| LogiTrack | Discovered | LOW | Not yet engaged |

### End-to-end smoke test (the "one unbroken chain")
Buyer imports CSV → invites a vendor → **dev console prints the link** → vendor registers → accepts NDA → guard opens `/vendor/questionnaire` → fills 4 sections (autosaves) → submits → `status = PENDING_REVIEW` → buyer generates the AI summary → approves → vendor emailed.

For the stage demo, follow [`DEMO_SCRIPT.md`](../operations/DEMO_SCRIPT.md) (5–7 min, two browsers so you can switch roles instantly).

---

## 11. What is DONE vs REMAINING

### ✅ Done (27 of 28 sprint tasks)

**Week 1 — foundation**
- Repo setup: Next.js 14 + Tailwind + Vercel
- Prisma schema: User, Vendor, Nda, Questionnaire, RiskSummary
- NextAuth dual-role auth + route guards
- Login + Register pages with role selector
- Buyer dashboard shell: sidebar + vendor table
- Vendor CRUD API (GET/POST/PATCH) with Zod validation
- Vendor table wired to the real API + loading skeleton

**Week 2 — onboarding**
- CSV bulk vendor import (`POST /api/vendors/import`)
- Vendor invite flow: tokenized link + email
- NDA acceptance page + timestamp
- NDA route guard (no bypass)
- Questionnaire UI — 4 dynamic sections, autosave draft
- Questionnaire save/submit API + status transition
- Vendor portal nav + progress bar

**Week 3 — the AI layer**
- Risk-summary prompt engineering
- `POST /api/risk-summary/[vendorId]` + storage
- Buyer-side risk summary review page with reveal animation
- Approve / Request remediation flow (note modal)
- Vendor status updates + email notification
- Vendor detail page `/buyer/vendors/[id]`

**Week 4 — polish & demo prep**
- Monitoring dashboard (Recharts trend line, tier pie, top open action items)
- Locked "coming soon" states for Phases 4, 6, 7, 8
- Realistic seeded demo data across 5 vendor states
- Full E2E flow testing (buyer + vendor paths)
- UI polish: spacing, typography, mobile down to 375px
- Error handling + empty states on every page (`error.tsx`, `global-error.tsx`, `not-found.tsx`)
- [`DEMO_SCRIPT.md`](../operations/DEMO_SCRIPT.md) + [`DEPLOYMENT.md`](../operations/DEPLOYMENT.md) written

### 🚧 Remaining — the immediate to-do list

**P0 — blocking ship / demo**

1. **Final Vercel deploy + custom domain + production QA** — the one open sprint task. [`DEPLOYMENT.md`](../operations/DEPLOYMENT.md) is written and ready; nobody has executed it. Covers: import the repo, set 8 env vars, `prisma db push` against prod, add the domain, update `NEXTAUTH_URL`, run the 7-item post-deploy checklist.
2. **The invite link is a dead end.** `src/lib/invite.ts` builds `${NEXTAUTH_URL}/vendor/accept?token=...`, but **`src/app/vendor/accept/` does not exist** — and `/vendor/*` is inside the middleware matcher, so an unauthenticated invitee is bounced to `/login`. The backend is complete (`GET /api/invite/[token]` validates; `POST /api/register` accepts `inviteToken`, links `user.vendorId`, marks `usedAt`), but **`src/app/register/page.tsx` never reads `?token=` and never sends `inviteToken`.**
   **Fix:** either build `/vendor/accept` as a public route (and exclude it from the middleware matcher), or point `inviteUrl()` at `/register?token=...` and have the register page read the token, call `GET /api/invite/[token]` to prefill, and pass `inviteToken` on submit. **Until this is fixed, vendor self-onboarding only works via a manually seeded linked vendor user.**
3. **Add `RESEND_API_KEY` and `MAIL_FROM` to `.env.example`** — documented in [`DEPLOYMENT.md`](../operations/DEPLOYMENT.md) but missing from the template, so new devs silently get console-only email.

**P1 — production hardening**

4. **Rate limiter is in-memory.** State lives in the process, so counters are **not shared across serverless instances** — on Vercel it is effectively ineffective under load. Swap `src/lib/rate-limit.ts` for Upstash Redis; the interface was designed for that swap.
5. **No migration history.** The project uses `prisma db push` with no `prisma/migrations/`. Before real production data exists, switch to `prisma migrate` so schema changes are reviewable and reversible.
6. **No test suite at all.** No Jest/Vitest/Playwright, no CI. All QA to date has been manual. Highest-value first tests: `missingRequired()`, `stubSummary()` scoring, the invite token hash/expiry/single-use path, and a Playwright run of the E2E chain in §10.
7. **Questionnaire autosave is last-write-wins** (800ms debounce, JSON merge). Known, accepted tech debt — only matters if two people ever edit one vendor's questionnaire concurrently.
8. **No audit log.** `reviewedAt` / `remediationNote` capture only the latest decision; there is no history of who changed what, when.

**P2 — known product gaps**

9. **Monitoring trend line is seeded, not real.** There is **no historical time-series store** — risk scores are point-in-time only. Real monitoring needs a `RiskSnapshot`-style table written on every tier change.
10. Buyer dashboard status updates on reload, not in real time.
11. Vendor detail "approval history" shows current state, not a full timeline.
12. `OFFBOARDED` exists in the enum with no UI behind it.

### 🔭 Further roadmap — what we're building next

| Phase | Scope |
|-------|-------|
| **Phase 4 — Exposure & AI-SPM** | Turn `aiExposure` from a manual number into a measured signal: discovered AI tooling per vendor, AI security posture management, shadow-AI detection. Nav stub already at `/buyer/exposure`. |
| **Phase 5 — Monitoring (real)** | Historical risk time-series, real trend lines, alerting on tier changes, scheduled re-assessment. Upgrades the existing stub. |
| **Phase 6 — Remediation workflow** | Turn a remediation note into tracked items with owners, due dates, evidence upload, and re-verification. `/buyer/remediation`. |
| **Phase 7 — Continuous Trust** | Continuous rather than point-in-time assurance: periodic re-attestation, live cert/breach feeds, trust score decay. `/buyer/continuous`. |
| **Phase 8 — Offboarding** | Structured vendor exit: access revocation checklist, data deletion attestation, final report. `OFFBOARDED` status already reserved. |

Cross-cutting candidates: SSO for buyers, **multi-tenant orgs** (today `User` has no org boundary — every buyer sees every vendor), evidence/document upload, SOC 2 report parsing, questionnaire framework templates (CAIQ, SIG), and a vendor-facing trust page.

---

## 12. Team & ownership history

| Person | Role | Owned |
|--------|------|-------|
| Lead | Lead dev | Schema, auth, all API routes, CSV import, invite flow, NDA guard, questionnaire API, AI integration, seed data, E2E testing, deploy |
| Yadnyesh | Intern A | Login/register pages, NDA acceptance page, vendor portal nav, risk summary review page, vendor detail page, locked phase states, UI polish |
| Riddhi | Intern B | Buyer dashboard shell + vendor table, API wiring + skeletons, questionnaire form UI, approve/remediation flow, monitoring dashboard, error/empty states |

Progress per [`RakshAI_MVP_Sprint_Tracker.xlsx`](../planning/RakshAI_MVP_Sprint_Tracker.xlsx): Week 1 7/7 · Week 2 7/7 · Week 3 6/6 · Week 4 7/8. Milestones through "full E2E flow tested" and "monitoring seeded" are ✅; "deployed to Vercel" and "MVP demo ready" are the two open boxes.

---

## 13. Gotchas a new dev will hit

1. **Prisma cannot run in middleware** (edge runtime). Any DB-dependent guard belongs in a server component layout. See decision ①.
2. **Server components can't read the current path** — that's why `middleware.ts` injects `x-pathname`. Don't delete it; the NDA gate depends on it.
3. **Questionnaire field ids are global**, not per-section. `answers` is a flat JSON map keyed by field id, so ids must be unique across all 4 sections.
4. **The AI "stub" is not a mock to delete** — it's the offline path, recorded in `RiskSummary.source`. If a summary looks formulaic, check whether `source === "stub"` (i.e. no `OPENAI_API_KEY`).
5. **`Vendor.domain` is unique** — CSV import upserts on it. Two rows with the same domain update rather than duplicate.
6. **The tracker says "Claude" and "streaming"; the code is OpenAI and non-streaming.** Both are deliberate (§6 ⑤⑥). Don't "fix" it as a bug.
7. **No org/tenant boundary yet** — `GET /api/vendors` returns *all* vendors to *any* buyer. Fine for a single-tenant demo; must be addressed before a second customer.
8. **Reset a broken demo with `npm run db:seed`** — it's idempotent.
9. **A large part of the current tree is uncommitted.** Only two commits exist (`first commit`, `Week 1 Updates`); most Week 2–4 work is untracked/modified in the working directory. **Commit before anyone else clones.**

---

## 14. Where to start (first day on the project)

1. Run §10 locally and log in as both roles.
2. Read [`WEEK2_PLAN.md`](../architecture/WEEK2_PLAN.md) end to end — the densest explanation of *why* the code looks like it does.
3. Read `src/lib/questionnaire-config.ts`, then `src/lib/risk-summary.ts`. Those two files are the product.
4. Trace one request all the way: `src/app/vendor/questionnaire/page.tsx` → `src/components/questionnaire-form.tsx` → `POST /api/questionnaire` → `missingRequired()` → status transition.
5. Pick up **P0 item #2 (the dead invite link)** — self-contained, touches the invite/register/middleware seam, and teaches the whole onboarding flow.
