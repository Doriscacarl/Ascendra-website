/**
 * notify-admin — Supabase Edge Function
 *
 * Triggered by a Supabase Database Webhook on notifications INSERT.
 * 1. Sends a Web Push notification to every stored subscription.
 * 2. Sends an email backup via Resend.
 *
 * Required secrets (set via `supabase secrets set`):
 *   VAPID_PUBLIC_KEY   — base64url ECDH public key
 *   VAPID_PRIVATE_KEY  — base64url ECDH private key
 *   RESEND_API_KEY     — from resend.com (free tier is fine)
 *
 * Optional:
 *   VAPID_SUBJECT      — defaults to mailto:doriscacarlm40@gmail.com
 *   ADMIN_EMAIL        — defaults to doriscacarlm40@gmail.com
 *   ADMIN_URL          — defaults to https://ascendra-admin.vercel.app
 */

import webpush from 'npm:web-push@3.6.7';

const SUPABASE_URL       = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY       = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC_KEY   = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY  = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT      = Deno.env.get('VAPID_SUBJECT')      || 'mailto:doriscacarlm40@gmail.com';
const RESEND_API_KEY     = Deno.env.get('RESEND_API_KEY')     || '';
const ADMIN_EMAIL        = Deno.env.get('ADMIN_EMAIL')        || 'doriscacarlm40@gmail.com';
const ADMIN_URL          = Deno.env.get('ADMIN_URL')          || 'https://ascendra-website.vercel.app';

const TYPE_LABELS: Record<string, string> = {
  new_lead:    'New Lead',
  new_quote:   'New Quote Request',
  new_audit:   'New Website Audit',
  new_message: 'New Message',
};

const TYPE_PATHS: Record<string, string> = {
  new_lead:    '/admin/crm-leads.html',
  new_quote:   '/admin/quote-requests.html',
  new_audit:   '/admin/website-audits.html',
  new_message: '/admin/messages.html',
};

const TYPE_COLORS: Record<string, string> = {
  new_lead:    '#6ee7b7',
  new_quote:   '#adc6ff',
  new_audit:   '#c4b5fd',
  new_message: '#adc6ff',
};

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // ── Parse webhook payload ──────────────────────────────────────────────
  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  // Supabase webhook sends { type, table, schema, record, old_record }
  const notif = (payload.record ?? payload.new ?? payload) as Record<string, unknown>;
  if (!notif?.id) {
    return new Response('No notification record', { status: 400 });
  }

  const typeLabel  = TYPE_LABELS[notif.type as string] || 'New Notification';
  const targetPath = TYPE_PATHS[notif.type as string]  || '/admin/notifications.html';
  const targetUrl  = ADMIN_URL + targetPath;
  const accentColor = TYPE_COLORS[notif.type as string] || '#adc6ff';

  const results = {
    push_sent: 0,
    push_failed: 0,
    push_expired_removed: 0,
    email: false,
    errors: [] as string[],
  };

  // ── 1. Fetch push subscriptions ────────────────────────────────────────
  let subscriptions: Array<{ endpoint: string; p256dh: string; auth: string }> = [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/push_subscriptions?select=endpoint,p256dh,auth`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    if (res.ok) {
      subscriptions = await res.json();
    } else {
      results.errors.push(`fetch_subs: ${res.status} ${await res.text()}`);
    }
  } catch (e) {
    results.errors.push(`fetch_subs: ${(e as Error).message}`);
  }

  // ── 2. Send Web Push to each subscription ──────────────────────────────
  const pushPayload = JSON.stringify({
    title: String(notif.title || typeLabel),
    body:  String(notif.message || ''),
    url:   targetUrl,
    tag:   `ascendra-${notif.type || 'notif'}`,
  });

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        pushPayload
      );
      results.push_sent++;
    } catch (e: unknown) {
      const err = e as { statusCode?: number; message?: string };
      if (err.statusCode === 410 || err.statusCode === 404) {
        // Subscription expired — clean it up
        results.push_expired_removed++;
        await fetch(
          `${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(sub.endpoint)}`,
          {
            method: 'DELETE',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
            },
          }
        ).catch(() => {});
      } else {
        results.push_failed++;
        results.errors.push(`push: ${err.message ?? String(e)}`);
      }
    }
  }

  // ── 3. Send email via Resend ───────────────────────────────────────────
  if (RESEND_API_KEY) {
    try {
      const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:480px;margin:40px auto;padding:0 16px">
    <div style="background:#141414;border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden">
      <!-- Header -->
      <div style="padding:24px 28px 20px;border-bottom:1px solid rgba(255,255,255,0.06)">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:8px;height:8px;border-radius:50%;background:${accentColor};box-shadow:0 0 8px ${accentColor}40;flex-shrink:0"></div>
          <span style="font-family:Georgia,serif;font-size:14px;font-weight:700;letter-spacing:-0.01em;color:#e6e3e2">ASCENDRA</span>
          <span style="margin-left:auto;font-family:monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#72768a;background:rgba(255,255,255,0.04);padding:3px 8px;border-radius:4px">${typeLabel}</span>
        </div>
      </div>
      <!-- Body -->
      <div style="padding:24px 28px">
        <div style="font-family:Georgia,serif;font-size:22px;font-weight:700;letter-spacing:-0.02em;color:#e6e3e2;line-height:1.2;margin-bottom:10px">${escapeHtml(String(notif.title || typeLabel))}</div>
        <div style="font-size:13px;color:#b4b9c7;line-height:1.6;margin-bottom:24px">${escapeHtml(String(notif.message || ''))}</div>
        <a href="${targetUrl}" style="display:inline-flex;align-items:center;gap:8px;padding:11px 20px;background:${accentColor};color:#001a42;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:0.01em">
          View in Admin →
        </a>
      </div>
      <!-- Footer -->
      <div style="padding:16px 28px;border-top:1px solid rgba(255,255,255,0.04)">
        <div style="font-family:monospace;font-size:10px;color:#72768a;letter-spacing:0.06em">
          ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short' })} ET &nbsp;·&nbsp; Ascendra Admin
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from:    'Ascendra Admin <onboarding@resend.dev>',
          to:      [ADMIN_EMAIL],
          subject: `[Ascendra] ${typeLabel} — ${String(notif.title || '')}`,
          html:    emailHtml,
        }),
      });

      results.email = emailRes.ok;
      if (!emailRes.ok) {
        results.errors.push(`email: ${await emailRes.text()}`);
      }
    } catch (e) {
      results.errors.push(`email: ${(e as Error).message}`);
    }
  }

  return new Response(JSON.stringify(results), {
    headers: { 'Content-Type': 'application/json' },
  });
});

function escapeHtml(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
