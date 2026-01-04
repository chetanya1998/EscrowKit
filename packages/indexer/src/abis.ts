export const EscrowFactoryABI = [
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "address", "name": "escrowAddress", "type": "address" },
            { "indexed": true, "internalType": "address", "name": "payer", "type": "address" },
            { "indexed": true, "internalType": "address", "name": "payee", "type": "address" },
            { "indexed": false, "internalType": "address", "name": "arbiter", "type": "address" }
        ],
        "name": "EscrowCreated",
        "type": "event"
    }
] as const;

export const MilestoneEscrowABI = [
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "uint256", "name": "milestoneId", "type": "uint256" },
            { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "MilestoneAdded",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "address", "name": "funder", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "MilestoneFunded",
        "type": "event"
    }
    // Add other events as needed
] as const;
