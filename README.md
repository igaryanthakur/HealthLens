# HealthLens AI - Clinical Filtering Backend MVP

This phase builds a backend-only Node.js service that accepts medical reports, extracts text locally, runs deterministic clinical filtering, and returns both traceable cleaned text and structured clinical measurements.

## Project context

For architecture, vision, milestone status, and agent onboarding, see [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md).  
This file is updated automatically after significant changes.

## Scope (This Phase)

- Upload medical report files (`PDF`, `JPG`, `JPEG`, `PNG`)
- Extract text locally (`pdf-parse` and OCR fallback with `tesseract.js`)
- Deterministic full cleanup (`cleanedTextFull`)
- Clinically focused subset (`cleanedTextClinical`)
- Structured JSON extraction (`structured.patient_info`, `structured.measurements`)
- Canonical-alias range-stripping extractor (38 parameters from `canonicalMap.json`)
- LLM-ready `aiPrompt` text generated from structured output
- Gemini-powered interpretation (`summary`, `findings`, `recommendations`) via `POST /api/interpret`
- Deterministic status/priority assignment (range first, thresholds fallback)

Not included in this phase:
- MongoDB
- Frontend

## Tech Stack

- Node.js + Express
- Multer
- pdf-parse
- pdfjs-dist (+ @napi-rs/canvas for PDF page rendering)
- sharp
- tesseract.js
- @google/generative-ai (Gemini 1.5 Flash)
- dotenv

## Project Structure

- `server.js`
- `routes/interpret.js`
- `middleware/upload.js`
- `services/aiService.js`
- `services/extractionService.js`
- `services/clinicalFilterService.js`
- `services/pdfService.js`
- `services/ocrService.js`
- `utils/textCleanup.js`
- `utils/clinical/metadataPrepass.js`
- `utils/clinical/boilerplateRemoval.js`
- `utils/clinical/candidateFilter.js`
- `utils/clinical/parameterRegexMap.js` (canonical-alias range-stripping extractor)
- `utils/aiContextGenerator.js`
- `utils/clinical/referenceRangeParser.js`
- `utils/clinical/statusPriorityEngine.js`
- `utils/clinical/dedupeProvenance.js`
- `utils/fileCleanup.js`
- `utils/logger.js`
- `uploads/`

## Setup

1) Install dependencies:

```bash
npm install
```

2) Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Set `GEMINI_API_KEY` in `.env` (required for `POST /api/interpret`). Get a key from [Google AI Studio](https://aistudio.google.com/apikey).

3) Start the backend:

```bash
npm run dev
```

or

```bash
npm start
```

Server default: `http://localhost:5000`

## Environment Variables

- `PORT=5000`
- `UPLOAD_MAX_SIZE_MB=10`
- `PDF_MIN_TEXT_LENGTH=100`
- `OCR_LANGUAGE=eng`

## API Endpoints

### Health check

`GET /health`

Example response:

```json
{
  "success": true,
  "status": "ok",
  "service": "healthlens-ai-extraction-backend"
}
```

### Upload and extract

`POST /api/upload`

Use `multipart/form-data` with file field name: `report`

#### cURL (PDF)

```bash
curl -X POST http://localhost:5000/api/upload \
  -F "report=@/absolute/path/to/report.pdf"
```

#### cURL (Image)

```bash
curl -X POST http://localhost:5000/api/upload \
  -F "report=@/absolute/path/to/report.jpg"
```

Windows PowerShell example:

```powershell
curl.exe -X POST http://localhost:5000/api/upload -F "report=@C:/Users/aryan/Downloads/reports.pdf"
```

Expected response format:

```json
{
  "success": true,
  "originalFilename": "reports.pdf",
  "extractionMethod": "pdf-parse",
  "cleanedText": "....",
  "cleanedTextFull": "....",
  "cleanedTextClinical": "Report Date: 2026-05-19\nhemoglobin: 8.6 g/dL | Ref: 12-16 | Status: low",
  "structured": {
    "patient_info": {
      "reportDate": "2026-05-19"
    },
    "reportType": "CBC",
    "measurements": [
      {
        "id": "cbc_hemoglobin",
        "category": "CBC",
        "name": "hemoglobin",
        "rawValue": "8.6",
        "normalizedValue": 8.6,
        "rawUnit": "g/dL",
        "unit": "g/dL",
        "normalizedUnit": "g/dL",
        "referenceRange": "12-16",
        "status": "low",
        "priority": "critical",
        "method": "generalized_stripper",
        "confidence": 0.96,
        "confidenceSource": "ocr",
        "validation": {
          "ok": true,
          "reason": null,
          "validationError": false
        },
        "sourcePage": 13,
        "sourceBBox": { "x": 120, "y": 560, "w": 220, "h": 18 },
        "sourceLine": 28,
        "sourceLineText": "Haemoglobin (HB) : 8.6 g/dL"
      }
    ],
    "flags": ["possible_anemia"],
    "severity": { "possible_anemia": "high" },
    "notes": null
  }
}
```

