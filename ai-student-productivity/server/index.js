// ============================================================
// AI Student Productivity – Main Server Entry Point
// ============================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const cron = require('node-cron');

const tasksRouter = require('./routes/tasks');
const scheduleRouter = require('./routes/schedule');
const studySessionRouter = require('./routes/studySessions');
const semesterRouter = require('./routes/semester');
const analyticsRouter = require('./routes/analytics');
const aiRouter = require('./routes/ai');

const { initDataStore } = require('./utils/dataStore');
const { runDailyAIAnalysis } = require('./services/aiEngine');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── API Routes ───────────────────────────────────────────────
app.use('/api/tasks',         tasksRouter);
app.use('/api/schedule',      scheduleRouter);
app.use('/api/study-sessions',studySessionRouter);
app.use('/api/semester',      semesterRouter);
app.use('/api/analytics',     analyticsRouter);
app.use('/api/ai',            aiRouter);

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Fallback → serve SPA ─────────────────────────────────────
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ── Scheduled AI Analysis (every day at midnight) ────────────
cron.schedule('0 0 * * *', async () => {
  console.log('[CRON] Running daily AI analysis...');
  try {
    await runDailyAIAnalysis();
    console.log('[CRON] Daily AI analysis complete.');
  } catch (err) {
    console.error('[CRON] AI analysis error:', err.message);
  }
});

// ── Start ─────────────────────────────────────────────────────
(async () => {
  await initDataStore();
  app.listen(PORT, () => {
    console.log(`\n🎓 AI Student Productivity Server running at http://localhost:${PORT}`);
    console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Data store  : ${path.resolve(process.env.DATA_DIR || './data')}\n`);
  });
})();

module.exports = app;
