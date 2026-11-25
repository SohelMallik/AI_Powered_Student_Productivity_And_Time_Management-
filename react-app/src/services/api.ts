// ============================================================
// Axios API Client
// ============================================================
// This file is the single place where the frontend talks to the
// backend. It creates one shared Axios (HTTP) client and then
// groups every endpoint by feature (tasks, notes, AI, ...). Pages
// import these objects instead of building URLs by hand, so all
// requests share the same base URL and cookie handling.
import axios from 'axios';
import type {
  Task, StudySession, ScheduleSlot, AnalyticsOverview,
  DailyLog, UserProfile, ProcrastinationItem, DistractionAnalysis,
  TimeSuggestion, SemesterProgress, Course, SemesterEvent, Goal,
  Note, FlashDeck, FlashCard,
  ApiResponse,
} from '@/types';

/**
 * Shared Axios instance used for every request in the app.
 * - baseURL '/api' means api.get('/tasks') actually calls '/api/tasks'
 * - withCredentials sends session cookies so the server knows who is logged in
 */
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  // Required so the browser includes the auth cookie with each request.
  withCredentials: true,
});

// ── Auth ─────────────────────────────────────────────────
/**
 * Signup / login / logout endpoints. After login the browser keeps
 * a session cookie, so `me()` can ask the server who is logged in.
 */
export const authApi = {
  register: (data: { username: string; email?: string; password: string }) => api.post<ApiResponse<{ id: number; username: string; email: string }>>('/auth/register', data),
  login: (data: { username: string; password: string }) => api.post<ApiResponse<{ id: number; username: string; email: string }>>('/auth/login', data),
  logout: () => api.post<ApiResponse<{ message: string }>>('/auth/logout'),
  me: () => api.get<ApiResponse<{ id: number; username: string; email: string }>>('/auth/me'),
};

// ── Tasks ─────────────────────────────────────────────────
/**
 * Standard CRUD (plus "complete") for homework tasks.
 * Each method maps one HTTP verb + URL: get all, get one, create
 * (POST), update (PUT), mark complete (PATCH), and delete (DELETE).
 */
export const tasksApi = {
  getAll  : ()         => api.get<ApiResponse<Task[]>>('/tasks'),
  getById : (id: string)            => api.get<ApiResponse<Task>>(`/tasks/${id}`),
  create  : (data: Partial<Task>)   => api.post<ApiResponse<Task>>('/tasks', data),
  update  : (id: string, data: Partial<Task>) => api.put<ApiResponse<Task>>(`/tasks/${id}`, data),
  complete: (id: string)            => api.patch<ApiResponse<Task>>(`/tasks/${id}/complete`),
  delete  : (id: string)            => api.delete<ApiResponse<void>>(`/tasks/${id}`),
};

// ── Schedule ──────────────────────────────────────────────
/** CRUD for weekly timetable slots (classes, study blocks, breaks). */
export const scheduleApi = {
  getAll : ()                              => api.get<ApiResponse<ScheduleSlot[]>>('/schedule'),
  create : (data: Partial<ScheduleSlot>)   => api.post<ApiResponse<ScheduleSlot>>('/schedule', data),
  update : (id: string, d: Partial<ScheduleSlot>) => api.put<ApiResponse<ScheduleSlot>>(`/schedule/${id}`, d),
  delete : (id: string)                    => api.delete<ApiResponse<void>>(`/schedule/${id}`),
};

// ── Study Sessions ────────────────────────────────────────
/**
 * Study-session records: what you studied, for how long, and how
 * distracted you were. Also exposes today's totals and a
 * distraction analysis computed by the backend.
 */
export const studyApi = {
  getAll    : ()                               => api.get<ApiResponse<StudySession[]>>('/study-sessions'),
  getToday  : ()                               => api.get<ApiResponse<StudySession[]> & { totalMinutes: number }>('/study-sessions/today'),
  getAnalysis: ()                              => api.get<ApiResponse<DistractionAnalysis>>('/study-sessions/analysis'),
  create    : (data: Partial<StudySession>)    => api.post<ApiResponse<StudySession>>('/study-sessions', data),
  delete    : (id: string)                     => api.delete<ApiResponse<void>>(`/study-sessions/${id}`),
};

