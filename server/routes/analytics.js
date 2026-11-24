// ============================================================
// Analytics Router – historical data & charts
// ============================================================
/**
 * File: server/routes/analytics.js
 *
 * This file defines read-only endpoints that summarize historical
 * study data for charts and dashboards: totals, averages, the daily
 * streak, and productivity/mood trends. It never modifies stored data.
 */
const express = require('express');
const router  = express.Router();
const moment  = require('moment');
const { readData } = require('../utils/dataStore');

/**
 * GET /api/analytics/overview
 *
 * Returns a one-shot dashboard summary: total/completed task counts,
 * total study minutes, the average daily study minutes for the last 7
 * days, the last 7 daily entries, and the current study streak.
 *
 * Request body: none.
 * Response: { success: true, data: { totalTasks, completedTasks,
 *   totalStudyMinutes, avgDailyMinutes, last7Days, streakDays } }.
 */
// GET /api/analytics/overview
router.get('/overview', async (_req, res) => {
  try {
    // Load all three data sets in parallel; each feeds a different stat below.
    const [analytics, tasks, studySessions] = await Promise.all([
      readData('analytics'),
      readData('tasks'),
      readData('studySessions'),
    ]);

    // Last 7 daily entries (slice with a negative index counts from the end).
    const last7 = analytics.daily.slice(-7);
    // Sum the duration of every session (0 if a session has no duration).
    const totalStudyMin = studySessions.reduce((s, x) => s + (x.duration || 0), 0);
    // Average study minutes across the last 7 days; 0 when there are no entries (avoid divide-by-zero).
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
    // Last 14 daily entries — two weeks of data for a wider chart.
    const last14    = analytics.daily.slice(-14);
    res.json({ success: true, data: last14 });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/**
 * GET /api/analytics/productivity-trend
 *
 * Groups study sessions by day, then for each day computes the average
 * self-reported productivity score and the most common mood. Returns
 * the most recent 30 days, oldest to newest, ready for a trend chart.
 *
 * Request body: none.
 * Response: { success: true, data: [{ date, avgProductivity, dominantMood }] }.
 */
// GET /api/analytics/productivity-trend
router.get('/productivity-trend', async (_req, res) => {
  try {
    const studySessions = await readData('studySessions');
    // Bucket all sessions into a map keyed by date, e.g. "2026-01-15".
    const grouped = {};
    for (const s of studySessions) {
      // Sessions may have full timestamps; keep only the date part before "T".
      const day = (s.date || '').split('T')[0];
      // Skip sessions with a missing/blank date.
      if (!day) continue;
      // First time we see this date, start an empty bucket for it.
      if (!grouped[day]) grouped[day] = { productivity: [], mood: [] };
      // Collect scores/moods so we can average / vote on them below.
      if (s.productivity) grouped[day].productivity.push(s.productivity);
      if (s.mood)         grouped[day].mood.push(s.mood);
    }
    // Turn each bucket into one trend point, then sort by date and keep the last 30 days.
    const trend = Object.entries(grouped).map(([date, v]) => ({
      date,
      // .toFixed(1) gives one decimal; null when no session recorded a score that day.
      avgProductivity: v.productivity.length
        ? (v.productivity.reduce((a, b) => a + b, 0) / v.productivity.length).toFixed(1)
        : null,
      dominantMood: mostFrequent(v.mood),
    })).sort((a, b) => a.date.localeCompare(b.date)).slice(-30);

    res.json({ success: true, data: trend });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Helpers ───────────────────────────────────────────────────

/**
 * Calculates how many days in a row (up to today) the user studied.
 * Daily entries are sorted newest-first; the streak continues only
 * while each next entry is at most one day older than the previous
 * one AND has study minutes greater than 0.
 * @param {Array<{date: string, studyMinutes: number}>} dailyLog
 * @returns {number} streak length in days
 */
function calculateStreak(dailyLog) {
  let streak = 0;
  // Copy the array (spread) so the original data is never reordered.
  const sorted = [...dailyLog].sort((a, b) => b.date.localeCompare(a.date));
  // Start from today; each qualifying entry must be today or the next older day.
  let prev = moment().startOf('day');
  for (const entry of sorted) {
    const d = moment(entry.date).startOf('day');
    // <= 1 allows "yesterday vs today" to count even if today has no entry yet.
    if (Math.abs(prev.diff(d, 'days')) <= 1 && entry.studyMinutes > 0) {
      streak++;
      prev = d;
    } else break;
  }
  return streak;
}

/**
 * Returns the value that appears most often in an array ("mode").
 * Counts occurrences with a frequency map, then picks the key with the
 * highest count. Returns null for an empty array.
 * @template T
 * @param {Array<T>} arr
 * @returns {T|null}
 */
function mostFrequent(arr) {
  if (!arr.length) return null;
  // Build { value: howManyTimesItAppeared } in one pass.
  const freq = arr.reduce((acc, v) => { acc[v] = (acc[v] || 0) + 1; return acc; }, {});
  // Compare counts and keep whichever value has the larger count.
  return Object.keys(freq).reduce((a, b) => freq[a] > freq[b] ? a : b);
}

module.exports = router;
