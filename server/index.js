// ============================================================
// AI Student Productivity – Main Server Entry Point
// Node.js 18+ / Express 4
// ============================================================
require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const bodyParser = require('body-parser');
const path       = require('path');
const fs         = require('fs-extra');
const cron       = require('node-cron');

const tasksRouter        = require('./routes/tasks');
const scheduleRouter     = require('./routes/schedule');
const studySessionRouter = require('./routes/studySessions');
const semesterRouter     = require('./routes/semester');
const analyticsRouter    = require('./routes/analytics');
const aiRouter           = require('./routes/ai');

const { initDataStore }    = require('./utils/dataStore');
const { runDailyAIAnalysis } = require('./services/aiEngine');

const app  = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;

// ── Security / CORS ──────────────────────────────────────────
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'] }));
app.options('*', cors());

// ── Body Parsing ─────────────────────────────────────────────
app.use(bodyParser.json({ limit: '2mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// ── Request logger (dev only) ─────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// ── Static Frontend ───────────────────────────────────────────
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
app.use(express.static(PUBLIC_DIR, {
  maxAge : process.env.NODE_ENV === 'production' ? '1d' : 0,
  etag   : true,
}));

// ── API Routes ────────────────────────────────────────────────
app.use('/api/tasks',          tasksRouter);
app.use('/api/schedule',       scheduleRouter);
app.use('/api/study-sessions', studySessionRouter);
app.use('/api/semester',       semesterRouter);
app.use('/api/analytics',      analyticsRouter);
app.use('/api/ai',             aiRouter);

// ── Health Check ──────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status    : 'ok',
    timestamp : new Date().toISOString(),
    version   : '1.0.0',
    uptime    : Math.floor(process.uptime()),
    env       : process.env.NODE_ENV || 'development',
  });
});

// ── 404 for unknown /api/ routes ─────────────────────────────
app.use('/api/*', (_req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// ── SPA Fallback – serve index.html for all non-API routes ───
app.get('*', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// ── Global Error Handler ──────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ── Scheduled AI Analysis (daily at midnight) ─────────────────
cron.schedule('0 0 * * *', async () => {
  console.log('[CRON] Running daily AI analysis...');
  try {
    await runDailyAIAnalysis();
    console.log('[CRON] Daily AI analysis complete.');
  } catch (err) {
    console.error('[CRON] AI analysis error:', err.message);
  }
});

// ── Bootstrap ─────────────────────────────────────────────────
(async () => {
  try {
    await initDataStore();
    app.listen(PORT, '0.0.0.0', () => {
      console.log('\n╔══════════════════════════════════════════╗');
      console.log('║  🎓 AI Student Productivity Assistant     ║');
      console.log('╚══════════════════════════════════════════╝');
      console.log(`  URL         → http://localhost:${PORT}`);
      console.log(`  Environment → ${process.env.NODE_ENV || 'development'}`);
      console.log(`  Data dir    → ${path.resolve(process.env.DATA_DIR || './data')}`);
      console.log('  Press CTRL+C to stop\n');
    });
  } catch (err) {
    console.error('[FATAL] Failed to start server:', err.message);
    process.exit(1);
  }
})();

module.exports = app;
