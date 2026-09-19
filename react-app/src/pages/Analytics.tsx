// ============================================================
// Analytics Page – weekly study charts + productivity trend
// ============================================================
import { useEffect, useState } from 'react';
import { analyticsApi, studyApi } from '@/services/api';
import type { AnalyticsOverview, DailyLog, DistractionAnalysis } from '@/types';
import dayjs from 'dayjs';

function minutesToHM(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const BAR_COLORS = ['#6366f1','#8b5cf6','#a855f7','#ec4899','#f59e0b','#10b981','#3b82f6'];

function BarChart({ data, maxVal, color = '#6366f1' }: { data: { label: string; value: number }[]; maxVal: number; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120, padding: '0 4px' }}>
      {data.map((d, i) => {
        const pct = maxVal > 0 ? (d.value / maxVal) * 100 : 0;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>{d.value > 0 ? minutesToHM(d.value) : ''}</span>
            <div style={{ width: '100%', height: `${Math.max(pct, 2)}%`, background: color, borderRadius: '4px 4px 0 0', minHeight: 4, transition: 'height .4s cubic-bezier(.4,0,.2,1)' }} />
            <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Analytics() {
  const [overview,    setOverview]    = useState<AnalyticsOverview | null>(null);
  const [weekly,      setWeekly]      = useState<DailyLog[]>([]);
  const [analysis,    setAnalysis]    = useState<DistractionAnalysis | null>(null);
  const [trend,       setTrend]       = useState<{ date: string; avgProductivity: string | null; dominantMood: string | null }[]>([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [ovRes, wkRes, anRes, trRes] = await Promise.all([
          analyticsApi.overview(),
          analyticsApi.weekly(),
          studyApi.getAnalysis(),
          analyticsApi.productivityTrend(),
        ]);
        setOverview(ovRes.data.data);
        setWeekly(wkRes.data.data || []);
        setAnalysis(anRes.data.data);
        setTrend((trRes.data as any).data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 48 }}><div className="spinner" /></div>;
  }

  const last7 = weekly.slice(-7);
  const maxStudy = Math.max(...last7.map(d => d.studyMinutes), 60);

  const studyChartData = last7.map(d => ({
    label: dayjs(d.date).format('ddd'),
    value: d.studyMinutes,
  }));

  const focusPct = analysis?.focusScore || 0;
  const focusColor = focusPct >= 80 ? '#10b981' : focusPct >= 60 ? '#f59e0b' : '#ef4444';

  const moodEmoji: Record<string, string> = {
    happy: '😊', neutral: '😐', tired: '😴', stressed: '😰',
  };

  const subjectEntries = Object.entries(analysis?.bySubject || {});

  return (
    <div>
      <div style={{ fontSize: 26, fontWeight: 900, color: '#1a202c', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span>📊</span><span>Analytics</span>
        <span style={{ background: 'linear-gradient(90deg,#6366f1,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: 26, fontWeight: 900 }}>Dashboard</span>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Study Time', value: minutesToHM(overview?.totalStudyMinutes || 0), icon: '⏱', bg: '#e0e7ff', color: '#4338ca' },
          { label: 'Avg Daily',        value: minutesToHM(overview?.avgDailyMinutes || 0),   icon: '📅', bg: '#d1fae5', color: '#065f46' },
          { label: 'Streak',           value: `${overview?.streakDays || 0} days`,           icon: '🔥', bg: '#ffedd5', color: '#c2410c' },
          { label: 'Focus Score',      value: `${focusPct}%`,                                icon: '🎯', bg: focusPct >= 70 ? '#d1fae5' : '#fee2e2', color: focusColor },
          { label: 'Tasks Done',       value: `${overview?.completedTasks || 0}/${overview?.totalTasks || 0}`, icon: '✅', bg: '#f3e8ff', color: '#7c3aed' },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, borderRadius: 16, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: .8 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Study Time Chart */}
        <div style={{ background: '#fff', border: '1.5px solid #e0e7ff', borderRadius: 18, padding: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#1a202c', marginBottom: 4 }}>📈 Study Time — Last 7 Days</div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Daily study minutes visualized</div>
          {last7.length > 0 ? (
            <BarChart data={studyChartData} maxVal={maxStudy} color="#6366f1" />
          ) : (
            <div style={{ textAlign: 'center', color: '#9ca3af', padding: 24 }}>No data yet</div>
          )}
        </div>

        {/* Focus Gauge */}
        <div style={{ background: '#fff', border: '1.5px solid #e0e7ff', borderRadius: 18, padding: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#1a202c', marginBottom: 4 }}>🎯 Focus Score</div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>Study vs distraction ratio</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 16px' }}>
              <svg viewBox="0 0 120 120" width="120" height="120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#e0e7ff" strokeWidth="12" />
                <circle cx="60" cy="60" r="50" fill="none" stroke={focusColor}
                  strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - focusPct / 100)}`}
                  style={{ transform: 'rotate(-90deg)', transformOrigin: '60px 60px', transition: 'stroke-dashoffset .7s' }}
                />
                <text x="60" y="65" textAnchor="middle" fontSize="22" fontWeight="900" fill={focusColor}>{focusPct}%</text>
              </svg>
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, color: focusColor }}>{analysis?.verdict}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 14, fontSize: 12, color: '#64748b' }}>
              <span>📚 Study: {minutesToHM(analysis?.totalStudyMinutes || 0)}</span>
              <span>📱 Distraction: {minutesToHM(analysis?.totalDistractionMinutes || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* By Subject */}
      {subjectEntries.length > 0 && (
        <div style={{ background: '#fff', border: '1.5px solid #e0e7ff', borderRadius: 18, padding: 22, marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#1a202c', marginBottom: 16 }}>📚 Study Time by Subject</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {subjectEntries.sort((a, b) => b[1].study - a[1].study).map(([subject, d], i) => {
              const total = d.study + (d.distraction || 0);
              const focusPct2 = total > 0 ? Math.round((d.study / total) * 100) : 100;
              return (
                <div key={subject}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                    <span style={{ fontWeight: 700 }}>{subject}</span>
                    <span style={{ color: '#64748b' }}>{minutesToHM(d.study)} · {focusPct2}% focus</span>
                  </div>
                  <div style={{ height: 8, background: '#f1f5f9', borderRadius: 999 }}>
                    <div style={{ height: 8, width: `${Math.min(100, d.study / 60)}%`, background: BAR_COLORS[i % BAR_COLORS.length], borderRadius: 999, maxWidth: '100%', minWidth: 4 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Productivity Trend */}
      {trend.length > 0 && (
        <div style={{ background: '#fff', border: '1.5px solid #e0e7ff', borderRadius: 18, padding: 22, marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#1a202c', marginBottom: 16 }}>📉 Productivity Trend (Last 30 days)</div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8 }}>
            {trend.slice(-21).map((t, i) => {
              const p = t.avgProductivity ? parseFloat(t.avgProductivity) : 0;
              const h = p > 0 ? Math.round(p * 10) : 4;
              const col = p >= 8 ? '#10b981' : p >= 5 ? '#f59e0b' : p > 0 ? '#ef4444' : '#e5e7eb';
              return (
                <div key={i} title={`${t.date}: ${t.avgProductivity || 'n/a'} · ${t.dominantMood ? moodEmoji[t.dominantMood] || t.dominantMood : ''}`}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'default', minWidth: 28 }}>
                  <div style={{ width: 20, height: `${h}px`, background: col, borderRadius: 4, transition: 'height .4s' }} />
                  <span style={{ fontSize: 14 }}>{t.dominantMood ? (moodEmoji[t.dominantMood] || '') : ''}</span>
                  <span style={{ fontSize: 9, color: '#9ca3af', transform: 'rotate(-45deg)', transformOrigin: 'center', display: 'block', whiteSpace: 'nowrap', width: 28, textAlign: 'center' }}>
                    {dayjs(t.date).format('M/D')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Weekly Study Distraction comparison */}
      {last7.length > 0 && (
        <div style={{ background: '#fff', border: '1.5px solid #e0e7ff', borderRadius: 18, padding: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#1a202c', marginBottom: 16 }}>📅 Study vs Distraction — Last 7 Days</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {last7.map((d) => {
              const total = d.studyMinutes + (d.distractionMinutes || 0);
              const studyPct = total > 0 ? Math.round((d.studyMinutes / total) * 100) : 100;
              return (
                <div key={d.date}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700 }}>{dayjs(d.date).format('ddd, MMM D')}</span>
                    <span style={{ color: '#64748b' }}>{minutesToHM(d.studyMinutes)} study · {minutesToHM(d.distractionMinutes || 0)} distraction</span>
                  </div>
                  <div style={{ height: 10, background: '#fee2e2', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: 10, width: `${studyPct}%`, background: 'linear-gradient(90deg,#6366f1,#10b981)', borderRadius: 999, transition: 'width .4s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
