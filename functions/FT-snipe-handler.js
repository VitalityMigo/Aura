const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { accessSql, profileData, adminsql, reportsql, sniper_friendTech, infra_friendTech, sequelize } = require('../events/database');

const fs = require("fs")

const { web3Base1RPC, web3BaseUnifra } = require('../config/web3config');

const userJSON = '../contracts/friendtech/newuser.json';
const addTimeout = require("./addtimeout")


// On définit le client et charge les channels
const client = require('../bot'); // Chemin vers le fichier client.js

let serverId = ""
let botChannel = ""
let botChannelId = ""


setTimeout(() => {

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

    const botGuild = client.guilds.cache.get(serverId);
    botChannel = botGuild.channels.cache.get(botChannelId);

}, 4000);





async function getReceipt(txn) {
    try {
        const receipt = await web3BaseUnifra.eth.getTransactionReceipt(txn)

        if (receipt != null) {
            return receipt

        } else {

            await addTimeout(2)

            const receipt = await web3BaseUnifra.eth.getTransactionReceipt(txn)

            return receipt

        }

    } catch (error) {

        return null

    }
}



async function snipeUserHandler(type, subjectUsername, subjectName, subjectPfp, subjectAddress, taskList) {

    await addTimeout(5)




    for (const task of taskList) {

        try {


            let isDone = false


            let action = "📥 Snipe New Deposit"
            if (type == "new_user") { action = "🐇 Snipe New User" }


            const member = await botGuild.members.fetch(task.authorId);


            const receipt = await getReceipt(task.hash)


            if (receipt != null) {



                if (receipt.status == true) {


                    const totalValue = parseFloat(task.value / 10 ** 18) + parseFloat(receipt.gasUsed * (receipt.effectiveGasPrice / 10 ** 18))



                    const textFormatted = "**Bought** `" + task.amount + "` **key(s) for** `" + totalValue + "Ξ`"


                    const snipeMessage = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Snipe Confirmed ✅")
                        .setDescription(">>> Displaying your sniper task")
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



                    if (task.taskCount != null) {



                        if (parseInt(task.taskCount) > (parseInt(task.usage) + 1)) {

                            await sniper_friendTech.update({ usage: (parseInt(task.usage) + 1).toString(), }, { where: { authorId: task.authorId, randomId: task.randomId } })


                        } else {

                            await sniper_friendTech.destroy({ where: { authorId: task.authorId, randomId: task.randomId } })

                            isDone = true
                        }




                    } else {



                        await sniper_friendTech.update({ usage: (parseInt(task.usage) + 1).toString(), }, { where: { authorId: task.authorId, randomId: task.randomId } })

                    }


                    if (isDone == true) {

                        snipeMessage.addFields(
                            { name: " ", value: "**→** *The max number of snipes for this task has been reached. The task has been deleted*", inline: false },

                        )

                    }

                    try {
                        await member.send({ embeds: [snipeMessage] });
                        await botChannel.send("<@&1121510423687090186> Done Snipe " + task.authorName + " at [here](https://basescan.org/tx/" + task.hash + ")");

                    } catch (error) {

                        await botChannel.send("<@&1121510423687090186> Erreur durant l'envoi message snipe de " + task.authorName + " : \n" + error.stack);
                        console.log("L'utilisateur a ses DMs fermés")

                    }

                } else {

                    const textFormatted = "**Failed to buy** `" + task.amount + "` **key(s) for** `" + task.value / 10 ** 18 + "Ξ`"


                    const snipeMessageError = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Snipe Failed ❌")
                        .setDescription(">>> Displaying your sniper task")
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



                    await botChannel.send("<@&1121510423687090186> Failed Snipe " + task.authorName + " at [here](https://basescan.org/tx/" + task.hash + ")");


                }

            } else {

                const textFormatted = "**Failed or succeeded to buy** `" + task.amount + "` **key(s) for** `" + task.value / 10 ** 18 + "Ξ`"


                const snipeMessageError = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Unknown Snipe Result")
                    .setDescription(">>> Displaying your sniper task")
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


                if (parseInt(task.taskCount) > (parseInt(task.usage) + 1)) {

                    await sniper_friendTech.update({ usage: (parseInt(task.usage) + 1).toString(), }, { where: { authorId: task.authorId, randomId: task.randomId } })


                } else {

                    await sniper_friendTech.destroy({ where: { authorId: task.authorId, randomId: task.randomId } })

                    isDone = true
                }

                await member.send({ embeds: [snipeMessageError] });
                await botChannel.send("<@&1121510423687090186> Unknown Snipe " + task.authorName + " at [here](https://basescan.org/tx/" + task.hash + ")");



            }

        } catch (error) {
            console.log("erreur lors de l'envoi des messages : " + error.stack)
            await botChannel.send("<@&1121510423687090186> Erreur global envoi message snipe : " + error.stack);

        }

    }

    try {

        deleteInArray(subjectAddress)

    } catch (error) { }


}

module.exports = snipeUserHandler



function deleteInArray(subjectAddress) {

    const jsonData = JSON.parse(fs.readFileSync(userJSON, 'utf-8'));

    // Étape 2 : Rechercher et supprimer l'objet
    const indexToRemove = jsonData.findIndex(item => item.address.toLowerCase() == subjectAddress.toLowerCase());

    if (indexToRemove !== -1) {
        // L'objet a été trouvé, supprimez-le
        jsonData.splice(indexToRemove, 1);

        // Étape 3 : Enregistrez le fichier JSON mis à jour
        fs.writeFileSync(userJSON, JSON.stringify(jsonData, null, 2), 'utf-8');

    }

}