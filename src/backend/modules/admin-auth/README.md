# admin-auth module

Purpose: admin login, route protection, role checks, and auth boundary ownership.

Current status: admin sessions, role status, TOTP enrollment/challenge, and auth state changes are owned by this module's service/repository. Admin access requires an `aal2` session after the MFA enforcement migration is applied. Route guards remain in `src/pages/admin` and `src/components/admin` because they are UI/route boundary code.

Layer rules:

- `routes`: bind backend routes only.
- `controller`: parse input and return output only.
- `service`: business rules and workflow orchestration.
- `repository`: database and auth access only.
- `schemas`: request, response, and validation schemas when needed.
