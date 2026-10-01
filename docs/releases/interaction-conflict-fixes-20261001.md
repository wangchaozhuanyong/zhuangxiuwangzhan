# Public interaction conflict fixes — 2026-10-01

## Release scope

Publish the completed interaction fixes from this window. The earlier global navigation/image handoff is already included in main through PR #149. Preserve the newer furniture controls released through PR #146.

- Coordinate update notices with the shared menu/dialog owner and reserve space above the viewport-fixed furniture entry.
- Save and restore same-page fragment history by individual history entries; stop automatic restoration after user input.
- Give blog topic filtering an explicit result-location intent while ordinary filters keep their position.
- Preserve the furniture list origin, subcategory, page query and click-time position through detail navigation and refresh; retain category fallback for direct entry.
- Respect component-owned dialog/form clicks before shared anchor handling; avoid phantom fragment history.
- Position quote anchors using document layout and focus them after route content unlocks; remove the independent delayed quote correction.

No catalog photos, product prices, CMS records, backend/API/database, dependencies, or production configuration are changed.

## Validation before integration

98 regression tests across 8 files passed. Typecheck, lint, architecture, UI field checks, and bilingual static integrity passed. Development build and asset budget passed. Chrome acceptance covered both languages, 360/390/768/1024/1440 widths, history navigation, menu/dialog priority, topic positioning, and furniture detail refresh/return.

## Release and rollback

Owner explicitly authorized this window's completed changes to be merged into main, deployed once through the existing Cloudflare Pages workflow, and verified online. The production baseline before this release is 2e250c87165d2ef79940d38a941b125b788c1d8d. If a material regression is confirmed, revert only this scoped release through main and the same workflow; no database rollback is needed.
