// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {console} from "forge-std/console.sol";
import {Script} from "forge-std/Script.sol";
import {WillFactory} from "@src/WillFactory.sol";

contract DeployWillFactory is Script {
    function run() external returns (address) {
        // Start broadcasting (signer will send tx)
        vm.startBroadcast();

        // Deploy the WillFactory contract
        WillFactory factory = new WillFactory();

        vm.stopBroadcast();

        console.log("Deployed WillFactory at:", address(factory));
        return address(factory);
    }
}
