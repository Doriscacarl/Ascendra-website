/**
 * Ascendra Admin - Security Operations API
 *
 * POST /api/admin-security
 * Actions:
 *   register-biometric  - verify current PIN, return biometric token to store in localStorage
 *   get-recovery-token  - verify current PIN, return formatted recovery code
 *   change-pin          - verify current PIN, store new PIN hash in Supabase (requires SUPABASE_SERVICE_ROLE_KEY)
 *
 * All actions require ADMIN_ACCESS_CODE + ADMIN_SESSION_SECRET env vars.
 * PIN change requires SUPABASE_SERVICE_ROLE_KEY + the admin_config table in Supabase.
 *
 * Supabase table SQL (run once in Supabase SQL Editor):
 *   CREATE TABLE IF NOT EXISTS admin_config (
 *     key text PRIMARY KEY,
 *     value text NOT NULL,
 *     updated_at timestamptz DEFAULT now()
 *   );
 *   ALTER TABLE admin_config DISABLE ROW LEVEL SECURITY;
 */

const crypto = require('crypto');

// Weak PIN patterns to reject
const WEAK_PINS = new Set([
  '0000','1111','2222','3333','4444','5555','6666','7777','8888','9999',
  '1234','2345','3456','4567','5678','6789','0123','9876','8765','7654',
  '6543','5432','4321','3210','1230','0987','1357','2580','1212','1313',
  '1414','1515','1122','2211','0011','1100','0110','1001',
  '000000','111111','222222','333333','444444','555555','666666',
  '777777','888888','999999','123456','234567','345678','456789',
  '012345','987654','654321','112233','121212','123123'
]);

function isWeakPin(pin) {
  if (WEAK_PINS.has(pin)) return true;
  if (/^(\d)\1+$/.test(pin)) return true; // all same digit
  return false;
}

function verifyPin(pin, code) {
  const p = String(pin || '');
  const c = String(code || '');
  if (!p || p.length !== c.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(p, 'utf8'), Buffer.from(c, 'utf8'));
  } catch (_) { return false; }
}

module.exports = async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const code   = process.env.ADMIN_ACCESS_CODE;
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!code || !secret) {
    return res.status(500).json({ error: 'Admin not configured' });
  }

  let body;
  try {
    body = typeof req.body === 'object' && req.body !== null
      ? req.body
      : JSON.parse(req.body || '{}');
  } catch (_) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const { action } = body;

  // ── Register biometric ────────────────────────────────────────────
  // Client calls after a successful WebAuthn credential.create() registration.
  // Returns the biometric token to store in localStorage for future lock screen use.
  if (action === 'register-biometric') {
    if (!verifyPin(body.pin, code)) {
      return res.status(401).json({ error: 'Incorrect access code - verify your current PIN first' });
    }
    const bioToken = crypto.createHmac('sha256', secret)
      .update('biometric-auth-token-v1')
      .digest('hex');
    return res.json({ bioToken });
  }

  // ── Get recovery token ────────────────────────────────────────────
  // Returns a formatted recovery code derived from the session secret.
  // The raw token is verified by /api/verify-pin (action=recovery).
  if (action === 'get-recovery-token') {
    if (!verifyPin(body.pin, code)) {
      return res.status(401).json({ error: 'Incorrect access code' });
    }
    const raw = crypto.createHmac('sha256', secret)
      .update('recovery-auth-token-v1')
      .digest('hex');
    // Format as XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX (64 hex chars → 8 groups of 4)
    const groups = [];
    for (let i = 0; i < 64; i += 8) groups.push(raw.slice(i, i + 8));
    const formatted = groups.join('-').toUpperCase();
    return res.json({ formatted, raw });
  }

  // ── Change PIN ────────────────────────────────────────────────────
  // Verifies current PIN, validates new PIN, stores HMAC hash in Supabase.
  // Requires SUPABASE_SERVICE_ROLE_KEY env var + admin_config table.
  if (action === 'change-pin') {
    if (!verifyPin(body.currentPin, code)) {
      return res.status(401).json({ error: 'Incorrect current access code' });
    }

    const newPin = String(body.newPin || '');

    if (!newPin || newPin.length < 4) {
      return res.status(400).json({ error: 'New PIN must be at least 4 digits' });
    }
    if (newPin.length > 64) {
      return res.status(400).json({ error: 'PIN too long (max 64 characters)' });
    }
    if (isWeakPin(newPin)) {
      return res.status(400).json({ error: 'This PIN is too predictable. Choose a stronger code.' });
    }

    const sbUrl = process.env.SUPABASE_URL;
    const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!sbUrl || !sbKey) {
      return res.status(422).json({
        requiresManualUpdate: true,
        error: 'Supabase service role key not configured. Update ADMIN_ACCESS_CODE manually.',
        instructions: 'Go to Vercel Dashboard → Your Project → Settings → Environment Variables → update ADMIN_ACCESS_CODE to your new PIN, then redeploy.'
      });
    }

    // Store HMAC of new PIN (keyed with session secret) in Supabase
    const pinHash = crypto.createHmac('sha256', secret).update(newPin).digest('hex');

    try {
      const r = await fetch(`${sbUrl}/rest/v1/admin_config`, {
        method: 'POST',
        headers: {
          'apikey': sbKey,
          'Authorization': `Bearer ${sbKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify([{ key: 'pin_hash', value: pinHash, updated_at: new Date().toISOString() }])
      });
      if (!r.ok) {
        const err = await r.text().catch(() => 'Unknown error');
        return res.status(500).json({ error: 'Failed to store PIN: ' + err });
      }
      return res.json({ success: true, message: 'PIN updated successfully' });
    } catch (e) {
      return res.status(500).json({ error: 'Database error: ' + (e.message || 'Unknown') });
    }
  }

  return res.status(400).json({ error: 'Unknown action' });
};
