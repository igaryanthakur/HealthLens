#!/usr/bin/env node
/**
 * HealthLens end-to-end evaluation runner.
 *
 * Runs unit tests, re-seeds the demo patient, and exercises every API surface
 * used during evaluation (auth, dashboard, repository, vault, upload, interpret,
 * chat, doctor summary, error handling).
 *
 * Usage:
 *   npm run test:e2e
 *   node scripts/e2eEval.mjs
 *   node scripts/e2eEval.mjs --skip-unit --destructive
 *   node scripts/e2eEval.mjs --base http://localhost:5000
 *
 * Requires: MongoDB reachable via MONGODB_URI, server on --base (auto-starts if absent).
 * Optional: GROQ_API_KEY (interpret + chat), GEMINI_API_KEY (prescription upload),
 *           CLOUDINARY_* (storage during upload — skipped gracefully if unset).
 */
import { spawn } from "node:child_process";
import { once } from "node:events";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
require("dotenv").config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const DEMO = { email: "demo@healthlens.ai", password: "DemoHealth2026!" };

const args = process.argv.slice(2);
const flags = {
  skipUnit: args.includes("--skip-unit"),
  skipSeed: args.includes("--skip-seed"),
  destructive: args.includes("--destructive"),
  skipAi: args.includes("--skip-ai"),
  noStartServer: args.includes("--no-start-server"),
  skipClientBuild: args.includes("--skip-client-build"),
};
const baseIdx = args.indexOf("--base");
const BASE = baseIdx >= 0 ? args[baseIdx + 1] : "http://localhost:5000";

const log = [];
const findings = { P0: [], P1: [], P2: [] };
const blocks = {};
let serverProc = null;
let weStartedServer = false;
const createdReportIds = [];

function pass(block, step, note = "") {
  log.push({ block, step, result: "PASS", note, severity: "" });
  process.stdout.write(`  ✓ ${block} ${step}${note ? ` — ${note}` : ""}\n`);
}

function fail(block, step, note, severity = "P0") {
  log.push({ block, step, result: "FAIL", note, severity });
  findings[severity].push(`${block} ${step}: ${note}`);
  process.stdout.write(`  ✗ ${block} ${step} — ${note}\n`);
}

function skip(block, step, note) {
  log.push({ block, step, result: "SKIP", note, severity: "" });
  process.stdout.write(`  ○ ${block} ${step} — ${note}\n`);
}

function warn(block, step, note) {
  log.push({ block, step, result: "WARN", note, severity: "P2" });
  findings.P2.push(`${block} ${step}: ${note}`);
  process.stdout.write(`  ! ${block} ${step} — ${note}\n`);
}

async function req(pathname, opts = {}) {
  const res = await fetch(`${BASE}${pathname}`, opts);
  const json = await res.json().catch(() => ({}));
  return { res, json, status: res.status };
}

function runCommand(cmd, cmdArgs, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, cmdArgs, {
      cwd: ROOT,
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32",
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => {
      stdout += d;
    });
    child.stderr.on("data", (d) => {
      stderr += d;
    });
    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
    child.on("error", reject);
  });
}

