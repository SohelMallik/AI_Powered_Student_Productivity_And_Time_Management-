"""
Live endpoint test – runs without a server using Django test client
Run: python test_endpoints.py
"""
import os, sys, json
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'studyai.settings')

import django
django.setup()

from django.test import Client
from django.test.utils import setup_test_environment
setup_test_environment()

c = Client()

ENDPOINTS = [
    ('GET',  '/api/health',                    None),
    ('GET',  '/api/tasks',                     None),
    ('POST', '/api/tasks',                     {'title':'Endpoint Test Task','deadline':'2025-12-31T23:59:00','course':'Math','type':'assignment','estimatedHours':2,'weight':5}),
    ('GET',  '/api/schedule',                  None),
    ('GET',  '/api/study-sessions',            None),
    ('GET',  '/api/study-sessions/today',      None),
    ('GET',  '/api/study-sessions/analysis',   None),
    ('POST', '/api/study-sessions',            {'subject':'Physics','duration':45,'distractionMinutes':5,'mood':'happy','productivity':8}),
    ('GET',  '/api/semester',                  None),
    ('POST', '/api/semester/courses',          {'name':'Mathematics','code':'MATH-301','credits':4}),
    ('POST', '/api/semester/goals',            {'title':'Complete all homework','targetValue':100}),
    ('GET',  '/api/analytics/overview',        None),
    ('GET',  '/api/analytics/weekly',          None),
    ('GET',  '/api/analytics/productivity-trend', None),
    ('GET',  '/api/ai/insights',               None),
    ('POST', '/api/ai/analyze',                {}),
    ('GET',  '/api/ai/procrastination',        None),
    ('GET',  '/api/ai/distraction-analysis',   None),
    ('GET',  '/api/ai/time-optimization',      None),
    ('GET',  '/api/ai/semester-progress',      None),
    ('GET',  '/api/ai/profile',                None),
    ('PUT',  '/api/ai/profile',                {'name':'Alice','studyGoalHours':8}),
]

print()
print("=" * 65)
print("  AI Student Productivity – Endpoint Test")
print("=" * 65)
print(f"  {'STATUS':<8} {'CODE':<6}  ENDPOINT")
print("  " + "-" * 55)

passed = 0
failed = 0

for method, url, body in ENDPOINTS:
    if method == 'GET':
        resp = c.get(url)
    elif method == 'POST':
        resp = c.post(url, json.dumps(body), content_type='application/json')
    elif method == 'PUT':
        resp = c.put(url, json.dumps(body), content_type='application/json')
    elif method == 'PATCH':
        resp = c.patch(url, json.dumps(body), content_type='application/json')
    elif method == 'DELETE':
        resp = c.delete(url)

    try:
        data = json.loads(resp.content)
        ok   = data.get('success') is True or data.get('status') == 'ok'
    except Exception:
        ok   = False

    icon = "PASS" if ok else "FAIL"
    if ok:
        passed += 1
        print(f"  [PASS]   [{resp.status_code}]   {method:<6} {url}")
    else:
        failed += 1
        print(f"  [FAIL]   [{resp.status_code}]   {method:<6} {url}  → {resp.content[:80]}")

print()
print("=" * 65)
print(f"  Results: {passed} passed, {failed} failed out of {len(ENDPOINTS)} endpoints")
if failed == 0:
    print("  ALL ENDPOINTS WORKING CORRECTLY!")
else:
    print("  Some endpoints need attention (see FAIL lines above)")
print("=" * 65)
print()

sys.exit(0 if failed == 0 else 1)
