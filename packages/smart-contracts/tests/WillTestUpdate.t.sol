//SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import {Test} from "forge-std/Test.sol";

import {Will} from "@src/Will.sol";

import {WillState} from "@interfaces/WillState.sol";
import {SMInfo, SMPartialInfo} from "@interfaces/SMInfo.sol";
import {SMState} from "@interfaces/SMState.sol";
import {SecurityPeriodConfig} from "@interfaces/SecurityPeriodConfig.sol";

import "@src/WillErrors.sol" as Errors;

contract WillTestUpdate is Test {
    Will will;

    address pm = makeAddr("pm");
    address sm1 = makeAddr("sm1");
    address sm2 = makeAddr("sm2");
    address sm3 = makeAddr("sm3");
    address sm4 = makeAddr("sm4");
    address sm5 = makeAddr("sm5");

    function setUp() public {
        SMPartialInfo[] memory sms = new SMPartialInfo[](4);
        sms[0] = SMPartialInfo({smAddress: sm1, votePower: 1});
        sms[1] = SMPartialInfo({smAddress: sm2, votePower: 1});
        sms[2] = SMPartialInfo({smAddress: sm3, votePower: 1});
        sms[3] = SMPartialInfo({smAddress: sm4, votePower: 1});
        SecurityPeriodConfig
            memory securityPeriodConfig = SecurityPeriodConfig({
                minSecurityPeriod: 1 days,
                maxSecurityPeriod: 7 days
            });

        vm.deal(pm, 2 ether);
        vm.prank(pm);
        will = new Will{value: 1 ether}(pm, sms, securityPeriodConfig);
    }

    // Updating SM info, state maintained INACTIVE.
    function test_UpdateWill_UpdateSMInfo_StateMaintainedInactive() public {
        SMPartialInfo[] memory smUpdated = new SMPartialInfo[](1);
        smUpdated[0] = SMPartialInfo({smAddress: sm1, votePower: 2});
        vm.prank(pm);
        will.updateWill(
            smUpdated,
            new SMPartialInfo[](0),
            new address[](0),
            SecurityPeriodConfig({minSecurityPeriod: 0, maxSecurityPeriod: 0})
        );

        SMInfo memory sm1Info = will.getDetailedSm(sm1);
        assertEq(uint8(sm1Info.state), uint8(SMState.PENDING));
        assertEq(sm1Info.votePower, 2);
        assertEq(uint8(will.getState()), uint8(WillState.INACTIVE));
        assertEq(will.totalVotePowerS(), 5);
    }

    // Updating SM info, state maintained ACTIVE.
    function test_UpdateWill_UpdateSMInfo_StateMaintainedActive() public {
        SMPartialInfo[] memory smUpdated = new SMPartialInfo[](1);
        smUpdated[0] = SMPartialInfo({smAddress: sm1, votePower: 2});

        // Validate all SMs to make state ACTIVE.
        vm.prank(sm1);
        will.validateSm();
        vm.prank(sm2);
        will.validateSm();
        vm.prank(sm3);
        will.validateSm();
        vm.prank(sm4);
        will.validateSm();

        vm.prank(pm);
        will.updateWill(
            smUpdated,
            new SMPartialInfo[](0),
            new address[](0),
            SecurityPeriodConfig({minSecurityPeriod: 0, maxSecurityPeriod: 0})
        );

        SMInfo memory sm1Info = will.getDetailedSm(sm1);
        assertEq(uint8(sm1Info.state), uint8(SMState.VALIDATED));
        assertEq(sm1Info.votePower, 2);
        assertEq(uint8(will.getState()), uint8(WillState.ACTIVE));
        assertEq(will.totalVotePowerS(), 5);
    }

    // Adding SM, state maintained INACTIVE.
    function test_UpdateWill_AddSM_StateMaintainedInactive() public {
        SMPartialInfo[] memory smAdded = new SMPartialInfo[](1);
        smAdded[0] = SMPartialInfo({smAddress: sm5, votePower: 1});
        vm.prank(pm);
        will.updateWill(
            new SMPartialInfo[](0),
            smAdded,
            new address[](0),
            SecurityPeriodConfig({minSecurityPeriod: 0, maxSecurityPeriod: 0})
        );

        SMInfo memory sm5Info = will.getDetailedSm(sm5);
        assertEq(uint8(sm5Info.state), uint8(SMState.PENDING));
        assertEq(sm5Info.votePower, 1);
        assertEq(uint8(will.getState()), uint8(WillState.INACTIVE));
        assertEq(will.totalVotePowerS(), 5);
    }

    // Adding SM, state becomes INACTIVE.
    function test_UpdateWill_AddSM_StateBecomesInactive() public {
        SMPartialInfo[] memory smAdded = new SMPartialInfo[](1);
        smAdded[0] = SMPartialInfo({smAddress: sm5, votePower: 1});

        // Validate all SMs to make state ACTIVE.
        vm.prank(sm1);
        will.validateSm();
        vm.prank(sm2);
        will.validateSm();
        vm.prank(sm3);
        will.validateSm();
        vm.prank(sm4);
        will.validateSm();

        vm.prank(pm);
        will.updateWill(
            new SMPartialInfo[](0),
            smAdded,
            new address[](0),
            SecurityPeriodConfig({minSecurityPeriod: 0, maxSecurityPeriod: 0})
        );

        SMInfo memory sm5Info = will.getDetailedSm(sm5);
        assertEq(uint8(sm5Info.state), uint8(SMState.PENDING));
        assertEq(sm5Info.votePower, 1);
        assertEq(uint8(will.getState()), uint8(WillState.INACTIVE));
        assertEq(will.totalVotePowerS(), 5);
    }

    // Deleting SM, state INACTIVE.
    function test_UpdateWill_DeleteSM_StateMaintainedInactive() public {
        address[] memory smDeleted = new address[](1);
        smDeleted[0] = sm4;
        vm.prank(pm);
        will.updateWill(
            new SMPartialInfo[](0),
            new SMPartialInfo[](0),
            smDeleted,
            SecurityPeriodConfig({minSecurityPeriod: 0, maxSecurityPeriod: 0})
        );

        vm.expectRevert(Errors.ERR_SMDoesNotExist.selector);
        will.getDetailedSm(sm4);
        assertEq(uint8(will.getState()), uint8(WillState.INACTIVE));
        assertEq(will.totalVotePowerS(), 3);
    }

    // Deleting SM, state ACTIVE.
    function test_UpdateWill_DeleteSM_StateMaintainedActive() public {
        address[] memory smDeleted = new address[](1);
        smDeleted[0] = sm4;

        // Validate all SMs to make state ACTIVE.
        vm.prank(sm1);
        will.validateSm();
        vm.prank(sm2);
        will.validateSm();
        vm.prank(sm3);
        will.validateSm();
        vm.prank(sm4);
        will.validateSm();

        vm.prank(pm);
        will.updateWill(
            new SMPartialInfo[](0),
            new SMPartialInfo[](0),
            smDeleted,
            SecurityPeriodConfig({minSecurityPeriod: 0, maxSecurityPeriod: 0})
        );

        vm.expectRevert(Errors.ERR_SMDoesNotExist.selector);
        will.getDetailedSm(sm4);
        assertEq(uint8(will.getState()), uint8(WillState.ACTIVE));
        assertEq(will.totalVotePowerS(), 3);
    }

    // Update security period + state maintained.
    function test_UpdateWill_UpdateSecurityPeriod_StateMaintained() public {
        SecurityPeriodConfig
            memory newSecurityPeriodConfig = SecurityPeriodConfig({
                minSecurityPeriod: 2 days,
                maxSecurityPeriod: 10 days
            });

        vm.prank(pm);
        will.updateWill(
            new SMPartialInfo[](0),
            new SMPartialInfo[](0),
            new address[](0),
            newSecurityPeriodConfig
        );

        SecurityPeriodConfig memory securityPeriodConfig = will
            .getSecurityPeriodConfig();
        assertEq(securityPeriodConfig.minSecurityPeriod, 2 days);
        assertEq(securityPeriodConfig.maxSecurityPeriod, 10 days);
        assertEq(uint8(will.getState()), uint8(WillState.INACTIVE));
    }
    // Update + Add + Delete + Security Period, state INACTIVE.
    function test_UpdateWill_UpdateAddDeleteSMAndSecurityPeriod_StateMaintainedInactive()
        public
    {
        SMPartialInfo[] memory smUpdated = new SMPartialInfo[](1);
        smUpdated[0] = SMPartialInfo({smAddress: sm1, votePower: 2});

        SMPartialInfo[] memory smAdded = new SMPartialInfo[](1);
        smAdded[0] = SMPartialInfo({smAddress: sm5, votePower: 1});

        address[] memory smDeleted = new address[](1);
        smDeleted[0] = sm4;

        SecurityPeriodConfig
            memory newSecurityPeriodConfig = SecurityPeriodConfig({
                minSecurityPeriod: 2 days,
                maxSecurityPeriod: 10 days
            });

        vm.prank(pm);
        will.updateWill(smUpdated, smAdded, smDeleted, newSecurityPeriodConfig);

        // Updated SM1.
        SMInfo memory sm1Info = will.getDetailedSm(sm1);
        assertEq(uint8(sm1Info.state), uint8(SMState.PENDING));
        assertEq(sm1Info.votePower, 2);

        // Added SM5.
        SMInfo memory sm5Info = will.getDetailedSm(sm5);
        assertEq(uint8(sm5Info.state), uint8(SMState.PENDING));
        assertEq(sm5Info.votePower, 1);

        // Deleted SM4.
        vm.expectRevert(Errors.ERR_SMDoesNotExist.selector);
        will.getDetailedSm(sm4);

        // Security Period Updated.
        SecurityPeriodConfig memory securityPeriodConfig = will
            .getSecurityPeriodConfig();
        assertEq(securityPeriodConfig.minSecurityPeriod, 2 days);
        assertEq(securityPeriodConfig.maxSecurityPeriod, 10 days);

        // State Maintained INACTIVE.
        assertEq(uint8(will.getState()), uint8(WillState.INACTIVE));
    }

    // Update + Delete + Security Period, state ACTIVE.
    function test_UpdateWill_UpdateDeleteSMAndSecurityPeriod_StateMaintainedActive()
        public
    {
        SMPartialInfo[] memory smUpdated = new SMPartialInfo[](1);
        smUpdated[0] = SMPartialInfo({smAddress: sm1, votePower: 2});

        address[] memory smDeleted = new address[](1);
        smDeleted[0] = sm4;

        SecurityPeriodConfig
            memory newSecurityPeriodConfig = SecurityPeriodConfig({
                minSecurityPeriod: 2 days,
                maxSecurityPeriod: 10 days
            });

        // Validate all SMs to make state ACTIVE.
        vm.prank(sm1);
        will.validateSm();
        vm.prank(sm2);
        will.validateSm();
        vm.prank(sm3);
        will.validateSm();
        vm.prank(sm4);
        will.validateSm();

        vm.prank(pm);
        will.updateWill(
            smUpdated,
            new SMPartialInfo[](0),
            smDeleted,
            newSecurityPeriodConfig
        );

        // Updated SM1.
        SMInfo memory sm1Info = will.getDetailedSm(sm1);
        assertEq(uint8(sm1Info.state), uint8(SMState.VALIDATED));
        assertEq(sm1Info.votePower, 2);

        // Deleted SM4.
        vm.expectRevert(Errors.ERR_SMDoesNotExist.selector);
        will.getDetailedSm(sm4);

        // Security Period Updated.
        SecurityPeriodConfig memory securityPeriodConfig = will
            .getSecurityPeriodConfig();
        assertEq(securityPeriodConfig.minSecurityPeriod, 2 days);
        assertEq(securityPeriodConfig.maxSecurityPeriod, 10 days);

        // State Maintained ACTIVE.
        assertEq(uint8(will.getState()), uint8(WillState.ACTIVE));
    }
}

