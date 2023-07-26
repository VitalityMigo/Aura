
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
const { accessSql, profileData, apimonitorsql, apiproviderssql, adminsql, reportsql, sequelize } = require('../../../events/database');
const moment = require('moment');



const buttonRowAdminDashboard = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('adminDataApiPrevMonth-button')
            .setLabel('previous month')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('RCDashboardMenu-button')
            .setLabel('menu')
            .setStyle(2),
    )

   



module.exports = {
    id: 'adminDataAPI-button',

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


            const reportTable = await apimonitorsql.findAll()

            if (reportTable.length > 0) {



                let riskAlertEmbed = "Safe 🟢"



                const apiCallList = await apimonitorsql.findAll()

                let apiCallCount = apiCallList.length;
                let serverApiCallTable = {}
                let apiProviderCallTable = {}
                let commandNameCallTable = {}
                let apiCallNameCallTable = {}


                for (const apiCall of apiCallList) {

                    let serverIdCall = apiCall.dataValues.serverId
                    let apiProviderCall = apiCall.dataValues.apiProvider
                    let commandNameCall = apiCall.dataValues.commandName
                    let apiCallNameCall = apiCall.dataValues.apiCallName

                    const communityInfos = await accessSql.findOne({ where: { serverId: serverIdCall } })
                    let serverIdNameCall = communityInfos.dataValues.serverName

                    if (serverApiCallTable[serverIdNameCall]) { serverApiCallTable[serverIdNameCall]++; } else { serverApiCallTable[serverIdNameCall] = 1; }
                    if (apiProviderCallTable[apiProviderCall]) { apiProviderCallTable[apiProviderCall]++; } else { apiProviderCallTable[apiProviderCall] = 1; }
                    if (commandNameCallTable[commandNameCall]) { commandNameCallTable[commandNameCall]++; } else { commandNameCallTable[commandNameCall] = 1; }
                    if (apiCallNameCallTable[apiCallNameCall]) { apiCallNameCallTable[apiCallNameCall]++; } else { apiCallNameCallTable[apiCallNameCall] = 1; }

                }



                let serverApiCallTableSorted = Object.entries(serverApiCallTable)
                    .sort((a, b) => b[1] - a[1])
                    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

                let apiProviderCallTableSorted = Object.entries(apiProviderCallTable)
                    .sort((a, b) => b[1] - a[1])
                    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

                let commandNameCallTableSorted = Object.entries(commandNameCallTable)
                    .sort((a, b) => b[1] - a[1])
                    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});


                let apiCallNameCallTableSorted = Object.entries(apiCallNameCallTable)
                    .sort((a, b) => b[1] - a[1])
                    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});



                let serverApiCallTableEmbed = ""
                let count1 = 0
                for (let key in serverApiCallTableSorted) {

                    count1++
                    if (count1 > 15) {
                        break;
                    }

                    let lignMaxSize = 55
                    let leftPartNfts = "`" + key
                    let rightPartNfts = serverApiCallTableSorted[key] + " calls`\n"
                    let leftPartNFTsLenght = leftPartNfts.length
                    let rightPartNftsLenght = rightPartNfts.length
                    let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                    let spaceLenght = ""
                    for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }



                    serverApiCallTableEmbed += "`" + key + spaceLenght + serverApiCallTableSorted[key] + " calls`\n"

                }


                let apiProviderCallTableEmbed = ""
                let count2 = 0
                for (let key in apiProviderCallTableSorted) {

                    count2++
                    if (count2 > 15) {
                        break;
                    }

                    let keyNameSearch = key.toLowerCase()
                    if (keyNameSearch === 'alchemy2') { keyNameSearch = 'alchemy' }
                    const apiProviderInfos = await apiproviderssql.findOne({ where: { apiProviderName: keyNameSearch } })
                    let providerMonthlyCallLimit = new Intl.NumberFormat('en-US').format(parseFloat(apiProviderInfos.dataValues.apiMonthlyCall).toFixed(0))
                    if (providerMonthlyCallLimit.toLowerCase() == "nan") { providerMonthlyCallLimit = "no" }
                    if (((apiProviderInfos.dataValues.apiMonthlyCall / 10) * 9) < apiProviderCallTableSorted[key]) { riskAlertEmbed = "Risky 🔴" }


                    let lignMaxSize = 55
                    let leftPartNfts = "`" + key + " ∙ " + providerMonthlyCallLimit + " max"
                    let rightPartNfts = apiProviderCallTableSorted[key] + " calls`\n"
                    let leftPartNFTsLenght = leftPartNfts.length
                    let rightPartNftsLenght = rightPartNfts.length
                    let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                    let spaceLenght = ""
                    for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }



                    apiProviderCallTableEmbed += "`" + key + " ∙ " + providerMonthlyCallLimit + " max" + spaceLenght + apiProviderCallTableSorted[key] + " calls`\n"


                }



                let commandNameCallTableEmbed = ""
                let count3 = 0
                for (let key in commandNameCallTableSorted) {

                    count3++
                    if (count3 > 15) {
                        break;
                    }

                    let lignMaxSize = 55
                    let leftPartNfts = "`" + key
                    let rightPartNfts = commandNameCallTableSorted[key] + " calls`\n"
                    let leftPartNFTsLenght = leftPartNfts.length
                    let rightPartNftsLenght = rightPartNfts.length
                    let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                    let spaceLenght = ""
                    for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }



                    commandNameCallTableEmbed += "`" + key + spaceLenght + commandNameCallTableSorted[key] + " calls`\n"

                }


                let apiCallNameCallTableEmbed = ""
                let count4 = 0
                for (let key in apiCallNameCallTableSorted) {

                    count4++
                    if (count4 > 15) {
                        break;
                    }

                    let lignMaxSize = 55
                    let leftPartNfts = "`" + key
                    let rightPartNfts = apiCallNameCallTableSorted[key] + " calls`\n"
                    let leftPartNFTsLenght = leftPartNfts.length
                    let rightPartNftsLenght = rightPartNfts.length
                    let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                    let spaceLenght = ""
                    for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }


                    apiCallNameCallTableEmbed += "`" + key + spaceLenght + apiCallNameCallTableSorted[key] + " calls`\n"
                }



                const apiMonthlyReport = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Monthly API Report")
                    .setDescription(">>> Showing the bot's monthly API report.")
                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                    .setTimestamp()
                    .addFields(
                        { name: "API Calls:", value: "`" + apiCallCount + " calls`", inline: false },
                        { name: "Statut", value: "`Available`", inline: true },
                        { name: "Risk Alert:", value: "`" + riskAlertEmbed + "`", inline: true },
                        { name: " ", value: " ", inline: false },
                        { name: "Providers:", value: apiProviderCallTableEmbed, inline: false },
                        { name: "Commands:", value: commandNameCallTableEmbed, inline: false },
                        { name: "Calls:", value: apiCallNameCallTableEmbed, inline: false },
                        { name: "Servers:", value: serverApiCallTableEmbed, inline: false },

                    )
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                await interaction.update({ embeds: [apiMonthlyReport], components: [buttonRowAdminDashboard] })


            } else {

                const apiMonthlyReport = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Monthly API Report")
                    .setDescription(">>> Showing the bot's monthly API report.")
                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                    .setTimestamp()
                    .addFields(
                        { name: "Content:", value: "The current report database is empty, please visit this page a little late to get data on API calls.", inline: false },
                        { name: " ", value: " ", inline: false },
                        { name: " ", value: "The last month's API report isn't available ❌.", inline: false },

                    )
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                await interaction.update({ embeds: [apiMonthlyReport], components: [buttonRowAdminDashboard] })



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
            let reportCommand = "/admin-dataAPI"

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




