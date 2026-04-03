import type { Abi } from "viem";
export declare enum EscrowKind {
    Milestone = 0,
    Rental = 1,
    Service = 2,
    Lease = 3,
    B2BVendor = 4
}
export declare enum ProtocolVersion {
    V1 = 1,
    V2 = 2
}
export type ProtocolAbi = Abi;
export interface ProtocolAddressConfig {
    primaryFactoryAddress: `0x${string}` | null;
    legacyFactoryAddresses: `0x${string}`[];
    verificationOracleAddress?: `0x${string}` | null;
    arbiterAdapterAddress?: `0x${string}` | null;
}
//# sourceMappingURL=types.d.ts.map