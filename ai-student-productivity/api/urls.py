"""
API URL Configuration
Maps every endpoint to the correct view
"""
from django.urls import path
from . import views

urlpatterns = [

    # ── Health ──────────────────────────────────────────────────
    path('health/',                              views.health,                        name='health'),
    path('health',                               views.health,                        name='health-noslash'),

    # ── Tasks ────────────────────────────────────────────────────
    path('tasks/',                               views.tasks_list,                    name='tasks-list'),
    path('tasks',                                views.tasks_list,                    name='tasks-list-ns'),
    # IMPORTANT: specific sub-paths must come BEFORE the generic <task_id>
    path('tasks/<str:task_id>/complete/',        views.task_complete,                 name='task-complete'),
    path('tasks/<str:task_id>/complete',         views.task_complete,                 name='task-complete-ns'),
    path('tasks/<str:task_id>/',                 views.task_detail,                   name='task-detail'),
    path('tasks/<str:task_id>',                  views.task_detail,                   name='task-detail-ns'),

    # ── Schedule ─────────────────────────────────────────────────
    path('schedule/',                            views.schedule_list,                 name='schedule-list'),
    path('schedule',                             views.schedule_list,                 name='schedule-list-ns'),
    path('schedule/<str:slot_id>/',              views.schedule_detail,               name='schedule-detail'),
    path('schedule/<str:slot_id>',               views.schedule_detail,               name='schedule-detail-ns'),

    # ── Study Sessions (specific routes BEFORE parameterised) ────
    path('study-sessions/',                      views.sessions_list,                 name='sessions-list'),
    path('study-sessions',                       views.sessions_list,                 name='sessions-list-ns'),
    path('study-sessions/today/',                views.sessions_today,                name='sessions-today'),
    path('study-sessions/today',                 views.sessions_today,                name='sessions-today-ns'),
    path('study-sessions/analysis/',             views.sessions_analysis,             name='sessions-analysis'),
    path('study-sessions/analysis',              views.sessions_analysis,             name='sessions-analysis-ns'),
    path('study-sessions/<str:session_id>/',     views.session_delete,                name='session-delete'),
    path('study-sessions/<str:session_id>',      views.session_delete,                name='session-delete-ns'),

    # ── Semester ──────────────────────────────────────────────────
    path('semester/',                            views.semester_get,                  name='semester'),
    path('semester',                             views.semester_get,                  name='semester-ns'),
    path('semester/courses/',                    views.semester_add_course,           name='semester-courses'),
    path('semester/courses',                     views.semester_add_course,           name='semester-courses-ns'),
    path('semester/courses/<str:course_id>/',    views.semester_delete_course,        name='semester-course-delete'),
    path('semester/courses/<str:course_id>',     views.semester_delete_course,        name='semester-course-delete-ns'),
    path('semester/events/',                     views.semester_add_event,            name='semester-events'),
    path('semester/events',                      views.semester_add_event,            name='semester-events-ns'),
    path('semester/goals/',                      views.semester_add_goal,             name='semester-goals'),
    path('semester/goals',                       views.semester_add_goal,             name='semester-goals-ns'),
    path('semester/goals/<str:goal_id>/',        views.semester_update_goal,          name='semester-goal-update'),
    path('semester/goals/<str:goal_id>',         views.semester_update_goal,          name='semester-goal-update-ns'),

    # ── Analytics ─────────────────────────────────────────────────
    path('analytics/overview/',                  views.analytics_overview,            name='analytics-overview'),
    path('analytics/overview',                   views.analytics_overview,            name='analytics-overview-ns'),
    path('analytics/weekly/',                    views.analytics_weekly,              name='analytics-weekly'),
    path('analytics/weekly',                     views.analytics_weekly,              name='analytics-weekly-ns'),
    path('analytics/productivity-trend/',        views.analytics_productivity_trend,  name='analytics-trend'),
    path('analytics/productivity-trend',         views.analytics_productivity_trend,  name='analytics-trend-ns'),

    # ── AI ────────────────────────────────────────────────────────
    path('ai/insights/',                         views.ai_insights,                   name='ai-insights'),
    path('ai/insights',                          views.ai_insights,                   name='ai-insights-ns'),
    path('ai/analyze/',                          views.ai_analyze,                    name='ai-analyze'),
    path('ai/analyze',                           views.ai_analyze,                    name='ai-analyze-ns'),
    path('ai/procrastination/',                  views.ai_procrastination,            name='ai-procrastination'),
    path('ai/procrastination',                   views.ai_procrastination,            name='ai-procrastination-ns'),
    path('ai/distraction-analysis/',             views.ai_distraction,                name='ai-distraction'),
    path('ai/distraction-analysis',              views.ai_distraction,                name='ai-distraction-ns'),
    path('ai/time-optimization/',                views.ai_time_optimization,          name='ai-time-opt'),
    path('ai/time-optimization',                 views.ai_time_optimization,          name='ai-time-opt-ns'),
    path('ai/semester-progress/',                views.ai_semester_progress,          name='ai-semester'),
    path('ai/semester-progress',                 views.ai_semester_progress,          name='ai-semester-ns'),
    path('ai/profile/',                          views.ai_profile,                    name='ai-profile'),
    path('ai/profile',                           views.ai_profile,                    name='ai-profile-ns'),
]
