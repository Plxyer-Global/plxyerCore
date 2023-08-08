// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IKeyNFT{
    function mint(address to, uint256 id, uint256 amount, bytes memory data)  external;
    function batchMint(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) external;
}