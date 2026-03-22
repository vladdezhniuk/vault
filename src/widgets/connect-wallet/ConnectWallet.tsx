"use client";

export function ConnectWallet() {
  return (
    <div className="flex items-center gap-2">
      <appkit-network-button />
      <appkit-button />
    </div>
  );
}
