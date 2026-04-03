import type { Abi } from "viem";
import legacyFactory from "../artifacts/legacy/EscrowFactoryV1.json";
import legacyMilestone from "../artifacts/legacy/MilestoneEscrowV1.json";

export const FactoryV1ABI = legacyFactory.abi as Abi;
export const MilestoneEscrowV1ABI = legacyMilestone.abi as Abi;
export const LegacyMilestoneRuntimeBytecodeHash =
  "0x8f03b6930a9ffb1e5ada52674149d6cb9ff30ea13ea1f3df220c309652693069" as const;
