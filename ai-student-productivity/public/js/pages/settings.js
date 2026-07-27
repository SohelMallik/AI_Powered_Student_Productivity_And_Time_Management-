/* ============================================================
   Settings Page
   ============================================================ */
async function renderSettingsPage() {
  const root = document.getElementById('settings-root');
  root.innerHTML = `<div style="text-align:center;padding:32px"><div class="spinner"></div></div>`;
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
    <div class="flex justify-between items-center mb-4">
      <h2 style="font-size:20px;font-weight:800">⚙️ Settings</h2>
    </div>

    <!-- Profile -->
    <div class="settings-section">
      <div class="settings-section-title">👤 Student Profile</div>
      <form id="profileForm">
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
          <input class="form-control" id="pSubjects" value="${(profile.subjects||[]).join(', ')}" placeholder="Math, Physics, English..." />
        </div>
        <button type="submit" class="btn btn-primary">Save Profile</button>
      </form>
    </div>

    <!-- Study Goals -->
    <div class="settings-section">
      <div class="settings-section-title">📚 Study Goals</div>
      <div class="settings-row">
        <div>
          <div class="settings-label">Daily Study Goal</div>
          <div class="settings-desc">Target hours to study each day</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <input class="form-control" type="number" id="dailyGoal" min="1" max="16" 
            value="${profile.studyGoalHours || 6}" style="width:70px" />
          <span>hours</span>
        </div>
      </div>
      <div class="settings-row">
        <div>
          <div class="settings-label">Pomodoro Work Duration</div>
          <div class="settings-desc">Minutes per work session</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <input class="form-control" type="number" id="pomWork" min="5" max="90" 
            value="${profile.pomodoroWork || 25}" style="width:70px" />
          <span>min</span>
        </div>
      </div>
      <div class="settings-row">
        <div>
          <div class="settings-label">Pomodoro Break Duration</div>
          <div class="settings-desc">Minutes per break</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <input class="form-control" type="number" id="pomBreak" min="1" max="30" 
            value="${profile.pomodoroBreak || 5}" style="width:70px" />
          <span>min</span>
        </div>
      </div>
      <div style="margin-top:16px">
        <button class="btn btn-primary" onclick="saveStudyGoals()">Save Goals</button>
      </div>
    </div>

    <!-- AI Settings -->
    <div class="settings-section">
      <div class="settings-section-title">🤖 AI Settings</div>
      <div class="settings-row">
        <div>
          <div class="settings-label">Auto Daily Analysis</div>
          <div class="settings-desc">AI analyzes your data every midnight</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="autoAnalysis" checked />
          <span class="toggle-track"></span>
        </label>
      </div>
      <div class="settings-row">
        <div>
          <div class="settings-label">Procrastination Alerts</div>
          <div class="settings-desc">Get alerted when procrastination is detected</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="procAlerts" checked />
          <span class="toggle-track"></span>
        </label>
      </div>
    </div>

    <!-- Danger Zone -->
    <div class="settings-section" style="border-color:var(--color-danger)">
      <div class="settings-section-title" style="color:var(--color-danger)">⚠️ Danger Zone</div>
      <div class="settings-row">
        <div>
          <div class="settings-label">Clear All Study Sessions</div>
          <div class="settings-desc">Permanently delete all recorded study sessions</div>
        </div>
        <button class="btn btn-danger btn-sm" onclick="confirmDangerAction('clear-sessions')">Clear</button>
      </div>
    </div>

    <!-- App Info -->
    <div class="settings-section">
      <div class="settings-section-title">ℹ️ App Info</div>
      <div class="settings-row">
        <span class="settings-label">Version</span>
        <span class="text-muted">1.0.0</span>
      </div>
      <div class="settings-row">
        <span class="settings-label">AI Engine</span>
        <span class="text-muted">IBM Bob AI Engine v1</span>
      </div>
      <div class="settings-row">
        <span class="settings-label">Backend</span>
        <span class="text-muted">Node.js + Express</span>
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
