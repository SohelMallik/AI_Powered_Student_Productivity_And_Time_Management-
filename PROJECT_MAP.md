# StudyAI Project Map

This file is the low-token navigation index for the repository. Read this map first, then read only the files listed for the requested feature. Do not scan `node_modules/`, `react-app/node_modules/`, `venv/`, `coverage/`, generated bundles, screenshots, PDFs, or the SQLite database unless the request explicitly requires them.

## 1. Application shape

StudyAI is a student productivity application with two parallel backend implementations and two frontend implementations:

```text
Browser
  -> public/                    Vanilla JS SPA (no build)
  -> react-app/                 React 18 + TypeScript + Vite SPA

Frontend API clients
  -> /api/*

Backend option A
  -> server/index.js            Express entry point
  -> server/routes/*            JSON-file API
  -> server/utils/dataStore.js  Persistence in data/*.json

Backend option B
  -> manage.py                   Django entry point
  -> studyai/                    Django settings, root URLs, WSGI/ASGI
  -> api/                        DRF views, models, serializers, AI, scheduler
  -> data/db.sqlite3             Django persistence
```

The Node/Express stack and Django/DRF stack implement overlapping core features. The Node stack additionally owns Notes and Flashcards. Confirm which backend is being changed before editing.

## 2. Start here by request type

| Request | Read first | Usually also read |
|---|---|---|
| Add/change a React page | `react-app/src/App.tsx`, target page, `react-app/src/services/api.ts`, `react-app/src/types/index.ts` | `react-app/src/components/Layout.tsx`, page CSS |
| Add/change a Vanilla JS page | `public/index.html`, `public/js/app.js`, target `public/js/pages/*.js`, `public/js/api.js` | relevant `public/css/*.css`, shared components |
| Add/change an API endpoint | `server/index.js`, target `server/routes/*.js` | `server/utils/dataStore.js`, matching frontend API client, tests |
| Add/change Django API behavior | `studyai/urls.py`, `api/urls.py`, `api/views.py` | `api/models.py`, `api/serializers.py`, `api/ai_engine.py`, `api/tests.py` |
| Add/change stored data | Node: `server/utils/dataStore.js` and target route; Django: `api/models.py`, migration, serializer, view | matching types, API client, tests |
| Change authentication | Node: `server/routes/auth.js`; Django: `api/views.py` auth section | `react-app/src/components/Layout.tsx`, `react-app/src/services/api.ts`, `public/js/api.js` |
| Change AI calculations | Node: `server/services/aiEngine.js`; Django: `api/ai_engine.py` | AI routes/views, AI page, tests |
| Change deployment/startup | `package.json`, `pyproject.toml`, `Dockerfile`, compose files, `render.yaml`, `nginx/nginx.conf` | relevant entry point |
| Add a feature end-to-end | target frontend page + API client, matching Node route and/or Django view, types/models/storage, focused tests | `PROJECT_MAP.md` update |

## 3. Runtime and entry points

### Node/Express

- Start: [`server/index.js`](server/index.js)
- Commands: [`package.json`](package.json)
  - `npm start`: Express server
  - `npm run dev`: Nodemon watching `server/` and `public/`
  - `npm test`: Jest with coverage
  - `npm run test:unit`: unit tests
  - `npm run test:int`: integration tests
- Static frontend: [`public/`](public/)
- API mount points and middleware: [`server/index.js`](server/index.js)
- Scheduled daily AI job: [`server/index.js`](server/index.js) -> [`server/services/aiEngine.js`](server/services/aiEngine.js)
- Persistence initialization: [`server/utils/dataStore.js`](server/utils/dataStore.js)

### Django/DRF

- Management entry point: [`manage.py`](manage.py)
- Settings: [`studyai/settings.py`](studyai/settings.py)
- Root URL routing and SPA/static fallback: [`studyai/urls.py`](studyai/urls.py)
- API URL routing: [`api/urls.py`](api/urls.py)
- API implementation: [`api/views.py`](api/views.py)
- Data model: [`api/models.py`](api/models.py)
- Serializers: [`api/serializers.py`](api/serializers.py)
- Daily scheduler: [`api/scheduler.py`](api/scheduler.py)
- Dependencies: [`pyproject.toml`](pyproject.toml), [`requirements.txt`](requirements.txt)

