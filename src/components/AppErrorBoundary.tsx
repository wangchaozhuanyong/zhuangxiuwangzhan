import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { appErrorBoundaryText } from "@/i18n/appErrorBoundaryText";
import { getDefaultLanguage, getLanguageFromPath } from "@/i18n/routes";
import { getAdminLang } from "@/lib/adminLocale";
import { getFriendlySystemMessage, isChunkLoadError, recoverFromChunkLoadError } from "@/lib/chunkLoadRecovery";

type Props = {
  children: ReactNode;
  isAdminRoute?: boolean;
};

type State = {
  error: Error | null;
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const isChunkError = isChunkLoadError(error);
    const eventType = isChunkError ? "frontend_deploy_cache_mismatch" : "react_render_error";
    const friendlyMessage = getFriendlySystemMessage(error.message || "React render error", eventType);

    void import("@/lib/systemLog").then(({ logSystemEvent }) =>
      logSystemEvent({
        event_type: eventType,
        severity: "error",
        source: this.props.isAdminRoute ? "admin" : "frontend",
        message: friendlyMessage,
        metadata: {
          originalMessage: error.message,
          isChunkLoadError: isChunkError,
          stack: error.stack,
          componentStack: info.componentStack,
          path: window.location.pathname,
        },
      }),
    );

    recoverFromChunkLoadError(error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const isChunkError = isChunkLoadError(this.state.error);
    const language = this.props.isAdminRoute ? getAdminLang() : getLanguageFromPath() || getDefaultLanguage();
    const copy = appErrorBoundaryText[language];

    return (
      <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-start justify-center gap-4 px-6 py-16">
        <p className="text-sm font-semibold text-destructive">{copy.label}</p>
        <h1 className="font-display text-3xl font-bold">{isChunkError ? copy.chunkTitle : copy.title}</h1>
        <p className="text-muted-foreground">{isChunkError ? copy.chunkBody : copy.body}</p>
        <Button type="button" onClick={() => window.location.reload()}>
          {copy.refresh}
        </Button>
      </main>
    );
  }
}
