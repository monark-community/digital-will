//SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import {SMState} from "@interfaces/SMState.sol";

struct SMInfo {
    SMState state; // SM State
    uint8 votePower; // Voting Power.
    uint8 index; // Index of SM in SM array + 1. Implicit limit of 255 people.
}

struct SMPartialInfo {
    address smAddress; // SM State
    uint8 votePower; // Voting Power.
}
