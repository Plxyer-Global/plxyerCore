// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IPriceOracle {

    function getTokenAmount(uint256 amountUSD,address tokenAddress) external returns(uint256);
    function price(address tokenAddres) external returns(uint256);
} 