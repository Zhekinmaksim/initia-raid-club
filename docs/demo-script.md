# Demo Script

## Goal
Show the product value in under 60 seconds, then spend the remaining time on technical proof and architecture.

## Short Judge Flow

### 1. Opening
Say:

`Initia Raid Club is an async raid game built for Initia. The core idea is simple: fast onchain gameplay that feels smooth because we use native Initia UX patterns instead of making the player confirm every action manually.`

### 2. Identity
- open the app
- connect wallet
- create the raider profile
- if the wallet already has a username, point out that it is read live from Initia Wallet

### 3. Onboarding
- press the bridge action
- enable autosign
- mint a raid ticket
- explain that the production flow keeps onboarding and repeated actions inside one app

### 4. Raid Loop
- enter one raid
- perform 3-5 fast actions
- point out the auto-signing status card while acting

Say:

`This is the core demo moment. The user can chain actions quickly without popup fatigue, which is exactly why this pattern works for gaming on Initia.`

### 5. Settlement
- show the result
- show the loot
- return to base
- open the leaderboard

### 6. Close
Say:

`The project is intentionally focused on one polished loop: identity, onboarding, high-frequency action, settlement, and progression. That lets us demonstrate a real consumer product, not just isolated contract calls.`

## Backup Talking Points

- The repo contains both a mock fallback mode and a live MiniEVM contract path.
- Combat actions already map to real `MsgCall` transactions in onchain mode.
- The last operational step is pointing the frontend at the live rollup endpoints and deployed contract.
