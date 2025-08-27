import {
  cookieStorage,
  CreateConnectorFn,
  createStorage,
  getWalletClient,
  injected,
  switchChain,
} from "@wagmi/core";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { mainnet, polygon } from "@reown/appkit/networks";
import { createConfig, EVM } from "@lifi/sdk";

// Get projectId from https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

if (!projectId) {
  throw new Error("Project ID is not defined");
}

export const networks = [mainnet, polygon];

// List of Wagmi connectors

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks,
});
// Create SDK config using Wagmi actions and configuration
createConfig({
  integrator: "Exyra",
  providers: [
    EVM({
      //eslint-disable-next-line @typescript-eslint/no-explicit-any
      getWalletClient: () => getWalletClient(wagmiAdapter.wagmiConfig) as any,
      switchChain: async (chainId) => {
        const chain = await switchChain(wagmiAdapter.wagmiConfig, { chainId });
        return getWalletClient(wagmiAdapter.wagmiConfig, {
          chainId: chain.id,
          //eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any;
      },
    }),
  ],
  // We disable chain preloading and will update chain configuration in runtime
  preloadChains: false,
});

export const config = wagmiAdapter.wagmiConfig;
