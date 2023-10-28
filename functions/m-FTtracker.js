const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { tracker_friendTech, sequelize } = require('../events/database')

const shareContractABI = require("../contracts/friendtech/share.json");



const { web3BaseAlchemy } = require('../config/web3config');

const axios = require('axios')
const colors = require('colors');
const fs = require('fs').promises;



const reduceText = require("./reducetext")
const addTimeout = require("./addtimeout")

const trackerFile = "contracts/friendtech/tracker.json"




// On définit le client et charge les channels
const client = require('../bot'); // Chemin vers le fichier client.js

let serverId = ""
let botGuild = ""

setTimeout(() => {

    const botId = client.user.id;

    if (botId == "1074328639165964368") {
        // PROD

        serverId = "1108754348818845729"

    } else if (botId == "1119666128411709552") {
        // DEV

        serverId = "1071576735298113667"

    }

    botGuild = client.guilds.cache.get(serverId);

}, 4000);





const buySignature = "0x6945b123"
const sellSignature = "0xb51d0534"




async function trackerHandler(obj) {


    await addTimeout(2)


    try {

        const transaction = obj

        const hash = transaction.hash
        const from = transaction.from.toLowerCase()
        const input = transaction.input




        const cachedTargets = await fs.readFile(trackerFile, 'utf8');
        const targetsTable = JSON.parse(cachedTargets)
        const targetsList = targetsTable.map((object) => object.address.toLowerCase());

        if (targetsList.includes(from)) {


            const trackList = await tracker_friendTech.findAll({ where: { subjectWallet: from } })
            const trackedAuthor = trackList.map(obj => obj.dataValues.authorId)

            let receipt = ""
            let isValid = true

            try {
                // on récupère le receipt
                receipt = await web3BaseAlchemy.eth.getTransactionReceipt(hash)

            } catch (error) {
                console.log("Erreur lors de la récupération de la txn FT SM :" + error)
                isValid = false
            }

            if (isValid == true) {

                // On récupère et décode les logs de la transaction
                const data = receipt.logs[0].data

                const userAddress = ("0x" + data.substring(90, 130)).toLowerCase()
                const amount = parseInt(("0x" + data.substring(450, 514)), 16)
                const ethAmount =  parseInt(("0x" + data.substring(258, 322)), 16) / 10 ** 18
                const protocolEthAmount = parseInt(("0x" + data.substring(322, 386)), 16) / 10 ** 18
                const subjectEthAmount = parseInt(("0x" + data.substring(386, 450)), 16) / 10 ** 18
                const supply = parseInt(("0x" + data.substring(450, 514)), 16)



                // On ajoute quelques éléments de formattage et le prix payé 
                let action = ""
                let netValue = 0
                let binaryAction = ""

                // est ce que c'est un buy ou sell
                if (input.startsWith(buySignature)) {

                    if (from.toLowerCase() != userAddress.toLowerCase()) {

                        action = "📈 Buy"

                    } else if (from.toLowerCase() == userAddress.toLowerCase()) {

                        action = "⚠️ Self Buy"

                    }

                    netValue = ethAmount + protocolEthAmount + subjectEthAmount
                    binaryAction = "1"

                } else if (input.startsWith(sellSignature)) {

                    if (from.toLowerCase() != userAddress.toLowerCase()) {

                        action = "📉 Sell"

                    } else if (from.toLowerCase() == userAddress.toLowerCase()) {

                        action = "⚠️ Self Sell"

                    }

                    netValue = ethAmount + protocolEthAmount + subjectEthAmount
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



                // Récupération des infos du smart wallet
                const smartWalletSingle = targetsTable.find(obj => obj.address.toLowerCase() == from.toLowerCase());
                const smartWalletName = smartWalletSingle.username
                const smartWalletUsername = smartWalletSingle.username



                // on formatte le box d'info
                let formattedData = "Amount: " + amount + "\nValue: " + parseFloat(netValue).toFixed(3) + "Ξ"



                // // on renvoi l'embed
                // const buttonRow = new ActionRowBuilder()
                //     .addComponents(
                //         new ButtonBuilder()
                //             .setCustomId('button_friendtech_user_panel_' + userAddress)
                //             .setLabel('📊 Trade panel ')
                //             .setStyle(1),
                //         new ButtonBuilder()
                //             .setCustomId('button_friendtech_tradeSW_copy_' + amount + "_" + userAddress + "_" + binaryAction)
                //             .setLabel('🎭 Copy trade')
                //             .setStyle(3),

                //     )



                const userFTEmbed = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Friend Tech Tracker")
                    .setDescription(">>> A new trade has been detected by your tracker")
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


                    for (const author of trackedAuthor) {

                    try {

                        const member = await botGuild.members.fetch(author);


                        await member.send({ embeds: [userFTEmbed], components: [] });

                    } catch (error) {

                        console.log("Impossible d'envoyer le tracker dans les DMs du user: " + error.stack)
                    }

                }


            }





        }

    } catch (error) {

        console.log("Erreur global wallet tracker: " + error.stack)
    }

}

module.exports = trackerHandler