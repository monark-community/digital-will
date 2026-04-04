// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {console} from "forge-std/console.sol";
import {Script} from "forge-std/Script.sol";
import {WillFactory} from "@src/WillFactory.sol";
import {SMPartialInfo} from "@interfaces/SMInfo.sol";
import {SecurityPeriodConfig} from "@interfaces/SecurityPeriodConfig.sol";

contract DeployWill is Script {
    function run(address factoryAddress) external {
        // Start broadcasting with your deployer key
        vm.startBroadcast();

        // Deploy the factory
        WillFactory factory = WillFactory(factoryAddress);

        // Prepare the SM list
        SMPartialInfo[] memory smList = new SMPartialInfo[](2);
        smList[0] = SMPartialInfo({
            smAddress: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8,
            votePower: 1
        });
        smList[1] = SMPartialInfo({
            smAddress: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC,
            votePower: 1
        });

        // Configure the security period
        SecurityPeriodConfig memory config = SecurityPeriodConfig({
            minSecurityPeriod: 10 minutes,
            maxSecurityPeriod: 90 minutes
        });

        // Deploy a new Will through the factory
        address newWill = factory.createWill{value: 0.1 ether}(smList, config);
        vm.stopBroadcast();

        // Optional: log the address
        console.log("Deployed Will at:", newWill);
    }
}
