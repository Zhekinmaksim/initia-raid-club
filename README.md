# Initia Raid Club

Initia Raid Club is a fast, async onchain raid game for `INITIATE: The Initia Hackathon`.

Initia Raid Club is the clearest demo of Initia-native gaming UX: identity, bridge, auto-signing, and fast onchain action in one loop.

## Initia Hackathon Submission

### Project Overview

Initia Raid Club is a short-session onchain raid game built as a dedicated Initia MiniEVM rollup. The judge path is one loop: claim a handle, bridge in funds, mint a ticket, enter the featured boss fight, play several fast turns, and settle loot plus leaderboard progress.

### Implementation Detail

- Custom MiniEVM contract for player state, tickets, raid sessions, action resolution, rewards, and leaderboard data.
- Custom game loop and frontend rather than a direct blueprint clone.
- Uses `@initia/interwovenkit-react` for wallet and transaction flow.
- Uses `auto-signing` for repeated combat turns and the Interwoven bridge modal for onboarding.
- Built to show one thing clearly: identity, bridge, auto-signing, and combat inside one continuous product flow.

### How to Run Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the app:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000`.
4. For the default demo path, use mock mode. For live rollup mode, fill the required `NEXT_PUBLIC_*` values from [`.env.example`](.env.example).

### Deployment Evidence

- Repository: [github.com/Zhekinmaksim/initia-raid-club](https://github.com/Zhekinmaksim/initia-raid-club)
- Commit submitted: `eede5535521669b18dbdcd0cdf9bf879f5925111`
- Public frontend: [initiaraid.club](https://initiaraid.club)
- Rollup chain ID: `raidclub-1`
- VM: `MiniEVM`
- Deployed contract: `0x994f46Ca8e811bd0454aD5Cf173eA77b0b270a3c`
- Onchain core logic: [`contracts/raidclub-evm/src/RaidClub.sol`](contracts/raidclub-evm/src/RaidClub.sol)
- Native feature frontend path: [`lib/initia/use-raid-club-mainnet.ts`](lib/initia/use-raid-club-mainnet.ts)

### Smart Contract

- Main contract: [`contracts/raidclub-evm/src/RaidClub.sol`](contracts/raidclub-evm/src/RaidClub.sol)
- Test suite: [`contracts/raidclub-evm/test/RaidClub.t.sol`](contracts/raidclub-evm/test/RaidClub.t.sol)
- Deploy script: [`contracts/raidclub-evm/script/deploy_mainnet.sh`](contracts/raidclub-evm/script/deploy_mainnet.sh)
- Contract scope: player registration, ticket purchase, raid session start, action execution, settlement, and progression updates.

The submitted demo is built around one loop:

1. connect wallet
2. claim a username
3. bridge in assets
4. mint a raid ticket
5. run a short raid with 3-5 rapid actions
6. settle loot and update the leaderboard

This is the core submission claim:

> Initia Raid Club is the clearest demo of Initia-native gaming UX: identity, bridge, auto-signing, and fast onchain action in one loop.

The repo contains both:

- a `Next.js` frontend
- a real MiniEVM contract project for onchain raid state

When the required `NEXT_PUBLIC_*` env vars are present, the app runs as a live rollup client with InterwovenKit, bridge modal flow, and `MsgCall` transactions.

## Why Initia

This project is built around the UX patterns Initia highlights for the hackathon:

- `auto-signing` for rapid, repeated gameplay actions
- `initia-usernames` for player identity and social surfaces
- `interwoven-bridge` for in-app onboarding without bouncing users into a separate flow

The goal is to show why a dedicated appchain and native transaction UX matter for a consumer game, not just for backend infrastructure.

## Included in This Repo

Implemented:
- `Next.js` App Router frontend
- mock mode for local product iteration
- mainnet-ready MiniEVM mode behind env configuration
- InterwovenKit provider wiring for custom rollup use
- real `MsgCall` transaction flow for `register`, `buyTickets`, `startRaid`, and `performAction`
- autosign controls for repeated combat actions
- in-app bridge modal entrypoint
- MiniEVM contract with Foundry tests
- hackathon submission scaffolding

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

## Mainnet Configuration

Fill the values in [`.env.example`](.env.example) and provide:

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

This writes `.env.local` and updates [`.initia/submission.json`](.initia/submission.json) with:

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

Deploy from [`contracts/raidclub-evm/script/deploy_mainnet.sh`](contracts/raidclub-evm/script/deploy_mainnet.sh) after setting:

- `MAINNET_RPC_URL`
- `DEPLOYER_PRIVATE_KEY`
- `TREASURY_ADDRESS`

## Demo Flow

The intended judge path is:

1. claim a username
2. bridge in INIT
3. mint a ticket
4. enter a raid
5. execute several auto-signed actions
6. show the result, loot, and leaderboard update

See [`docs/demo-script.md`](docs/demo-script.md) for the short presentation flow.

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

The build succeeds, contract tests pass, and the app runs in either mock mode or env-configured onchain mode.
