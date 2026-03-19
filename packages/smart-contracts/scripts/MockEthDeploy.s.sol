// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {console} from "forge-std/console.sol";
import {Script} from "forge-std/Script.sol";
import {MockWETH} from "@src/anvil-swap-related/MockWETH.sol";

contract DeployMockEth is Script {
    function run() external returns (address) {
        vm.startBroadcast();
        MockWETH eth = new MockWETH();
        vm.stopBroadcast();

        console.log("MockWETH deployed at:", address(eth));

        return address(eth);
    }
}
