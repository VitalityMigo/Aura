/**
 * @file Sample modal interaction
 * @author JAYZHVJ
 * @since 3.2.0
 * @version 3.2.2
 */

/**
 * @type {import('../../../typings').ModalInteractionCommand}
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { accessSql, profileData, adminsql, reportsql, order_friendTech, infra_friendTech, sequelize } = require('../../../events/database');
const moment = require('moment');

//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const friendtechApiKey = process.env.friendtechApiKey

const axios = require('axios')



const friendtechHeaders = {
    'Authorization': friendtechApiKey, // Remplacez VOTRE_TOKEN par le token d'authentification
    // Autres en-têtes si nécessaire
};



function removeCharacter(str, char) {
    const regex = new RegExp(char, 'g');
    return str.replace(regex, '');
}





module.exports = {
    id: "modal-friendtechtasksinfra-order-param-",

    async execute(interaction) {


        //Récupérer informations de l'utilisateur de la commande
        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let botId = interaction.applicationId
        let serverId = interaction.member.guild.id


        try {

            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")
            //Checkpoint
            console.log("// Step 2 : Authorization - Executed ✅")




            const customId = interaction.customId

            const parts = customId.split("@");
            const action = parts[0].split("-").pop() || null;
            const uniqueId = parts[1] || null;





            if (action == "amount") {

                const amount = interaction.fields.getTextInputValue('modal-friendtechtasksinfra-order-param-amount@' + uniqueId + 'R1');

                if (amount > 0) {


                    let taskEmbed = interaction.message.embeds[0].data


                    taskEmbed.fields.find(obj => obj.name === "Amount/Txn").value = "`" + amount.toString() + "`";


                    await order_friendTech.update({ amount: amount, }, { where: { authorId: authorId, randomId: uniqueId } });
                    await interaction.update({ embeds: [taskEmbed], ephemeral: true });

                } else {

                    const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Sniper Setup")
                        .setDescription("The minimum amount value is `1`, you can't snipe `0` key per snipe. Please try again.")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                    await interaction.reply({ embeds: [gasTrackerEmbed], ephemeral: true });


                }


            } else if (action == "target") {

                const target = interaction.fields.getTextInputValue('modal-friendtechtasksinfra-order-param-target@' + uniqueId + 'R1');

                const givenUsername = removeCharacter(target, "@")

                let isMatch = true
                let findUser = ""

                try {
                    findUser = await axios.get('https://prod-api.kosetto.com/search/users?username=' + givenUsername, { headers: friendtechHeaders })
                } catch (error) {

                    isMatch = false

                }


                if (isMatch == true) {

                    const user = findUser.data.users.find((user) => user.twitterUsername.toLowerCase() == givenUsername.toLowerCase());

                    if (user) {

                        const targetWallet = user.address

                        let taskEmbed = interaction.message.embeds[0].data

                        taskEmbed.fields.find(obj => obj.name === "Target").value = "`" + givenUsername + "`";

                        await order_friendTech.update({ target: givenUsername, targetWallet: targetWallet }, { where: { authorId: authorId, randomId: uniqueId } });
                        await interaction.update({ embeds: [taskEmbed], ephemeral: true });

                    } else {

                        const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Order Setup")
                            .setDescription("The twitter username you provided isn't valid or isn't registered on Friend.Tech. Please try again with a valid twitter username.")
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                        await interaction.reply({ embeds: [gasTrackerEmbed], ephemeral: true });

                    }

                } else {

                    const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Order Setup")
                        .setDescription("The twitter username you provided isn't valid or isn't registered on Friend.Tech. Please try again with a valid twitter username.")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                    await interaction.reply({ embeds: [gasTrackerEmbed], ephemeral: true });



                }





            } else if (action == "totaltask") {

                const totalTask = interaction.fields.getTextInputValue('modal-friendtechtasksinfra-order-param-totaltask@' + uniqueId + 'R1');

                let taskEmbed = interaction.message.embeds[0].data

                if (totalTask != "") {



                    taskEmbed.fields.find(obj => obj.name === "Total Task").value = "`" + totalTask.toString() + "`";


                    await order_friendTech.update({ repeat: totalTask.toString(), }, { where: { authorId: authorId, randomId: uniqueId } });
                    await interaction.update({ embeds: [taskEmbed], ephemeral: true });

                } else {


                    taskEmbed.fields.find(obj => obj.name === "Total Task").value = "`No Limit`";


                    await sniper_friendTech.update({ repeat: null, }, { where: { authorId: authorId, randomId: uniqueId } });
                    await interaction.update({ embeds: [taskEmbed], ephemeral: true });



                }


            } else if (action == "price") {


                let min = interaction.fields.getTextInputValue('modal-friendtechtasksinfra-order-param-price@' + uniqueId + 'R1');
                let max = interaction.fields.getTextInputValue('modal-friendtechtasksinfra-order-param-price@' + uniqueId + 'R2');


                min = removeCharacter(min, "Ξ")
                max = removeCharacter(max, "Ξ")

                const taskDetails = await order_friendTech.findOne({ where: { randomId: uniqueId } })




                if (parseFloat(max) >= parseFloat(min) || max == "" || min == "") {

                    const targetWallet = taskDetails.dataValues.targetWallet

                    if (targetWallet != null) {

                        const userInfoCall = await axios.get("https://prod-api.kosetto.com/users/" + targetWallet)
                        const price = userInfoCall.data.displayPrice / 10 ** 18

                        if ((parseFloat(price) < parseFloat(max) && parseFloat(price) > parseFloat(min)) || (parseFloat(price) < parseFloat(max) && min == "") || (parseFloat(price) > parseFloat(min) && max == "") || (max == "" && min == "")) {


                            let taskEmbed = interaction.message.embeds[0].data


                            let minFormat = parseFloat(min).toFixed(3) + "Ξ"
                            let maxFormat = parseFloat(max).toFixed(3) + "Ξ"


                            if (min == "") { min = null, minFormat = "None" }
                            if (max == "") { max = null, maxFormat = "None" }


                            taskEmbed.fields.find(obj => obj.name === "Sell Below:" || obj.name === "Buy Below:").value = "`" + minFormat + "`";
                            taskEmbed.fields.find(obj => obj.name === "Sell Above:" || obj.name === "Buy Above:").value = "`" + maxFormat + "`";


                            await order_friendTech.update({ min_key_price: min, max_key_price: max }, { where: { authorId: authorId, randomId: uniqueId } });
                            await interaction.update({ embeds: [taskEmbed], ephemeral: true });

                        } else {

                            const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Order Setup")
                                .setDescription("The minimum and maximum price need to be lower and higher then the current key price of the target `" + parseFloat(price).toFixed(3) + "Ξ`. Please set different values.")
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                            await interaction.reply({ embeds: [gasTrackerEmbed], ephemeral: true });


                        }

                    } else {

                        const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Order Setup")
                            .setDescription("The minimum and maximum price can't be set since you need to set a target first")
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                        await interaction.reply({ embeds: [gasTrackerEmbed], ephemeral: true });


                    }

                } else {

                    const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Order Setup")
                        .setDescription("The minimum key price `(" + min + "Ξ)` cannot exceed the maximum key price `(" + max + "Ξ)`. Please try again.")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                    await interaction.reply({ embeds: [gasTrackerEmbed], ephemeral: true });


                }




            } else if (action == "gaspreset") {


                let gas = interaction.fields.getTextInputValue('modal-friendtechtasksinfra-order-param-gaspreset@' + uniqueId + 'R1');

                let taskEmbed = interaction.message.embeds[0].data




                let gasFormat = "+" + gas + "%"

                if (gas == "" || parseFloat(gas) <= 0) { gas = null; gasFormat = 'Classic' }



                taskEmbed.fields.find(obj => obj.name === "Gas Preset").value = "`" + gasFormat + "`";


                await order_friendTech.update({ gas_preset: gas }, { where: { authorId: authorId, randomId: uniqueId } });
                await interaction.update({ embeds: [taskEmbed], ephemeral: true });





            }
















            return;

        } catch (error) {



            console.log("// Error - sent in report ❌")

            //On envoi une notif
            const botAdmins = await adminsql.findOne({ where: { botId: botId } })
            const mainServerId = botAdmins.dataValues.mainServerId
            const logChannelId = botAdmins.dataValues.logChannelId
            const guild = interaction.client.guilds.cache.get(mainServerId);
            const channel = guild.channels.cache.get(logChannelId);


            const adminAccessInfos = await accessSql.findOne({ where: { serverId: serverId } })
            let adminRoleId = adminAccessInfos.dataValues.adminRoleId
            let serverName = adminAccessInfos.dataValues.serverName
            const userRoleList = interaction.member._roles
            let userHighestRole = "Member"
            if (userRoleList.includes(adminRoleId)) { userHighestRole = "Team" }
            let reportCommand = "/profileset"

            const timeStamp = Date.now();
            const date = new Date(timeStamp);
            const dateLisible = date.toLocaleString();
            const date1 = moment(dateLisible, 'M/D/YYYY, h:mm:ss A');
            const formattedDate = date1.format('Do [of] MMMM YYYY');



            //On enregistre le call
            await reportsql.create({
                botId: botId,
                authorId: "Bot",
                serverName: serverName,
                authorRole: userHighestRole,
                serverId: serverId,
                date: formattedDate,
                reportType: "Bug",
                reportCommand: reportCommand,
                reportDescription: "```" + error.stack + "```",
                reportPriority: "5",
                reportState: "Not treated",
            })


            console.log("//////////\n\nDetails de l'erreur :\n\n" + error.stack + "\n\n//////////")

            const reduceText = require("../../../functions/reducetext")
            const roleTag = "1121510423687090186"


            const updateEmbed = new EmbedBuilder().setColor("#060A8F")
                .setTitle("New Report")
                .setDescription(">>> A new report has just been sent.")
                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                .setAuthor({ name: "Aura", iconURL: "https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png" })
                .setTimestamp()
                .addFields(
                    { name: " ", value: " ", inline: false },
                    { name: "Content:", value: "A new `bug` has been submitted for the `" + reportCommand + "` command by `the bot report division` in `" + serverName + "`. You can use the administrator dashboard to consult it.", inline: false },
                    { name: " ", value: " ", inline: false },
                    { name: "Error:", value: "```" + reduceText(error.stack, 1024) + "```", inline: false },
                )
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


            await channel.send("<@&" + roleTag + ">");

            await channel.send({ embeds: [updateEmbed] });


            const errorAnswerUser = new EmbedBuilder().setColor("#060A8F")
                .setTitle("An error occured")
                .setDescription("An error has occurred while executing this command. These errors can occur for a variety of reasons, such as :\n∙ Unexpected traffic\n∙ API maintenance\n∙ Occasional bug\n\nPlease note that a report has already been sent to our team, who will fix the problem as soon as possible. You can still use `/report` to give more details about the error and help our team.")
                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                .setTimestamp()
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


            await interaction.reply({ embeds: [errorAnswerUser], ephemeral: true });


        }
    },
};
