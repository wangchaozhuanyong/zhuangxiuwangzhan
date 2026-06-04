# settings module

Purpose: website settings, company contact details, maps, and notification settings ownership.

Current status: first function-call and notification-function migration complete. `AdminNotificationSettings` saves, Telegram test sends, and maintenance reminder test sends now go through this module's service/repository. `notify-lead` and `maintenance-reminder` have been split into Edge Function adapters plus function-local service/repository files. Read hooks remain in current compatibility locations until a separate scoped migration.

Layer rules:

- `routes`: bind backend routes only.
- `controller`: parse input and return output only.
- `service`: business rules and workflow orchestration.
- `repository`: database access only.
- `schemas`: request, response, and validation schemas when needed.
