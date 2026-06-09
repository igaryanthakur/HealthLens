# HealthLens AI — Evaluation Demo Guide

## Prerequisites

- MongoDB running locally (`mongodb://localhost:27017/healthlens`)
- `npm install` completed in the project root
- **No `GEMINI_API_KEY` required** to seed demo data

## Seed the demo patient

```bash
npm run seed:demo
```

Safe to run multiple times (idempotent). Re-running deletes and re-inserts **only** the demo user's reports.

To reset the demo password on an existing account:

```bash
RESET_DEMO_PASSWORD=true npm run seed:demo
```

If you skip that flag, the seed log will note: `Password unchanged (set RESET_DEMO_PASSWORD=true to reset)`.

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

## Post-seed API checks

```bash
# 1. Login
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@healthlens.ai","password":"DemoHealth2026!"}'

# 2. Use the token from the response:
# export TOKEN="<jwt>"

curl -s http://localhost:5000/api/reports/history -H "Authorization: Bearer $TOKEN"
curl -s http://localhost:5000/api/repository/medications -H "Authorization: Bearer $TOKEN"
curl -s http://localhost:5000/api/repository/diagnoses -H "Authorization: Bearer $TOKEN"
curl -s http://localhost:5000/api/repository/timeline -H "Authorization: Bearer $TOKEN"
curl -s http://localhost:5000/api/repository/summary -H "Authorization: Bearer $TOKEN"
```

**Expected:** 4 reports; Metformin in medications; Type 2 Diabetes (`latestStatus: active`); 4 timeline events.

## Frontend verification checklist

| # | Action | Expected |
|---|--------|----------|
| 1 | Login as demo user | Dashboard loads latest report (Jun 5) |
| 2 | Vitality Snapshot | Score ~68, Metformin + Type 2 Diabetes pills |
| 3 | Trend Analytics | HbA1c shows 3 points (Jan → Mar → Jun) |
| 4 | Needs Attention | HbA1c/Glucose high with ↓ deltas vs March |
| 5 | Mini calendar | Use **Recent Records** list for cross-month events; Jun dot visible in June view; navigate back for Jan/Mar |
| 6 | Timeline scrubber | 4 pills; switching changes dashboard |
| 7 | Select prescription (Mar 22) | DocumentEntitiesCard with Metformin |
| 8 | Vault | 4 cards; 2 Attention Needed, 2 Stable |
| 9 | Profile page | Priya's demographics filled |
| 10 | Run `npm run seed:demo` twice | Same dashboard state (idempotency) |

### Mini calendar tip

Dates span **Jan–Jun 2026**. The calendar opens on the current month. During the demo, prefer the **Recent Records** list on the calendar card (always shows the last 4 reports), or briefly navigate to March while saying "events across the year."

## Chat assistant note

Chat (`/api/chat`) **requires Gemini at demo time**. Seeded data powers bounded context, but replies still go through the live AI service.

**Fallback if chat returns 503:**

> "The assistant uses live AI; the dashboard and vault are fully seeded and continue to demonstrate the platform."

Do not block evaluation on chat if Gemini quota is tight — dashboard, vault, and trends are the primary demo surfaces.

## Evaluation script (3–4 minutes)

### Act 1 — Problem (20 sec)

> "Medical records are scattered across PDFs and prescriptions. HealthLens turns them into a personal health intelligence profile."

### Act 2 — Login + snapshot (45 sec)

- Login: `demo@healthlens.ai`
- Point at Vitality Snapshot: score, conditions, medications, alerts
- "This is not document storage — it's a living health profile."

### Act 3 — Longitudinal view (60 sec)

- Trend Analytics → select **HbA1c**
- Needs Attention → "improved from 6.8 but still elevated"
- Recent Records + timeline scrubber → "full history at a glance"

### Act 4 — Multi-document intelligence (45 sec)

- Select **prescription** report → meds, advice, tests advised
- Vault → searchable archive, attention flags

### Act 5 — AI assistant (30 sec)

- Ask: **"What medicines am I taking?"**
- Ask: **"What changed since my last lab report?"**
- If Gemini fails, use the fallback line above.

### Act 6 — Optional live extraction (30 sec)

- Upload a real lab PDF
- Show upload → structured extraction → AI interpretation
- If Gemini fails: point at **aiUnavailable banner** — "structured data still saved"

### Act 7 — Safety close (15 sec)

> "HealthLens assists understanding and organization. It does not diagnose or prescribe — medical decisions stay with healthcare professionals."

## Hybrid strategy

- **Before evaluation:** run `npm run seed:demo` once
- **During demo:** optional live upload for extraction wow moment
- **If Gemini fails:** seeded data still powers the full dashboard story
