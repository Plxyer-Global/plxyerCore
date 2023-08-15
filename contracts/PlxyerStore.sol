// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interfaces/IPriceOracle.sol";
import "./interfaces/IKeyNFT.sol";
import "./interfaces/IPlxyerStore.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

error GameIdAlreadyInUse();
error NameAlreadyInUse();
error RoyaltyFeeTooHigh();
error UnauthorisedNotSeller();
error GameDoesntExist();
error GameIdCannotBe0();
error GameAlreadyOwned(uint256 id);
error UnauthorisedNotRoyaltyFeeCollector();

contract PlxyerStore is AccessControl,IPlxyerStore,ReentrancyGuard{
    using SafeERC20 for IERC20;
    bytes32 public constant LISTING_ADMIN = keccak256("LISTING_ADMIN");
    mapping (uint256 id => Game) public ListedGames;
    mapping (string name => bool) internal nameInUse;
    uint256 constant percision  = 1e18;
    uint256 constant public maxRoyaltyFee  =  20 * 1e18;
    address public royaltyFeeCollector;
    IPriceOracle priceOracle;
    IKeyNFT keyNFT;
    constructor(IKeyNFT _keyNFT,IPriceOracle _priceOracle,address _royaltyFeeCollector){
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(LISTING_ADMIN, msg.sender);
        keyNFT = _keyNFT;
        priceOracle = _priceOracle;
        royaltyFeeCollector =_royaltyFeeCollector;
    }
    function listGame(uint256 _id,string calldata _name,uint256 _price,uint256 _royalroyaltyfee,address _seller)public isNew(_id,_name) onlyRole(LISTING_ADMIN){
        if(_id== 0){
            revert GameIdCannotBe0();
        }
        if(_royalroyaltyfee >maxRoyaltyFee ){
            revert RoyaltyFeeTooHigh();
        }
        ListedGames[_id]  = Game(
            _id,
            _name,
            _price,
            _royalroyaltyfee,
            _seller
        );
        nameInUse[_name] = true;
        emit listingUpdated(_id,ListedGames[_id]);
    }
    function updatePriceBatch(uint256[] calldata _ids,uint256[] calldata prices) public onlyRole(LISTING_ADMIN){
        for(uint256 i = 0;i < _ids.length; i ++){
            ListedGames[_ids[i]].price = prices[i];
        }
        emit batchPriceUpdated(_ids,prices);
    }
    function updateRoyaltyFeeBatch(uint256[] calldata _ids,uint256[] calldata _royaltyFees) public onlyRole(LISTING_ADMIN){
        for(uint256 i = 0;i < _ids.length; i ++){
            if( _royaltyFees[i] >maxRoyaltyFee ){
                revert RoyaltyFeeTooHigh();
            }
            ListedGames[_ids[i]].royaltyfee = _royaltyFees[i];
        }
        emit batchRoyaltyFeeUpdated(_ids,_royaltyFees);
    }
    function updatePrice(uint256  _id,uint256  price) public {
        if(!hasRole(LISTING_ADMIN,msg.sender) && ListedGames[_id].seller != msg.sender){
           revert UnauthorisedNotSeller();
        }
        ListedGames[_id].price = price;  
        emit priceUpdated(_id, price);
       
    }
    function updateRoyaltyFee(uint256  _id,uint256  _royaltyFee) public onlyRole(LISTING_ADMIN){ 
         if( _royaltyFee>maxRoyaltyFee ){
                revert RoyaltyFeeTooHigh();
        }
        ListedGames[_id].royaltyfee = _royaltyFee;
        emit royaltyFeeUpdated(_id,_royaltyFee);
    }
    function DeListGame(uint256 _id) external onlyRole(DEFAULT_ADMIN_ROLE){
        delete ListedGames[_id];
    }
    function changeSeller(uint256 _id,address newSeller)external{
        Game storage g = ListedGames [_id];
        if(msg.sender != g.seller){
            revert UnauthorisedNotSeller();
        }
        g.seller = newSeller;
        emit sellerUpdated(_id,newSeller);
    }
    function buyGame(uint256  _id,address currency,address to) external nonReentrant{
        Game memory g = ListedGames[_id];
        if(g.id == 0){
            revert GameDoesntExist();
        }
        if(keyNFT.balanceOf(to, _id) >=1){
            revert GameAlreadyOwned(_id);
        }
        uint256 payAmount = priceOracle.getTokenAmount(g.price,currency);
        uint256 feeAmount = (payAmount * g.royaltyfee) /(100 * 1e18);
        IERC20(currency).safeTransferFrom(msg.sender,royaltyFeeCollector,feeAmount);
        IERC20(currency).safeTransferFrom(msg.sender,g.seller,payAmount - feeAmount);
        bytes memory data = abi.encode("buyGame",_id,currency,msg.sender,address(this));
        keyNFT.mint(to, _id, 1, data);
        emit buy(msg.sender,to,_id,payAmount,currency);
    }
    function buyBatch(uint256[] memory _ids, address to,address currency) external nonReentrant{
        uint256 price = priceOracle.price(currency);
        uint256 feeAmount;
        uint256 totalPaid;
        uint256[] memory amounts = new uint256[](_ids.length);
        for(uint256 i = 0; i < _ids.length; i ++){           
            Game memory g =  ListedGames[_ids[i]];
            if(g.id == 0){
                revert GameDoesntExist();
            }
            if(keyNFT.balanceOf(to, _ids[i]) >=1){
                revert GameAlreadyOwned(_ids[i]);
            }
            uint256 _feeAmount =  (g.price * g.royaltyfee) / (100 * 1e18);
            uint256 amountinToken =  ((g.price - _feeAmount) * 1e18 )  / price;
            feeAmount += _feeAmount;
            IERC20(currency).safeTransferFrom(msg.sender,g.seller,amountinToken);
            amounts[i] = 1;
            totalPaid +=   g.price;
        }
        feeAmount = feeAmount * 1e18/ price;
        totalPaid = totalPaid *1e18/ price;
        IERC20(currency).safeTransferFrom(msg.sender,royaltyFeeCollector,feeAmount);
        bytes memory data = abi.encode("buyBatchGame",_ids,currency,msg.sender,address(this));
        keyNFT.batchMint(to, _ids, amounts, data);
        emit batchBuy(msg.sender,to,_ids,totalPaid,currency);
    }
    function setPriceOracle(IPriceOracle oracle) external onlyRole(DEFAULT_ADMIN_ROLE){
        priceOracle = oracle;
    } 
    function setKeyNFT(IKeyNFT nft) external  onlyRole(DEFAULT_ADMIN_ROLE){
        keyNFT = nft;
    }
    function setFeeCollector(address _feeCollector) external {
        if(msg.sender!= royaltyFeeCollector){
            revert UnauthorisedNotRoyaltyFeeCollector();
        }
        royaltyFeeCollector = _feeCollector;
    }
    modifier isNew(uint256 _id,string calldata _name){
        Game memory g = ListedGames[_id];
        if(g.id != 0){
            revert GameIdAlreadyInUse();
        }
        if(nameInUse[_name]){
            revert NameAlreadyInUse();
        }
        _;
    }

}