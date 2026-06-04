# projects module

Purpose: project list, project detail, project images, and project publishing workflows.

Current status: first write-path migration complete for `src/pages/admin/AdminProjectEditor.tsx` and `src/pages/admin/AdminProjectImages.tsx`. Project slug checks, project record saves, project image writes, cover selection, deletion, payload cleanup, and English-generation invocation now go through this module's service/repository. Read queries and public-page project reads remain in their current compatibility locations until a separate scoped migration is approved.

Layer rules:

- `routes`: bind backend routes only.
- `controller`: parse input and return output only.
- `service`: business rules and workflow orchestration.
- `repository`: database access only.
- `schemas`: request, response, and validation schemas when needed.
