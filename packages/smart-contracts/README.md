# Willchain Smart Contracts

This project implements a **decentralized inheritance (will) system** using Solidity smart contracts. A **Primary Member (PM)** creates a will and assigns **Secondary Members (SMs)** who participate in validating death declarations before assets are executed. The PM can veto a declaration and place the contract on cooldown. Asset conversion is modeled after Uniswap V3 and is currently tested with mocks.

The package is built with **Solidity + Foundry** and includes a **Makefile** for common development, deployment, and interaction flows.

---

## Setup Instructions

### 1. Install Required Tools
- Install the **Juan Blanco Solidity** extension in your editor: [link](https://marketplace.visualstudio.com/items?itemName=JuanBlanco.solidity)
- Install **Foundry**: [https://getfoundry.sh/](https://getfoundry.sh/)
- Install **make**

### 2. Configure Solidity Compiler Version
- Open VSCode and press `Ctrl+Shift+P`
- Add the following to your settings (`settings.json`):
```json
"solidity.compileUsingRemoteVersion": "0.8.19"
```

### 3. Building Locally with Forge
- Run `make install` to install dependencies.
- Run `make build` to compile the contracts.

### 4. Testing
Use Forge to run tests and coverage:

```bash
forge test # Runs all tests
forge test --mp tests/WillTestDeclaration.t.sol # Specify file to run tests of
forge coverage # Shows coverage in terminal
forge coverage --report lcov # (needs sudo apt install lcov)
genhtml lcov.info --output-directory coverage-report # generates a html doc with all covered lines.
```

Test files include:
- `WillTestCreate.t.sol` - Tests will creation, initial state, and basic setup.
- `WillTestAssetMgmt.t.sol` - Tests asset management: deposits, withdrawals, and swaps.
- `WillTestDeclaration.t.sol` - Tests death declaration, veto, and execution logic.
- `WillTestSmParticipation.t.sol` - Tests SM validation, participation, and desist functionality.
- `WillTestUpdate.t.sol` - Tests will updates: adding/removing SMs and changing security periods.
- `WillFactoryTest.t.sol` - Tests factory deployment and will creation through factory.
- `UtilsTest.t.sol` - Tests utility functions and helpers.

Coverage results show 100% coverage for the core contracts (`Will.sol`, `WillFactory.sol`) and utilities (`Utils.sol`). Mock contracts are not covered because they are simplified local test doubles, and deployment scripts are not testable in Foundry.

---

## Architecture Overview

The system consists of:

### WillFactory
`WillFactory.sol` deploys new `Will` contracts. It gathers the on-chain `SwapConfig` from `ConfigUtils.sol` based on `block.chainid`, then deploys a `Will` with the caller as PM. This centralizes deployment and ensures every will receives the correct swap configuration.

### Will Contract
`Will.sol` is the core contract. It:
- Stores deposited ETH
- Maintains the list of Secondary Members (SMs)
- Controls SM validation and death declaration logic
- Computes execution timing using security periods and vote power
- Allows PM deposits, withdrawals, updates, and cancellations
- Swaps assets to USDC after execution

#### SM storage design
SMs are tracked with an array (`smListS`) and a mapping (`smMappingS`). The array stores ordered addresses for iteration, while the mapping enables O(1) lookups by address. Each `SMInfo` contains a `uint8 index` that is 1-based, with `0` meaning the SM is not found. When an SM is removed, the contract swaps the deleted SM with the last array element to maintain compact storage.

#### Limits and gas tradeoffs
- Maximum SM count is implicitly limited to `255` by the `uint8` index.
- Individual SM vote power is capped at `255`.
- Total vote power is stored as `uint16`, so it can grow beyond `255`.

This balance conserves gas while keeping the system practical for typical use cases.

### Mock Contracts (Testing Only)
Mocks are used to simulate Uniswap V3 behavior for local testing:
- `MockWETH.sol`
- `MockUSDC.sol`
- `MockSwapRouter.sol`
- `MockQuoter.sol`

They are not production contracts; they exist to validate ETH/WETH wrapping and swap logic without using real liquidity.

### Contract Interactions
`WillFactory` deploys `Will` contracts with the selected chain configuration. Each `Will` manages its own asset and SM workflow. The PM controls deposits, withdrawals, updates, vetoes, and cancellation. SMs validate participation, declare death, and execute swaps after the security period.

### State Machine
The will moves through four states:
- `CANCELED`
- `INACTIVE`
- `ACTIVE`
- `EXECUTED`

Workflow:
1. After creation, the contract is `INACTIVE`.
2. SMs call `validateSm()` to move from `PENDING` to `VALIDATED`.
3. When every SM is validated, the contract becomes `ACTIVE`.
4. Any SM can call `declareDeath()`. The first declaration sets `deathDeclarationTimestampS`, and each declaration adds that SM's `votePower` to `cumulatedVotePowerS`.
5. The execution timestamp is computed as:
   `executionTimeStampS = deathDeclarationTimestampS + minSecurityPeriod + (maxSecurityPeriod - minSecurityPeriod) * (totalVotePowerS - cumulatedVotePowerS) / totalVotePowerS`

This ensures the contract waits at least `minSecurityPeriod` and shortens the remaining delay as more vote power declares death.

6. Before the execution time passes, the PM can call `vetoDeath()`. This:
   - sets `cooldownTimeStampS` to `block.timestamp + COOLDOWN_PERIOD`
   - resets `deathDeclarationTimestampS` and `executionTimeStampS` to `0`
   - resets declared SMs back to `VALIDATED`

7. During cooldown, the PM may still update the contract.
8. After cooldown expires, SM declarations can resume.
9. Once the execution timestamp has passed, the PM can no longer modify the contract state, and SMs can only call `swapAssets()` to liquidate ETH into USDC and set the state to `EXECUTED`.

If all SMs desist, the will cancels and the PM can withdraw remaining funds.

The current cooldown is defined in `constants/Will.c.sol` and is set to `3 minutes` for testing.

### Update mechanism
The PM can update the will through `updateWill()` using four optional inputs:
- `updatedSmList` to change vote powers of existing SMs
- `addedSmList` to add new SMs
- `deletedSmList` to remove SMs
- `securityPeriodConfig` to change timing

Rules:
- If `securityPeriodConfig.maxSecurityPeriod != 0`, the contract updates the security period.
- To keep the current security period, pass `(0,0)`.
- To leave SM membership unchanged, pass empty arrays.
- Updates are only allowed when the will is not canceled, not executed, before the security period starts, and before the execution time passes.

The implementation validates SM existence, duplicates, and vote power, then updates existing SMs, adds new SMs, and deletes removed SMs.

### Extending to Several Networks
`ConfigUtils.sol` currently supports:
- Sepolia (`block.chainid == 11155111`)
- Anvil (`block.chainid == 31337`)

To add a new network, extend `ConfigUtils.getConfig()` and update `constants/Will.c.sol` with the proper `SwapRouter`, `Quoter`, `WETH`, `USDC`, and pool fee values. Production deployments should use real Uniswap V3 contracts instead of mocks.

### Key Interfaces

The following Solidity interfaces are central to the system. Enum values are returned as integers in public getters.

#### `SMState` and `SMInfo`
```solidity
enum SMState {
    PENDING,        // 0
    VALIDATED,      // 1
    DECLARED_DEATH  // 2
}

struct SMInfo {
    SMState state;
    uint8 votePower;
    uint8 index; // 1-based index into smListS; 0 = not found
}

struct SMPartialInfo {
    address smAddress;
    uint8 votePower;
}
```

#### `WillState`
```solidity
enum WillState {
    CANCELED,  // 0
    INACTIVE,  // 1
    ACTIVE,    // 2
    EXECUTED   // 3
}
```

#### `SecurityPeriodConfig`
```solidity
struct SecurityPeriodConfig {
    uint256 minSecurityPeriod;
    uint256 maxSecurityPeriod;
}
```

#### `SwapConfig`
```solidity
struct SwapConfig {
    address swapRouter;
    address quoter;
    address wNative;
    address usdc;
    uint24 poolFee;
}
```

#### Uniswap-style interfaces
```solidity
interface IQuoterV2 {
    function quoteExactInputSingle(QuoteExactInputSingleParams calldata params)
        external
        returns (
            uint256 amountOut,
            uint160 sqrtPriceX96After,
            uint32 initializedTicksCrossed,
            uint256 gasEstimate
        );
}

interface ISwapRouter {
    function exactInputSingle(ExactInputSingleParams calldata params)
        external
        payable
        returns (uint256 amountOut);
}

interface IWETH {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
}
```

### Public Functions and Getters

#### `WillFactory`
- `createWill(SMPartialInfo[] memory newSmList, SecurityPeriodConfig memory securityPeriodConfig) external payable returns (address)`

#### `Will` management
- `createNewWill(...) external payable`
- `updateWill(...) external`
- `cancelWill()`

#### `Asset` management
- `deposit() external payable`
- `withdraw(uint256 amount) external`
- `swapAssets() external returns (uint256)`

#### `SM` participation
- `validateSm() external`
- `desistSm() external`

#### `Death` declaration
- `declareDeath() external`
- `vetoDeath() external`

#### Visible `getters`
- `getSmList()`
- `getDetailedSm(address sm)`
- `getSecurityPeriodConfig()`
- `getCooldownEndTimestamp()`
- `getState()`
- `getExecutionPossibleTimestamp()`
- `getBalance()`
- `getWethBalance()`
- `getUsdcBalance()`

#### Implicit `public getters`
- `PM_I()`
- `securityPeriodConfigS()`
- `swapConfigS()`
- `willStateS()`
- `deathDeclarationTimestampS()`
- `executionTimeStampS()`
- `cooldownTimeStampS()`
- `totalVotePowerS()`
- `cumulatedVotePowerS()`

Note: `smListS` and `smMappingS` are private, so explicit getters are used instead of implicit ones.

---

## Makefile Explained

The Makefile provides a local workflow for building, deploying, and interacting with the contracts.

### Defaults
- `USER_ID = 0` is the default PM.
- `SM_ID = 1` is the default SM.
- Wallets 0-9 are preconfigured with Anvil keys.

Note: `USER_ID` and `SM_ID` select the Anvil wallet address and private key used by Makefile commands. The `WillDeploy.s.sol` script itself receives actual addresses passed from the Makefile, so you can override the default account selection for real network testing by adjusting the variables or script inputs. 

### Installation and build
- `make install` - Installs Foundry dependencies and libraries (forge-std, Uniswap V3, OpenZeppelin).
- `make clean` - Removes deployment artifact files (.temp_factory_address.txt, .temp_will_address.txt).
- `make full-clean` - Cleans build artifacts and removes the .lib directory.
- `make build` - Compiles all contracts using Forge.

### Deployment
- `make deploy-all-exec-mocks USER_ID=X` - Deploys all mock contracts (MockWETH, MockUSDC, MockSwapRouter, MockQuoter) to the network.
- `make deploy-factory USER_ID=X` - Deploys the WillFactory contract using the specified USER_ID.
- `make deploy-will USER_ID=X` - Deploys a Will contract using the deployed factory and specified USER_ID.

If you want to call functions on a different deployed Will contract, write its address into `.temp_will_address.txt`. The same logic applies for a custom factory contract address: write it into `.temp_factory_address.txt`.

### Getters
- `make call-get-pm` - Retrieves the Primary Member (PM) address.
- `make call-get-sm SM_ID=X` - Retrieves detailed info for the SM with the specified SM_ID.
- `make call-get-sm-list` - Retrieves the list of all SM addresses.
- `make call-get-balance-sepeth` - Retrieves the contract's ETH balance.
- `make call-get-balance-weth` - Retrieves the contract's WETH balance.
- `make call-get-balance-usdc` - Retrieves the contract's USDC balance.
- `make call-get-cooldown-end-time` - Retrieves the cooldown end timestamp.
- `make call-get-security-period-config` - Retrieves the security period configuration (min and max periods).
- `make call-get-exec-time` - Retrieves the execution timestamp.
- `make call-get-death-declare-time` - Retrieves the death declaration timestamp.
- `make call-get-totalValidatedPts` - Retrieves the total validated vote power.
- `make call-get-cumulatedPts` - Retrieves the cumulated declared vote power.
- `make call-get-state` - Retrieves the current will state.

### State-changing interactions
- `make call-deposit USER_ID=X` - Deposits ETH into the will using the specified USER_ID.
- `make call-withdraw USER_ID=X` - Withdraws ETH from the will using the specified USER_ID.
- `make call-swapAssets SM_ID=X` - Executes asset swap to USDC using the specified SM_ID.
- `make call-validate SM_ID=X` - Validates SM participation using the specified SM_ID.
- `make call-desist SM_ID=X` - Desists SM participation using the specified SM_ID.
- `make call-declare SM_ID=X` - Declares death using the specified SM_ID.
- `make call-veto USER_ID=X` - Vetos death declaration using the specified USER_ID.
- `make call-cancel USER_ID=X` - Cancels the will using the specified USER_ID.
- `make call-create-new-will USER_ID=X` - Creates a new will using the specified USER_ID.
- `make call-update-sm-upd USER_ID=X` - Updates existing SM vote powers using the specified USER_ID.
- `make call-update-sm-add USER_ID=X` - Adds new SMs using the specified USER_ID.
- `make call-update-sm-del USER_ID=X` - Deletes SMs using the specified USER_ID.
- `make call-update-sec-upd USER_ID=X` - Updates security period configuration using the specified USER_ID.

### Mock utility
- `make call-withdraw-weth-as-eth-from-router USER_ID=X` - Withdraws WETH as ETH from the mock router.

When testing the mock router, use the same deployer key for router deployment and withdrawal.
