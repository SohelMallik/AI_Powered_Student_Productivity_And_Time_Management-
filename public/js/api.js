/* ============================================================
   API Client – all backend calls in one place
   ============================================================ */

const API_BASE = '/api';

// ── CSRF cookie reader ────────────────────────────────────
function getCookie(name) {
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}

// ── Core fetch wrapper ────────────────────────────────────
async function apiFetch(endpoint, { method = 'GET', body, headers: extraHeaders } = {}) {
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 15000);

  const upperMethod = method.toUpperCase();
  const csrfToken   = (upperMethod !== 'GET' && upperMethod !== 'HEAD')
                      ? getCookie('csrftoken') : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(csrfToken      ? { 'X-CSRFToken': csrfToken } : {}),
    ...(extraHeaders   || {}),
  };

  const fetchOpts = { method: upperMethod, headers, credentials: 'include', signal: controller.signal };
  if (body !== undefined) fetchOpts.body = body;

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, fetchOpts);
    clearTimeout(timeoutId);

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(`Server error ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data.message || `HTTP ${res.status}`);
    }
    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') throw new Error('Request timed out. Is the server running?');
    throw err;
  }
}

// ── Tasks ─────────────────────────────────────────────────
const TasksAPI = {
  getAll  : ()       => apiFetch('/tasks'),
  getById : (id)     => apiFetch(`/tasks/${id}`),
  create  : (body)   => apiFetch('/tasks',              { method: 'POST',  body: JSON.stringify(body) }),
  update  : (id, b)  => apiFetch(`/tasks/${id}`,        { method: 'PUT',   body: JSON.stringify(b) }),
  complete: (id)     => apiFetch(`/tasks/${id}/complete`,{ method: 'PATCH' }),
  delete  : (id)     => apiFetch(`/tasks/${id}`,        { method: 'DELETE' }),
};

// ── Schedule ──────────────────────────────────────────────
const ScheduleAPI = {
  getAll : ()       => apiFetch('/schedule'),
  create : (body)   => apiFetch('/schedule',       { method: 'POST',   body: JSON.stringify(body) }),
  update : (id, b)  => apiFetch(`/schedule/${id}`, { method: 'PUT',    body: JSON.stringify(b) }),
  delete : (id)     => apiFetch(`/schedule/${id}`, { method: 'DELETE' }),
};

// ── Study Sessions ────────────────────────────────────────
const StudyAPI = {
  getAll      : ()     => apiFetch('/study-sessions'),
  getToday    : ()     => apiFetch('/study-sessions/today'),
  getAnalysis : ()     => apiFetch('/study-sessions/analysis'),
  create      : (body) => apiFetch('/study-sessions',       { method: 'POST',   body: JSON.stringify(body) }),
  delete      : (id)   => apiFetch(`/study-sessions/${id}`, { method: 'DELETE' }),
};

// ── Semester ──────────────────────────────────────────────
const SemesterAPI = {
  get          : ()       => apiFetch('/semester'),
  addCourse    : (body)   => apiFetch('/semester/courses',       { method: 'POST',  body: JSON.stringify(body) }),
  deleteCourse : (id)     => apiFetch(`/semester/courses/${id}`, { method: 'DELETE' }),
  addEvent     : (body)   => apiFetch('/semester/events',        { method: 'POST',  body: JSON.stringify(body) }),
  addGoal      : (body)   => apiFetch('/semester/goals',         { method: 'POST',  body: JSON.stringify(body) }),
  updateGoal   : (id, b)  => apiFetch(`/semester/goals/${id}`,   { method: 'PATCH', body: JSON.stringify(b) }),
};

// ── Analytics ─────────────────────────────────────────────
const AnalyticsAPI = {
  overview          : () => apiFetch('/analytics/overview'),
  weekly            : () => apiFetch('/analytics/weekly'),
  productivityTrend : () => apiFetch('/analytics/productivity-trend'),
};

// ── AI ────────────────────────────────────────────────────
const AIAPI = {
  insights           : ()     => apiFetch('/ai/insights'),
  analyze            : ()     => apiFetch('/ai/analyze',   { method: 'POST' }),
  procrastination    : ()     => apiFetch('/ai/procrastination'),
  distractionAnalysis: ()     => apiFetch('/ai/distraction-analysis'),
  timeOptimization   : ()     => apiFetch('/ai/time-optimization'),
  semesterProgress   : ()     => apiFetch('/ai/semester-progress'),
  getProfile         : ()     => apiFetch('/ai/profile'),
  updateProfile      : (body) => apiFetch('/ai/profile',   { method: 'PUT', body: JSON.stringify(body) }),
};

// ── Auth ──────────────────────────────────────────────────
const AuthAPI = {
  register : (body) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login    : (body) => apiFetch('/auth/login',    { method: 'POST', body: JSON.stringify(body) }),
  logout   : ()     => apiFetch('/auth/logout',   { method: 'POST' }),
  me       : ()     => apiFetch('/auth/me'),
};

// ── Health ────────────────────────────────────────────────
const HealthAPI = {
  check: () => fetch(`${API_BASE}/health`, { credentials: 'include' }).then(r => r.json()),
};
