"use client";

import { useReadContracts } from "wagmi";
import { erc20Abi, metaMorphoVaultAbi } from "@/shared/abi";
import { VAULT_ADDRESS } from "@/shared/config";

export function useVaultData() {
  const { data, isLoading, error } = useReadContracts({
    contracts: [
      {
        address: VAULT_ADDRESS,
        abi: metaMorphoVaultAbi,
        functionName: "totalAssets",
      },
      {
        address: VAULT_ADDRESS,
        abi: metaMorphoVaultAbi,
        functionName: "totalSupply",
      },
      {
        address: VAULT_ADDRESS,
        abi: metaMorphoVaultAbi,
        functionName: "asset",
      },
      {
        address: VAULT_ADDRESS,
        abi: metaMorphoVaultAbi,
        functionName: "name",
      },
      {
        address: VAULT_ADDRESS,
        abi: metaMorphoVaultAbi,
        functionName: "symbol",
      },
      {
        address: VAULT_ADDRESS,
        abi: metaMorphoVaultAbi,
        functionName: "decimals",
      },
    ],
  });

  const totalAssets = data?.[0]?.result as bigint | undefined;
  const totalSupply = data?.[1]?.result as bigint | undefined;
  const assetAddress = data?.[2]?.result as `0x${string}` | undefined;
  const name = data?.[3]?.result as string | undefined;
  const symbol = data?.[4]?.result as string | undefined;
  const shareDecimals = data?.[5]?.result as number | undefined;

  const { data: assetData } = useReadContracts({
    contracts: [
      {
        address: assetAddress,
        abi: erc20Abi,
        functionName: "symbol",
      },
      {
        address: assetAddress,
        abi: erc20Abi,
        functionName: "decimals",
      },
    ],
    query: { enabled: !!assetAddress },
  });

  const assetSymbol = (assetData?.[0]?.result as string | undefined) ?? undefined;
  const assetDecimals = (assetData?.[1]?.result as number | undefined) ?? undefined;

  return {
    totalAssets,
    totalSupply,
    assetAddress,
    assetSymbol,
    name,
    symbol,
    shareDecimals,
    assetDecimals,
    isLoading,
    error,
  };
}
