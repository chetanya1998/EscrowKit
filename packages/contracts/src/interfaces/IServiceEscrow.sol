// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "./IArbitrable.sol";

interface IServiceEscrow is IArbitrable {
    enum ServiceStatus {
        PENDING,
        FUNDED,
        SUBMITTED,
        APPROVED,
        RELEASED,
        REFUNDED,
        DISPUTED
    }

    struct ServiceConfig {
        uint256 arbitrationFeeBps; // Up to 1000 (10%)
        uint256 reviewPeriod;      // Seconds buyer has to review before auto-release
        uint256 payeePenaltyBps;   // Penalty if submitted late
    }

    event ServiceFunded(address indexed buyer, uint256 amount);
    event ServiceSubmitted(bytes32 deliverableHash);
    event ServiceApproved();
    event ServiceReleased(address indexed provider, uint256 payout);
    event ServiceRefunded(address indexed buyer, uint256 refundAmount);
    event DisputeOpened(uint256 disputeId);
    event DisputeResolved(uint256 toProvider, uint256 toBuyer);
}
