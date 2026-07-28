"""
Django REST Framework Views – All API endpoints
"""
from django.utils import timezone
from django.db.models import Sum
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import Task, ScheduleSlot, StudySession, Course, SemesterEvent, Goal, UserProfile, DailyLog
from .serializers import (
    TaskSerializer, ScheduleSlotSerializer, StudySessionSerializer,
    CourseSerializer, SemesterEventSerializer, GoalSerializer,
    UserProfileSerializer, DailyLogSerializer,
)
from .ai_engine import (
    calculate_priority, detect_overdue, detect_procrastination,
    analyze_study_vs_distraction, suggest_time_optimization,
    analyze_semester_progress,
)


def ok(data, **kwargs):
    return Response({'success': True, 'data': data, **kwargs})

def err(msg, code=400):
    return Response({'success': False, 'message': msg}, status=code)


# ════════════════════════════════════════════════════════════════
# AUTH
# ════════════════════════════════════════════════════════════════
@csrf_exempt
@api_view(['POST'])
def auth_register(request):
    username = (request.data.get('username') or '').strip()
    email = (request.data.get('email') or '').strip()
    password = request.data.get('password') or ''

    if not username or not password:
        return err('username and password are required')

    if User.objects.filter(username=username).exists():
        return err('Username already exists', 409)
    if email and User.objects.filter(email=email).exists():
        return err('Email already exists', 409)

    user = User.objects.create_user(username=username, email=email, password=password)
    login(request, user)
    return ok({'id': user.id, 'username': user.username, 'email': user.email})


@csrf_exempt
@api_view(['POST'])
def auth_login(request):
    username = (request.data.get('username') or '').strip()
    password = request.data.get('password') or ''

    if not username or not password:
        return err('username and password are required')

    user = authenticate(request, username=username, password=password)
    if not user:
        return err('Invalid username or password', 401)

    login(request, user)
    return ok({'id': user.id, 'username': user.username, 'email': user.email})


@csrf_exempt
@api_view(['POST'])
def auth_logout(request):
    logout(request)
    return ok({'message': 'Logged out'})


@api_view(['GET'])
def auth_me(request):
    if not request.user.is_authenticated:
        return err('Not authenticated', 401)
    return ok({'id': request.user.id, 'username': request.user.username, 'email': request.user.email})


# ════════════════════════════════════════════════════════════════
# HEALTH
# ════════════════════════════════════════════════════════════════
@api_view(['GET'])
def health(request):
    return Response({'status': 'ok', 'timestamp': timezone.now().isoformat()})


# ════════════════════════════════════════════════════════════════
# TASKS
# ════════════════════════════════════════════════════════════════
@api_view(['GET', 'POST'])
def tasks_list(request):
    if request.method == 'GET':
        tasks = Task.objects.all()
        data  = TaskSerializer(tasks, many=True).data
        # sort by AI priority descending
        data  = sorted(data, key=lambda t: -(t.get('priority') or 0))
        return ok(data, overdue=len(detect_overdue(tasks)))

    # POST – create
    body = request.data
    if not body.get('title') or not body.get('deadline'):
        return err('title and deadline are required')
    serializer = TaskSerializer(data={
        'title':           body.get('title'),
        'description':     body.get('description', ''),
        'deadline':        body.get('deadline'),
        'course':          body.get('course', 'General'),
        'type':            body.get('type', 'assignment'),
        'estimated_hours': body.get('estimatedHours', 2),
        'weight':          body.get('weight', 5),
        'tags':            body.get('tags', []),
    })
    if serializer.is_valid():
        task = serializer.save()
        return ok(TaskSerializer(task).data, status_code=201)
    return err(str(serializer.errors))


