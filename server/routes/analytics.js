// ============================================================
// Analytics Router – historical data & charts
// ============================================================
const express = require('express');
const router  = express.Router();
const moment  = require('moment');
const { readData } = require('../utils/dataStore');

// GET /api/analytics/overview
router.get('/overview', async (_req, res) => {
  try {
    const [analytics, tasks, studySessions] = await Promise.all([
      readData('analytics'),
      readData('tasks'),
      readData('studySessions'),
    ]);

    const last7 = analytics.daily.slice(-7);
    const totalStudyMin = studySessions.reduce((s, x) => s + (x.duration || 0), 0);
    const avgDaily = last7.length
      ? Math.round(last7.reduce((s, d) => s + (d.studyMinutes || 0), 0) / last7.length)
      : 0;

    res.json({
      success: true,
      data: {
        totalTasks       : tasks.length,
        completedTasks   : tasks.filter(t => t.completed).length,
        totalStudyMinutes: totalStudyMin,
        avgDailyMinutes  : avgDaily,
        last7Days        : last7,
        streakDays       : calculateStreak(analytics.daily),
      },
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/analytics/weekly
router.get('/weekly', async (_req, res) => {
  try {
    const analytics = await readData('analytics');
    const last14    = analytics.daily.slice(-14);
    res.json({ success: true, data: last14 });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/analytics/productivity-trend
router.get('/productivity-trend', async (_req, res) => {
  try {
    const studySessions = await readData('studySessions');
    const grouped = {};
    for (const s of studySessions) {
      const day = (s.date || '').split('T')[0];
      if (!day) continue;
      if (!grouped[day]) grouped[day] = { productivity: [], mood: [] };
      if (s.productivity) grouped[day].productivity.push(s.productivity);
      if (s.mood)         grouped[day].mood.push(s.mood);
    }
    const trend = Object.entries(grouped).map(([date, v]) => ({
      date,
      avgProductivity: v.productivity.length
        ? (v.productivity.reduce((a, b) => a + b, 0) / v.productivity.length).toFixed(1)
        : null,
      dominantMood: mostFrequent(v.mood),
    })).sort((a, b) => a.date.localeCompare(b.date)).slice(-30);

    res.json({ success: true, data: trend });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Helpers ───────────────────────────────────────────────────
function calculateStreak(dailyLog) {
  let streak = 0;
  const sorted = [...dailyLog].sort((a, b) => b.date.localeCompare(a.date));
  let prev = moment().startOf('day');
  for (const entry of sorted) {
    const d = moment(entry.date).startOf('day');
    if (Math.abs(prev.diff(d, 'days')) <= 1 && entry.studyMinutes > 0) {
      streak++;
      prev = d;
    } else break;
  }
  return streak;
}

function mostFrequent(arr) {
  if (!arr.length) return null;
  const freq = arr.reduce((acc, v) => { acc[v] = (acc[v] || 0) + 1; return acc; }, {});
  return Object.keys(freq).reduce((a, b) => freq[a] > freq[b] ? a : b);
}

module.exports = router;
