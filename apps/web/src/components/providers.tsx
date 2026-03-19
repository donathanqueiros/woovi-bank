import { relayEnvironment } from "@/lib/relay/environment";
import type { ReactNode } from "react";
import { RelayEnvironmentProvider } from "react-relay";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <RelayEnvironmentProvider environment={relayEnvironment}>
      {children}
    </RelayEnvironmentProvider>
  );
}
