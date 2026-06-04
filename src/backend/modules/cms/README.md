# cms module

Purpose: CMS pages, sections, templates, reusable content entries, revisions, and generic site pages.

Current status: first admin read/function migration complete. `AdminCmsBuilder` reads CMS pages, sections, templates, and revisions through this module. `AdminContentEditor` now uses this module for post-save English generation and translated-record reloads. Existing generic save helpers still remain in `src/lib/adminMutation` until a later scoped migration.

Layer rules:

- `routes`: bind backend routes only.
- `controller`: parse input and return output only.
- `service`: business rules and workflow orchestration.
- `repository`: database access only.
- `schemas`: request, response, and validation schemas when needed.
