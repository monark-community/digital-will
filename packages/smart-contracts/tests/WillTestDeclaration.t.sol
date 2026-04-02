//SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import {Test} from "forge-std/Test.sol";

import {Will} from "@src/Will.sol";

import {SMInfo, SMPartialInfo} from "@interfaces/SMInfo.sol";
import {SMState} from "@interfaces/SMState.sol";
import {SecurityPeriodConfig} from "@interfaces/SecurityPeriodConfig.sol";
import {SwapConfig} from "@interfaces/SwapConfig.sol";
import {MockSwapRouter} from "@src/anvil-swap-related/MockSwapRouter.sol";
import {MockWETH} from "@src/anvil-swap-related/MockWETH.sol";
import {MockUSDC} from "@src/anvil-swap-related/MockUSDC.sol";
import {MockQuoterV2} from "@src/anvil-swap-related/MockQuoterV2.sol";
import "@src/WillErrors.sol" as Errors;

import "@constants/Will.c.sol" as C_WILL;

contract WillTestDeclaration is Test {
    Will will;

    address pm = makeAddr("pm");
    address sm1 = makeAddr("sm1");
    address sm2 = makeAddr("sm2");
    address sm3 = makeAddr("sm3");

    function setUp() public {
        SMPartialInfo[] memory sms = new SMPartialInfo[](3);
        sms[0] = SMPartialInfo({smAddress: sm1, votePower: 1});
        sms[1] = SMPartialInfo({smAddress: sm2, votePower: 1});
        sms[2] = SMPartialInfo({smAddress: sm3, votePower: 1});
        SecurityPeriodConfig
            memory securityPeriodConfig = SecurityPeriodConfig({
                minSecurityPeriod: 1 days,
                maxSecurityPeriod: 2 days
            });

        MockWETH eth = new MockWETH();
        MockUSDC usdc = new MockUSDC();
        MockSwapRouter router = new MockSwapRouter();
        MockQuoterV2 quoter = new MockQuoterV2();
        SwapConfig memory swapConfig = SwapConfig({
            swapRouter: address(router),
            quoter: address(quoter),
            wNative: address(eth),
            usdc: address(usdc),
            poolFee: 0
        });
        vm.deal(pm, 2 ether);
        vm.prank(pm);
        will = new Will{value: 1 ether}(
            pm,
            sms,
            securityPeriodConfig,
            swapConfig
        );

        vm.deal(sm1, 2 ether);
        vm.prank(sm1);
        will.validateSm();
        vm.deal(sm2, 2 ether);
        vm.prank(sm2);
        will.validateSm();
        vm.deal(sm3, 2 ether);
        vm.prank(sm3);
        will.validateSm();
    }

    // First declare.
    function test_Declare_First() public {
        vm.prank(sm1);
        will.declareDeath();

        SMInfo memory smInfo1 = will.getDetailedSm(sm1);
        assertEq(uint8(smInfo1.state), uint8(SMState.DECLARED_DEATH));
        assertEq(will.deathDeclarationTimestampS(), block.timestamp);
        assertLt(will.executionTimeStampS(), block.timestamp + 2 days);
        assertEq(will.cumulatedVotePowerS(), 1);
    }

    // Second declares.
    function test_Declare_Mid() public {
        vm.prank(sm1);
        will.declareDeath();
        vm.prank(sm2);
        will.declareDeath();

        assertEq(will.deathDeclarationTimestampS(), block.timestamp);
        assertLt(will.executionTimeStampS(), block.timestamp + 1.34 days);
        assertEq(will.cumulatedVotePowerS(), 2);
    }

    // Last Declare.
    function test_Declare_Last() public {
        vm.prank(sm1);
        will.declareDeath();
        vm.prank(sm2);
        will.declareDeath();
        vm.prank(sm3);
        will.declareDeath();

        assertEq(will.deathDeclarationTimestampS(), block.timestamp);
        assertEq(will.executionTimeStampS(), block.timestamp + 1 days);
        assertEq(will.cumulatedVotePowerS(), 3);
    }

    // Declare after time crosses minimalSsecurityPeriod.
    function test_Declare_WhenTimeBelowMinimalSecurityPeriod() public {
        vm.prank(sm1);
        will.declareDeath();
        vm.prank(sm2);
        will.declareDeath();
        assertEq(
            will.executionTimeStampS(),
            block.timestamp + (1 days * 4) / 3
        );

        vm.warp(block.timestamp + 1.1 days);
        vm.prank(sm3);
        will.declareDeath();

        assertEq(will.deathDeclarationTimestampS(), block.timestamp - 1.1 days);
        assertEq(
            will.executionTimeStampS(),
            will.deathDeclarationTimestampS() + (1 days * 4) / 3
        );
        assertGt(will.getExecutionPossibleTimestamp(), block.timestamp);
        assertEq(will.cumulatedVotePowerS(), 3);
    }

    // Veto post-declaration.
    function test_Veto_PostDeclaration() public {
        vm.prank(sm1);
        will.declareDeath();

        vm.prank(pm);
        will.vetoDeath();

        assertEq(will.deathDeclarationTimestampS(), 0);
        assertEq(will.executionTimeStampS(), 0);
        assertEq(will.cumulatedVotePowerS(), 0);
        assertEq(
            will.getCooldownEndTimestamp(),
            block.timestamp + C_WILL.COOLDOWN_PERIOD
        );
    }

    // Veto post-declaration.
    function test_Declare_PostVeto() public {
        vm.prank(sm1);
        will.declareDeath();

        vm.prank(pm);
        will.vetoDeath();

        vm.prank(sm1);
        vm.expectRevert(Errors.ERR_WillOnCooldown.selector);
        will.declareDeath();

        vm.warp(block.timestamp + C_WILL.COOLDOWN_PERIOD + 1);
        assertEq(will.deathDeclarationTimestampS(), 0);
        vm.prank(sm1);
        will.declareDeath();
        assertGt(will.deathDeclarationTimestampS(), 0);
    }

    // Veto post-(declaration+desist).
    function test_Veto_PostDeclarationDesist() public {
        vm.prank(sm1);
        will.declareDeath();

        vm.prank(sm1);
        will.desistSm();

        vm.prank(pm);
        will.vetoDeath();

        assertEq(will.deathDeclarationTimestampS(), 0);
        assertEq(will.executionTimeStampS(), 0);
        assertEq(will.cumulatedVotePowerS(), 0);
        assertEq(
            will.getCooldownEndTimestamp(),
            block.timestamp + C_WILL.COOLDOWN_PERIOD
        );

        vm.warp(block.timestamp + C_WILL.COOLDOWN_PERIOD + 1);
        vm.expectRevert(Errors.ERR_WillNotOnCooldown.selector);
        will.getCooldownEndTimestamp();
    }
}

