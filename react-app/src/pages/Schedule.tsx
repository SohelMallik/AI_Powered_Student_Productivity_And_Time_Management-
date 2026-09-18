// ============================================================
// Schedule Page – weekly timetable view + slot CRUD
// ============================================================
import React, { useEffect, useState } from 'react';
import { scheduleApi } from '@/services/api';
import type { ScheduleSlot } from '@/types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TYPE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  study   : { bg: '#e0e7ff', color: '#4338ca', border: '#6366f1' },
  class   : { bg: '#d1fae5', color: '#065f46', border: '#10b981' },
  break   : { bg: '#fef9c3', color: '#854d0e', border: '#f59e0b' },
  exercise: { bg: '#fce7f3', color: '#9d174d', border: '#ec4899' },
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0',
  borderRadius: 8, fontSize: 14, fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box',
};
const EMPTY_FORM = { title: '', day: 'Monday', startTime: '09:00', endTime: '10:00', subject: '', type: 'study' as ScheduleSlot['type'], color: '#6366f1', recurring: true };

export default function Schedule() {
  const [slots,    setSlots]    = useState<ScheduleSlot[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);
  const [viewDay,  setViewDay]  = useState<string | 'all'>('all');

  const loadSlots = async () => {
    setLoading(true);
    try {
      const res = await scheduleApi.getAll();
      setSlots(res.data.data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadSlots(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await scheduleApi.create(form);
      setShowForm(false);
      setForm(EMPTY_FORM);
      await loadSlots();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    await scheduleApi.delete(id);
    await loadSlots();
  };

  const filtered = viewDay === 'all' ? slots : slots.filter(s => s.day === viewDay);

  // Group by day
  const byDay: Record<string, ScheduleSlot[]> = {};
  for (const day of DAYS) {
    byDay[day] = filtered.filter(s => s.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  const todayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>📅 Weekly Schedule</h1>
        <button onClick={() => setShowForm(true)}
          style={{ padding: '8px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
          + Add Slot
        </button>
      </div>

      {/* Day Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={() => setViewDay('all')}
          style={{ padding: '6px 14px', borderRadius: 8, border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer',
            background: viewDay === 'all' ? '#6366f1' : '#f1f5f9', color: viewDay === 'all' ? '#fff' : '#64748b' }}>
          All Days
        </button>
        {DAYS.map(d => (
          <button key={d} onClick={() => setViewDay(d)}
            style={{ padding: '6px 12px', borderRadius: 8, border: d === todayName ? '1.5px solid #6366f1' : 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer',
              background: viewDay === d ? '#6366f1' : d === todayName ? '#e0e7ff' : '#f1f5f9',
              color: viewDay === d ? '#fff' : d === todayName ? '#4338ca' : '#64748b' }}>
            {d.slice(0, 3)}{d === todayName ? ' ★' : ''}
          </button>
        ))}
      </div>

      {/* Add Form */}
      {showForm && (
        <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: '0 4px 16px rgba(0,0,0,.07)' }}>
          <h3 style={{ marginBottom: 16, fontWeight: 800 }}>➕ New Schedule Slot</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Title *</label>
                <input style={inputStyle} required value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Physics Lecture" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Day</label>
                <select style={inputStyle} value={form.day}
                  onChange={e => setForm(p => ({ ...p, day: e.target.value }))}>
                  {DAYS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Type</label>
                <select style={inputStyle} value={form.type}
                  onChange={e => setForm(p => ({ ...p, type: e.target.value as ScheduleSlot['type'] }))}>
                  {['study','class','break','exercise'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Start Time</label>
                <input style={inputStyle} type="time" value={form.startTime}
                  onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>End Time</label>
                <input style={inputStyle} type="time" value={form.endTime}
                  onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Subject</label>
                <input style={inputStyle} value={form.subject}
                  onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="e.g. Physics" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button type="submit" disabled={saving}
                style={{ padding: '8px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                {saving ? 'Saving...' : 'Add Slot'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ padding: '8px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontWeight: 700, cursor: 'pointer', background: '#fff' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><div className="spinner" /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: viewDay === 'all' ? 'repeat(auto-fill,minmax(200px,1fr))' : '1fr', gap: 16 }}>
          {DAYS.filter(d => viewDay === 'all' || d === viewDay).map(day => (
            <div key={day} style={{ background: '#fff', border: day === todayName ? '2px solid #6366f1' : '1.5px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', background: day === todayName ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#f8faff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: 14, color: day === todayName ? '#fff' : '#1a202c' }}>{day}</span>
                {day === todayName && <span style={{ fontSize: 11, background: 'rgba(255,255,255,.25)', color: '#fff', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>TODAY</span>}
              </div>
              <div style={{ padding: '8px 12px', minHeight: 60 }}>
                {byDay[day].length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#d1d5db', fontSize: 12, padding: '12px 0' }}>No slots</div>
                ) : byDay[day].map(slot => {
                  const tc = TYPE_COLORS[slot.type] || TYPE_COLORS.study;
                  return (
                    <div key={slot.id} style={{ background: tc.bg, borderLeft: `3px solid ${tc.border}`, borderRadius: 8, padding: '8px 10px', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: tc.color }}>{slot.title}</div>
                        <div style={{ fontSize: 11, color: tc.color, opacity: .8 }}>{slot.startTime} – {slot.endTime}</div>
                        {slot.subject && <div style={{ fontSize: 11, color: tc.color, opacity: .7 }}>{slot.subject}</div>}
                      </div>
                      <button onClick={() => handleDelete(slot.id)}
                        style={{ padding: '2px 6px', background: 'rgba(0,0,0,.1)', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: 11, color: tc.color }}>✕</button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
