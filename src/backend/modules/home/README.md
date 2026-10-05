# home module

Purpose: homepage content, homepage bundle data, and public homepage presentation workflows.

Current status: admin editor reads are migrated. `repository/adminEditorRepository.ts` reads `home_sections`; `service/adminEditorService.ts` composes the editor bundle and obtains process/FAQ/CTA data through the `company` module's public entry. `index.ts` is the stable application boundary. Existing `src/lib/adminEditorData` and CMS repository exports remain compatibility adapters; query keys and payload shapes are unchanged. Public homepage reads and editor writes remain in their existing paths pending separate scoped migrations.

Layer rules:

- `routes`: bind backend routes only.
- `controller`: parse input and return output only.
- `service`: business rules and workflow orchestration.
- `repository`: database access only.
- `schemas`: request, response, and validation schemas when needed.
