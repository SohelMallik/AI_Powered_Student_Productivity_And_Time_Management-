from django.shortcuts import redirect, render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.paginator import Paginator
from datetime import date, timedelta

from .models import Task, StudySession, SemesterPlan, Contact
from todolist.forms import TaskForm, StudySessionForm, SemesterPlanForm
from todolist.ai_engine import generate_ai_study_plan


# ──────────────────────────────────────────────────────
#  Public pages
# ──────────────────────────────────────────────────────

def homepage(request):
    return render(request, 'main.html', {'page': 'homepage'})


def aboutus(request):
    return render(request, 'aboutus.html', {'page': 'aboutus'})


def contact(request):
    if request.method == "POST":
        Contact.objects.create(
            name=request.POST.get("name"),
            email=request.POST.get("email"),
            issue=request.POST.get("issue"),
            priority=request.POST.get("priority"),
            message=request.POST.get("message"),
        )
        messages.success(request, "Your message has been submitted successfully!")
        return redirect("contact")
    return render(request, "contact.html")


def submit_contact(request):
    if request.method == "POST":
        Contact.objects.create(
            name=request.POST.get("name"),
            email=request.POST.get("email"),
            issue=request.POST.get("issue"),
            priority=request.POST.get("priority"),
            message=request.POST.get("message"),
        )
        messages.success(request, "Contact message submitted successfully!")
    return redirect("contact")


# ──────────────────────────────────────────────────────
#  Term 1 — Daily Task Management  (My Tasks)
# ──────────────────────────────────────────────────────

@login_required
def todolist(request):
    today = date.today()

    if request.method == "POST":
        form_data = TaskForm(request.POST)
        if form_data.is_valid():
            obj = form_data.save(commit=False)
            obj.user = request.user
            obj.save()
            messages.success(request, "Task added successfully!")
            return redirect("todolist")
        messages.error(request, "Failed to add task. Please check the form.")

    # Filters
    category_filter = request.GET.get('category', '')
    priority_filter = request.GET.get('priority', '')
    status_filter   = request.GET.get('status', '')

    qs = Task.objects.filter(user=request.user)
    if category_filter:
        qs = qs.filter(category=category_filter)
    if priority_filter:
        qs = qs.filter(priority=priority_filter)
    if status_filter == 'completed':
        qs = qs.filter(is_completed=True)
    elif status_filter == 'pending':
        qs = qs.filter(is_completed=False)

    paginator = Paginator(qs, 10)
    all_tasks = paginator.get_page(request.GET.get('page'))

    # Stats
    total     = Task.objects.filter(user=request.user).count()
    completed = Task.objects.filter(user=request.user, is_completed=True).count()
    pending   = total - completed
    overdue   = Task.objects.filter(user=request.user, is_completed=False, due_date__lt=today).count()
    due_today = Task.objects.filter(user=request.user, is_completed=False, due_date=today).count()
    progress_pct = int(completed / total * 100) if total > 0 else 0

    return render(request, 'todolist.html', {
        'all_tasks':       all_tasks,
        'total':           total,
        'completed':       completed,
        'pending':         pending,
        'overdue':         overdue,
        'due_today':       due_today,
        'progress_pct':    progress_pct,
        'category_filter': category_filter,
        'priority_filter': priority_filter,
        'status_filter':   status_filter,
        'categories':      Task.CATEGORY_CHOICES,
        'priorities':      Task.PRIORITY_CHOICES,
        'today':           today,
    })


@login_required
def delete_task(request, task_id):
    get_object_or_404(Task, id=task_id, user=request.user).delete()
    messages.success(request, "Task deleted successfully!")
    return redirect("todolist")


@login_required
def edit_task(request, task_id):
    task_obj = get_object_or_404(Task, id=task_id, user=request.user)
    if request.method == "POST":
        if not request.POST.get('task', '').strip():
            messages.error(request, "Task name cannot be empty!")
        else:
            form = TaskForm(request.POST, instance=task_obj)
            if form.is_valid():
                form.save()
                messages.success(request, "Task updated successfully!")
                return redirect("todolist")
            messages.error(request, "Failed to update task.")
    else:
        form = TaskForm(instance=task_obj)
    return render(request, 'edit.html', {'form': form, 'task_obj': task_obj})


