/**
 * Data Store – the app's simple "database".
 * All app data (users, tasks, notes, etc.) is stored as JSON files
 * inside one data folder. This module handles reading and writing
 * those files safely: it creates the folder and any missing files
 * on startup, and falls back to sensible defaults if a file is
 * missing or contains broken (corrupt) JSON.
 */
// ============================================================
// Data Store – robust JSON-file persistence
// Handles missing files, corrupt JSON, and directory creation
// ============================================================
const fs   = require('fs-extra');
const path = require('path');

// Data folder: either set via the DATA_DIR environment variable
// or defaulted to a "data" folder next to the server code.
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data'));

// Maps each data "key" (e.g. "tasks") to its JSON file on disk,
// so callers can read/write by name instead of full file paths.
const FILES = {
  users        : path.join(DATA_DIR, 'users.json'),
  tasks        : path.join(DATA_DIR, 'tasks.json'),
  schedule     : path.join(DATA_DIR, 'schedule.json'),
  studySessions: path.join(DATA_DIR, 'studySessions.json'),
  semester     : path.join(DATA_DIR, 'semester.json'),
  analytics    : path.join(DATA_DIR, 'analytics.json'),
  aiInsights   : path.join(DATA_DIR, 'aiInsights.json'),
  userProfile  : path.join(DATA_DIR, 'userProfile.json'),
  notes        : path.join(DATA_DIR, 'notes.json'),
  flashcards   : path.join(DATA_DIR, 'flashcards.json'),
};

// ── Default empty structures ─────────────────────────────────
// What each file starts with if it doesn't exist yet, plus the
// fallback used when a file is corrupt or read fails mid-run.
const DEFAULTS = {
  users        : [],
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
    darkMode          : false,
    notificationsEnabled: true,
    weekStartsOn      : 'monday',
  },
  notes        : [],
  flashcards   : [],
};

// ── Initialize – create directory + any missing files ────────
/**
 * Prepares the data folder on server startup.
 * - Creates DATA_DIR if it doesn't exist (fs.ensureDir).
 * - For every known file: if it exists AND parses as valid JSON,
 *   leave it alone; otherwise (missing or corrupt) overwrite it
 *   with the matching default structure.
 * @returns {Promise<void>} Resolves once all files are usable.
 */
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
/**
 * Reads one JSON data file by its key (e.g. "tasks").
 * @param {string} key - Name of the dataset, must exist in FILES.
 * @returns {Promise<Object|Array>} Parsed file contents, or a deep
 *   copy of the default structure if the file is missing/corrupt.
 *   (JSON.parse(JSON.stringify(...)) is a common trick to clone an
 *   object so callers can't accidentally modify the DEFAULTS.)
 */
async function readData(key) {
  try {
    return await fs.readJson(FILES[key]);
  } catch {
    // Return default if file is corrupt or missing mid-run
    return JSON.parse(JSON.stringify(DEFAULTS[key]));
  }
}

// ── Write ─────────────────────────────────────────────────────
/**
 * Replaces the entire contents of one data file.
 * @param {string} key - Name of the dataset (must exist in FILES).
 * @param {Object|Array} data - New contents to write.
 * @returns {Promise<void>} Resolves when the file is written.
 *   ({ spaces: 2 } just makes the JSON file human-readable.)
 */
async function writeData(key, data) {
  await fs.ensureDir(DATA_DIR);
  return fs.writeJson(FILES[key], data, { spaces: 2 });
}

// ── Atomic update (read → transform → write) ─────────────────
/**
 * Convenience helper for "change one thing and save".
 * It reads the current data, passes it to your updater function,
 * writes the result back, and returns the updated data.
 * Note: this is read-then-write in one go — concurrent updates
 * could overwrite each other, so it suits a single-user local app.
 * @template T
 * @param {string} key - Dataset to update.
 * @param {(current: T) => T} updaterFn - Receives current data, returns new data.
 * @returns {Promise<T>} The updated data that was written to disk.
 */
async function updateData(key, updaterFn) {
  const current = await readData(key);
  const updated  = updaterFn(current);
  await writeData(key, updated);
  return updated;
}

module.exports = { initDataStore, readData, writeData, updateData, FILES, DATA_DIR };
