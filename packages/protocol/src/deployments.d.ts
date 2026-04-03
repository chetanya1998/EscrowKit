import type { ProtocolAddressConfig } from "./types.js";
export declare const DEFAULT_DEPLOYMENTS: Record<number, ProtocolAddressConfig>;
export declare function resolveDeployments(chainId: number, overrides?: Partial<ProtocolAddressConfig> & {
    legacyFactoryAddressesCsv?: string;
}): ProtocolAddressConfig;
//# sourceMappingURL=deployments.d.ts.map