## 4. Feature ownership map

### Authentication

- React UI: [`react-app/src/components/Layout.tsx`](react-app/src/components/Layout.tsx)
- React client: `authApi` in [`react-app/src/services/api.ts`](react-app/src/services/api.ts)
- React types: inline auth response types in [`react-app/src/services/api.ts`](react-app/src/services/api.ts)
- Vanilla client: auth methods in [`public/js/api.js`](public/js/api.js)
- Node implementation: [`server/routes/auth.js`](server/routes/auth.js)
- Django implementation: auth functions in [`api/views.py`](api/views.py), routes in [`api/urls.py`](api/urls.py)
- Django session configuration: [`studyai/settings.py`](studyai/settings.py)

### Dashboard

- React route: `/dashboard` in [`react-app/src/App.tsx`](react-app/src/App.tsx)
- React page: [`react-app/src/pages/Dashboard.tsx`](react-app/src/pages/Dashboard.tsx)
- React page CSS: [`react-app/src/pages/Dashboard.module.css`](react-app/src/pages/Dashboard.module.css)
- Vanilla page: [`public/js/pages/dashboard.js`](public/js/pages/dashboard.js)
- Shared Vanilla charts/components: [`public/js/components/chart.js`](public/js/components/chart.js)
- Data dependencies: `analyticsApi`, `aiApi`, `studyApi`, `tasksApi`

### Tasks

- React route/page: `/tasks` -> [`react-app/src/pages/Tasks.tsx`](react-app/src/pages/Tasks.tsx)
- React API/type: `tasksApi` -> [`react-app/src/services/api.ts`](react-app/src/services/api.ts), [`react-app/src/types/index.ts`](react-app/src/types/index.ts)
- Vanilla page: [`public/js/pages/tasks.js`](public/js/pages/tasks.js)
- Node route: [`server/routes/tasks.js`](server/routes/tasks.js), AI priority from [`server/services/aiEngine.js`](server/services/aiEngine.js)
- Django route/view: `tasks_*` in [`api/urls.py`](api/urls.py) and [`api/views.py`](api/views.py)
- Django model/serializer: `Task` in [`api/models.py`](api/models.py), [`api/serializers.py`](api/serializers.py)
- Tests: [`api/tests.py`](api/tests.py), [`tests/integration/api.test.js`](tests/integration/api.test.js)

### Schedule

- React route/page: `/schedule` -> [`react-app/src/pages/Schedule.tsx`](react-app/src/pages/Schedule.tsx)
- React API/type: `scheduleApi` -> [`react-app/src/services/api.ts`](react-app/src/services/api.ts), [`react-app/src/types/index.ts`](react-app/src/types/index.ts)
- Vanilla page: [`public/js/pages/schedule.js`](public/js/pages/schedule.js)
- Node route: [`server/routes/schedule.js`](server/routes/schedule.js)
- Django route/view: `schedule_*` in [`api/urls.py`](api/urls.py), [`api/views.py`](api/views.py)
- Django model: `ScheduleSlot` in [`api/models.py`](api/models.py)

### Study tracker

- React route/page: `/study` -> [`react-app/src/pages/StudyTracker.tsx`](react-app/src/pages/StudyTracker.tsx)
- React API/type: `studyApi` -> [`react-app/src/services/api.ts`](react-app/src/services/api.ts), [`react-app/src/types/index.ts`](react-app/src/types/index.ts)
- Vanilla page: [`public/js/pages/study.js`](public/js/pages/study.js)
- Node route: [`server/routes/studySessions.js`](server/routes/studySessions.js)
- Django route/view: `sessions_*` in [`api/urls.py`](api/urls.py), [`api/views.py`](api/views.py)
- Django model: `StudySession` and `DailyLog` in [`api/models.py`](api/models.py)
- Analytics side effect: creating a session updates `DailyLog` in Django and analytics JSON in Node

### Semester planner

