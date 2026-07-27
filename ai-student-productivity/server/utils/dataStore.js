// ============================================================
// Data Store – lightweight JSON-file persistence layer
// ============================================================
const fs   = require('fs-extra');
const path = require('path');

const DATA_DIR = path.resolve(process.env.DATA_DIR || './data');

const FILES = {
  tasks        : path.join(DATA_DIR, 'tasks.json'),
  schedule     : path.join(DATA_DIR, 'schedule.json'),
  studySessions: path.join(DATA_DIR, 'studySessions.json'),
  semester     : path.join(DATA_DIR, 'semester.json'),
  analytics    : path.join(DATA_DIR, 'analytics.json'),
  aiInsights   : path.join(DATA_DIR, 'aiInsights.json'),
  userProfile  : path.join(DATA_DIR, 'userProfile.json'),
};

// ── Seed defaults ────────────────────────────────────────────
const DEFAULTS = {
  tasks        : [],
  schedule     : [],
  studySessions: [],
  semester     : { courses: [], events: [], goals: [] },
  analytics    : { daily: [], weekly: [], procrastinationLog: [], distractionLog: [] },
  aiInsights   : { suggestions: [], lastAnalyzed: null },
  userProfile  : {
    name           : 'Student',
    studyGoalHours : 6,
    pomodoroWork   : 25,
    pomodoroBreak  : 5,
    preferredStudyTime: 'morning',
    subjects       : [],
  },
};

async function initDataStore() {
  await fs.ensureDir(DATA_DIR);
  for (const [key, filepath] of Object.entries(FILES)) {
    if (!(await fs.pathExists(filepath))) {
      await fs.writeJson(filepath, DEFAULTS[key], { spaces: 2 });
      console.log(`[DataStore] Initialized ${path.basename(filepath)}`);
    }
  }
}

async function readData(key) {
  return fs.readJson(FILES[key]);
}

async function writeData(key, data) {
  return fs.writeJson(FILES[key], data, { spaces: 2 });
}

async function updateData(key, updaterFn) {
  const current = await readData(key);
  const updated  = updaterFn(current);
  await writeData(key, updated);
  return updated;
}

module.exports = { initDataStore, readData, writeData, updateData, FILES };
