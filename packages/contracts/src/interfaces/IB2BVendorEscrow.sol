// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "./IArbitrable.sol";

interface IB2BVendorEscrow is IArbitrable {
    enum EscrowStatus {
        PENDING,
        FUNDED,
        SUBMITTED,
        APPROVED,
        RELEASED,
        REFUNDED,
        DISPUTED
    }

    struct B2BConfig {
        uint256 arbitrationFeeBps; // Up to 1000 (10%)
        uint256 paymentTermDays;   // Payment term (e.g. 30 for Net-30) before auto-release
        uint256 payeePenaltyBps;   // Penalty if submitted late
    }

    event EscrowFunded(address indexed buyer, uint256 amount);
    event InvoiceSubmitted(string invoiceURI, bytes32 invoiceHash);
    event EscrowApproved();
    event EscrowReleased(address indexed vendor, uint256 payout);
    event EscrowRefunded(address indexed buyer, uint256 refundAmount);
    event DisputeOpened(uint256 disputeId);
    event DisputeResolved(uint256 toVendor, uint256 toBuyer);
}
