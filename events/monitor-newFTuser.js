const { EmbedBuilder } = require("discord.js");
const { apimonitorsql, apiproviderssql, adminsql, paymentHistory, accessSql, interactionData, reportsql, sequelize } = require('./database')

const shareContractABI = require("../contracts/friendtech/share.json")
const pairContractAbi = require("../contracts/uniswap/pair.json")
const erc20Standard = require("../contracts/uniswap/erc20standart.json")


const formatCoinValueSign = require("../functions/formatNumberEmbed")
const reduceText = require("../functions/reducetext")

const newFriendtechUser = require('../functions/m-newFTuser')

//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const infuraApiKey = process.env.infuraApiKey
const etherscanApiKey = process.env.etherscanApiKey
const quicknodebaseApiKey = process.env.quicknodebaseApiKey

const Web3 = require('web3');
const web3Call =  new Web3(new Web3.providers.HttpProvider(`https://1rpc.io/base`))
const web3 =  new Web3(new Web3.providers.WebsocketProvider(`wss://nameless-hardworking-pallet.base-mainnet.discover.quiknode.pro/` + quicknodebaseApiKey))

// wss://base-mainnet.blastapi.io/cd7e4eee-1068-4ca2-809e-b898e938c0d2


const axios = require('axios')
const colors = require('colors');



// On définit les constantes et variables principales
const shareContractAddress = "0xcf205808ed36593aa40a44f10c7f7c2f67d4a4d4";




let tokenAddress = ""

let priceEth = 0
let priceUsd = 0
let marketCap = 0
let pooledETH = 0
let pooledToken = 0
let liquidity = 0
let reserveToken0 = ""
let reserveToken1 = ""

let ownership = "N/A"
let devBalance = 0
let deployerBalance = 0
let ownerBalance = 0
let createdSince = "`Unknown`"



web3.eth.subscribe('newBlockHeaders', async (error, header) => {


    const blockNumber = header.number


    await web3.eth.getBlock(blockNumber, true, async (error, block) => {

        if (error) {
            console.error('Erreur lors de la récupération du bloc :', error);
            return;
        }



        await block.transactions.forEach(async transaction => {

            const input = transaction.input
            const contract = transaction.to
            const value = transaction.value

            const buySignature = "0x6945b123"
            const newValue = "0"


            

            if (input.startsWith(buySignature) && contract.toLowerCase() == shareContractAddress.toLowerCase() && newValue == value) {

                
                newFriendtechUser(transaction)



            }




        })
    });
});



