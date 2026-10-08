import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { invalidateAdminResource } from "./adminInvalidate";
vi.mock("@/lib/queryInvalidationEvents", () => ({ notifyQueryInvalidation: vi.fn() }));
describe("CRM report invalidation", () => {
  it.each(["leads", "quote_requests"])("invalidates cached reports after %s changes", async table => {
    const client = new QueryClient();
    client.setQueryData(["admin", "lead-report", "month"], { count: 1 });
    client.setQueryData(["admin", "unrelated"], true);
    await invalidateAdminResource(client, table, false);
    expect(client.getQueryState(["admin", "lead-report", "month"])?.isInvalidated).toBe(true);
    expect(client.getQueryState(["admin", "unrelated"])?.isInvalidated).toBe(false);
    client.clear();
  });
});
