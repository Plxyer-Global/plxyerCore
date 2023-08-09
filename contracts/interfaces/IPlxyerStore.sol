// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

struct Game{
    uint256 id;
    string name;
    uint256 price; // dollar terms
    uint256 royaltyfee;
    address seller;
}
interface IPlxyerStore{
    event buy(address indexed buyer, address indexed to, uint256 gameId,uint256 amountPaid,address paidWith);
    event batchBuy(address indexed buyer, address indexed to,uint256[] gameIds,uint256 amountPaid,address paidWith);
    event listingUpdated(uint256 indexed id,Game game);
    event batchPriceUpdated(uint256[] ids,uint256[] prices);
    event priceUpdated(uint256 indexed id,uint256 price);
    event royaltyFeeUpdated(uint256 indexed id,uint256 fee);
    event batchRoyaltyFeeUpdated(uint256[] ids,uint256[] fees);
    event sellerUpdated(uint256 indexed id,address seller);
    event delisted(uint256 indexed id);
    function ListedGames(uint256) external returns(uint256 id,string memory name,uint256 price,uint256 royaltyfee,address seller);
    function royaltyFeeCollector() external returns(address);
    function updatePrice(uint256  _id,uint256  price) external;
    function updatePriceBatch(uint256[] calldata _id,uint256[] calldata prices) external;
    function updateRoyaltyFeeBatch(uint256[] calldata _id,uint256[] calldata _royaltyFee) external;
    function updateRoyaltyFee(uint256  _id,uint256  _royaltyFee)external;
    function buyGame(uint256  _id,address currency,address to) external;
    function buyBatch(uint256[] memory _ids, address to,address currency) external;
}