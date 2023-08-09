// SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/interfaces/IERC1155.sol";
pragma solidity ^0.8.9;

interface IKeyNFT is IERC1155{
    function mint(address to, uint256 id, uint256 amount, bytes memory data)  external;
    function batchMint(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) external;
}