
const { ButtonInteraction } = require('discord.js');
const { ActionRowBuilder, EmbedBuilder, ButtonBuilder } = require("discord.js");
const { accessSql, profileData, adminsql, reportsql, interactionData, sequelize } = require('../../../events/database');
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
    id: 'RCclientlist-button',

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


                const clientList = await accessSql.findAll()

                let clientCount = clientList.length
                let clientTable = []
                let tierTable = []

                for (let index = 0; index < clientCount; index++) {

                    let obj = {}
                    obj.serverName = clientList[index].dataValues.serverName
                    obj.serverId = clientList[index].dataValues.serverId
                    obj.accessTier = clientList[index].dataValues.accessTier
                    obj.adminRoleId = clientList[index].dataValues.adminRoleId
                    obj.memberRoleId = clientList[index].dataValues.memberRoleId
                    obj.updateChannel = clientList[index].dataValues.updateChannel
                    obj.accessSince = clientList[index].dataValues.accessSince
                    obj.adminWalletAddress = clientList[index].dataValues.adminWalletAddress
                    obj.actualPower = clientList[index].dataValues.actualPower
                    obj.password = clientList[index].dataValues.password
                    obj.subscribtionStatut = clientList[index].dataValues.subscribtionStatut
                    obj.subscribtionPrice = clientList[index].dataValues.subscribtionPrice
                    obj.statut = clientList[index].dataValues.statut



                    clientTable.push(obj)

                    let accessTier2 = clientList[index].dataValues.accessTier

                    tierTable.push(accessTier2)



                }

                //Classer le tableau par ordre alphabétique
                clientTable.sort((a, b) => {
                    const serverNameA = a.serverName.toUpperCase();
                    const serverNameB = b.serverName.toUpperCase();

                    if (serverNameA < serverNameB) {
                        return -1;
                    }
                    if (serverNameA > serverNameB) {
                        return 1;
                    }

                    return 0;
                });


                //Double stats d'entrée
                let lateSubscribtionCount = 0;
                for (const obj of clientTable) {
                    if (/^-/.test(obj.subscribtionStatut)) {
                        lateSubscribtionCount++;
                    }
                }
                let validSubscribtionCount = clientCount - lateSubscribtionCount

                //Tableau de distribution des tier
                let accessTierDistributionFormatted = ""
                let counts1 = {};

                for (let val of tierTable) {
                    counts1[val] = counts1[val] ? counts1[val] + 1 : 1;
                }
                const accessTierDistributionTable = Object.entries(counts1).map(([value, count]) => ({ value, count }));


                for (const client of accessTierDistributionTable) {


                    let tierName = client.value
                    let tierCount = client.count


                    let lignMaxSize = 40
                    let leftPartNfts = "`" + tierName
                    let rightPartNfts = tierCount + " clients`\n"
                    let leftPartNFTsLenght = leftPartNfts.length
                    let rightPartNftsLenght = rightPartNfts.length
                    let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                    let spaceLenght = ""
                    for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }


                    accessTierDistributionFormatted += "`" + tierName + spaceLenght + tierCount + " clients`\n"

                }



                const passwordManagement = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Admin Dashboard")
                    .setDescription(">>> Consult, manage and create new client")
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .setTimestamp()
                    .addFields(
                        { name: " ", value: " ", inline: false },
                        { name: "Client Mecanism", value: "The client page allows the bot administrator to consult, to search, to delete and to create new client. This page is a sensitive one, make sure to double-check all the actions you trigger.", inline: true },
                        { name: " ", value: " ", inline: false },
                        { name: "Client Count", value: "`" + clientCount + "`", inline: true },
                        { name: "Subscription Statut", value: "`" + validSubscribtionCount + "/" + clientCount + "`", inline: true },
                        { name: "Access Tier Distribution", value: accessTierDistributionFormatted, inline: false },
                        { name: "Page", value: "`[1/" + (clientCount + 1) + "]`", inline: false },


                    )
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                await interaction.update({ embeds: [passwordManagement], components: [buttonRowAdminDashboard] });

                await interactionData.destroy({ where: { authorId: authorId, commandName: "adminclient-list", serverId: serverId } })

                await interactionData.create({

                    authorId: authorId,
                    authorName: authorName,
                    serverId: serverId,
                    commandName: "adminclient-list",
                    interactionId: interaction.id,
                    embed1: JSON.stringify(clientTable),
                    embed2: JSON.stringify(passwordManagement),
                    pageIndex: (clientCount + 1).toString(),
                    actualPage: "1",

                })


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
            let reportCommand = "/admin-clientList"

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




