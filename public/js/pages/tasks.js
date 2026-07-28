/* ============================================================
   Tasks Page  – Vivid Animated Theme
   ============================================================ */
let allTasks   = [];
let taskFilter = 'all';

async function renderTasksPage() {
  const root = document.getElementById('tasks-root');
  root.innerHTML = `
    <div style="text-align:center;padding:48px;animation:fadeIn .5s ease">
      <div class="spinner"></div>
      <p style="margin-top:14px;color:var(--color-muted);font-size:13px">Loading tasks…</p>
    </div>`;
  try {
    const res = await TasksAPI.getAll();
    allTasks  = res.data || [];
    buildTasksUI();
  } catch (e) {
    root.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div>
      <h3>Failed to load tasks</h3><p>${e.message}</p></div>`;
  }
}

function buildTasksUI() {
  const root    = document.getElementById('tasks-root');
  const pending  = allTasks.filter(t => !t.completed).length;
  const done     = allTasks.filter(t =>  t.completed).length;
  const overdue  = allTasks.filter(t => !t.completed && new Date(t.deadline) < new Date()).length;

  root.innerHTML = `
    <!-- Hero Banner -->
    <div class="page-hero tasks-hero">
      <div class="page-hero-orb orb1"></div>
      <div class="page-hero-orb orb2"></div>
      <div class="page-hero-content">
        <h1 class="page-hero-title">Task Manager</h1>
        <p class="page-hero-sub">${pending} pending · ${done} completed · ${overdue} overdue</p>
      </div>
      <button class="hero-action-btn" id="addTaskBtn">＋ Add Task</button>
    </div>

    <!-- Filters -->
    <div class="pg-tabs" id="taskTabs">
      <button class="pg-tab active" data-filter="all">All <span class="pg-tab-count">${allTasks.length}</span></button>
      <button class="pg-tab" data-filter="pending">Pending <span class="pg-tab-count">${pending}</span></button>
      <button class="pg-tab" data-filter="overdue">Overdue <span class="pg-tab-count pg-tab-danger">${overdue}</span></button>
      <button class="pg-tab" data-filter="completed">Done <span class="pg-tab-count pg-tab-success">${done}</span></button>
      <input class="pg-search" id="taskSearch" placeholder="🔍 Search tasks…" />
    </div>

    <!-- Task Grid -->
    <div id="taskGrid" class="grid-2" style="animation:slideUp .45s ease both"></div>
  `;

  document.getElementById('addTaskBtn').onclick = showAddTaskModal;
  document.getElementById('taskSearch').oninput = e => filterTasks(e.target.value);
  qsa('#taskTabs .pg-tab').forEach(btn => {
    btn.onclick = () => {
      qsa('#taskTabs .pg-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      taskFilter = btn.dataset.filter;
      filterTasks(document.getElementById('taskSearch').value);
    };
  });
  renderTaskGrid(allTasks);
}

function filterTasks(search = '') {
  let filtered = allTasks;
  if (taskFilter === 'pending')   filtered = filtered.filter(t => !t.completed);
  if (taskFilter === 'overdue')   filtered = filtered.filter(t => !t.completed && new Date(t.deadline) < new Date());
  if (taskFilter === 'completed') filtered = filtered.filter(t =>  t.completed);
  if (search) filtered = filtered.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    (t.course||'').toLowerCase().includes(search.toLowerCase())
  );
  renderTaskGrid(filtered);
}

function renderTaskGrid(tasks) {
  const grid = document.getElementById('taskGrid');
  if (!tasks.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-state-icon">📭</div>
      <h3>No tasks found</h3>
      <p>Add your first task to get started</p>
      <button class="btn btn-primary mt-4" onclick="showAddTaskModal()">＋ Add Task</button>
    </div>`;
    return;
  }
  grid.innerHTML = tasks.map((task, i) => taskCard(task, i)).join('');
  qsa('.task-complete-btn').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      try {
        await TasksAPI.complete(btn.dataset.id);
        showToast('Task marked complete! 🎉', 'success');
        await renderTasksPage();
      } catch (err) { showToast(err.message, 'error'); }
    };
  });
  qsa('.task-delete-btn').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      if (!confirm('Delete this task?')) return;
      try {
        await TasksAPI.delete(btn.dataset.id);
        showToast('Task deleted', 'info');
        await renderTasksPage();
      } catch (err) { showToast(err.message, 'error'); }
    };
  });
}

