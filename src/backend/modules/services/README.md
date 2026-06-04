# services module

Purpose: service list, service detail, service areas, and service publishing workflows.

Current status: first write-path migration complete for `src/pages/admin/AdminServiceEditor.tsx`. Service slug checks, record saves, payload cleanup, and English-generation invocation now go through this module's service/repository. Existing read queries and broader public-page service reads remain in their current compatibility locations until a separate scoped migration is approved.

Layer rules:

- `routes`: bind backend routes only.
- `controller`: parse input and return output only.
- `service`: business rules and workflow orchestration.
- `repository`: database access only.
- `schemas`: request, response, and validation schemas when needed.
