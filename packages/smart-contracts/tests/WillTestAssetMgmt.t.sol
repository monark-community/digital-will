//SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import {Test} from "forge-std/Test.sol";

import {Will} from "@src/Will.sol";

import {WillState} from "@interfaces/WillState.sol";
import {SMPartialInfo} from "@interfaces/SMInfo.sol";
import {SecurityPeriodConfig} from "@interfaces/SecurityPeriodConfig.sol";
import {SwapConfig} from "@interfaces/SwapConfig.sol";
import {ConfigUtils} from "@src/ConfigUtils.sol";
import {MockSwapRouter} from "@src/anvil-swap-related/MockSwapRouter.sol";
import {MockWETH} from "@src/anvil-swap-related/MockWETH.sol";
import {MockUSDC} from "@src/anvil-swap-related/MockUSDC.sol";
import {MockQuoterV2} from "@src/anvil-swap-related/MockQuoterV2.sol";
import "@src/WillErrors.sol" as Errors;

// Used for testing failed withdrawals on payable call.
contract RejectEther {
    receive() external payable {
        revert("nope");
    }
}

contract WillTestAssetMgmt is Test {
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
        vm.prank(pm);
        will = new Will(pm, sms, securityPeriodConfig, swapConfig);
    }

    // deposit valid funds, state INACTIVE.
    function test_Deposit_Inactive() public {
        vm.deal(pm, 2 ether);
        vm.prank(pm);
        will.deposit{value: 1 ether}();
        assertEq(will.getBalance(), 1 ether);
    }

    // withdraw a valid sum of funds, , state INACTIVE.
    function test_Withdraw_Inactive() public {
        vm.deal(pm, 2 ether);
        vm.prank(pm);
        will.deposit{value: 1 ether}();

        vm.prank(pm);
        will.withdraw(0.5 ether);
        assertEq(will.getBalance(), 0.5 ether);
        assertEq(pm.balance, 1.5 ether);
    }

    // deposit valid funds, state ACTIVE.
    function test_Deposit_Active() public {
        vm.prank(sm1);
        will.validateSm();
        vm.prank(sm2);
        will.validateSm();
        assertEq(uint8(will.getState()), uint8(WillState.ACTIVE));
        vm.deal(pm, 2 ether);
        vm.prank(pm);
        will.deposit{value: 1 ether}();
        assertEq(will.getBalance(), 1 ether);
    }

    // withdraw a valid sum of funds, , state ACTIVE.
    function test_Withdraw_Active() public {
        vm.prank(sm1);
        will.validateSm();
        vm.prank(sm2);
        will.validateSm();
        assertEq(uint8(will.getState()), uint8(WillState.ACTIVE));
        vm.deal(pm, 2 ether);
        vm.prank(pm);
        will.deposit{value: 1 ether}();

        vm.prank(pm);
        will.withdraw(0.5 ether);
        assertEq(will.getBalance(), 0.5 ether);
        assertEq(pm.balance, 1.5 ether);
    }

    // swap assets and check state EXECUTED.
    function test_SwapAssets() public {
        vm.deal(pm, 2 ether);
        vm.prank(pm);
        will.deposit{value: 1 ether}();

        vm.prank(sm1);
        will.validateSm();
        vm.prank(sm2);
        will.validateSm();

        vm.prank(sm1);
        will.declareDeath();
        vm.prank(sm2);
        will.declareDeath();

        // Fast forward time to make the will active.
        vm.warp(block.timestamp + 1 days);

        // Swap assets.
        vm.prank(sm1);
        will.swapAssets();
        assertEq(uint8(will.getState()), uint8(WillState.EXECUTED));

        vm.prank(sm1);
        assertTrue(will.getWethBalance() == 0);

        vm.prank(sm1);
        assertTrue(will.getUsdcBalance() > 0);
    }

    // swap assets with no balance.
    function test_SwapAssets_NoBalance() public {
        SMPartialInfo[] memory sms = new SMPartialInfo[](2);
        sms[0] = SMPartialInfo({smAddress: sm1, votePower: 1});
        sms[1] = SMPartialInfo({smAddress: sm2, votePower: 1});
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

        will = new Will(address(pm), sms, securityPeriodConfig, swapConfig);
        vm.prank(sm1);
        will.validateSm();
        vm.prank(sm2);
        will.validateSm();

        vm.prank(sm1);
        will.declareDeath();
        vm.prank(sm2);
        will.declareDeath();

        // Fast forward time to make the will active.
        vm.warp(block.timestamp + 1 days);
        // Try to swap assets owith 0 balance
        vm.prank(sm1);
        uint256 res = will.swapAssets();
        assertEq(res, 0);
    }
}

