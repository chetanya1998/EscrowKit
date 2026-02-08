
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IArbitrator
 * @dev The interface for Kleros IArbitrator.
 */
interface IArbitrator {
    enum DisputeStatus {Waiting, Appealable, Solved}

    function createDispute(uint256 _choices, bytes calldata _extraData) external payable returns(uint256 disputeID);
    function arbitrationCost(bytes calldata _extraData) external view returns(uint256 cost);
    function appeal(uint256 _disputeID, bytes calldata _extraData) external payable;
    function appealCost(uint256 _disputeID, bytes calldata _extraData) external view returns(uint256 cost);
    function appealPeriod(uint256 _disputeID) external view returns(uint256 start, uint256 end);
    function disputeStatus(uint256 _disputeID) external view returns(DisputeStatus status);
    function currentRuling(uint256 _disputeID) external view returns(uint256 ruling);
}
