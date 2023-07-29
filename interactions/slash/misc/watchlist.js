/**
 * @file Sample setwallet command with slash command.
 * @author VitalityMigo
 */

// On définit des constantes qui serviront dans l'ensemble de la commande
const { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const moment = require('moment');
const csv = require('fast-csv');


const { profileData, accessSql, apimonitorsql,  wallets, reportsql, adminsql, usersql, interactionData, watchlistSql, sequelize } = require('../../../events/database');
const fs = require('fs');


//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const reservoirApiKey = process.env.reservoirApiKey
const magicedenApiKey = process.env.magicedenApiKey



//Web3 API + Cloudfare Provider
var Web3 = require("web3")
const web3 = new Web3("https://cloudflare-eth.com")




//Reservoir API
const sdk = require('api')('@reservoirprotocol/v2.0#2672bklexdpsbi');
sdk.auth(reservoirApiKey);
//;

// Configuration de l'en-tête d'autorisation
const headers = {
    'Authorization': `Bearer ${magicedenApiKey}`
};


const axios = require('axios')


function formatString(input) {
    return input.length > 42 ? `${input.substring(0, 19)}...${input.substring(input.length - 20)}` : input;
}

function isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);

}

function isBRC20BitcoinWallet(wallet) {
    const regex = /^bc1[a-zA-Z0-9]{39,59}$/;

    return regex.test(wallet);
}

function isENS(str) {
    const lowerCaseStr = str.toLowerCase();
    return lowerCaseStr.endsWith(".eth");
}


function isSATS(str) {
    return str.endsWith(".sats");
}


function estLienHTTPS(val) {
    var lienRegex = /^(https:\/\/)/i; // Regex pour vérifier si le lien commence par "https://"

    return lienRegex.test(val);
}




