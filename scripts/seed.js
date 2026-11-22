// ============================================================
//  Seed Script – loads realistic demo data so the app is
//  fully functional from the first visit.
//  Run:  node scripts/seed.js
//       (also called automatically by run.bat / run.sh)
// ============================================================
/**
 * seed.js — creates the demo data files the app needs to run.
 *
 * This script builds realistic sample data (tasks, study sessions,
 * a weekly schedule, semester info, analytics, and a user profile)
 * and writes each piece of data to its own JSON file inside the
 * `data` directory. The server then reads those files, so the app
 * already has content the first time you open it.
 *
 * Run manually with:  node scripts/seed.js
 */
require('dotenv').config();
require('dotenv').config();
const path = require('path');
const fs   = require('fs-extra');

// Reads the DATA_DIR environment variable if set; otherwise falls back to
// the `data` folder next to this script's parent directory.
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, '..', 'data'));

// ── Helpers ───────────────────────────────────────────────
/**
 * Generates a random UUID (version 4 style) string.
 * Used to give every seeded record a unique `id`.
 */
function uuid() {
  // Replace each 'x' with a random hex digit; the 'y' placeholder holds a
  // fixed set of bits that marks this as a version-4 UUID.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}
/** Returns an ISO timestamp string `d` days in the future. */
function daysFromNow(d) {
  return new Date(Date.now() + d * 86400_000).toISOString();
}
/** Returns an ISO timestamp string `d` days in the past. */
function daysAgo(d) {
  return new Date(Date.now() - d * 86400_000).toISOString();
}

// ── Tasks ─────────────────────────────────────────────────
// A list of sample assignments/projects/exams. Mixes future deadlines,
// high/low weights, and one already-completed (overdue) task so the app
// can show varied states in the UI.
const tasks = [
  {
    id: uuid(), title: 'Linear Algebra — Chapter 7 Review',
    description: 'Cover eigenvalues, eigenvectors, and diagonalisation.',
    deadline: daysFromNow(2), course: 'Mathematics', type: 'assignment',
    estimatedHours: 4, weight: 8, tags: ['exam-prep', 'priority'],
    completed: false, completedAt: null,
    createdAt: daysAgo(3), updatedAt: daysAgo(3),
  },
  {
    id: uuid(), title: 'Physics Lab Report — Wave Optics',
    description: 'Write up the diffraction grating experiment results.',
    deadline: daysFromNow(4), course: 'Physics', type: 'assignment',
    estimatedHours: 3, weight: 7, tags: ['lab', 'report'],
    completed: false, completedAt: null,
    createdAt: daysAgo(2), updatedAt: daysAgo(2),
  },
  {
    id: uuid(), title: 'Computer Science — Binary Trees Project',
    description: 'Implement AVL tree with insert, delete, search.',
    deadline: daysFromNow(6), course: 'Computer Science', type: 'project',
    estimatedHours: 8, weight: 9, tags: ['coding', 'data-structures'],
    completed: false, completedAt: null,
    createdAt: daysAgo(1), updatedAt: daysAgo(1),
  },
  {
    id: uuid(), title: 'English — Essay Draft: Climate Change',
    description: 'Write 1500-word argumentative essay.',
    deadline: daysFromNow(10), course: 'English', type: 'assignment',
    estimatedHours: 5, weight: 6, tags: ['writing'],
    completed: false, completedAt: null,
    createdAt: daysAgo(1), updatedAt: daysAgo(1),
  },
  {
    id: uuid(), title: 'Chemistry — Midterm Exam Preparation',
    description: 'Revise chapters 1–5 including thermodynamics.',
    deadline: daysFromNow(14), course: 'Chemistry', type: 'exam',
    estimatedHours: 10, weight: 10, tags: ['exam', 'priority'],
    completed: false, completedAt: null,
    createdAt: daysAgo(5), updatedAt: daysAgo(5),
  },
  {
    id: uuid(), title: 'Mathematics — Problem Set 3',
    description: 'Integration techniques — 20 problems.',
    deadline: daysAgo(1), course: 'Mathematics', type: 'assignment',
    estimatedHours: 2, weight: 5, tags: [],
    completed: true, completedAt: daysAgo(2),
    createdAt: daysAgo(8), updatedAt: daysAgo(2),
  },
];

// ── Study Sessions ────────────────────────────────────────
// Sample study log entries for the last few days. Each records how long
// the student studied, how many minutes were lost to distractions, their
// mood, and a productivity rating — these feed the analytics screens.
const studySessions = [
  {
    id: uuid(), subject: 'Mathematics', taskId: null,
    duration: 90, distractionMinutes: 10, notes: 'Covered chapters 5 and 6.',
    mood: 'happy', productivity: 8, date: daysAgo(0),
  },
  {
    id: uuid(), subject: 'Physics', taskId: null,
    duration: 60, distractionMinutes: 15, notes: 'Reviewed wave equations.',
    mood: 'neutral', productivity: 6, date: daysAgo(0),
  },
  {
    id: uuid(), subject: 'Computer Science', taskId: null,
    duration: 120, distractionMinutes: 5, notes: 'Implemented BST insert.',
    mood: 'happy', productivity: 9, date: daysAgo(1),
  },
  {
    id: uuid(), subject: 'Chemistry', taskId: null,
    duration: 75, distractionMinutes: 20, notes: 'Thermodynamics revision.',
    mood: 'tired', productivity: 5, date: daysAgo(1),
  },
  {
    id: uuid(), subject: 'English', taskId: null,
    duration: 45, distractionMinutes: 5, notes: 'Outlined essay structure.',
    mood: 'neutral', productivity: 7, date: daysAgo(2),
  },
  {
    id: uuid(), subject: 'Mathematics', taskId: null,
    duration: 100, distractionMinutes: 8, notes: 'Differential equations practice.',
    mood: 'happy', productivity: 8, date: daysAgo(2),
  },
  {
    id: uuid(), subject: 'Physics', taskId: null,
    duration: 50, distractionMinutes: 12, notes: 'Optics problems.',
    mood: 'neutral', productivity: 6, date: daysAgo(3),
  },
  {
    id: uuid(), subject: 'Computer Science', taskId: null,
    duration: 90, distractionMinutes: 0, notes: 'Algorithm analysis.',
    mood: 'happy', productivity: 9, date: daysAgo(3),
  },
  {
    id: uuid(), subject: 'Chemistry', taskId: null,
    duration: 60, distractionMinutes: 10, notes: 'Reaction mechanisms.',
    mood: 'stressed', productivity: 5, date: daysAgo(4),
  },
  {
    id: uuid(), subject: 'Mathematics', taskId: null,
    duration: 80, distractionMinutes: 5, notes: 'Matrices and determinants.',
    mood: 'happy', productivity: 8, date: daysAgo(4),
  },
];

// ── Schedule ──────────────────────────────────────────────
// A weekly timetable of recurring blocks: lectures, study sessions,
// and personal time. Each entry gets a color so the calendar view
// can color-code different activities.
const schedule = [
  {
    id: uuid(), title: 'Mathematics Lecture', day: 'monday',
    startTime: '09:00', endTime: '10:30', subject: 'Mathematics',
    type: 'class', color: '#3b82d4', recurring: true, createdAt: daysAgo(10),
  },
  {
    id: uuid(), title: 'Physics Lab', day: 'tuesday',
    startTime: '10:00', endTime: '12:00', subject: 'Physics',
    type: 'class', color: '#7c5cd8', recurring: true, createdAt: daysAgo(10),
  },
  {
    id: uuid(), title: 'CS Study Block', day: 'wednesday',
    startTime: '14:00', endTime: '16:00', subject: 'Computer Science',
    type: 'study', color: '#22c55e', recurring: true, createdAt: daysAgo(10),
  },
  {
    id: uuid(), title: 'Chemistry Lecture', day: 'thursday',
    startTime: '11:00', endTime: '12:30', subject: 'Chemistry',
    type: 'class', color: '#f59e0b', recurring: true, createdAt: daysAgo(10),
  },
  {
    id: uuid(), title: 'English Seminar', day: 'friday',
    startTime: '09:00', endTime: '10:30', subject: 'English',
    type: 'class', color: '#ef4444', recurring: true, createdAt: daysAgo(10),
  },
  {
    id: uuid(), title: 'Weekend Study Session', day: 'saturday',
    startTime: '10:00', endTime: '12:00', subject: 'General',
    type: 'study', color: '#14b8a6', recurring: true, createdAt: daysAgo(10),
  },
  {
    id: uuid(), title: 'Morning Exercise', day: 'monday',
    startTime: '07:00', endTime: '08:00', subject: 'Personal',
    type: 'exercise', color: '#f97316', recurring: true, createdAt: daysAgo(10),
  },
];

// ── Semester ──────────────────────────────────────────────
// Everything related to the current semester: enrolled courses,
// important dates (exams, submission deadlines, holidays), and the
// student's goals with their progress so far.
const semester = {
  // Courses enrolled this semester (name, code, instructor, credits, color).
  courses: [
    { id: uuid(), name: 'Mathematics',      code: 'MATH-301', instructor: 'Prof. Williams', credits: 4, color: '#3b82d4', createdAt: daysAgo(60) },
    { id: uuid(), name: 'Physics',          code: 'PHYS-201', instructor: 'Dr. Thompson',   credits: 4, color: '#7c5cd8', createdAt: daysAgo(60) },
    { id: uuid(), name: 'Computer Science', code: 'CS-350',   instructor: 'Prof. Kumar',     credits: 3, color: '#22c55e', createdAt: daysAgo(60) },
    { id: uuid(), name: 'Chemistry',        code: 'CHEM-201', instructor: 'Dr. Patel',       credits: 3, color: '#f59e0b', createdAt: daysAgo(60) },
    { id: uuid(), name: 'English',          code: 'ENG-201',  instructor: 'Prof. Anderson',  credits: 3, color: '#ef4444', createdAt: daysAgo(60) },
  ],
  // Upcoming milestones — dates are computed relative to "today" so the
  // demo data always looks current whenever the script is re-run.
  events: [
    { id: uuid(), title: 'Mathematics Midterm',      date: new Date(Date.now() + 14 * 86400_000).toISOString().split('T')[0], type: 'exam',       course: 'Mathematics',      description: 'Covers chapters 1-7',             createdAt: daysAgo(20) },
    { id: uuid(), title: 'Physics Lab Report Due',   date: new Date(Date.now() +  4 * 86400_000).toISOString().split('T')[0], type: 'submission', course: 'Physics',          description: 'Wave optics experiment report',   createdAt: daysAgo(5)  },
    { id: uuid(), title: 'CS Project Submission',    date: new Date(Date.now() +  6 * 86400_000).toISOString().split('T')[0], type: 'submission', course: 'Computer Science', description: 'AVL Tree implementation',         createdAt: daysAgo(3)  },
    { id: uuid(), title: 'Spring Holiday',           date: new Date(Date.now() + 30 * 86400_000).toISOString().split('T')[0], type: 'holiday',    course: '',                 description: 'No classes for one week',         createdAt: daysAgo(30) },
    { id: uuid(), title: 'Chemistry Final Exam',     date: new Date(Date.now() + 45 * 86400_000).toISOString().split('T')[0], type: 'exam',       course: 'Chemistry',        description: 'Comprehensive final examination', createdAt: daysAgo(30) },
  ],
  // Personal goals with a metric, target value, and current progress.
  goals: [
    { id: uuid(), title: 'Complete all assignments before deadlines', targetDate: new Date(Date.now() + 90 * 86400_000).toISOString().split('T')[0], metric: 'completion', targetValue: 100, currentValue: 35, achieved: false, createdAt: daysAgo(30) },
    { id: uuid(), title: 'Study at least 4 hours every weekday',      targetDate: new Date(Date.now() + 90 * 86400_000).toISOString().split('T')[0], metric: 'streak',     targetValue: 60,  currentValue: 12, achieved: false, createdAt: daysAgo(30) },
    { id: uuid(), title: 'Score above 80% in all midterms',           targetDate: new Date(Date.now() + 20 * 86400_000).toISOString().split('T')[0], metric: 'score',      targetValue: 80,  currentValue: 0,  achieved: false, createdAt: daysAgo(30) },
  ],
};

// ── Analytics (last 14 days) ──────────────────────────────
// Simulated daily study statistics for the past two weeks. Values are
// generated randomly each run; weekends get less study time on purpose.
const analytics = {
  // Build one entry per day for the last 14 days (oldest first).
  daily: Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86400_000);
    const dateStr = d.toISOString().split('T')[0]; // "YYYY-MM-DD"
    const isWeekend = d.getDay() === 0 || d.getDay() === 6; // Sunday or Saturday
    return {
      date               : dateStr,
      // Weekend: 30–90 min; weekday: 120–240 min of study.
      studyMinutes       : isWeekend ? Math.floor(Math.random() * 60 + 30)  : Math.floor(Math.random() * 120 + 120),
      // 5–25 minutes lost to distractions every day.
      distractionMinutes : Math.floor(Math.random() * 20 + 5),
      // Weekends get a single session; weekdays get 2–4.
      sessions           : isWeekend ? 1 : Math.floor(Math.random() * 3 + 2),
    };
  }),
  weekly            : [],
  procrastinationLog: [],
  distractionLog    : [],
};

