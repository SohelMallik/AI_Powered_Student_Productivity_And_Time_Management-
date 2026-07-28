# ============================================================
# Django Tests – AI Student Productivity
# ============================================================
from django.test import TestCase, Client
from django.utils import timezone
from datetime import timedelta
import json

from django.contrib.auth import get_user_model
from api.models import Task, StudySession, Course, Goal, UserProfile, DailyLog
from api.ai_engine import (
    calculate_priority, detect_overdue,
    detect_procrastination, analyze_study_vs_distraction,
    suggest_time_optimization, analyze_semester_progress,
)


class AIEngineTests(TestCase):
    """Unit tests for the AI engine."""

    def _make_task(self, days_offset=3, weight=5, hours=2, completed=False):
        return Task.objects.create(
            title='Test Task',
            deadline=timezone.now() + timedelta(days=days_offset),
            weight=weight,
            estimated_hours=hours,
            completed=completed,
        )

    def test_priority_high_for_overdue(self):
        task  = self._make_task(days_offset=-1, weight=8)
        score = calculate_priority(task)
        self.assertGreaterEqual(score, 80)

    def test_priority_low_for_far_deadline(self):
        task  = self._make_task(days_offset=30, weight=3)
        score = calculate_priority(task)
        self.assertLess(score, 60)

    def test_priority_between_0_and_100(self):
        task  = self._make_task()
        score = calculate_priority(task)
        self.assertGreaterEqual(score, 0)
        self.assertLessEqual(score, 100)

    def test_detect_overdue_excludes_completed(self):
        t1 = self._make_task(days_offset=-1, completed=False)
        t2 = self._make_task(days_offset=-1, completed=True)
        t3 = self._make_task(days_offset=1,  completed=False)
        overdue = detect_overdue([t1, t2, t3])
        self.assertIn(t1, overdue)
        self.assertNotIn(t2, overdue)
        self.assertNotIn(t3, overdue)

    def test_distraction_focus_score(self):
        s1 = StudySession.objects.create(subject='Math',    duration=60, distraction_minutes=10)
        s2 = StudySession.objects.create(subject='Physics', duration=40, distraction_minutes=5)
        result = analyze_study_vs_distraction([s1, s2])
        self.assertEqual(result['totalStudyMinutes'],       100)
        self.assertEqual(result['totalDistractionMinutes'], 15)
        self.assertEqual(result['focusScore'],              85)

    def test_focus_score_zero_no_sessions(self):
        result = analyze_study_vs_distraction([])
        self.assertEqual(result['focusScore'], 0)

    def test_excellent_verdict_high_score(self):
        s = StudySession.objects.create(subject='Bio', duration=100, distraction_minutes=2)
        result = analyze_study_vs_distraction([s])
        self.assertIn('Excellent', result['verdict'])

    def test_semester_completion_rate(self):
        c1 = Course.objects.create(name='Math')
        t1 = Task.objects.create(title='T1', deadline=timezone.now()+timedelta(days=1), completed=True,  course='Math')
        t2 = Task.objects.create(title='T2', deadline=timezone.now()+timedelta(days=1), completed=False, course='Math')
        t3 = Task.objects.create(title='T3', deadline=timezone.now()+timedelta(days=1), completed=False, course='Math')
        result = analyze_semester_progress([c1], [t1, t2, t3])
        self.assertEqual(result['completionRate'], 33)
        self.assertEqual(result['completed'],      1)
        self.assertEqual(result['totalTasks'],     3)


