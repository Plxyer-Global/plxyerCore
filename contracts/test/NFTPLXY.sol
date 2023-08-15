// SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract NFTPLXY is ERC721 {
    constructor() ERC721("NFTPLXY", "NFTPLX") {}

    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }
}