async function waitForHealth(timeoutMs = 45000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const h = await req("/health");
      if (h.status === 200 && h.json.success) return true;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function ensureServer() {
  try {
    const h = await req("/health");
    if (h.status === 200) {
      pass("preflight", "health", "Server already running");
      return true;
    }
  } catch {
    /* not running */
  }

  if (flags.noStartServer) {
    fail("preflight", "health", `No server at ${BASE} (--no-start-server set)`);
    return false;
  }

  process.stdout.write(`  … Starting server at ${BASE} …\n`);
  serverProc = spawn("node", ["server.js"], {
    cwd: ROOT,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
    detached: false,
  });
  weStartedServer = true;

  const ok = await waitForHealth();
  if (ok) pass("preflight", "health", "Server started for e2e");
  else fail("preflight", "health", `Server did not become healthy within 45s`);
  return ok;
}

async function seedDemo() {
  const { code, stderr } = await runCommand("node", ["scripts/seedDemoPatient.js"], {
    RESET_DEMO_PASSWORD: "true",
  });
  if (code === 0) pass("preflight", "seed", "Demo patient re-seeded (4 reports, password reset)");
  else {
    fail("preflight", "seed", stderr.trim() || `seed exited ${code}`);
    return false;
  }
  return true;
}

async function runUnitTests() {
  const { code, stdout, stderr } = await runCommand("npm", ["test"]);
  const match = stdout.match(/ℹ pass (\d+)/);
  const count = match ? match[1] : "?";
  if (code === 0) pass("unit", "npm-test", `${count} unit tests passed`);
  else {
    fail("unit", "npm-test", `Unit tests failed (exit ${code})`);
    if (stderr) process.stderr.write(stderr.slice(-2000));
  }
  return code === 0;
}

async function runClientBuild() {
  const result = await runCommand("npm", ["run", "build", "--prefix", "client"]);
  if (result.code === 0) pass("unit", "client-build", "Vite production build OK");
  else {
    fail("unit", "client-build", result.stderr.trim().slice(-500) || "client build failed", "P1");
  }
  return result.code === 0;
}

function buildMinimalLabPdf() {
  const t1 = "CBC HAEMOGRAM";
  const t2 = "Haemoglobin (HB) : 8.6 g/dL 12.0-15.0";
  const stream = `BT /F1 12 Tf 50 750 Td (${t1}) Tj 0 -20 Td (${t2}) Tj ET`;
  const objs = [
    "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj",
    "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj",
    "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj",
    `4 0 obj<</Length ${stream.length}>>stream\n${stream}\nendstream\nendobj`,
    "5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const o of objs) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${o}\n`;
  }
  const xrefPos = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer<</Size ${objs.length + 1}/Root 1 0 R>>\nstartxref\n${xrefPos}\n%%EOF`;
  return Buffer.from(pdf);
}

async function uploadLabPdf(token) {
  const form = new FormData();
  const blob = new Blob([buildMinimalLabPdf()], { type: "application/pdf" });
  form.append("report", blob, "e2e-lab-report.pdf");
  form.append("documentType", "lab_report");

  const res = await fetch(`${BASE}/api/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function cleanupCreatedReports(token, auth) {
  for (const id of createdReportIds) {
    try {
      await req(`/api/reports/${id}`, { method: "DELETE", headers: auth });
    } catch {
      /* best effort */
    }
  }
}

async function main() {
  console.log("\nHealthLens E2E Evaluation Runner");
  console.log("================================\n");

  // Phase 0: unit tests + client build
  if (!flags.skipUnit) {
    console.log("Phase 0 — Unit tests");
    const unitOk = await runUnitTests();
    if (!unitOk) {
      printSummary();
      process.exit(1);
    }
  } else {
    skip("unit", "npm-test", "--skip-unit");
  }

  if (!flags.skipClientBuild) {
    console.log("\nPhase 0b — Client production build");
    await runClientBuild();
  } else {
    skip("unit", "client-build", "--skip-client-build");
  }

  // Phase 1: server + seed
  console.log("\nPhase 1 — Server & demo seed");
  const serverOk = await ensureServer();
  if (!serverOk) {
    printSummary();
    process.exit(1);
  }

  if (!flags.skipSeed) {
    const seedOk = await seedDemo();
    if (!seedOk) {
      printSummary();
      process.exit(1);
    }
  } else {
    skip("preflight", "seed", "--skip-seed");
  }

  // Phase 2: authenticated API flows
  console.log("\nPhase 2 — Auth & session");
  const login = await req("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(DEMO),
  });
  if (!login.json.success || !login.json.token) {
    fail("A", "login", login.json.message || "Demo login failed");
    blocks.A = false;
    printSummary();
    process.exit(1);
  }
  pass("A", "login", "demo@healthlens.ai");
  blocks.A = true;

  const token = login.json.token;
  const auth = { Authorization: `Bearer ${token}` };

  const noAuth = await req("/api/reports/history");
  if (noAuth.status === 401) pass("A", "auth-guard", "Protected routes require JWT");
  else fail("A", "auth-guard", `Expected 401 without token, got ${noAuth.status}`, "P1");

  const me = await req("/api/users/me", { headers: auth });
  if (me.json.user?.profile?.bloodGroup === "B+") pass("A", "profile", "Priya Sharma / B+");
  else fail("A", "profile", "Demo profile mismatch", "P1");

  // Block B — Dashboard data
  console.log("\nPhase 3 — Dashboard & longitudinal data");
  const history = await req("/api/reports/history", { headers: auth });
  const reports = history.json.reports ?? [];
  if (reports.length === 4) pass("B", "history", "4 seeded reports");
  else {
    fail("B", "history", `Expected 4 reports, got ${reports.length}`);
    blocks.B = false;
  }

  const latest = reports[reports.length - 1];
  if (latest) {
    const latestDate = new Date(latest.reportDate).toISOString().slice(0, 10);
    if (latestDate === "2026-06-05") pass("B", "default-report", "Latest is Jun 5 lab");
    else fail("B", "default-report", `Latest is ${latestDate}`, "P1");

    if (latest.vitalityScore === 68) pass("B", "vitality", "Score 68");
    else fail("B", "vitality", `Score ${latest.vitalityScore}`, "P1");
  }

  const insights = await req("/api/repository/insights", { headers: auth });
  if (insights.json.success) {
    const ins = insights.json.insights ?? {};
    const text = JSON.stringify(ins).toLowerCase();
    if (text.includes("hba1c")) pass("B", "insights-narrative", "HbA1c in insights");
    else fail("B", "insights-narrative", "HbA1c narrative missing", "P1");

    if (process.env.LONGITUDINAL_AI_ENABLED === "true" && !flags.skipAi) {
      if (ins.generatedBy === "ai") pass("B", "insights-ai", "Groq rewording active");
      else if (ins.generatedBy === "deterministic")
        warn("B", "insights-ai", "LONGITUDINAL_AI_ENABLED=true but got deterministic (Groq may have failed)");
      else pass("B", "insights-ai", `generatedBy=${ins.generatedBy}`);
    } else {
      if (ins.generatedBy === "deterministic") pass("B", "insights-deterministic", "Deterministic brief (eval mode)");
      else warn("B", "insights-deterministic", `generatedBy=${ins.generatedBy} (expected deterministic for eval)`);
    }
  } else {
    fail("B", "insights", "Insights endpoint failed");
  }

  const hba1cPoints = reports
    .filter((r) => (r.measurements ?? []).some((m) => m.name === "HbA1c"))
    .length;
  if (hba1cPoints === 3) pass("B", "hba1c-trend", "3 lab reports with HbA1c");
  else fail("B", "hba1c-trend", `Expected 3 HbA1c points, got ${hba1cPoints}`, "P1");

  const marRx = reports.find((r) => r.documentType === "prescription");
  if (marRx?.medications?.some((m) => /metformin/i.test(m.name))) {
    pass("B", "prescription", "Mar 22 Metformin prescription");
  } else {
    fail("B", "prescription", "Prescription Metformin missing", "P1");
  }
  blocks.B = blocks.B !== false;

  // Block D — Repository
  console.log("\nPhase 4 — Repository rollups");
  const endpoints = [
    ["overview", "/api/repository/overview"],
    ["medications", "/api/repository/medications"],
    ["diagnoses", "/api/repository/diagnoses"],
    ["symptoms", "/api/repository/symptoms"],
    ["advice", "/api/repository/advice"],
    ["timeline", "/api/repository/timeline"],
    ["summary", "/api/repository/summary"],
  ];

  let dOk = true;
  for (const [name, ep] of endpoints) {
    const r = await req(ep, { headers: auth });
    if (r.json.success) pass("D", name, "OK");
    else {
      fail("D", name, r.json.message || `HTTP ${r.status}`, "P1");
      dOk = false;
    }
  }

  const overview = await req("/api/repository/overview", { headers: auth });
  if (overview.json.success) {
    const s = overview.json.summary ?? {};
    for (const [k, exp] of [
      ["totalReports", 4],
      ["medications", 1],
      ["diagnoses", 1],
      ["events", 4],
    ]) {
      if (s[k] === exp) pass("D", `count-${k}`, `${k}=${exp}`);
      else fail("D", `count-${k}`, `${k}=${s[k]}`, "P1");
    }
  }
  blocks.D = dOk;

  // Block E — Vault stats
  console.log("\nPhase 5 — Vault readiness");
  const flagged = reports.filter((r) =>
    (r.measurements ?? []).some((m) => m.status === "high" || m.status === "low"),
  );
  if (flagged.length === 2) pass("E", "attention-count", "2 attention-needed reports");
  else fail("E", "attention-count", `Expected 2 flagged, got ${flagged.length}`, "P1");

  if (flags.destructive) {
    const jan15 = reports.find(
      (r) => new Date(r.reportDate).toISOString().slice(0, 10) === "2026-01-15",
    );
    if (jan15?._id) {
      const del = await req(`/api/reports/${jan15._id}`, { method: "DELETE", headers: auth });
      if (del.json.success) pass("E", "delete-jan15", "Deleted baseline report");
      else fail("E", "delete-jan15", del.json.message || "Delete failed", "P1");

      const hist2 = await req("/api/reports/history", { headers: auth });
      if ((hist2.json.reports ?? []).length === 3) pass("E", "post-delete-count", "3 reports remain");
      else fail("E", "post-delete-count", "Unexpected count after delete", "P1");
    } else {
      fail("E", "delete-jan15", "Jan 15 report not found", "P1");
    }
  } else {
    skip("E", "delete-jan15", "Use --destructive to test delete flow");
  }
  blocks.E = !findings.P0.some((f) => f.startsWith("E"));

  // Block F — Doctor summary
  console.log("\nPhase 6 — Doctor summary");
  const docSum = await req("/api/repository/doctor-summary", { headers: auth });
  if (docSum.json.success) {
    const sum = docSum.json.summary ?? {};
    const checks = [
      ["patient", () => sum.patient?.name?.includes("Priya")],
      ["medications", () => (sum.medications ?? []).length >= 1],
      ["diagnoses", () => (sum.diagnoses ?? []).length >= 1],
      ["vitals", () => (sum.latestVitals ?? []).length >= 1],
      ["abnormal", () => (sum.abnormalMarkers ?? []).length >= 1],
      ["disclaimer", () => (sum.disclaimer ?? "").length > 10],
      ["insights", () => (sum.insights?.summary ?? "").length > 5],
    ];
    let fOk = true;
    for (const [label, fn] of checks) {
      if (fn()) pass("F", label, "OK");
      else {
        fail("F", label, "Missing or empty", "P1");
        fOk = false;
      }
    }
    blocks.F = fOk;
  } else {
    fail("F", "load", "Doctor summary failed");
    blocks.F = false;
  }

  // Block C — Upload + interpret pipeline
  console.log("\nPhase 7 — Upload & interpret pipeline");
  const upload = await uploadLabPdf(token);
  if (upload.status === 200 && upload.json.success) {
    pass("C", "upload", `extracted ${upload.json.structured?.measurements?.length ?? 0} measurement(s)`);
    const hb = (upload.json.structured?.measurements ?? []).find((m) =>
      /hemoglobin/i.test(m.name ?? ""),
    );
    if (hb) pass("C", "upload-hb", `hemoglobin=${hb.value ?? hb.rawValue}`);
    else fail("C", "upload-hb", "Hemoglobin not extracted from PDF", "P1");

    if (upload.json.structured?.provenance?.cloudinaryPublicId) {
      pass("C", "cloudinary", "File stored for Vault download");
    } else {
      skip("C", "cloudinary", "CLOUDINARY_* not configured — upload OK without storage");
    }
  } else if (upload.status === 503) {
    fail("C", "upload", upload.json.message || "Upload unavailable", "P1");
  } else {
    fail("C", "upload", upload.json.message || `HTTP ${upload.status}`, "P1");
  }

  const structuredForInterpret =
    upload.json?.structured ??
    {
      reportType: "CBC",
      documentType: "lab_report",
      measurements: [
        {
          name: "hemoglobin",
          rawValue: 8.6,
          unit: "g/dL",
          referenceRange: "12.0-15.0",
          status: "low",
        },
      ],
      medications: [],
      diagnoses: [],
      flags: [],
    };

  if (!flags.skipAi && process.env.GROQ_API_KEY) {
    const interpret = await req("/api/interpret", {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({ structured: structuredForInterpret }),
    });
    if (interpret.status === 200 && interpret.json.success) {
      pass("C", "interpret", interpret.json.aiUnavailable ? "fallback save (Groq unavailable)" : "Groq interpretation saved");
      if (interpret.json.data?.summary?.length > 10) pass("C", "interpret-summary", "Summary returned");
      else fail("C", "interpret-summary", "Summary too short", "P1");
      if (interpret.json.reportId) {
        createdReportIds.push(interpret.json.reportId);
        pass("C", "interpret-persist", `reportId=${interpret.json.reportId}`);
      }
    } else {
      fail("C", "interpret", interpret.json.message || `HTTP ${interpret.status}`, "P1");
    }
  } else if (flags.skipAi) {
    skip("C", "interpret", "--skip-ai");
  } else {
    skip("C", "interpret", "GROQ_API_KEY not set — interpret AI skipped");
  }
  blocks.C = !findings.P0.some((f) => f.startsWith("C"));

  // Block H — Chat (Groq)
  console.log("\nPhase 8 — Chat assistant (Groq)");
  if (!flags.skipAi && process.env.GROQ_API_KEY) {
    const chat1 = await req("/api/chat", {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({ message: "What medicines am I taking?" }),
    });
    if (chat1.status === 200 && chat1.json.reply) {
      if (/metformin/i.test(chat1.json.reply)) pass("H", "medicines", "Metformin mentioned");
      else fail("H", "medicines", "Metformin not in reply", "P1");
      blocks.H = true;
    } else if (chat1.status === 503) {
      skip("H", "medicines", "Groq unavailable (503) — dashboard still eval-ready");
      blocks.H = "skipped";
    } else {
      fail("H", "medicines", `HTTP ${chat1.status}`, "P1");
      blocks.H = false;
    }

    const chat2 = await req("/api/chat", {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({ message: "What changed since my last lab report?" }),
    });
    if (chat2.status === 200 && chat2.json.reply?.length > 20) {
      pass("H", "longitudinal", "Longitudinal reply received");
    } else if (chat2.status === 503) {
      skip("H", "longitudinal", "Groq unavailable");
    } else {
      fail("H", "longitudinal", `HTTP ${chat2.status}`, "P1");
    }
  } else {
    skip("H", "chat", flags.skipAi ? "--skip-ai" : "GROQ_API_KEY not set");
    blocks.H = "skipped";
  }

  const longMsg = "x".repeat(1501);
  const chatLong = await req("/api/chat", {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ message: longMsg }),
  });
  if (chatLong.status === 400) pass("H", "max-length", "1500+ chars rejected");
  else fail("H", "max-length", `Expected 400, got ${chatLong.status}`, "P1");

  // Block J — Error handling
  console.log("\nPhase 9 — Error handling");
  const badId = await req("/api/reports/notavalidid123", { headers: auth });
  if (badId.status === 400) pass("J", "bad-id", "Malformed id → 400");
  else fail("J", "bad-id", `Expected 400, got ${badId.status}`, "P1");

  const noFile = await req("/api/upload", {
    method: "POST",
    headers: auth,
  });
  if (noFile.status === 400) pass("J", "no-file", "Upload without file → 400");
  else fail("J", "no-file", `Expected 400, got ${noFile.status}`, "P1");

  blocks.J = true;
  blocks.I = true;
  pass("I", "smoke", "All primary routes exercised");

  // Cleanup e2e-created reports
  if (createdReportIds.length) {
    await cleanupCreatedReports(token, auth);
    pass("cleanup", "reports", `Removed ${createdReportIds.length} e2e report(s)`);
  }

  // Re-seed if destructive or we modified data
  if (flags.destructive && !flags.skipSeed) {
    console.log("\nPhase 10 — Restore demo state");
    await seedDemo();
  }

  printSummary();
  const exitCode = findings.P0.length > 0 ? 1 : findings.P1.length > 0 ? 2 : 0;
  process.exit(exitCode);
}

