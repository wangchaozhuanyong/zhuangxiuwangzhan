import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { consumePendingChunkRecoveryLog, installChunkLoadRecovery } from "@/lib/chunkLoadRecovery";
import { registerOfflineFallback } from "@/lib/offlineFallback";
import { captureInquirySources } from "@/lib/inquirySource";
import { captureInquiryLanding } from "@/lib/inquiryLanding";
import { getDefaultLanguage, getLanguageFromPath } from "@/i18n/routes";

captureInquirySources(true);
const entryPath = window.location.pathname;
captureInquiryLanding(entryPath, getLanguageFromPath(entryPath) ?? getDefaultLanguage());
installChunkLoadRecovery();
registerOfflineFallback();
const pendingChunkRecoveryLog = consumePendingChunkRecoveryLog();
if (pendingChunkRecoveryLog) {
  void import("@/lib/systemLog").then(({ logSystemEvent }) =>
    logSystemEvent({
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
    }),
  );
}

createRoot(document.getElementById("root")!).render(<App />);
