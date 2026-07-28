// ============================================================
// Layout Component – Sidebar + Topbar
// ============================================================
import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { authApi } from '@/services/api';
import styles from './Layout.module.css';

const NAV_ITEMS = [
  { path: '/dashboard',   icon: '⊞',  label: 'Dashboard' },
  { path: '/tasks',       icon: '✓',  label: 'Tasks' },
  { path: '/schedule',    icon: '⊙',  label: 'Schedule' },
  { path: '/study',       icon: '⏱', label: 'Study Tracker' },
  { path: '/semester',    icon: '📅', label: 'Semester Planner' },
  { path: '/analytics',   icon: '📊', label: 'Analytics' },
  { path: '/ai-insights', icon: '🤖', label: 'AI Insights' },
  { path: '/settings',    icon: '⚙',  label: 'Settings' },
];

interface LayoutProps { children: React.ReactNode; }

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    authApi.me().then(res => {
      if (res.data?.success) setUser({ username: res.data.data.username });
    }).catch(() => setUser(null));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    try {
      const res = authMode === 'register'
        ? await authApi.register(form)
        : await authApi.login({ username: form.username, password: form.password });

      if (res.data?.success) {
        setUser({ username: res.data.data.username });
        setForm({ username: '', email: '', password: '' });
        setMessage(`${authMode === 'register' ? 'Registered' : 'Logged in'} successfully`);
      }
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Authentication failed');
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setMessage('Logged out');
    }
  };

  return (
    <div className={styles.appShell}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
        <div className={styles.brand}>
          <svg className={styles.brandIcon} viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="16" fill="#3b82d4"/>
            <path d="M10 22 L16 10 L22 22 M13 18 H19" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <span className={styles.brandName}>StudyAI</span>
        </div>

        <nav className={styles.nav}>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.streakBadge}>
            <span>🔥</span>
            <span id="streakCount">0</span> day streak
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        {/* Topbar */}
        <header className={styles.topbar}>
          <button
            className={styles.menuToggle}
            onClick={() => setSidebarOpen(prev => !prev)}
            aria-label="Toggle menu"
          >☰</button>
          <div className={styles.topbarTitle}>AI Student Productivity</div>
          <div className={styles.topbarActions}>
            <button
              className={styles.analyzeBtn}
              onClick={() => navigate('/ai-insights')}
            >🤖 AI Insights</button>
          </div>
        </header>

        {/* Auth Panel */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 16px 0' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: 600 }}>Hello, {user.username}</span>
              <button className={styles.analyzeBtn} onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                placeholder="Username"
                style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
              />
              {authMode === 'register' && (
                <input
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="Email"
                  style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                />
              )}
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Password"
                style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
              />
              <button className={styles.analyzeBtn} type="submit">{authMode === 'register' ? 'Register' : 'Login'}</button>
              <button type="button" className={styles.menuToggle} onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
                {authMode === 'login' ? 'Register' : 'Login'}
              </button>
            </form>
          )}
        </div>
        {message ? <div style={{ padding: '0 16px', color: '#2563eb' }}>{message}</div> : null}

        {/* Page Content */}
        <div className={styles.content}>
          {children}
        </div>
      </main>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}
