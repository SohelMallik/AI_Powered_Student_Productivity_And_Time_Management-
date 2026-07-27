"""
API URL Configuration
Maps every endpoint to the correct view
"""
from django.urls import path
from . import views

urlpatterns = [

    # ── Health ──────────────────────────────────────────────
    path('health',                          views.health,                   name='health'),

    # ── Tasks ───────────────────────────────────────────────
    path('tasks',                           views.tasks_list,               name='tasks-list'),
    path('tasks/<str:task_id>',             views.task_detail,              name='task-detail'),
    path('tasks/<str:task_id>/complete',    views.task_complete,            name='task-complete'),

    # ── Schedule ────────────────────────────────────────────
    path('schedule',                        views.schedule_list,            name='schedule-list'),
    path('schedule/<str:slot_id>',          views.schedule_detail,          name='schedule-detail'),

    # ── Study Sessions ───────────────────────────────────────
    path('study-sessions',                  views.sessions_list,            name='sessions-list'),
    path('study-sessions/today',            views.sessions_today,           name='sessions-today'),
    path('study-sessions/analysis',         views.sessions_analysis,        name='sessions-analysis'),
    path('study-sessions/<str:session_id>', views.session_delete,           name='session-delete'),

    # ── Semester ─────────────────────────────────────────────
    path('semester',                        views.semester_get,             name='semester'),
    path('semester/courses',                views.semester_add_course,      name='semester-courses'),
    path('semester/courses/<str:course_id>',views.semester_delete_course,   name='semester-course-delete'),
    path('semester/events',                 views.semester_add_event,       name='semester-events'),
    path('semester/goals',                  views.semester_add_goal,        name='semester-goals'),
    path('semester/goals/<str:goal_id>',    views.semester_update_goal,     name='semester-goal-update'),

    # ── Analytics ────────────────────────────────────────────
    path('analytics/overview',              views.analytics_overview,       name='analytics-overview'),
    path('analytics/weekly',                views.analytics_weekly,         name='analytics-weekly'),
    path('analytics/productivity-trend',    views.analytics_productivity_trend, name='analytics-trend'),

    # ── AI ───────────────────────────────────────────────────
    path('ai/insights',                     views.ai_insights,              name='ai-insights'),
    path('ai/analyze',                      views.ai_analyze,               name='ai-analyze'),
    path('ai/procrastination',              views.ai_procrastination,       name='ai-procrastination'),
    path('ai/distraction-analysis',         views.ai_distraction,           name='ai-distraction'),
    path('ai/time-optimization',            views.ai_time_optimization,     name='ai-time-opt'),
    path('ai/semester-progress',            views.ai_semester_progress,     name='ai-semester'),
    path('ai/profile',                      views.ai_profile,               name='ai-profile'),
]
