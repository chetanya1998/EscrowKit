// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "./interfaces/IArbitrationAdapter.sol";

contract MockArbitrationAdapter is IArbitrationAdapter {
    uint256 private _disputeCount;
    address public arbiter;

    constructor(address _arbiter) {
        arbiter = _arbiter;
    }

    function createDispute(
        address, /* escrow */
        uint256, /* milestoneId */
        bytes calldata /* evidence */
    ) external payable returns (uint256) {
        _disputeCount++;
        return _disputeCount;
    }

    function getDisputeCost() external pure returns (uint256) {
        return 0;
    }

    function getArbiter() external view returns (address) {
        return arbiter;
    }
}
