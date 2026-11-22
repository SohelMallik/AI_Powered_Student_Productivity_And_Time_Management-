// ============================================================
// Flashcards Router – CRUD + quiz mode
// ============================================================
/**
 * File: server/routes/flashcards.js
 *
 * This file manages flashcard decks and the cards inside them: listing,
 * creating, and deleting decks, adding/removing cards, and recording
 * review results so the app can track how well each card is known.
 */
const express = require('express');
const router  = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readData, updateData } = require('../utils/dataStore');

/**
 * GET /api/flashcards — list all decks.
 *
 * Optional query string ?course=<name> narrows the list to decks of
 * that course; otherwise every deck is returned.
 *
 * Response: { success: true, data: [deck, ...] }.
 */
// GET /api/flashcards
router.get('/', async (req, res) => {
  try {
    const decks = await readData('flashcards');
    // req.query.course is undefined when no filter was given.
    const { course } = req.query;
    // Only filter when a course was actually requested.
    const filtered = course ? decks.filter(d => d.course === course) : decks;
    res.json({ success: true, data: filtered });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/**
 * GET /api/flashcards/:deckId — fetch a single deck.
 *
 * :deckId is taken from the URL path. Returns the whole deck object
 * (including its cards) or 404 if no deck has that id.
 *
 * Response: { success: true, data: <deck> }.
 */
// GET /api/flashcards/:deckId
router.get('/:deckId', async (req, res) => {
  try {
    const decks = await readData('flashcards');
    // req.params.deckId comes from the ":deckId" part of the route.
    const deck  = decks.find(d => d.id === req.params.deckId);
    // "return" stops here so the success response below never also runs.
    if (!deck) return res.status(404).json({ success: false, message: 'Deck not found' });
    res.json({ success: true, data: deck });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/**
 * POST /api/flashcards — create a new deck.
 *
 * Expects a JSON body with "name" (required), plus optional "course"
 * and "description". The deck starts with an empty cards array and
 * gets a fresh id plus creation/update timestamps.
 *
 * Response: 201 { success: true, data: <new deck> }.
 */
// POST /api/flashcards (create deck)
router.post('/', async (req, res) => {
  try {
    const { name, course, description } = req.body;
    // A deck must at least have a name.
    if (!name) return res.status(400).json({ success: false, message: 'name is required' });

    const deck = {
      id         : uuidv4(),
      name,
      // Default values so every deck has a predictable shape.
      course     : course      || 'General',
      description: description || '',
      cards      : [],
      createdAt  : new Date().toISOString(),
      updatedAt  : new Date().toISOString(),
    };

    // Append the new deck to the stored list.
    await updateData('flashcards', decks => [...decks, deck]);
    res.status(201).json({ success: true, data: deck });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/**
 * POST /api/flashcards/:deckId/cards — add a card to a deck.
 *
 * Expects a JSON body with "front" and "back" (both required) and an
 * optional "hint". The new card starts with review stats (times shown/
 * correct) at zero and difficulty "new". Returns 404 if the deck id
 * doesn't exist.
 *
 * Response: 201 { success: true, data: <new card>, deck: <updated deck> }.
 */
// POST /api/flashcards/:deckId/cards (add card to deck)
router.post('/:deckId/cards', async (req, res) => {
  try {
    const { front, back, hint } = req.body;
    // A card is useless without a question (front) or answer (back).
    if (!front || !back) return res.status(400).json({ success: false, message: 'front and back are required' });

    const card = {
      id         : uuidv4(),
      front,
      back,
      hint       : hint || '',
      // Review stats start empty and grow as the user quizzes.
      timesShown : 0,
      timesCorrect: 0,
      lastReviewed: null,
      difficulty  : 'new',   // new | easy | medium | hard
    };

    // Set inside the update callback so we know afterwards if the deck existed.
    let updatedDeck = null;
    // Rewrite the deck list, replacing only the matching deck with a copy
    // that has the new card appended.
    await updateData('flashcards', decks =>
      decks.map(d => {
        // Leave every other deck untouched.
        if (d.id !== req.params.deckId) return d;
        updatedDeck = { ...d, cards: [...d.cards, card], updatedAt: new Date().toISOString() };
        return updatedDeck;
      })
    );
    // If the callback never ran for our deck id, the deck doesn't exist.
    if (!updatedDeck) return res.status(404).json({ success: false, message: 'Deck not found' });
    res.status(201).json({ success: true, data: card, deck: updatedDeck });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/**
 * PATCH /api/flashcards/:deckId/cards/:cardId/review — record a review result.
 *
 * Called after the user quizzes a card. Body may contain "correct"
 * (boolean) and "difficulty" (new/easy/medium/hard). The card's times
 * shown/correct counters go up, lastReviewed is set to now, and the
 * difficulty is updated if one was sent. Returns 404 if the card (or
 * its deck) doesn't exist.
 *
 * Response: { success: true, data: <updated card> }.
 */
// PATCH /api/flashcards/:deckId/cards/:cardId/review (record review result)
router.patch('/:deckId/cards/:cardId/review', async (req, res) => {
  try {
    const { correct, difficulty } = req.body;
    let updatedCard = null;

    // Rebuild the deck list (and the matching deck's cards) with the
    // reviewed card replaced by an updated copy.
    await updateData('flashcards', decks =>
      decks.map(d => {
        if (d.id !== req.params.deckId) return d;
        // Touch the deck's updatedAt even if only a card changed.
        const cards = d.cards.map(c => {
          if (c.id !== req.params.cardId) return c;
          updatedCard = {
            ...c,
            // Always count the attempt; only count a correct answer when told so.
            timesShown   : c.timesShown + 1,
            timesCorrect : c.timesCorrect + (correct ? 1 : 0),
            lastReviewed : new Date().toISOString(),
            // Keep the old difficulty when the request doesn't set a new one.
            difficulty   : difficulty || c.difficulty,
          };
          return updatedCard;
        });
        return { ...d, cards, updatedAt: new Date().toISOString() };
      })
    );
    // If the inner map never matched, the card (or deck) wasn't found.
    if (!updatedCard) return res.status(404).json({ success: false, message: 'Card not found' });
    res.json({ success: true, data: updatedCard });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/**
 * DELETE /api/flashcards/:deckId — delete an entire deck.
 *
 * Removes the deck with the given id (and all of its cards) from the
 * stored list. Returns 404 if no deck has that id.
 *
 * Response: { success: true, message: "Deck deleted" }.
 */
// DELETE /api/flashcards/:deckId
router.delete('/:deckId', async (req, res) => {
  try {
    // Flag flips to true inside the filter when we actually drop a deck.
    let deleted = false;
    // Keeping decks where the predicate returns true = removing the matching one.
    await updateData('flashcards', decks => decks.filter(d => {
      if (d.id === req.params.deckId) { deleted = true; return false; }
      return true;
    }));
    if (!deleted) return res.status(404).json({ success: false, message: 'Deck not found' });
    res.json({ success: true, message: 'Deck deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

/**
 * DELETE /api/flashcards/:deckId/cards/:cardId — delete a single card.
 *
 * Removes one card from the given deck (the deck itself stays).
 * Returns 404 if the card (or its deck) doesn't exist.
 *
 * Response: { success: true, message: "Card deleted" }.
 */
// DELETE /api/flashcards/:deckId/cards/:cardId
router.delete('/:deckId/cards/:cardId', async (req, res) => {
  try {
    // Flag flips to true inside the filter when we actually drop a card.
    let deleted = false;
    await updateData('flashcards', decks =>
      decks.map(d => {
        if (d.id !== req.params.deckId) return d;
        // Rebuild this deck's card list without the matching card.
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
