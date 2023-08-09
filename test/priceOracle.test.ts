import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { KeyNFT, PriceOracle, TPLXY } from "../typechain-types";
import {  priceOracleFixture } from "./shared/fixtures";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";

describe("PriceOracle",()=>{
  let POracle:PriceOracle
  let PLX:TPLXY
  let [owner, other]:SignerWithAddress[] = []
  const price = ethers.parseUnits("0.002")
  beforeEach(async ()=>{
    [owner,other] = await ethers.getSigners()
    const {TPLX,oracle} = await loadFixture(priceOracleFixture)
    POracle =oracle
    PLX = TPLX
  })
  it("only pricesetter set Price",async()=>{
    await expect(POracle.connect(other).setPrice(price,await PLX.getAddress())).to.be.reverted
    expect (await POracle.setPrice(price,await PLX.getAddress())).to.be.ok
  })
  it("fetch suppported token  only price",async()=>{
    const address =await PLX.getAddress()
    expect (await POracle.setPrice(price,address)).to.be.ok
    const currencyRole = await POracle.SUPPORTED_CURRENCY()
    await expect(POracle.price(address)).to.be.revertedWithCustomError(POracle,"unsupportedToken")
    await expect(POracle.getTokenAmount(ethers.parseUnits("0.002"),address)).to.be.revertedWithCustomError(POracle,"unsupportedToken")

    expect(await POracle.grantRole(currencyRole,address)).to.be.ok
    expect(await POracle.price(address)).to.eq(price)
    expect(await POracle.getTokenAmount(ethers.parseUnits("0.002"),address)).to.eq(ethers.parseUnits("1"))
    expect(await POracle.getTokenAmount(ethers.parseUnits("34"),address)).to.eq(ethers.parseUnits("17000"))
  })
  
})