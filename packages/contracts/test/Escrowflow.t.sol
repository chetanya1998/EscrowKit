// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/EscrowFactory.sol";
import "../src/MilestoneEscrow.sol";
import "../src/MockAdapter.sol";
import "../src/interfaces/IMilestoneEscrow.sol";

contract EscrowFlowTest is Test {
    EscrowFactory factory;
    MockArbitrationAdapter adapter;
    
    address payer = address(0x1);
    address payee = address(0x2);
    address arbiter = address(0x3);
    
    MilestoneEscrow escrow;

    function setUp() public {
        factory = new EscrowFactory();
        adapter = new MockArbitrationAdapter(arbiter);
        
        vm.deal(payer, 100 ether);
    }

    function test_CreateEscrow() public {
        vm.prank(payer);
        IMilestoneEscrow.EscrowConfig memory config = IMilestoneEscrow.EscrowConfig({
            arbitrationFee: 0,
            disputeWindow: 3 days,
            automaticReleaseTime: 14 days
        });
        address escrowAddr = factory.createEscrow(payee, arbiter, address(adapter), bytes32(0), config);
        
        assertTrue(escrowAddr != address(0));
        escrow = MilestoneEscrow(escrowAddr);
        assertEq(escrow.payer(), payer);
        assertEq(escrow.payee(), payee);
    }

    function test_FundAll() public {
        test_CreateEscrow();
        
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 1 ether;
        amounts[1] = 2 ether;
        
        string[] memory descs = new string[](2);
        descs[0] = "Milestone 1";
        descs[1] = "Milestone 2";
        
        uint256[] memory deadlines = new uint256[](2);
        deadlines[0] = block.timestamp + 1 days;
        deadlines[1] = block.timestamp + 2 days;

        vm.prank(payer);
        escrow.addMilestones(amounts, descs, deadlines);
        
        assertEq(escrow.getMilestoneCount(), 2);

        vm.prank(payer);
        escrow.fund{value: 3 ether}();
        
        assertEq(escrow.totalFunded(), 3 ether);
        assertEq(address(escrow).balance, 3 ether);
    }

    function test_SubmitAndApprove() public {
        test_FundAll();

        vm.prank(payee);
        escrow.submitDeliverable(0, keccak256("evidence"));
        
        (,,, IMilestoneEscrow.MilestoneStatus status,,) = escrow.milestones(0);
        assertEq(uint(status), uint(IMilestoneEscrow.MilestoneStatus.SUBMITTED));

        uint256 preBalance = payee.balance;

        vm.prank(payer);
        escrow.approveMilestone(0);
        
        uint256 postBalance = payee.balance;
        assertEq(postBalance - preBalance, 1 ether);
        
        (,,, status,,) = escrow.milestones(0);
        assertEq(uint(status), uint(IMilestoneEscrow.MilestoneStatus.RELEASED));
    }
    
    function test_RefundExpired() public {
        test_FundAll();
        
        // Warp past deadline
        vm.warp(block.timestamp + 1 days + 1);
        
        uint256 preBalance = payer.balance;
        
        vm.prank(payer);
        escrow.refundMilestone(0);
        
        uint256 postBalance = payer.balance;
        assertEq(postBalance - preBalance, 1 ether);
        
        (,,, IMilestoneEscrow.MilestoneStatus status,,) = escrow.milestones(0);
        assertEq(uint(status), uint(IMilestoneEscrow.MilestoneStatus.REFUNDED));
    }
    
    function test_Dispute() public {
        test_FundAll();
        
        vm.prank(payee);
        escrow.submitDeliverable(0, keccak256("bad_evidence"));
        
        vm.prank(payer);
        // Assuming mock adapter is free or uses msg.value
        escrow.openDispute{value: 0}(0);
        
        (,,, IMilestoneEscrow.MilestoneStatus status,,) = escrow.milestones(0);
        assertEq(uint(status), uint(IMilestoneEscrow.MilestoneStatus.DISPUTED));
    }

    function test_UpdateMilestone() public {
        test_CreateEscrow();

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 1 ether;
        string[] memory descs = new string[](1);
        descs[0] = "Original";
        uint256[] memory deadlines = new uint256[](1);
        deadlines[0] = block.timestamp + 1 days;

        vm.prank(payer);
        escrow.addMilestones(amounts, descs, deadlines);

        vm.prank(payer);
        escrow.updateMilestone(0, 2 ether, "Updated", block.timestamp + 2 days);

        IMilestoneEscrow.Milestone memory m = escrow.getMilestone(0);
        assertEq(m.amount, 2 ether);
        assertEq(m.description, "Updated");
        assertEq(m.deadline, block.timestamp + 2 days);

        // Fail if funded
        vm.deal(payer, 5 ether);
        vm.prank(payer);
        escrow.fund{value: 2 ether}();

        vm.expectRevert("Already funded");
        vm.prank(payer);
        escrow.updateMilestone(0, 3 ether, "Late Update", block.timestamp + 3 days);
    }
}
