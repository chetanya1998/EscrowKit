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
            { "indexed": true, "internalType": "uint256", "name": "milestoneId", "type": "uint256" },
            { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
            { "indexed": false, "internalType": "string", "name": "description", "type": "string" },
            { "indexed": false, "internalType": "uint256", "name": "deadline", "type": "uint256" }
        ],
        "name": "MilestoneUpdated",
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
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "uint256", "name": "milestoneId", "type": "uint256" },
            { "indexed": false, "internalType": "bytes32", "name": "deliverableHash", "type": "bytes32" }
        ],
        "name": "MilestoneSubmitted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "uint256", "name": "milestoneId", "type": "uint256" }
        ],
        "name": "MilestoneApproved",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "uint256", "name": "milestoneId", "type": "uint256" },
            { "indexed": true, "internalType": "address", "name": "payee", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "MilestoneReleased",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "uint256", "name": "milestoneId", "type": "uint256" },
            { "indexed": true, "internalType": "address", "name": "payer", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "MilestoneRefunded",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "uint256", "name": "milestoneId", "type": "uint256" },
            { "indexed": false, "internalType": "uint256", "name": "disputeId", "type": "uint256" }
        ],
        "name": "DisputeOpened",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "uint256", "name": "milestoneId", "type": "uint256" },
            { "indexed": false, "internalType": "bytes32", "name": "conditionHash", "type": "bytes32" }
        ],
        "name": "VerificationRequested",
        "type": "event"
    },
    // Functions for reading state
    {
        "inputs": [{ "internalType": "uint256", "name": "milestoneId", "type": "uint256" }],
        "name": "getMilestone",
        "outputs": [
            {
                "components": [
                    { "internalType": "uint256", "name": "amount", "type": "uint256" },
                    { "internalType": "string", "name": "description", "type": "string" },
                    { "internalType": "uint256", "name": "deadline", "type": "uint256" },
                    { "internalType": "enum IMilestoneEscrow.MilestoneStatus", "name": "status", "type": "uint8" },
                    { "internalType": "bytes32", "name": "deliverableHash", "type": "bytes32" },
                    { "internalType": "uint256", "name": "disputeId", "type": "uint256" },
                    { "internalType": "bytes32", "name": "conditionHash", "type": "bytes32" }
                ],
                "internalType": "struct IMilestoneEscrow.Milestone",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

export const VerificationOracleABI = [
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "bytes32", "name": "conditionHash", "type": "bytes32" },
            { "indexed": true, "internalType": "address", "name": "verifier", "type": "address" },
            { "indexed": false, "internalType": "bool", "name": "status", "type": "bool" }
        ],
        "name": "VerificationAttested",
        "type": "event"
    }
] as const;
