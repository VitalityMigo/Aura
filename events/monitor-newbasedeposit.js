// const { EmbedBuilder } = require("discord.js");
// const { apimonitorsql, apiproviderssql, adminsql, paymentHistory, accessSql, interactionData, reportsql, sequelize } = require('./database')




// const formatCoinValueSign = require("../functions/formatNumberEmbed")
// const reduceText = require("../functions/reducetext")

// const FTSnipeDepositExec = require('../functions/FT-snipe-deposit')

// //Récupérer les clefs API
// const dotenv = require("dotenv")
// dotenv.config()
// const infuraApiKey = process.env.infuraApiKey
// const etherscanApiKey = process.env.etherscanApiKey




// const Web3 = require('web3');
// const web3Call = new Web3("https://cloudflare-eth.com")
// const web3 = new Web3('wss://mainnet.infura.io/ws/v3/' + infuraApiKey);

// const axios = require('axios')
// const colors = require('colors');

// const portalContractAbi = require("../contracts/base/baseportal.json")
// const portalContractAddress = "0x49048044d57e1c92a77f79988d21fa8faf74e97e"
// const bridgeRelay = "0x4200000000000000000000000000000000000007"

// const newFTDeposit = require("../functions/m-newbasedeposit")


// const minValue = 2

// // Création de l'instance du Factory Contract
// const portalContract = new web3.eth.Contract(portalContractAbi, portalContractAddress);


// // Écouter l'événement de création de paire
// portalContract.events.TransactionDeposited()
//     .on('data', async eventData => {

//         try {

//             // Valeur à renvoyer 
//             let mainnetAddress = ""
//             let baseAddress = ""


//             // On récupère les infos de la transaction
//             const hash = eventData.transactionHash
//             const to = eventData.returnValues.to
//             const data = eventData.returnValues.opaqueData

//             // On traite la première partie
//             const hexValue = data.substring(0, 66)
//             const valueWEI = parseInt(hexValue, 16)
//             const value = valueWEI / 10 ** 18


//             // On vérifie que la valeur est assez
//             if (value >= minValue) {

//                 // On traite la seconde partie à la lumière du portal utilisé
//                 if (to.toLowerCase() == bridgeRelay.toLowerCase()) {

//                     mainnetAddress = "0x" + data.substring(636, 676)
//                     baseAddress = "0x" + data.substring(700, 740)

//                 } else {

//                     mainnetAddress = eventData.returnValues.from
//                     baseAddress = to.toLowerCase()

//                 }

//                 const obj = {
//                     mainnetAddress: mainnetAddress.toLowerCase(),
//                     baseAddress: baseAddress.toLowerCase(),
//                     value: value,
//                     hash: hash,
//                     type: "🌐 Bridge",
//                 }

//                 FTSnipeDepositExec(obj)
//                 newFTDeposit(obj)


//             }



//         } catch (error) {

//             console.log(error)


//         }


//     })
//     .on('error', error => {


//         console.error('Erreur:', error);
//     });










