# company module

Purpose: about page, process content, FAQs, before-after items, brand partners, and shared company CTA content.

Current status: scaffold only. Existing code remains in `src/lib`, `src/pages`, `src/pages/admin`, and current Supabase access wrappers until a scoped migration is approved.

Layer rules:

- `routes`: bind backend routes only.
- `controller`: parse input and return output only.
- `service`: business rules and workflow orchestration.
- `repository`: database access only.
- `schemas`: request, response, and validation schemas when needed.
