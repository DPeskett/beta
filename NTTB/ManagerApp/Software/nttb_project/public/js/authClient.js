// public/js/authClient.js
// Small helper to attach JWT and normalize responses.

async function api(path, opts = {}) {
  const token = localStorage.getItem('token');
  const headers = Object.assign({'Content-Type': 'application/json'}, opts.headers || {});
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(path, Object.assign({}, opts, { headers }));
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, body: JSON.parse(text) }; }
  catch { return { ok: res.ok, status: res.status, body: text }; }
}

function requireAuthRedirect() {
  localStorage.removeItem('token');
  window.location.href = '/index.html';
}
