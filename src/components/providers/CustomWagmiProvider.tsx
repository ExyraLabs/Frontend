import { wagmiAdapter } from "@/config";
import { ChainType, EVM, config, createConfig, getChains } from "@lifi/sdk";
import { useSyncWagmiConfig } from "@lifi/wallet-management";
import { useQuery } from "@tanstack/react-query";
import { getWalletClient, switchChain } from "@wagmi/core";
import { type FC, type PropsWithChildren } from "react";
import { createClient, http } from "viem";
import { mainnet } from "viem/chains";
import type { Config, CreateConnectorFn, State } from "wagmi";
import { WagmiProvider, createConfig as createWagmiConfig } from "wagmi";
import { injected } from "wagmi/connectors";

// List of Wagmi connectors
const connectors: CreateConnectorFn[] = [injected()];

// Create Wagmi config with default chain and without connectors
// const wagmiConfig: Config = createWagmiConfig({
//   chains: [mainnet],
//   client({ chain }) {
//     return createClient({ chain, transport: http() });
//   },
// });

// Create SDK config using Wagmi actions and configuration
createConfig({
  integrator: "Exyra",
  providers: [
    EVM({
      //eslint-disable-next-line
      getWalletClient: () => getWalletClient(wagmiAdapter.wagmiConfig) as any,
      switchChain: async (chainId) => {
        const chain = await switchChain(wagmiAdapter.wagmiConfig, { chainId });
        return getWalletClient(wagmiAdapter.wagmiConfig, {
          chainId: chain.id,
          //eslint-disable-next-line
        }) as any;
      },
    }),
  ],
  // We disable chain preloading and will update chain configuration in runtime
  preloadChains: false,
});

// Accept initialState from the parent (WalletProvider) and pass to WagmiProvider
type CustomWagmiProviderProps = PropsWithChildren<{
  initialState?: State;
}>;

export const CustomWagmiProvider: FC<CustomWagmiProviderProps> = ({
  children,
  initialState,
}) => {
  // Load EVM chains from LI.FI API using getChains action from LI.FI SDK
  const { data: chains } = useQuery({
    queryKey: ["chains"] as const,
    queryFn: async () => {
      const chains = await getChains({
        chainTypes: [ChainType.EVM],
      });
      // Update chain configuration for LI.FI SDK
      config.setChains(chains);
      return chains;
    },
  });

  // Synchronize fetched chains with Wagmi config and update connectors
  useSyncWagmiConfig(wagmiAdapter.wagmiConfig, connectors, chains);

  return (
    <WagmiProvider
      initialState={initialState}
      config={wagmiAdapter.wagmiConfig}
      reconnectOnMount={false}
    >
      {children}
    </WagmiProvider>
  );
};
