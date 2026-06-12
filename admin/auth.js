/**
 * Ascendra Admin — Auth Guard
 * Included in every admin page <head> to enforce lock screen before access.
 * Does NOT belong in lock.html itself.
 */
(function () {
  'use strict';

  var SESSION_KEY   = 'ascendra_session';
  var ACTIVITY_KEY  = 'ascendra_activity';
  var AUTOLOCK_KEY  = 'ascendra_autolock_minutes';
  var LOCK_URL      = '/lock.html';

  // Read auto-lock duration from settings (default 30 min, 0 = never)
  function getInactivityMs() {
    var raw = localStorage.getItem(AUTOLOCK_KEY);
    var minutes = raw !== null ? parseInt(raw, 10) : 30;
    if (!isFinite(minutes) || minutes <= 0) return Infinity; // never
    return minutes * 60 * 1000;
  }

  function getToken() {
    try {
      var s = sessionStorage.getItem(SESSION_KEY);
      if (!s) return null;
      return JSON.parse(s).token || null;
    } catch (e) { return null; }
  }

  function lastActivityAge() {
    var a = parseInt(sessionStorage.getItem(ACTIVITY_KEY) || '0', 10);
    return Date.now() - a;
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(ACTIVITY_KEY);
    sessionStorage.removeItem('ascendra_session_start');
  }

  function redirectToLock() {
    window.location.replace(LOCK_URL);
  }

  // ── Immediate sync check (blocks render — no flash of content) ──
  var token = getToken();
  if (!token) {
    redirectToLock();
  } else if (lastActivityAge() > getInactivityMs()) {
    clearSession();
    redirectToLock();
  }

  // ── Background server validation (non-blocking) ──────────────────
  if (token) {
    fetch('/api/verify-pin?token=' + encodeURIComponent(token))
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d.valid) { clearSession(); redirectToLock(); }
      })
      .catch(function () { /* keep session on network error */ });
  }

  // ── Activity tracking ─────────────────────────────────────────────
  function touch() {
    sessionStorage.setItem(ACTIVITY_KEY, Date.now().toString());
  }

  ['click', 'keydown', 'touchstart', 'scroll'].forEach(function (evt) {
    document.addEventListener(evt, touch, { passive: true, capture: true });
  });

  // Periodic inactivity check (every 60s)
  setInterval(function () {
    if (lastActivityAge() > getInactivityMs()) { clearSession(); redirectToLock(); }
  }, 60000);

  // ── Global lock function ──────────────────────────────────────────
  window.lockAdmin = function () {
    clearSession();
    redirectToLock();
  };

  // ── Session info helper (used by settings page) ───────────────────
  window.getSessionInfo = function () {
    var start = parseInt(sessionStorage.getItem('ascendra_session_start') || '0', 10);
    var activity = parseInt(sessionStorage.getItem(ACTIVITY_KEY) || '0', 10);
    var autolockMin = localStorage.getItem(AUTOLOCK_KEY);
    var minutes = autolockMin !== null ? parseInt(autolockMin, 10) : 30;
    return {
      sessionStart: start || null,
      lastActivity: activity || null,
      autolockMinutes: isFinite(minutes) && minutes > 0 ? minutes : 0,
      userAgent: navigator.userAgent,
      hasSession: !!getToken()
    };
  };

  // Stamp initial activity
  touch();
})();
