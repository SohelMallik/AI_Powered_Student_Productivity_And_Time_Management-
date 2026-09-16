// ============================================================
// Flashcards Router – CRUD + quiz mode
// ============================================================
const express = require('express');
const router  = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readData, updateData } = require('../utils/dataStore');

// GET /api/flashcards
router.get('/', async (req, res) => {
  try {
    const decks = await readData('flashcards');
    const { course } = req.query;
    const filtered = course ? decks.filter(d => d.course === course) : decks;
    res.json({ success: true, data: filtered });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/flashcards/:deckId
router.get('/:deckId', async (req, res) => {
  try {
    const decks = await readData('flashcards');
    const deck  = decks.find(d => d.id === req.params.deckId);
    if (!deck) return res.status(404).json({ success: false, message: 'Deck not found' });
    res.json({ success: true, data: deck });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/flashcards (create deck)
router.post('/', async (req, res) => {
  try {
    const { name, course, description } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'name is required' });

    const deck = {
      id         : uuidv4(),
      name,
      course     : course      || 'General',
      description: description || '',
      cards      : [],
      createdAt  : new Date().toISOString(),
      updatedAt  : new Date().toISOString(),
    };

    await updateData('flashcards', decks => [...decks, deck]);
    res.status(201).json({ success: true, data: deck });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/flashcards/:deckId/cards (add card to deck)
router.post('/:deckId/cards', async (req, res) => {
  try {
    const { front, back, hint } = req.body;
    if (!front || !back) return res.status(400).json({ success: false, message: 'front and back are required' });

    const card = {
      id         : uuidv4(),
      front,
      back,
      hint       : hint || '',
      timesShown : 0,
      timesCorrect: 0,
      lastReviewed: null,
      difficulty  : 'new',   // new | easy | medium | hard
    };

    let updatedDeck = null;
    await updateData('flashcards', decks =>
      decks.map(d => {
        if (d.id !== req.params.deckId) return d;
        updatedDeck = { ...d, cards: [...d.cards, card], updatedAt: new Date().toISOString() };
        return updatedDeck;
      })
    );
    if (!updatedDeck) return res.status(404).json({ success: false, message: 'Deck not found' });
    res.status(201).json({ success: true, data: card, deck: updatedDeck });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PATCH /api/flashcards/:deckId/cards/:cardId/review (record review result)
router.patch('/:deckId/cards/:cardId/review', async (req, res) => {
  try {
    const { correct, difficulty } = req.body;
    let updatedCard = null;

    await updateData('flashcards', decks =>
      decks.map(d => {
        if (d.id !== req.params.deckId) return d;
        const cards = d.cards.map(c => {
          if (c.id !== req.params.cardId) return c;
          updatedCard = {
            ...c,
            timesShown   : c.timesShown + 1,
            timesCorrect : c.timesCorrect + (correct ? 1 : 0),
            lastReviewed : new Date().toISOString(),
            difficulty   : difficulty || c.difficulty,
          };
          return updatedCard;
        });
        return { ...d, cards, updatedAt: new Date().toISOString() };
      })
    );
    if (!updatedCard) return res.status(404).json({ success: false, message: 'Card not found' });
    res.json({ success: true, data: updatedCard });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// DELETE /api/flashcards/:deckId
router.delete('/:deckId', async (req, res) => {
  try {
    let deleted = false;
    await updateData('flashcards', decks => decks.filter(d => {
      if (d.id === req.params.deckId) { deleted = true; return false; }
      return true;
    }));
    if (!deleted) return res.status(404).json({ success: false, message: 'Deck not found' });
    res.json({ success: true, message: 'Deck deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// DELETE /api/flashcards/:deckId/cards/:cardId
router.delete('/:deckId/cards/:cardId', async (req, res) => {
  try {
    let deleted = false;
    await updateData('flashcards', decks =>
      decks.map(d => {
        if (d.id !== req.params.deckId) return d;
        const cards = d.cards.filter(c => {
          if (c.id === req.params.cardId) { deleted = true; return false; }
          return true;
        });
        return { ...d, cards, updatedAt: new Date().toISOString() };
      })
    );
    if (!deleted) return res.status(404).json({ success: false, message: 'Card not found' });
    res.json({ success: true, message: 'Card deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
