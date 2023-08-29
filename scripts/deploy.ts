import { ethers, network ,run} from "hardhat";
import config from "../config";
async function main() {
  const networkName = network.name as keyof typeof config.OwnerAddress
  console.log(`deploying to :${networkName}`)
  // KNFT
  console.log("deploying KeyNFT")
  const KNFTFac = await ethers.getContractFactory('KeyNFT')
  console.log("...")
  const KNFT = await KNFTFac.deploy()
  const kNFTADdress = await KNFT.getAddress()
  console.log(`KeyNFT:${kNFTADdress}`)
  await KNFT.waitForDeployment();

  // Price Oracle
  console.log("deploying PriceOracle")
  const OracleFac = await ethers.getContractFactory('PriceOracle')
  console.log("...")
  const ORacle = await OracleFac.deploy()
  const ORacleAdd = await ORacle.getAddress()
  console.log(`PriceOracle:${ORacleAdd}`)
  await ORacle.waitForDeployment();

  // PlxyerStore
  console.log("deploying PlxyerStore")
  const PLXSTORE_Fac = await ethers.getContractFactory('PlxyerStore')
  console.log("...")
  const PLXSTORE = await PLXSTORE_Fac.deploy(kNFTADdress, ORacleAdd, config.FeeCollector[networkName])
  const Storeadd = await PLXSTORE.getAddress()
  console.log(`PlxyerStore:${Storeadd}`)
  await PLXSTORE.waitForDeployment();

  console.log("Granting Store minterRole")
  const MinterRole = await KNFT.MINTER_ROLE()
  await KNFT.grantRole(MinterRole, PLXSTORE)

  console.log("setting PLX as Currency")
  const CurrencyRole = await ORacle.SUPPORTED_CURRENCY()
  if (networkName == "testnet") {
    // deploy test Token
    console.log("deploying ERC20:TPLXY")
    const Tkk_FAC = await ethers.getContractFactory("TPLXY")
    const TK = await Tkk_FAC.deploy()
    const tkADD = await TK.getAddress()
    console.log(`PlxyerStore:${tkADD}`)
    await ORacle.grantRole(CurrencyRole, tkADD)
    await ORacle.setPrice(ethers.parseUnits("0.2"), tkADD)
    run("verify:verify", {
      address: tkADD,
      constructorArguments: []
    }).catch((error) => {
      console.log("error verifying TKK test")
      console.log(error)
    })
  }
  else {
    await ORacle.grantRole(CurrencyRole, config.PLX[networkName])
    await ORacle.setPrice(ethers.parseUnits("0.2"), config.PLX[networkName])
  }
  console.log("PLX set as Currency")

  await Promise.all([
    run("verify:verify", {
      address: kNFTADdress,
      constructorArguments: []
    }).catch((error) => {
      console.log("error verifying KeyNFT")
      console.log(error)
    }),
    run("verify:verify", {
      address: ORacleAdd,
      constructorArguments: []
    }).catch((error) => {
      console.log("error verifying PriceOracle")
      console.log(error)
    }),
    run("verify:verify", {
      address: Storeadd,
      constructorArguments: [kNFTADdress, ORacleAdd, config.FeeCollector[networkName]]
    }).catch((error) => {
      console.log("error verifying PlxyerStore")
      console.log(error)
    }),
    
  ])
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
