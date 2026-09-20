/* ============================================================
   Flashcards Page  – Deck Manager + Interactive Quiz Mode
   ============================================================ */

// ── State ─────────────────────────────────────────────────────
let _fcDecks      = [];
let _fcActiveDeck = null;   // { id, name, course, cards, ... }
let _fcView       = 'decks'; // 'decks' | 'deck' | 'quiz'
let _fcQuizCards  = [];
let _fcQuizIdx    = 0;
let _fcQuizScore  = { correct: 0, total: 0 };
let _fcRevealed   = false;

const DIFF_BADGE = {
  new   : 'background:#e0e7ff;color:#3730a3',
  easy  : 'background:#dcfce7;color:#15803d',
  medium: 'background:#fef9c3;color:#854d0e',
  hard  : 'background:#fee2e2;color:#b91c1c',
};

// ─────────────────────────────────────────────────────────────
// TOP-LEVEL RENDERER
// ─────────────────────────────────────────────────────────────
async function renderFlashcardsPage() {
  if (_fcView === 'quiz')  { buildQuizView(); return; }
  if (_fcView === 'deck' && _fcActiveDeck) { await refreshActiveDeck(); return; }

  const root = document.getElementById('flashcards-root');
  root.innerHTML = `
    <div style="text-align:center;padding:48px;animation:fadeIn .5s ease">
      <div class="spinner"></div>
      <p style="margin-top:14px;color:var(--color-muted);font-size:13px">Loading decks…</p>
    </div>`;
  try {
    const res = await FlashcardsAPI.getAll();
    _fcDecks  = res.data || [];
    buildDecksView();
  } catch (e) {
    root.innerHTML = errorState(e.message, 'renderFlashcardsPage()');
  }
}

// ─────────────────────────────────────────────────────────────
// DECKS LIST VIEW
// ─────────────────────────────────────────────────────────────
function buildDecksView() {
  _fcView = 'decks';
  const root = document.getElementById('flashcards-root');

  root.innerHTML = `
    <!-- Hero -->
    <div class="page-hero flashcards-hero">
      <div class="page-hero-orb orb1"></div>
      <div class="page-hero-orb orb2"></div>
      <div class="page-hero-content">
        <h1 class="page-hero-title">🃏 Flashcards</h1>
        <p class="page-hero-sub">${_fcDecks.length} decks · ${_fcDecks.reduce((s,d)=>s+d.cards.length,0)} cards total</p>
      </div>
      <button class="hero-action-btn" id="newDeckBtn">＋ New Deck</button>
    </div>

    <!-- Deck Grid -->
    <div id="deckGrid" class="grid-3"></div>
  `;

  document.getElementById('newDeckBtn').onclick = showNewDeckModal;
  renderDeckGrid();
}

