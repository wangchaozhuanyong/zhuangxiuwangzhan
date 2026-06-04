# media module

Purpose: media library, image upload orchestration, and Supabase Storage file records.

Current status: scaffold only. Existing code remains in `src/lib`, `src/pages/admin`, and Supabase functions until a scoped migration is approved.

Layer rules:

- `routes`: bind backend routes only.
- `controller`: parse input and return output only.
- `service`: business rules and workflow orchestration.
- `repository`: database and storage access only.
- `schemas`: request, response, and validation schemas when needed.
