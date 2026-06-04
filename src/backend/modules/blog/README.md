# blog module

Purpose: blog post list, blog detail, publishing workflow, and blog metadata.

Current status: first write-path migration complete for `src/pages/admin/AdminBlogEditor.tsx`. Blog slug checks, record saves, payload cleanup, and English-generation invocation now go through this module's service/repository. Read queries, static fallback data, and public-page blog reads remain in their current compatibility locations until a separate scoped migration is approved.

Layer rules:

- `routes`: bind backend routes only.
- `controller`: parse input and return output only.
- `service`: business rules and workflow orchestration.
- `repository`: database access only.
- `schemas`: request, response, and validation schemas when needed.
