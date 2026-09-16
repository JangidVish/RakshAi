# RakshAI MVP — Demo Script & Walkthrough

A 5–7 minute end-to-end demo covering the buyer (CISO) and vendor journeys.

## Login credentials

| Role | Email | Password |
|------|-------|----------|
| Buyer / CISO | `ciso@acme.com` | `password123` |
| Vendor (linked to CloudFlow) | `vendor@cloudflow.io` | `password123` |

Buyer registration is invite-gated (`BUYER_INVITE_CODE` in `.env`). Vendors normally arrive via an emailed invite link.

## Pre-demo setup (once)

```bash
npm install
npx prisma db push          # sync schema to the database
npx tsx prisma/seed.ts      # seed buyer, vendors, demo data
npm run dev                 # http://localhost:3000
```

Pre-login as buyer and vendor in **two separate browsers** (or one normal + one incognito) so you can switch instantly.

## Seeded demo state

| Vendor | Status | Tier | Talking point |
|--------|--------|------|---------------|
| DataMint Analytics | Approved | LOW | Strong posture — approved with AI summary |
| CloudFlow Systems | Pending review | HIGH | Ready to review live on stage |
| SecurePay Gateway | Remediation | CRITICAL | Weak answers → remediation requested |
| InboxAI | NDA signed | HIGH | Mid-onboarding |
| LogiTrack | Discovered | LOW | Not yet engaged |

---

## Walkthrough

### 1. Buyer dashboard (30s)
- Log in as **ciso@acme.com**.
- Point out the **Vendor & AI map**: summary cards (total / high-risk / pending / approved) and the vendor table with risk tier, AI exposure, and status.
- Use the search + tier filter to show it's interactive.

### 2. Vendor detail + AI risk summary (90s)
- Click **CloudFlow Systems**.
- Show profile, timeline, and the **full questionnaire responses**.
- Click **Generate summary** → AI (OpenAI) produces an executive summary, top 3 risks, gaps, and a risk tier, with a streaming-style reveal.
- Explain: this is generated from the vendor's actual questionnaire answers.

### 3. Approve / remediation decision (45s)
- Click **Request remediation** → type a note → send. Vendor status flips to *Remediation* and the vendor is emailed.
- (Or **Approve vendor** to show the happy path.)

### 4. Monitoring (30s)
- Open **Monitoring** in the sidebar.
- Show the risk-trend line (seeded), vendors-by-tier pie (live), and top open action items (live, links to each vendor).
- Note the locked **Phase 4/6/7/8** items — roadmap, "coming soon".

### 5. Vendor journey (90s) — switch to the vendor browser
- Log in as **vendor@cloudflow.io**.
- Show **Onboarding**: NDA step, questionnaire step, review step.
- If NDA not signed: show the **NDA accept** screen (checkbox + Accept & Continue).
- Open **Questionnaire**: 4 sections, autosave draft, progress bar, submit.
- On submit → vendor moves to *Pending review* → reappears on the buyer dashboard.

### 6. Close (20s)
- Recap the loop: **invite → NDA → questionnaire → AI risk summary → approve/remediate → monitor.**
- Mention CSV bulk import and the email invite flow as buyer power-features.

---

## Full lifecycle (optional live build)
Buyer: **Import CSV** (bulk add vendors) → open a vendor → **Invite** (link prints to server console in dev) → vendor opens link → registers → signs NDA → completes questionnaire → buyer generates summary → approves.

## Reset between demos
```bash
npx tsx prisma/seed.ts   # idempotent — restores demo state
```