Notes:
- `cleanedText` is kept temporarily for backward compatibility and mirrors `cleanedTextFull`.
- `cleanedTextClinical` is intended as LLM input alongside the separate interpret endpoint.
- `patient_info` contains only `reportDate` (supports `Customer Since: 25/Apr/2026` and similar formats).
- Extraction uses `generalized_stripper`: canonical aliases + reference-range stripping + label masking (prevents false values from labels like `B12` or `25-OH`).
- `sourcePage/sourceBBox` are usually available for OCR paths, and nullable for direct digital PDF parsing.

Possible extraction methods:

- `pdf-parse` (digital PDF)
- `pdf-ocr-fallback` (scanned PDF fallback OCR)
- `image-ocr` (uploaded image OCR)

### AI interpretation (interpret)

`POST /api/interpret`

Accepts JSON body with the `structured` object returned from upload. Builds a token-efficient prompt via `aiContextGenerator`, then calls Gemini 1.5 Flash with a strict JSON schema. Requires `GEMINI_API_KEY` in `.env`.

#### cURL

```bash
curl -X POST http://localhost:5000/api/interpret \
  -H "Content-Type: application/json" \
  -d '{"structured":{"reportType":"CBC","patient_info":{"reportDate":"2026-04-25"},"measurements":[]}}'
```

Example response:

```json
{
  "success": true,
  "aiPrompt": "MEDICAL REPORT CONTEXT:\n- Report Type: CBC\n...",
  "data": {
    "summary": "Brief overview of overall health based on the report.",
    "findings": [
      {
        "parameter": "Hemoglobin",
        "status": "Low",
        "explanation": "One-sentence, jargon-free explanation."
      }
    ],
    "recommendations": ["Actionable lifestyle or dietary tip."]
  }
}
```

Typical flow: upload a report with `POST /api/upload`, then pass the `structured` field to `POST /api/interpret` to obtain `data` (and `aiPrompt` for debugging).

## Deterministic Clinical Filtering Rules

The filtering pipeline:

- extracts report date from common lab date formats (`DD/MM/YYYY`, `DD/MMM/YYYY`, keyword-prefixed dates)
- removes boilerplate lines (`Booking ID`, machine/method lines, page markers, advisory/marketing text)
- removes obvious OCR noise and repeated headers/footers
- keeps only clinical candidate lines (measurement + metadata signal)
- extracts rubric measurements via canonical-alias range-stripping (CBC, Diabetes, Lipid, Kidney, Liver, Iron, Vitamins, Thyroid)
- parses reference ranges and assigns deterministic status/priority
- deduplicates repeated measurements while preserving source trace
- generates `aiPrompt` and Gemini interpretation (`data`) via separate `POST /api/interpret`

## Verification Checklist

1) **Text-based PDF**
- Upload a digital PDF.
- Confirm response has non-empty `cleanedTextFull`, `cleanedTextClinical`.
- Confirm `extractionMethod` is typically `pdf-parse`.
- Confirm `structured.measurements` includes expected keys and values.

2) **Scanned PDF**
- Upload a scanned PDF with image-like pages.
- Confirm OCR fallback is used when direct parse text is too short.
- Confirm `extractionMethod` becomes `pdf-ocr-fallback`.
- Confirm clinical output remains focused and shorter than full output.

3) **Image Upload (JPG/JPEG/PNG)**
- Upload a clear report image.
- Confirm response includes OCR-based `cleanedTextFull` and extracted `structured.measurements`.
- Confirm `extractionMethod` is `image-ocr`.

4) **Clinical value checks**
- Verify key values appear in `structured.measurements` when present:
  - Hemoglobin
  - HbA1c
  - Vitamin D
  - Glucose
  - Total Cholesterol
  - Creatinine

5) **Console proof**
- Check terminal logs for:
  - extraction completion metadata
  - clinical preview output (not full PHI dump)

## Error Handling

- Invalid file type -> `400`
- File too large -> `400`
- Unexpected server errors -> `500`

Uploaded files are removed after processing (success/failure cleanup path included).
