#!/usr/bin/env node

import { existsSync } from "node:fs"
import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import process from "node:process"

const requiredFlags = ["chain-json", "assetlist", "contract-address"]
const optionalValueFlags = new Set([
  "out",
  "submission-out",
  "project-id",
  "app-name",
  "bridge-src-chain-id",
  "bridge-src-denom",
  "repo-url",
  "commit-sha",
  "demo-video-url",
])

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.help) {
    printHelp()
    process.exit(0)
  }

  for (const flag of requiredFlags) {
    if (!args[flag]) {
      fail(`Missing required --${flag}`)
    }
  }

  if (!isHexAddress(args["contract-address"])) {
    fail("Expected --contract-address to be a 0x-prefixed 40-byte address.")
  }

  const chain = await readJsonSource(args["chain-json"])
  const assetlist = await readJsonSource(args.assetlist)

  const config = deriveRollupConfig({
    chain,
    assetlist,
    contractAddress: args["contract-address"],
    projectId: args["project-id"],
    appName: args["app-name"],
    bridgeSrcChainId: args["bridge-src-chain-id"],
    bridgeSrcDenom: args["bridge-src-denom"],
  })

  const outPath = path.resolve(process.cwd(), args.out ?? ".env.local")
  await writeFile(outPath, renderEnvFile(config), "utf8")

  const submissionPath = path.resolve(process.cwd(), args["submission-out"] ?? ".initia/submission.json")
  if (existsSync(submissionPath)) {
    const updatedSubmission = await updateSubmissionFile(submissionPath, {
      rollupChainId: config.NEXT_PUBLIC_ROLLUP_CHAIN_ID,
      contractAddress: config.NEXT_PUBLIC_RAIDCLUB_CONTRACT,
      repoUrl: args["repo-url"],
      commitSha: args["commit-sha"],
      demoVideoUrl: args["demo-video-url"],
    })

    await writeFile(submissionPath, `${JSON.stringify(updatedSubmission, null, 2)}\n`, "utf8")
  }

  process.stdout.write(`Wrote ${outPath}\n`)
  if (existsSync(submissionPath)) {
    process.stdout.write(`Updated ${submissionPath}\n`)
  }
}

function parseArgs(argv) {
  const args = { help: false }

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]

    if (token === "--help" || token === "-h") {
      args.help = true
      continue
    }

    if (!token.startsWith("--")) {
      fail(`Unexpected argument: ${token}`)
    }

    const key = token.slice(2)
    if (!optionalValueFlags.has(key) && !requiredFlags.includes(key)) {
      fail(`Unknown flag: --${key}`)
    }

    const value = argv[index + 1]
    if (!value || value.startsWith("--")) {
      fail(`Missing value for --${key}`)
    }

    args[key] = value
    index += 1
  }

  return args
}

