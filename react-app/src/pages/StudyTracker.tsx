// ============================================================
// Study Tracker Page – log sessions, view history
// ============================================================
import React, { useEffect, useState } from 'react';
import { studyApi, tasksApi } from '@/services/api';
import type { StudySession, Task } from '@/types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

function minutesToHM(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0',
  borderRadius: 8, fontSize: 14, fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box',
};

const MOOD_OPTIONS: { value: StudySession['mood']; label: string; emoji: string }[] = [
  { value: 'happy',   label: 'Happy',   emoji: '😊' },
  { value: 'neutral', label: 'Neutral', emoji: '😐' },
  { value: 'tired',   label: 'Tired',   emoji: '😴' },
  { value: 'stressed',label: 'Stressed',emoji: '😰' },
];

const EMPTY_FORM = { subject: '', taskId: '', duration: 60, distractionMinutes: 0, notes: '', mood: 'neutral' as StudySession['mood'], productivity: 7, date: dayjs().format('YYYY-MM-DDTHH:mm') };

export default function StudyTracker() {
  const [sessions,   setSessions]   = useState<StudySession[]>([]);
  const [tasks,      setTasks]      = useState<Task[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [todayStats, setTodayStats] = useState({ minutes: 0, sessions: 0 });

  const loadSessions = async () => {
    setLoading(true);
    try {
      const [sesRes, todayRes, taskRes] = await Promise.all([
        studyApi.getAll(),
        studyApi.getToday(),
        tasksApi.getAll(),
      ]);
      const all = sesRes.data.data || [];
      setSessions(all.sort((a: StudySession, b: StudySession) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      const td = (todayRes.data as any);
      setTodayStats({ minutes: td.totalMinutes || 0, sessions: (td.data || []).length });
      setTasks((taskRes.data.data || []).filter((t: Task) => !t.completed));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSessions(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await studyApi.create({ ...form, taskId: form.taskId || null });
      setShowForm(false);
      setForm(EMPTY_FORM);
      await loadSessions();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this session?')) return;
    await studyApi.delete(id);
    await loadSessions();
  };

  const moodEmoji: Record<string, string> = { happy: '😊', neutral: '😐', tired: '😴', stressed: '😰' };
  const moodColors: Record<string, { bg: string; color: string }> = {
    happy:   { bg: '#dcfce7', color: '#15803d' },
    neutral: { bg: '#f1f5f9', color: '#475569' },
    tired:   { bg: '#fef9c3', color: '#854d0e' },
    stressed:{ bg: '#fee2e2', color: '#b91c1c' },
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>⏱ Study Tracker</h1>
        <button onClick={() => setShowForm(true)}
          style={{ padding: '8px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
          + Log Session
        </button>
      </div>

      {/* Today summary */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
        {[
          { label: "Today's Study",    value: minutesToHM(todayStats.minutes),   icon: '⏱', bg: '#e0e7ff', color: '#4338ca' },
          { label: "Today's Sessions", value: `${todayStats.sessions}`,          icon: '📋', bg: '#d1fae5', color: '#065f46' },
          { label: "Total Sessions",   value: `${sessions.length}`,              icon: '📚', bg: '#f3e8ff', color: '#7c3aed' },
          { label: "Total Logged",     value: minutesToHM(sessions.reduce((s, x) => s + (x.duration || 0), 0)), icon: '🏆', bg: '#ffedd5', color: '#c2410c' },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 160px' }}>
            <span style={{ fontSize: 24 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: .8 }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Log Form */}
      {showForm && (
        <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: '0 4px 16px rgba(0,0,0,.07)' }}>
          <h3 style={{ marginBottom: 16, fontWeight: 800 }}>📝 Log Study Session</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Subject *</label>
                <input style={inputStyle} required value={form.subject}
                  onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="e.g. Mathematics" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Linked Task (optional)</label>
                <select style={inputStyle} value={form.taskId}
                  onChange={e => setForm(p => ({ ...p, taskId: e.target.value }))}>
                  <option value="">— None —</option>
                  {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Duration (minutes) *</label>
                <input style={inputStyle} type="number" min="1" required value={form.duration}
                  onChange={e => setForm(p => ({ ...p, duration: parseInt(e.target.value) }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Distraction Minutes</label>
                <input style={inputStyle} type="number" min="0" value={form.distractionMinutes}
                  onChange={e => setForm(p => ({ ...p, distractionMinutes: parseInt(e.target.value) }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Productivity (1-10)</label>
                <input style={inputStyle} type="number" min="1" max="10" value={form.productivity}
                  onChange={e => setForm(p => ({ ...p, productivity: parseInt(e.target.value) }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Date & Time</label>
                <input style={inputStyle} type="datetime-local" value={form.date}
                  onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 8 }}>Mood</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {MOOD_OPTIONS.map(m => (
                    <button type="button" key={m.value} onClick={() => setForm(p => ({ ...p, mood: m.value }))}
                      style={{ padding: '8px 14px', borderRadius: 10, border: form.mood === m.value ? '2px solid #6366f1' : '2px solid #e2e8f0',
                        background: form.mood === m.value ? '#e0e7ff' : '#f9fafb', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                      {m.emoji} {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Notes</label>
                <textarea style={{ ...inputStyle, height: 72, resize: 'vertical' }} value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="What did you study? Any reflections..." />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" disabled={saving}
                style={{ padding: '8px 18px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                {saving ? 'Saving...' : 'Log Session'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ padding: '8px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontWeight: 700, cursor: 'pointer', background: '#fff' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Sessions List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><div className="spinner" /></div>
      ) : sessions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 64, color: '#718096' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
          <p style={{ fontWeight: 600 }}>No sessions yet. Log your first study session!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sessions.map(s => {
            const mood = moodColors[s.mood] || moodColors.neutral;
            const focusPct = s.duration > 0 ? Math.round(((s.duration - (s.distractionMinutes || 0)) / s.duration) * 100) : 100;
            const linkedTask = tasks.find(t => t.id === s.taskId);
            return (
              <div key={s.id} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: 18, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                {/* Mood icon */}
                <div style={{ width: 44, height: 44, borderRadius: 12, background: mood.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                  {moodEmoji[s.mood] || '📚'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 4 }}>
                    <span style={{ fontWeight: 800, fontSize: 15 }}>{s.subject}</span>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>{dayjs(s.date).fromNow()}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                    <span style={{ padding: '2px 8px', background: '#e0e7ff', color: '#4338ca', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>⏱ {minutesToHM(s.duration)}</span>
                    <span style={{ padding: '2px 8px', background: focusPct >= 80 ? '#dcfce7' : '#fef9c3', color: focusPct >= 80 ? '#15803d' : '#854d0e', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>🎯 {focusPct}% focus</span>
                    <span style={{ padding: '2px 8px', background: '#f3e8ff', color: '#7c3aed', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>⭐ {s.productivity}/10</span>
                    {linkedTask && <span style={{ padding: '2px 8px', background: '#fef9c3', color: '#854d0e', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>🔗 {linkedTask.title}</span>}
                  </div>
                  {s.notes && <div style={{ fontSize: 13, color: '#64748b', fontStyle: 'italic' }}>"{s.notes}"</div>}
                </div>
                <button onClick={() => handleDelete(s.id)}
                  style={{ padding: '4px 8px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, flexShrink: 0 }}>🗑</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
