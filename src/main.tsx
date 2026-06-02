import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { consumePendingChunkRecoveryLog, installChunkLoadRecovery } from "@/lib/chunkLoadRecovery";
import { logSystemEvent } from "@/lib/systemLog";

installChunkLoadRecovery();
const pendingChunkRecoveryLog = consumePendingChunkRecoveryLog();
if (pendingChunkRecoveryLog) {
  void logSystemEvent({
    event_type: pendingChunkRecoveryLog.eventType,
    severity: "error",
    source: pendingChunkRecoveryLog.path.startsWith("/admin") ? "admin" : "frontend",
    message: pendingChunkRecoveryLog.message,
    metadata: {
      originalMessage: pendingChunkRecoveryLog.message,
      isChunkLoadError: true,
      path: pendingChunkRecoveryLog.path,
      url: pendingChunkRecoveryLog.url,
      recoveredAt: new Date(pendingChunkRecoveryLog.timestamp).toISOString(),
    },
  });
}

createRoot(document.getElementById("root")!).render(<App />);