const TASK_PALETTES = [
  { bg:'linear-gradient(135deg,#eef2ff,#e0e7ff)', border:'#a5b4fc', accent:'#4f46e5' },
  { bg:'linear-gradient(135deg,#f0fdf4,#dcfce7)', border:'#86efac', accent:'#16a34a' },
  { bg:'linear-gradient(135deg,#fffbeb,#fef3c7)', border:'#fcd34d', accent:'#d97706' },
  { bg:'linear-gradient(135deg,#fdf2f8,#fce7f3)', border:'#f9a8d4', accent:'#db2777' },
  { bg:'linear-gradient(135deg,#f0f9ff,#e0f2fe)', border:'#7dd3fc', accent:'#0284c7' },
  { bg:'linear-gradient(135deg,#f5f3ff,#ede9fe)', border:'#c4b5fd', accent:'#7c3aed' },
];

function taskCard(task, idx) {
  const dl   = deadlineLabel(task.deadline);
  const pri  = priorityLabel(task.priority || 0);
  const done = task.completed;
  const pal  = TASK_PALETTES[idx % TASK_PALETTES.length];
  return `
    <div class="vivid-task-card" style="background:${done?'#f8fafc':pal.bg};border-color:${pal.border};opacity:${done?.7:1};animation:slideUp .4s ${(idx%6)*.07}s ease both">
      <div class="vtc-header">
        <div style="display:flex;gap:6px;align-items:center">
          <span class="badge ${pri.cls}" style="font-size:10px">${pri.label}</span>
          <span class="badge badge-gray" style="font-size:10px">${task.type}</span>
        </div>
        <div style="display:flex;gap:4px">
          ${!done ? `<button class="vtc-btn vtc-btn-green task-complete-btn" data-id="${task.id}" title="Mark complete">✓</button>` : ''}
          <button class="vtc-btn vtc-btn-red task-delete-btn" data-id="${task.id}" title="Delete">🗑</button>
        </div>
      </div>
      <div class="vtc-title" style="${done?'text-decoration:line-through;color:var(--color-muted)':''}">${task.title}</div>
      <div class="vtc-desc">${task.description || 'No description'}</div>
      <div class="vtc-footer">
        <span class="vtc-course" style="background:${pal.border}33;color:${pal.accent}">📚 ${task.course}</span>
        <span class="task-deadline ${dl.cls}" style="font-size:12px;font-weight:700">${dl.label}</span>
      </div>
      <div class="vtc-meta">
        <span>⏳ ~${task.estimatedHours}h</span>
        <span style="color:${pal.accent};font-weight:700">Priority ${task.priority || 0}</span>
      </div>
      ${!done ? `<div class="vtc-accent-bar" style="background:${pal.accent}"></div>` : ''}
    </div>`;
}

function showAddTaskModal() {
  openModal('Add New Task', `
    <form id="addTaskForm">
      <div class="form-group">
        <label class="form-label">Task Title *</label>
        <input class="form-control" id="taskTitle" placeholder="e.g. Chapter 5 Review" required />
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea class="form-control" id="taskDesc" rows="2" placeholder="Details..."></textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Deadline *</label>
          <input class="form-control" type="datetime-local" id="taskDeadline" required />
        </div>
        <div class="form-group">
          <label class="form-label">Course</label>
          <input class="form-control" id="taskCourse" placeholder="e.g. Mathematics" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Type</label>
          <select class="form-control" id="taskType">
            <option value="assignment">Assignment</option>
            <option value="exam">Exam</option>
            <option value="project">Project</option>
            <option value="reading">Reading</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Estimated Hours</label>
          <input class="form-control" type="number" id="taskHours" min="0.5" max="50" step="0.5" value="2" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Importance (1–10): <span id="weightVal">5</span></label>
        <input class="range-slider" type="range" id="taskWeight" min="1" max="10" value="5"
          oninput="document.getElementById('weightVal').textContent=this.value" />
      </div>
      <button type="submit" class="btn btn-primary w-full">Add Task</button>
    </form>
  `);

  document.getElementById('addTaskForm').onsubmit = async (e) => {
    e.preventDefault();
    try {
      await TasksAPI.create({
        title         : document.getElementById('taskTitle').value,
        description   : document.getElementById('taskDesc').value,
        deadline      : document.getElementById('taskDeadline').value,
        course        : document.getElementById('taskCourse').value || 'General',
        type          : document.getElementById('taskType').value,
        estimatedHours: parseFloat(document.getElementById('taskHours').value),
        weight        : parseInt(document.getElementById('taskWeight').value),
      });
      closeModal();
      showToast('Task added successfully!', 'success');
      await renderTasksPage();
    } catch (err) { showToast(err.message, 'error'); }
  };
}
