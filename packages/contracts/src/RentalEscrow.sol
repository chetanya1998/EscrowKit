
// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IRentalEscrow.sol";
import "./interfaces/IArbitrationAdapter.sol";
import "./interfaces/IEscrowFactory.sol";

contract RentalEscrow is
    Initializable,
    IRentalEscrow,
    ReentrancyGuard
{
    using SafeERC20 for IERC20;

    address public payer; // Tenant
    address public payee; // Landlord
    address public arbiter;
    address public arbitrationAdapter;
    IERC20 public token; // address(0) for ETH

    uint256 public depositAmount;
    RentalConfig public config;
    IEscrowFactory public factory;

    RentalStatus public status;
    uint256 public claimAmount;
    uint256 public claimDeadline;
    uint256 public disputeId;

    modifier onlyPayer() {
        require(msg.sender == payer, "Not payer");
        _;
    }

    modifier onlyPayee() {
        require(msg.sender == payee, "Not payee");
        _;
    }

    modifier inStatus(RentalStatus _status) {
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
        address _payer,
        address _payee,
        address _arbiter,
        address _arbitrationAdapter,
        address _token,
        uint256 _depositAmount,
        RentalConfig calldata _config
    ) external initializer {
        require(_payer != address(0), "Invalid payer");
        require(_payee != address(0), "Invalid payee");
        require(_depositAmount > 0, "Invalid amount");

        payer = _payer;
        payee = _payee;
        arbiter = _arbiter;
        arbitrationAdapter = _arbitrationAdapter;
        depositAmount = _depositAmount;
        config = _config;
        factory = IEscrowFactory(msg.sender);
        
        if (_token != address(0)) {
            token = IERC20(_token);
        }
        
        status = RentalStatus.AWAITING_DEPOSIT;
    }

    function deposit() external payable onlyPayer inStatus(RentalStatus.AWAITING_DEPOSIT) whenNotGlobalPaused {
        if (address(token) == address(0)) {
            require(msg.value == depositAmount, "Incorrect ETH amount");
        } else {
            require(msg.value == 0, "ETH sent for Token escrow");
            token.safeTransferFrom(msg.sender, address(this), depositAmount);
        }

        status = RentalStatus.ACTIVE;
        emit Deposited(msg.sender, depositAmount);
    }

    // Landlord claims damages or full deposit at end of lease
    function claim(uint256 amount, string calldata reason) external onlyPayee inStatus(RentalStatus.ACTIVE) whenNotGlobalPaused {
        require(amount <= depositAmount, "Claim exceeds deposit");
        
        claimAmount = amount;
        claimDeadline = block.timestamp + config.claimWindow;
        status = RentalStatus.CLAIM_PENDING;
        
        emit Claimed(msg.sender, amount, reason);
    }

    // Tenant accepts the claim (or deadline passes - public function could trigger if deadline passed)
    function acceptClaim() external whenNotGlobalPaused {
        // Can be called by Payer to accept explicitly
        // OR by Payee if deadline passed
        
        bool isPayerAccepting = (msg.sender == payer && status == RentalStatus.CLAIM_PENDING);
        bool isDeadlinePassed = (msg.sender == payee && status == RentalStatus.CLAIM_PENDING && block.timestamp > claimDeadline);
        
        require(isPayerAccepting || isDeadlinePassed, "Not authorized or deadline not met");

        _finalize(claimAmount);
    }

    // Tenant disputes the claim
    function disputeClaim() external payable onlyPayer inStatus(RentalStatus.CLAIM_PENDING) whenNotGlobalPaused {
        status = RentalStatus.DISPUTED;
        
        disputeId = 0;
        if (arbitrationAdapter != address(0)) {
             IArbitrationAdapter adapter = IArbitrationAdapter(arbitrationAdapter);
             disputeId = adapter.createDispute{value: msg.value}(address(this), 0, "");
        }
        
        emit DisputeOpened(disputeId);
    }

    // Arbiter resolves split manually
    function resolveDispute(uint256 payeeAmount) public nonReentrant whenNotGlobalPaused {
        require(
            msg.sender == arbiter || msg.sender == address(this),
            "Not authorized"
        );
        require(status == RentalStatus.DISPUTED, "Not disputed");
        require(payeeAmount <= depositAmount, "Amount exceeds deposit");

        _finalize(payeeAmount);
    }

    function rule(uint256, /* disputeId */ uint256 ruling) external override {
        require(msg.sender == arbitrationAdapter, "Not authorized");
        
        // Kleros Ruling: 1 = Payee (Landlord) wins full claim
        // 2 = Payer (Tenant) wins (Claim rejected, refund all)
        // 0 = Refuse/Split? 
        
        uint256 finalToPayee = 0;
        
        if (ruling == 1) {
            finalToPayee = claimAmount;
        } else if (ruling == 2) {
            finalToPayee = 0;
        } else {
            // Ruling 0: Default to blocking claim? ie. Refund tenant.
            finalToPayee = 0;
        }
        
        resolveDispute(finalToPayee);
    }

    // Internal finalize logic
    function _finalize(uint256 toPayee) internal {
        status = RentalStatus.ENDED;
        uint256 toPayer = depositAmount - toPayee;

        if (address(token) == address(0)) {
            if (toPayee > 0) payable(payee).transfer(toPayee);
            if (toPayer > 0) payable(payer).transfer(toPayer);
        } else {
            if (toPayee > 0) token.safeTransfer(payee, toPayee);
            if (toPayer > 0) token.safeTransfer(payer, toPayer);
        }
        
        if (disputeId != 0) {
             emit DisputeResolved(toPayee, toPayer);
        } else {
             emit ClaimAccepted(toPayee, toPayer);
        }
    }
    
    // Fallback: If tenant never claims? There's no "end lease" function in this MVP.
    // Tenant could "claim" 0 to release? No, only Payee claims.
    // We need a way for Payee to release full amount back to Payer if no damages.
    // Payee calls claim(0) -> Tenant accepts -> Refund all.
    // OR: Payee can just refund?
    // Let's add explicit release/refund function for Payee to be nice?
    // For MVP, claim(0) works.
    
    function getStatus() external view returns (RentalStatus) {
        return status;
    }
}
