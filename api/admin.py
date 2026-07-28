"""
Django Admin – Register all models for admin panel at /admin
"""
from django.contrib import admin
from .models import Task, ScheduleSlot, StudySession, Course, SemesterEvent, Goal, UserProfile, DailyLog


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display  = ('title', 'course', 'type', 'deadline', 'completed', 'weight')
    list_filter   = ('completed', 'type', 'course')
    search_fields = ('title', 'description', 'course')
    ordering      = ('-created_at',)


@admin.register(ScheduleSlot)
class ScheduleSlotAdmin(admin.ModelAdmin):
    list_display = ('title', 'day', 'start_time', 'end_time', 'type', 'subject')
    list_filter  = ('day', 'type')


@admin.register(StudySession)
class StudySessionAdmin(admin.ModelAdmin):
    list_display  = ('subject', 'duration', 'distraction_minutes', 'mood', 'productivity', 'date')
    list_filter   = ('mood', 'subject')
    ordering      = ('-date',)


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'instructor', 'credits')


@admin.register(SemesterEvent)
class SemesterEventAdmin(admin.ModelAdmin):
    list_display = ('title', 'date', 'type', 'course')
    list_filter  = ('type',)
    ordering     = ('date',)


@admin.register(Goal)
class GoalAdmin(admin.ModelAdmin):
    list_display = ('title', 'current_value', 'target_value', 'achieved', 'target_date')


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('name', 'study_goal_hours', 'pomodoro_work', 'pomodoro_break')


@admin.register(DailyLog)
class DailyLogAdmin(admin.ModelAdmin):
    list_display = ('date', 'study_minutes', 'distraction_minutes', 'sessions')
    ordering     = ('-date',)
