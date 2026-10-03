import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { interactionText } from "@/i18n/interactionText";
import { useAdminLang } from "@/lib/adminPreferences";
import { getPublicSyncIssues, subscribePublicSyncIssues } from "@/lib/publicSyncRecovery";
export default function PublicSyncRecovery() {
  const issues = useSyncExternalStore(subscribePublicSyncIssues, getPublicSyncIssues, getPublicSyncIssues);
  const text = interactionText[useAdminLang()];
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  if (!issues.length) return null;
  const retry = async () => {
    if (busy) return;
    setBusy(true); setFailed(false);
    try { await Promise.all(issues.map((issue) => issue.retry())); }
    catch { setFailed(true); }
    finally { setBusy(false); }
  };
  return <aside role="status" aria-live="polite" className="fixed bottom-20 inset-x-4 z-[130] mx-auto max-w-xl rounded-xl border border-border bg-card p-4 text-sm text-foreground shadow-lg">
    <p>{text.savedSyncPending}</p>{failed && <p>{text.syncFailed}</p>}
    <Button className="mt-2" variant="outline" disabled={busy} aria-busy={busy} onClick={() => void retry()}>{text.retrySync}</Button>
  </aside>;
}
