// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IPriceOracle.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IKeyNFT.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error GameIdAlreadyInUse();
error NameAlreadyInUse();
error RoyaltyFeeTooHigh();
error UnauthorisedNotSeller();
error GameDoesntExist();
error GameIdCannotBe0();
struct Game{
    uint256 id;
    string name;
    uint256 price; // dollar terms
    uint256 royaltyfee;
    address seller;
}
contract PlxyerStore is AccessControl{
    using SafeERC20 for IERC20;
    bytes32 public constant LISTING_ADMIN = keccak256("LISTING_ADMIN");
    mapping (uint256 id => Game) public ListedGames;
    mapping (string name => bool) internal nameInUse;
    uint256 constant percision  = 1e18;
    uint256 constant maxRoyaltyFee  =  20 * 1e18;
    address public royaltyCollector;
    IPriceOracle priceOracle;
    IKeyNFT keyNFT;
    constructor(IKeyNFT _keyNFT,IPriceOracle _priceOracle){
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(LISTING_ADMIN, msg.sender);
        keyNFT = _keyNFT;
        priceOracle = _priceOracle;
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
    }
    function updatePriceBatch(uint256[] calldata _id,uint256[] calldata prices) public onlyRole(LISTING_ADMIN){
        for(uint256 i = 0;i < _id.length; i ++){
             ListedGames[_id[i]].price = prices[i];
        }
    }
    function updateRoyaltyFeeBatch(uint256[] calldata _id,uint256[] calldata _royaltyFee) public onlyRole(LISTING_ADMIN){
        for(uint256 i = 0;i < _id.length; i ++){
             ListedGames[_id[i]].royaltyfee = _royaltyFee[i];
        }
    }
    function updatePrice(uint256  _id,uint256  price) public onlyRole(LISTING_ADMIN){
        ListedGames[_id].price = price;  
    }
    function updateRoyaltyFee(uint256  _id,uint256  _royaltyFee) public onlyRole(LISTING_ADMIN){ 
        ListedGames[_id].royaltyfee = _royaltyFee;
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
    }
    function buyGame(uint256  _id,address currency) external{
        Game memory g = ListedGames[_id];
        if(g.id == 0){
            revert GameDoesntExist();
        }
        uint256 payAmount = priceOracle.getTokenAmount(g.price,currency);
        uint256 feeAmount = (payAmount * g.royaltyfee) /(100 * 1e18);
        IERC20(currency).safeTransferFrom(msg.sender,royaltyCollector,feeAmount);
        IERC20(currency).safeTransferFrom(msg.sender,g.seller,payAmount - feeAmount);
        bytes memory data = abi.encode("buyGame",_id,currency,msg.sender,address(this));
        keyNFT.mint(msg.sender, _id, 1, data);
    }
    function buyBatch(uint256[] memory _ids,address currency) external{
        uint256 price = priceOracle.price(currency);
        uint256 feeAmount;
        uint256[] memory amounts = new uint256[](_ids.length);
        for(uint256 i = 0; i < _ids.length; i ++){
            Game memory g =  ListedGames[_ids[i]];
            feeAmount +=  g.price * g.royaltyfee / 100 * 1e18;
            uint256 amountinToken =  (g.price - feeAmount) * price  / 1e18;
            IERC20(currency).safeTransferFrom(msg.sender,g.seller,amountinToken);
            amounts[i] = 1;
        }
        feeAmount = feeAmount * price  / 1e18;
        IERC20(currency).safeTransferFrom(msg.sender,royaltyCollector,feeAmount);
        bytes memory data = abi.encode("buyBatchGame",_ids,currency,msg.sender,address(this));
        keyNFT.batchMint(msg.sender, _ids, amounts, data);
    }
    function setPriceOracle(IPriceOracle oracle) external onlyRole(DEFAULT_ADMIN_ROLE){
        priceOracle = oracle;
    } 
    function setKeyNFT(IKeyNFT nft) external  onlyRole(DEFAULT_ADMIN_ROLE){
        keyNFT = nft;
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