# HealthLens AI

**A Personal Health Intelligence System** — turn scattered medical documents into structured health memory, longitudinal insights, and doctor-ready summaries.

> HealthLens assists understanding and organization. It does **not** diagnose, prescribe, or replace professional medical advice.

---

## What is HealthLens?

Most people store health records as PDFs, lab printouts, and prescriptions in folders or email. HealthLens helps you:

1. **Upload** lab reports and prescriptions (PDF or image)
2. **Extract** biomarkers and clinical entities with deterministic parsing (numbers are never guessed by AI)
3. **Interpret** results in plain language via Groq (Llama 3.3 70B)
4. **Track** changes over time — trends, alerts, and a personal health timeline
5. **Remember** medications, diagnoses, and advice across all reports in one **Repository**
6. **Export** a printable **Doctor Summary** for clinical handoffs
7. **Chat** with an assistant grounded in your uploaded records (optional)

This is **not** a one-off report summarizer. It builds **longitudinal health intelligence** from your document history.

---

## Quick start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [MongoDB](https://www.mongodb.com/) — local or [Atlas](https://www.mongodb.com/atlas) (`MONGODB_URI`)
- [Google Gemini API key](https://aistudio.google.com/apikey) — required for prescription Vision (multimodal)
- [Groq API key](https://console.groq.com/) — required for lab interpretation, chat, and clinical document extraction

### 1. Clone and install

```bash
git clone <your-repo-url>
cd HealthLens
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Edit `.env` — minimum required:

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for auth tokens |
| `GROQ_API_KEY` | Groq API key (interpret, chat, entity docs) |
| `GEMINI_API_KEY` | Google Gemini API key (prescription Vision only) |

### 3. Seed demo data (recommended first run)

```bash
npm run seed:demo
```

**Demo login:** `demo@healthlens.ai` / `DemoHealth2026!`

Includes a 4-report patient story (Jan–Jun 2026) with labs, prescription, and trends. See [docs/DEMO.md](docs/DEMO.md) for the full evaluation script.

### 4. Run the app

```bash
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:5000 |

Register your own account, or use the demo credentials above.

---

## Main features

| Feature | Route | Description |
|---------|-------|-------------|
| Dashboard | `/dashboard` | Vitality score, trends, longitudinal insights, biomarker breakdown |
| Health Vault | `/vault` | Searchable archive of all uploaded reports |
| Repository | `/repository` | Cross-report rollups: meds, diagnoses, symptoms, advice |
| Doctor Summary | `/doctor-summary` | Printable consolidated summary for clinicians |
| Assistant | `/chat` | AI chat grounded in your health records |
| Profile | `/profile` | Account, security, and health profile |
| Privacy / Terms | `/privacy`, `/terms` | Legal pages |
| Contact / Careers | `/contact`, `/careers` | Team and support |
| Health Blog | `/blog` | Preventive health articles |

**Upload:** Navbar → **Upload** (`/dashboard?upload=1`) — works even when you already have reports.

---

## Architecture (high level)

```
Upload (PDF/image)
    → Deterministic extraction (pdf-parse / OCR / regex pipeline)
    → Structured JSON (measurements + entities)
    → Groq interpretation (plain-language summary)
    → MongoDB (per-user reports)
    → Dashboard, Repository, Doctor Summary, Chat
```

**Design principle:** LLMs interpret and explain — they **never** extract numeric lab values from raw OCR text. Extraction is deterministic and testable.

See [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) for the full pipeline, API reference, and file map.

---

## Tech stack

| Layer | Technologies |
|-------|----------------|
| Frontend | React, Vite, Tailwind CSS, Recharts, React Router |
| Backend | Node.js, Express 5, Mongoose |
| Database | MongoDB |
| Auth | JWT, bcrypt |
| Extraction | pdf-parse, pdfjs-dist, Tesseract.js, sharp |
| AI | Groq (text) + Google Gemini (prescription Vision) |

---

## Development

```bash
npm test                    # 221 backend unit tests
npm run test:e2e            # Full evaluation runner (unit + build + API)
npm run build --prefix client
node scripts/qaStage31.mjs  # Legacy API smoke (destructive — re-seed after)
```

| Script | Description |
|--------|-------------|
| `npm run dev` | Backend + frontend concurrently |
| `npm start` | Backend only |
| `npm run test:e2e` | End-to-end eval check before demo |
| `npm run seed:demo` | Seed demo patient (idempotent) |

---

## Documentation

| Doc | Contents |
|-----|----------|
| [docs/DEMO.md](docs/DEMO.md) | Evaluation demo script (~5 min), env tips, checklist |
| [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) | Technical reference for contributors |
| [client/README.md](client/README.md) | Frontend structure and dev notes |

---

## Environment reference

| Variable | Required | Notes |
|----------|----------|-------|
| `MONGODB_URI` | Yes* | *Falls back to `localhost:27017/healthlens` if unset |
| `JWT_SECRET` | Yes | Auth signing secret |
| `GEMINI_API_KEY` | For AI features | Interpret, chat, prescription Vision |
| `LONGITUDINAL_AI_ENABLED` | No | Set `false` for deterministic-only insights (recommended for demos) |
| `GEMINI_VISION_MODEL` | No | Pin Vision model if default alias returns 503 |

Full list: [.env.example](.env.example)

---

## Medical & privacy notice

- HealthLens is an **educational / demonstration** project.
- Do not upload real patient data to shared or production deployments without proper consent and compliance review.
- Never commit `.env` or API keys to version control.

---

## License

ISC — see [package.json](package.json).
