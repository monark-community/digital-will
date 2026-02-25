// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {Test} from "forge-std/Test.sol";

import {Utils} from "@src/Utils.sol";

import {SMPartialInfo} from "@interfaces/SMInfo.sol";
import "@src/WillErrors.sol" as Errors;

contract UtilsWrapper {
    function exposedCheckNoSmDuplicates(
        SMPartialInfo[] memory a
    ) external pure {
        Utils.checkNoSmDuplicates(a);
    }

    function exposedCheckNoSmDuplicates(address[] memory a) external pure {
        Utils.checkNoSmDuplicates(a);
    }

    function exposedCheckNoSmDuplicates3(
        SMPartialInfo[] memory a,
        SMPartialInfo[] memory b,
        address[] memory c
    ) external pure {
        Utils.checkNoSmDuplicates(a, b, c);
    }

    function exposedCheckIfAddressInArray(
        address addr,
        SMPartialInfo[] memory a
    ) external pure returns (bool) {
        return Utils.checkIfAddressInArray(addr, a);
    }
}

contract UtilsTest is Test {
    UtilsWrapper wrapper;

    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address charlie = makeAddr("charlie");
    address diana = makeAddr("diana");

    function setUp() public {
        wrapper = new UtilsWrapper();
    }

    //////////////////////////////////////////////////////////
    // checkNoSmDuplicates(SMPartialInfo[] memory a)
    //////////////////////////////////////////////////////////
    function test_CheckNoSmDuplicates_SingleArray_SMPartialInfo_NoDuplicates()
        public
        view
    {
        SMPartialInfo[] memory arr = new SMPartialInfo[](2);

        arr[0] = SMPartialInfo({smAddress: alice, votePower: 1});
        arr[1] = SMPartialInfo({smAddress: bob, votePower: 2});

        wrapper.exposedCheckNoSmDuplicates(arr);
    }

    function test_CheckNoSmDuplicates_SingleArray_SMPartialInfo_Duplicates()
        public
    {
        SMPartialInfo[] memory arr = new SMPartialInfo[](2);

        arr[0] = SMPartialInfo({smAddress: alice, votePower: 1});
        arr[1] = SMPartialInfo({smAddress: alice, votePower: 2});

        vm.expectRevert(Errors.ERR_DuplicateSM.selector);
        wrapper.exposedCheckNoSmDuplicates(arr);
    }

    function test_CheckNoSmDuplicates_SingleArray_SMPartialInfo_Empty()
        public
        view
    {
        SMPartialInfo[] memory arr = new SMPartialInfo[](0);

        wrapper.exposedCheckNoSmDuplicates(arr);
    }

    //////////////////////////////////////////////////////////
    // checkNoSmDuplicates(address[] memory a)
    //////////////////////////////////////////////////////////
    function test_CheckNoSmDuplicates_SingleArray_Addresses_NoDuplicates()
        public
        view
    {
        address[] memory arr = new address[](2);

        arr[0] = alice;
        arr[1] = bob;

        wrapper.exposedCheckNoSmDuplicates(arr);
    }

    function test_CheckNoSmDuplicates_SingleArray_Addresses_Duplicates()
        public
    {
        address[] memory arr = new address[](2);

        arr[0] = alice;
        arr[1] = alice;

        vm.expectRevert(Errors.ERR_DuplicateSM.selector);
        wrapper.exposedCheckNoSmDuplicates(arr);
    }

    function test_CheckNoSmDuplicates_SingleArray_Addresses_Empty()
        public
        view
    {
        address[] memory arr = new address[](0);

        wrapper.exposedCheckNoSmDuplicates(arr);
    }

    //////////////////////////////////////////////////////////
    // function checkNoSmDuplicates(
    //    SMPartialInfo[] memory a,
    //    SMPartialInfo[] memory b,
    //    address[] memory c
    // )
    //////////////////////////////////////////////////////////
    function testcheckNoSmDuplicates_TripleArrays_DuplicateA() public {
        SMPartialInfo[] memory a = new SMPartialInfo[](2);
        SMPartialInfo[] memory b = new SMPartialInfo[](0);
        address[] memory c = new address[](0);

        a[0] = SMPartialInfo({smAddress: alice, votePower: 1});
        a[1] = SMPartialInfo({smAddress: alice, votePower: 2}); // duplicate

        vm.expectRevert(Errors.ERR_DuplicateSM.selector);
        wrapper.exposedCheckNoSmDuplicates3(a, b, c);
    }

    function testcheckNoSmDuplicates_TripleArrays_DuplicateB() public {
        SMPartialInfo[] memory a = new SMPartialInfo[](0);
        SMPartialInfo[] memory b = new SMPartialInfo[](2);
        address[] memory c = new address[](0);

        b[0] = SMPartialInfo({smAddress: bob, votePower: 1});
        b[1] = SMPartialInfo({smAddress: bob, votePower: 2}); // duplicate

        vm.expectRevert(Errors.ERR_DuplicateSM.selector);
        wrapper.exposedCheckNoSmDuplicates3(a, b, c);
    }

    function testcheckNoSmDuplicates_TripleArrays_DuplicateC() public {
        SMPartialInfo[] memory a = new SMPartialInfo[](0);
        SMPartialInfo[] memory b = new SMPartialInfo[](0);
        address[] memory c = new address[](2);

        c[0] = charlie;
        c[1] = charlie; // duplicate

        vm.expectRevert(Errors.ERR_DuplicateSM.selector);
        wrapper.exposedCheckNoSmDuplicates3(a, b, c);
    }

    function testcheckNoSmDuplicates_TripleArrays_DuplicateAB() public {
        SMPartialInfo[] memory a = new SMPartialInfo[](1);
        SMPartialInfo[] memory b = new SMPartialInfo[](1);
        address[] memory c = new address[](0);

        a[0] = SMPartialInfo({smAddress: alice, votePower: 1});
        b[0] = SMPartialInfo({smAddress: alice, votePower: 3}); // duplicate

        vm.expectRevert(Errors.ERR_DuplicateSM.selector);
        wrapper.exposedCheckNoSmDuplicates3(a, b, c);
    }

    function testcheckNoSmDuplicates_TripleArrays_DuplicateAC() public {
        SMPartialInfo[] memory a = new SMPartialInfo[](1);
        SMPartialInfo[] memory b = new SMPartialInfo[](0);
        address[] memory c = new address[](1);

        a[0] = SMPartialInfo({smAddress: alice, votePower: 1});
        c[0] = alice; // duplicate

        vm.expectRevert(Errors.ERR_DuplicateSM.selector);
        wrapper.exposedCheckNoSmDuplicates3(a, b, c);
    }

    function testcheckNoSmDuplicates_TripleArrays_DuplicateBC() public {
        SMPartialInfo[] memory a = new SMPartialInfo[](0);
        SMPartialInfo[] memory b = new SMPartialInfo[](1);
        address[] memory c = new address[](1);

        b[0] = SMPartialInfo({smAddress: alice, votePower: 1});
        c[0] = alice; // duplicate

        vm.expectRevert(Errors.ERR_DuplicateSM.selector);
        wrapper.exposedCheckNoSmDuplicates3(a, b, c);
    }

    function testcheckNoSmDuplicates_TripleArrays_DuplicateABC() public {
        SMPartialInfo[] memory a = new SMPartialInfo[](1);
        SMPartialInfo[] memory b = new SMPartialInfo[](1);
        address[] memory c = new address[](1);

        a[0] = SMPartialInfo({smAddress: alice, votePower: 1});
        b[0] = SMPartialInfo({smAddress: alice, votePower: 2}); // duplicate
        c[0] = alice; // duplicate

        vm.expectRevert(Errors.ERR_DuplicateSM.selector);
        wrapper.exposedCheckNoSmDuplicates3(a, b, c);
    }

    function testcheckNoSmDuplicates_TripleArrays_NoDuplicateA() public view {
        SMPartialInfo[] memory a = new SMPartialInfo[](2);
        SMPartialInfo[] memory b = new SMPartialInfo[](0);
        address[] memory c = new address[](0);

        a[0] = SMPartialInfo({smAddress: alice, votePower: 1});
        a[1] = SMPartialInfo({smAddress: bob, votePower: 1});

        wrapper.exposedCheckNoSmDuplicates3(a, b, c);
    }

    function testcheckNoSmDuplicates_TripleArrays_NoDuplicateB() public view {
        SMPartialInfo[] memory a = new SMPartialInfo[](0);
        SMPartialInfo[] memory b = new SMPartialInfo[](2);
        address[] memory c = new address[](0);

        b[0] = SMPartialInfo({smAddress: charlie, votePower: 1});
        b[1] = SMPartialInfo({smAddress: diana, votePower: 1});

        wrapper.exposedCheckNoSmDuplicates3(a, b, c);
    }

    function testcheckNoSmDuplicates_TripleArrays_NoDuplicateC() public view {
        SMPartialInfo[] memory a = new SMPartialInfo[](0);
        SMPartialInfo[] memory b = new SMPartialInfo[](0);
        address[] memory c = new address[](2);

        c[0] = charlie;
        c[1] = diana;

        wrapper.exposedCheckNoSmDuplicates3(a, b, c);
    }

    function testcheckNoSmDuplicates_TripleArrays_NoDuplicateAB() public view {
        SMPartialInfo[] memory a = new SMPartialInfo[](2);
        SMPartialInfo[] memory b = new SMPartialInfo[](2);
        address[] memory c = new address[](0);

        a[0] = SMPartialInfo({smAddress: alice, votePower: 1});
        a[1] = SMPartialInfo({smAddress: bob, votePower: 1});
        b[0] = SMPartialInfo({smAddress: charlie, votePower: 1});
        b[1] = SMPartialInfo({smAddress: diana, votePower: 1});

        wrapper.exposedCheckNoSmDuplicates3(a, b, c);
    }

    function testcheckNoSmDuplicates_TripleArrays_NoDuplicateAC() public view {
        SMPartialInfo[] memory a = new SMPartialInfo[](2);
        SMPartialInfo[] memory b = new SMPartialInfo[](0);
        address[] memory c = new address[](2);

        a[0] = SMPartialInfo({smAddress: alice, votePower: 1});
        a[1] = SMPartialInfo({smAddress: bob, votePower: 1});
        c[0] = charlie;
        c[1] = diana;

        wrapper.exposedCheckNoSmDuplicates3(a, b, c);
    }

    function testcheckNoSmDuplicates_TripleArrays_NoDuplicateBC() public view {
        SMPartialInfo[] memory a = new SMPartialInfo[](0);
        SMPartialInfo[] memory b = new SMPartialInfo[](2);
        address[] memory c = new address[](2);

        b[0] = SMPartialInfo({smAddress: alice, votePower: 1});
        b[1] = SMPartialInfo({smAddress: bob, votePower: 1});
        c[0] = charlie;
        c[1] = diana;

        wrapper.exposedCheckNoSmDuplicates3(a, b, c);
    }

    function testcheckNoSmDuplicates_TripleArrays_NoDuplicateABC() public view {
        SMPartialInfo[] memory a = new SMPartialInfo[](1);
        SMPartialInfo[] memory b = new SMPartialInfo[](1);
        address[] memory c = new address[](2);

        a[0] = SMPartialInfo({smAddress: alice, votePower: 1});
        b[0] = SMPartialInfo({smAddress: bob, votePower: 1});
        c[0] = charlie;
        c[1] = diana;

        wrapper.exposedCheckNoSmDuplicates3(a, b, c);
    }

    function testcheckNoSmDuplicates_TripleArrays_Empty() public view {
        SMPartialInfo[] memory a = new SMPartialInfo[](0);
        SMPartialInfo[] memory b = new SMPartialInfo[](0);
        address[] memory c = new address[](0);

        wrapper.exposedCheckNoSmDuplicates3(a, b, c);
    }
}
