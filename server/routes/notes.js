// ============================================================
// Notes Router – CRUD for study notes
// ============================================================
const express = require('express');
const router  = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readData, updateData } = require('../utils/dataStore');

// GET /api/notes
router.get('/', async (req, res) => {
  try {
    const notes = await readData('notes');
    const { course, search, pinned } = req.query;
    let filtered = notes;
    if (course)  filtered = filtered.filter(n => n.course === course);
    if (pinned === 'true') filtered = filtered.filter(n => n.pinned);
    if (search)  filtered = filtered.filter(n =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
    );
    filtered.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
    res.json({ success: true, data: filtered });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/notes/:id
router.get('/:id', async (req, res) => {
  try {
    const notes = await readData('notes');
    const note  = notes.find(n => n.id === req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    res.json({ success: true, data: note });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/notes
router.post('/', async (req, res) => {
  try {
    const { title, content, course, tags, color } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'title is required' });

    const note = {
      id       : uuidv4(),
      title,
      content  : content  || '',
      course   : course   || 'General',
      tags     : tags     || [],
      color    : color    || '#f0f9ff',
      pinned   : false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await updateData('notes', notes => [...notes, note]);
    res.status(201).json({ success: true, data: note });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PUT /api/notes/:id
router.put('/:id', async (req, res) => {
  try {
    let found = null;
    await updateData('notes', notes =>
      notes.map(n => {
        if (n.id !== req.params.id) return n;
        found = { ...n, ...req.body, id: n.id, updatedAt: new Date().toISOString() };
        return found;
      })
    );
    if (!found) return res.status(404).json({ success: false, message: 'Note not found' });
    res.json({ success: true, data: found });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PATCH /api/notes/:id/pin
router.patch('/:id/pin', async (req, res) => {
  try {
    let found = null;
    await updateData('notes', notes =>
      notes.map(n => {
        if (n.id !== req.params.id) return n;
        found = { ...n, pinned: !n.pinned, updatedAt: new Date().toISOString() };
        return found;
      })
    );
    if (!found) return res.status(404).json({ success: false, message: 'Note not found' });
    res.json({ success: true, data: found });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// DELETE /api/notes/:id
router.delete('/:id', async (req, res) => {
  try {
    let deleted = false;
    await updateData('notes', notes => notes.filter(n => {
      if (n.id === req.params.id) { deleted = true; return false; }
      return true;
    }));
    if (!deleted) return res.status(404).json({ success: false, message: 'Note not found' });
    res.json({ success: true, message: 'Note deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
