# Willchain Smart Contracts

This project implements a **decentralized inheritance (will) system** using Ethereum smart contracts.  
A **Primary Member (PM)** creates a will and assigns **Secondary Members (SMs)** who participate in validating or contesting death declarations before the inheritance is executed. It is executed using UniSwapv3's design and interfaces. We mock the behaviour of UniSwapv3 on localnet and testnets. 

The project is built using **Solidity + Foundry** and includes tooling via a **Makefile** to simplify deployment, interaction, and testing.

---

# Architecture Overview

The system is composed of several components:

## WillFactory
Responsible for deploying new `Will` contracts.

## Will Contract
The core contract that:

- Stores deposited funds
- Maintains the list of Security Members
- Handles validation and declaration logic
- Controls execution timing and security periods
- Allows deposits, withdrawals, and asset swaps

## Mock Contracts (Testing Only)

These simulate external dependencies for local testing.

- MockWETH
- MockUSDC
- MockSwapRouter
- MockQuoter

They allow testing **ETH wrapping and swap logic** without real liquidity pools.

---


# Setup Instructions

## 1. Install Required Tools
- Install the **Juan Blanco Solidity** extension in your editor: [link](https://marketplace.visualstudio.com/items?itemName=JuanBlanco.solidity)  
- Install **Foundry** on your system: [https://getfoundry.sh/](https://getfoundry.sh/)
- Install **make**

## 2. Configure Solidity Compiler Version
- Open VSCode and press `Ctrl+Shift+P` to open the command palette  
- Add the following line to your settings (`settings.json`):
```json
"solidity.compileUsingRemoteVersion": "0.8.19"
```

## 3. Using the Makefile
The Makefile.example provided is to be put into a new file called ```Makefile```.
It's purpose is to simplify the build, deployment and testing of the different smart contracts involved in the project. Make sure to ```make install``` to install necessary dependencies. ```make clean``` will clear everything.
<br>
<br>
Whenever we refer to ```ID```, we mean the ```ID```'th wallet among the 10 given by default when running anvil. You can specify who calls the function sometimes by assigning values to ```USER_ID``` and ```SM_ID```. 
<br>
<br>
By default, ```USER_ID = 0``` and ```SM_ID = 0```.
<br>
<br>
By default, ```wallet 0``` is the PM, and ```wallets 1``` and ```2``` are SM in the will deployed by default. See code in ```WillDeploy.s.sol```.

The following is for building and deploying. Please note the output of the deploy-all-exec-mocks task to see what to put in Will.c.sol. You'll have to build another time before deploying the factory because of constants:
```bash
make build && make deploy-all-exec-mocks 
make build && make deploy-factory && make deploy-will
```

The following are getters, no user mentioned because this info is publicly available, not restricted to people involved :
```bash
make call-get-sm SM_ID=X
make call-get-sm-list
make call-get-balance-sepeth
make call-get-balance-weth
make call-get-balance-usdc
make call-cooldown-end-time
make call-security-period-config
make call-exec-time
make call-state
```

The following involve money-transfers :
```bash
make call-deposit USER_ID=X
make call-withdraw USER_ID=X
make call-swapAssets SM_ID=X
```

The following involve SM-participation:
```bash
make call-validate SM_ID=X
make call-desist SM_ID=X
```

The following involve declaration related actions :
```bash
make call-declare SM_ID=X
make call-veto USER_ID=X
```
The following are will-management related. Please check inside code of functions to check what params to update.
```bash
make call-cancel USER_ID=X
# Update related, see code in Makefile to adjust what params are sent.
make call-create-new-will USER_ID=X
make call-update-sm-upd USER_ID=X
make call-update-sm-add USER_ID=X
make call-update-sm-del USER_ID=X
make call-update-sec-upd USER_ID=X
```
## 4. Testing

Following commands help with testing. See description to understand what they do. 

```bash
forge test # Runs all tests

forge test --mp tests/WillTestDeclaration.t.sol # Specify file to run tests of

forge coverage # Shows coverage in terminal

forge coverage --report lcov # (needs sudo apt install lcov)

genhtml lcov.info --output-directory coverage-report # generates a html doc with all covered lines.
```


## 5. Testing swap
You must do in order:
```bash
anvil
make build && make deploy-all-exec-mocks
```
Then, you must write down the addresses in Will.c.sol, build again, then deploy factory and will. To scale up to other networks, modify ConfigUtils.sol and add correspondent constants.
<br><br>
The swap will make it so that the router accumulates Wrapped ETH for example. In order to get back all those native coins, just do:
```
make call-withdraw-weth-as-eth-from-router USER_ID=X
``` 
CAREFUL TO USE THE SAME USER_ID AND KEY AS THE ONE THAT DEPLOYED THE ROUTER TO BEGIN WITH. MODIFY ADDRESSES OF WETH, AND ROUTER DIRECTLY IN MAKEFILE.