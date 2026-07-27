// ============================================================
// AI Engine – Core intelligence for study optimization
// ============================================================
const moment = require('moment');
const { readData, updateData } = require('../utils/dataStore');

// ── Priority scoring ─────────────────────────────────────────
function calculatePriority(task) {
  const now        = moment();
  const deadline   = moment(task.deadline);
  const daysLeft   = deadline.diff(now, 'hours') / 24;
  const urgency    = daysLeft <= 0 ? 100 : Math.max(0, 100 - daysLeft * 5);
  const importance = (task.weight || 5) * 10;               // 1-10 scale → 0-100
  const effort     = 100 - (task.estimatedHours || 2) * 5;  // less effort → higher priority slot
  return Math.round(urgency * 0.5 + importance * 0.35 + effort * 0.15);
}

// ── Overdue detector ─────────────────────────────────────────
function detectOverdueTasks(tasks) {
  const now = moment();
  return tasks.filter(t => !t.completed && moment(t.deadline).isBefore(now));
}

// ── Procrastination detector ──────────────────────────────────
/**
 * A task is considered "procrastinated" when it was created more than
 * PROCRASTINATION_THRESHOLD_MINUTES ago but has no study session logged
 * AND the deadline is within 48 hours.
 */
function detectProcrastination(tasks, studySessions) {
  const threshold = parseInt(process.env.PROCRASTINATION_THRESHOLD_MINUTES || 30);
  const now       = moment();
  const results   = [];

  for (const task of tasks) {
    if (task.completed) continue;
    const deadline   = moment(task.deadline);
    const hoursLeft  = deadline.diff(now, 'hours');
    if (hoursLeft > 48) continue;                          // not urgent yet

    const taskSessions = studySessions.filter(s => s.taskId === task.id);
    const totalStudied = taskSessions.reduce((sum, s) => sum + (s.duration || 0), 0);

    const createdAge   = now.diff(moment(task.createdAt), 'minutes');
    if (createdAge > threshold && totalStudied < (task.estimatedHours || 2) * 0.25 * 60) {
      results.push({
        task,
        hoursLeft,
        totalStudiedMinutes : totalStudied,
        requiredMinutes     : (task.estimatedHours || 2) * 60,
        procrastinationScore: Math.round((1 - totalStudied / ((task.estimatedHours || 2) * 60)) * 100),
        suggestion          : generateProcrastinationTip(task, hoursLeft, totalStudied),
      });
    }
  }
  return results.sort((a, b) => b.procrastinationScore - a.procrastinationScore);
}

function generateProcrastinationTip(task, hoursLeft, studiedMin) {
  if (hoursLeft < 6)  return `⚠️ CRITICAL: "${task.title}" is due in ${hoursLeft}h. Start NOW with a 25-min focused sprint!`;
  if (hoursLeft < 24) return `🔥 "${task.title}" is due tomorrow. Break it into 3 focused sessions today.`;
  return `📌 You've only studied ${studiedMin} min for "${task.title}". Schedule at least 2 sessions before the deadline.`;
}

// ── Study vs Distraction analyzer ────────────────────────────
function analyzeStudyVsDistraction(studySessions) {
  const totalStudy       = studySessions.reduce((s, x) => s + (x.duration || 0), 0);
  const distractionBreaks = studySessions.reduce((s, x) => s + (x.distractionMinutes || 0), 0);
  const focusScore       = totalStudy > 0
    ? Math.round(((totalStudy - distractionBreaks) / totalStudy) * 100)
    : 0;

  const bySubject = {};
  for (const s of studySessions) {
    const sub = s.subject || 'General';
    if (!bySubject[sub]) bySubject[sub] = { study: 0, distraction: 0 };
    bySubject[sub].study       += s.duration || 0;
    bySubject[sub].distraction += s.distractionMinutes || 0;
  }

  return {
    totalStudyMinutes      : totalStudy,
    totalDistractionMinutes: distractionBreaks,
    focusScore,
    bySubject,
    verdict: focusScore >= 80 ? '🌟 Excellent focus!'
           : focusScore >= 60 ? '👍 Good – minor distractions'
           : focusScore >= 40 ? '⚠️ Moderate distraction – try Pomodoro'
           : '🚨 High distraction – consider a study-only environment',
  };
}

