// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IB2BVendorEscrow.sol";
import "./interfaces/IArbitrationAdapter.sol";
import "./interfaces/IEscrowFactory.sol";

contract B2BVendorEscrow is
    Initializable,
    IB2BVendorEscrow,
    ReentrancyGuard
{
    using SafeERC20 for IERC20;

    address public buyer; // Depositor
    address public vendor; // Beneficiary
    address public arbiter;
    address public arbitrationAdapter;
    IERC20 public token; // address(0) for ETH

    uint256 public depositAmount;
    B2BConfig public config;
    IEscrowFactory public factory;

    EscrowStatus public status;
    uint256 public disputeId;
    
    string public invoiceURI;
    bytes32 public invoiceHash;
    
    uint256 public submittedAt;
    uint256 public deadline;

    modifier onlyBuyer() {
        require(msg.sender == buyer, "Not buyer");
        _;
    }

    modifier onlyVendor() {
        require(msg.sender == vendor, "Not vendor");
        _;
    }

    modifier inStatus(EscrowStatus _status) {
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
        address _vendor,
        address _arbiter,
        address _arbitrationAdapter,
        address _token,
        uint256 _depositAmount,
        uint256 _deadline,
        B2BConfig calldata _config
    ) external initializer {
        require(_buyer != address(0), "Invalid buyer");
        require(_vendor != address(0), "Invalid vendor");
        require(_depositAmount > 0, "Invalid amount");

        buyer = _buyer;
        vendor = _vendor;
        arbiter = _arbiter;
        arbitrationAdapter = _arbitrationAdapter;
        depositAmount = _depositAmount;
        deadline = _deadline;
        config = _config;
        factory = IEscrowFactory(msg.sender);
        
        if (_token != address(0)) {
            token = IERC20(_token);
        }
        
        status = EscrowStatus.PENDING;
    }

    function fund() external payable onlyBuyer inStatus(EscrowStatus.PENDING) whenNotGlobalPaused {
        if (address(token) == address(0)) {
            require(msg.value == depositAmount, "Incorrect ETH amount");
        } else {
            require(msg.value == 0, "ETH sent for Token escrow");
            token.safeTransferFrom(msg.sender, address(this), depositAmount);
        }

        status = EscrowStatus.FUNDED;
        emit EscrowFunded(msg.sender, depositAmount);
    }

    function submitInvoice(string calldata _invoiceURI, bytes32 _invoiceHash) external onlyVendor inStatus(EscrowStatus.FUNDED) whenNotGlobalPaused {
        invoiceURI = _invoiceURI;
        invoiceHash = _invoiceHash;
        submittedAt = block.timestamp;
        status = EscrowStatus.SUBMITTED;
        
        emit InvoiceSubmitted(_invoiceURI, _invoiceHash);
    }

    function approvePayment() external onlyBuyer inStatus(EscrowStatus.SUBMITTED) whenNotGlobalPaused {
        status = EscrowStatus.APPROVED;
        emit EscrowApproved();
        _release();
    }

    function autoRelease() external nonReentrant onlyVendor inStatus(EscrowStatus.SUBMITTED) whenNotGlobalPaused {
        require(config.paymentTermDays > 0, "No payment term set");
        require(block.timestamp > submittedAt + (config.paymentTermDays * 1 days), "Payment term not over");
        
        status = EscrowStatus.APPROVED;
        emit EscrowApproved();
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
        status = EscrowStatus.RELEASED;
        
        uint256 penalty = _calculatePayeePenalty();
        uint256 payout = depositAmount - penalty;

        if (address(token) == address(0)) {
            if (payout > 0) payable(vendor).transfer(payout);
            if (penalty > 0) payable(buyer).transfer(penalty);
        } else {
            if (payout > 0) token.safeTransfer(vendor, payout);
            if (penalty > 0) token.safeTransfer(buyer, penalty);
        }

        emit EscrowReleased(vendor, payout);
        if (penalty > 0) {
            emit EscrowRefunded(buyer, penalty);
        }
    }

    function disputePayment() external payable inStatus(EscrowStatus.SUBMITTED) whenNotGlobalPaused {
        require(msg.sender == buyer || msg.sender == vendor, "Not party");
        status = EscrowStatus.DISPUTED;
        
        disputeId = 0;
        if (arbitrationAdapter != address(0)) {
             IArbitrationAdapter adapter = IArbitrationAdapter(arbitrationAdapter);
             disputeId = adapter.createDispute{value: msg.value}(address(this), 0, "");
        }
        
        emit DisputeOpened(disputeId);
    }

    function resolveDispute(uint256 vendorAmount) public nonReentrant whenNotGlobalPaused {
        require(
            msg.sender == arbiter || msg.sender == address(this),
            "Not authorized"
        );
        require(status == EscrowStatus.DISPUTED, "Not disputed");
        require(vendorAmount <= depositAmount, "Amount exceeds deposit");

        status = EscrowStatus.RELEASED;
        uint256 buyerAmount = depositAmount - vendorAmount;

        if (address(token) == address(0)) {
            if (vendorAmount > 0) payable(vendor).transfer(vendorAmount);
            if (buyerAmount > 0) payable(buyer).transfer(buyerAmount);
        } else {
            if (vendorAmount > 0) token.safeTransfer(vendor, vendorAmount);
            if (buyerAmount > 0) token.safeTransfer(buyer, buyerAmount);
        }

        emit DisputeResolved(vendorAmount, buyerAmount);
    }

    function rule(uint256, /* disputeId */ uint256 ruling) external override {
        require(msg.sender == arbitrationAdapter, "Not authorized");
        
        uint256 finalToVendor = 0;
        
        if (ruling == 1) { // Vendor wins
            finalToVendor = depositAmount;
        } else if (ruling == 2) { // Buyer wins
            finalToVendor = 0;
        }
        
        resolveDispute(finalToVendor);
    }
}
