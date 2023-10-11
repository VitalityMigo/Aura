const colors = require("colors")

//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const rpc1NodeBaseApiKey = process.env.rpc1NodeBaseApiKey
const alchemyNodeBaseApiKey = process.env.alchemyNodeBaseApiKey
const blastNodeApiKey = process.env.alchemyApiKey


// On instancie web3.js
const Web3 = require('web3');
const web3BaseAlchemy = new Web3(new Web3.providers.HttpProvider(`https://base-mainnet.g.alchemy.com/v2/` + alchemyNodeBaseApiKey))
const web3Base1RPC = new Web3(new Web3.providers.HttpProvider(`https://1rpc.io/` + rpc1NodeBaseApiKey + `/base`))
const web3BaseBlast = new Web3(new Web3.providers.HttpProvider(`https://base-mainnet.blastapi.io/` + blastNodeApiKey))


module.exports = {
  web3BaseAlchemy,
  web3Base1RPC,
  web3BaseBlast,
};

console.log("Web3 config succefsuly initiated")