- React route/page: `/semester` -> [`react-app/src/pages/Semester.tsx`](react-app/src/pages/Semester.tsx)
- React API/type: `semesterApi` -> [`react-app/src/services/api.ts`](react-app/src/services/api.ts), [`react-app/src/types/index.ts`](react-app/src/types/index.ts)
- Vanilla page: [`public/js/pages/semester.js`](public/js/pages/semester.js)
- Node route: [`server/routes/semester.js`](server/routes/semester.js)
- Django route/view: `semester_*` in [`api/urls.py`](api/urls.py), [`api/views.py`](api/views.py)
- Django models: `Course`, `SemesterEvent`, `Goal` in [`api/models.py`](api/models.py)

### Analytics

- React route/page: `/analytics` -> [`react-app/src/pages/Analytics.tsx`](react-app/src/pages/Analytics.tsx)
- React API/type: `analyticsApi`, `studyApi` -> [`react-app/src/services/api.ts`](react-app/src/services/api.ts), [`react-app/src/types/index.ts`](react-app/src/types/index.ts)
- Vanilla page: [`public/js/pages/analytics.js`](public/js/pages/analytics.js)
- Node route: [`server/routes/analytics.js`](server/routes/analytics.js)
- Django route/view: `analytics_*` in [`api/urls.py`](api/urls.py), [`api/views.py`](api/views.py)
- Source data: study sessions and daily analytics logs

### AI insights

- React route/page: `/ai-insights` -> [`react-app/src/pages/AIInsights.tsx`](react-app/src/pages/AIInsights.tsx)
- React API/type: `aiApi` -> [`react-app/src/services/api.ts`](react-app/src/services/api.ts), [`react-app/src/types/index.ts`](react-app/src/types/index.ts)
- Vanilla page: [`public/js/pages/aiInsights.js`](public/js/pages/aiInsights.js)
- Node route/service: [`server/routes/ai.js`](server/routes/ai.js), [`server/services/aiEngine.js`](server/services/aiEngine.js)
- Django route/view/service: AI functions in [`api/urls.py`](api/urls.py), [`api/views.py`](api/views.py), [`api/ai_engine.py`](api/ai_engine.py)
- Scheduled analysis: Node cron in [`server/index.js`](server/index.js); Django scheduler in [`api/scheduler.py`](api/scheduler.py)

### Settings/profile

- React route/page: `/settings` -> [`react-app/src/pages/Settings.tsx`](react-app/src/pages/Settings.tsx)
- React API/type: `aiApi.getProfile/updateProfile` -> [`react-app/src/services/api.ts`](react-app/src/services/api.ts), [`react-app/src/types/index.ts`](react-app/src/types/index.ts)
- Vanilla page: [`public/js/pages/settings.js`](public/js/pages/settings.js)
- Node route/data: `/api/ai/profile` in [`server/routes/ai.js`](server/routes/ai.js), `userProfile.json` via [`server/utils/dataStore.js`](server/utils/dataStore.js)
- Django route/model: `ai_profile` in [`api/views.py`](api/views.py), `UserProfile` in [`api/models.py`](api/models.py)

### Notes

- React route/page: `/notes` -> [`react-app/src/pages/Notes.tsx`](react-app/src/pages/Notes.tsx)
- React API/type: `notesApi` -> [`react-app/src/services/api.ts`](react-app/src/services/api.ts), [`react-app/src/types/index.ts`](react-app/src/types/index.ts)
- Vanilla page: [`public/js/pages/notes.js`](public/js/pages/notes.js)
- Node-only API implementation: [`server/routes/notes.js`](server/routes/notes.js)
- Node persistence: `notes.json` via [`server/utils/dataStore.js`](server/utils/dataStore.js)
- Integration coverage: [`tests/integration/api.test.js`](tests/integration/api.test.js)

### Flashcards

- React route/page: `/flashcards` -> [`react-app/src/pages/Flashcards.tsx`](react-app/src/pages/Flashcards.tsx)
- React API/type: `flashcardsApi` -> [`react-app/src/services/api.ts`](react-app/src/services/api.ts), [`react-app/src/types/index.ts`](react-app/src/types/index.ts)
- Vanilla page: [`public/js/pages/flashcards.js`](public/js/pages/flashcards.js)
- Node-only API implementation: [`server/routes/flashcards.js`](server/routes/flashcards.js)
- Node persistence: `flashcards.json` via [`server/utils/dataStore.js`](server/utils/dataStore.js)
- Integration coverage: [`tests/integration/api.test.js`](tests/integration/api.test.js)

