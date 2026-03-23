//SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import {Test} from "forge-std/Test.sol";

import {Will} from "@src/Will.sol";

import {WillState} from "@interfaces/WillState.sol";
import {SMInfo, SMPartialInfo} from "@interfaces/SMInfo.sol";
import {SMState} from "@interfaces/SMState.sol";
import {SecurityPeriodConfig} from "@interfaces/SecurityPeriodConfig.sol";

import "@src/WillErrors.sol" as Errors;

contract WillTestSmParticipation is Test {
    Will will;

    address pm = makeAddr("pm");
    address sm1 = makeAddr("sm1");
    address sm2 = makeAddr("sm2");

    function setUp() public {
        SMPartialInfo[] memory sms = new SMPartialInfo[](2);
        sms[0] = SMPartialInfo({smAddress: sm1, votePower: 1});
        sms[1] = SMPartialInfo({smAddress: sm2, votePower: 1});
        SecurityPeriodConfig
            memory securityPeriodConfig = SecurityPeriodConfig({
                minSecurityPeriod: 1 days,
                maxSecurityPeriod: 2 days
            });

        vm.prank(pm);
        will = new Will(pm, sms, securityPeriodConfig);
    }

    // first SM validates.
    function test_ValidateSm_FirstSm() public {
        vm.prank(sm1);
        will.validateSm();

        SMInfo memory smInfo1 = will.getDetailedSm(sm1);
        assertEq(uint8(smInfo1.state), uint8(SMState.VALIDATED));
        assertEq(smInfo1.votePower, 1);
        assertEq(smInfo1.index, 1);
        assertEq(uint8(will.getState()), uint8(WillState.INACTIVE));
    }

    // last SM validates, state becomes ACTIVE.
    function test_ValidateSm_LastSm() public {
        vm.prank(sm1);
        will.validateSm();
        SMInfo memory smInfo1 = will.getDetailedSm(sm1);
        assertEq(uint8(smInfo1.state), uint8(SMState.VALIDATED));
        assertEq(smInfo1.votePower, 1);
        assertEq(smInfo1.index, 1);

        vm.prank(sm2);
        will.validateSm();
        SMInfo memory smInfo2 = will.getDetailedSm(sm2);
        assertEq(uint8(smInfo2.state), uint8(SMState.VALIDATED));
        assertEq(smInfo2.votePower, 1);
        assertEq(smInfo2.index, 2);

        assertEq(uint8(will.getState()), uint8(WillState.ACTIVE));
    }

    // First sm desists before declare.
    function test_DesistSm_FirstSm() public {
        vm.prank(sm1);
        will.validateSm();

        vm.prank(sm2);
        will.validateSm();

        vm.prank(sm1);
        will.desistSm();

        vm.expectRevert(Errors.ERR_SMDoesNotExist.selector);
        will.getDetailedSm(sm1);
    }

    // Last desists, final_state CANCELED, withdrawn funds.
    function test_DesistSm_LastSm() public {
        vm.prank(sm1);
        will.validateSm();

        vm.prank(sm2);
        will.validateSm();

        vm.deal(pm, 1 ether);
        vm.prank(pm);
        will.deposit{value: 1 ether}();
        assertEq(pm.balance, 0 ether);

        vm.prank(sm1);
        will.desistSm();

        vm.prank(sm2);
        will.desistSm();

        assertEq(uint8(will.getState()), uint8(WillState.CANCELED));
        assertEq(pm.balance, 1 ether);
    }

    // SM desists, only one that declared.
    function test_DesistSm_OnlyDeclarer() public {
        vm.prank(sm1);
        will.validateSm();

        vm.prank(sm2);
        will.validateSm();

        vm.prank(sm1);
        will.declareDeath();
        assertEq(will.deathDeclarationTimestampS(), block.timestamp);
        assertGt(will.deathDeclarationTimestampS(), 0);

        vm.prank(sm1);
        will.desistSm();
        assertEq(will.deathDeclarationTimestampS(), block.timestamp);
        assertGt(will.deathDeclarationTimestampS(), 0);

        assertEq(uint8(will.getState()), uint8(WillState.ACTIVE));
        assertEq(
            will.getExecutionPossibleTimestamp(),
            block.timestamp + 1.5 days
        );
    }

    // SM desists, only one that declared.
    function test_DesistSm_AllDeclarers() public {
        vm.prank(sm1);
        will.validateSm();

        vm.prank(sm2);
        will.validateSm();

        vm.prank(sm1);
        will.declareDeath();

        vm.prank(sm2);
        will.declareDeath();

        //vm.expectRevert(Errors.ERR_SMDeclaredDeath.selector);
        vm.prank(sm1);
        will.desistSm();

        assertEq(will.deathDeclarationTimestampS(), block.timestamp);
        assertGt(will.deathDeclarationTimestampS(), 0);

        assertEq(uint8(will.getState()), uint8(WillState.ACTIVE));
        assertEq(
            will.getExecutionPossibleTimestamp(),
            block.timestamp + 1 days
        );
    }
}

