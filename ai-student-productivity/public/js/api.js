/* ============================================================
   API Client – all backend calls
   ============================================================ */
const API_BASE = '/api';

async function apiFetch(endpoint, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'API error');
  return data;
}

// ── Tasks ─────────────────────────────────────────────────
const TasksAPI = {
  getAll  : ()      => apiFetch('/tasks'),
  getById : (id)    => apiFetch(`/tasks/${id}`),
  create  : (body)  => apiFetch('/tasks', { method: 'POST', body: JSON.stringify(body) }),
  update  : (id, b) => apiFetch(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
  complete: (id)    => apiFetch(`/tasks/${id}/complete`, { method: 'PATCH' }),
  delete  : (id)    => apiFetch(`/tasks/${id}`, { method: 'DELETE' }),
};

// ── Schedule ──────────────────────────────────────────────
const ScheduleAPI = {
  getAll : ()      => apiFetch('/schedule'),
  create : (body)  => apiFetch('/schedule', { method: 'POST', body: JSON.stringify(body) }),
  update : (id, b) => apiFetch(`/schedule/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
  delete : (id)    => apiFetch(`/schedule/${id}`, { method: 'DELETE' }),
};

// ── Study Sessions ────────────────────────────────────────
const StudyAPI = {
  getAll   : ()     => apiFetch('/study-sessions'),
  getToday : ()     => apiFetch('/study-sessions/today'),
  getAnalysis: ()   => apiFetch('/study-sessions/analysis'),
  create   : (body) => apiFetch('/study-sessions', { method: 'POST', body: JSON.stringify(body) }),
  delete   : (id)   => apiFetch(`/study-sessions/${id}`, { method: 'DELETE' }),
};

// ── Semester ──────────────────────────────────────────────
const SemesterAPI = {
  get           : ()      => apiFetch('/semester'),
  addCourse     : (body)  => apiFetch('/semester/courses', { method: 'POST', body: JSON.stringify(body) }),
  deleteCourse  : (id)    => apiFetch(`/semester/courses/${id}`, { method: 'DELETE' }),
  addEvent      : (body)  => apiFetch('/semester/events', { method: 'POST', body: JSON.stringify(body) }),
  addGoal       : (body)  => apiFetch('/semester/goals', { method: 'POST', body: JSON.stringify(body) }),
  updateGoal    : (id, b) => apiFetch(`/semester/goals/${id}`, { method: 'PATCH', body: JSON.stringify(b) }),
};

// ── Analytics ─────────────────────────────────────────────
const AnalyticsAPI = {
  overview          : () => apiFetch('/analytics/overview'),
  weekly            : () => apiFetch('/analytics/weekly'),
  productivityTrend : () => apiFetch('/analytics/productivity-trend'),
};

// ── AI ────────────────────────────────────────────────────
const AIAPI = {
  insights          : () => apiFetch('/ai/insights'),
  analyze           : () => apiFetch('/ai/analyze', { method: 'POST' }),
  procrastination   : () => apiFetch('/ai/procrastination'),
  distractionAnalysis: () => apiFetch('/ai/distraction-analysis'),
  timeOptimization  : () => apiFetch('/ai/time-optimization'),
  semesterProgress  : () => apiFetch('/ai/semester-progress'),
  getProfile        : () => apiFetch('/ai/profile'),
  updateProfile     : (b) => apiFetch('/ai/profile', { method: 'PUT', body: JSON.stringify(b) }),
};
