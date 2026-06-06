async function parseJsonResponse(res) {
  const json = await res.json().catch(() => ({}));

  if (!res.ok || !json.success) {
    throw new Error(json.message || `Request failed with status ${res.status}`);
  }

  return json;
}

export async function uploadReport(file) {
  const formData = new FormData();
  formData.append('report', file);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  return parseJsonResponse(res);
}

export async function interpretStructured(structured) {
  const res = await fetch('/api/interpret', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ structured }),
  });

  return parseJsonResponse(res);
}
