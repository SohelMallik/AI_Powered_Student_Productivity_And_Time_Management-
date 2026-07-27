// ============================================================
// Layout Component – Sidebar + Topbar
// ============================================================
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

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