module.exports = {
    data: new SlashCommandBuilder()
        .setName("watchlist")
        .setDescription("Add, remove or display to/from your watchlist.")
        .addSubcommand(subcommand =>
            subcommand
                .setName("set")
                .setDescription("Set a new collection to your watchlist")
                .addStringOption(option =>
                    option
                        .setName("collection")
                        .setDescription("Collection you want to add to your watchlist")
                        .setRequired(true)
                        .setAutocomplete(true)
                ),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("get")
                .setDescription("Display your watchlist"),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("remove")
                .setDescription("Remove a collection from your watchlist")
                .addStringOption(option =>
                    option
                        .setName("collection")
                        .setDescription("Collection you want to remove from your watchlist")
                        .setRequired(true)
                        .setAutocomplete(true)
                ),
        ),





    // Début de l'éxecution de la commande
    async execute(interaction) {


        if (interaction.guildId != null) {



        //Récupérer informations de l'utilisateur de la commande
        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id
        let member = interaction.member;

        try {

        const communityRolePerms = await accessSql.findOne({ where: { serverId: serverId } })
        let communityMemberRoleId = communityRolePerms.dataValues.memberRoleId
        let communityAdminRoleId = communityRolePerms.dataValues.adminRoleId
        let botPowerStatut = communityRolePerms.dataValues.actualPower
        let communityStatut = communityRolePerms.dataValues.statut

       //Récupère régagle de privé/ou pas de l'utilisateur
        const authorProfile = await profileData.findOne({ where: { authorId: authorId } })

        if (authorProfile === null) { await interaction.deferReply(); } else {
            const authorPrivacyMode = authorProfile.dataValues.privacyMode

            if (authorPrivacyMode.toLowerCase() === "private") { await interaction.deferReply({ ephemeral: true }); }
            if (authorPrivacyMode.toLowerCase() === "public") { await interaction.deferReply(); }
        }



        //Checkpoint
        console.log("// Step 1 : Initialization - Executed ✅")


        if (communityStatut.toLowerCase() === "active") {


            if (botPowerStatut.toLowerCase() === "on") {

                if (member.roles.cache.has(communityMemberRoleId)) {

                    //Checkpoint
                    console.log("// Step 2 : Authorization - Executed ✅")



                    //On enregistre le user si il est pas encore dans la database
                    const timeStamp1 = Date.now();
                    const actualTimestamp1 = parseFloat(timeStamp1 / 1000).toFixed(0)
                    const isUser = await usersql.findOne({ where: { userId: authorId, serverId: serverId } })
                    if (isUser == null) { await usersql.create({ userId: authorId, userName: authorName, userAvatar: userAvatar, serverId: serverId, timestamp: actualTimestamp1 }) }


                    if (interaction.options.getSubcommand() === 'set') {


                        // On déclare les variables présentes dans l'exécution (Embed, conditions etc)
                        const selectedCollection = interaction.options.getString("collection").toLowerCase();



                        const authorWatchlistETH = await watchlistSql.findAll({ where: { authorId: authorId, collectionChain: "eth" } })
                        const authorWatchlistBTC = await watchlistSql.findAll({ where: { authorId: authorId, collectionChain: "btc" } })
                        const authorWatchlistSimilar = await watchlistSql.findOne({ where: { authorId: authorId, selectedCollection: selectedCollection } })


                        const authorWatchlistETHCount = authorWatchlistETH.length
                        const authorWatchlistBTCCount = authorWatchlistBTC.length
                        const authorWatchlistTotalCount = parseInt(authorWatchlistETHCount) + parseInt(authorWatchlistBTCCount)
                        const authorWatchlistTotalCountAfter = parseInt(authorWatchlistTotalCount) + 1

                        let authorWatchlistCountFormatted = 1
                        if (authorWatchlistTotalCountAfter === 0) { authorWatchlistCountFormatted = "No" } else { authorWatchlistCountFormatted = (authorWatchlistTotalCountAfter) }

                        if (authorWatchlistSimilar === null) {


                            if (isValidEthereumAddress(selectedCollection)) {

                                if (authorWatchlistETHCount <= 5) {


                                    sdk.getCollectionsV5({ id: selectedCollection, accept: '*/*', includeTopBid: 'true', includeOwnerCount: 'true', includeSalesCount: 'true' })
                                        .then(async ({ data: collectionData }) => {



                                            let collectionName = collectionData.collections[0].name
                                            let collectionTwitter = collectionData.collections[0].twitterUsername
                                            let collectionWebsite = collectionData.collections[0].externalUrl
                                            let collectionSlug = collectionData.collections[0].slug
                                            let collectionSupply = collectionData.collections[0].tokenCount
                                            let collectionTotalListings = collectionData.collections[0].onSaleCount
                                            let collectionFloor = collectionData.collections[0].floorAsk.price.amount.decimal
                                            let totalVolume1D = collectionData.collections[0].volume["1day"]
                                            let collectionOwners = collectionData.collections[0].ownerCount
                                            let collectionListingRatio = parseFloat((collectionTotalListings * 100) / collectionSupply).toFixed(2)



                                            await watchlistSql.create({
                                                authorId: authorId,
                                                selectedCollection: selectedCollection,
                                                collectionName: collectionName,
                                                collectionChain: "eth"

                                            })


                                            const setWatchlist = new EmbedBuilder().setColor("#060A8F")
                                                .setTitle(collectionName)
                                                .setDescription(`>>> The collection has been set in ${authorName}'s watchlist`)
                                                // .setImage(collectionBanner)
                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                .addFields(
                                                    { name: "Watchlist", value: "`Active`", inline: true },
                                                    { name: "Collection Count", value: "`" + authorWatchlistCountFormatted + " collections`", inline: true },
                                                    { name: " ", value: " ", inline: true },
                                                    { name: collectionName, value: "`Floor: " + collectionFloor.toFixed(3) + "Ξ ∙ 1D Vol: " + totalVolume1D.toFixed(2) + "Ξ ∙ Owners: " + Intl.NumberFormat('en-US').format(parseFloat(collectionOwners).toFixed(0)) + " ∙ Listed: " + collectionListingRatio + "%`\n[magically](https://magically.gg/collection/" + selectedCollection + ") ∙ " + '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + selectedCollection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + selectedCollection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ") ∙ " + '[website](' + collectionWebsite + ")", inline: false },
                                                )
                                                .setTimestamp()
                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                            await interaction.editReply({ embeds: [setWatchlist] });




                                            //On enregistre le call API dans la database
                                            const timeStamp = Date.now();
                                            await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/setwatchlist", apiCallName: "getCollectionsV5", apiProvider: "reservoir", timestamp: timeStamp.toString() })

                                        })


                                } else if (authorWatchlistETHCount > 5) {



                                    const watchlistErrorEmbed = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle(`${authorName}'s watchlist`)
                                        .setDescription(`The collection can't be set, ${authorName}'s Ethereum watchlist already reached its maximum capacity of 6 collections.`)
                                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                    await interaction.editReply({ embeds: [watchlistErrorEmbed] });





                                }



                            } else {


                                if (authorWatchlistBTCCount <= 5) {


                                    const url = "https://api-mainnet.magiceden.dev/v2/ord/btc/collections/" + selectedCollection
                                    const response = await axios.get(url, { headers });
                                    const collectionData = await response.data;

                                    const url2 = "https://api-mainnet.magiceden.dev/v2/ord/btc/stat?collectionSymbol=" + selectedCollection
                                    const response2 = await axios.get(url2, { headers });
                                    const collectionData2 = await response2.data;


                                    console.log(collectionData2)

                                    let collectionName = collectionData.name
                                    let collectionTwitter = collectionData.twitterLink
                                    let collectionWebsite = collectionData.websiteLink
                                    let collectionDiscord = collectionData.discordLink

                                    let collectionSupply = collectionData2.supply
                                    let collectionFloor = (collectionData2.floorPrice) / (10 ** 8)
                                    let collectionOwners = collectionData2.owners
                                    let totalVolume1D = (collectionData2.totalVolume) / (10 ** 8)
                                    let collectionTotalListings = collectionData2.totalListed
                                    let collectionListingRatio = parseFloat((collectionTotalListings * 100) / collectionSupply).toFixed(2)





                                    await watchlistSql.create({
                                        authorId: authorId,
                                        selectedCollection: selectedCollection,
                                        collectionName: collectionName,
                                        collectionChain: "btc"

                                    })


                                    const setWatchlist = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle(collectionName)
                                        .setDescription(`>>> The collection has been set in ${authorName}'s watchlist`)
                                        // .setImage(collectionBanner)
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .addFields(
                                            { name: "Watchlist", value: "`Active`", inline: true },
                                            { name: "Collection Count", value: "`" + authorWatchlistCountFormatted + " collections`", inline: true },
                                            { name: " ", value: " ", inline: true },
                                        )
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


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




                                    await interaction.editReply({ embeds: [setWatchlist] });



                                    //On enregistre le call API dans la database
                                    const timeStamp = Date.now();
                                    await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/setwatchlist", apiCallName: "getCollectionsV5", apiProvider: "reservoir", timestamp: timeStamp.toString() })




                                } else if (authorWatchlistBTCCount > 5) {



                                    const watchlistErrorEmbed = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle(`${authorName}'s watchlist`)
                                        .setDescription(`The collection can't be set, ${authorName}'s Ethereum watchlist already reached its maximum capacity of 6 collections.`)
                                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                    await interaction.editReply({ embeds: [watchlistErrorEmbed] });





                                }



                            }


                        } else if (authorWatchlistSimilar !== null) {



                            const watchlistErrorEmbed = new EmbedBuilder().setColor("#060A8F")
                                .setTitle(`${authorName}'s watchlist`)
                                .setDescription("This collection is already set in your watchlist. Try again with a non-registered collection.")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                            await interaction.editReply({ embeds: [watchlistErrorEmbed] });



                        }





                    } else if (interaction.options.getSubcommand() === 'get') {




//On construit les bouttons
const buttonRowGetWatchlist = new ActionRowBuilder()
.addComponents(
    new ButtonBuilder()
        .setCustomId('watchlistByVolumeETH-button')
        .setLabel('sort by volume')
        .setStyle(1),
    new ButtonBuilder()
        .setCustomId('watchlistByFloorETH-button')
        .setLabel('sort by floor')
        .setStyle(2),
    new ButtonBuilder()
        .setCustomId('watchlistByListingsETH-button')
        .setLabel('sort by listings')
        .setStyle(2),
    new ButtonBuilder()
        .setCustomId('watchlistswitchBTC-button')
        .setEmoji("<:RCBTC:1123219824282189834>")
        .setStyle(3),
)


//On construit les bouttons
const buttonRowGetWatchlist2 = new ActionRowBuilder()
.addComponents(
    new ButtonBuilder()
        .setCustomId('watchlistswitchBTC-button')
        // .setLabel('BTC')
        .setEmoji("<:RCBTC:1123219824282189834>")
        .setStyle(3),
)




const authorWatchlist = await watchlistSql.findAll({ where: { authorId: authorId, collectionChain: "eth" } })


                        const authorWatchlistCount = authorWatchlist.length
                        let authorWatchlistCountFormatted = 0
                        if (authorWatchlistCount === null) { authorWatchlistCountFormatted === "0" } else { authorWatchlistCountFormatted === authorWatchlistCount.toString() }



                        const setWatchlist = new EmbedBuilder().setColor("#060A8F")
                            .setTitle(authorName + "'s watchlist")
                            .setDescription(`>>> Displaying the Ethereum watchlist of ` + authorName)
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .addFields(
                                { name: " ", value: " ", inline: true },
                            )
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                        if (authorWatchlist.length > 0) {

                            let apiObj = {}
                            apiObj.getCollectionsV5 = 0


                            let promises = [];
                            let watchlistBaseTable = [];


                            for (const obj of authorWatchlist) {

                                let selectedCollection = obj.dataValues.selectedCollection

                                let promise = sdk.getCollectionsV5({ id: selectedCollection, accept: '*/*', includeTopBid: 'true', includeOwnerCount: 'true', includeSalesCount: 'true' })
                                    .then(async ({ data: collectionData }) => {


                                        apiObj.getCollectionsV5++

                                        let collectionName = collectionData.collections[0].name
                                        let collectionTwitter = collectionData.collections[0].twitterUsername
                                        let collectionWebsite = collectionData.collections[0].externalUrl
                                        let collectionSlug = collectionData.collections[0].slug
                                        let collectionSupply = collectionData.collections[0].tokenCount
                                        let collectionTotalListings = collectionData.collections[0].onSaleCount
                                        let collectionFloor = collectionData.collections[0].floorAsk.price.amount.decimal
                                        let totalVolume1D = collectionData.collections[0].volume["1day"]
                                        let collectionOwners = collectionData.collections[0].ownerCount
                                        let collectionListingRatio = parseFloat((collectionTotalListings * 100) / collectionSupply).toFixed(2)
                                        let collectionBanner = collectionData.collections[0].banner

                                        //On push dans le tableau pour trier
                                        let unity = {}

                                        unity.selectedCollection = selectedCollection
                                        unity.collectionName = collectionName
                                        unity.collectionTwitter = collectionTwitter
                                        unity.collectionWebsite = collectionWebsite
                                        unity.collectionSlug = collectionSlug
                                        unity.collectionFloor = collectionFloor
                                        unity.totalVolume1D = totalVolume1D
                                        unity.collectionOwners = collectionOwners
                                        unity.collectionListingRatio = collectionListingRatio
                                        unity.collectionBanner = collectionBanner

                                        watchlistBaseTable.push(unity)




                                    })
                                promises.push(promise);

                            }

                            await Promise.all(promises);

                            watchlistBaseTable.sort((a, b) => b.totalVolume1D - a.totalVolume1D);


                            for (const collection of watchlistBaseTable) {


                                let collectionName = collection.collectionName
                                let selectedCollection = collection.selectedCollection
                                let collectionTwitter = collection.collectionTwitter
                                let collectionWebsite = collection.collectionWebsite
                                let collectionSlug = collection.collectionSlug
                                let collectionFloor = collection.collectionFloor
                                let totalVolume1D = collection.totalVolume1D
                                let collectionOwners = collection.collectionOwners
                                let collectionListingRatio = collection.collectionListingRatio
                                let collectionBanner = collection.collectionBanner

                                setWatchlist.addFields(
                                    { name: collectionName + " (" + collectionSlug + ") ", value: "`Floor: " + collectionFloor.toFixed(3) + "Ξ ∙ 1D Vol: " + totalVolume1D.toFixed(2) + "Ξ ∙ Owners: " + Intl.NumberFormat('en-US').format(parseFloat(collectionOwners).toFixed(0)) + " ∙ Listed: " + collectionListingRatio + "%`\n[magically](https://magically.gg/collection/" + selectedCollection + ") ∙ " + '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + selectedCollection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + selectedCollection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ") ∙ " + '[website](' + collectionWebsite + ")", inline: false },
                                )


                            }

                            console.log(watchlistBaseTable)


                            //On fait le call à la base SQL
                            await interactionData.destroy({ where: { authorId: authorId, commandName: "getwatchlist-eth", serverId: serverId } })

                            await interactionData.create({

                                authorId: authorId,
                                authorName: authorName,
                                serverId: serverId,
                                commandName: "getwatchlist-eth",
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



                            await interaction.editReply({ embeds: [setWatchlist], components: [buttonRowGetWatchlist] });


                            //On enregistre le call API dans la database
                            const timeStamp = Date.now();
                            for (let i = 0; i < apiObj.getCollectionsV5; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/getwatchlist", apiCallName: "getCollectionsV5", apiProvider: "reservoir", timestamp: timeStamp.toString() }) }



                        } else if (authorWatchlist.length <= 0) {



                            const watchlistErrorEmbed = new EmbedBuilder().setColor("#060A8F")
                                .setTitle(`${authorName}'s watchlist`)
                                .setDescription("Your Ethereum watchlist is empty. You can use the command `/setwatchlist` to add a collection to your watchlist.")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                            await interaction.editReply({ embeds: [watchlistErrorEmbed], components: [buttonRowGetWatchlist2] });





                        }









                    } else if (interaction.options.getSubcommand() === 'remove') {



                         // On déclare les variables présentes dans l'exécution (Embed, conditions etc)
                         const selectedCollection = interaction.options.getString("collection").toLowerCase();


                         const selectedWatchlist = await watchlistSql.findOne({ where: { authorId: authorId, selectedCollection: selectedCollection } })
 
 
 
                         if (selectedCollection === "all") {
 
 
                             await watchlistSql.destroy({ where: { authorId: authorId } })
 
 
 
                             const removeWatchlist = new EmbedBuilder().setColor("#060A8F")
                                 .setTitle(authorName + "'s watchlist")
                                 .setDescription(`All the collections have been successfully removed from ${authorName}'s watchlist`)
                                 // .setImage(collectionBanner)
                                 .setThumbnail(userAvatar)
                                 .setAuthor({ name: authorName, iconURL: userAvatar })
                                 .setTimestamp()
                                 .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })
 
                             return await interaction.editReply({ embeds: [removeWatchlist] });
 
 
 
 
                         } if (selectedCollection !== "all") {
 
 
 
                             let collectionName = selectedWatchlist.dataValues.collectionName
 
                             await watchlistSql.destroy({ where: { authorId: authorId, selectedCollection: selectedCollection } })
 
 
 
                             const removeWatchlist = new EmbedBuilder().setColor("#060A8F")
                                 .setTitle(authorName + "'s watchlist")
                                 .setDescription("The colllection `" + collectionName + "` has been successfully removed from " + authorName + "'s watchlist")
                                 // .setImage(collectionBanner)
                                 .setThumbnail(userAvatar)
                                 .setAuthor({ name: authorName, iconURL: userAvatar })
                                 .setTimestamp()
                                                     .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });
 
                             return await interaction.editReply({ embeds: [removeWatchlist] });
 
 
 
 
                         }
 

                    }








                } else if (!member.roles.cache.has(communityMemberRoleId)) {





                    const notMember = new EmbedBuilder().setColor("#060A8F")
                        .setTitle(`Bot Access`)
                        .setDescription(">>> Showing access data")
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "Statut", value: "`Access Denied ❌`", inline: true },
                            { name: "Required Role", value: "<@&" + communityMemberRoleId + ">", inline: true },
                            { name: "Problem Detected", value: "Your access to the bot has been denied. You can only use the bot if you have the required role in this community. If you usually have access to the bot, make sure you're in the right community or contact an admin.", inline: false },
                        )
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                    await interaction.editReply({ embeds: [notMember] });

                }

            } else if (botPowerStatut.toLowerCase() === "off") {


                const botOff = new EmbedBuilder().setColor("#060A8F")
                    .setTitle(`Bot statut`)
                    .setDescription(">>> Showing the bot statut")
                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .addFields(
                        { name: 'Global Statut', value: "`Inactive 🔴`", inline: true },
                        { name: 'Commands', value: "`Not available`", inline: true },
                        { name: "Problem Detected", value: "The bot is currently inactive in this community. The community's administrator are the only who are able to switch the bot on, contact them for any inquiries.", inline: false },
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                await interaction.editReply({ embeds: [botOff] });



            }

        } else {


            const botOff = new EmbedBuilder().setColor("#060A8F")
                .setTitle(`Bot Access`)
                .setDescription(">>> Showing the community's bot access")
                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                .setAuthor({ name: authorName, iconURL: userAvatar })
                .addFields(
                    { name: 'Access Statut', value: "`Denied 🔴`", inline: true },
                    { name: 'Commands', value: "`Not available`", inline: true },
                    { name: "Problem Detected", value: "The bot access is currently inactive in this community. The community's administrator are the only one who can make it active or not, contact them for any inquiries.", inline: false },
                )
                .setTimestamp()
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

            await interaction.editReply({ embeds: [botOff] });



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
        	let reportCommand = "/watchlist"

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
        		.setFooter({ text: 'Powered by Rolls Chasers Analytics', iconURL: 'https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png' })


        	await interaction.editReply({ embeds: [errorAnswerUser], ephemeral: true });


        }

    } else if (interaction.guildId == null) {

        const errorAnswerUser = new EmbedBuilder().setColor("#060A8F")
        .setTitle("Aura")
        .setDescription(`Hey ${interaction.user.username}, we hope you're doing well !\n\nAlthough this may be possible in the future, Aura cannot be used in DM at the moment. If you want to have access to the bot, go here: <#1108757700885622784>.\n\nIf you have any questions, don't hesitate to contact one of our team member, or directly on Discord here : <#1121110417368956958>.\n\nHave a nice day 👑`)
        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
        .setTimestamp()
        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


    await interaction.reply({ embeds: [errorAnswerUser], ephemeral: true });



    }

    }
};

