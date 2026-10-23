# Navigation service-worker compatibility

The old navigation fetch handler can leave iPhone Chrome showing a persistent
information icon and an unsafe native connection state after a failed navigation.
A physical-device same-origin, same-URL upgrade comparison reproduced the old
behavior and cleared it with the no-fetch replacement. Keep `/sw.js` and its
registration/update entry point so existing installations receive the repair.

The replacement activates normally and claims clients without handling fetches,
reloading documents, unregistering, or clearing caches, cookies, or user storage.
Online requests use the browser network path. Offline navigation now uses the
browser's default error page; the existing offline HTML resource is retained.

The release also removes unused `cms_pages` data from the homepage HTML seed
only when the first legacy `site_pages` row is the authoritative `home` record.
This matches the existing `mapSitePageRows` precedence. CMS fallback data remains
when that record is absent. No database records or locale fields are modified.
For the captured public payload, the seed fell from 61,840 to 52,676 bytes under
the unchanged 55,000-byte budget. English, Chinese and Malay mapped output matched.

Validation includes no-fetch/data-preservation worker tests, homepage projection
and hydration tests, and an E2E legacy-worker upgrade that retains seven data and
document sentinels. The physical-device comparison completed ten refreshes, three
test-tab close/reopens and a final thirty-second observation. Tab reopen is not a
browser process cold-start claim. Production acceptance remains separate.

Rollback: revert this change through the normal Pages production workflow,
retaining the `/sw.js` address. Verify the restored worker reaches existing
visitors. Never use site-data clearing or a forced document reload as rollback.

Architecture compliance: `home` Edge projection and `system` static runtime;
no business API, database, permissions, dependencies or other-domain changes.
