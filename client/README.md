# HealthLens — Frontend

React single-page application for [HealthLens AI](../README.md). Built with Vite, Tailwind CSS, and React Router.

## Run locally

From the **repository root** (recommended):

```bash
npm run dev
```

Opens at http://localhost:5173 with `/api` proxied to the backend on port 5000.

Frontend only (API must be running separately):

```bash
npm install
npm run dev --prefix client
```

Production build:

```bash
npm run build --prefix client
npm run preview --prefix client   # static preview only — no API proxy
```

> Use `npm run dev` from the repo root for full-stack development. Vite `preview` does not proxy API calls.

---

## Routes

| Path | Page | Auth |
|------|------|------|
| `/` | Landing | Public |
| `/login`, `/register` | Auth | Public |
| `/dashboard` | Upload + report dashboard | Protected |
| `/dashboard?upload=1` | Upload mode (with existing history) | Protected |
| `/dashboard?reportId=<id>` | Specific report | Protected |
| `/vault` | Report archive | Protected (lazy) |
| `/repository` | Health memory rollups | Protected (lazy) |
| `/doctor-summary` | Printable doctor summary | Protected (lazy) |
| `/chat` | AI assistant | Protected |
| `/profile` | Account & health profile | Protected |
| `/privacy`, `/terms` | Legal pages | Public |
| `/contact`, `/careers` | Support & careers | Public |
| `/blog` | Health blog | Public |

Auth gate: `ProtectedRoute` in `src/App.jsx` checks JWT in `localStorage`.

---

## Project structure

```
client/src/
├── App.jsx              # Router, Navbar, Footer, lazy routes
├── pages/               # Route-level pages
├── components/
│   ├── Dashboard/       # VitalitySnapshot, trends, biomarkers, insights
│   ├── Layout/          # Navbar, Footer
│   ├── Auth/            # Login/register panels
│   ├── UploadZone.jsx
│   ├── ProcessingView.jsx
│   └── ReviewExtraction.jsx
└── lib/
    ├── api.js           # API client, auth token, caches
    ├── trends.js        # Pure trend series logic
    ├── structured.js    # Report → dashboard payload
    └── biomarkerIntelligence.js
```

---

## API client (`src/lib/api.js`)

- JWT stored in `localStorage` (`healthlens_auth_token`)
- **Insights cache:** `localStorage`, keyed by report history signature
- **Repository overview cache:** in-memory session cache (cleared on auth change, upload, delete)

All protected calls send `Authorization: Bearer <token>`.

---

## Design system

**Vitality Core** — slate/teal palette, rounded cards, glass Navbar. Tokens live in `src/index.css` and Tailwind config.

Icons: [lucide-react](https://lucide.dev/). Charts: [Recharts](https://recharts.org/).

---

## Testing

No frontend test harness yet. Logic-heavy modules (`lib/trends.js`, `lib/biomarkerIntelligence.js`) are kept pure for future tests. Build gate:

```bash
npm run build --prefix client
```

---

## Related docs

- [Root README](../README.md) — full project overview
- [docs/DEMO.md](../docs/DEMO.md) — demo script and credentials
- [PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md) — backend API reference
