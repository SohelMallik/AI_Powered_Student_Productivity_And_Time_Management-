/**
 * AI Engine – the "brain" that turns raw data into study advice.
 * It looks at the user's tasks, study sessions, and semester info
 * to compute priority scores, detect procrastination and overdue
 * work, measure focus vs. distraction, and produce plain-English
 * suggestions. `runDailyAIAnalysis` ties it all together and saves
 * a snapshot of the results into the aiInsights.json data file.
 */
// ============================================================
// AI Engine – Core intelligence for study optimization
// ============================================================
const moment = require('moment');
const { readData, updateData } = require('../utils/dataStore');

// ── Priority scoring ─────────────────────────────────────────
/**
 * Calculates a 0–100 priority score for a task so the engine can
 * rank what the student should work on first.
 * The score blends three signals:
 *   - urgency (how close the deadline is) → 50% of the score
 *   - importance (task.weight 1–10)       → 35% of the score
 *   - effort (quick tasks ranked higher)  → 15% of the score
 * @param {Object} task - Task with deadline, weight, estimatedHours.
 * @returns {number} Rounded priority score, 0 (low) to 100 (high).
 */
function calculatePriority(task) {
  const now        = moment();
  const deadline   = moment(task.deadline);
  const daysLeft   = deadline.diff(now, 'hours') / 24;   // deadline distance in fractional days
  // Overdue tasks are maxed out at 100; otherwise urgency drops 5
  // points per remaining day, reaching 0 after 20 days.
  const urgency    = daysLeft <= 0 ? 100 : Math.max(0, 100 - daysLeft * 5);
  const importance = (task.weight || 5) * 10;               // 1-10 scale → 0-100
  const effort     = 100 - (task.estimatedHours || 2) * 5;  // less effort → higher priority slot
  // Weighted average; 0.5 + 0.35 + 0.15 = 1 so the result stays within 0–100.
  return Math.round(urgency * 0.5 + importance * 0.35 + effort * 0.15);
}

// ── Overdue detector ─────────────────────────────────────────
/**
 * Finds tasks whose deadline has already passed but that aren't
 * marked completed.
 * @param {Array<Object>} tasks - All tasks from the data store.
 * @returns {Array<Object>} The incomplete, past-deadline tasks.
 */
function detectOverdueTasks(tasks) {
  const now = moment();
  return tasks.filter(t => !t.completed && moment(t.deadline).isBefore(now));
}

// ── Procrastination detector ──────────────────────────────────
/**
 * A task is considered "procrastinated" when it was created more than
 * PROCRASTINATION_THRESHOLD_MINUTES ago but has no study session logged
 * AND the deadline is within 48 hours.
 *
 * For each such task it computes a 0–100 "procrastination score":
 * the share of required study time that still hasn't been done.
 * @param {Array<Object>} tasks - All tasks from the data store.
 * @param {Array<Object>} studySessions - Logged study sessions.
 * @returns {Array<Object>} Flagged tasks, sorted worst-first
 *   (highest procrastination score first), each with hours left,
 *   minutes studied, and a suggestion message.
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

    // Sum up all minutes already studied for this specific task.
    const taskSessions = studySessions.filter(s => s.taskId === task.id);
    const totalStudied = taskSessions.reduce((sum, s) => sum + (s.duration || 0), 0);

    const createdAge   = now.diff(moment(task.createdAt), 'minutes');
    // Flag the task if the user has done less than 25% of the
    // estimated study time, despite the task sitting around for
    // longer than the procrastination threshold.
    if (createdAge > threshold && totalStudied < (task.estimatedHours || 2) * 0.25 * 60) {
      results.push({
        task,
        hoursLeft,
        totalStudiedMinutes : totalStudied,
        requiredMinutes     : (task.estimatedHours || 2) * 60,
        // Score = % of required time still not studied (100 = nothing done).
        procrastinationScore: Math.round((1 - totalStudied / ((task.estimatedHours || 2) * 60)) * 100),
        suggestion          : generateProcrastinationTip(task, hoursLeft, totalStudied),
      });
    }
  }
  // Worst offenders first so the UI can show the most urgent ones on top.
  return results.sort((a, b) => b.procrastinationScore - a.procrastinationScore);
}

/**
 * Builds a short motivational warning for a procrastinated task.
 * The message gets more urgent the closer the deadline is:
 * under 6h → "start now", under 24h → plan sessions today,
 * otherwise a general nudge with minutes studied.
 * @param {Object} task - The procrastinated task.
 * @param {number} hoursLeft - Hours until the deadline.
 * @param {number} studiedMin - Minutes studied so far.
 * @returns {string} A human-readable suggestion message.
 */
function generateProcrastinationTip(task, hoursLeft, studiedMin) {
  if (hoursLeft < 6)  return `⚠️ CRITICAL: "${task.title}" is due in ${hoursLeft}h. Start NOW with a 25-min focused sprint!`;
  if (hoursLeft < 24) return `🔥 "${task.title}" is due tomorrow. Break it into 3 focused sessions today.`;
  return `📌 You've only studied ${studiedMin} min for "${task.title}". Schedule at least 2 sessions before the deadline.`;
}

