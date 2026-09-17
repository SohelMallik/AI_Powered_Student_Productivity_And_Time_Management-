// ============================================================
// Flashcards Page – deck management + quiz mode
// ============================================================
import React, { useEffect, useState } from 'react';
import { flashcardsApi } from '@/services/api';
import type { FlashDeck, FlashCard } from '@/types';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0',
  borderRadius: 8, fontSize: 14, fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box',
};

type View = 'decks' | 'deck' | 'quiz';

const DIFF_COLOR: Record<string, { bg: string; color: string }> = {
  new   : { bg: '#e0e7ff', color: '#3730a3' },
  easy  : { bg: '#dcfce7', color: '#15803d' },
  medium: { bg: '#fef9c3', color: '#854d0e' },
  hard  : { bg: '#fee2e2', color: '#b91c1c' },
};

export default function Flashcards() {
  const [decks,      setDecks]      = useState<FlashDeck[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [view,       setView]       = useState<View>('decks');
  const [activeDeck, setActiveDeck] = useState<FlashDeck | null>(null);
  const [showDeckForm, setShowDeckForm] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [deckForm,   setDeckForm]   = useState({ name: '', course: '', description: '' });
  const [cardForm,   setCardForm]   = useState({ front: '', back: '', hint: '' });
  const [saving,     setSaving]     = useState(false);

  // Quiz state
  const [quizCards,  setQuizCards]  = useState<FlashCard[]>([]);
  const [quizIdx,    setQuizIdx]    = useState(0);
  const [revealed,   setRevealed]   = useState(false);
  const [quizScore,  setQuizScore]  = useState({ correct: 0, total: 0 });
  const [quizDone,   setQuizDone]   = useState(false);

  const loadDecks = async () => {
    setLoading(true);
    try {
      const res = await flashcardsApi.getAll();
      setDecks(res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  const reloadActiveDeck = async (deckId: string) => {
    const res = await flashcardsApi.getDeck(deckId);
    setActiveDeck(res.data.data);
  };

  useEffect(() => { loadDecks(); }, []);

  // ── Deck CRUD ────────────────────────────────────────────
  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await flashcardsApi.createDeck(deckForm);
      setShowDeckForm(false);
      setDeckForm({ name: '', course: '', description: '' });
      await loadDecks();
    } finally { setSaving(false); }
  };

  const handleDeleteDeck = async (id: string) => {
    if (!confirm('Delete this deck and all its cards?')) return;
    await flashcardsApi.deleteDeck(id);
    await loadDecks();
    if (activeDeck?.id === id) { setView('decks'); setActiveDeck(null); }
  };

  const openDeck = async (deck: FlashDeck) => {
    const res = await flashcardsApi.getDeck(deck.id);
    setActiveDeck(res.data.data);
    setView('deck');
  };

  // ── Card CRUD ────────────────────────────────────────────
  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDeck) return;
    setSaving(true);
    try {
      await flashcardsApi.addCard(activeDeck.id, cardForm);
      setShowCardForm(false);
      setCardForm({ front: '', back: '', hint: '' });
      await reloadActiveDeck(activeDeck.id);
    } finally { setSaving(false); }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!activeDeck) return;
    await flashcardsApi.deleteCard(activeDeck.id, cardId);
    await reloadActiveDeck(activeDeck.id);
  };

  // ── Quiz ─────────────────────────────────────────────────
  const startQuiz = () => {
    if (!activeDeck || activeDeck.cards.length === 0) return;
    const shuffled = [...activeDeck.cards].sort(() => Math.random() - 0.5);
    setQuizCards(shuffled);
    setQuizIdx(0);
    setRevealed(false);
    setQuizScore({ correct: 0, total: 0 });
    setQuizDone(false);
    setView('quiz');
  };

  const handleQuizAnswer = async (correct: boolean) => {
    if (!activeDeck) return;
    const card = quizCards[quizIdx];
    const difficulty = correct ? (card.difficulty === 'hard' ? 'medium' : 'easy') : 'hard';
    await flashcardsApi.reviewCard(activeDeck.id, card.id, { correct, difficulty });

    const newScore = { correct: quizScore.correct + (correct ? 1 : 0), total: quizScore.total + 1 };
    setQuizScore(newScore);

    const next = quizIdx + 1;
    if (next >= quizCards.length) {
      setQuizDone(true);
    } else {
      setQuizIdx(next);
      setRevealed(false);
    }
  };

  // ── Views ─────────────────────────────────────────────────

  // Quiz view
  if (view === 'quiz') {
    if (quizDone) {
      const pct = Math.round((quizScore.correct / quizScore.total) * 100);
      return (
        <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center', paddingTop: 40 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>{pct >= 80 ? '🏆' : pct >= 50 ? '👍' : '📖'}</div>
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Quiz Complete!</h2>
          <div style={{ fontSize: 48, fontWeight: 900, color: pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444', marginBottom: 16 }}>
            {quizScore.correct}/{quizScore.total}
          </div>
          <p style={{ color: '#64748b', marginBottom: 24 }}>{pct}% correct — {pct >= 80 ? 'Excellent work!' : pct >= 50 ? 'Good effort! Review the hard ones.' : 'Keep practicing!'}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={startQuiz}
              style={{ padding: '10px 22px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
              🔁 Retry
            </button>
            <button onClick={() => { setView('deck'); }}
              style={{ padding: '10px 22px', background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
              ← Back to Deck
            </button>
          </div>
        </div>
      );
    }

    const card = quizCards[quizIdx];
    const progress = ((quizIdx) / quizCards.length) * 100;
    const diff = DIFF_COLOR[card.difficulty] || DIFF_COLOR.new;

    return (
      <div style={{ maxWidth: 520, margin: '0 auto', paddingTop: 20 }}>
        {/* Progress */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <button onClick={() => setView('deck')} style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 700, cursor: 'pointer' }}>← Exit Quiz</button>
          <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{quizIdx + 1} / {quizCards.length}</span>
        </div>
        <div style={{ height: 6, background: '#e0e7ff', borderRadius: 999, marginBottom: 28 }}>
          <div style={{ height: 6, background: 'linear-gradient(90deg,#6366f1,#a855f7)', width: `${progress}%`, borderRadius: 999, transition: 'width .4s' }} />
        </div>

        {/* Card */}
        <div style={{ background: '#fff', border: '1.5px solid #e0e7ff', borderRadius: 20, padding: 36, textAlign: 'center', boxShadow: '0 4px 24px rgba(99,102,241,.13)', minHeight: 200 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: diff.bg, color: diff.color }}>
              {card.difficulty.toUpperCase()}
            </span>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>Score: {quizScore.correct}/{quizScore.total}</span>
          </div>

          <div style={{ fontSize: 20, fontWeight: 800, color: '#1a202c', lineHeight: 1.5, marginBottom: 20 }}>
            {card.front}
          </div>

          {card.hint && !revealed && (
            <div style={{ fontSize: 12, color: '#6366f1', marginBottom: 14 }}>💡 Hint: {card.hint}</div>
          )}

          {revealed ? (
            <>
              <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: 18, marginBottom: 24 }}>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Answer</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#374151', lineHeight: 1.6 }}>{card.back}</div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button onClick={() => handleQuizAnswer(false)}
                  style={{ padding: '10px 28px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>
                  ✗ Got it Wrong
                </button>
                <button onClick={() => handleQuizAnswer(true)}
                  style={{ padding: '10px 28px', background: '#dcfce7', color: '#15803d', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>
                  ✓ Got it Right
                </button>
              </div>
            </>
          ) : (
            <button onClick={() => setRevealed(true)}
              style={{ padding: '10px 32px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,.35)' }}>
              Reveal Answer
            </button>
          )}
        </div>
      </div>
    );
  }

  // Deck view (view single deck + cards)
  if (view === 'deck' && activeDeck) {
    const mastered = activeDeck.cards.filter(c => c.difficulty === 'easy').length;
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <button onClick={() => setView('decks')} style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 700, cursor: 'pointer', fontSize: 15 }}>← All Decks</button>
          <h1 style={{ fontSize: 22, fontWeight: 900, flex: 1 }}>🃏 {activeDeck.name}</h1>
          {activeDeck.cards.length > 0 && (
            <button onClick={startQuiz}
              style={{ padding: '8px 18px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
              ▶ Start Quiz ({activeDeck.cards.length} cards)
            </button>
          )}
          <button onClick={() => setShowCardForm(true)}
            style={{ padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
            + Add Card
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Cards', value: activeDeck.cards.length, color: '#6366f1', bg: '#e0e7ff' },
            { label: 'Mastered', value: mastered, color: '#15803d', bg: '#dcfce7' },
            { label: 'Need Work', value: activeDeck.cards.filter(c => c.difficulty === 'hard').length, color: '#b91c1c', bg: '#fee2e2' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: '12px 18px', minWidth: 100, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Add Card Form */}
        {showCardForm && (
          <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: 20, marginBottom: 20, boxShadow: '0 4px 16px rgba(0,0,0,.07)' }}>
            <h3 style={{ marginBottom: 14, fontWeight: 800 }}>➕ New Flashcard</h3>
            <form onSubmit={handleAddCard}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Front (Question) *</label>
                  <textarea style={{ ...inputStyle, height: 80, resize: 'vertical' }} required value={cardForm.front}
                    onChange={e => setCardForm(p => ({ ...p, front: e.target.value }))} placeholder="Question or term..." />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Back (Answer) *</label>
                  <textarea style={{ ...inputStyle, height: 80, resize: 'vertical' }} required value={cardForm.back}
                    onChange={e => setCardForm(p => ({ ...p, back: e.target.value }))} placeholder="Answer or definition..." />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Hint (optional)</label>
                  <input style={inputStyle} value={cardForm.hint}
                    onChange={e => setCardForm(p => ({ ...p, hint: e.target.value }))} placeholder="A helpful hint..." />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button type="submit" disabled={saving}
                  style={{ padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                  {saving ? 'Saving...' : 'Add Card'}
                </button>
                <button type="button" onClick={() => setShowCardForm(false)}
                  style={{ padding: '8px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontWeight: 700, cursor: 'pointer', background: '#fff' }}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Cards list */}
        {activeDeck.cards.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#718096' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🃏</div>
            <p>No cards yet. Add your first flashcard!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
            {activeDeck.cards.map(card => {
              const diff = DIFF_COLOR[card.difficulty] || DIFF_COLOR.new;
              const accuracy = card.timesShown > 0
                ? Math.round((card.timesCorrect / card.timesShown) * 100) : null;
              return (
                <div key={card.id} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: 16, position: 'relative' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: diff.bg, color: diff.color }}>
                    {card.difficulty.toUpperCase()}
                  </span>
                  <div style={{ fontWeight: 700, fontSize: 14, marginTop: 10, marginBottom: 4, color: '#1a202c' }}>{card.front}</div>
                  <div style={{ fontSize: 13, color: '#64748b', borderTop: '1px dashed #e2e8f0', paddingTop: 8, marginTop: 6 }}>{card.back}</div>
                  {card.hint && <div style={{ fontSize: 11, color: '#6366f1', marginTop: 6 }}>💡 {card.hint}</div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, fontSize: 12, color: '#9ca3af' }}>
                    <span>{accuracy !== null ? `${accuracy}% accuracy` : 'Not reviewed yet'}</span>
                    <button onClick={() => handleDeleteCard(card.id)}
                      style={{ padding: '3px 8px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>🗑</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Decks list view
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>🃏 Flashcard Decks</h1>
        <button onClick={() => setShowDeckForm(true)}
          style={{ padding: '8px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
          + New Deck
        </button>
      </div>

      {showDeckForm && (
        <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: 20, marginBottom: 20, boxShadow: '0 4px 16px rgba(0,0,0,.07)' }}>
          <h3 style={{ marginBottom: 14, fontWeight: 800 }}>New Flashcard Deck</h3>
          <form onSubmit={handleCreateDeck}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Deck Name *</label>
                <input style={inputStyle} required value={deckForm.name}
                  onChange={e => setDeckForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Biology Chapter 3" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Course</label>
                <input style={inputStyle} value={deckForm.course}
                  onChange={e => setDeckForm(p => ({ ...p, course: e.target.value }))} placeholder="e.g. Biology" />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Description</label>
                <input style={inputStyle} value={deckForm.description}
                  onChange={e => setDeckForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description..." />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button type="submit" disabled={saving}
                style={{ padding: '8px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                {saving ? 'Creating...' : 'Create Deck'}
              </button>
              <button type="button" onClick={() => setShowDeckForm(false)}
                style={{ padding: '8px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontWeight: 700, cursor: 'pointer', background: '#fff' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><div className="spinner" /></div>
      ) : decks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 64, color: '#718096' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🃏</div>
          <p style={{ fontWeight: 600 }}>No decks yet. Create your first flashcard deck!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 18 }}>
          {decks.map(deck => {
            const mastered = deck.cards.filter(c => c.difficulty === 'easy').length;
            const masteredPct = deck.cards.length > 0 ? Math.round((mastered / deck.cards.length) * 100) : 0;
            return (
              <div key={deck.id} style={{ background: '#fff', border: '1.5px solid #e0e7ff', borderRadius: 16, padding: 20, cursor: 'pointer', transition: 'transform .2s, box-shadow .2s', boxShadow: '0 2px 10px rgba(99,102,241,.07)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(99,102,241,.14)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 10px rgba(99,102,241,.07)'; }}
                onClick={() => openDeck(deck)}
              >
                <div style={{ fontSize: 32, marginBottom: 10 }}>🃏</div>
                <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{deck.name}</div>
                {deck.course && <div style={{ fontSize: 12, color: '#6366f1', fontWeight: 600, marginBottom: 8 }}>📚 {deck.course}</div>}
                {deck.description && <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>{deck.description}</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{deck.cards.length} cards · {masteredPct}% mastered</span>
                  <button onClick={e => { e.stopPropagation(); handleDeleteDeck(deck.id); }}
                    style={{ padding: '3px 8px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>🗑</button>
                </div>
                {deck.cards.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ height: 4, background: '#e0e7ff', borderRadius: 999 }}>
                      <div style={{ height: 4, width: `${masteredPct}%`, background: 'linear-gradient(90deg,#6366f1,#10b981)', borderRadius: 999, transition: 'width .5s' }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
