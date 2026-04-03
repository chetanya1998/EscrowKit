import type { Abi } from "viem";

export enum EscrowKind {
  Milestone = 0,
  Rental = 1,
  Service = 2,
  Lease = 3,
  B2BVendor = 4,
}

export enum ProtocolVersion {
  V1 = 1,
  V2 = 2,
}

export type ProtocolAbi = Abi;

export interface ProtocolAddressConfig {
  primaryFactoryAddress: `0x${string}` | null;
  legacyFactoryAddresses: `0x${string}`[];
  verificationOracleAddress?: `0x${string}` | null | undefined;
  arbiterAdapterAddress?: `0x${string}` | null | undefined;
}
