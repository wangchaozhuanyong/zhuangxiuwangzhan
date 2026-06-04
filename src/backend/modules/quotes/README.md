# quotes module

Purpose: quote requests, quote submission flow ownership, and quote form context.

Current status: first write-path and notification migration complete. `AdminQuoteDetail` field updates and quote follow-up sync now go through this module's service/repository. `submit-lead` has been split into an Edge Function adapter with function-local service/repository files for quote request submission. `notify-lead` has also been split for post-submit notification delivery. Read queries remain in current compatibility locations until a separate scoped migration.

Layer rules:

- `routes`: bind backend routes only.
- `controller`: parse input and return output only.
- `service`: business rules and workflow orchestration.
- `repository`: database access only.
- `schemas`: request, response, and validation schemas when needed.
