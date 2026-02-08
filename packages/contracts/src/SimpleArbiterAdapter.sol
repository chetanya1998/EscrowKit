// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "./interfaces/IArbitrationAdapter.sol";
import "./interfaces/IMilestoneEscrow.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SimpleArbiterAdapter is IArbitrationAdapter, Ownable {
    uint256 public disputeCost;
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

    constructor(address _arbiter, uint256 _disputeCost) Ownable(msg.sender) {
        arbiter = _arbiter;
        disputeCost = _disputeCost;
    }

    function createDispute(
        address escrow,
        uint256 milestoneId,
        bytes calldata /* evidence */
    ) external payable override returns (uint256 disputeId) {
        require(msg.value >= disputeCost, "Insufficient fee");

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
        require(msg.sender == arbiter || msg.sender == owner(), "Not authorized");
        Dispute storage d = disputes[disputeId];
        require(!d.resolved, "Already resolved");
        
        d.resolved = true;
        
        // Call back to escrow
        IMilestoneEscrow(d.escrow).resolveDispute(d.milestoneId, resolution);
        
        emit DisputeResolved(disputeId, resolution);
    }

    function getDisputeCost() external view override returns (uint256) {
        return disputeCost;
    }

    function getArbiter() external view override returns (address) {
        return arbiter;
    }
    
    // Admin functions
    function setArbiter(address _arbiter) external onlyOwner {
        arbiter = _arbiter;
    }
    
    function setDisputeCost(uint256 _cost) external onlyOwner {
        disputeCost = _cost;
    }
    
    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
