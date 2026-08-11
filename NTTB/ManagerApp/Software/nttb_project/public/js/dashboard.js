// dashboard.js
// Assumes authClient.js exposes `api(url, options)` returning { ok, status, body }

document.addEventListener('DOMContentLoaded', main);

const TaskPriority = {
0: "None",
1: "Low",
2: "Medium",
3: "High",
4: "Top",
5: "EXTREME"
};

async function main() {
  const me = await loadCurrentUser();
  if (!me) return redirectToLogin();
  const user = me.user || me;
  renderHeader(user);

  // rank 5 handling: polite message, 7-second countdown, redirect to login
  if (user.rank === 5) {
    showPoliteBan(user);
    return;
  }

  wireLogout();
  await renderTaskArea(user);
  wireAllTasksButton(user);
  if (user.rank <= 2) {
     wireImageViewerButton(user);
    document.getElementById('adminUsersWrap').style.display = '';
    await renderUsersArea(user);
  } else {
    document.getElementById('adminUsersWrap').style.display = 'none';
  }
  wireAddTaskForm(user);

  const dueInput = document.getElementById('taskDue');
  const now = new Date();
  now.setDate(now.getDate() + 1);
  const formatted_date = now.toISOString().slice(0,10) + "T23:59";
  dueInput.value = formatted_date;

}

/* ---------- Helpers ---------- */

function redirectToLogin() {
  localStorage.removeItem('token');
  window.location = '/index.html';
}

async function loadCurrentUser() {
  try {
    const res = await api('/api/me', { method: 'GET' });
    if (!res.ok) return null;
    return res.body || res;
  } catch {
    return null;
  }
}

function renderHeader(user) {
  const name = user.user_name || user.name || user.email || 'User';
  document.getElementById('username').textContent = name;
  document.getElementById('rank').textContent =
    `Rank ${user.rank}` + (user.rank === 1 ? ' (root)' :
                          user.rank === 2 ? ' (admin)' :
                          user.rank === 3 ? ' (moderator)' :
                          user.rank === 4 ? ' (manager)' :
                          user.rank === 5 ? ' (deleted)' : '');
}

/* polite ban message for rank 5 */
function showPoliteBan(user) {
  let seconds = 10;
  const el = document.getElementById('welcomeMessage');
  el.textContent = `Access limited: your account does not have dashboard permissions. You will be redirected to the login page in ${seconds} seconds.`;
  el.style.color = '#b33';
  
  const timer = setInterval(() => {
    seconds -= 1;
    el.textContent = `Access limited: you will be redirected to the login page in ${seconds} second${seconds !== 1 ? 's' : ''}.`;
    if (seconds <= 0) {
      clearInterval(timer);
      redirectToLogin();
    }
  }, 1000);
}

/* ---------- Logout / All Tasks ---------- */

function wireLogout() {
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    try { await api('/api/logout', { method: 'POST' }); } catch {}
    redirectToLogin();
  });
}

function wireAllTasksButton(user) {
  const btn = document.getElementById('allTasksBtn');
  if (user.rank >= 1 && user.rank <= 4) {
    btn.style.display = 'inline-block';
    btn.onclick = () => window.open('/alltasks.html', '_blank');
  } else {
    btn.style.display = 'none';
  }
}

function wireImageViewerButton(user) {
  const btn = document.getElementById('imageViewerBtn');
  btn.style.display = 'inline-block';
  btn.onclick = () => window.open('/browse_images.html', '_blank');
}

/* ---------- Tasks UI ---------- */

async function renderTaskArea(user) {
  // Show add form only to rank 4 and above? spec: rank4 can add; ranks 1-3 can also create tasks per rules.
  // Display add form to rank <=4 (1..4).
  const addWrap = document.getElementById('addTaskWrap');
  addWrap.style.display = (user.rank <= 4) ? '' : 'none';

  let tasks = [];
  try {
    const res = await api('/api/tasks', { method: 'GET' });
    if (!res.ok) throw new Error('load failed');
    tasks = res.body && res.body.tasks ? res.body.tasks : res.body || [];
  } catch (err) {
    showFormMessage('Failed to load tasks', true);
    return;
  }
  sessionStorage.setItem('tasksCache', JSON.stringify(tasks)); // Delete ??
  await checkAndMarkLateTasks(tasks);
  
  const container = document.getElementById('taskList');
  container.innerHTML = '';
  const filtered = tasks.filter(t => clientCanViewTask(user, t));
  if (!filtered.length) {
    container.textContent = 'No tasks available';
    return;
  }
  for (const t of filtered) {
    container.appendChild(makeTaskCard(user, t));
  }
}

async function checkAndMarkLateTasks(tasks) {
  const now = new Date();
  for (const task of tasks) {
    const due = new Date(task.due_by);
    const isOverdue = due < now;
    const isIncomplete = task.progress !== 'Completed';

    if (isOverdue && isIncomplete && task.progress !== 'Late') {
      try {
        await api(`/api/tasks/${task.id}`, {
          method: 'PUT',
          body: {
            progress: 'Late'
          }
        });
        console.log(`Marked task ${task.id} as Late`);
      } catch (err) {
        console.warn(`Failed to mark task ${task.id} as Late`, err);
      }
    }
  }
}

