// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/LeaseEscrow.sol";
import "../src/interfaces/ILeaseEscrow.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract MockFactory {
    function isFactoryPaused() external pure returns (bool) {
        return false;
    }
}

contract LeaseEscrowTest is Test {
    LeaseEscrow public escrow;
    MockFactory public factory;

    address public lessee = address(1);
    address public lessor = address(2);
    address public arbiter = address(3);
    
    uint256 public amountPerPeriod = 1 ether;
    uint256 public totalPeriods = 12;

    function setUp() public {
        factory = new MockFactory();
        vm.deal(lessee, 20 ether);

        vm.startPrank(address(factory));
        
        LeaseEscrow impl = new LeaseEscrow();
        
        ILeaseEscrow.LeaseConfig memory config = ILeaseEscrow.LeaseConfig({
            totalPeriods: totalPeriods,
            periodDuration: 30 days,
            amountPerPeriod: amountPerPeriod,
            arbitrationFeeBps: 500
        });

        bytes memory data = abi.encodeCall(
            LeaseEscrow.initialize,
            (
                lessee,
                lessor,
                arbiter,
                address(0),
                address(0), // Use ETH
                config
            )
        );
        
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), data);
        escrow = LeaseEscrow(address(proxy));
        
        vm.stopPrank();
    }

    function test_InitialState() public {
        assertEq(uint256(escrow.status()), uint256(ILeaseEscrow.LeaseStatus.AWAITING_DEPOSIT));
        assertEq(escrow.lessee(), lessee);
        assertEq(escrow.lessor(), lessor);
    }

    function test_DepositAndClaim() public {
        vm.startPrank(lessee);
        escrow.deposit{value: 12 ether}();
        vm.stopPrank();

        assertEq(uint256(escrow.status()), uint256(ILeaseEscrow.LeaseStatus.ACTIVE));
        assertEq(address(escrow).balance, 12 ether);

        // Attempt early claim (should fail)
        vm.startPrank(lessor);
        vm.expectRevert("Period not eligible yet");
        escrow.claimPeriodPayment();

        // Fast forward 30 days
        skip(30 days);
        
        escrow.claimPeriodPayment();
        vm.stopPrank();

        assertEq(escrow.currentPeriod(), 1);
        assertEq(lessor.balance, 1 ether);
        assertEq(address(escrow).balance, 11 ether);
    }
}
