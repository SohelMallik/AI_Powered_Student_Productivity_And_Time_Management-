<div align="center">

<h1>🎓 StudyAI — AI Student Productivity Assistant</h1>
<p><strong>Tasks · Study Tracker · Pomodoro · Semester Planner · AI Insights · Analytics</strong></p>

<p>
  <img src="https://img.shields.io/badge/Node.js-20-green?logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-4-lightgrey?logo=express" />
  <img src="https://img.shields.io/badge/Vanilla%20JS-ES2020-yellow?logo=javascript" />
  <img src="https://img.shields.io/badge/Docker-ready-blue?logo=docker" />
  <img src="https://img.shields.io/badge/Render-free%20deploy-6762a6?logo=render" />
</p>

</div>

---

## ✨ Features

| Module | What it does |
|--------|-------------|
| 📊 **Dashboard** | Live stats, AI alerts, Pomodoro timer, 7-day study chart |
| ✅ **Task Manager** | Add / complete / delete tasks with AI priority scoring |
| 🗓 **Weekly Schedule** | Visual timetable — add study, class, break, exercise slots |
| ⏱ **Study Tracker** | Log sessions with mood, productivity score, distraction minutes |
| 📅 **Semester Planner** | Courses, academic events (exams, deadlines), semester goals |
| 📈 **Analytics** | 14-day bar chart, focus-vs-distraction donut, productivity trend |
| 🤖 **AI Insights** | Procrastination detector, time-optimization tips, semester health |
| ⚙️ **Settings** | Student profile, daily study goal, Pomodoro durations |

---

## 🏗️ Project Structure

```
ai-student-productivity/
├── server/                   ← Node.js / Express backend
│   ├── index.js              ← Entry point, middleware, SPA fallback
│   ├── routes/
│   │   ├── tasks.js          ← CRUD tasks + AI priority
│   │   ├── schedule.js       ← Weekly timetable
│   │   ├── studySessions.js  ← Log & analyse study sessions
│   │   ├── semester.js       ← Courses, events, goals
│   │   ├── analytics.js      ← Charts & daily logs
│   │   └── ai.js             ← AI analysis endpoints
│   ├── services/
│   │   ├── aiEngine.js       ← Priority scoring, procrastination, focus
│   │   └── pomodoroService.js← Server-side Pomodoro timer (optional)
│   └── utils/
│       └── dataStore.js      ← JSON file persistence (no DB needed)
│
├── public/                   ← Vanilla HTML / CSS / JS frontend (SPA)
│   ├── index.html            ← App shell + loading screen
│   ├── css/
│   │   ├── style.css         ← Global styles + CSS variables
│   │   ├── dashboard.css     ← Dashboard-specific components
│   │   └── components.css    ← Timetable, sessions, tabs, etc.
│   └── js/
│       ├── api.js            ← All fetch() wrappers (TasksAPI, AIAPI …)
│       ├── utils.js          ← Helpers: dates, DOM, colors, cache
│       ├── app.js            ← SPA router + page init + loader
│       ├── components/
│       │   ├── modal.js      ← Global modal open/close
│       │   ├── toast.js      ← Notification toasts
│       │   └── chart.js      ← SVG bar / line / donut charts
│       └── pages/
│           ├── dashboard.js  ← Dashboard + Pomodoro
│           ├── tasks.js      ← Task Manager
│           ├── schedule.js   ← Weekly Schedule
│           ├── study.js      ← Study Tracker
│           ├── semester.js   ← Semester Planner
│           ├── analytics.js  ← Analytics charts
│           ├── aiInsights.js ← AI Insights
│           └── settings.js   ← Settings
│
├── scripts/
│   └── seed.js               ← Demo data (tasks, sessions, schedule…)
│
├── tests/
│   ├── unit/aiEngine.test.js      ← AI engine unit tests (Jest)
│   └── integration/api.test.js    ← Full API integration tests
│
├── data/                     ← JSON files (auto-created, git-ignored)
│   ├── tasks.json
│   ├── studySessions.json
│   ├── schedule.json
│   ├── semester.json
│   ├── analytics.json
│   ├── userProfile.json
│   └── aiInsights.json
│
├── run.bat                   ← Windows one-click launch
├── run.sh                    ← Linux/macOS one-command launch
├── render.yaml               ← Render.com auto-deploy config
├── Dockerfile                ← Production Docker image
├── docker-compose.yml        ← Docker Compose (app + nginx)
├── .env.example              ← Environment variable template
└── package.json
```

---

## 🚀 Quick Start — Run Locally

### Option A — One Click (Easiest)

**Windows:**
```
Double-click  run.bat
```

**Linux / macOS:**
```bash
chmod +x run.sh && ./run.sh
```

