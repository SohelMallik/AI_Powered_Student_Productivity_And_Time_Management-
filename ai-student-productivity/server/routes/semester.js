// ============================================================
// Semester Router – courses, academic events, goals
// ============================================================
const express = require('express');
const router  = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readData, updateData } = require('../utils/dataStore');
const { analyzeSemesterProgress } = require('../services/aiEngine');

// GET /api/semester
router.get('/', async (_req, res) => {
  try {
    const semester = await readData('semester');
    const tasks    = await readData('tasks');
    const progress = analyzeSemesterProgress(semester, tasks);
    res.json({ success: true, data: { ...semester, progress } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/semester/courses
router.post('/courses', async (req, res) => {
  try {
    const { name, code, instructor, credits, color } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'name is required' });

    const course = {
      id        : uuidv4(),
      name,
      code      : code      || '',
      instructor: instructor || '',
      credits   : credits   || 3,
      color     : color     || '#3b82d4',
      createdAt : new Date().toISOString(),
    };

    await updateData('semester', sem => ({ ...sem, courses: [...(sem.courses || []), course] }));
    res.status(201).json({ success: true, data: course });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// DELETE /api/semester/courses/:id
router.delete('/courses/:id', async (req, res) => {
  try {
    await updateData('semester', sem => ({
      ...sem,
      courses: (sem.courses || []).filter(c => c.id !== req.params.id),
    }));
    res.json({ success: true, message: 'Course deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/semester/events
router.post('/events', async (req, res) => {
  try {
    const { title, date, type, course, description } = req.body;
    if (!title || !date) return res.status(400).json({ success: false, message: 'title and date required' });

    const event = {
      id         : uuidv4(),
      title,
      date,
      type       : type || 'other',   // exam|holiday|submission|other
      course     : course || '',
      description: description || '',
      createdAt  : new Date().toISOString(),
    };

    await updateData('semester', sem => ({ ...sem, events: [...(sem.events || []), event] }));
    res.status(201).json({ success: true, data: event });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/semester/goals
router.post('/goals', async (req, res) => {
  try {
    const { title, targetDate, metric, targetValue } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'title required' });

    const goal = {
      id         : uuidv4(),
      title,
      targetDate : targetDate || null,
      metric     : metric     || 'completion',
      targetValue: targetValue || 100,
      currentValue: 0,
      achieved   : false,
      createdAt  : new Date().toISOString(),
    };

    await updateData('semester', sem => ({ ...sem, goals: [...(sem.goals || []), goal] }));
    res.status(201).json({ success: true, data: goal });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PATCH /api/semester/goals/:id
router.patch('/goals/:id', async (req, res) => {
  try {
    let found = null;
    await updateData('semester', sem => ({
      ...sem,
      goals: (sem.goals || []).map(g => {
        if (g.id !== req.params.id) return g;
        found = { ...g, ...req.body, id: g.id };
        return found;
      }),
    }));
    if (!found) return res.status(404).json({ success: false, message: 'Goal not found' });
    res.json({ success: true, data: found });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
