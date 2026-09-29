/**
 * Client-side brute-force throttle for the login form. State is kept in
 * localStorage per email address, so it survives reloads but is scoped to
 * this browser — it's a UX-level deterrent on top of Firebase Auth's own
 * server-side rate limiting, not a substitute for it.
 */

const FAILS_BEFORE_FIRST_LOCK = 3;
const LOCK_DURATIONS_MS = [60_000, 3 * 60_000, 5 * 60_000, 10 * 60_000]; // 1, 3, 5, 10 min

interface LockoutState {
  failCount: number;
  /** Index into LOCK_DURATIONS_MS of the last lock applied; -1 = never locked. */
  lockLevel: number;
  lockedUntil: number;
}

const emptyState = (): LockoutState => ({ failCount: 0, lockLevel: -1, lockedUntil: 0 });

function storageKey(email: string) {
  return `kb_login_lockout:${email.trim().toLowerCase()}`;
}

function readState(email: string): LockoutState {
  try {
    const raw = localStorage.getItem(storageKey(email));
    if (!raw) return emptyState();
    return { ...emptyState(), ...JSON.parse(raw) };
  } catch {
    return emptyState();
  }
}

function writeState(email: string, state: LockoutState) {
  try {
    localStorage.setItem(storageKey(email), JSON.stringify(state));
  } catch {
    // Private browsing or storage disabled — throttling is simply skipped.
  }
}

/** Remaining lockout in ms for this email, or 0 if it isn't currently locked. */
export function getLockoutRemaining(email: string): number {
  if (!email) return 0;
  return Math.max(0, readState(email).lockedUntil - Date.now());
}

export interface AttemptResult {
  /** > 0 if this failure just triggered a (new) lockout. */
  lockedMs: number;
  /** Attempts left before the first lockout kicks in (only set while lockedMs is 0). */
  remainingAttempts: number;
}

/**
 * Records a failed login attempt. The first lockout needs 3 failures; every
 * failure after that (once unlocked again) immediately escalates to the next,
 * longer duration, capping at the last entry in LOCK_DURATIONS_MS.
 */
export function registerFailedAttempt(email: string): AttemptResult {
  if (!email) return { lockedMs: 0, remainingAttempts: FAILS_BEFORE_FIRST_LOCK };

  const state = readState(email);
  state.failCount += 1;

  const isFirstLock = state.lockLevel === -1;
  const shouldLock = isFirstLock ? state.failCount >= FAILS_BEFORE_FIRST_LOCK : true;

  if (!shouldLock) {
    writeState(email, state);
    return { lockedMs: 0, remainingAttempts: FAILS_BEFORE_FIRST_LOCK - state.failCount };
  }

  state.lockLevel = Math.min(state.lockLevel + 1, LOCK_DURATIONS_MS.length - 1);
  state.lockedUntil = Date.now() + LOCK_DURATIONS_MS[state.lockLevel];
  state.failCount = 0;
  writeState(email, state);
  return { lockedMs: LOCK_DURATIONS_MS[state.lockLevel], remainingAttempts: 0 };
}

/** Clears all lockout history for an email — call this after a successful login. */
export function clearLockout(email: string) {
  if (!email) return;
  try {
    localStorage.removeItem(storageKey(email));
  } catch {
    // ignore
  }
}

export function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds} Sekunden`;
  return `${minutes}:${String(seconds).padStart(2, "0")} Minuten`;
}
