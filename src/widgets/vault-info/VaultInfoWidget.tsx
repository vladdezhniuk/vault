"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { Badge } from "@/shared/ui/badge";
import { Separator } from "@/shared/ui/separator";
import { useVaultData, useVaultApiQuery } from "@/entities/vault";
import { formatTokenAmount, formatPercent, formatUsd, formatCompactNumber } from "@/shared/lib/format";
import { formatUnits } from "viem";
import { useTranslation } from "react-i18next";

export function VaultInfoWidget() {
  const { t } = useTranslation("vault");
  const {
    totalAssets,
    totalSupply,
    name,
    shareDecimals,
    assetDecimals,
    assetSymbol: underlyingSymbol,
    isLoading: onChainLoading,
    error: onChainError,
  } = useVaultData();
  const { data: apiData, isLoading: apiLoading, error: apiError } = useVaultApiQuery();

  const isLoading = onChainLoading || apiLoading;
  const vault = apiData?.vaultV2ByAddress;

  if (onChainError || apiError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("cardTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-sm">
            {onChainError ? t("errorOnChain") : t("errorApi")}
          </p>
        </CardContent>
      </Card>
    );
  }

  const usdTvl = (() => {
    if (totalAssets === undefined || assetDecimals === undefined || !vault) return undefined;
    const apiTotalAssetsNum = Number(vault.totalAssets);
    if (apiTotalAssetsNum === 0) return undefined;
    // Both on-chain and API totalAssets are in the same raw units,
    // so the ratio preserves units and we can multiply directly by USD value
    return (Number(totalAssets) / apiTotalAssetsNum) * vault.totalAssetsUsd;
  })();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <CardTitle className="text-lg font-semibold">
            {isLoading ? <Skeleton className="h-6 w-48" /> : name ?? t("defaultName")}
          </CardTitle>
          {vault && (
            <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
              {t("badgeType")}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          <Stat label={t("stat.netApy")} loading={isLoading} highlight>
            {vault ? formatPercent(vault.netApy) : "—"}
          </Stat>
          <Stat label={t("stat.tvl")} loading={isLoading}>
            {usdTvl !== undefined ? formatUsd(usdTvl) : "—"}
          </Stat>
          <Stat label={t("stat.liquidity")} loading={isLoading}>
            {vault ? (
              <>
                {formatUsd(vault.liquidityUsd)}
                {vault.liquidity && assetDecimals !== undefined && (
                  <span className="block text-xs font-normal text-muted-foreground">
                    {formatCompactNumber(Number(formatUnits(BigInt(vault.liquidity), assetDecimals)))} {underlyingSymbol ?? ""}
                  </span>
                )}
              </>
            ) : "—"}
          </Stat>
          <Stat label={t("stat.sharePrice")} loading={isLoading}>
            {vault ? `$${vault.sharePrice.toFixed(4)}` : "—"}
          </Stat>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          <Stat label={t("stat.avgNetApy")} loading={isLoading}>
            {vault ? formatPercent(vault.avgNetApy) : "—"}
          </Stat>
          <Stat label={t("stat.performanceFee")} loading={isLoading}>
            {vault ? formatPercent(vault.performanceFee) : "—"}
          </Stat>
          <Stat label={t("stat.totalAssets")} loading={isLoading}>
            {totalAssets !== undefined && assetDecimals !== undefined
              ? formatTokenAmount(totalAssets, assetDecimals)
              : "—"}
          </Stat>
          <Stat label={t("stat.totalSupply")} loading={isLoading}>
            {totalSupply !== undefined && shareDecimals !== undefined
              ? formatTokenAmount(totalSupply, shareDecimals)
              : "—"}
          </Stat>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  loading,
  highlight,
  children,
}: {
  label: string;
  loading: boolean;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {loading ? (
        <Skeleton className="h-6 w-20" />
      ) : (
        <p className={`text-base font-semibold tabular-nums ${highlight ? "text-primary" : ""}`}>
          {children}
        </p>
      )}
    </div>
  );
}