function renderDeckGrid() {
  const grid = document.getElementById('deckGrid');
  if (!_fcDecks.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-state-icon">🃏</div>
      <h3>No decks yet</h3>
      <p>Create a flashcard deck to start studying!</p>
      <button class="btn btn-primary mt-4" onclick="showNewDeckModal()">＋ New Deck</button>
    </div>`;
    return;
  }

  grid.innerHTML = _fcDecks.map((deck, i) => {
    const mastered  = deck.cards.filter(c => c.difficulty === 'easy').length;
    const hard      = deck.cards.filter(c => c.difficulty === 'hard').length;
    const mastPct   = deck.cards.length > 0 ? Math.round((mastered / deck.cards.length) * 100) : 0;
    return `
      <div class="vivid-card fc-deck-card" data-deck-id="${deck.id}"
        style="cursor:pointer;animation:slideUp .4s ${i*.06}s ease both;border-top:3px solid ${subjectColor(deck.course||deck.name)}">
        <div style="font-size:36px;margin-bottom:12px">🃏</div>
        <div style="font-weight:800;font-size:16px;color:var(--color-text);margin-bottom:4px">${escapeHtml(deck.name)}</div>
        ${deck.course ? `<div style="font-size:12px;font-weight:700;color:${subjectColor(deck.course)};margin-bottom:8px">📚 ${escapeHtml(deck.course)}</div>` : ''}
        ${deck.description ? `<div style="font-size:12px;color:var(--color-muted);margin-bottom:10px">${escapeHtml(deck.description)}</div>` : ''}
        <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
          <span style="padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;background:#e0e7ff;color:#4338ca">${deck.cards.length} cards</span>
          ${mastered ? `<span style="padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;background:#dcfce7;color:#15803d">${mastered} mastered</span>` : ''}
          ${hard     ? `<span style="padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;background:#fee2e2;color:#b91c1c">${hard} hard</span>` : ''}
        </div>
        ${deck.cards.length > 0 ? `
          <div class="shimmer-progress-track" style="margin-bottom:10px">
            <div class="shimmer-progress-fill" style="width:${mastPct}%;background:linear-gradient(90deg,#6366f1,#10b981)"></div>
          </div>
          <div style="font-size:11px;color:var(--color-muted);margin-bottom:12px">${mastPct}% mastered</div>
        ` : ''}
        <div style="display:flex;gap:6px">
          ${deck.cards.length > 0 ? `<button class="btn btn-primary btn-sm fc-quiz-btn" data-deck-id="${deck.id}" style="flex:1">▶ Quiz</button>` : ''}
          <button class="btn btn-secondary btn-sm fc-open-btn" data-deck-id="${deck.id}" style="flex:1">Open</button>
          <button class="btn btn-danger btn-sm fc-delete-deck-btn" data-deck-id="${deck.id}">🗑</button>
        </div>
      </div>`;
  }).join('');

  // Event listeners
  qsa('.fc-open-btn, .fc-deck-card').forEach(el => {
    if (el.classList.contains('fc-quiz-btn') || el.classList.contains('fc-delete-deck-btn')) return;
    el.onclick = async (e) => {
      // Don't open deck when clicking buttons inside
      if (e.target.closest('.fc-quiz-btn') || e.target.closest('.fc-delete-deck-btn')) return;
      const deckId = el.dataset.deckId || el.closest('[data-deck-id]')?.dataset.deckId;
      if (!deckId) return;
      await openDeck(deckId);
    };
  });
  qsa('.fc-quiz-btn').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      await openDeck(btn.dataset.deckId);
      startQuiz();
    };
  });
  qsa('.fc-delete-deck-btn').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      if (!confirm('Delete this deck and all cards?')) return;
      try {
        await FlashcardsAPI.deleteDeck(btn.dataset.deckId);
        showToast('Deck deleted', 'info');
        const res = await FlashcardsAPI.getAll();
        _fcDecks = res.data || [];
        renderDeckGrid();
      } catch (err) { showToast(err.message, 'error'); }
    };
  });
}

// ─────────────────────────────────────────────────────────────
// SINGLE DECK VIEW
// ─────────────────────────────────────────────────────────────
async function openDeck(deckId) {
  try {
    const res     = await FlashcardsAPI.getDeck(deckId);
    _fcActiveDeck = res.data;
    _fcView       = 'deck';
    buildDeckView();
  } catch (err) { showToast(err.message, 'error'); }
}

async function refreshActiveDeck() {
  if (!_fcActiveDeck) { _fcView = 'decks'; await renderFlashcardsPage(); return; }
  try {
    const res     = await FlashcardsAPI.getDeck(_fcActiveDeck.id);
    _fcActiveDeck = res.data;
    buildDeckView();
  } catch (err) { showToast(err.message, 'error'); }
}

function buildDeckView() {
  const deck    = _fcActiveDeck;
  const root    = document.getElementById('flashcards-root');
  const mastered = deck.cards.filter(c => c.difficulty === 'easy').length;
  const hard     = deck.cards.filter(c => c.difficulty === 'hard').length;
  const mastPct  = deck.cards.length > 0 ? Math.round((mastered / deck.cards.length) * 100) : 0;

  root.innerHTML = `
    <!-- Back nav -->
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap">
      <button class="btn btn-secondary btn-sm" id="fcBackBtn">← All Decks</button>
      <h1 style="font-size:20px;font-weight:900;flex:1;color:var(--color-text)">🃏 ${escapeHtml(deck.name)}</h1>
      ${deck.cards.length > 0 ? `<button class="btn btn-primary" id="fcStartQuizBtn">▶ Start Quiz (${deck.cards.length})</button>` : ''}
      <button class="btn btn-secondary" id="fcAddCardBtn">＋ Add Card</button>
    </div>

    <!-- Stats bar -->
    <div style="display:flex;gap:14px;margin-bottom:20px;flex-wrap:wrap">
      ${[
        ['Total',   deck.cards.length, '#e0e7ff', '#4338ca'],
        ['Mastered',mastered,          '#dcfce7', '#15803d'],
        ['Hard',    hard,              '#fee2e2', '#b91c1c'],
        ['New',     deck.cards.filter(c=>c.difficulty==='new').length, '#f3f4f6','#374151'],
      ].map(([l,v,bg,c]) => `
        <div style="background:${bg};border-radius:12px;padding:12px 18px;text-align:center;min-width:80px">
          <div style="font-size:20px;font-weight:900;color:${c}">${v}</div>
          <div style="font-size:11px;font-weight:700;color:${c}">${l}</div>
        </div>`).join('')}
      <div style="flex:1;align-self:center">
        <div style="font-size:11px;font-weight:700;color:var(--color-muted);margin-bottom:4px">${mastPct}% mastered</div>
        <div class="shimmer-progress-track">
          <div class="shimmer-progress-fill" style="width:${mastPct}%;background:linear-gradient(90deg,#6366f1,#10b981)"></div>
        </div>
      </div>
    </div>

    <!-- Cards -->
    <div id="fcCardGrid" class="grid-2"></div>
  `;

  document.getElementById('fcBackBtn').onclick = () => {
    _fcView = 'decks';
    buildDecksView();
  };
  if (deck.cards.length > 0) {
    document.getElementById('fcStartQuizBtn').onclick = startQuiz;
  }
  document.getElementById('fcAddCardBtn').onclick = showAddCardModal;

  renderCardGrid();
}

function renderCardGrid() {
  const grid = document.getElementById('fcCardGrid');
  const deck = _fcActiveDeck;
  if (!deck.cards.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-state-icon">🃏</div><h3>No cards yet</h3>
      <p>Add your first flashcard to start studying!</p>
      <button class="btn btn-primary mt-4" onclick="showAddCardModal()">＋ Add Card</button>
    </div>`;
    return;
  }
  grid.innerHTML = deck.cards.map((card, i) => {
    const diff    = card.difficulty || 'new';
    const dStyle  = DIFF_BADGE[diff] || DIFF_BADGE.new;
    const acc     = card.timesShown > 0 ? Math.round((card.timesCorrect / card.timesShown) * 100) : null;
    return `
      <div class="vivid-card" style="animation:slideUp .35s ${i*.05}s ease both;position:relative">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="padding:2px 10px;border-radius:999px;font-size:11px;font-weight:800;${dStyle}">${diff.toUpperCase()}</span>
          ${acc !== null ? `<span style="font-size:11px;color:var(--color-muted)">${acc}% accuracy</span>` : '<span style="font-size:11px;color:var(--color-muted)">Not reviewed</span>'}
          <button class="vtc-btn vtc-btn-red fc-delete-card-btn" data-card-id="${card.id}" style="font-size:11px">🗑</button>
        </div>
        <div style="font-weight:700;font-size:14px;color:var(--color-text);margin-bottom:8px;border-bottom:1px solid var(--c-border);padding-bottom:8px">${escapeHtml(card.front)}</div>
        <div style="font-size:13px;color:var(--color-muted)">${escapeHtml(card.back)}</div>
        ${card.hint ? `<div style="font-size:11px;color:#6366f1;margin-top:6px">💡 ${escapeHtml(card.hint)}</div>` : ''}
      </div>`;
  }).join('');

  qsa('.fc-delete-card-btn').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      if (!confirm('Delete this card?')) return;
      try {
        await FlashcardsAPI.deleteCard(_fcActiveDeck.id, btn.dataset.cardId);
        showToast('Card deleted', 'info');
        await refreshActiveDeck();
      } catch (err) { showToast(err.message, 'error'); }
    };
  });
}

