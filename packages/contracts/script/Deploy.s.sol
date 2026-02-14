// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/EscrowFactory.sol";
import "../src/MockAdapter.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0));
        if (deployerPrivateKey == 0) {
            deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80; // Default anvil key
        }
        
        vm.startBroadcast(deployerPrivateKey);

        MockArbitrationAdapter adapter = new MockArbitrationAdapter(msg.sender);
        VerificationOracle oracle = new VerificationOracle();
        EscrowFactory factory = new EscrowFactory();

        console.log("Deployed Factory at:", address(factory));
        console.log("Deployed MockAdapter at:", address(adapter));
        console.log("Deployed VerificationOracle at:", address(oracle));

        vm.stopBroadcast();
    }
}