class TaskAPITests(TestCase):
    """Integration tests for Task API endpoints."""

    def setUp(self):
        self.client = Client()

    def _create_task(self):
        payload = {
            'title':           'Django Test Task',
            'deadline':        (timezone.now() + timedelta(days=5)).isoformat(),
            'course':          'Computer Science',
            'type':            'assignment',
            'estimatedHours':  3,
            'weight':          7,
        }
        return self.client.post('/api/tasks', json.dumps(payload), content_type='application/json')

    def test_health_endpoint(self):
        res = self.client.get('/api/health')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()['status'], 'ok')

    def test_create_task(self):
        res = self._create_task()
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()['success'])
        self.assertEqual(res.json()['data']['title'], 'Django Test Task')

    def test_create_task_missing_fields(self):
        res = self.client.post('/api/tasks', json.dumps({'title': 'No deadline'}),
                               content_type='application/json')
        self.assertFalse(res.json()['success'])

    def test_list_tasks(self):
        self._create_task()
        res = self.client.get('/api/tasks')
        self.assertEqual(res.status_code, 200)
        self.assertTrue(len(res.json()['data']) >= 1)

    def test_complete_task(self):
        create_res = self._create_task()
        task_id    = create_res.json()['data']['id']
        res        = self.client.patch(f'/api/tasks/{task_id}/complete')
        self.assertTrue(res.json()['data']['completed'])

    def test_delete_task(self):
        create_res = self._create_task()
        task_id    = create_res.json()['data']['id']
        res        = self.client.delete(f'/api/tasks/{task_id}')
        self.assertTrue(res.json()['success'])


class StudySessionAPITests(TestCase):

    def setUp(self):
        self.client = Client()

    def test_create_session(self):
        payload = {'subject': 'Mathematics', 'duration': 45,
                   'distractionMinutes': 5, 'mood': 'happy', 'productivity': 8}
        res = self.client.post('/api/study-sessions', json.dumps(payload), content_type='application/json')
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()['success'])

    def test_today_sessions(self):
        payload = {'subject': 'Physics', 'duration': 30}
        self.client.post('/api/study-sessions', json.dumps(payload), content_type='application/json')
        res = self.client.get('/api/study-sessions/today')
        self.assertGreaterEqual(res.json()['totalMinutes'], 30)

    def test_analysis(self):
        payload = {'subject': 'Chemistry', 'duration': 60, 'distractionMinutes': 10}
        self.client.post('/api/study-sessions', json.dumps(payload), content_type='application/json')
        res = self.client.get('/api/study-sessions/analysis')
        self.assertIn('focusScore', res.json()['data'])


class AuthAPITests(TestCase):

    def setUp(self):
        self.client = Client()

    def test_register_and_me(self):
        payload = {
            'username': 'alice',
            'email': 'alice@example.com',
            'password': 'securepass123',
        }
        res = self.client.post('/api/auth/register', json.dumps(payload), content_type='application/json')
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()['success'])
        self.assertEqual(res.json()['data']['username'], 'alice')

        me = self.client.get('/api/auth/me')
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.json()['data']['username'], 'alice')

    def test_login_and_logout(self):
        get_user_model().objects.create_user(username='bob', password='secret123')

        login_res = self.client.post(
            '/api/auth/login',
            json.dumps({'username': 'bob', 'password': 'secret123'}),
            content_type='application/json',
        )
        self.assertEqual(login_res.status_code, 200)
        self.assertTrue(login_res.json()['success'])

        logout_res = self.client.post('/api/auth/logout')
        self.assertEqual(logout_res.status_code, 200)
        self.assertTrue(logout_res.json()['success'])


class AIAPITests(TestCase):

    def setUp(self):
        self.client = Client()

    def test_procrastination(self):
        res = self.client.get('/api/ai/procrastination')
        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(res.json()['data'], list)

    def test_distraction_analysis(self):
        res = self.client.get('/api/ai/distraction-analysis')
        self.assertIn('focusScore', res.json()['data'])

    def test_time_optimization(self):
        res = self.client.get('/api/ai/time-optimization')
        self.assertIsInstance(res.json()['data'], list)

    def test_ai_analyze(self):
        res = self.client.post('/api/ai/analyze', '{}', content_type='application/json')
        self.assertTrue(res.json()['success'])
        self.assertIn('generatedAt', res.json()['data'])

    def test_profile_get(self):
        res = self.client.get('/api/ai/profile')
        self.assertIn('name', res.json()['data'])

    def test_profile_update(self):
        payload = {'name': 'Alice', 'studyGoalHours': 8}
        res = self.client.put('/api/ai/profile', json.dumps(payload), content_type='application/json')
        self.assertEqual(res.json()['data']['name'], 'Alice')
