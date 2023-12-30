
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


const getTimeAgoSmall = require("../../../functions/timeagosmall")

const buttonsRow = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('friendtech-interactionfirstpage-button')
            .setLabel('first page')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('friendtech-interactionpreviouspage-button')
            .setLabel('previous page')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('friendtech-interactionnextpage-button')
            .setLabel('next page')
            .setStyle(2)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId('friendtech-interactionlastpage-button')
            .setLabel('last page')
            .setStyle(2)
            .setDisabled(true),

    );



const buttonsRowAllGood = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('friendtech-interactionfirstpage-button')
            .setLabel('first page')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('friendtech-interactionpreviouspage-button')
            .setLabel('previous page')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('friendtech-interactionnextpage-button')
            .setLabel('next page')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('friendtech-interactionlastpage-button')
            .setLabel('last page')
            .setStyle(2),
    );







module.exports = {
    id: 'friendtech-interactionnextpage-button',

    async execute(interaction) {
        if (!(interaction instanceof ButtonInteraction)) return;

        //Récupérer informations de l'utilisateur de la commande
        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id
        let botId = interaction.applicationId

        try {

            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")


            if (interaction.message.interaction.user.id === authorId) {

                //Checkpoint
                console.log("// Step 2 : Authorization - Executed ✅")



                const lastInteraction = await interactionData.findOne({ where: { authorId: authorId, commandName: "friendtech-interactions", serverId: serverId } })



                //On récupère le tableau des bids
                const fullTable = JSON.parse(lastInteraction.dataValues.embed1)

                // On récupère les informations gloals des bids de la collection
                const infoTable = JSON.parse(lastInteraction.dataValues.embed2)

                const user1Name = infoTable[0].user1Name
                const user1Address = infoTable[0].user1Address
                const user1Formatted = infoTable[0].user1Formatted
                const user2Name = infoTable[0].user2Name
                const user2Address = infoTable[0].user2Address
                const user2Formatted = infoTable[0].user2Formatted
                const relation = infoTable[0].relation
                const holding = infoTable[0].holding
                const tradeCount = infoTable[0].tradeCount
                const links = infoTable[0].links



                const pageIndex = lastInteraction.dataValues.pageIndex
                const actualPage = lastInteraction.dataValues.actualPage
                const newPage = parseFloat(actualPage) + 1


                const itemsPerPage = 16
                const firstObject = (newPage - 1) * itemsPerPage
                const lastObject = firstObject + itemsPerPage






                let filteredTable = fullTable.slice(firstObject, lastObject);


                /////// On construit le tableau de trade
                let interactionsFormatted = "T/S           Type      Share         Value         Date\n\n"


                for (const trade of filteredTable) {



                    // On définit les valeurs de base
                    let ethAmount = trade.ethAmount
                    let actionTag = trade.actionTag
                    let amount = trade.amount
                    let timestamp = trade.timestamp
                    let subjectAddress = trade.subjectAddress
                    let direction = "➡️"
                    if (subjectAddress.toLowerCase() == user1Address.toLowerCase()) { direction = "⬅️" }



                    let part1 = direction
                    let part2 = actionTag
                    let part3 = amount.toString()
                    let part4 = parseFloat(ethAmount).toFixed(3) + "Ξ"
                    let part5 = getTimeAgoSmall(timestamp)


                    let spaceSize = 18 - (part1.length + part2.length)
                    let spaceLenght = ""
                    for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

                    let spaceSize2 = 29 - (part1.length + part2.length + part3.length + spaceSize)
                    let spaceLenght2 = ""
                    for (let i = 0; i < spaceSize2; i++) { spaceLenght2 += " " }

                    let spaceSize3 = 43 - (part1.length + part2.length + part3.length + spaceSize + part4.length + spaceSize2)
                    let spaceLenght3 = ""
                    for (let i = 0; i < spaceSize3; i++) { spaceLenght3 += " " }

                    let spaceSize4 = 56 - (part1.length + part2.length + part3.length + spaceSize + part4.length + spaceSize2 + part5.length + spaceSize3)
                    let spaceLenght4 = ""
                    for (let i = 0; i < spaceSize4; i++) { spaceLenght4 += " " }



                    interactionsFormatted += part1 + spaceLenght + part2 + spaceLenght2 + part3 + spaceLenght3 + part4 + spaceLenght4 + part5 + "\n"







                }








                const userFTEmbed = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Friend.Tech Interactions")
                    .setDescription(">>> Displaying the friend.tech interactions")
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .setTimestamp()
                    .addFields(
                        { name: " ", value: " ", inline: false },
                        { name: "User 1", value: user1Formatted, inline: true },
                        { name: "User 2", value: user2Formatted, inline: true },
                        { name: " ", value: " ", inline: false },
                        { name: "Relation", value: relation, inline: true },
                        { name: "Trades", value: "`" + tradeCount + "`", inline: true },
                        { name: "Holding", value: holding, inline: true },
                        { name: "Interactions:", value: "```" + interactionsFormatted + "```", inline: false },
                        { name: " ", value: "*The T/S field shows who is the trader and who is the seller*", inline: false },
                        { name: "Links", value: links, inline: false },
                        { name: "Page", value: "`[" + newPage + "/" + pageIndex + "]`", inline: true },

                    )
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                if (newPage == pageIndex) { await interaction.update({ embeds: [userFTEmbed], components: [buttonsRow] }); }
                else { await interaction.update({ embeds: [userFTEmbed], components: [buttonsRowAllGood] }); }



                await interactionData.update({ actualPage: newPage.toString(), }, { where: { authorId: authorId, commandName: "friendtech-interactions", serverId: serverId } })





            } else {

                const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Bot Access")
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .setDescription("This button is not for you. You can only click on buttons generated by your commands. Please try again with your personal data.")
                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                await interaction.reply({ embeds: [setfpEmbedNotForYou], ephemeral: true });


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


            await interaction.reply({ embeds: [errorAnswerUser], ephemeral: true });


        }
    },
};



