const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");

const shareContractABI = require("../contracts/friendtech/share.json")
const shareContractTradeEventInput = shareContractABI.find(obj => obj.name === "Trade" && obj.type === "event").inputs

const smartWalletJson = require("../contracts/friendtech/smartwallet.json")

//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const infuraApiKey = process.env.infuraApiKey
const etherscanApiKey = process.env.etherscanApiKey

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(`https://1rpc.io/base`))

const axios = require('axios')
const colors = require('colors');


const reduceText = require("./reducetext")
const addTimeout = require("./addtimeout")
const decodeLogs = require("./decodelog")





// On définit le client et charge les channels
const client = require('../bot'); // Chemin vers le fichier client.js

let serverId = ""
let channelFTSmartMoneyId = ""
let channelFTSmartMoney = ""



setTimeout(() => {

    const botId = client.user.id;

    if (botId == "1074328639165964368") {
        // PROD

        serverId = "1108754348818845729"
        channelFTSmartMoneyId = "1155457627560611860"


    } else if (botId == "1119666128411709552") {
        // DEV

        serverId = "1071576735298113667"
        channelFTSmartMoneyId = "1155457483649851443"


    }

    const botGuild = client.guilds.cache.get(serverId);
    channelFTSmartMoney = botGuild.channels.cache.get(channelFTSmartMoneyId);

}, 4000);





const buySignature = "0x6945b123"
const sellSignature = "0xb51d0534"





async function newSmartMoneyTrade(obj) {


    //await addTimeout(7)


    try {

        // const timeStamp = Date.now();
        // const actualTimestamp = parseFloat(timeStamp / 1000).toFixed(0)


        // On récupère les infos de base de la transaction
        const transaction = obj

        const hash = transaction.hash
        const from = transaction.from
        const input = transaction.input


        let receipt = ""
        let isValid = true

        try {
            // on récupère le receipt
            receipt = await web3.eth.getTransactionReceipt(hash)

        } catch (error) {
            console.log("Erreur lors de la récupération de la txn FT SM :" + error)
            isValid = false
        }

        if (isValid == true) {

            // On récupère et décode les logs de la transaction
            const data = receipt.logs[0].data
            const decodedLogs = await decodeLogs(shareContractTradeEventInput, data)

            const userAddress = decodedLogs.subject
            const amount = decodedLogs.shareAmount
            const ethAmount = decodedLogs.ethAmount / 10 ** 18
            const protocolEthAmount = decodedLogs.protocolEthAmount / 10 ** 18
            const subjectEthAmount = decodedLogs.subjectEthAmount / 10 ** 18
            const supply = decodedLogs.supply



            // On ajoute quelques éléments de formattage et le prix payé 
            let action = ""
            let netValue = 0
            let binaryAction = ""

            // est ce que c'est un buy ou sell
            if (input.startsWith(buySignature)) {
                action = "📈 Buy"
                netValue = ethAmount + protocolEthAmount + subjectEthAmount
                binaryAction = "1"
            } else if (input.startsWith(sellSignature)) {
                action = "📉 Sell"
                netValue = ethAmount - protocolEthAmount - subjectEthAmount
                binaryAction = "0"
            }




            // On récupère les infos du sujet
            let userInfoCall = ""

            try {
                userInfoCall = await axios.get("https://prod-api.kosetto.com/users/" + userAddress.toLowerCase())
            } catch (error) {

                console.log("Erreur dans la récupération des infos du user FT " + error.stack)

            }



            let twitterUsername = userInfoCall.data.twitterUsername
            let twitterName = userInfoCall.data.twitterName
            let twitterPfp = userInfoCall.data.twitterPfpUrl

            let price = userInfoCall.data.displayPrice / 10 ** 18




            // Console log monitor
            console.log(colors.green("🤑 New smart friend.tech trade"))
            console.log("From: " + from)
            console.log("Wallet: @" + twitterUsername)
            console.log("Txn: " + hash)


            // Récupération des infos du smart wallet
            const smartWalletSingle = smartWalletJson.find(obj => obj.address.toLowerCase() == from.toLowerCase());
            const smartWalletName = smartWalletSingle.name
            const smartWalletUsername = smartWalletSingle.username



            // on formatte le box d'info
            let formattedData = "Amount: " + amount + "\nValue: " + parseFloat(netValue).toFixed(3) + "Ξ"



            // on renvoi l'embed
            const buttonRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('button_friendtech_user_panel_' + userAddress)
                        .setLabel('📊 Trade panel ')
                        .setStyle(1),
                    new ButtonBuilder()
                        .setCustomId('button_friendtech_tradeSW_copy_' + amount + "_" + userAddress + "_" + binaryAction)
                        .setLabel('🎭 Copy trade')
                        .setStyle(3),
                        new ButtonBuilder()
                        .setCustomId('ft_interaction_' + from + "_" + userAddress)
                        .setLabel('👁 Insights')
                        .setStyle(3),

                )
                


            const userFTEmbed = new EmbedBuilder().setColor("#060A8F")
                .setTitle("New Smart Money Trade")
                .setDescription(">>> A new smart trade has been detected")
                .setThumbnail(twitterPfp)
                .setTimestamp()
                .addFields(
                    { name: "From", value: "[" + smartWalletName + "](https://www.friend.tech/rooms/" + from + ")\n∟[<:TWs:1153688442568450148>](https://twitter.com/" + smartWalletUsername + ")[<:basescan:1155624395038019616>](https://basescan.org/address/" + from + ")\n", inline: true },
                    { name: "Subject", value: "`" + twitterName + "`", inline: true },
                    { name: "Action", value: "`" + action + "`", inline: true },
                    { name: "Price", value: "`" + parseFloat(price).toFixed(3) + "Ξ`", inline: true },
                    { name: "Supply", value: "`" + supply + "`", inline: true },
                    { name: " ", value: "```js\n" + formattedData + "```", inline: false },
                    { name: "Links", value: '[Friendtech](https://www.friend.tech/rooms/' + userAddress + ") ∙ " + '[Twitter](https://twitter.com/' + twitterUsername.toLowerCase() + ") ∙ " + '[Basescan](https://basescan.org/address/' + userAddress + ") ∙ " + '[Transaction](https://basescan.org/tx/' + hash + ") ∙ " + '[Chart](https://www.degenz.finance/friendtech/portfolio?address=' + userAddress + ")", inline: false }

                )
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


            await channelFTSmartMoney.send({ embeds: [userFTEmbed], components: [buttonRow] });


        }

    } catch (error) {

        console.log("Erreur lors de la récupération de la transaction du nouveau user Friend.Tech :" + error.stack)

    }

}




module.exports = newSmartMoneyTrade