contract WillTestInvalidAssetMgmt is Test {
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
        vm.prank(pm);
        will = new Will(pm, sms, securityPeriodConfig, swapConfig);
    }

    // deposit funds as non-pm.
    function test_Deposit_AsNonPm() public {
        vm.deal(attacker, 1 ether);
        vm.prank(attacker);
        vm.expectRevert(Errors.ERR_NotPM.selector);
        will.deposit{value: 1 ether}();
    }

    // deposit funds with state CANCELED.
    function test_Deposit_StateCanceled() public {
        vm.prank(pm);
        will.cancelWill();

        vm.deal(pm, 1 ether);
        vm.prank(pm);
        vm.expectRevert(Errors.ERR_AssetsNotInteractable.selector);
        will.deposit{value: 1 ether}();
    }

    // deposit funds with state EXECUTED.
    function test_Deposit_StateExecuted() public {
        vm.deal(pm, 2 ether);
        vm.prank(pm);
        will.deposit{value: 1 ether}();

        vm.prank(sm1);
        will.validateSm();
        vm.prank(sm2);
        will.validateSm();

        vm.prank(sm1);
        will.declareDeath();
        vm.prank(sm2);
        will.declareDeath();

        // Fast forward time to make the will executable.
        vm.warp(block.timestamp + 3 days);

        vm.deal(pm, 1 ether);
        vm.prank(pm);
        vm.expectRevert(Errors.ERR_WillExecuted.selector);
        will.deposit{value: 1 ether}();

        // Swap assets.
        vm.prank(sm1);
        will.swapAssets();
        vm.assertEq(uint8(will.getState()), uint8(WillState.EXECUTED));

        // Try to deposit after execution.
        vm.deal(pm, 1 ether);
        vm.prank(pm);
        vm.expectRevert(Errors.ERR_AssetsNotInteractable.selector);
        will.deposit{value: 1 ether}();
    }

    // deposit funds with ExecutionTimePassed.
    function test_Deposit_ExecutionTimePassed() public {
        vm.deal(pm, 2 ether);
        vm.prank(pm);
        will.deposit{value: 1 ether}();

        vm.prank(sm1);
        will.validateSm();
        vm.prank(sm2);
        will.validateSm();

        vm.prank(sm1);
        will.declareDeath();
        vm.prank(sm2);
        will.declareDeath();

        // Fast forward time to after maxSecurityPeriod.
        vm.warp(block.timestamp + 3 days);

        // Try to deposit after execution time passed.
        vm.deal(pm, 1 ether);
        vm.prank(pm);
        vm.expectRevert(Errors.ERR_WillExecuted.selector);
        will.deposit{value: 1 ether}();
    }

    // deposit 0 funds.
    function test_Deposit_ZeroFunds() public {
        vm.prank(pm);
        vm.expectRevert(Errors.ERR_InvalidDeposit.selector);
        will.deposit{value: 0}();
    }

    // withdraw funds as non-pm.
    function test_Withdraw_AsNonPm() public {
        vm.deal(pm, 2 ether);
        vm.prank(pm);
        will.deposit{value: 1 ether}();

        vm.prank(attacker);
        vm.expectRevert(Errors.ERR_NotPM.selector);
        will.withdraw(0.5 ether);
    }

    // withdraw funds with state CANCELED.
    function test_Withdraw_StateCanceled() public {
        vm.deal(pm, 2 ether);
        vm.prank(pm);
        will.deposit{value: 1 ether}();

        vm.prank(pm);
        will.cancelWill();

        vm.prank(pm);
        vm.expectRevert(Errors.ERR_AssetsNotInteractable.selector);
        will.withdraw(0.5 ether);
    }

    // withdraw funds with state EXECUTED.
    function test_Withdraw_StateExecuted() public {
        vm.deal(pm, 2 ether);
        vm.prank(pm);
        will.deposit{value: 1 ether}();

        vm.prank(sm1);
        will.validateSm();
        vm.prank(sm2);
        will.validateSm();

        vm.prank(sm1);
        will.declareDeath();
        vm.prank(sm2);
        will.declareDeath();

        // Fast forward time to make the will executable.
        vm.warp(block.timestamp + 2 days);

        // Swap assets.
        vm.prank(sm1);
        will.swapAssets();
        vm.assertEq(uint8(will.getState()), uint8(WillState.EXECUTED));

        // Try to withdraw after execution.
        vm.prank(pm);
        vm.expectRevert(Errors.ERR_AssetsNotInteractable.selector);
        will.withdraw(0.5 ether);
    }

    // withdraw funds with ExecutionTimePassed.
    function test_Withdraw_ExecutionTimePassed() public {
        vm.deal(pm, 2 ether);
        vm.prank(pm);
        will.deposit{value: 1 ether}();

        vm.prank(sm1);
        will.validateSm();
        vm.prank(sm2);
        will.validateSm();

        vm.prank(sm1);
        will.declareDeath();
        vm.prank(sm2);
        will.declareDeath();

        // Fast forward time to after executionTimestamp.
        vm.warp(block.timestamp + 3 days);

        // Try to withdraw after execution time passed.
        vm.prank(pm);
        vm.expectRevert(Errors.ERR_WillExecuted.selector);
        will.withdraw(0.5 ether);
    }

    // withdraw too much funds.
    function test_Withdraw_TooMuchFunds() public {
        vm.deal(pm, 2 ether);
        vm.prank(pm);
        will.deposit{value: 2 ether}();

        vm.prank(pm);
        vm.expectRevert(Errors.ERR_InsufficientBalance.selector);
        will.withdraw(3 ether);
    }

    // withdraw 0 funds.
    function test_Withdraw_ZeroFunds() public {
        vm.deal(pm, 2 ether);
        vm.prank(pm);
        will.deposit{value: 1 ether}();

        vm.prank(pm);
        vm.expectRevert(Errors.ERR_InvalidWithdrawal.selector);
        will.withdraw(0);
    }

    // Failed withdrawal on payable.
    function test_Withdraw_FailOnPayable() public {
        SMPartialInfo[] memory sms = new SMPartialInfo[](2);
        sms[0] = SMPartialInfo({smAddress: sm1, votePower: 1});
        sms[1] = SMPartialInfo({smAddress: sm2, votePower: 1});
        SecurityPeriodConfig
            memory securityPeriodConfig = SecurityPeriodConfig({
                minSecurityPeriod: 1 days,
                maxSecurityPeriod: 2 days
            });
        SwapConfig memory swapConfig = ConfigUtils.getConfig();
        RejectEther rejectPm = new RejectEther();

        will = new Will{value: 1 ether}(
            address(rejectPm),
            sms,
            securityPeriodConfig,
            swapConfig
        );

        vm.prank(address(rejectPm));
        vm.expectRevert(Errors.ERR_FailedWithdrawal.selector);
        will.withdraw(1);
    }

    // Failed withdrawl on payable in withdrawAllPm, on cancelWill.
    function test_WithdrawAllPm_FailOnPayable() public {
        SMPartialInfo[] memory sms = new SMPartialInfo[](2);
        sms[0] = SMPartialInfo({smAddress: sm1, votePower: 1});
        sms[1] = SMPartialInfo({smAddress: sm2, votePower: 1});
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
        RejectEther rejectPm = new RejectEther();

        will = new Will{value: 1 ether}(
            address(rejectPm),
            sms,
            securityPeriodConfig,
            swapConfig
        );

        vm.prank(address(rejectPm));
        vm.expectRevert(Errors.ERR_FailedWithdrawal.selector);
        will.cancelWill();
    }

    // swap assets as non-sm.
    function test_SwapAssets_AsNonSm() public {
        vm.deal(pm, 2 ether);
        vm.prank(pm);
        will.deposit{value: 1 ether}();

        vm.prank(sm1);
        will.validateSm();
        vm.prank(sm2);
        will.validateSm();

        vm.prank(sm1);
        will.declareDeath();
        vm.prank(sm2);
        will.declareDeath();

        // Fast forward time to make the will active.
        vm.warp(block.timestamp + 1 days);

        // Try to swap assets as non-sm.
        vm.prank(attacker);
        vm.expectRevert(Errors.ERR_NotSM.selector);
        will.swapAssets();
    }

    // swap assets with state CANCELED.
    function test_SwapAssets_StateCanceled() public {
        vm.deal(pm, 2 ether);
        vm.prank(pm);
        will.deposit{value: 1 ether}();

        // Cancel the will.
        vm.prank(pm);
        will.cancelWill();

        // Try to swap assets after cancellation.
        vm.prank(sm1);
        vm.expectRevert(Errors.ERR_WillNotActive.selector);
        will.swapAssets();
    }

    // swap assets with state INACTIVE.
    function test_SwapAssets_StateInactive() public {
        vm.deal(pm, 2 ether);
        vm.prank(pm);
        will.deposit{value: 1 ether}();

        // Try to swap assets before declaring death.
        vm.prank(sm1);
        vm.expectRevert(Errors.ERR_WillNotActive.selector);
        will.swapAssets();
    }

    // swap assets with state EXECUTED.
    function test_SwapAssets_StateExecuted() public {
        vm.deal(pm, 2 ether);
        vm.prank(pm);
        will.deposit{value: 1 ether}();

        vm.prank(sm1);
        will.validateSm();
        vm.prank(sm2);
        will.validateSm();

        vm.prank(sm1);
        will.declareDeath();
        vm.prank(sm2);
        will.declareDeath();

        // Fast forward time to make the will active.
        vm.warp(block.timestamp + 2 days);

        // Swap assets.
        vm.prank(sm1);
        will.swapAssets();
        assertEq(uint8(will.getState()), uint8(WillState.EXECUTED));

        // Try to swap assets after execution.
        vm.prank(sm1);
        vm.expectRevert(Errors.ERR_WillNotActive.selector);
        will.swapAssets();
    }

    // swap assets with securityPeriodNotStarted.
    function test_SwapAssets_SecurityPeriodNotStarted() public {
        vm.deal(pm, 2 ether);
        vm.prank(pm);
        will.deposit{value: 1 ether}();

        vm.prank(sm1);
        will.validateSm();
        vm.prank(sm2);
        will.validateSm();

        // Try to swap assets before security period starts.
        vm.prank(sm1);
        vm.expectRevert(Errors.ERR_SecurityPeriodNotStarted.selector);
        will.swapAssets();
    }

    // swap assets with securityPeriodNotFinished.
    function test_SwapAssets_SecurityPeriodNotFinished() public {
        vm.deal(pm, 2 ether);
        vm.prank(pm);
        will.deposit{value: 1 ether}();

        vm.prank(sm1);
        will.validateSm();
        vm.prank(sm2);
        will.validateSm();

        vm.prank(sm1);
        will.declareDeath();
        vm.prank(sm2);
        will.declareDeath();

        vm.warp(block.timestamp + 0.5 days);

        // Try to swap assets before security period finishes.
        vm.prank(sm1);
        vm.expectRevert(Errors.ERR_SecurityPeriodNotFinished.selector);
        will.swapAssets();
    }
}
