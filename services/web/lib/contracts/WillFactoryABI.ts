/**
 * WillFactory Contract ABI
 */

export const WILL_FACTORY_ABI = [
  {
    "type": "event",
    "name": "EVT_WillCreated",
    "inputs": [
      {
        "name": "willAddress",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "mpAddress",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "function",
    "name": "createWill",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "newSmList",
        "type": "tuple[]",
        "internalType": "struct SMPartialInfo[]",
        "components": [
          {
            "name": "smAddress",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "votePower",
            "type": "uint8",
            "internalType": "uint8"
          }
        ]
      },
      {
        "name": "securityPeriodConfig",
        "type": "tuple",
        "internalType": "struct SecurityPeriodConfig",
        "components": [
          {
            "name": "minSecurityPeriod",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "maxSecurityPeriod",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "payable"
  }
] as const;
