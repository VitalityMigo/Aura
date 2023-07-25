
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

const { ActionRowBuilder, EmbedBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const { accessSql, profileData, interactionData, apiproviderssql, usersql, apimonitorsql, adminsql, reportsql, sequelize } = require('../../../events/database');
const moment = require('moment');



const buttonRowAdminDashboard = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('adminDataUserCurrentMonth-button')
            .setLabel('current month')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('RCDashboardMenu-button')
            .setLabel('menu')
            .setStyle(2),
    )

const buttonRowAdminDashboard2 = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('adminDataUserPrevMonth-button')
            .setLabel('previous month')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('RCDashboardMenu-button')
            .setLabel('menu')
            .setStyle(2),
    )



module.exports = {
    id: 'adminDataUserCurrentMonth-button',

    async execute(interaction) {
        if (!(interaction instanceof ButtonInteraction)) return;

        //Récupérer informations de l'utilisateur de la commande
        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id
        let member = interaction.member;
        let botId = interaction.applicationId


        try {

            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")



            if (interaction.message.interaction.user.id === authorId) {

                //Checkpoint
                console.log("// Step 2 : Authorization - Executed ✅")





                    //Nombre de user unique
                    const userList = await usersql.findAll()

                    const uniqueUserNames = [...new Set(userList.map(user => user.dataValues.userName))];
                    const countUniqueUserNames = uniqueUserNames.length;

                    //Nombre de serveur par user
                    const userNameCounts = {};
                    userList.forEach(user => {
                        const userName = user.dataValues.userName;
                        userNameCounts[userName] = (userNameCounts[userName] || 0) + 1;
                    });

                    const sortedUserNameCounts = Object.entries(userNameCounts)
                        .sort((a, b) => b[1] - a[1])
                        .reduce((acc, [userName, count]) => {
                            acc[userName] = count;
                            return acc;
                        }, {});



                    // Nombre de personne par communauté
                    const serverIdCounts = {};
                    userList.forEach(user => {
                        const serverId = user.dataValues.serverId;
                        serverIdCounts[serverId] = (serverIdCounts[serverId] || 0) + 1;
                    });

                    const sortedServerIdCounts = Object.entries(serverIdCounts)
                        .sort((a, b) => b[1] - a[1])
                        .reduce((acc, [serverId, count]) => {
                            acc[serverId] = count;
                            return acc;
                        }, {});



                    // Nombre de commu unique
                    const uniqueServerIds = [...new Set(userList.map(user => user.dataValues.serverId))];
                    const countUniqueServerIds = uniqueServerIds.length;

                    /////////////

                    //Communauté par user
                    const usernames = Object.keys(sortedUserNameCounts);
                    const communityCounts = Object.values(sortedUserNameCounts);
                    const sum = communityCounts.reduce((acc, count) => acc + count, 0);
                    const average = (sum / usernames.length).toFixed(1)




                    let usersReportFormatted = ""
                    let count2 = 0
                    for (let key in sortedUserNameCounts) {

                        count2++
                        if (count2 > 15) {
                            break;
                        }

                        let lignMaxSize = 55
                        let leftPartNfts = "`" + key.toLowerCase()
                        let rightPartNfts = sortedUserNameCounts[key] + " communities`\n"
                        let leftPartNFTsLenght = leftPartNfts.length
                        let rightPartNftsLenght = rightPartNfts.length
                        let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                        let spaceLenght = ""
                        for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }



                        usersReportFormatted += "`" + key.toLowerCase() + spaceLenght + sortedUserNameCounts[key] + " communities`\n"


                    }


                    let communitiesReportFormatted = ""
                    let overLimitServerTable = []
                    let count1 = 0
                    for (let key in sortedServerIdCounts) {

                        count1++
                        if (count1 > 15) {
                            break;
                        }




                        const serverInfos = await accessSql.findOne({ where: { serverId: key } })
                        const serverName = serverInfos.dataValues.serverName
                        const serverLimitMembers = serverInfos.dataValues.userCount
                        let serverLimitFormatted = serverLimitMembers


                        if (serverLimitMembers.toLowerCase() == "unlimited") { serverLimitFormatted = "no limit" } else {

                            if (sortedServerIdCounts[key] > serverLimitMembers) {

                                const serverAdminRole = serverInfos.dataValues.adminRoleId
                                const serverAdminChannel = serverInfos.dataValues.adminUpdateChannel

                                let obj = {}
                                obj.serverId = key
                                obj.serverName = serverName
                                obj.limit = serverLimitMembers
                                obj.users = sortedServerIdCounts[key]
                                obj.serverAdminRole = serverAdminRole
                                obj.serverAdminChannel = serverAdminChannel
                                overLimitServerTable.push(obj)
                            }
                        }


                        let lignMaxSize = 55
                        let leftPartNfts = "`" + serverName + " ∙ " + serverLimitFormatted + " max"
                        let rightPartNfts = sortedServerIdCounts[key] + " users`\n"
                        let leftPartNFTsLenght = leftPartNfts.length
                        let rightPartNftsLenght = rightPartNfts.length
                        let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                        let spaceLenght = ""
                        for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }



                        communitiesReportFormatted += "`" + serverName + " ∙ " + serverLimitFormatted + " max" + spaceLenght + sortedServerIdCounts[key] + " users`\n"


                    }






                    const apiMonthlyReport = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Monthly User Report")
                        .setDescription(">>> Showing the bot's monthly user report.")
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .setTimestamp()
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "Unique Users:", value: "`" + countUniqueUserNames + " users`", inline: false },
                            { name: "Community Count", value: "`" + countUniqueServerIds + " communities`", inline: true },
                            { name: "Community/User", value: "`" + average + " communities`", inline: true },
                            { name: " ", value: " ", inline: false },
                            { name: "Users", value: usersReportFormatted, inline: false },
                            { name: "Communities", value: communitiesReportFormatted, inline: false },
                            
                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.update({ embeds: [apiMonthlyReport], components: [buttonRowAdminDashboard2] });




                


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
            let reportCommand = "/admin-dataUserCurrentMonth"

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
                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                .setAuthor({ name: "Rolls Chasers Analytics", iconURL: "https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png" })
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
                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                .setTimestamp()
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


            await interaction.reply({ embeds: [errorAnswerUser], ephemeral: true });


        }
    },
};




