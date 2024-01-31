/**
 * @file Sample getdata command with slash command.
 * @author Vitality Migø
 */



const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { profileData, accessSql, reportsql, interactionData, portfolio_nft, wallets, apimonitorsql, adminsql, usersql, sequelize, infra_coin, tracker_nft, infra_nft } = require('../../../events/database');
const moment = require('moment');

// Param d'infrastructure
const { authPrivacyMulti, communityInfos, freeAccess } = require("../../../functions/infra-utils")
const privateCMD = ['wallet', 'tracker', 'portfolio']
const excluded = ['profit']

// On récupère les nodes et API
const { reservoirA, web3CloudflarePublic, reservoirI } = require("../../../config/web3config")

// On importe les fonctions importantes
const { getEthPrice } = require('../../../config/web3data')
const decrypt = require("../../../functions/decrypt")
const isHttps = require('../../../functions/isHttps')
const { nftProfitSingle, nftProfitGlobal } = require("../../../functions/pnlcaclulator")
const { getPortfolio } = require("../../../functions/1nft-utils")
const reduceText = require("../../../functions/reducetext")

// Nodes Canvas
const { createCanvas, loadImage } = require('canvas');
const { add } = require("date-fns");


// Fonctions
function isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function formatWallet(input) {
    return input.length > 35 ? `${input.substring(0, 6)}…${input.substring(input.length - 6)}` : input;
}

function formatWallet2(input) {
    return input.length > 35 ? `${input.substring(0, 4)}…${input.substring(input.length - 4)}` : input;
}

function cutString(string) {
    stringLength = string.length
    if (stringLength > 300) {

        return string.substring(0, 300) + "..."
    } else {
        return string
    }
}