## 5. Frontend navigation and shared files

- React bootstrap: [`react-app/src/main.tsx`](react-app/src/main.tsx)
- React router and lazy page imports: [`react-app/src/App.tsx`](react-app/src/App.tsx)
- Shared shell, navigation, auth form: [`react-app/src/components/Layout.tsx`](react-app/src/components/Layout.tsx)
- Shell styles: [`react-app/src/components/Layout.module.css`](react-app/src/components/Layout.module.css)
- Global React styles: [`react-app/src/index.css`](react-app/src/index.css)
- API boundary: [`react-app/src/services/api.ts`](react-app/src/services/api.ts)
- Shared domain types: [`react-app/src/types/index.ts`](react-app/src/types/index.ts)
- Generic API hook: [`react-app/src/hooks/useApi.ts`](react-app/src/hooks/useApi.ts)
- React build config: [`react-app/vite.config.ts`](react-app/vite.config.ts), [`react-app/tsconfig.json`](react-app/tsconfig.json)

Vanilla SPA:

- HTML shell: [`public/index.html`](public/index.html)
- SPA route/page loader: [`public/js/app.js`](public/js/app.js)
- All fetch wrappers: [`public/js/api.js`](public/js/api.js)
- Shared helpers: [`public/js/utils.js`](public/js/utils.js)
- Shared UI: [`public/js/components/modal.js`](public/js/components/modal.js), [`public/js/components/toast.js`](public/js/components/toast.js), [`public/js/components/chart.js`](public/js/components/chart.js)
- Global styles: [`public/css/style.css`](public/css/style.css)
- Feature styles: [`public/css/dashboard.css`](public/css/dashboard.css), [`public/css/components.css`](public/css/components.css)

## 6. Backend dependency map

### Express path

```text
server/index.js
  -> server/routes/{auth,tasks,schedule,studySessions,semester,analytics,ai,notes,flashcards}.js
      -> server/utils/dataStore.js
      -> server/services/aiEngine.js       (tasks and AI)
      -> server/services/pomodoroService.js (timer logic where used)
  -> public/index.html and public/{css,js}
```

Each Express route file is mounted under the same basename in [`server/index.js`](server/index.js). Route files should not directly duplicate storage initialization; use the data store helpers.

### Django path

```text
manage.py
  -> studyai/settings.py
  -> studyai/urls.py
      -> api/urls.py
          -> api/views.py
              -> api/models.py
              -> api/serializers.py
              -> api/ai_engine.py
              -> api/scheduler.py
```

When changing a Django model, update the model, create a migration under `api/migrations/`, update serializers/views if the API shape changes, then update matching frontend types/client.

## 7. Data map

### Node JSON data

Managed by [`server/utils/dataStore.js`](server/utils/dataStore.js):

| Key | File | Main owner |
|---|---|---|
| `users` | `data/users.json` | `server/routes/auth.js` |
| `tasks` | `data/tasks.json` | `server/routes/tasks.js`, `server/services/aiEngine.js` |
| `schedule` | `data/schedule.json` | `server/routes/schedule.js` |
| `studySessions` | `data/studySessions.json` | `server/routes/studySessions.js` |
| `semester` | `data/semester.json` | `server/routes/semester.js` |
| `analytics` | `data/analytics.json` | `server/routes/analytics.js`, study-session route |
| `aiInsights` | `data/aiInsights.json` | `server/routes/ai.js`, `server/services/aiEngine.js` |
| `userProfile` | `data/userProfile.json` | `server/routes/ai.js` |
| `notes` | `data/notes.json` | `server/routes/notes.js` |
| `flashcards` | `data/flashcards.json` | `server/routes/flashcards.js` |

The JSON files are runtime state. Change defaults and behavior in `dataStore.js` or routes, not by manually editing generated runtime data.

### Django models

Defined in [`api/models.py`](api/models.py):

`Task`, `ScheduleSlot`, `StudySession`, `Course`, `SemesterEvent`, `Goal`, `UserProfile`, `DailyLog`.

Important relationships:

- `StudySession.task` optionally references `Task` with `SET_NULL`.
- `Task.course` and semester event course are text values, not foreign keys.
- `UserProfile.get_profile()` enforces a single profile at `id=1`.
- `DailyLog.date` is unique and aggregates study/distraction/session totals.

