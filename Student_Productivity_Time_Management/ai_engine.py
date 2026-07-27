"""
AI Engine — Gemini-powered automatic study plan generator.
Uses google-genai (v2) to produce a personalised, structured
weekly study schedule based on the student's real task data.
"""

import json
import textwrap
from datetime import date

from google import genai
from google.genai import types
from django.conf import settings


def _build_prompt(user, tasks, sessions, semester_plans, today: date) -> str:
    """Compose a rich prompt from the student's real data."""

    # ── Task summary ──────────────────────────────────────
    pending_tasks = [t for t in tasks if not t.is_completed]
    overdue_tasks = [t for t in pending_tasks if t.due_date and t.due_date < today]
    upcoming_tasks = sorted(
        [t for t in pending_tasks if t.due_date and t.due_date >= today],
        key=lambda t: t.due_date
    )[:10]

    task_lines = []
    for t in upcoming_tasks:
        task_lines.append(
            f"  - [{t.priority}] {t.task} | Category: {t.category} | Due: {t.due_date}"
        )
    for t in overdue_tasks[:5]:
        task_lines.append(
            f"  - [OVERDUE] {t.task} | Category: {t.category} | Was due: {t.due_date}"
        )

    # ── Study session summary ─────────────────────────────
    session_lines = []
    for s in sessions[:7]:
        session_lines.append(
            f"  - {s.subject}: {s.duration_minutes} min on {s.session_date} ({s.get_technique_display()})"
        )

    # ── Semester plan summary ─────────────────────────────
    plan_lines = []
    for p in semester_plans[:3]:
        plan_lines.append(
            f"  - {p.title} | {p.semester} ({p.start_date} to {p.end_date}) | Goal: {p.goal}"
        )

    prompt = textwrap.dedent(f"""
        You are an expert academic AI study coach.

        Today's date: {today}
        Student: {user.username}

        === UPCOMING TASKS ({len(upcoming_tasks)}) ===
        {chr(10).join(task_lines) if task_lines else '  None'}

        === OVERDUE TASKS ({len(overdue_tasks)}) ===
        {'  ' + str(len(overdue_tasks)) + ' task(s) overdue.' if overdue_tasks else '  None — great!'}

        === RECENT STUDY SESSIONS ===
        {chr(10).join(session_lines) if session_lines else '  No sessions logged yet.'}

        === SEMESTER PLANS ===
        {chr(10).join(plan_lines) if plan_lines else '  No semester plans yet.'}

        === YOUR TASK ===
        Generate a complete, personalised 7-day study plan starting from today ({today}).

        STRICT OUTPUT FORMAT — respond ONLY with valid JSON (no markdown code fences, no explanation):
        {{
          "summary": "2-3 sentence personalised overview of the student's situation and what you recommend",
          "weekly_plan": [
            {{
              "day": "Monday ({today})",
              "focus": "One-line focus theme for this day",
              "sessions": [
                {{
                  "time": "9:00 AM - 10:30 AM",
                  "subject": "Subject name",
                  "task": "Specific task or activity description",
                  "technique": "Pomodoro / Deep Work / Review / Normal",
                  "priority": "High / Medium / Low"
                }}
              ],
              "tip": "One personalised motivational tip for this day"
            }}
          ],
          "key_recommendations": [
            "Recommendation 1",
            "Recommendation 2",
            "Recommendation 3"
          ],
          "procrastination_warning": "Short warning if any overdue tasks need immediate attention, or empty string",
          "estimated_weekly_hours": 12
        }}

        Rules:
        - No more than 6 study hours per day.
        - Map actual task names and subjects from the student's real data above.
        - If there are overdue tasks, schedule them on Day 1.
        - Include specific techniques: Pomodoro for hard subjects, Deep Work for projects.
        - Return ONLY the JSON object, nothing else.
    """).strip()

    return prompt


def generate_ai_study_plan(user, tasks, sessions, semester_plans, today: date) -> dict:
    """
    Call Gemini to generate a structured weekly study plan.
    Returns a dict with keys: summary, weekly_plan, key_recommendations,
    procrastination_warning, estimated_weekly_hours.
    On error returns {'error': '...'}.
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return {
            'error': (
                'Gemini API key is not configured. '
                'Please set GEMINI_API_KEY in your environment or in settings.py.'
            )
        }

    client = genai.Client(api_key=api_key)
    prompt = _build_prompt(user, tasks, sessions, semester_plans, today)

    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.7,
                max_output_tokens=2048,
            )
        )
        raw = response.text.strip()

        # Strip markdown code fences if the model wraps output in them
        if raw.startswith('```'):
            lines = raw.split('\n')
            # drop first line (```json or ```) and last (```)
            if lines[-1].strip() == '```':
                lines = lines[1:-1]
            else:
                lines = lines[1:]
            raw = '\n'.join(lines).strip()

        plan = json.loads(raw)
        return plan

    except json.JSONDecodeError as exc:
        return {'error': f'AI returned invalid JSON: {exc}. Raw snippet: {raw[:400]}'}
    except Exception as exc:
        return {'error': f'AI error: {exc}'}
