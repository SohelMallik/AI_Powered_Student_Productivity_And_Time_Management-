/* ============================================================
   Study Tracker Page – Vivid Animated Theme
   ============================================================ */
async function renderStudyPage() {
  const root = document.getElementById('study-root');
  root.innerHTML = `
    <div style="text-align:center;padding:48px;animation:fadeIn .5s ease">
      <div class="spinner"></div>
      <p style="margin-top:14px;color:var(--color-muted);font-size:13px">Loading study data…</p>
    </div>`;

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

    const bySubject   = analysis.bySubject || {};
    const subjectData = Object.entries(bySubject).map(([k, v]) => ({
      label: k, value: v.study, color: subjectColor(k),
    }));

    const focusScore = analysis.focusScore || 0;
    const focusBg    = focusScore >= 70 ? 'linear-gradient(135deg,#d1fae5,#a7f3d0)' :
                       focusScore >= 40 ? 'linear-gradient(135deg,#fef3c7,#fde68a)' :
                                          'linear-gradient(135deg,#fee2e2,#fecaca)';
    const focusColor = focusScore >= 70 ? '#065f46' : focusScore >= 40 ? '#92400e' : '#991b1b';

    root.innerHTML = `
      <!-- Hero Banner -->
      <div class="page-hero study-hero">
        <div class="page-hero-orb orb1"></div>
        <div class="page-hero-orb orb2"></div>
        <div class="page-hero-content">
          <h1 class="page-hero-title">Study Tracker</h1>
          <p class="page-hero-sub">${sessions.length} sessions logged · ${minutesToHM(analysis.totalStudyMinutes||0)} total</p>
        </div>
        <button class="hero-action-btn" id="logSessionBtn">＋ Log Session</button>
      </div>

      <!-- Vivid Stat Cards -->
      <div class="grid-4 mb-4">
        <div class="vivid-stat-card" style="background:linear-gradient(135deg,#0ea5e9,#6366f1);animation:slideUp .35s ease both">
          <div class="vsc2-icon">⏱</div>
          <div class="vsc2-val">${minutesToHM(analysis.totalStudyMinutes||0)}</div>
          <div class="vsc2-label">Total Study</div>
        </div>
        <div class="vivid-stat-card" style="background:${focusBg};color:${focusColor};animation:slideUp .35s .07s ease both">
          <div class="vsc2-icon" style="background:rgba(0,0,0,.08)">💡</div>
          <div class="vsc2-val" style="color:${focusColor}">${focusScore}%</div>
          <div class="vsc2-label" style="color:${focusColor}cc">Focus Score</div>
        </div>
        <div class="vivid-stat-card" style="background:linear-gradient(135deg,#7c3aed,#a855f7);animation:slideUp .35s .14s ease both">
          <div class="vsc2-icon">📅</div>
          <div class="vsc2-val">${minutesToHM(todayRes.totalMinutes||0)}</div>
          <div class="vsc2-label">Today</div>
        </div>
        <div class="vivid-stat-card" style="background:linear-gradient(135deg,#ef4444,#f97316);animation:slideUp .35s .21s ease both">
          <div class="vsc2-icon">😵</div>
          <div class="vsc2-val">${minutesToHM(analysis.totalDistractionMinutes||0)}</div>
          <div class="vsc2-label">Distraction</div>
        </div>
      </div>

      <!-- Focus Analysis Card -->
      <div class="vivid-card mb-4" style="animation:slideUp .4s .1s ease both">
        <div class="vivid-section-header">
          <span class="section-pill study">🎯 Focus Analysis</span>
          <span class="badge ${focusScore>=70?'badge-green':focusScore>=40?'badge-yellow':'badge-red'}">${analysis.verdict||'—'}</span>
        </div>
        <div style="font-size:17px;font-weight:800;margin:12px 0 8px;color:${focusColor}">${analysis.verdict || '—'}</div>
        <div class="shimmer-progress-track">
          <div class="shimmer-progress-fill" style="width:${focusScore}%;background:${focusScore>=70?'linear-gradient(90deg,#22c55e,#10b981)':focusScore>=40?'linear-gradient(90deg,#f59e0b,#fbbf24)':'linear-gradient(90deg,#ef4444,#f97316)'}"></div>
        </div>
        <div style="font-size:12px;color:var(--color-muted);margin-top:6px">${focusScore}% focus efficiency</div>
      </div>

      <!-- Charts + Sessions Grid -->
      <div class="dashboard-grid">
        <div>
          <!-- By Subject Chart -->
          <div class="vivid-card mb-4" style="animation:slideUp .5s .15s ease both">
            <div class="vivid-section-header">
              <span class="section-pill analytics">📚 Study by Subject</span>
            </div>
            <div id="subjectChartContainer" class="mt-3"></div>
            <div id="subjectLegend" class="flex gap-2 mt-4" style="flex-wrap:wrap"></div>
          </div>

          <!-- Today's Sessions -->
          <div class="vivid-card" style="animation:slideUp .5s .2s ease both">
            <div class="vivid-section-header">
              <span class="section-pill schedule">📅 Today's Sessions</span>
              <span class="badge badge-blue">${todaySess.length}</span>
            </div>
            <div id="todaySessionsList" class="mt-3">
              ${todaySess.length ? todaySess.map((s,i) => sessionItem(s, false, i)).join('')
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
          <div class="vivid-card" style="animation:slideUp .5s .25s ease both">
            <div class="vivid-section-header">
              <span class="section-pill tasks">🕒 Recent Sessions</span>
            </div>
            <div id="allSessionsList" style="max-height:500px;overflow-y:auto;margin-top:12px">
              ${sessions.slice().reverse().slice(0, 20).map((s,i) => sessionItem(s, true, i)).join('')
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
        legend.innerHTML += `<span style="display:flex;align-items:center;gap:4px;font-size:12px;font-weight:700;color:var(--color-text)">
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

function sessionItem(s, showDelete = false, idx = 0) {
  const color = subjectColor(s.subject);
  const productivity = s.productivity || 5;
  const moodEmojis = { happy:'😊', neutral:'😐', tired:'😴', stressed:'😰' };
  const prodColor = productivity >= 7 ? '#22c55e' : productivity >= 4 ? '#f59e0b' : '#ef4444';
  return `
    <div class="vivid-session-card" style="animation:slideLeft .4s ${idx*.055}s ease both;border-left:4px solid ${color}">
      <div class="vssn-dot" style="background:${color}"></div>
      <div class="vssn-body">
        <div class="vssn-subject" style="color:${color}">${s.subject}</div>
        <div class="vssn-meta">
          ${formatDate(s.date)} · ${moodEmojis[s.mood]||'😐'}
          ${s.distractionMinutes > 0 ? ` · 😵 ${s.distractionMinutes}m` : ''}
        </div>
        ${s.notes ? `<div class="vssn-notes">"${s.notes}"</div>` : ''}
      </div>
      <div class="vssn-right">
        <div class="vssn-duration">${minutesToHM(s.duration)}</div>
        <div style="font-size:11px;font-weight:700;color:${prodColor}">${productivity}/10</div>
        ${showDelete ? `<button class="vtc-btn vtc-btn-red session-delete-btn mt-2" data-id="${s.id}" style="font-size:10px;padding:2px 6px">🗑</button>` : ''}
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
