
/**
 * @file Sample button interaction
 * @author JAYZHVJ
 * @since 3.0.0
 * @version 3.2.2
 */

/**
 * @type {import('../../../typings').ButtonInteractionCommand}
 */


const { ButtonInteraction } = require('discord.js');
const { ActionRowBuilder, EmbedBuilder, ButtonBuilder } = require("discord.js");
const { accessSql, profileData, reportsql, adminsql, interactionData, sequelize } = require('../../../events/database');
const moment = require('moment');

const reduceText = require("../../../functions/reducetext")
const getTwitterUserInfo = require("../../../functions/twitteruserinfo")
const getTimeAgo = require("../../../functions/timeago")
const countEmojis = require("../../../functions/isemoji")


const ethPrice = require("../../../functions/getethprice")
const { formatHoldersData, formatTradesData } = require('../../../functions/FT-useraccelerator');

//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const friendtechApiKey = process.env.friendtechApiKey


const friendtechHeaders = {
    'Authorization': friendtechApiKey, // Remplacez VOTRE_TOKEN par le token d'authentification
    // Autres en-têtes si nécessaire
};



const axios = require('axios')



function formatWallet(input) {
    return input.length > 35 ? `${input.substring(0, 10)}…${input.substring(input.length - 10)}` : input;
}




