# ╔══════════════════════════════════════════════════════════════╗
# ║   AI-Powered Student Productivity & Time Management         ║
# ║   Built with IBM Bob                                        ║
# ╚══════════════════════════════════════════════════════════════╝

<div align="center">
  <h1>🎓 AI Student Productivity Assistant</h1>
  <p><strong>AI-Powered Time Management, Procrastination Detection & Study Optimization</strong></p>
  <p>
    <img src="https://img.shields.io/badge/Node.js-20-green?logo=node.js" />
    <img src="https://img.shields.io/badge/React-18-blue?logo=react" />
    <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" />
    <img src="https://img.shields.io/badge/Docker-ready-blue?logo=docker" />
    <img src="https://img.shields.io/badge/AWS-ECS%20Fargate-orange?logo=amazon-aws" />
    <img src="https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-black?logo=github-actions" />
  </p>
</div>

---

## 🌟 Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Engine** | Scores task priorities, detects procrastination, optimizes time blocks |
| 📋 **Task Manager** | CRUD tasks with deadlines, courses, types, AI priority scoring |
| ⏱ **Pomodoro Timer** | Built-in 25/5 work-break cycles with visual progress ring |
| 📚 **Study Tracker** | Log sessions, track focus score, mood, productivity 1-10 |
| 📅 **Semester Planner** | Courses, academic events, goals with progress tracking |
| 🗓 **Weekly Schedule** | Visual timetable with drag & drop slots |
| 📊 **Analytics** | 14-day study history, subject breakdown, productivity trend charts |
| 🚨 **Procrastination Detector** | Flags tasks at risk with AI-generated actionable tips |
| 💡 **Time Optimization** | AI-driven daily study suggestions and priority queues |
| 📈 **Study vs Distraction** | Focus score, per-subject distraction breakdown, verdict |

---

## 🏗️ Project Structure

```
ai-student-productivity/
├── server/                     ← Node.js/Express Backend
│   ├── index.js                ← Server entry + cron jobs
│   ├── routes/
│   │   ├── tasks.js            ← Task CRUD
│   │   ├── schedule.js         ← Weekly timetable
│   │   ├── studySessions.js    ← Study logging
│   │   ├── semester.js         ← Courses, events, goals
│   │   ├── analytics.js        ← Charts data
│   │   └── ai.js               ← AI analysis endpoints
│   ├── services/
│   │   ├── aiEngine.js         ← Core AI logic
│   │   └── pomodoroService.js  ← Pomodoro timer
│   └── utils/
│       └── dataStore.js        ← JSON persistence layer
│
├── public/                     ← Vanilla HTML/CSS/JS Frontend
│   ├── index.html
│   ├── css/
│   │   ├── style.css           ← Global styles
│   │   ├── dashboard.css       ← Dashboard components
│   │   └── components.css      ← Reusable components
│   └── js/
│       ├── api.js              ← Fetch wrappers
│       ├── utils.js            ← Helpers
│       ├── app.js              ← SPA router
│       ├── components/         ← modal, toast, chart
│       └── pages/              ← dashboard, tasks, study...
│
├── react-app/                  ← React + TypeScript Frontend (Vite)
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── types/index.ts      ← Full TypeScript type definitions
│   │   ├── services/api.ts     ← Axios API client
│   │   ├── hooks/useApi.ts     ← Custom hooks
│   │   ├── components/         ← Layout, shared components
│   │   └── pages/              ← Dashboard, Tasks, Analytics...
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── tests/
│   ├── unit/aiEngine.test.js   ← AI logic unit tests
│   └── integration/api.test.js ← Full API integration tests
│
├── aws/
│   ├── cloudformation.yml      ← Full VPC + ECS + ALB stack
│   ├── task-definition.json    ← ECS task definition
│   └── deploy.sh               ← One-command deploy script
│
├── nginx/
│   └── nginx.conf              ← Reverse proxy config
│
├── .github/workflows/
│   ├── ci-cd.yml               ← Full CI/CD pipeline
│   └── security.yml            ← Dependency + Trivy scanning
│
├── Dockerfile                  ← Multi-stage production build
├── docker-compose.yml          ← Production compose
├── docker-compose.dev.yml      ← Development override
├── package.json
└── .env.example
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm 9+
- (Optional) Docker 24+

### Local Development
```bash
# 1. Clone and enter
cd ai-student-productivity

# 2. Install dependencies
npm install

# 3. Copy environment config
cp .env.example .env

# 4. Start the server
npm run dev
# → http://localhost:3000

# 5. (Optional) React app
cd react-app && npm install && npm run dev
# → http://localhost:5173
```

### Docker
```bash
# Production
docker-compose up -d

# Development (hot reload)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

---

## 🔌 API Reference

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List all tasks (AI-prioritized) |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| PATCH | `/api/tasks/:id/complete` | Mark complete |
| DELETE | `/api/tasks/:id` | Delete task |

### Study Sessions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/study-sessions` | All sessions |
| GET | `/api/study-sessions/today` | Today's summary |
| GET | `/api/study-sessions/analysis` | Focus score & distraction |
| POST | `/api/study-sessions` | Log a session |

### AI Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/analyze` | Run full AI analysis |
| GET | `/api/ai/procrastination` | Procrastination detector |
| GET | `/api/ai/distraction-analysis` | Study vs distraction |
| GET | `/api/ai/time-optimization` | Time suggestions |
| GET | `/api/ai/semester-progress` | Semester health |
| GET/PUT | `/api/ai/profile` | User preferences |

---

## 🧪 Testing
```bash
# Run all tests with coverage
npm test

# Unit tests only
npx jest tests/unit

# Integration tests only
npx jest tests/integration
```

---

## ☁️ AWS Deployment

```bash
# Prerequisites: AWS CLI configured + Docker running

# 1. Deploy CloudFormation (one-time setup)
aws cloudformation deploy \
  --template-file aws/cloudformation.yml \
  --stack-name ai-student-prod \
  --capabilities CAPABILITY_IAM

# 2. Build & deploy
chmod +x aws/deploy.sh
./aws/deploy.sh production
```

**Required GitHub Secrets:**
| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | IAM Access Key |
| `AWS_SECRET_ACCESS_KEY` | IAM Secret Key |

---

## 🤖 AI Engine Details

### Priority Scoring Formula
```
Priority = (Urgency × 50%) + (Importance × 35%) + (Effort × 15%)

Urgency    = max(0, 100 − daysLeft × 5)
Importance = weight × 10        (1–10 scale)
Effort     = 100 − hours × 5   (less effort = more flexibility)
```

### Procrastination Detection
A task is flagged when:
- Deadline is within **48 hours**
- Created more than **30 minutes** ago  
- Less than **25%** of estimated study time logged

### Focus Score
```
Focus% = (studyMinutes − distractionMinutes) / studyMinutes × 100
```

---

## 📄 License
MIT — Built with ❤️ using IBM Bob
