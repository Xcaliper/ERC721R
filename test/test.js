const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");

const parseEther = ethers.utils.parseEther;

let owner;
let account2;
let erc721RExample;

const MINT_PRICE = "0.1";
const provider = waffle.provider;
function delay(n){
  return new Promise(function(resolve){
      console.log("waiting for ", n, " seconds");
      setTimeout(resolve,n*1000);
  });
}
describe("ERC721RExample", function () {
  before(async function () {
    [owner, account2, account3, account4] = await ethers.getSigners();
    const ERC721RExample = await ethers.getContractFactory("ERC721RExample");
    erc721RExample = await ERC721RExample.deploy();
    await erc721RExample.deployed();

    const saleActive = await erc721RExample.publicSaleActive();
    expect(saleActive).to.be.equal(false);
    await erc721RExample.togglePublicSaleStatus();
    const publicSaleActive = await erc721RExample.publicSaleActive();
    expect(publicSaleActive).to.be.equal(true);
  });

  it("Should be able to deploy", async function () {});

  // it("Should be able to mint and request a refund", async function () {
  //   await erc721RExample
  //     .connect(account2)
  //     .publicSaleMint(1, { value: parseEther("100") });
  //   const balanceAfterMint = await erc721RExample.balanceOf(account2.address);
  //   expect(balanceAfterMint).to.be.equal(1);
  //   await erc721RExample.connect(account2).refund([0]);
  //   const balanceAfterRefund = await erc721RExample.balanceOf(account2.address);
  //   expect(balanceAfterRefund).to.be.equal(0);
  //   const balanceAfterRefundOfOwner = await erc721RExample.balanceOf(
  //     owner.address
  //   );
  //   expect(balanceAfterRefundOfOwner).to.be.equal(1);
  // });

  it("Test against refund problem", async function () {
    // check the initial balance of account2 and owner
    console.log("------------Initial balance: ------------");
    const balance2 = await provider.getBalance(account2.address);
    const balance0 = await provider.getBalance(owner.address);
    var contractBalance = await provider.getBalance(erc721RExample.address);
    console.log("Contract balance is: ", contractBalance/ 1000000000000000000);
    console.log("the balance of account2 is: ", balance2 / 1000000000000000000);
    console.log("the balance of owner is: ", balance0 / 1000000000000000000);
    expect(contractBalance).to.be.equal(0);
    // mint a NFT for account 2 (should have id = 0,1,2)
    await erc721RExample
      .connect(account2)
      .publicSaleMint(3, { value: parseEther("300") });
    // check if mint succeeded
    const balanceAfterMint2 = await erc721RExample.balanceOf(account2.address);
    expect(balanceAfterMint2).to.be.equal(3);

    // execute the refund process for account 2
    await erc721RExample.connect(account2).refund([0]);
    const balanceAfterRefund = await erc721RExample.balanceOf(account2.address);
    expect(balanceAfterRefund).to.be.equal(2);

    // now expect the balance of owner to be 2
    const balanceAfterRefundOfOwner = await erc721RExample.balanceOf(owner.address);
    expect(balanceAfterRefundOfOwner).to.be.equal(1);
    console.log("------------account2 minted 3 NFT for 100 ETH each and execute a refund------------")
    var balance2after = await provider.getBalance(account2.address);
    var balance0after = await provider.getBalance(owner.address);
    contractBalance = await provider.getBalance(erc721RExample.address);
    console.log("Contract balance is: ", contractBalance/ 1000000000000000000);
    console.log("the balance of account2 is: ", balance2after/ 1000000000000000000);
    console.log("the balance of owner is: ", balance0after/ 1000000000000000000);

    // now refund the nft from the owner to the owner
    await erc721RExample.connect(owner).refund([0]);
    expect(balanceAfterRefundOfOwner).to.be.equal(1);
    console.log("------------after refunding one NFT once from the owner------------");
    balance2after = await provider.getBalance(account2.address);
    balance0after = await provider.getBalance(owner.address);
    contractBalance = await provider.getBalance(erc721RExample.address);
    console.log("Contract balance is: ", contractBalance/ 1000000000000000000);
    console.log("the balance of account2 is: ", balance2after/ 1000000000000000000);
    console.log("the balance of owner is: ", balance0after/ 1000000000000000000);

    // repeat refund from owner to owner
    await erc721RExample.connect(owner).refund([0]);
    expect(balanceAfterRefundOfOwner).to.be.equal(1);
    console.log("------------after refunding one NFT twice from the owner------------");
    balance2after = await provider.getBalance(account2.address);
    balance0after = await provider.getBalance(owner.address);
    contractBalance = await provider.getBalance(erc721RExample.address);
    console.log("Contract balance is: ", contractBalance/ 1000000000000000000);
    console.log("the balance of account2 is: ", balance2after/ 1000000000000000000);
    console.log("the balance of owner is: ", balance0after/ 1000000000000000000);

    // now, should the user wants to refund a second NFT with the contract balance at 0
    try{
      await erc721RExample.connect(account2).refund([1]);
    }catch (err){
      console.error(err);
    }
  });

  it("Minting cost and refund cost test - since this is a implementation of ERC721A, expect a gas saving for batch minting", async function () {
    const balanceBeforeMinting1 = await provider.getBalance(account2.address);
    await erc721RExample
    .connect(account2)
    .publicSaleMint(1, { value: parseEther("100") });
    const balanceAfterMinting1 = await provider.getBalance(account2.address);
    console.log("Gas Cost for 1:", balanceBeforeMinting1 - balanceAfterMinting1);

    const balanceBeforeMinting2 = await provider.getBalance(account2.address);
    await erc721RExample
    .connect(account2)
    .publicSaleMint(2, { value: parseEther("200") });
    const balanceAfterMinting2 = await provider.getBalance(account2.address);
    console.log("Gas Cost for 2:", balanceBeforeMinting2 - balanceAfterMinting2);

    const balanceBeforeMinting3 = await provider.getBalance(account2.address);
    await erc721RExample
    .connect(account2)
    .publicSaleMint(3, { value: parseEther("300") });
    const balanceAfterMinting3 = await provider.getBalance(account2.address);
    console.log("Gas Cost for 3:", balanceBeforeMinting3 - balanceAfterMinting3);

    const balanceBeforeMinting4 = await provider.getBalance(account2.address);
    await erc721RExample
    .connect(account2)
    .publicSaleMint(4, { value: parseEther("400") });
    const balanceAfterMinting4 = await provider.getBalance(account2.address);
    console.log("Gas Cost for 4:", balanceBeforeMinting4 - balanceAfterMinting4);

    const balanceBeforeMinting5 = await provider.getBalance(account2.address);
    await erc721RExample
    .connect(account2)
    .publicSaleMint(5, { value: parseEther("500") });
    const balanceAfterMinting5 = await provider.getBalance(account2.address);
    console.log("Gas Cost for 5:", balanceBeforeMinting5 - balanceAfterMinting5);
  });

  it("test against time lock", async function () {
    console.log("Initial contract balance: ")
    var contractBalance = await provider.getBalance(erc721RExample.address);
    console.log("Contract balance is: ", contractBalance/ 1000000000000000000);
    // There should be 500 ETH in the contract
    await erc721RExample
    .connect(account2)
    .publicSaleMint(5, { value: parseEther("500") });
    contractBalance = await provider.getBalance(erc721RExample.address);
    console.log("Contract balance is: ", contractBalance/ 1000000000000000000);
    // Attempt to withdraw right after the mint
    try{
      await erc721RExample.connect(owner).withdraw();
    }catch(err){
      console.error("Refund period not over");
    }
    contractBalance = await provider.getBalance(erc721RExample.address);
    console.log("Contract balance is: ", contractBalance/ 1000000000000000000);

    var currentRefundTime  = await erc721RExample.connect(owner).getrefundEndTime();
    console.log("currentRefundTime is: ", currentRefundTime);

    await erc721RExample.connect(owner).toggleRefundCountdown();
    currentRefundTime  = await erc721RExample.connect(owner).getrefundEndTime();
    console.log("currentRefundTime after toggle refund countdown is: ", currentRefundTime);

    await delay(20);
    await erc721RExample
    .connect(account2)
    .publicSaleMint(5, { value: parseEther("500") });
    try{
      await erc721RExample.connect(owner).withdraw();
    }catch(err){
      console.error("Refund period not over");
    }
    contractBalance = await provider.getBalance(erc721RExample.address);
    console.log("Contract balance is: ", contractBalance/ 1000000000000000000);
  });
});
