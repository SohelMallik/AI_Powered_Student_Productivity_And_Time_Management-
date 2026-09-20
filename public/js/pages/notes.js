/* ============================================================
   Notes Page  – Study Notes with Pin, Colour, Search, Edit
   ============================================================ */

const NOTE_COLORS = [
  { label: 'Sky',    val: '#dbeafe', text: '#1e40af' },
  { label: 'Lemon',  val: '#fef9c3', text: '#854d0e' },
  { label: 'Mint',   val: '#dcfce7', text: '#15803d' },
  { label: 'Lavender',val:'#ede9fe', text: '#5b21b6' },
  { label: 'Peach',  val: '#ffedd5', text: '#c2410c' },
  { label: 'Rose',   val: '#fce7f3', text: '#9d174d' },
  { label: 'White',  val: '#f9fafb', text: '#374151' },
];

// ── State ────────────────────────────────────────────────────
let _notesAll      = [];
let _notesSearch   = '';
let _notesFilter   = 'all';  // all | pinned
let _notesEditId   = null;

async function renderNotesPage() {
  const root = document.getElementById('notes-root');
  root.innerHTML = `
    <div style="text-align:center;padding:48px;animation:fadeIn .5s ease">
      <div class="spinner"></div>
      <p style="margin-top:14px;color:var(--color-muted);font-size:13px">Loading notes…</p>
    </div>`;
  try {
    const params = {};
    if (_notesSearch) params.search = _notesSearch;
    const res = await NotesAPI.getAll(params);
    _notesAll = res.data || [];
    buildNotesUI();
  } catch (e) {
    root.innerHTML = errorState(e.message, 'renderNotesPage()');
  }
}

function buildNotesUI() {
  const root   = document.getElementById('notes-root');
  const pinned = _notesAll.filter(n => n.pinned).length;

  root.innerHTML = `
    <!-- Hero -->
    <div class="page-hero notes-hero">
      <div class="page-hero-orb orb1"></div>
      <div class="page-hero-orb orb2"></div>
      <div class="page-hero-content">
        <h1 class="page-hero-title">📝 Study Notes</h1>
        <p class="page-hero-sub">${_notesAll.length} notes · ${pinned} pinned</p>
      </div>
      <button class="hero-action-btn" id="newNoteBtn">＋ New Note</button>
    </div>

    <!-- Controls -->
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:18px">
      <div class="pg-tabs" id="noteTabs" style="margin-bottom:0">
        <button class="pg-tab${_notesFilter==='all'?' active':''}" data-nf="all">
          All <span class="pg-tab-count">${_notesAll.length}</span>
        </button>
        <button class="pg-tab${_notesFilter==='pinned'?' active':''}" data-nf="pinned">
          📌 Pinned <span class="pg-tab-count">${pinned}</span>
        </button>
      </div>
      <input class="pg-search" id="notesSearchInput" placeholder="🔍 Search notes…" value="${escapeHtml(_notesSearch)}"
        style="margin-left:auto;width:220px" />
    </div>

    <!-- Masonry Grid -->
    <div id="notesGrid" class="notes-masonry"></div>
  `;

  document.getElementById('newNoteBtn').onclick  = () => openNoteModal(null);
  document.getElementById('notesSearchInput').oninput = e => {
    _notesSearch = e.target.value;
    debounce('noteSearch', () => renderNotesPage(), 350);
  };
  qsa('#noteTabs .pg-tab').forEach(btn => {
    btn.onclick = () => { _notesFilter = btn.dataset.nf; buildNotesUI(); };
  });

  renderNotesGrid();
}

function renderNotesGrid() {
  const grid    = document.getElementById('notesGrid');
  let visible   = _notesAll;
  if (_notesFilter === 'pinned') visible = visible.filter(n => n.pinned);

  if (!visible.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-state-icon">📒</div>
      <h3>No notes found</h3>
      <p>${_notesFilter === 'pinned' ? 'Pin some notes to find them here' : 'Create your first study note!'}</p>
      <button class="btn btn-primary mt-4" onclick="openNoteModal(null)">＋ New Note</button>
    </div>`;
    return;
  }

  grid.innerHTML = visible.map((note, i) => noteCard(note, i)).join('');

  qsa('.note-pin-btn').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      try {
        await NotesAPI.pin(btn.dataset.id);
        await renderNotesPage();
      } catch (err) { showToast(err.message, 'error'); }
    };
  });
  qsa('.note-edit-btn').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const note = _notesAll.find(n => n.id === btn.dataset.id);
      if (note) openNoteModal(note);
    };
  });
  qsa('.note-delete-btn').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      if (!confirm('Delete this note?')) return;
      try {
        await NotesAPI.delete(btn.dataset.id);
        showToast('Note deleted', 'info');
        await renderNotesPage();
      } catch (err) { showToast(err.message, 'error'); }
    };
  });
}

function noteCard(note, idx) {
  const col     = NOTE_COLORS.find(c => c.val === note.color) || NOTE_COLORS[0];
  const tagHtml = (note.tags || []).map(t =>
    `<span style="padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;background:rgba(0,0,0,.08);color:${col.text}">#${escapeHtml(t)}</span>`
  ).join('');
  const ago = timeAgo(note.updatedAt);

  return `
    <div class="note-card" style="background:${col.val};border-color:${col.val === '#f9fafb' ? 'var(--c-border)' : col.val};animation:popIn .35s ${idx*.04}s ease both">
      ${note.pinned ? '<div class="note-pin-badge">📌</div>' : ''}
      <div class="note-actions">
        <button class="note-icon-btn note-pin-btn" data-id="${note.id}" title="${note.pinned?'Unpin':'Pin'}">${note.pinned?'📍':'📌'}</button>
        <button class="note-icon-btn note-edit-btn" data-id="${note.id}" title="Edit">✏️</button>
        <button class="note-icon-btn note-delete-btn" data-id="${note.id}" title="Delete">🗑</button>
      </div>
      <div class="note-title" style="color:${col.text}">${escapeHtml(note.title)}</div>
      ${note.course ? `<div class="note-course" style="color:${col.text}99">📚 ${escapeHtml(note.course)}</div>` : ''}
      <div class="note-content">${escapeHtml(note.content || '').replace(/\n/g,'<br>').slice(0,260)}${note.content && note.content.length > 260 ? '…' : ''}</div>
      ${tagHtml ? `<div class="note-tags">${tagHtml}</div>` : ''}
      <div class="note-meta" style="color:${col.text}80">${ago}</div>
    </div>`;
}

