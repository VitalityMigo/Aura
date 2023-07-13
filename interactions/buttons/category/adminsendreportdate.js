
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
    id: 'RCDashboardReportByDate-button',

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

                const botReports = await reportsql.findAll({ where: { botId: botId, reportState: "Not treated" } })
                let reportCount = botReports.length
                let reportTable = []

                for (let index = 0; index < reportCount; index++) {

                    let obj = {}
                    obj.authorId = botReports[index].dataValues.authorId
                    obj.serverName = botReports[index].dataValues.serverName
                    obj.authorRole = botReports[index].dataValues.authorRole
                    obj.serverId = botReports[index].dataValues.serverId
                    obj.date = botReports[index].dataValues.date
                    obj.reportType = botReports[index].dataValues.reportType
                    obj.reportCommand = botReports[index].dataValues.reportCommand
                    obj.reportDescription = sliceText(botReports[index].dataValues.reportDescription, 1000) + "```";
                    obj.reportDescriptionFull = botReports[index].dataValues.reportDescription
                    obj.reportPriority = botReports[index].dataValues.reportPriority
                    obj.reportState = botReports[index].dataValues.reportState
                    reportTable.push(obj)


                }


                reportTable.sort(function (a, b) {
                    var dateA = Date.parse(a.date);
                    var dateB = Date.parse(b.date);
                    return dateA - dateB;
                });





                let commandOverview = []
                let priorityOverview = []

                for (const report of reportTable) {

                    let reportCommand = report.reportCommand
                    let reportPriority = report.reportPriority
                    let reportScaleFormatted = "Minor"

                    if (reportPriority > 2 && reportPriority <= 4) { reportScaleFormatted = "Decent" } else if (reportPriority > 4 && reportPriority <= 6) { reportScaleFormatted = "Average" } else if (reportPriority > 6 && reportPriority <= 8) { reportScaleFormatted = "Important" } else if (reportPriority > 8) { reportScaleFormatted = "Major" }


                    commandOverview.push(reportCommand)
                    priorityOverview.push(reportScaleFormatted)

                }

                let counts1 = {};
                for (let val of commandOverview) {
                    counts1[val] = counts1[val] ? counts1[val] + 1 : 1;
                }
                const commandOverviewFormatted = Object.entries(counts1).map(([value, count]) => ({ value, count }));

                let counts2 = {};
                for (let val of priorityOverview) {
                    counts2[val] = counts2[val] ? counts2[val] + 1 : 1;
                }
                const priorityOverviewFormatted = Object.entries(counts2).map(([value, count]) => ({ value, count }));


                let commandOverviewEmbed = ""
                let priorityOverviewEmbed = ""

                for (const command of commandOverviewFormatted) {


                    let commandName = command.value
                    let reportNumber = command.count


                    let lignMaxSize = 40
                    let leftPartNfts = "`" + commandName
                    let rightPartNfts = reportNumber + " reports`\n"
                    let leftPartNFTsLenght = leftPartNfts.length
                    let rightPartNftsLenght = rightPartNfts.length
                    let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                    let spaceLenght = ""
                    for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }


                    commandOverviewEmbed += "`" + commandName + spaceLenght + reportNumber + " reports`\n"


                }

                for (const priority of priorityOverviewFormatted) {


                    let priorityName = priority.value
                    let reportNumber = priority.count


                    let lignMaxSize = 40
                    let leftPartNfts = "`" + priorityName
                    let rightPartNfts = reportNumber + " reports`\n"
                    let leftPartNFTsLenght = leftPartNfts.length
                    let rightPartNftsLenght = rightPartNfts.length
                    let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                    let spaceLenght = ""
                    for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }


                    priorityOverviewEmbed += "`" + priorityName + spaceLenght + reportNumber + " reports`\n"


                }


                let pageIndex = reportCount + 1




                const passwordManagement = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Admin Dashboard")
                    .setDescription(">>> Consult and manage the bot's reports")
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .setTimestamp()
                    .addFields(
                        { name: "Report Count", value: "`" + reportCount + " reports`", inline: true },
                        { name: "Report Filter", value: "`By command`", inline: true },
                        { name: "Command Overview", value: commandOverviewEmbed, inline: false },
                        { name: "Priority Overview", value: priorityOverviewEmbed, inline: false },
                        { name: "Page", value: "`[1/" + pageIndex + "]`", inline: false },




                    )
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                await interaction.update({ embeds: [passwordManagement], components: [buttonRowAdminDashboard] });


                await interactionData.destroy({ where: { authorId: authorId, commandName: "admin-report", serverId: serverId } })

                await interactionData.create({

                    authorId: authorId,
                    authorName: authorName,
                    serverId: serverId,
                    commandName: "admin-report",
                    interactionId: interaction.id,
                    embed1: JSON.stringify(reportTable),
                    embed2: JSON.stringify(passwordManagement),
                    pageIndex: pageIndex.toString(),
                    actualPage: "1",

                })

            } else {

                const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Bot Access")
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .setDescription("This button is not for you. You can only click on buttons generated by your commands. Please try again with your personal data.")
                    .setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
                    .setTimestamp()
                    .setFooter({ text: 'Rolls Chasers Bot', iconURL: 'https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg' })

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
            let reportCommand = "/admin-reportByDate"

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

