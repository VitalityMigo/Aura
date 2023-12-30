
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

function estLienHTTPS(val) {
    var lienRegex = /^(https:\/\/)/i; // Regex pour vérifier si le lien commence par "https://"

    return lienRegex.test(val);
}

//On construit les bouttons
const buttonRowGetWatchlist = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('watchlistswitchBTC-button')
            .setLabel('sort by volume')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('watchlistByFloorBTC-button')
            .setLabel('sort by floor')
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId('watchlistByListingsBTC-button')
            .setLabel('sort by listings')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('watchlistByVolumeETH-button')
            // .setLabel('BTC')
            .setEmoji("<:RCETH:1123226220075700244>")
            .setStyle(3),
    )



module.exports = {
    id: 'watchlistByFloorBTC-button',

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



                const authorWatchlist = await watchlistSql.findAll({ where: { authorId: authorId, collectionChain: "btc" } })


                const authorWatchlistCount = authorWatchlist.length
                let authorWatchlistCountFormatted = 0
                if (authorWatchlistCount === null) { authorWatchlistCountFormatted === "0" } else { authorWatchlistCountFormatted === authorWatchlistCount.toString() }



                const setWatchlist = new EmbedBuilder().setColor("#060A8F")
                    .setTitle(authorName + "'s watchlist")
                    .setDescription(`>>> Displaying the Bitcoin watchlist of ` + authorName)
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .addFields(
                        { name: " ", value: " ", inline: true },
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                if (authorWatchlist.length > 0) {




                    let watchlistBaseTable = [];
                    const hey = await interactionData.findOne({ where: { authorId: authorId, commandName: "getwatchlist-btc", serverId: serverId } })
                    watchlistBaseTable = JSON.parse(hey.dataValues.embed1)


                    watchlistBaseTable.sort((a, b) => b.collectionFloor - a.collectionFloor);


                    for (const collection of watchlistBaseTable) {


                        let collectionName = collection.collectionName
                        let selectedCollection = collection.selectedCollection
                        let collectionTwitter = collection.collectionTwitter
                        let collectionWebsite = collection.collectionWebsite
                        let collectionDiscord = collection.collectionDiscord
                        let collectionFloor = collection.collectionFloor
                        let totalVolume1D = collection.totalVolume1D
                        let collectionOwners = collection.collectionOwners
                        let collectionListingRatio = collection.collectionListingRatio

                        if (estLienHTTPS(collectionDiscord) && estLienHTTPS(collectionWebsite)) {

                            setWatchlist.addFields(
                                { name: collectionName + " (" + selectedCollection + ") ", value: "`Floor: " + collectionFloor.toFixed(3) + "₿ ∙ 1D Vol: " + totalVolume1D.toFixed(2) + "₿ ∙ Owners: " + Intl.NumberFormat('en-US').format(parseFloat(collectionOwners).toFixed(0)) + " ∙ Listed: " + collectionListingRatio + "%`\n[magic eden](https://magiceden.io/ordinals/marketplace/" + selectedCollection + ") ∙ " + '[ordinals](https://ordinalswallet.com/collection/' + selectedCollection + ") ∙ " + "[twitter](" + collectionTwitter + ") ∙ " + "[discord](" + collectionDiscord + ") ∙ " + '[website](' + collectionWebsite + ")", inline: false },
                            )

                        } else if (estLienHTTPS(collectionDiscord) && !estLienHTTPS(collectionWebsite)) {


                            setWatchlist.addFields(
                                { name: collectionName + " (" + selectedCollection + ") ", value: "`Floor: " + collectionFloor.toFixed(3) + "₿ ∙ 1D Vol: " + totalVolume1D.toFixed(2) + "₿ ∙ Owners: " + Intl.NumberFormat('en-US').format(parseFloat(collectionOwners).toFixed(0)) + " ∙ Listed: " + collectionListingRatio + "%`\n[magic eden](https://magiceden.io/ordinals/marketplace/" + selectedCollection + ") ∙ " + '[ordinals](https://ordinalswallet.com/collection/' + selectedCollection + ") ∙ " + "[twitter](" + collectionTwitter + ") ∙ " + "[discord](" + collectionDiscord + ")", inline: false },
                            )

                        } else if (!estLienHTTPS(collectionDiscord) && estLienHTTPS(collectionWebsite)) {

                            setWatchlist.addFields(
                                { name: collectionName + " (" + selectedCollection + ") ", value: "`Floor: " + collectionFloor.toFixed(3) + "₿ ∙ 1D Vol: " + totalVolume1D.toFixed(2) + "₿ ∙ Owners: " + Intl.NumberFormat('en-US').format(parseFloat(collectionOwners).toFixed(0)) + " ∙ Listed: " + collectionListingRatio + "%`\n[magic eden](https://magiceden.io/ordinals/marketplace/" + selectedCollection + ") ∙ " + '[ordinals](https://ordinalswallet.com/collection/' + selectedCollection + ") ∙ " + "[twitter](" + collectionTwitter + ") ∙ " + '[website](' + collectionWebsite + ")", inline: false },
                            )


                        } else {

                            setWatchlist.addFields(
                                { name: collectionName + " (" + selectedCollection + ") ", value: "`Floor: " + collectionFloor.toFixed(3) + "₿ ∙ 1D Vol: " + totalVolume1D.toFixed(2) + "₿ ∙ Owners: " + Intl.NumberFormat('en-US').format(parseFloat(collectionOwners).toFixed(0)) + " ∙ Listed: " + collectionListingRatio + "%`\n[magic eden](https://magiceden.io/ordinals/marketplace/" + selectedCollection + ") ∙ " + '[ordinals](https://ordinalswallet.com/collection/' + selectedCollection + ") ∙ " + "[twitter](" + collectionTwitter + ")", inline: false },
                            )

                        }


                    }


                    await interaction.update({ embeds: [setWatchlist], components: [buttonRowGetWatchlist] });



                    //On fait le call à la base SQL
                    await interactionData.destroy({ where: { authorId: authorId, commandName: "getwatchlist-btc", serverId: serverId } })

                    await interactionData.create({

                        authorId: authorId,
                        authorName: authorName,
                        serverId: serverId,
                        commandName: "getwatchlist-btc",
                        interactionId: interaction.id,
                        walletAddress: "N/A",
                        walletCategory: "N/A",
                        embed1: JSON.stringify(watchlistBaseTable),
                        embed2: "N/A",
                        embed3: "N/A",
                        pageIndex: "N/A",
                        actualPage: "N/A",
                        walletName: "N/A",
                        selecedTimestamp: "N/A",
                        selectedCollection: "N/A",
                        collectionSlug: "N/A",
                        collectionBanner: "N/A",
                        avgDeriskPrice: "N/A",
                        floorPrice: "N/A",
                        lowerMarketlace: "N/A",
                        collectionName: "N/A",
                        buyCount: "N/A",
                        soldCount: "N/A",
                        remaining: "N/A",
                        avgBuy: "N/A",
                        avgSold: "N/A",
                        realisedProfit: "N/A",
                        potentialProfit: "N/A",
                        roi: "N/A",
                        visualTitle: "N/A",
                        userAvatar: "N/A",
                        nbMembersInvolved: "N/A",
                        totalTradeCount: "N/A",
                    })





                } else if (authorWatchlist.length <= 0) {



                    const watchlistErrorEmbed = new EmbedBuilder().setColor("#060A8F")
                        .setTitle(`${authorName}'s watchlist`)
                        .setDescription("Your watchlist is empty. You can use the command `/setwatchlist` to add a collection to your watchlist.")
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                    await interaction.editReply({ embeds: [watchlistErrorEmbed] });





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
            let reportCommand = "/watchlist-BTCsortByFloor"

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




