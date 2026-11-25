// ============================================================
// API Types
// ============================================================
// TypeScript "interfaces" describe the exact shape of the data
// that comes back from the backend API. Editors use them for
// autocomplete and to catch typos at compile time — they produce
// no code in the final app. Each interface matches one API resource.

/** A homework item: what's due, when, and whether it's done. */
export interface Task {
  id             : string;
  title          : string;
  description    : string;
  deadline       : string;
  course         : string;
  // The "|" means the value must be one of these exact strings.
  type           : 'assignment' | 'exam' | 'project' | 'reading' | 'other';
  estimatedHours : number;
  // How much the task counts toward the course grade (percentage).
  weight         : number;
  tags           : string[];
  completed      : boolean;
  // null means the task hasn't been finished yet.
  completedAt    : string | null;
  createdAt      : string;
  updatedAt      : string;
  // Higher number = more important (used for sorting).
  priority       : number;
}

/** One recorded study period, including how focused it was. */
export interface StudySession {
  id                 : string;
  subject            : string;
  // Optional link to the Task this session was studying for.
  taskId             : string | null;
  // Minutes actually studied.
  duration           : number;
  // Minutes lost to distractions during the session.
  distractionMinutes : number;
  notes              : string;
  mood               : 'happy' | 'neutral' | 'tired' | 'stressed';
  // 0–100 self-rated or computed focus quality.
  productivity       : number;
  date               : string;
}

/** A block on the weekly timetable, e.g. a class or study session. */
export interface ScheduleSlot {
  id       : string;
  title    : string;
  day      : string;
  startTime: string;
  endTime  : string;
  subject  : string;
  type     : 'study' | 'class' | 'break' | 'exercise';
  color    : string;
  // true if the slot repeats every week.
  recurring: boolean;
}

/** A university course the student is enrolled in. */
export interface Course {
  id         : string;
  name       : string;
  code       : string;
  instructor : string;
  credits    : number;
  color      : string;
}

/** An important calendar entry for the semester (exam day, deadline...). */
export interface SemesterEvent {
  id          : string;
  title       : string;
  date        : string;
  type        : 'exam' | 'holiday' | 'submission' | 'other';
  course      : string;
  description : string;
}

/** A measurable goal, e.g. "study 20 hours by Nov 30". */
export interface Goal {
  id           : string;
  title        : string;
  targetDate   : string | null;
  // What is being measured (e.g. "hours", "tasks completed").
  metric       : string;
  targetValue  : number;
  currentValue : number;
  achieved     : boolean;
}

/** Preferences and study habits used to personalize AI advice. */
export interface UserProfile {
  name               : string;
  studyGoalHours     : number;
  pomodoroWork       : number;
  pomodoroBreak      : number;
  preferredStudyTime : string;
  subjects           : string[];
}

/** A task the AI flagged as at risk because of procrastination. */
export interface ProcrastinationItem {
  task                : Task;
  // Hours remaining until the deadline.
  hoursLeft           : number;
  totalStudiedMinutes : number;
  // Minutes of study the AI thinks this task still needs.
  requiredMinutes     : number;
  // 0–100 risk score: high = big gap between work needed and time left.
  procrastinationScore: number;
  suggestion          : string;
}

/** Summary of how distracted the student's study time was. */
export interface DistractionAnalysis {
  totalStudyMinutes      : number;
  totalDistractionMinutes: number;
  // 0–100: percentage of study time that stayed focused.
  focusScore             : number;
  // Same study/distraction numbers, broken down per subject name.
  bySubject              : Record<string, { study: number; distraction: number }>;
  verdict                : string;
}

/** A piece of AI advice, tagged by urgency. */
export interface TimeSuggestion {
  type    : string;
  message : string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

/** Big-picture stats shown on the dashboard/analytics page. */
export interface AnalyticsOverview {
  totalTasks        : number;
  completedTasks    : number;
  totalStudyMinutes : number;
  avgDailyMinutes   : number;
  // The last week of daily study numbers, for the trend chart.
  last7Days         : DailyLog[];
  streakDays        : number;
}

/** One day's study totals — a row in weekly trend data. */
export interface DailyLog {
  date               : string;
  studyMinutes       : number;
  distractionMinutes : number;
  sessions           : number;
}

/** Overall progress of the whole semester, computed by the AI. */
export interface SemesterProgress {
  totalTasks     : number;
  completed      : number;
  overdue        : number;
  upcoming       : number;
  // 0–100 percentage of all tasks finished.
  completionRate : number;
  // The same counts, broken down per course name.
  courseProgress : Record<string, { total: number; completed: number; overdue: number }>;
  // 0–100 "how healthy" the semester is overall.
  healthScore    : number;
}

/** A text note the student wrote, optionally pinned to the top. */
export interface Note {
  id       : string;
  title    : string;
  content  : string;
  course   : string;
  tags     : string[];
  color    : string;
  pinned   : boolean;
  createdAt: string;
  updatedAt: string;
}

/** One side of a flashcard pair, plus spaced-repetition stats. */
export interface FlashCard {
  id          : string;
  front       : string;
  back        : string;
  hint        : string;
  timesShown  : number;
  timesCorrect: number;
  // null until the card has been reviewed at least once.
  lastReviewed: string | null;
  difficulty  : 'new' | 'easy' | 'medium' | 'hard';
}

/** A named collection of flashcards for one course/topic. */
export interface FlashDeck {
  id         : string;
  name       : string;
  course     : string;
  description: string;
  cards      : FlashCard[];
  createdAt  : string;
  updatedAt  : string;
}

/** The envelope every backend response uses: status flag + payload. */
export interface ApiResponse<T> {
  success : boolean;
  data    : T;
  // Optional human-readable message (e.g. an error explanation).
  message?: string;
}
