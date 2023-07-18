
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
const sliceText = require('../../../functions/slicetext')



const buttonRowAdminDashboard = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('reportfirstpage-button')
            .setLabel('first page')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('reportpreviouspage-button')
            .setLabel('previous page')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('RCDashboardMenu-button')
            .setLabel('menu')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('reportnextpage-button')
            .setLabel('next page')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('reportlastpage-button')
            .setLabel('last page')
            .setStyle(2),

    )




module.exports = {
    id: 'reporttreated-button',

    async execute(interaction) {
        if (!(interaction instanceof ButtonInteraction)) return;

        //Récupérer informations de l'utilisateur de la commande
        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png`;
        let serverId = interaction.member.guild.id
        let botId = interaction.applicationId


        try {

        //Checkpoint
        console.log("// Step 1 : Initialization - Executed ✅")



        if (interaction.message.interaction.user.id === authorId) {

            //Checkpoint
            console.log("// Step 2 : Authorization - Executed ✅")

            const lastInteraction = await interactionData.findOne({ where: { commandName: "admin-report", authorId: authorId, serverId: serverId } })
            const reportTable = JSON.parse(lastInteraction.dataValues.embed1)
            const pageIndex = lastInteraction.dataValues.pageIndex
            const actualPage = parseInt(lastInteraction.dataValues.actualPage)
            const actualPageIndex = parseInt(lastInteraction.dataValues.actualPage) - 2



            let reportAuthorId = reportTable[actualPageIndex].authorId
            let reportserverName = reportTable[actualPageIndex].serverName
            let reportauthorRole = reportTable[actualPageIndex].authorRole
            let reportserverId = reportTable[actualPageIndex].serverId
            let reportdate = reportTable[actualPageIndex].date
            let reportreportType = reportTable[actualPageIndex].reportType
            let reportreportCommand = reportTable[actualPageIndex].reportCommand
            let reportreportDescriptionFull = reportTable[actualPageIndex].reportDescriptionFull
            let reportreportDescription = reportTable[actualPageIndex].reportDescription
            let reportreportPriority = reportTable[actualPageIndex].reportPriority
            //let reportreportState = reportTable[actualPageIndex].reportState

            let reportScaleFormatted = "Minor"
            if (reportreportPriority > 2 && reportreportPriority <= 4) { reportScaleFormatted = "Decent" } else if (reportreportPriority > 4 && reportreportPriority <= 6) { reportScaleFormatted = "Average" } else if (reportreportPriority > 6 && reportreportPriority <= 8) { reportScaleFormatted = "Important" } else if (reportreportPriority > 8) { reportScaleFormatted = "Major" }



            reportTable[actualPageIndex].reportState = "Treated"



            await interactionData.update({ embed1: JSON.stringify(reportTable), }, { where: { commandName: "admin-report", authorId: authorId, serverId: serverId } })
            await reportsql.destroy({ where: { authorId: reportAuthorId, serverId: reportserverId, reportType: reportreportType, reportCommand: reportreportCommand, reportDescription: reportreportDescriptionFull } })



            const adminDashboardMainEmbed = new EmbedBuilder().setColor("#060A8F")
                .setTitle("Report")
                .setAuthor({ name: authorName, iconURL: userAvatar })
                .setDescription(">>> Your report has been succesfully sent")
                .setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
                .addFields(
                    { name: 'Date', value: "`" + reportdate + "`", inline: false },
                    { name: 'Community', value: "`" + reportserverName + "`", inline: true },
                    { name: 'Role', value: "`" + reportauthorRole + "`", inline: true },
                    { name: ' ', value: " ", inline: false },
                    { name: 'ServerId', value: "`" + reportserverId + "`", inline: true },
                    { name: 'ID', value: "`" + reportAuthorId + "`", inline: true },
                    { name: ' ', value: " ", inline: false },
                    { name: 'Type', value: "`" + reportreportType + "`", inline: true },
                    { name: 'Command', value: "`" + reportreportCommand + "`", inline: true },
                    { name: 'Description', value: reportreportDescription, inline: false },
                    { name: 'Priority', value: "`" + reportScaleFormatted + "`", inline: true },
                    { name: 'Statut', value: "`Treated ✅`", inline: true },
                    { name: "Page", value: "`[" + actualPage + "/" + pageIndex + "]`", inline: false },

                )
                .setTimestamp()
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


            await interaction.update({ embeds: [adminDashboardMainEmbed], components: [buttonRowAdminDashboard] });




        } else {

            const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                .setTitle("Bot Access")
                .setAuthor({ name: authorName, iconURL: userAvatar })
                .setDescription("This button is not for you. You can only click on buttons generated by your commands. Please try again with your personal data.")
                .setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
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
        let reportCommand = "/admin-reportTreated"

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



        const updateEmbed = new EmbedBuilder().setColor("#060A8F")
            .setTitle("New Report")
            .setDescription(">>> A new report has just been sent.")
            .setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
            .setAuthor({ name: "Rolls Chasers Analytics", iconURL: "https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg" })
            .setTimestamp()
            .addFields(
                { name: " ", value: " ", inline: false },
                { name: "Content:", value: "A new `bug` has been submitted for the `" + reportCommand + "` command by `the bot report division` in `" + serverName + "`. You can use the administrator dashboard to consult it.", inline: false },

            )
            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


        await channel.send({ embeds: [updateEmbed] });



        const errorAnswerUser = new EmbedBuilder().setColor("#060A8F")
            .setTitle("An error occured")
            .setDescription("An error has occurred while executing this command. These errors can occur for a variety of reasons, such as :\n∙ Unexpected traffic\n∙ API maintenance\n∙ Occasional bug\n\nPlease note that a report has already been sent to our team, who will fix the problem as soon as possible. You can still use `/report` to give more details about the error and help our team.")
            .setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
            .setTimestamp()
            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


        await interaction.reply({ embeds: [errorAnswerUser], ephemeral: true });


    }
    },
};

