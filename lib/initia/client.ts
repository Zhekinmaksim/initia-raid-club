import { createPublicClient, encodeFunctionData, http } from "viem"
import { raidClubAbi } from "./raidclub-abi"
import { isMainnetRuntimeConfigured, raidClubEnv, raidClubViemChain } from "./config"

export const raidClubPublicClient =
  isMainnetRuntimeConfigured && raidClubViemChain
    ? createPublicClient({
        chain: raidClubViemChain,
        transport: http(raidClubEnv.jsonRpcUrl),
      })
    : null

export const defaultBridgeRoute = {
  srcChainId: raidClubEnv.bridgeSrcChainId,
  srcDenom: raidClubEnv.bridgeSrcDenom,
  dstChainId: raidClubEnv.chainId,
  dstDenom: raidClubEnv.nativeDenom,
}

export function encodeRaidClubCall(functionName: string, args: unknown[] = []) {
  return encodeFunctionData({
    abi: raidClubAbi,
    functionName: functionName as never,
    args: args as never,
  })
}

export function buildMsgCall(input: `0x${string}`, sender: string, value = BigInt(0)) {
  return {
    typeUrl: "/minievm.evm.v1.MsgCall",
    value: {
      sender: sender.toLowerCase(),
      contractAddr: raidClubEnv.contractAddress,
      input,
      value: value.toString(),
      accessList: [],
      authList: [],
    },
  } as const
}
