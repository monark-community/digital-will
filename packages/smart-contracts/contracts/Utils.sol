//SPDX-license-identifier: MIT

pragma solidity 0.8.19;

import {SMPartialInfo} from "@interfaces/SMInfo.sol";

import "@src/WillErrors.sol" as Errors;

library Utils {
    function checkNoSmDuplicates(SMPartialInfo[] memory a) internal pure {
        uint256 aLength = a.length;

        for (uint256 i = 0; i < aLength; i++) {
            for (uint256 j = i + 1; j < aLength; j++) {
                if (a[i].smAddress == a[j].smAddress)
                    revert Errors.ERR_DuplicateSM();
            }
        }
    }

    function checkNoSmDuplicates(address[] memory a) internal pure {
        uint256 aLength = a.length;

        for (uint256 i = 0; i < aLength; i++) {
            for (uint256 j = i + 1; j < aLength; j++) {
                if (a[i] == a[j]) revert Errors.ERR_DuplicateSM();
            }
        }
    }

    function checkNoSmDuplicates(
        SMPartialInfo[] memory a,
        SMPartialInfo[] memory b,
        address[] memory c
    ) internal pure {
        checkNoSmDuplicates(a);
        checkNoSmDuplicates(b);
        checkNoSmDuplicates(c);

        uint256 aLength = a.length;
        uint256 bLength = b.length;
        uint256 cLength = c.length;

        for (uint256 i = 0; i < aLength; i++) {
            for (uint256 j = 0; j < bLength; j++) {
                if (a[i].smAddress == b[j].smAddress)
                    revert Errors.ERR_DuplicateSM();
            }
            for (uint256 j = 0; j < cLength; j++) {
                if (a[i].smAddress == c[j]) revert Errors.ERR_DuplicateSM();
            }
        }

        for (uint256 i = 0; i < bLength; i++) {
            for (uint256 j = 0; j < cLength; j++) {
                if (b[i].smAddress == c[j]) revert Errors.ERR_DuplicateSM();
            }
        }
    }

    function checkIfAddressInArray(
        address addressToCheck,
        SMPartialInfo[] memory array
    ) internal pure returns (bool) {
        uint256 length = array.length;

        for (uint256 i = 0; i < length; i++) {
            if (array[i].smAddress == addressToCheck) {
                return true;
            }
        }

        return false;
    }
}
