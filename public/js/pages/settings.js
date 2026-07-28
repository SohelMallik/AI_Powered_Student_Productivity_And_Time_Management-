/* ============================================================
   Settings Page – Vivid Animated Theme
   ============================================================ */
async function renderSettingsPage() {
  const root = document.getElementById('settings-root');
  root.innerHTML = `
    <div style="text-align:center;padding:48px;animation:fadeIn .5s ease">
      <div class="spinner"></div>
      <p style="margin-top:14px;color:var(--color-muted);font-size:13px">Loading settings…</p>
    </div>`;
  try {
    const profileRes = await AIAPI.getProfile();
    buildSettingsUI(profileRes.data);
  } catch (e) {
    root.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div>
      <h3>${e.message}</h3></div>`;
  }
}

function buildSettingsUI(profile) {
  const root = document.getElementById('settings-root');
  root.innerHTML = `
    <!-- Hero Banner -->
    <div class="page-hero settings-hero">
      <div class="page-hero-orb orb1"></div>
      <div class="page-hero-orb orb2"></div>
      <div class="page-hero-content">
        <h1 class="page-hero-title">⚙️ Settings</h1>
        <p class="page-hero-sub">Personalize your AI Student experience</p>
      </div>
    </div>

    <!-- Profile Section -->
    <div class="vivid-settings-section" style="animation:slideUp .4s ease both">
      <div class="vss-header">
        <span class="section-pill tasks">👤 Student Profile</span>
      </div>
      <form id="profileForm" class="vss-body">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Name</label>
            <input class="form-control" id="pName" value="${profile.name || 'Student'}" placeholder="Your name" />
          </div>
          <div class="form-group">
            <label class="form-label">Preferred Study Time</label>
            <select class="form-control" id="pStudyTime">
              ${['morning','afternoon','evening','night'].map(t =>
                `<option value="${t}" ${profile.preferredStudyTime===t?'selected':''}>${capitalize(t)}</option>`
              ).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Subjects (comma-separated)</label>
          <input class="form-control" id="pSubjects" value="${(profile.subjects||[]).join(', ')}" placeholder="Math, Physics, English…" />
        </div>
        <button type="submit" class="btn btn-primary">Save Profile</button>
      </form>
    </div>

    <!-- Study Goals Section -->
    <div class="vivid-settings-section" style="animation:slideUp .4s .08s ease both">
      <div class="vss-header">
        <span class="section-pill study">📚 Study Goals</span>
      </div>
      <div class="vss-body">
        <div class="vss-row">
          <div>
            <div class="vss-label">Daily Study Goal</div>
            <div class="vss-desc">Target hours to study each day</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <input class="form-control" type="number" id="dailyGoal" min="1" max="16"
              value="${profile.studyGoalHours || 6}" style="width:72px" />
            <span style="font-size:13px;font-weight:600;color:var(--color-muted)">hours</span>
          </div>
        </div>
        <div class="vss-row">
          <div>
            <div class="vss-label">Pomodoro Work Duration</div>
            <div class="vss-desc">Minutes per work session</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <input class="form-control" type="number" id="pomWork" min="5" max="90"
              value="${profile.pomodoroWork || 25}" style="width:72px" />
            <span style="font-size:13px;font-weight:600;color:var(--color-muted)">min</span>
          </div>
        </div>
        <div class="vss-row">
          <div>
            <div class="vss-label">Pomodoro Break Duration</div>
            <div class="vss-desc">Minutes per break</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <input class="form-control" type="number" id="pomBreak" min="1" max="30"
              value="${profile.pomodoroBreak || 5}" style="width:72px" />
            <span style="font-size:13px;font-weight:600;color:var(--color-muted)">min</span>
          </div>
        </div>
        <button class="btn btn-primary" style="margin-top:4px" onclick="saveStudyGoals()">Save Goals</button>
      </div>
    </div>

    <!-- AI Settings Section -->
    <div class="vivid-settings-section" style="animation:slideUp .4s .16s ease both">
      <div class="vss-header">
        <span class="section-pill analytics">🤖 AI Settings</span>
      </div>
      <div class="vss-body">
        <div class="vss-row">
          <div>
            <div class="vss-label">Auto Daily Analysis</div>
            <div class="vss-desc">AI analyzes your data every midnight</div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="autoAnalysis" checked />
            <span class="toggle-track"></span>
          </label>
        </div>
        <div class="vss-row">
          <div>
            <div class="vss-label">Procrastination Alerts</div>
            <div class="vss-desc">Get alerted when procrastination is detected</div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="procAlerts" checked />
            <span class="toggle-track"></span>
          </label>
        </div>
      </div>
    </div>

    <!-- Danger Zone -->
    <div class="vivid-settings-section danger-zone" style="animation:slideUp .4s .24s ease both">
      <div class="vss-header">
        <span class="section-pill" style="background:#fee2e2;color:#b91c1c;border-color:#fca5a5">⚠️ Danger Zone</span>
      </div>
      <div class="vss-body">
        <div class="vss-row">
          <div>
            <div class="vss-label" style="color:#b91c1c">Clear All Study Sessions</div>
            <div class="vss-desc">Permanently delete all recorded study sessions</div>
          </div>
          <button class="btn btn-danger btn-sm" onclick="confirmDangerAction('clear-sessions')">Clear</button>
        </div>
      </div>
    </div>

    <!-- App Info -->
    <div class="vivid-settings-section" style="animation:slideUp .4s .32s ease both">
      <div class="vss-header">
        <span class="section-pill schedule">ℹ️ App Info</span>
      </div>
      <div class="vss-body">
        ${[['Version','1.0.0'],['AI Engine','IBM Bob AI Engine v1'],['Backend','Node.js + Express']]
          .map(([k,v]) => `<div class="vss-row">
            <span class="vss-label">${k}</span>
            <span class="vss-value">${v}</span>
          </div>`).join('')}
      </div>
    </div>
  `;

  document.getElementById('profileForm').onsubmit = async (e) => {
    e.preventDefault();
    try {
      await AIAPI.updateProfile({
        name               : document.getElementById('pName').value,
        preferredStudyTime : document.getElementById('pStudyTime').value,
        subjects           : document.getElementById('pSubjects').value.split(',').map(s => s.trim()).filter(Boolean),
      });
      showToast('Profile saved!', 'success');
      document.getElementById('userAvatar').textContent = document.getElementById('pName').value.charAt(0).toUpperCase();
    } catch (err) { showToast(err.message, 'error'); }
  };
}

async function saveStudyGoals() {
  try {
    await AIAPI.updateProfile({
      studyGoalHours: parseInt(document.getElementById('dailyGoal').value),
      pomodoroWork  : parseInt(document.getElementById('pomWork').value),
      pomodoroBreak : parseInt(document.getElementById('pomBreak').value),
    });
    showToast('Goals saved!', 'success');
  } catch (err) { showToast(err.message, 'error'); }
}

function confirmDangerAction(action) {
  if (action === 'clear-sessions') {
    if (!confirm('Are you sure? This will delete all study sessions permanently.')) return;
    showToast('Feature: contact admin to clear data', 'warning');
  }
}
