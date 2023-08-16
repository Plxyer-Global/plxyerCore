// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "../interfaces/IPriceOracle.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
error unsupportedToken();
contract PriceOracle is IPriceOracle, AccessControl {
    bytes32 public constant PRICE_SETTER = keccak256("PRICE_SETTER");
    bytes32 public constant SUPPORTED_CURRENCY = keccak256("SUPPORTED_CURRENCY");
    mapping(address => uint256) internal _price;
    uint256 constant percision  = 1e18;
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PRICE_SETTER, msg.sender);
    }
    function price(address tokenAddress) external view returns(uint256){
         if(!hasRole(SUPPORTED_CURRENCY,tokenAddress)){
            revert unsupportedToken();
        }
        return _price[tokenAddress];
    }
    function getTokenAmount(
        uint256 amountUSD,
        address tokenAddress
    ) external view override returns (uint256) {
        if(!hasRole(SUPPORTED_CURRENCY,tokenAddress)){
            revert unsupportedToken();
        }
        if(amountUSD == 0) return 0;
        uint256 amountInToken = amountUSD * percision/ _price[tokenAddress];
        return amountInToken;
    }

    function setPrice(uint256 amount, address tokenAddress) public onlyRole(PRICE_SETTER){
        _price[tokenAddress] = amount;
    }

    
}