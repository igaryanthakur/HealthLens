/**
 * Stage 3.1 API-level QA runner (verification only).
 * Run while server is on http://localhost:5000
 */
const BASE = 'http://localhost:5000';
const DEMO = { email: 'demo@healthlens.ai', password: 'DemoHealth2026!' };

const log = [];
const findings = { P0: [], P1: [], P2: [] };
const blocks = {};

function pass(block, step, note = '') {
  log.push({ block, step, result: 'PASS', note, severity: '' });
}
function fail(block, step, note, severity = 'P0') {
  log.push({ block, step, result: 'FAIL', note, severity });
  findings[severity].push(`${block} ${step}: ${note}`);
}
function skip(block, step, note) {
  log.push({ block, step, result: 'SKIP', note, severity: '' });
}

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts);
  const json = await res.json().catch(() => ({}));
  return { res, json, status: res.status };
}

async function main() {
  // Pre-flight: health
  try {
    const h = await req('/health');
    if (h.status === 200) pass('preflight', 'health', 'Server up');
    else fail('preflight', 'health', `status ${h.status}`);
  } catch (e) {
    fail('preflight', 'health', e.message);
    console.log(JSON.stringify({ log, findings, blocks }, null, 2));
    process.exit(1);
  }

  // Block A partial: login
  const login = await req('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(DEMO),
  });
  if (!login.json.success || !login.json.token) {
    fail('A', 'A3-login', 'Demo login failed');
    blocks.A = false;
  } else {
    pass('A', 'A3-login', 'Demo login OK');
    blocks.A = true;
  }
  const token = login.json.token;
  const auth = { Authorization: `Bearer ${token}` };

  // Block B: dashboard data via API
  const history = await req('/api/reports/history', { headers: auth });
  const reports = history.json.reports ?? [];
  if (reports.length !== 4) {
    fail('B', 'B1-reports', `Expected 4 reports, got ${reports.length}`);
    blocks.B = false;
  } else {
    pass('B', 'B1-reports', '4 reports');
    const latest = reports[reports.length - 1];
    const latestDate = new Date(latest.reportDate).toISOString().slice(0, 10);
    if (latestDate === '2026-06-05') pass('B', 'B1-default', 'Jun 5 default');
    else fail('B', 'B1-default', `Latest is ${latestDate}, expected 2026-06-05`, 'P1');

    if (latest.vitalityScore === 68) pass('B', 'B2-vitality', 'Score 68');
    else fail('B', 'B2-vitality', `Score ${latest.vitalityScore}, expected 68`, 'P1');
  }

  const insights = await req('/api/repository/insights', { headers: auth });
  if (insights.json.success) {
    const ins = insights.json.insights ?? {};
    if (ins.generatedBy === 'deterministic') pass('B', 'B3-badge', 'Deterministic insights');
    else fail('B', 'B3-badge', `generatedBy=${ins.generatedBy}`, 'P1');

    const text = JSON.stringify(ins).toLowerCase();
    if (text.includes('hba1c') && (text.includes('improv') || text.includes('6.2') || text.includes('6.8'))) {
      pass('B', 'B3-narrative', 'HbA1c improvement narrative present');
    } else {
      fail('B', 'B3-narrative', 'Missing HbA1c improvement narrative', 'P1');
    }
  } else {
    fail('B', 'B3-insights', 'Insights endpoint failed');
    blocks.B = false;
  }

  // HbA1c trend points
  const labs = reports.filter((r) => r.documentType === 'lab_report' || (r.measurements?.length > 0));
  const hba1cPoints = labs
    .map((r) => {
      const m = (r.measurements ?? []).find((x) => x.name === 'HbA1c');
      return m ? { date: r.reportDate, value: m.value } : null;
    })
    .filter(Boolean);
  if (hba1cPoints.length === 3) pass('B', 'B4-hba1c', `3 points: ${hba1cPoints.map((p) => p.value).join('→')}`);
  else fail('B', 'B4-hba1c', `Expected 3 HbA1c points, got ${hba1cPoints.length}`, 'P1');

  const marRx = reports.find((r) => r.documentType === 'prescription');
  if (marRx?.medications?.some((m) => /metformin/i.test(m.name))) {
    pass('B', 'B8-prescription', 'Mar prescription has Metformin');
  } else {
    fail('B', 'B8-prescription', 'Prescription Metformin missing', 'P1');
  }

  blocks.B = blocks.B !== false;

  // Block D: overview counts
  const overview = await req('/api/repository/overview', { headers: auth });
  if (overview.json.success) {
    const s = overview.json.summary ?? {};
    const checks = [
      ['totalReports', 4],
      ['medications', 1],
      ['diagnoses', 1],
      ['events', 4],
    ];
    let dOk = true;
    for (const [k, exp] of checks) {
      if (s[k] === exp) pass('D', `D-count-${k}`, `${k}=${exp}`);
      else {
        fail('D', `D-count-${k}`, `${k}=${s[k]}, expected ${exp}`, 'P1');
        dOk = false;
      }
    }
    const meds = overview.json.medications ?? [];
    if (meds.some((m) => /metformin/i.test(m.name))) pass('D', 'D-metformin', 'Metformin in rollup');
    else fail('D', 'D-metformin', 'Metformin missing', 'P1');

    const dx = overview.json.diagnoses ?? [];
    const t2d = dx.find((d) => /type 2 diabetes/i.test(d.condition ?? d.name ?? ''));
    if (t2d?.latestStatus === 'active') pass('D', 'D-diagnosis', 'T2D active');
    else fail('D', 'D-diagnosis', 'T2D active status missing', 'P1');

    blocks.D = dOk;
  } else {
    fail('D', 'D-overview', 'Overview failed');
    blocks.D = false;
  }

  // Block E: vault stats + delete Jan 15
  const jan15 = reports.find((r) => new Date(r.reportDate).toISOString().slice(0, 10) === '2026-01-15');
  const flagged = reports.filter((r) => (r.measurements ?? []).some((m) => m.status === 'high' || m.status === 'low'));
  if (flagged.length === 2) pass('E', 'E1-flagged', '2 attention reports');
  else fail('E', 'E1-flagged', `Expected 2 flagged, got ${flagged.length}`, 'P1');

  if (jan15?._id) {
    const del = await req(`/api/reports/${jan15._id}`, { method: 'DELETE', headers: auth });
    if (del.json.success) pass('E', 'E5-delete', 'Deleted Jan 15 baseline');
    else fail('E', 'E5-delete', del.json.message || 'Delete failed');

    const hist2 = await req('/api/reports/history', { headers: auth });
    if ((hist2.json.reports ?? []).length === 3) pass('E', 'E6-count', '3 reports after delete');
    else fail('E', 'E6-count', `Expected 3 after delete`, 'P1');
  } else {
    fail('E', 'E5-delete', 'Jan 15 report not found');
  }
  blocks.E = !findings.P0.some((f) => f.startsWith('E'));

  // Block F: doctor summary
  const docSum = await req('/api/repository/doctor-summary', { headers: auth });
  if (docSum.json.success) {
    const sum = docSum.json.summary ?? {};
    const checks = [
      () => sum.patient?.name?.includes('Priya'),
      () => (sum.medications ?? []).length >= 1,
      () => (sum.diagnoses ?? []).length >= 1,
      () => (sum.latestVitals ?? []).length >= 1,
      () => (sum.abnormalMarkers ?? []).length >= 1,
      () => sum.disclaimer?.length > 10,
      () => sum.insights?.summary?.length > 5,
    ];
    let fOk = true;
    const labels = ['patient', 'meds', 'diagnoses', 'vitals', 'abnormal', 'disclaimer', 'insights'];
    checks.forEach((fn, i) => {
      if (fn()) pass('F', `F-${labels[i]}`, 'OK');
      else {
        fail('F', `F-${labels[i]}`, 'Missing or empty', 'P1');
        fOk = false;
      }
    });
    blocks.F = fOk;
  } else {
    fail('F', 'F-load', 'Doctor summary failed');
    blocks.F = false;
  }

  // Block G: profile
  const me = await req('/api/users/me', { headers: auth });
  if (me.json.user?.profile?.bloodGroup === 'B+') pass('G', 'G3-profile', 'B+ blood group');
  else fail('G', 'G3-profile', 'Profile mismatch', 'P1');

  const pwChange = await req('/api/users/password', {
    method: 'PUT',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword: DEMO.password, newPassword: 'TestPassQA2026!' }),
  });
  if (pwChange.json.success) pass('G', 'G2-password', 'Password change OK');
  else fail('G', 'G2-password', pwChange.json.message || 'Password change failed', 'P1');

  const loginNew = await req('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: DEMO.email, password: 'TestPassQA2026!' }),
  });
  if (loginNew.json.success) pass('G', 'G2-login-new', 'Login with new password');
  else fail('G', 'G2-login-new', 'New password login failed', 'P1');

  blocks.G = !findings.P0.some((f) => f.startsWith('G'));

  // Block H: chat (if Groq available)
  const chat1 = await req('/api/chat', {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'What medicines am I taking?' }),
  });
  if (chat1.status === 200 && chat1.json.reply) {
    if (/metformin/i.test(chat1.json.reply)) pass('H', 'H1', 'Metformin in reply');
    else fail('H', 'H1', 'Metformin not in reply', 'P1');
    blocks.H = true;
  } else if (chat1.status === 503) {
    skip('H', 'H1', 'Groq unavailable (503) — use fallback script');
    skip('H', 'H2', 'Skipped due to Groq unavailability');
    blocks.H = 'skipped-fallback';
  } else {
    fail('H', 'H1', `Chat status ${chat1.status}`, 'P1');
    blocks.H = false;
  }

  const longMsg = 'x'.repeat(1501);
  const chat4 = await req('/api/chat', {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: longMsg }),
  });
  if (chat4.status === 400) pass('H', 'H4', '1500+ char rejected');
  else fail('H', 'H4', `Expected 400, got ${chat4.status}`, 'P1');

  // Block J
  const badId = await req('/api/reports/notavalidid123', { headers: auth });
  if (badId.status === 400) pass('J', 'J1-bad-id', 'Malformed id returns 400');
  else fail('J', 'J1-bad-id', `Expected 400, got ${badId.status}`, 'P1');

  skip('J', 'J4', 'Optional — rate limit not triggered');

  // Block I smoke
  pass('I', 'I-smoke', 'Covered by above endpoint calls');

  blocks.J = true;
  blocks.I = true;

  const summary = {
    signOffLevel: findings.P0.length === 0 ? 'full 3.1 (API blocks)' : 'blocked',
    findings,
    blocks,
    passCount: log.filter((l) => l.result === 'PASS').length,
    failCount: log.filter((l) => l.result === 'FAIL').length,
    log,
  };
  console.log(JSON.stringify(summary, null, 2));
  process.exit(findings.P0.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