// ── User Profile ──────────────────────────────────────────
// Default preferences shown in the settings screen (daily study goal,
// Pomodoro timer lengths, favorite study time, and subject list).
const userProfile = {
  name              : 'Student',
  studyGoalHours    : 6,
  pomodoroWork      : 25,
  pomodoroBreak     : 5,
  preferredStudyTime: 'morning',
  subjects          : ['Mathematics', 'Physics', 'Computer Science', 'Chemistry', 'English'],
};

// ── AI Insights (initial) ─────────────────────────────────
// The AI engine fills these in the first time the user runs an analysis.
const aiInsights = {
  suggestions : [],
  lastAnalyzed: null,
};

// ── Write all files ───────────────────────────────────────
/**
 * Creates the data directory if it's missing, then writes each dataset
 * to its own `<name>.json` file and prints a progress line per file.
 */
async function seed() {
  await fs.ensureDir(DATA_DIR);
  const files = {
    tasks        : tasks,
    schedule     : schedule,
    studySessions: studySessions,
    semester     : semester,
    analytics    : analytics,
    userProfile  : userProfile,
    aiInsights   : aiInsights,
  };

  let written = 0;
  // Write one pretty-printed JSON file per dataset key.
  for (const [key, data] of Object.entries(files)) {
    const filepath = path.join(DATA_DIR, `${key}.json`);
    await fs.writeJson(filepath, data, { spaces: 2 });
    written++;
    console.log(`  ✓  ${key}.json`);
  }

  console.log(`\n[Seed] Done — ${written} files written to ${DATA_DIR}`);
}

// Run the seeding; if anything fails, log it but exit with code 0 so the
// startup script (run.bat / run.sh) keeps going instead of halting.
seed().catch(err => {
  console.error('[Seed] ERROR:', err.message);
  process.exit(0); // don't fail the startup chain
});
