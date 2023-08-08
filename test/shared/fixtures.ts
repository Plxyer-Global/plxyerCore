import { ethers } from "hardhat";

import { time, loadFixture} from "@nomicfoundation/hardhat-network-helpers";


export const keyNFTFixture =async()=>{
    const keyNFT  = await ethers.getContractFactory('KeyNFT')
    const nft = await keyNFT.deploy()
    return {nft}
} 
export const PLXFixture = async()=>{
    const PLX = await ethers.getContractFactory("TPLXY")
    const TPLX = await PLX.deploy()
    return {TPLX}
}
export const priceOracleFixture = async()=>{
    const priceOracle = await ethers.getContractFactory("PriceOracle")
    const {TPLX} = await PLXFixture()
    const oracle = priceOracle.deploy()
    return {TPLX,oracle}
}
export const PlxyerStoreFixture = async()=>{
    const ercFactory= await ethers.getContractFactory("ERC20")
    const {nft} = await keyNFTFixture()
    const plxyerFactory = await ethers.getContractFactory("PlxyerStore")
    
}