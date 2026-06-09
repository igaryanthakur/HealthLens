const AUTH_TOKEN_KEY = 'healthlens_auth_token';

async function parseJsonResponse(res) {
  const json = await res.json().catch(() => ({}));

  if (!res.ok || !json.success) {
    throw new Error(json.message || `Request failed with status ${res.status}`);
  }

  return json;
}

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
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
