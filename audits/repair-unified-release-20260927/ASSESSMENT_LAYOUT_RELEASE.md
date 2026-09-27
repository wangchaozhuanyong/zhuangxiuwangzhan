# Repair suitability card layout

The three suitability cards previously stacked the status, title, short description and disclosure at the left edge. On a 500px viewport each closed card was about 227px tall, leaving the right side unused.

The header now places the title at the left and the assessment status at the right. A full-width disclosure row uses the page's existing gold plus/open indicator. Scoped spacing reduces each Chinese card to about 175px at 390px and 500px. Long labels can wrap and remain right aligned. Desktop cards stay equal height with aligned disclosure rows.

Existing bilingual copy, native details keyboard interaction, repair scope, enquiry logic, APIs, CMS data and hero image resolution are preserved.

## Validation

- npm run lint: passed.
- npm run typecheck: passed.
- npm run arch:check: passed.
- Existing SurfaceRepairContent tests: 5/5 passed.
- git diff --check: passed.
- In-app browser: Chinese and English at 320, 390, 500 and 1440px, 8/8 passed. No document/card overflow; status right inset 20px mobile and 24px desktop; disclosure target over 44px; keyboard Enter opens and closes the native details.
- Reviewed mobile Chinese, expanded mobile English and desktop English screenshots. All copy remains legible and complete. At 320px the longest Chinese heading/status pair wraps naturally.

## Architecture Compliance Report

1. Target module: services.
2. Target layer: frontend presentation.
3. Edited files: src/components/services/SurfaceRepairContent.tsx; src/styles/surface-repair.css; this release record.
4. Forbidden files touched: no.
5. API paths changed: no.
6. Database access changed: no.
7. Cross-module dependency introduced: no.
8. Business behavior changed: no; native disclosure interaction and all enquiry logic are retained.
9. arch:check result: passed.
10. Remaining architecture risk: none identified within this presentation-only change.

Production verification is recorded separately after the matching main SHA is deployed.
