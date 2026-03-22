"use client";

import { useConnection, useReadContracts } from "wagmi";
import { erc20Abi, metaMorphoVaultAbi } from "@/shared/abi";
import { VAULT_ADDRESS } from "@/shared/config";
import type { Address } from "viem";

export function useUserPosition(assetAddress?: Address) {
  const { address } = useConnection();

  const { data, isLoading, error } = useReadContracts({
    contracts: [
      {
        address: VAULT_ADDRESS,
        abi: metaMorphoVaultAbi,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
      },
      {
        address: assetAddress,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
      },
      {
        address: VAULT_ADDRESS,
        abi: metaMorphoVaultAbi,
        functionName: "maxWithdraw",
        args: address ? [address] : undefined,
      },
      {
        address: assetAddress,
        abi: erc20Abi,
        functionName: "allowance",
        args: address ? [address, VAULT_ADDRESS] : undefined,
      },
    ],
    query: {
      enabled: !!address && !!assetAddress,
    },
  });

  const vaultBalance = data?.[0]?.result as bigint | undefined;
  const assetBalance = data?.[1]?.result as bigint | undefined;
  const maxWithdrawable = data?.[2]?.result as bigint | undefined;
  const allowance = data?.[3]?.result as bigint | undefined;

  const { data: assetsValue } = useReadContracts({
    contracts: [
      {
        address: VAULT_ADDRESS,
        abi: metaMorphoVaultAbi,
        functionName: "convertToAssets",
        args: vaultBalance ? [vaultBalance] : undefined,
      },
    ],
    query: {
      enabled: !!vaultBalance && vaultBalance > BigInt(0),
    },
  });

  const positionAssets = assetsValue?.[0]?.result as bigint | undefined;

  return {
    vaultBalance,
    assetBalance,
    maxWithdrawable,
    allowance,
    positionAssets,
    isLoading,
    error,
    isConnected: !!address,
  };
}
