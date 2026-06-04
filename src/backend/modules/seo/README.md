# seo module

Purpose: SEO audit, sitemap, robots, SEO manifest, and GEO-facing metadata workflows.

Current status: first sitemap function migration complete. `supabase/functions/sitemap/index.ts` has been split into an Edge Function adapter plus function-local config, service, and repository files. Existing SEO audit helpers and build scripts remain in `src/lib` and `scripts` until a separate scoped migration.

Layer rules:

- `routes`: bind backend routes only.
- `controller`: parse input and return output only.
- `service`: business rules and workflow orchestration.
- `repository`: database access only.
- `schemas`: request, response, and validation schemas when needed.
