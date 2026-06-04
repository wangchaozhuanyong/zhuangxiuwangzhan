# admin-users module

Purpose: admin users, roles, account management, and admin user records.

Current status: first admin user migration complete. `AdminUsers` now saves and reads admin user records through this module's service/repository. Shared query hooks and legacy compatibility helpers remain in their current locations until a later scoped migration.

Layer rules:

- `routes`: bind backend routes only.
- `controller`: parse input and return output only.
- `service`: business rules and workflow orchestration.
- `repository`: database access only.
- `schemas`: request, response, and validation schemas when needed.
