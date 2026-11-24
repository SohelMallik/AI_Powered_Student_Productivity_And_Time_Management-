/**
 * Notes routes (mounted at /api/notes).
 *
 * This file handles the full CRUD (Create, Read, Update, Delete) of the user's
 * study notes, which are stored in one "notes" array via the dataStore helper.
 * It supports filtering by course, pinning notes, and searching by keyword,
 * and always returns a list ordered with pinned notes first, newest first.
 */
// ============================================================
// Notes Router – CRUD for study notes
// ============================================================
const express = require('express');
const router  = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readData, updateData } = require('../utils/dataStore');

// GET /api/notes
/**
 * GET /api/notes
 * Lists all notes, with optional filters sent as query parameters.
 * Expects (all optional): ?course=<name>, ?search=<text>, ?pinned=true.
 * Returns: { success, data: [notes] } — pinned notes first, then most recently updated.
 */
router.get('/', async (req, res) => {
  try {
    const notes = await readData('notes');
    // Optional filters read from the URL query string, e.g. /api/notes?course=Math
    const { course, search, pinned } = req.query;
    let filtered = notes;
    // Apply each filter only if the client actually asked for it
    if (course)  filtered = filtered.filter(n => n.course === course);
    if (pinned === 'true') filtered = filtered.filter(n => n.pinned);
    // Case-insensitive keyword match on either the title or the note body
    if (search)  filtered = filtered.filter(n =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
    );
    // Pinned notes always come before unpinned ones (the -1 pushes them up),
    // and within each group the newest "updatedAt" date is sorted first.
    filtered.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
    res.json({ success: true, data: filtered });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/notes/:id
/**
 * GET /api/notes/:id
 * Fetches a single note by its id (taken from the URL, e.g. /api/notes/abc-123).
 * Returns: { success, data: <note> }, or 404 if no note has that id.
 */
router.get('/:id', async (req, res) => {
  try {
    const notes = await readData('notes');
    // Find the first note whose id matches the :id part of the URL
    const note  = notes.find(n => n.id === req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    res.json({ success: true, data: note });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/notes
/**
 * POST /api/notes
 * Creates a new note. Expects a JSON body: { title (required), content?, course?,
 * tags?, color? }. Missing fields get sensible defaults (e.g. course "General").
 * Returns: 201 with { success, data: <the new note> }, or 400 if title is missing.
 */
router.post('/', async (req, res) => {
  try {
    const { title, content, course, tags, color } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'title is required' });

    // Build the note object; "||" fills in defaults for any optional field the
    // client left out, and the id is a freshly generated UUID.
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

    // Spread the existing notes array plus the new one, then save
    await updateData('notes', notes => [...notes, note]);
    res.status(201).json({ success: true, data: note });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PUT /api/notes/:id
/**
 * PUT /api/notes/:id
 * Updates an existing note. Expects a JSON body with any fields to change
 * (e.g. { title, content, course, tags, color, pinned }).
 * Returns: { success, data: <the updated note> }, or 404 if the id is unknown.
 */
router.put('/:id', async (req, res) => {
  try {
    // "found" is captured from inside the map callback so we can tell later
    // whether a note with that id actually existed.
    let found = null;
    await updateData('notes', notes =>
      // Rebuild the array; for the matching note, merge the request body over
      // it (spread operator). The id is re-set so the client can't change it.
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
/**
 * PATCH /api/notes/:id/pin
 * Toggles a note's pinned status: pinned notes become unpinned and vice versa.
 * Takes no request body. Returns the updated note, or 404 if not found.
 */
router.patch('/:id/pin', async (req, res) => {
  try {
    let found = null;
    await updateData('notes', notes =>
      // "!n.pinned" flips true -> false and false -> true
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
/**
 * DELETE /api/notes/:id
 * Deletes a single note by id. Takes no request body.
 * Returns: { success, message: 'Note deleted' }, or 404 if the note doesn't exist.
 */
router.delete('/:id', async (req, res) => {
  try {
    // "deleted" is set inside the filter callback so we know if anything was removed
    let deleted = false;
    await updateData('notes', notes => notes.filter(n => {
      // Keep every note except the one matching the URL id
      if (n.id === req.params.id) { deleted = true; return false; }
      return true;
    }));
    if (!deleted) return res.status(404).json({ success: false, message: 'Note not found' });
    res.json({ success: true, message: 'Note deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
