export const WILL_ABI = [
  {
    "inputs": [],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "cancelWill",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          { "internalType": "address", "name": "smAddress", "type": "address" },
          { "internalType": "uint8", "name": "votePower", "type": "uint8" }
        ],
        "internalType": "struct SMPartialInfo[]",
        "name": "updatedSmList",
        "type": "tuple[]"
      },
      {
        "components": [
          { "internalType": "address", "name": "smAddress", "type": "address" },
          { "internalType": "uint8", "name": "votePower", "type": "uint8" }
        ],
        "internalType": "struct SMPartialInfo[]",
        "name": "addedSmList",
        "type": "tuple[]"
      },
      {
        "internalType": "address[]",
        "name": "deletedSmList",
        "type": "address[]"
      },
      {
        "components": [
          { "internalType": "uint256", "name": "minSecurityPeriod", "type": "uint256" },
          { "internalType": "uint256", "name": "maxSecurityPeriod", "type": "uint256" }
        ],
        "internalType": "struct SecurityPeriodConfig",
        "name": "securityPeriodConfig",
        "type": "tuple"
      }
    ],
    "name": "updateWill",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
] as const;
