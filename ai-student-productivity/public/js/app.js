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
  if (!PAGE_RENDERERS[page]) page = 'dashboard';

  // Update nav active state
  qsa('.nav-item').forEach(item =>
    item.classList.toggle('active', item.dataset.page === page)
  );

  // Swap visible page
  qsa('.page').forEach(p => p.classList.remove('active'));
  const pageEl = document.getElementById(`page-${page}`);
  if (pageEl) pageEl.classList.add('active');

  // Update topbar title
  const titleEl = document.getElementById('topbarTitle');
  if (titleEl) titleEl.textContent = PAGE_TITLES[page] || page;

  currentPage = page;

  // Render page content
  PAGE_RENDERERS[page]().catch(err => {
    console.error(`[App] Error rendering ${page}:`, err);
  });

  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('open');
  }

  // Sync URL hash without reloading
  history.replaceState(null, '', `#${page}`);
}

// ── Init ──────────────────────────────────────────────────
async function initApp() {
  // Wire up sidebar nav
  qsa('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(item.dataset.page);
    });
  });

  // Mobile hamburger toggle
  document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });

  // Close sidebar when tapping main content on mobile
  document.getElementById('mainContent').addEventListener('click', () => {
    if (window.innerWidth <= 768) {
      document.getElementById('sidebar').classList.remove('open');
    }
  });

  // Handle browser back/forward
  window.addEventListener('popstate', () => {
    const hashPage = (location.hash || '#dashboard').replace('#', '');
    navigateTo(PAGE_RENDERERS[hashPage] ? hashPage : 'dashboard');
  });

  // Run AI Analysis button
  document.getElementById('analyzeBtn').addEventListener('click', async () => {
    const btn = document.getElementById('analyzeBtn');
    btn.textContent = '⏳ Analyzing…';
    btn.disabled    = true;
    try {
      await AIAPI.analyze();
      showToast('🤖 AI analysis complete!', 'success');
      if (currentPage === 'dashboard' || currentPage === 'ai-insights') {
        await PAGE_RENDERERS[currentPage]();
      }
    } catch (err) {
      showToast('Analysis failed: ' + err.message, 'error');
    } finally {
      btn.textContent = '🤖 Run AI Analysis';
      btn.disabled    = false;
    }
  });

  // Load profile for avatar initial + streak
  try {
    const profileRes = await AIAPI.getProfile();
    const name = profileRes.data?.name || 'Student';
    document.getElementById('userAvatar').textContent = name.charAt(0).toUpperCase();
    const overview = await AnalyticsAPI.overview();
    document.getElementById('streakCount').textContent = overview.data?.streakDays ?? 0;
  } catch { /* silent — app still works without profile */ }

  // Navigate to initial page from URL hash
  const hashPage = (location.hash || '#dashboard').replace('#', '');
  navigateTo(PAGE_RENDERERS[hashPage] ? hashPage : 'dashboard');

  // Hide loader, show app shell
  const loader   = document.getElementById('appLoader');
  const appShell = document.getElementById('appShell');
  if (loader)   { loader.style.opacity = '0'; setTimeout(() => (loader.style.display = 'none'), 300); }
  if (appShell) { appShell.style.display = 'flex'; appShell.style.width = '100%'; appShell.style.minHeight = '100vh'; }
}

// ── Boot ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initApp);
