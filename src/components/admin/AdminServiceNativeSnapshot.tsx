import { useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { loadAdminServiceNativeSnapshot } from "@/backend/modules/services/service/serviceService";
import { canReadNativeServiceSnapshot } from "@/backend/modules/services/service/nativeServiceSnapshot";
import { adminServiceSnapshotText } from "@/i18n/adminServiceSnapshotText";

type State = { status: "idle" | "reading" | "ready" | "copying" | "copied" | "readFailed" | "copyFailed"; value?: string };

export default function AdminServiceNativeSnapshot({ serviceId, disabled, language }: { serviceId: string; disabled: boolean; language: "en" | "zh" }) {
  const text = adminServiceSnapshotText[language];
  const [state, setState] = useState<State>({ status: "idle" });
  const request = useRef<AbortController | null>(null);
  const current = useRef({ serviceId, disabled });
  useLayoutEffect(() => {
    current.current = { serviceId, disabled };
    request.current?.abort();
    request.current = null;
    setState({ status: "idle" });
    return () => { request.current?.abort(); request.current = null; };
  }, [serviceId, disabled]);

  const read = async () => {
    if (current.current.disabled || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setState({ status: "reading" });
    try {
      const value = await loadAdminServiceNativeSnapshot(serviceId, controller.signal);
      if (!controller.signal.aborted && current.current.serviceId === serviceId && !current.current.disabled) setState({ status: "ready", value });
    } catch {
      if (!controller.signal.aborted) setState({ status: "readFailed" });
    } finally {
      if (request.current === controller) request.current = null;
    }
  };
  const copy = async () => {
    if (!state.value || current.current.disabled || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setState({ ...state, status: "copying" });
    try {
      await navigator.clipboard.writeText(state.value);
      if (!controller.signal.aborted) setState({ status: "copied" });
    } catch {
      if (!controller.signal.aborted) setState({ ...state, status: "copyFailed" });
    } finally {
      if (request.current === controller) request.current = null;
    }
  };
  if (!canReadNativeServiceSnapshot(serviceId)) return null;
  const busy = state.status === "reading" || state.status === "copying";
  return <div className="space-y-2">
    <p className="text-sm text-muted-foreground">{text.description}</p>
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" onClick={() => void read()} disabled={disabled || busy}>{state.status === "reading" ? text.reading : text.read}</Button>
      {state.value && <Button type="button" variant="outline" onClick={() => void copy()} disabled={disabled || busy}>{state.status === "copying" ? text.copying : text.copy}</Button>}
    </div>
    <p role="status" aria-live="polite" className="text-sm text-muted-foreground">{state.status === "ready" || state.status === "copied" || state.status === "readFailed" || state.status === "copyFailed" ? text[state.status] : ""}</p>
  </div>;
}
