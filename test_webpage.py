"""
Test that the full webpage (HTML + CSS + JS) loads correctly
Run: python test_webpage.py
"""
import os, sys
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'studyai.settings')
import django
django.setup()
from django.test import Client
from django.test.utils import setup_test_environment
setup_test_environment()

c = Client()

print()
print("=" * 65)
print("  AI Student Productivity – Full Webpage Test")
print("=" * 65)
print(f"  {'STATUS':<8} {'CODE':<6}  RESOURCE")
print("  " + "-" * 55)

pages = [
    ('/', 'text/html', 'Homepage (SPA)'),
    ('/css/style.css',             'text/css',        'Main CSS'),
    ('/css/dashboard.css',         'text/css',        'Dashboard CSS'),
    ('/css/components.css',        'text/css',        'Components CSS'),
    ('/js/api.js',                 'application/javascript', 'API JS'),
    ('/js/utils.js',               'application/javascript', 'Utils JS'),
    ('/js/app.js',                 'application/javascript', 'App Router JS'),
    ('/js/components/modal.js',    'application/javascript', 'Modal JS'),
    ('/js/components/toast.js',    'application/javascript', 'Toast JS'),
    ('/js/components/chart.js',    'application/javascript', 'Chart JS'),
    ('/js/pages/dashboard.js',     'application/javascript', 'Dashboard JS'),
    ('/js/pages/tasks.js',         'application/javascript', 'Tasks JS'),
    ('/js/pages/study.js',         'application/javascript', 'Study JS'),
    ('/js/pages/semester.js',      'application/javascript', 'Semester JS'),
    ('/js/pages/schedule.js',      'application/javascript', 'Schedule JS'),
    ('/js/pages/analytics.js',     'application/javascript', 'Analytics JS'),
    ('/js/pages/aiInsights.js',    'application/javascript', 'AI Insights JS'),
    ('/js/pages/settings.js',      'application/javascript', 'Settings JS'),
]

passed = failed = 0
for url, expected_ct, label in pages:
    resp = c.get(url)
    ok   = resp.status_code == 200
    if not ok: failed += 1; icon = 'FAIL'
    else:      passed += 1; icon = 'PASS'
    # FileResponse uses streaming_content, regular response uses content
    try:
        size = len(resp.content)
    except AttributeError:
        size = sum(len(chunk) for chunk in resp.streaming_content)
    print(f"  [{icon}]   [{resp.status_code}]   {label:<28}  ({size:>6} bytes)")

# Check homepage contains required elements
resp = c.get('/')
html = resp.content.decode('utf-8', errors='replace')
checks = [
    ('StudyAI',        'Brand name in HTML'),
    ('/css/style.css', 'CSS link tag'),
    ('/js/api.js',     'JS script tag'),
    ('sidebar',        'Sidebar element'),
    ('dashboard-root', 'Dashboard root div'),
    ('ai-root',        'AI insights root div'),
    ('topbar',         'Topbar element'),
]
print()
print("  Content checks on homepage:")
print("  " + "-" * 40)
for keyword, desc in checks:
    found = keyword in html
    icon  = 'PASS' if found else 'FAIL'
    if not found: failed += 1
    else: passed += 1
    print(f"  [{icon}]   {desc}")

print()
print("=" * 65)
print(f"  Results: {passed} passed, {failed} failed")
if failed == 0:
    print("  FULL WEBPAGE LOADS CORRECTLY!")
    print()
    print("  Open in your browser:")
    print("  → http://localhost:8000          (Dashboard)")
    print("  → http://localhost:8000/admin    (Admin Panel)")
else:
    print("  Some checks failed — see FAIL lines above")
print("=" * 65)
print()
sys.exit(0 if failed == 0 else 1)
