// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ServiceEscrow.sol";
import "../src/interfaces/IServiceEscrow.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("Mock", "MCK") {
        _mint(msg.sender, 1000000 * 10**18);
    }
}

contract MockFactory {
    function isFactoryPaused() external pure returns (bool) {
        return false;
    }
}

contract ServiceEscrowTest is Test {
    ServiceEscrow public escrow;
    MockERC20 public token;
    MockFactory public factory;

    address public buyer = address(1);
    address public provider = address(2);
    address public arbiter = address(3);
    
    uint256 public depositAmount = 1000 * 10**18;
    uint256 public deadline = block.timestamp + 7 days;

    function setUp() public {
        token = new MockERC20();
        factory = new MockFactory();
        
        // Give buyer some ETH and tokens
        vm.deal(buyer, 100 ether);
        token.transfer(buyer, depositAmount * 2);

        // Deploy Service Escrow
        vm.startPrank(address(factory));
        
        ServiceEscrow impl = new ServiceEscrow();
        
        IServiceEscrow.ServiceConfig memory config = IServiceEscrow.ServiceConfig({
            arbitrationFeeBps: 500,
            reviewPeriod: 3 days,
            payeePenaltyBps: 100
        });

        bytes memory data = abi.encodeCall(
            ServiceEscrow.initialize,
            (
                buyer,
                provider,
                arbiter,
                address(0), // No arbitration adapter
                address(token),
                depositAmount,
                deadline,
                config
            )
        );
        
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), data);
        escrow = ServiceEscrow(address(proxy));
        
        vm.stopPrank();
    }

    function test_InitialState() public {
        assertEq(escrow.buyer(), buyer);
        assertEq(escrow.provider(), provider);
        assertEq(uint256(escrow.status()), uint256(IServiceEscrow.ServiceStatus.PENDING));
    }

    function test_Fund() public {
        vm.startPrank(buyer);
        token.approve(address(escrow), depositAmount);
        escrow.fund();
        vm.stopPrank();

        assertEq(uint256(escrow.status()), uint256(IServiceEscrow.ServiceStatus.FUNDED));
        assertEq(token.balanceOf(address(escrow)), depositAmount);
    }

    function test_SubmitAndApprove() public {
        // Fund
        vm.startPrank(buyer);
        token.approve(address(escrow), depositAmount);
        escrow.fund();
        vm.stopPrank();

        // Submit
        vm.startPrank(provider);
        bytes32 mockHash = keccak256("Deliverable");
        escrow.submitService(mockHash);
        vm.stopPrank();

        assertEq(uint256(escrow.status()), uint256(IServiceEscrow.ServiceStatus.SUBMITTED));
        assertEq(escrow.deliverableHash(), mockHash);

        // Approve
        vm.startPrank(buyer);
        escrow.approveService();
        vm.stopPrank();

        assertEq(uint256(escrow.status()), uint256(IServiceEscrow.ServiceStatus.RELEASED));
        assertEq(token.balanceOf(provider), depositAmount); // Should get everything, no penalty since not late
    }
}
