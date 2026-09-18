// ============================================================
// Settings Page – profile, pomodoro, preferences, dark mode
// ============================================================
import React, { useEffect, useState } from 'react';
import { aiApi } from '@/services/api';
import type { UserProfile } from '@/types';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0',
  borderRadius: 8, fontSize: 14, fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 5, color: '#374151',
};

export default function Settings() {
  const [_profile, setProfile] = useState<UserProfile | null>(null);
  const [form,     setForm]    = useState<UserProfile | null>(null);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    try { return JSON.parse(localStorage.getItem('studyai-dark') || 'false'); } catch { return false; }
  });

  useEffect(() => {
    aiApi.getProfile().then(res => {
      const p = res.data.data;
      setProfile(p);
      setForm(p);
    }).catch(() => {});
  }, []);

  // Apply dark mode to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('studyai-dark', JSON.stringify(darkMode));
  }, [darkMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await aiApi.updateProfile(form);
      setProfile(res.data.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally { setSaving(false); }
  };

  if (!form) {
    return <div style={{ textAlign: 'center', padding: 48 }}><div className="spinner" /></div>;
  }

  const Section = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => (
    <div style={{ background: '#fff', border: '1.5px solid #e0e7ff', borderRadius: 18, padding: 24, marginBottom: 20 }}>
      <div style={{ fontWeight: 800, fontSize: 16, color: '#1a202c', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>{icon}</span><span>{title}</span>
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ fontSize: 26, fontWeight: 900, color: '#1a202c', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span>⚙️</span><span>Settings</span>
      </div>

      <form onSubmit={handleSubmit}>

        {/* Profile */}
        <Section title="Profile" icon="👤">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Display Name</label>
              <input style={inputStyle} value={form.name}
                onChange={e => setForm(p => p ? { ...p, name: e.target.value } : p)} placeholder="Your name" />
            </div>
            <div>
              <label style={labelStyle}>Preferred Study Time</label>
              <select style={inputStyle} value={form.preferredStudyTime}
                onChange={e => setForm(p => p ? { ...p, preferredStudyTime: e.target.value } : p)}>
                {['morning','afternoon','evening','night'].map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Daily Study Goal (hours)</label>
              <input style={inputStyle} type="number" min="1" max="24" step="0.5" value={form.studyGoalHours}
                onChange={e => setForm(p => p ? { ...p, studyGoalHours: parseFloat(e.target.value) } : p)} />
            </div>
          </div>
        </Section>

        {/* Pomodoro */}
        <Section title="Pomodoro Timer" icon="⏱">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Work Session (minutes)</label>
              <input style={inputStyle} type="number" min="5" max="90" step="5" value={form.pomodoroWork}
                onChange={e => setForm(p => p ? { ...p, pomodoroWork: parseInt(e.target.value) } : p)} />
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Recommended: 25 min</div>
            </div>
            <div>
              <label style={labelStyle}>Break Duration (minutes)</label>
              <input style={inputStyle} type="number" min="1" max="30" step="1" value={form.pomodoroBreak}
                onChange={e => setForm(p => p ? { ...p, pomodoroBreak: parseInt(e.target.value) } : p)} />
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Recommended: 5 min</div>
            </div>
          </div>
          {/* Visual preview */}
          <div style={{ marginTop: 16, background: '#f8faff', borderRadius: 12, padding: 14, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#6366f1' }}>{form.pomodoroWork}min</div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>FOCUS</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>{form.pomodoroBreak}min</div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>BREAK</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#f59e0b' }}>
                {((form.pomodoroWork + form.pomodoroBreak) * 4 / 60).toFixed(1)}h
              </div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>4 CYCLES</div>
            </div>
          </div>
        </Section>

        {/* Subjects */}
        <Section title="Subjects" icon="📚">
          <label style={labelStyle}>Your Subjects (comma separated)</label>
          <input style={inputStyle}
            value={(form.subjects || []).join(', ')}
            onChange={e => setForm(p => p ? { ...p, subjects: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } : p)}
            placeholder="Mathematics, Physics, Literature, History..." />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {(form.subjects || []).map(s => (
              <span key={s} style={{ padding: '3px 10px', background: '#e0e7ff', color: '#4338ca', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                {s}
              </span>
            ))}
          </div>
        </Section>

        {/* Appearance */}
        <Section title="Appearance" icon="🎨">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Dark Mode</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Toggle dark/light theme for the app</div>
            </div>
            <button type="button" onClick={() => setDarkMode((d: boolean) => !d)}
              style={{
                width: 52, height: 28, borderRadius: 999,
                background: darkMode ? '#6366f1' : '#e2e8f0',
                border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .25s',
              }}>
              <div style={{
                width: 22, height: 22, borderRadius: 999, background: '#fff',
                position: 'absolute', top: 3, left: darkMode ? 27 : 3,
                transition: 'left .25s', boxShadow: '0 1px 4px rgba(0,0,0,.2)',
              }} />
            </button>
          </div>
          <div style={{ fontSize: 13, color: darkMode ? '#8b5cf6' : '#64748b', marginTop: 8 }}>
            {darkMode ? '🌙 Dark mode is ON — night owl mode activated!' : '☀️ Light mode is ON — bright and clear!'}
          </div>
        </Section>

        {/* Save */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button type="submit" disabled={saving}
            style={{ padding: '10px 24px', background: saving ? '#a5b4fc' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,.35)' }}>
            {saving ? 'Saving...' : '💾 Save Settings'}
          </button>
          {saved && (
            <span style={{ color: '#10b981', fontWeight: 700, fontSize: 14 }}>✓ Saved successfully!</span>
          )}
        </div>
      </form>
    </div>
  );
}
