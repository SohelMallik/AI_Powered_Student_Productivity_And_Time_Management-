/**
 * Semester routes (mounted at /api/semester).
 *
 * This file manages everything semester-related: the list of courses being
 * taken, academic events (exams, holidays, submissions), and personal goals
 * with target values. All of it lives in one "semester" object in the data
 * store, which is partially rewritten (courses / events / goals) on each change.
 * The main GET endpoint also computes AI-driven progress statistics.
 */
// ============================================================
// Semester Router – courses, academic events, goals
// ============================================================
const express = require('express');
const router  = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readData, updateData } = require('../utils/dataStore');
const { analyzeSemesterProgress } = require('../services/aiEngine');

// GET /api/semester
/**
 * GET /api/semester
 * Returns the whole semester object (courses, events, goals) plus computed
 * progress stats. Expects no parameters.
 * Returns: { success, data: { ...semester, progress } } where "progress" comes
 * from the AI engine's analyzeSemesterProgress(semester, tasks).
 */
router.get('/', async (_req, res) => {
  try {
    const semester = await readData('semester');
    const tasks    = await readData('tasks');
    // Progress is calculated on the fly from the current semester + task data
    const progress = analyzeSemesterProgress(semester, tasks);
    res.json({ success: true, data: { ...semester, progress } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/semester/courses
/**
 * POST /api/semester/courses
 * Adds a new course to the semester. Expects a JSON body:
 * { name (required), code?, instructor?, credits?, color? }.
 * Defaults: 3 credits and a blue color if not provided.
 * Returns: 201 with { success, data: <the new course> }, or 400 if name is missing.
 */
router.post('/courses', async (req, res) => {
  try {
    const { name, code, instructor, credits, color } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'name is required' });

    // "||" supplies defaults for any optional field the client left out
    const course = {
      id        : uuidv4(),
      name,
      code      : code      || '',
      instructor: instructor || '',
      credits   : credits   || 3,
      color     : color     || '#3b82d4',
      createdAt : new Date().toISOString(),
    };

    // Append to the courses array inside the semester object (it may not
    // exist yet, hence the "sem.courses || []" fallback)
    await updateData('semester', sem => ({ ...sem, courses: [...(sem.courses || []), course] }));
    res.status(201).json({ success: true, data: course });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// DELETE /api/semester/courses/:id
/**
 * DELETE /api/semester/courses/:id
 * Removes a course from the semester by id. Takes no request body.
 * Returns: { success, message: 'Course deleted' } — note this succeeds even if
 * no course with that id existed (the list is just filtered again).
 */
router.delete('/courses/:id', async (req, res) => {
  try {
    // Rebuild the semester object with the matching course filtered out
    await updateData('semester', sem => ({
      ...sem,
      courses: (sem.courses || []).filter(c => c.id !== req.params.id),
    }));
    res.json({ success: true, message: 'Course deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/semester/events
/**
 * POST /api/semester/events
 * Adds an academic event (exam, holiday, submission, etc.). Expects a JSON
 * body: { title, date (both required), type?, course?, description? }.
 * "type" defaults to "other". Returns: 201 with { success, data: <the event> },
 * or 400 if title or date is missing.
 */
router.post('/events', async (req, res) => {
  try {
    const { title, date, type, course, description } = req.body;
    if (!title || !date) return res.status(400).json({ success: false, message: 'title and date required' });

    // "||" fills defaults; course is optional (empty string for general events)
    const event = {
      id         : uuidv4(),
      title,
      date,
      type       : type || 'other',   // exam|holiday|submission|other
      course     : course || '',
      description: description || '',
      createdAt  : new Date().toISOString(),
    };

    // Append to the events array inside the semester object
    await updateData('semester', sem => ({ ...sem, events: [...(sem.events || []), event] }));
    res.status(201).json({ success: true, data: event });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/semester/goals
/**
 * POST /api/semester/goals
 * Adds a new goal with an optional target date and a metric to measure
 * (e.g. "completion"). Expects a JSON body:
 * { title (required), targetDate?, metric?, targetValue? }.
 * New goals start at currentValue 0 with achieved = false.
 * Returns: 201 with { success, data: <the new goal> }, or 400 if title is missing.
 */
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
      currentValue: 0,   // progress towards the target, updated later via PATCH
      achieved   : false,
      createdAt  : new Date().toISOString(),
    };

    // Append to the goals array inside the semester object
    await updateData('semester', sem => ({ ...sem, goals: [...(sem.goals || []), goal] }));
    res.status(201).json({ success: true, data: goal });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PATCH /api/semester/goals/:id
/**
 * PATCH /api/semester/goals/:id
 * Updates a goal, e.g. to bump currentValue or mark achieved = true.
 * Expects a JSON body with any fields to change.
 * Returns: { success, data: <the updated goal> }, or 404 if the id is unknown.
 */
router.patch('/goals/:id', async (req, res) => {
  try {
    // Captured from inside the map callback to know if a matching goal existed
    let found = null;
    await updateData('semester', sem => ({
      ...sem,
      // Merge the request body over the matching goal; keep the original id
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
