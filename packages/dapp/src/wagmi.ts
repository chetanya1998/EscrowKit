import { http, createConfig } from 'wagmi'
import { foundry, baseSepolia, mainnet, base } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

// Determine chain based on env var, defaulting to foundry if not set or "local"
const chainId = process.env.NEXT_PUBLIC_CHAIN_ID;
const currentChain = chainId === '84532' ? baseSepolia :
    chainId === '1' ? mainnet :
        chainId === '8453' ? base :
            foundry;

export const config = createConfig({
    chains: [currentChain],
    connectors: [
        injected(),
    ],
    transports: {
        [foundry.id]: http(),
        [baseSepolia.id]: http(),
        [mainnet.id]: http(),
        [base.id]: http(),
    },
})
