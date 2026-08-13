import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import "@/styles/routes/admin.css";

export default function AdminUiProviders({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <Toaster />
      {children}
    </TooltipProvider>
  );
}
