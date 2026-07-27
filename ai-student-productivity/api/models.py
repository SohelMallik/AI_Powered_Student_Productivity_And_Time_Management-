"""
Django Models – AI Student Productivity
All data stored in SQLite (zero config, just python manage.py migrate)
"""
import uuid
from django.db import models
from django.utils import timezone


def gen_uuid():
    return str(uuid.uuid4())


# ── Task ──────────────────────────────────────────────────────
class Task(models.Model):
    TASK_TYPES = [
        ('assignment', 'Assignment'),
        ('exam',       'Exam'),
        ('project',    'Project'),
        ('reading',    'Reading'),
        ('other',      'Other'),
    ]
    id             = models.CharField(max_length=36, primary_key=True, default=gen_uuid, editable=False)
    title          = models.CharField(max_length=255)
    description    = models.TextField(blank=True, default='')
    deadline       = models.DateTimeField()
    course         = models.CharField(max_length=100, default='General')
    type           = models.CharField(max_length=20, choices=TASK_TYPES, default='assignment')
    estimated_hours = models.FloatField(default=2.0)
    weight         = models.IntegerField(default=5)        # 1-10 importance
    tags           = models.JSONField(default=list)
    completed      = models.BooleanField(default=False)
    completed_at   = models.DateTimeField(null=True, blank=True)
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


# ── Schedule Slot ─────────────────────────────────────────────
class ScheduleSlot(models.Model):
    SLOT_TYPES = [
        ('study',    'Study'),
        ('class',    'Class'),
        ('break',    'Break'),
        ('exercise', 'Exercise'),
    ]
    DAYS = [
        ('monday',    'Monday'),
        ('tuesday',   'Tuesday'),
        ('wednesday', 'Wednesday'),
        ('thursday',  'Thursday'),
        ('friday',    'Friday'),
        ('saturday',  'Saturday'),
        ('sunday',    'Sunday'),
    ]
    id         = models.CharField(max_length=36, primary_key=True, default=gen_uuid, editable=False)
    title      = models.CharField(max_length=100)
    day        = models.CharField(max_length=10, choices=DAYS)
    start_time = models.TimeField()
    end_time   = models.TimeField()
    subject    = models.CharField(max_length=100, default='General')
    type       = models.CharField(max_length=20, choices=SLOT_TYPES, default='study')
    color      = models.CharField(max_length=20, default='#3b82d4')
    recurring  = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['day', 'start_time']

    def __str__(self):
        return f"{self.title} ({self.day} {self.start_time})"


# ── Study Session ─────────────────────────────────────────────
class StudySession(models.Model):
    MOOD_CHOICES = [
        ('happy',    'Happy'),
        ('neutral',  'Neutral'),
        ('tired',    'Tired'),
        ('stressed', 'Stressed'),
    ]
    id                  = models.CharField(max_length=36, primary_key=True, default=gen_uuid, editable=False)
    subject             = models.CharField(max_length=100)
    task                = models.ForeignKey(Task, null=True, blank=True, on_delete=models.SET_NULL, related_name='sessions')
    duration            = models.IntegerField()            # minutes
    distraction_minutes = models.IntegerField(default=0)
    notes               = models.TextField(blank=True, default='')
    mood                = models.CharField(max_length=10, choices=MOOD_CHOICES, default='neutral')
    productivity        = models.IntegerField(default=5)   # 1-10
    date                = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.subject} – {self.duration}min on {self.date.date()}"


# ── Course ────────────────────────────────────────────────────
class Course(models.Model):
    id         = models.CharField(max_length=36, primary_key=True, default=gen_uuid, editable=False)
    name       = models.CharField(max_length=100)
    code       = models.CharField(max_length=30, blank=True, default='')
    instructor = models.CharField(max_length=100, blank=True, default='')
    credits    = models.IntegerField(default=3)
    color      = models.CharField(max_length=20, default='#3b82d4')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


# ── Semester Event ────────────────────────────────────────────
class SemesterEvent(models.Model):
    EVENT_TYPES = [
        ('exam',       'Exam'),
        ('holiday',    'Holiday'),
        ('submission', 'Submission'),
        ('other',      'Other'),
    ]
    id          = models.CharField(max_length=36, primary_key=True, default=gen_uuid, editable=False)
    title       = models.CharField(max_length=200)
    date        = models.DateField()
    type        = models.CharField(max_length=20, choices=EVENT_TYPES, default='other')
    course      = models.CharField(max_length=100, blank=True, default='')
    description = models.TextField(blank=True, default='')
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date']

    def __str__(self):
        return f"{self.title} ({self.date})"


# ── Goal ──────────────────────────────────────────────────────
class Goal(models.Model):
    id            = models.CharField(max_length=36, primary_key=True, default=gen_uuid, editable=False)
    title         = models.CharField(max_length=200)
    target_date   = models.DateField(null=True, blank=True)
    metric        = models.CharField(max_length=50, default='completion')
    target_value  = models.IntegerField(default=100)
    current_value = models.IntegerField(default=0)
    achieved      = models.BooleanField(default=False)
    created_at    = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


# ── User Profile ──────────────────────────────────────────────
class UserProfile(models.Model):
    id                   = models.AutoField(primary_key=True)
    name                 = models.CharField(max_length=100, default='Student')
    study_goal_hours     = models.IntegerField(default=6)
    pomodoro_work        = models.IntegerField(default=25)
    pomodoro_break       = models.IntegerField(default=5)
    preferred_study_time = models.CharField(max_length=20, default='morning')
    subjects             = models.JSONField(default=list)

    def __str__(self):
        return self.name

    @classmethod
    def get_profile(cls):
        """Always return the single profile (create if missing)."""
        profile, _ = cls.objects.get_or_create(id=1)
        return profile


# ── Daily Analytics Log ───────────────────────────────────────
class DailyLog(models.Model):
    date                = models.DateField(unique=True)
    study_minutes       = models.IntegerField(default=0)
    distraction_minutes = models.IntegerField(default=0)
    sessions            = models.IntegerField(default=0)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"Log {self.date} – {self.study_minutes}min"
