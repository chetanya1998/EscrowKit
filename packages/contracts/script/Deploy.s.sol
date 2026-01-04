// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/EscrowFactory.sol";
import "../src/MockAdapter.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0));
        if (deployerPrivateKey == 0) {
            deployerPrivateKey = uint256(keccak256("anvil")); // Default anvil key 0xac09...
        }
        
        vm.startBroadcast(deployerPrivateKey);

        MockArbitrationAdapter adapter = new MockArbitrationAdapter(msg.sender);
        EscrowFactory factory = new EscrowFactory();

        console.log("Deployed Factory at:", address(factory));
        console.log("Deployed MockAdapter at:", address(adapter));

        vm.stopBroadcast();
    }
}
