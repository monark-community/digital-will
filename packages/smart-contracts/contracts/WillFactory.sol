//SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import {Will} from "@src/Will.sol";

contract WillFactory {
    function createWill(address owner) external returns (address) {
        Will newWill = new Will(owner);
        return address(newWill);
    }
}
