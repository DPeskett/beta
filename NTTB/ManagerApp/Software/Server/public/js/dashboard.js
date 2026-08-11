// js/dashboard.js
// Robust dashboard script: tolerant auth key, defensive DOM lookups, better error handling
// Stores accepted token keys here for compatibility with different login implementations
const TOKEN_KEYS = ['token', 'jwt', 'authToken'];

const api = {
  me: '/api/me',
  users: '/api/users',
  deleteUser: (id) => `/api/user/${id}`,
  updateUser: (id) => `/api/user/${id}`
};

function getStoredToken() {
  for (const k of TOKEN_KEYS) {
    const t = localStorage.getItem(k);
    if (t) return { key: k, token: t };
  }
  return null;
}

function authHeaders() {
  const stored = getStoredToken();
  const headers = { 'Content-Type': 'application/json' };
  if (stored) headers['Authorization'] = 'Bearer ' + stored.token;
  return headers;
}

// Defensive fetch wrapper that returns parsed JSON or throws with extra info
async function safeFetch(url, opts = {}) {
  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch (e) { body = text; }
    if (!res.ok) {
      const err = new Error('HTTP ' + res.status);
      err.status = res.status;
      err.body = body;
      throw err;
    }
    return body;
  } catch (err) {
    throw err;
  }
}

// DOM helpers that tolerate missing elements
function el(id) { return document.getElementById(id) || null; }
function show(id) { const e = el(id); if (e) e.hidden = false; }
function hide(id) { const e = el(id); if (e) e.hidden = true; }
function clearChildren(id) { const e = el(id); if (!e) return; while (e.firstChild) e.removeChild(e.firstChild); }

function renderProfile(user) {
  const name = user.user_name || user.name || 'User';
  const email = user.email || '—';
  const rank = user.rank || 'user';
  if (el('welcome')) el('welcome').textContent = `Welcome, ${name}`;
  if (el('email')) el('email').textContent = email;
  if (el('rank')) el('rank').textContent = rank;
}

function enablePanelsForRank(rank) {
  // hide all first
  ['adminPanel','managerPanel','basicPanel'].forEach(hide);
  if (!rank) { show('basicPanel'); return; }
  if (['root','root-admin','admin'].includes(rank)) show('adminPanel');
  else if (rank === 'manager') show('managerPanel');
  else show('basicPanel');
}

// Public functions referenced by HTML that map to internal names
async function loadUsers() { return loadUsersList(); }
function createUser() { showFlash('Create user not implemented yet', 'info'); }
function viewReports() { showFlash('Reports not implemented yet', 'info'); }
function editProfile() { show('editModal'); }

