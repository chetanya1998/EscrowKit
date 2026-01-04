# Smart Contracts Overview

EscrowKit's core logic resides in its Solidity smart contracts.

## Key Contracts

### \`EscrowFactory.sol\`
The factory is the entry point for creating new escrows. It uses the minimal proxy pattern (Clones) to deploy cheap instances of \`MilestoneEscrow\`.

### \`MilestoneEscrow.sol\`
This contract holds the funds and state for a single escrow agreement between a Payer and a Payee.

**State Machine:**
1. **Initial**: Contract deployed.
2. **Funded**: Payer deposits funds.
3. **Milestones Added**: Milestones defined (amount, description, deadline).
4. **Active**: Work in progress.
5. **Submitted**: Payee submits mechanism (e.g., hash of deliverable).
6. **Approved/Released**: Payer approves, funds released to Payee.
7. **Disputed**: Either party raises dispute, Arbiter intervenes.

### \`IArbitrationAdapter.sol\`
Interface for plugging in different arbitration mechanisms.

## Events

- \`EscrowCreated(address indexed escrow, address indexed payer, address indexed payee, ...)\`
- \`MilestoneAdded(uint256 indexed id, uint256 amount)\`
- \`MilestoneFunded(address indexed funder, uint256 amount)\`
