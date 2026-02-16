//SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import {Will} from "@src/Will.sol";
import {SMPartialInfo} from "@interfaces/SMInfo.sol";
import {SecurityPeriodConfig} from "@interfaces/SecurityPeriodConfig.sol";

contract WillFactory {

    event WillCreated(address indexed will, address indexed owner);

    function createWill(
        address owner,
        SMPartialInfo[] memory newSmList,
        SecurityPeriodConfig memory securityPeriodConfig
    ) external returns (address) {
        Will newWill = new Will(owner, newSmList, securityPeriodConfig);
        
        emit WillCreated(address(newWill), owner);
        
        return address(newWill);
    }
}
