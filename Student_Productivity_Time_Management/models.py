from django.db import models
from django.contrib.auth.models import User


# ─────────────────────────────────────────────
#  Task — covers terms 1, 3, 5, 6, 8, 10, 12
# ─────────────────────────────────────────────
class Task(models.Model):
    PRIORITY_CHOICES = [
        ('Low',    'Low'),
        ('Medium', 'Medium'),
        ('High',   'High'),
    ]

    CATEGORY_CHOICES = [
        ('Assignment', 'Assignment'),   # term 5
        ('Exam',       'Exam'),         # term 5
        ('Project',    'Project'),      # term 5
        ('Reading',    'Reading'),      # term 2
        ('Revision',   'Revision'),     # term 11
        ('Other',      'Other'),
    ]

    REMINDER_CHOICES = [
        ('none',     'No Reminder'),
        ('1_day',    '1 Day Before'),
        ('3_days',   '3 Days Before'),
        ('1_week',   '1 Week Before'),
    ]

    user         = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    task         = models.CharField(max_length=500)
    is_completed = models.BooleanField(default=False)
    priority     = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='Medium')
    category     = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='Other')
    due_date     = models.DateField(null=True, blank=True)
    reminder     = models.CharField(max_length=10, choices=REMINDER_CHOICES, default='none')  # term 6
    notes        = models.TextField(blank=True)   # term 13 — personal study notes
    created_at   = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        ordering = ['is_completed', 'due_date']

    def __str__(self):
        return f"{self.task}"


# ─────────────────────────────────────────────
#  StudySession — covers terms 2, 4, 7, 9, 10
# ─────────────────────────────────────────────
class StudySession(models.Model):
    TECHNIQUE_CHOICES = [
        ('normal',    'Normal Study'),
        ('pomodoro',  'Pomodoro (25/5)'),
        ('deep',      'Deep Work Block'),
        ('review',    'Review & Recap'),
    ]

    user             = models.ForeignKey(User, on_delete=models.CASCADE)
    subject          = models.CharField(max_length=200)
    duration_minutes = models.PositiveIntegerField()
    session_date     = models.DateField()
    technique        = models.CharField(max_length=10, choices=TECHNIQUE_CHOICES, default='normal')  # term 7
    notes            = models.TextField(blank=True)
    created_at       = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} — {self.subject} ({self.session_date})"


# ─────────────────────────────────────────────
#  SemesterPlan — covers terms 11, 13
# ─────────────────────────────────────────────
class SemesterPlan(models.Model):
    user        = models.ForeignKey(User, on_delete=models.CASCADE)
    title       = models.CharField(max_length=200)          # e.g. "Semester 2 — Computer Science"
    semester    = models.CharField(max_length=50)           # e.g. "Spring 2025"
    goal        = models.TextField()                        # personalised study goal (term 13)
    start_date  = models.DateField()
    end_date    = models.DateField()
    created_at  = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} — {self.title}"


# ─────────────────────────────────────────────
#  Contact — support form
# ─────────────────────────────────────────────
class Contact(models.Model):
    PRIORITY_CHOICES = [
        ('Low',    'Low'),
        ('Medium', 'Medium'),
        ('High',   'High'),
    ]

    ISSUE_CHOICES = [
        ('task_not_created',   'Task Not Created'),
        ('task_not_saved',     'Task Not Saved'),
        ('task_not_completed', 'Task Not Completed'),
        ('task_not_edited',    'Task Not Edited'),
        ('task_not_deleted',   'Task Not Deleted'),
        ('other',              'Other'),
    ]

    name       = models.CharField(max_length=100)
    email      = models.EmailField()
    issue      = models.CharField(max_length=50, choices=ISSUE_CHOICES)
    priority   = models.CharField(max_length=20, choices=PRIORITY_CHOICES)
    message    = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
