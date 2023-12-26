const colors = require("colors")

//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const rpc1NodeBaseApiKey = process.env.rpc1NodeBaseApiKey
const alchemyNodeBaseApiKey = process.env.alchemyNodeBaseApiKey
const blastNodeApiKey = process.env.blastNodeApiKey
const DRPCBaseNodeApiKey = process.env.DRPCBaseNodeApiKey
const unifraBaseNodeApiKey = process.env.unifraBaseNodeApiKey
const infuraApiKey = process.env.infuraApiKey
const reservoirApiKey = process.env.reservoirApiKey
const blockspanApiKey = process.env.blockspanApiKey
const magicedenApiKey = process.env.magicedenApiKey

// On appel web3.js
const Web3 = require('web3');

// On instancie les nodes Mainnet
const web3CloudflarePublic = new Web3(new Web3.providers.HttpProvider(`https://cloudflare-eth.com`))
const web3Infura = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/v3/" + infuraApiKey))

// On instancie les nodes Base
const web3BaseAlchemy = new Web3(new Web3.providers.HttpProvider(`https://base-mainnet.g.alchemy.com/v2/` + alchemyNodeBaseApiKey))
const web3Base1RPC = new Web3(new Web3.providers.HttpProvider(`https://1rpc.io/` + rpc1NodeBaseApiKey + `/base`))
const web3BaseBlast = new Web3(new Web3.providers.HttpProvider(`https://base-mainnet.blastapi.io/` + blastNodeApiKey))
const web3BaseDRPC = new Web3(new Web3.providers.HttpProvider(`https://lb.drpc.org/ogrpc?network=base&dkey=` + DRPCBaseNodeApiKey))
const web3BaseUnifra = new Web3(new Web3.providers.HttpProvider(`https://base-mainnet.unifra.io/v1/` + unifraBaseNodeApiKey))

// On initialise les APIs NFT
const reservoirA = require('api')('@reservoirprotocol/v2.0#2672bklexdpsbi');
reservoirA.auth(reservoirApiKey);

const reservoirC = require('api')('@reservoirprotocol/v3.0#1im010ljszuoex');
reservoirC.auth(reservoirApiKey);

const blockspan = require('api')('@blockspan/v1.0#9zxl2sledru983');
blockspan.auth(blockspanApiKey);

const magiceden = { 'Authorization': `Bearer ${magicedenApiKey}`};



module.exports = {
  web3CloudflarePublic,
  web3Infura,
  web3BaseAlchemy,
  web3Base1RPC,
  web3BaseBlast,
  web3BaseDRPC,
  web3BaseUnifra,
  reservoirA,
  reservoirC,
  blockspan,
  magiceden
};

console.log(colors.green("Web3 config succefsuly initiated"))