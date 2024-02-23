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
const alchemyApiKey = process.env.alchemyApiKey
const nftgoApiKey = process.env.nftgoApiKey
const quicknodebaseApiKey = process.env.quicknodebaseApiKey
const openseaApiKey = process.env.openseaApiKey
const bestinslotApiKey = process.env.bestinslotApiKey
const chainbaseApiKey = process.env.chainbaseApiKey


// On appel web3.js
const Web3 = require('web3');


// On instancie les nodes Mainnet
const web3CloudflarePublic = new Web3(new Web3.providers.HttpProvider(`https://cloudflare-eth.com`))
const web3Infura = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/v3/" + infuraApiKey))
const wssInfura = new Web3('wss://mainnet.infura.io/ws/v3/' + infuraApiKey);
const mevblocker = new Web3(new Web3.providers.HttpProvider("https://rpc.mevblocker.io"))


// On instancie les nodes Base
const web3BaseAlchemy = new Web3(new Web3.providers.HttpProvider(`https://base-mainnet.g.alchemy.com/v2/` + alchemyNodeBaseApiKey))
const web3Base1RPC = new Web3(new Web3.providers.HttpProvider(`https://1rpc.io/` + rpc1NodeBaseApiKey + `/base`))
const web3BaseBlast = new Web3(new Web3.providers.HttpProvider(`https://base-mainnet.blastapi.io/` + blastNodeApiKey))
const web3BaseDRPC = new Web3(new Web3.providers.HttpProvider(`https://lb.drpc.org/ogrpc?network=base&dkey=` + DRPCBaseNodeApiKey))
const web3BaseUnifra = new Web3(new Web3.providers.HttpProvider(`https://base-mainnet.unifra.io/v1/` + unifraBaseNodeApiKey))
const wssBase = new Web3(new Web3.providers.WebsocketProvider(`wss://nameless-hardworking-pallet.base-mainnet.discover.quiknode.pro/` + quicknodebaseApiKey))

// On initialise les APIs NFT
const reservoirA = require('api')('@reservoirprotocol/v2.0#2672bklexdpsbi');
reservoirA.auth(reservoirApiKey);

const reservoirB = require('api')('@reservoirprotocol/v3.0#kke23hlqfhwtrr');
reservoirB.auth(reservoirApiKey);

const reservoirC = require('api')('@reservoirprotocol/v3.0#1im010ljszuoex');
reservoirC.auth(reservoirApiKey);

const reservoirD = require('api')('@reservoirprotocol/v3.0#2n2re32lkmyg6l7');
reservoirD.auth(reservoirApiKey);

const reservoirE = require('api')('@reservoirprotocol/v2.0#1xltvr918dlfmst76l');
reservoirE.auth(reservoirApiKey);

const reservoirF = require('api')('@reservoirprotocol/v3.0#434y7jljnak92y');
reservoirF.auth(reservoirApiKey);

const reservoirG = require('api')('@reservoirprotocol/v3.0#9eilkbbprl8');
reservoirG.auth(reservoirApiKey);

const reservoirH = require('api')('@reservoirprotocol/v3.0#5fxm01pliufqnan');
reservoirH.auth(reservoirApiKey);

const reservoirI = require('api')('@reservoirprotocol/v3.0#j7ej3alr9o3etb');
reservoirH.auth(reservoirApiKey);

const reservoirHead = {
  "X-Api-Key": reservoirApiKey,
  "accept": "*/*",
  "host": "api.reservoir.tools"
}

const blockspan = require('api')('@blockspan/v1.0#9zxl2sledru983');
blockspan.auth(blockspanApiKey);

const magiceden = { 'Authorization': `Bearer ${magicedenApiKey}`};

const alchemyB = require('api')('@alchemy-docs/v1.0#24zcsa23lfbpdnv5');

const nftgo = require('api')('@nftgo/v1.0#28807z4klgnauhl3');
nftgo.auth(nftgoApiKey);

const nftGoB = require('api')('@nftgo/v1.0#i65d19lewn3l7h');
nftGoB.auth(nftgoApiKey);

const nftgoHead = {
  "Accept": "application/json",
  "X-Api-Key": nftgoApiKey,
  "Host": "data-api.nftgo.io"
}

const chainbaseHead = {
  "Accept": "application/json",
  "x-api-key": chainbaseApiKey,
}

const openseaHead = {
  'X-Api-Key': openseaApiKey
};

// Configuration de l'en-tête d'autorisation
const bestinslot = {
  'x-api-key': bestinslotApiKey
};


// On instancie les nodes Solana
const { Connection } = require('@solana/web3.js');
const sol = new Connection('https://api.mainnet-beta.solana.com');


module.exports = {
  web3CloudflarePublic,
  web3Infura,
  wssInfura,
  web3BaseAlchemy,
  web3Base1RPC,
  web3BaseBlast,
  web3BaseDRPC,
  web3BaseUnifra,
  wssBase,
  mevblocker,
  reservoirA,
  reservoirB,
  reservoirC,
  reservoirD,
  reservoirE,
  reservoirF,
  reservoirG,
  reservoirH,
  reservoirI,
  reservoirHead,
  blockspan,
  magiceden,
  alchemyB,
  nftgo,
  nftGoB,
  nftgoHead,
  openseaHead,
  chainbaseHead,
  bestinslot,
  sol,
};

console.log(colors.green("Web3 config succefsuly initiated"))