---
name: Repository UI Stage 2.3
overview: Add a protected `/repository` page that surfaces the existing cross-report aggregation endpoints as a clean, table-based "Personal Health Repository" — making HealthLens's structured longitudinal memory visible to evaluators. Frontend-only; no backend changes.
todos:
  - id: page
    content: Create client/src/pages/Repository.jsx with header, Promise.all load (loading/error/empty states), and 5 sections (summary stats, medications, diagnoses, symptoms, advice/tests) reusing DoctorSummary styling helpers
    status: completed
  - id: route
    content: Add lazy import + protected /repository route in client/src/App.jsx
    status: completed
  - id: navbar
    content: Add Repository link to logged-in nav in client/src/components/Layout/Navbar.jsx (between Vault and Assistant)
    status: completed
  - id: verify-docs
    content: Run client npm run build, then update PROJECT_CONTEXT.md (Last Updated, changelog, milestone table, file map)
    status: completed
isProject: false
---

# Stage 2.3 — Personal Health Repository UI

Frontend-only. All backend endpoints and client API stubs already exist and are verified. The work is one new page, a route, a Navbar link, and a doc update.

## Verified reality (no backend work needed)

- Endpoints live in [routes/repository.js](routes/repository.js): `/summary`, `/medications`, `/diagnoses`, `/symptoms`, `/advice` (all `protect`).
- Client stubs already exist in [client/src/lib/api.js](client/src/lib/api.js): `fetchRepositorySummary`, `fetchMedicationHistory`, `fetchDiagnosisHistory`, `fetchSymptomHistory`, `fetchAdviceHistory`.
- Confirmed payload shapes from [utils/repositoryAggregator.js](utils/repositoryAggregator.js) and the summary handler:
  - summary: `{ totalReports, medications, diagnoses, symptoms, advice, events }`
  - medications[]: `{ name, count, firstSeen, lastSeen, latest:{dosage,frequency,duration,route}, uncertain, occurrences[] }`
  - diagnoses[]: `{ condition, count, firstSeen, lastSeen, latestStatus, uncertain, occurrences[] }`
  - symptoms[]: `{ description, count, firstSeen, lastSeen, uncertain, occurrences[] }`
  - advice[]: `{ text, kind:"advice"|"test", count, firstSeen, lastSeen, occurrences[] }`

## 1. New page: `client/src/pages/Repository.jsx`

Model the structure and visual language on the existing [client/src/pages/DoctorSummary.jsx](client/src/pages/DoctorSummary.jsx) (slate/teal, `Section`, `EmptyState`, `SummaryTable`, `StatusBadge`, `formatDate`, `display`). Replicate those small helpers locally rather than refactoring a shared module (keeps Stage 2.3 self-contained; do not overbuild).

- Header: `Personal Health Repository` + subtitle `Structured health memory extracted from your records.` + a short explanatory line: `This page organizes extracted medicines, diagnoses, symptoms, advice, and tests across all uploaded records.`
- Data load: single `useEffect` with `Promise.all([...])` over the 5 fetchers; `cancelled` guard like DoctorSummary. On any rejection, render one clean full-page error with a Back-to-dashboard link (fail the whole page — acceptable per spec). Loading = centered spinner.
- A small `UncertainBadge` (amber pill) shown when `uncertain` is true on meds/diagnoses/symptoms.

### Section 1 — Summary stat strip
Row of stat cards from `summary`: Total Reports, Medications, Diagnoses, Symptoms, Advice/Tests (`summary.advice`), Timeline Events (`summary.events`).

### Section 2 — Medication History
`SummaryTable` columns: Medication, Dosage (`latest.dosage`), Frequency (`latest.frequency`), First Seen, Last Seen, Count. Append `UncertainBadge` next to name when `uncertain`. Empty copy: `No medications found yet.`

### Section 3 — Diagnosis History
Columns: Condition, Latest Status (`StatusBadge` on `latestStatus`), First Seen, Last Seen, Count, + uncertain badge. Empty copy: `No diagnoses found yet.`

### Section 4 — Symptom History
Columns: Symptom (`description`), First Seen, Last Seen, Count, + uncertain badge. Empty copy: `No symptoms found yet.`

### Section 5 — Doctor Advice & Tests
Split `advice[]` by `kind` into two clearly labeled sub-blocks: `Doctor Advice` (where `kind !== "test"`) and `Tests Advised` (where `kind === "test"`) — same partition pattern DoctorSummary already uses. Each row: text, First Seen, Last Seen, Count. Empty copy per sub-block: `No doctor advice found yet.` and `No tests advised yet.`

Dates (first/last seen) satisfy the "where items came from" acceptance criterion. Optional, low-risk nice-to-have: link the Count to nothing, but expose source via the dates only — keep it to dates to avoid overbuild.

## 2. Route: `client/src/App.jsx`

- Add `const Repository = lazy(() => import('./pages/Repository'))` next to the other lazy imports.
- Add a protected, `Suspense`-wrapped route `/repository` mirroring the `/vault` block.
- Repository has normal app chrome (Navbar + global Footer), so do NOT add it to `hideGlobalFooter`/`hideNavbar`.

## 3. Navbar link: `client/src/components/Layout/Navbar.jsx`

Add a `Repository` link in the logged-in nav, between `Vault` and `Assistant`, using the same `text-on-surface-variant hover:text-primary` styling.

## 4. Verify + document

- Run `npm run build` in [client/](client/) — must pass (frontend has no test harness; build is the gate).
- Update [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) per [.cursor/rules/project-context-maintenance.mdc](.cursor/rules/project-context-maintenance.mdc): bump Last Updated, add a Stage 2.3 changelog entry, mark Stage 2.3 Done in the milestone table, add `/repository` to the §8 frontend file map and route list. Backend test count unchanged (180).

## Out of scope (freeze discipline)

No charts, no timeline page, no backend changes, no new endpoints, no per-occurrence drill-down modal. Vault stays the document archive; Repository is the structured memory view.