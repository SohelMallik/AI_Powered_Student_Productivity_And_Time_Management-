// ============================================================
// Tasks Router – CRUD + AI priority
// ============================================================
const express = require('express');
const router  = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readData, updateData } = require('../utils/dataStore');
const { calculatePriority, detectOverdueTasks } = require('../services/aiEngine');

// GET /api/tasks
router.get('/', async (_req, res) => {
  try {
    const tasks = await readData('tasks');
    const enriched = tasks.map(t => ({ ...t, priority: calculatePriority(t) }))
      .sort((a, b) => b.priority - a.priority);
    res.json({ success: true, data: enriched, overdue: detectOverdueTasks(tasks).length });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/tasks/:id
router.get('/:id', async (req, res) => {
  try {
    const tasks = await readData('tasks');
    const task  = tasks.find(t => t.id === req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: { ...task, priority: calculatePriority(task) } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/tasks
router.post('/', async (req, res) => {
  try {
    const { title, description, deadline, course, type, estimatedHours, weight, tags } = req.body;
    if (!title || !deadline) return res.status(400).json({ success: false, message: 'title and deadline are required' });

    const task = {
      id            : uuidv4(),
      title,
      description   : description || '',
      deadline,
      course        : course || 'General',
      type          : type || 'assignment',   // assignment|exam|project|reading
      estimatedHours: estimatedHours || 2,
      weight        : weight || 5,
      tags          : tags || [],
      completed     : false,
      completedAt   : null,
      createdAt     : new Date().toISOString(),
      updatedAt     : new Date().toISOString(),
    };

    await updateData('tasks', tasks => [...tasks, task]);
    res.status(201).json({ success: true, data: { ...task, priority: calculatePriority(task) } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PUT /api/tasks/:id
router.put('/:id', async (req, res) => {
  try {
    let found = null;
    await updateData('tasks', tasks =>
      tasks.map(t => {
        if (t.id !== req.params.id) return t;
        found = { ...t, ...req.body, id: t.id, updatedAt: new Date().toISOString() };
        return found;
      })
    );
    if (!found) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: { ...found, priority: calculatePriority(found) } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PATCH /api/tasks/:id/complete
router.patch('/:id/complete', async (req, res) => {
  try {
    let found = null;
    await updateData('tasks', tasks =>
      tasks.map(t => {
        if (t.id !== req.params.id) return t;
        found = { ...t, completed: true, completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        return found;
      })
    );
    if (!found) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: found });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  try {
    let deleted = false;
    await updateData('tasks', tasks => tasks.filter(t => {
      if (t.id === req.params.id) { deleted = true; return false; }
      return true;
    }));
    if (!deleted) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, message: 'Task deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
