// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IServiceEscrow.sol";
import "./interfaces/IArbitrationAdapter.sol";
import "./interfaces/IEscrowFactory.sol";

contract ServiceEscrow is
    Initializable,
    IServiceEscrow,
    ReentrancyGuard
{
    using SafeERC20 for IERC20;

    address public buyer; // Depositor
    address public provider; // Beneficiary
    address public arbiter;
    address public arbitrationAdapter;
    IERC20 public token; // address(0) for ETH

    uint256 public depositAmount;
    ServiceConfig public config;
    IEscrowFactory public factory;

    ServiceStatus public status;
    uint256 public disputeId;
    bytes32 public deliverableHash;
    uint256 public submittedAt;
    uint256 public deadline;

    modifier onlyBuyer() {
        require(msg.sender == buyer, "Not buyer");
        _;
    }

    modifier onlyProvider() {
        require(msg.sender == provider, "Not provider");
        _;
    }

    modifier inStatus(ServiceStatus _status) {
        require(status == _status, "Invalid status");
        _;
    }

    modifier whenNotGlobalPaused() {
        require(!factory.isFactoryPaused(), "System is paused");
        _;
    }

    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _buyer,
        address _provider,
        address _arbiter,
        address _arbitrationAdapter,
        address _token,
        uint256 _depositAmount,
        uint256 _deadline,
        ServiceConfig calldata _config
    ) external initializer {
        require(_buyer != address(0), "Invalid buyer");
        require(_provider != address(0), "Invalid provider");
        require(_depositAmount > 0, "Invalid amount");

        buyer = _buyer;
        provider = _provider;
        arbiter = _arbiter;
        arbitrationAdapter = _arbitrationAdapter;
        depositAmount = _depositAmount;
        deadline = _deadline;
        config = _config;
        factory = IEscrowFactory(msg.sender);
        
        if (_token != address(0)) {
            token = IERC20(_token);
        }
        
        status = ServiceStatus.PENDING;
    }

    function fund() external payable onlyBuyer inStatus(ServiceStatus.PENDING) whenNotGlobalPaused {
        if (address(token) == address(0)) {
            require(msg.value == depositAmount, "Incorrect ETH amount");
        } else {
            require(msg.value == 0, "ETH sent for Token escrow");
            token.safeTransferFrom(msg.sender, address(this), depositAmount);
        }

        status = ServiceStatus.FUNDED;
        emit ServiceFunded(msg.sender, depositAmount);
    }

    function submitService(bytes32 _deliverableHash) external onlyProvider inStatus(ServiceStatus.FUNDED) whenNotGlobalPaused {
        deliverableHash = _deliverableHash;
        submittedAt = block.timestamp;
        status = ServiceStatus.SUBMITTED;
        
        emit ServiceSubmitted(_deliverableHash);
    }

    function approveService() external onlyBuyer inStatus(ServiceStatus.SUBMITTED) whenNotGlobalPaused {
        status = ServiceStatus.APPROVED;
        emit ServiceApproved();
        _release();
    }

    function autoRelease() external nonReentrant onlyProvider inStatus(ServiceStatus.SUBMITTED) whenNotGlobalPaused {
        require(config.reviewPeriod > 0, "No review period set");
        require(block.timestamp > submittedAt + config.reviewPeriod, "Review period not over");
        
        status = ServiceStatus.APPROVED;
        emit ServiceApproved();
        _release();
    }

    function _calculatePayeePenalty() internal view returns (uint256) {
        if (deadline > 0 && submittedAt > deadline && config.payeePenaltyBps > 0) {
            uint256 daysLate = (submittedAt - deadline) / 1 days;
            if (daysLate > 0) {
                uint256 penalty = (daysLate * config.payeePenaltyBps * depositAmount) / 10000;
                return penalty > depositAmount ? depositAmount : penalty;
            }
        }
        return 0;
    }

    function _release() internal {
        status = ServiceStatus.RELEASED;
        
        uint256 penalty = _calculatePayeePenalty();
        uint256 payout = depositAmount - penalty;

        if (address(token) == address(0)) {
            if (payout > 0) payable(provider).transfer(payout);
            if (penalty > 0) payable(buyer).transfer(penalty);
        } else {
            if (payout > 0) token.safeTransfer(provider, payout);
            if (penalty > 0) token.safeTransfer(buyer, penalty);
        }

        emit ServiceReleased(provider, payout);
        if (penalty > 0) {
            emit ServiceRefunded(buyer, penalty);
        }
    }

    function disputeService() external payable inStatus(ServiceStatus.SUBMITTED) whenNotGlobalPaused {
        require(msg.sender == buyer || msg.sender == provider, "Not party");
        status = ServiceStatus.DISPUTED;
        
        disputeId = 0;
        if (arbitrationAdapter != address(0)) {
             IArbitrationAdapter adapter = IArbitrationAdapter(arbitrationAdapter);
             disputeId = adapter.createDispute{value: msg.value}(address(this), 0, "");
        }
        
        emit DisputeOpened(disputeId);
    }

    function resolveDispute(uint256 providerAmount) public nonReentrant whenNotGlobalPaused {
        require(
            msg.sender == arbiter || msg.sender == address(this),
            "Not authorized"
        );
        require(status == ServiceStatus.DISPUTED, "Not disputed");
        require(providerAmount <= depositAmount, "Amount exceeds deposit");

        status = ServiceStatus.RELEASED;
        uint256 buyerAmount = depositAmount - providerAmount;

        if (address(token) == address(0)) {
            if (providerAmount > 0) payable(provider).transfer(providerAmount);
            if (buyerAmount > 0) payable(buyer).transfer(buyerAmount);
        } else {
            if (providerAmount > 0) token.safeTransfer(provider, providerAmount);
            if (buyerAmount > 0) token.safeTransfer(buyer, buyerAmount);
        }

        emit DisputeResolved(providerAmount, buyerAmount);
    }

    function rule(uint256, /* disputeId */ uint256 ruling) external override {
        require(msg.sender == arbitrationAdapter, "Not authorized");
        
        uint256 finalToProvider = 0;
        
        if (ruling == 1) { // Provider wins
            finalToProvider = depositAmount;
        } else if (ruling == 2) { // Buyer wins
            finalToProvider = 0;
        }
        
        resolveDispute(finalToProvider);
    }
}
