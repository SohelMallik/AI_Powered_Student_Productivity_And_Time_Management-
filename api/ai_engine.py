"""
AI Engine – Python port of the Node.js AI logic
Priority scoring, procrastination detection, study analysis, time optimization
"""
from datetime import datetime, timezone
from django.utils import timezone as dj_tz


# ── Priority Scoring ─────────────────────────────────────────
def calculate_priority(task) -> int:
    """
    Priority = urgency(50%) + importance(35%) + effort(15%)
    Returns 0-100 integer.
    """
    now = dj_tz.now()

    if hasattr(task.deadline, 'tzinfo') and task.deadline.tzinfo is None:
        from django.utils.timezone import make_aware
        deadline = make_aware(task.deadline)
    else:
        deadline = task.deadline

    hours_left  = (deadline - now).total_seconds() / 3600
    days_left   = hours_left / 24
    urgency     = max(0, 100 - days_left * 5) if hours_left > 0 else 100
    importance  = (task.weight or 5) * 10
    effort      = 100 - (task.estimated_hours or 2) * 5
    score       = urgency * 0.5 + importance * 0.35 + effort * 0.15
    return round(min(100, max(0, score)))


# ── Overdue Tasks ─────────────────────────────────────────────
def detect_overdue(tasks):
    now = dj_tz.now()
    return [t for t in tasks if not t.completed and t.deadline < now]


# ── Procrastination Detector ──────────────────────────────────
def detect_procrastination(tasks, sessions):
    """
    Flag tasks due within 48h where < 25% of estimated study time is logged.
    Returns list of dicts with task info + tip.
    """
    from django.conf import settings
    threshold_min = getattr(settings, 'PROCRASTINATION_THRESHOLD_MINUTES', 30)
    now           = dj_tz.now()
    results       = []

    for task in tasks:
        if task.completed:
            continue
        hours_left = (task.deadline - now).total_seconds() / 3600
        if hours_left > 48:
            continue

        # Total studied minutes for this task
        task_sessions   = [s for s in sessions if s.task_id == task.id]
        total_studied   = sum(s.duration for s in task_sessions)
        required_min    = (task.estimated_hours or 2) * 60
        created_age_min = (now - task.created_at).total_seconds() / 60

        if created_age_min > threshold_min and total_studied < required_min * 0.25:
            score = round((1 - total_studied / max(required_min, 1)) * 100)
            results.append({
                'task':                   _task_dict(task),
                'hoursLeft':              round(hours_left, 1),
                'totalStudiedMinutes':    total_studied,
                'requiredMinutes':        required_min,
                'procrastinationScore':   score,
                'suggestion':             _proc_tip(task, hours_left, total_studied),
            })

    return sorted(results, key=lambda x: -x['procrastinationScore'])


def _proc_tip(task, hours_left, studied_min):
    if hours_left < 6:
        return f"⚠️ CRITICAL: \"{task.title}\" is due in {hours_left:.0f}h. Start NOW with a 25-min focused sprint!"
    if hours_left < 24:
        return f"🔥 \"{task.title}\" is due tomorrow. Break it into 3 focused sessions today."
    return f"📌 You've only studied {studied_min} min for \"{task.title}\". Schedule at least 2 sessions before the deadline."


# ── Study vs Distraction ──────────────────────────────────────
def analyze_study_vs_distraction(sessions):
    total_study = sum(s.duration for s in sessions)
    total_distr = sum(s.distraction_minutes for s in sessions)
    focus_score = round(((total_study - total_distr) / total_study) * 100) if total_study > 0 else 0

    by_subject = {}
    for s in sessions:
        sub = s.subject or 'General'
        if sub not in by_subject:
            by_subject[sub] = {'study': 0, 'distraction': 0}
        by_subject[sub]['study']       += s.duration
        by_subject[sub]['distraction'] += s.distraction_minutes

    if focus_score >= 80:
        verdict = '🌟 Excellent focus!'
    elif focus_score >= 60:
        verdict = '👍 Good – minor distractions'
    elif focus_score >= 40:
        verdict = '⚠️ Moderate distraction – try Pomodoro'
    else:
        verdict = '🚨 High distraction – consider a study-only environment'

    return {
        'totalStudyMinutes':       total_study,
        'totalDistractionMinutes': total_distr,
        'focusScore':              focus_score,
        'bySubject':               by_subject,
        'verdict':                 verdict,
    }


