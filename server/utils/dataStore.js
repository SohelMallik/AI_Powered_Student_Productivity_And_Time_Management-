// ============================================================
// Data Store – robust JSON-file persistence
// Handles missing files, corrupt JSON, and directory creation
// ============================================================
const fs   = require('fs-extra');
const path = require('path');

const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data'));

const FILES = {
  tasks        : path.join(DATA_DIR, 'tasks.json'),
  schedule     : path.join(DATA_DIR, 'schedule.json'),
  studySessions: path.join(DATA_DIR, 'studySessions.json'),
  semester     : path.join(DATA_DIR, 'semester.json'),
  analytics    : path.join(DATA_DIR, 'analytics.json'),
  aiInsights   : path.join(DATA_DIR, 'aiInsights.json'),
  userProfile  : path.join(DATA_DIR, 'userProfile.json'),
};

// ── Default empty structures ─────────────────────────────────
const DEFAULTS = {
  tasks        : [],
  schedule     : [],
  studySessions: [],
  semester     : { courses: [], events: [], goals: [] },
  analytics    : { daily: [], weekly: [], procrastinationLog: [], distractionLog: [] },
  aiInsights   : { suggestions: [], lastAnalyzed: null },
  userProfile  : {
    name              : 'Student',
    studyGoalHours    : 6,
    pomodoroWork      : 25,
    pomodoroBreak     : 5,
    preferredStudyTime: 'morning',
    subjects          : [],
  },
};

// ── Initialize – create directory + any missing files ────────
async function initDataStore() {
  await fs.ensureDir(DATA_DIR);
  for (const [key, filepath] of Object.entries(FILES)) {
    try {
      await fs.access(filepath);                           // file exists
      await fs.readJson(filepath);                         // parse OK
    } catch {
      // file missing or corrupt — write defaults
      await fs.writeJson(filepath, DEFAULTS[key], { spaces: 2 });
      console.log(`[DataStore] Initialized ${path.basename(filepath)}`);
    }
  }
  console.log(`[DataStore] Ready  →  ${DATA_DIR}`);
}

// ── Read ──────────────────────────────────────────────────────
async function readData(key) {
  try {
    return await fs.readJson(FILES[key]);
  } catch {
    // Return default if file is corrupt or missing mid-run
    return JSON.parse(JSON.stringify(DEFAULTS[key]));
  }
}

// ── Write ─────────────────────────────────────────────────────
async function writeData(key, data) {
  await fs.ensureDir(DATA_DIR);
  return fs.writeJson(FILES[key], data, { spaces: 2 });
}

// ── Atomic update (read → transform → write) ─────────────────
async function updateData(key, updaterFn) {
  const current = await readData(key);
  const updated  = updaterFn(current);
  await writeData(key, updated);
  return updated;
}

module.exports = { initDataStore, readData, writeData, updateData, FILES, DATA_DIR };
