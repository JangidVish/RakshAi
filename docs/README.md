# RakshAI — Documentation

All project documentation lives here. Setup and commands stay in the [root README](../README.md).

## Start here

| If you are… | Read |
|---|---|
| **New to the project / taking it over** | [onboarding/RakshAI_KT.md](onboarding/RakshAI_KT.md) — the full knowledge transfer |
| **Building against the API** | [architecture/API_CONTRACTS.md](architecture/API_CONTRACTS.md) |
| **Asking "why is it built this way?"** | [architecture/WEEK2_PLAN.md](architecture/WEEK2_PLAN.md) |
| **Deploying to production** | [operations/DEPLOYMENT.md](operations/DEPLOYMENT.md) |
| **Running the demo** | [operations/DEMO_SCRIPT.md](operations/DEMO_SCRIPT.md) |
| **Tracking sprint status** | [planning/RakshAI_MVP_Sprint_Tracker.xlsx](planning/RakshAI_MVP_Sprint_Tracker.xlsx) |

## Layout

```
docs/
  onboarding/     # for people joining or inheriting the project
    RakshAI_KT.md                   Full KT: product, stack, data model,
                                    architecture decisions, done vs remaining,
                                    roadmap, gotchas
  architecture/   # how the system is designed and how to talk to it
    API_CONTRACTS.md                Request/response shapes for every endpoint
    WEEK2_PLAN.md                   Architecture decision record — the edge-runtime
                                    NDA gate, hashed invite tokens, config-driven
                                    questionnaire, and the reasoning behind each
  operations/     # running it
    DEPLOYMENT.md                   Vercel + Neon production checklist
    DEMO_SCRIPT.md                  5–7 min buyer + vendor demo walkthrough
  planning/       # sprint history
    RakshAI_MVP_Sprint_Tracker.xlsx 28-task planner, per-person boards,
                                    standup log, progress tracker
```

## Conventions

- One folder per audience, not per document type — you should be able to pick a folder from your role alone.
- The KT document is the canonical status source. When scope, remaining work, or the roadmap changes, update **section 11** of `onboarding/RakshAI_KT.md` first; everything else can lag.
- Cross-document links are relative, so they resolve both on GitHub and in a local editor. If you move a file, fix the inbound links in the same commit.
