// ============================================================
// Tests: API Routes – Integration Tests
// ============================================================
const request = require('supertest');
const path    = require('path');
const fs      = require('fs-extra');

// Use a temp data directory so tests don't corrupt real data
process.env.DATA_DIR    = path.join(__dirname, '../tmp/test-data');
process.env.NODE_ENV    = 'test';
process.env.PORT        = '3999';

let app;

beforeAll(async () => {
  await fs.ensureDir(process.env.DATA_DIR);
  const { initDataStore } = require('../../server/utils/dataStore');
  await initDataStore();
  app = require('../../server/index');
});

afterAll(async () => {
  await fs.remove(process.env.DATA_DIR);
});

// ── Health ────────────────────────────────────────────────────
describe('GET /api/health', () => {
  test('returns 200 ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

// ── Tasks ─────────────────────────────────────────────────────
describe('Tasks API', () => {
  let taskId;

  test('GET /api/tasks – returns empty array initially', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('POST /api/tasks – creates a task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({
        title         : 'Test Assignment',
        deadline      : new Date(Date.now() + 7 * 24 * 3600_000).toISOString(),
        course        : 'Mathematics',
        type          : 'assignment',
        estimatedHours: 3,
        weight        : 7,
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Test Assignment');
    expect(res.body.data.id).toBeDefined();
    expect(typeof res.body.data.priority).toBe('number');
    taskId = res.body.data.id;
  });

  test('POST /api/tasks – fails without required fields', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'No Deadline' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/tasks/:id – retrieves specific task', async () => {
    const res = await request(app).get(`/api/tasks/${taskId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(taskId);
  });

  test('PUT /api/tasks/:id – updates task', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .send({ title: 'Updated Assignment', weight: 9 });
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated Assignment');
  });

  test('PATCH /api/tasks/:id/complete – marks complete', async () => {
    const res = await request(app).patch(`/api/tasks/${taskId}/complete`);
    expect(res.status).toBe(200);
    expect(res.body.data.completed).toBe(true);
    expect(res.body.data.completedAt).toBeTruthy();
  });

  test('DELETE /api/tasks/:id – deletes task', async () => {
    const res = await request(app).delete(`/api/tasks/${taskId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('GET /api/tasks/:id – 404 after delete', async () => {
    const res = await request(app).get(`/api/tasks/${taskId}`);
    expect(res.status).toBe(404);
  });
});

// ── Study Sessions ────────────────────────────────────────────
describe('Study Sessions API', () => {
  let sessionId;

  test('POST /api/study-sessions – creates session', async () => {
    const res = await request(app)
      .post('/api/study-sessions')
      .send({ subject: 'Physics', duration: 45, distractionMinutes: 5, mood: 'happy', productivity: 8 });
    expect(res.status).toBe(201);
    expect(res.body.data.subject).toBe('Physics');
    sessionId = res.body.data.id;
  });

  test('GET /api/study-sessions/today – returns todays sessions', async () => {
    const res = await request(app).get('/api/study-sessions/today');
    expect(res.status).toBe(200);
    expect(res.body.totalMinutes).toBeGreaterThanOrEqual(45);
  });

  test('GET /api/study-sessions/analysis – returns analysis', async () => {
    const res = await request(app).get('/api/study-sessions/analysis');
    expect(res.status).toBe(200);
    expect(res.body.data.focusScore).toBeDefined();
    expect(res.body.data.totalStudyMinutes).toBeGreaterThan(0);
  });

  test('DELETE /api/study-sessions/:id – deletes session', async () => {
    const res = await request(app).delete(`/api/study-sessions/${sessionId}`);
    expect(res.status).toBe(200);
  });
});

// ── AI Endpoints ──────────────────────────────────────────────
describe('AI API', () => {
  test('GET /api/ai/procrastination – returns array', async () => {
    const res = await request(app).get('/api/ai/procrastination');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/ai/distraction-analysis – returns analysis', async () => {
    const res = await request(app).get('/api/ai/distraction-analysis');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('focusScore');
  });

  test('GET /api/ai/time-optimization – returns array', async () => {
    const res = await request(app).get('/api/ai/time-optimization');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('POST /api/ai/analyze – triggers analysis', async () => {
    const res = await request(app).post('/api/ai/analyze');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.generatedAt).toBeDefined();
  });

  test('GET /api/ai/profile – returns profile', async () => {
    const res = await request(app).get('/api/ai/profile');
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBeDefined();
  });

  test('PUT /api/ai/profile – updates profile', async () => {
    const res = await request(app)
      .put('/api/ai/profile')
      .send({ name: 'Alice', studyGoalHours: 8 });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Alice');
    expect(res.body.data.studyGoalHours).toBe(8);
  });
});

// ── Semester ──────────────────────────────────────────────────
describe('Semester API', () => {
  let courseId, goalId;

  test('POST /api/semester/courses – creates course', async () => {
    const res = await request(app).post('/api/semester/courses')
      .send({ name: 'Advanced Math', code: 'MATH-301', credits: 4 });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Advanced Math');
    courseId = res.body.data.id;
  });

  test('POST /api/semester/events – creates event', async () => {
    const res = await request(app).post('/api/semester/events')
      .send({ title: 'Midterm', date: '2025-03-15', type: 'exam' });
    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Midterm');
  });

  test('POST /api/semester/goals – creates goal', async () => {
    const res = await request(app).post('/api/semester/goals')
      .send({ title: 'Complete all homework', targetValue: 100 });
    expect(res.status).toBe(201);
    goalId = res.body.data.id;
  });

  test('PATCH /api/semester/goals/:id – updates goal progress', async () => {
    const res = await request(app)
      .patch(`/api/semester/goals/${goalId}`)
      .send({ currentValue: 60 });
    expect(res.status).toBe(200);
    expect(res.body.data.currentValue).toBe(60);
  });

  test('GET /api/semester – returns semester data with progress', async () => {
    const res = await request(app).get('/api/semester');
    expect(res.status).toBe(200);
    expect(res.body.data.courses).toBeDefined();
    expect(res.body.data.progress).toBeDefined();
  });

  test('DELETE /api/semester/courses/:id – removes course', async () => {
    const res = await request(app).delete(`/api/semester/courses/${courseId}`);
    expect(res.status).toBe(200);
  });
});
