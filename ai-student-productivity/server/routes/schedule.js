// ============================================================
// Schedule Router – weekly timetable management
// ============================================================
const express = require('express');
const router  = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readData, updateData } = require('../utils/dataStore');

// GET /api/schedule
router.get('/', async (_req, res) => {
  try {
    const schedule = await readData('schedule');
    res.json({ success: true, data: schedule });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/schedule  — add a recurring or one-off slot
router.post('/', async (req, res) => {
  try {
    const { title, day, startTime, endTime, subject, type, color, recurring } = req.body;
    if (!title || !day || !startTime || !endTime)
      return res.status(400).json({ success: false, message: 'title, day, startTime, endTime required' });

    const slot = {
      id       : uuidv4(),
      title,
      day      : day.toLowerCase(),           // monday … sunday
      startTime,
      endTime,
      subject  : subject || 'General',
      type     : type    || 'study',           // study|class|break|exercise
      color    : color   || '#3b82d4',
      recurring: recurring !== false,
      createdAt: new Date().toISOString(),
    };

    await updateData('schedule', slots => [...slots, slot]);
    res.status(201).json({ success: true, data: slot });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PUT /api/schedule/:id
router.put('/:id', async (req, res) => {
  try {
    let found = null;
    await updateData('schedule', slots =>
      slots.map(s => {
        if (s.id !== req.params.id) return s;
        found = { ...s, ...req.body, id: s.id };
        return found;
      })
    );
    if (!found) return res.status(404).json({ success: false, message: 'Slot not found' });
    res.json({ success: true, data: found });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// DELETE /api/schedule/:id
router.delete('/:id', async (req, res) => {
  try {
    let deleted = false;
    await updateData('schedule', slots => slots.filter(s => {
      if (s.id === req.params.id) { deleted = true; return false; }
      return true;
    }));
    if (!deleted) return res.status(404).json({ success: false, message: 'Slot not found' });
    res.json({ success: true, message: 'Slot deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
