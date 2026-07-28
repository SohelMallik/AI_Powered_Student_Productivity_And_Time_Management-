/* ============================================================
   Dashboard Page  —  Natural, Warm, Human-Feel Layout
   ============================================================ */

async function renderDashboard() {
  const root = document.getElementById('dashboard-root');

  root.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;padding:60px 24px;gap:14px">
      <div class="spinner" style="width:36px;height:36px;border-width:3px"></div>
      <p style="color:#6366f1;font-weight:600;font-size:14px">Loading your dashboard…</p>
    </div>`;

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

    const hr     = new Date().getHours();
    const greet  = hr < 5 ? 'Still up?' : hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
    const name   = profile.data.name || profile.data.username || 'Student';
    const today  = new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});

    /* completion & streak helpers */
    const compRate = d.totalTasks ? Math.round((d.completedTasks/d.totalTasks)*100) : 0;
    const streak   = d.streakDays || 0;

    root.innerHTML = `

      <!-- ── hidden SVG defs for charts ──────────────────── -->
      <svg width="0" height="0" style="position:absolute;pointer-events:none">
        <defs>
          <linearGradient id="barGrad"   x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stop-color="#818cf8"/>
            <stop offset="100%" stop-color="#6366f1"/>
          </linearGradient>
          <linearGradient id="pomGrad2"  x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stop-color="#6366f1"/>
            <stop offset="100%" stop-color="#a855f7"/>
          </linearGradient>
          <linearGradient id="breakGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stop-color="#10b981"/>
            <stop offset="100%" stop-color="#34d399"/>
          </linearGradient>
        </defs>
      </svg>

      <!-- ════════════════════════════════════════════════════
           GREETING HEADER  (warm, personal, human feel)
      ════════════════════════════════════════════════════ -->
      <div class="db-greeting-bar">
        <div class="db-greeting-left">
          <div class="db-greet-text">${greet}, <span class="db-greet-name">${name} 👋</span></div>
          <div class="db-greet-date">${today}</div>
          <div class="db-greet-summary">
            ${streak > 0
              ? `<span class="db-chip fire">🔥 ${streak}-day streak</span>`
              : '<span class="db-chip">Start your streak today!</span>'}
            ${procs.length > 0
              ? `<span class="db-chip warn">⚠️ ${procs.length} task${procs.length>1?'s':''} need attention</span>`
              : '<span class="db-chip ok">✅ All tasks on track</span>'}
          </div>
        </div>
        <div class="db-greeting-actions">
          <button class="btn btn-primary btn-sm" onclick="navigateTo('ai-insights')">🤖 AI Insights</button>
          <button class="btn btn-outline btn-sm" onclick="refreshDashboard()">↻ Refresh</button>
        </div>
      </div>

      <!-- ════════════════════════════════════════════════════
           STAT CARDS  (4 across)
      ════════════════════════════════════════════════════ -->
      <div class="stats-grid">
        ${statCard('📚','blue',  'Total Tasks',   d.totalTasks || 0,
            `<span style="color:#4338ca;font-weight:700">✓ ${d.completedTasks||0} done</span>`)}
        ${statCard('⏱','green', 'Study Today',   minutesToHM(todayMin),
            `<span style="color:#047857">Goal: <b>${minutesToHM(goalMin)}</b></span>`)}
        ${statCard('🔥','orange','Day Streak',    streak + (streak===1?' day':' days'),
            '<span style="color:#d97706">Keep going 💪</span>')}
        ${statCard('✅','teal',  'Completion',    compRate + '%',
            `<span style="color:#0f766e">${d.totalTasks||0} total tasks</span>`)}
      </div>

      <!-- ════════════════════════════════════════════════════
           TODAY'S GOAL PROGRESS
      ════════════════════════════════════════════════════ -->
      <div class="db-goal-banner">
        <div class="db-goal-top">
          <div>
            <div class="db-goal-title">📈 Today's Study Goal</div>
            <div class="db-goal-sub">
              <b>${minutesToHM(todayMin)}</b> of <b>${minutesToHM(goalMin)}</b> completed
            </div>
          </div>
          <div class="db-goal-badge ${goalPct>=100?'done':goalPct>=50?'half':'low'}">
            ${goalPct >= 100 ? '🎉 Done!' : goalPct + '%'}
          </div>
        </div>
        <div class="db-goal-track">
          <div class="db-goal-fill" style="width:${goalPct}%;background:${goalPct>=100?'linear-gradient(90deg,#10b981,#34d399)':goalPct>=50?'linear-gradient(90deg,#6366f1,#a855f7)':'linear-gradient(90deg,#f59e0b,#fbbf24)'}"></div>
        </div>
        <div class="db-goal-milestones">
          ${[25,50,75,100].map(m=>`
            <div class="db-milestone ${goalPct>=m?'reached':''}">
              <div class="db-ms-dot">${goalPct>=m?'✓':''}</div>
              <div class="db-ms-label">${m}%</div>
            </div>`).join('')}
        </div>
      </div>

      <!-- ════════════════════════════════════════════════════
           MAIN TWO-COLUMN GRID
      ════════════════════════════════════════════════════ -->
      <div class="dashboard-grid">

        <!-- ── LEFT COLUMN ── -->
        <div style="display:flex;flex-direction:column;gap:20px">

          <!-- AI ALERTS (only if there are any) -->
          ${procs.length ? `
          <div class="card" style="border-left:4px solid #ef4444;animation-delay:.06s">
            <div class="card-header">
              <div class="card-title" style="color:#b91c1c">🚨 Procrastination Alerts</div>
              <span class="badge badge-red">${procs.length} item${procs.length>1?'s':''}</span>
            </div>
            ${procs.slice(0,3).map((p,i)=>`
              <div class="ai-alert ${p.procrastinationScore>70?'critical':'high'}"
                   style="animation-delay:${.05+i*.07}s">
                <span>${p.procrastinationScore>70?'🚨':'🔶'}</span>
                <span>${p.suggestion}</span>
              </div>`).join('')}
          </div>` : ''}

          <!-- AI TIME SUGGESTIONS -->
          <div class="card" style="animation-delay:.10s">
            <div class="card-header">
              <div class="card-title">💡 Smart Suggestions</div>
              <button class="btn btn-outline btn-sm" onclick="refreshDashboard()"
                style="font-size:12px;padding:4px 10px">↻</button>
            </div>
            <div id="timeSuggestions">
              ${(timeOpt.data||[]).slice(0,4).map((s,i)=>`
                <div class="ai-alert ${s.priority}" style="animation-delay:${.05+i*.07}s">
                  <span>${s.priority==='critical'?'🚨':s.priority==='high'?'🔶':'💡'}</span>
                  <span>${s.message}</span>
                </div>`).join('')
              || `<div class="db-all-good">
                    <span style="font-size:22px">🎉</span>
                    <span>You're perfectly on track — no suggestions!</span>
                  </div>`}
            </div>
          </div>

          <!-- PRIORITY TASKS -->
          <div class="card" style="animation-delay:.14s">
            <div class="card-header">
              <div class="card-title">📋 Priority Tasks</div>
              <button class="btn btn-primary btn-sm" onclick="navigateTo('tasks')"
                style="font-size:12px;padding:5px 12px">View all →</button>
            </div>
            <div id="priorityTasksList"></div>
          </div>

        </div>

        <!-- ── RIGHT COLUMN ── -->
        <div style="display:flex;flex-direction:column;gap:20px">

          <!-- POMODORO TIMER -->
          <div class="db-pom-card">
            <div class="db-pom-header">
              <div class="db-pom-title">⏱ Pomodoro Timer</div>
              <span class="badge badge-purple" id="pomStatusBadge">Ready</span>
            </div>
            <div class="pomodoro-widget" id="pomodoroWidget">
              <div class="pomodoro-ring" id="pomodoroRing">
                <svg viewBox="0 0 150 150">
                  <circle class="ring-bg"   cx="75" cy="75" r="64"/>
                  <circle class="ring-fill" cx="75" cy="75" r="64" id="pomodoroArc"
                    stroke-dasharray="402.1" stroke-dashoffset="0"/>
                </svg>
                <div class="ring-label" id="pomodoroLabel">25:00</div>
              </div>
              <div class="pomodoro-phase work" id="pomodoroPhase">FOCUS</div>
              <div class="pomodoro-cycles" id="pomodoroCycles">🔁 Cycles: 0</div>
              <div class="pomodoro-controls">
                <button class="btn btn-primary btn-sm" id="pomodoroStart">▶ Start</button>
                <button class="btn btn-outline btn-sm" id="pomodoroStop">■ Stop</button>
              </div>
            </div>
          </div>

          <!-- 7-DAY STUDY CHART -->
          <div class="card" style="animation-delay:.16s">
            <div class="card-header">
              <div class="card-title">📊 7-Day Study</div>
              <span class="badge badge-blue">${d.last7Days?.length||0} days</span>
            </div>
            <div id="weeklyChartContainer" style="min-height:185px"></div>
          </div>

        </div>
      </div>
    `;

    await renderPriorityTasks();
    renderWeeklyChart(d.last7Days || []);
    initPomodoroUI(profile.data);

  } catch (err) {
    root.innerHTML = `
      <div class="empty-state" style="padding:80px 24px">
        <span class="empty-state-icon">⚠️</span>
        <h3>Couldn't load dashboard</h3>
        <p style="font-size:14px;color:#64748b;margin:8px 0 22px">${err.message}</p>
        <button class="btn btn-primary" onclick="renderDashboard()">↻ Try again</button>
      </div>`;
  }
}

/* ──────────────────────────────────────────────────────────
   STAT CARD
────────────────────────────────────────────────────────── */
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

/* ──────────────────────────────────────────────────────────
   PRIORITY TASKS
────────────────────────────────────────────────────────── */
async function renderPriorityTasks() {
  const list = document.getElementById('priorityTasksList');
  if (!list) return;
  try {
    const res   = await TasksAPI.getAll();
    const tasks = (res.data || []).filter(t => !t.completed).slice(0, 5);

    if (!tasks.length) {
      list.innerHTML = `
        <div class="empty-state" style="padding:24px 16px">
          <span class="empty-state-icon">✅</span>
          <h3 style="color:#059669">All caught up!</h3>
          <p style="font-size:13px;color:#64748b;margin-top:4px">No pending tasks 🎉</p>
        </div>`;
      return;
    }

    list.innerHTML = `
      <div class="task-list">
        ${tasks.map((task, idx) => {
          const dl  = deadlineLabel(task.deadline);
          const pri = priorityLabel(task.priority || 0);
          return `
            <div class="task-item" onclick="navigateTo('tasks')" style="animation-delay:${idx*.07}s">
              <div class="task-priority-bar ${pri.bar}"></div>
              <div class="task-info">
                <div class="task-title-text">${task.title}</div>
                <div class="task-meta">${task.course||'—'} · ${task.type||'Task'}</div>
              </div>
              <div style="text-align:right;flex-shrink:0;min-width:72px">
                <div class="task-deadline ${dl.cls}">${dl.label}</div>
                <span class="task-score ${pri.bar}">${pri.label}</span>
              </div>
            </div>`;
        }).join('')}
      </div>`;
  } catch {
    list.innerHTML = `<p style="color:#64748b;font-size:13px;padding:10px 0">Unable to load tasks</p>`;
  }
}

/* ──────────────────────────────────────────────────────────
   WEEKLY BAR CHART
────────────────────────────────────────────────────────── */
function renderWeeklyChart(last7) {
  const container = document.getElementById('weeklyChartContainer');
  if (!container) return;

  if (!last7.length) {
    container.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
        height:185px;color:#94a3b8;font-size:13px;gap:10px;font-weight:600">
        <span style="font-size:36px">📊</span>
        No study data yet — start a session!
      </div>`;
    return;
  }

  renderBarChart(container, last7.map(d => ({
    label: d.date ? d.date.slice(5) : '',
    value: d.studyMinutes || 0,
    color: 'url(#barGrad)',
  })), {
    height    : 185,
    formatY   : v => `${Math.round(v/60)}h`,
    formatVal : v => `${Math.round(v/60)}h`,
    animated  : true,
    gridColor : 'rgba(99,102,241,.1)',
    labelColor: '#64748b',
    valColor  : '#6366f1',
  });
}

