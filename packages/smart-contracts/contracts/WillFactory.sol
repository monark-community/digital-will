//SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import {Will} from "@src/Will.sol";
import {SMPartialInfo} from "@interfaces/SMInfo.sol";
import {SecurityPeriodConfig} from "@interfaces/SecurityPeriodConfig.sol";

contract WillFactory {
    event EVT_WillChain_WillCreated(
        address indexed willAddress,
        address indexed mpAddress
    ); // 0xeff78712

    function createWill(
        SMPartialInfo[] memory newSmList,
        SecurityPeriodConfig memory securityPeriodConfig
    ) external payable returns (address) {
        Will newWill = new Will{value: msg.value}(
            msg.sender,
            newSmList,
            securityPeriodConfig
        );

        emit EVT_WillChain_WillCreated(address(newWill), msg.sender);

        return address(newWill);
    }
}
