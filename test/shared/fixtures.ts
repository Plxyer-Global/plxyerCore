import { ethers } from "hardhat";

import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";

export const keyNFTFixture = async () => {
  const keyNFT = await ethers.getContractFactory("KeyNFT");
  const nft = await keyNFT.deploy();
  return { nft };
};
export const PLXFixture = async () => {
  const PLX = await ethers.getContractFactory("TPLXY");
  const TPLX = await PLX.deploy();
  return { TPLX };
};
export const NFTPLXFixture = async () => {
  const NFPLX = await ethers.getContractFactory("NFTPLXY");
  const NFTPLX = await NFPLX.deploy();
  return { NFTPLX };
};
export const BTPLXFixture = async () => {
  const BPL = await ethers.getContractFactory("BPLXY");
  const TBPLX = await BPL.deploy();
  return { TBPLX };
};
export const airdropFixture = async () => {
  const AD = await ethers.getContractFactory("Airdrop");
  const TAD = await AD.deploy();
  const { TPLX } = await PLXFixture();
  const { NFTPLX } = await NFTPLXFixture();
  const { TBPLX } = await BTPLXFixture();
  return { TAD, TPLX ,NFTPLX,TBPLX};
};
export const priceOracleFixture = async () => {
  const priceOracle = await ethers.getContractFactory("PriceOracle");
  const { TPLX } = await PLXFixture();
  const oracle = await priceOracle.deploy();
  return { TPLX, oracle };
};
export const PlxyerStoreFixture = async () => {
  const [owner, other, feecollector] = await ethers.getSigners();
  const PLX = await ethers.getContractFactory("TPLXY");
  const invalidCurrency = await PLX.deploy();
  const { nft } = await keyNFTFixture();
  const { TPLX, oracle } = await priceOracleFixture();
  const currencyRole = await oracle.SUPPORTED_CURRENCY();
  await oracle.grantRole(currencyRole, await TPLX.getAddress());
  const MINTER_ROLE = await nft.MINTER_ROLE();
  const plxyerFactory = await ethers.getContractFactory("PlxyerStore");
  const store = await plxyerFactory.deploy(
    await nft.getAddress(),
    await oracle.getAddress(),
    feecollector.address
  );
  await nft.grantRole(MINTER_ROLE, await store.getAddress());
  return { TPLX, oracle, store, nft, invalidCurrency };
};
