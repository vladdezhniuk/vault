import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { mainnet } from "@reown/appkit/networks";
import { http } from "wagmi";

export const projectId =
  process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "";

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [mainnet],
  transports: {
    [mainnet.id]: http(
      process.env.NEXT_PUBLIC_RPC_URL ?? "https://eth.llamarpc.com",
    ),
  },
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
