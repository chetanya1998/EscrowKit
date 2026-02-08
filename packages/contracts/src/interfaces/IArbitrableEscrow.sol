
// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

interface IArbitrableEscrow {
    function rule(uint256 disputeId, uint256 ruling) external;
}
