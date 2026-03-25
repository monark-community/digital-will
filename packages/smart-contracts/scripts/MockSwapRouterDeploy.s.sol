// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {console} from "forge-std/console.sol";
import {Script} from "forge-std/Script.sol";
import {MockSwapRouter} from "@src/anvil-swap-related/MockSwapRouter.sol";

contract DeployMockSwapRouter is Script {
    function run() external returns (address) {
        vm.startBroadcast();
        MockSwapRouter router = new MockSwapRouter();
        vm.stopBroadcast();

        console.log("MockSwapRouter deployed at:", address(router));

        return address(router);
    }
}
