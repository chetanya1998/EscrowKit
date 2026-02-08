
// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "./IArbitrableEscrow.sol";

interface IRentalEscrow is IArbitrableEscrow {
    enum RentalStatus { AWAITING_DEPOSIT, ACTIVE, CLAIM_PENDING, ENDED, DISPUTED }

    struct RentalConfig {
        uint256 arbitrationFee;
        uint256 disputeWindow;
        uint256 claimWindow; // Time for tenant to dispute a claim
    }

    event Deposited(address indexed payer, uint256 amount);
    event Claimed(address indexed payee, uint256 amount, string reason);
    event ClaimAccepted(uint256 claimAmount, uint256 refundAmount);
    event DisputeOpened(uint256 disputeId);
    event DisputeResolved(uint256 payeeAmount, uint256 payerAmount);
    event Refunded(address indexed payer, uint256 amount);

    function initialize(
        address _payer, // Tenant
        address _payee, // Landlord
        address _arbiter,
        address _arbitrationAdapter,
        address _token,
        uint256 _depositAmount,
        RentalConfig calldata _config
    ) external;

    function deposit() external payable;
    function claim(uint256 amount, string calldata reason) external;
    function acceptClaim() external; // Tenant accepts claim, releases funds
    function disputeClaim() external payable; // Tenant disputes claim
    // rule function is inherited from IArbitrableEscrow

    function getStatus() external view returns (RentalStatus);
}
