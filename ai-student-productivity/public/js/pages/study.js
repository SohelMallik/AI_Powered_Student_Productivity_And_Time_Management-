/* ============================================================
   Study Tracker Page
   ============================================================ */
async function renderStudyPage() {
  const root = document.getElementById('study-root');
  root.innerHTML = `<div style="text-align:center;padding:32px"><div class="spinner"></div></div>`;

  try {
    const [sessionsRes, todayRes, analysisRes, tasksRes] = await Promise.all([
      StudyAPI.getAll(),
      StudyAPI.getToday(),
      StudyAPI.getAnalysis(),
      TasksAPI.getAll(),
    ]);

    const sessions  = sessionsRes.data || [];
    const todaySess = todayRes.data    || [];
    const analysis  = analysisRes.data || {};
    const tasks     = (tasksRes.data   || []).filter(t => !t.completed);

    const bySubject = analysis.bySubject || {};
    const subjectData = Object.entries(bySubject).map(([k, v]) => ({
      label: k, value: v.study, color: subjectColor(k),
    }));

    root.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <div>
          <h2 style="font-size:20px;font-weight:800">Study Tracker</h2>
          <p class="text-muted text-sm">${sessions.length} sessions logged</p>
        </div>
        <button class="btn btn-primary" id="logSessionBtn">+ Log Session</button>
      </div>

      <!-- Overview Stats -->
      <div class="grid-4 mb-4">
        ${miniStat('⏱', 'Total Study', minutesToHM(analysis.totalStudyMinutes || 0), 'teal')}
        ${miniStat('💡', 'Focus Score', `${analysis.focusScore || 0}%`, analysis.focusScore >= 70 ? 'green' : 'orange')}
        ${miniStat('📅', 'Today', minutesToHM(todayRes.totalMinutes || 0), 'blue')}
        ${miniStat('😵', 'Distraction', minutesToHM(analysis.totalDistractionMinutes || 0), 'red')}
      </div>

      <!-- Focus Verdict -->
      <div class="card mb-4">
        <div class="card-title mb-4">🎯 Focus Analysis</div>
        <div style="font-size:18px;font-weight:700;margin-bottom:8px">${analysis.verdict || '—'}</div>
        <div class="progress-bar">
          <div class="progress-fill ${(analysis.focusScore||0)>=70?'success':(analysis.focusScore||0)>=40?'':'danger'}"
               style="width:${analysis.focusScore||0}%"></div>
        </div>
        <div class="text-sm text-muted mt-2">${analysis.focusScore || 0}% focus efficiency</div>
      </div>

      <!-- Charts + Sessions -->
      <div class="dashboard-grid">
        <div>
          <!-- By Subject Chart -->
          <div class="card mb-4">
            <div class="card-title mb-4">📚 Study by Subject</div>
            <div id="subjectChartContainer"></div>
            <div id="subjectLegend" class="flex gap-2 mt-4" style="flex-wrap:wrap"></div>
          </div>

          <!-- Today's Sessions -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">📅 Today's Sessions</div>
              <span class="badge badge-blue">${todaySess.length} sessions</span>
            </div>
            <div id="todaySessionsList">
              ${todaySess.length ? todaySess.map(s => sessionItem(s)).join('') 
                : `<div class="empty-state" style="padding:24px">
                     <div class="empty-state-icon">📖</div>
                     <h3>No sessions today</h3>
                     <p>Start studying and log your sessions!</p>
                   </div>`}
            </div>
          </div>
        </div>

        <div>
          <!-- All Recent Sessions -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">🕒 Recent Sessions</div>
            </div>
            <div id="allSessionsList" style="max-height:500px;overflow-y:auto">
              ${sessions.slice().reverse().slice(0, 20).map(s => sessionItem(s, true)).join('')
                || `<p class="text-muted text-sm" style="padding:16px">No sessions yet</p>`}
            </div>
          </div>
        </div>
      </div>
    `;

    // Subject chart
    if (subjectData.length) {
      renderBarChart(document.getElementById('subjectChartContainer'), subjectData, {
        height: 160, formatY: v => `${Math.round(v/60)}h`, formatVal: v => `${Math.round(v/60)}h`,
      });
      const legend = document.getElementById('subjectLegend');
      subjectData.forEach(d => {
        legend.innerHTML += `<span style="display:flex;align-items:center;gap:4px;font-size:12px;font-weight:600">
          <span style="width:10px;height:10px;border-radius:3px;background:${d.color}"></span>${d.label}</span>`;
      });
    } else {
      document.getElementById('subjectChartContainer').innerHTML =
        '<p class="text-muted text-sm" style="padding:16px">No study data yet</p>';
    }

    document.getElementById('logSessionBtn').onclick = () => showLogSessionModal(tasks);

    // Delete handlers
    qsa('.session-delete-btn').forEach(btn => {
      btn.onclick = async () => {
        if (!confirm('Delete this session?')) return;
        try {
          await StudyAPI.delete(btn.dataset.id);
          showToast('Session deleted', 'info');
          await renderStudyPage();
        } catch (err) { showToast(err.message, 'error'); }
      };
    });

  } catch (e) {
    root.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div>
      <h3>${e.message}</h3></div>`;
  }
}