// ── Study vs Distraction analyzer ────────────────────────────
/**
 * Measures how focused the user's study time is by comparing total
 * study minutes against total distraction minutes, and breaks the
 * numbers down per subject.
 * @param {Array<Object>} studySessions - Logged study sessions
 *   (each with duration and distractionMinutes in minutes).
 * @returns {{totalStudyMinutes: number, totalDistractionMinutes: number,
 *   focusScore: number, bySubject: Object, verdict: string}}
 *   focusScore is 0–100 (higher = fewer distractions) and verdict
 *   is a short human-readable summary based on that score.
 */
function analyzeStudyVsDistraction(studySessions) {
  const totalStudy       = studySessions.reduce((s, x) => s + (x.duration || 0), 0);
  const distractionBreaks = studySessions.reduce((s, x) => s + (x.distractionMinutes || 0), 0);
  // Focus score = the percentage of study time that was distraction-free.
  // Guarded against division by zero when there are no sessions yet.
  const focusScore       = totalStudy > 0
    ? Math.round(((totalStudy - distractionBreaks) / totalStudy) * 100)
    : 0;

  // Group the same totals per subject so weak subjects stand out.
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
/**
 * Generates today's personalized "what to do now" advice list by
 * combining several rules: remaining daily study goal, the top
 * priority tasks, a Pomodoro nudge if nothing was studied yet,
 * and Friday weekly-planning advice.
 * @param {Array<Object>} tasks - All tasks.
 * @param {Array<Object>} studySessions - All study sessions.
 * @param {Object} userProfile - Settings (studyGoalHours, pomodoroWork, ...).
 * @returns {Array<Object>} Suggestions, each with a type,
 *   a plain-English message, and a priority level
 *   ("critical" | "high" | "medium" | "low").
 */
function suggestTimeOptimization(tasks, studySessions, userProfile) {
  // Rank unfinished tasks by priority (highest score first).
  const prioritized = [...tasks]
    .filter(t => !t.completed)
    .map(t => ({ ...t, priority: calculatePriority(t) }))
    .sort((a, b) => b.priority - a.priority);

  const suggestions = [];

  // Ideal study blocks per day
  // How many minutes are left to reach the user's daily study goal?
  const dailyGoalMin = (userProfile.studyGoalHours || 6) * 60;
  const todaySessions = studySessions.filter(s =>
    moment(s.date).isSame(moment(), 'day')   // only sessions logged today
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
  // Turn the three highest-priority tasks into "task-focus" advice,
  // with a message priority based on their priority score.
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
/**
 * Gives an overall health report for the semester: how many tasks
 * exist, how many are done/overdue/upcoming, the completion rate,
 * per-course breakdowns, and a single "health score".
 * @param {Object} semester - Semester data containing a courses array.
 * @param {Array<Object>} tasks - All tasks (assumed to belong to the semester).
 * @returns {{totalTasks: number, completed: number, overdue: number,
 *   upcoming: number, completionRate: number, courseProgress: Object,
 *   healthScore: number}} healthScore is 0–100, docked 15 points per
 *   overdue task and 2 points per still-unfinished task.
 */
function analyzeSemesterProgress(semester, tasks) {
  const total     = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const overdue   = detectOverdueTasks(tasks).length;
  // "Upcoming" = unfinished tasks due sometime in the next 7 days.
  const upcoming  = tasks.filter(t => {
    const d = moment(t.deadline);
    return !t.completed && d.isAfter(moment()) && d.isBefore(moment().add(7, 'days'));
  }).length;

  // Same completed/overdue stats, but calculated separately for
  // each course so the UI can show which course is behind.
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
    // Health score starts at 100 and loses 15 points per overdue
    // task plus 2 per unfinished task; never drops below 0.
    healthScore: Math.max(0, 100 - overdue * 15 - (total - completed) * 2),
  };
}

// ── Daily AI analysis (cron job) ─────────────────────────────
/**
 * The main daily routine (triggered by the cron job in index.js).
 * Loads all raw data, runs every analyzer above, assembles an
 * "insights" snapshot, and saves it to aiInsights.json — keeping
 * the 30 most recent snapshots so history isn't lost.
 * @returns {Promise<Object>} The full insights object that was saved.
 */
async function runDailyAIAnalysis() {
  // Load all four datasets in parallel (faster than one-by-one).
  const [tasks, studySessions, semester, userProfile] = await Promise.all([
    readData('tasks'),
    readData('studySessions'),
    readData('semester'),
    readData('userProfile'),
  ]);

  const procrastination   = detectProcrastination(tasks, studySessions);
  // Only analyze the 50 most recent sessions to keep the report current.
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
    // Top 10 unfinished tasks ranked by the priority score.
    prioritizedTasks  : tasks
      .filter(t => !t.completed)
      .map(t => ({ ...t, priority: calculatePriority(t) }))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 10),
  };

  // Prepend today's insights to the history and keep only the
  // newest 30 snapshots so the file doesn't grow forever.
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
