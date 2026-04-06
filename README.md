# Initia Raid Club

Initia Raid Club is a fast, async onchain raid game for `INITIATE: The Initia Hackathon`.

The MVP is structured around one tight consumer loop:

1. connect wallet
2. claim a username
3. bridge in assets
4. mint a raid ticket
5. run a short raid with 3-5 rapid actions
6. settle loot and update the leaderboard

The repository now contains both:

- a polished `Next.js` frontend
- a real MiniEVM contract project for onchain raid state

When the required `NEXT_PUBLIC_*` env vars are present, the app switches from local mock mode into a live rollup client that uses InterwovenKit, bridge modal flow, and `MsgCall` transactions.

## Why This Angle Fits Initia

This project is built to showcase the native UX patterns Initia highlights for the hackathon:

- `auto-signing` for rapid, repeated gameplay actions
- `initia-usernames` for player identity and social surfaces
- `interwoven-bridge` for in-app onboarding without bouncing users into a separate flow

Instead of another generic dashboard, the product demonstrates why a dedicated appchain and native transaction UX matter for a real consumer application.

## Current State

Implemented now:
- `Next.js` App Router frontend
- mock mode for local product iteration
- mainnet-ready MiniEVM mode behind env configuration
- InterwovenKit provider wiring for custom rollup use
- real `MsgCall` transaction flow for `register`, `buyTickets`, `startRaid`, and `performAction`
- autosign controls for repeated combat actions
- in-app bridge modal entrypoint
- MiniEVM contract with Foundry tests
- hackathon submission scaffolding

Still required before final submission:
- deploy the contract to your live rollup and fill real env values
- bind a real contract address in `.env`
- fill `.initia/submission.json` with live repo / commit / deployed address
- record the public 1-3 minute demo video

## Stack

- `Next.js 15`
- `React 19`
- `TypeScript`
- `Tailwind CSS`
- `Zustand`

## Project Structure

- `app/` - route shell and global styles
- `components/` - shared UI components and the top-level app shell
- `features/` - domain panels for raid, profile, inventory, and leaderboard
- `lib/game/` - mock data, types, state, and raid resolution
- `lib/initia/` - live rollup config, contract ABI, MsgCall helpers, and mainnet runtime hook
- `contracts/raidclub-evm/` - MiniEVM contract, tests, and deploy script
- `docs/` - demo-facing docs
- `.initia/` - submission manifest template

## Local Development

Install dependencies and start the app:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Mainnet Configuration

Fill the values in [.env.example](/Users/zmaxx/Projects/Initia%20raid%20club/.env.example) and provide:

- rollup chain ID
- rollup EVM chain ID
- RPC / REST / JSON-RPC / indexer endpoints
- native denom and symbol
- deployed `RaidClub` contract address

Use these sources, in this order:

- `weave rollup launch`: prints the rollup endpoints immediately after launch
- published registry `chain.json`: chain ID, EVM chain ID, RPC / REST / JSON-RPC / indexer, explorer
- published registry `assetlist.json`: native denom / symbol / decimals
- `deploy_mainnet.sh` output: deployed `RaidClub` contract address

Confirmed public L1 defaults:

- Initia mainnet chain ID: `interwoven-1`
- Initia native base denom: `uinit`
- Initia display symbol: `INIT`

Important for MiniEVM rollups:

- if your rollup uses INIT as gas, the rollup-native denom is usually an `evm/<token-address>` base denom on the rollup assetlist, not plain `uinit`
- public MiniEVM mainnet examples in the official registry expose 18-decimal `INIT` assets and publish `json-rpc` / `indexer` endpoints in `chain.json`

Without those env vars the app stays in mock mode.

### Generate `.env.local` Automatically

After your rollup is launched and the contract is deployed, generate a ready-to-use runtime config from the published registry files:

```bash
npm run mainnet:generate-config -- \
  --chain-json ./chain.json \
  --assetlist ./assetlist.json \
  --contract-address 0x1234567890abcdef1234567890abcdef12345678
```

This writes `.env.local` and updates [`.initia/submission.json`](/Users/zmaxx/Projects/Initia%20raid%20club/.initia/submission.json) with:

- rollup chain ID
- rollup EVM chain ID
- RPC / REST / JSON-RPC / indexer
- native gas denom / symbol / decimals
- deployed `RaidClub` address

The script also accepts published URLs directly:

```bash
npm run mainnet:generate-config -- \
  --chain-json https://raw.githubusercontent.com/initia-labs/initia-registry/main/mainnets/<your-rollup>/chain.json \
  --assetlist https://raw.githubusercontent.com/initia-labs/initia-registry/main/mainnets/<your-rollup>/assetlist.json \
  --contract-address 0x1234567890abcdef1234567890abcdef12345678
```

## Contract Workflow

Build and test the MiniEVM contract:

```bash
npm run contracts:build
npm run contracts:test
```

Deploy from [contracts/raidclub-evm/script/deploy_mainnet.sh](/Users/zmaxx/Projects/Initia%20raid%20club/contracts/raidclub-evm/script/deploy_mainnet.sh) after setting:

- `MAINNET_RPC_URL`
- `DEPLOYER_PRIVATE_KEY`
- `TREASURY_ADDRESS`

## Demo Flow

The intended judge path is:

1. claim a username
2. bridge in more INIT
3. mint a ticket
4. enter a raid
5. execute several auto-signed actions
6. show the result, loot, and leaderboard update

See [docs/demo-script.md](/Users/zmaxx/Projects/Initia raid club/docs/demo-script.md) for the short presentation flow.

## Architecture Notes

The UI is intentionally separated from chain calls:

- `lib/game/store.ts` and `lib/game/engine.ts` keep the mock fallback mode fast
- `lib/initia/use-raid-club-mainnet.ts` owns live wallet, autosign, bridge, and contract sync
- `lib/initia/client.ts` builds live `MsgCall` transactions for the rollup contract
- `contracts/raidclub-evm/src/RaidClub.sol` owns the actual game state machine

That split keeps the frontend usable for fast iteration while still supporting a real onchain deployment path.

## Native Feature Plan

### Primary
Use `auto-signing` for repeated `MsgCall` combat actions on the MiniEVM rollup.

### Secondary
Use the bridge modal for in-app onboarding.

### Stretch
Replace the current wallet-open username path with an explicit in-app `initia-usernames` binding flow.

## Submission Checklist

- `README.md`
- `SPEC.md`
- `.env.example`
- `.initia/submission.json`
- `docs/demo-script.md`

## Notes

The build currently succeeds, contract tests pass, and the app can run in either mock mode or env-configured onchain mode. The remaining work is operational: deploy the contract to your live rollup and bind the real endpoints and addresses.
