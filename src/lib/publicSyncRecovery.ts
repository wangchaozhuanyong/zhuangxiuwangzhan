/** In-memory only: no customer data or saved form is transported between tabs. */
export type PublicSyncIssue = { key: string; retry: () => Promise<void> };
let issues: PublicSyncIssue[] = [];
const listeners = new Set<() => void>();
const publish = () => listeners.forEach((listener) => listener());
export const getPublicSyncIssues = () => issues;
export const subscribePublicSyncIssues = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export function registerPublicSyncIssue(issue: PublicSyncIssue) {
  issues = [...issues.filter((item) => item.key !== issue.key), issue];
  publish();
}
export function resolvePublicSyncIssue(key: string, expectedIssue?: PublicSyncIssue | null) {
  // One-argument callers retain their explicit clear-by-key behavior. Async
  // completions pass their captured identity (or null) to preserve newer work.
  issues = issues.filter((item) => item.key !== key || expectedIssue === null
    || expectedIssue !== undefined && item !== expectedIssue);
  publish();
}
/** For legacy image writes: the caller's write has already completed. Retry delivery only. */
export async function completePublicSync(key: string, sync: () => Promise<unknown>) {
  const previousIssue = issues.find((issue) => issue.key === key) || null;
  try { await sync(); resolvePublicSyncIssue(key, previousIssue); return true; }
  catch {
    const issue: PublicSyncIssue = { key, retry: async () => { await sync(); resolvePublicSyncIssue(key, issue); } };
    registerPublicSyncIssue(issue);
    return false;
  }
}
