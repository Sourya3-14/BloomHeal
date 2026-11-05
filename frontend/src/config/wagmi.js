import { createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { getDefaultConfig } from "connectkit";
import { QueryClient } from "@tanstack/react-query";

export const wagmiConfig = createConfig(
  getDefaultConfig({
    chains: [mainnet, sepolia],
    transports: {
      [mainnet.id]: http(),
      [sepolia.id]: http(),
    },
    walletConnectProjectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
    appName: "BloomHeal",
    appDescription: "BloomHeal: Where Wellness Begins.",
    appUrl: "https://your-domain.com",
    appIcon: "https://your-domain.com/icon.png",
  }),
);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});
