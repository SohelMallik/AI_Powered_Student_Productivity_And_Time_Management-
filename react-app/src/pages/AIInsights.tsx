// ============================================================
// AI Insights Page – full analysis view
// ============================================================
import { useEffect, useState } from 'react';
import { aiApi } from '@/services/api';
import type { ProcrastinationItem, TimeSuggestion, SemesterProgress, DistractionAnalysis } from '@/types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

function minutesToHM(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function AIInsights() {
  const [procs,       setProcs]       = useState<ProcrastinationItem[]>([]);
  const [timeOpts,    setTimeOpts]    = useState<TimeSuggestion[]>([]);
  const [semProg,     setSemProg]     = useState<SemesterProgress | null>(null);
  const [distraction, setDistraction] = useState<DistractionAnalysis | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [analyzing,   setAnalyzing]   = useState(false);
  const [lastRun,     setLastRun]     = useState<string | null>(null);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const [procRes, timeRes, semRes, distRes, insRes] = await Promise.all([
        aiApi.procrastination(),
        aiApi.timeOptimization(),
        aiApi.semesterProgress(),
        aiApi.distractionAnalysis(),
        aiApi.insights(),
      ]);
      setProcs(procRes.data.data || []);
      setTimeOpts(timeRes.data.data || []);
      setSemProg(semRes.data.data || null);
      setDistraction(distRes.data.data || null);
      setLastRun((insRes.data as any)?.data?.lastAnalyzed || null);
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      await aiApi.analyze();
      await loadInsights();
    } finally { setAnalyzing(false); }
  };

  useEffect(() => { loadInsights(); }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 48 }}><div className="spinner" /></div>;

  const focusPct = distraction?.focusScore || 0;
  const focusColor = focusPct >= 80 ? '#10b981' : focusPct >= 60 ? '#f59e0b' : '#ef4444';

  const alertStyle = (score: number) => {
    if (score > 70) return { bg: 'rgba(239,68,68,.08)', border: '#ef4444', color: '#7f1d1d' };
    return { bg: 'rgba(245,158,11,.08)', border: '#f59e0b', color: '#78350f' };
  };

  const suggStyle = (priority: string) => {
    if (priority === 'critical') return { bg: 'rgba(239,68,68,.08)', border: '#ef4444', icon: '🚨' };
    if (priority === 'high')     return { bg: 'rgba(245,158,11,.08)', border: '#f59e0b', icon: '🔶' };
    if (priority === 'medium')   return { bg: 'rgba(99,102,241,.08)', border: '#6366f1', icon: '💡' };
    return                              { bg: 'rgba(16,185,129,.08)', border: '#10b981', icon: '✅' };
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: 26, fontWeight: 900, color: '#1a202c', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>🤖</span><span>AI</span>
          <span style={{ background: 'linear-gradient(90deg,#6366f1,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Insights</span>
        </div>
        <button onClick={runAnalysis} disabled={analyzing}
          style={{ padding: '9px 20px', background: analyzing ? '#a5b4fc' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,.35)' }}>
          {analyzing ? '⏳ Analyzing...' : '🔄 Run Analysis'}
        </button>
      </div>
      {lastRun && <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 24 }}>Last analyzed: {dayjs(lastRun).fromNow()}</div>}

      {/* Summary Score Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'AI Alerts',     value: procs.length,                       icon: '🚨', bg: procs.length > 0 ? '#fee2e2' : '#dcfce7', color: procs.length > 0 ? '#b91c1c' : '#15803d' },
          { label: 'Suggestions',   value: timeOpts.length,                    icon: '💡', bg: '#fef9c3', color: '#854d0e' },
          { label: 'Focus Score',   value: `${focusPct}%`,                     icon: '🎯', bg: focusPct >= 70 ? '#dcfce7' : '#fee2e2', color: focusColor },
          { label: 'Semester Health',value: `${semProg?.healthScore ?? '--'}`, icon: '🎓', bg: (semProg?.healthScore || 0) >= 70 ? '#dcfce7' : '#fee2e2', color: (semProg?.healthScore || 0) >= 70 ? '#15803d' : '#b91c1c' },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 26 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: .8 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Procrastination Alerts */}
      <div style={{ background: '#fff', border: '1.5px solid #e0e7ff', borderRadius: 18, padding: 22, marginBottom: 20 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: '#1a202c', marginBottom: 16 }}>🚨 Procrastination Detector</div>
        {procs.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#10b981', fontWeight: 700, padding: 16 }}>🎉 No procrastination detected — you're on track!</div>
        ) : procs.map((p, i) => {
          const sty = alertStyle(p.procrastinationScore);
          return (
            <div key={i} style={{ background: sty.bg, borderLeft: `4px solid ${sty.border}`, borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontWeight: 800, fontSize: 14, color: sty.color }}>{p.task.title}</span>
                <span style={{ background: sty.bg, color: sty.color, border: `1px solid ${sty.border}`, borderRadius: 999, padding: '2px 10px', fontSize: 12, fontWeight: 800 }}>
                  Score: {p.procrastinationScore}
                </span>
              </div>
              <div style={{ fontSize: 13, color: sty.color, marginBottom: 8 }}>{p.suggestion}</div>
              <div style={{ display: 'flex', gap: 14, fontSize: 12, color: sty.color, opacity: .8 }}>
                <span>⏰ {p.hoursLeft}h left</span>
                <span>📖 Studied: {minutesToHM(p.totalStudiedMinutes)}</span>
                <span>🎯 Required: {minutesToHM(p.requiredMinutes)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Time Optimization Suggestions */}
      <div style={{ background: '#fff', border: '1.5px solid #e0e7ff', borderRadius: 18, padding: 22, marginBottom: 20 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: '#1a202c', marginBottom: 16 }}>⚡ Time Optimization Suggestions</div>
        {timeOpts.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#10b981', fontWeight: 700, padding: 16 }}>✅ All optimized — great job!</div>
        ) : timeOpts.map((s, i) => {
          const sty = suggStyle(s.priority);
          return (
            <div key={i} style={{ background: sty.bg, borderLeft: `4px solid ${sty.border}`, borderRadius: 12, padding: '12px 16px', marginBottom: 10, display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13 }}>
              <span style={{ fontSize: 16 }}>{sty.icon}</span>
              <span style={{ fontWeight: 600, color: '#374151' }}>{s.message}</span>
            </div>
          );
        })}
      </div>

      {/* Distraction Analysis */}
      {distraction && (
        <div style={{ background: '#fff', border: '1.5px solid #e0e7ff', borderRadius: 18, padding: 22, marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#1a202c', marginBottom: 16 }}>📱 Distraction Analysis</div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, background: '#e0e7ff', borderRadius: 12, padding: '14px 18px', textAlign: 'center', minWidth: 100 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#4338ca' }}>{minutesToHM(distraction.totalStudyMinutes)}</div>
              <div style={{ fontSize: 11, color: '#4338ca', fontWeight: 600 }}>STUDY TIME</div>
            </div>
            <div style={{ flex: 1, background: '#fee2e2', borderRadius: 12, padding: '14px 18px', textAlign: 'center', minWidth: 100 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#b91c1c' }}>{minutesToHM(distraction.totalDistractionMinutes)}</div>
              <div style={{ fontSize: 11, color: '#b91c1c', fontWeight: 600 }}>DISTRACTION</div>
            </div>
            <div style={{ flex: 1, background: focusPct >= 70 ? '#dcfce7' : '#fee2e2', borderRadius: 12, padding: '14px 18px', textAlign: 'center', minWidth: 100 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: focusColor }}>{focusPct}%</div>
              <div style={{ fontSize: 11, color: focusColor, fontWeight: 600 }}>FOCUS SCORE</div>
            </div>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#374151', padding: '10px 14px', background: '#f8faff', borderRadius: 10 }}>
            {distraction.verdict}
          </div>
        </div>
      )}

      {/* Semester Progress */}
      {semProg && (
        <div style={{ background: '#fff', border: '1.5px solid #e0e7ff', borderRadius: 18, padding: 22, marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#1a202c', marginBottom: 16 }}>🎓 Semester Progress</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Total Tasks',    value: semProg.totalTasks,      color: '#6366f1', bg: '#e0e7ff' },
              { label: 'Completed',      value: semProg.completed,       color: '#15803d', bg: '#dcfce7' },
              { label: 'Overdue',        value: semProg.overdue,         color: '#b91c1c', bg: '#fee2e2' },
              { label: 'Due This Week',  value: semProg.upcoming,        color: '#854d0e', bg: '#fef9c3' },
              { label: 'Completion',     value: `${semProg.completionRate}%`, color: '#7c3aed', bg: '#f3e8ff' },
            ].map((s, i) => (
              <div key={i} style={{ background: s.bg, borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {/* Health bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ fontWeight: 700 }}>Semester Health Score</span>
              <span style={{ fontWeight: 700, color: semProg.healthScore >= 70 ? '#15803d' : '#b91c1c' }}>{semProg.healthScore}/100</span>
            </div>
            <div style={{ height: 10, background: '#f1f5f9', borderRadius: 999 }}>
              <div style={{ height: 10, width: `${semProg.healthScore}%`, background: semProg.healthScore >= 70 ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,#ef4444,#f97316)', borderRadius: 999, transition: 'width .6s' }} />
            </div>
          </div>
          {/* Course breakdown */}
          {Object.keys(semProg.courseProgress).length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: '#64748b' }}>COURSE BREAKDOWN</div>
              {Object.entries(semProg.courseProgress).map(([course, cp]) => (
                <div key={course} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 3 }}>
                    <span style={{ fontWeight: 700 }}>{course}</span>
                    <span style={{ color: '#64748b' }}>{cp.completed}/{cp.total} · {cp.overdue > 0 ? `${cp.overdue} overdue` : 'on track ✓'}</span>
                  </div>
                  <div style={{ height: 6, background: '#f1f5f9', borderRadius: 999 }}>
                    <div style={{ height: 6, width: `${cp.total > 0 ? (cp.completed / cp.total) * 100 : 0}%`, background: '#6366f1', borderRadius: 999, transition: 'width .5s' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
