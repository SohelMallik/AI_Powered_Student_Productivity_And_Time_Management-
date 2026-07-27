// ============================================================
// Axios API Client
// ============================================================
import axios from 'axios';
import type {
  Task, StudySession, ScheduleSlot, AnalyticsOverview,
  DailyLog, UserProfile, ProcrastinationItem, DistractionAnalysis,
  TimeSuggestion, SemesterProgress, Course, SemesterEvent, Goal,
  ApiResponse,
} from '@/types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── Tasks ─────────────────────────────────────────────────
export const tasksApi = {
  getAll  : ()         => api.get<ApiResponse<Task[]>>('/tasks'),
  getById : (id: string)            => api.get<ApiResponse<Task>>(`/tasks/${id}`),
  create  : (data: Partial<Task>)   => api.post<ApiResponse<Task>>('/tasks', data),
  update  : (id: string, data: Partial<Task>) => api.put<ApiResponse<Task>>(`/tasks/${id}`, data),
  complete: (id: string)            => api.patch<ApiResponse<Task>>(`/tasks/${id}/complete`),
  delete  : (id: string)            => api.delete<ApiResponse<void>>(`/tasks/${id}`),
};

// ── Schedule ──────────────────────────────────────────────
export const scheduleApi = {
  getAll : ()                              => api.get<ApiResponse<ScheduleSlot[]>>('/schedule'),
  create : (data: Partial<ScheduleSlot>)   => api.post<ApiResponse<ScheduleSlot>>('/schedule', data),
  update : (id: string, d: Partial<ScheduleSlot>) => api.put<ApiResponse<ScheduleSlot>>(`/schedule/${id}`, d),
  delete : (id: string)                    => api.delete<ApiResponse<void>>(`/schedule/${id}`),
};

// ── Study Sessions ────────────────────────────────────────
export const studyApi = {
  getAll    : ()                               => api.get<ApiResponse<StudySession[]>>('/study-sessions'),
  getToday  : ()                               => api.get<ApiResponse<StudySession[]> & { totalMinutes: number }>('/study-sessions/today'),
  getAnalysis: ()                              => api.get<ApiResponse<DistractionAnalysis>>('/study-sessions/analysis'),
  create    : (data: Partial<StudySession>)    => api.post<ApiResponse<StudySession>>('/study-sessions', data),
  delete    : (id: string)                     => api.delete<ApiResponse<void>>(`/study-sessions/${id}`),
};

// ── Semester ──────────────────────────────────────────────
export const semesterApi = {
  get         : ()                          => api.get('/semester'),
  addCourse   : (data: Partial<Course>)     => api.post<ApiResponse<Course>>('/semester/courses', data),
  deleteCourse: (id: string)                => api.delete<ApiResponse<void>>(`/semester/courses/${id}`),
  addEvent    : (data: Partial<SemesterEvent>) => api.post<ApiResponse<SemesterEvent>>('/semester/events', data),
  addGoal     : (data: Partial<Goal>)       => api.post<ApiResponse<Goal>>('/semester/goals', data),
  updateGoal  : (id: string, d: Partial<Goal>) => api.patch<ApiResponse<Goal>>(`/semester/goals/${id}`, d),
};

// ── Analytics ─────────────────────────────────────────────
export const analyticsApi = {
  overview : ()  => api.get<ApiResponse<AnalyticsOverview>>('/analytics/overview'),
  weekly   : ()  => api.get<ApiResponse<DailyLog[]>>('/analytics/weekly'),
  productivityTrend: () => api.get('/analytics/productivity-trend'),
};

// ── AI ────────────────────────────────────────────────────
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

export default api;
