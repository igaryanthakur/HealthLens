---
name: doctor summary ui
overview: "Stage 2.2: a protected, printable Doctor Summary page backed only by the existing GET /api/repository/doctor-summary endpoint, with entry buttons from Dashboard and Vault. Frontend-only; no backend changes unless a bug surfaces."
todos:
  - id: api-stub
    content: Add fetchDoctorSummary() to client/src/lib/api.js reusing authHeaders + parseJsonResponse
    status: completed
  - id: route
    content: Add lazy-loaded protected /doctor-summary route in App.jsx and add it to hideGlobalFooter
    status: completed
  - id: page
    content: "Create client/src/pages/DoctorSummary.jsx: fetch on mount, loading/error states, react-to-print print button, and the 9 doctor-readable sections with empty-state handling"
    status: completed
  - id: dashboard-button
    content: Add Doctor Summary nav button next to Export Report in components/Dashboard/Dashboard.jsx via useNavigate
    status: completed
  - id: vault-button
    content: Add Doctor Summary nav button in Vault.jsx filter/sort action row
    status: completed
  - id: verify
    content: Run npm run build --prefix client and complete manual print/empty-state checks
    status: completed
  - id: docs
    content: Update PROJECT_CONTEXT.md (Last Updated, changelog, frontend section, Stage 2.2 milestone row, build status)
    status: completed
isProject: false
---

# Stage 2.2 — Printable Doctor Summary UI / Export

Frontend-only feature. Backed entirely by the already-shipped, tested `GET /api/repository/doctor-summary` ([utils/doctorSummaryBuilder.js](utils/doctorSummaryBuilder.js)). No backend edits unless a bug appears.

## Data contract (verified, use these exact keys)

`json.summary` returns:
- `patient`: `name, email, age, gender, bloodGroup, heightCm, weightKg, bmi, chronicConditions[], lifestyle{ smokingStatus, alcoholConsumption }`
- `snapshot`: `totalReports, latestReportDate, labReportCount, activeConditionCount, currentMedicationCount, abnormalMarkerCount`
- `medications[]`: `name, count, firstSeen, lastSeen, latest{ dosage, frequency, duration, route }, uncertain`
- `diagnoses[]`: `condition, count, firstSeen, lastSeen, latestStatus`
- `symptoms[]`: `description, count, firstSeen, lastSeen`
- `advice[]`: `text, kind ("advice"|"test"), count, firstSeen, lastSeen`
- `latestVitals[]`: `name, value, unit, status, referenceRange, reportDate`
- `abnormalMarkers[]`: `marker, value, unit, status, referenceRange, reportDate`
- `timelineHighlights[]`: `date, type, title, reportType, summary` (capped at 8)
- `insights`: `summary, improvingSignals[], needsAttention[], doctorQuestions[], followUpSuggestions[]` (already `generatedBy`-stripped server-side)
- `disclaimer`, `generatedAt`

## 1. API stub — [client/src/lib/api.js](client/src/lib/api.js)

Add `fetchDoctorSummary()` next to the other `fetchRepository*` helpers. Reuse the existing module-internal `authHeaders()` + `parseJsonResponse(res)` (no new exports needed):

```js
export async function fetchDoctorSummary() {
  const res = await fetch('/api/repository/doctor-summary', {
    headers: authHeaders(),
  })
  return parseJsonResponse(res)
}
```

## 2. Route — [client/src/App.jsx](client/src/App.jsx)

