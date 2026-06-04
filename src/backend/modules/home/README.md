# home module

Purpose: homepage content, homepage bundle data, and public homepage presentation workflows.

Current status: scaffold only. Existing code remains in `src/lib`, `src/pages`, and current Supabase access wrappers until a scoped migration is approved.

Layer rules:

- `routes`: bind backend routes only.
- `controller`: parse input and return output only.
- `service`: business rules and workflow orchestration.
- `repository`: database access only.
- `schemas`: request, response, and validation schemas when needed.
