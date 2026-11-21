/**
 * Pomodoro Timer Service – an in-memory Pomodoro (work/break) timer.
 * It extends Node's EventEmitter so other parts of the app can
 * listen for "tick" (every minute) and "phase-change" events.
 * Note: timers live only in server memory, so they disappear if
 * the server restarts — no data is written to disk here.
 */
// ============================================================
// Pomodoro Timer Service
// ============================================================
const EventEmitter = require('events');

/**
 * Manages any number of independent Pomodoro timers, keyed by a
 * sessionId (e.g. one per connected user).
 * Events emitted:
 *   - "tick":        every minute, with the current status object
 *   - "phase-change": when work↔break phases switch
 */
class PomodoroService extends EventEmitter {
  /**
   * Creates the service with an empty registry of active sessions.
   * `this.sessions` maps sessionId → session state object.
   */
  constructor() {
    super();
    this.sessions = {};
  }

  /**
   * Starts (or restarts) a Pomodoro timer for one session.
   * Each timer uses setInterval that fires once per minute and
   * counts up elapsed minutes; when the work or break phase
   * reaches its full length, the phase flips (work → break →
   * work, counting each finished work block as one "cycle").
   * @param {string} sessionId - Unique id for this timer.
   * @param {number} [workMinutes=25] - Length of each work phase.
   * @param {number} [breakMinutes=5] - Length of each break phase.
   * @returns {Object} The timer's current status (see getStatus).
   */
  start(sessionId, workMinutes = 25, breakMinutes = 5) {
    // If a timer already exists for this id, stop it first so we
    // never end up with two intervals ticking for the same session.
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

    // The heart of the timer: runs every 60,000 ms (1 minute).
    session.interval = setInterval(() => {
      session.elapsed += 1;
      // Current phase's full length in minutes (work or break).
      const phaseDuration = session.phase === 'work' ? workMinutes : breakMinutes;

      if (session.elapsed >= phaseDuration) {
        if (session.phase === 'work') {
          // A full work block completed → count it as one cycle,
          // then switch into the break phase.
          session.cycles += 1;
          session.phase   = 'break';
          this.emit('phase-change', { sessionId, phase: 'break', cycle: session.cycles });
        } else {
          // Break finished → back to work for the next cycle.
          session.phase = 'work';
          this.emit('phase-change', { sessionId, phase: 'work', cycle: session.cycles });
        }
        session.elapsed = 0;   // restart the countdown for the new phase
      }
      this.emit('tick', { sessionId, ...this.getStatus(sessionId) });
    }, 60_000);

    return this.getStatus(sessionId);
  }

  /**
   * Stops a timer permanently and removes it from memory.
   * @param {string} sessionId - Id of the timer to stop.
   * @returns {Object|null} The final status summary of the stopped
   *   timer, or null if no such timer was running.
   */
  stop(sessionId) {
    const session = this.sessions[sessionId];
    if (!session) return null;
    clearInterval(session.interval);   // cancels the once-per-minute tick
    session.active = false;
    // Capture the summary BEFORE deleting, so the caller can see
    // how many cycles/minutes were completed.
    const summary  = this.getStatus(sessionId);
    delete this.sessions[sessionId];
    return summary;
  }

  /**
   * Builds a snapshot of a timer's current state.
   * @param {string} sessionId - Id of the timer to inspect.
   * @returns {Object|null} Status details (phase, cycles, elapsed,
   *   remaining minutes in the phase, and totalWorkMinutes), or
   *   null if no timer with that id exists.
   */
  getStatus(sessionId) {
    const s = this.sessions[sessionId];
    if (!s) return null;
    const phaseDuration = s.phase === 'work' ? s.workMinutes : s.breakMinutes;
    return {
      sessionId,
      phase          : s.phase,
      cycles         : s.cycles,
      elapsed        : s.elapsed,
      remaining      : phaseDuration - s.elapsed,   // minutes left in the current phase
      phaseDuration,
      // Total work done so far: full completed cycles plus any
      // minutes already logged in the current (incomplete) work phase.
      totalWorkMinutes: s.cycles * s.workMinutes + (s.phase === 'work' ? s.elapsed : 0),
    };
  }
}

// One shared instance is created and exported, so every route that
// imports this module talks to the exact same set of timers.
const pomodoroService = new PomodoroService();
module.exports = pomodoroService;