function printSummary() {
  const passCount = log.filter((l) => l.result === "PASS").length;
  const failCount = log.filter((l) => l.result === "FAIL").length;
  const skipCount = log.filter((l) => l.result === "SKIP").length;

  console.log("\n================================");
  console.log("E2E Summary");
  console.log("================================");
  console.log(`  PASS: ${passCount}  FAIL: ${failCount}  SKIP: ${skipCount}`);
  console.log(`  P0 failures: ${findings.P0.length}`);
  console.log(`  P1 failures: ${findings.P1.length}`);
  if (findings.P0.length) {
    console.log("\n  Blockers (P0):");
    findings.P0.forEach((f) => console.log(`    - ${f}`));
  }
  if (findings.P1.length) {
    console.log("\n  Warnings (P1):");
    findings.P1.forEach((f) => console.log(`    - ${f}`));
  }
  console.log(
    `\n  Eval readiness: ${
      findings.P0.length === 0
        ? findings.P1.length === 0
          ? "READY"
          : "READY WITH WARNINGS"
        : "NOT READY"
    }\n`,
  );
}

async function shutdown() {
  if (weStartedServer && serverProc) {
    serverProc.kill();
    await once(serverProc, "close").catch(() => {});
  }
}

process.on("SIGINT", async () => {
  await shutdown();
  process.exit(130);
});

main()
  .catch(async (e) => {
    console.error(e);
    await shutdown();
    process.exit(1);
  })
  .finally(async () => {
    await shutdown();
  });
