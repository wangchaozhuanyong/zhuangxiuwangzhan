# FLASH CAST Telegram Notification Plan

This site uses Telegram as the main operational alert channel because it is faster to review than email for daily lead handling.

## Already Integrated

- New contact form submission
- New quote request submission
- Telegram settings test message
- Website maintenance reminder test message

## Maintenance Reminder Content

The maintenance reminder is based on `docs/weekly-maintenance.md` and the database table `maintenance_reminder_items`.

Each Telegram maintenance reminder includes:

- new leads count
- pending quote requests count
- leads older than 24 hours
- quote requests older than 24 hours
- weekly lead and quote volume
- published project, blog, material, and location page counts
- weekly SEO, lead handling, content, and technical checklist items
- optional monthly blog, case study, material, and location page tasks

## Recommended Telegram Alerts

- Immediate: new contact lead
- Immediate: new quote request
- Daily or weekly: unprocessed leads older than 24 hours
- Weekly: maintenance checklist reminder
- Monthly: content expansion reminder
- Manual: Telegram connection test
- Manual: maintenance reminder test

## Future Alerts Worth Adding

- Failed form notification delivery
- Failed auto-translation job
- New content waiting for English review
- Published page missing SEO title or description
- Published image missing Chinese or English alt text
- No new blog post in the last 30 days
- No new case study in the last 30 days
- Sitemap generation failure
- Supabase Edge Function failure summary
- Cloudflare Pages deployment failure

## Recommended Schedule

- Every Monday 9:00 AM Malaysia time: weekly maintenance reminder
- First Monday of each month 9:00 AM Malaysia time: monthly content reminder
- Every day 10:00 AM Malaysia time: optional stale lead reminder if lead volume grows

