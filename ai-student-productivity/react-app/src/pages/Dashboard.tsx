// ============================================================
// Dashboard Page (React/TypeScript)
// ============================================================
import React, { useEffect, useState } from 'react';
import { analyticsApi, aiApi, studyApi, tasksApi } from '@/services/api';
import type { AnalyticsOverview, ProcrastinationItem, Task, TimeSuggestion, UserProfile } from '@/types';
import styles from './Dashboard.module.css';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

function minutesToHM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function priorityColor(score: number): string {
  if (score >= 80) return '#ef4444';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#3b82d4';
  return '#22c55e';
}

export default function Dashboard() {
  const [overview,    setOverview]    = useState<AnalyticsOverview | null>(null);
  const [procs,       setProcs]       = useState<ProcrastinationItem[]>([]);
  const [tasks,       setTasks]       = useState<Task[]>([]);
  const [timeOpts,    setTimeOpts]    = useState<TimeSuggestion[]>([]);
  const [profile,     setProfile]     = useState<UserProfile | null>(null);
  const [todayMin,    setTodayMin]    = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [pomPhase,    setPomPhase]    = useState<'work' | 'break'>('work');
  const [pomElapsed,  setPomElapsed]  = useState(0);
  const [pomRunning,  setPomRunning]  = useState(false);
  const [pomCycles,   setPomCycles]   = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const [ovRes, procRes, taskRes, timeRes, profRes, todayRes] = await Promise.all([
          analyticsApi.overview(),
          aiApi.procrastination(),
          tasksApi.getAll(),
          aiApi.timeOptimization(),
          aiApi.getProfile(),
          studyApi.getToday(),
        ]);
        setOverview(ovRes.data.data);
        setProcs(procRes.data.data || []);
        setTasks((taskRes.data.data || []).filter((t: Task) => !t.completed).slice(0, 5));
        setTimeOpts(timeRes.data.data || []);
        setProfile(profRes.data.data);
        setTodayMin((todayRes.data as any).totalMinutes || 0);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Pomodoro timer
  useEffect(() => {
    if (!pomRunning || !profile) return;
    const tick = setInterval(() => {
      setPomElapsed(prev => {
        const totalSec = (pomPhase === 'work' ? profile.pomodoroWork : profile.pomodoroBreak) * 60;
        if (prev + 1 >= totalSec) {
          setPomPhase(ph => ph === 'work' ? (setPomCycles(c => c + 1), 'break') : 'work');
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [pomRunning, pomPhase, profile]);

  if (loading) return <div className={styles.loading}><div className="spinner" /></div>;

  const goalMin  = (profile?.studyGoalHours || 6) * 60;
  const goalPct  = Math.min(100, Math.round((todayMin / goalMin) * 100));
  const workSec  = (profile?.pomodoroWork || 25) * 60;
  const breakSec = (profile?.pomodoroBreak || 5) * 60;
  const totalSec = pomPhase === 'work' ? workSec : breakSec;
  const remaining = totalSec - pomElapsed;
  const arcPct   = pomElapsed / totalSec;
  const CIRC     = 326.7;

  return (
    <div>
      <h1 className={styles.pageTitle}>Dashboard</h1>

      {/* Stat Cards */}
      <div className={styles.statsGrid}>
        {[
          { icon: '📚', color: '#dbeafe', label: 'Total Tasks',   value: overview?.totalTasks || 0,     sub: `${overview?.completedTasks || 0} completed` },
          { icon: '⏱', color: '#dcfce7', label: 'Study Today',   value: minutesToHM(todayMin),          sub: `Goal: ${minutesToHM(goalMin)}` },
          { icon: '🔥', color: '#ffedd5', label: 'Day Streak',    value: `${overview?.streakDays || 0}d`, sub: 'Keep it up!' },
          { icon: '⚠️', color: '#fee2e2', label: 'Proc Alerts',   value: procs.length,                  sub: 'tasks at risk' },
        ].map((c, i) => (
          <div key={i} className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: c.color }}>{c.icon}</div>
            <div>
              <div className={styles.statLabel}>{c.label}</div>
              <div className={styles.statValue}>{String(c.value)}</div>
              <div className={styles.statSub}>{c.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Goal Progress */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>📈 Today's Study Goal</span>
          <span className={styles.badge} style={{ background: goalPct >= 100 ? '#dcfce7' : '#dbeafe', color: goalPct >= 100 ? '#15803d' : '#1d4ed8' }}>{goalPct}%</span>
        </div>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${goalPct}%`, background: goalPct >= 100 ? '#22c55e' : '#3b82d4' }} />
        </div>
        <div className={styles.progressLabel}>{minutesToHM(todayMin)} of {minutesToHM(goalMin)}</div>
      </div>

      <div className={styles.dashGrid}>
        {/* Left */}
        <div>
          {/* AI Alerts */}
          {procs.length > 0 && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>🚨 AI Procrastination Alerts</span>
                <span className={styles.badge} style={{ background: '#fee2e2', color: '#b91c1c' }}>{procs.length}</span>
              </div>
              {procs.slice(0, 3).map((p, i) => (
                <div key={i} className={styles.alertBanner} style={{ borderLeftColor: p.procrastinationScore > 70 ? '#ef4444' : '#f59e0b', background: p.procrastinationScore > 70 ? '#fee2e2' : '#fef9c3' }}>
                  ⚡ {p.suggestion}
                </div>
              ))}
            </div>
          )}

          {/* Time Optimization */}
          <div className={styles.card}>
            <div className={styles.cardTitle} style={{ marginBottom: 12 }}>💡 AI Time Suggestions</div>
            {timeOpts.slice(0, 4).map((s, i) => (
              <div key={i} className={styles.alertBanner} style={{
                borderLeftColor: s.priority === 'critical' ? '#ef4444' : s.priority === 'high' ? '#f59e0b' : '#3b82d4',
                background: s.priority === 'critical' ? '#fee2e2' : s.priority === 'high' ? '#fef9c3' : '#dbeafe',
              }}>
                {s.priority === 'critical' ? '🚨' : s.priority === 'high' ? '🔶' : '💡'} {s.message}
              </div>
            ))}
            {!timeOpts.length && <p style={{ color: '#718096', fontSize: 13 }}>All optimized! 🎉</p>}
          </div>

          {/* Priority Tasks */}
          <div className={styles.card}>
            <div className={styles.cardTitle} style={{ marginBottom: 12 }}>📋 Priority Tasks</div>
            {tasks.map(task => (
              <div key={task.id} className={styles.taskRow}>
                <div className={styles.taskBar} style={{ background: priorityColor(task.priority) }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{task.title}</div>
                  <div style={{ fontSize: 11, color: '#718096' }}>{task.course} · {task.type}</div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: new Date(task.deadline) < new Date() ? '#ef4444' : '#22c55e' }}>
                  {dayjs(task.deadline).fromNow()}
                </div>
              </div>
            ))}
            {!tasks.length && <p style={{ color: '#718096', fontSize: 13 }}>No pending tasks 🎉</p>}
          </div>
        </div>

        {/* Right – Pomodoro */}
        <div>
          <div className={styles.card}>
            <div className={styles.cardTitle} style={{ marginBottom: 16, textAlign: 'center' }}>⏱ Pomodoro Timer</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 8px' }}>
                <svg viewBox="0 0 120 120" width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                  <circle cx="60" cy="60" r="52" fill="none"
                    stroke={pomPhase === 'work' ? '#ef4444' : '#22c55e'}
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={CIRC}
                    strokeDashoffset={CIRC * (1 - arcPct)} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800 }}>
                  {String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}
                </div>
              </div>
              <div className={styles.pomPhase} style={{ background: pomPhase === 'work' ? '#fee2e2' : '#dcfce7', color: pomPhase === 'work' ? '#b91c1c' : '#15803d' }}>
                {pomPhase.toUpperCase()}
              </div>
              <div style={{ fontSize: 13, color: '#718096', marginBottom: 12 }}>Cycles: {pomCycles}</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button className={styles.btnPrimary} onClick={() => setPomRunning(true)} disabled={pomRunning}>▶ Start</button>
                <button className={styles.btnOutline} onClick={() => { setPomRunning(false); setPomElapsed(0); setPomCycles(0); setPomPhase('work'); }}>■ Stop</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
