import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers ,} from "hardhat";
import { KeyNFT, PlxyerStore, PriceOracle, TPLXY } from "../typechain-types";
import { PlxyerStoreFixture, priceOracleFixture } from "./shared/fixtures";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { utils } from "../typechain-types/@openzeppelin/contracts";
import { oracle } from "../typechain-types/contracts";
import { BigNumberish, Typed } from "ethers";

describe("PlxyerStore", () => {
  let POracle: PriceOracle
  let PLX: TPLXY
  let plxyerStore: PlxyerStore
  let KNFT: KeyNFT
  let INV:TPLXY
  let maxFee: BigNumberish | Typed 
  let [owner, other,royaltyfeeCollector]: SignerWithAddress[] = []
  beforeEach(async () => {
    [owner, other,royaltyfeeCollector] = await ethers.getSigners()
    const { TPLX, oracle, store, nft ,invalidCurrency} = await loadFixture(PlxyerStoreFixture)
    plxyerStore = store
    POracle = oracle
    PLX = TPLX,
      KNFT = nft,
      INV = invalidCurrency
  })
  it("can list games", async () => {
    await expect(
      plxyerStore.connect(other).listGame(1, "game1", ethers.parseUnits("69"), 
      ethers.parseUnits("10"), owner.address))
      .to.be.reverted
    await expect(
      plxyerStore.listGame(1, "game1", ethers.parseUnits("69"),
      ethers.parseUnits("50"), owner.address))
      .to.be.revertedWithCustomError(plxyerStore, "RoyaltyFeeTooHigh")
    expect(await plxyerStore.listGame(1, "game1", ethers.parseUnits("69"), 
    ethers.parseUnits("10"), owner.address)).to.be.ok
    await expect( plxyerStore.listGame(1, "game2", ethers.parseUnits("69"), 
    ethers.parseUnits("10"), owner.address)).to.be.revertedWithCustomError(plxyerStore,"GameIdAlreadyInUse")
    await expect( plxyerStore.listGame(0, "game2", ethers.parseUnits("69"), 
    ethers.parseUnits("10"), owner.address)).to.be.revertedWithCustomError(plxyerStore,"GameIdCannotBe0")
    await expect( plxyerStore.listGame(2, "game1", ethers.parseUnits("69"), 
    ethers.parseUnits("10"), owner.address)).to.be.revertedWithCustomError(plxyerStore,"NameAlreadyInUse")
    expect( await plxyerStore.listGame(2, "game2", ethers.parseUnits("69"), 
    ethers.parseUnits("10"), owner.address)).to.emit(plxyerStore,"listingUpdated")
  })
  it("can buyGames", async () => { 
    expect(await plxyerStore.listGame(1, "game1", ethers.parseUnits("69"), 
    ethers.parseUnits("10"), other.address)).to.be.ok
    await POracle.setPrice(ethers.parseUnits("0.02"),await PLX.getAddress())
    expect(await plxyerStore.listGame(2, "game2", ethers.parseUnits("69"), 
    ethers.parseUnits("10"), other.address)).to.be.ok
    await PLX.mint(owner.address,ethers.parseUnits("900000000"))
    await PLX.approve(await plxyerStore.getAddress(),ethers.MaxUint256)
    await expect(plxyerStore.buyGame(3,await PLX.getAddress(),other.address)).to.be.revertedWithCustomError(plxyerStore,"GameDoesntExist")
    await expect(plxyerStore.buyGame(0,await PLX.getAddress(),other.address)).to.be.revertedWithCustomError(plxyerStore,"GameDoesntExist")
    await expect(plxyerStore.buyGame(1,await INV.getAddress(),other.address)).to.be.revertedWithCustomError(POracle,"unsupportedToken")
    expect(await plxyerStore.buyGame(1,await PLX.getAddress(),other.address)).to.emit(plxyerStore,"buy")
    await expect(plxyerStore.buyGame(1,await PLX.getAddress(),other.address)).to.be.revertedWithCustomError(plxyerStore,"GameAlreadyOwned")
    expect(await PLX.balanceOf( royaltyfeeCollector.address)).to.be.eq(ethers.parseUnits("345"))
    expect(await PLX.balanceOf( other.address)).to.be.eq(ethers.parseUnits("3105"))
    expect(await KNFT.balanceOf(other.address,1)).to.be.eq(1)
    expect((await plxyerStore.ListedGames(1)).copiesSold).to.be.eq(1)
  })
  it("higher priced tokens dont cause price error",async()=>{
    expect(await plxyerStore.listGame(1, "game1", ethers.parseUnits("69"), 
    ethers.parseUnits("10"), other.address)).to.be.ok
    await POracle.setPrice(ethers.parseUnits("100"),await PLX.getAddress())
    expect(await plxyerStore.listGame(2, "game2", ethers.parseUnits("69"), 
    ethers.parseUnits("10"), other.address)).to.be.ok
    await PLX.mint(owner.address,ethers.parseUnits("900000000"))
    await PLX.approve(await plxyerStore.getAddress(),ethers.MaxUint256)
    await expect(plxyerStore.buyGame(3,await PLX.getAddress(),other.address)).to.be.revertedWithCustomError(plxyerStore,"GameDoesntExist")
    await expect(plxyerStore.buyGame(0,await PLX.getAddress(),other.address)).to.be.revertedWithCustomError(plxyerStore,"GameDoesntExist")
    await expect(plxyerStore.buyGame(1,await INV.getAddress(),other.address)).to.be.revertedWithCustomError(POracle,"unsupportedToken")
    expect(await plxyerStore.buyGame(1,await PLX.getAddress(),other.address)).to.emit(plxyerStore,"buy")
    await expect(plxyerStore.buyGame(1,await PLX.getAddress(),other.address)).to.be.revertedWithCustomError(plxyerStore,"GameAlreadyOwned")
    expect(await PLX.balanceOf( royaltyfeeCollector.address)).to.be.eq(ethers.parseUnits("0.069"))
    expect(await PLX.balanceOf( other.address)).to.be.eq(ethers.parseUnits("0.621"))
    expect(await KNFT.balanceOf(other.address,1)).to.be.eq(1)
  })
  it("can buyBatch",async()=>{
    expect(await plxyerStore.listGame(1, "game1", ethers.parseUnits("69"), 
    ethers.parseUnits("10"), other.address)).to.be.ok
    await POracle.setPrice(ethers.parseUnits("0.02"),await PLX.getAddress())
    expect(await plxyerStore.listGame(2, "game2", ethers.parseUnits("69"), 
    ethers.parseUnits("10"), other.address)).to.be.ok
    await PLX.mint(owner.address,ethers.parseUnits("900000000"))
    await PLX.approve(await plxyerStore.getAddress(),ethers.MaxUint256)
    await expect(plxyerStore.buyBatch([3,4],other.address,await PLX.getAddress())).to.be.revertedWithCustomError(plxyerStore,"GameDoesntExist")
    await expect(plxyerStore.buyBatch([0,1],other.address,await PLX.getAddress())).to.be.revertedWithCustomError(plxyerStore,"GameDoesntExist")
    await expect(plxyerStore.buyBatch([1,2],other.address,await INV.getAddress())).to.be.revertedWithCustomError(POracle,"unsupportedToken")
    expect(await plxyerStore.buyBatch([1,2],other.address,await PLX.getAddress())).to.emit(plxyerStore,"BatchBuy")
    await expect(plxyerStore.buyBatch([1,2],other.address,await PLX.getAddress())).to.be.revertedWithCustomError(plxyerStore,"GameAlreadyOwned")
    expect(await KNFT.balanceOf(other.address,1)).to.be.eq(1)
    expect(await KNFT.balanceOf(other.address,2)).to.be.eq(1)
    expect(await PLX.balanceOf(royaltyfeeCollector.address)).to.be.eq(ethers.parseUnits("690"))
    expect(await PLX.balanceOf(other.address)).to.be.eq(ethers.parseUnits("6210"))
    expect((await plxyerStore.ListedGames(1)).copiesSold).to.be.eq(1)
    expect((await plxyerStore.ListedGames(2)).copiesSold).to.be.eq(1)
  })
  it("can deListgames", async()=>{ 
    expect(await plxyerStore.listGame(1, "game1", ethers.parseUnits("69"), 
    ethers.parseUnits("10"), other.address)).to.be.ok
    await POracle.setPrice(ethers.parseUnits("0.02"),await PLX.getAddress())
    expect(await plxyerStore.listGame(2, "game2", ethers.parseUnits("69"), 
    ethers.parseUnits("10"), other.address)).to.be.ok
    await PLX.mint(owner.address,ethers.parseUnits("900000000"))
    await PLX.approve(await plxyerStore.getAddress(),ethers.MaxUint256)
    await expect(plxyerStore.connect(other).DeListGame(1)).to.be.reverted
    expect(await plxyerStore.DeListGame(1)).to.emit(plxyerStore,"delisted")
    await expect(plxyerStore.buyGame(1,await PLX.getAddress(),other.address)).to.be.revertedWithCustomError(plxyerStore,"GameDoesntExist")
  })
  it("can update game price", async() => {
    expect(await plxyerStore.listGame(1, "game1", ethers.parseUnits("69"), 
    ethers.parseUnits("10"), other.address)).to.be.ok
    expect(await plxyerStore.listGame(2, "game2", ethers.parseUnits("69"), 
    ethers.parseUnits("10"), other.address)).to.be.ok
    await expect(plxyerStore.connect(royaltyfeeCollector).updatePrice(1, ethers.parseUnits("30"))).to.be.reverted
    expect(await plxyerStore.updatePrice(1, ethers.parseUnits("30"))).to.emit(plxyerStore,"priceUpdated")
    expect(await plxyerStore.connect(other).updatePrice(1, ethers.parseUnits("30"))).to.emit(plxyerStore,"priceUpdated")
    expect((await plxyerStore.ListedGames(1)).price).to.be.eq( ethers.parseUnits("30"))

    await expect(plxyerStore.connect(other).updatePriceBatch([1,2], [ethers.parseUnits("30"),ethers.parseUnits("30")])).to.be.reverted
    expect(await plxyerStore.updatePriceBatch([1,2], [ethers.parseUnits("30"),ethers.parseUnits("30")])).to.emit(plxyerStore,"batchPriceUpdated")
    expect((await plxyerStore.ListedGames(1)).price).to.be.eq( ethers.parseUnits("30"))
    expect((await plxyerStore.ListedGames(2)).price).to.be.eq( ethers.parseUnits("30"))
  })
  it("update RoyaltyFee",async()=>{
    expect(await plxyerStore.listGame(1, "game1", ethers.parseUnits("69"), 
    ethers.parseUnits("10"), other.address)).to.be.ok
    expect(await plxyerStore.listGame(2, "game2", ethers.parseUnits("69"), 
    ethers.parseUnits("10"), other.address)).to.be.ok
    await expect(plxyerStore.connect(other).updateRoyaltyFee(1, ethers.parseUnits("20"))).to.be.reverted
    await expect(plxyerStore.updateRoyaltyFee(1, ethers.parseUnits("101"))).to.be.revertedWithCustomError(plxyerStore,"RoyaltyFeeTooHigh")
    expect(await plxyerStore.updateRoyaltyFee(1, ethers.parseUnits("20"))).to.emit(plxyerStore,"RoyaltyFeeUpdated")
    expect((await plxyerStore.ListedGames(1)).royaltyfee).to.be.eq( ethers.parseUnits("20"))

    await expect(plxyerStore.connect(other).updateRoyaltyFeeBatch([1,2], [ethers.parseUnits("20"),ethers.parseUnits("20")])).to.be.reverted
    await expect(plxyerStore.updateRoyaltyFeeBatch([1,2], [ethers.parseUnits("101"),ethers.parseUnits("20")])).to.be.revertedWithCustomError(plxyerStore,"RoyaltyFeeTooHigh")
    expect(await plxyerStore.updateRoyaltyFeeBatch([1,2], [ethers.parseUnits("20"),ethers.parseUnits("20")])).to.be.emit(plxyerStore,"batchRoyaltyFeeUpdated")
    expect((await plxyerStore.ListedGames(1)).royaltyfee).to.be.eq( ethers.parseUnits("20"))
    expect((await plxyerStore.ListedGames(2)).royaltyfee).to.be.eq( ethers.parseUnits("20"))

  })
  it("can change seller",async()=>{
    expect(await plxyerStore.listGame(1, "game1", ethers.parseUnits("69"), 
    ethers.parseUnits("10"), other.address)).to.be.ok
    await expect(plxyerStore.changeSeller(1,royaltyfeeCollector.address)).to.be.revertedWithCustomError(plxyerStore,"UnauthorisedNotSeller")
    expect(await plxyerStore.connect(other).changeSeller(1,royaltyfeeCollector.address)).to.emit(plxyerStore,"sellerUpdated")
  })
})