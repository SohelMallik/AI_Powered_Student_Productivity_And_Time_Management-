"""
Background Scheduler – Daily AI analysis at midnight
Uses APScheduler via django-apscheduler
"""
import logging
from django_apscheduler.jobstores import DjangoJobStore
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

logger = logging.getLogger(__name__)
_scheduler = None


def daily_ai_analysis():
    """Run full AI analysis and log to console."""
    try:
        from django.utils import timezone
        from .models import Task, StudySession, Course, UserProfile
        from .ai_engine import (
            detect_procrastination, analyze_study_vs_distraction,
            suggest_time_optimization, analyze_semester_progress,
        )

        tasks    = list(Task.objects.all())
        sessions = list(StudySession.objects.all())
        courses  = list(Course.objects.all())
        profile  = UserProfile.get_profile()

        proc = detect_procrastination(tasks, sessions)
        distr = analyze_study_vs_distraction(sessions)
        tips  = suggest_time_optimization(tasks, sessions, profile)

        logger.info(f"[AI Scheduler] Analysis run at {timezone.now().isoformat()}")
        logger.info(f"[AI Scheduler] Procrastination flags: {len(proc)}")
        logger.info(f"[AI Scheduler] Focus score: {distr['focusScore']}%")
        logger.info(f"[AI Scheduler] Suggestions: {len(tips)}")
    except Exception as e:
        logger.error(f"[AI Scheduler] Error: {e}")


def start_scheduler():
    global _scheduler
    if _scheduler and _scheduler.running:
        return

    _scheduler = BackgroundScheduler()
    _scheduler.add_jobstore(DjangoJobStore(), 'default')

    _scheduler.add_job(
        daily_ai_analysis,
        trigger=CronTrigger(hour=0, minute=0),   # Every midnight
        id='daily_ai_analysis',
        name='Daily AI Analysis',
        replace_existing=True,
    )

    try:
        _scheduler.start()
        logger.info('[AI Scheduler] Started – daily analysis at midnight')
    except Exception as e:
        logger.warning(f'[AI Scheduler] Could not start: {e}')
