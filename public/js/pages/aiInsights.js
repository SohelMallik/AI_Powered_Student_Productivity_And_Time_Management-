/* ============================================================
   AI Insights Page – Vivid Animated Theme
   ============================================================ */
async function renderAIInsightsPage() {
  const root = document.getElementById('ai-root');
  root.innerHTML = `
    <div style="text-align:center;padding:48px;animation:fadeIn .5s ease">
      <div class="spinner"></div>
      <p style="margin-top:14px;color:var(--color-muted);font-size:13px">Running AI analysis…</p>
    </div>`;
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
  const focusScore = distr.focusScore || 0;
  const scoreC = scoreColor(focusScore);

  root.innerHTML = `
    <!-- Hero Banner -->
    <div class="page-hero ai-hero">
      <div class="page-hero-orb orb1"></div>
      <div class="page-hero-orb orb2"></div>
      <div class="page-hero-content">
        <h1 class="page-hero-title">🤖 AI Insights</h1>
        <p class="page-hero-sub">Powered by IBM Bob's AI Engine</p>
      </div>
      <button class="hero-action-btn" onclick="triggerAIAnalysis()">🔄 Re-analyze</button>
    </div>

    <div class="grid-2">
      <!-- Left Column -->
      <div>
        <!-- Procrastination Detector -->
        <div class="vivid-card mb-4" style="animation:slideUp .4s ease both">
          <div class="vivid-section-header">
            <span class="section-pill tasks">🚨 Procrastination Detector</span>
            <span class="badge ${procs.length ? 'badge-red' : 'badge-green'}">
              ${procs.length ? procs.length + ' detected' : 'All clear'}
            </span>
          </div>
          <div class="mt-3">
            ${procs.length ? procs.slice(0, 5).map((p,i) => procCard(p, i)).join('')
              : `<div class="empty-state" style="padding:24px">
                   <div class="empty-state-icon">🌟</div>
                   <h3>No procrastination detected!</h3>
                   <p>You're on top of all your tasks. Keep it up!</p>
                 </div>`}
          </div>
        </div>

        <!-- Time Optimization -->
        <div class="vivid-card" style="animation:slideUp .45s .08s ease both">
          <div class="vivid-section-header">
            <span class="section-pill study">⚡ Time Optimization</span>
            <span class="badge badge-blue">${timeOpts.length} tips</span>
          </div>
          <div class="mt-3">
            ${timeOpts.length ? timeOpts.map((s,i) => `
              <div class="vivid-ai-alert ${s.priority}" style="animation:slideLeft .35s ${i*.06}s ease both">
                <span class="vai-icon">${s.priority==='critical'?'🚨':s.priority==='high'?'🔶':s.priority==='medium'?'💡':'📌'}</span>
                <div class="vai-body">
                  <div class="vai-type">${s.type.replace(/-/g,' ')}</div>
                  <div class="vai-message">${s.message}</div>
                </div>
              </div>`).join('') : `<p class="text-muted text-sm">All optimized! 🎉</p>`}
          </div>
        </div>
      </div>

      <!-- Right Column -->
      <div>
        <!-- Study vs Distraction -->
        <div class="vivid-card mb-4" style="animation:slideUp .4s .05s ease both">
          <div class="vivid-section-header">
            <span class="section-pill analytics">📊 Study vs Distraction</span>
          </div>

          <!-- Focus Score Ring -->
          <div style="text-align:center;padding:20px 0 12px">
            <div style="position:relative;width:148px;height:148px;margin:0 auto">
              <svg viewBox="0 0 148 148" width="148" height="148" style="transform:rotate(-90deg)">
                <defs>
                  <linearGradient id="focusGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="${scoreC}"/>
                    <stop offset="100%" stop-color="${scoreC}88"/>
                  </linearGradient>
                </defs>
                <circle cx="74" cy="74" r="58" fill="none" stroke="#e5e7eb" stroke-width="14"/>
                <circle cx="74" cy="74" r="58" fill="none" stroke="url(#focusGrad)" stroke-width="14"
                  stroke-linecap="round" stroke-dasharray="364.4"
                  stroke-dashoffset="${364.4*(1-focusScore/100)}"
                  style="filter:drop-shadow(0 0 6px ${scoreC}88);transition:stroke-dashoffset 1s ease"/>
              </svg>
              <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
                <div style="font-size:30px;font-weight:900;color:${scoreC}">${focusScore}%</div>
                <div style="font-size:11px;color:var(--color-muted);font-weight:600">Focus</div>
              </div>
            </div>
            <div style="font-size:18px;font-weight:800;margin:12px 0 4px;color:var(--color-text)">${distr.verdict || '—'}</div>
          </div>

          <!-- By Subject Breakdown -->
          ${Object.keys(distr.bySubject||{}).length ? `
            <div style="border-top:1px solid var(--color-border);padding-top:14px">
              <div style="font-weight:800;font-size:13px;margin-bottom:10px;color:var(--color-text)">By Subject</div>
              ${Object.entries(distr.bySubject||{}).map(([sub, v]) => {
                const focusPct = v.study>0 ? Math.round(((v.study-v.distraction)/v.study)*100) : 0;
                const subCol   = subjectColor(sub);
                return `
                  <div style="margin-bottom:10px">
                    <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;margin-bottom:4px">
                      <span style="color:var(--color-text)">${sub}</span>
                      <span style="color:${subCol}">${focusPct}% · ${minutesToHM(v.study)}</span>
                    </div>
                    <div class="shimmer-progress-track">
                      <div class="shimmer-progress-fill" style="width:${focusPct}%;background:linear-gradient(90deg,${subCol},${subCol}aa)"></div>
                    </div>
                  </div>`;
              }).join('')}
            </div>` : ''}

          <!-- Totals -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px;border-top:1px solid var(--color-border);padding-top:14px">
            <div style="text-align:center;background:#f0fdf4;border-radius:10px;padding:12px">
              <div style="font-size:20px;font-weight:900;color:#22c55e">${minutesToHM(distr.totalStudyMinutes||0)}</div>
              <div style="font-size:11px;color:#15803d;font-weight:600">Total Study</div>
            </div>
            <div style="text-align:center;background:#fef2f2;border-radius:10px;padding:12px">
              <div style="font-size:20px;font-weight:900;color:#ef4444">${minutesToHM(distr.totalDistractionMinutes||0)}</div>
              <div style="font-size:11px;color:#b91c1c;font-weight:600">Distraction</div>
            </div>
          </div>
        </div>

        <!-- Semester Progress -->
        <div class="vivid-card" style="animation:slideUp .45s .12s ease both">
          <div class="vivid-section-header">
            <span class="section-pill semester">🎓 Semester Progress</span>
            <span class="badge ${(semProg.healthScore||0)>=70?'badge-green':(semProg.healthScore||0)>=40?'badge-yellow':'badge-red'}">
              Health ${semProg.healthScore||0}
            </span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:14px 0">
            ${[['✅',semProg.completed||0,'Done','#22c55e'],['⚠️',semProg.overdue||0,'Overdue','#ef4444'],['📅',semProg.upcoming||0,'This Week','#f59e0b']]
              .map(([i,v,l,c]) => `<div style="text-align:center;background:${c}12;border-radius:10px;padding:10px">
                <div style="font-size:16px">${i}</div>
                <div style="font-size:22px;font-weight:900;color:${c}">${v}</div>
                <div style="font-size:10px;color:var(--color-muted);font-weight:600">${l}</div>
              </div>`).join('')}
          </div>
          <div>
            <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;margin-bottom:6px">
              <span>Completion Rate</span>
              <span style="color:#6366f1">${semProg.completionRate||0}%</span>
            </div>
            <div class="shimmer-progress-track">
              <div class="shimmer-progress-fill" style="width:${semProg.completionRate||0}%;background:linear-gradient(90deg,#6366f1,#818cf8)"></div>
            </div>
          </div>
          ${Object.entries(semProg.courseProgress||{}).length ? `
            <div style="border-top:1px solid var(--color-border);margin-top:12px;padding-top:12px">
              <div style="font-weight:800;font-size:13px;margin-bottom:8px;color:var(--color-text)">By Course</div>
              ${Object.entries(semProg.courseProgress||{}).map(([c,v]) => {
                const pct = v.total ? Math.round((v.completed/v.total)*100) : 0;
                const col = subjectColor(c);
                return `<div style="margin-bottom:8px">
                  <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;margin-bottom:4px">
                    <span style="color:var(--color-text)">${c}</span>
                    <span style="color:${col}">${pct}%</span>
                  </div>
                  <div class="shimmer-progress-track">
                    <div class="shimmer-progress-fill" style="width:${pct}%;background:linear-gradient(90deg,${col},${col}aa)"></div>
                  </div>
                </div>`;
              }).join('')}
            </div>` : ''}
        </div>
      </div>
    </div>
  `;
}

