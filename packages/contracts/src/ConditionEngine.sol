// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

library ConditionEngine {
    function checkDeadline(uint256 deadline) internal view returns (bool) {
        if (deadline == 0) return true; // No deadline
        return block.timestamp <= deadline;
    }

    function isDeadlinePassed(uint256 deadline) internal view returns (bool) {
        if (deadline == 0) return false;
        return block.timestamp > deadline;
    }
}
