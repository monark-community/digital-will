//SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import {Test} from "forge-std/Test.sol";
import {WillFactory} from "@src/WillFactory.sol";
import {SMPartialInfo} from "@interfaces/SMInfo.sol";
import {SecurityPeriodConfig} from "@interfaces/SecurityPeriodConfig.sol";

contract WillFactoryTest is Test {
    function test_CreateWill_Success() public {
        WillFactory factory = new WillFactory();

        SMPartialInfo[] memory sms = new SMPartialInfo[](2);
        sms[0] = SMPartialInfo({smAddress: makeAddr("sm1"), votePower: 1});
        sms[1] = SMPartialInfo({smAddress: makeAddr("sm2"), votePower: 1});
        SecurityPeriodConfig memory config = SecurityPeriodConfig({
            minSecurityPeriod: 1 days,
            maxSecurityPeriod: 2 days
        });

        vm.deal(address(this), 1 ether);

        address willAddress = factory.createWill{value: 1 ether}(
            address(this),
            sms,
            config
        );

        assertTrue(willAddress != address(0));
        assertEq(willAddress.balance, 1 ether);
    }
}
