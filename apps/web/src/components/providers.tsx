import "../i18n/index";
import { relayEnvironment } from "@/lib/relay/environment";
import { AuthProvider } from "@/lib/auth";
import type { ReactNode } from "react";
import { RelayEnvironmentProvider } from "react-relay";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RelayEnvironmentProvider environment={relayEnvironment}>
          <TooltipProvider>
            {children}
            <Toaster richColors position="top-right" />
          </TooltipProvider>
        </RelayEnvironmentProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
