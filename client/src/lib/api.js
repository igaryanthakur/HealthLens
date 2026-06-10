const AUTH_TOKEN_KEY = 'healthlens_auth_token';
const INSIGHTS_CACHE_KEY = 'healthlens_insights_cache';

// In-memory cache for the repository overview bundle (one DB read on the server).
let repositoryOverviewCache = null;

async function parseJsonResponse(res) {
  const json = await res.json().catch(() => ({}));

  if (!res.ok || !json.success) {
    const message =
      json.message || json.error || `Request failed with status ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  return json;
}

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function clearRepositoryOverviewCache() {
  repositoryOverviewCache = null;
}

export function setAuthToken(token) {
  // A new session invalidates any cached insights (handles login #1 refresh).
  clearCachedInsights();
  clearRepositoryOverviewCache();
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken() {
  clearCachedInsights();
  clearRepositoryOverviewCache();
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

// Longitudinal insights are cached client-side so the (token-costing) endpoint
// is only hit on login and after a new upload — never on a plain dashboard
// open/reload.
export function getCachedInsights() {
  try {
    const raw = localStorage.getItem(INSIGHTS_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCachedInsights(data) {
  try {
    localStorage.setItem(INSIGHTS_CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota/serialization errors; the cache is best-effort.
  }
}

export function clearCachedInsights() {
  localStorage.removeItem(INSIGHTS_CACHE_KEY);
}

function authHeaders() {
  const token = getAuthToken();
  if (!token) {
    return {};
  }

  return { Authorization: `Bearer ${token}` };
}

export async function registerUser({ name, email, password }) {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

  const json = await parseJsonResponse(res);
  setAuthToken(json.token);
  return json;
}

export async function loginUser({ email, password }) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const json = await parseJsonResponse(res);
  setAuthToken(json.token);
  return json;
}

export async function uploadReport(file, documentType = 'auto') {
  const formData = new FormData();
  formData.append('documentType', documentType);
  formData.append('report', file);

  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });

  return parseJsonResponse(res);
}

export async function savePrescription(payload) {
  const res = await fetch('/api/prescriptions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });

  return parseJsonResponse(res);
}

export async function saveReviewedDocument(payload) {
  const res = await fetch('/api/documents', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });

  return parseJsonResponse(res);
}

export async function interpretStructured(structured) {
  const res = await fetch('/api/interpret', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ structured }),
  });

  return parseJsonResponse(res);
}

export async function fetchReportHistory() {
  const res = await fetch('/api/reports/history', {
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
}

export async function fetchReportById(id) {
  const res = await fetch(`/api/reports/${id}`, {
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
}

export async function fetchMedicationHistory() {
  const res = await fetch('/api/repository/medications', {
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
}

export async function fetchDiagnosisHistory() {
  const res = await fetch('/api/repository/diagnoses', {
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
}

export async function fetchSymptomHistory() {
  const res = await fetch('/api/repository/symptoms', {
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
}

export async function fetchAdviceHistory() {
  const res = await fetch('/api/repository/advice', {
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
}

export async function fetchHealthTimeline() {
  const res = await fetch('/api/repository/timeline', {
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
}

export async function fetchRepositorySummary() {
  const res = await fetch('/api/repository/summary', {
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
}

export async function fetchRepositoryOverview({ force = false } = {}) {
  if (!force && repositoryOverviewCache) {
    return repositoryOverviewCache;
  }

  const res = await fetch('/api/repository/overview', {
    headers: authHeaders(),
  });

  const json = await parseJsonResponse(res);
  repositoryOverviewCache = json;
  return json;
}

export async function fetchRepositoryInsights() {
  const res = await fetch('/api/repository/insights', {
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
}

export async function fetchDoctorSummary() {
  const res = await fetch('/api/repository/doctor-summary', {
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
}

export async function fetchCurrentUser() {
  const res = await fetch('/api/users/me', {
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
}

export async function sendChatMessage(message) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ message }),
  });

  return parseJsonResponse(res);
}

export async function updateUserProfile(profile) {
  const res = await fetch('/api/users/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(profile),
  });

  return parseJsonResponse(res);
}

export async function updateUserAccount({ name, email }) {
  const res = await fetch('/api/users/account', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ name, email }),
  });

  return parseJsonResponse(res);
}

export async function changeUserPassword({ currentPassword, newPassword }) {
  const res = await fetch('/api/users/password', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  return parseJsonResponse(res);
}

export async function deleteReport(reportId) {
  const res = await fetch(`/api/reports/${reportId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  const json = await parseJsonResponse(res);
  clearRepositoryOverviewCache();
  clearCachedInsights();
  return json;
}
