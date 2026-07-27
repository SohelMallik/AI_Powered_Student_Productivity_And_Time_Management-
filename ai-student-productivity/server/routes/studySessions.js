// ============================================================
// Study Sessions Router – track and log study blocks
// ============================================================
const express = require('express');
const router  = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readData, updateData } = require('../utils/dataStore');
const { analyzeStudyVsDistraction } = require('../services/aiEngine');

// GET /api/study-sessions
router.get('/', async (req, res) => {
  try {
    const sessions = await readData('studySessions');
    const limit    = parseInt(req.query.limit) || 50;
    res.json({ success: true, data: sessions.slice(-limit) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/study-sessions/today
router.get('/today', async (_req, res) => {
  try {
    const sessions = await readData('studySessions');
    const today    = new Date().toISOString().split('T')[0];
    const todaySessions = sessions.filter(s => s.date && s.date.startsWith(today));
    const totalMinutes  = todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    res.json({ success: true, data: todaySessions, totalMinutes });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/study-sessions/analysis
router.get('/analysis', async (_req, res) => {
  try {
    const sessions = await readData('studySessions');
    const analysis = analyzeStudyVsDistraction(sessions);
    res.json({ success: true, data: analysis });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/study-sessions  — log a study session
router.post('/', async (req, res) => {
  try {
    const { subject, taskId, duration, distractionMinutes, notes, mood, productivity } = req.body;
    if (!subject || !duration)
      return res.status(400).json({ success: false, message: 'subject and duration (minutes) required' });

    const session = {
      id                 : uuidv4(),
      subject,
      taskId             : taskId || null,
      duration           : parseInt(duration),
      distractionMinutes : parseInt(distractionMinutes) || 0,
      notes              : notes || '',
      mood               : mood || 'neutral',      // happy|neutral|tired|stressed
      productivity       : parseInt(productivity) || 5, // 1-10
      date               : new Date().toISOString(),
    };

    await updateData('studySessions', sessions => [...sessions, session]);

    // Update analytics daily log
    const today = new Date().toISOString().split('T')[0];
    await updateData('analytics', analytics => {
      const existing = analytics.daily.find(d => d.date === today);
      if (existing) {
        existing.studyMinutes      = (existing.studyMinutes      || 0) + session.duration;
        existing.distractionMinutes = (existing.distractionMinutes || 0) + session.distractionMinutes;
        existing.sessions          = (existing.sessions          || 0) + 1;
      } else {
        analytics.daily.push({
          date               : today,
          studyMinutes       : session.duration,
          distractionMinutes : session.distractionMinutes,
          sessions           : 1,
        });
      }
      return analytics;
    });

    res.status(201).json({ success: true, data: session });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// DELETE /api/study-sessions/:id
router.delete('/:id', async (req, res) => {
  try {
    let deleted = false;
    await updateData('studySessions', sessions => sessions.filter(s => {
      if (s.id === req.params.id) { deleted = true; return false; }
      return true;
    }));
    if (!deleted) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, message: 'Session deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
