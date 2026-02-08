// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "./IMilestoneEscrow.sol";

interface IEscrowFactory {
    event EscrowCreated(address indexed escrowAddress, address indexed payer, address indexed payee, address arbiter);

    function createEscrow(
        address payee,
        address arbiter,
        address arbitrationAdapter,
        bytes32 detailsHash,
        IMilestoneEscrow.EscrowConfig calldata config
    ) external payable returns (address);

    function getEscrowCount() external view returns (uint256);
    function getEscrowAt(uint256 index) external view returns (address);
}
