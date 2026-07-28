/* ============================================================
   Semester Planner Page – Vivid Animated Theme
   ============================================================ */
async function renderSemesterPage() {
  const root = document.getElementById('semester-root');
  root.innerHTML = `
    <div style="text-align:center;padding:48px;animation:fadeIn .5s ease">
      <div class="spinner"></div>
      <p style="margin-top:14px;color:var(--color-muted);font-size:13px">Loading semester data…</p>
    </div>`;
  try {
    const res = await SemesterAPI.get();
    buildSemesterUI(res.data);
  } catch (e) {
    root.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div>
      <h3>${e.message}</h3></div>`;
  }
}

function buildSemesterUI(data) {
  const root     = document.getElementById('semester-root');
  const courses  = data.courses  || [];
  const events   = data.events   || [];
  const goals    = data.goals    || [];
  const progress = data.progress || {};

  const hs = progress.healthScore || 0;
  const hsBg = hs >= 70 ? 'linear-gradient(135deg,#d1fae5,#a7f3d0)' :
               hs >= 40 ? 'linear-gradient(135deg,#fef3c7,#fde68a)' :
                          'linear-gradient(135deg,#fee2e2,#fecaca)';
  const hsColor = hs >= 70 ? '#065f46' : hs >= 40 ? '#92400e' : '#991b1b';

  root.innerHTML = `
    <!-- Hero Banner -->
    <div class="page-hero semester-hero">
      <div class="page-hero-orb orb1"></div>
      <div class="page-hero-orb orb2"></div>
      <div class="page-hero-content">
        <h1 class="page-hero-title">Semester Planner</h1>
        <p class="page-hero-sub">${courses.length} courses · ${events.length} events · ${goals.length} goals</p>
      </div>
      <span class="hero-badge" style="background:${hsBg};color:${hsColor}">Health ${hs}</span>
    </div>

    <!-- Semester Health Card -->
    <div class="vivid-card mb-4" style="animation:slideUp .4s ease both">
      <div class="vivid-section-header">
        <span class="section-pill analytics">🏥 Semester Health</span>
        <span class="badge ${hs>=70?'badge-green':hs>=40?'badge-yellow':'badge-red'}">Score: ${hs}</span>
      </div>
      <div class="grid-4 mt-3">
        ${semHealthStat('📚', progress.totalTasks||0,   'Total Tasks',    '#6366f1')}
        ${semHealthStat('✅', progress.completed||0,    'Completed',      '#22c55e')}
        ${semHealthStat('⚠️', progress.overdue||0,     'Overdue',        '#ef4444')}
        ${semHealthStat('📅', progress.upcoming||0,    'This Week',      '#f59e0b')}
      </div>
      <div class="mt-4">
        <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;margin-bottom:6px">
          <span>Overall Completion</span>
          <span style="color:#6366f1;font-weight:800">${progress.completionRate||0}%</span>
        </div>
        <div class="shimmer-progress-track">
          <div class="shimmer-progress-fill" style="width:${progress.completionRate||0}%;background:${(progress.completionRate||0)>=70?'linear-gradient(90deg,#22c55e,#10b981)':'linear-gradient(90deg,#6366f1,#818cf8)'}"></div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="pg-tabs">
      <button class="pg-tab active" data-tab="courses">📚 Courses <span class="pg-tab-count">${courses.length}</span></button>
      <button class="pg-tab" data-tab="events">📅 Events <span class="pg-tab-count">${events.length}</span></button>
      <button class="pg-tab" data-tab="goals">🎯 Goals <span class="pg-tab-count">${goals.length}</span></button>
    </div>

    <!-- Courses Tab -->
    <div class="tab-panel active" id="tab-courses" style="animation:slideUp .4s ease both">
      <div class="flex justify-between items-center mb-4">
        <span class="section-pill semester" style="font-size:13px;padding:6px 14px">Enrolled Courses</span>
        <button class="btn btn-primary btn-sm" id="addCourseBtn">＋ Add Course</button>
      </div>
      <div class="grid-3" id="courseGrid">
        ${courses.length ? courses.map((c,i) => courseCard(c, progress.courseProgress, i)).join('')
          : `<div class="empty-state" style="grid-column:1/-1">
               <div class="empty-state-icon">🎓</div>
               <h3>No courses yet</h3>
               <p>Add your enrolled courses to get started</p>
             </div>`}
      </div>
    </div>

    <!-- Events Tab -->
    <div class="tab-panel" id="tab-events">
      <div class="flex justify-between items-center mb-4">
        <span class="section-pill schedule" style="font-size:13px;padding:6px 14px">Academic Events</span>
        <button class="btn btn-primary btn-sm" id="addEventBtn">＋ Add Event</button>
      </div>
      <div class="semester-timeline" id="semesterTimeline">
        ${events.length
          ? events.sort((a,b)=>a.date.localeCompare(b.date)).map((e,i) => timelineItem(e, i)).join('')
          : `<div class="empty-state" style="padding:24px">
               <div class="empty-state-icon">📅</div>
               <h3>No events yet</h3>
               <p>Add exams, holidays, and deadlines</p>
             </div>`}
      </div>
    </div>

    <!-- Goals Tab -->
    <div class="tab-panel" id="tab-goals">
      <div class="flex justify-between items-center mb-4">
        <span class="section-pill tasks" style="font-size:13px;padding:6px 14px">Semester Goals</span>
        <button class="btn btn-primary btn-sm" id="addGoalBtn">＋ Add Goal</button>
      </div>
      <div id="goalsList">
        ${goals.length ? goals.map((g,i) => goalCard(g, i)).join('')
          : `<div class="empty-state">
               <div class="empty-state-icon">🎯</div>
               <h3>No goals yet</h3>
               <p>Set goals to track your semester progress</p>
             </div>`}
      </div>
    </div>
  `;

  // Tab switching (reuse pg-tab style for semester tabs)
  qsa('.pg-tab[data-tab]').forEach(btn => {
    btn.onclick = () => {
      qsa('.pg-tab[data-tab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      qsa('.tab-panel').forEach(p => p.classList.remove('active'));
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    };
  });

  document.getElementById('addCourseBtn')?.addEventListener('click', showAddCourseModal);
  document.getElementById('addEventBtn')?.addEventListener('click', showAddEventModal);
  document.getElementById('addGoalBtn')?.addEventListener('click', showAddGoalModal);

  qsa('.course-delete-btn').forEach(btn => {
    btn.onclick = async () => {
      if (!confirm('Remove this course?')) return;
      try { await SemesterAPI.deleteCourse(btn.dataset.id); showToast('Course removed', 'info'); await renderSemesterPage(); }
      catch (err) { showToast(err.message, 'error'); }
    };
  });

  qsa('.goal-progress-input').forEach(inp => {
    inp.onchange = async () => {
      try {
        const val = parseInt(inp.value);
        await SemesterAPI.updateGoal(inp.dataset.id, { currentValue: val, achieved: val >= parseInt(inp.dataset.target) });
        showToast('Goal updated!', 'success');
        await renderSemesterPage();
      } catch (err) { showToast(err.message, 'error'); }
    };
  });
}

function semHealthStat(icon, val, label, color) {
  return `
    <div style="text-align:center;padding:14px;background:${color}12;border-radius:12px;border:1px solid ${color}33">
      <div style="font-size:22px">${icon}</div>
      <div style="font-size:24px;font-weight:800;color:${color}">${val}</div>
      <div style="font-size:11px;color:var(--color-muted);font-weight:600">${label}</div>
    </div>`;
}

const COURSE_PALETTES = [
  { from:'#6366f1', to:'#818cf8' },
  { from:'#22c55e', to:'#4ade80' },
  { from:'#f59e0b', to:'#fbbf24' },
  { from:'#ec4899', to:'#f472b6' },
  { from:'#0ea5e9', to:'#38bdf8' },
  { from:'#7c3aed', to:'#a78bfa' },
];

function courseCard(c, progressMap = {}, idx = 0) {
  const p   = progressMap?.[c.name] || {};
  const pct = p.total ? Math.round((p.completed / p.total) * 100) : 0;
  const pal = COURSE_PALETTES[idx % COURSE_PALETTES.length];
  return `
    <div class="vivid-course-card" style="border-top:4px solid ${pal.from};animation:slideUp .4s ${idx*.07}s ease both">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,${pal.from},${pal.to});display:flex;align-items:center;justify-content:center;font-weight:900;color:#fff;font-size:14px">${c.name.charAt(0)}</div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:800;font-size:13px;color:var(--color-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.name}</div>
          <div style="font-size:11px;color:var(--color-muted)">${c.code||''} ${c.instructor?'· '+c.instructor:''}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:3px">
          <span style="background:linear-gradient(135deg,${pal.from},${pal.to});color:#fff;font-weight:800;font-size:11px;padding:2px 8px;border-radius:999px">${c.credits}cr</span>
          <button class="vtc-btn vtc-btn-red course-delete-btn" data-id="${c.id}" style="font-size:10px;padding:2px 6px">🗑</button>
        </div>
      </div>
      ${p.total ? `
        <div class="shimmer-progress-track">
          <div class="shimmer-progress-fill" style="width:${pct}%;background:linear-gradient(90deg,${pal.from},${pal.to})"></div>
        </div>
        <div style="font-size:11px;color:var(--color-muted);margin-top:4px;display:flex;justify-content:space-between">
          <span>${pct}% done</span>
          ${p.overdue ? `<span style="color:#ef4444;font-weight:700">${p.overdue} overdue</span>` : ''}
        </div>` : ''}
    </div>`;
}

const EVENT_COLORS = { exam:'#ef4444', holiday:'#22c55e', submission:'#f59e0b', other:'#6366f1' };
const EVENT_EMOJIS = { exam:'📝', holiday:'🌴', submission:'📤', other:'📌' };

function timelineItem(e, idx = 0) {
  const color = EVENT_COLORS[e.type] || '#6366f1';
  return `
    <div class="vivid-timeline-item" style="border-left-color:${color};animation:slideLeft .4s ${idx*.06}s ease both">
      <div class="vtl-dot" style="background:${color}"></div>
      <div class="vtl-date" style="color:${color}">${formatDate(e.date)}</div>
      <div class="vtl-title">${EVENT_EMOJIS[e.type]||'📌'} ${e.title}</div>
      ${e.course ? `<div class="vtl-course">${e.course}</div>` : ''}
      ${e.description ? `<div style="font-size:11px;color:var(--color-muted);margin-top:3px">${e.description}</div>` : ''}
    </div>`;
}

function goalCard(g, idx = 0) {
  const pct = Math.min(100, Math.round((g.currentValue / g.targetValue) * 100));
  const color = g.achieved ? '#22c55e' : '#6366f1';
  return `
    <div class="vivid-card mb-3" style="animation:slideUp .4s ${idx*.07}s ease both;border-left:4px solid ${color}">
      <div class="vivid-section-header">
        <div>
          <div style="font-weight:800;font-size:14px">${g.achieved ? '✅' : '🎯'} ${g.title}</div>
          ${g.targetDate ? `<div style="font-size:11px;color:var(--color-muted)">Target: ${formatDate(g.targetDate)}</div>` : ''}
        </div>
        <span class="badge ${g.achieved ? 'badge-green' : 'badge-blue'}">${pct}%</span>
      </div>
      <div class="shimmer-progress-track mt-3">
        <div class="shimmer-progress-fill" style="width:${pct}%;background:${g.achieved?'linear-gradient(90deg,#22c55e,#10b981)':'linear-gradient(90deg,#6366f1,#818cf8)'}"></div>
      </div>
      <div class="flex items-center gap-2 mt-3">
        <label style="font-size:12px;font-weight:700;margin:0;white-space:nowrap;color:var(--color-text)">${g.currentValue}/${g.targetValue}</label>
        <input class="form-control goal-progress-input" type="number"
          min="0" max="${g.targetValue}" value="${g.currentValue}"
          data-id="${g.id}" data-target="${g.targetValue}" style="width:80px;font-size:13px" />
      </div>
    </div>`;
}

function showAddCourseModal() {
  openModal('Add Course', `
    <form id="addCourseForm">
      <div class="form-group"><label class="form-label">Course Name *</label>
        <input class="form-control" id="cName" placeholder="e.g. Advanced Mathematics" required /></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Code</label>
          <input class="form-control" id="cCode" placeholder="MATH-301" /></div>
        <div class="form-group"><label class="form-label">Credits</label>
          <input class="form-control" type="number" id="cCredits" min="1" max="6" value="3" /></div>
      </div>
      <div class="form-group"><label class="form-label">Instructor</label>
        <input class="form-control" id="cInstructor" placeholder="Prof. Smith" /></div>
      <div class="form-group"><label class="form-label">Color</label>
        <input class="form-control" type="color" id="cColor" value="#6366f1" style="height:40px;padding:4px" /></div>
      <button type="submit" class="btn btn-primary w-full">Add Course</button>
    </form>
  `);
  document.getElementById('addCourseForm').onsubmit = async (e) => {
    e.preventDefault();
    try {
      await SemesterAPI.addCourse({ name: document.getElementById('cName').value,
        code: document.getElementById('cCode').value, credits: parseInt(document.getElementById('cCredits').value),
        instructor: document.getElementById('cInstructor').value, color: document.getElementById('cColor').value });
      closeModal(); showToast('Course added!', 'success'); await renderSemesterPage();
    } catch (err) { showToast(err.message, 'error'); }
  };
}

function showAddEventModal() {
  openModal('Add Academic Event', `
    <form id="addEventForm">
      <div class="form-group"><label class="form-label">Event Title *</label>
        <input class="form-control" id="eTitle" placeholder="e.g. Midterm Exam" required /></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Date *</label>
          <input class="form-control" type="date" id="eDate" required /></div>
        <div class="form-group"><label class="form-label">Type</label>
          <select class="form-control" id="eType">
            <option value="exam">Exam</option><option value="submission">Submission</option>
            <option value="holiday">Holiday</option><option value="other">Other</option>
          </select></div>
      </div>
      <div class="form-group"><label class="form-label">Course</label>
        <input class="form-control" id="eCourse" placeholder="e.g. Mathematics" /></div>
      <button type="submit" class="btn btn-primary w-full">Add Event</button>
    </form>
  `);
  document.getElementById('addEventForm').onsubmit = async (e) => {
    e.preventDefault();
    try {
      await SemesterAPI.addEvent({ title: document.getElementById('eTitle').value,
        date: document.getElementById('eDate').value, type: document.getElementById('eType').value,
        course: document.getElementById('eCourse').value });
      closeModal(); showToast('Event added!', 'success'); await renderSemesterPage();
    } catch (err) { showToast(err.message, 'error'); }
  };
}

function showAddGoalModal() {
  openModal('Add Semester Goal', `
    <form id="addGoalForm">
      <div class="form-group"><label class="form-label">Goal Title *</label>
        <input class="form-control" id="gTitle" placeholder="e.g. Complete all assignments" required /></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Target Date</label>
          <input class="form-control" type="date" id="gDate" /></div>
        <div class="form-group"><label class="form-label">Target Value</label>
          <input class="form-control" type="number" id="gTarget" min="1" value="100" /></div>
      </div>
      <button type="submit" class="btn btn-primary w-full">Add Goal</button>
    </form>
  `);
  document.getElementById('addGoalForm').onsubmit = async (e) => {
    e.preventDefault();
    try {
      await SemesterAPI.addGoal({ title: document.getElementById('gTitle').value,
        targetDate: document.getElementById('gDate').value || null,
        targetValue: parseInt(document.getElementById('gTarget').value) });
      closeModal(); showToast('Goal added!', 'success'); await renderSemesterPage();
    } catch (err) { showToast(err.message, 'error'); }
  };
}
