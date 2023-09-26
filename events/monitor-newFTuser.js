const { EmbedBuilder } = require("discord.js");
const { apimonitorsql, apiproviderssql, adminsql, paymentHistory, accessSql, interactionData, reportsql, sequelize } = require('./database')

const shareContractABI = require("../contracts/friendtech/share.json")
const pairContractAbi = require("../contracts/uniswap/pair.json")
const erc20Standard = require("../contracts/uniswap/erc20standart.json")


const formatCoinValueSign = require("../functions/formatNumberEmbed")
const reduceText = require("../functions/reducetext")
const addTimeout = require("../functions/addtimeout")

const newFriendtechUser = require('../functions/m-newFTuser')
const newSmartMoneyTrade = require('../functions/m-FTsmartmoney')
const newFTDeposit = require("../functions/m-newbasedeposit")

//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const infuraApiKey = process.env.infuraApiKey
const etherscanApiKey = process.env.etherscanApiKey
const quicknodebaseApiKey = process.env.quicknodebaseApiKey

const Web3 = require('web3');
const web3Call = new Web3(new Web3.providers.HttpProvider(`https://1rpc.io/base`))
const web3 = new Web3(new Web3.providers.WebsocketProvider(`wss://nameless-hardworking-pallet.base-mainnet.discover.quiknode.pro/` + quicknodebaseApiKey))

// wss://base-mainnet.blastapi.io/cd7e4eee-1068-4ca2-809e-b898e938c0d2


const axios = require('axios')
const colors = require('colors');



// On définit les constantes et variables principales
const shareContractAddress = "0xcf205808ed36593aa40a44f10c7f7c2f67d4a4d4";

const smartWalletJson = require("../contracts/friendtech/smartwallet.json")
const smartWalletTable = smartWalletJson.map(obj => obj.address);

const depositRelayAddress = "0x977f82a600a1414e583f7f13623f1ac5d58b1c0b"
const depositBridgerL1AddressA = "0x3154cf16ccdb4c6d922629664174b904d80f2c35"
const depositBridgerL2AddressA = "0x4200000000000000000000000000000000000007"
const depositBridgerL2AddressB = "0x4200000000000000000000000000000000000010"
const depositMin = 1

const exepectedTxnType = 126


addTimeout(3)


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


    try {


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
                const from = transaction.from
                const type = transaction.type
                const mint = parseInt(transaction.mint, 16)
                const hash = transaction.hash

                const buySignature = "0x6945b123"
                const sellSignature = "0xb51d0534"
                const newValue = "0"
                const valueEth = value / 10 ** 18


                // // On renvoi vers le new user
                if (input.startsWith(buySignature) && contract.toLowerCase() == shareContractAddress.toLowerCase() && newValue == value) {


                    newFriendtechUser(transaction)



                }




                // On vérifie que ça vient d'un wallet SM, que le contrat est bien FT, que la valeur est différente de 0, et que c'est un buy ou un sell
                if (smartWalletTable.includes(from.toLowerCase()) && contract.toLowerCase() == shareContractAddress.toLowerCase() && (input.startsWith(sellSignature) || (input.startsWith(buySignature) && newValue != value))) {


                    newSmartMoneyTrade(transaction)


                }




                if ((from.toLowerCase() == depositRelayAddress.toLowerCase() && contract.toLowerCase() == depositBridgerL2AddressA.toLowerCase() && valueEth >= depositMin) || (input == "0x01" && type == exepectedTxnType && mint && from.toLowerCase() == contract.toLowerCase() && valueEth >= depositMin)) {

                    newFTDeposit(transaction)


                }





            })
        });

    } catch (error) {


        console.log("Erreur lors de la récupération du bloc: " + error)

    }


});



