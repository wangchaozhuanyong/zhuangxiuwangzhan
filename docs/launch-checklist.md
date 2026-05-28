# FLASH CAST Production Launch Checklist

Use this checklist before switching `flashcast.com.my` to the production site.

## 1. Required Real Company Details

Set these values in the hosting platform environment variables before building:

```env
VITE_SITE_URL=https://flashcast.com.my
VITE_SITE_EMAIL=info@flashcast.com.my
VITE_SITE_PHONE_DISPLAY=+60 11-2885 3888
VITE_SITE_PHONE_E164=+601128853888
VITE_SITE_WHATSAPP_NUMBER=601128853888
VITE_SITE_SSM_NUMBER=202501027419 (1628831-M)
VITE_SITE_ADDRESS=94, Jalan Mega Mendung, Taman United, 58200 Kuala Lumpur, Malaysia
VITE_SITE_SHORT_ADDRESS=94, Jalan Mega Mendung, 58200
VITE_SOCIAL_FACEBOOK=
VITE_SOCIAL_INSTAGRAM=
VITE_SOCIAL_TIKTOK=
VITE_SOCIAL_XIAOHONGSHU=
VITE_SOCIAL_LINKEDIN=
```

Do not launch with the placeholder phone number or an empty SSM number.

## 2. Required Supabase Values

Set these frontend environment variables:

```env
VITE_SUPABASE_URL=https://rbsnyexjifounogswrjp.supabase.co
VITE_SUPABASE_ANON_KEY=
```

Confirm these Supabase Edge Functions are deployed:

- `generate-english-content`
- `notification-settings`
- `notify-lead`
- `sitemap`

## 3. Telegram Notification

After the site is deployed, log in to:

```text
/admin/notifications
```

Then save:

- Telegram Bot Token
- Telegram Chat ID
- Enabled status

Click `Send Test` before accepting live leads.

## 4. Build And Verify

Run:

```powershell
npm.cmd run build
npm.cmd run preview -- --host 127.0.0.1 --port 4191 --strictPort
$env:PREVIEW_URL="http://127.0.0.1:4191"
npm.cmd run verify:preview
```

The verification output should show:

- `hasRawHtml: false`
- `hasReplacementChar: false`
- `emptyAltCount: 0`
- `hreflangCount: 3`

## 5. Domain And SEO

Confirm:

- `https://flashcast.com.my/zh` loads correctly.
- `https://flashcast.com.my/en` loads correctly.
- `/sitemap.xml` routes to the Supabase sitemap function.
- `/robots.txt` points to `https://flashcast.com.my/sitemap.xml`.
- Canonical URLs use the final production domain.
- Hreflang tags include `zh`, `en`, and `x-default`.

## 6. Lead Capture Test

Submit both forms after deployment:

- Contact form
- Quote form

Confirm:

- Lead is saved in Supabase.
- Admin panel shows the submitted record.
- Telegram message is received if Telegram is enabled.
- Mobile bottom CTA opens WhatsApp, phone, and quote page correctly.
