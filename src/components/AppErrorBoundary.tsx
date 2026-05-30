import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { logSystemEvent } from "@/lib/systemLog";

const COPY = {
  label: "\u9875\u9762\u52a0\u8f7d\u5931\u8d25",
  title: "\u9875\u9762\u9047\u5230\u95ee\u9898\uff0c\u8bf7\u5237\u65b0\u540e\u518d\u8bd5",
  body: "\u7cfb\u7edf\u5df2\u7ecf\u8bb0\u5f55\u8fd9\u4e2a\u9519\u8bef\u3002\u540e\u53f0\u9875\u9762\u5982\u679c\u6b63\u5728\u7f16\u8f91\u5185\u5bb9\uff0c\u8bf7\u5148\u5237\u65b0\u786e\u8ba4\u6700\u65b0\u6570\u636e\uff0c\u907f\u514d\u8986\u76d6\u522b\u4eba\u521a\u4fdd\u5b58\u7684\u5185\u5bb9\u3002",
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
    void logSystemEvent({
      event_type: "react_render_error",
      severity: "error",
      source: this.props.isAdminRoute ? "admin" : "frontend",
      message: error.message || "React render error",
      metadata: {
        stack: error.stack,
        componentStack: info.componentStack,
        path: window.location.pathname,
      },
    });
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-start justify-center gap-4 px-6 py-16">
        <p className="text-sm font-semibold text-destructive">{COPY.label}</p>
        <h1 className="font-display text-3xl font-bold">{COPY.title}</h1>
        <p className="text-muted-foreground">{COPY.body}</p>
        <Button type="button" onClick={() => window.location.reload()}>
          {COPY.refresh}
        </Button>
      </main>
    );
  }
}
