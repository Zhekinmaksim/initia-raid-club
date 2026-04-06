# SPEC.md - Initia Raid Club

## Project Name
Initia Raid Club

## Goal
Ship a prize-eligible Initia hackathon project that feels like a consumer product, not a tutorial clone.

The product is a fast async raid game built as a dedicated Initia appchain. The frontend should use InterwovenKit, the core gameplay should showcase `auto-signing`, and the UX should visibly benefit from native Initia features.

## Product Thesis
The strongest angle for this hackathon is not another generic AI + DeFi dashboard.

Initia Raid Club demonstrates:
- high-frequency gameplay that benefits from `auto-signing`
- social identity via `initia-usernames`
- smoother onboarding through an in-app bridge flow
- a real user loop with progression, loot, and leaderboard state

## Current Repository Status
This repo currently contains:
- a `Next.js` mock-first frontend for the raid loop
- Zustand state and deterministic local raid resolution
- placeholder Initia client adapters in `lib/initia/`
- hackathon docs and submission scaffolding

Still required before final submission:
- real InterwovenKit integration
- deployed Initia appchain logic
- at least one native feature implemented for real
- a public demo video

## Hackathon Requirements
- Run as its own Initia appchain with deployed application logic.
- Use InterwovenKit on the frontend for wallet and transaction flows.
- Implement at least one native feature:
  - `auto-signing`
  - `interwoven-bridge`
  - `initia-usernames`
- Include `.initia/submission.json`.
- Include `README.md`.
- Provide a public 1-3 minute demo video.
- Show meaningful customization beyond a Blueprint copy.

## MVP Scope
Do not build a large RPG.

Build one polished loop:
1. Connect wallet
2. Claim username
3. Bridge in assets
4. Mint or obtain a raid ticket
5. Enter a raid
6. Execute 3-5 fast actions
7. Settle result
8. Show loot, profile updates, and leaderboard movement

## Primary Native Feature
`auto-signing`

Reason:
- it is the clearest UX upgrade for a short, rapid gameplay loop
- it makes the demo feel immediately different from a normal wallet-confirm-everything flow

## Secondary Native Features
- `initia-usernames`
- `interwoven-bridge`

These are strong stretch goals because they improve onboarding and identity without expanding the game into the wrong direction.

## Product Screens
### 1. Landing / Lobby
- clear one-line pitch
- wallet connection CTA
- explanation of why Initia matters

### 2. Username Setup
- bind or create username
- fallback local nickname for unfinished builds only

### 3. Home Base
- player identity
- HP, energy, tickets, bridge balance
- daily boss feature card
- quick raid CTA

### 4. Raid Select
- easy / medium / boss lanes
- ticket cost
- energy cost
- reward cues

### 5. Raid Session
- enemy state
- player state
- 3-5 fast action buttons
- explicit transaction or auto-signing feedback

### 6. Results / Loot
- win or loss
- XP
- coins
- dropped item

### 7. Inventory
- equip or swap items
- simple stat relevance

### 8. Leaderboard
- current player rank
- rivals
- streak and loot score

### 9. Activity Log
- recent bridge, username, ticket, and raid events

## Architecture
- `app/` - Next.js app router shell
- `components/` - shared UI primitives and app shell
- `features/` - home base, raid, inventory, leaderboard, activity panels
- `lib/game/` - deterministic mock data, types, engine, Zustand store
- `lib/initia/` - placeholders for future chain and InterwovenKit wiring
- `docs/` - demo script and supporting docs
- `.initia/` - hackathon submission manifest

## Design Direction
- fantasy sci-fi hybrid
- dark, luminous interface
- strong hierarchy
- high-contrast CTA buttons
- polished transitions for rapid actions

## Non-Goals
- giant map or world exploration
- deep tokenomics
- DAO governance
- NFT marketplace
- live chat
- heavy AI inference onchain

## Success Criteria
- The project feels original.
- The loop is understandable in under one minute.
- The frontend is polished enough for a judge demo.
- The appchain logic is clearly represented in the architecture.
- Native Initia UX is the reason the product feels good.
- The submission package is clean and complete.
