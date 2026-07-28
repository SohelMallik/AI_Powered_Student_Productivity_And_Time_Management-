// ============================================================
// Dashboard Page  ★ Full Animation + Vivid Colours
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

function priorityGradient(score: number): string {
  if (score >= 80) return 'linear-gradient(135deg,#ef4444,#f97316)';
  if (score >= 60) return 'linear-gradient(135deg,#f59e0b,#fbbf24)';
  if (score >= 40) return 'linear-gradient(135deg,#6366f1,#8b5cf6)';
  return 'linear-gradient(135deg,#10b981,#34d399)';
}

function priorityColor(score: number): string {
  if (score >= 80) return '#ef4444';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#6366f1';
  return '#10b981';
}

export default function Dashboard() {
  const [overview,   setOverview]   = useState<AnalyticsOverview | null>(null);
  const [procs,      setProcs]      = useState<ProcrastinationItem[]>([]);
  const [tasks,      setTasks]      = useState<Task[]>([]);
  const [timeOpts,   setTimeOpts]   = useState<TimeSuggestion[]>([]);
  const [profile,    setProfile]    = useState<UserProfile | null>(null);
  const [todayMin,   setTodayMin]   = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [pomPhase,   setPomPhase]   = useState<'work' | 'break'>('work');
  const [pomElapsed, setPomElapsed] = useState(0);
  const [pomRunning, setPomRunning] = useState(false);
  const [pomCycles,  setPomCycles]  = useState(0);

  useEffect(() => {
    (async () => {
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
    })();
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

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner}/>
        <div className={styles.loadingText}>Loading your dashboard…</div>
      </div>
    );
  }

  const goalMin   = (profile?.studyGoalHours || 6) * 60;
  const goalPct   = Math.min(100, Math.round((todayMin / goalMin) * 100));
  const workSec   = (profile?.pomodoroWork  || 25) * 60;
  const breakSec  = (profile?.pomodoroBreak || 5)  * 60;
  const totalSec  = pomPhase === 'work' ? workSec : breakSec;
  const remaining = totalSec - pomElapsed;
  const arcPct    = pomElapsed / totalSec;
  const CIRC      = 364.4;   // 2π × 58

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  const alertStyle = (priority: string) => {
    if (priority === 'critical') return { bg: 'rgba(239,68,68,.1)', border: '#ef4444', color: '#7f1d1d' };
    if (priority === 'high')     return { bg: 'rgba(245,158,11,.1)', border: '#f59e0b', color: '#78350f' };
    return { bg: 'rgba(99,102,241,.1)', border: '#6366f1', color: '#312e81' };
  };

  return (
    <div className={styles.page}>

      {/* SVG Gradient defs for pomodoro ring */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="rPomWork" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1"/>
            <stop offset="100%" stopColor="#a855f7"/>
          </linearGradient>
          <linearGradient id="rPomBreak" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981"/>
            <stop offset="100%" stopColor="#34d399"/>
          </linearGradient>
        </defs>
      </svg>

      {/* ── Page Title ── */}
      <div className={styles.pageTitle}>
        <span>🎓</span>
        <span>Dashboard</span>
        <span className={styles.pageTitleAccent}>Overview</span>
      </div>

      {/* ── Stat Cards ── */}
      <div className={styles.statsGrid}>
        {[
          { icon:'📚', bg:'linear-gradient(135deg,#e0e7ff,#c7d2fe)', label:'Total Tasks',   value: String(overview?.totalTasks || 0),      sub: `✓ ${overview?.completedTasks || 0} completed`,   subColor:'#10b981' },
          { icon:'⏱',  bg:'linear-gradient(135deg,#d1fae5,#a7f3d0)', label:'Study Today',   value: minutesToHM(todayMin),                   sub: `Goal: ${minutesToHM(goalMin)}`,                  subColor:'#6366f1' },
          { icon:'🔥', bg:'linear-gradient(135deg,#ffedd5,#fed7aa)', label:'Day Streak',    value: `${overview?.streakDays || 0}d`,          sub: 'Keep going! 💪',                                subColor:'#f97316' },
          { icon:'🤖', bg:'linear-gradient(135deg,#f3e8ff,#e9d5ff)', label:'AI Alerts',     value: String(procs.length),                    sub: procs.length ? `${procs.length} need attention` : 'All clear ✓', subColor: procs.length ? '#ef4444' : '#10b981' },
        ].map((c, i) => (
          <div key={i} className={styles.statCard} style={{ animationDelay: `${i * 0.06 + 0.04}s` }}>
            <div className={styles.statIcon} style={{ background: c.bg }}>{c.icon}</div>
            <div className={styles.statInfo}>
              <div className={styles.statLabel}>{c.label}</div>
              <div className={styles.statValue}>{c.value}</div>
              <div className={styles.statSub} style={{ color: c.subColor }}>{c.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Goal Progress ── */}
      <div className={styles.goalCard}>
        <div className={styles.goalHeader}>
          <div>
            <div className={styles.goalTitle}>📈 Today's Study Goal</div>
            <div className={styles.goalSub}>{minutesToHM(todayMin)} completed of {minutesToHM(goalMin)}</div>
          </div>
          <div className={styles.goalBadge}>{goalPct >= 100 ? '🎉 Done!' : `${goalPct}%`}</div>
        </div>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{
              width: `${goalPct}%`,
              background: goalPct >= 100
                ? 'linear-gradient(90deg,#10b981,#34d399)'
                : goalPct >= 50
                  ? 'linear-gradient(90deg,#6366f1,#8b5cf6,#a855f7)'
                  : 'linear-gradient(90deg,#f59e0b,#fbbf24)',
            }}
          />
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className={styles.dashGrid}>

        {/* Left column */}
        <div className={styles.leftCol}>

          {/* AI Alerts */}
          {procs.length > 0 && (
            <div className={styles.card} style={{ animationDelay: '.08s' }}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>🚨 AI Procrastination Alerts</span>
                <span className={styles.badgeRed}>{procs.length}</span>
              </div>
              {procs.slice(0, 3).map((p, i) => {
                const sty = alertStyle(p.procrastinationScore > 70 ? 'critical' : 'high');
                return (
                  <div key={i} className={styles.alertBanner} style={{
                    background: sty.bg,
                    borderLeftColor: sty.border,
                    color: sty.color,
                    animationDelay: `${0.06 + i * 0.07}s`,
                  }}>
                    <span className={styles.alertIcon}>{p.procrastinationScore > 70 ? '🚨' : '🔶'}</span>
                    <span>{p.suggestion}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Time Suggestions */}
          <div className={styles.card} style={{ animationDelay: '.14s' }}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>💡 AI Time Suggestions</span>
            </div>
            {timeOpts.length > 0 ? timeOpts.slice(0, 4).map((s, i) => {
              const sty = alertStyle(s.priority);
              return (
                <div key={i} className={styles.alertBanner} style={{
                  background: sty.bg,
                  borderLeftColor: sty.border,
                  color: sty.color,
                  animationDelay: `${0.07 + i * 0.07}s`,
                }}>
                  <span className={styles.alertIcon}>{s.priority === 'critical' ? '🚨' : s.priority === 'high' ? '🔶' : '💡'}</span>
                  <span>{s.message}</span>
                </div>
              );
            }) : (
              <div className={styles.allClear}>🎉 All optimized — you're on track!</div>
            )}
          </div>

          {/* Priority Tasks */}
          <div className={styles.card} style={{ animationDelay: '.20s' }}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>📋 Priority Tasks</span>
            </div>
            {tasks.length > 0 ? tasks.map((task, i) => (
              <div key={task.id} className={styles.taskRow} style={{ animationDelay: `${i * 0.07}s` }}>
                <div className={styles.taskBar} style={{ background: priorityGradient(task.priority) }}/>
                <div className={styles.taskInfo}>
                  <div className={styles.taskTitle}>{task.title}</div>
                  <div className={styles.taskMeta}>{task.course} · {task.type}</div>
                </div>
                <div
                  className={styles.taskDeadline}
                  style={{ color: new Date(task.deadline) < new Date() ? '#ef4444' : '#10b981' }}
                >
                  {dayjs(task.deadline).fromNow()}
                </div>
              </div>
            )) : (
              <div className={styles.allClear}>✅ No pending tasks — all clear!</div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className={styles.rightCol}>

          {/* Pomodoro */}
          <div className={styles.card} style={{ animationDelay: '.10s' }}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>⏱ Pomodoro Timer</span>
              <span className={styles.badgePhase} style={{
                background: pomRunning
                  ? 'linear-gradient(135deg,#10b981,#34d399)'
                  : 'linear-gradient(135deg,#e0e7ff,#c7d2fe)',
                color: pomRunning ? '#fff' : '#4338ca',
              }}>
                {pomRunning ? '● Active' : 'Ready'}
              </span>
            </div>

            <div className={styles.pomWrap}>
              {/* SVG Ring */}
              <div className={styles.pomRing}>
                <svg viewBox="0 0 136 136" width="136" height="136" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="68" cy="68" r="58" fill="none" stroke="#e0e7ff" strokeWidth="10"/>
                  <circle cx="68" cy="68" r="58" fill="none"
                    stroke={`url(#${pomPhase === 'work' ? 'rPomWork' : 'rPomBreak'})`}
                    strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={CIRC}
                    strokeDashoffset={CIRC * (1 - arcPct)}
                    style={{ transition: 'stroke-dashoffset .7s cubic-bezier(.4,0,.2,1)', filter: 'drop-shadow(0 0 8px rgba(99,102,241,.45))' }}
                  />
                </svg>
                <div className={styles.pomLabel}>{mm}:{ss}</div>
              </div>

              {/* Phase badge */}
              <div className={styles.pomPhase} style={
                pomPhase === 'work'
                  ? { background: 'linear-gradient(135deg,#fee2e2,#fecaca)', color: '#991b1b' }
                  : { background: 'linear-gradient(135deg,#d1fae5,#a7f3d0)', color: '#065f46' }
              }>
                {pomPhase === 'work' ? 'FOCUS' : 'BREAK'}
              </div>

              <div className={styles.pomCycles}>🔁 Cycles: {pomCycles}</div>

              <div className={styles.pomControls}>
                <button
                  className={styles.btnPrimary}
                  onClick={() => setPomRunning(true)}
                  disabled={pomRunning}
                >▶ Start</button>
                <button
                  className={styles.btnOutline}
                  onClick={() => { setPomRunning(false); setPomElapsed(0); setPomCycles(0); setPomPhase('work'); }}
                >■ Stop</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
