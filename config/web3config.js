const colors = require("colors")

//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const rpc1NodeBaseApiKey = process.env.rpc1NodeBaseApiKey
const alchemyNodeBaseApiKey = process.env.alchemyNodeBaseApiKey
const blastNodeApiKey = process.env.blastNodeApiKey
const DRPCBaseNodeApiKey = process.env.DRPCBaseNodeApiKey
const unifraBaseNodeApiKey = process.env.unifraBaseNodeApiKey


// On instancie web3.js
const Web3 = require('web3');
const web3BaseAlchemy = new Web3(new Web3.providers.HttpProvider(`https://base-mainnet.g.alchemy.com/v2/` + alchemyNodeBaseApiKey))
const web3Base1RPC = new Web3(new Web3.providers.HttpProvider(`https://1rpc.io/` + rpc1NodeBaseApiKey + `/base`))
const web3BaseBlast = new Web3(new Web3.providers.HttpProvider(`https://base-mainnet.blastapi.io/` + blastNodeApiKey))
const web3BaseDRPC = new Web3(new Web3.providers.HttpProvider(`https://lb.drpc.org/ogrpc?network=base&dkey=` + DRPCBaseNodeApiKey))
const web3BaseUnifra = new Web3(new Web3.providers.HttpProvider(`https://base-mainnet.unifra.io/v1/` + unifraBaseNodeApiKey))

module.exports = {
  web3BaseAlchemy,
  web3Base1RPC,
  web3BaseBlast,
  web3BaseDRPC,
  web3BaseUnifra
};

console.log("Web3 config succefsuly initiated")