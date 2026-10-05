# company module

Purpose: about page, process content, FAQs, before-after items, brand partners, and shared company CTA content.

Current status: admin about/process/FAQ/CTA reads are migrated. `repository/adminEditorRepository.ts` reads `about_sections`, `process_steps`, `faqs`, and `cta_blocks`; `service/adminEditorService.ts` composes about-editor and homepage auxiliary data. `index.ts` is the stable application boundary. Existing `src/lib/adminEditorData` and CMS repository exports remain compatibility adapters. Public reads, before-after/brand-partner administration, and editor writes remain in their existing paths pending separate scoped migrations.

Layer rules:

- `routes`: bind backend routes only.
- `controller`: parse input and return output only.
- `service`: business rules and workflow orchestration.
- `repository`: database access only.
- `schemas`: request, response, and validation schemas when needed.