@api_view(['GET', 'PUT', 'DELETE'])
def task_detail(request, task_id):
    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        return err('Task not found', 404)

    if request.method == 'GET':
        return ok(TaskSerializer(task).data)

    if request.method == 'PUT':
        body = request.data
        for field, model_field in [
            ('title','title'),('description','description'),('deadline','deadline'),
            ('course','course'),('type','type'),('estimatedHours','estimated_hours'),
            ('weight','weight'),('tags','tags'),
        ]:
            if field in body:
                setattr(task, model_field, body[field])
        task.save()
        return ok(TaskSerializer(task).data)

    # DELETE
    task.delete()
    return ok({'message': 'Task deleted'})


@api_view(['PATCH'])
def task_complete(request, task_id):
    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        return err('Task not found', 404)
    task.completed    = True
    task.completed_at = timezone.now()
    task.save()
    return ok(TaskSerializer(task).data)


# ════════════════════════════════════════════════════════════════
# SCHEDULE
# ════════════════════════════════════════════════════════════════
@api_view(['GET', 'POST'])
def schedule_list(request):
    if request.method == 'GET':
        return ok(ScheduleSlotSerializer(ScheduleSlot.objects.all(), many=True).data)

    body = request.data
    if not all([body.get('title'), body.get('day'), body.get('startTime'), body.get('endTime')]):
        return err('title, day, startTime, endTime required')
    slot = ScheduleSlot.objects.create(
        title=body['title'], day=body['day'].lower(),
        start_time=body['startTime'], end_time=body['endTime'],
        subject=body.get('subject','General'), type=body.get('type','study'),
        color=body.get('color','#3b82d4'), recurring=body.get('recurring',True),
    )
    return ok(ScheduleSlotSerializer(slot).data)


@api_view(['PUT', 'DELETE'])
def schedule_detail(request, slot_id):
    try:
        slot = ScheduleSlot.objects.get(id=slot_id)
    except ScheduleSlot.DoesNotExist:
        return err('Slot not found', 404)
    if request.method == 'DELETE':
        slot.delete()
        return ok({'message': 'Slot deleted'})
    for f, m in [('title','title'),('day','day'),('startTime','start_time'),('endTime','end_time'),
                 ('subject','subject'),('type','type'),('color','color')]:
        if f in request.data:
            setattr(slot, m, request.data[f])
    slot.save()
    return ok(ScheduleSlotSerializer(slot).data)


# ════════════════════════════════════════════════════════════════
# STUDY SESSIONS
# ════════════════════════════════════════════════════════════════
@api_view(['GET', 'POST'])
def sessions_list(request):
    if request.method == 'GET':
        limit    = int(request.GET.get('limit', 50))
        sessions = StudySession.objects.all()[:limit]
        return ok(StudySessionSerializer(sessions, many=True).data)

    body = request.data
    if not body.get('subject') or not body.get('duration'):
        return err('subject and duration required')

    task_obj = None
    if body.get('taskId'):
        try:
            task_obj = Task.objects.get(id=body['taskId'])
        except Task.DoesNotExist:
            pass

    session = StudySession.objects.create(
        subject=body['subject'], task=task_obj,
        duration=int(body['duration']),
        distraction_minutes=int(body.get('distractionMinutes', 0)),
        notes=body.get('notes',''), mood=body.get('mood','neutral'),
        productivity=int(body.get('productivity', 5)),
    )

    # Update daily log
    today = timezone.now().date()
    log, _ = DailyLog.objects.get_or_create(date=today)
    log.study_minutes       += session.duration
    log.distraction_minutes += session.distraction_minutes
    log.sessions            += 1
    log.save()

    return ok(StudySessionSerializer(session).data)


@api_view(['GET'])
def sessions_today(request):
    today    = timezone.now().date()
    sessions = StudySession.objects.filter(date__date=today)
    total    = sum(s.duration for s in sessions)
    return Response({'success': True, 'data': StudySessionSerializer(sessions, many=True).data, 'totalMinutes': total})


@api_view(['GET'])
def sessions_analysis(request):
    sessions = StudySession.objects.all()
    result   = analyze_study_vs_distraction(sessions)
    return ok(result)


