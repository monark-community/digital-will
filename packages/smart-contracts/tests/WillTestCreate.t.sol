//SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import {Test} from "forge-std/Test.sol";

import {Will} from "@src/Will.sol";

import {WillState} from "@interfaces/WillState.sol";
import {SMInfo, SMPartialInfo} from "@interfaces/SMInfo.sol";
import {SMState} from "@interfaces/SMState.sol";
import {SecurityPeriodConfig} from "@interfaces/SecurityPeriodConfig.sol";

import "@src/WillErrors.sol" as Errors;

contract WillTestCreate is Test {
    Will will;

    address pm = makeAddr("pm");
    address sm1 = makeAddr("sm1");
    address sm2 = makeAddr("sm2");
    address sm3 = makeAddr("sm3");
    address sm4 = makeAddr("sm4");

    address attacker = makeAddr("attacker");

    // For basic scenarios in the test.
    function setUp() public {
        SMPartialInfo[] memory sms = new SMPartialInfo[](2);
        sms[0] = SMPartialInfo({smAddress: sm1, votePower: 1});
        sms[1] = SMPartialInfo({smAddress: sm2, votePower: 1});
        SecurityPeriodConfig
            memory securityPeriodConfig = SecurityPeriodConfig({
                minSecurityPeriod: 1 days,
                maxSecurityPeriod: 365 days
            });

        vm.deal(pm, 2 ether);
        vm.prank(pm);
        will = new Will{value: 1 ether}(pm, sms, securityPeriodConfig);
    }

    /* ========= Creation validation ========= */
    function test_CreateWill_ConstructorSetsPmAndConfig() public view {
        assertEq(will.PM_I(), pm);

        (uint256 minSp, uint256 maxSp) = will.securityPeriodConfigS();
        assertEq(minSp, 1 days);
        assertEq(maxSp, 365 days);

        assertEq(uint256(will.willStateS()), uint256(WillState.INACTIVE));
        assertEq(will.totalVotePowerS(), 2);
        assertEq(will.cumulatedVotePowerS(), 0);
        assertEq(will.deathDeclarationTimestampS(), 0);
        assertEq(will.executionTimeStampS(), 0);
        assertEq(will.cooldownTimeStampS(), 0);

        assertEq(address(will).balance, 1 ether);
    }

    function test_CreateWill_ConstructorSetsSmCorrectly() public view {
        address[] memory smAddresses = will.getSmList();
        assertEq(smAddresses.length, 2);
        assertEq(smAddresses[0], sm1);
        assertEq(smAddresses[1], sm2);

        SMInfo memory smInfo1 = will.getDetailedSm(sm1);
        assertEq(uint8(smInfo1.state), uint8(SMState.PENDING));
        assertEq(smInfo1.votePower, 1);
        assertEq(smInfo1.index, 1);

        SMInfo memory smInfo2 = will.getDetailedSm(sm2);
        assertEq(uint8(smInfo2.state), uint8(SMState.PENDING));
        assertEq(smInfo2.votePower, 1);
        assertEq(smInfo2.index, 2);
    }

    function test_CreateWill_GetterNonExistentSm_Error() public {
        vm.expectRevert(Errors.ERR_SMDoesNotExist.selector);
        will.getDetailedSm(attacker);
    }

    function test_CreateWill_NewWillSetsParamsCorrectly() public {
        SMPartialInfo[] memory sms = new SMPartialInfo[](2);
        sms[0] = SMPartialInfo({smAddress: sm3, votePower: 3});
        sms[1] = SMPartialInfo({smAddress: sm4, votePower: 4});
        SecurityPeriodConfig
            memory securityPeriodConfig = SecurityPeriodConfig({
                minSecurityPeriod: 7 days,
                maxSecurityPeriod: 14 days
            });

        vm.deal(pm, 3 ether);
        vm.prank(pm);
        will.cancelWill();

        vm.prank(pm);
        will.createNewWill{value: 2 ether}(sms, securityPeriodConfig);

        assertEq(will.PM_I(), pm);

        (uint256 minSp, uint256 maxSp) = will.securityPeriodConfigS();
        assertEq(minSp, 7 days);
        assertEq(maxSp, 14 days);

        assertEq(uint256(will.willStateS()), uint256(WillState.INACTIVE));
        assertEq(will.totalVotePowerS(), 7);
        assertEq(will.cumulatedVotePowerS(), 0);
        assertEq(will.deathDeclarationTimestampS(), 0);
        assertEq(will.executionTimeStampS(), 0);
        assertEq(will.cooldownTimeStampS(), 0);

        assertEq(address(will).balance, 2 ether);

        address[] memory smAddresses = will.getSmList();
        assertEq(smAddresses.length, 2);
        assertEq(smAddresses[0], sm3);
        assertEq(smAddresses[1], sm4);

        SMInfo memory smInfo1 = will.getDetailedSm(sm3);
        assertEq(uint8(smInfo1.state), uint8(SMState.PENDING));
        assertEq(smInfo1.votePower, 3);
        assertEq(smInfo1.index, 1);

        SMInfo memory smInfo2 = will.getDetailedSm(sm4);
        assertEq(uint8(smInfo2.state), uint8(SMState.PENDING));
        assertEq(smInfo2.votePower, 4);
        assertEq(smInfo2.index, 2);
    }
}

