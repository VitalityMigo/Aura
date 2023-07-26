
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
const { accessSql, profileData, reportsql, interactionData, adminsql, sequelize } = require('../../../events/database');
const moment = require('moment');



const buttonRowAdminDashboard = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('adminClientListFirstPage-button')
            .setLabel('first page')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('adminClientListPreviousPage-button')
            .setLabel('previous page')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('RCDashboardMenu-button')
            .setLabel('menu')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('adminClientListNextPage-button')
            .setLabel('next page')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('adminClientListLastPage-button')
            .setLabel('last page')
            .setStyle(2),

    )

const buttonRowAdminDashboard2 = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('RCclientdelete-button')
            .setLabel('remove')
            .setStyle(4),
    )





module.exports = {
    id: 'adminClientListPreviousPage-button',

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

                const lastInteraction = await interactionData.findOne({ where: { commandName: "adminclient-list", authorId: authorId, serverId: serverId } })
                const reportTable = JSON.parse(lastInteraction.dataValues.embed1)
                const pageIndex = lastInteraction.dataValues.pageIndex
                const actualPage = parseInt(lastInteraction.dataValues.actualPage) - 1
                const embedFirstPage = JSON.parse(lastInteraction.dataValues.embed2)


                if (1 < actualPage) {

                    const actualPageIndex = actualPage - 2


                    let serverName = reportTable[actualPageIndex].serverName
                    let serverID = reportTable[actualPageIndex].serverId
                    let accessTier = reportTable[actualPageIndex].accessTier
                    let adminRoleId = reportTable[actualPageIndex].adminRoleId
                    let memberRoleId = reportTable[actualPageIndex].memberRoleId
                    let updateChannel = reportTable[actualPageIndex].updateChannel
                    let accessSince = reportTable[actualPageIndex].accessSince
                    let adminWalletAddress = reportTable[actualPageIndex].adminWalletAddress
                    let actualPower = reportTable[actualPageIndex].actualPower
                    let password = reportTable[actualPageIndex].password
                    let subscribtionStatut = reportTable[actualPageIndex].subscribtionStatut
                    let subscribtionPrice = reportTable[actualPageIndex].subscribtionPrice
                    let accessStatut = reportTable[actualPageIndex].statut
                    let subscribtionStatutFormatted = "Lifetime"


                    if (subscribtionStatut.toLowerCase() !== "lifetime") {

                        if (parseInt(subscribtionStatut) <= 0) {

                            subscribtionStatutFormatted = subscribtionStatut + "days late"

                        } else if (parseInt(subscribtionStatut) <= 0) {

                            subscribtionStatutFormatted = subscribtionStatut + "days left"

                        }

                    }

                    //Formattage de la date depuis le timestamp
                    const date = new Date(accessSince * 1000);
                    const dateLisible = date.toLocaleString();
                    const date1 = moment(dateLisible, 'M/D/YYYY, h:mm:ss A');
                    const formattedDate = date1.format('Do [of] MMMM YYYY');

                    if (accessStatut.toLowerCase() === "removed") { accessStatut = "Removed 🔴" }

                    await interactionData.update({ actualPage: actualPage.toString(), }, { where: { commandName: "adminclient-list", authorId: authorId, serverId: serverId } })



                    const adminDashboardMainEmbed = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Admin Dashboard")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setDescription(">>> Consult, manage and create new client")
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .addFields(
                            { name: 'Name', value: "`" + serverName + "`", inline: true },
                            { name: 'ID', value: "`" + serverID + "`", inline: true },
                            { name: 'Access Tier', value: "`" + accessTier.toUpperCase() + "`", inline: true },
                            { name: 'Admin Role', value: "`" + adminRoleId + "`", inline: true },
                            { name: 'Member Role', value: "`" + memberRoleId + "`", inline: true },
                            { name: 'Update Channel', value: "`" + updateChannel + "`", inline: true },
                            { name: 'Admin Wallet', value: "`" + adminWalletAddress + "`", inline: false },
                            { name: 'Password', value: "`" + password + "`", inline: true },
                            { name: 'Bot Statut', value: "`" + actualPower + "`", inline: true },
                            { name: 'Client Statut', value: "`" + accessStatut + "`", inline: true },
                            { name: 'Subscribtion Price', value: "`" + parseFloat(subscribtionPrice).toFixed(3) + "Ξ/month`", inline: true },
                            { name: 'Subscribtion Statut', value: "`" + subscribtionStatutFormatted + "`", inline: true },
                            { name: 'Access Date', value: "`" + formattedDate + "`", inline: false },
                            { name: "Page", value: "`[" + actualPage + "/" + pageIndex + "]`", inline: false },

                        )
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    if (accessStatut.toLowerCase() === "active") { await interaction.update({ embeds: [adminDashboardMainEmbed], components: [buttonRowAdminDashboard, buttonRowAdminDashboard2] }); }
                    else { await interaction.update({ embeds: [adminDashboardMainEmbed], components: [buttonRowAdminDashboard] }); }


                } if (1 >= actualPage) {

                    await interactionData.update({ actualPage: "1", }, { where: { commandName: "adminclient-list", authorId: authorId, serverId: serverId } })



                    await interaction.update({ embeds: [embedFirstPage], components: [buttonRowAdminDashboard] });



                }

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
            let reportCommand = "/admin-clientListPreviousPage"

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
                .setAuthor({ name: "Rolls Chasers Analytics", iconURL: "https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png" })
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