// ── Semester ──────────────────────────────────────────────
/** Manage the semester plan: courses, calendar events, and goals. */
export const semesterApi = {
  get         : ()                          => api.get('/semester'),
  addCourse   : (data: Partial<Course>)     => api.post<ApiResponse<Course>>('/semester/courses', data),
  deleteCourse: (id: string)                => api.delete<ApiResponse<void>>(`/semester/courses/${id}`),
  addEvent    : (data: Partial<SemesterEvent>) => api.post<ApiResponse<SemesterEvent>>('/semester/events', data),
  addGoal     : (data: Partial<Goal>)       => api.post<ApiResponse<Goal>>('/semester/goals', data),
  updateGoal  : (id: string, d: Partial<Goal>) => api.patch<ApiResponse<Goal>>(`/semester/goals/${id}`, d),
};

// ── Analytics ─────────────────────────────────────────────
/** Aggregated stats for the Analytics page (overview, weekly logs, trends). */
export const analyticsApi = {
  overview : ()  => api.get<ApiResponse<AnalyticsOverview>>('/analytics/overview'),
  weekly   : ()  => api.get<ApiResponse<DailyLog[]>>('/analytics/weekly'),
  productivityTrend: () => api.get('/analytics/productivity-trend'),
};

// ── AI ────────────────────────────────────────────────────
/**
 * Endpoints backed by AI/analysis features: personalized insights,
 * procrastination & distraction reports, time suggestions, and the
 * user profile the AI tailors its advice to.
 */
export const aiApi = {
  insights          : ()                      => api.get('/ai/insights'),
  analyze           : ()                      => api.post('/ai/analyze'),
  procrastination   : ()                      => api.get<ApiResponse<ProcrastinationItem[]>>('/ai/procrastination'),
  distractionAnalysis: ()                     => api.get<ApiResponse<DistractionAnalysis>>('/ai/distraction-analysis'),
  timeOptimization  : ()                      => api.get<ApiResponse<TimeSuggestion[]>>('/ai/time-optimization'),
  semesterProgress  : ()                      => api.get<ApiResponse<SemesterProgress>>('/ai/semester-progress'),
  getProfile        : ()                      => api.get<ApiResponse<UserProfile>>('/ai/profile'),
  updateProfile     : (data: Partial<UserProfile>) => api.put<ApiResponse<UserProfile>>('/ai/profile', data),
};

// ── Notes ─────────────────────────────────────────────────
/** CRUD for study notes, with search/filter params and a "pin" toggle. */
export const notesApi = {
  getAll  : (params?: { course?: string; search?: string; pinned?: boolean }) =>
              api.get<ApiResponse<Note[]>>('/notes', { params }),
  getById : (id: string) => api.get<ApiResponse<Note>>(`/notes/${id}`),
  create  : (data: Partial<Note>) => api.post<ApiResponse<Note>>('/notes', data),
  update  : (id: string, data: Partial<Note>) => api.put<ApiResponse<Note>>(`/notes/${id}`, data),
  pin     : (id: string) => api.patch<ApiResponse<Note>>(`/notes/${id}/pin`),
  delete  : (id: string) => api.delete<ApiResponse<void>>(`/notes/${id}`),
};

// ── Flashcards ────────────────────────────────────────────
/**
 * Flashcard decks and cards. `reviewCard` tells the backend whether
 * the answer was correct and how hard it felt, so card difficulty
 * can be tracked over time.
 */
export const flashcardsApi = {
  getAll       : (params?: { course?: string }) => api.get<ApiResponse<FlashDeck[]>>('/flashcards', { params }),
  getDeck      : (deckId: string) => api.get<ApiResponse<FlashDeck>>(`/flashcards/${deckId}`),
  createDeck   : (data: Partial<FlashDeck>) => api.post<ApiResponse<FlashDeck>>('/flashcards', data),
  deleteDeck   : (deckId: string) => api.delete<ApiResponse<void>>(`/flashcards/${deckId}`),
  addCard      : (deckId: string, data: Partial<FlashCard>) => api.post<ApiResponse<FlashCard>>(`/flashcards/${deckId}/cards`, data),
  reviewCard   : (deckId: string, cardId: string, result: { correct: boolean; difficulty: string }) =>
                   api.patch<ApiResponse<FlashCard>>(`/flashcards/${deckId}/cards/${cardId}/review`, result),
  deleteCard   : (deckId: string, cardId: string) => api.delete<ApiResponse<void>>(`/flashcards/${deckId}/cards/${cardId}`),
};

// Default export so callers can also use the bare client when needed.
export default api;