contract WillTestInvalidCreate is Test {
    Will will;

    address pm = makeAddr("pm");
    address sm1 = makeAddr("sm1");
    address sm2 = makeAddr("sm2");

    address attacker = makeAddr("attacker");

    function test_CreateWill_NotEnoughSM() public {
        SMPartialInfo[] memory sms = new SMPartialInfo[](1);
        sms[0] = SMPartialInfo({smAddress: sm1, votePower: 1});
        SecurityPeriodConfig
            memory securityPeriodConfig = SecurityPeriodConfig({
                minSecurityPeriod: 1 days,
                maxSecurityPeriod: 365 days
            });

        vm.deal(pm, 2 ether);
        vm.prank(pm);
        vm.expectRevert(Errors.ERR_NotEnoughSMs.selector);
        will = new Will{value: 1 ether}(pm, sms, securityPeriodConfig);
    }

    function test_CreateWill_TooMuchSM() public {
        SMPartialInfo[] memory smList = new SMPartialInfo[](300);

        for (uint256 i = 0; i < 300; i++) {
            // casting to 'uint160' is safe because values small.
            // forge-lint: disable-next-line(unsafe-typecast)
            address smAddr = address(uint160(i + 1)); // simple unique addresses
            smList[i] = SMPartialInfo({smAddress: smAddr, votePower: 1});
        }
        SecurityPeriodConfig
            memory securityPeriodConfig = SecurityPeriodConfig({
                minSecurityPeriod: 1 days,
                maxSecurityPeriod: 365 days
            });

        vm.deal(pm, 2 ether);
        vm.prank(pm);
        vm.expectRevert(Errors.ERR_TooManySMs.selector);
        will = new Will{value: 1 ether}(pm, smList, securityPeriodConfig);
    }

    function test_CreateWill_ImproperSecurityPeriod() public {
        SMPartialInfo[] memory sms = new SMPartialInfo[](2);
        sms[0] = SMPartialInfo({smAddress: sm1, votePower: 1});
        sms[1] = SMPartialInfo({smAddress: sm2, votePower: 1});
        SecurityPeriodConfig
            memory securityPeriodConfig = SecurityPeriodConfig({
                minSecurityPeriod: 1 days,
                maxSecurityPeriod: 1 days
            });

        vm.deal(pm, 2 ether);
        vm.prank(pm);
        vm.expectRevert(Errors.ERR_InvalidSecurityPeriods.selector);
        will = new Will{value: 1 ether}(pm, sms, securityPeriodConfig);

        securityPeriodConfig = SecurityPeriodConfig({
            minSecurityPeriod: 1 days,
            maxSecurityPeriod: 0 days
        });

        vm.deal(pm, 2 ether);
        vm.prank(pm);
        vm.expectRevert(Errors.ERR_InvalidSecurityPeriods.selector);
        will = new Will{value: 1 ether}(pm, sms, securityPeriodConfig);

        securityPeriodConfig = SecurityPeriodConfig({
            minSecurityPeriod: 0 days,
            maxSecurityPeriod: 0 days
        });

        vm.deal(pm, 2 ether);
        vm.prank(pm);
        vm.expectRevert(Errors.ERR_InvalidSecurityPeriods.selector);
        will = new Will{value: 1 ether}(pm, sms, securityPeriodConfig);
    }

    function test_CreateWill_PmIsSm() public {
        SMPartialInfo[] memory sms = new SMPartialInfo[](2);
        sms[0] = SMPartialInfo({smAddress: sm1, votePower: 1});
        sms[1] = SMPartialInfo({smAddress: pm, votePower: 1});
        SecurityPeriodConfig
            memory securityPeriodConfig = SecurityPeriodConfig({
                minSecurityPeriod: 1 days,
                maxSecurityPeriod: 365 days
            });

        vm.deal(pm, 2 ether);
        vm.prank(pm);
        vm.expectRevert(Errors.ERR_PMIsSM.selector);
        will = new Will{value: 1 ether}(pm, sms, securityPeriodConfig);
    }

    function test_CreateWill_SmDuplicates() public {
        SMPartialInfo[] memory sms = new SMPartialInfo[](2);
        sms[0] = SMPartialInfo({smAddress: sm1, votePower: 1});
        sms[1] = SMPartialInfo({smAddress: sm1, votePower: 1});
        SecurityPeriodConfig
            memory securityPeriodConfig = SecurityPeriodConfig({
                minSecurityPeriod: 1 days,
                maxSecurityPeriod: 365 days
            });

        vm.deal(pm, 2 ether);
        vm.prank(pm);
        vm.expectRevert(Errors.ERR_DuplicateSM.selector);
        will = new Will{value: 1 ether}(pm, sms, securityPeriodConfig);
    }

    function test_CreateWill_InvalidVotePower() public {
        SMPartialInfo[] memory sms = new SMPartialInfo[](2);
        sms[0] = SMPartialInfo({smAddress: sm1, votePower: 0});
        sms[1] = SMPartialInfo({smAddress: sm2, votePower: 1});
        SecurityPeriodConfig
            memory securityPeriodConfig = SecurityPeriodConfig({
                minSecurityPeriod: 1 days,
                maxSecurityPeriod: 365 days
            });

        vm.deal(pm, 2 ether);
        vm.prank(pm);
        vm.expectRevert(Errors.ERR_SMVotePowerInvalid.selector);
        will = new Will{value: 1 ether}(pm, sms, securityPeriodConfig);

        sms[0] = SMPartialInfo({smAddress: sm1, votePower: 1});
        sms[1] = SMPartialInfo({smAddress: sm2, votePower: 0});

        vm.deal(pm, 2 ether);
        vm.prank(pm);
        vm.expectRevert(Errors.ERR_SMVotePowerInvalid.selector);
        will = new Will{value: 1 ether}(pm, sms, securityPeriodConfig);

        sms[0] = SMPartialInfo({smAddress: sm1, votePower: 0});
        sms[1] = SMPartialInfo({smAddress: sm2, votePower: 0});

        vm.deal(pm, 2 ether);
        vm.prank(pm);
        vm.expectRevert(Errors.ERR_SMVotePowerInvalid.selector);
        will = new Will{value: 1 ether}(pm, sms, securityPeriodConfig);
    }

    function test_CreateWill_CantCreateNewIfCanceled() public {
        SMPartialInfo[] memory sms = new SMPartialInfo[](2);
        sms[0] = SMPartialInfo({smAddress: sm1, votePower: 1});
        sms[1] = SMPartialInfo({smAddress: sm2, votePower: 1});
        SecurityPeriodConfig
            memory securityPeriodConfig = SecurityPeriodConfig({
                minSecurityPeriod: 1 days,
                maxSecurityPeriod: 365 days
            });

        vm.deal(pm, 2 ether);
        vm.prank(pm);
        will = new Will{value: 1 ether}(pm, sms, securityPeriodConfig);

        vm.prank(pm);
        vm.expectRevert(Errors.ERR_WillNotCanceled.selector);
        will.createNewWill{value: 1 ether}(sms, securityPeriodConfig);
    }
}
