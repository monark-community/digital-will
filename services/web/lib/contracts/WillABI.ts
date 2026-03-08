export const WILL_ABI = [
  // ── Primary member ──────────────────────────────────────────
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

  // ── Secondary member ─────────────────────────────────────────
  {
    "inputs": [],
    "name": "validateSm",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "desistSm",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "declareDeath",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "swapAssets",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // ── View functions ────────────────────────────────────────────
  {
    "inputs": [],
    "name": "getState",
    "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "sm", "type": "address" }],
    "name": "getDetailedSm",
    "outputs": [
      {
        "components": [
          { "internalType": "uint8",  "name": "state",     "type": "uint8"  },
          { "internalType": "uint16", "name": "votePower", "type": "uint16" },
          { "internalType": "uint8",  "name": "index",     "type": "uint8"  }
        ],
        "internalType": "struct SMInfo",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getBalance",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "executionTimeStampS",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "cooldownTimeStampS",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "deathDeclarationTimestampS",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
] as const;
