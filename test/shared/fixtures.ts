import { ethers } from "hardhat";

import { time, loadFixture} from "@nomicfoundation/hardhat-network-helpers";


export const keyNFTFixture =async()=>{
    const keyNFT  = await ethers.getContractFactory('KeyNFT')
    const nft = await keyNFT.deploy()
    return {nft}
} 