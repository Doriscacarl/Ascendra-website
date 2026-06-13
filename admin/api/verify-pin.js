const crypto = require('crypto');

// In-memory rate limit store (resets on cold start - acceptable for single-user private admin)
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
  for (const w of [hw, hw - 1]) {
    const expected = crypto.createHmac('sha256', secret)
      .update(code + ':' + w)
      .digest('hex');
    try {
      if (crypto.timingSafeEqual(Buffer.from(token, 'hex'), Buffer.from(expected, 'hex'))) return true;
    } catch (_) {}
  }
  return false;
}

// Biometric token: static HMAC tied to the session secret
// Issued by /api/admin-security when user registers biometric (after PIN verification)
function makeBiometricToken(secret) {
  return crypto.createHmac('sha256', secret)
    .update('biometric-auth-token-v1')
    .digest('hex');
}

// Recovery token: static HMAC, shown to user as a formatted code
function makeRecoveryToken(secret) {
  return crypto.createHmac('sha256', secret)
    .update('recovery-auth-token-v1')
    .digest('hex');
}

module.exports = async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');

  const code   = process.env.ADMIN_ACCESS_CODE;
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!code || !secret) {
    return res.status(500).json({
      error: 'Admin not configured. Set ADMIN_ACCESS_CODE and ADMIN_SESSION_SECRET in Vercel environment variables.'
    });
  }

  // ── GET: verify existing session token ───────────────────────────
  if (req.method === 'GET') {
    const { token } = req.query;
    return res.json({ valid: checkToken(token, code, secret) });
  }

  // ── POST ──────────────────────────────────────────────────────────
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body;
  try {
    body = typeof req.body === 'object' && req.body !== null
      ? req.body
      : JSON.parse(req.body || '{}');
  } catch (_) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  // ── Action: biometric unlock ──────────────────────────────────────
  // Called after a successful WebAuthn platform assertion.
  // Verifies the locally-stored biometric token (issued at registration time).
  if (body.action === 'biometric') {
    const provided = String(body.bioToken || '');
    const expected = makeBiometricToken(secret);
    if (provided.length === 64) {
      try {
        if (crypto.timingSafeEqual(Buffer.from(provided, 'hex'), Buffer.from(expected, 'hex'))) {
          return res.json({ token: makeToken(code, secret) });
        }
      } catch (_) {}
    }
    return res.status(401).json({ error: 'Invalid biometric credential' });
  }

  // ── Action: recovery code unlock ──────────────────────────────────
  // Accepts the recovery token (stripped of formatting) that was generated in settings.
  if (body.action === 'recovery') {
    const provided = String(body.recoveryToken || '').replace(/[-\s]/g, '').toLowerCase();
    const expected = makeRecoveryToken(secret);
    if (provided.length === 64) {
      try {
        if (crypto.timingSafeEqual(Buffer.from(provided, 'hex'), Buffer.from(expected, 'hex'))) {
          return res.json({ token: makeToken(code, secret) });
        }
      } catch (_) {}
    }
    return res.status(401).json({ error: 'Invalid recovery code' });
  }

  // ── Action: PIN / password verify (standard flow) ─────────────────
  const ip = ((req.headers['x-forwarded-for'] || '') || (req.socket && req.socket.remoteAddress) || 'unknown')
    .split(',')[0].trim();
  const now = Date.now();

  // Rate limiting
  const rl = rateLimitStore.get(ip) || { count: 0, lockedUntil: 0 };
  if (rl.lockedUntil > now) {
    return res.status(429).json({
      error: 'Too many failed attempts.',
      lockedUntil: rl.lockedUntil,
      waitSeconds: Math.ceil((rl.lockedUntil - now) / 1000)
    });
  }

  let pin;
  try {
    pin = String(body.pin || '');
  } catch (_) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  if (!pin || pin.length < 1 || pin.length > 64) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  // Check against Supabase PIN override first (if service role key is configured)
  let effectiveCode = code;
  const sbUrl = process.env.SUPABASE_URL;
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (sbUrl && sbKey) {
    try {
      const r = await fetch(`${sbUrl}/rest/v1/admin_config?key=eq.pin_hash&select=value`, {
        headers: {
          'apikey': sbKey,
          'Authorization': `Bearer ${sbKey}`,
          'Cache-Control': 'no-cache'
        }
      });
      if (r.ok) {
        const data = await r.json();
        if (data && data[0] && data[0].value) {
          // Supabase stores HMAC(secret, newPin) - compare directly
          const storedHash = data[0].value;
          const pinHash = crypto.createHmac('sha256', secret).update(pin).digest('hex');
          try {
            if (crypto.timingSafeEqual(Buffer.from(pinHash, 'hex'), Buffer.from(storedHash, 'hex'))) {
              rateLimitStore.delete(ip);
              return res.json({ token: makeToken(code, secret) });
            }
          } catch (_) {}
          // Wrong PIN (against Supabase hash) - fall through to env var check
        }
      }
    } catch (_) { /* continue with env var */ }
  }

  // Timing-safe comparison against ADMIN_ACCESS_CODE
  let correct = false;
  if (pin.length === effectiveCode.length) {
    try {
      correct = crypto.timingSafeEqual(
        Buffer.from(pin, 'utf8'),
        Buffer.from(effectiveCode, 'utf8')
      );
    } catch (_) {}
  }

  if (!correct) {
    rl.count = (rl.count || 0) + 1;
    const attemptsLeft = Math.max(0, 5 - rl.count);

    if (rl.count >= 5) {
      rl.lockedUntil = now + 15 * 60 * 1000;
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

  rateLimitStore.delete(ip);
  return res.json({ token: makeToken(code, secret) });
};
