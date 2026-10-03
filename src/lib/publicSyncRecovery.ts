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
export function resolvePublicSyncIssue(key: string) { issues = issues.filter((item) => item.key !== key); publish(); }
/** For legacy image writes: the caller's write has already completed. Retry delivery only. */
export async function completePublicSync(key: string, sync: () => Promise<unknown>) {
  try { await sync(); resolvePublicSyncIssue(key); return true; }
  catch {
    registerPublicSyncIssue({ key, retry: async () => { await sync(); resolvePublicSyncIssue(key); } });
    return false;
  }
}
