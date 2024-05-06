// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract NFT is ERC721URIStorage {
    uint public tokenCount;
    constructor() ERC721("DApp NFT", "DAPP"){}
    event NFTMinted(uint indexed tokenId, address indexed minter);
    function mint(string memory _tokenURI) external returns(uint) {
        tokenCount ++;
        _safeMint(msg.sender, tokenCount);
        _setTokenURI(tokenCount, _tokenURI);
        emit NFTMinted(tokenCount, msg.sender);
        return(tokenCount);
    }

     // Add this function to approve a specific tokenId for a specific address
    function approveSpecific(uint tokenId, address to) external {
        // Require that the msg.sender is the owner of the token or is already an approved operator
        require(_isApprovedOrOwner(msg.sender, tokenId), "Caller is not owner nor approved for this NFT");
        _approve(to, tokenId);
    }
}