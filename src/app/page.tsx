"use client";

import dynamic from "next/dynamic";

const VaultPage = dynamic(() => import("@/app/vault-page"), { ssr: false });

export default function Home() {
  return <VaultPage />;
}
