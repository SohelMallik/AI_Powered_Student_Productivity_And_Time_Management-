// ============================================================
// AI Router – on-demand AI analysis endpoints
// ============================================================
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

// GET /api/ai/insights  — latest cached insights
router.get('/insights', async (_req, res) => {
  try {
    const aiInsights = await readData('aiInsights');
    res.json({ success: true, data: aiInsights });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/ai/analyze  — trigger fresh analysis now
router.post('/analyze', async (_req, res) => {
  try {
    const insights = await runDailyAIAnalysis();
    res.json({ success: true, data: insights });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/ai/procrastination
router.get('/procrastination', async (_req, res) => {
  try {
    const [tasks, studySessions] = await Promise.all([
      readData('tasks'), readData('studySessions'),
    ]);
    const result = detectProcrastination(tasks, studySessions);
    res.json({ success: true, data: result, count: result.length });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/ai/distraction-analysis
router.get('/distraction-analysis', async (_req, res) => {
  try {
    const studySessions = await readData('studySessions');
    const result        = analyzeStudyVsDistraction(studySessions);
    res.json({ success: true, data: result });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/ai/time-optimization
router.get('/time-optimization', async (_req, res) => {
  try {
    const [tasks, studySessions, userProfile] = await Promise.all([
      readData('tasks'), readData('studySessions'), readData('userProfile'),
    ]);
    const suggestions = suggestTimeOptimization(tasks, studySessions, userProfile);
    res.json({ success: true, data: suggestions });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/ai/semester-progress
router.get('/semester-progress', async (_req, res) => {
  try {
    const [semester, tasks] = await Promise.all([
      readData('semester'), readData('tasks'),
    ]);
    const progress = analyzeSemesterProgress(semester, tasks);
    res.json({ success: true, data: progress });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/ai/profile
router.get('/profile', async (_req, res) => {
  try {
    const profile = await readData('userProfile');
    res.json({ success: true, data: profile });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PUT /api/ai/profile
router.put('/profile', async (req, res) => {
  try {
    const updated = await updateData('userProfile', profile => ({ ...profile, ...req.body }));
    res.json({ success: true, data: updated });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
