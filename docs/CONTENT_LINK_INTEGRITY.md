# Published content link integrity

The Malay warehouse and office failures had one cause: translation changed stable URL slugs. The shared validator now protects route identities during translation and checks links when a published field is saved through admin persistence or content-publish. Draft saves remain available. Unrelated edits do not revalidate untouched old bodies; publishing a draft validates its complete content.

`supabase/functions/_shared/content-links.mjs` owns URL parsing, locale conversion, HTML/structured-link extraction and destination checks. The repository adapter checks published records and CMS tombstones. `catalog-link-targets.ts` contains only public fallback route identities; the integrity test requires exact parity with the owning material and furniture catalogs. Edge functions never import frontend implementation files.

The offline audit is `npm run verify:content-links -- --snapshot <project snapshot.json> --sitemap <project sitemap.json> --out <project report directory>`. It reports unknown targets, language mismatches and conservative source-aligned candidates. It never writes CMS data.

## Exact 2026-10-24 correction

`drafts/content-link-repair-20261024/candidates-v1.json` locks ten currently published rows and twelve href replacements in `content_ms`. Anchor text, other body text, all English/Chinese fields, slugs, publication status and media are retained. Three addresses are corrected:

- `/ms/services/pejabat-renovation` → `/ms/services/office-renovation`
- `/ms/blog/pejabat-fit-out-me-it-planning-checklist-malaysia` → `/ms/blog/office-fit-out-me-it-planning-checklist-malaysia`
- `/ms/blog/kitchen-cabinet-bahan-guide` → `/ms/blog/kitchen-cabinet-material-guide`

The new fixed targets use the existing translation_patch publisher with exact baseline hash, payload hash, row version, original-text predicate, verified workflow identity and single-use permits. Existing empty-field translation targets retain their NULL-only predicates. Corrections require their own owner approval reference and cannot use rollback permits.

Public HTML acceptance compares the exact changed anchors: each corrected destination must appear and its previous wrong address must be absent. Unchanged external citations follow the public renderer's existing source policy. A completed permit and matching saved row version allow a later acceptance run to skip that content write.

Run the existing approved content workflow with target `content-link-repair-20261024`, first dry-run, then publish. The website and remote main must match the workflow commit. Deploy both existing Edge functions from that same main revision through the protected Supabase release workflow, selecting one function per serialized run. Translation deployment requires scope `flashcast.com.my:edge/generate-english-content:content-link-integrity-v1`. No schema changes or automatic production rollback are included.

## Architecture compliance

The implementation stays in the existing system/translation and protected publishing service/repository boundaries. No new API, database column, dependency, permission or first-level module is introduced. Public target lookups are read-only. Tests cover actual write rejection, exact corrections, races, protected historical publishers, catalog parity and release source closure. Production acceptance additionally requires CMS/public HTML readback and desktop/mobile navigation after publication.
