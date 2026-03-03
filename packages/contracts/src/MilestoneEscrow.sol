// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IMilestoneEscrow.sol";
import "./interfaces/IArbitrationAdapter.sol";
import "./interfaces/IEscrowFactory.sol";
import "./ConditionEngine.sol";
import "./VerificationOracle.sol";

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
    EscrowConfig public config;
    VerificationOracle public verificationOracle;
    IEscrowFactory public factory;

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

    modifier whenNotGlobalPaused() {
        require(!factory.isFactoryPaused(), "System is paused");
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
        address _token,
        address _verificationOracle,
        EscrowConfig calldata _config,
        uint256[] calldata amounts,
        string[] calldata descriptions,
        uint256[] calldata deadlines,
        bytes32[] calldata conditionHashes
    ) external initializer {
        require(_payer != address(0), "Invalid payer");
        require(_payee != address(0), "Invalid payee");
        
        payer = _payer;
        payee = _payee;
        arbiter = _arbiter;
        arbitrationAdapter = _arbitrationAdapter;
        factory = IEscrowFactory(msg.sender);
        if (_verificationOracle != address(0)) {
            verificationOracle = VerificationOracle(_verificationOracle);
        }
        config = _config;

        if (_token != address(0)) {
            token = IERC20(_token);
        }

        require(_config.arbitrationFeeBps <= 1000, "Arbitration fee max 10%");
        require(_config.payerPenaltyBps <= 1000, "Payer penalty max 10%");
        require(_config.payeePenaltyBps <= 1000, "Payee penalty max 10%");

        require(
            amounts.length == descriptions.length &&
                descriptions.length == deadlines.length &&
                deadlines.length == conditionHashes.length,
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
                    disputeId: 0,
                    conditionHash: conditionHashes[i],
                    submittedAt: 0
                })
            );
            emit MilestoneAdded(milestones.length - 1, amounts[i]);
        }
    }

    function fund() external payable onlyPayer whenNotGlobalPaused {
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
        whenNotGlobalPaused
    {
        Milestone storage m = milestones[milestoneId];
        require(m.status == MilestoneStatus.PENDING, "Not pending");
        milestones[milestoneId].status = MilestoneStatus.SUBMITTED;
        milestones[milestoneId].deliverableHash = deliverableHash;
        milestones[milestoneId].submittedAt = block.timestamp;
        
        emit MilestoneSubmitted(milestoneId, deliverableHash);

        if (milestones[milestoneId].conditionHash != bytes32(0)) {
            emit VerificationRequested(milestoneId, milestones[milestoneId].conditionHash);
        }
    }

    function approveMilestone(uint256 milestoneId) external whenNotGlobalPaused {
        // Payer can approve. Arbiter can approve if needed (logic can be added).
        // For MVP, only Payer approves.
        require(msg.sender == payer, "Only payer can approve");
        Milestone storage m = milestones[milestoneId];
        require(
            m.status == MilestoneStatus.SUBMITTED || 
            m.status == MilestoneStatus.PENDING, // Allow approval without submission if no verification needed
            "Invalid status"
        );

        // Check verification if required
        if (m.conditionHash != bytes32(0) && address(verificationOracle) != address(0)) {
            require(
                verificationOracle.checkVerification(m.conditionHash),
                "Condition not verified"
            );
        }
        
        m.status = MilestoneStatus.APPROVED;
        emit MilestoneApproved(milestoneId);
        releaseMilestone(milestoneId);
    }

    function _calculatePayeePenalty(Milestone storage m) internal view returns (uint256) {
        if (m.deadline > 0 && m.submittedAt > m.deadline && config.payeePenaltyBps > 0) {
            uint256 daysLate = (m.submittedAt - m.deadline) / 1 days;
            if (daysLate > 0) {
                uint256 penalty = (daysLate * config.payeePenaltyBps * m.amount) / 10000;
                return penalty > m.amount ? m.amount : penalty;
            }
        }
        return 0;
    }

    function releaseMilestone(uint256 milestoneId) public nonReentrant whenNotGlobalPaused {
        Milestone storage m = milestones[milestoneId];
        require(m.status == MilestoneStatus.APPROVED, "Not approved");
        
        m.status = MilestoneStatus.RELEASED;
        
        uint256 payeePenalty = _calculatePayeePenalty(m);
        uint256 payout = m.amount - payeePenalty;
        
        totalReleased += payout;
        if (payeePenalty > 0) {
            totalRefunded += payeePenalty;
        }

        if (address(token) == address(0)) {
            if (payout > 0) {
                (bool success, ) = payable(payee).call{value: payout}("");
                require(success, "ETH transfer failed");
            }
            if (payeePenalty > 0) {
                (bool success, ) = payable(payer).call{value: payeePenalty}("");
                require(success, "Penalty transfer failed");
            }
        } else {
            if (payout > 0) token.safeTransfer(payee, payout);
            if (payeePenalty > 0) token.safeTransfer(payer, payeePenalty);
        }

        emit MilestoneReleased(milestoneId, payee, payout);
    }

    function automaticRelease(uint256 milestoneId) external nonReentrant onlyPayee whenNotGlobalPaused {
        Milestone storage m = milestones[milestoneId];
        require(m.status == MilestoneStatus.SUBMITTED, "Not submitted");
        require(m.submittedAt > 0, "No submission time");
        require(config.reviewPeriod > 0, "No review period set");
        require(block.timestamp > m.submittedAt + config.reviewPeriod, "Review period not over");
        
        m.status = MilestoneStatus.RELEASED;
        
        uint256 payeePenalty = _calculatePayeePenalty(m);
        
        // Calculate Payer Delay Penalty
        uint256 daysLate = (block.timestamp - (m.submittedAt + config.reviewPeriod)) / 1 days;
        uint256 payerPenalty = 0;
        if (daysLate > 0 && config.payerPenaltyBps > 0) {
            payerPenalty = (daysLate * config.payerPenaltyBps * m.amount) / 10000;
        }
        
        uint256 baseAmount = m.amount - payeePenalty;
        uint256 totalPayout = baseAmount + payerPenalty;
        
        // Cap total payout by contract balance in case payer penalty exceeds remaining funds
        uint256 contractBalance = (address(token) == address(0)) ? address(this).balance : token.balanceOf(address(this));
        if (totalPayout > contractBalance) {
            totalPayout = contractBalance; 
        }
        
        totalReleased += totalPayout;
        
        // Net refund (payeePenalty - payerPenalty if any, though usually we just send back the isolated penalty)
        uint256 refundAmount = m.amount > baseAmount ? m.amount - baseAmount : 0;
        if (refundAmount > payerPenalty) {
            refundAmount = refundAmount - payerPenalty;
        } else {
            refundAmount = 0;
        }
        
        if (refundAmount > 0) {
            totalRefunded += refundAmount;
        }

        if (address(token) == address(0)) {
            if (totalPayout > 0) {
                (bool success, ) = payable(payee).call{value: totalPayout}("");
                require(success, "ETH transfer failed");
            }
            if (refundAmount > 0) {
                (bool success, ) = payable(payer).call{value: refundAmount}("");
                require(success, "Penalty ETH transfer failed");
            }
        } else {
            if (totalPayout > 0) token.safeTransfer(payee, totalPayout);
            if (refundAmount > 0) token.safeTransfer(payer, refundAmount);
        }

        emit MilestoneReleased(milestoneId, payee, totalPayout);
    }

    function refundMilestone(uint256 milestoneId) external nonReentrant onlyPayer whenNotGlobalPaused {
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

    function openDispute(uint256 milestoneId) external payable whenNotGlobalPaused {
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


    
    // Better Approach:
    // Retain `resolveDispute` for Aribter (manual) and let `rule` call it.
    // The `rule` function finds the milestone.

    function resolveDispute(uint256 milestoneId, MilestoneStatus resolution) public nonReentrant whenNotGlobalPaused {
        require(
            msg.sender == arbiter || msg.sender == address(this), /* Allow self-call from rule */
            "Not authorized"
        );
        Milestone storage m = milestones[milestoneId];
        require(m.status == MilestoneStatus.DISPUTED, "Not disputed");
        
        if (resolution == MilestoneStatus.RELEASED) {
            m.status = MilestoneStatus.APPROVED;
            releaseMilestone(milestoneId);
        } else if (resolution == MilestoneStatus.REFUNDED) {
             m.status = MilestoneStatus.REFUNDED;
             totalRefunded += m.amount;
    
             if (address(token) == address(0)) {
                (bool success, ) = payable(payer).call{value: m.amount}("");
                require(success, "ETH transfer failed");
             } else {
                token.safeTransfer(payer, m.amount);
             }
             emit MilestoneRefunded(milestoneId, payer, m.amount);
        } else {
            revert("Invalid resolution");
        }
    }

    function rule(uint256 disputeId, uint256 ruling) external override {
        require(msg.sender == arbitrationAdapter, "Not authorized");
        
        // Find milestone with this disputeId
        uint256 milestoneId = type(uint256).max;
        for(uint256 i=0; i<milestones.length; i++) {
            if(milestones[i].disputeId == disputeId && milestones[i].status == MilestoneStatus.DISPUTED) {
                milestoneId = i;
                break;
            }
        }
        require(milestoneId != type(uint256).max, "Dispute not found");

        MilestoneStatus resolution;
        if (ruling == 1) {
            resolution = MilestoneStatus.RELEASED;
        } else if (ruling == 2) {
            resolution = MilestoneStatus.REFUNDED;
        } else {
            // Ruling 0 or others: Refund Payer as fail-safe or split? 
            // Default to Refund Payer for safety in this version.
            resolution = MilestoneStatus.REFUNDED;
        }
        
        resolveDispute(milestoneId, resolution);
    }

    function updateMilestone(
        uint256 milestoneId,
        uint256 amount,
        string calldata description,
        uint256 deadline
    ) external onlyPayer whenNotGlobalPaused {
        require(totalFunded == 0, "Already funded");
        require(milestoneId < milestones.length, "Invalid ID");
        
        Milestone storage m = milestones[milestoneId];
        require(m.status == MilestoneStatus.PENDING, "Not pending");
        
        m.amount = amount;
        m.description = description;
        m.deadline = deadline;
        
        emit MilestoneUpdated(milestoneId, amount, description, deadline);
    }

    function getMilestone(uint256 milestoneId) external view returns (Milestone memory) {
        return milestones[milestoneId];
    }
    
    function getMilestoneCount() external view returns (uint256) {
        return milestones.length;
    }

    function getConfig() external view returns (EscrowConfig memory) {
        return config;
    }
}