function makeTaskCard(user, t) {

  const wrap = document.createElement('div');
  wrap.className = 'task-card';
  wrap.dataset.id = t.id || t.task_id;

  const title = escapeHtml(t.title || t.task_title || '');
  const desc = escapeHtml(t.description || t.task_description || '');
  const ownerName = escapeHtml(t.ownerName || t.owner_name || '');
  const ownerRank = t.ownerRank != null ? t.ownerRank : t.owner_rank;
  const priority = escapeHtml(t.priority || t.task_priority || '0');
  const progress = escapeHtml(t.progress || t.task_progress || '');

  wrap.innerHTML = `
    <div class="task-head"><strong>${title}</strong> | Priority Level : ${TaskPriority[priority]}</div>
    <div class="task-body">${desc}</div>
    <div class="task-meta">Owner: ${ownerName || '—'} (Rank ${ownerRank != null ? ownerRank : '—'})</div>
    <div class="task-prog">Progress : ${progress || 'error'}</div>
  `;

  // Edit button
  if (clientCanEditTask(user, t)) {
    const edit = document.createElement('button');
    edit.textContent = 'Edit';
    edit.className = 'btn btn-edit';
    edit.onclick = () => openEditTaskPopup(user, t);
    wrap.appendChild(edit);
  }

  // Delete button
  if (clientCanDeleteTask(user, t)) {
    const del = document.createElement('button');
    del.textContent = 'Delete';
    del.className = 'btn btn-delete';
    del.onclick = async () => {
      if (!confirm('Delete this task? This cannot be undone.')) return;
      await deleteTaskAndRefresh(t.id || t.task_id, user);
    };
    wrap.appendChild(del);
  }

  return wrap;
}

/* client-side permission helpers (UI only, server enforces rules) */
function clientCanViewTask(user, task) {
  const ownerId = String(task.ownerId || task.assigned_by || task.owner_id || task.assigned_by || '');
  if (ownerId && ownerId === String(user.id || user.sub)) return true;
  if (user.rank <= 2) return true; // root/admin see all
  if (user.rank === 3) {
    return Number(task.ownerRank || task.owner_rank || task.ownerRank) === 4 || ownerId === String(user.id || user.sub);
  }
  // rank 4 and 5 only their own (5 will already be redirected earlier)
  return false;
}

function clientCanEditTask(user, task) {
  if (user.rank < 2) return true;
  if (user.rank === 2) {
    return Number(task.ownerRank || task.owner_rank || task.ownerRank) === 3 || String(task.ownerId || task.assigned_by) === String(user.id || user.sub);
  }
  if (user.rank === 3) {
    return Number(task.ownerRank || task.owner_rank || task.ownerRank) === 4 || String(task.ownerId || task.assigned_by) === String(user.id || user.sub);
  }
  if (user.rank === 4) {
    return String(task.ownerId || task.assigned_by) === String(user.id || user.sub);
  }
  return false;
}

function clientCanDeleteTask(user, task) {
  return clientCanEditTask(user, task);
}

/* wire add task form */
function wireAddTaskForm(user) {
  const form = document.getElementById('addTaskForm');
  if (!form) return;

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const title = form.title.value && form.title.value.trim();
    const description = form.description.value && form.description.value.trim();
    const due_by = form.due_by && form.due_by.value ? new Date(form.due_by.value).toISOString() : null;
    const priority = Number(form.priority && form.priority.value) || 0;

    if (!title) return showFormMessage('Title required', true);
    if (new Date(form.due_by.value) < new Date()) {
      return showFormMessage('Due Date cannot be earlier than now', true);
    }

    try {
      const res = await api('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ title, description, due_by, priority }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error(res.status || 'err');
      showFormMessage('Task created', false);
      form.reset();
      await renderTaskArea(user);
    } catch (err) {
      showFormMessage('Failed to create task', true);
    }
  });
}