contract WillTestInvalidDeclaration is Test {
    Will will;

    address pm = makeAddr("pm");
    address sm1 = makeAddr("sm1");
    address sm2 = makeAddr("sm2");
    address sm3 = makeAddr("sm3");
    address attacker = makeAddr("attacker");

    function setUp() public {
        SMPartialInfo[] memory sms = new SMPartialInfo[](3);
        sms[0] = SMPartialInfo({smAddress: sm1, votePower: 1});
        sms[1] = SMPartialInfo({smAddress: sm2, votePower: 1});
        sms[2] = SMPartialInfo({smAddress: sm3, votePower: 1});
        SecurityPeriodConfig
            memory securityPeriodConfig = SecurityPeriodConfig({
                minSecurityPeriod: 1 days,
                maxSecurityPeriod: 2 days
            });

        MockWETH eth = new MockWETH();
        MockUSDC usdc = new MockUSDC();
        MockSwapRouter router = new MockSwapRouter();
        MockQuoterV2 quoter = new MockQuoterV2();
        SwapConfig memory swapConfig = SwapConfig({
            swapRouter: address(router),
            quoter: address(quoter),
            wNative: address(eth),
            usdc: address(usdc),
            poolFee: 0
        });
        vm.deal(pm, 2 ether);
        vm.prank(pm);
        will = new Will{value: 1 ether}(
            pm,
            sms,
            securityPeriodConfig,
            swapConfig
        );
        vm.prank(sm1);
        will.validateSm();
        vm.prank(sm2);
        will.validateSm();
        vm.prank(sm3);
        will.validateSm();
    }

    // Attacker tries cancelling
    function test_Cancel_NonPM() public {
        vm.prank(attacker);
        vm.expectRevert(Errors.ERR_NotPM.selector);
        will.cancelWill();
    }

    // Non-SM declares.
    function test_Declare_NonSm() public {
        vm.prank(attacker);
        vm.expectRevert(Errors.ERR_NotSM.selector);
        will.declareDeath();
    }

    // Declare on Will Inactive.
    function test_Declare_WillInactive() public {
        SMPartialInfo[] memory sms = new SMPartialInfo[](3);
        sms[0] = SMPartialInfo({smAddress: sm1, votePower: 1});
        sms[1] = SMPartialInfo({smAddress: sm2, votePower: 1});
        sms[2] = SMPartialInfo({smAddress: sm3, votePower: 1});
        SecurityPeriodConfig
            memory securityPeriodConfig = SecurityPeriodConfig({
                minSecurityPeriod: 1 days,
                maxSecurityPeriod: 2 days
            });

        MockWETH eth = new MockWETH();
        MockUSDC usdc = new MockUSDC();
        MockSwapRouter router = new MockSwapRouter();
        MockQuoterV2 quoter = new MockQuoterV2();
        SwapConfig memory swapConfig = SwapConfig({
            swapRouter: address(router),
            quoter: address(quoter),
            wNative: address(eth),
            usdc: address(usdc),
            poolFee: 0
        });
        vm.deal(pm, 2 ether);
        vm.prank(pm);
        will = new Will{value: 1 ether}(
            pm,
            sms,
            securityPeriodConfig,
            swapConfig
        );

        vm.prank(sm1);
        will.validateSm();
        vm.prank(sm2);
        will.validateSm();

        vm.prank(sm1);
        vm.expectRevert(Errors.ERR_WillNotActive.selector);
        will.declareDeath();
    }

    // Declare on Will Canceled.
    function test_Declare_WillCanceled() public {
        vm.prank(sm1);
        will.declareDeath();

        vm.prank(pm);
        will.cancelWill();

        vm.prank(sm1);
        vm.expectRevert(Errors.ERR_WillNotActive.selector);
        will.declareDeath();
    }

    // Declare on Will Executed.
    function test_Declare_WillExecuted() public {
        vm.prank(sm1);
        will.declareDeath();
        vm.prank(sm2);
        will.declareDeath();
        vm.prank(sm3);
        will.declareDeath();

        // Fast forward time to make the will active.
        vm.warp(block.timestamp + 1 days);

        vm.prank(sm1);
        will.swapAssets();

        vm.prank(sm1);
        vm.expectRevert(Errors.ERR_WillNotActive.selector);
        will.declareDeath();
    }

    // Declare on Will on Cooldown.
    function test_Declare_WillCooldown() public {
        vm.prank(sm1);
        will.declareDeath();

        vm.prank(pm);
        will.vetoDeath();

        vm.prank(sm1);
        vm.expectRevert(Errors.ERR_WillOnCooldown.selector);
        will.declareDeath();
    }

    // Declare on Execution Time Passed.
    function test_Declare_ExecutionTimePassed() public {
        vm.prank(sm1);
        will.declareDeath();
        vm.prank(sm2);
        will.declareDeath();

        // Fast forward time to after execution time.
        vm.warp(block.timestamp + 2 days);

        vm.prank(sm3);
        vm.expectRevert(Errors.ERR_WillExecuted.selector);
        will.declareDeath();
    }

    // Declare twice in a row.
    function test_Declare_TwiceInARow() public {
        vm.prank(sm1);
        will.declareDeath();

        vm.prank(sm1);
        vm.expectRevert(Errors.ERR_SMAlreadyDeclaredDeath.selector);
        will.declareDeath();
    }

    // Veto by non-PM.
    function test_Veto_NonPM() public {
        vm.prank(sm1);
        will.declareDeath();

        vm.prank(attacker);
        vm.expectRevert(Errors.ERR_NotPM.selector);
        will.vetoDeath();
    }

    // Veto when will canceled.
    function test_Veto_WillCanceled() public {
        vm.prank(sm1);
        will.declareDeath();

        vm.prank(pm);
        will.cancelWill();

        vm.prank(pm);
        vm.expectRevert(Errors.ERR_WillNotActive.selector);
        will.vetoDeath();
    }

    // Veto when will inactive.
    function test_Veto_WillInactive() public {
        vm.prank(pm);
        vm.expectRevert(Errors.ERR_WillNoDeclaration.selector);
        will.vetoDeath();
    }

    // Veto when will executed.
    function test_Veto_WillExecuted() public {
        vm.prank(sm1);
        will.declareDeath();
        vm.prank(sm2);
        will.declareDeath();
        vm.prank(sm3);
        will.declareDeath();

        // Fast forward time to make the will active.
        vm.warp(block.timestamp + 1 days);

        vm.prank(sm1);
        will.swapAssets();

        vm.prank(pm);
        vm.expectRevert(Errors.ERR_WillNotActive.selector);
        will.vetoDeath();
    }

    // Veto post execution time passed.
    function test_Veto_ExecutionTimePassed() public {
        vm.prank(sm1);
        will.declareDeath();
        vm.prank(sm2);
        will.declareDeath();

        // Fast forward time to after execution time.
        vm.warp(block.timestamp + 2 days);

        vm.prank(pm);
        vm.expectRevert(Errors.ERR_WillExecuted.selector);
        will.vetoDeath();
    }

    // Veto twice in a row.
    function test_Veto_TwiceInARow() public {
        vm.prank(sm1);
        will.declareDeath();

        vm.prank(pm);
        will.vetoDeath();

        vm.prank(pm);
        vm.expectRevert(Errors.ERR_WillOnCooldown.selector);
        will.vetoDeath();
    }

    // Veto_NoDeclare
    function test_Veto_NoDeclare() public {
        vm.prank(pm);
        vm.expectRevert(Errors.ERR_WillNoDeclaration.selector);
        will.vetoDeath();
    }
}
