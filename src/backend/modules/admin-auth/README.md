# admin-auth module

Purpose: admin login, route protection, role checks, and auth boundary ownership.

Current status: first admin auth migration complete. `AdminAuthProvider` now reads sessions, role status, and auth state changes through this module's service/repository. Route guards remain in `src/pages/admin` and `src/components/admin` because they are UI/route boundary code.

Layer rules:

- `routes`: bind backend routes only.
- `controller`: parse input and return output only.
- `service`: business rules and workflow orchestration.
- `repository`: database and auth access only.
- `schemas`: request, response, and validation schemas when needed.