module.exports = {
    id: 'button_friendtech_trade_refresh_',

    async execute(interaction) {
        if (!(interaction instanceof ButtonInteraction)) return;


        //Récupérer informations de l'utilisateur de la commande
        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id
        let botId = interaction.applicationId

        await interaction.deferUpdate({ ephemeral: true })


        try {


            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")

            //Récupère le password donné par l'utilisateur

            const customId = interaction.customId


            // Utilisation d'une expression régulière pour extraire l'adresse Ethereum
            const regex = /_0x([0-9a-fA-F]{40})/;
            const matches = customId.match(regex);

            if (matches && matches[1]) {


                // On récupère l'addresse du subject et défini le quickbuy à 1
                userAddress = "0x" + matches[1]


                let shareTradesFormatted1 = ""
                let shareTradesFormatted2 = ""
                let shareTradesFormatted3 = ""

                let userTradesFormatted1 = ""
                let userTradesFormatted2 = ""
                let userTradesFormatted3 = ""


                try {

                    let baseEmbed = interaction.message.embeds[0].data


                    // On commence les deux tableaux
                    const shareTrades = await axios.get('https://prod-api.kosetto.com/users/' + userAddress + "/token/trade-activity", { headers: friendtechHeaders })
                    const shareTradeSingle = shareTrades.data.users
                    const shareTradeLength = shareTradeSingle.length




                    let index = 0
                    let embedFilled = 0


                    for (const trade of shareTradeSingle) {

                        index++

                        if (index <= 15) {

                            let name = trade.twitterName
                            let username = trade.twitterUsername
                            let isBuy = trade.isBuy
                            let amount = trade.shareAmount
                            let time = Math.floor(trade.createdAt / 1000)
                            let price = trade.ethAmount / 10 ** 18


                            let action1 = "🟢"
                            let action2 = "bought"



                            if (isBuy == false) { action1 = "🔴"; action2 = "sold" }



                            if (index <= 5) {

                                shareTradesFormatted1 += "`" + action1 + "` " + "[" + reduceText(name, 18) + "](https://twitter.com/" + username + ") `" + action2 + " " + amount + " for " + parseFloat(price).toFixed(3) + "Ξ` ∙ <t:" + time + ":R>\n"

                                if (index == 5 || index == shareTradeLength) {

                                    baseEmbed.fields[3].value = shareTradesFormatted1;
                                    embedFilled++

                                }


                            } else if (index <= 10) {

                                shareTradesFormatted2 += "`" + action1 + "` " + "[" + reduceText(name, 18) + "](https://twitter.com/" + username + ") `" + action2 + " " + amount + " for " + parseFloat(price).toFixed(3) + "Ξ` ∙ <t:" + time + ":R>\n"

                                if (index == 10 || index == shareTradeLength) {

                                    baseEmbed.fields[4].value = shareTradesFormatted2;
                                    embedFilled++

                                }


                            } else if (index <= 15) {

                                shareTradesFormatted3 += "`" + action1 + "` " + "[" + reduceText(name, 18) + "](https://twitter.com/" + username + ") `" + action2 + " " + amount + " for " + parseFloat(price).toFixed(3) + "Ξ` ∙ <t:" + time + ":R>\n"


                                if (index == 15 || index == shareTradeLength) {

                                    baseEmbed.fields[5].value = shareTradesFormatted3;
                                    embedFilled++

                                }

                            } else {
                                break
                            }




                        } else {
                            break
                        }



                    }





                    const userTrades = await axios.get(" https://prod-api.kosetto.com/users/" + userAddress + "/trade-activity")
                    const userTradeSingle = userTrades.data.users
                    const userTradeLength = userTradeSingle.length

                    let index2 = 0

                    for (const trade of userTradeSingle) {

                        index2++

                        if (index2 <= 15) {

                            let name = trade.twitterName
                            let username = trade.twitterUsername
                            let isBuy = trade.isBuy
                            let amount = trade.shareAmount
                            let time = Math.floor(trade.createdAt / 1000)
                            let price = trade.ethAmount / 10 ** 18


                            let action = "🟢 Bought "
                            if (isBuy == false) { action = "🔴 Sold " }



                            if (index2 <= 5) {

                                userTradesFormatted1 += "`" + action + amount + "` [" + reduceText(name, 18) + "](https://twitter.com/" + username + ") `for " + parseFloat(price).toFixed(3) + "Ξ` ∙ <t:" + time + ":R>\n"

                                if (index2 == 5 || index2 == userTradeLength) {

                                    baseEmbed.fields[4 + embedFilled].value = userTradesFormatted1;


                                }

                            } else if (index2 <= 10) {

                                userTradesFormatted2 += "`" + action + amount + "` [" + reduceText(name, 18) + "](https://twitter.com/" + username + ") `for " + parseFloat(price).toFixed(3) + "Ξ` ∙ <t:" + time + ":R>\n"


                                if (index2 == 10 || index2 == userTradeLength) {

                                    baseEmbed.fields[5 + embedFilled].value = userTradesFormatted2;


                                }

                            } else if (index2 <= 15) {

                                userTradesFormatted3 += "`" + action + amount + "` [" + reduceText(name, 18) + "](https://twitter.com/" + username + ") `for " + parseFloat(price).toFixed(3) + "Ξ` ∙ <t:" + time + ":R>\n"

                                if (index2 == 15 || index2 == userTradeLength) {

                                    baseEmbed.fields[6 + embedFilled].value = userTradesFormatted3;


                                }


                            } else {
                                break
                            }




                        }



                    }



                    await interaction.editReply({ embeds: [baseEmbed]});




                } catch (error) {

                    console.log(error)
                    const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Friend Tech")
                        .setDescription("An error occured whil retreiving the Friend.tech profile. Please try again or feel free to contact a team member if you need help.")
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.editReply({ embeds: [errorNotEthereum], components: [], ephemeral: true });


                }












            } else {


                const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Friend Tech")
                    .setDescription("An error occured while retreiving the subject's Friend.Tech address. Please try again using `/friendtech user` or contact a team member if you need help.")
                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                    .setAuthor({ name: "Aura", iconURL: "https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png" })
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                await interaction.editReply({ embeds: [gasTrackerEmbed2], ephemeral: true });




            }


        } catch (error) {


            console.log("// Error - sent in report ❌")

            //On envoi une notif
            let botId = interaction.applicationId
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
            let reportCommand = "/admin-clientListFirstPage"

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


            await interaction.editReply({ embeds: [errorAnswerUser], ephemeral: true });


        }
    },
};



