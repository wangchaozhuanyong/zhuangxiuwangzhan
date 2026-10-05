import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import AdminFormSection from "@/components/admin/AdminFormSection";
import { useAdminLang } from "@/lib/adminPreferences";
import {
  getAdminContentPreflightFailure,
  type AdminContentPreflightFailure,
  type AdminContentPreflightResult,
} from "@/lib/adminMutation";
import { adminContentPreflightText } from "@/i18n/adminContentPreflightText";

type PreflightState =
  | { snapshot: string; result: AdminContentPreflightResult; failure?: never }
  | { snapshot: string; failure: AdminContentPreflightFailure; result?: never };

export default function AdminContentPreflight({ record, disabled = false, onPreview }: {
  record: { id?: string; updated_at?: string | null; version?: number | null; [key: string]: unknown };
  disabled?: boolean;
  onPreview: () => Promise<AdminContentPreflightResult>;
}) {
  const language = useAdminLang();
  const text = (key: keyof typeof adminContentPreflightText) => adminContentPreflightText[key][language];
  const snapshot = JSON.stringify(record);
  const latestSnapshot = useRef(snapshot);
  latestSnapshot.current = snapshot;
  const mounted = useRef(false);
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<PreflightState | null>(null);
  const hasVersion = Boolean(record.id && record.updated_at);
  const stale = state && state.snapshot !== snapshot;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const run = async () => {
    if (pending.current || disabled || !hasVersion) return;
    pending.current = true;
    setBusy(true);
    setState(null);
    const submittedSnapshot = latestSnapshot.current;
    try {
      const result = await onPreview();
      if (mounted.current) setState({ snapshot: submittedSnapshot, result });
    } catch (error) {
      if (mounted.current) setState({ snapshot: submittedSnapshot, failure: getAdminContentPreflightFailure(error) });
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  return (
    <AdminFormSection title={text("title")} description={text("description")} className="mb-6">
      <dl className="grid min-w-0 gap-4 text-sm sm:grid-cols-2">
        <div className="min-w-0">
          <dt className="text-muted-foreground">{text("version")}</dt>
          <dd className="mt-1 break-words font-medium">{typeof record.version === "number" && Number.isFinite(record.version) ? record.version : text("unknown")}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-muted-foreground">{text("updatedAt")}</dt>
          <dd className="mt-1 [overflow-wrap:anywhere]">{record.updated_at || text("unknown")}</dd>
        </div>
      </dl>
      <Button type="button" variant="outline" className="mt-4 w-full whitespace-normal sm:w-auto" disabled={disabled || busy || !hasVersion} aria-busy={busy} onClick={() => void run()}>
        {text(busy ? "running" : "run")}
      </Button>
      {!hasVersion && <p className="mt-3 text-sm leading-6 text-muted-foreground">{text("missingVersion")}</p>}
      <div role="status" aria-live="polite" className="mt-3 text-sm leading-6 [overflow-wrap:anywhere]">
        {stale ? <p className="text-muted-foreground">{text("stale")}</p> : state?.failure ? (
          <div className="admin-text-error"><p className="font-medium">{text("failed")}</p><p>{text(state.failure)}</p></div>
        ) : state?.result ? (
          <div>
            <p className="font-medium">{text("passed")}</p>
            <p>{text("summary").replace("{count}", String(state.result.fieldCount))}</p>
            {state.result.warningCount > 0 && <p>{text("warnings").replace("{count}", String(state.result.warningCount))}</p>}
            <p className="text-muted-foreground">{text("noWrite")}</p>
          </div>
        ) : null}
      </div>
    </AdminFormSection>
  );
}