module.exports = {
    data: new SlashCommandBuilder()
        .setName("nft")
        .setDescription("NFT trading and analytics features")
        .addSubcommand(subcommand =>
            subcommand
                .setName("data")
                .setDescription("Display various data of a collection")
                .addStringOption(option =>
                    option
                        .setName("collection")
                        .setDescription("The collection's name or address")
                        .setRequired(true)
                        .setAutocomplete(true)

                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("wallet")
                .setDescription("Manage your buy and sell nft wallet")

        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("tracker")
                .setDescription("Manage your NFT wallet tracker")

        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("profit")
                .setDescription("Display your profit on a collection")
                .addStringOption(option =>
                    option
                        .setName("collection")
                        .setDescription("The collection to analyse")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addStringOption(option =>
                    option
                        .setName("wallet")
                        .setDescription("The wallet to analyse")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addStringOption(option =>
                    option
                        .setName("timelapse")
                        .setDescription("The period of time to analyse")
                        .setRequired(false)
                        .setChoices(
                            {
                                name: 'All Time',
                                value: 'All Time',
                            },
                            {
                                name: '1 Day',
                                value: '1 Day',
                            },
                            {
                                name: '3 Days',
                                value: '3 Days',
                            },
                            {
                                name: '7 Days',
                                value: '7 Days',
                            },
                            {
                                name: '14 Days',
                                value: '14 Days',
                            },
                            {
                                name: '30 Days',
                                value: '30 Days',
                            },
                            {
                                name: '90 Days',
                                value: '90 Days',
                            },
                            {
                                name: '1 Year',
                                value: '1 Year',
                            }
                        )
                ),

        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("chart")
                .setDescription("Display the chart of a collection")
                .addStringOption(option =>
                    option
                        .setName("collection")
                        .setDescription("The collection's name or address")
                        .setRequired(true)
                        .setAutocomplete(true)

                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("portfolio")
                .setDescription("Analyse and manage your portfolio")
                .addStringOption(option =>
                    option
                        .setName("wallet")
                        .setDescription("The wallet to analyse")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        ),


    async execute(interaction) {


        if (interaction.guildId != null) {


            //Récupérer informations de l'utilisateur de la commande
            let authorId = interaction.user.id;
            let authorName = interaction.user.username;
            let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
            let serverId = interaction.member.guild.id
            let member = interaction.member;
            let botId = interaction.applicationId

            const subcommand = interaction.options.getSubcommand()

            try {

                console.log("Initialization: executed ✅")

                // Récupère les infos de la communauté
                const community = await communityInfos(serverId)

                //Récupère régagle de privé/ou pas de l'utilisateur
                const privacy = await authPrivacyMulti(authorId, subcommand, privateCMD)
                if (privacy) { await interaction.deferReply({ ephemeral: true }) }
                else { await interaction.deferReply() }


                // Les vérifications
                if (community.statut) {

                    if (community.tier === 's-tier' || community.tier === 'a-tier' || freeAccess(subcommand, excluded)) {

                        if (member.roles.cache.has(community.member)) {


                            if (subcommand === "data") {





                                //Variable pour les options
                                const selectedCollection = interaction.options.getString("collection");


                                if (isValidEthereumAddress(selectedCollection)) {




                                    let collectionName = ""
                                    let collectionDescription = ""
                                    let collectionBanner = ""
                                    let collectionWebsite = ""
                                    let collectionTwitter = ""
                                    let collectionSlug = ""
                                    let collectionDate = ""
                                    let collectionFloor = 0
                                    let collectionSupply = 0
                                    let collectionOwners = 0
                                    let collectionUniqueOwners = 0
                                    let collectionTotalListings = 0
                                    let collectionRoyalties = 0
                                    let collectionRoyaltiesFormatted = 0
                                    let collectionTopBid = 0
                                    let collectionListingRatio = 0
                                    let totalVolume = 0
                                    let totalSales = 0
                                    let totalVolume1D = 0
                                    let totalSales1D = 0
                                    let collectionFloor1D = 0
                                    let floorChange1D = 0
                                    let floorChange1DFormatted = "`" + 0 + "%" + "`"
                                    let collectionMarketCap = 0
                                    let ethPriceUsd = 0
                                    let totalVolume7D = 0
                                    let totalSales7D = 0
                                    let collectionFloor7D = 0
                                    let floorChange7D = 0
                                    let floorChange7DFormatted = "`" + 0 + "%" + "`"
                                    let totalVolume30D = 0
                                    let totalSales30D = 0
                                    let collectionFloor30D = 0
                                    let floorChange30D = 0
                                    let floorChange30DFormatted = "`" + 0 + "%" + "`"
                                    let roiPrefix = ""
                                    let roiSuffix = ""
                                    let roiPrefix7 = ""
                                    let roiSuffix7 = ""
                                    let roiPrefix30 = ""
                                    let roiSuffix30 = ""




                                    // Premier Call API Reservoir : Stats et infos sur la collection
                                    reservoirA.getCollectionsV5({ id: selectedCollection, accept: '*/*', includeTopBid: 'true', includeOwnerCount: 'true', includeSalesCount: 'true' })
                                        .then(async ({ data: collectionData }) => {


                                            const ethPriceUsd = getEthPrice()



                                            // if (collectionData.collections[0].lenght > 0) {

                                            collectionName = collectionData.collections[0].name
                                            collectionDescription = collectionData.collections[0].description
                                            collectionTwitter = collectionData.collections[0].twitterUsername
                                            collectionWebsite = collectionData.collections[0].externalUrl
                                            collectionBanner = collectionData.collections[0].banner
                                            collectionSlug = collectionData.collections[0].slug
                                            collectionDate = collectionData.collections[0].createdAt
                                            collectionRoyalties = collectionData.collections[0].royalties.bps
                                            collectionRoyaltiesFormatted = parseFloat(collectionRoyalties / 100 + 0.5).toFixed(2) + "%"
                                            collectionSupply = collectionData.collections[0].tokenCount
                                            collectionTotalListings = collectionData.collections[0].onSaleCount
                                            collectionListingRatio = parseFloat((collectionTotalListings * 100) / collectionSupply).toFixed(3)
                                            collectionTopBid = collectionData.collections[0].topBid.price.amount.decimal
                                            collectionFloor = collectionData.collections[0].floorAsk.price.amount.decimal
                                            collectionOwners = collectionData.collections[0].ownerCount
                                            collectionUniqueOwners = parseFloat((collectionOwners * 100) / collectionSupply).toFixed(2) + "%"
                                            totalVolume = collectionData.collections[0].volume.allTime
                                            totalSales = collectionData.collections[0].salesCount.allTime
                                            totalVolume1D = collectionData.collections[0].volume["1day"]
                                            totalSales1D = collectionData.collections[0].salesCount["1day"]
                                            collectionFloor1D = collectionData.collections[0].floorSale["1day"]
                                            floorChange1D = parseFloat(((collectionFloor - collectionFloor1D) / collectionFloor1D) * 100)
                                            collectionMarketCap = collectionFloor * collectionSupply
                                            totalVolume7D = collectionData.collections[0].volume["7day"]
                                            totalSales7D = collectionData.collections[0].salesCount["7day"]
                                            collectionFloor7D = collectionData.collections[0].floorSale["7day"]
                                            floorChange7D = parseFloat(((collectionFloor - collectionFloor7D) / collectionFloor7D) * 100)
                                            totalVolume30D = collectionData.collections[0].volume["30day"]
                                            totalSales30D = collectionData.collections[0].salesCount["30day"]
                                            collectionFloor30D = collectionData.collections[0].floorSale["30day"]
                                            floorChange30D = parseFloat(((collectionFloor - collectionFloor30D) / collectionFloor30D) * 100)






                                            //  }


                                            // Mise en forme 1D Change
                                            if (floorChange1D !== 0 && collectionFloor) {

                                                if (floorChange1D > 0) { roiPrefix = "+"; roiSuffix = "📈"; } else if (floorChange1D < 0) { roiSuffix = "📉"; } floorChange1DFormatted = "`" + roiPrefix + parseFloat(floorChange1D).toFixed(2) + "% " + roiSuffix + "`"

                                                // if (floorChange1D > 0) { roiPrefix = "+"; roiSuffix = " :chart_with_upwards_trend:"; } else if (floorChange1D < 0) { roiSuffix = " :chart_with_downwards_trend:"; } floorChange1DFormatted = "`" + roiPrefix + parseFloat(floorChange1D).toFixed(2) + "% (" + ((collectionFloor1D - collectionFloor) * ethPriceUsd).toFixed(0) +  "$)`";

                                            } else if (floorChange1D === 0 || floorChange1D === "NaN") { floorChange1DFormatted = "`0.00%`" } else if (floorChange1D === "N/A") { floorChange1DFormatted = "'N/A'" }


                                            // Mise en forme 7D Change
                                            if (floorChange7D !== 0 && collectionFloor) {

                                                if (floorChange7D > 0) { roiPrefix7 = "+"; roiSuffix7 = "📈"; } else if (floorChange7D < 0) { roiSuffix7 = "📉"; } floorChange7DFormatted = "`" + roiPrefix7 + parseFloat(floorChange7D).toFixed(2) + "% " + roiSuffix7 + "`"

                                            } else if (floorChange7D === 0 || floorChange7D === "NaN") { floorChange7DFormatted = "`0.00%`" } else if (floorChange7D === "N/A") { floorChange7DFormatted = "'N/A'" }


                                            // Mise en forme 7D Change
                                            if (floorChange30D !== 0 && collectionFloor) {

                                                if (floorChange30D > 0) { roiPrefix30 = "+"; roiSuffix30 = "📈"; } else if (floorChange30D < 0) { roiSuffix30 = "📉"; } floorChange30DFormatted = "`" + roiPrefix30 + parseFloat(floorChange30D).toFixed(2) + "% " + roiSuffix30 + "`"

                                            } else if (floorChange30D === 0 || floorChange30D === "NaN") { floorChange30DFormatted = "`0.00%`" } else if (floorChange30D === "N/A") { floorChange30DFormatted = "'N/A'" }


                                            ////////////////////////////////////////////////////////   FAIRE LES ARRONDIS ////////////////////////////////////////////////////////





                                            const date = new Date(collectionDate);
                                            //const dateLisible = date.toLocaleString();

                                            const dateLisible = date.toLocaleDateString("fr-FR", {
                                                day: "numeric",
                                                month: "numeric",
                                                year: "numeric",
                                            });


                                            let linksFormatted = ""
                                            if (isHttps(collectionWebsite) && collectionTwitter !== null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + selectedCollection + ") ∙ " + '[magically](https://magically.gg/collection/' + selectedCollection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + selectedCollection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ") ∙ " + '[website](' + collectionWebsite + ")" }
                                            else if (!isHttps(collectionWebsite) && collectionTwitter !== null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + selectedCollection + ") ∙ " + '[magically](https://magically.gg/collection/' + selectedCollection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + selectedCollection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ")" }
                                            else if (isHttps(collectionWebsite) && collectionTwitter == null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + selectedCollection + ") ∙ " + '[magically](https://magically.gg/collection/' + selectedCollection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + selectedCollection + ") ∙ " + '[website](' + collectionWebsite + ")" }
                                            else { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + selectedCollection + ") ∙ " + '[magically](https://magically.gg/collection/' + selectedCollection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + selectedCollection + ")" }



                                            const buttonRow = new ActionRowBuilder()
                                                .addComponents(
                                                    new ButtonBuilder()
                                                        .setCustomId('button_nft_exec_buy_' + selectedCollection)
                                                        .setLabel('📈 Buy')
                                                        .setStyle(3),
                                                    new ButtonBuilder()
                                                        .setCustomId('button_nft_exec_sweep_' + selectedCollection)
                                                        .setLabel('🧹 Sweep')
                                                        .setStyle(3),
                                                    new ButtonBuilder()
                                                        .setCustomId('button_nft_exec_list_' + selectedCollection)
                                                        .setLabel('📉 List')
                                                        .setStyle(4),
                                                    new ButtonBuilder()
                                                        .setCustomId('button_nft_exec_bulklist_' + selectedCollection)
                                                        .setLabel('❄️ Bulk List')
                                                        .setStyle(4),
                                                    new ButtonBuilder()
                                                        .setCustomId('button_nft_tradepanel_setup')
                                                        .setLabel('💻 Setup')
                                                        .setStyle(1),

                                                )

                                            const buttonRow1 = new ActionRowBuilder()
                                                .addComponents(
                                                    new ButtonBuilder()
                                                        .setCustomId('button_nft_exec_newbid_' + selectedCollection)
                                                        .setLabel('✨ New Bid')
                                                        .setStyle(3),
                                                    new ButtonBuilder()
                                                        .setCustomId('button_nft_exec_snipe_' + selectedCollection)
                                                        .setLabel('🔫 Snipe')
                                                        .setStyle(3),
                                                    new ButtonBuilder()
                                                        .setCustomId('button_nft_exec_acceptbid_' + selectedCollection)
                                                        .setLabel('🤝 Accept Bid')
                                                        .setStyle(4),
                                                    new ButtonBuilder()
                                                        .setCustomId('button_nft_exec_transfer_' + selectedCollection)
                                                        .setLabel('📤 Transfer')
                                                        .setStyle(4),

                                                )


                                            const buttonRow2 = new ActionRowBuilder()
                                                .addComponents(
                                                    new ButtonBuilder()
                                                        .setCustomId('button_nft_tradepanel_refresh_' + selectedCollection)
                                                        .setLabel('🔄 Refresh')
                                                        .setStyle(1),
                                                    new ButtonBuilder()
                                                        .setCustomId('nft_infra_tradepanel_help-button')
                                                        .setLabel('📑 Tutorial')
                                                        .setStyle(1),
                                                    new ButtonBuilder()
                                                        .setCustomId('button_nft_tradepanel_listingDepth_' + selectedCollection)
                                                        .setLabel('📊 Listings')
                                                        .setStyle(1),
                                                    new ButtonBuilder()
                                                        .setCustomId('button_nft_tradepanel_bidsDepth_' + selectedCollection)
                                                        .setLabel('👨🏽‍⚖️ Bids')
                                                        .setStyle(1),
                                                    new ButtonBuilder()
                                                        .setCustomId('button_nft_tradepanel_chart_' + selectedCollection)
                                                        .setLabel('🔮 Chart')
                                                        .setStyle(1),

                                                )


                                            //"]

                                            const links = createLink(collectionSlug, selectedCollection, collectionTwitter, collectionWebsite)


                                            if (!isHttps(collectionBanner)) {
                                                collectionBanner = "https://cdn.discordapp.com/attachments/1100572519896977490/1185619758008254474/e.png?ex=65904572&is=657dd072&hm=7a51469cad88b48198c5f230d13450d50c7e2717c5acdf97a82a6eb1fb5adad4&"
                                            }

                                            if (collectionDescription) {
                                                collectionDescription = cutString(collectionDescription)
                                            } else {
                                                collectionDescription = ">>> Showing collection metrics"
                                            }


                                            const getDataCollectionAddress = new EmbedBuilder().setColor("#060A8F")
                                                .setTitle(collectionName)
                                                .setDescription(collectionDescription)
                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                .setImage(collectionBanner)
                                                .addFields(
                                                    { name: "Floor Price", value: "`" + collectionFloor.toFixed(3) + "Ξ (" + Intl.NumberFormat('en-US').format((ethPriceUsd * collectionFloor).toFixed(0)) + "$)`", inline: true },
                                                    { name: "Total Owners", value: "`" + collectionOwners + "`", inline: true },
                                                    { name: "Total Listing", value: "`" + collectionTotalListings + "`", inline: true },
                                                    { name: "Unique Owners", value: "`" + collectionUniqueOwners + "`", inline: true },
                                                    { name: "Total Supply", value: "`" + collectionSupply + "`", inline: true },
                                                    { name: "Listing Ratio", value: "`" + collectionListingRatio + "%`", inline: true },
                                                    { name: "Top Bid", value: "`" + collectionTopBid.toFixed(3) + "Ξ (" + Intl.NumberFormat('en-US').format((ethPriceUsd * collectionTopBid).toFixed(0)) + "$)`", inline: true },
                                                    { name: "Total Volume", value: "`" + totalVolume.toFixed(3) + "Ξ (" + Intl.NumberFormat('en-US').format((ethPriceUsd * totalVolume).toFixed(0)) + "$)`", inline: true },
                                                    { name: "Total Sales", value: "`" + totalSales + "`", inline: true },
                                                    { name: "1D Volume", value: "`" + totalVolume1D.toFixed(3) + "Ξ (" + Intl.NumberFormat('en-US').format((ethPriceUsd * totalVolume1D).toFixed(0)) + "$)`", inline: true },
                                                    { name: "1D Floor Change", value: floorChange1DFormatted, inline: true },
                                                    { name: "1D Sales", value: "`" + totalSales1D + "`", inline: true },
                                                    { name: "7D Volume", value: "`" + totalVolume7D.toFixed(3) + "Ξ (" + Intl.NumberFormat('en-US').format((ethPriceUsd * totalVolume7D).toFixed(0)) + "$)`", inline: true },
                                                    { name: "7D Floor Change", value: floorChange7DFormatted, inline: true },
                                                    { name: "7D Sales", value: "`" + totalSales7D + "`", inline: true },
                                                    { name: "30D Volume", value: "`" + totalVolume30D.toFixed(3) + "Ξ (" + Intl.NumberFormat('en-US').format((ethPriceUsd * totalVolume7D).toFixed(0)) + "$)`", inline: true },
                                                    { name: "30D Floor Change", value: floorChange30DFormatted, inline: true },
                                                    { name: "30D Sales", value: "`" + totalSales30D + "`", inline: true },
                                                    //  { name: "Listing Wall", value: "`" + listingWallFormatted + "`", inline: true },
                                                    //  { name: "Bid Support", value: "`" + bidSupportFormatted + "`", inline: true },
                                                    //  { name: "Volatility Range", value: "`" + moveRange + "Ξ`", inline: true },
                                                    { name: "Market Cap", value: "`" + collectionMarketCap.toFixed(3) + "Ξ (" + Intl.NumberFormat('en-US').format((ethPriceUsd * collectionMarketCap).toFixed(0)) + "$)`", inline: true },
                                                    { name: "Creation Date", value: "`" + dateLisible + "`", inline: true },
                                                    { name: "Royalties", value: "`" + collectionRoyaltiesFormatted + "`", inline: true },
                                                    { name: "Links", value: links, inline: true },


                                                )
                                                .setTimestamp()
                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                            await interaction.editReply({ embeds: [getDataCollectionAddress], components: [buttonRow, buttonRow1, buttonRow2] });




                                        })




                                } else {

                                    // Il y'a un problème dans la séléction des collections

                                    const setwalletErrorEmbed = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle(`Invalid Collection`)
                                        .setDescription("The NFT collection you provided isn't a valid Ethereum contract address. Please try again using the appropriate form.")
                                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                    await interaction.editReply({ embeds: [setwalletErrorEmbed] });


                                }

                            } else if (subcommand === 'wallet') {




                                const buttonsRowNew = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('button_infra_nft_walletsetup_import')
                                            .setLabel('import wallet')
                                            .setStyle(1),
                                        new ButtonBuilder()
                                            .setCustomId('button_infra_nft_walletsetup_generate')
                                            .setLabel('generate wallet')
                                            .setStyle(3),

                                    );


                                const buttonsRowModify = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('button_infra_nft_walletsetup_import')
                                            .setLabel('modify wallet')
                                            .setStyle(1),
                                        new ButtonBuilder()
                                            .setCustomId('button_infra_nft_walletsetup_export')
                                            .setLabel('export')
                                            .setStyle(1),
                                        new ButtonBuilder()
                                            .setCustomId('button_infra_nft_walletsetup_delete')
                                            .setLabel('delete wallet')
                                            .setStyle(4)
                                    );

                                const buttonsRowConfig = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('button_infra_nft_walletsetup_gaspreset')
                                            .setLabel('Set Gas Preset')
                                            .setStyle(2),
                                        new ButtonBuilder()
                                            .setCustomId('button_infra_nft_walletsetup_maxgwei')
                                            .setLabel('Set Max Gwei')
                                            .setStyle(2),
                                        new ButtonBuilder()
                                            .setCustomId('button_infra_nft_walletsetup_apemode')
                                            .setLabel('Set Ape Mode')
                                            .setStyle(2),
                                        // new ButtonBuilder()
                                        //     .setCustomId('button_infra_coin_walletsetup_autoapproval')
                                        //     .setLabel('Set Auto Approval')
                                        //     .setStyle(2),
                                    );






                                const userSetup = await infra_nft.findOne({ where: { authorId: authorId } })

                                if (userSetup != null) {


                                    const walletAddress = decrypt(userSetup.dataValues.walletAddress)


                                    let gasPreset = userSetup.dataValues.gas_preset
                                    let max_gwei = userSetup.dataValues.max_gwei

                                    let ape_mode = userSetup.dataValues.ape_mode

                                    if (gasPreset == null) { gasPreset = "Auto" } else { gasPreset = "+" + parseFloat(gasPreset).toFixed(0) + "%" }
                                    if (max_gwei == null) { max_gwei = "Auto" } else { max_gwei = parseFloat(max_gwei).toFixed(0) + " gwei" }

                                    if (ape_mode == "true") { ape_mode = "✅" } else { ape_mode = "❌" }

                                    const balance = await web3CloudflarePublic.eth.getBalance(walletAddress) / 10 ** 18

                                    const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle("NFT Setup")
                                        .setDescription(">>> Displaying your coin wallet setup")
                                        .setImage('https://cdn.discordapp.com/attachments/949291624389816334/1122703923950665848/Pallette_8.png')
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .addFields(
                                            { name: "Wallet:", value: "`" + walletAddress.toLowerCase() + "`\n∟ Balance: " + parseFloat(balance).toFixed(3) + "Ξ", inline: true },
                                            { name: " ", value: " ", inline: false },
                                            { name: "Default Gas:", value: "`" + gasPreset + "`", inline: true },
                                            { name: "Default Max Gwei:", value: "`" + max_gwei + "`", inline: true },
                                            { name: "Ape Mode", value: "`" + ape_mode + "`", inline: true },
                                            { name: " ", value: " ", inline: false },
                                        )
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                    await interaction.editReply({ embeds: [errorNotEthereum], components: [buttonsRowModify, buttonsRowConfig], ephemeral: true });


                                } else if (userSetup == null) {




                                    const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle("NFT Setup")
                                        .setDescription(">>> Displaying your coin wallet setup")
                                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .addFields(
                                            { name: " ", value: "You don't have a wallet imported in your coin portfolio. To get started, use the button below.", inline: true },

                                        )
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                    await interaction.editReply({ embeds: [errorNotEthereum], components: [buttonsRowNew], ephemeral: true });


                                }







                            } else if (subcommand === 'tracker') {


                                const buttonsRow = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('button_nft_infra_tracker_add')
                                            .setLabel('Add Addresses')
                                            .setStyle(3),
                                        new ButtonBuilder()
                                            .setCustomId('button_nft_infra_tracker_remove')
                                            .setLabel('Remove Address')
                                            .setStyle(1),
                                        new ButtonBuilder()
                                            .setCustomId('button_nft_infra_tracker_reset')
                                            .setLabel('Reset')
                                            .setStyle(1),

                                    );






                                const userList = await tracker_nft.findAll({ where: { authorId: authorId } })

                                let addressFormatted = ""
                                const maxAddress = 15
                                const spotLeft = maxAddress - userList.length


                                if (userList.length > 0) {

                                    const userListSliced = userList.slice(0, 16)
                                    addressFormatted = userListSliced.map(item => item.dataValues.address).join("\n")



                                } else {

                                    addressFormatted = "No tracked address found in your profile             "

                                }


                                const botOff = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle(`NFT Tracker`)
                                    .setDescription(">>> Displaying your NFT wallet tracker")
                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .addFields(
                                        { name: " ", value: " ", inline: false },
                                        { name: "Address Count", value: "`" + userList.length + "`", inline: true },
                                        { name: "Spots Left", value: "`" + spotLeft + "`", inline: true },
                                        { name: " ", value: " ", inline: false },
                                        { name: "Address Tracked:", value: "```\n" + addressFormatted + "                                  ```", inline: false },
                                    )
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setTimestamp()
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });


                                await interaction.editReply({ embeds: [botOff], components: [buttonsRow] });



                            } else if (subcommand === 'profit') {


                                // On ajoute le boutton
                                const visualBTN = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('profitvisual-button')
                                            .setLabel('visual')
                                            .setStyle(2)
                                    );


                                //Variable pour les options
                                const wallet = interaction.options.getString("wallet").toLowerCase()
                                const contract = interaction.options.getString("collection").toLowerCase()
                                const time = interaction.options.getString("timelapse");



                                if (isValidEthereumAddress(contract)) {
                                    // Une seule collection a été séléctionner


                                    if (isValidEthereumAddress(wallet)) {
                                        // Un seul wallet séléctionné



                                        const data = await nftProfitSingle(contract, wallet, time)

                                        if (data) {

                                            // On sépare les data entre le raw et le prettier
                                            // Les raw sont les data non traité
                                            // Les prettier sont pour l'embed
                                            const raw = data.raw
                                            const prettier = data.prettier
                                            const collection = data.collection

                                            // On vérifie que la bannière est valide
                                            // Sinon on remplace par la bannière d'Aura
                                            if (!isHttps(collection.banner)) {
                                                collection.banner = 'https://cdn.discordapp.com/attachments/1100572519896977490/1185619758008254474/e.png?ex=65904572&is=657dd072&hm=7a51469cad88b48198c5f230d13450d50c7e2717c5acdf97a82a6eb1fb5adad4&'
                                            }

                                            //Embed getRCprofitPrecisedAll
                                            const answer = new EmbedBuilder().setColor("#060A8F")
                                                .setTitle(collection.name)
                                                .setDescription(">>> Displaying the P&L made by `" + formatWallet2(wallet) + "`")
                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                .setImage(collection.banner)
                                                .addFields(
                                                    { name: "Mint Value:", value: "`" + prettier.mintValue + "`", inline: true },
                                                    { name: "Mint Gas:", value: "`" + prettier.mintGas + "`", inline: true },
                                                    { name: "Mint Total:", value: "`" + prettier.mintTotal + "`", inline: true },

                                                    { name: "Buy Value:", value: "`" + prettier.buyValue + "`", inline: true },
                                                    { name: "Buy Gas:", value: "`" + prettier.buyGas + "`", inline: true },
                                                    { name: "Buy Total:", value: "`" + prettier.buyTotal + "`", inline: true },

                                                    { name: "Sales Value:", value: "`" + prettier.sellValue + "`", inline: true },
                                                    { name: "Sales Gas:", value: "`" + prettier.sellGas + "`", inline: true },
                                                    { name: "Sales Total:", value: "`" + prettier.sellTotal + "`", inline: true },

                                                    { name: "Tokens Minted:", value: "`" + prettier.mint + "`", inline: true },
                                                    { name: "Tokens Bought:", value: "`" + prettier.buy + "`", inline: true },
                                                    { name: "Airdrop & Transfer:", value: "`" + prettier.airdrop + "`", inline: true },

                                                    { name: "Tokens Sold:", value: "`" + prettier.sell + "`", inline: true },
                                                    { name: "Tokens Held:", value: "`" + prettier.held + "`", inline: true },
                                                    { name: "Transactions:", value: "`" + prettier.txs + "`", inline: true },

                                                    { name: "Avg Mint Value:", value: "`" + prettier.avgMint + "`", inline: true },
                                                    { name: "Avg Buy Value:", value: "`" + prettier.avgBuy + "`", inline: true },
                                                    { name: "Avg Spent Value:", value: "`" + prettier.avgTotal + "`", inline: true },

                                                    { name: "Avg Sold Value:", value: "`" + prettier.avgSold + "`", inline: true },
                                                    { name: "Avg Held Value:", value: "`" + prettier.avgHeld + "`", inline: true },
                                                    { name: "Avg Gas Value:", value: "`" + prettier.avgGas + "`", inline: true },

                                                    { name: "Current P&L:", value: "`" + prettier.realisedPNL + "`", inline: true },
                                                    { name: "Potential P&L:", value: "`" + prettier.potentialPNL + "`", inline: true },
                                                    { name: "ROI:", value: "`" + prettier.potentialROI + "`", inline: true },

                                                    { name: "Links", value: '[opensea](https://opensea.io/collection/' + collection.slug + ") ∙ " + '[blur](https://blur.io/collection/' + contract + ") ∙ " + '[magically](https://magically.gg/collection/' + contract + ") ∙ " + '[nerds](https://app.nftnerds.ai/collection/' + contract + ") ∙ " + '[etherscan](https://etherscan.io/address/' + contract + ')', inline: false },
                                                )
                                                .setTimestamp()
                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                            await interaction.editReply({ embeds: [answer], components: [visualBTN] });


                                            // On enregistre les informations dans la base SQL
                                            // L'interaction sera récupéré pour générer le visuel de profit
                                            await interactionData.destroy({ where: { authorId: authorId, commandName: "profit", serverId: serverId } })

                                            await interactionData.create({

                                                authorId: authorId,
                                                authorName: authorName,
                                                serverId: serverId,
                                                commandName: "profit",
                                                interactionId: interaction.id,
                                                walletCategory: "eth",
                                                selectedCollection: collection.contract,
                                                floorPrice: collection.floor.toString(),
                                                collectionName: collection.name,
                                                mintCount: raw.mint.toString(),
                                                buyCount: raw.buy.toString(),
                                                soldCount: raw.sell.toString(),
                                                remaining: raw.held.toString(),
                                                avgBuy: parseFloat(raw.avgTotal).toFixed(3),
                                                avgSold: parseFloat(raw.avgSold).toFixed(3),
                                                realisedProfit: parseFloat(raw.realisedPNL).toFixed(3),
                                                potentialProfit: parseFloat(raw.potentialPNL).toFixed(3),
                                                roi: raw.potentialROI.toString(),
                                                totalTradeCount: JSON.stringify({
                                                    buy: (raw.buyTotal + raw.mintTotal).toString(),
                                                    sell: raw.sellTotal.toString(),
                                                }),
                                                userAvatar: userAvatar,
                                            })




                                        } else {
                                            // Si il y'a une erreur lors de l'analyse des data

                                            const notMember = new EmbedBuilder().setColor("#060A8F")
                                                .setTitle(`NFT Profit`)
                                                .setDescription("Aura can't analyze your wallet's profit data. Please try again or contact our team if the error persists.")
                                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                .setTimestamp()
                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                            await interaction.editReply({ embeds: [notMember] });



                                        }








                                    } else if (wallet === "all") {
                                        // Tous les wallets séléctionnés


                                        const setwalletErrorEmbed = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle(`Not available`)
                                            .setDescription("We are currently optimising this feature. You can still use NFT profit on a **single** wallet with `/nft profit`.")
                                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                        await interaction.editReply({ embeds: [setwalletErrorEmbed] });


                                    } else {
                                        // Problème dans la séléction du wallet

                                        const notMember = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle(`NFT Profit`)
                                            .setDescription("Aura can't analyze your wallet's data because the wallet you provided isn't an Ethereum wallet. Please use try again using the appropriate form.")
                                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                        await interaction.editReply({ embeds: [notMember] });


                                    }


                                } else if (contract === "all") {
                                    // Toute les collections ont été séléctionner



                                    if (isValidEthereumAddress(wallet)) {



                                        const data = await nftProfitGlobal(wallet)

                                        if (data) {

                                            const raw = data.raw
                                            const prettier = data.prettier
                                            const user = data.user




                                            //Embed getRCprofitPrecisedAll
                                            const getprofitOneWalletOneCollection = new EmbedBuilder().setColor("#060A8F")
                                                .setTitle(`Global Profits`)
                                                .setDescription(">>> Displaying the global P&L of `" + formatWallet2(wallet) + "`")
                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                .setImage("https://cdn.discordapp.com/attachments/1100572519896977490/1185619758008254474/e.png?ex=65904572&is=657dd072&hm=7a51469cad88b48198c5f230d13450d50c7e2717c5acdf97a82a6eb1fb5adad4&")
                                                .addFields(
                                                    { name: "Address: ", value: "`" + wallet + "`", inline: false },

                                                    { name: "Buy Value:", value: "`" + prettier.buyValue + "`", inline: true },
                                                    { name: "Sales Value:", value: "`" + prettier.sellValue + "`", inline: true },
                                                    { name: "Held Value:", value: "`" + prettier.heldValue + "`", inline: true },

                                                    { name: "Tokens Minted:", value: "`" + prettier.mint + "`", inline: true },
                                                    { name: "Tokens Bought:", value: "`" + prettier.buy + "`", inline: true },
                                                    { name: "Airdrop & Transfer:", value: "`" + prettier.airdrop + "`", inline: true },

                                                    { name: "Tokens Sold:", value: "`" + prettier.sell + "`", inline: true },
                                                    { name: "Tokens Held:", value: "`" + prettier.held + "`", inline: true },
                                                    { name: "Tokens Traded:", value: "`" + prettier.trade + "`", inline: true },

                                                    { name: "Avg. Spent Value:", value: "`" + prettier.avgBuy + "`", inline: true },
                                                    { name: "Avg. Sold Value:", value: "`" + prettier.avgSold + "`", inline: true },
                                                    { name: "Avg. Held Value:", value: "`" + prettier.avgHeld + "`", inline: true },

                                                    { name: "Gas Costs:", value: "`" + prettier.gasCost + "`", inline: true },
                                                    { name: "Royalties:", value: "`" + prettier.royalties + "`", inline: true },
                                                    { name: " ", value: " ", inline: true },

                                                    { name: "Current P&L:", value: "`" + prettier.realisedPNL + "`", inline: true },
                                                    { name: "Current ROI:", value: "`" + prettier.realisedROI + "`", inline: true },
                                                    { name: " ", value: " ", inline: true },

                                                    { name: "Potential P&L:", value: "`" + prettier.potentialPNL + "`", inline: true },
                                                    { name: "Potential ROI:", value: "`" + prettier.potentialROI + "`", inline: true },
                                                    { name: " ", value: " ", inline: true },

                                                    { name: "Links", value: '[opensea](https://opensea.io/' + wallet + ") ∙ " + '[blur](https://blur.io/' + wallet + ") ∙ " + '[nansen](https://app.nansen.ai/profiler?address=' + wallet + ") ∙ " + '[opensea pro](https://pro.opensea.io/profile/' + contract + ") ∙ " + '[etherscan](https://etherscan.io/address/' + wallet + ')', inline: false },

                                                )
                                                .setTimestamp()
                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                            await interaction.editReply({ embeds: [getprofitOneWalletOneCollection], components: [visualBTN] });


                                            // Enregistrerment de l'intéraction dans la base de données
                                            // Cette interaction est récupéré pour générer le visuel.
                                            await interactionData.destroy({ where: { authorId: authorId, commandName: "profit", serverId: serverId } })

                                            await interactionData.create({

                                                authorId: authorId,
                                                authorName: authorName,
                                                serverId: serverId,
                                                commandName: "profit",
                                                interactionId: interaction.id,
                                                walletCategory: "eth",
                                                selectedCollection: "All",
                                                floorPrice: raw.avgHeld.toString(),
                                                collectionName: "All Collections",
                                                mintCount: raw.mint.toString(),
                                                buyCount: raw.buy.toString(),
                                                soldCount: raw.sell.toString(),
                                                remaining: raw.held.toString(),
                                                avgBuy: parseFloat(raw.avgBuy).toFixed(3),
                                                avgSold: parseFloat(raw.avgSold).toFixed(3),
                                                realisedProfit: parseFloat(raw.realisedPNL).toFixed(3),
                                                potentialProfit: parseFloat(raw.potentialPNL).toFixed(3),
                                                roi: raw.potentialROI.toString(),
                                                userAvatar: userAvatar,
                                            })

                                        } else {
                                            // Si il y'a une erreur lors de l'analyse des data

                                            const notMember = new EmbedBuilder().setColor("#060A8F")
                                                .setTitle(`NFT Profit`)
                                                .setDescription("Aura can't analyze your wallet's profit data. Please try again or contact our team if the error persists.")
                                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                .setTimestamp()
                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                            await interaction.editReply({ embeds: [notMember] });

                                        }


                                    } else if (wallet === "all") {
                                        // Tous les wallets séléctionnés


                                        const setwalletErrorEmbed = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle(`Not available`)
                                            .setDescription("We are currently optimising this feature. You can still use NFT profit on a **single** wallet with `/nft profit`.")
                                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                        await interaction.editReply({ embeds: [setwalletErrorEmbed] });


                                    } else {
                                        // Problème dans la séléction du wallet

                                        const notMember = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle(`NFT Profit`)
                                            .setDescription("Aura can't analyze your wallet's data because the wallet you provided isn't an Ethereum wallet. Please use try again using the appropriate form.")
                                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                        await interaction.editReply({ embeds: [notMember] });


                                    }





                                } else {
                                    // Il y'a un problème dans la séléction des collections

                                    const setwalletErrorEmbed = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle(`Invalid Collection`)
                                        .setDescription("The NFT collection you provided isn't a valid Ethereum contract address. Please try again using the appropriate form.")
                                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                    await interaction.editReply({ embeds: [setwalletErrorEmbed] });


                                }



                            } else if (subcommand === 'chart') {

                                // On commence par envoyer l'embed de chargement
                                const errorAnswerUser = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Loading Chart...")
                                    .setDescription("Aura is currently building your chart, wait a second <a:AuraLoading:1134068847616458792>")
                                    .setTimestamp()
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                                await interaction.editReply({ embeds: [errorAnswerUser], ephemeral: true });



                                //Variable pour les options
                                const contract = interaction.options.getString("collection").toLowerCase()


                                let sales

                                await reservoirI.getSalesV6({
                                    contract: contract,
                                    includeTokenMetadata: 'true',
                                    includeDeleted: 'false',
                                    sortBy: 'time',
                                    sortDirection: 'desc',
                                    limit: '1000',
                                    accept: '*/*'
                                })
                                    .then(({ data }) =>
                                        sales = data.sales.reverse().map(item => ({
                                            price: item.price.amount.decimal,
                                            timestamp: item.timestamp - data.sales[0].timestamp,
                                            origin: item.timestamp,
                                            collection: item.token.collection.name
                                        })))
                                    .catch(err => console.error(err));



                                // Filtrer les "sales rares" en comparant la moyenne des 5 autour de chaque vente
                                const filteredSales = sales.filter((sale, i) => {
                                    const average = calculateAverage(sales, i, 10);
                                    const threshold = 1.25; // Changer cela selon votre critère (20% de plus, par exemple)
                                    const thresholdLow = 0.85; // Changer cela selon votre critère (20% de plus, par exemple)
                                    return sale.price <= threshold * average && sale.price >= thresholdLow * average;
                                });

                                // Trouver la plus petite et la plus grande valeur pour la propriété 'price'
                                const { minPrice, maxPrice } = filteredSales.reduce((acc, curr) => {
                                    const price = curr.price

                                    // Trouver la plus petite valeur
                                    acc.minPrice = Math.min(acc.minPrice, price);

                                    // Trouver la plus grande valeur
                                    acc.maxPrice = Math.max(acc.maxPrice, price);

                                    return acc;
                                }, { minPrice: Infinity, maxPrice: -Infinity });


                                // Maintenant il faut 
                                //   const upGap = maxPrice * xxx

                                // Dessiner
                                const canvas = createCanvas(1200, 700);
                                const ctx = canvas.getContext('2d');

                                // // Définir le fond noir
                                // ctx.fillStyle = '#0A0A0A'; // #000 représente le code hexadécimal pour le noir
                                //  ctx.fillRect(0, 0, canvas.width, canvas.height);
                                const background = await loadImage("./visual/aura/permanent/chart.png");
                                ctx.drawImage(background, 0, 0, canvas.width, canvas.height); // Ajouter l'image de fond au canvas

                                // // Filtrer les données selon votre critère
                                // const filteredSalesData = salesData.filter(sale => sale.price < 1);

                                // Activer l'effet de goutte de lumière pour les contours des cercles
                                const leftMargin = 45
                                const rightMargin = 80
                                const chartPRT = canvas.width - leftMargin - rightMargin
                                const time = sales[sales.length - 1].timestamp

                                const priceGap = maxPrice - minPrice
                                const volumePRT = 135
                                const titlePRT = 100
                                const pricePRT = canvas.height - volumePRT - titlePRT
                                const priceOnCanvas = pricePRT / priceGap


                                // On récupère le tableau final
                                // On reprend le tab de base et on filter les sales au dessus du max
                                // Ca nous laisse avec le même min/max mais 
                                const salesTAB = sortBigSales(sales, maxPrice, minPrice)


                                // Dessiner les points du graphique
                                salesTAB.forEach((sale, index) => {
                                    const x = leftMargin + (chartPRT / time) * sale.timestamp
                                    const y = titlePRT + (priceOnCanvas * (maxPrice - sale.price))

                                    // Dessin du cercle
                                    const arc = 2 * Math.PI
                                    const sizeA = 4.3
                                    const sizeB = 0
                                    const stk = sizeA / 6

                                    // Dessiner le cercle principal (légèrement transparent)
                                    ctx.fillStyle = 'rgba(207, 191, 225, 0.4)'; // Blanc avec une transparence
                                    ctx.beginPath();
                                    ctx.arc(x, y, sizeA, sizeB, arc); // 8 est le rayon du cercle, ajustez-le selon vos besoins
                                    ctx.fill();
                                    ctx.closePath();

                                    // On met le petit glow
                                    ctx.shadowBlur = 4; // Ajustez la taille du blur selon vos besoins
                                    ctx.shadowColor = 'rgba(255, 255, 255, 0.4)'; // Blanc avec une transparence

                                    // Dessiner le contour non transparent autour du cercle principal
                                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'; // Blanc avec une transparence
                                    ctx.lineWidth = stk; // Ajustez l'épaisseur du contour selon vos besoins
                                    ctx.beginPath();
                                    ctx.arc(x, y, sizeA, sizeB, arc);
                                    ctx.stroke();
                                    ctx.closePath();

                                    ctx.shadowBlur = 0;

                                });







                                // On récupère l'échelle de prix
                                const priceLadder = priceScale(priceOnCanvas, titlePRT, maxPrice)

                                for (let index = 0; index < priceLadder.length; index++) {

                                    const ladder = priceLadder[index]
                                    const ladderGap = 88.5
                                    const firstLadder = 146
                                    const fontGap = 5

                                    const x = 1145
                                    const y = firstLadder + fontGap + (index * ladderGap)

                                    ctx.font = "450 14px 'Fira Code'";
                                    ctx.fillStyle = '#ffffff'; // Blanc avec une transparence
                                    ctx.fillText(ladder, x, y);


                                }




                                // Charte de volume
                                const bars = 91
                                const volumeTAB = groupByTimestamp2(salesTAB, bars)



                                const { minVol, maxVol } = volumeTAB.reduce((acc, curr) => {
                                    const vol = curr.total

                                    // Trouver la plus petite valeur
                                    acc.minVol = Math.min(acc.minVol, vol);

                                    // Trouver la plus grande valeur
                                    acc.maxVol = Math.max(acc.maxVol, vol);

                                    return acc;
                                }, { minVol: Infinity, maxVol: -Infinity });

                                // Les datas de la charte de volume
                                const wide = 10
                                const space = 2
                                const highest = 105
                                const volOnCanvas = highest / (maxVol - minVol)
                                const volLeftMargin = 39

                                // Dessin du volume
                                volumeTAB.forEach((sale, index) => {
                                    const indexMargin = (wide + space) * index // On note à quel index on est
                                    const high = sale.total * volOnCanvas

                                    const x = volLeftMargin + indexMargin // La position sur le canvas
                                    const y = canvas.height - 21 - high // Elles commencent toutes à la même hauteur


                                    // Dessiner le rectangle
                                    ctx.fillStyle = 'rgba(64, 0, 248, 0.25)'; // Fill du rectangle
                                    ctx.fillRect(x, y, wide, high);

                                    ctx.shadowBlur = 4; // Ajustez la taille du blur selon vos besoins
                                    ctx.shadowColor = 'rgba(255, 255, 255, 0.4)'; // Blanc avec une transparence

                                    // Dessiner le rectangle
                                    ctx.strokeStyle = '#EDE0FF'; // Blanc avec une transparence
                                    ctx.lineWidth = 0.6; // Ajustez l'épaisseur du contour selon vos besoins
                                    ctx.strokeRect(x, y, wide, high);

                                    ctx.shadowBlur = 0;


                                })


                                // On fait l'échelle de temps
                                // On récupère l'échelle de prix
                                const timeLadder = timeScale(salesTAB, chartPRT)
                                const timetamps = formatTimestamps(timeLadder, salesTAB)

                                for (let index = 0; index < timeLadder.length; index++) {

                                    const ladder = timetamps[index]
                                    const ladderGap = 158
                                    const firstLadder = 45
                                    const fontGap = 0

                                    const x = firstLadder + fontGap + (index * ladderGap)
                                    const y = 693

                                    ctx.font = "450 11px 'Fira Code'";
                                    ctx.fillStyle = '#ffffff'; // Blanc avec une transparence
                                    const dateSZ = ctx.measureText(ladder).width
                                    ctx.fillText(ladder, x - dateSZ / 2, y);
                                }



                                // On fait les dernière opérations de format
                                // Comme le nom, le floor etc
                                // Dessiner les points du graphique

                                // Nom de la collection
                                const name = sales[0].collection
                                ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
                                ctx.shadowBlur = 8.5;
                                ctx.font = "500 31px 'Fira Code'";
                                ctx.fillStyle = '#ffffff'; // Blanc avec une transparence
                                const nameSZ = ctx.measureText(name).width
                                ctx.fillText(name, 600 - nameSZ / 2, 39);

                                // Floor de la collection
                                const floor = "floor: " + getLastValidSale(salesTAB) + "Ξ"
                                ctx.font = "250 12px 'Fira Code'";
                                ctx.fillStyle = '#ffffff'; // Blanc avec une transparence
                                ctx.fillText(floor, 25, 25);

                                // Interval
                                const interval = "interval: " + convertSecondsToTime(salesTAB[salesTAB.length - 1].timestamp)
                                ctx.font = "250 12px 'Fira Code'";
                                ctx.fillStyle = '#ffffff'; // Blanc avec une transparence
                                ctx.fillText(interval, 25, 45);


                                // Dessiner l'image de profil sur le canvas
                                const buffer2 = canvas.toBuffer('image/png');

                                await interaction.editReply({ files: [buffer2], embeds: [], ephemeral: true })



                            } else if (subcommand === 'portfolio') {


                                //Variable pour les options
                                const address = interaction.options.getString("wallet").toLowerCase()

                                // On récupère les infos du portfolio
                                const portfolio = await getPortfolio(address)

                                // On calcul les datas global
                                const data = portfolio.reduce((acc, item) => {
                                    acc.totalOwned = (acc.totalOwned || 0) + parseInt(item.owned);
                                    acc.totalValue = (acc.totalValue || 0) + item.value;
                                    return acc;
                                }, {});


                                const portfolioFiltered = portfolio.slice(0, 16)
                                let inventory = "Name                       # Held      Floor       Value\n\n"

                                for (const coll of portfolioFiltered) {

                                    let part1 = reduceText(coll.name, 23)
                                    let part2 = coll.owned
                                    let part3 = parseFloat(coll.floor).toFixed(3) + "Ξ"
                                    let part4 = parseFloat(coll.value).toFixed(3) + "Ξ"

                                    //  let part3 = formatBidPrice(coll.bid)
                                    //  let part4 = parseFloat(coll.floor).toFixed(3) + "Ξ"

                                    let spaceSize = 33 - part1.length - part2.length
                                    let spaceLenght = ""
                                    for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

                                    let spaceSize2 = 11 - part3.length
                                    let spaceLenght2 = ""
                                    for (let i = 0; i < spaceSize2; i++) { spaceLenght2 += " " }

                                    let spaceSize3 = 12 - part4.length
                                    let spaceLenght3 = ""
                                    for (let i = 0; i < spaceSize3; i++) { spaceLenght3 += " " }


                                    inventory += part1 + spaceLenght + part2 + spaceLenght2 + part3 + spaceLenght3 + part4 + "\n"
                                }

                                // On définit le nombre de page
                                const itemsPerPage = 16; // Nombre d'objets par page
                                const index = Math.ceil(portfolio.length / itemsPerPage);

                                const buttons = formIndexButtons(1, index)


                                const notMember = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle(`Portfolio Manager`)
                                    .setDescription(">>> Manage your NFTs")
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .addFields(
                                        { name: " ", value: " ", inline: false },
                                        { name: "Value:", value: "`" + parseFloat(data.totalValue).toFixed(3) + "Ξ`", inline: true },
                                        { name: "# Held:", value: "`" + data.totalOwned + "`", inline: true },
                                        { name: "Inventory:", value: "```" + inventory + "```", inline: false },
                                        { name: "Links", value: '[Etherscan](https://etherscan.io/address/' + address + ") ∙ " + '[Blur](https://blur.io/' + address + ") ∙ " + '[Opensea](https://opensea.io/' + address + ") ∙ " + '[Nansen](https://portfolio.nansen.ai/dashboard/' + address + ") ∙ " + '[Parsec](https://parsec.fi/address/' + address + ")", inline: false },
                                        { name: "Page:", value: "`[1/" + index + "]`", inline: false },

                                    )
                                    .setTimestamp()
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                await interaction.editReply({ embeds: [notMember], components: buttons });


                                // On construit les objets qu'on va stocker
                                //On fait le call à la base SQL
                                await portfolio_nft.destroy({ where: { authorId: authorId, treated: null } })

                                await portfolio_nft.create({
                                    authorId: authorId,
                                    authorName: authorName,
                                    serverId: serverId,
                                    address: address,
                                    portfolio: JSON.stringify(portfolio),
                                    current: JSON.stringify(portfolioFiltered),
                                    pageIndex: index.toString(),
                                    actualPage: "1",
                                    sort: 'byValue'
                                })
                            }




                        } else {

                            const notMember = new EmbedBuilder().setColor("#060A8F")
                                .setTitle(`Bot Access`)
                                .setDescription(">>> Showing access data")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Status", value: "`Denied ❌`", inline: true },
                                    { name: "Required Role", value: "<@&" + community.member + ">", inline: true },
                                    { name: "Reason:", value: "Your access to the bot has been denied. You can only use the bot if you have the required role in this community.", inline: false },
                                )
                                .setTimestamp()
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                            await interaction.editReply({ embeds: [notMember] });

                        }

                    } else {

                        const botOff = new EmbedBuilder().setColor("#060A8F")
                            .setTitle(`Bot Access`)
                            .setDescription("You can't use this feature. The access tier of this community is too low. Please contact an admin of the community to upgrade the access ❌")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                        await interaction.editReply({ embeds: [botOff] });
                    }

                } else {

                    const botOff = new EmbedBuilder().setColor("#060A8F")
                        .setTitle(`Bot Access`)
                        .setDescription("You can't use this feature. Aura is currently inactive in this community. Please contact an admin of the community to sort out an access to the bot ❌")
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .setAuthor({ name: authorName, iconURL: userAvatar })
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
                let reportCommand = "/cryptoprofit"


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
}




// Fonctions
function createLink(slug, contract, twitter, website) {

    let baseLinks = '[opensea](https://opensea.io/collection/' + slug + ') ∙ ' +
        '[blur](https://blur.io/collection/' + contract + ') ∙ ' +
        '[magically](https://magically.gg/collection/' + contract + ') ∙ ' +
        '[nerds](https://app.nftnerds.ai/collection/' + contract + ') ∙ ' +
        //'[opensea pro](https://pro.opensea.io/collection/' + links.contract + ') ∙ ' +
        //'[tiny astro](https://tinyastro.io/en/analytics/eth/' + links.contract + ') ∙ ' +
        '[etherscan](https://app.nftnerds.ai/collection/' + contract + ')';

    if (twitter !== null) {
        baseLinks += ' ∙ [twitter](https://twitter.com/' + twitter + ')';
    }

    if (isHttps(website)) {
        baseLinks += ' ∙ [website](' + website + ')';
    }

    return baseLinks;
}

function calculateAverage(arr, i, count) {
    const start = Math.max(0, i - Math.floor(count / 2));
    const end = Math.min(arr.length, i + Math.ceil(count / 2));
    const sum = arr.slice(start, end).reduce((acc, curr) => acc + curr.price, 0);
    return sum / (end - start);
}

function sortBigSales(array, max, min) {

    const result = array.filter(item => item.price <= max && item.price >= min)
    return result
}


function groupByTimestamp2(sales, numBars) {
    const result = [];

    // Triez les ventes par timestamp
    sales.sort((a, b) => a.timestamp - b.timestamp);

    // Calculez le gap total entre la première et la dernière vente
    const totalTimestampGap = sales[sales.length - 1].timestamp - sales[0].timestamp;

    // Calculez la taille de chaque barre en termes de timestamp
    const barTimestampSize = totalTimestampGap / numBars;

    // Initialisez les compteurs
    let currentBarIndex = 0;
    let currentBarSales = 0;
    let currentBarVolume = 0;
    let currentBarTimestamp = sales[0].timestamp;

    // Parcourez les ventes pour créer les barres de volume
    for (const sale of sales) {
        while (sale.timestamp >= currentBarTimestamp + barTimestampSize) {
            // Créez un objet représentant la barre actuelle
            result.push({
                index: currentBarIndex,
                sales: currentBarSales,
                total: currentBarVolume,
            });

            // Réinitialisez les compteurs pour la prochaine barre
            currentBarIndex++;
            currentBarSales = 0;
            currentBarVolume = 0;
            currentBarTimestamp += barTimestampSize;
        }

        // Mettez à jour les compteurs pour la vente actuelle
        currentBarSales++;
        currentBarVolume += sale.price;
    }

    return result;
}


function priceScale(priceOnCanvas, maxSaleLocation, maxSale) {

    // On définit les valeurs de base
    const places = 6
    const space = 88.5

    // On calcul le nombre de CM de différence entre la vente
    // max et la première échelle (initialGap)
    const firstLadder = 146
    const initialGap = firstLadder - maxSaleLocation

    // On calcul le nombre d'ETH dans un centimètre
    // en utilisant le priceOnCanvas (CM par ETH).
    // Puis on calcul le prix en ETH du premier gap
    const ethPerCm = 1 / priceOnCanvas

    const result = []

    for (let index = 0; index < places; index++) {

        let gap = maxSale - (initialGap + (index * space)) * ethPerCm;

        if (gap < 0.1) {
            gap = parseFloat(gap).toFixed(3)
        } else if (gap < 1 && gap >= 0.1) {
            gap = parseFloat(gap).toFixed(2)
        } else if (gap < 10 && gap >= 1) {
            gap = parseFloat(gap).toFixed(1)
        } else {
            gap = parseFloat(gap).toFixed(1)
        }

        result.push(gap)

    }
    return result
}

function getLastValidSale(sales) {
    const numSalesToConsider = 10;

    if (sales.length < numSalesToConsider) {
        // Il n'y a pas assez de ventes pour appliquer la logique, renvoie simplement la dernière vente
        return sales[sales.length - 1];
    }

    let i = sales.length - 1;

    while (i >= numSalesToConsider - 1) {
        const currentSales = sales.slice(i - (numSalesToConsider - 1), i + 1);
        const averagePrice = currentSales.slice(0, -1).reduce((sum, sale) => sum + sale.price, 0) / (numSalesToConsider - 1);

        const lastSale = currentSales[numSalesToConsider - 1];
        const priceDifference = Math.abs(lastSale.price - averagePrice);
        const priceThreshold = 1.0; // Ajustez selon vos besoins

        if (priceDifference <= priceThreshold) {
            // La dernière vente est cohérente, renvoie la dernière vente
            return lastSale.price;
        }

        i--;
    }

    // Si aucune vente cohérente n'est trouvée, renvoie simplement la dernière vente
    return sales[sales.length - 1].price;
}

function convertSecondsToTime(seconds) {
    const secondsInMinute = 60;
    const secondsInHour = 3600;
    const secondsInDay = 86400;
    const secondsInWeek = 604800;
    const secondsInMonth = 2592000;

    if (seconds < secondsInMinute) {
        return seconds + "s";
    } else if (seconds < secondsInHour) {
        const minutes = Math.round(seconds / secondsInMinute);
        return minutes + "m";
    } else if (seconds < secondsInDay) {
        const hours = Math.round(seconds / secondsInHour);
        return hours + "h";
    } else if (seconds < secondsInWeek) {
        const days = Math.round(seconds / secondsInDay);
        return days + "d";
    } else if (seconds < secondsInMonth) {
        const weeks = Math.round(seconds / secondsInWeek);
        return weeks + "w";
    } else {
        const months = Math.round(seconds / secondsInMonth);
        return months + "M";
    }
}

function timeScale(data, frameSZ) {

    // On met les valeurs de base
    const initialSpace = 146
    const space = 158
    const places = 7
    const littleGap = 11

    const frameTime = data[data.length - 1].timestamp
    const originTime = data[0].origin

    const timePerCm = frameTime / frameSZ
    const firstTime = originTime - (littleGap * timePerCm)

    const result = []

    for (let index = 0; index < places; index++) {

        let gap = firstTime + (((index) * space) * timePerCm)

        result.push(gap)

    }

    return result
}

function formatTimestamps(timestamps, data) {
    const firstSale = data[0].origin
    const lastSale = data[data.length - 1].origin

    const timeDiff = lastSale - firstSale;
    const oneHour = 3600; // en secondes
    const oneDay = 24 * oneHour;
    const oneWeek = 7 * oneDay;

    const firstTimestamp = timestamps[0];
    const lastTimestamp = timestamps[timestamps.length - 1];

    // On définit les timestamp variable
    let secondTimestamp = 0
    let currentDate = new Date(firstTimestamp * 1000);


    const formattedTimestamps = timestamps.map((timestamp, index) => {
        const date = new Date(timestamp * 1000); // convertir en millisecondes

        if (timeDiff <= oneDay * 2) {
            // Option 1: moins de 24 heures
            if (index === 0) {
                // C'est le premier timestamp
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            } else {
                if ((date.getDate() === new Date(firstTimestamp * 1000).getDate() && date.getMonth() === new Date(firstTimestamp * 1000).getMonth())
                    || (date.getDate() === new Date(secondTimestamp * 1000).getDate() && date.getMonth() === new Date(secondTimestamp * 1000).getMonth())) {
                    // Même jour que le premier timestamp
                    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' });
                } else {
                    // Autre jour
                    secondTimestamp = timestamp
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                }
            }
        } else if (timeDiff <= oneWeek) {
            // Option 2: Entre 1 et 7 jours
            const isSameDay = date.getDate() === currentDate.getDate();
            const isSameMonth = date.getMonth() === currentDate.getMonth();


            if (index === 0) {
                return ' '
            } else {

                if (isSameDay && isSameMonth && timeDiff > oneDay) {
                    // Répétition du jour, afficher heures/minutes
                    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' });
                } else {
                    // Nouveau jour, afficher mois/jour
                    currentDate = new Date(timestamp * 1000);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }

            }
        } else {
            // Option 3: Plus de 7 jours
            if (index === 0) {
                return ' '
            } else {

                // Nouveau jour, afficher jour/mois
                return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
            }
        }
    });
    return formattedTimestamps;
}

function formatBidPrice(bid) {

    if (bid === null) {
        return "-"
    } else {
        return parseFloat(bid).toFixed(2) + "Ξ"
    }

}


function formIndexButtons(currentPage, totalPages) {
    // Déterminez quel bouton doit être désactivé
    const isFirstPage = parseInt(currentPage) === 1;
    const isLastPage = parseInt(currentPage) === parseInt(totalPages)

    // Bouttons
    const buttonA = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_infra_collectionView')
                .setLabel('Global View')
                .setStyle(1),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_infra_tokenView')
                .setLabel('Token View')
                .setStyle(2),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_infra_sortbyvalue')
                .setLabel('Sort by value')
                .setStyle(1),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_infra_sortbyfloor')
                .setLabel('Sort by floor')
                .setStyle(2),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_infra_sortbyabc')
                .setLabel('Sort by abc')
                .setStyle(2),
        );

    // Boutons
    const buttonD = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_infra_firstPage')
                .setLabel('First page')
                .setStyle(2)
                .setDisabled(isFirstPage),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_infra_previousPage')
                .setLabel('Previous page')
                .setStyle(2)
                .setDisabled(isFirstPage),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_infra_nextPage')
                .setLabel('Next page')
                .setStyle(2)
                .setDisabled(isLastPage),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_infra_lastPage')
                .setLabel('Last page')
                .setStyle(2)
                .setDisabled(isLastPage),
        );


    const buttonB = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_exec_list')
                .setLabel('List')
                .setStyle(3)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_exec_bulkList')
                .setLabel('Bulk List')
                .setStyle(3)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_exec_acceptBid')
                .setLabel('Accept Bid')
                .setStyle(3)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_exec_acceptBulkBid')
                .setLabel('Accept Bulk Bid')
                .setStyle(3)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_exec_transfer')
                .setLabel('Transfer')
                .setStyle(3),
        );

    const buttonC = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_infra_refresh')
                .setLabel('🔁 Refresh')
                .setStyle(1),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_infra_tutorial')
                .setLabel('📑 Tutorial')
                .setStyle(1),
            new ButtonBuilder()
                .setCustomId('button_nft_tradepanel_setup')
                .setLabel('💻 Setup')
                .setStyle(1),
        );

    // Retourne un tableau de toutes les rangées de boutons
    return [buttonD, buttonA, buttonB, buttonC];
}