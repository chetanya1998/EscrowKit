// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/B2BVendorEscrow.sol";
import "../src/interfaces/IB2BVendorEscrow.sol";
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

contract B2BVendorEscrowTest is Test {
    B2BVendorEscrow public escrow;
    MockERC20 public token;
    MockFactory public factory;

    address public buyer = address(1);
    address public vendor = address(2);
    address public arbiter = address(3);
    
    uint256 public depositAmount = 1000 * 10**18;
    uint256 public deadline = block.timestamp + 30 days;

    function setUp() public {
        token = new MockERC20();
        factory = new MockFactory();
        
        // Give buyer some ETH and tokens
        vm.deal(buyer, 100 ether);
        token.transfer(buyer, depositAmount * 2);

        // Deploy B2B Vendor Escrow
        vm.startPrank(address(factory));
        
        B2BVendorEscrow impl = new B2BVendorEscrow();
        
        IB2BVendorEscrow.B2BConfig memory config = IB2BVendorEscrow.B2BConfig({
            arbitrationFeeBps: 500,
            paymentTermDays: 30,
            payeePenaltyBps: 0
        });

        bytes memory data = abi.encodeCall(
            B2BVendorEscrow.initialize,
            (
                buyer,
                vendor,
                arbiter,
                address(0), // No arbitration adapter
                address(token),
                depositAmount,
                deadline,
                config
            )
        );
        
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), data);
        escrow = B2BVendorEscrow(address(proxy));
        
        vm.stopPrank();
    }

    function test_InitialState() public {
        assertEq(escrow.buyer(), buyer);
        assertEq(escrow.vendor(), vendor);
        assertEq(uint256(escrow.status()), uint256(IB2BVendorEscrow.EscrowStatus.PENDING));
    }

    function test_Fund() public {
        vm.startPrank(buyer);
        token.approve(address(escrow), depositAmount);
        escrow.fund();
        vm.stopPrank();

        assertEq(uint256(escrow.status()), uint256(IB2BVendorEscrow.EscrowStatus.FUNDED));
        assertEq(token.balanceOf(address(escrow)), depositAmount);
    }

    function test_SubmitInvoiceAndApprove() public {
        // Fund
        vm.startPrank(buyer);
        token.approve(address(escrow), depositAmount);
        escrow.fund();
        vm.stopPrank();

        // Submit Invoice
        vm.startPrank(vendor);
        string memory invoiceURI = "ipfs://Qm...";
        bytes32 invoiceHash = keccak256("Invoice Data");
        escrow.submitInvoice(invoiceURI, invoiceHash);
        vm.stopPrank();

        assertEq(uint256(escrow.status()), uint256(IB2BVendorEscrow.EscrowStatus.SUBMITTED));
        assertEq(escrow.invoiceURI(), invoiceURI);
        assertEq(escrow.invoiceHash(), invoiceHash);

        // Approve
        vm.startPrank(buyer);
        escrow.approvePayment();
        vm.stopPrank();

        assertEq(uint256(escrow.status()), uint256(IB2BVendorEscrow.EscrowStatus.RELEASED));
        assertEq(token.balanceOf(vendor), depositAmount);
    }

    function test_AutoReleaseTerms() public {
        // Fund
        vm.startPrank(buyer);
        token.approve(address(escrow), depositAmount);
        escrow.fund();
        vm.stopPrank();

        // Submit Invoice
        vm.startPrank(vendor);
        string memory invoiceURI = "ipfs://Qm...";
        bytes32 invoiceHash = keccak256("Invoice Data");
        escrow.submitInvoice(invoiceURI, invoiceHash);
        vm.stopPrank();

        // Try autoRelease before 30 days
        vm.startPrank(vendor);
        vm.warp(block.timestamp + 15 days);
        vm.expectRevert("Payment term not over");
        escrow.autoRelease();
        vm.stopPrank();

        // Try autoRelease after 30 days
        vm.startPrank(vendor);
        vm.warp(block.timestamp + 31 days);
        escrow.autoRelease();
        vm.stopPrank();

        assertEq(uint256(escrow.status()), uint256(IB2BVendorEscrow.EscrowStatus.RELEASED));
        assertEq(token.balanceOf(vendor), depositAmount);
    }
}
