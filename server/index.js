/**
 * Main server entry point for the "AI Student Productivity" app.
 * It creates an Express web server, wires up all the API routes,
 * serves the frontend (HTML/JS/CSS) from the public folder, and
 * starts a daily background job (cron) that runs AI analysis.
 * Run this file with `node server/index.js` to start the app.
 */
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

const authRouter         = require('./routes/auth');
const tasksRouter        = require('./routes/tasks');
const scheduleRouter     = require('./routes/schedule');
const studySessionRouter = require('./routes/studySessions');
const semesterRouter     = require('./routes/semester');
const analyticsRouter    = require('./routes/analytics');
const aiRouter           = require('./routes/ai');
const notesRouter        = require('./routes/notes');
const flashcardsRouter   = require('./routes/flashcards');

const { initDataStore }    = require('./utils/dataStore');
const { runDailyAIAnalysis } = require('./services/aiEngine');

const app  = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;

// ── Security / CORS ──────────────────────────────────────────
// Allow requests from any origin (simple setup for a local/dev app).
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'] }));
// Answer CORS "preflight" OPTIONS requests so browsers accept the real request.
app.options('*', cors());

// ── Body Parsing ─────────────────────────────────────────────
app.use(bodyParser.json({ limit: '2mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// ── Request logger (dev only) ─────────────────────────────────
/**
 * Simple logging middleware that prints every incoming request
 * (time, HTTP method, URL) to the console. Only attached when
 * NODE_ENV is not "production", so real servers stay quiet.
 * Calls next() so the request continues to the next handler.
 */
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// ── Static Frontend ───────────────────────────────────────────
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
// Serves HTML/CSS/JS files; in production the browser caches them
// for 1 day ("1d") to speed up repeat visits, in dev caching is off.
app.use(express.static(PUBLIC_DIR, {
  maxAge : process.env.NODE_ENV === 'production' ? '1d' : 0,
  etag   : true,
}));

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth',           authRouter);
app.use('/api/tasks',          tasksRouter);
app.use('/api/schedule',       scheduleRouter);
app.use('/api/study-sessions', studySessionRouter);
app.use('/api/semester',       semesterRouter);
app.use('/api/analytics',      analyticsRouter);
app.use('/api/ai',             aiRouter);
app.use('/api/notes',          notesRouter);
app.use('/api/flashcards',     flashcardsRouter);

// ── Health Check ──────────────────────────────────────────────
/**
 * Health check route: GET /api/health
 * A lightweight endpoint used to verify the server is alive.
 * Returns JSON with the server status, current time, version,
 * how long the process has been running (uptime in seconds),
 * and the active environment (e.g. "development" or "production").
 */
app.get('/api/health', (_req, res) => {
  res.json({
    status    : 'ok',
    timestamp : new Date().toISOString(),
    version   : '2.0.0',
    uptime    : Math.floor(process.uptime()),
    env       : process.env.NODE_ENV || 'development',
  });
});

// ── 404 for unknown /api/ routes ─────────────────────────────
/**
 * Catch-all middleware for unknown /api/... URLs.
 * If no earlier API route matched, it responds with a 404 JSON
 * error so API clients get a predictable JSON response instead
 * of the HTML page used for frontend routes.
 */
app.use('/api/*', (_req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// ── SPA Fallback – serve index.html for all non-API routes ───
/**
 * SPA (Single Page Application) fallback route: GET *
 * Any non-API GET request that didn't match a static file is
 * served index.html, letting the frontend handle its own
 * client-side routing (e.g. /dashboard, /settings).
 */
app.get('*', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// ── Global Error Handler ──────────────────────────────────────
/**
 * Global error handler middleware (Express calls this when next(err)
 * is used or a route throws). Logs the error message server-side and
 * returns a generic 500 JSON response, hiding internal details
 * from the client. The 4-argument signature is required by Express
 * to recognize it as an error handler (hence the unused vars).
 */
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ── Scheduled AI Analysis (daily at midnight) ─────────────────
/**
 * Scheduled job (cron): runs runDailyAIAnalysis() once a day at
 * midnight. The pattern "0 0 * * *" means minute=0 hour=0 every day.
 * Errors are caught and logged so a failed analysis never crashes
 * the running server.
 */
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
/**
 * Bootstrap IIFE (an immediately-invoked async function):
 * initializes the JSON data store, then starts the HTTP server.
 * This order matters — data files must exist before routes use them.
 * If startup fails (e.g. data directory can't be created), the
 * process exits with code 1 so operators know the server never started.
 */
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

// Exported so tests or other tools can import the configured app
// without actually starting a server.
module.exports = app;
