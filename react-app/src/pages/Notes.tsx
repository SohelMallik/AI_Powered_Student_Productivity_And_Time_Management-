// ============================================================
// Notes Page – rich study notes with pin, colour, search
// ============================================================
import React, { useEffect, useState, useCallback } from 'react';
import { notesApi } from '@/services/api';
import type { Note } from '@/types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const NOTE_COLORS = [
  '#f0f9ff', '#fef9c3', '#fdf4ff', '#f0fdf4', '#fff7ed', '#fce7f3',
];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0',
  borderRadius: 8, fontSize: 14, fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box',
};

const EMPTY_FORM = { title: '', content: '', course: '', tags: '', color: NOTE_COLORS[0] };

export default function Notes() {
  const [notes,    setNotes]    = useState<Note[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState<Note | null>(null);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);
  const [filter,   setFilter]   = useState<'all' | 'pinned'>('all');

  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notesApi.getAll(search ? { search } : undefined);
      setNotes(res.data.data || []);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (note: Note) => {
    setEditing(note);
    setForm({ title: note.title, content: note.content, course: note.course, tags: note.tags.join(', '), color: note.color });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      };
      if (editing) {
        await notesApi.update(editing.id, payload);
      } else {
        await notesApi.create(payload);
      }
      setShowForm(false);
      await loadNotes();
    } finally {
      setSaving(false);
    }
  };

  const handlePin = async (id: string) => {
    await notesApi.pin(id);
    await loadNotes();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this note?')) return;
    await notesApi.delete(id);
    await loadNotes();
  };

  const visible = filter === 'pinned' ? notes.filter(n => n.pinned) : notes;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
          📝 Study Notes
        </h1>
        <button
          style={{ padding: '8px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
          onClick={openCreate}
        >+ New Note</button>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        {(['all', 'pinned'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '6px 14px', borderRadius: 8, border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer',
              background: filter === f ? '#6366f1' : '#f1f5f9', color: filter === f ? '#fff' : '#64748b' }}>
            {f === 'pinned' ? '📌 Pinned' : 'All Notes'}
          </button>
        ))}
        <input
          placeholder="🔍 Search notes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, width: 220, marginLeft: 'auto' }}
        />
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: '0 4px 16px rgba(0,0,0,.07)' }}>
          <h3 style={{ marginBottom: 16, fontWeight: 800 }}>{editing ? '✏️ Edit Note' : '📝 New Note'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Title *</label>
                <input style={inputStyle} required value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Note title" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Course</label>
                <input style={inputStyle} value={form.course}
                  onChange={e => setForm(p => ({ ...p, course: e.target.value }))} placeholder="e.g. Mathematics" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Tags (comma separated)</label>
                <input style={inputStyle} value={form.tags}
                  onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="chapter1, important, review" />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>Card Color</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {NOTE_COLORS.map(c => (
                    <div key={c} onClick={() => setForm(p => ({ ...p, color: c }))}
                      style={{ width: 28, height: 28, borderRadius: 8, background: c, border: form.color === c ? '2.5px solid #6366f1' : '2px solid #e2e8f0', cursor: 'pointer', transition: 'transform .15s' }}
                    />
                  ))}
                </div>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Content</label>
                <textarea style={{ ...inputStyle, height: 140, resize: 'vertical' }} value={form.content}
                  onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="Write your notes here..." />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" disabled={saving}
                style={{ padding: '8px 18px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                {saving ? 'Saving...' : editing ? 'Update Note' : 'Add Note'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: 8, fontWeight: 700, cursor: 'pointer', background: '#fff' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Notes Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><div className="spinner" /></div>
      ) : visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 64, color: '#718096' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📒</div>
          <p style={{ fontWeight: 600 }}>No notes yet. Create your first study note!</p>
        </div>
      ) : (
        <div style={{ columns: 'auto 300px', columnGap: 18 }}>
          {visible.map(note => (
            <div key={note.id} style={{
              background: note.color || '#f0f9ff',
              border: '1.5px solid rgba(0,0,0,.07)',
              borderRadius: 16,
              padding: 18,
              marginBottom: 18,
              breakInside: 'avoid',
              position: 'relative',
              boxShadow: '0 2px 8px rgba(0,0,0,.05)',
              transition: 'transform .2s, box-shadow .2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,.1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,.05)'; }}
            >
              {/* Pin icon */}
              {note.pinned && (
                <div style={{ position: 'absolute', top: 14, right: 14, fontSize: 16 }}>📌</div>
              )}
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 8, paddingRight: note.pinned ? 24 : 0 }}>{note.title}</div>
              {note.course && (
                <div style={{ display: 'inline-block', background: 'rgba(99,102,241,.12)', color: '#4338ca', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
                  📚 {note.course}
                </div>
              )}
              <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 10, maxHeight: 120, overflow: 'hidden' }}>
                {note.content || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No content</span>}
              </p>
              {note.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                  {note.tags.map(tag => (
                    <span key={tag} style={{ background: 'rgba(0,0,0,.07)', color: '#374151', padding: '2px 7px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(0,0,0,.07)', paddingTop: 10, marginTop: 4 }}>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>{dayjs(note.updatedAt).fromNow()}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => handlePin(note.id)}
                    title={note.pinned ? 'Unpin' : 'Pin'}
                    style={{ padding: '4px 8px', background: note.pinned ? '#fef9c3' : '#f1f5f9', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                    {note.pinned ? '📌' : '📍'}
                  </button>
                  <button onClick={() => openEdit(note)}
                    style={{ padding: '4px 8px', background: '#ede9fe', color: '#7c3aed', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>✏️</button>
                  <button onClick={() => handleDelete(note.id)}
                    style={{ padding: '4px 8px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>🗑</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