/* ──────────────────────────────────────────────────────────
   POMODORO   (r=64 → C ≈ 402.1)
────────────────────────────────────────────────────────── */
let pomodoroInterval = null;
let pomodoroState    = {
  running: false, phase: 'work',
  elapsed: 0, cycles: 0,
  workMin: 25, breakMin: 5,
};

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
  const btn   = document.getElementById('pomodoroStart');
  const badge = document.getElementById('pomStatusBadge');
  if (btn)   btn.innerHTML   = '⏸ Running';
  if (badge) { badge.textContent = '● Active'; badge.className = 'badge badge-green'; }
  pomodoroInterval = setInterval(tickPomodoro, 1000);
}

function stopPomodoro() {
  clearInterval(pomodoroInterval);
  pomodoroState = { ...pomodoroState, running: false, elapsed: 0, cycles: 0, phase: 'work' };
  const btn   = document.getElementById('pomodoroStart');
  const badge = document.getElementById('pomStatusBadge');
  if (btn)   btn.innerHTML   = '▶ Start';
  if (badge) { badge.textContent = 'Ready'; badge.className = 'badge badge-purple'; }
  updatePomodoroDisplay();
}

function tickPomodoro() {
  pomodoroState.elapsed++;
  const total = (pomodoroState.phase === 'work'
    ? pomodoroState.workMin : pomodoroState.breakMin) * 60;
  if (pomodoroState.elapsed >= total) {
    if (pomodoroState.phase === 'work') {
      pomodoroState.cycles++;
      pomodoroState.phase = 'break';
      showToast('🎉 Focus session done! Take a break.', 'success');
    } else {
      pomodoroState.phase = 'work';
      showToast('💪 Break over! Back to focus.', 'info');
    }
    pomodoroState.elapsed = 0;
  }
  updatePomodoroDisplay();
}

