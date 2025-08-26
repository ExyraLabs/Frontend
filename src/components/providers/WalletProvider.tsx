"use client";

import { projectId, wagmiAdapter } from "@/config";
import { CopilotKit } from "@copilotkit/react-core";
import { mainnet, polygon } from "@reown/appkit/networks";
import { createAppKit } from "@reown/appkit/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type ReactNode } from "react";
import { cookieToInitialState, WagmiProvider, type Config } from "wagmi";
import { AaveClient, AaveProvider } from "@aave/react";

const client = AaveClient.create();

// Set up queryClient
const queryClient = new QueryClient();

if (!projectId) {
  throw new Error("Project ID is not defined");
}

// Where CopilotKit will proxy requests to. If you're using Copilot Cloud, this environment variable will be empty.
const runtimeUrl = process.env.NEXT_PUBLIC_COPILOTKIT_RUNTIME_URL;
// const runtimeUrl = "http://localhost:3001/api/copilotkit";
// When using Copilot Cloud, all we need is the publicApiKey.
// const publicApiKey = process.env.NEXT_PUBLIC_COPILOT_API_KEY; // reserved for future Copilot Cloud usage

// Set up metadata
const metadata = {
  name: "Fraktia",
  description:
    "Build powerful AI agents visually with Fraktia's no-code flow builder",
  url: "https://fraktia.ai", // origin must match your domain & subdomain
  icons: ["https://avatars.githubusercontent.com/u/179229932"],
};

// Create the modal
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [mainnet, polygon],
  defaultNetwork: mainnet,
  metadata: metadata,
  features: {
    connectMethodsOrder: ["wallet"],
    email: false, // default to true
    analytics: true, // Optional - defaults to your Cloud configuration
  },
});

function WalletProvider({
  children,
  cookies,
  session,
}: {
  children: ReactNode;
  cookies: string | null;
  session?: Session | null;
}) {
  const initialState = cookieToInitialState(
    wagmiAdapter.wagmiConfig as Config,
    cookies
  );

  return (
    <SessionProvider session={session ?? undefined}>
      <WagmiProvider
        config={wagmiAdapter.wagmiConfig as Config}
        initialState={initialState}
      >
        <QueryClientProvider client={queryClient}>
          <CopilotKit runtimeUrl={runtimeUrl}>
            <AaveProvider client={client}>{children}</AaveProvider>
          </CopilotKit>
        </QueryClientProvider>
      </WagmiProvider>
    </SessionProvider>
  );
}

export default WalletProvider;
