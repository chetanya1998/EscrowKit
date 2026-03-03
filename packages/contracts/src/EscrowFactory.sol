
// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./MilestoneEscrow.sol";
import "./RentalEscrow.sol";
import "./interfaces/IEscrowFactory.sol";

contract EscrowFactory is IEscrowFactory, AccessControl, Pausable {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    address public implementation;
    address public rentalImplementation;
    address[] public escrows;

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);

        implementation = address(new MilestoneEscrow());
        rentalImplementation = address(new RentalEscrow());
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function isFactoryPaused() external view returns (bool) {
        return paused();
    }

    function createEscrow(
        address payee,
        address arbiter,
        address arbitrationAdapter,
        bytes32 /* detailsHash */,
        address verificationOracle,
        IMilestoneEscrow.EscrowConfig calldata config,
        uint256[] calldata amounts,
        string[] calldata descriptions,
        uint256[] calldata deadlines,
        bytes32[] calldata conditionHashes
    ) external payable whenNotPaused returns (address) {
        address clone = Clones.clone(implementation);

        // Payer is msg.sender
        MilestoneEscrow(clone).initialize(
            msg.sender,
            payee,
            arbiter,
            arbitrationAdapter,
            address(0), // Default to ETH
            verificationOracle,
            config,
            amounts,
            descriptions,
            deadlines,
            conditionHashes
        );

        escrows.push(clone);
        emit EscrowCreated(clone, msg.sender, payee, arbiter);
        
        return clone;
    }

    function createRentalEscrow(
        address payee,
        address arbiter,
        address arbitrationAdapter,
        address token,
        uint256 depositAmount,
        IRentalEscrow.RentalConfig calldata config
    ) external payable whenNotPaused returns (address) {
        address clone = Clones.clone(rentalImplementation);

        RentalEscrow(clone).initialize(
            msg.sender,
            payee,
            arbiter,
            arbitrationAdapter,
            token, // Can specify token or 0 for ETH
            depositAmount,
            config
        );

        escrows.push(clone);
        emit EscrowCreated(clone, msg.sender, payee, arbiter);
        
        return clone;
    }

    function getEscrowCount() external view returns (uint256) {
        return escrows.length;
    }

    function getEscrowAt(uint256 index) external view returns (address) {
        return escrows[index];
    }
}
