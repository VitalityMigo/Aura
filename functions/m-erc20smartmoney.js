const { EmbedBuilder } = require("discord.js");

const erc20Router = require("../contracts/smart-money/erc20Router.json")
const routerList = erc20Router.map((object) => object.contract.toLowerCase());


//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const infuraApiKey = process.env.infuraApiKey
const etherscanApiKey = process.env.etherscanApiKey

const Web3 = require('web3');
const web3 = new Web3("https://cloudflare-eth.com")

const axios = require('axios')
const colors = require('colors');



const reduceText = require("./reducetext")



// On définit le client et charge les channels
const client = require('../bot'); // Chemin vers le fichier client.js

let serverId = ""
let channelSWErc20Id = ""
let channelSWErc20 = ""

setTimeout(() => {

    const botId = client.user.id;

    if (botId == "1074328639165964368") {
        // PROD

        serverId = "1108754348818845729"
        channelSWErc20Id = "1152587443208470629"

    } else if (botId == "1119666128411709552") {
        // DEV

        serverId = "1071576735298113667"
        channelSWErc20Id = "1104225853023461388"
    }

    const botGuild = client.guilds.cache.get(serverId);
    channelSWErc20 = botGuild.channels.cache.get(channelSWErc20Id);

}, 4000);


let platformName = "None"
let isBot = "✅"
let isQT = "✅"


async function erc20smartTreatment(rawInfos) {


    try {


        const sender = rawInfos.from
        const contract = rawInfos.to
        const input = rawInfos.input
        const hash = rawInfos.hash
        const value = rawInfos.value / 10 ** 18


        console.log(colors.green("🤑 New smart money trade ERC20"))
        console.log("Wallet: " + sender)
        console.log("Txn: " + hash)

        const platformInfos = erc20Router.find(objet => objet.contract === contract.toLowerCase());
        if (platformInfos) {
            if (platformInfos.type != "Bot") { isBot = "❌"; isQT = "❌" }
            platformName = platformInfos.tag
        }



        if (input != "0x") {


            if (input.startsWith("0x095ea7b3")) {


                const receipt = await web3.eth.getTransactionReceipt(hash)

                const gasUsed = receipt.gasUsed
                const gasPrice = receipt.effectiveGasPrice / 10 ** 18
                const gasPaid = gasPrice * gasUsed


                const signature = input.substring(0, 10);

                let actionType = "Approval"

                let isSwap = "❌"


                let contractInfosFormatted = "Contract: " + contract.toLowerCase() + "\nName: " + platformName + "\nFunction: " + signature



                const newTradeERC20 = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Smart Money Transaction")
                    .setDescription(">>> A new smart money transaction has been detected")
                    .addFields(
                        { name: " ", value: " ", inline: false },
                        { name: "Wallet", value: "`" + sender.toLowerCase() + "`", inline: false },
                        { name: "Value", value: "`" + value + "Ξ`", inline: true },
                        { name: "Gas Fees", value: "`" + parseFloat(gasPaid).toFixed(3) + "Ξ`", inline: true },
                        { name: "Action Type", value: "`" + actionType + "`", inline: true },
                        { name: " ", value: " ", inline: false },
                        { name: "Bot", value: "`" + isBot + "`", inline: true },
                        { name: "Swap", value: "`" + isSwap + "`", inline: true },
                        { name: "QT", value: "`" + isQT + "`", inline: true },
                        { name: "Contract Interaction:", value: "```" + contractInfosFormatted + "```", inline: false },
                        { name: "Input:", value: "```" + reduceText(input, 1015) + "```", inline: false },
                        { name: "Links", value: '[Wallet](https://etherscan.io/address/' + sender + ") ∙ " + '[Contract](https://etherscan.io/address/' + contract + ") ∙ " + '[Transaction](https://etherscan.io/tx/' + hash + ")", inline: false },


                    )
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });



                await channelSWErc20.send({ embeds: [newTradeERC20] });



            } else {

                const receipt = await web3.eth.getTransactionReceipt(hash)

                const gasUsed = receipt.gasUsed
                const gasPrice = receipt.effectiveGasPrice / 10 ** 18
                const gasPaid = gasPrice * gasUsed


                const signature = input.substring(0, 10);

                let actionType = "Trade"

                let isSwap = "✅"


                let contractInfosFormatted = "Contract: " + contract.toLowerCase() + "\nName: " + platformName + "\nFunction: " + signature


                const newTradeERC20 = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Smart Money Transaction")
                    .setDescription(">>> A new smart money transaction has been detected")
                    .addFields(
                        { name: " ", value: " ", inline: false },
                        { name: "Wallet", value: "`" + sender.toLowerCase() + "`", inline: false },
                        { name: "Value", value: "`" + value + "Ξ`", inline: true },
                        { name: "Gas Fees", value: "`" + parseFloat(gasPaid).toFixed(3) + "Ξ`", inline: true },
                        { name: "Action Type", value: "`" + actionType + "`", inline: true },
                        { name: " ", value: " ", inline: false },
                        { name: "Bot", value: "`" + isBot + "`", inline: true },
                        { name: "Swap", value: "`" + isSwap + "`", inline: true },
                        { name: "QT", value: "`" + isQT + "`", inline: true },
                        { name: "Contract Interaction:", value: "```" + contractInfosFormatted + "```", inline: false },
                        { name: "Input:", value: "```" + reduceText(input, 1015) + "```", inline: false },
                        { name: "Links", value: '[Wallet](https://etherscan.io/address/' + sender + ") ∙ " + '[Contract](https://etherscan.io/address/' + contract + ") ∙ " + '[Transaction](https://etherscan.io/tx/' + hash + ")", inline: false },

                    )
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });



                await channelSWErc20.send({ embeds: [newTradeERC20] });

            }
        }

    } catch (error) {

        console.log("Erreur lors de la récupération de la transaction de smart money :" + error)


    }

}

module.exports = erc20smartTreatment