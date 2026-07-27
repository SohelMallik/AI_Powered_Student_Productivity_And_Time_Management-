/* ============================================================
   AI Insights Page – Procrastination Detector + Distraction Analyzer
   ============================================================ */
async function renderAIInsightsPage() {
  const root = document.getElementById('ai-root');
  root.innerHTML = `<div style="text-align:center;padding:32px"><div class="spinner"></div></div>`;
  try {
    const [procRes, distrRes, timeRes, semRes] = await Promise.all([
      AIAPI.procrastination(),
      AIAPI.distractionAnalysis(),
      AIAPI.timeOptimization(),
      AIAPI.semesterProgress(),
    ]);
    buildAIInsightsUI(procRes.data || [], distrRes.data || {}, timeRes.data || [], semRes.data || {});
  } catch (e) {
    root.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div>
      <h3>${e.message}</h3>
      <button class="btn btn-primary mt-4" onclick="renderAIInsightsPage()">Retry</button></div>`;
  }
}

function buildAIInsightsUI(procs, distr, timeOpts, semProg) {
  const root = document.getElementById('ai-root');
  root.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <div>
        <h2 style="font-size:20px;font-weight:800">🤖 AI Insights</h2>
        <p class="text-muted text-sm">Powered by IBM Bob's AI Engine</p>
      </div>
      <button class="btn btn-primary" onclick="triggerAIAnalysis()">🔄 Re-analyze</button>
    </div>

    <div class="grid-2">
      <!-- Left Column -->
      <div>
        <!-- Procrastination Detector -->
        <div class="card mb-4">
          <div class="card-header">
            <div class="card-title">🚨 Procrastination Detector</div>
            <span class="badge ${procs.length ? 'badge-red' : 'badge-green'}">
              ${procs.length ? procs.length + ' detected' : 'All clear'}
            </span>
          </div>
          ${procs.length ? `
            <div id="procList">
              ${procs.slice(0, 5).map(p => procCard(p)).join('')}
            </div>
          ` : `
            <div class="empty-state" style="padding:24px">
              <div class="empty-state-icon">🌟</div>
              <h3>No procrastination detected!</h3>
              <p>You're on top of all your tasks. Keep it up!</p>
            </div>
          `}
        </div>

        <!-- Time Optimization -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">⚡ Time Optimization</div>
            <span class="badge badge-blue">${timeOpts.length} tips</span>
          </div>
          ${timeOpts.length ? timeOpts.map(s => `
            <div class="ai-alert ${s.priority}" style="margin-bottom:8px">
              <span>${s.priority === 'critical' ? '🚨' : s.priority === 'high' ? '🔶' : s.priority === 'medium' ? '💡' : '📌'}</span>
              <div>
                <div style="font-weight:700;font-size:12px;text-transform:uppercase;margin-bottom:2px">${s.type.replace('-',' ')}</div>
                <div>${s.message}</div>
              </div>
            </div>
          `).join('') : `<p class="text-muted text-sm">All optimized! 🎉</p>`}
        </div>
      </div>

      <!-- Right Column -->
      <div>
        <!-- Study vs Distraction -->
        <div class="card mb-4">
          <div class="card-header">
            <div class="card-title">📊 Study vs Distraction</div>
          </div>

          <!-- Focus Score Ring -->
          <div style="text-align:center;padding:16px 0">
            <div style="position:relative;width:140px;height:140px;margin:0 auto">
              <svg viewBox="0 0 140 140" width="140" height="140" style="transform:rotate(-90deg)">
                <circle cx="70" cy="70" r="56" fill="none" stroke="var(--color-border)" stroke-width="12"/>
                <circle cx="70" cy="70" r="56" fill="none" stroke="${scoreColor(distr.focusScore||0)}" stroke-width="12"
                  stroke-linecap="round" stroke-dasharray="351.9"
                  stroke-dashoffset="${351.9 * (1 - (distr.focusScore||0) / 100)}"/>
              </svg>
              <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
                <div style="font-size:28px;font-weight:800;color:${scoreColor(distr.focusScore||0)}">${distr.focusScore || 0}%</div>
                <div class="text-muted text-sm">Focus</div>
              </div>
            </div>
            <div style="font-size:18px;font-weight:700;margin:12px 0 4px">${distr.verdict || '—'}</div>
          </div>

          <!-- By Subject Breakdown -->
          ${Object.keys(distr.bySubject || {}).length ? `
            <div style="border-top:1px solid var(--color-border);padding-top:14px">
              <div style="font-weight:700;font-size:13px;margin-bottom:10px">By Subject</div>
              ${Object.entries(distr.bySubject || {}).map(([sub, v]) => {
                const focusPct = v.study > 0 ? Math.round(((v.study - v.distraction) / v.study) * 100) : 0;
                return `
                  <div style="margin-bottom:10px">
                    <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;margin-bottom:3px">
                      <span>${sub}</span>
                      <span>${focusPct}% · ${minutesToHM(v.study)}</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-fill ${focusPct>=70?'success':focusPct>=40?'':'danger'}"
                           style="width:${focusPct}%;background:${subjectColor(sub)}"></div>
                    </div>
                  </div>`;
              }).join('')}
            </div>
          ` : ''}

          <!-- Totals -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;border-top:1px solid var(--color-border);padding-top:12px">
            <div style="text-align:center">
              <div style="font-size:18px;font-weight:800;color:var(--color-success)">${minutesToHM(distr.totalStudyMinutes||0)}</div>
              <div class="text-muted text-sm">Total Study</div>
            </div>
            <div style="text-align:center">
              <div style="font-size:18px;font-weight:800;color:var(--color-danger)">${minutesToHM(distr.totalDistractionMinutes||0)}</div>
              <div class="text-muted text-sm">Lost to Distraction</div>
            </div>
          </div>
        </div>

        <!-- Semester Progress -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">🎓 Semester Progress</div>
            <span class="badge ${(semProg.healthScore||0)>=70?'badge-green':(semProg.healthScore||0)>=40?'badge-yellow':'badge-red'}">
              Health: ${semProg.healthScore || 0}
            </span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px">
            ${[['✅',semProg.completed||0,'Done'],['⚠️',semProg.overdue||0,'Overdue'],['📅',semProg.upcoming||0,'This Week']]
              .map(([i,v,l]) => `<div style="text-align:center;background:var(--color-bg);border-radius:8px;padding:10px">
                <div style="font-size:16px">${i}</div>
                <div style="font-size:20px;font-weight:800">${v}</div>
                <div class="text-muted text-sm">${l}</div>
              </div>`).join('')}
          </div>
          <div>
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
              <span>Completion Rate</span><span>${semProg.completionRate||0}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill ${(semProg.completionRate||0)>=70?'success':''}" style="width:${semProg.completionRate||0}%"></div>
            </div>
          </div>
          ${Object.entries(semProg.courseProgress || {}).length ? `
            <div style="border-top:1px solid var(--color-border);margin-top:12px;padding-top:12px">
              <div style="font-weight:700;font-size:13px;margin-bottom:8px">By Course</div>
              ${Object.entries(semProg.courseProgress || {}).map(([c, v]) => {
                const pct = v.total ? Math.round((v.completed/v.total)*100) : 0;
                return `<div style="margin-bottom:8px">
                  <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;margin-bottom:3px">
                    <span>${c}</span><span>${pct}%</span>
                  </div>
                  <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
                </div>`;
              }).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

function procCard(p) {
  const score = p.procrastinationScore || 0;
  return `
    <div class="procrastination-item ${score > 70 ? 'critical' : ''}">
      <div class="proc-task">📌 ${p.task?.title || 'Unknown Task'}</div>
      <div class="proc-tip">${p.suggestion}</div>
      <div class="proc-bar-wrap">
        <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px">
          <span>Procrastination Score</span><span style="font-weight:700;color:${score>70?'var(--color-danger)':'var(--color-warning)'}">${score}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill danger" style="width:${score}%"></div>
        </div>
        <div style="font-size:11px;color:var(--color-muted);margin-top:4px">
          ⏳ ${p.hoursLeft?.toFixed(1) || '?'}h left · 📖 ${minutesToHM(p.totalStudiedMinutes||0)} studied / ${minutesToHM(p.requiredMinutes||0)} needed
        </div>
      </div>
    </div>`;
}

async function triggerAIAnalysis() {
  showToast('Running AI analysis...', 'info', 2000);
  try {
    await AIAPI.analyze();
    showToast('AI analysis complete!', 'success');
    await renderAIInsightsPage();
  } catch (err) { showToast(err.message, 'error'); }
}
