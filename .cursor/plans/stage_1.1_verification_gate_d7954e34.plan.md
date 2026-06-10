---
name: Stage 1.1 Verification Gate
overview: "Execute Stage 1.1 as a verification gate: prove the real codebase state (tests, build, demo data, APIs, dashboard) is green and confirm the four Day-1 longitudinal-insight gaps are genuinely missing, before any Stage 1.2 coding begins."
todos:
  - id: hard-blockers
    content: Run npm test (expect 149/149) and npm run build --prefix client (clean Vite build); record actual test count. STOP if either fails.
    status: completed
  - id: env-precheck
    content: Confirm MongoDB reachable at hardcoded mongodb://localhost:27017/healthlens (no Mongo env var) and JWT_SECRET exists; GEMINI_API_KEY only needed for live AI/chat. Mark demo steps env-blocked if Mongo is down.
    status: completed
  - id: demo-seed
    content: Run npm run seed:demo; confirm demo user + 4 reports (Jan/Mar/Mar-rx/Jun).
    status: completed
  - id: api-reality
    content: Start npm run dev, log in as demo user, verify /reports/history (4), /repository/summary (totalReports 4), medications (Metformin), diagnoses (Type 2 Diabetes), timeline (4 events).
    status: completed
  - id: frontend-state
    content: In browser as demo user, verify dashboard/Jun report, vitality snapshot, HbA1c Jan->Mar->Jun trend, Needs Attention, 4-record scrubber, Metformin prescription, Vault list, Chat opens.
    status: completed
  - id: decision-gate
    content: Produce the Stage 1.1 verification report (Tests/Build/Mongo/Seed/API/Frontend/Blockers/Stage 1.2 status); declare pass/blocked. Update PROJECT_CONTEXT.md only if status, test baseline, or known bugs changed, or a code/config/doc fix was made.
    status: completed
isProject: false
---

# Stage 1.1 — Verification Gate

This is a verification stage, not a coding stage. The goal is to confirm what exists, what is missing, and that no foundation is broken before building longitudinal intelligence in Stage 1.2. The only file that may change is `PROJECT_CONTEXT.md`, and only if verification reveals drift.

## Codebase reality (already verified read-only)

- Route map ([server.js](server.js) 32-41), repository handlers ([routes/repository.js](routes/repository.js) 83-88), chat 10-report bound, and interpret fallback all match the spec.
- Demo narrative ([scripts/demoPatientData.js](scripts/demoPatientData.js)) is correct: HbA1c 5.4 (Jan normal) -> 6.8 (Mar high) -> Metformin / Type 2 Diabetes prescription (Mar) -> 6.2 (Jun high).
- Day-1 gaps confirmed missing: no `GET /api/repository/insights`, no longitudinal function in [services/aiService.js](services/aiService.js), no `fetchRepositoryInsights` in [client/src/lib/api.js](client/src/lib/api.js) (only `fetchRepositorySummary`), and [AIInsightsBanner.jsx](client/src/components/Dashboard/AIInsightsBanner.jsx) is a static banner, not a "what changed" card.
- `buildMetricSeries` is client-only ([client/src/lib/trends.js](client/src/lib/trends.js) 21) — Stage 1.2 will need a server-side mirror.

## Step 1 - Hard blockers (no external dependencies)

These must pass regardless of environment.

- `npm test` — expect 149/149 (`node --test tests/**/*.test.js`). Record the actual count.
- `npm run build --prefix client` — expect a clean Vite build (`vite build`).

Gate: if either fails, STOP and fix before anything else.

## Step 2 - Environment precheck (for demo-dependent steps)

- Confirm MongoDB service is reachable at `mongodb://localhost:27017/healthlens`. There is **no Mongo URI env var** — [config/db.js](config/db.js) line 4 hardcodes the local URI.
- Confirm `JWT_SECRET` exists (required for demo login).
- Confirm `GEMINI_API_KEY` **only if** live chat / live AI interpretation is being verified. Missing `GEMINI_API_KEY` does NOT block Stage 1.1 — seeded dashboard, repository, trends, vault, and demo data do not require Gemini (per [docs/DEMO.md](docs/DEMO.md)).
- If Mongo is not running, Steps 3-5 are environment-blocked (not code defects); note it and continue toward the gate decision.

## Step 3 - Demo seed (needs MongoDB)

- `npm run seed:demo` — expect idempotent upsert of `demo@healthlens.ai` + 4 reports (Jan baseline, Mar worsening, Mar prescription, Jun improvement).

## Step 4 - API reality (needs server + MongoDB)

- Start `npm run dev`, then log in via `POST /api/auth/login` with `demo@healthlens.ai` / `DemoHealth2026!` and call the protected endpoints with the Bearer token:
  - `/api/reports/history` -> 4 reports
  - `/api/repository/summary` -> `totalReports = 4`
  - `/api/repository/medications` -> Metformin
  - `/api/repository/diagnoses` -> Type 2 Diabetes
  - `/api/repository/timeline` -> 4 events

## Step 5 - Frontend demo state (manual, in browser)

Log in as the demo user and confirm: dashboard opens on the Jun report, vitality snapshot renders, HbA1c trend shows Jan->Mar->Jun, Needs Attention lists elevated markers, timeline scrubber has 4 records, prescription record shows Metformin, Vault lists the reports, and Chat opens (Gemini may fall back gracefully).

## Step 6 - Decision gate + verification report

Pass criteria (Steps 1-5). If all pass, declare Stage 1.1 PASSED and Stage 1.2 unblocked. If only env-dependent steps (3-5) are blocked because Mongo isn't running, mark them "env-blocked" rather than failed.

Produce this auditable verification report:

```text
Stage 1.1 Result:
- Tests:
- Frontend build:
- Mongo:
- Demo seed:
- API checks:
- Frontend checks:
- Blockers:
- Stage 1.2 status: Unblocked / Blocked
```

**PROJECT_CONTEXT.md rule:** Do NOT update it for a pure verification pass. Update it only if verification changes project status, test baseline, or known bugs, or if a code/config/doc fix is made.

## Out of scope (Stage 1.2, do NOT build now)

`GET /api/repository/insights`, the longitudinal AI function, the deterministic fallback insight builder, `fetchRepositoryInsights()`, and the flagship "What changed since last report" dashboard card. Do not rebuild repository, chat, auth, upload, or dashboard foundations.