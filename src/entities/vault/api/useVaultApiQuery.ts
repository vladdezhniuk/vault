"use client";

import { useQuery } from "@tanstack/react-query";
import { morphoClient } from "@/shared/api/morpho";
import { VAULT_ADDRESS, CHAIN_ID } from "@/shared/config";

export type TimeRange = "7d" | "30d" | "90d" | "1y" | "all";

function getStartTimestamp(range: TimeRange): number | null {
  if (range === "all") return null;

  const now = Math.floor(Date.now() / 1000);
  const days: Record<Exclude<TimeRange, "all">, number> = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "1y": 365,
  };
  return now - days[range] * 86_400;
}

function buildQuery(startTimestamp: number | null): string {
  const optionsArg =
    startTimestamp !== null
      ? `(options: { startTimestamp: ${startTimestamp} })`
      : "";

  return `
    query VaultData($address: String!, $chainId: Int!) {
      vaultV2ByAddress(address: $address, chainId: $chainId) {
        address
        name
        symbol
        totalAssets
        totalAssetsUsd
        totalSupply
        liquidity
        liquidityUsd
        sharePrice
        performanceFee
        avgNetApy
        netApy
        apy
        historicalState {
          sharePrice${optionsArg} {
            x
            y
          }
        }
      }
    }
  `;
}

export interface HistoricalPoint {
  x: number;
  y: number | null;
}

export interface VaultApiData {
  vaultV2ByAddress: {
    address: string;
    name: string;
    symbol: string;
    totalAssets: string;
    totalAssetsUsd: number;
    totalSupply: string;
    liquidity: string;
    liquidityUsd: number;
    sharePrice: number;
    performanceFee: number;
    avgNetApy: number;
    netApy: number;
    apy: number;
    historicalState: {
      sharePrice: HistoricalPoint[];
    };
  };
}

export function useVaultApiQuery(timeRange: TimeRange = "1y") {
  const startTimestamp = getStartTimestamp(timeRange);

  return useQuery({
    queryKey: ["vault-data", VAULT_ADDRESS, timeRange],
    queryFn: () =>
      morphoClient.request<VaultApiData>(buildQuery(startTimestamp), {
        address: VAULT_ADDRESS,
        chainId: CHAIN_ID,
      }),
    staleTime: 60_000,
  });
}
