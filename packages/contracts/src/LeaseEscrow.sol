// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/ILeaseEscrow.sol";
import "./interfaces/IArbitrationAdapter.sol";
import "./interfaces/IEscrowFactory.sol";

contract LeaseEscrow is
    Initializable,
    ILeaseEscrow,
    ReentrancyGuard
{
    using SafeERC20 for IERC20;

    address public lessee; // Depositor
    address public lessor; // Beneficiary
    address public arbiter;
    address public arbitrationAdapter;
    IERC20 public token; // address(0) for ETH

    LeaseConfig public config;
    IEscrowFactory public factory;

    LeaseStatus public status;
    uint256 public disputeId;
    
    uint256 public currentPeriod;
    uint256 public leaseStartTime;
    uint256 public totalDeposited;

    modifier onlyLessee() {
        require(msg.sender == lessee, "Not lessee");
        _;
    }

    modifier onlyLessor() {
        require(msg.sender == lessor, "Not lessor");
        _;
    }

    modifier inStatus(LeaseStatus _status) {
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
        address _lessee,
        address _lessor,
        address _arbiter,
        address _arbitrationAdapter,
        address _token,
        LeaseConfig calldata _config
    ) external initializer {
        require(_lessee != address(0), "Invalid lessee");
        require(_lessor != address(0), "Invalid lessor");
        require(_config.totalPeriods > 0, "Invalid periods");
        require(_config.amountPerPeriod > 0, "Invalid amount");

        lessee = _lessee;
        lessor = _lessor;
        arbiter = _arbiter;
        arbitrationAdapter = _arbitrationAdapter;
        config = _config;
        factory = IEscrowFactory(msg.sender);
        
        if (_token != address(0)) {
            token = IERC20(_token);
        }
        
        status = LeaseStatus.AWAITING_DEPOSIT;
        currentPeriod = 0;
    }

    // Usually, large leases require collateral or multi-period upfront deposits. 
    // Here we assume funding the full lease or at least N periods.
    function deposit() external payable onlyLessee inStatus(LeaseStatus.AWAITING_DEPOSIT) whenNotGlobalPaused {
        uint256 expectedTotal = config.totalPeriods * config.amountPerPeriod;
        
        if (address(token) == address(0)) {
            require(msg.value == expectedTotal, "Incorrect ETH amount");
        } else {
            require(msg.value == 0, "ETH sent for Token escrow");
            token.safeTransferFrom(msg.sender, address(this), expectedTotal);
        }

        totalDeposited = expectedTotal;
        leaseStartTime = block.timestamp;
        status = LeaseStatus.ACTIVE;
        
        emit Deposited(msg.sender, expectedTotal);
    }

    // Lessor claims the payment for the current period once it has elapsed
    function claimPeriodPayment() external onlyLessor inStatus(LeaseStatus.ACTIVE) nonReentrant whenNotGlobalPaused {
        require(currentPeriod < config.totalPeriods, "Lease finished");
        
        // Wait until at least 1 period has passed to claim the first payment (or change logic if upfront)
        // If claiming at the END of a period:
        uint256 targetTime = leaseStartTime + ((currentPeriod + 1) * config.periodDuration);
        
        require(block.timestamp >= targetTime, "Period not eligible yet");

        currentPeriod++;
        
        if (address(token) == address(0)) {
            payable(lessor).transfer(config.amountPerPeriod);
        } else {
            token.safeTransfer(lessor, config.amountPerPeriod);
        }

        emit PeriodClaimed(currentPeriod, config.amountPerPeriod);
        
        if (currentPeriod == config.totalPeriods) {
            status = LeaseStatus.ENDED;
            emit LeaseTerminated();
        }
    }

    // Lessee can open a dispute if equipment is damaged, etc.
    function disputeLease() external payable onlyLessee inStatus(LeaseStatus.ACTIVE) whenNotGlobalPaused {
        status = LeaseStatus.DISPUTED;
        
        disputeId = 0;
        if (arbitrationAdapter != address(0)) {
             IArbitrationAdapter adapter = IArbitrationAdapter(arbitrationAdapter);
             disputeId = adapter.createDispute{value: msg.value}(address(this), 0, "");
        }
        
        emit DisputeOpened(disputeId);
    }

    // Arbiter resolves dispute, dividing remaining funds
    function resolveDispute(uint256 lessorAmount) public nonReentrant whenNotGlobalPaused {
        require(
            msg.sender == arbiter || msg.sender == address(this),
            "Not authorized"
        );
        require(status == LeaseStatus.DISPUTED, "Not disputed");
        
        uint256 remainingFunds = totalDeposited - (currentPeriod * config.amountPerPeriod);
        require(lessorAmount <= remainingFunds, "Exceeds balance");

        status = LeaseStatus.ENDED;
        uint256 lesseeAmount = remainingFunds - lessorAmount;

        if (address(token) == address(0)) {
            if (lessorAmount > 0) payable(lessor).transfer(lessorAmount);
            if (lesseeAmount > 0) payable(lessee).transfer(lesseeAmount);
        } else {
            if (lessorAmount > 0) token.safeTransfer(lessor, lessorAmount);
            if (lesseeAmount > 0) token.safeTransfer(lessee, lesseeAmount);
        }

        emit DisputeResolved(lessorAmount, lesseeAmount);
        emit LeaseTerminated();
    }

    function rule(uint256, /* disputeId */ uint256 ruling) external override {
        require(msg.sender == arbitrationAdapter, "Not authorized");
        
        uint256 remainingFunds = totalDeposited - (currentPeriod * config.amountPerPeriod);
        uint256 finalToLessor = 0;
        
        if (ruling == 1) { // Lessor wins
            finalToLessor = remainingFunds;
        } else if (ruling == 2) { // Lessee wins, refund remaining
            finalToLessor = 0;
        }
        
        resolveDispute(finalToLessor);
    }
}
