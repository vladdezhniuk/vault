"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Skeleton } from "@/shared/ui/skeleton";
import { DepositForm } from "@/features/deposit";
import { WithdrawForm } from "@/features/withdraw";
import { useVaultData } from "@/entities/vault";
import { useUserPosition } from "@/entities/user-position";
import { useConnection } from "wagmi";
import { useTranslation } from "react-i18next";

export function TransactionWidget() {
  const { t } = useTranslation("transaction");
  const { address } = useConnection();
  const { assetAddress, assetSymbol: underlyingSymbol, assetDecimals, isLoading: vaultLoading, error: vaultError } = useVaultData();
  const {
    assetBalance,
    maxWithdrawable,
    vaultBalance,
    positionAssets,
    allowance,
    isLoading: posLoading,
  } = useUserPosition(assetAddress);

  const isLoading = vaultLoading || posLoading;

  if (!address) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {t("connectWallet")}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (vaultError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-sm">
            {t("errorLoading")}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !assetAddress || assetDecimals === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  const assetSymbol = underlyingSymbol ?? "USDC";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="deposit">
          <TabsList className="w-full">
            <TabsTrigger value="deposit" className="flex-1">
              {t("tabDeposit")}
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="flex-1">
              {t("tabWithdraw")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="deposit" className="pt-4">
            <DepositForm
              assetAddress={assetAddress}
              assetDecimals={assetDecimals}
              assetSymbol={assetSymbol}
              userAssetBalance={assetBalance ?? BigInt(0)}
              allowance={allowance}
            />
          </TabsContent>

          <TabsContent value="withdraw" className="pt-4">
            <WithdrawForm
              assetDecimals={assetDecimals}
              assetSymbol={assetSymbol}
              maxWithdrawable={maxWithdrawable ?? BigInt(0)}
              vaultBalance={vaultBalance}
              positionAssets={positionAssets}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