// ── Modal ────────────────────────────────────────────────────
function openNoteModal(note) {
  _notesEditId = note ? note.id : null;
  const isEdit = !!note;
  const currColor = note?.color || NOTE_COLORS[0].val;

  openModal(isEdit ? '✏️ Edit Note' : '📝 New Note', `
    <form id="noteForm" autocomplete="off">
      <div class="form-group">
        <label class="form-label">Title *</label>
        <input class="form-control" id="noteTitle" value="${isEdit ? escapeHtml(note.title) : ''}" placeholder="Note title" required />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Course</label>
          <input class="form-control" id="noteCourse" value="${isEdit ? escapeHtml(note.course||'') : ''}" placeholder="e.g. Mathematics" />
        </div>
        <div class="form-group">
          <label class="form-label">Tags (comma separated)</label>
          <input class="form-control" id="noteTags" value="${isEdit ? escapeHtml((note.tags||[]).join(', ')) : ''}" placeholder="chapter1, important" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Card Colour</label>
        <div class="note-color-picker" id="noteColorPicker">
          ${NOTE_COLORS.map(c => `
            <button type="button" class="note-color-swatch${c.val===currColor?' selected':''}" data-color="${c.val}"
              style="background:${c.val};border-color:${c.val===currColor?'#6366f1':c.val}" title="${c.label}"></button>
          `).join('')}
        </div>
        <input type="hidden" id="noteColor" value="${currColor}" />
      </div>
      <div class="form-group">
        <label class="form-label">Content</label>
        <textarea class="form-control" id="noteContent" rows="6" placeholder="Write your notes here…">${isEdit ? escapeHtml(note.content||'') : ''}</textarea>
      </div>
      <div style="display:flex;gap:8px">
        <button type="submit" class="btn btn-primary">${isEdit ? 'Update Note' : 'Save Note'}</button>
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      </div>
    </form>
  `);

  // Colour picker
  qsa('#noteColorPicker .note-color-swatch').forEach(sw => {
    sw.onclick = () => {
      qsa('#noteColorPicker .note-color-swatch').forEach(s => {
        s.style.borderColor = s.dataset.color;
        s.classList.remove('selected');
      });
      sw.classList.add('selected');
      sw.style.borderColor = '#6366f1';
      document.getElementById('noteColor').value = sw.dataset.color;
    };
  });

  document.getElementById('noteForm').onsubmit = async (e) => {
    e.preventDefault();
    const payload = {
      title  : document.getElementById('noteTitle').value.trim(),
      course : document.getElementById('noteCourse').value.trim(),
      tags   : document.getElementById('noteTags').value.split(',').map(t => t.trim()).filter(Boolean),
      color  : document.getElementById('noteColor').value,
      content: document.getElementById('noteContent').value,
    };
    try {
      if (_notesEditId) {
        await NotesAPI.update(_notesEditId, payload);
        showToast('Note updated!', 'success');
      } else {
        await NotesAPI.create(payload);
        showToast('Note saved! 📝', 'success');
      }
      closeModal();
      _notesEditId = null;
      await renderNotesPage();
    } catch (err) { showToast(err.message, 'error'); }
  };
}

// ── Tiny debounce helper ─────────────────────────────────────
const _debTimers = {};
function debounce(key, fn, ms) {
  clearTimeout(_debTimers[key]);
  _debTimers[key] = setTimeout(fn, ms);
}

// ── HTML escape helper ───────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ── Error state helper ───────────────────────────────────────
function errorState(msg, retryFn) {
  return `<div class="empty-state">
    <div class="empty-state-icon">⚠️</div>
    <h3>Something went wrong</h3>
    <p>${msg}</p>
    <button class="btn btn-primary mt-4" onclick="${retryFn}">Retry</button>
  </div>`;
}