function miniStat(icon, label, value, color) {
  return `<div class="stat-card">
    <div class="stat-icon ${color}">${icon}</div>
    <div class="stat-info">
      <div class="stat-label">${label}</div>
      <div class="stat-value" style="font-size:20px">${value}</div>
    </div>
  </div>`;
}

function sessionItem(s, showDelete = false) {
  const color = subjectColor(s.subject);
  const productivity = s.productivity || 5;
  const moodEmojis = { happy: '😊', neutral: '😐', tired: '😴', stressed: '😰' };
  return `
    <div class="session-card">
      <div class="session-subject-dot" style="background:${color}"></div>
      <div class="session-details">
        <div class="session-subject">${s.subject}</div>
        <div class="session-meta">
          ${formatDate(s.date)} · ${moodEmojis[s.mood] || '😐'} · Productivity: ${productivity}/10
          ${s.distractionMinutes > 0 ? ` · 😵 ${s.distractionMinutes}m distracted` : ''}
        </div>
        ${s.notes ? `<div class="text-sm text-muted mt-2" style="font-style:italic">"${s.notes}"</div>` : ''}
      </div>
      <div style="text-align:right">
        <div class="session-duration">${minutesToHM(s.duration)}</div>
        ${showDelete ? `<button class="btn btn-danger btn-sm session-delete-btn mt-2" data-id="${s.id}">🗑</button>` : ''}
      </div>
    </div>`;
}

function showLogSessionModal(tasks) {
  openModal('Log Study Session', `
    <form id="logSessionForm">
      <div class="form-group">
        <label class="form-label">Subject *</label>
        <input class="form-control" id="sessSubject" placeholder="e.g. Mathematics" list="subjectList" required />
        <datalist id="subjectList">
          <option value="Mathematics"/>
          <option value="Physics"/>
          <option value="Chemistry"/>
          <option value="English"/>
          <option value="Computer Science"/>
          <option value="History"/>
        </datalist>
      </div>
      <div class="form-group">
        <label class="form-label">Linked Task (optional)</label>
        <select class="form-control" id="sessTask">
          <option value="">— No specific task —</option>
          ${tasks.map(t => `<option value="${t.id}">${t.title}</option>`).join('')}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Duration (minutes) *</label>
          <input class="form-control" type="number" id="sessDuration" min="5" max="480" value="25" required />
        </div>
        <div class="form-group">
          <label class="form-label">Distraction (minutes)</label>
          <input class="form-control" type="number" id="sessDistraction" min="0" max="480" value="0" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Mood</label>
        <div class="mood-picker" id="moodPicker">
          ${['happy','neutral','tired','stressed'].map(m => 
            `<button type="button" class="mood-btn${m==='neutral'?' selected':''}" data-mood="${m}">${
              {happy:'😊 Happy',neutral:'😐 Neutral',tired:'😴 Tired',stressed:'😰 Stressed'}[m]
            }</button>`
          ).join('')}
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Productivity: <span id="prodVal">5</span>/10</label>
        <input class="range-slider" type="range" id="sessProductivity" min="1" max="10" value="5"
          oninput="document.getElementById('prodVal').textContent=this.value" />
      </div>
      <div class="form-group">
        <label class="form-label">Notes</label>
        <textarea class="form-control" id="sessNotes" rows="2" placeholder="What did you study?"></textarea>
      </div>
      <button type="submit" class="btn btn-primary w-full">Log Session</button>
    </form>
  `);

  // Mood picker
  let selectedMood = 'neutral';
  qsa('#moodPicker .mood-btn').forEach(btn => {
    btn.onclick = () => {
      qsa('#moodPicker .mood-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedMood = btn.dataset.mood;
    };
  });

  document.getElementById('logSessionForm').onsubmit = async (e) => {
    e.preventDefault();
    try {
      await StudyAPI.create({
        subject            : document.getElementById('sessSubject').value,
        taskId             : document.getElementById('sessTask').value || null,
        duration           : parseInt(document.getElementById('sessDuration').value),
        distractionMinutes : parseInt(document.getElementById('sessDistraction').value),
        mood               : selectedMood,
        productivity       : parseInt(document.getElementById('sessProductivity').value),
        notes              : document.getElementById('sessNotes').value,
      });
      closeModal();
      showToast('Study session logged! 📚', 'success');
      await renderStudyPage();
    } catch (err) { showToast(err.message, 'error'); }
  };
}
