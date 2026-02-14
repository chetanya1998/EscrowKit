
// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./MilestoneEscrow.sol";
import "./RentalEscrow.sol";
import "./interfaces/IEscrowFactory.sol";

contract EscrowFactory is IEscrowFactory {
    address public implementation;
    address public rentalImplementation;
    address[] public escrows;

    constructor() {
        implementation = address(new MilestoneEscrow());
        rentalImplementation = address(new RentalEscrow());
    }

    function createEscrow(
        address payee,
        address arbiter,
        address arbitrationAdapter,
        bytes32 /* detailsHash */,
        address verificationOracle,
        IMilestoneEscrow.EscrowConfig calldata config
    ) external payable returns (address) {
        address clone = Clones.clone(implementation);

        // Payer is msg.sender
        MilestoneEscrow(clone).initialize(
            msg.sender,
            payee,
            arbiter,
            arbitrationAdapter,
            address(0), // Default to ETH
            verificationOracle,
            config
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
    ) external payable returns (address) {
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
