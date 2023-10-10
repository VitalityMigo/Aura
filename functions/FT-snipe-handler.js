const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { accessSql, profileData, adminsql, reportsql, sniper_friendTech, infra_friendTech, sequelize } = require('../events/database');


const Web3 = require('web3')
const web3 = new Web3("https://base-mainnet.g.alchemy.com/v2/KA3op6mpVPtChk_f858wIkh3dCvUoref")

const addTimeout = require("./addtimeout")

let guild = ""
let botChannel = ""
const guildId = "1108754348818845729"

const client = require('../bot'); // Chemin vers le fichier client.js

setTimeout(() => {

    guild = client.guilds.cache.get(guildId);
    botChannel = guild.channels.cache.get("1121481984812798084");


}, 3000);



async function getReceipt(txn) {
    try {
        const receipt = await web3.eth.getTransactionReceipt(txn)

        if (receipt != null) {
            return receipt

        } else {

            await addTimeout(2)

            const receipt = await web3.eth.getTransactionReceipt(txn)

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


            const member = await guild.members.fetch(task.authorId);


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
                        await botChannel.send("<@&1121510423687090186> Done Snipe" + task.authorName);

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
                await botChannel.send("<@&1121510423687090186> Done Snipe" + task.authorName);


            }

        } catch (error) {
            console.log("erreur lors de l'envoi des messages : " + error.stack)
            await botChannel.send("<@&1121510423687090186> Erreur global envoi message snipe : " + error.stack);

        }

    }

}

module.exports = snipeUserHandler