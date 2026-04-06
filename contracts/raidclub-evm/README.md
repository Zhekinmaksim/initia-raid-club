# Raid Club MiniEVM Contract

This directory contains the onchain game logic for the MiniEVM version of Initia Raid Club.

## What It Implements

- player registration with starter loadout
- ticket purchase in native gas token
- raid session creation
- repeated action resolution onchain
- reward settlement
- best-gear progression
- rolling top leaderboard

## Commands

Build the contract:

```bash
forge build --root contracts/raidclub-evm
```

Run tests:

```bash
forge test --root contracts/raidclub-evm
```

Deploy to your rollup:

```bash
cd contracts/raidclub-evm
MAINNET_RPC_URL=... \
DEPLOYER_PRIVATE_KEY=... \
TREASURY_ADDRESS=0x... \
./script/deploy_mainnet.sh
```

Use a legacy transaction for deployment because MiniEVM deployment flows in Initia docs use legacy-style EVM transactions rather than EIP-1559 defaults.
