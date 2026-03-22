"use client";

import { VaultInfoWidget } from "@/widgets/vault-info";
import { TransactionWidget } from "@/widgets/transaction";
import { SharePriceChart } from "@/widgets/share-price-chart";
import { ConnectWallet } from "@/widgets/connect-wallet";
import { useTranslation } from "react-i18next";

export default function VaultPage() {
  const { t } = useTranslation("vault");

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold tracking-tight">{t("headerTitle")}</span>
          </div>
          <ConnectWallet />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-4 py-8">
        <div className="w-full max-w-5xl space-y-6">
          <VaultInfoWidget />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <TransactionWidget />
            <SharePriceChart />
          </div>
        </div>
      </main>
    </>
  );
}
