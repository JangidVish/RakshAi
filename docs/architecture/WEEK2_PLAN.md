# RakshAI — Week 2 Implementation Plan

**Window:** Jul 7–16, 2026 · **Sprint tasks:** 8–14 · **Team:** You (Lead), Yadnyesh, Riddhi

---

## The 7 tasks

| # | Task | Owner | Endpoint / surface |
|---|------|-------|--------------------|
| 8 | CSV bulk vendor import | You | `POST /api/vendors/import` |
| 9 | Vendor invite → email link | You | `POST /api/vendors/[id]/invite` |
| 10 | NDA acceptance page + timestamp | Yadnyesh | `/vendor/onboard` + `POST /api/nda/accept` |
| 11 | Guard: block vendor until NDA signed | You | vendor layout guard |
| 12 | Questionnaire UI (4 sections, dynamic) | Riddhi | `/vendor/questionnaire` |
| 13 | Questionnaire save/submit API | You | `PATCH` + `POST /api/questionnaire` |
| 14 | Vendor portal nav + progress | Yadnyesh | vendor nav + progress bar |

---

## What already exists (reuse, don't rebuild)

- `Nda`, `Questionnaire` models — done. No schema work for 10/13 storage.
- `VendorStatus` enum has `INVITED / NDA_SIGNED / QUESTIONNAIRE_SENT / PENDING_REVIEW` — full lifecycle ready.
- `/vendor/onboard` already renders a 3-step tracker reading `nda`/`questionnaire` — **task 14 is ~50% done**, needs nav + action links.
- `lib/rate-limit.ts`, `clientIp()` — reuse for invite/import throttling.
- `User.vendorId` link + `next-auth.d.ts` types — invite linking has a home.

## Gaps to fill

1. **No invite-token model** → task 9 blocked. New `VendorInvite` model.
2. **Register doesn't link vendor** → invite must set `user.vendorId`.
3. **No CSV parser / mailer deps.**
4. **`/vendor/onboard` is read-only** → task 10 needs the Accept action.
5. **NDA guard not enforced** → task 11 (edge-runtime gotcha, see below).

---

## Key architecture decisions

### ① NDA guard: NOT in middleware
Tracker text says "middleware", but `middleware.ts` runs on the **edge runtime — Prisma Client can't run there.** A DB query in it means a bundling failure or shipping a DB driver to the edge.

**Decision:** keep `middleware.ts` for auth+role only (already correct). Enforce NDA in a **server-component guard** in the vendor layout — it already `await getServerSession` + hits Prisma. Add: if `vendor.nda.accepted === false` and path ≠ `/vendor/onboard`, `redirect('/vendor/onboard')`. Fresh from DB every nav, zero token-staleness. More correct than the tracker's wording.

### ② Invite tokens: store the hash, not the raw token
Same discipline as password resets. Generate 32-byte random → send raw in the link → store `sha256(raw)` in `VendorInvite.token`. A leaked DB ≠ usable invites. Expiry 7 days (per acceptance criteria), single-use via `usedAt`.

### ③ Mailer abstraction with a dev fallback
No SMTP in dev. `lib/mailer.ts`: if `RESEND_API_KEY` set → send; else `console.log` the invite URL. Unblocks the whole flow locally with zero external config.

### ④ Questionnaire is config-driven, not hardcoded
One `lib/questionnaire-config.ts` defines 4 sections × fields (`{id,label,type,options?,required}`). UI renders from config; API validates against it. Add/reorder questions later without touching components or the API. Answers stay in the existing `Questionnaire.answers` JSON.

### ⑤ Fix the test blocker + the sidebar dead-link now
Seed currently has **no VENDOR user linked to a Vendor** → vendor side is untestable. Add a linked vendor login to `seed.ts`. Also flip the `/buyer/vendors` sidebar item to `live:false` (the current 404) until it's built.

---

## Schema change (one migration)

```prisma
model VendorInvite {
  id        String    @id @default(cuid())
  token     String    @unique          // sha256(rawToken)
  vendor    Vendor    @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  vendorId  String
  email     String
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())
  @@index([vendorId])
}
// + add to Vendor:  invites VendorInvite[]
// Recommend: add @unique on Vendor.domain → makes CSV upsert deterministic
```

---

## API contracts

| Method + route | Auth | Body | Success | Errors |
|---|---|---|---|---|
| `POST /api/vendors/import` | BUYER | multipart `file` (.csv) | `{created,updated,skipped,errors:[{row,msg}]}` | 400 bad file, 413 too many rows |
| `POST /api/vendors/[id]/invite` | BUYER | `{email}` | `{ok, expiresAt}` + email sent, `vendor.status=INVITED` | 404 vendor, 429 |
| `GET /api/invite/[token]` | public | — | `{vendorName,email}` (prefill) | 404 / 410 expired/used |
| `POST /api/register` (extend) | public | `+inviteToken?` | links `user.vendorId`, marks invite `usedAt` | 410 invalid token |
| `POST /api/nda/accept` | VENDOR | — | `nda.accepted=true, acceptedAt, acceptedBy`, `vendor.status=NDA_SIGNED` | 401, 409 already |
| `PATCH /api/questionnaire` | VENDOR | `{answers}` (merge) | `{ok}` draft saved | 401 |
| `POST /api/questionnaire` | VENDOR | — | validate required → `submitted=true`, `vendor.status=PENDING_REVIEW` | 422 incomplete |

---

## Build order (dependency-aware, 3 people parallel)

```
Day 1   Schema: VendorInvite + migrate + seed linked vendor  (You) ──┐ unblocks all
        └─ Task 8  CSV import        (You)      independent
Day 2-3 ├─ Task 9  invite + register link (You)  needs schema
        ├─ Task 13 questionnaire API (You)       independent
        ├─ Task 10 NDA accept page   (Yadnyesh)  needs seeded linked vendor
        └─ Task 12 questionnaire UI  (Riddhi)    needs task-13 contract only
Day 4   ├─ Task 11 NDA guard         (You)       needs 10
        └─ Task 14 vendor nav+progress(Yadnyesh) needs 10,12
Day 5   E2E flow + fix
```

**Critical path:** schema → 9 → 11. Riddhi (12) and Yadnyesh (10) run fully parallel once the seeded linked vendor exists on Day 1.

---

## Definition of done — E2E acceptance

Buyer imports CSV (5 rows, 1 bad → reported) → invites a vendor → **dev console prints link** → open link → register/accept → `user.vendorId` linked → sign NDA (`acceptedAt` in DB) → guard now allows `/vendor/questionnaire` → fill 4 sections (draft autosaves) → submit → `vendor.status=PENDING_REVIEW` → **buyer dashboard shows it**. One unbroken chain.

---

## Risks / watch-list

- **Edge + Prisma** → handled via layout guard (decision ①).
- **CSV partial failure** → per-row try/catch, collect errors, never fail the whole batch. Cap 1000 rows (413 over).
- **Autosave race** → debounce 800ms, last-write-wins for MVP (JSON merge). Note as tech debt if concurrent editing ever matters.
- **Invite token in email** → hash at rest, HTTPS link, 7-day expiry, single-use.
- **New deps:** `papaparse` (CSV), `resend` (email). Both small, MIT.

---

## Effort

~5 dev-days across 3 people, matches the Jul 7–16 window. You carry the heaviest load (8, 9, 11, 13 + schema) — front-load the schema + seed on Day 1 so the interns aren't blocked.

---

## Env additions

```
RESEND_API_KEY=""          # optional in dev — falls back to console.log
NEXTAUTH_URL="http://localhost:3000"   # used to build invite links (already set)
```
