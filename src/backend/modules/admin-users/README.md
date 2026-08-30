# admin-users module

Purpose: admin users, roles, account management, and admin user records.

Current status: `AdminUsers` saves and reads admin user records through this module's service/repository. The database blocks self-demotion/self-disable and removal of the last active super admin. Shared query hooks and legacy compatibility helpers remain in their current locations until a later scoped migration.

Layer rules:

- `routes`: bind backend routes only.
- `controller`: parse input and return output only.
- `service`: business rules and workflow orchestration.
- `repository`: database access only.
- `schemas`: request, response, and validation schemas when needed.
