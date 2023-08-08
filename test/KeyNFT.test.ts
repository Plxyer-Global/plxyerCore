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
    await expect(kNFT.safeTransferFrom(owner.address,other.address,1,1,"0x")).to.be.revertedWithCustomError(kNFT,"NonTransferable")
    await expect(kNFT.safeBatchTransferFrom(owner.address,other.address,[1],[1],"0x")).to.be.revertedWithCustomError(kNFT,"NonTransferable")
  })
});
