import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { logSystemEvent } from "@/lib/systemLog";
import { getFriendlySystemMessage, isChunkLoadError, recoverFromChunkLoadError } from "@/lib/chunkLoadRecovery";

const COPY = {
  label: "\u9875\u9762\u52a0\u8f7d\u5931\u8d25",
  title: "\u9875\u9762\u9047\u5230\u95ee\u9898\uff0c\u8bf7\u5237\u65b0\u540e\u518d\u8bd5",
  body: "\u7cfb\u7edf\u5df2\u7ecf\u8bb0\u5f55\u8fd9\u4e2a\u9519\u8bef\u3002\u540e\u53f0\u9875\u9762\u5982\u679c\u6b63\u5728\u7f16\u8f91\u5185\u5bb9\uff0c\u8bf7\u5148\u5237\u65b0\u786e\u8ba4\u6700\u65b0\u6570\u636e\uff0c\u907f\u514d\u8986\u76d6\u522b\u4eba\u521a\u4fdd\u5b58\u7684\u5185\u5bb9\u3002",
  chunkTitle: "\u7f51\u7ad9\u7248\u672c\u5df2\u66f4\u65b0\uff0c\u8bf7\u5237\u65b0\u9875\u9762",
  chunkBody:
    "\u6d4f\u89c8\u5668\u53ef\u80fd\u8fd8\u4fdd\u7559\u7740\u65e7\u7248\u672c\u6587\u4ef6\u3002\u7cfb\u7edf\u5df2\u5c1d\u8bd5\u81ea\u52a8\u5237\u65b0\u4e00\u6b21\uff0c\u5982\u679c\u8fd8\u770b\u5230\u8fd9\u4e2a\u9875\u9762\uff0c\u8bf7\u624b\u52a8\u70b9\u51fb\u5237\u65b0\u3002",
  refresh: "\u5237\u65b0\u9875\u9762",
};

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
    const friendlyMessage = getFriendlySystemMessage(error.message || "React render error", "react_render_error");

    void logSystemEvent({
      event_type: "react_render_error",
      severity: "error",
      source: this.props.isAdminRoute ? "admin" : "frontend",
      message: friendlyMessage,
      metadata: {
        originalMessage: error.message,
        isChunkLoadError: isChunkLoadError(error),
        stack: error.stack,
        componentStack: info.componentStack,
        path: window.location.pathname,
      },
    });

    recoverFromChunkLoadError(error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const isChunkError = isChunkLoadError(this.state.error);

    return (
      <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-start justify-center gap-4 px-6 py-16">
        <p className="text-sm font-semibold text-destructive">{COPY.label}</p>
        <h1 className="font-display text-3xl font-bold">{isChunkError ? COPY.chunkTitle : COPY.title}</h1>
        <p className="text-muted-foreground">{isChunkError ? COPY.chunkBody : COPY.body}</p>
        <Button type="button" onClick={() => window.location.reload()}>
          {COPY.refresh}
        </Button>
      </main>
    );
  }
}
