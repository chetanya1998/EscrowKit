// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "./IArbitrableEscrow.sol";

interface IMilestoneEscrow is IArbitrableEscrow {
    enum MilestoneStatus { PENDING, SUBMITTED, APPROVED, RELEASED, REFUNDED, DISPUTED }

    struct Milestone {
        uint256 amount;
        string description;
        uint256 deadline; // 0 for no deadline
        MilestoneStatus status;
        bytes32 deliverableHash;
        uint256 disputeId;
        bytes32 conditionHash; // Hash of the verification condition (0 if none)
        uint256 submittedAt;   // Timestamp when deliverable was submitted
    }

    struct EscrowConfig {
        uint256 arbitrationFeeBps;      // Percentage scale (e.g., 1 to 5 bps) for the arbiter fee
        uint256 payerPenaltyBps;        // Penalty rate if payer delays releasing funds
        uint256 payeePenaltyBps;        // Penalty rate if payee delays delivery past deadline
        uint256 disputeWindow;
        uint256 reviewPeriod;           // Time payer has to review before auto-release
    }

    event MilestoneAdded(uint256 indexed milestoneId, uint256 amount);
    event MilestoneUpdated(uint256 indexed milestoneId, uint256 amount, string description, uint256 deadline);
    event MilestoneFunded(address indexed funder, uint256 amount);
    event MilestoneSubmitted(uint256 indexed milestoneId, bytes32 deliverableHash);
    event MilestoneApproved(uint256 indexed milestoneId);
    event MilestoneReleased(uint256 indexed milestoneId, address indexed payee, uint256 amount);
    event MilestoneRefunded(uint256 indexed milestoneId, address indexed payer, uint256 amount);
    event DisputeOpened(uint256 indexed milestoneId, uint256 disputeId);
    event VerificationRequested(uint256 indexed milestoneId, bytes32 indexed conditionHash);

    function initialize(
        address _payer,
        address _payee,
        address _arbiter,
        address _arbitrationAdapter,
        address _token, // address(0) for native ETH
        address _verificationOracle,
        EscrowConfig calldata _config,
        uint256[] calldata amounts,
        string[] calldata descriptions,
        uint256[] calldata deadlines,
        bytes32[] calldata conditionHashes
    ) external;
    function updateMilestone(uint256 milestoneId, uint256 amount, string calldata description, uint256 deadline) external;
    function fund() external payable;
    function submitDeliverable(uint256 milestoneId, bytes32 deliverableHash) external;
    function approveMilestone(uint256 milestoneId) external;
    function releaseMilestone(uint256 milestoneId) external;
    function refundMilestone(uint256 milestoneId) external;
    function openDispute(uint256 milestoneId) external payable;
    function resolveDispute(uint256 milestoneId, MilestoneStatus resolution) external;
    // rule function is inherited from IArbitrableEscrow
    
    function getMilestone(uint256 milestoneId) external view returns (Milestone memory);
    function getMilestoneCount() external view returns (uint256);
    function getConfig() external view returns (EscrowConfig memory);
}