function procCard(p, idx = 0) {
  const score = p.procrastinationScore || 0;
  const color = score > 70 ? '#ef4444' : score > 40 ? '#f59e0b' : '#6366f1';
  return `
    <div class="vivid-proc-item ${score > 70 ? 'critical' : ''}" style="animation:slideLeft .4s ${idx*.07}s ease both;border-left:4px solid ${color}">
      <div class="vpi-task">📌 ${p.task?.title || 'Unknown Task'}</div>
      <div class="vpi-tip">${p.suggestion}</div>
      <div class="vpi-bar">
        <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700;margin-bottom:4px">
          <span style="color:var(--color-muted)">Procrastination Score</span>
          <span style="color:${color}">${score}%</span>
        </div>
        <div class="shimmer-progress-track">
          <div class="shimmer-progress-fill" style="width:${score}%;background:linear-gradient(90deg,${color},${color}88)"></div>
        </div>
        <div style="font-size:11px;color:var(--color-muted);margin-top:4px">
          ⏳ ${p.hoursLeft?.toFixed(1)||'?'}h left · 📖 ${minutesToHM(p.totalStudiedMinutes||0)} / ${minutesToHM(p.requiredMinutes||0)}
        </div>
      </div>
    </div>`;
}

async function triggerAIAnalysis() {
  showToast('Running AI analysis…', 'info', 2000);
  try {
    await AIAPI.analyze();
    showToast('AI analysis complete!', 'success');
    await renderAIInsightsPage();
  } catch (err) { showToast(err.message, 'error'); }
}
