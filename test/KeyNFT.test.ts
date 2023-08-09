import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { KeyNFT } from "../typechain-types";
import { keyNFTFixture } from "./shared/fixtures";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";

describe("KeyNFT", function () {
  let kNFT :KeyNFT
  let [owner, other]:SignerWithAddress[] = []
  this.beforeEach(async ()=>{
    [owner,other] = await ethers.getSigners()
    const {nft} = await loadFixture(keyNFTFixture)
    kNFT = nft
  })
  it("only minter can mint",async()=>{
    await expect( kNFT.connect(other).mint(other.address,1,1,"0x")).to.be.reverted
    expect(await kNFT.mint(owner.address,1,1,"0x")).to.emit(kNFT,"TransferSingle")
    await expect(kNFT.connect(other).batchMint(other.address,[1,1],[2,1],"0x")).to.be.reverted
    expect(await kNFT.batchMint(other.address,[1,1],[2,1],"0x")).to.emit(kNFT,"TransferBatch")
  })
  it("non transferable", async()=>{
    expect(await kNFT.mint(owner.address,1,1,"0x")).to.emit(kNFT,"TransferSingle")
    const distributer = await kNFT.DISTRIBUTOR_ROLE()
    await kNFT.revokeRole(distributer,owner.address)
    await expect(kNFT.safeTransferFrom(owner.address,other.address,1,1,"0x")).to.be.revertedWithCustomError(kNFT,"NonTransferable")
    await expect(kNFT.safeBatchTransferFrom(owner.address,other.address,[1],[1],"0x")).to.be.revertedWithCustomError(kNFT,"NonTransferable")

    await kNFT.grantRole(distributer,owner.address)
    expect(await kNFT.batchMint(owner.address,[2,3],[2,3],"0x")).to.emit(kNFT,"TransferSingle")

    expect(await kNFT.safeTransferFrom(owner.address,other.address,1,1,"0x")).to.emit(kNFT,"TransferSingle")
    expect(await kNFT.safeBatchTransferFrom(owner.address,other.address,[2,3],[1,1],"0x")).to.emit(kNFT,"TransferBatch")

    expect(await kNFT.balanceOf(other.address,1)).to.eq(1)
    expect(await kNFT.balanceOf(other.address,2)).to.eq(1)
    expect(await kNFT.balanceOf(other.address,3)).to.eq(1)
  })
  it("distributors can transfer",async()=>{

  })
});
