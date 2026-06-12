/**
 * Ascendra Admin — Auth Guard
 * Included in every admin page <head> to enforce lock screen before access.
 * Does NOT belong in lock.html itself.
 */
(function () {
  'use strict';

  var SESSION_KEY = 'ascendra_session';
  var ACTIVITY_KEY = 'ascendra_activity';
  var LOCK_URL = '/lock.html';
  var INACTIVITY_MS = 30 * 60 * 1000; // 30 minutes

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
  }

  function redirectToLock() {
    window.location.replace(LOCK_URL);
  }

  // ── Immediate sync check (blocks render — no flash of content) ──
  var token = getToken();
  if (!token) {
    redirectToLock();
  } else if (lastActivityAge() > INACTIVITY_MS) {
    clearSession();
    redirectToLock();
  }

  // ── Background server validation (non-blocking) ──────────────────
  // Silently verifies the token hasn't been invalidated server-side.
  // On network error we keep the session (don't lock on API failure).
  if (token) {
    fetch('/api/verify-pin?token=' + encodeURIComponent(token))
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d.valid) { clearSession(); redirectToLock(); }
      })
      .catch(function () { /* keep session — network issue */ });
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
    if (lastActivityAge() > INACTIVITY_MS) { clearSession(); redirectToLock(); }
  }, 60000);

  // ── Global lock function (called by lock button in topbar) ────────
  window.lockAdmin = function () {
    clearSession();
    redirectToLock();
  };

  // Stamp initial activity
  touch();
})();
