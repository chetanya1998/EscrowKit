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

    struct EscrowConfig {
        uint256 arbitrationFee;
        uint256 disputeWindow;
        uint256 automaticReleaseTime;
    }

    event MilestoneAdded(uint256 indexed milestoneId, uint256 amount);
    event MilestoneUpdated(uint256 indexed milestoneId, uint256 amount, string description, uint256 deadline);
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
        address _token, // address(0) for native ETH
        EscrowConfig calldata _config
    ) external;

    function addMilestones(uint256[] calldata amounts, string[] calldata descriptions, uint256[] calldata deadlines) external;
    function updateMilestone(uint256 milestoneId, uint256 amount, string calldata description, uint256 deadline) external;
    function fund() external payable;
    function submitDeliverable(uint256 milestoneId, bytes32 deliverableHash) external;
    function approveMilestone(uint256 milestoneId) external;
    function releaseMilestone(uint256 milestoneId) external;
    function refundMilestone(uint256 milestoneId) external;
    function openDispute(uint256 milestoneId) external payable;
    function resolveDispute(uint256 milestoneId, MilestoneStatus resolution) external;
    
    function getMilestone(uint256 milestoneId) external view returns (Milestone memory);
    function getMilestoneCount() external view returns (uint256);
    function getConfig() external view returns (EscrowConfig memory);
}
