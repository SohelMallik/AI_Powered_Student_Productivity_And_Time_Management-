/* ============================================================
   Schedule Page  – Weekly Timetable
   ============================================================ */
const DAYS  = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7 AM – 10 PM

async function renderSchedulePage() {
  const root = document.getElementById('schedule-root');
  root.innerHTML = `<div style="text-align:center;padding:32px"><div class="spinner"></div></div>`;
  try {
    const res      = await ScheduleAPI.getAll();
    const slots    = res.data || [];
    buildScheduleUI(slots);
  } catch (e) {
    root.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div>
      <h3>${e.message}</h3></div>`;
  }
}

function buildScheduleUI(slots) {
  const root = document.getElementById('schedule-root');
  root.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <div>
        <h2 style="font-size:20px;font-weight:800">Weekly Schedule</h2>
        <p class="text-muted text-sm">${slots.length} time slots configured</p>
      </div>
      <button class="btn btn-primary" id="addSlotBtn">+ Add Slot</button>
    </div>

    <!-- Timetable -->
    <div class="card" style="overflow-x:auto;padding:0">
      <div id="timetableContainer" style="min-width:700px"></div>
    </div>

    <!-- Slot List -->
    <div class="card mt-4">
      <div class="card-header">
        <div class="card-title">📋 All Slots</div>
      </div>
      <div id="slotList" class="grid-2"></div>
    </div>
  `;

  document.getElementById('addSlotBtn').onclick = showAddSlotModal;
  renderTimetable(slots);
  renderSlotList(slots);
}

function renderTimetable(slots) {
  const container = document.getElementById('timetableContainer');
  let html = `<div class="timetable" style="grid-template-rows:auto ${HOURS.map(()=>'40px').join(' ')}">`;

  // Header row
  html += `<div class="timetable-header"></div>`;
  DAYS.forEach(d => {
    html += `<div class="timetable-header">${d.slice(0,3).toUpperCase()}</div>`;
  });

  // Hour rows
  HOURS.forEach(h => {
    const label = h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h-12}pm`;
    html += `<div class="timetable-time">${label}</div>`;
    DAYS.forEach(day => {
      const daySlots = slots.filter(s => s.day === day);
      const slotHtml = daySlots
        .filter(s => {
          const [sh] = (s.startTime || '00:00').split(':').map(Number);
          return sh === h;
        })
        .map(s => {
          const bg  = s.color || subjectColor(s.subject || s.title);
          return `<div class="schedule-slot" 
                    style="background:${bg};color:#fff;top:2px"
                    title="${s.title} (${s.startTime}–${s.endTime})">${s.title}</div>`;
        }).join('');
      html += `<div class="timetable-cell" style="position:relative">${slotHtml}</div>`;
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
  list.innerHTML = slots.map(s => `
    <div class="card" style="padding:14px 16px;display:flex;align-items:center;gap:12px">
      <div style="width:12px;height:12px;border-radius:3px;background:${s.color || subjectColor(s.subject||s.title)};flex-shrink:0"></div>
      <div style="flex:1">
        <div style="font-weight:700;font-size:13px">${s.title}</div>
        <div class="text-muted text-sm">${capitalize(s.day)} · ${s.startTime}–${s.endTime} · ${s.type}</div>
      </div>
      <div style="display:flex;gap:4px">
        <button class="btn btn-danger btn-sm slot-delete-btn" data-id="${s.id}">🗑</button>
      </div>
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
        <input class="form-control" type="color" id="slotColor" value="#3b82d4" style="height:40px;padding:4px" />
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