// ─────────────────────────────────────────────────────────────
// QUIZ VIEW
// ─────────────────────────────────────────────────────────────
function startQuiz() {
  if (!_fcActiveDeck || !_fcActiveDeck.cards.length) return;
  // Shuffle cards
  _fcQuizCards = [..._fcActiveDeck.cards].sort(() => Math.random() - 0.5);
  _fcQuizIdx   = 0;
  _fcQuizScore = { correct: 0, total: 0 };
  _fcRevealed  = false;
  _fcView      = 'quiz';
  buildQuizView();
}

function buildQuizView() {
  const root  = document.getElementById('flashcards-root');

  // ── Done screen ──
  if (_fcQuizIdx >= _fcQuizCards.length) {
    const pct = _fcQuizCards.length > 0 ? Math.round((_fcQuizScore.correct / _fcQuizCards.length) * 100) : 0;
    root.innerHTML = `
      <div style="max-width:480px;margin:0 auto;text-align:center;padding:40px 20px">
        <div style="font-size:64px;margin-bottom:16px">${pct>=80?'🏆':pct>=50?'👍':'📖'}</div>
        <h2 style="font-size:24px;font-weight:900;margin-bottom:8px">Quiz Complete!</h2>
        <div style="font-size:52px;font-weight:900;margin:16px 0;color:${pct>=80?'#15803d':pct>=50?'#854d0e':'#b91c1c'}">
          ${_fcQuizScore.correct}/${_fcQuizCards.length}
        </div>
        <p style="color:var(--color-muted);margin-bottom:28px">${pct}% correct — ${pct>=80?'Excellent work! 🌟':pct>=50?'Good effort — review the hard ones!':'Keep practicing — you\'ve got this!'}</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="startQuiz()">🔁 Retry Quiz</button>
          <button class="btn btn-secondary" onclick="_fcView='deck';buildDeckView()">← Back to Deck</button>
          <button class="btn btn-secondary" onclick="_fcView='decks';buildDecksView()">All Decks</button>
        </div>
      </div>`;
    return;
  }

  const card     = _fcQuizCards[_fcQuizIdx];
  const progress = Math.round((_fcQuizIdx / _fcQuizCards.length) * 100);
  const diff     = card.difficulty || 'new';
  const dStyle   = DIFF_BADGE[diff] || DIFF_BADGE.new;

  root.innerHTML = `
    <div style="max-width:540px;margin:0 auto;padding:16px 0">
      <!-- Top bar -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <button class="btn btn-secondary btn-sm" onclick="_fcView='deck';buildDeckView()">← Exit Quiz</button>
        <span style="font-size:13px;font-weight:700;color:var(--color-muted)">${_fcQuizIdx+1} / ${_fcQuizCards.length}</span>
        <span style="font-size:13px;font-weight:700;color:#15803d">✓ ${_fcQuizScore.correct}</span>
      </div>

      <!-- Progress bar -->
      <div class="shimmer-progress-track" style="margin-bottom:28px">
        <div class="shimmer-progress-fill" style="width:${progress}%;background:linear-gradient(90deg,#6366f1,#a855f7);transition:width .4s ease"></div>
      </div>

      <!-- Card -->
      <div class="vivid-card" style="text-align:center;min-height:220px;display:flex;flex-direction:column;justify-content:center;padding:32px 28px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
          <span style="padding:3px 10px;border-radius:999px;font-size:11px;font-weight:800;${dStyle}">${diff.toUpperCase()}</span>
          <span style="font-size:12px;color:var(--color-muted)">Score: ${_fcQuizScore.correct}/${_fcQuizScore.total}</span>
        </div>
        <div style="font-size:20px;font-weight:800;color:var(--color-text);line-height:1.5;margin-bottom:20px">${escapeHtml(card.front)}</div>
        ${card.hint && !_fcRevealed ? `<div style="font-size:12px;color:#6366f1;margin-bottom:14px">💡 ${escapeHtml(card.hint)}</div>` : ''}
        ${_fcRevealed ? `
          <div style="border-top:1px dashed var(--c-border);padding-top:18px;margin-bottom:22px">
            <div style="font-size:11px;font-weight:700;color:var(--color-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Answer</div>
            <div style="font-size:17px;font-weight:700;color:var(--color-text);line-height:1.6">${escapeHtml(card.back)}</div>
          </div>
          <div style="display:flex;gap:14px;justify-content:center">
            <button class="btn btn-danger" id="fcWrongBtn" style="flex:1;font-size:15px;font-weight:800;padding:12px">✗ Wrong</button>
            <button class="btn" id="fcCorrectBtn" style="flex:1;background:#22c55e;color:#fff;font-size:15px;font-weight:800;padding:12px;border:none;border-radius:var(--r-md);cursor:pointer">✓ Correct</button>
          </div>` : `
          <button class="btn btn-primary" id="fcRevealBtn" style="padding:12px 32px;font-size:15px">Reveal Answer</button>`}
      </div>
    </div>`;

  if (!_fcRevealed) {
    document.getElementById('fcRevealBtn').onclick = () => {
      _fcRevealed = true;
      buildQuizView();
    };
  } else {
    document.getElementById('fcWrongBtn').onclick   = () => handleQuizAnswer(false);
    document.getElementById('fcCorrectBtn').onclick = () => handleQuizAnswer(true);
  }
}

