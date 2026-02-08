// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./MilestoneEscrow.sol";
import "./interfaces/IEscrowFactory.sol";

contract EscrowFactory is IEscrowFactory {
    address public implementation;
    address[] public escrows;

    constructor() {
        implementation = address(new MilestoneEscrow());
    }

    function createEscrow(
        address payee,
        address arbiter,
        address arbitrationAdapter,
        bytes32 /* detailsHash */,
        IMilestoneEscrow.EscrowConfig calldata config
    ) external payable returns (address) {
        address clone = Clones.clone(implementation);
        
        // Payer is msg.sender
        MilestoneEscrow(clone).initialize(
            msg.sender,
            payee,
            arbiter,
            arbitrationAdapter,
            address(0), // Default to ETH for MVP factory call (can be overloaded)
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
