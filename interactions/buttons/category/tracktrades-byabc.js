
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
const { accessSql, profileData, interactionData, watchlistSql, adminsql, usersql, reportsql, sequelize } = require('../../../events/database');
const moment = require('moment');
const getTimeAgo = require("../../../functions/timeago")

function formatString(inputString) {
    if (inputString.length <= 17) {
        return inputString;
    } else {
        return inputString.slice(0, 20) + '...';
    }
}

function formatTokenId(inputString) {
    if (inputString.length <= 5) {
        return inputString;
    } else {
        return inputString.slice(0, 5) + '.';
    }
}




const buttonsRow = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('tracktradesByDate-button')
            .setLabel('sort by date')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('tracktradesByProfit-button')
            .setLabel('sort by profit')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('tracktradesByROI-button')
            .setLabel('sort by ROI')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('tracktradesByabc-button')
            .setLabel('sort by abc')
            .setStyle(1)
    );



module.exports = {
    id: 'tracktradesByabc-button',

    async execute(interaction) {
        if (!(interaction instanceof ButtonInteraction)) return;

        //Récupérer informations de l'utilisateur de la commande
        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id


        try {

        //Checkpoint
        console.log("// Step 1 : Initialization - Executed ✅")



        if (interaction.message.interaction.user.id === authorId) {

            //Checkpoint
            console.log("// Step 2 : Authorization - Executed ✅")



            //Checkpoint
            console.log("// Step 2 : Authorization - Executed ✅")



            //On enregistre le user si il est pas encore dans la database
            const timeStamp1 = Date.now();
            const actualTimestamp1 = parseFloat(timeStamp1 / 1000).toFixed(0)
            const isUser = await usersql.findOne({ where: { userId: authorId, serverId: serverId } })
            if (isUser == null) { await usersql.create({ userId: authorId, userName: authorName, userAvatar: userAvatar, serverId: serverId, timestamp: actualTimestamp1 }) }




            const lastInteractionData = await interactionData.findOne({ where: { authorId: authorId, commandName: "tracktrades", serverId: serverId } })

            let walletAddress = lastInteractionData.dataValues.walletAddress
            let walletCategory = lastInteractionData.dataValues.walletCategory
           
            let summaryTable = await JSON.parse(lastInteractionData.dataValues.embed1)

            let embedInfos = await JSON.parse(lastInteractionData.dataValues.embed2)
            let ethusdtPrice = embedInfos[0].ethusdtPrice
            let walletFormatted = embedInfos[0].walletFormatted
            let collectionCount = embedInfos[0].collectionCount
            let totalProfit = embedInfos[0].totalProfit
            let averageProfit = embedInfos[0].averageProfit
            let averageRoi = embedInfos[0].averageRoi

            console.log(collectionCount)

            if (walletCategory.toLowerCase() == "eth") {


                summaryTable.sort((a, b) => a.name.localeCompare(b.name));

                console.log(summaryTable)

                let flipOverview = ""
                let ethusdtPrice = embedInfos[0].ethusdtPrice

                for (const flip of summaryTable) {




                    let collection = flip.name
                    let tokenId = flip.token
                    let profit = flip.profit
                    let roi = flip.roi
                    let timestamp = flip.timestamp

                    let profitFormatted = profit
                    let roiFormatted = roi

                    if (profit) {
                        if (profit > 0) {
                            roiFormatted = "+" + roi
                        }

                    } else if (!profit) {
                        profitFormatted = "0.000"
                    }

                    if (!roi) {
                        roiFormatted = "0.00"
                    }


                    let lignMaxSize = 70
                    let leftPartNfts = "`" + formatString(collection) + " (#" + tokenId + ")"
                    let rightPartNfts = profitFormatted + "Ξ • " + roiFormatted + "% • " + getTimeAgo(timestamp) + "`\n"
                    let leftPartNFTsLenght = leftPartNfts.length
                    let rightPartNftsLenght = rightPartNfts.length
                    let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                    let spaceLenght = ""
                    for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }


                    flipOverview += leftPartNfts + spaceLenght + rightPartNfts




                }





                const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Mint Tracker")
                    .setDescription(">>> Display your last closed position on a specific wallet.")
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .setTimestamp()
                    .addFields(
                        { name: "Wallet", value: walletFormatted, inline: false },
                        { name: "Collection Count", value: "`" + collectionCount + " collection(s)`", inline: false },
                        { name: "Total Profit", value: "`" + parseFloat(totalProfit).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(totalProfit * ethusdtPrice).toFixed(0)) + "$)`", inline: true },
                        { name: "Avg. Profit", value: "`" + parseFloat(averageProfit).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(averageProfit * ethusdtPrice).toFixed(0)) + "$)`", inline: true },
                        { name: "Avg. ROI", value: "`" + averageRoi + "%`", inline: true },
                        { name: "Mints:", value: flipOverview, inline: false },

                    )
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                await interaction.update({ embeds: [gasTrackerEmbed], components: [buttonsRow] })




            } else if (walletCategory.toLowerCase() == "btc") {

                summaryTable.sort((a, b) => a.name.localeCompare(b.name));

                let flipOverview = ""
                let BTCUsdPrice = embedInfos[0].BTCUsdPrice

                for (const flip of summaryTable) {




                    let collection = flip.name
                    let tokenId = flip.token
                    let profit = flip.profit
                    let roi = flip.roi
                    let timestamp = flip.timestamp

                    let profitFormatted = profit
                    let roiFormatted = roi

                    if (profit) {
                        if (parseFloat(profit).toFixed(3) > 0) {
                            roiFormatted = "+" + roi
                        }

                    } else if (!profit) {
                        profitFormatted = "0.000"
                    }

                    if (!roi) {
                        roiFormatted = "0.00"
                    }


                    let lignMaxSize = 70
                    let leftPartNfts = "`" + formatString(collection) + " (#" + tokenId + ")"
                    let rightPartNfts = profitFormatted + "₿ • " + roiFormatted + "% • " + getTimeAgo(timestamp) + "`\n"
                    let leftPartNFTsLenght = leftPartNfts.length
                    let rightPartNftsLenght = rightPartNfts.length
                    let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                    let spaceLenght = ""
                    for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }


                    flipOverview += leftPartNfts + spaceLenght + rightPartNfts




                }






               



                



                const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Mint Tracker")
                    .setDescription(">>> Display your last closed position on a specific wallet.")
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .setTimestamp()
                    .addFields(
                        { name: "Wallet", value: walletFormatted, inline: false },
                        { name: "Collection Count", value: "`" + collectionCount + " collection(s)`", inline: false },
                        { name: "Total Profit", value: "`" + parseFloat(totalProfit).toFixed(3) + "₿ (" + new Intl.NumberFormat('en-US').format(parseFloat(totalProfit * BTCUsdPrice).toFixed(0)) + "$)`", inline: true },
                        { name: "Avg. Profit", value: "`" + parseFloat(averageProfit).toFixed(3) + "₿ (" + new Intl.NumberFormat('en-US').format(parseFloat(averageProfit * BTCUsdPrice).toFixed(0)) + "$)`", inline: true },
                        { name: "Avg. ROI", value: "`" + averageRoi + "%`", inline: true },
                        { name: "Mints:", value: flipOverview, inline: false },

                    )
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                await interaction.update({ embeds: [gasTrackerEmbed], components: [buttonsRow] })





            }






        } else {

            const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                .setTitle("Bot Access")
                .setAuthor({ name: authorName, iconURL: userAvatar })
                .setDescription("This button is not made for you. You can only click on buttons that have been generated by your commands. Please try again with your personal data.")
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
            let reportCommand = "/tracktrades-byabc"
    
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