@login_required
def complete_task(request, task_id):
    task = get_object_or_404(Task, id=task_id, user=request.user)
    task.is_completed = True
    task.save()
    messages.success(request, "Great job! Task marked as complete!")
    return redirect("todolist")


@login_required
def pending_task(request, task_id):
    task = get_object_or_404(Task, id=task_id, user=request.user)
    task.is_completed = False
    task.save()
    messages.success(request, "Task marked as pending.")
    return redirect("todolist")


# ──────────────────────────────────────────────────────
#  Term 9/10 — AI Dashboard (Analyze & Improve)
# ──────────────────────────────────────────────────────

@login_required
def dashboard(request):
    today    = date.today()
    week_ago = today - timedelta(days=7)

    # Task stats
    total     = Task.objects.filter(user=request.user).count()
    completed = Task.objects.filter(user=request.user, is_completed=True).count()
    pending   = total - completed
    overdue   = Task.objects.filter(user=request.user, is_completed=False, due_date__lt=today).count()
    due_today = Task.objects.filter(user=request.user, is_completed=False, due_date=today).count()
    progress_pct = int(completed / total * 100) if total > 0 else 0

    upcoming_tasks = Task.objects.filter(
        user=request.user, is_completed=False,
        due_date__gte=today, due_date__lte=today + timedelta(days=7)
    ).order_by('due_date')[:5]

    high_priority = Task.objects.filter(
        user=request.user, is_completed=False, priority='High'
    ).order_by('due_date')[:5]

    # Term 4 — Study Habit Tracking
    study_sessions    = StudySession.objects.filter(user=request.user, session_date__gte=week_ago).order_by('-session_date')[:7]
    total_study_mins  = sum(s.duration_minutes for s in study_sessions)
    total_study_hours = round(total_study_mins / 60, 1)

    # Term 8 — Procrastination Score (higher = more procrastination risk)
    procrastination_score = _calc_procrastination_score(pending, overdue, total_study_hours)

    # Term 2 — Study Session Form
    if request.method == "POST":
        session_form = StudySessionForm(request.POST)
        if session_form.is_valid():
            s = session_form.save(commit=False)
            s.user = request.user
            s.save()
            messages.success(request, "Study session logged successfully!")
            return redirect("dashboard")
    else:
        session_form = StudySessionForm()

    # Term 6 — Smart Reminders (tasks due within reminder window)
    reminder_alerts = _get_reminder_alerts(request.user, today)

    # Term 13 — AI Smart Tips (personalised study plan advice)
    smart_tips = _generate_smart_tips(request.user, today, overdue, pending, total_study_hours)

    # Term 9 — Category progress breakdown
    category_stats = []
    for cat_code, cat_label in Task.CATEGORY_CHOICES:
        count = Task.objects.filter(user=request.user, category=cat_code).count()
        done  = Task.objects.filter(user=request.user, category=cat_code, is_completed=True).count()
        if count > 0:
            category_stats.append({'label': cat_label, 'total': count, 'done': done,
                                    'pct': int(done / count * 100)})

    # Term 11 — Semester Plans
    semester_plans = SemesterPlan.objects.filter(user=request.user).order_by('-created_at')[:3]

    return render(request, 'dashboard.html', {
        'page':                'dashboard',
        'today':               today,
        'total':               total,
        'completed':           completed,
        'pending':             pending,
        'overdue':             overdue,
        'due_today':           due_today,
        'progress_pct':        progress_pct,
        'upcoming_tasks':      upcoming_tasks,
        'high_priority':       high_priority,
        'study_sessions':      study_sessions,
        'total_study_hours':   total_study_hours,
        'session_form':        session_form,
        'reminder_alerts':     reminder_alerts,
        'smart_tips':          smart_tips,
        'category_stats':      category_stats,
        'semester_plans':      semester_plans,
        'procrastination_score': procrastination_score,
    })


