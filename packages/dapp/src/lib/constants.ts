import { Abi } from 'viem';
import EscrowFactoryArtifact from './EscrowFactory.json';
import MilestoneEscrowArtifact from './MilestoneEscrow.json';
import SimpleArbiterAdapterArtifact from './SimpleArbiterAdapter.json';

export const FACTORY_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const FACTORY_ABI = EscrowFactoryArtifact.abi as Abi;
export const MILESTONE_ESCROW_ABI = MilestoneEscrowArtifact.abi as Abi;
export const ARBITER_ADAPTER_ABI = SimpleArbiterAdapterArtifact.abi as Abi;
