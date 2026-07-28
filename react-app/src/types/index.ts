// ============================================================
// API Types
// ============================================================
export interface Task {
  id             : string;
  title          : string;
  description    : string;
  deadline       : string;
  course         : string;
  type           : 'assignment' | 'exam' | 'project' | 'reading' | 'other';
  estimatedHours : number;
  weight         : number;
  tags           : string[];
  completed      : boolean;
  completedAt    : string | null;
  createdAt      : string;
  updatedAt      : string;
  priority       : number;
}

export interface StudySession {
  id                 : string;
  subject            : string;
  taskId             : string | null;
  duration           : number;
  distractionMinutes : number;
  notes              : string;
  mood               : 'happy' | 'neutral' | 'tired' | 'stressed';
  productivity       : number;
  date               : string;
}

export interface ScheduleSlot {
  id       : string;
  title    : string;
  day      : string;
  startTime: string;
  endTime  : string;
  subject  : string;
  type     : 'study' | 'class' | 'break' | 'exercise';
  color    : string;
  recurring: boolean;
}

export interface Course {
  id         : string;
  name       : string;
  code       : string;
  instructor : string;
  credits    : number;
  color      : string;
}

export interface SemesterEvent {
  id          : string;
  title       : string;
  date        : string;
  type        : 'exam' | 'holiday' | 'submission' | 'other';
  course      : string;
  description : string;
}

export interface Goal {
  id           : string;
  title        : string;
  targetDate   : string | null;
  metric       : string;
  targetValue  : number;
  currentValue : number;
  achieved     : boolean;
}

export interface UserProfile {
  name               : string;
  studyGoalHours     : number;
  pomodoroWork       : number;
  pomodoroBreak      : number;
  preferredStudyTime : string;
  subjects           : string[];
}

export interface ProcrastinationItem {
  task                : Task;
  hoursLeft           : number;
  totalStudiedMinutes : number;
  requiredMinutes     : number;
  procrastinationScore: number;
  suggestion          : string;
}

export interface DistractionAnalysis {
  totalStudyMinutes      : number;
  totalDistractionMinutes: number;
  focusScore             : number;
  bySubject              : Record<string, { study: number; distraction: number }>;
  verdict                : string;
}

export interface TimeSuggestion {
  type    : string;
  message : string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface AnalyticsOverview {
  totalTasks        : number;
  completedTasks    : number;
  totalStudyMinutes : number;
  avgDailyMinutes   : number;
  last7Days         : DailyLog[];
  streakDays        : number;
}

export interface DailyLog {
  date               : string;
  studyMinutes       : number;
  distractionMinutes : number;
  sessions           : number;
}

export interface SemesterProgress {
  totalTasks     : number;
  completed      : number;
  overdue        : number;
  upcoming       : number;
  completionRate : number;
  courseProgress : Record<string, { total: number; completed: number; overdue: number }>;
  healthScore    : number;
}

export interface ApiResponse<T> {
  success : boolean;
  data    : T;
  message?: string;
}