@api_view(['DELETE'])
def session_delete(request, session_id):
    try:
        s = StudySession.objects.get(id=session_id)
    except StudySession.DoesNotExist:
        return err('Session not found', 404)
    s.delete()
    return ok({'message': 'Session deleted'})


# ════════════════════════════════════════════════════════════════
# SEMESTER
# ════════════════════════════════════════════════════════════════
@api_view(['GET'])
def semester_get(request):
    courses = Course.objects.all()
    events  = SemesterEvent.objects.all()
    goals   = Goal.objects.all()
    tasks   = Task.objects.all()
    progress = analyze_semester_progress(list(courses), list(tasks))
    return ok({
        'courses':  CourseSerializer(courses, many=True).data,
        'events':   SemesterEventSerializer(events, many=True).data,
        'goals':    GoalSerializer(goals, many=True).data,
        'progress': progress,
    })


@api_view(['POST'])
def semester_add_course(request):
    body = request.data
    if not body.get('name'):
        return err('name is required')
    course = Course.objects.create(
        name=body['name'], code=body.get('code',''),
        instructor=body.get('instructor',''), credits=int(body.get('credits', 3)),
        color=body.get('color','#3b82d4'),
    )
    return ok(CourseSerializer(course).data)


@api_view(['DELETE'])
def semester_delete_course(request, course_id):
    try:
        c = Course.objects.get(id=course_id)
    except Course.DoesNotExist:
        return err('Course not found', 404)
    c.delete()
    return ok({'message': 'Course deleted'})


@api_view(['POST'])
def semester_add_event(request):
    body = request.data
    if not body.get('title') or not body.get('date'):
        return err('title and date required')
    event = SemesterEvent.objects.create(
        title=body['title'], date=body['date'],
        type=body.get('type','other'), course=body.get('course',''),
        description=body.get('description',''),
    )
    return ok(SemesterEventSerializer(event).data)


@api_view(['POST'])
def semester_add_goal(request):
    body = request.data
    if not body.get('title'):
        return err('title required')
    goal = Goal.objects.create(
        title=body['title'], target_date=body.get('targetDate') or None,
        target_value=int(body.get('targetValue', 100)),
    )
    return ok(GoalSerializer(goal).data)


@api_view(['PATCH'])
def semester_update_goal(request, goal_id):
    try:
        goal = Goal.objects.get(id=goal_id)
    except Goal.DoesNotExist:
        return err('Goal not found', 404)
    body = request.data
    if 'currentValue' in body:
        goal.current_value = int(body['currentValue'])
        goal.achieved      = goal.current_value >= goal.target_value
    goal.save()
    return ok(GoalSerializer(goal).data)


# ════════════════════════════════════════════════════════════════
# ANALYTICS
# ════════════════════════════════════════════════════════════════
@api_view(['GET'])
def analytics_overview(request):
    tasks    = Task.objects.all()
    sessions = StudySession.objects.all()
    logs     = DailyLog.objects.order_by('-date')[:7]

    total_study = sum(s.duration for s in sessions)
    last7       = list(reversed(DailyLogSerializer(logs, many=True).data))
    avg_daily   = round(sum(d['study_minutes'] for d in last7) / len(last7)) if last7 else 0

    return ok({
        'totalTasks':         tasks.count(),
        'completedTasks':     tasks.filter(completed=True).count(),
        'totalStudyMinutes':  total_study,
        'avgDailyMinutes':    avg_daily,
        'last7Days':          last7,
        'streakDays':         _calc_streak(),
    })


@api_view(['GET'])
def analytics_weekly(request):
    logs = DailyLog.objects.order_by('-date')[:14]
    return ok(DailyLogSerializer(list(reversed(logs)), many=True).data)


