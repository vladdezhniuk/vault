"use client";

import { useState, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { createAppKit } from "@reown/appkit/react";
import { mainnet } from "@reown/appkit/networks";
import { wagmiAdapter, projectId } from "@/shared/config/wagmi";
import "@/shared/config/i18n/i18n";

const metadata = {
  name: "Morpho Vault",
  description: "MetaMorpho ERC-4626 Vault Interface",
  url: typeof window !== "undefined" ? window.location.origin : "",
  icons: [],
};

createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [mainnet],
  metadata,
  features: {
    analytics: false,
  },
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
          },
        },
      }),
  );

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster richColors position="bottom-right" />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
