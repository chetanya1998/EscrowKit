import {
  B2BVendorEscrowABI,
  FactoryV1ABI,
  FactoryV2ABI,
  LeaseEscrowABI,
  MilestoneEscrowV1ABI,
  MilestoneEscrowV2ABI,
  RentalEscrowABI,
  resolveDeployments,
  ServiceEscrowABI,
  SimpleArbiterAdapterABI,
  VerificationOracleABI,
} from "@escrowkit/protocol";
import type { Abi } from "viem";

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "84532");
const deployments = resolveDeployments(chainId, {
  primaryFactoryAddress:
    (process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}` | undefined) ??
    undefined,
  legacyFactoryAddressesCsv:
    process.env.NEXT_PUBLIC_LEGACY_FACTORY_ADDRESSES ?? undefined,
  arbiterAdapterAddress:
    (process.env.NEXT_PUBLIC_ARBITER_ADAPTER_ADDRESS as
      | `0x${string}`
      | undefined) ?? undefined,
  verificationOracleAddress:
    (process.env.NEXT_PUBLIC_VERIFICATION_ORACLE_ADDRESS as
      | `0x${string}`
      | undefined) ?? undefined,
});

export const FACTORY_ADDRESS =
  deployments.primaryFactoryAddress ??
  ("0xec0902d890e0c41b8837d180f923788696942c42" as const);
export const LEGACY_FACTORY_ADDRESSES = deployments.legacyFactoryAddresses;
export const FACTORY_ABI = FactoryV2ABI as Abi;
export const FACTORY_V1_ABI = FactoryV1ABI as Abi;
export const FACTORY_V2_ABI = FactoryV2ABI as Abi;

export const MILESTONE_ESCROW_ABI = MilestoneEscrowV2ABI as Abi;
export const LEGACY_MILESTONE_ESCROW_ABI = MilestoneEscrowV1ABI as Abi;
export const MILESTONE_ESCROW_V2_ABI = MilestoneEscrowV2ABI as Abi;
export const RENTAL_ESCROW_ABI = RentalEscrowABI as Abi;
export const SERVICE_ESCROW_ABI = ServiceEscrowABI as Abi;
export const LEASE_ESCROW_ABI = LeaseEscrowABI as Abi;
export const B2B_VENDOR_ESCROW_ABI = B2BVendorEscrowABI as Abi;

export const ARBITER_ADAPTER_ABI = SimpleArbiterAdapterABI as Abi;
export const SIMPLE_ARBITER_ADAPTER_ADDRESS =
  deployments.arbiterAdapterAddress ??
  ("0x36d75d2b9a54ddd676ced8f75845d1fc72d841e3" as const);

export const VERIFICATION_ORACLE_ABI = VerificationOracleABI as Abi;
export const VERIFICATION_ORACLE_ADDRESS =
  deployments.verificationOracleAddress ??
  ("0xe11ed0a11624caaed2271b4bd73962b2d80ed8cd" as const);