@api_view(['GET'])
def analytics_productivity_trend(request):
    from django.db.models.functions import TruncDate
    sessions = StudySession.objects.filter(productivity__isnull=False).order_by('date')
    grouped  = {}
    for s in sessions:
        day = str(s.date.date())
        if day not in grouped:
            grouped[day] = []
        grouped[day].append(s.productivity)
    trend = [
        {'date': d, 'avgProductivity': round(sum(v)/len(v), 1)}
        for d, v in sorted(grouped.items())
    ]
    return ok(trend)


# ════════════════════════════════════════════════════════════════
# AI
# ════════════════════════════════════════════════════════════════
@api_view(['GET'])
def ai_procrastination(request):
    tasks    = list(Task.objects.all())
    sessions = list(StudySession.objects.all())
    result   = detect_procrastination(tasks, sessions)
    return Response({'success': True, 'data': result, 'count': len(result)})


@api_view(['GET'])
def ai_distraction(request):
    sessions = StudySession.objects.all()
    return ok(analyze_study_vs_distraction(sessions))


@api_view(['GET'])
def ai_time_optimization(request):
    tasks    = list(Task.objects.all())
    sessions = list(StudySession.objects.all())
    profile  = UserProfile.get_profile()
    return ok(suggest_time_optimization(tasks, sessions, profile))


@api_view(['GET'])
def ai_semester_progress(request):
    courses  = list(Course.objects.all())
    tasks    = list(Task.objects.all())
    return ok(analyze_semester_progress(courses, tasks))


@api_view(['POST'])
def ai_analyze(request):
    """Run full AI analysis and return results."""
    tasks    = list(Task.objects.all())
    sessions = list(StudySession.objects.all())
    courses  = list(Course.objects.all())
    profile  = UserProfile.get_profile()

    result = {
        'generatedAt':       timezone.now().isoformat(),
        'procrastination':   detect_procrastination(tasks, sessions),
        'distractionReport': analyze_study_vs_distraction(sessions),
        'timeOptimization':  suggest_time_optimization(tasks, sessions, profile),
        'semesterProgress':  analyze_semester_progress(courses, tasks),
        'overdueTasks':      [{'id': t.id, 'title': t.title} for t in detect_overdue(tasks)],
    }
    return ok(result)


@api_view(['GET', 'PUT'])
def ai_profile(request):
    profile = UserProfile.get_profile()
    if request.method == 'GET':
        return ok(UserProfileSerializer(profile).data)
    body = request.data
    for field, model_field in [
        ('name','name'),('studyGoalHours','study_goal_hours'),
        ('pomodoroWork','pomodoro_work'),('pomodoroBreak','pomodoro_break'),
        ('preferredStudyTime','preferred_study_time'),('subjects','subjects'),
    ]:
        if field in body:
            setattr(profile, model_field, body[field])
    profile.save()
    return ok(UserProfileSerializer(profile).data)


@api_view(['GET'])
def ai_insights(request):
    """Return latest analysis on demand."""
    tasks    = list(Task.objects.all())
    sessions = list(StudySession.objects.all())
    courses  = list(Course.objects.all())
    profile  = UserProfile.get_profile()
    result   = {
        'generatedAt':       timezone.now().isoformat(),
        'procrastination':   detect_procrastination(tasks, sessions),
        'distractionReport': analyze_study_vs_distraction(sessions),
        'timeOptimization':  suggest_time_optimization(tasks, sessions, profile),
        'semesterProgress':  analyze_semester_progress(courses, tasks),
    }
    return ok({'lastAnalyzed': result['generatedAt'], 'suggestions': [result]})


# ── Helpers ───────────────────────────────────────────────────
def _calc_streak():
    from datetime import timedelta
    streak  = 0
    check   = timezone.now().date()
    for _ in range(365):
        try:
            log = DailyLog.objects.get(date=check)
            if log.study_minutes > 0:
                streak += 1
                check  -= timedelta(days=1)
            else:
                break
        except DailyLog.DoesNotExist:
            break
    return streak
