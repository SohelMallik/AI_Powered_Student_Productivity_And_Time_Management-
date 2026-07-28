// ============================================================
// Pomodoro Timer Service
// ============================================================
const EventEmitter = require('events');

class PomodoroService extends EventEmitter {
  constructor() {
    super();
    this.sessions = {};
  }

  start(sessionId, workMinutes = 25, breakMinutes = 5) {
    if (this.sessions[sessionId]) this.stop(sessionId);

    const session = {
      id           : sessionId,
      phase        : 'work',
      workMinutes,
      breakMinutes,
      startedAt    : Date.now(),
      elapsed      : 0,
      cycles       : 0,
      active       : true,
    };
    this.sessions[sessionId] = session;

    session.interval = setInterval(() => {
      session.elapsed += 1;
      const phaseDuration = session.phase === 'work' ? workMinutes : breakMinutes;

      if (session.elapsed >= phaseDuration) {
        if (session.phase === 'work') {
          session.cycles += 1;
          session.phase   = 'break';
          this.emit('phase-change', { sessionId, phase: 'break', cycle: session.cycles });
        } else {
          session.phase = 'work';
          this.emit('phase-change', { sessionId, phase: 'work', cycle: session.cycles });
        }
        session.elapsed = 0;
      }
      this.emit('tick', { sessionId, ...this.getStatus(sessionId) });
    }, 60_000);

    return this.getStatus(sessionId);
  }

  stop(sessionId) {
    const session = this.sessions[sessionId];
    if (!session) return null;
    clearInterval(session.interval);
    session.active = false;
    const summary  = this.getStatus(sessionId);
    delete this.sessions[sessionId];
    return summary;
  }

  getStatus(sessionId) {
    const s = this.sessions[sessionId];
    if (!s) return null;
    const phaseDuration = s.phase === 'work' ? s.workMinutes : s.breakMinutes;
    return {
      sessionId,
      phase          : s.phase,
      cycles         : s.cycles,
      elapsed        : s.elapsed,
      remaining      : phaseDuration - s.elapsed,
      phaseDuration,
      totalWorkMinutes: s.cycles * s.workMinutes + (s.phase === 'work' ? s.elapsed : 0),
    };
  }
}

const pomodoroService = new PomodoroService();
module.exports = pomodoroService;