Both scripts: install dependencies → create data folder → seed demo data → start server.

Open **http://localhost:3000** in your browser. Done.

---

### Option B — Manual Setup

**Prerequisites:** Node.js 18+ — download at https://nodejs.org

```bash
# 1. Enter project folder
cd ai-student-productivity

# 2. Install dependencies
npm install

# 3. Copy environment config
cp .env.example .env          # Linux/Mac
copy .env.example .env        # Windows

# 4. Load demo data
npm run seed

# 5. Start the server
npm start
```

Open **http://localhost:3000**

For live-reload during development:
```bash
npm run dev
```

---

### Option C — Docker

```bash
# Build and run with Docker Compose
docker-compose up --build

# Open http://localhost:80
```

---

## 🌐 Deploy to the Internet (Free)

Get a **public shareable URL** in 3 minutes using [Render.com](https://render.com) — no credit card needed.

### Step 1 — Push to GitHub

```bash
cd ai-student-productivity
git init
git add .
git commit -m "Initial commit: StudyAI App"

# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/studyai.git
git push -u origin main
```

### Step 2 — Deploy on Render

1. Go to **https://render.com** → Sign up free
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Render auto-detects `render.yaml` — all settings pre-filled
5. Click **"Create Web Service"**

Your live URL will be:
```
https://studyai-productivity.onrender.com
```

> ℹ️ Free tier spins down after 15 min of inactivity. First visit after idle takes ~30 sec to wake.

---

## 🔌 API Reference

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/tasks`                   | All tasks (AI-prioritised) |
| POST   | `/api/tasks`                   | Create task |
| PUT    | `/api/tasks/:id`               | Update task |
| PATCH  | `/api/tasks/:id/complete`      | Mark complete |
| DELETE | `/api/tasks/:id`               | Delete task |

### Study Sessions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/study-sessions`          | All sessions |
| GET  | `/api/study-sessions/today`    | Today's sessions + total minutes |
| GET  | `/api/study-sessions/analysis` | Focus score & distraction breakdown |
| POST | `/api/study-sessions`          | Log a session |
| DELETE | `/api/study-sessions/:id`    | Delete session |

### Schedule
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/schedule`       | All weekly slots |
| POST   | `/api/schedule`       | Add slot |
| PUT    | `/api/schedule/:id`   | Update slot |
| DELETE | `/api/schedule/:id`   | Delete slot |

### Semester
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/semester`               | Full semester data |
| POST   | `/api/semester/courses`       | Add course |
| DELETE | `/api/semester/courses/:id`   | Remove course |
| POST   | `/api/semester/events`        | Add event |
| POST   | `/api/semester/goals`         | Add goal |
| PATCH  | `/api/semester/goals/:id`     | Update goal progress |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/overview`           | Summary stats + last 7 days |
| GET | `/api/analytics/weekly`             | Last 14 days of daily logs |
| GET | `/api/analytics/productivity-trend` | Avg productivity per day |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/analyze`              | Run full AI analysis |
| GET  | `/api/ai/procrastination`      | Procrastination detector |
| GET  | `/api/ai/distraction-analysis` | Focus score & distraction |
| GET  | `/api/ai/time-optimization`    | Time-block suggestions |
| GET  | `/api/ai/semester-progress`    | Semester health score |
| GET  | `/api/ai/insights`             | Latest cached insights |
| GET  | `/api/ai/profile`              | User profile |
| PUT  | `/api/ai/profile`              | Update profile |

### Health
```
GET /api/health  →  { status: "ok", version: "1.0.0", uptime: 42 }
```

---

## 🤖 AI Engine Logic

### Priority Score (0–100)
```
Priority = (Urgency × 50%) + (Importance × 35%) + (Effort × 15%)

Urgency    = max(0, 100 − daysLeft × 5)   — 0 if overdue = 100
Importance = weight × 10                   — weight is 1–10
Effort     = 100 − estimatedHours × 5     — less effort = easier to slot
```

### Procrastination Detection
A task is flagged when **all** of these are true:
- Deadline is within **48 hours**
- Task was created more than **30 minutes** ago
- Less than **25%** of estimated study time has been logged

### Focus Score
```
Focus% = (studyMinutes − distractionMinutes) / studyMinutes × 100
```

---

## 🧪 Running Tests

```bash
# All tests with coverage
npm test

# Unit tests only (AI engine)
npm run test:unit

# Integration tests only (API endpoints)
npm run test:int
```

---

## 🐳 Docker Reference

```bash
# Production
docker-compose up -d

# Development (hot-reload)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Stop
docker-compose down
```

---

## 📄 License
MIT — Built with ❤️ using IBM Bob
