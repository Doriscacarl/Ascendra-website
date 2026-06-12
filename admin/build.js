const fs = require('fs');
const path = require('path');

// On Vercel, env vars are injected automatically.
// For local dev, fall back to reading the parent .env file.
if (!process.env.SUPABASE_URL) {
  try {
    const envFile = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
    envFile.split('\n').forEach(line => {
      const eq = line.indexOf('=');
      if (eq > 0) {
        const k = line.slice(0, eq).trim();
        const v = line.slice(eq + 1).trim();
        if (k && !process.env[k]) process.env[k] = v;
      }
    });
  } catch (e) {}
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_ANON_KEY env vars are required.');
  console.error('Set them in Vercel dashboard or in the root .env file for local dev.');
  process.exit(1);
}

const content = `window.SUPABASE_URL = '${supabaseUrl}';\nwindow.SUPABASE_ANON_KEY = '${supabaseKey}';\n`;
fs.writeFileSync(path.join(__dirname, 'config.js'), content);
console.log('✓ config.js generated');

// Warn if auth env vars are missing (non-fatal — API will return 500 until they are set)
if (!process.env.ADMIN_ACCESS_CODE) {
  console.warn('⚠  ADMIN_ACCESS_CODE not set — lock screen will not work until this is added in Vercel environment variables.');
}
if (!process.env.ADMIN_SESSION_SECRET) {
  console.warn('⚠  ADMIN_SESSION_SECRET not set — lock screen will not work until this is added in Vercel environment variables.');
  console.warn('   Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
}
