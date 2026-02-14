// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/EscrowFactory.sol";
import "../src/MockAdapter.sol";
import "../src/VerificationOracle.sol";

contract DeployScript is Script {
    function run() external {
        vm.startBroadcast();

        address deployer = msg.sender;
        console.log("Deploying from:", deployer);
        console.log("Balance:", deployer.balance);

        MockArbitrationAdapter adapter = new MockArbitrationAdapter(msg.sender);
        VerificationOracle oracle = new VerificationOracle();
        EscrowFactory factory = new EscrowFactory();

        console.log("Deployed Factory at:", address(factory));
        console.log("Deployed MockAdapter at:", address(adapter));
        console.log("Deployed VerificationOracle at:", address(oracle));

        vm.stopBroadcast();
    }
}
