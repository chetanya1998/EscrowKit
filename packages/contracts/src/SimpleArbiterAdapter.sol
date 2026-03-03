// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "./interfaces/IArbitrationAdapter.sol";
import "./interfaces/IMilestoneEscrow.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract SimpleArbiterAdapter is IArbitrationAdapter, AccessControl {
    address public arbiter; // The actual human/DAO arbiter
    uint256 public nextDisputeId;

    struct Dispute {
        address escrow;
        uint256 milestoneId;
        bool resolved;
    }

    mapping(uint256 => Dispute) public disputes;

    event DisputeCreated(uint256 indexed disputeId, address indexed escrow, uint256 milestoneId);
    event DisputeResolved(uint256 indexed disputeId, IMilestoneEscrow.MilestoneStatus resolution);

    constructor(address _arbiter) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        arbiter = _arbiter;
    }

    function createDispute(
        address escrow,
        uint256 milestoneId,
        bytes calldata /* evidence */
    ) external payable override returns (uint256 disputeId) {
        uint256 cost = this.getDisputeCost(escrow, milestoneId);
        require(msg.value >= cost, "Insufficient fee");

        disputeId = nextDisputeId++;
        disputes[disputeId] = Dispute({
            escrow: escrow,
            milestoneId: milestoneId,
            resolved: false
        });

        emit DisputeCreated(disputeId, escrow, milestoneId);
        return disputeId;
    }

    function resolveDispute(uint256 disputeId, IMilestoneEscrow.MilestoneStatus resolution) external {
        require(msg.sender == arbiter || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not authorized");
        Dispute storage d = disputes[disputeId];
        require(!d.resolved, "Already resolved");
        
        d.resolved = true;
        
        // Call back to escrow
        IMilestoneEscrow(d.escrow).resolveDispute(d.milestoneId, resolution);
        
        emit DisputeResolved(disputeId, resolution);
    }

    function getDisputeCost(address escrow, uint256 milestoneId) external view override returns (uint256) {
        IMilestoneEscrow e = IMilestoneEscrow(escrow);
        IMilestoneEscrow.EscrowConfig memory c = e.getConfig();
        IMilestoneEscrow.Milestone memory m = e.getMilestone(milestoneId);
        
        return (m.amount * c.arbitrationFeeBps) / 10000;
    }

    function getArbiter() external view override returns (address) {
        return arbiter;
    }
    
    // Admin functions
    function setArbiter(address _arbiter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        arbiter = _arbiter;
    }
    
    function withdrawFees() external onlyRole(DEFAULT_ADMIN_ROLE) {
        payable(msg.sender).transfer(address(this).balance);
    }
}