async function handleQuizAnswer(correct) {
  const card       = _fcQuizCards[_fcQuizIdx];
  const difficulty = correct ? (card.difficulty === 'hard' ? 'medium' : 'easy') : 'hard';
  try {
    await FlashcardsAPI.reviewCard(_fcActiveDeck.id, card.id, { correct, difficulty });
  } catch { /* non-blocking */ }
  _fcQuizScore.total++;
  if (correct) _fcQuizScore.correct++;
  _fcQuizIdx++;
  _fcRevealed = false;
  buildQuizView();
}

// ─────────────────────────────────────────────────────────────
// MODALS
// ─────────────────────────────────────────────────────────────
function showNewDeckModal() {
  openModal('🃏 New Flashcard Deck', `
    <form id="newDeckForm">
      <div class="form-group">
        <label class="form-label">Deck Name *</label>
        <input class="form-control" id="deckName" placeholder="e.g. Biology Chapter 3" required />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Course</label>
          <input class="form-control" id="deckCourse" placeholder="e.g. Biology" />
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <input class="form-control" id="deckDesc" placeholder="Short description…" />
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <button type="submit" class="btn btn-primary">Create Deck</button>
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      </div>
    </form>
  `);

  document.getElementById('newDeckForm').onsubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await FlashcardsAPI.createDeck({
        name       : document.getElementById('deckName').value.trim(),
        course     : document.getElementById('deckCourse').value.trim(),
        description: document.getElementById('deckDesc').value.trim(),
      });
      closeModal();
      showToast('Deck created! 🃏', 'success');
      await openDeck(res.data.id);
    } catch (err) { showToast(err.message, 'error'); }
  };
}

function showAddCardModal() {
  openModal('➕ Add Flashcard', `
    <form id="addCardForm">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Front (Question) *</label>
          <textarea class="form-control" id="cardFront" rows="4" placeholder="Question or term…" required></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Back (Answer) *</label>
          <textarea class="form-control" id="cardBack" rows="4" placeholder="Answer or definition…" required></textarea>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Hint <span style="color:var(--color-muted)">(optional)</span></label>
        <input class="form-control" id="cardHint" placeholder="A helpful clue…" />
      </div>
      <div style="display:flex;gap:8px">
        <button type="submit" class="btn btn-primary">Add Card</button>
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      </div>
    </form>
  `);

  document.getElementById('addCardForm').onsubmit = async (e) => {
    e.preventDefault();
    try {
      await FlashcardsAPI.addCard(_fcActiveDeck.id, {
        front: document.getElementById('cardFront').value.trim(),
        back : document.getElementById('cardBack').value.trim(),
        hint : document.getElementById('cardHint').value.trim(),
      });
      closeModal();
      showToast('Card added!', 'success');
      await refreshActiveDeck();
    } catch (err) { showToast(err.message, 'error'); }
  };
}
