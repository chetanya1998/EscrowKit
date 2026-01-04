export const FACTORY_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Anvil default deterministic deploy
export const FACTORY_ABI = [
    {
        "type": "function",
        "name": "createEscrow",
        "inputs": [
            { "name": "payee", "type": "address", "internalType": "address" },
            { "name": "arbiter", "type": "address", "internalType": "address" },
            { "name": "arbitrationAdapter", "type": "address", "internalType": "address" },
            { "name": "detailsHash", "type": "bytes32", "internalType": "bytes32" }
        ],
        "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
        "stateMutability": "payable"
    },
    {
        "type": "event",
        "name": "EscrowCreated",
        "inputs": [
            { "name": "escrowAddress", "type": "address", "indexed": true, "internalType": "address" },
            { "name": "payer", "type": "address", "indexed": true, "internalType": "address" },
            { "name": "payee", "type": "address", "indexed": true, "internalType": "address" },
            { "name": "arbiter", "type": "address", "indexed": false, "internalType": "address" }
        ],
        "anonymous": false
    }
] as const;
