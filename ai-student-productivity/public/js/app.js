/* ============================================================
   Main App – Routing, Navigation, Initialization
   ============================================================ */
const PAGE_RENDERERS = {
  'dashboard'  : renderDashboard,
  'tasks'      : renderTasksPage,
  'schedule'   : renderSchedulePage,
  'study'      : renderStudyPage,
  'semester'   : renderSemesterPage,
  'analytics'  : renderAnalyticsPage,
  'ai-insights': renderAIInsightsPage,
  'settings'   : renderSettingsPage,
};

const PAGE_TITLES = {
  'dashboard'  : 'Dashboard',
  'tasks'      : 'Task Manager',
  'schedule'   : 'Weekly Schedule',
  'study'      : 'Study Tracker',
  'semester'   : 'Semester Planner',
  'analytics'  : 'Analytics',
  'ai-insights': 'AI Insights',
  'settings'   : 'Settings',
};

let currentPage = 'dashboard';

// ── Navigate ──────────────────────────────────────────────
function navigateTo(page) {
  if (!PAGE_RENDERERS[page]) return;

  // Update nav
  qsa('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });

  // Swap page
  qsa('.page').forEach(p => p.classList.remove('active'));
  const pageEl = document.getElementById(`page-${page}`);
  if (pageEl) pageEl.classList.add('active');

  // Update title
  document.getElementById('topbarTitle').textContent = PAGE_TITLES[page] || page;
  currentPage = page;

  // Render
  PAGE_RENDERERS[page]().catch(console.error);

  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('open');
  }

  // Update URL hash (no reload)
  history.replaceState(null, '', `#${page}`);
}

// ── Init ──────────────────────────────────────────────────
async function initApp() {
  // Sidebar nav links
  qsa('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(item.dataset.page);
    });
  });

  // Mobile menu toggle
  document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });

  // Close sidebar on backdrop tap (mobile)
  document.getElementById('mainContent').addEventListener('click', () => {
    if (window.innerWidth <= 768) {
      document.getElementById('sidebar').classList.remove('open');
    }
  });

  // Run AI Analysis button
  document.getElementById('analyzeBtn').addEventListener('click', async () => {
    document.getElementById('analyzeBtn').textContent = '⏳ Analyzing...';
    document.getElementById('analyzeBtn').disabled = true;
    try {
      await AIAPI.analyze();
      showToast('🤖 AI analysis complete!', 'success');
      if (currentPage === 'dashboard' || currentPage === 'ai-insights') {
        await PAGE_RENDERERS[currentPage]();
      }
    } catch (err) {
      showToast('Analysis failed: ' + err.message, 'error');
    } finally {
      document.getElementById('analyzeBtn').textContent = '🤖 Run AI Analysis';
      document.getElementById('analyzeBtn').disabled = false;
    }
  });

  // Load user profile for avatar
  try {
    const profileRes = await AIAPI.getProfile();
    const name = profileRes.data?.name || 'Student';
    document.getElementById('userAvatar').textContent = name.charAt(0).toUpperCase();
    // Update streak badge
    const overview = await AnalyticsAPI.overview();
    document.getElementById('streakCount').textContent = overview.data?.streakDays || 0;
  } catch { /* silent */ }

  // Determine initial page from hash
  const hashPage = (location.hash || '#dashboard').replace('#', '');
  navigateTo(PAGE_RENDERERS[hashPage] ? hashPage : 'dashboard');
}

// ── Boot ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initApp);
