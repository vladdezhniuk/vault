import { type Address } from "viem";

export const VAULT_ADDRESS: Address =
  (process.env.NEXT_PUBLIC_VAULT_ADDRESS as Address) ??
  "0xBEeFF047C03714965a54b671A37C18beF6b96210";

export const MORPHO_API_URL =
  process.env.NEXT_PUBLIC_MORPHO_API_URL ??
  "https://blue-api.morpho.org/graphql";

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 1);
