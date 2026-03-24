// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {console} from "forge-std/console.sol";
import {Script} from "forge-std/Script.sol";
import {MockQuoterV2} from "@src/anvil-swap-related/MockQuoterV2.sol";

contract DeployMockQuoterV2 is Script {
    function run() external returns (address) {
        vm.startBroadcast();
        MockQuoterV2 quoter = new MockQuoterV2();
        vm.stopBroadcast();

        console.log("MockQuoter deployed at:", address(quoter));

        return address(quoter);
    }
}
