# FLASH CAST Weekly Maintenance Checklist

Use this checklist to keep the renovation lead-gen site healthy after launch.

## Traffic and SEO

- Check Google Search Console for new indexing issues, coverage warnings, and manual actions.
- Review the performance report for top pages, especially `/zh`, `/en`, project pages, location pages, and blog posts.
- Confirm `sitemap.xml` still returns `200` and includes new content URLs.
- Verify `robots.txt` still points to the live sitemap URL.
- Spot-check one or two pages for correct `title`, `description`, `canonical`, and `hreflang`.

## Lead Handling

- Review new entries in `leads` and `quote_requests`.
- Confirm phone, email, and WhatsApp fields are being captured correctly.
- Mark leads with a status update so nothing stays in `new` for too long.
- Check that Telegram notifications are still arriving if they are enabled.
- Follow up on any form submissions that are older than 24 hours.

## Content Health

- Review the homepage hero, CTA sections, FAQ, and contact details for stale copy.
- Check that new project cases still have multiple images, alt text, and before/after assets where available.
- Confirm blog posts have SEO title, description, category, tags, and internal links.
- Check that location pages still mention the correct service area and relevant project examples.
- Make sure any newly added images are compressed and have both Chinese and English alt text.

## Technical Checks

- Run a quick production smoke test on `/zh`, `/en`, `/zh/quote`, `/zh/contact`, a project page, and a location page.
- Confirm the mobile bottom CTA still shows WhatsApp, call, and quote actions clearly.
- Check Supabase auth/admin access for any new issues.
- Review Cloudflare Pages deployment history for failed builds or rollback events.
- Keep an eye on browser compatibility warnings such as `browserslist` updates.

## Monthly Tasks

- Add at least one new SEO blog post.
- Add or refresh one case study.
- Expand one location page or material page.
- Review and refresh internal links across homepage, blog, projects, and locations.
- Revisit conversion copy on CTA sections if lead volume slows down.

