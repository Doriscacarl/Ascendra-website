# Deploy: notify-admin Edge Function

## One-time setup (run once, in order)

### 1. Install Supabase CLI
```bash
npm install -g supabase
```

### 2. Login & link project
```bash
supabase login
supabase link --project-ref nfowsobglotbjrdqsiid
```

### 3. Get a Resend API key (free)
Sign up at https://resend.com → API Keys → Create Key
Copy the key (starts with `re_`)

### 4. Set secrets
```bash
supabase secrets set \
  VAPID_PUBLIC_KEY="BBqQay0SRAT53c7HhMACaTSPiEZw48Q1EIN2fpYINhUK4VMSJLy4yf53XhkM9z70AqFASfMHReuyDNlkJhW4IjA" \
  VAPID_PRIVATE_KEY="tGeKCoQIhz5rUIA3L7c3WrMeVIivLUPVodOjuf6ZAKo" \
  RESEND_API_KEY="re_YOUR_KEY_HERE" \
  ADMIN_EMAIL="doriscacarlm40@gmail.com" \
  ADMIN_URL="https://ascendra-website.vercel.app"
```

### 5. Create the push_subscriptions table
Run the SQL in `supabase-tables.sql` (the push_subscriptions section)
in your Supabase SQL Editor:
https://supabase.com/dashboard/project/nfowsobglotbjrdqsiid/sql/new

### 6. Deploy the function
```bash
supabase functions deploy notify-admin --no-verify-jwt
```

### 7. Create the database webhook
In your Supabase dashboard:
https://supabase.com/dashboard/project/nfowsobglotbjrdqsiid/database/webhooks

Click "Create a new hook":
- Name: `on_notification_insert`
- Table: `notifications`
- Events: ✓ INSERT
- Type: Supabase Edge Functions
- Edge Function: `notify-admin`
- HTTP Method: POST

That's it. Test by submitting any form on your website.

## Re-deploy after changes
```bash
supabase functions deploy notify-admin --no-verify-jwt
```
