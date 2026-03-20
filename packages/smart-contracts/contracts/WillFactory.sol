//SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import {Will} from "@src/Will.sol";
import {SMPartialInfo} from "@interfaces/SMInfo.sol";
import {SecurityPeriodConfig} from "@interfaces/SecurityPeriodConfig.sol";
import {SwapConfig} from "@interfaces/SwapConfig.sol";
import {ConfigUtils} from "@src/ConfigUtils.sol";

contract WillFactory {
    event EVT_WillChain_WillCreated(
        address indexed willAddress,
        address indexed mpAddress
    ); // 0xeff78712

    function createWill(
        SMPartialInfo[] memory newSmList,
        SecurityPeriodConfig memory securityPeriodConfig
    ) external payable returns (address) {
        SwapConfig memory swapConfig = ConfigUtils.getConfig();
        Will newWill = new Will{value: msg.value}(
            msg.sender,
            newSmList,
            securityPeriodConfig,
            swapConfig
        );

        emit EVT_WillChain_WillCreated(address(newWill), msg.sender);

        return address(newWill);
    }
}
