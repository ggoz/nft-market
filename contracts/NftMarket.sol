// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NftMarket is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;

    // Nft项目
    struct NftItem {
        uint tokenId;
        uint price;
        address creator;
        bool isListed;
    }

    // 上市价格
    uint public listingPrice = 0.025 ether;

    // tokenIds
    Counters.Counter private _tokenIds;
    // _listedItems
    Counters.Counter private _listedItems;

    mapping(address => mapping(uint => uint)) private _ownedTokens;
    mapping(uint => uint) private _idToOwnedIndex;

    uint256[] private _allNfts;

    // tokenURI是否存在
    mapping(string => bool) private _usedTokenURIs;

    // tokenId和nft项目的映射
    mapping(uint => NftItem) private _idToNftItem;

    // tokenId 和 index 的映射
    mapping(uint => uint) private _idToNftIndex;

    // nftItem创建事件
    event NftItemCreated(
        uint tokenId,
        uint price,
        address creator,
        bool isListed
    );

    constructor() ERC721("CreaturesNFT", "CNFT") {}

    // 设置上市价格
    function setListingPrice(uint newPrice) external onlyOwner {
        require(newPrice > 0, "Price must be at least 1 wei.");
        listingPrice = newPrice;
    }

    // 所有nft数量
    function totalSupply() public view returns (uint) {
        return _allNfts.length;
    }

    // 根据index 找 tokenId
    function tokenByIndex(uint index) public view returns (uint) {
        require(index < totalSupply(), "index out of boundary");
        return _allNfts[index];
    }

    // 根据index 找 ownedTokenId
    function tokenOfOwnerIdByIndex(
        address owner,
        uint index
    ) public view returns (uint) {
        require(index < balanceOf(owner), "index out of boundary");
        return _ownedTokens[owner][index];
    }

    // 获取所有在售的NFT
    function getAllNftsOnSale() public view returns (NftItem[] memory) {
        uint allItemsCounts = totalSupply();
        uint currentIndex = 0;
        NftItem[] memory items = new NftItem[](_listedItems.current());

        for (uint i = 0; i < allItemsCounts; i++) {
            uint tokenId = tokenByIndex(i);
            NftItem storage item = _idToNftItem[tokenId];

            if (item.isListed == true) {
                items[currentIndex] = item;
                currentIndex += 1;
            }
        }

        return items;
    }

    // 获取该地址所拥有的NFT
    function getOwnedNfts() public view returns (NftItem[] memory) {
        uint ownedItemsCounts = balanceOf(msg.sender);
        NftItem[] memory items = new NftItem[](ownedItemsCounts);

        for (uint i = 0; i < ownedItemsCounts; i++) {
            uint tokenId = tokenOfOwnerIdByIndex(msg.sender, i);
            NftItem storage item = _idToNftItem[tokenId];
            items[i] = item;
        }

        return items;
    }

    // 购买NFT
    function buyNft(uint tokenId) public payable {
        uint price = _idToNftItem[tokenId].price;
        address owner = ownerOf(tokenId);

        require(msg.sender != owner, "You already have this Nft");
        require(msg.value == price, "Please submit the asking price");

        _idToNftItem[tokenId].isListed = false;
        _listedItems.decrement();

        _transfer(owner, msg.sender, tokenId);
        payable(owner).transfer(msg.value);
    }

    // 获取NftItem
    function getNftItem(uint tokenId) public view returns (NftItem memory) {
        return _idToNftItem[tokenId];
    }

    // 当前列出nftItem的数量
    function listedItemsCount() public view returns (uint) {
        return _listedItems.current();
    }

    // tokenURI是否已经存在
    function tokenURIExists(string memory tokenURI) public view returns (bool) {
        return _usedTokenURIs[tokenURI] == true;
    }

    // 销毁代币
    function burnToken(uint tokenId) public {
        NftItem memory item = _idToNftItem[tokenId];
        if (item.isListed == true) {
            _listedItems.decrement();
        }
        _burn(tokenId);
    }

    // 铸币
    function mintToken(
        string memory tokenURI,
        uint price
    ) public payable returns (uint) {
        require(!tokenURIExists(tokenURI), "tokenURI already exists!");
        require(
            msg.value == listingPrice,
            "Price must be equal to listing price"
        );

        _tokenIds.increment();
        _listedItems.increment();

        uint newTokenId = _tokenIds.current();

        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        _nftItemCreate(newTokenId, price);
        _usedTokenURIs[tokenURI] = true;

        return newTokenId;
    }

    // 将NFT放在市场售卖
    function placeNftOnSale(uint tokenId, uint newPrice) public payable {
        require(
            ownerOf(tokenId) == msg.sender,
            "You are not owner of this nft"
        );
        require(
            _idToNftItem[tokenId].isListed == false,
            "Item is already on sale"
        );
        require(
            msg.value == listingPrice,
            "Price myst be equal to listing price"
        );

        _idToNftItem[tokenId].isListed = true;
        _idToNftItem[tokenId].price = newPrice;
        _listedItems.increment();
    }

    // 创造一个nftItem
    function _nftItemCreate(uint tokenId, uint price) private {
        require(price > 0, "Price must be at least 1 wei");
        _idToNftItem[tokenId] = NftItem(tokenId, price, msg.sender, true);
        emit NftItemCreated(tokenId, price, msg.sender, true);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, tokenId);

        if (from == address(0)) {
            _addTokenToAllTokensEnumeration(tokenId);
        } else if (from != to) {
            _removeTokenFromOwnerEnumeration(from, tokenId);
        }

        if (to == address(0)) {
            _removeTokenFromAllTokensEnumeration(tokenId);
        } else if (to != from) {
            _addTokenToOwnerEnumeration(to, tokenId);
        }
    }

    function _addTokenToAllTokensEnumeration(uint tokenId) private {
        _idToNftIndex[tokenId] = _allNfts.length;
        _allNfts.push(tokenId);
    }

    function _addTokenToOwnerEnumeration(address to, uint tokenId) private {
        uint256 length = balanceOf(to);
        _ownedTokens[to][length] = tokenId;
        _idToOwnedIndex[tokenId] = length;
    }

    function _removeTokenFromOwnerEnumeration(
        address from,
        uint tokenId
    ) private {
        uint lastTokenIndex = balanceOf(from) - 1;
        uint tokenIndex = _idToOwnedIndex[tokenId];

        if (tokenIndex != lastTokenIndex) {
            uint lastTokenId = _ownedTokens[from][lastTokenIndex];

            _ownedTokens[from][tokenIndex] = lastTokenId;
            _idToOwnedIndex[lastTokenId] = tokenIndex;
        }

        delete _idToOwnedIndex[tokenId];
        delete _ownedTokens[from][lastTokenIndex];
    }

    function _removeTokenFromAllTokensEnumeration(uint tokenId) private {
        uint lastTokenIndex = _allNfts.length - 1;
        uint tokenIndex = _idToNftIndex[tokenId];
        uint lastTokenId = _idToNftIndex[lastTokenIndex];

        _allNfts[tokenIndex] = lastTokenId;
        _idToNftIndex[lastTokenId] = tokenIndex;

        delete _idToNftIndex[tokenId];
        _allNfts.pop();
    }
}
