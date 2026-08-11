window.addEventListener('DOMContentLoaded', () => {
  const taskListEl = document.getElementById('taskList');
  const raw = sessionStorage.getItem('tasksCache');

  if (!raw) {
    taskListEl.textContent = "No cached tasks found.";
    return;
  }

  let tasks;
  try {
    tasks = JSON.parse(raw);
  } catch (err) {
    console.error("Failed to parse tasksCache:", err);
    taskListEl.textContent = "Error loading tasks.";
    return;
  }

  if (!Array.isArray(tasks) || tasks.length === 0) {
    taskListEl.textContent = "No tasks to display.";
    return;
  }

  const ul = document.createElement('ul');
  ul.className = 'task-ul';

  for (const t of tasks) {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.innerHTML = `
      <strong>${t.title}<hr></strong>
      Description:  ${t.description}<hr>
      Due: ${t.due_by}<br>
      Priority: ${t.priority}
    `;
    ul.appendChild(li);
  }

  const btn = document.getElementById('top-btn');

  btn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  taskListEl.appendChild(ul);
});
