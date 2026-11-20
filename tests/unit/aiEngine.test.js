// ============================================================
// Tests: AI Engine – Unit Tests
// ============================================================
/**
 * aiEngine.test.js — unit tests for the AI engine service.
 *
 * Each `describe` block below tests one exported function from
 * `server/services/aiEngine.js`. The tests feed in small, hand-made
 * inputs (fake tasks, sessions, profiles) and check that the AI
 * scoring/detection logic returns the expected numbers and shapes.
 * No server or data files are touched — these are pure logic tests.
 */
const {
  calculatePriority,
  detectOverdueTasks,
  detectProcrastination,
  analyzeStudyVsDistraction,
  suggestTimeOptimization,
  analyzeSemesterProgress,
} = require('../../server/services/aiEngine');

// ── calculatePriority ─────────────────────────────────────────
// Tests the function that scores how urgent a task is (0–100)
// based on its deadline, weight, and estimated effort.
describe('calculatePriority', () => {
  test('returns 100 for severely overdue high-weight task', () => {
    // A task due 7 days ago with maximum weight (10) should score
    // very high — 80 is the threshold the UI treats as "critical".
    const task = {
      deadline       : new Date(Date.now() - 7 * 24 * 3600_000).toISOString(),
      weight         : 10,
      estimatedHours : 1,
    };
    const score = calculatePriority(task);
    expect(score).toBeGreaterThanOrEqual(80);
  });

  test('returns lower score for distant deadline', () => {
    // A low-weight task due 30 days out shouldn't be prioritized
    // over more urgent work, so its score stays below 60.
    const task = {
      deadline       : new Date(Date.now() + 30 * 24 * 3600_000).toISOString(),
      weight         : 3,
      estimatedHours : 5,
    };
    const score = calculatePriority(task);
    expect(score).toBeLessThan(60);
  });

  test('returns a number between 0 and 100', () => {
    // Sanity check: even with typical inputs the score must stay
    // within the 0–100 range so the UI can display it as a percent.
    const task = {
      deadline       : new Date(Date.now() + 24 * 3600_000).toISOString(),
      weight         : 5,
      estimatedHours : 2,
    };
    const score = calculatePriority(task);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

// ── detectOverdueTasks ────────────────────────────────────────
// Tests the function that finds tasks past their deadline.
// Sample set: one overdue, one not-yet-due, one overdue but completed.
describe('detectOverdueTasks', () => {
  // Shared fixture used by both tests in this block.
  const tasks = [
    { id: '1', title: 'Past',   deadline: new Date(Date.now() - 3600_000).toISOString(), completed: false },
    { id: '2', title: 'Future', deadline: new Date(Date.now() + 3600_000).toISOString(), completed: false },
    { id: '3', title: 'Done',   deadline: new Date(Date.now() - 3600_000).toISOString(), completed: true },
  ];

  test('returns only incomplete overdue tasks', () => {
    // Only the "Past" task (id 1) is both overdue and incomplete.
    const overdue = detectOverdueTasks(tasks);
    expect(overdue).toHaveLength(1);
    expect(overdue[0].id).toBe('1');
  });

  test('excludes completed tasks even if deadline passed', () => {
    // Task 3 is overdue but already done, so it must not be flagged.
    const overdue = detectOverdueTasks(tasks);
    const ids = overdue.map(t => t.id);
    expect(ids).not.toContain('3');
  });
});

// ── detectProcrastination ─────────────────────────────────────
// Tests the function that flags tasks the student is likely putting
// off: urgent (due within 48h) with little or no study time logged.
describe('detectProcrastination', () => {
  test('flags task with deadline < 48h and no study sessions', () => {
    // Lower the threshold to 0 so any task without logged study
    // minutes counts as procrastination in this test.
    process.env.PROCRASTINATION_THRESHOLD_MINUTES = '0';
    const tasks = [{
      id            : 'task-1',
      title         : 'Urgent Assignment',
      deadline      : new Date(Date.now() + 20 * 3600_000).toISOString(),
      estimatedHours: 4,
      completed     : false,
      createdAt     : new Date(Date.now() - 3600_000).toISOString(),
    }];
    const result = detectProcrastination(tasks, []);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].task.id).toBe('task-1');
    expect(result[0].procrastinationScore).toBeGreaterThan(0);
  });

  test('does not flag tasks due more than 48h away', () => {
    // A task due in 5 days isn't urgent yet, so no warning is expected.
    const tasks = [{
      id            : 'task-2',
      title         : 'Future Task',
      deadline      : new Date(Date.now() + 5 * 24 * 3600_000).toISOString(),
      estimatedHours: 2,
      completed     : false,
      createdAt     : new Date(Date.now() - 3600_000).toISOString(),
    }];
    const result = detectProcrastination(tasks, []);
    expect(result).toHaveLength(0);
  });

  test('does not flag completed tasks', () => {
    // Even with a near deadline, a finished task can't be procrastinated on.
    const tasks = [{
      id            : 'task-3',
      title         : 'Done Task',
      deadline      : new Date(Date.now() + 10 * 3600_000).toISOString(),
      estimatedHours: 2,
      completed     : true,
      createdAt     : new Date(Date.now() - 3600_000).toISOString(),
    }];
    const result = detectProcrastination(tasks, []);
    expect(result).toHaveLength(0);
  });
});

// ── analyzeStudyVsDistraction ─────────────────────────────────
describe('analyzeStudyVsDistraction', () => {
  test('calculates correct focus score', () => {
    const sessions = [
      { subject: 'Math',    duration: 60, distractionMinutes: 10 },
      { subject: 'Physics', duration: 40, distractionMinutes: 5  },
    ];
    const result = analyzeStudyVsDistraction(sessions);
    expect(result.totalStudyMinutes).toBe(100);
    expect(result.totalDistractionMinutes).toBe(15);
    expect(result.focusScore).toBe(85);
    expect(result.bySubject['Math']).toBeDefined();
    expect(result.bySubject['Physics']).toBeDefined();
  });

  test('returns focusScore 0 with no sessions', () => {
    const result = analyzeStudyVsDistraction([]);
    expect(result.focusScore).toBe(0);
    expect(result.totalStudyMinutes).toBe(0);
  });

  test('verdict is "Excellent focus" for high score', () => {
    const sessions = [{ subject: 'Math', duration: 100, distractionMinutes: 5 }];
    const result = analyzeStudyVsDistraction(sessions);
    expect(result.verdict).toMatch(/Excellent/i);
  });

  test('verdict warns about high distraction for low score', () => {
    const sessions = [{ subject: 'Math', duration: 100, distractionMinutes: 80 }];
    const result = analyzeStudyVsDistraction(sessions);
    expect(result.focusScore).toBeLessThan(40);
  });
});

// ── suggestTimeOptimization ───────────────────────────────────
describe('suggestTimeOptimization', () => {
  const profile = { studyGoalHours: 6, pomodoroWork: 25, pomodoroBreak: 5 };

  test('returns suggestions array', () => {
    const tasks = [{
      id            : 't1',
      title         : 'Test',
      deadline      : new Date(Date.now() + 3600_000).toISOString(),
      weight        : 8,
      estimatedHours: 2,
      completed     : false,
    }];
    const result = suggestTimeOptimization(tasks, [], profile);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test('each suggestion has type, message, priority', () => {
    const result = suggestTimeOptimization([], [], profile);
    result.forEach(s => {
      expect(s).toHaveProperty('type');
      expect(s).toHaveProperty('message');
      expect(s).toHaveProperty('priority');
    });
  });
});

// ── analyzeSemesterProgress ───────────────────────────────────
describe('analyzeSemesterProgress', () => {
  test('calculates completion rate correctly', () => {
    const semester = { courses: [], events: [], goals: [] };
    const tasks = [
      { completed: true,  deadline: new Date(Date.now() + 3600_000).toISOString(), course: 'Math' },
      { completed: false, deadline: new Date(Date.now() + 3600_000).toISOString(), course: 'Math' },
      { completed: false, deadline: new Date(Date.now() + 3600_000).toISOString(), course: 'Math' },
    ];
    const result = analyzeSemesterProgress(semester, tasks);
    expect(result.completionRate).toBe(33);
    expect(result.totalTasks).toBe(3);
    expect(result.completed).toBe(1);
  });

  test('healthScore decreases with overdue tasks', () => {
    const semester = { courses: [], events: [], goals: [] };
    const tasks = Array.from({ length: 5 }, () => ({
      completed: false,
      deadline : new Date(Date.now() - 3600_000).toISOString(),
      course   : 'Math',
    }));
    const result = analyzeSemesterProgress(semester, tasks);
    expect(result.healthScore).toBeLessThan(50);
    expect(result.overdue).toBe(5);
  });
});