## 8. API contract index

Both backend implementations use `/api`. The React client is the canonical frontend contract in [`react-app/src/services/api.ts`](react-app/src/services/api.ts).

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| Health | `GET /health` |
| Tasks | `GET/POST /tasks`, `GET/PUT/DELETE /tasks/:id`, `PATCH /tasks/:id/complete` |
| Schedule | `GET/POST /schedule`, `PUT/DELETE /schedule/:id` |
| Study | `GET/POST /study-sessions`, `GET /study-sessions/today`, `GET /study-sessions/analysis`, `DELETE /study-sessions/:id` |
| Semester | `GET /semester`, `POST /semester/courses`, `DELETE /semester/courses/:id`, `POST /semester/events`, `POST /semester/goals`, `PATCH /semester/goals/:id` |
| Analytics | `GET /analytics/overview`, `GET /analytics/weekly`, `GET /analytics/productivity-trend` |
| AI | `GET /ai/insights`, `POST /ai/analyze`, `GET /ai/procrastination`, `GET /ai/distraction-analysis`, `GET /ai/time-optimization`, `GET /ai/semester-progress`, `GET/PUT /ai/profile` |
| Notes | `GET/POST /notes`, `GET/PUT/DELETE /notes/:id`, `PATCH /notes/:id/pin` |
| Flashcards | `GET/POST /flashcards`, `GET/DELETE /flashcards/:deckId`, `POST /flashcards/:deckId/cards`, `PATCH /flashcards/:deckId/cards/:cardId/review`, `DELETE /flashcards/:deckId/cards/:cardId` |

API responses normally use `{ success, data, message? }`. Preserve field naming at the client boundary: frontend uses camelCase; Django model fields use snake_case and serializers translate them.

## 9. Testing map

- Express unit AI tests: [`tests/unit/aiEngine.test.js`](tests/unit/aiEngine.test.js)
- Express API integration tests: [`tests/integration/api.test.js`](tests/integration/api.test.js)
- Django API/AI tests: [`api/tests.py`](api/tests.py)
- Endpoint smoke script: [`test_endpoints.py`](test_endpoints.py)
- Browser/page test script: [`test_webpage.py`](test_webpage.py)
- Jest config: [`jest.config.js`](jest.config.js)

For a backend endpoint change, run the smallest matching backend test file. For a React change, run `npm run build` in `react-app/` unless the change is documentation-only.

## 10. Infrastructure and deployment

- Container build: [`Dockerfile`](Dockerfile)
- Production compose: [`docker-compose.yml`](docker-compose.yml)
- Development compose: [`docker-compose.dev.yml`](docker-compose.dev.yml)
- Reverse proxy: [`nginx/nginx.conf`](nginx/nginx.conf)
- Render deployment: [`render.yaml`](render.yaml)
- AWS deployment: [`aws/deploy.sh`](aws/deploy.sh), [`aws/cloudformation.yml`](aws/cloudformation.yml), [`aws/task-definition.json`](aws/task-definition.json)
- Environment template: [`.env.example`](.env.example)
- Local launchers: [`run.bat`](run.bat), [`run.sh`](run.sh)

## 11. Low-token editing protocol

1. Identify the user-visible feature or API resource.
2. Read only the feature row above plus its direct shared files.
3. Decide the active stack: React or Vanilla; Node or Django. Do not edit both stacks unless the request explicitly requires parity.
4. Trace the data boundary: page -> API client -> route/view -> service/model/storage.
5. Edit the smallest owning file set. Update types, serializers, migrations, or tests only when the contract requires it.
6. Search references to changed symbols/endpoints before editing callers.
7. Run the smallest relevant test/build command.
8. Update this map only when a new file, endpoint, model, route, or ownership relationship is introduced.

## 12. Files intentionally excluded from normal feature work

Do not read or edit these for ordinary feature requests:

- `node_modules/`, `react-app/node_modules/`
- `venv/`
- `coverage/`
- `data/db.sqlite3` and runtime `data/*.json`
- generated build output such as `react-app/dist/`
- images, PDFs, and screenshots

Read deployment files only for deployment/configuration requests, and read test files only when validating or changing behavior.

