const { EmbedBuilder } = require("discord.js");
const { apimonitorsql, apiproviderssql, adminsql, paymentHistory, accessSql, interactionData, reportsql, erc20, sequelize } = require('./database')


const erc20Standard = require("../contracts/uniswap/erc20standart.json")
const erc721Standard = require("../contracts/blur/erc721standard.json")

const smartWalleterc20List = require("../contracts/smart-money/walletlisterc20.json")
const erc20Router = require("../contracts/smart-money/erc20Router.json")
const routerList = erc20Router.map((object) => object.contract.toLowerCase());

const formatCoinValueSign = require("../functions/formatNumberEmbed")
const reduceText = require("../functions/reducetext")
const contractType = require("../functions/contracttype")

const blockInfosTreatment = require("../functions/m-newblock")
const erc20smartTreatment = require("../functions/m-erc20smartmoney")
const addTimeout = require("../functions/addtimeout")
const newContract = require("../functions/m-newcontract")
const coinTracker = require("../functions/m-cointracker")

const colors = require('colors');
const fs = require("fs").promises

//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const infuraApiKey = process.env.infuraApiKey
const etherscanApiKey = process.env.etherscanApiKey

const trackerFile = "contracts/uniswap/tracker.json"




const Web3 = require('web3');
//const web3 = new Web3("https://cloudflare-eth.com")
const web3 = new Web3(new Web3.providers.WebsocketProvider(`wss://mainnet.infura.io/ws/v3/${infuraApiKey}`, {
    clientConfig: {
        // Ajustez la taille maximale des trames et des messages selon vos besoins.
        maxReceivedFrameSize: 10000000000, // Taille maximale des trames reçues en octets.
        maxReceivedMessageSize: 10000000000, // Taille maximale des messages reçus en octets.
    }
}));

const axios = require('axios')



function formatWallet(input) {
    return input.length > 35 ? `${input.substring(0, 6)}…${input.substring(input.length - 6)}` : input;
}


// On définit le client et charge les channels
const client = require('../bot'); // Chemin vers le fichier client.js

let serverId = ""
let channelNewERC20ContractId = ""
let channelNewERC721ContractId = ""

let channelNewERC20Contract = ""
let channelNewERC721Contract = ""

setTimeout(() => {

    const botId = client.user.id;

    if (botId == "1074328639165964368") {
        // PROD

        serverId = "1108754348818845729"
        channelNewERC20ContractId = "1148045555667304528"
        channelNewERC721ContractId = "1148045614920241192"

    } else if (botId == "1119666128411709552") {
        // DEV

        serverId = "1071576735298113667"
        channelNewERC20ContractId = "1104225853023461388"
        channelNewERC721ContractId = "1104225853023461388"
    }

    const botGuild = client.guilds.cache.get(serverId);
    channelNewERC20Contract = botGuild.channels.cache.get(channelNewERC20ContractId);
    channelNewERC721Contract = botGuild.channels.cache.get(channelNewERC721ContractId);

}, 4000);









// ON lance l'écoute
web3.eth.subscribe('newBlockHeaders', async (error, header) => {

    try {

        await addTimeout(1.5)

        const timeStamp = Date.now();
        const actualTimestamp = parseFloat(timeStamp / 1000).toFixed(0)
        createdSince = "<t:" + actualTimestamp + ":R>"

        if (error) {
            console.error('Erreur lors de l écoute des en-têtes de bloc :', error);
            return;
        }

        //On récupère les infos du block
        const blockNumber = header.number
        const blockMiner = header.miner
        const blockGasLimit = header.gasLimit
        const blockGasUsed = header.gasUsed
        const blockBaseFee = header.baseFeePerGas / 10 ** 9
        const blockTimestamp = header.timestamp


        let transactionCount = 0
        let contractCount = 0
        let contractList = []

        // On met à jour le fichier des wallets survéillés
        // Fait ici car besoin d'une mise à jour en direct
        const cachedTargets = await fs.readFile(trackerFile, 'utf8');
        const targetsTable = JSON.parse(cachedTargets)
        const targetsList = targetsTable.map((object) => object.address.toLowerCase());


        await web3.eth.getBlock(blockNumber, true, async (error, block) => {
            if (error) {
                console.error('Erreur lors de la récupération du bloc :', error);
                return;
            }

            // Parcourez les transactions du bloc
            block.transactions.forEach(async transaction => {

                transactionCount++

                // On déclare les valeurs de la transaction
                // Valeurs réutilisé tout au long des monitors et executant
                const to = transaction.to
                const from = transaction.from.toLowerCase()
                const value = transaction.value
                const input = transaction.input


                // Nouveau contrat
                if (to == null && input !== '0x' && value == 0) {

                    newContract(transaction)

                }



                // Transactions smart money erc20
                if (smartWalleterc20List.includes(from.toLowerCase())) {

                    erc20smartTreatment(transaction)

                }



                // Wallet tracker ERC20
                if (targetsList.includes(from)) {

                    coinTracker(transaction)

                }


            })
        });








        // Pour chaque block on récupère les informations
        // On les envoie à la fonction qui affiche le nouveau bloc
        //Block monitor
        let burntFees = (header.baseFeePerGas / 10 ** 18) * blockGasUsed

        let blockInfos = []
        let objBlock = {}
        objBlock.blockNumber = blockNumber
        objBlock.transactionCount = transactionCount
        objBlock.contractCount = contractCount
        objBlock.blockBaseFee = blockBaseFee
        objBlock.blockGasUsed = blockGasUsed
        objBlock.blockGasLimit = blockGasLimit
        objBlock.burntFees = burntFees
        objBlock.blockMiner = blockMiner
        objBlock.blockTimestamp = blockTimestamp
        blockInfos.push(objBlock)

        blockInfosTreatment(blockInfos, contractList)

        console.log(colors.blue("🔗 New Block: " + blockNumber))





    } catch (error) {
        console.log(error);

        // Faites quelque chose avec l'adresse du nouveau contrat, par exemple, enregistrez-la dans une base de données.
    }




});


