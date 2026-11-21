/**
 * Schedule routes (mounted at /api/schedule).
 *
 * This file manages the user's weekly timetable. Each "slot" is one entry in
 * the timetable, such as a study block, class, break, or exercise, tied to a
 * day of the week and a start/end time. Slots can be recurring (show up every
 * week) or one-off, and here they can be listed, added, edited, and deleted.
 */
// ============================================================
// Schedule Router – weekly timetable management
// ============================================================
const express = require('express');
const router  = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readData, updateData } = require('../utils/dataStore');

// GET /api/schedule
/**
 * GET /api/schedule
 * Returns the full weekly timetable (every saved slot, in no particular order).
 * Expects no parameters. Returns: { success, data: [slots] }.
 */
router.get('/', async (_req, res) => {
  try {
    const schedule = await readData('schedule');
    res.json({ success: true, data: schedule });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/schedule  — add a recurring or one-off slot
/**
 * POST /api/schedule
 * Adds a new slot to the timetable. Expects a JSON body:
 * { title, day, startTime, endTime (all required), subject?, type?, color?, recurring? }.
 * "day" is a weekday name (monday … sunday) and "type" defaults to "study".
 * "recurring" defaults to true (repeat every week) unless explicitly set to false.
 * Returns: 201 with { success, data: <the new slot> }, or 400 if required fields are missing.
 */
router.post('/', async (req, res) => {
  try {
    const { title, day, startTime, endTime, subject, type, color, recurring } = req.body;
    if (!title || !day || !startTime || !endTime)
      return res.status(400).json({ success: false, message: 'title, day, startTime, endTime required' });

    // "||" fills defaults for optional fields; "!== false" means recurring is
    // ON by default and only turns off when the client sends exactly false.
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
/**
 * PUT /api/schedule/:id
 * Updates an existing timetable slot. Expects a JSON body with any fields to
 * change (title, day, times, subject, type, color, recurring...).
 * Returns: { success, data: <the updated slot> }, or 404 if the id is unknown.
 */
router.put('/:id', async (req, res) => {
  try {
    // Captured from inside the map callback to know if a matching slot existed
    let found = null;
    await updateData('schedule', slots =>
      // Merge the request body over the matching slot; keep the original id
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
/**
 * DELETE /api/schedule/:id
 * Removes a single timetable slot by id. Takes no request body.
 * Returns: { success, message: 'Slot deleted' }, or 404 if the slot doesn't exist.
 */
router.delete('/:id', async (req, res) => {
  try {
    // Set inside the filter callback so we can tell if anything was removed
    let deleted = false;
    await updateData('schedule', slots => slots.filter(s => {
      // Keep every slot except the one matching the URL id
      if (s.id === req.params.id) { deleted = true; return false; }
      return true;
    }));
    if (!deleted) return res.status(404).json({ success: false, message: 'Slot not found' });
    res.json({ success: true, message: 'Slot deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