# ──────────────────────────────────────────────────────
#  Term 11 + 13 — Semester Planning & Personalised Plans
# ──────────────────────────────────────────────────────

@login_required
def semester_plan(request):
    plans = SemesterPlan.objects.filter(user=request.user).order_by('-created_at')
    form  = SemesterPlanForm()

    if request.method == "POST":
        form = SemesterPlanForm(request.POST)
        if form.is_valid():
            obj = form.save(commit=False)
            obj.user = request.user
            obj.save()
            messages.success(request, "Semester plan created!")
            return redirect("semester_plan")
        messages.error(request, "Please fix the errors below.")

    # Tasks for semester context
    today = date.today()
    upcoming = Task.objects.filter(user=request.user, is_completed=False,
                                   due_date__gte=today).order_by('due_date')[:10]
    return render(request, 'studyplan.html', {
        'plans':    plans,
        'form':     form,
        'upcoming': upcoming,
        'today':    today,
    })


@login_required
def delete_semester_plan(request, plan_id):
    get_object_or_404(SemesterPlan, id=plan_id, user=request.user).delete()
    messages.success(request, "Semester plan deleted.")
    return redirect("semester_plan")


# ──────────────────────────────────────────────────────
#  AI Engine helper functions
# ──────────────────────────────────────────────────────

def _generate_smart_tips(user, today, overdue, pending, study_hours_this_week):
    """
    Term 6 (Smart Reminders) + Term 7 (Better Time Management) +
    Term 8 (Reduce Procrastination) + Term 13 (Personalised Plans).
    Rule-based AI engine — analyses real student data.
    """
    tips = []

    # Term 5 — Deadline Alert
    if overdue > 0:
        tips.append({
            'icon': '🚨', 'type': 'danger',
            'title': 'Overdue Tasks Detected',
            'body': (f'You have {overdue} overdue task(s). Tackle them first — '
                     f'finishing late is better than never finishing.')
        })

    # Term 4 — Study Habit
    if study_hours_this_week < 2:
        tips.append({
            'icon': '📚', 'type': 'danger',
            'title': 'Critical: Very Low Study Time',
            'body': (f'Only {study_hours_this_week}h logged this week. '
                     f'Even 30 minutes daily builds strong academic habits.')
        })
    elif study_hours_this_week < 5:
        tips.append({
            'icon': '📖', 'type': 'warning',
            'title': 'Increase Study Time (Term #4)',
            'body': (f'{study_hours_this_week}h this week. Aim for 5–7h to maintain '
                     f'strong academic progress and reduce last-minute panic.')
        })
    elif study_hours_this_week >= 10:
        tips.append({
            'icon': '🌟', 'type': 'success',
            'title': 'Excellent Study Habit (Term #4)',
            'body': (f'You logged {study_hours_this_week}h this week! '
                     f'Outstanding commitment. Remember short breaks prevent burnout.')
        })

    # Term 8 — Procrastination
    if pending > 10:
        tips.append({
            'icon': '🗂️', 'type': 'warning',
            'title': 'Task Overload — Procrastination Risk (Term #8)',
            'body': (f'{pending} pending tasks. Break them into 15-minute micro-tasks. '
                     f'The 2-minute rule: if it takes < 2 min, do it NOW.')
        })

    # Term 3 — Priority Focus
    high_count = Task.objects.filter(user=user, priority='High', is_completed=False).count()
    if high_count > 0:
        tips.append({
            'icon': '🎯', 'type': 'info',
            'title': f'Focus on {high_count} High-Priority Tasks (Term #3)',
            'body': ('Use Pomodoro: 25 min deep focus on one High task, 5 min break. '
                     'Eat the frog — do the hardest task first each morning.')
        })

    # Term 7 — Time Management
    tips.append({
        'icon': '⏱️', 'type': 'info',
        'title': 'Time Management Tip (Term #7)',
        'body': ('Try time-blocking: assign fixed slots for each subject. '
                 'Review your schedule every Sunday for the coming week.')
    })

    # Term 14 — Academic Performance
    completed_today = Task.objects.filter(
        user=user, is_completed=True, created_at__date=date.today()
    ).count()
    if completed_today >= 3:
        tips.append({
            'icon': '🏆', 'type': 'success',
            'title': 'Improving Academic Performance (Term #14)',
            'body': (f'You completed {completed_today} tasks today! '
                     f'Consistent daily completion is the #1 driver of better grades.')
        })

    # Fallback
    if not tips:
        tips.append({
            'icon': '✅', 'type': 'success',
            'title': 'You Are On Track!',
            'body': 'Great work! Keep up your study schedule and complete tasks before their deadlines.'
        })

    return tips


