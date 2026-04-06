"use client"

import type { PropsWithChildren } from "react"
import { useEffect } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  InterwovenKitProvider,
  MAINNET,
  initiaPrivyWalletConnector,
  injectStyles,
} from "@initia/interwovenkit-react"
import InterwovenKitStyles from "@initia/interwovenkit-react/styles.js"
import { createConfig, http, WagmiProvider } from "wagmi"
import { mainnet } from "wagmi/chains"
import { customInterwovenChain, isMainnetRuntimeConfigured, raidClubViemChain } from "@/lib/initia/config"

const queryClient = new QueryClient()

const wagmiConfig = createConfig({
  connectors: [initiaPrivyWalletConnector],
  chains: raidClubViemChain ? [mainnet, raidClubViemChain] : [mainnet],
  transports: raidClubViemChain
    ? {
        [mainnet.id]: http(),
        [raidClubViemChain.id]: http(raidClubViemChain.rpcUrls.default.http[0]),
      }
    : { [mainnet.id]: http() },
})

export default function Providers({ children }: PropsWithChildren) {
  useEffect(() => {
    injectStyles(InterwovenKitStyles)
  }, [])

  if (!isMainnetRuntimeConfigured || !customInterwovenChain) {
    return <>{children}</>
  }

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <InterwovenKitProvider
          {...MAINNET}
          defaultChainId={customInterwovenChain.chain_id}
          customChain={customInterwovenChain}
          enableAutoSign={{ [customInterwovenChain.chain_id]: ["/minievm.evm.v1.MsgCall"] }}
          autoSignFeePolicy={{
            [customInterwovenChain.chain_id]: {
              allowedFeeDenoms: customInterwovenChain.fees.fee_tokens.map((token) => token.denom),
            },
          }}
          theme="dark"
        >
          {children}
        </InterwovenKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  )
}
