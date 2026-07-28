/* ============================================================
   Schedule Page  – Vivid Animated Theme
   ============================================================ */
const DAYS  = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7 AM – 10 PM

async function renderSchedulePage() {
  const root = document.getElementById('schedule-root');
  root.innerHTML = `
    <div style="text-align:center;padding:48px;animation:fadeIn .5s ease">
      <div class="spinner"></div>
      <p style="margin-top:14px;color:var(--color-muted);font-size:13px">Loading schedule…</p>
    </div>`;
  try {
    const res   = await ScheduleAPI.getAll();
    const slots = res.data || [];
    buildScheduleUI(slots);
  } catch (e) {
    root.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div>
      <h3>${e.message}</h3></div>`;
  }
}

function buildScheduleUI(slots) {
  const root = document.getElementById('schedule-root');
  root.innerHTML = `
    <!-- Hero Banner -->
    <div class="page-hero schedule-hero">
      <div class="page-hero-orb orb1"></div>
      <div class="page-hero-orb orb2"></div>
      <div class="page-hero-content">
        <h1 class="page-hero-title">Weekly Schedule</h1>
        <p class="page-hero-sub">${slots.length} time slots · ${DAYS.length}-day view</p>
      </div>
      <button class="hero-action-btn" id="addSlotBtn">＋ Add Slot</button>
    </div>

    <!-- Timetable Card -->
    <div class="vivid-card" style="overflow-x:auto;padding:0;animation:slideUp .4s ease both">
      <div id="timetableContainer" style="min-width:700px"></div>
    </div>

    <!-- Slot List -->
    <div class="vivid-card mt-4" style="animation:slideUp .5s .1s ease both">
      <div class="vivid-section-header">
        <span class="section-pill schedule">📋 All Slots</span>
        <span class="badge badge-blue">${slots.length}</span>
      </div>
      <div id="slotList" class="grid-2 mt-3"></div>
    </div>
  `;

  document.getElementById('addSlotBtn').onclick = showAddSlotModal;
  renderTimetable(slots);
  renderSlotList(slots);
}

function renderTimetable(slots) {
  const container = document.getElementById('timetableContainer');
  let html = `<div class="vivid-timetable" style="grid-template-rows:44px ${HOURS.map(()=>'42px').join(' ')}">`;

  // Header row
  html += `<div class="vtt-corner"></div>`;
  DAYS.forEach(d => {
    html += `<div class="vtt-header">${d.slice(0,3).toUpperCase()}</div>`;
  });

  // Hour rows
  HOURS.forEach((h, hi) => {
    const label = h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h-12}pm`;
    html += `<div class="vtt-time">${label}</div>`;
    DAYS.forEach(day => {
      const daySlots = slots.filter(s => s.day === day);
      const slotHtml = daySlots
        .filter(s => {
          const [sh] = (s.startTime || '00:00').split(':').map(Number);
          return sh === h;
        })
        .map(s => {
          const bg = s.color || subjectColor(s.subject || s.title);
          return `<div class="vtt-slot" style="background:${bg};animation:popIn .4s ${(hi*7+DAYS.indexOf(day))*.018}s ease both"
                    title="${s.title} (${s.startTime}–${s.endTime})">${s.title}</div>`;
        }).join('');
      html += `<div class="vtt-cell${hi%2===0?' vtt-even':''}">${slotHtml}</div>`;
    });
  });
  html += '</div>';
  container.innerHTML = html;
}

function renderSlotList(slots) {
  const list = document.getElementById('slotList');
  if (!slots.length) {
    list.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-state-icon">🗓</div>
      <h3>No slots yet</h3>
      <p>Add study blocks, classes, and breaks to your weekly schedule</p>
    </div>`;
    return;
  }
  const TYPE_ICONS = { study:'📖', class:'🏫', break:'☕', exercise:'🏃' };
  list.innerHTML = slots.map((s, i) => `
    <div class="vivid-slot-card" style="animation:slideLeft .4s ${i*.06}s ease both">
      <div class="vsc-color" style="background:${s.color || subjectColor(s.subject||s.title)}"></div>
      <div class="vsc-body">
        <div class="vsc-title">${s.title}</div>
        <div class="vsc-meta">${TYPE_ICONS[s.type]||'📌'} ${capitalize(s.day)} · ${s.startTime}–${s.endTime} · ${s.type}</div>
      </div>
      <button class="vtc-btn vtc-btn-red slot-delete-btn" data-id="${s.id}">🗑</button>
    </div>`).join('');

  qsa('.slot-delete-btn').forEach(btn => {
    btn.onclick = async () => {
      if (!confirm('Delete this slot?')) return;
      try {
        await ScheduleAPI.delete(btn.dataset.id);
        showToast('Slot removed', 'info');
        await renderSchedulePage();
      } catch (err) { showToast(err.message, 'error'); }
    };
  });
}

function showAddSlotModal() {
  openModal('Add Schedule Slot', `
    <form id="addSlotForm">
      <div class="form-group">
        <label class="form-label">Title *</label>
        <input class="form-control" id="slotTitle" placeholder="e.g. Physics Lecture" required />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Day *</label>
          <select class="form-control" id="slotDay">
            ${DAYS.map(d=>`<option value="${d}">${capitalize(d)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Type</label>
          <select class="form-control" id="slotType">
            <option value="study">Study</option>
            <option value="class">Class</option>
            <option value="break">Break</option>
            <option value="exercise">Exercise</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Start Time *</label>
          <input class="form-control" type="time" id="slotStart" required />
        </div>
        <div class="form-group">
          <label class="form-label">End Time *</label>
          <input class="form-control" type="time" id="slotEnd" required />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Subject</label>
        <input class="form-control" id="slotSubject" placeholder="e.g. Mathematics" />
      </div>
      <div class="form-group">
        <label class="form-label">Color</label>
        <input class="form-control" type="color" id="slotColor" value="#6366f1" style="height:40px;padding:4px" />
      </div>
      <button type="submit" class="btn btn-primary w-full">Add Slot</button>
    </form>
  `);

  document.getElementById('addSlotForm').onsubmit = async (e) => {
    e.preventDefault();
    try {
      await ScheduleAPI.create({
        title    : document.getElementById('slotTitle').value,
        day      : document.getElementById('slotDay').value,
        type     : document.getElementById('slotType').value,
        startTime: document.getElementById('slotStart').value,
        endTime  : document.getElementById('slotEnd').value,
        subject  : document.getElementById('slotSubject').value,
        color    : document.getElementById('slotColor').value,
      });
      closeModal();
      showToast('Slot added!', 'success');
      await renderSchedulePage();
    } catch (err) { showToast(err.message, 'error'); }
  };
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
