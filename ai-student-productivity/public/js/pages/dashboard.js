/* ============================================================
   Dashboard Page
   ============================================================ */
async function renderDashboard() {
  const root = document.getElementById('dashboard-root');
  root.innerHTML = `<div style="padding:16px;text-align:center"><div class="spinner"></div></div>`;

  try {
    const [overview, aiRes, studyToday, timeOpt] = await Promise.all([
      AnalyticsAPI.overview(),
      AIAPI.procrastination(),
      StudyAPI.getToday(),
      AIAPI.timeOptimization(),
    ]);

    const d        = overview.data;
    const procs    = aiRes.data || [];
    const todayMin = studyToday.totalMinutes || 0;
    const profile  = await AIAPI.getProfile();
    const goalMin  = (profile.data.studyGoalHours || 6) * 60;
    const goalPct  = Math.min(100, Math.round((todayMin / goalMin) * 100));

    root.innerHTML = `
      <!-- Stat Cards -->
      <div class="stats-grid">
        ${statCard('📚', 'blue', 'Total Tasks', d.totalTasks, `${d.completedTasks} completed`)}
        ${statCard('⏱', 'green', 'Study Today', minutesToHM(todayMin), `Goal: ${minutesToHM(goalMin)}`)}
        ${statCard('🔥', 'orange', 'Day Streak', d.streakDays + 'd', 'Keep it up!')}
        ${statCard('⚠️', 'red', 'Overdue', (d.totalTasks - d.completedTasks > 0 ? aiRes.count : 0), 'tasks need attention')}
      </div>

      <!-- Daily Goal Progress -->
      <div class="card mb-4">
        <div class="card-header">
          <div>
            <div class="card-title">📈 Today's Study Goal</div>
            <div class="card-subtitle">${minutesToHM(todayMin)} of ${minutesToHM(goalMin)} completed</div>
          </div>
          <span class="badge ${goalPct >= 100 ? 'badge-green' : goalPct >= 50 ? 'badge-blue' : 'badge-yellow'}">${goalPct}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${goalPct >= 100 ? 'success' : goalPct >= 50 ? '' : 'warning'}" 
               style="width:${goalPct}%"></div>
        </div>
      </div>

      <!-- Dashboard Grid -->
      <div class="dashboard-grid">
        <!-- Left: Tasks + AI Alerts -->
        <div>
          <!-- AI Alerts -->
          ${procs.length ? `
          <div class="card mb-4">
            <div class="card-header">
              <div class="card-title">🤖 AI Alerts</div>
              <span class="badge badge-red">${procs.length} issue${procs.length > 1 ? 's' : ''}</span>
            </div>
            <div id="aiAlertsList">
              ${procs.slice(0, 3).map(p => `
                <div class="ai-alert ${p.procrastinationScore > 70 ? 'critical' : 'high'}">
                  <span>⚡</span>
                  <span>${p.suggestion}</span>
                </div>
              `).join('')}
            </div>
          </div>` : ''}

          <!-- Time Optimization -->
          <div class="card mb-4">
            <div class="card-header">
              <div class="card-title">💡 AI Time Suggestions</div>
              <button class="btn btn-outline btn-sm" onclick="refreshDashboard()">↻ Refresh</button>
            </div>
            <div id="timeSuggestions">
              ${(timeOpt.data || []).slice(0, 4).map(s => `
                <div class="ai-alert ${s.priority}">
                  <span>${s.priority === 'critical' ? '🚨' : s.priority === 'high' ? '🔶' : '💡'}</span>
                  <span>${s.message}</span>
                </div>
              `).join('') || '<p class="text-muted text-sm">No suggestions — great work!</p>'}
            </div>
          </div>

          <!-- Priority Tasks -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">📋 Priority Tasks</div>
              <button class="btn btn-primary btn-sm" onclick="navigateTo('tasks')">View All</button>
            </div>
            <div id="priorityTasksList"></div>
          </div>
        </div>

        <!-- Right: Pomodoro + Weekly Chart -->
        <div>
          <!-- Pomodoro -->
          <div class="card mb-4">
            <div class="card-header">
              <div class="card-title">⏱ Pomodoro Timer</div>
            </div>
            <div class="pomodoro-widget" id="pomodoroWidget">
              <div class="pomodoro-ring" id="pomodoroRing">
                <svg viewBox="0 0 120 120">
                  <circle class="ring-bg"   cx="60" cy="60" r="52"/>
                  <circle class="ring-fill" cx="60" cy="60" r="52" id="pomodoroArc"
                    stroke-dasharray="326.7" stroke-dashoffset="0"/>
                </svg>
                <div class="ring-label" id="pomodoroLabel">25:00</div>
              </div>
              <div class="pomodoro-phase work" id="pomodoroPhase">WORK</div>
              <div class="pomodoro-cycles" id="pomodoroCycles">Cycles: 0</div>
              <div class="pomodoro-controls">
                <button class="btn btn-primary btn-sm" id="pomodoroStart">▶ Start</button>
                <button class="btn btn-outline btn-sm" id="pomodoroStop">■ Stop</button>
              </div>
            </div>
          </div>

          <!-- 7-day Study Chart -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">📊 7-Day Study</div>
            </div>
            <div id="weeklyChartContainer" style="min-height:180px"></div>
          </div>
        </div>
      </div>
    `;

    // Render priority tasks
    await renderPriorityTasks();

    // Render weekly chart
    renderWeeklyChart(d.last7Days || []);

    // Init Pomodoro UI
    initPomodoroUI(profile.data);

  } catch (err) {
    root.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon">⚠️</div>
      <h3>Failed to load dashboard</h3>
      <p>${err.message}</p>
      <button class="btn btn-primary mt-4" onclick="renderDashboard()">Retry</button>
    </div>`;
  }
}

function statCard(icon, color, label, value, sub) {
  return `
    <div class="stat-card">
      <div class="stat-icon ${color}">${icon}</div>
      <div class="stat-info">
        <div class="stat-label">${label}</div>
        <div class="stat-value">${value}</div>
        <div class="stat-sub">${sub}</div>
      </div>
    </div>`;
}

async function renderPriorityTasks() {
  const list = document.getElementById('priorityTasksList');
  if (!list) return;
  try {
    const res   = await TasksAPI.getAll();
    const tasks = (res.data || []).filter(t => !t.completed).slice(0, 5);
    if (!tasks.length) {
      list.innerHTML = `<div class="empty-state" style="padding:24px">
        <div class="empty-state-icon">✅</div>
        <h3>All caught up!</h3></div>`;
      return;
    }
    list.innerHTML = `<div class="task-list">
      ${tasks.map(task => {
        const dl  = deadlineLabel(task.deadline);
        const pri = priorityLabel(task.priority || 0);
        return `
          <div class="task-item" onclick="navigateTo('tasks')">
            <div class="task-priority-bar ${pri.bar}"></div>
            <div class="task-info">
              <div class="task-title-text">${task.title}</div>
              <div class="task-meta">${task.course} · ${task.type}</div>
            </div>
            <div>
              <div class="task-deadline ${dl.cls}">${dl.label}</div>
              <span class="badge ${pri.cls}" style="float:right;margin-top:4px">${pri.label}</span>
            </div>
          </div>`;
      }).join('')}
    </div>`;
  } catch { list.innerHTML = '<p class="text-muted text-sm">Unable to load tasks</p>'; }
}

function renderWeeklyChart(last7) {
  const container = document.getElementById('weeklyChartContainer');
  if (!container) return;
  const data = last7.map(d => ({
    label: d.date ? d.date.slice(5) : '',
    value: d.studyMinutes || 0,
    color: '#3b82d4',
  }));
  if (!data.length) {
    container.innerHTML = '<p class="text-muted text-sm" style="padding:16px">No data yet</p>';
    return;
  }
  renderBarChart(container, data, {
    height: 180,
    formatY  : v => `${Math.round(v/60)}h`,
    formatVal: v => `${Math.round(v/60)}h`,
  });
}

// ── Pomodoro UI ───────────────────────────────────────────
let pomodoroInterval = null;
let pomodoroState    = { running: false, phase: 'work', elapsed: 0, cycles: 0, workMin: 25, breakMin: 5 };

function initPomodoroUI(profile) {
  pomodoroState.workMin  = profile.pomodoroWork  || 25;
  pomodoroState.breakMin = profile.pomodoroBreak || 5;
  updatePomodoroDisplay();

  document.getElementById('pomodoroStart').onclick = startPomodoro;
  document.getElementById('pomodoroStop').onclick  = stopPomodoro;
}

function startPomodoro() {
  if (pomodoroState.running) return;
  pomodoroState.running = true;
  pomodoroState.elapsed = 0;
  document.getElementById('pomodoroStart').textContent = '⏸ Running';
  pomodoroInterval = setInterval(tickPomodoro, 1000);
}

function stopPomodoro() {
  clearInterval(pomodoroInterval);
  pomodoroState = { ...pomodoroState, running: false, elapsed: 0, cycles: 0, phase: 'work' };
  document.getElementById('pomodoroStart').textContent = '▶ Start';
  updatePomodoroDisplay();
}

function tickPomodoro() {
  pomodoroState.elapsed++;
  const total = (pomodoroState.phase === 'work' ? pomodoroState.workMin : pomodoroState.breakMin) * 60;
  if (pomodoroState.elapsed >= total) {
    if (pomodoroState.phase === 'work') {
      pomodoroState.cycles++;
      pomodoroState.phase = 'break';
      showToast('🎉 Work session done! Take a break.', 'success');
    } else {
      pomodoroState.phase = 'work';
      showToast('💪 Break over! Back to work.', 'info');
    }
    pomodoroState.elapsed = 0;
  }
  updatePomodoroDisplay();
}

function updatePomodoroDisplay() {
  const total   = (pomodoroState.phase === 'work' ? pomodoroState.workMin : pomodoroState.breakMin) * 60;
  const remaining = total - pomodoroState.elapsed;
  const m = String(Math.floor(remaining / 60)).padStart(2, '0');
  const s = String(remaining % 60).padStart(2, '0');
  const label  = document.getElementById('pomodoroLabel');
  const phase  = document.getElementById('pomodoroPhase');
  const cycles = document.getElementById('pomodoroCycles');
  const arc    = document.getElementById('pomodoroArc');
  if (!label) return;
  label.textContent  = `${m}:${s}`;
  phase.textContent  = pomodoroState.phase.toUpperCase();
  phase.className    = `pomodoro-phase ${pomodoroState.phase}`;
  cycles.textContent = `Cycles: ${pomodoroState.cycles}`;
  const circ = 326.7;
  const pct  = pomodoroState.elapsed / total;
  arc.setAttribute('stroke-dashoffset', circ * (1 - pct));
}

async function refreshDashboard() { await renderDashboard(); }
