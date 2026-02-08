
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IArbitrator.sol";

interface IArbitrable {
    event Ruling(IArbitrator indexed _arbitrator, uint256 indexed _disputeID, uint256 _ruling);
    function rule(uint256 _disputeID, uint256 _ruling) external;
}
