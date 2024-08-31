const NftMarket = artifacts.require("NftMarket");
const { ethers } = require("ethers");

contract("NftMarket", (accounts) => {
  let _contract = null;
  const _nftPrice = ethers.utils.parseEther("0.3");
  const _listingPrice = ethers.utils.parseEther("0.025");

  before(async () => {
    _contract = await NftMarket.deployed();
  });

  describe("Mint Token", () => {
    const tokenURI = "https://test.com";

    before(async () => {
      await _contract.mintToken(tokenURI, _nftPrice, { from: accounts[0], value: _listingPrice });
    });

    it("owner of the first token should be address[0]", async () => {
      const owner = await _contract.ownerOf(1);
      assert.equal(owner, accounts[0], "owner of the first token is not matching address[0]");
    });

    it("first token should point to the correct tokenURI", async () => {
      const actualTokenURI = await _contract.tokenURI(1);

      assert.equal(actualTokenURI, tokenURI, "tokenURI is not correctly set");
    });

    it("should not be possible to create a NFT with used tokenURI", async () => {
      await _contract.mintToken(tokenURI, _nftPrice, {
        from: accounts[0]
      });
    });

    it("should have one listed item", async () => {
      const listedItemCount = await _contract.listedItemsCount({
        from: accounts[0]
      });
      assert.equal(listedItemCount, 1, "List items count is not 1");
    });

    it("should have create nft item", async () => {
      const nftItem = await _contract.getNftItem(1);

      assert.equal(nftItem.tokenId, 1, "token id is not 1");
      assert.equal(nftItem.price, _nftPrice, "Nft price is not correct");
      assert.equal(nftItem.creator, accounts[0], "creator is not account[0]");
      assert.equal(nftItem.isListed, true, "Token is not listed");
    });
  });

  describe("Buy Nft", () => {
    before(async () => {
      await _contract.buyNft(1, {
        from: accounts[1],
        value: _nftPrice
      });
    });

    it("should unlist the item", async () => {
      const nftItem = await _contract.getNftItem(1);
      assert.equal(nftItem.isListed, false, "Item is still listed");
    });

    it("should decrease listed items count", async () => {
      const listedItemsCount = await _contract.listedItemsCount();
      assert.equal(listedItemsCount, 0, "Count has not been decreased");
    });

    it("should change the owner", async () => {
      const currentOwner = await _contract.ownerOf(1);
      assert.equal(currentOwner, accounts[1], "the owner has not changed");
    });
  });

  describe("Token Transfer", () => {
    before(async () => {
      const tokenUri = "https://test-json-2.com";
      await _contract.mintToken(tokenUri, _nftPrice, {
        from: accounts[0],
        value: _listingPrice
      });
    });

    it("should have two NFTs create", async () => {
      const totalSupply = await _contract.totalSupply();
      assert.equal(totalSupply, 2, "Total supplu is not correct");
    });

    it("should have two NFTs create", async () => {
      const totalSupply = await _contract.totalSupply();
      assert.equal(totalSupply, 2, "Total supplu is not correct");
    });

    it("should be able to retreive nft by index", async () => {
      const nft1 = await _contract.tokenByIndex(0);
      const nft2 = await _contract.tokenByIndex(1);
      assert.equal(nft1, 1, "tokenId is not correct");
      assert.equal(nft2, 2, "tokenId is not correct");
    });

    it("should have one listed Nft", async () => {
      const allNft = await _contract.getAllNftsOnSale();
      assert.equal(allNft[0].tokenId, 2, "Nft has wrong tokenId");
    });

    it("accounts[0] should have one owned Nft", async () => {
      const ownedNfts = await _contract.getOwnedNfts({ from: accounts[1] });

      assert.equal(ownedNfts[0].tokenId, 1, "Nft has wrong tokenId");
    });

    it("accounts[1] should have one owned Nft", async () => {
      const ownedNfts = await _contract.getOwnedNfts({ from: accounts[0] });

      assert.equal(ownedNfts[0].tokenId, 2, "Nft has wrong tokenId");
    });
  });

  describe("Token Transfer to new owner", () => {
    before(async () => {
      await _contract.transferFrom(accounts[0], accounts[1], 2);
    });

    it("accounts[0] should have 0 tokens", async () => {
      const ownedNfts = await _contract.getOwnedNfts({ from: accounts[0] });
      assert.equal(ownedNfts.length, 0, "Invalid length of tokens");
    });

    it("accounts[1] should have 2 tokens", async () => {
      const ownedNfts = await _contract.getOwnedNfts({ from: accounts[1] });
      assert.equal(ownedNfts.length, 2, "Invalid length of tokens");
    });
  });

  describe("Burn Token", () => {
    const tokenURI = "https://test-json3.com";

    before(async () => {
      await _contract.mintToken(tokenURI, _nftPrice, {
        from: accounts[2],
        value: _listingPrice
      });
    });

    it("accounts[2] should have one owned NFT", async () => {
      const ownedNfts = await _contract.getOwnedNfts({ from: accounts[2] });
      // console.log(ownedNfts);

      assert.equal(ownedNfts[0].tokenId, 3, "Nft has a wrong id");
    });

    it("accounts[2] should own 0 NFT", async () => {
      await _contract.burnToken(3, { from: accounts[2] });
      const ownedNfts = await _contract.getOwnedNfts({ from: accounts[2] });
      // console.log(ownedNfts);

      assert.equal(ownedNfts.length, 0, "Invalid length of tokens");
    });
  });

  describe("List an Nft", () => {
    before(async () => {
      await _contract.placeNftOnSale(1, _nftPrice, {
        from: accounts[1],
        value: _listingPrice
      });
    });

    it("should have two Listed NFTs", async () => {
      // const totalSupply = await _contract.totalSupply();
      // console.log("totalSupply", totalSupply.toString());

      const allNftsOnSale = await _contract.getAllNftsOnSale();
      // console.log(allNftsOnSale);
      assert.equal(allNftsOnSale.length, 2, "Nft has a wrong id");
    });
  });
});
