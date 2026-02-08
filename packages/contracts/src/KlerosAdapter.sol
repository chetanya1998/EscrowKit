
// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IArbitrationAdapter.sol";
import "./interfaces/IArbitrator.sol";
import "./interfaces/IArbitrable.sol";
import "./interfaces/IArbitrableEscrow.sol";

contract KlerosAdapter is IArbitrationAdapter, IArbitrable, Ownable {
    IArbitrator public arbitrator;
    bytes public arbitratorExtraData;
    
    // Mapping from Kleros Dispute ID to our Escrow Data
    struct DisputeData {
        address escrow;
        uint256 milestoneId;
        bool active;
    }
    
    mapping(uint256 => DisputeData) public disputes;

    // Events for ERC-1497 Evidence Standard
    event MetaEvidence(uint256 indexed _metaEvidenceID, string _evidence);
    event Evidence(IArbitrator indexed _arbitrator, uint256 indexed _disputeID, address indexed _party, string _evidence);

    constructor(address _arbitrator, bytes memory _arbitratorExtraData) Ownable(msg.sender) {
        arbitrator = IArbitrator(_arbitrator);
        arbitratorExtraData = _arbitratorExtraData;
    }

    function createDispute(
        address escrow,
        uint256 milestoneId,
        bytes calldata evidence
    ) external payable override returns (uint256 disputeId) {
        uint256 cost = arbitrator.arbitrationCost(arbitratorExtraData);
        require(msg.value >= cost, "Insufficient arbitration fee");

        // Create dispute on Kleros
        // Choices: 1 = Release to Payee, 2 = Refund to Payer
        disputeId = arbitrator.createDispute{value: cost}(2, arbitratorExtraData);

        disputes[disputeId] = DisputeData({
            escrow: escrow,
            milestoneId: milestoneId,
            active: true
        });

        emit Evidence(arbitrator, disputeId, msg.sender, string(evidence));
        
        // Refund excess
        if (msg.value > cost) {
            payable(msg.sender).transfer(msg.value - cost);
        }

        return disputeId;
    }

    function rule(uint256 _disputeID, uint256 _ruling) external override {
        require(msg.sender == address(arbitrator), "Only arbitrator can rule");
        
        DisputeData storage d = disputes[_disputeID];
        require(d.active, "Dispute not active");
        d.active = false;

        emit Ruling(arbitrator, _disputeID, _ruling);

        // Ruling: 1 = Payee (Release/Claim Accepted), 2 = Payer (Refund/Claim Rejected)
        IArbitrableEscrow(d.escrow).rule(d.active ? _disputeID : 0, _ruling);
    }

    function getDisputeCost() external view override returns (uint256) {
        return arbitrator.arbitrationCost(arbitratorExtraData);
    }

    function getArbiter() external view override returns (address) {
        return address(arbitrator);
    }
    
    // Admin functions to update arbitrator if needed
    function setArbitrator(address _arbitrator, bytes memory _extraData) external onlyOwner {
        arbitrator = IArbitrator(_arbitrator);
        arbitratorExtraData = _extraData;
    }
}