contract WillTestInvalidSmParticipation is Test {
    Will will;

    address pm = makeAddr("pm");
    address sm1 = makeAddr("sm1");
    address sm2 = makeAddr("sm2");

    address attacker = makeAddr("attacker");

    function setUp() public {
        SMPartialInfo[] memory sms = new SMPartialInfo[](2);
        sms[0] = SMPartialInfo({smAddress: sm1, votePower: 1});
        sms[1] = SMPartialInfo({smAddress: sm2, votePower: 1});
        SecurityPeriodConfig
            memory securityPeriodConfig = SecurityPeriodConfig({
                minSecurityPeriod: 1 days,
                maxSecurityPeriod: 2 days
            });

        vm.prank(pm);
        will = new Will(pm, sms, securityPeriodConfig);
    }

    // SM Validates twice.
    function test_ValidateSm_ValidateTwice() public {
        vm.prank(sm1);
        will.validateSm();

        vm.prank(sm1);
        vm.expectRevert(Errors.ERR_SMAlreadyValidated.selector);
        will.validateSm();
    }
    // SM Validates post-declaration, falls into will not inactive.
    function test_ValidateSm_ValidatePostDeclaration() public {
        vm.prank(sm1);
        will.validateSm();

        vm.prank(sm2);
        will.validateSm();

        vm.prank(sm1);
        will.declareDeath();

        vm.prank(sm1);
        vm.expectRevert(Errors.ERR_WillNotInactive.selector);
        will.validateSm();
    }

    // Non-SM attempts validation.
    function test_ValidateSm_NonSm() public {
        vm.prank(attacker);
        vm.expectRevert(Errors.ERR_NotSM.selector);
        will.validateSm();
    }

    // SM validates when will is canceled.
    function test_ValidateSm_WillCanceled() public {
        vm.prank(sm1);
        will.validateSm();

        vm.prank(sm2);
        will.validateSm();

        vm.prank(pm);
        will.cancelWill();

        assertEq(uint8(will.getState()), uint8(WillState.CANCELED));

        vm.prank(sm1);
        vm.expectRevert(Errors.ERR_WillNotInactive.selector);
        will.validateSm();
    }

    // SM validates when will is executed.
    function test_ValidateSm_WillExecuted() public {
        vm.prank(sm1);
        will.validateSm();

        vm.prank(sm2);
        will.validateSm();

        vm.deal(pm, 1 ether);
        vm.prank(pm);
        will.deposit{value: 1 ether}();

        vm.prank(sm1);
        will.declareDeath();

        vm.warp(block.timestamp + 3 days);

        vm.prank(sm1);
        will.swapAssets();

        assertEq(uint8(will.getState()), uint8(WillState.EXECUTED));

        vm.prank(sm1);
        vm.expectRevert(Errors.ERR_WillNotInactive.selector);
        will.validateSm();
    }

    // Non-SM attempts to desist.
    function test_DesistSm_NonSm() public {
        vm.prank(attacker);
        vm.expectRevert(Errors.ERR_NotSM.selector);
        will.desistSm();
    }
}