/* delete via API and refresh tasks */
async function deleteTaskAndRefresh(taskId, user) {
  try {
    const res = await api(`/api/tasks/${taskId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('delete failed');
    showFormMessage('Task deleted', false);
    await renderTaskArea(user);
  } catch {
    showFormMessage('Failed to delete task', true);
  }
}

/* edit popup (simple prompt-based UI to keep code small) */
function openEditTaskPopup(user, task) {
  if (!clientCanEditTask(user, task)) return alert('Insufficient permission');
  const newTitle = prompt('Title', task.title || task.task_title || '');
  if (newTitle == null) return;
  const newDesc = prompt('Description', task.description || task.task_description || '') ;
  if (newDesc == null) return;
  const newPrio = prompt('Priority', task.priority || task.task_priority || '');
  if (newPrio == null) return;

  (async () => {
    try {
      const res = await api(`/api/tasks/${task.id || task.task_id}`, {
        method: 'PUT',
        body: JSON.stringify({ title: newTitle, description: newDesc, priority: newPrio }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error('update failed');
      showFormMessage('Task updated', false);
      await renderTaskArea(user);
    } catch {
      showFormMessage('Failed to update task', true);
    }
  })();
}

/* ---------- Users UI (admin area) ---------- */

async function renderUsersArea(currentUser) {
  // fetch users allowed by server
  let users = [];
  try {
    const res = await api('/api/users', { method: 'GET' });
    if (!res.ok) throw new Error('load failed');
    users = res.body && res.body.users ? res.body.users : res.body || [];
  } catch {
    showFormMessage('Failed to load users', true);
    return;
  }

  const list = document.getElementById('userList');
  list.innerHTML = '';

  // Render each user as a compact card with Edit/Delete buttons shown per client rules
  const frag = document.createDocumentFragment();
  for (const u of users) {
    // Client guard: don't allow modifying equal-or-better ranks
    if (currentUser.rank === 1 && u.rank === 1 && String(u.id) !== String(currentUser.id || currentUser.sub)) {
      // per rules: root shouldn't be able to delete other root; show but disable delete
    }
    const card = document.createElement('div');
    card.className = 'user-card';
    card.dataset.id = u.id;
    card.innerHTML = `
      <div class="user-main"><strong>${escapeHtml(u.user_name || u.name || u.email)}</strong> — Rank ${u.rank}</div>
      <div class="user-meta">Email: ${escapeHtml(u.email || '')} ${u.phone ? ' — Phone: ' + escapeHtml(u.phone) : ''}</div>
    `;

    const actions = document.createElement('div');
    actions.className = 'user-actions';

    // Edit button (allowed for rank1 and rank2 for appropriate targets)
    const canEdit = (() => {
      if (currentUser.rank === 1) return true;
      if (currentUser.rank === 2 && u.rank > 2) return true;
      if (String(u.id) === String(currentUser.id || currentUser.sub)) return true;
      return false;
    })();

    if (canEdit) {
      const btnEdit = document.createElement('button');
      btnEdit.textContent = 'Edit';
      btnEdit.onclick = () => openEditUserPopup(currentUser, u);
      actions.appendChild(btnEdit);
    }

    // Delete button (only rank1 may delete users with rank > 1)
    const canDelete = (currentUser.rank === 1 && Number(u.rank) > 1);
    if (canDelete) {
      const btnDel = document.createElement('button');
      btnDel.textContent = 'Delete';
      btnDel.onclick = async () => {
        if (!confirm(`Delete user ${u.user_name || u.email}? This will disallow user access to the system. You can restore access by editing the users rank.`)) return;
        try {
          const res = await api(`/api/users/delete/${u.id}`, { method: 'PUT' });
          if (!res.ok) throw new Error('delete failed');
          showFormMessage('User deleted', false);
          // remove card
          card.remove();
        } catch {
          showFormMessage('Failed to delete user', true);
        }
      };
      actions.appendChild(btnDel);
    }

    card.appendChild(actions);
    frag.appendChild(card);
  }
  list.appendChild(frag);
}

/* edit user popup (simple prompt-based) */
function openEditUserPopup(currentUser, targetUser) {
  if (!currentUser) return;
  // name and phone editable by those allowed
  const newName = prompt('Display name', targetUser.user_name || targetUser.name || '');
  if (newName == null) return;
  const newPhone = prompt('Phone (digits only)', targetUser.phone || '') ;
  if (newPhone == null) return;

  // only allow rank changes when currentUser permitted
  let newRank = targetUser.rank;
  if (currentUser.rank === 1 || (currentUser.rank === 2 && Number(targetUser.rank) > 2)) {
    const r = prompt('Rank (1-5)', String(targetUser.rank || ''));
    if (r == null) return;
    newRank = Number(r);
    if (!Number.isInteger(newRank) || newRank < 1 || newRank > 5) {
      alert('Invalid rank');
      return;
    }
    // cannot allow assigning a rank equal or higher than caller
    if (newRank <= currentUser.rank) {
      alert('Cannot assign rank equal or higher than your own');
      return;
    }
  }

  (async () => {
    try {
      const body = { user_name: newName, phone: newPhone };
      // include rank only when changed and permitted
      if (Number(newRank) !== Number(targetUser.rank)) body.rank = Number(newRank);
      const res = await api(`/api/users/${targetUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('update failed');
      showFormMessage('User updated', false);
      // refresh users area
      await renderUsersArea(currentUser);
    } catch {
      showFormMessage('Failed to update user', true);
    }
  })();
}

/* ---------- Small UI utils ---------- */

function showFormMessage(msg, isError = false) {
  const el = document.getElementById('formMessage');
  if (!el) return alert(msg);
  el.textContent = msg;
  el.style.color = isError ? '#900' : '#060';
  el.focus();
  setTimeout(() => { el.textContent = ''; }, 4000);
}

function escapeHtml(s) {
  if (!s) return '';
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
