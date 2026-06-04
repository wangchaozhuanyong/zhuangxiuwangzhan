# materials module

Purpose: material catalog, material categories, material detail, and material publishing workflows.

Current status: first write-path migration complete for `src/pages/admin/AdminMaterialEditor.tsx`. Material slug checks, record saves, payload cleanup, and English-generation invocation now go through this module's service/repository. Read queries, static fallback data, and public-page material reads remain in their current compatibility locations until a separate scoped migration is approved.

Layer rules:

- `routes`: bind backend routes only.
- `controller`: parse input and return output only.
- `service`: business rules and workflow orchestration.
- `repository`: database access only.
- `schemas`: request, response, and validation schemas when needed.
