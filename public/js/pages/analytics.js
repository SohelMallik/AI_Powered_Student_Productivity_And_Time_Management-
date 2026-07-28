/* ============================================================
   Analytics Page – Vivid Animated Theme
   ============================================================ */
async function renderAnalyticsPage() {
  const root = document.getElementById('analytics-root');
  root.innerHTML = `
    <div style="text-align:center;padding:48px;animation:fadeIn .5s ease">
      <div class="spinner"></div>
      <p style="margin-top:14px;color:var(--color-muted);font-size:13px">Crunching your data…</p>
    </div>`;
  try {
    const [overview, weekly, trend] = await Promise.all([
      AnalyticsAPI.overview(),
      AnalyticsAPI.weekly(),
      AnalyticsAPI.productivityTrend(),
    ]);
    buildAnalyticsUI(overview.data, weekly.data || [], trend.data || []);
  } catch (e) {
    root.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div>
      <h3>${e.message}</h3></div>`;
  }
}

function buildAnalyticsUI(overview, weekly, trend) {
  const root = document.getElementById('analytics-root');
  const completionRate = overview.totalTasks
    ? Math.round((overview.completedTasks / overview.totalTasks) * 100) : 0;

  root.innerHTML = `
    <!-- Hero Banner -->
    <div class="page-hero analytics-hero">
      <div class="page-hero-orb orb1"></div>
      <div class="page-hero-orb orb2"></div>
      <div class="page-hero-content">
        <h1 class="page-hero-title">Analytics</h1>
        <p class="page-hero-sub">Last 30 days · ${weekly.length} daily records</p>
      </div>
      <span class="hero-badge">📊 Live</span>
    </div>

    <!-- KPI Cards -->
    <div class="grid-4 mb-4">
      ${analyticsKpiCard('📚','Total Tasks', overview.totalTasks||0,'All time','#6366f1','#4338ca','0')}
      ${analyticsKpiCard('✅','Completed', overview.completedTasks||0,`${completionRate}% rate`,'#22c55e','#15803d','.07s')}
      ${analyticsKpiCard('⏱','Total Study', minutesToHM(overview.totalStudyMinutes||0),'All sessions','#f59e0b','#d97706','.14s')}
      ${analyticsKpiCard('📊','Daily Avg', minutesToHM(overview.avgDailyMinutes||0),'Last 7 days','#ec4899','#be185d','.21s')}
    </div>

    <!-- Charts Row -->
    <div class="grid-2 mb-4">
      <div class="vivid-card" style="animation:slideUp .45s .1s ease both">
        <div class="vivid-section-header">
          <span class="section-pill analytics">📅 14-Day Study Log</span>
        </div>
        <div id="weeklyStudyChart" class="mt-3"></div>
      </div>
      <div class="vivid-card" style="animation:slideUp .45s .16s ease both">
        <div class="vivid-section-header">
          <span class="section-pill study">💡 Study vs Distraction</span>
        </div>
        <div id="distractionDonut" style="display:flex;align-items:center;justify-content:center;gap:24px;padding:16px"></div>
      </div>
    </div>

    <!-- Productivity Trend -->
    <div class="vivid-card mb-4" style="animation:slideUp .5s .2s ease both">
      <div class="vivid-section-header">
        <span class="section-pill tasks">📈 Productivity Trend</span>
      </div>
      <div id="productivityTrendChart" class="mt-3"></div>
    </div>

    <!-- Data Table -->
    <div class="vivid-card" style="animation:slideUp .55s .25s ease both">
      <div class="vivid-section-header">
        <span class="section-pill schedule">📋 Daily Summary</span>
      </div>
      <div style="overflow-x:auto;margin-top:12px">
        <table class="vivid-table">
          <thead>
            <tr>
              <th>Date</th>
              <th style="text-align:right">Study</th>
              <th style="text-align:right">Distraction</th>
              <th style="text-align:right">Sessions</th>
              <th style="text-align:right">Focus %</th>
            </tr>
          </thead>
          <tbody>
            ${weekly.slice().reverse().map((d, i) => {
              const focusPct = d.studyMinutes > 0
                ? Math.round(((d.studyMinutes - (d.distractionMinutes||0)) / d.studyMinutes) * 100) : 0;
              const focusColor = focusPct>=80?'#22c55e':focusPct>=60?'#6366f1':'#ef4444';
              return `<tr style="animation:slideLeft .35s ${i*.03}s ease both">
                <td style="font-weight:600">${formatDate(d.date)}</td>
                <td style="text-align:right;font-weight:700;color:#6366f1">${minutesToHM(d.studyMinutes||0)}</td>
                <td style="text-align:right;color:#f59e0b;font-weight:600">${minutesToHM(d.distractionMinutes||0)}</td>
                <td style="text-align:right">${d.sessions||0}</td>
                <td style="text-align:right">
                  <span class="focus-pill" style="background:${focusColor}18;color:${focusColor}">${focusPct}%</span>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
        ${!weekly.length ? `<div class="empty-state" style="padding:32px">
          <div class="empty-state-icon">📊</div>
          <h3>No data yet</h3>
          <p>Start logging study sessions to see analytics</p>
        </div>` : ''}
      </div>
    </div>
  `;

  // 14-day bar chart
  if (weekly.length) {
    renderBarChart(document.getElementById('weeklyStudyChart'), weekly.map(d => ({
      label: (d.date||'').slice(5), value: Math.round((d.studyMinutes||0)/60*10)/10,
    })), { height: 180, formatY: v => `${v}h`, formatVal: v => `${v}h`, color: '#6366f1' });
  }

  // Distraction donut
  const distrContainer = document.getElementById('distractionDonut');
  const totalStudy = weekly.reduce((s, d) => s + (d.studyMinutes||0), 0);
  const totalDistr = weekly.reduce((s, d) => s + (d.distractionMinutes||0), 0);
  const focused    = Math.max(0, totalStudy - totalDistr);
  if (totalStudy > 0) {
    const donutEl = document.createElement('div');
    renderDonutChart(donutEl, [
      { label: 'Focus',       value: focused,    color: '#22c55e' },
      { label: 'Distraction', value: totalDistr, color: '#ef4444' },
    ], { size: 140, centerText: `${Math.round((focused/totalStudy)*100)}%`, centerSub: 'Focus' });
    distrContainer.appendChild(donutEl);
    distrContainer.innerHTML += `
      <div>
        ${[['#22c55e','Focus',minutesToHM(focused)],['#ef4444','Distraction',minutesToHM(totalDistr)]].map(([c,l,v])=>`
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
            <span style="width:12px;height:12px;border-radius:3px;background:${c};flex-shrink:0"></span>
            <span style="font-weight:700;font-size:13px">${l}</span>
            <span style="color:var(--color-muted);font-size:12px">${v}</span>
          </div>`).join('')}
      </div>`;
  } else {
    distrContainer.innerHTML = '<p class="text-muted text-sm">No study data yet</p>';
  }

  // Productivity trend line
  if (trend.length) {
    renderLineChart(document.getElementById('productivityTrendChart'), trend.map(d => ({
      label: (d.date||'').slice(5), value: parseFloat(d.avgProductivity) || 0,
    })), { height: 160, color: '#7c5cd8' });
  } else {
    document.getElementById('productivityTrendChart').innerHTML =
      '<p class="text-muted text-sm" style="padding:16px">No productivity data yet</p>';
  }
}

function analyticsKpiCard(icon, label, value, sub, fromColor, toColor, delay) {
  return `
    <div class="vivid-kpi-card" style="background:linear-gradient(135deg,${fromColor},${toColor});animation:slideUp .4s ${delay} ease both">
      <div class="vkpi-icon">${icon}</div>
      <div class="vkpi-val">${value}</div>
      <div class="vkpi-label">${label}</div>
      <div class="vkpi-sub">${sub}</div>
    </div>`;
}