def _get_reminder_alerts(user, today):
    """
    Term 6 — Smart Reminders.
    Returns tasks that fall within their chosen reminder window.
    """
    alerts = []
    tasks = Task.objects.filter(user=user, is_completed=False, due_date__isnull=False)

    for task in tasks:
        days_left = (task.due_date - today).days
        trigger = False
        label   = ''

        if task.reminder == '1_day'  and days_left == 1:
            trigger, label = True, '1 day left!'
        elif task.reminder == '3_days' and 0 <= days_left <= 3:
            trigger, label = True, f'{days_left} day(s) left!'
        elif task.reminder == '1_week' and 0 <= days_left <= 7:
            trigger, label = True, f'{days_left} day(s) left!'
        elif days_left == 0:
            trigger, label = True, 'Due TODAY!'
        elif days_left < 0:
            trigger, label = True, f'{abs(days_left)} day(s) overdue!'

        if trigger:
            alerts.append({'task': task, 'label': label, 'days_left': days_left})

    return alerts[:8]   # cap at 8 reminders


def _calc_procrastination_score(pending, overdue, study_hours):
    """
    Term 8 — Reduces Procrastination.
    Returns a 0–100 score (lower is better).
    Breakdown:
      - pending tasks:  up to 50 pts  (pending * 2, capped at 50)
      - overdue tasks:  up to 50 pts  (overdue * 10, capped at 50)
      - study hours:    up to -30 pts reduction
    Max possible = 100, min = 0.
    """
    score = 0
    score += min(pending * 2, 50)           # up to 50 pts for pending tasks
    score += min(overdue * 10, 50)          # up to 50 pts for overdue tasks
    score -= min(int(study_hours * 4), 30)  # study hours reduce score (max -30)
    return max(0, min(score, 100))


# ──────────────────────────────────────────────────────
#  AI — Automatic Study Plan Generator (Gemini)
# ──────────────────────────────────────────────────────

@login_required
def ai_generate_study_plan(request):
    """
    POST → call Gemini with the user's real task/session data.
    GET  → show the study plan page (empty state).
    """
    today = date.today()
    tasks          = list(Task.objects.filter(user=request.user))
    sessions       = list(StudySession.objects.filter(user=request.user).order_by('-session_date')[:14])
    semester_plans = list(SemesterPlan.objects.filter(user=request.user).order_by('-created_at')[:3])

    ai_plan = None
    ai_error = None

    if request.method == "POST":
        result = generate_ai_study_plan(request.user, tasks, sessions, semester_plans, today)
        if 'error' in result:
            ai_error = result['error']
        else:
            ai_plan = result

    # Stats for the page header
    pending  = Task.objects.filter(user=request.user, is_completed=False).count()
    overdue  = Task.objects.filter(user=request.user, is_completed=False, due_date__lt=today).count()
    upcoming = Task.objects.filter(
        user=request.user, is_completed=False,
        due_date__gte=today
    ).order_by('due_date')[:8]

    return render(request, 'ai_studyplan.html', {
        'ai_plan':        ai_plan,
        'ai_error':       ai_error,
        'today':          today,
        'pending':        pending,
        'overdue':        overdue,
        'upcoming':       upcoming,
        'task_count':     len(tasks),
        'session_count':  len(sessions),
        'semester_plans': semester_plans,
    })
