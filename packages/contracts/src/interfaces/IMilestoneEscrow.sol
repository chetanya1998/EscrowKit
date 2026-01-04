// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

interface IMilestoneEscrow {
    enum MilestoneStatus { PENDING, SUBMITTED, APPROVED, RELEASED, REFUNDED, DISPUTED }

    struct Milestone {
        uint256 amount;
        string description;
        uint256 deadline; // 0 for no deadline
        MilestoneStatus status;
        bytes32 deliverableHash;
        uint256 disputeId;
    }

    event MilestoneAdded(uint256 indexed milestoneId, uint256 amount);
    event MilestoneFunded(address indexed funder, uint256 amount);
    event MilestoneSubmitted(uint256 indexed milestoneId, bytes32 deliverableHash);
    event MilestoneApproved(uint256 indexed milestoneId);
    event MilestoneReleased(uint256 indexed milestoneId, address indexed payee, uint256 amount);
    event MilestoneRefunded(uint256 indexed milestoneId, address indexed payer, uint256 amount);
    event DisputeOpened(uint256 indexed milestoneId, uint256 disputeId);

    function initialize(
        address _payer,
        address _payee,
        address _arbiter,
        address _arbitrationAdapter,
        address _token // address(0) for native ETH
    ) external;

    function addMilestones(uint256[] calldata amounts, string[] calldata descriptions, uint256[] calldata deadlines) external;
    function fund() external payable;
    function submitDeliverable(uint256 milestoneId, bytes32 deliverableHash) external;
    function approveMilestone(uint256 milestoneId) external;
    function releaseMilestone(uint256 milestoneId) external;
    function refundMilestone(uint256 milestoneId) external;
    function openDispute(uint256 milestoneId) external payable;
    
    function getMilestone(uint256 milestoneId) external view returns (Milestone memory);
    function getMilestoneCount() external view returns (uint256);
}
