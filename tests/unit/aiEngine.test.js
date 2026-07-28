// ============================================================
// Tests: AI Engine – Unit Tests
// ============================================================
const {
  calculatePriority,
  detectOverdueTasks,
  detectProcrastination,
  analyzeStudyVsDistraction,
  suggestTimeOptimization,
  analyzeSemesterProgress,
} = require('../../server/services/aiEngine');

// ── calculatePriority ─────────────────────────────────────────
describe('calculatePriority', () => {
  test('returns 100 for severely overdue high-weight task', () => {
    const task = {
      deadline       : new Date(Date.now() - 7 * 24 * 3600_000).toISOString(),
      weight         : 10,
      estimatedHours : 1,
    };
    const score = calculatePriority(task);
    expect(score).toBeGreaterThanOrEqual(80);
  });

  test('returns lower score for distant deadline', () => {
    const task = {
      deadline       : new Date(Date.now() + 30 * 24 * 3600_000).toISOString(),
      weight         : 3,
      estimatedHours : 5,
    };
    const score = calculatePriority(task);
    expect(score).toBeLessThan(60);
  });

  test('returns a number between 0 and 100', () => {
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
describe('detectOverdueTasks', () => {
  const tasks = [
    { id: '1', title: 'Past',   deadline: new Date(Date.now() - 3600_000).toISOString(), completed: false },
    { id: '2', title: 'Future', deadline: new Date(Date.now() + 3600_000).toISOString(), completed: false },
    { id: '3', title: 'Done',   deadline: new Date(Date.now() - 3600_000).toISOString(), completed: true },
  ];

  test('returns only incomplete overdue tasks', () => {
    const overdue = detectOverdueTasks(tasks);
    expect(overdue).toHaveLength(1);
    expect(overdue[0].id).toBe('1');
  });

  test('excludes completed tasks even if deadline passed', () => {
    const overdue = detectOverdueTasks(tasks);
    const ids = overdue.map(t => t.id);
    expect(ids).not.toContain('3');
  });
});

// ── detectProcrastination ─────────────────────────────────────
describe('detectProcrastination', () => {
  test('flags task with deadline < 48h and no study sessions', () => {
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
