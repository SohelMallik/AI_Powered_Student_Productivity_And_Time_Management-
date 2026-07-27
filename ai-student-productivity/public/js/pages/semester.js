/* ============================================================
   Semester Planner Page
   ============================================================ */
async function renderSemesterPage() {
  const root = document.getElementById('semester-root');
  root.innerHTML = `<div style="text-align:center;padding:32px"><div class="spinner"></div></div>`;
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

  root.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <h2 style="font-size:20px;font-weight:800">Semester Planner</h2>
    </div>

    <!-- Semester Health -->
    <div class="card mb-4">
      <div class="card-header">
        <div class="card-title">🏥 Semester Health</div>
        <span class="badge ${progress.healthScore>=70?'badge-green':progress.healthScore>=40?'badge-yellow':'badge-red'}">
          Score: ${progress.healthScore || 0}
        </span>
      </div>
      <div class="grid-4">
        ${miniStatSem('📚', progress.totalTasks||0, 'Total Tasks')}
        ${miniStatSem('✅', progress.completed||0, 'Completed')}
        ${miniStatSem('⚠️', progress.overdue||0, 'Overdue')}
        ${miniStatSem('📅', progress.upcoming||0, 'Due This Week')}
      </div>
      <div class="mt-4">
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
          <span>Overall Completion</span>
          <span>${progress.completionRate||0}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${(progress.completionRate||0)>=70?'success':''}"
               style="width:${progress.completionRate||0}%"></div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button class="tab-btn active" data-tab="courses">📚 Courses (${courses.length})</button>
      <button class="tab-btn" data-tab="events">📅 Events (${events.length})</button>
      <button class="tab-btn" data-tab="goals">🎯 Goals (${goals.length})</button>
    </div>

    <!-- Courses Tab -->
    <div class="tab-panel active" id="tab-courses">
      <div class="flex justify-between items-center mb-4">
        <div class="card-title">Enrolled Courses</div>
        <button class="btn btn-primary btn-sm" id="addCourseBtn">+ Add Course</button>
      </div>
      <div class="grid-3" id="courseGrid">
        ${courses.length ? courses.map(c => courseCard(c, progress.courseProgress)).join('') 
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
        <div class="card-title">Academic Events</div>
        <button class="btn btn-primary btn-sm" id="addEventBtn">+ Add Event</button>
      </div>
      <div class="semester-timeline" id="semesterTimeline">
        ${events.length
          ? events.sort((a,b)=>a.date.localeCompare(b.date)).map(e => timelineItem(e)).join('')
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
        <div class="card-title">Semester Goals</div>
        <button class="btn btn-primary btn-sm" id="addGoalBtn">+ Add Goal</button>
      </div>
      <div id="goalsList">
        ${goals.length ? goals.map(g => goalCard(g)).join('') 
          : `<div class="empty-state">
               <div class="empty-state-icon">🎯</div>
               <h3>No goals yet</h3>
               <p>Set goals to track your semester progress</p>
             </div>`}
      </div>
    </div>
  `;

  // Tab switching
  qsa('.tab-btn[data-tab]').forEach(btn => {
    btn.onclick = () => {
      qsa('.tab-btn[data-tab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      qsa('.tab-panel').forEach(p => p.classList.remove('active'));
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    };
  });

  // Add handlers
  document.getElementById('addCourseBtn')?.addEventListener('click', showAddCourseModal);
  document.getElementById('addEventBtn')?.addEventListener('click', showAddEventModal);
  document.getElementById('addGoalBtn')?.addEventListener('click', showAddGoalModal);

  // Delete course buttons
  qsa('.course-delete-btn').forEach(btn => {
    btn.onclick = async () => {
      if (!confirm('Remove this course?')) return;
      try { await SemesterAPI.deleteCourse(btn.dataset.id); showToast('Course removed', 'info'); await renderSemesterPage(); }
      catch (err) { showToast(err.message, 'error'); }
    };
  });

  // Goal progress update
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

function miniStatSem(icon, val, label) {
  return `<div style="text-align:center;padding:12px">
    <div style="font-size:24px">${icon}</div>
    <div style="font-size:22px;font-weight:800">${val}</div>
    <div class="text-muted text-sm">${label}</div>
  </div>`;
}

function courseCard(c, progressMap = {}) {
  const p = progressMap[c.name] || {};
  const pct = p.total ? Math.round((p.completed / p.total) * 100) : 0;
  return `
    <div class="course-card">
      <div class="course-color-dot" style="background:${c.color}"></div>
      <div class="course-info">
        <div class="course-name">${c.name}</div>
        <div class="course-code">${c.code || ''} ${c.instructor ? '· ' + c.instructor : ''}</div>
        ${p.total ? `<div class="progress-bar mt-2"><div class="progress-fill" style="width:${pct}%"></div></div>
          <div class="text-sm text-muted" style="margin-top:3px">${pct}% done · ${p.overdue||0} overdue</div>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
        <span class="course-credits">${c.credits}cr</span>
        <button class="btn btn-danger btn-sm course-delete-btn" data-id="${c.id}">🗑</button>
      </div>
    </div>`;
}

function timelineItem(e) {
  const typeEmoji = { exam:'📝', holiday:'🌴', submission:'📤', other:'📌' };
  return `
    <div class="timeline-item ${e.type}">
      <div class="timeline-date">${formatDate(e.date)}</div>
      <div class="timeline-title">${typeEmoji[e.type]||'📌'} ${e.title}</div>
      ${e.course ? `<div class="timeline-course">${e.course}</div>` : ''}
      ${e.description ? `<div class="text-muted text-sm">${e.description}</div>` : ''}
    </div>`;
}

function goalCard(g) {
  const pct = Math.min(100, Math.round((g.currentValue / g.targetValue) * 100));
  return `
    <div class="card mb-4">
      <div class="card-header">
        <div>
          <div class="card-title">${g.achieved ? '✅' : '🎯'} ${g.title}</div>
          ${g.targetDate ? `<div class="card-subtitle">Target: ${formatDate(g.targetDate)}</div>` : ''}
        </div>
        <span class="badge ${g.achieved ? 'badge-green' : 'badge-blue'}">${pct}%</span>
      </div>
      <div class="progress-bar mb-4">
        <div class="progress-fill ${g.achieved ? 'success' : ''}" style="width:${pct}%"></div>
      </div>
      <div class="flex items-center gap-2">
        <label class="form-label" style="margin:0;white-space:nowrap">Progress (${g.currentValue}/${g.targetValue})</label>
        <input class="form-control goal-progress-input" type="number" 
          min="0" max="${g.targetValue}" value="${g.currentValue}"
          data-id="${g.id}" data-target="${g.targetValue}" style="width:80px" />
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
        <input class="form-control" type="color" id="cColor" value="#3b82d4" style="height:40px;padding:4px" /></div>
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
