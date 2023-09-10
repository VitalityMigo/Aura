const { EmbedBuilder } = require("discord.js");
const { apimonitorsql, apiproviderssql, adminsql, paymentHistory, accessSql, interactionData, reportsql, sequelize } = require('../events/database')


const formatCoinValueSign = require("../functions/formatNumberEmbed")
const reduceText = require("../functions/reducetext")

function formatWallet(input) {
    return input.length > 35 ? `${input.substring(0, 6)}…${input.substring(input.length - 6)}` : input;
}


// On définit le client et charge les channels
const client = require('../bot'); // Chemin vers le fichier client.js

let serverId = ""
let channelNewBlockId = ""
let channelNewBlock = ""

setTimeout(() => {

    const botId = client.user.id;

    if (botId == "1074328639165964368") {
        // PROD

        serverId = "1108754348818845729"
        channelNewBlockId = "1148045555667304528"

    } else if (botId == "1119666128411709552") {
        // DEV

        serverId = "1071576735298113667"
        channelNewBlockId = "1104225853023461388"
    }

    const botGuild = client.guilds.cache.get(serverId);
    channelNewBlock = botGuild.channels.cache.get(channelNewBlockId);

}, 3000);



async function blockInfosTreatment(infoTable, contractList) {

    let blockNumber = infoTable[0].blockNumber
    let transactionCount = infoTable[0].transactionCount
    let contractCount = infoTable[0].contractCount
    let blockBaseFee = infoTable[0].blockBaseFee
    let blockGasUsed = infoTable[0].blockGasUsed
    let blockGasLimit = infoTable[0].blockGasLimit
    let burntFees = infoTable[0].burntFees
    let blockMiner = infoTable[0].blockMiner
    let blockTimestamp = infoTable[0].blockTimestamp

    //console.log(contractList)




    const newBlock = new EmbedBuilder().setColor("#060A8F")
        .setTitle("Block " + blockNumber + " has been mined")
        .setDescription(">>> A new block has been mined")
        .addFields(
            { name: " ", value: " ", inline: false },
            { name: "Block Number", value: "`" + blockNumber + "`", inline: true },
            { name: "Transaction Count", value: "`" + transactionCount + "`", inline: true },
            { name: "Contract Deployed", value: "`" + contractCount + "`", inline: true },
            { name: "Gas Price", value: "`" + blockBaseFee + " gwei`", inline: true },
            { name: "Gas Units Used", value: "`" + blockGasUsed + "`", inline: true },
            { name: "Gas Limit", value: "`" + blockGasLimit + "`", inline: true },
            { name: "Burnt Fees", value: "`" + parseFloat(burntFees).toFixed(3) + "Ξ`", inline: true },
            { name: "Miner", value: "`" + formatWallet(blockMiner) + "`", inline: true },
            { name: "Block Mined", value: "<t:" + blockTimestamp + ":R>", inline: true },
            { name: "Links", value: '[Etherscan](https://etherscan.io/block/' + blockNumber + ") ∙ " + '[Miner](https://etherscan.io/address/' + blockMiner + ") ∙ " + '[Transactions](https://etherscan.io/txs?block=' + blockNumber + ")", inline: false },

        )
        .setTimestamp()
        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

    await channelNewBlock.send({ embeds: [newBlock] });



    // Code plus évolué avec notable contracts

    // const newBlock = new EmbedBuilder().setColor("#060A8F")
    //     .setTitle("Block " + blockNumber + " has been mined")
    //     .setDescription(">>> A new block has been mined")
    //     .addFields(
    //         { name: " ", value: " ", inline: false },
    //         { name: "Block Number", value: "`" + blockNumber + "`", inline: true },
    //         { name: "Transaction Count", value: "`" + transactionCount + "`", inline: true },
    //         { name: "Contract Deployed", value: "`" + contractCount + "`", inline: true },
    //         { name: "Gas Price", value: "`" + blockBaseFee + " gwei`", inline: true },
    //         { name: "Gas Units Used", value: "`" + blockGasUsed + "`", inline: true },
    //         { name: "Gas Limit", value: "`" + blockGasLimit + "`", inline: true },
    //         { name: "Burnt Fees", value: "`" + parseFloat(burntFees).toFixed(3) + "Ξ`", inline: true },
    //         { name: "Miner", value: "`" + formatWallet(blockMiner) + "`", inline: true },
    //         { name: "Block Mined", value: "<t:" + blockTimestamp + ":R>", inline: true },
    //         { name: " ", value: " ", inline: false },
    //         { name: "Notable Contracts:", value: " ", inline: false },


    //     )
    //     .setTimestamp()
    //     .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });



    // let index = 0
    // let count = 0
    // for (const contract of contractList) {

    //     index++

    //     if (index <= 8) {

    //         let contractAddy = contract.contract
    //         let contractType = contract.type
    //         let contractName = contract.name
    //         let contractSymbol = contract.symbol

    //         let title = reduceText(contractName, 30)
    //         let links = '[Etherscan](https://etherscan.io/address/' + contract + ") ∙ " + '[Opensea](https://opensea.io/collection/' + contract + ") ∙ " + '[Blur](https://blur.io/collection/' + contract + ") ∙ " + '[Magically](https://magically.gg/collection/' + contract + ")"
    //         if (contractType.toLowerCase() == "erc20") {
    //             title = reduceText(contractName, 40) + " (" + contractSymbol.toUpperCase() + ")"
    //             links = '[Etherscan](https://etherscan.io/address/' + contract + ") ∙ " + '[DexScreener](https://dexscreener.com/ethereum/' + contract + ") ∙ " + '[DexSpy](https://dexspy.io/eth/token/' + contract + ") ∙ " + '[Uniswap](https://app.uniswap.org/#/tokens/ethereum/' + contract + ")"
    //         }

    //         let lignMaxSize = 55
    //         let leftPartNfts = "`" + contractAddy.toLowerCase()
    //         let rightPartNfts = contractType + "`"
    //         let additionalPart = links
    //         let leftPartNFTsLenght = leftPartNfts.length
    //         let rightPartNftsLenght = rightPartNfts.length
    //         let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
    //         let spaceLenght = ""
    //         for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

    //         let formattedValue = leftPartNfts + spaceLenght + rightPartNfts + "\n" + additionalPart


    //         newBlock.addFields(
    //             { name: title, value: formattedValue, inline: false },
    //         )

    //         count++

    //     }

    // }

    // if (count <= 0) {

    //     newBlock.addFields(
    //         { name: " ", value: "``` No notable contracts found in this block        ```", inline: false },
    //     )

    // }


    // newBlock.addFields(
    //     { name: "Links", value: '[Etherscan](https://etherscan.io/block/' + blockNumber + ") ∙ " + '[Miner](https://etherscan.io/address/' + blockMiner + ") ∙ " + '[Transactions](https://etherscan.io/txs?block=' + blockNumber + ")", inline: false },
    // )


    // await channelNewBlock.send({ embeds: [newBlock] });






    //return result;
}

module.exports = blockInfosTreatment;