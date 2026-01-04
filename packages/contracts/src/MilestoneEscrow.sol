// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IMilestoneEscrow.sol";
import "./interfaces/IArbitrationAdapter.sol";
import "./ConditionEngine.sol";

contract MilestoneEscrow is
    Initializable,
    IMilestoneEscrow,
    ReentrancyGuard
{
    using SafeERC20 for IERC20;

    address public payer;
    address public payee;
    address public arbiter; // Optional, or address(0)
    address public arbitrationAdapter;
    IERC20 public token; // address(0) for ETH

    Milestone[] public milestones;
    uint256 public totalFunded;
    uint256 public totalReleased;
    uint256 public totalRefunded;

    modifier onlyPayer() {
        require(msg.sender == payer, "Not payer");
        _;
    }

    modifier onlyPayee() {
        require(msg.sender == payee, "Not payee");
        _;
    }

    modifier onlyRole(address role) {
        require(msg.sender == role, "Not authorized");
        _;
    }

    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _payer,
        address _payee,
        address _arbiter,
        address _arbitrationAdapter,
        address _token
    ) external initializer {
        require(_payer != address(0), "Invalid payer");
        require(_payee != address(0), "Invalid payee");
        payer = _payer;
        payee = _payee;
        arbiter = _arbiter;
        arbitrationAdapter = _arbitrationAdapter;
        if (_token != address(0)) {
            token = IERC20(_token);
        }
    }

    function addMilestones(
        uint256[] calldata amounts,
        string[] calldata descriptions,
        uint256[] calldata deadlines
    ) external onlyPayer {
        require(totalFunded == 0, "Already funded");
        require(
            amounts.length == descriptions.length &&
                descriptions.length == deadlines.length,
            "Length mismatch"
        );

        for (uint256 i = 0; i < amounts.length; i++) {
            milestones.push(
                Milestone({
                    amount: amounts[i],
                    description: descriptions[i],
                    deadline: deadlines[i],
                    status: MilestoneStatus.PENDING,
                    deliverableHash: bytes32(0),
                    disputeId: 0
                })
            );
            emit MilestoneAdded(milestones.length - 1, amounts[i]);
        }
    }

    function fund() external payable onlyPayer {
        uint256 requiredAmount = _getTotalPendingAmount();
        
        if (address(token) == address(0)) {
            require(msg.value == requiredAmount, "Incorrect ETH amount");
        } else {
            require(msg.value == 0, "ETH sent for Token escrow");
            // Transfer tokens from payer (Must check allowance first in UI)
            token.safeTransferFrom(msg.sender, address(this), requiredAmount);
        }

        totalFunded += requiredAmount;
        emit MilestoneFunded(msg.sender, requiredAmount);
    }

    function _getTotalPendingAmount() internal view returns (uint256 total) {
        for(uint256 i=0; i < milestones.length; i++) {
             // Only fund pending milestones (logic can be more complex if partial funding allowed, but MVP is fund all)
             if(milestones[i].status == MilestoneStatus.PENDING) {
                 total += milestones[i].amount;
             }
        }
    }
    
    // Allow funding only specific amounts logic is implicit if strict fund all is enforced.
    // Making it flexible for "fundAll" which is MVP requirement.
    // fundAll logic above assumes funding everything pending.

    function submitDeliverable(uint256 milestoneId, bytes32 deliverableHash)
        external
        onlyPayee
    {
        Milestone storage m = milestones[milestoneId];
        require(m.status == MilestoneStatus.PENDING, "Not pending");
        m.status = MilestoneStatus.SUBMITTED;
        m.deliverableHash = deliverableHash;
        emit MilestoneSubmitted(milestoneId, deliverableHash);
    }

    function approveMilestone(uint256 milestoneId) external {
        // Payer can approve. Arbiter can approve if needed (logic can be added).
        // For MVP, only Payer approves.
        require(msg.sender == payer, "Only payer can approve");
        Milestone storage m = milestones[milestoneId];
        require(
            m.status == MilestoneStatus.PENDING ||
                m.status == MilestoneStatus.SUBMITTED,
            "Invalid status"
        );

        m.status = MilestoneStatus.APPROVED;
        emit MilestoneApproved(milestoneId);
        releaseMilestone(milestoneId);
    }

    function releaseMilestone(uint256 milestoneId) public nonReentrant {
        Milestone storage m = milestones[milestoneId];
        require(m.status == MilestoneStatus.APPROVED, "Not approved");
        
        m.status = MilestoneStatus.RELEASED;
        totalReleased += m.amount;

        if (address(token) == address(0)) {
            (bool success, ) = payable(payee).call{value: m.amount}("");
            require(success, "ETH transfer failed");
        } else {
            token.safeTransfer(payee, m.amount);
        }

        emit MilestoneReleased(milestoneId, payee, m.amount);
    }

    function refundMilestone(uint256 milestoneId) external nonReentrant onlyPayer {
         Milestone storage m = milestones[milestoneId];
         require(m.status != MilestoneStatus.RELEASED && m.status != MilestoneStatus.REFUNDED, "Already finalized");
         
         // Check Deadline
         require(ConditionEngine.isDeadlinePassed(m.deadline), "Deadline not passed");

         m.status = MilestoneStatus.REFUNDED;
         totalRefunded += m.amount;

         if (address(token) == address(0)) {
            (bool success, ) = payable(payer).call{value: m.amount}("");
            require(success, "ETH transfer failed");
         } else {
            token.safeTransfer(payer, m.amount);
         }

         emit MilestoneRefunded(milestoneId, payer, m.amount);
    }

    function openDispute(uint256 milestoneId) external payable {
        // Anyone involved can open dispute (payee if refund threatened, payer if deliverable bad).
        require(msg.sender == payer || msg.sender == payee, "Not party");
        Milestone storage m = milestones[milestoneId];
        require(m.status != MilestoneStatus.RELEASED && m.status != MilestoneStatus.REFUNDED, "Already finalized");

        m.status = MilestoneStatus.DISPUTED;
        
        uint256 disputeId = 0;
        if (arbitrationAdapter != address(0)) {
             IArbitrationAdapter adapter = IArbitrationAdapter(arbitrationAdapter);
             // Adapter might require payment
             disputeId = adapter.createDispute{value: msg.value}(address(this), milestoneId, "");
        }
        
        m.disputeId = disputeId;
        emit DisputeOpened(milestoneId, disputeId);
    }

    function getMilestone(uint256 milestoneId) external view returns (Milestone memory) {
        return milestones[milestoneId];
    }
    
    function getMilestoneCount() external view returns (uint256) {
        return milestones.length;
    }
}
