// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {console} from "forge-std/console.sol";
import {Script} from "forge-std/Script.sol";
import {MockUSDC} from "@src/anvil-swap-related/MockUSDC.sol";

contract DeployMockUSDC is Script {
    function run() external returns (address) {
        vm.startBroadcast();
        MockUSDC usdc = new MockUSDC();
        vm.stopBroadcast();

        console.log("MockUSDC deployed at:", address(usdc));

        return address(usdc);
    }
}
