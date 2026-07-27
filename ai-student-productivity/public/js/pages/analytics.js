/* ============================================================
   Analytics Page
   ============================================================ */
async function renderAnalyticsPage() {
  const root = document.getElementById('analytics-root');
  root.innerHTML = `<div style="text-align:center;padding:32px"><div class="spinner"></div></div>`;
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
  root.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <h2 style="font-size:20px;font-weight:800">Analytics</h2>
      <span class="badge badge-blue">Last 30 days</span>
    </div>

    <!-- KPI Row -->
    <div class="grid-4 mb-4">
      ${kpiCard('📚', 'Total Tasks', overview.totalTasks || 0, 'All time')}
      ${kpiCard('✅', 'Completed', overview.completedTasks || 0, `${overview.totalTasks ? Math.round((overview.completedTasks/overview.totalTasks)*100) : 0}% rate`)}
      ${kpiCard('⏱', 'Total Study', minutesToHM(overview.totalStudyMinutes || 0), 'All sessions')}
      ${kpiCard('📊', 'Daily Avg', minutesToHM(overview.avgDailyMinutes || 0), 'Last 7 days')}
    </div>

    <!-- Charts Row -->
    <div class="grid-2 mb-4">
      <!-- Weekly Study Bar -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">📅 14-Day Study Log</div>
        </div>
        <div id="weeklyStudyChart"></div>
      </div>

      <!-- Distraction Donut -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">💡 Study vs Distraction</div>
        </div>
        <div id="distractionDonut" style="display:flex;align-items:center;justify-content:center;gap:24px;padding:8px"></div>
      </div>
    </div>

    <!-- Productivity Trend -->
    <div class="card mb-4">
      <div class="card-header">
        <div class="card-title">📈 Productivity Trend</div>
      </div>
      <div id="productivityTrendChart"></div>
    </div>

    <!-- Raw Table -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">📋 Daily Summary</div>
      </div>
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="border-bottom:2px solid var(--color-border)">
              <th style="text-align:left;padding:10px;font-weight:700">Date</th>
              <th style="text-align:right;padding:10px;font-weight:700">Study</th>
              <th style="text-align:right;padding:10px;font-weight:700">Distraction</th>
              <th style="text-align:right;padding:10px;font-weight:700">Sessions</th>
              <th style="text-align:right;padding:10px;font-weight:700">Focus %</th>
            </tr>
          </thead>
          <tbody>
            ${weekly.slice().reverse().map(d => {
              const focusPct = d.studyMinutes > 0
                ? Math.round(((d.studyMinutes - (d.distractionMinutes||0)) / d.studyMinutes) * 100) : 0;
              return `<tr style="border-bottom:1px solid var(--color-border)">
                <td style="padding:10px">${formatDate(d.date)}</td>
                <td style="padding:10px;text-align:right;font-weight:600">${minutesToHM(d.studyMinutes||0)}</td>
                <td style="padding:10px;text-align:right;color:var(--color-warning)">${minutesToHM(d.distractionMinutes||0)}</td>
                <td style="padding:10px;text-align:right">${d.sessions||0}</td>
                <td style="padding:10px;text-align:right">
                  <span style="color:${focusPct>=80?'var(--color-success)':focusPct>=60?'var(--color-accent)':'var(--color-danger)'};font-weight:700">${focusPct}%</span>
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
    })), { height: 180, formatY: v => `${v}h`, formatVal: v => `${v}h`, color: '#3b82d4' });
  }

  // Distraction donut
  const distrContainer = document.getElementById('distractionDonut');
  const totalStudy = weekly.reduce((s, d) => s + (d.studyMinutes||0), 0);
  const totalDistr = weekly.reduce((s, d) => s + (d.distractionMinutes||0), 0);
  const focused    = Math.max(0, totalStudy - totalDistr);
  if (totalStudy > 0) {
    const donutEl = document.createElement('div');
    renderDonutChart(donutEl, [
      { label: 'Focus',       value: focused,   color: '#22c55e' },
      { label: 'Distraction', value: totalDistr, color: '#ef4444' },
    ], { size: 140, centerText: `${Math.round((focused/totalStudy)*100)}%`, centerSub: 'Focus' });
    distrContainer.appendChild(donutEl);
    distrContainer.innerHTML += `
      <div>
        ${[['#22c55e','Focus', minutesToHM(focused)],['#ef4444','Distraction',minutesToHM(totalDistr)]].map(([c,l,v])=>`
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span style="width:12px;height:12px;border-radius:3px;background:${c}"></span>
            <span style="font-weight:600;font-size:13px">${l}</span>
            <span class="text-muted text-sm">${v}</span>
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

function kpiCard(icon, label, value, sub) {
  return `<div class="stat-card">
    <div class="stat-icon blue">${icon}</div>
    <div class="stat-info">
      <div class="stat-label">${label}</div>
      <div class="stat-value" style="font-size:22px">${value}</div>
      <div class="stat-sub">${sub}</div>
    </div>
  </div>`;
}
