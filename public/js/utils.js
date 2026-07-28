/* ============================================================
   Utility Helpers
   ============================================================ */

// ── Date helpers ──────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}

function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
}

function timeAgo(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0)  return `${d}d ago`;
  if (h > 0)  return `${h}h ago`;
  if (m > 0)  return `${m}m ago`;
  return 'just now';
}

function deadlineLabel(iso) {
  if (!iso) return { label: '—', cls: 'normal' };
  const diff = new Date(iso).getTime() - Date.now();
  const hours = diff / 3600000;
  if (diff < 0)     return { label: 'Overdue',           cls: 'overdue' };
  if (hours < 24)   return { label: `${Math.floor(hours)}h left`, cls: 'soon' };
  if (hours < 72)   return { label: `${Math.floor(hours/24)}d left`, cls: 'soon' };
  return { label: formatDate(iso), cls: 'normal' };
}

// ── Number helpers ────────────────────────────────────────
function minutesToHM(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function clamp(val, min, max) { return Math.min(max, Math.max(min, val)); }

function priorityLabel(score) {
  if (score >= 80) return { label: 'Critical', cls: 'badge-red',    bar: 'critical' };
  if (score >= 60) return { label: 'High',     cls: 'badge-yellow', bar: 'high' };
  if (score >= 40) return { label: 'Medium',   cls: 'badge-blue',   bar: 'medium' };
  return               { label: 'Low',      cls: 'badge-green',  bar: 'low' };
}

// ── DOM helpers ───────────────────────────────────────────
function qs(sel, ctx = document) { return ctx.querySelector(sel); }
function qsa(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }

function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class')     e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'text') e.textContent = v;
    else e.setAttribute(k, v);
  }
  children.flat().forEach(c => {
    if (typeof c === 'string') e.insertAdjacentText('beforeend', c);
    else if (c instanceof Node) e.appendChild(c);
  });
  return e;
}

function clearEl(element) { element.innerHTML = ''; }

// ── Color helpers ─────────────────────────────────────────
const SUBJECT_COLORS = [
  '#3b82d4','#22c55e','#f59e0b','#ef4444','#7c5cd8',
  '#14b8a6','#f97316','#ec4899','#6366f1','#84cc16',
];
const subjectColorMap = {};
let colorIdx = 0;
function subjectColor(name) {
  if (!subjectColorMap[name]) {
    subjectColorMap[name] = SUBJECT_COLORS[colorIdx % SUBJECT_COLORS.length];
    colorIdx++;
  }
  return subjectColorMap[name];
}

// ── Score color ───────────────────────────────────────────
function scoreColor(score) {
  if (score >= 80) return 'var(--color-success)';
  if (score >= 60) return 'var(--color-accent)';
  if (score >= 40) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

// ── Local storage cache ───────────────────────────────────
const Cache = {
  set(key, val, ttlMs = 60_000) {
    localStorage.setItem(key, JSON.stringify({ val, exp: Date.now() + ttlMs }));
  },
  get(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const { val, exp } = JSON.parse(raw);
      if (Date.now() > exp) { localStorage.removeItem(key); return null; }
      return val;
    } catch { return null; }
  },
  clear(key) { localStorage.removeItem(key); },
};
