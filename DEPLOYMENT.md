# RakshAI — Deployment Guide (Vercel)

Production deploy checklist. Requires a Vercel account and the production database + OpenAI key.

## 1. Prerequisites
- Vercel account with access to the target team/project.
- Production PostgreSQL (Neon recommended — same as dev). A separate DB from dev is advised.
- OpenAI API key with billing enabled.

## 2. Push the repo
```bash
git init && git add . && git commit -m "RakshAI MVP"
gh repo create rakshai --private --source=. --push   # or push to an existing remote
```

## 3. Import into Vercel
- Vercel → **Add New → Project** → import the GitHub repo.
- Framework preset: **Next.js** (auto-detected).
- Build command: `npm run build` (already runs `prisma generate`).
- Install command: `npm install`.

## 4. Environment variables (Vercel → Settings → Environment Variables)

| Key | Value | Notes |
|-----|-------|-------|
| `DATABASE_URL` | prod Postgres URL | `?sslmode=require` for Neon |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | required |
| `NEXTAUTH_URL` | `https://your-domain.com` | production URL |
| `OPENAI_API_KEY` | `sk-...` | omit → app uses dev stub |
| `OPENAI_MODEL` | `gpt-4o-mini` | optional override |
| `BUYER_INVITE_CODE` | random hex | gates buyer signup |
| `RESEND_API_KEY` | `re_...` | omit → invites/emails log to server console |
| `MAIL_FROM` | `RakshAI <no-reply@your-domain.com>` | verified sender |

Set for **Production** (and Preview if you want previews functional).

## 5. Initialize the production database
From a machine with `DATABASE_URL` pointed at prod:
```bash
npx prisma db push          # create tables
npx tsx prisma/seed.ts      # optional: seed demo data (skip for a clean prod)
```

## 6. Custom domain
- Vercel → Settings → Domains → add your domain, follow DNS steps.
- Update `NEXTAUTH_URL` to the final domain and redeploy.

## 7. Post-deploy QA
- [ ] Load the production URL — login page renders.
- [ ] Buyer login works (seeded or a real invite-code signup).
- [ ] Dashboard lists vendors.
- [ ] Generate an AI risk summary (confirms `OPENAI_API_KEY`).
- [ ] Vendor login → NDA → questionnaire submit.
- [ ] Approve / remediation → vendor receives email (confirms `RESEND_API_KEY`).
- [ ] Monitoring charts render.

## Notes / limits
- Rate limiter is in-memory (single instance). For multi-instance scale, swap `src/lib/rate-limit.ts` for Upstash Redis.
- Risk summaries use `generateObject` (non-streaming) — reliable structured output; UI does a client-side reveal.
- No historical time-series store yet — the monitoring trend line is seeded (Phase 5 preview).
