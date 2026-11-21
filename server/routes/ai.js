// ============================================================
// AI Router – on-demand AI analysis endpoints
// ============================================================
/**
 * File: server/routes/ai.js
 *
 * This file defines the AI-related API endpoints (routes) for the app.
 * It either reads previously saved AI results from the data store,
 * or runs new AI analysis on the stored data and returns the result.
 * There is also a small profile endpoint for reading/updating the user's profile.
 */
const express = require('express');
const router  = express.Router();
const { readData, updateData } = require('../utils/dataStore');
const {
  detectProcrastination,
  analyzeStudyVsDistraction,
  suggestTimeOptimization,
  analyzeSemesterProgress,
  runDailyAIAnalysis,
} = require('../services/aiEngine');

/**
 * GET /api/ai/insights — "latest cached insights"
 *
 * Does NOT run any analysis. It just reads the AI insights that were
 * previously computed (e.g. by the daily analysis) and saved under the
 * key "aiInsights", then returns them as JSON.
 *
 * Request body: none.
 * Response: { success: true, data: <saved insights object/array> }
 * On error: { success: false, message: <error text> } with HTTP 500.
 */
// GET /api/ai/insights  — latest cached insights
router.get('/insights', async (_req, res) => {
  try {
    // _req is unused here because this endpoint takes no input.
    const aiInsights = await readData('aiInsights');
    res.json({ success: true, data: aiInsights });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/**
 * POST /api/ai/analyze — "trigger fresh analysis now"
 *
 * Runs the full AI analysis pipeline right now (instead of waiting for
 * the scheduled daily run) and returns the freshly computed insights.
 *
 * Request body: none.
 * Response: { success: true, data: <new insights> }.
 */
// POST /api/ai/analyze  — trigger fresh analysis now
router.post('/analyze', async (_req, res) => {
  try {
    // Runs all AI checks (procrastination, focus, time use, semester) in one go.
    const insights = await runDailyAIAnalysis();
    res.json({ success: true, data: insights });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/**
 * GET /api/ai/procrastination
 *
 * Finds tasks the user keeps putting off. It loads both the task list
 * and the study sessions, then lets the AI engine figure out which
 * tasks look procrastinated and why.
 *
 * Request body: none.
 * Response: { success: true, data: <list of flagged tasks>, count: <list length> }.
 */
// GET /api/ai/procrastination
router.get('/procrastination', async (_req, res) => {
  try {
    // Promise.all loads both data sets at the same time (faster than one after the other).
    const [tasks, studySessions] = await Promise.all([
      readData('tasks'), readData('studySessions'),
    ]);
    const result = detectProcrastination(tasks, studySessions);
    res.json({ success: true, data: result, count: result.length });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/**
 * GET /api/ai/distraction-analysis
 *
 * Compares focused study time against distraction time (based on how
 * each session was tagged) and returns a summary of the balance.
 *
 * Request body: none.
 * Response: { success: true, data: <study vs distraction summary> }.
 */
// GET /api/ai/distraction-analysis
router.get('/distraction-analysis', async (_req, res) => {
  try {
    // Only study sessions are needed for this analysis.
    const studySessions = await readData('studySessions');
    const result        = analyzeStudyVsDistraction(studySessions);
    res.json({ success: true, data: result });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/**
 * GET /api/ai/time-optimization
 *
 * Suggests better ways to use study time. The AI engine looks at the
 * open tasks, how study time has actually been spent, and the user's
 * profile/preferences before making suggestions.
 *
 * Request body: none.
 * Response: { success: true, data: <list of suggestions> }.
 */
// GET /api/ai/time-optimization
router.get('/time-optimization', async (_req, res) => {
  try {
    // Load all three inputs in parallel because each suggestion depends on them.
    const [tasks, studySessions, userProfile] = await Promise.all([
      readData('tasks'), readData('studySessions'), readData('userProfile'),
    ]);
    const suggestions = suggestTimeOptimization(tasks, studySessions, userProfile);
    res.json({ success: true, data: suggestions });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/**
 * GET /api/ai/semester-progress
 *
 * Shows how far along the semester is (dates, workload, task
 * completion) so the user can see if they are ahead or behind.
 *
 * Request body: none.
 * Response: { success: true, data: <progress summary> }.
 */
// GET /api/ai/semester-progress
router.get('/semester-progress', async (_req, res) => {
  try {
    // The semester record gives the dates; tasks show how work is progressing.
    const [semester, tasks] = await Promise.all([
      readData('semester'), readData('tasks'),
    ]);
    const progress = analyzeSemesterProgress(semester, tasks);
    res.json({ success: true, data: progress });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/**
 * GET /api/ai/profile
 *
 * Returns the user's profile (name, preferences, goals, etc.) stored
 * under the key "userProfile". Some AI suggestions use this data.
 *
 * Request body: none.
 * Response: { success: true, data: <profile object> }.
 */
// GET /api/ai/profile
router.get('/profile', async (_req, res) => {
  try {
    const profile = await readData('userProfile');
    res.json({ success: true, data: profile });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/**
 * PUT /api/ai/profile
 *
 * Updates the user's profile. The request body contains the profile
 * fields to change; they are merged over the existing profile, so
 * fields not sent keep their old values.
 *
 * Request body: any subset of profile fields, e.g. { name: "Sam" }.
 * Response: { success: true, data: <full updated profile> }.
 */
// PUT /api/ai/profile
router.put('/profile', async (req, res) => {
  try {
    // Spreading req.body over the existing profile means sent fields win, others stay unchanged.
    const updated = await updateData('userProfile', profile => ({ ...profile, ...req.body }));
    res.json({ success: true, data: updated });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
