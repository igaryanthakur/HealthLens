# HealthLens AI — Evaluation Demo Guide

**Last updated:** June 10, 2026 (Stage 3.3)

## Prerequisites

- `npm install` completed in the project root
- **MongoDB Atlas** (or local) — set `MONGODB_URI` in `.env` (falls back to `mongodb://localhost:27017/healthlens` if unset)
- `JWT_SECRET` set in `.env`
- **Recommended for eval:** `LONGITUDINAL_AI_ENABLED=false` — dashboard insights use the deterministic brief (strong for Priya's narrative; no Gemini stall)
- `GEMINI_API_KEY` optional for seed; **required at demo time** only if you show Chat or live upload interpretation
- Run with **`npm run dev`** (backend `:5000` + frontend `:5173`) — do not use preview-only for full-stack demo

## Seed the demo patient

```bash
npm run seed:demo
```

**PowerShell (password reset on re-seed):**

```powershell
$env:RESET_DEMO_PASSWORD="true"; npm run seed:demo
```

Safe to run multiple times (idempotent). Re-running deletes and re-inserts **only** the demo user's reports.

## Demo credentials

| Field | Value |
|-------|-------|
| **Name** | Priya Sharma |
| **Email** | `demo@healthlens.ai` |
| **Password** | `DemoHealth2026!` |
| **DOB** | 1990-05-15 |
| **Gender** | Female |
| **Blood group** | B+ |
| **Chronic conditions** | Prediabetes |

## Patient narrative (4 reports)

1. **Jan 15, 2026** — Baseline labs (all normal)
2. **Mar 20, 2026** — Worsening HbA1c / glucose / cholesterol
3. **Mar 22, 2026** — Prescription: Metformin for Type 2 Diabetes
4. **Jun 5, 2026** — Improvement labs (still elevated, trending better)

Login without `?reportId=` lands on the **Jun 5** report automatically.

## Upload entry point

Use **Navbar → Upload** (`/dashboard?upload=1`) — works even when the user already has report history. Logged-in Landing hero CTA also routes to upload mode.

## Post-seed API smoke

```bash
# 1. Login
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@healthlens.ai","password":"DemoHealth2026!"}'

# 2. Use the token from the response:
# export TOKEN="<jwt>"

curl -s http://localhost:5000/api/reports/history -H "Authorization: Bearer $TOKEN"
curl -s http://localhost:5000/api/repository/overview -H "Authorization: Bearer $TOKEN"
curl -s http://localhost:5000/api/repository/insights -H "Authorization: Bearer $TOKEN"
curl -s http://localhost:5000/api/repository/doctor-summary -H "Authorization: Bearer $TOKEN"
```

**Expected:** `success: true`; 4 reports; overview `summary.totalReports=4`, `medications=1`, `diagnoses=1`, `events=4`; Metformin + Type 2 Diabetes (`active`).

**Automated QA (destructive — re-seed after):**

```bash
node scripts/qaStage31.mjs
RESET_DEMO_PASSWORD=true npm run seed:demo
```

## Frontend verification checklist

| # | Action | Expected |
|---|--------|----------|
| 1 | Login as demo user | Dashboard loads latest report (Jun 5) |
| 2 | Vitality Snapshot | Score ~68, Metformin + Type 2 Diabetes pills |
| 3 | Longitudinal Insights | Deterministic brief; HbA1c improvement narrative |
| 4 | Trend Analytics | HbA1c shows 3 points (Jan → Mar → Jun) |
| 5 | Needs Attention | HbA1c/Glucose high with ↓ deltas vs March |
| 6 | Timeline scrubber | 4 pills; switching changes dashboard |
| 7 | Select prescription (Mar 22) | DocumentEntitiesCard with Metformin |
| 8 | Repository (`/repository`) | Rollup tables; 6-stat strip matches seed counts |
| 9 | Vault | 4 cards; 2 Attention Needed, 2 Stable |
| 10 | Doctor Summary (`/doctor-summary`) | Print/export; disclaimer visible |
| 11 | Navbar Upload | `/dashboard?upload=1` with existing history |
| 12 | Run `npm run seed:demo` twice | Same dashboard state (idempotency) |

### Mini calendar tip

Dates span **Jan–Jun 2026**. Prefer the **Recent Records** list on the calendar card during the demo.

## Chat assistant note

Chat (`/api/chat`) uses **live Gemini** at demo time. Seeded data powers bounded context.

**Fallback if chat returns 503:**

> "The assistant uses live AI; the dashboard, repository, and vault are fully powered by structured seeded data."

Chat is **bonus** — not required for marks. Dashboard, Repository, Vault, and Doctor Summary are the primary surfaces.

---

## Evaluation script (~5 minutes)

Memorize or print this flow.

### Act 1 — Problem (20 sec)

> "Medical records are scattered across PDFs and prescriptions. HealthLens turns them into a personal health intelligence profile — not just summaries."

### Act 2 — Login + dashboard (60 sec)

- Login: `demo@healthlens.ai` / `DemoHealth2026!`
- Vitality Snapshot: score ~68, conditions, medications
- **What Changed Since Your Last Report** — longitudinal brief (deterministic)
- Trend Analytics → **HbA1c** (3 points Jan → Mar → Jun)
- Needs Attention — improved vs March, still elevated
- "This is structured health memory, not document storage."

### Act 3 — Upload with history (10 sec)

- **Navbar → Upload** → upload zone appears (`/dashboard?upload=1`)
- "Users with existing reports can still add new documents."

### Act 4 — Repository (45 sec)

- Open **Repository** — medications, diagnoses, symptoms, advice across reports
- Point at Metformin rollup + Type 2 Diabetes (`active`)
- "Cross-report health memory in one place."

### Act 5 — Vault (30 sec)

- 4 cards; attention vs stable flags
- Timeline scrubber or open a report from Vault

### Act 6 — Doctor Summary (30 sec)

- **Doctor Summary** → print preview
- "Prepared for clinical discussion" — fast handoff for a new doctor

### Act 7 — AI assistant (optional, 30 sec)

- Ask: **"What medicines am I taking?"**
- Ask: **"What changed since my last lab report?"**
- If Gemini fails, use fallback line above.

### Act 8 — Safety close (15 sec)

> "HealthLens assists understanding and doctor communication. It does not diagnose or prescribe — medical decisions stay with healthcare professionals."

---

## Hybrid strategy

- **Before evaluation:** `RESET_DEMO_PASSWORD=true npm run seed:demo` once; confirm `LONGITUDINAL_AI_ENABLED=false`
- **During demo:** optional live upload for extraction wow moment (Navbar Upload)
- **If Gemini fails:** seeded data + deterministic insights still power the full story
- **Freeze after 3.3:** bug fixes and copy only — no new features

## Environment quick reference

| Variable | Eval recommendation |
|----------|---------------------|
| `MONGODB_URI` | Atlas (same as eval environment) |
| `JWT_SECRET` | Set |
| `LONGITUDINAL_AI_ENABLED` | `false` |
| `GEMINI_API_KEY` | Set if showing Chat or live interpret |
| Run mode | `npm run dev` |
