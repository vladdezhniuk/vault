# Morpho Vault UI

Deposit & withdraw interface for a MetaMorpho (ERC-4626) vault on Ethereum mainnet. Built with Next.js 16, wagmi v3, and viem.

Uses the **Steakhouse USDC** vault ([`0xBEeF...6210`](https://etherscan.io/address/0xBEeFF047C03714965a54b671A37C18beF6b96210)) — a well-known vault with deep liquidity, good for testing.

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

You need a WalletConnect project ID from [cloud.reown.com](https://cloud.reown.com). RPC defaults to `eth.llamarpc.com` if not set.

## What it does

Deposit flow batches `approve` + `deposit` into a single `sendCalls` invocation (EIP-5792), so smart wallets execute it atomically and EOAs get a fallback to sequential txs. Withdraw converts the entered asset amount to shares via `convertToShares` and calls `redeem`. Max withdraw uses the raw share balance directly to avoid rounding issues.

Data comes from two sources: on-chain reads (`totalAssets`, `balanceOf`, `allowance`, etc. via wagmi) and the Morpho GraphQL API (APY, liquidity, historical share price). The share price chart has a time range picker (7D–All).

Toast notifications follow the full tx lifecycle: submitted → confirming → confirmed / failed. Forms use Zod + React Hook Form with real-time validation.

## Project structure

FSD ([Feature-Sliced Design](https://feature-sliced.design)):

```
src/
├── app/          # providers, layout, page shell
├── entities/     # vault data hooks, user position hooks
├── features/     # deposit form, withdraw form
├── widgets/      # vault info card, share price chart, tx widget
└── shared/       # ABIs, config, i18n, UI components, utils
```

## Known trade-offs

- No tests — went for feature completeness over coverage given the time limit
- `@reown/appkit` pulls in Solana deps transitively, so there are stubs in `next.config.ts` to silence the bundler
- Chart and vault stats share one API query; switching the time range re-fetches everything (could split, but not worth the complexity)
- No slippage protection on `redeem` — fine for a demo, wouldn't ship to prod without it

## Deploy

Pushes to `main` deploy to GitHub Pages automatically. Add `NEXT_PUBLIC_WC_PROJECT_ID` and `NEXT_PUBLIC_RPC_URL` to repo secrets.
