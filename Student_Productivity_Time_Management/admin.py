from django.contrib import admin
from .models import Task, StudySession, SemesterPlan, Contact


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display  = ('task', 'user', 'priority', 'category', 'due_date', 'reminder', 'is_completed', 'created_at')
    list_filter   = ('priority', 'category', 'is_completed', 'reminder')
    search_fields = ('task', 'user__username')
    ordering      = ('-created_at',)


@admin.register(StudySession)
class StudySessionAdmin(admin.ModelAdmin):
    list_display  = ('user', 'subject', 'duration_minutes', 'technique', 'session_date', 'created_at')
    list_filter   = ('session_date', 'technique')
    search_fields = ('user__username', 'subject')
    ordering      = ('-session_date',)


@admin.register(SemesterPlan)
class SemesterPlanAdmin(admin.ModelAdmin):
    list_display  = ('user', 'title', 'semester', 'start_date', 'end_date', 'created_at')
    search_fields = ('user__username', 'title', 'semester')
    ordering      = ('-created_at',)


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display  = ('name', 'email', 'issue', 'priority', 'created_at')
    list_filter   = ('priority', 'issue')
    search_fields = ('name', 'email')
    ordering      = ('-created_at',)
