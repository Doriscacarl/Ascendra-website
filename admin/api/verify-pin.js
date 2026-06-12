const crypto = require('crypto');

// In-memory rate limit store (resets on cold start — fine for a private single-user admin)
const rateLimitStore = new Map();

function hourWindow() {
  return Math.floor(Date.now() / (60 * 60 * 1000));
}

function makeToken(code, secret) {
  return crypto.createHmac('sha256', secret)
    .update(code + ':' + hourWindow())
    .digest('hex');
}

function checkToken(token, code, secret) {
  if (!token || typeof token !== 'string' || token.length !== 64) return false;
  const hw = hourWindow();
  // Accept tokens from current hour and previous hour (handles boundary edge case)
  for (const w of [hw, hw - 1]) {
    const expected = crypto.createHmac('sha256', secret)
      .update(code + ':' + w)
      .digest('hex');
    try {
      if (crypto.timingSafeEqual(Buffer.from(token, 'hex'), Buffer.from(expected, 'hex'))) {
        return true;
      }
    } catch (_) {}
  }
  return false;
}

module.exports = async function handler(req, res) {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');

  const code = process.env.ADMIN_ACCESS_CODE;
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!code || !secret) {
    return res.status(500).json({
      error: 'Admin not configured. Set ADMIN_ACCESS_CODE and ADMIN_SESSION_SECRET in Vercel environment variables.'
    });
  }

  // ── Verify existing session token (GET) ────────────────
  if (req.method === 'GET') {
    const { token } = req.query;
    return res.json({ valid: checkToken(token, code, secret) });
  }

  // ── Verify PIN / access code (POST) ────────────────────
  if (req.method === 'POST') {
    const ip = ((req.headers['x-forwarded-for'] || '') || (req.socket && req.socket.remoteAddress) || 'unknown')
      .split(',')[0].trim();
    const now = Date.now();

    // Check rate limit
    const rl = rateLimitStore.get(ip) || { count: 0, lockedUntil: 0 };
    if (rl.lockedUntil > now) {
      return res.status(429).json({
        error: 'Too many failed attempts.',
        lockedUntil: rl.lockedUntil,
        waitSeconds: Math.ceil((rl.lockedUntil - now) / 1000)
      });
    }

    // Parse body (Vercel auto-parses JSON bodies)
    let pin;
    try {
      const body = typeof req.body === 'object' && req.body !== null
        ? req.body
        : JSON.parse(req.body || '{}');
      pin = String(body.pin || '');
    } catch (_) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    if (!pin || pin.length < 1 || pin.length > 64) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    // Timing-safe comparison (prevents timing attacks)
    let correct = false;
    if (pin.length === code.length) {
      try {
        correct = crypto.timingSafeEqual(
          Buffer.from(pin, 'utf8'),
          Buffer.from(code, 'utf8')
        );
      } catch (_) {}
    }

    if (!correct) {
      rl.count = (rl.count || 0) + 1;
      const attemptsLeft = Math.max(0, 5 - rl.count);

      if (rl.count >= 5) {
        rl.lockedUntil = now + 15 * 60 * 1000; // 15 minute lockout
        rl.count = 0;
        rateLimitStore.set(ip, rl);
        return res.status(429).json({
          error: 'Too many failed attempts. Locked for 15 minutes.',
          lockedUntil: rl.lockedUntil,
          waitSeconds: 900
        });
      }

      rateLimitStore.set(ip, rl);
      return res.status(401).json({ error: 'Incorrect code', attemptsLeft });
    }

    // Correct PIN — reset rate limit and issue signed session token
    rateLimitStore.delete(ip);
    return res.json({ token: makeToken(code, secret) });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
