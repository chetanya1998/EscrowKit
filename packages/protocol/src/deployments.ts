import type { ProtocolAddressConfig } from "./types.js";

const DEFAULT_FACTORY = "0xec0902d890e0c41b8837d180f923788696942c42" as const;
const DEFAULT_ADAPTER = "0x36d75d2b9a54ddd676ced8f75845d1fc72d841e3" as const;
const DEFAULT_ORACLE = "0xe11ed0a11624caaed2271b4bd73962b2d80ed8cd" as const;

export const DEFAULT_DEPLOYMENTS: Record<number, ProtocolAddressConfig> = {
  31337: {
    primaryFactoryAddress: null,
    legacyFactoryAddresses: [],
    verificationOracleAddress: null,
    arbiterAdapterAddress: null,
  },
  84532: {
    primaryFactoryAddress: DEFAULT_FACTORY,
    legacyFactoryAddresses: [],
    verificationOracleAddress: DEFAULT_ORACLE,
    arbiterAdapterAddress: DEFAULT_ADAPTER,
  },
};

function parseAddressList(value?: string): `0x${string}`[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry as `0x${string}`);
}

export function resolveDeployments(
  chainId: number,
  overrides?: Partial<ProtocolAddressConfig> & {
    legacyFactoryAddressesCsv?: string;
  },
): ProtocolAddressConfig {
  const base = DEFAULT_DEPLOYMENTS[chainId] ?? {
    primaryFactoryAddress: null,
    legacyFactoryAddresses: [],
    verificationOracleAddress: null,
    arbiterAdapterAddress: null,
  };

  return {
    primaryFactoryAddress:
      overrides?.primaryFactoryAddress ?? base.primaryFactoryAddress,
    legacyFactoryAddresses:
      overrides?.legacyFactoryAddresses ??
      parseAddressList(overrides?.legacyFactoryAddressesCsv) ??
      base.legacyFactoryAddresses,
    verificationOracleAddress:
      overrides?.verificationOracleAddress ?? base.verificationOracleAddress,
    arbiterAdapterAddress:
      overrides?.arbiterAdapterAddress ?? base.arbiterAdapterAddress,
  };
}
