// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

interface IArbitrationAdapter {
    function createDispute(
        address escrow,
        uint256 milestoneId,
        bytes calldata evidence
    ) external payable returns (uint256 disputeId);

    function getDisputeCost() external view returns (uint256);
    function getArbiter() external view returns (address);
}
