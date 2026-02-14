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
        address escrowAddr = factory.createEscrow(payee, arbiter, address(adapter), bytes32(0), address(0), config);
        escrow = MilestoneEscrow(escrowAddr);
        assertEq(escrow.payer(), payer);
    }

    function test_AddMilestones() public {
        test_CreateEscrow();
        
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 1 ether;
        amounts[1] = 0.5 ether;
        
        string[] memory descs = new string[](2);
        descs[0] = "Milestone 1";
        descs[1] = "Milestone 2";
        
        uint256[] memory deadlines = new uint256[](2);
        deadlines[0] = block.timestamp + 1 days;
        deadlines[1] = block.timestamp + 2 days;
        
        bytes32[] memory conditions = new bytes32[](2);

        vm.prank(payer);
        escrow.addMilestones(amounts, descs, deadlines, conditions);
        
        assertEq(escrow.getMilestoneCount(), 2);
    }

    function test_FundAll() public {
        test_AddMilestones();
        
        uint256 total = 1.5 ether;
        vm.deal(payer, 10 ether);
        
        vm.prank(payer);
        escrow.fund{value: total}();
        
        assertEq(address(escrow).balance, total);
    }

    function test_RefuntMilestone() public {
        test_FundAll();
        
        uint256 preBalance = payer.balance;
        
        vm.prank(payer);
        escrow.refundMilestone(0);
        
        (,,, IMilestoneEscrow.MilestoneStatus status,,,) = escrow.milestones(0);
        assertEq(uint(status), uint(IMilestoneEscrow.MilestoneStatus.REFUNDED));
    }

    function test_FullRelease() public {
        test_FundAll();
        
        vm.prank(payee);
        escrow.submitDeliverable(0, keccak256("evidence"));
        
        vm.prank(payer);
        escrow.approveMilestone(0);
        
        (,,, IMilestoneEscrow.MilestoneStatus status,,,) = escrow.milestones(0);
        assertEq(uint(status), uint(IMilestoneEscrow.MilestoneStatus.RELEASED));
    }

    function test_Refund() public {
        test_FundAll();
        
        uint256 preBalance = payer.balance;
        
        vm.prank(payer);
        escrow.refundMilestone(0); // Refund milestone 0 (1 ether)
        
        uint256 postBalance = payer.balance;
        assertEq(postBalance - preBalance, 1 ether);
        
        (,,, IMilestoneEscrow.MilestoneStatus status,,,) = escrow.milestones(0);
        assertEq(uint(status), uint(IMilestoneEscrow.MilestoneStatus.REFUNDED));
    }
    
    function test_Dispute() public {
        test_FundAll();
        
        vm.prank(payee);
        escrow.submitDeliverable(0, keccak256("bad_evidence"));
        
        vm.prank(payer);
        // Assuming mock adapter is free or uses msg.value
        escrow.openDispute{value: 0}(0);
        
        (,,, IMilestoneEscrow.MilestoneStatus status,,,) = escrow.milestones(0);
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
        bytes32[] memory conditions = new bytes32[](1);

        vm.prank(payer);
        escrow.addMilestones(amounts, descs, deadlines, conditions);

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
