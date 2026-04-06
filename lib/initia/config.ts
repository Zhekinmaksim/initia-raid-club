import { defineChain } from "viem"

const requiredEnvKeys = [
  "NEXT_PUBLIC_ROLLUP_CHAIN_ID",
  "NEXT_PUBLIC_ROLLUP_CHAIN_NAME",
  "NEXT_PUBLIC_ROLLUP_PRETTY_NAME",
  "NEXT_PUBLIC_ROLLUP_EVM_CHAIN_ID",
  "NEXT_PUBLIC_ROLLUP_RPC_URL",
  "NEXT_PUBLIC_ROLLUP_REST_URL",
  "NEXT_PUBLIC_ROLLUP_JSON_RPC_URL",
  "NEXT_PUBLIC_ROLLUP_INDEXER_URL",
  "NEXT_PUBLIC_ROLLUP_NATIVE_DENOM",
  "NEXT_PUBLIC_ROLLUP_NATIVE_SYMBOL",
  "NEXT_PUBLIC_RAIDCLUB_CONTRACT",
] as const

function readEnv(key: (typeof requiredEnvKeys)[number]) {
  return process.env[key]?.trim() ?? ""
}

const evmChainId = Number(process.env.NEXT_PUBLIC_ROLLUP_EVM_CHAIN_ID ?? "0")
const nativeDecimals = Number(process.env.NEXT_PUBLIC_ROLLUP_NATIVE_DECIMALS ?? "18")

export const raidClubEnv = {
  chainId: readEnv("NEXT_PUBLIC_ROLLUP_CHAIN_ID"),
  chainName: readEnv("NEXT_PUBLIC_ROLLUP_CHAIN_NAME"),
  prettyName: readEnv("NEXT_PUBLIC_ROLLUP_PRETTY_NAME"),
  evmChainId,
  rpcUrl: readEnv("NEXT_PUBLIC_ROLLUP_RPC_URL"),
  restUrl: readEnv("NEXT_PUBLIC_ROLLUP_REST_URL"),
  jsonRpcUrl: readEnv("NEXT_PUBLIC_ROLLUP_JSON_RPC_URL"),
  indexerUrl: readEnv("NEXT_PUBLIC_ROLLUP_INDEXER_URL"),
  nativeDenom: readEnv("NEXT_PUBLIC_ROLLUP_NATIVE_DENOM"),
  nativeSymbol: readEnv("NEXT_PUBLIC_ROLLUP_NATIVE_SYMBOL"),
  nativeDecimals,
  contractAddress: readEnv("NEXT_PUBLIC_RAIDCLUB_CONTRACT"),
  bridgeSrcChainId: process.env.NEXT_PUBLIC_BRIDGE_SRC_CHAIN_ID?.trim() || "interwoven-1",
  bridgeSrcDenom: process.env.NEXT_PUBLIC_BRIDGE_SRC_DENOM?.trim() || "uinit",
  blockExplorerUrl: process.env.NEXT_PUBLIC_ROLLUP_EXPLORER_URL?.trim() || "",
}

export const mainnetRuntimeIssues = requiredEnvKeys
  .filter((key) => !readEnv(key))
  .map((key) => key.replace("NEXT_PUBLIC_", "").toLowerCase())
  .concat(Number.isFinite(evmChainId) && evmChainId > 0 ? [] : ["rollup_evm_chain_id"])

export const isMainnetRuntimeConfigured = mainnetRuntimeIssues.length === 0

export const customInterwovenChain = isMainnetRuntimeConfigured
  ? {
      chain_id: raidClubEnv.chainId,
      chain_name: raidClubEnv.chainName,
      pretty_name: raidClubEnv.prettyName,
      network_type: "mainnet" as const,
      bech32_prefix: "init",
      logo_URIs: {
        png: "https://raw.githubusercontent.com/initia-labs/initia-registry/main/mainnets/initia/images/initia.png",
        svg: "https://raw.githubusercontent.com/initia-labs/initia-registry/main/mainnets/initia/images/initia.svg",
      },
      apis: {
        rpc: [{ address: raidClubEnv.rpcUrl }],
        rest: [{ address: raidClubEnv.restUrl }],
        indexer: [{ address: raidClubEnv.indexerUrl }],
        "json-rpc": [{ address: raidClubEnv.jsonRpcUrl }],
      },
      fees: {
        fee_tokens: [
          {
            denom: raidClubEnv.nativeDenom,
            fixed_min_gas_price: 0,
            low_gas_price: 0,
            average_gas_price: 0,
            high_gas_price: 0,
          },
        ],
      },
      staking: {
        staking_tokens: [{ denom: raidClubEnv.nativeDenom }],
      },
      metadata: {
        minitia: { type: "minievm" },
        is_l1: false,
      },
      native_assets: [
        {
          denom: raidClubEnv.nativeDenom,
          name: raidClubEnv.nativeSymbol,
          symbol: raidClubEnv.nativeSymbol,
          decimals: raidClubEnv.nativeDecimals,
        },
      ],
    }
  : null

export const raidClubViemChain = isMainnetRuntimeConfigured
  ? defineChain({
      id: raidClubEnv.evmChainId,
      name: raidClubEnv.prettyName,
      nativeCurrency: {
        name: raidClubEnv.nativeSymbol,
        symbol: raidClubEnv.nativeSymbol,
        decimals: raidClubEnv.nativeDecimals,
      },
      rpcUrls: {
        default: { http: [raidClubEnv.jsonRpcUrl] },
      },
      blockExplorers: raidClubEnv.blockExplorerUrl
        ? {
            default: {
              name: `${raidClubEnv.prettyName} Explorer`,
              url: raidClubEnv.blockExplorerUrl,
            },
          }
        : undefined,
    })
  : null
