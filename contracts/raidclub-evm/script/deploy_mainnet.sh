#!/usr/bin/env bash
set -euo pipefail

: "${MAINNET_RPC_URL:?Set MAINNET_RPC_URL}"
: "${DEPLOYER_PRIVATE_KEY:?Set DEPLOYER_PRIVATE_KEY}"
: "${TREASURY_ADDRESS:?Set TREASURY_ADDRESS}"

forge create \
  src/RaidClub.sol:RaidClub \
  --root "$(cd "$(dirname "$0")/.." && pwd)" \
  --rpc-url "$MAINNET_RPC_URL" \
  --private-key "$DEPLOYER_PRIVATE_KEY" \
  --legacy \
  --broadcast \
  --constructor-args "$TREASURY_ADDRESS"
