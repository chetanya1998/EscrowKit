/**
 * EscrowKit — Shared Token Registry
 *
 * Centralised list of supported on-chain tokens and fiat mappings.
 * Used by all wizard templates, the dashboard, and the approval hook.
 */

export interface Token {
    symbol: string;
    name: string;
    /** `0x0000000000000000000000000000000000000000` for native ETH */
    address: `0x${string}`;
    decimals: number;
    /** Emoji or path; emoji used inline, path for <img> */
    logo: string;
    chainId: number;
    /** True if this represents a fiat currency backed by a stablecoin */
    isFiat?: boolean;
    /** If isFiat, which stablecoin symbol it maps to */
    fiatMapsTo?: string;
}

export const ZERO_ADDRESS: `0x${string}` = "0x0000000000000000000000000000000000000000";

/* ─── Base Sepolia (chainId 84532) ─── */

export const BASE_SEPOLIA_TOKENS: Token[] = [
    {
        symbol: "ETH",
        name: "Ether",
        address: ZERO_ADDRESS,
        decimals: 18,
        logo: "⟠",
        chainId: 84532,
    },
    {
        symbol: "USDC",
        name: "USD Coin",
        address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        decimals: 6,
        logo: "💲",
        chainId: 84532,
    },
    {
        symbol: "USDT",
        name: "Tether USD",
        address: "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06",
        decimals: 6,
        logo: "💵",
        chainId: 84532,
    },
    {
        symbol: "DAI",
        name: "Dai Stablecoin",
        address: "0x7683022d84F726a96c4A6611cD31DBf5409c0Ac9",
        decimals: 18,
        logo: "◈",
        chainId: 84532,
    },
    {
        symbol: "EURC",
        name: "Euro Coin",
        address: "0x808456652fdb597867f6f24F52e370bE4c4bc28C",
        decimals: 6,
        logo: "€",
        chainId: 84532,
    },
];

/* ─── Fiat Mapped Entries ─── */

export const FIAT_CURRENCIES: Token[] = [
    {
        symbol: "USD",
        name: "US Dollar (via USDC)",
        address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // points to USDC
        decimals: 6,
        logo: "$",
        chainId: 84532,
        isFiat: true,
        fiatMapsTo: "USDC",
    },
    {
        symbol: "EUR",
        name: "Euro (via EURC)",
        address: "0x808456652fdb597867f6f24F52e370bE4c4bc28C", // points to EURC
        decimals: 6,
        logo: "€",
        chainId: 84532,
        isFiat: true,
        fiatMapsTo: "EURC",
    },
];

/* ─── Combined Default List ─── */

export const SUPPORTED_TOKENS: Token[] = [...BASE_SEPOLIA_TOKENS, ...FIAT_CURRENCIES];

/* ─── Helpers ─── */

export function getTokenBySymbol(symbol: string): Token | undefined {
    return SUPPORTED_TOKENS.find((t) => t.symbol === symbol);
}

export function getTokenByAddress(address: string): Token | undefined {
    return SUPPORTED_TOKENS.find(
        (t) => t.address.toLowerCase() === address.toLowerCase() && !t.isFiat
    );
}

export function getTokenDecimals(address: string): number {
    const token = getTokenByAddress(address);
    return token?.decimals ?? 18;
}

export function isNativeToken(address: string): boolean {
    return address === ZERO_ADDRESS;
}

/**
 * Given a fiat symbol (USD, EUR), return the stablecoin Token it maps to.
 */
export function getFiatStablecoinMapping(fiatSymbol: string): Token | undefined {
    const fiat = FIAT_CURRENCIES.find((f) => f.symbol === fiatSymbol);
    if (!fiat?.fiatMapsTo) return undefined;
    return BASE_SEPOLIA_TOKENS.find((t) => t.symbol === fiat.fiatMapsTo);
}

/** Group tokens for display (Native, Stablecoins, Fiat) */
export function getTokenGroups(): { label: string; tokens: Token[] }[] {
    return [
        { label: "Native", tokens: SUPPORTED_TOKENS.filter((t) => t.symbol === "ETH") },
        { label: "Stablecoins", tokens: SUPPORTED_TOKENS.filter((t) => !t.isFiat && t.symbol !== "ETH") },
        { label: "Fiat (Stablecoin-backed)", tokens: FIAT_CURRENCIES },
    ];
}
