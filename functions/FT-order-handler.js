const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { accessSql, profileData, adminsql, reportsql, infra_friendTech, sequelize, order_friendTech } = require('../events/database');

const fs = require("fs")
const axios = require("axios")

const { web3Base1RPC, web3BaseUnifra } = require('../config/web3config');

const userJSON = '../contracts/friendtech/newuser.json';
const addTimeout = require("./addtimeout")
const getPrice = require("./FT-getprice")
const orderExecFT = require("./FT-order-exec")

const orderTargets = "contracts/friendtech/ordertargets.json"


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

}, 2000);





async function getReceipt(txn) {
    try {
        const receipt = await web3BaseUnifra.eth.getTransactionReceipt(txn)

        if (receipt != null) {
            return receipt

        } else {

            await addTimeout(4)

            const receipt = await web3BaseUnifra.eth.getTransactionReceipt(txn)

            return receipt

        }

    } catch (error) {

        return null

    }
}



async function orderHandler(subjectAddress, taskList, transaction) {

    await addTimeout(2)




    for (const task of taskList) {

        try {


            let isDone = false


            let action = "📈 Buy Order"
            if (task.type == "sell") { action = "📉 Sell Order" }


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
                        .setTitle("Order Confirmed ✅")
                        .setDescription(">>> Displaying your order task")
                        .setThumbnail(subjectPfp)
                        .setTimestamp()
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "Action", value: "`" + action + "`", inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: "Target", value: "`" + subjectName + "`", inline: true },
                            { name: "Task ID", value: "`" + task.taskNb + "`", inline: true },
                            { name: " ", value: " ", inline: false },
                            { name: " ", value: textFormatted, inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: "Transaction hash:", value: "```" + task.hash + "```∟ Transaction details [here](https://basescan.org/tx/" + task.hash + ")", inline: false },
                            { name: " ", value: " ", inline: false },
                            //{ name: "Links", value: '[Friendtech](https://www.friend.tech/rooms/' + userAddress + ") ∙ " + '[Twitter](https://twitter.com/' + twitterUsername.toLowerCase() + ") ∙ " + '[Basescan](https://basescan.org/address/' + userAddress + ") ∙ " + '[Holders](https://www.friend.tech/trades/' + userAddress + ") ∙ " + '[Chart](https://www.degenz.finance/friendtech/portfolio?address=' + userAddress + ")", inline: false }

                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })





                    await order_friendTech.destroy({ where: { authorId: task.authorId, randomId: task.randomId } })


                    try {
                        await member.send({ embeds: [snipeMessage] });
                        await botChannel.send("<@&1121510423687090186> Done order " + task.authorName + " at [here](https://basescan.org/tx/" + task.hash + ")");

                    } catch (error) {

                        await botChannel.send("<@&1121510423687090186> Erreur durant l'envoi message order de " + task.authorName + " : \n" + error.stack);
                        console.log("L'utilisateur a ses DMs fermés")

                    }

                    try {

                        removeObjectJSON(task.randomId)
            
                    } catch (error) { }
                

                } else {

                    
                    let textFormatted = ""
                    if (task.type == "buy") {
                        textFormatted = "**Failed to buy** `" + task.amount + "` **key(s) for** `" + task.value / 10 ** 18 + "Ξ`"
                    } else {
            
                        const sellPrice = getSellPriceAfterFee(task.supply, parseInt(task.amount))

                        textFormatted = "**Failed to sell** `" + task.amount + "` **key(s) for** `" + sellPrice / 10 ** 18 + "Ξ`"

                    }

                    const snipeMessageError = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Order Failed ❌")
                        .setDescription(">>> Displaying your order task")
                        .setThumbnail(subjectPfp)
                        .setTimestamp()
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "Action", value: "`" + action + "`", inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: "Target", value: "`" + subjectName + "`", inline: true },
                            { name: "Task ID", value: "`" + task.taskNb + "`", inline: true },
                            { name: " ", value: " ", inline: false },
                            { name: " ", value: textFormatted, inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: "Transaction hash:", value: "```" + task.hash + "```Transaction details [here](https://basescan.org/tx/" + task.hash + ")", inline: false },
                            { name: " ", value: " ", inline: false },

                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await member.send({ embeds: [snipeMessageError] });



                    await botChannel.send("<@&1121510423687090186> Retrying Order " + task.authorName + " at [here](https://basescan.org/tx/" + task.hash + ")");

                   // orderExecFT(transaction)

                }

            } else {

                let textFormatted = ""
                if (task.type == "buy") {
                    textFormatted = "**Failed or succeeded to buy** `" + task.amount + "` **key(s) for** `" + task.value / 10 ** 18 + "Ξ`"
                } else {
                    const sellPrice = getSellPriceAfterFee(task.supply, parseInt(task.amount))
                    textFormatted = "**Failed or succeeded to sell** `" + task.amount + "` **key(s) for** `" + sellPrice / 10 ** 18 + "Ξ`"

                }

                const snipeMessageError = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Unknown Order Result")
                    .setDescription(">>> Displaying your order task")
                    .setThumbnail(subjectPfp)
                    .setTimestamp()
                    .addFields(
                        { name: " ", value: " ", inline: false },
                        { name: "Action", value: "`" + action + "`", inline: false },
                        { name: " ", value: " ", inline: false },
                        { name: "Target", value: "`" + subjectName + "`", inline: true },
                        { name: "Task ID", value: "`" + task.taskNb + "`", inline: true },
                        { name: " ", value: " ", inline: false },
                        { name: " ", value: textFormatted, inline: false },
                        { name: " ", value: " ", inline: false },
                        { name: "Transaction hash:", value: "```" + task.hash + "```Transaction details [here](https://basescan.org/tx/" + task.hash + ")", inline: false },
                        { name: " ", value: " ", inline: false },

                    )
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })



                await order_friendTech.destroy({ where: { authorId: task.authorId, randomId: task.randomId } })


                await member.send({ embeds: [snipeMessageError] });
                await botChannel.send("<@&1121510423687090186> Unknown Order " + task.authorName + " at [here](https://basescan.org/tx/" + task.hash + ")");


                try {

                    removeObjectJSON(task.randomId)
        
                } catch (error) { }
            

            }

        } catch (error) {
            console.log("erreur lors de l'envoi des messages : " + error.stack)
            await botChannel.send("<@&1121510423687090186> Erreur global envoi message snipe : " + error.stack);

        }

       

    }

   

}

module.exports = orderHandler



function removeObjectJSON(customId) {
    try {
        // Lire le contenu du fichier JSON
        const fileContent = fs.readFileSync(orderTargets, 'utf8');
        let data = JSON.parse(fileContent);

        // Filtrer les objets avec customId différent de 0
        data = data.filter(obj => obj.customId != customId);
        console.log(data)

        // Écrire le fichier JSON mis à jour
        fs.writeFileSync(orderTargets, JSON.stringify(data, null, 2));
        
        console.log('Objets avec customId égal à 0 supprimés avec succès.');
    } catch (error) {
        console.error('Erreur lors de la suppression des objets avec customId égal à 0 :', error);
    }
}






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