function updatePomodoroDisplay() {
  const total     = (pomodoroState.phase === 'work'
    ? pomodoroState.workMin : pomodoroState.breakMin) * 60;
  const remaining = total - pomodoroState.elapsed;
  const m  = String(Math.floor(remaining / 60)).padStart(2,'0');
  const s  = String(remaining % 60).padStart(2,'0');

  const label  = document.getElementById('pomodoroLabel');
  const phase  = document.getElementById('pomodoroPhase');
  const cycles = document.getElementById('pomodoroCycles');
  const arc    = document.getElementById('pomodoroArc');
  if (!label) return;

  label.textContent  = `${m}:${s}`;
  phase.textContent  = pomodoroState.phase === 'work' ? 'FOCUS' : 'BREAK';
  phase.className    = `pomodoro-phase ${pomodoroState.phase}`;
  cycles.textContent = `🔁 Cycles: ${pomodoroState.cycles}`;

  const CIRC = 402.1;
  const pct  = pomodoroState.elapsed / total;
  arc.setAttribute('stroke-dasharray',  CIRC);
  arc.setAttribute('stroke-dashoffset', CIRC * (1 - pct));
  arc.setAttribute('stroke', pomodoroState.phase === 'work'
    ? 'url(#pomGrad2)' : 'url(#breakGrad)');
}

async function refreshDashboard() { await renderDashboard(); }