contract WillTestInvalidUpdate is Test {
    Will will;

    address pm = makeAddr("pm");
    address sm1 = makeAddr("sm1");
    address sm2 = makeAddr("sm2");
    address sm3 = makeAddr("sm3");
    address sm4 = makeAddr("sm4");
    address sm5 = makeAddr("sm5");

    // Not PM.
    function setUp() public {
        SMPartialInfo[] memory sms = new SMPartialInfo[](4);
        sms[0] = SMPartialInfo({smAddress: sm1, votePower: 1});
        sms[1] = SMPartialInfo({smAddress: sm2, votePower: 1});
        sms[2] = SMPartialInfo({smAddress: sm3, votePower: 1});
        sms[3] = SMPartialInfo({smAddress: sm4, votePower: 1});
        SecurityPeriodConfig
            memory securityPeriodConfig = SecurityPeriodConfig({
                minSecurityPeriod: 1 days,
                maxSecurityPeriod: 7 days
            });

        vm.deal(pm, 2 ether);
        vm.prank(pm);
        will = new Will{value: 1 ether}(pm, sms, securityPeriodConfig);
    }

    // Will Canceled.
    function test_UpdateWill_WillCanceled() public {
        vm.prank(pm);
        will.cancelWill();

        vm.prank(pm);
        vm.expectRevert(Errors.ERR_WillCanceled.selector);
        will.updateWill(
            new SMPartialInfo[](0),
            new SMPartialInfo[](0),
            new address[](0),
            SecurityPeriodConfig({minSecurityPeriod: 0, maxSecurityPeriod: 0})
        );
    }

    // Will Executed.
    function test_UpdateWill_WillExecuted() public {
        // Validate all SMs to make state ACTIVE.
        vm.prank(sm1);
        will.validateSm();
        vm.prank(sm2);
        will.validateSm();
        vm.prank(sm3);
        will.validateSm();
        vm.prank(sm4);
        will.validateSm();

        vm.prank(sm1);
        will.declareDeath();

        // Fast forward time to after security period.
        vm.warp(block.timestamp + 8 days);

        vm.prank(sm1);
        will.swapAssets();

        vm.prank(pm);
        vm.expectRevert(Errors.ERR_WillExecuted.selector);
        will.updateWill(
            new SMPartialInfo[](0),
            new SMPartialInfo[](0),
            new address[](0),
            SecurityPeriodConfig({minSecurityPeriod: 0, maxSecurityPeriod: 0})
        );
    }

    // ExecutionTimePassed.
    function test_UpdateWill_ExecutionTimePassed() public {
        // Validate all SMs to make state ACTIVE.
        vm.prank(sm1);
        will.validateSm();
        vm.prank(sm2);
        will.validateSm();
        vm.prank(sm3);
        will.validateSm();
        vm.prank(sm4);
        will.validateSm();

        vm.prank(sm1);
        will.declareDeath();

        // Fast forward time to after security period.
        vm.warp(block.timestamp + 8 days);

        vm.prank(pm);
        vm.expectRevert(Errors.ERR_WillExecuted.selector);
        will.updateWill(
            new SMPartialInfo[](0),
            new SMPartialInfo[](0),
            new address[](0),
            SecurityPeriodConfig({minSecurityPeriod: 0, maxSecurityPeriod: 0})
        );
    }

    // SecurityPeriodStarted.
    function test_UpdateWill_SecurityPeriodStarted() public {
        // Validate all SMs to make state ACTIVE.
        vm.prank(sm1);
        will.validateSm();
        vm.prank(sm2);
        will.validateSm();
        vm.prank(sm3);
        will.validateSm();
        vm.prank(sm4);
        will.validateSm();

        vm.prank(sm1);
        will.declareDeath();

        vm.prank(pm);
        vm.expectRevert(Errors.ERR_SecurityPeriodStarted.selector);
        will.updateWill(
            new SMPartialInfo[](0),
            new SMPartialInfo[](0),
            new address[](0),
            SecurityPeriodConfig({minSecurityPeriod: 0, maxSecurityPeriod: 0})
        );
    }

    // InvalidSecurityPeriod.
    function test_UpdateWill_InvalidSecurityPeriod() public {
        SecurityPeriodConfig
            memory newSecurityPeriodConfig = SecurityPeriodConfig({
                minSecurityPeriod: 10 days,
                maxSecurityPeriod: 2 days
            });

        vm.prank(pm);
        vm.expectRevert(Errors.ERR_InvalidSecurityPeriods.selector);
        will.updateWill(
            new SMPartialInfo[](0),
            new SMPartialInfo[](0),
            new address[](0),
            newSecurityPeriodConfig
        );
    }

    // Updated + Added > 255.
    function test_UpdateWill_TooManySMsFinal() public {
        SMPartialInfo[] memory smUpdated = new SMPartialInfo[](1);
        smUpdated[0] = SMPartialInfo({smAddress: sm1, votePower: 2});

        SMPartialInfo[] memory smAdded = new SMPartialInfo[](252);
        for (uint256 i = 0; i < 252; i++) {
            smAdded[i] = SMPartialInfo({
                // casting to 'uint160' is safe because never more than 253, far from uint160 limit.
                // forge-lint: disable-next-line(unsafe-typecast)
                smAddress: address(uint160(i + 1)),
                votePower: 1
            });
        }

        vm.prank(pm);
        vm.expectRevert(Errors.ERR_SMListsFinalResultTooManySM.selector);
        will.updateWill(
            smUpdated,
            smAdded,
            new address[](0),
            SecurityPeriodConfig({minSecurityPeriod: 0, maxSecurityPeriod: 0})
        );
    }

    // Deleted + 1 >= smLists.length + addedSmList.length. Can't have one SM left or less.
    function test_UpdateWill_TooManySMsFinalDeleted() public {
        address[] memory smDeleted = new address[](4);
        smDeleted[0] = sm1;
        smDeleted[1] = sm2;
        smDeleted[2] = sm3;

        vm.prank(pm);
        vm.expectRevert(Errors.ERR_SMListsFinalResultIncoherent.selector);
        will.updateWill(
            new SMPartialInfo[](0),
            new SMPartialInfo[](0),
            smDeleted,
            SecurityPeriodConfig({minSecurityPeriod: 0, maxSecurityPeriod: 0})
        );
    }

    // Updated sm no exist.
    function test_UpdateWill_UpdatedSMNoExist() public {
        SMPartialInfo[] memory smUpdated = new SMPartialInfo[](1);
        smUpdated[0] = SMPartialInfo({smAddress: sm5, votePower: 2});

        vm.prank(pm);
        vm.expectRevert(Errors.ERR_UpdatedSMDoesNotExist.selector);
        will.updateWill(
            smUpdated,
            new SMPartialInfo[](0),
            new address[](0),
            SecurityPeriodConfig({minSecurityPeriod: 0, maxSecurityPeriod: 0})
        );
    }

    // Updated sm vote power not good.
    function test_UpdateWill_UpdatedSMInvalidVotePower() public {
        SMPartialInfo[] memory smUpdated = new SMPartialInfo[](1);
        smUpdated[0] = SMPartialInfo({smAddress: sm1, votePower: 0});

        vm.prank(pm);
        vm.expectRevert(Errors.ERR_SMVotePowerInvalid.selector);
        will.updateWill(
            smUpdated,
            new SMPartialInfo[](0),
            new address[](0),
            SecurityPeriodConfig({minSecurityPeriod: 0, maxSecurityPeriod: 0})
        );
    }

    // Deleted sm doesn't exist.
    function test_UpdateWill_DeletedSMNoExist() public {
        address[] memory smDeleted = new address[](1);
        smDeleted[0] = sm5;

        vm.prank(pm);
        vm.expectRevert(Errors.ERR_DeletedSMDoesNotExist.selector);
        will.updateWill(
            new SMPartialInfo[](0),
            new SMPartialInfo[](0),
            smDeleted,
            SecurityPeriodConfig({minSecurityPeriod: 0, maxSecurityPeriod: 0})
        );
    }

    // New SM already exists.
    function test_UpdateWill_AddedSMAlreadyExists() public {
        SMPartialInfo[] memory smAdded = new SMPartialInfo[](1);
        smAdded[0] = SMPartialInfo({smAddress: sm1, votePower: 1});

        vm.prank(pm);
        vm.expectRevert(Errors.ERR_CreatedSMExistsAlready.selector);
        will.updateWill(
            new SMPartialInfo[](0),
            smAdded,
            new address[](0),
            SecurityPeriodConfig({minSecurityPeriod: 0, maxSecurityPeriod: 0})
        );
    }

    // New SM is PM.
    function test_UpdateWill_AddedSMIsPM() public {
        SMPartialInfo[] memory smAdded = new SMPartialInfo[](1);
        smAdded[0] = SMPartialInfo({smAddress: pm, votePower: 1});

        vm.prank(pm);
        vm.expectRevert(Errors.ERR_PMIsSM.selector);
        will.updateWill(
            new SMPartialInfo[](0),
            smAdded,
            new address[](0),
            SecurityPeriodConfig({minSecurityPeriod: 0, maxSecurityPeriod: 0})
        );
    }

    // New SM has invalid vote power.
    function test_UpdateWill_AddedSMInvalidVotePower() public {
        SMPartialInfo[] memory smAdded = new SMPartialInfo[](1);
        smAdded[0] = SMPartialInfo({smAddress: sm5, votePower: 0});

        vm.prank(pm);
        vm.expectRevert(Errors.ERR_SMVotePowerInvalid.selector);
        will.updateWill(
            new SMPartialInfo[](0),
            smAdded,
            new address[](0),
            SecurityPeriodConfig({minSecurityPeriod: 0, maxSecurityPeriod: 0})
        );
    }

    // Updated + Addedd duplicates.
    function test_UpdateWill_Duplicates() public {
        SMPartialInfo[] memory smUpdated = new SMPartialInfo[](1);
        smUpdated[0] = SMPartialInfo({smAddress: sm1, votePower: 2});

        SMPartialInfo[] memory smAdded = new SMPartialInfo[](1);
        smAdded[0] = SMPartialInfo({smAddress: sm1, votePower: 1});

        // Updated + Added duplicates.
        vm.prank(pm);
        vm.expectRevert(Errors.ERR_DuplicateSM.selector);
        will.updateWill(
            smUpdated,
            smAdded,
            new address[](0),
            SecurityPeriodConfig({minSecurityPeriod: 0, maxSecurityPeriod: 0})
        );
    }

    // Updated + Deleted duplicates.
    function test_UpdateWill_UpdatedDeletedDuplicates() public {
        SMPartialInfo[] memory smUpdated = new SMPartialInfo[](1);
        smUpdated[0] = SMPartialInfo({smAddress: sm1, votePower: 2});

        address[] memory smDeleted = new address[](1);
        smDeleted[0] = sm1;

        // Updated + Deleted duplicates.
        vm.prank(pm);
        vm.expectRevert(Errors.ERR_DuplicateSM.selector);
        will.updateWill(
            smUpdated,
            new SMPartialInfo[](0),
            smDeleted,
            SecurityPeriodConfig({minSecurityPeriod: 0, maxSecurityPeriod: 0})
        );
    }

    // Added + Deleted duplicates.
    function test_UpdateWill_AddedDeletedDuplicates() public {
        SMPartialInfo[] memory smAdded = new SMPartialInfo[](1);
        smAdded[0] = SMPartialInfo({smAddress: sm5, votePower: 1});

        address[] memory smDeleted = new address[](1);
        smDeleted[0] = sm5;

        // Added + Deleted duplicates.
        vm.prank(pm);
        vm.expectRevert(Errors.ERR_DuplicateSM.selector);
        will.updateWill(
            new SMPartialInfo[](0),
            smAdded,
            smDeleted,
            SecurityPeriodConfig({minSecurityPeriod: 0, maxSecurityPeriod: 0})
        );
    }
}
