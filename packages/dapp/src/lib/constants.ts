import { Abi } from 'viem';
import EscrowFactoryArtifact from './EscrowFactory.json';
import MilestoneEscrowArtifact from './MilestoneEscrow.json';
import RentalEscrowArtifact from './RentalEscrow.json';
import SimpleArbiterAdapterArtifact from './SimpleArbiterAdapter.json';
import VerificationOracleArtifact from './VerificationOracle.json';

export const FACTORY_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
export const FACTORY_ABI = EscrowFactoryArtifact.abi as Abi;
export const MILESTONE_ESCROW_ABI = MilestoneEscrowArtifact.abi as Abi;
export const RENTAL_ESCROW_ABI = RentalEscrowArtifact.abi as Abi;
export const ARBITER_ADAPTER_ABI = SimpleArbiterAdapterArtifact.abi as Abi;
export const SIMPLE_ARBITER_ADAPTER_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const VERIFICATION_ORACLE_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
export const VERIFICATION_ORACLE_ABI = VerificationOracleArtifact.abi as Abi;