// ── Time optimization suggester ───────────────────────────────
function suggestTimeOptimization(tasks, studySessions, userProfile) {
  const prioritized = [...tasks]
    .filter(t => !t.completed)
    .map(t => ({ ...t, priority: calculatePriority(t) }))
    .sort((a, b) => b.priority - a.priority);

  const suggestions = [];

  // Ideal study blocks per day
  const dailyGoalMin = (userProfile.studyGoalHours || 6) * 60;
  const todaySessions = studySessions.filter(s =>
    moment(s.date).isSame(moment(), 'day')
  );
  const studiedToday = todaySessions.reduce((s, x) => s + (x.duration || 0), 0);
  const remaining    = dailyGoalMin - studiedToday;

  if (remaining > 0) {
    suggestions.push({
      type: 'daily-goal',
      message: `You need ${remaining} more minutes today to hit your ${userProfile.studyGoalHours}h goal.`,
      priority: 'high',
    });
  }

  // Top 3 tasks to work on
  prioritized.slice(0, 3).forEach((task, i) => {
    const deadline = moment(task.deadline);
    suggestions.push({
      type    : 'task-focus',
      message : `[#${i + 1}] Focus on "${task.title}" – due ${deadline.fromNow()}, priority score ${task.priority}`,
      priority: task.priority > 70 ? 'critical' : task.priority > 40 ? 'high' : 'medium',
    });
  });

  // Pomodoro recommendation
  if (studiedToday === 0) {
    suggestions.push({
      type    : 'pomodoro',
      message : `Start with a ${userProfile.pomodoroWork || 25}-min Pomodoro session right now!`,
      priority: 'medium',
    });
  }

  // Weekend buffer advice
  if (moment().day() === 5) { // Friday
    suggestions.push({
      type    : 'planning',
      message : 'It\'s Friday! Plan next week\'s study sessions now to avoid Sunday panic.',
      priority: 'low',
    });
  }

  return suggestions;
}

// ── Semester progress ─────────────────────────────────────────
function analyzeSemesterProgress(semester, tasks) {
  const total     = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const overdue   = detectOverdueTasks(tasks).length;
  const upcoming  = tasks.filter(t => {
    const d = moment(t.deadline);
    return !t.completed && d.isAfter(moment()) && d.isBefore(moment().add(7, 'days'));
  }).length;

  const courseProgress = {};
  for (const course of (semester.courses || [])) {
    const courseTasks = tasks.filter(t => t.course === course.name);
    courseProgress[course.name] = {
      total    : courseTasks.length,
      completed: courseTasks.filter(t => t.completed).length,
      overdue  : courseTasks.filter(t => !t.completed && moment(t.deadline).isBefore(moment())).length,
    };
  }

  return {
    totalTasks: total,
    completed,
    overdue,
    upcoming,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    courseProgress,
    healthScore: Math.max(0, 100 - overdue * 15 - (total - completed) * 2),
  };
}

// ── Daily AI analysis (cron job) ─────────────────────────────
async function runDailyAIAnalysis() {
  const [tasks, studySessions, semester, userProfile] = await Promise.all([
    readData('tasks'),
    readData('studySessions'),
    readData('semester'),
    readData('userProfile'),
  ]);

  const procrastination   = detectProcrastination(tasks, studySessions);
  const distractionReport = analyzeStudyVsDistraction(studySessions.slice(-50));
  const timeOptimization  = suggestTimeOptimization(tasks, studySessions, userProfile);
  const semesterProgress  = analyzeSemesterProgress(semester, tasks);

  const insights = {
    generatedAt       : new Date().toISOString(),
    procrastination,
    distractionReport,
    timeOptimization,
    semesterProgress,
    overdueTasks      : detectOverdueTasks(tasks),
    prioritizedTasks  : tasks
      .filter(t => !t.completed)
      .map(t => ({ ...t, priority: calculatePriority(t) }))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 10),
  };

  await updateData('aiInsights', current => ({
    ...current,
    lastAnalyzed: insights.generatedAt,
    suggestions : [insights, ...(current.suggestions || [])].slice(0, 30),
  }));

  return insights;
}

module.exports = {
  calculatePriority,
  detectOverdueTasks,
  detectProcrastination,
  analyzeStudyVsDistraction,
  suggestTimeOptimization,
  analyzeSemesterProgress,
  runDailyAIAnalysis,
};