// Users list and actions
async function loadUsersList() {
  const listContainer = el('usersList');
  if (!listContainer) return;
  clearChildren('usersList');
  let users;
  try {
    users = await safeFetch(api.users, { headers: authHeaders() });
  } catch (err) {
    listContainer.textContent = 'Failed to load users: ' + (err.body || err.message);
    return;
  }
  if (!Array.isArray(users) || users.length === 0) {
    listContainer.textContent = 'No users found.';
    return;
  }

  const table = document.createElement('table');
  table.className = 'users-table';
  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>ID</th><th>Name</th><th>Email</th><th>Rank</th><th>Actions</th></tr>';
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  users.forEach(u => {
    // Ensure numeric id is a plain Number for UI consistency
    const uid = typeof u.user_id === 'bigint' ? Number(u.user_id) : Number(u.user_id || u.id || 0);
    const tr = document.createElement('tr');

    const idTd = document.createElement('td'); idTd.textContent = uid;
    const nameTd = document.createElement('td'); nameTd.textContent = u.user_name || '—';
    const emailTd = document.createElement('td'); emailTd.textContent = u.email || '—';
    const rankTd = document.createElement('td'); rankTd.textContent = u.rank || 'user';

    const actionsTd = document.createElement('td');

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.onclick = () => openEditModal(u);

    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.onclick = () => confirmDeleteUser(uid);

    // Frontend protection hint for typical root id 1
    if (uid === 1) {
      delBtn.disabled = true;
      editBtn.disabled = true;
      delBtn.title = 'Protected root user';
      editBtn.title = 'Protected root user';
    }

    actionsTd.appendChild(editBtn);
    actionsTd.appendChild(delBtn);

    tr.appendChild(idTd);
    tr.appendChild(nameTd);
    tr.appendChild(emailTd);
    tr.appendChild(rankTd);
    tr.appendChild(actionsTd);
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  listContainer.appendChild(table);
}

function confirmDeleteUser(id) {
  if (!confirm(`Delete user ${id}? This action is permanent.`)) return;
  deleteUser(id);
}

async function deleteUser(id) {
  try {
    await safeFetch(api.deleteUser(id), { method: 'DELETE', headers: authHeaders() });
    await loadUsersList();
    showFlash('User deleted', 'success');
  } catch (err) {
    showFlash('Delete failed: ' + (err.body || err.message), 'error');
  }
}

function openEditModal(user) {
  const modal = el('editModal');
  if (!modal) return;
  const idField = el('editUserId'); if (idField) idField.value = user.user_id || user.id || '';
  const nameField = el('editUserName'); if (nameField) nameField.value = user.user_name || '';
  const emailField = el('editUserEmail'); if (emailField) emailField.value = user.email || '';
  const rankField = el('editUserRank'); if (rankField) rankField.value = user.rank || 'user';
  modal.hidden = false;
}

async function submitEditForm(e) {
  if (e && e.preventDefault) e.preventDefault();
  const id = el('editUserId') ? el('editUserId').value : null;
  if (!id) { showFlash('Missing ID', 'error'); return; }
  const name = el('editUserName') ? el('editUserName').value.trim() : '';
  const email = el('editUserEmail') ? el('editUserEmail').value.trim() : '';
  const rank = el('editUserRank') ? el('editUserRank').value : 'user';

  const payload = { user_name: name, email, rank };
  try {
    await safeFetch(api.updateUser(id), {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(payload)
    });
    if (el('editModal')) el('editModal').hidden = true;
    await loadUsersList();
    showFlash('User updated', 'success');
  } catch (err) {
    showFlash('Update failed: ' + (err.body || err.message), 'error');
  }
}

function showFlash(message, type = 'info') {
  const elFlash = el('flash');
  if (!elFlash) {
    console.log('FLASH', type, message);
    return;
  }
  elFlash.textContent = message;
  elFlash.className = 'flash ' + type;
  elFlash.hidden = false;
  setTimeout(() => { if (el('flash')) el('flash').hidden = true; }, 4000);
}

function logout() {
  const stored = getStoredToken();
  if (stored) localStorage.removeItem(stored.key);
  else localStorage.removeItem('token');
  window.location.href = '/';
}

async function initDashboard() {
  // Attach submit handler defensively
  const ef = el('editForm');
  if (ef && !ef._bound) { ef.addEventListener('submit', submitEditForm); ef._bound = true; }

  const logoutBtn = el('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);

  try {
    // Try to get /api/me and render page. If it fails, show message but don't immediately redirect.
    const user = await safeFetch(api.me, { headers: authHeaders() });
    // Ensure numeric ids are plain Numbers to avoid BigInt JSON issues
    if (user && typeof user.user_id === 'bigint') user.user_id = Number(user.user_id);
    renderProfile(user);
    enablePanelsForRank(user.rank);
    // Wire admin action button if present
    const loadBtn = el('loadUsersBtn') || el('loadUsers');
    if (loadBtn) loadBtn.addEventListener('click', loadUsersList);
    // If admin panel is visible and usersList container exists, pre-load users
    if (['root','root-admin','admin'].includes(user.rank) && el('usersList')) {
      await loadUsersList();
    }
  } catch (err) {
    // Show informative error on page and keep the user so you can inspect DevTools
    console.error('/api/me error', err);
    showFlash('Authentication failed or server error. You will be redirected to login in 5s if not fixed', 'error');
    setTimeout(() => {
      const stored = getStoredToken();
      if (stored) localStorage.removeItem(stored.key);
      window.location.href = '/';
    }, 5000);
  }
}

document.addEventListener('DOMContentLoaded', initDashboard);