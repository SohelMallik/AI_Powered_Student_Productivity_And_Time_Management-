/* ============================================================
   Tasks Page
   ============================================================ */
let allTasks   = [];
let taskFilter = 'all';

async function renderTasksPage() {
  const root = document.getElementById('tasks-root');
  root.innerHTML = `<div style="text-align:center;padding:32px"><div class="spinner"></div></div>`;
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
  const root = document.getElementById('tasks-root');
  root.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <div>
        <h2 style="font-size:20px;font-weight:800">Task Manager</h2>
        <p class="text-muted text-sm">${allTasks.filter(t=>!t.completed).length} pending · ${allTasks.filter(t=>t.completed).length} completed</p>
      </div>
      <button class="btn btn-primary" id="addTaskBtn">+ Add Task</button>
    </div>

    <!-- Filters -->
    <div class="tabs" id="taskTabs">
      <button class="tab-btn active" data-filter="all">All (${allTasks.length})</button>
      <button class="tab-btn" data-filter="pending">Pending (${allTasks.filter(t=>!t.completed).length})</button>
      <button class="tab-btn" data-filter="overdue">Overdue (${allTasks.filter(t=>!t.completed && new Date(t.deadline)<new Date()).length})</button>
      <button class="tab-btn" data-filter="completed">Done (${allTasks.filter(t=>t.completed).length})</button>
    </div>

    <!-- Search -->
    <div class="form-group">
      <input class="form-control" id="taskSearch" placeholder="🔍 Search tasks..." />
    </div>

    <!-- Task Grid -->
    <div id="taskGrid" class="grid-2"></div>
  `;

  document.getElementById('addTaskBtn').onclick = showAddTaskModal;
  document.getElementById('taskSearch').oninput = e => filterTasks(e.target.value);
  qsa('#taskTabs .tab-btn').forEach(btn => {
    btn.onclick = () => {
      qsa('#taskTabs .tab-btn').forEach(b => b.classList.remove('active'));
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
  if (taskFilter === 'completed') filtered = filtered.filter(t => t.completed);
  if (search) filtered = filtered.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.course.toLowerCase().includes(search.toLowerCase())
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
      <button class="btn btn-primary mt-4" onclick="showAddTaskModal()">+ Add Task</button>
    </div>`;
    return;
  }
  grid.innerHTML = tasks.map(task => taskCard(task)).join('');
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

function taskCard(task) {
  const dl  = deadlineLabel(task.deadline);
  const pri = priorityLabel(task.priority || 0);
  const done = task.completed;
  return `
    <div class="card" style="opacity:${done ? .65 : 1}">
      <div class="card-header" style="margin-bottom:10px">
        <div style="display:flex;align-items:center;gap:8px">
          <span class="badge ${pri.cls}">${pri.label}</span>
          <span class="badge badge-gray">${task.type}</span>
        </div>
        <div style="display:flex;gap:4px">
          ${!done ? `<button class="btn btn-success btn-sm task-complete-btn" data-id="${task.id}" title="Mark complete">✓</button>` : ''}
          <button class="btn btn-danger btn-sm task-delete-btn" data-id="${task.id}" title="Delete">🗑</button>
        </div>
      </div>
      <div style="font-weight:700;font-size:14px;margin-bottom:4px;${done ? 'text-decoration:line-through' : ''}">${task.title}</div>
      <div class="text-muted text-sm mb-4">${task.description || 'No description'}</div>
      <div class="flex justify-between items-center">
        <span style="font-size:12px;background:#f1f5f9;padding:3px 8px;border-radius:6px">📚 ${task.course}</span>
        <span class="task-deadline ${dl.cls}" style="font-size:12px;font-weight:700">${dl.label}</span>
      </div>
      <div class="mt-2" style="display:flex;justify-content:space-between;font-size:11px;color:var(--color-muted)">
        <span>⏳ ~${task.estimatedHours}h</span>
        <span>Priority: ${task.priority || 0}</span>
      </div>
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
