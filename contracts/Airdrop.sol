// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
error ArrayLengthsMisMatch();

contract Airdrop is AccessControl {
    using SafeERC20 for IERC20;
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");

    constructor() {
        _grantRole(DISTRIBUTOR_ROLE, msg.sender);
    }

    function dropERC20(
        address _token,
        address[] memory recipients,
        uint256[] memory amounts
    ) external onlyRole(DISTRIBUTOR_ROLE) {
        if (recipients.length != amounts.length) {
            revert ArrayLengthsMisMatch();
        }

        IERC20 token = IERC20(_token);
        for (uint256 i = 0; i < recipients.length; i++) {
            token.safeTransferFrom(msg.sender, recipients[i], amounts[i]);
        }
    }

    function dropERC721(
        address tokenAddress,
        address[] memory recipients,
        uint256[] memory tokenIds
    ) external onlyRole(DISTRIBUTOR_ROLE) {
        if (recipients.length != tokenIds.length) {
            revert ArrayLengthsMisMatch();
        }

        IERC721 token = IERC721(tokenAddress);

        for (uint256 i = 0; i < recipients.length; i++) {
            token.safeTransferFrom(msg.sender, recipients[i], tokenIds[i]);
        }
    }

    function dropERC1155(
        address tokenAddress,
        address[] memory recipients,
        uint256[] memory tokenIds,
        uint256[] memory amounts,
        bytes memory data
    ) external onlyRole(DISTRIBUTOR_ROLE) {
        if (
            recipients.length != tokenIds.length ||
            recipients.length != amounts.length
        ) {
            revert ArrayLengthsMisMatch();
        }

        IERC1155 token = IERC1155(tokenAddress);

        for (uint256 i = 0; i < recipients.length; i++) {
            token.safeTransferFrom(
                msg.sender,
                recipients[i],
                tokenIds[i],
                amounts[i],
                data
            );
        }
    }
}
