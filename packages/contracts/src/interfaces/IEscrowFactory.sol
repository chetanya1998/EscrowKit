
// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "./IMilestoneEscrow.sol";
import "./IRentalEscrow.sol";

interface IEscrowFactory {
    event EscrowCreated(address indexed escrowAddress, address indexed payer, address indexed payee, address arbiter);

    function createEscrow(
        address payee,
        address arbiter,
        address arbitrationAdapter,
        bytes32 detailsHash,
        address verificationOracle,
        IMilestoneEscrow.EscrowConfig calldata config,
        uint256[] calldata amounts,
        string[] calldata descriptions,
        uint256[] calldata deadlines,
        bytes32[] calldata conditionHashes
    ) external payable returns (address);

    function createRentalEscrow(
        address payee,
        address arbiter,
        address arbitrationAdapter,
        address token,
        uint256 depositAmount,
        IRentalEscrow.RentalConfig calldata config
    ) external payable returns (address);

    function getEscrowCount() external view returns (uint256);
    function getEscrowAt(uint256 index) external view returns (address);
    function isFactoryPaused() external view returns (bool);
}
