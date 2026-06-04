# system module

Purpose: system health, system logs, maintenance reminders, and translation task ownership.

Current status: first admin and Edge Function migration complete. `AdminSystemHealth`, `AdminEnglishCenter`, and `AdminTranslationJobs` now call health, cleanup, and English generation functions through this module's service/repository. `generate-english-content`, `health-check`, `maintenance-reminder`, and `form-attempts-maintenance` have been split into Edge Function adapters plus function-local service/repository files.

Layer rules:

- `routes`: bind backend routes only.
- `controller`: parse input and return output only.
- `service`: business rules and workflow orchestration.
- `repository`: database access only.
- `schemas`: request, response, and validation schemas when needed.
