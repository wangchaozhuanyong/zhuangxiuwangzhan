# followups module

Purpose: lead follow-up records and quote follow-up records.

Current status: first write-path migration complete for lead and quote detail pages. Follow-up inserts now go through this module's service/repository. Existing read queries remain in their current compatibility locations until a separate scoped migration is approved.

Layer rules:

- `routes`: bind backend routes only.
- `controller`: parse input and return output only.
- `service`: business rules and workflow orchestration.
- `repository`: database access only.
- `schemas`: request, response, and validation schemas when needed.
