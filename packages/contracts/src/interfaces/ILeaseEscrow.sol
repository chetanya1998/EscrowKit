// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "./IArbitrable.sol";

interface ILeaseEscrow is IArbitrable {
    enum LeaseStatus {
        AWAITING_DEPOSIT,
        ACTIVE,
        DISPUTED,
        ENDED
    }

    struct LeaseConfig {
        uint256 totalPeriods;
        uint256 periodDuration; // in seconds
        uint256 amountPerPeriod;
        uint256 arbitrationFeeBps;
    }

    event Deposited(address indexed lessee, uint256 amount);
    event PeriodClaimed(uint256 periodIndex, uint256 amount);
    event DisputeOpened(uint256 disputeId);
    event DisputeResolved(uint256 toLessor, uint256 toLessee);
    event LeaseTerminated();
}