# ── Time Optimization ─────────────────────────────────────────
def suggest_time_optimization(tasks, sessions, profile):
    suggestions   = []
    now           = dj_tz.now()
    today_str     = now.date()
    daily_goal    = (profile.study_goal_hours or 6) * 60
    today_studied = sum(s.duration for s in sessions if s.date.date() == today_str)
    remaining     = daily_goal - today_studied

    if remaining > 0:
        suggestions.append({
            'type':     'daily-goal',
            'message':  f"You need {remaining} more minutes today to hit your {profile.study_goal_hours}h goal.",
            'priority': 'high',
        })

    # Top 3 priority tasks
    pending = [t for t in tasks if not t.completed]
    pending_sorted = sorted(pending, key=lambda t: -calculate_priority(t))
    for i, task in enumerate(pending_sorted[:3]):
        pri_score = calculate_priority(task)
        suggestions.append({
            'type':     'task-focus',
            'message':  f"[#{i+1}] Focus on \"{task.title}\" – due {_from_now(task.deadline)}, priority {pri_score}",
            'priority': 'critical' if pri_score > 70 else 'high' if pri_score > 40 else 'medium',
        })

    if today_studied == 0:
        suggestions.append({
            'type':     'pomodoro',
            'message':  f"Start with a {profile.pomodoro_work or 25}-min Pomodoro session right now!",
            'priority': 'medium',
        })

    if now.weekday() == 4:   # Friday
        suggestions.append({
            'type':     'planning',
            'message':  "It's Friday! Plan next week's study sessions now to avoid Sunday panic.",
            'priority': 'low',
        })

    return suggestions


# ── Semester Progress ─────────────────────────────────────────
def analyze_semester_progress(courses, tasks):
    from datetime import timedelta
    now         = dj_tz.now()
    week_ahead  = now + timedelta(days=7)
    total       = len(tasks)
    completed   = sum(1 for t in tasks if t.completed)
    overdue     = sum(1 for t in tasks if not t.completed and t.deadline < now)
    upcoming    = sum(1 for t in tasks if not t.completed and now < t.deadline < week_ahead)
    comp_rate   = round((completed / total) * 100) if total > 0 else 0
    health      = max(0, 100 - overdue * 15 - (total - completed) * 2)

    course_progress = {}
    for course in courses:
        ct     = [t for t in tasks if t.course == course.name]
        co     = sum(1 for t in ct if t.completed)
        ov     = sum(1 for t in ct if not t.completed and t.deadline < now)
        course_progress[course.name] = {'total': len(ct), 'completed': co, 'overdue': ov}

    return {
        'totalTasks':      total,
        'completed':       completed,
        'overdue':         overdue,
        'upcoming':        upcoming,
        'completionRate':  comp_rate,
        'courseProgress':  course_progress,
        'healthScore':     health,
    }


# ── Helpers ───────────────────────────────────────────────────
def _task_dict(task):
    return {
        'id': task.id, 'title': task.title, 'course': task.course,
        'deadline': task.deadline.isoformat(), 'estimatedHours': task.estimated_hours,
    }

def _from_now(dt):
    now   = dj_tz.now()
    diff  = dt - now
    hours = diff.total_seconds() / 3600
    if diff.total_seconds() < 0: return 'overdue'
    if hours < 24:   return f'in {int(hours)}h'
    days = int(hours / 24)
    return f'in {days}d'