- Add lazy import: `const DoctorSummary = lazy(() => import('./pages/DoctorSummary'))`.
- Add a protected `/doctor-summary` route mirroring the Vault block (`ProtectedRoute` + `Suspense fallback={<RouteLoader />}`).
- Add `'/doctor-summary'` to `hideGlobalFooter` (line 34). Leave `hideNavbar` untouched (Navbar stays on screen; it won't print since react-to-print only clones the `contentRef` subtree).

## 3. New page — `client/src/pages/DoctorSummary.jsx`

Responsibilities:
- `useEffect` fetch via `fetchDoctorSummary()` on mount; `loading` / `error` / `summary` state (cancelled-guard pattern, same as [Vault.jsx](client/src/pages/Vault.jsx)).
- Loading: centered `Loader2` spinner. Error: `"Unable to load doctor summary. Please try again."`.
- Print via react-to-print v3 (same API as [Dashboard.jsx](client/src/components/Dashboard/Dashboard.jsx)):

```js
const componentRef = useRef(null)
const handlePrint = useReactToPrint({
  contentRef: componentRef,
  documentTitle: 'HealthLens_Doctor_Summary',
})
```

- Screen-only action bar (`print:hidden`): a `Print / Save PDF` button + a back-to-dashboard link.
- Printable container: `<div ref={componentRef} className="bg-white ... print:shadow-none print:border-none">`.
- Small local date formatter (reuse the `formatReportDateLong` style from Vault); render `—` for null/invalid dates so the snapshot never shows `Invalid Date`.

### Layout (doctor-readable, no charts — lists/tables only)

Header: `HealthLens AI — Doctor Summary`, `Generated: <generatedAt>`, `Patient: <patient.name>`. Disclaimer (`summary.disclaimer`) rendered as a muted banner near the top and repeated in the footer of the printable area.

Sections in order, each a titled block:
1. Patient Profile — name, email, age, gender, blood group, height/weight/BMI, chronic conditions (chips), lifestyle.
2. Health Snapshot — totalReports, latestReportDate, labReportCount, activeConditionCount, currentMedicationCount, abnormalMarkerCount (stat grid).
3. Current / Recent Medications — table: name, latest dosage, latest frequency, first/last seen, count.
4. Diagnoses & Symptoms — diagnoses (condition + `latestStatus` + count/last seen); symptoms (description + count/last seen).
5. Advice & Tests Advised — `advice[]` grouped/tagged by `kind` (advice vs test), with last seen. (Included because the contract returns it.)
6. Latest Vitals — table: name, value+unit, status, reference range, report date.
7. Abnormal Markers — table: marker, value+unit, status, reference range, report date (empty -> "No abnormal markers in the latest lab report").
8. Timeline Highlights — date, title/type, summary (capped list).
9. Health Intelligence Brief — `insights.summary`, needs attention, improving signals, questions for doctor, follow-up suggestions.

Every section renders "No records available" (or a section-appropriate equivalent) when its array is empty, so an empty-history patient still prints cleanly.

## 4. Dashboard button — [client/src/components/Dashboard/Dashboard.jsx](client/src/components/Dashboard/Dashboard.jsx)

- Import `useNavigate` from `react-router-dom` (component renders inside `BrowserRouter`, so this is safe).
- Add a second header button next to `Export Report` (lines 66-73): `Doctor Summary`, `onClick={() => navigate('/doctor-summary')}`, same button styling + `print:hidden`. Keep `Export Report` as-is (it stays the current dashboard print).

## 5. Vault button — [client/src/pages/Vault.jsx](client/src/pages/Vault.jsx)

- Add a `Doctor Summary` button in the Filter/Sort action row (lines 183-199) using the existing `navigate` (already imported) -> `navigate('/doctor-summary')`. Whole-history action; no per-card buttons.

## 6. Print styling

Tailwind print utilities: action bar `print:hidden`; printable container `print:shadow-none print:border-none print:p-0`; keep backgrounds white. No Recharts on this page.

## 7. Verification

```powershell
npm run build --prefix client
```

Manual: `/doctor-summary` is protected; loads demo (Priya Sharma) summary; Print/Save PDF opens the browser dialog with only the summary content; Dashboard + Vault buttons navigate correctly; empty arrays render cleanly; no raw JSON or `generatedBy` visible; footer hidden on page/print; layout holds on narrow widths. Backend tests unchanged (180/180) since no backend edits.

## 8. Docs — [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md)

Per the project-context-maintenance rule: bump Last Updated; prepend a changelog bullet (Stage 2.2 Doctor Summary UI/export); note `/doctor-summary` route + `fetchDoctorSummary` in the frontend section; add a Stage 2.2 milestone row; record client build green (test count unchanged).