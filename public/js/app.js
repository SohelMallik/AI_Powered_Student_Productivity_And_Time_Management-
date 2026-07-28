/* ============================================================
   Main App – Routing, Navigation, Initialization
   ============================================================ */

// ─────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────

/** Switch between Sign In / Register tabs */
function showAuthTab(tab) {
  const isLogin = (tab === 'login');
  document.getElementById('loginForm').classList.toggle('hidden', !isLogin);
  document.getElementById('registerForm').classList.toggle('hidden',  isLogin);
  document.getElementById('tabLogin').classList.toggle('active',  isLogin);
  document.getElementById('tabRegister').classList.toggle('active', !isLogin);
}

/** Called after a successful login or register */
function onAuthSuccess(user) {
  // Update visible username / avatar
  const username = user.username || 'Student';
  document.getElementById('sidebarUsername').textContent = username;
  document.getElementById('userAvatar').textContent      = username.charAt(0).toUpperCase();

  // Hide auth screen, show app shell
  document.getElementById('authScreen').style.display = 'none';
  const shell = document.getElementById('appShell');
  shell.style.display   = 'flex';
  shell.style.width     = '100%';
  shell.style.minHeight = '100vh';

  // Load streak in background (non-blocking)
  AnalyticsAPI.overview()
    .then(r => { document.getElementById('streakCount').textContent = r.data?.streakDays ?? 0; })
    .catch(() => {});

  // Navigate to page from URL hash
  const hashPage = (location.hash || '#dashboard').replace('#', '');
  navigateTo(PAGE_RENDERERS[hashPage] ? hashPage : 'dashboard');
}

/** Show the auth screen (used on boot or after logout) */
function showAuthScreen() {
  document.getElementById('appShell').style.display  = 'none';
  document.getElementById('authScreen').style.display = 'flex';
}

/** Handle login form submit */
async function handleLogin(e) {
  e.preventDefault();
  const errEl = document.getElementById('loginError');
  const btn   = document.getElementById('loginBtn');
  errEl.classList.add('hidden');
  btn.disabled    = true;
  btn.textContent = 'Signing in…';
  try {
    const res = await AuthAPI.login({
      username: document.getElementById('loginUsername').value.trim(),
      password: document.getElementById('loginPassword').value,
    });
    onAuthSuccess(res.data);
  } catch (err) {
    errEl.textContent = err.message || 'Login failed. Check your credentials.';
    errEl.classList.remove('hidden');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Sign In';
  }
}

/** Handle register form submit */
async function handleRegister(e) {
  e.preventDefault();
  const errEl = document.getElementById('registerError');
  const btn   = document.getElementById('registerBtn');
  errEl.classList.add('hidden');
  btn.disabled    = true;
  btn.textContent = 'Creating account…';
  try {
    const res = await AuthAPI.register({
      username: document.getElementById('regUsername').value.trim(),
      email   : document.getElementById('regEmail').value.trim(),
      password: document.getElementById('regPassword').value,
    });
    onAuthSuccess(res.data);
  } catch (err) {
    errEl.textContent = err.message || 'Registration failed. Try a different username.';
    errEl.classList.remove('hidden');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Create Account';
  }
}

/** Handle logout button click */
async function handleLogout() {
  const btn = document.getElementById('logoutBtn');
  btn.disabled    = true;
  btn.textContent = 'Signing out…';
  try {
    await AuthAPI.logout();
  } catch { /* ignore server errors – we log out client-side regardless */ }
  // Clear fields so next login starts fresh
  document.getElementById('loginUsername').value = '';
  document.getElementById('loginPassword').value = '';
  document.getElementById('sidebarUsername').textContent = '';
  showAuthTab('login');
  showAuthScreen();
  // Reset button text for next use
  btn.disabled    = false;
  btn.textContent = '↩ Sign out';
}

// ─────────────────────────────────────────────────────────────
// ROUTING
// ─────────────────────────────────────────────────────────────

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

function navigateTo(page) {
  if (!PAGE_RENDERERS[page]) page = 'dashboard';

  // Highlight active nav item
  qsa('.nav-item').forEach(el =>
    el.classList.toggle('active', el.dataset.page === page)
  );

  // Show the right page panel
  qsa('.page').forEach(el => el.classList.remove('active'));
  const pageEl = document.getElementById(`page-${page}`);
  if (pageEl) pageEl.classList.add('active');

  // Update topbar title
  const titleEl = document.getElementById('topbarTitle');
  if (titleEl) titleEl.textContent = PAGE_TITLES[page] || page;

  currentPage = page;

  PAGE_RENDERERS[page]().catch(err => {
    console.error(`[App] Error rendering ${page}:`, err);
  });

  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('open');
  }

  history.replaceState(null, '', `#${page}`);
}

// ─────────────────────────────────────────────────────────────
// BOOTSTRAP
// ─────────────────────────────────────────────────────────────

/** Wire up every persistent event listener exactly once on page load */
function wireStaticListeners() {
  // ── Sidebar nav ────────────────────────────────────────
  qsa('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(item.dataset.page);
    });
  });

  // ── Mobile sidebar toggle ──────────────────────────────
  document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });

  // ── Close sidebar on main-content tap (mobile) ─────────
  document.getElementById('mainContent').addEventListener('click', () => {
    if (window.innerWidth <= 768)
      document.getElementById('sidebar').classList.remove('open');
  });

  // ── Browser back / forward ─────────────────────────────
  window.addEventListener('popstate', () => {
    const hashPage = (location.hash || '#dashboard').replace('#', '');
    navigateTo(PAGE_RENDERERS[hashPage] ? hashPage : 'dashboard');
  });

  // ── AI Analysis button ─────────────────────────────────
  document.getElementById('analyzeBtn').addEventListener('click', async function () {
    this.textContent = '⏳ Analyzing…';
    this.disabled    = true;
    try {
      await AIAPI.analyze();
      showToast('🤖 AI analysis complete!', 'success');
      if (currentPage === 'dashboard' || currentPage === 'ai-insights') {
        await PAGE_RENDERERS[currentPage]();
      }
    } catch (err) {
      showToast('Analysis failed: ' + err.message, 'error');
    } finally {
      this.textContent = '🤖 Run AI Analysis';
      this.disabled    = false;
    }
  });

  // ── Logout button ──────────────────────────────────────
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
}

/** Entry point – runs once on DOMContentLoaded */
async function initApp() {
  // Wire all static listeners once (auth-screen inline handlers + static app buttons)
  wireStaticListeners();

  const loader = document.getElementById('appLoader');
  const hideLoader = () => {
    if (!loader) return;
    loader.style.transition = 'opacity .3s ease';
    loader.style.opacity    = '0';
    setTimeout(() => { loader.style.display = 'none'; }, 320);
  };

  try {
    // Check for an existing session
    const res  = await AuthAPI.me();
    hideLoader();
    onAuthSuccess(res.data);
  } catch {
    // No active session → show auth screen
    hideLoader();
    showAuthScreen();
  }
}

document.addEventListener('DOMContentLoaded', initApp);
