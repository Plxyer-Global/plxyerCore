import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { Airdrop, TPLXY, NFTPLXY, BPLXY } from "../typechain-types";
import { airdropFixture } from "./shared/fixtures";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
describe("Airdrop", function () {
  let airdrop: Airdrop;
  let PLX: TPLXY;
  let NFPLX: NFTPLXY;
  let BPLX: BPLXY;
  let [owner, other, other2]: SignerWithAddress[] = [];
  this.beforeEach(async () => {
    [owner, other, other2] = await ethers.getSigners();
    const { TAD, TPLX, NFTPLX, TBPLX } = await loadFixture(airdropFixture);
    airdrop = TAD;
    PLX = TPLX;
    NFPLX = NFTPLX;
    BPLX = TBPLX;
  });

  //dropERC20
  it("distributors can dropERC20", async () => {
    const recipient1Address = other.address;
    const recipient2Address = other2.address;
    const amountToDrop = ethers.parseEther("10"); // Assuming it's an Ether value
    await PLX.mint(recipient1Address, ethers.parseUnits("20"));
    await PLX.mint(owner.address, ethers.parseUnits("20"));
    await PLX.connect(other).approve(
      await airdrop.getAddress(),
      ethers.MaxUint256
    );
    await PLX.approve(await airdrop.getAddress(), ethers.MaxUint256);
    await expect(
      airdrop
        .connect(other)
        .dropERC20(
          PLX.getAddress(),
          [owner.address, other2.address],
          [amountToDrop, amountToDrop]
        )
    ).to.be.reverted;
    await expect(
      airdrop.dropERC20(
        PLX.getAddress(),
        [recipient1Address, other2],
        [amountToDrop]
      )
    ).to.revertedWithCustomError(airdrop, "ArrayLengthsMisMatch");
    expect(
      await airdrop.dropERC20(
        PLX.getAddress(),
        [recipient1Address, recipient2Address],
        [amountToDrop, amountToDrop]
      )
    ).to.emit(airdrop, "dropERC20");
    expect(await PLX.balanceOf(recipient1Address)).to.be.eq(
      ethers.parseUnits("30")
    );
    expect(await PLX.balanceOf(recipient2Address)).to.be.eq(
      ethers.parseUnits("10")
    );
  });
  //dropERC721
  it("distributors can dropERC721", async () => {
    const recipient1Address = other.address;
    const recipient2Address = other2.address;

    const tokenToDrop = 23;
    const tokenToDrop2 = 33; // Assuming it's an Ether value
    await NFPLX.mint(recipient1Address, 24);
    await NFPLX.mint(owner.address, 21);
    await NFPLX.mint(owner.address, tokenToDrop);
    await NFPLX.mint(owner.address, tokenToDrop2);
    await NFPLX.connect(other).approve(await airdrop.getAddress(), 24);
    await NFPLX.approve(await airdrop.getAddress(), tokenToDrop);
    await NFPLX.approve(await airdrop.getAddress(), tokenToDrop2);
    await expect(
      airdrop
        .connect(other)
        .dropERC721(
          NFPLX.getAddress(),
          [owner.address, recipient2Address],
          [tokenToDrop, tokenToDrop2]
        )
    ).to.be.reverted;
    await expect(
      airdrop.dropERC721(
        NFPLX.getAddress(),
        [recipient1Address, other2],
        [tokenToDrop]
      )
    ).to.revertedWithCustomError(airdrop, "ArrayLengthsMisMatch");
    expect(
      await airdrop.dropERC721(
        NFPLX.getAddress(),
        [recipient1Address, recipient2Address],
        [tokenToDrop, tokenToDrop2]
      )
    ).to.emit(airdrop, "dropERC721");
    expect(await NFPLX.balanceOf(recipient1Address)).to.be.eq(2);
    expect(await NFPLX.balanceOf(recipient2Address)).to.be.eq(1);
  });

  it("distributors can dropERC115", async () => {
    const recipient1Address = other.address;
    const recipient2Address = other2.address;
    const amountToDrop = ethers.parseEther("10");
    const tokenToDrop = 55;

    const tokenToDrop2 = 66;

    await BPLX.mint(recipient1Address, tokenToDrop, amountToDrop, "0x");
    await BPLX.mint(owner.address, tokenToDrop, amountToDrop, "0x");
    await BPLX.mint(owner.address, tokenToDrop2, amountToDrop, "0x");
    await BPLX.setApprovalForAll(await recipient1Address, true);
    await BPLX.setApprovalForAll(await recipient2Address, true);
    await BPLX.setApprovalForAll(await airdrop.getAddress(), true);

    await expect(
      airdrop
        .connect(other)
        .dropERC1155(
          BPLX.getAddress(),
          [owner.address, recipient2Address],
          [tokenToDrop, tokenToDrop2],
          [amountToDrop, amountToDrop],
          "0x"
        )
    ).to.be.reverted;
    await expect(
      airdrop.dropERC1155(
        BPLX.getAddress(),
        [recipient1Address, recipient2Address],
        [tokenToDrop, tokenToDrop2],
        [amountToDrop],
        "0x"
      )
    ).to.revertedWithCustomError(airdrop, "ArrayLengthsMisMatch");
    expect(
      await airdrop.dropERC1155(
        BPLX.getAddress(),
        [recipient1Address, recipient2Address],
        [tokenToDrop, tokenToDrop2],
        [amountToDrop, amountToDrop],
        "0x"
      )
    ).to.emit(airdrop, "dropERC1155");

    expect(await BPLX.balanceOf(recipient1Address, tokenToDrop)).to.be.eq(
      ethers.parseUnits("20")
    );
    expect(await BPLX.balanceOf(recipient2Address, tokenToDrop2)).to.be.eq(
      ethers.parseUnits("10")
    );
  });
});
