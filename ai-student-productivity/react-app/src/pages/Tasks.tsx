// ============================================================
// Tasks Page (React/TypeScript)
// ============================================================
import React, { useState, useEffect } from 'react';
import { tasksApi } from '@/services/api';
import type { Task } from '@/types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

function minutesToHM(h: number) { return `~${h}h`; }

const PRIORITY_LABELS: Record<string, string> = {
  critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low',
};

function getPriority(score: number) {
  if (score >= 80) return { label: 'Critical', bg: '#fee2e2', color: '#b91c1c' };
  if (score >= 60) return { label: 'High',     bg: '#fef9c3', color: '#854d0e' };
  if (score >= 40) return { label: 'Medium',   bg: '#dbeafe', color: '#1d4ed8' };
  return               { label: 'Low',      bg: '#dcfce7', color: '#15803d' };
}

export default function Tasks() {
  const [tasks,    setTasks]    = useState<Task[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<'all'|'pending'|'overdue'|'done'>('all');
  const [search,   setSearch]   = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState({ title:'', description:'', deadline:'', course:'', type:'assignment', estimatedHours:2, weight:5 });
  const [saving,   setSaving]   = useState(false);

  const loadTasks = async () => {
    setLoading(true);
    try { const res = await tasksApi.getAll(); setTasks(res.data.data || []); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadTasks(); }, []);

  const filtered = tasks.filter(t => {
    if (filter === 'pending' && t.completed) return false;
    if (filter === 'done'    && !t.completed) return false;
    if (filter === 'overdue' && (t.completed || new Date(t.deadline) >= new Date())) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleComplete = async (id: string) => {
    await tasksApi.complete(id);
    await loadTasks();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    await tasksApi.delete(id);
    await loadTasks();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try { await tasksApi.create(form); setShowForm(false); await loadTasks(); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Task Manager</h1>
        <button style={{ padding: '8px 16px', background: '#3b82d4', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700 }}
          onClick={() => setShowForm(true)}>+ Add Task</button>
      </div>

      {/* Add Task Form */}
      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <h3 style={{ marginBottom: 16 }}>New Task</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Title *</label>
                <input style={inputStyle} required value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Task title" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Deadline *</label>
                <input style={inputStyle} type="datetime-local" required value={form.deadline}
                  onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Course</label>
                <input style={inputStyle} value={form.course}
                  onChange={e => setForm(p => ({ ...p, course: e.target.value }))} placeholder="e.g. Mathematics" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Type</label>
                <select style={inputStyle} value={form.type}
                  onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                  {['assignment','exam','project','reading','other'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Est. Hours</label>
                <input style={inputStyle} type="number" min="0.5" step="0.5" value={form.estimatedHours}
                  onChange={e => setForm(p => ({ ...p, estimatedHours: parseFloat(e.target.value) }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Importance (1-10)</label>
                <input style={inputStyle} type="number" min="1" max="10" value={form.weight}
                  onChange={e => setForm(p => ({ ...p, weight: parseInt(e.target.value) }))} />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Description</label>
              <textarea style={{ ...inputStyle, height: 64, resize: 'vertical' }} value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Details..." />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" disabled={saving} style={{ padding: '8px 16px', background: '#3b82d4', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700 }}>
                {saving ? 'Saving...' : 'Add Task'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: 8, fontWeight: 700 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['all','pending','overdue','done'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '6px 14px', borderRadius: 8, border: 'none', fontWeight: 600, fontSize: 13,
              background: filter === f ? '#3b82d4' : '#f1f5f9', color: filter === f ? '#fff' : '#718096' }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <input placeholder="🔍 Search..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, width: 200, marginLeft: 'auto' }} />
      </div>

      {/* Task Grid */}
      {loading ? <div style={{ textAlign: 'center', padding: 48 }}><div className="spinner" /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
          {filtered.map(task => {
            const p    = getPriority(task.priority || 0);
            const late = new Date(task.deadline) < new Date() && !task.completed;
            return (
              <div key={task.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 18, opacity: task.completed ? .65 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: p.bg, color: p.color }}>{p.label}</span>
                    <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: '#f1f5f9', color: '#475569' }}>{task.type}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {!task.completed && <button onClick={() => handleComplete(task.id)}
                      style={{ padding: '4px 10px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 12 }}>✓</button>}
                    <button onClick={() => handleDelete(task.id)}
                      style={{ padding: '4px 10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 12 }}>🗑</button>
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, textDecoration: task.completed ? 'line-through' : 'none', marginBottom: 4 }}>{task.title}</div>
                <div style={{ fontSize: 12, color: '#718096', marginBottom: 12 }}>{task.description || 'No description'}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 6 }}>📚 {task.course}</span>
                  <span style={{ fontWeight: 700, color: late ? '#ef4444' : '#22c55e' }}>{dayjs(task.deadline).fromNow()}</span>
                </div>
                <div style={{ fontSize: 11, color: '#718096', marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
                  <span>⏳ {minutesToHM(task.estimatedHours)}</span>
                  <span>Priority: {task.priority}</span>
                </div>
              </div>
            );
          })}
          {!filtered.length && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 48, color: '#718096' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
              <p>No tasks found. Add your first task!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0',
  borderRadius: 8, fontSize: 14, fontFamily: 'inherit', background: '#fff',
};
