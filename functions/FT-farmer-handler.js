const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");

const axios = require("axios")

const { web3Base1RPC, web3BaseUnifra } = require('../config/web3config');

const addTimeout = require("./addtimeout")
const getPrice = require("./FT-getprice")



// On définit le client et charge les channels

let serverId = ""
let botChannel = ""
let botChannelId = ""
let botGuild


setTimeout(() => {

    const client = require('../bot'); // Chemin vers le fichier client.js

    const botId = client.user.id;

    if (botId == "1074328639165964368") {
        // PROD

        serverId = "1108754348818845729"
        botChannelId = "1121481984812798084"


    } else if (botId == "1119666128411709552") {
        // DEV

        serverId = "1071576735298113667"
        botChannelId = "1104225853023461388"


    }
    botGuild = client.guilds.cache.get(serverId);
    botChannel = botGuild.channels.cache.get(botChannelId);

}, 4000);





async function getReceipt(txn) {
    try {
        const receipt = await web3BaseUnifra.eth.getTransactionReceipt(txn)

        if (receipt != null) {
            return receipt

        } else {

            await addTimeout(5)

            const receipt = await web3BaseUnifra.eth.getTransactionReceipt(txn)

            return receipt

        }

    } catch (error) {

        return null

    }
}



async function farmerHandler(subjectAddress, taskList) {

    // On attend que le receipt soit dispo
    await addTimeout(4)




    for (const task of taskList) {

        try {


            let isDone = false


            let action = "👨🏽‍🌾 Buy Farm"
            if (task.type == "sell") { action = "👨🏽‍🌾 Sell Farm" }


            const member = await botGuild.members.fetch(task.authorId);


            const userInfos = await axios.get("https://prod-api.kosetto.com/users/" + subjectAddress)

            const subjectPfp = userInfos.data.twitterPfpUrl
            const subjectName = userInfos.data.twitterName

            const receipt = await getReceipt(task.hash)

            if (receipt != null) {



                if (receipt.status == true) {


                    const totalValue = parseFloat(task.value / 10 ** 18) + parseFloat(receipt.gasUsed * (receipt.effectiveGasPrice / 10 ** 18))


                    let textFormatted = ""
                    if (task.type == "buy") {
                        textFormatted = "**Bought** `" + task.amount + "` **key(s) for** `" + totalValue + "Ξ`"
                    } else {
                        const sellPrice = getSellPriceAfterFee(task.supply, parseInt(task.amount))

                        textFormatted = "**Sold** `" + task.amount + "` **key(s) for** `" + sellPrice / 10 ** 18 + "Ξ`"

                    }

                    const snipeMessage = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Farmer Confirmed ✅")
                        .setDescription(">>> Displaying your farmer task")
                        .setThumbnail(subjectPfp)
                        .setTimestamp()
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "Action", value: "`" + action + "`", inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: "Target", value: "`" + subjectName + "`", inline: true },
                            { name: "Task ID", value: "`1`", inline: true },
                            { name: " ", value: " ", inline: false },
                            { name: " ", value: textFormatted, inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: "Transaction hash:", value: "```" + task.hash + "```∟ Transaction details [here](https://basescan.org/tx/" + task.hash + ")", inline: false },
                            { name: " ", value: " ", inline: false },
                            //{ name: "Links", value: '[Friendtech](https://www.friend.tech/rooms/' + userAddress + ") ∙ " + '[Twitter](https://twitter.com/' + twitterUsername.toLowerCase() + ") ∙ " + '[Basescan](https://basescan.org/address/' + userAddress + ") ∙ " + '[Holders](https://www.friend.tech/trades/' + userAddress + ") ∙ " + '[Chart](https://www.degenz.finance/friendtech/portfolio?address=' + userAddress + ")", inline: false }

                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                    try {
                        await member.send({ embeds: [snipeMessage] });
                        await botChannel.send("<@&1121510423687090186> Done farmer " + task.authorName + " at [here](https://basescan.org/tx/" + task.hash + ")");

                    } catch (error) {

                        await botChannel.send("<@&1121510423687090186> Erreur durant l'envoi message farmer de " + task.authorName + " : \n" + error.stack);
                        console.log("L'utilisateur a ses DMs fermés")

                    }


                } else {


                    let textFormatted = ""
                    if (task.type == "buy") {
                        textFormatted = "**Failed to buy** `" + task.amount + "` **key(s) for** `" + task.value / 10 ** 18 + "Ξ`"
                    } else {

                        const sellPrice = getSellPriceAfterFee(task.supply, parseInt(task.amount))

                        textFormatted = "**Failed to sell** `" + task.amount + "` **key(s) for** `" + sellPrice / 10 ** 18 + "Ξ`"

                    }

                    const snipeMessageError = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Farmer Failed ❌")
                        .setDescription(">>> Displaying your farmer task")
                        .setThumbnail(subjectPfp)
                        .setTimestamp()
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "Action", value: "`" + action + "`", inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: "Target", value: "`" + subjectName + "`", inline: true },
                            { name: "Task ID", value: "`1`", inline: true },
                            { name: " ", value: " ", inline: false },
                            { name: " ", value: textFormatted, inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: "Transaction hash:", value: "```" + task.hash + "```Transaction details [here](https://basescan.org/tx/" + task.hash + ")", inline: false },
                            { name: " ", value: " ", inline: false },

                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await member.send({ embeds: [snipeMessageError] });



                    await botChannel.send("<@&1121510423687090186> Retrying farmer " + task.authorName + " at [here](https://basescan.org/tx/" + task.hash + ")");


                }

            } else {

                let textFormatted = ""
                if (task.type == "buy") {
                    textFormatted = "**Failed or succeeded to buy** `1` **key for** `" + task.value / 10 ** 18 + "Ξ`"
                } else {
                    const sellPrice = getSellPriceAfterFee(task.supply, parseInt(task.amount))
                    textFormatted = "**Failed or succeeded to sell** `" + task.amount + "` **key(s) for** `" + sellPrice / 10 ** 18 + "Ξ`"

                }

                const snipeMessageError = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Unknown Farmer Result")
                    .setDescription(">>> Displaying your farmer task")
                    .setThumbnail(subjectPfp)
                    .setTimestamp()
                    .addFields(
                        { name: " ", value: " ", inline: false },
                        { name: "Action", value: "`" + action + "`", inline: false },
                        { name: " ", value: " ", inline: false },
                        { name: "Target", value: "`" + subjectName + "`", inline: true },
                        { name: "Task ID", value: "`1`", inline: true },
                        { name: " ", value: " ", inline: false },
                        { name: " ", value: textFormatted, inline: false },
                        { name: " ", value: " ", inline: false },
                        { name: "Transaction hash:", value: "```" + task.hash + "```Transaction details [here](https://basescan.org/tx/" + task.hash + ")", inline: false },
                        { name: " ", value: " ", inline: false },

                    )
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })



                await member.send({ embeds: [snipeMessageError] });
                await botChannel.send("<@&1121510423687090186> Unknown Farmer " + task.authorName + " at [here](https://basescan.org/tx/" + task.hash + ")");




            }

        } catch (error) {
            console.log("erreur lors de l'envoi des messages : " + error.stack)
            await botChannel.send("<@&1121510423687090186> Erreur global envoi message snipe : " + error.stack);

        }



    }



}

module.exports = farmerHandler






function getSellPrice(supply, amount) {
    const adjustedSupply = supply - amount;
    return getPrice(adjustedSupply, amount);
}

function getSellPriceAfterFee(supply, amount) {
    const protocolFeePercent = 5  // Remplacez par le pourcentage réel
    const subjectFeePercent = 5

    const price = getSellPrice(supply, amount);
    const protocolFee = (price * protocolFeePercent) / 1e18; // Convertir en ether
    const subjectFee = (price * subjectFeePercent) / 1e18; // Convertir en ether
    return price - protocolFee - subjectFee;
}