async function readJsonSource(source) {
  const text = /^https?:\/\//.test(source)
    ? await fetchText(source)
    : await readFile(path.resolve(process.cwd(), source), "utf8")

  try {
    return JSON.parse(text)
  } catch (error) {
    fail(`Could not parse JSON from ${source}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

async function fetchText(url) {
  const response = await fetch(url)
  if (!response.ok) {
    fail(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }

  return response.text()
}

function deriveRollupConfig({
  chain,
  assetlist,
  contractAddress,
  projectId,
  appName,
  bridgeSrcChainId,
  bridgeSrcDenom,
}) {
  const rpcUrl = firstApiAddress(chain, "rpc")
  const restUrl = firstApiAddress(chain, "rest")
  const jsonRpcUrl = firstApiAddress(chain, "json-rpc")
  const indexerUrl = firstApiAddress(chain, "indexer")
  const explorerUrl = chain.explorers?.[0]?.url ?? ""
  const feeDenom = chain.fees?.fee_tokens?.[0]?.denom ?? ""
  const nativeAsset = resolveNativeAsset(assetlist, feeDenom)
  const nativeDecimals = resolveNativeDecimals(nativeAsset)
  const nativeSymbol = nativeAsset.symbol ?? nativeAsset.display ?? nativeAsset.name

  if (!chain.chain_id || !chain.chain_name || !chain.pretty_name) {
    fail("chain.json is missing one of chain_id, chain_name, or pretty_name.")
  }

  if (!chain.evm_chain_id) {
    fail("chain.json is missing evm_chain_id. This script expects a published MiniEVM rollup entry.")
  }

  if (!nativeAsset.base || !nativeSymbol) {
    fail("assetlist.json did not contain a usable native asset.")
  }

  return {
    NEXT_PUBLIC_ROLLUP_CHAIN_ID: String(chain.chain_id),
    NEXT_PUBLIC_ROLLUP_CHAIN_NAME: String(chain.chain_name),
    NEXT_PUBLIC_ROLLUP_PRETTY_NAME: String(chain.pretty_name),
    NEXT_PUBLIC_ROLLUP_EVM_CHAIN_ID: String(chain.evm_chain_id),
    NEXT_PUBLIC_ROLLUP_RPC_URL: rpcUrl,
    NEXT_PUBLIC_ROLLUP_REST_URL: restUrl,
    NEXT_PUBLIC_ROLLUP_JSON_RPC_URL: jsonRpcUrl,
    NEXT_PUBLIC_ROLLUP_INDEXER_URL: indexerUrl,
    NEXT_PUBLIC_ROLLUP_NATIVE_DENOM: String(nativeAsset.base),
    NEXT_PUBLIC_ROLLUP_NATIVE_SYMBOL: String(nativeSymbol),
    NEXT_PUBLIC_ROLLUP_NATIVE_DECIMALS: String(nativeDecimals),
    NEXT_PUBLIC_RAIDCLUB_CONTRACT: contractAddress,
    NEXT_PUBLIC_BRIDGE_SRC_CHAIN_ID: bridgeSrcChainId ?? "interwoven-1",
    NEXT_PUBLIC_BRIDGE_SRC_DENOM: bridgeSrcDenom ?? "uinit",
    NEXT_PUBLIC_ROLLUP_EXPLORER_URL: explorerUrl,
    NEXT_PUBLIC_INTERWOVEN_APP_NAME: appName ?? "Initia Raid Club",
    NEXT_PUBLIC_INTERWOVEN_PROJECT_ID: projectId ?? "replace-me",
  }
}

function firstApiAddress(chain, apiName) {
  const value = chain.apis?.[apiName]?.[0]?.address
  if (!value) {
    fail(`chain.json is missing apis.${apiName}[0].address`)
  }

  return String(value)
}

function resolveNativeAsset(assetlist, feeDenom) {
  const assets = Array.isArray(assetlist.assets) ? assetlist.assets : []
  if (assets.length === 0) {
    fail("assetlist.json does not contain any assets.")
  }

  return (
    assets.find((asset) => asset.base === feeDenom) ??
    assets.find((asset) => asset.symbol === "INIT") ??
    assets[0]
  )
}

function resolveNativeDecimals(asset) {
  const units = Array.isArray(asset.denom_units) ? asset.denom_units : []
  const displayUnit = units.find((unit) => unit.denom === asset.display)
  const highestExponent = units.reduce((max, unit) => Math.max(max, Number(unit.exponent ?? 0)), 0)

  return Number(displayUnit?.exponent ?? highestExponent ?? 18)
}

function renderEnvFile(config) {
  const lines = [
    "# Generated by scripts/generate-rollup-config.mjs",
    "# Source of truth: published rollup chain.json + assetlist.json + deployed RaidClub address",
    ...Object.entries(config).map(([key, value]) => `${key}=${formatEnvValue(value)}`),
  ]

  return `${lines.join("\n")}\n`
}

async function updateSubmissionFile(submissionPath, overrides) {
  const current = JSON.parse(await readFile(submissionPath, "utf8"))

  current.rollup_chain_id = overrides.rollupChainId
  current.deployed_address = overrides.contractAddress

  if (overrides.repoUrl) {
    current.repo_url = overrides.repoUrl
  }

  if (overrides.commitSha) {
    current.commit_sha = overrides.commitSha
  }

  if (overrides.demoVideoUrl) {
    current.demo_video_url = overrides.demoVideoUrl
  }

  return current
}

function isHexAddress(value) {
  return /^0x[a-fA-F0-9]{40}$/.test(value)
}

function formatEnvValue(value) {
  if (/[\s#"'`]/.test(value)) {
    return JSON.stringify(value)
  }

  return value
}

function fail(message) {
  process.stderr.write(`${message}\n`)
  process.exit(1)
}

function printHelp() {
  process.stdout.write(`Usage:
  node scripts/generate-rollup-config.mjs \\
    --chain-json <path-or-url> \\
    --assetlist <path-or-url> \\
    --contract-address <0x...> \\
    [--out .env.local] \\
    [--submission-out .initia/submission.json] \\
    [--project-id <interwoven-project-id>] \\
    [--app-name "Initia Raid Club"] \\
    [--bridge-src-chain-id interwoven-1] \\
    [--bridge-src-denom uinit] \\
    [--repo-url https://github.com/org/repo] \\
    [--commit-sha <40-char-sha>] \\
    [--demo-video-url https://youtu.be/...]

Examples:
  node scripts/generate-rollup-config.mjs \\
    --chain-json ./chain.json \\
    --assetlist ./assetlist.json \\
    --contract-address 0x1234567890abcdef1234567890abcdef12345678

  node scripts/generate-rollup-config.mjs \\
    --chain-json https://raw.githubusercontent.com/initia-labs/initia-registry/main/mainnets/yominet/chain.json \\
    --assetlist https://raw.githubusercontent.com/initia-labs/initia-registry/main/mainnets/yominet/assetlist.json \\
    --contract-address 0x1234567890abcdef1234567890abcdef12345678
`)
}

await main()
