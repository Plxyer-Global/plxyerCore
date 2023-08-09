// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IKeyNFT.sol";
error NonTransferable();
contract KeyNFT is ERC1155, AccessControl,IKeyNFT,Ownable {

    string constant public name='KPLX';
    string constant public symbol="KPLX";
    bytes32 public constant URI_SETTER_ROLE = keccak256("URI_SETTER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    constructor() ERC1155("") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(URI_SETTER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE,msg.sender);
        _grantRole(DISTRIBUTOR_ROLE,msg.sender);
    }
    function setURI(string memory newuri) public onlyRole(URI_SETTER_ROLE) {
        _setURI(newuri);
    }
    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public  override(ERC1155, IERC1155) {
       if(!hasRole(DISTRIBUTOR_ROLE,from)){
            revert NonTransferable();
       }
       super.safeBatchTransferFrom( from,to,ids,amounts,data);
       
    }
    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public virtual  override(ERC1155, IERC1155) {
      if(!hasRole(DISTRIBUTOR_ROLE,from)){
            revert NonTransferable();
       }
       super.safeTransferFrom(from,to,id,amount,data);
    }

    // The following functions are overrides required by Solidity.
    function mint(address to, uint256 id, uint256 amount, bytes memory data)  public onlyRole(MINTER_ROLE){
        _mint(to,id,amount,data);
    }
    function batchMint(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) public onlyRole(MINTER_ROLE){
        _mintBatch(to,ids,amounts,data);
    }
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControl, ERC1155, IERC165)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}