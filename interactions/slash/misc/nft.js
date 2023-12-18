/**
 * @file Sample getdata command with slash command.
 * @author Vitality Migø
 */



const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { profileData, accessSql, reportsql, interactionData, wallets, apimonitorsql, adminsql, usersql, sequelize, infra_coin, tracker_nft, infra_nft } = require('../../../events/database');
const moment = require('moment');

// Fonctions d'execution et de formattage
const { createFactory } = require('../../../functions/coin-utils')

const getEthPrice = require('../../../functions/getethprice')
const decrypt = require("../../../functions/decrypt")
const isHttps = require('../../../functions/isHttps')

//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const etherscanApiKey = process.env.etherscanApiKey
const reservoirApiKey = process.env.reservoirApiKey
const blockspanApiKey = process.env.blockspanApiKey
const alchemyApiKey = process.env.alchemyApiKey
const moralisApiKey = process.env.moralisApiKey
const chartApiKey = process.env.chartApiKey
const magicedenApiKey = process.env.chainbaseApiKey
const gallopApiKey = process.env.gallopApiKey


// Axios
const axios = require('axios')


// Instance des APIs cryptos
const Moralis = require("moralis").default;

//Reservoir API
const sdk = require('api')('@reservoirprotocol/v2.0#2672bklexdpsbi');
sdk.auth(reservoirApiKey);
//;

const sdk3 = require('api')('@reservoirprotocol/v3.0#9eilkbbprl8');
sdk3.auth(reservoirApiKey);

//Block Span API
const bsp = require('api')('@blockspan/v1.0#9zxl2sledru983');
bsp.auth(blockspanApiKey);


//Web3 API + Cloudfare Provider
var Web3 = require("web3")
const web3 = new Web3("https://cloudflare-eth.com")

//Alchemy API 
const { Network, Alchemy } = require('alchemy-sdk')
const settings = {
    apiKey: alchemyApiKey, // Replace with your Alchemy API Key.
    network: Network.ETH_MAINNET, // Replace with your network.
};
const alchemy = new Alchemy(settings);
const alchemy2 = require('api')('@alchemy-docs/v1.0#24zcsa23lfbpdnv5');

// Initialisation du contrat de pair
const wETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"

// Configuration de l'en-tête d'autorisation
const headers = {
    'Authorization': `Bearer ${magicedenApiKey}`
};

// Fonctions
function isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}


function isBRC20BitcoinWallet(wallet) {
    const regex = /^bc1[a-zA-Z0-9]{39,59}$/;

    return regex.test(wallet);
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
        console.log(stringLength)
        return string.substring(0, 300) + "..."
    } else {
        return string
    }
}




module.exports = {
    data: new SlashCommandBuilder()
        .setName("nft")
        .setDescription("Various nft commands")
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

            try {



                const botAdmins = await adminsql.findOne({ where: { botId: botId } })
                const botGlobalState = botAdmins.dataValues.botState

                let communityMemberRoleId = ""
                let communityAdminRoleId = ""
                let botPowerStatut = ""
                let communityStatut = ""
                let accessTier = ""

                //Récupère info varibale sur le bot et le serveur
                const communityRolePerms = await accessSql.findOne({ where: { serverId: serverId } })
                if (communityRolePerms != null) {
                    communityMemberRoleId = communityRolePerms.dataValues.memberRoleId
                    communityAdminRoleId = communityRolePerms.dataValues.adminRoleId
                    botPowerStatut = communityRolePerms.dataValues.actualPower
                    communityStatut = communityRolePerms.dataValues.statut
                    accessTier = communityRolePerms.dataValues.accessTier
                }

                const subcommand = interaction.options.getSubcommand()



                const authorProfile = await profileData.findOne({ where: { authorId: authorId } })

                if (authorProfile === null) {

                    if (subcommand != 'wallet') {
                        await interaction.deferReply();
                    } else { await interaction.deferReply({ ephemeral: true }) }

                } else {
                    const authorPrivacyMode = authorProfile.dataValues.privacyMode

                    if (authorPrivacyMode.toLowerCase() === "private" || subcommand === 'wallet') { await interaction.deferReply({ ephemeral: true }); }
                    if (authorPrivacyMode.toLowerCase() === "public" && subcommand != 'wallet') { await interaction.deferReply(); }
                }

                //Checkpoint
                console.log("// Step 1 : Initialization - Executed ✅")


                if (botGlobalState.toLowerCase() === "on") {

                    if (communityStatut.toLowerCase() === "active" || communityStatut == "") {

                        if (accessTier.toLowerCase() == "s-tier" || accessTier.toLowerCase() == "a-tier") {

                            if (member.roles.cache.has(communityMemberRoleId)) {





                                if (subcommand === 'profit') {




                                } else if (subcommand === "data") {





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
                                        sdk.getCollectionsV5({ id: selectedCollection, accept: '*/*', includeTopBid: 'true', includeOwnerCount: 'true', includeSalesCount: 'true' })
                                            .then(async ({ data: collectionData }) => {


                                                // const ethUsdPrice = await axios.get('https://api.etherscan.io/api?module=stats&action=ethprice&apikey=' + etherscanApiKey)

                                                const ethPricePromise = getEthPrice()



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

                                                    )


                                                //"]

                                                const links = createLink(collectionSlug, selectedCollection, collectionTwitter, collectionWebsite)


                                                if (!isHttps(collectionBanner)) {
                                                    collectionBanner = "https://cdn.discordapp.com/attachments/1100572519896977490/1185619758008254474/e.png?ex=65904572&is=657dd072&hm=7a51469cad88b48198c5f230d13450d50c7e2717c5acdf97a82a6eb1fb5adad4&"
                                                }

                                                if (collectionDescription) {
                                                    collectionDescription = cutString(collectionDescription)
                                                }

                                                [ethPriceUsd] = await Promise.all([ethPricePromise])

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


                                        // Prix de l'ETH
                                        const etherscanTokenPrice = await axios.get('https://api.etherscan.io/api?module=stats&action=ethprice&apikey=' + etherscanApiKey)
                                        const ethUsdPrice = etherscanTokenPrice.data.result.ethusd


                                        const cryptoUsdtPrice = await axios.get('https://api-testnet.bybit.com/v5/market/tickers?category=linear')
                                        const BTCUsdtPrice = cryptoUsdtPrice.data.result.list.find(obj => obj.symbol === "BTCUSDT").lastPrice;



                                        const url = `https://api-mainnet.magiceden.dev/v2/ord/btc/collections/` + coinAddress;
                                        const response = await axios.get(url, { headers });
                                        const data = await response.data;

                                        const description = data.description
                                        const collectionLogo = data.imageURI
                                        const supply = data.supply
                                        const name = data.name
                                        const twitter = data.twitterLink
                                        const discord = data.discordLink
                                        const website = data.websiteLink
                                        const inscriptionIcon = data.inscriptionIcon



                                        const url2 = `https://api-mainnet.magiceden.dev/v2/ord/btc/stat?collectionSymbol=` + coinAddress;
                                        const response2 = await axios.get(url2, { headers });
                                        const data2 = await response2.data;


                                        const totalVolume = (data2.totalVolume) / (10 ** 8)
                                        const owners = data2.owners
                                        const floorPrice = (data2.floorPrice) / (10 ** 8)
                                        const floorPriceUSD = floorPrice * BTCUsdtPrice
                                        const floorPriceETH = floorPriceUSD / ethUsdPrice
                                        const totalListed = data2.totalListed
                                        const inscriptionNumberMin = data2.inscriptionNumberMin
                                        const inscriptionNumberMax = data2.inscriptionNumberMax
                                        const pendingTxn = data2.pendingTransactions


                                        //Quelques calculs
                                        const listingRatio = (totalListed / supply) * 100;
                                        const holderRatio = (owners / supply) * 100;




                                        const getDataCollectionAddress = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle(name)
                                            .setDescription(description)
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setThumbnail(collectionLogo)
                                            .addFields(
                                                { name: " ", value: " ", inline: true },
                                                { name: "Inscription", value: "`" + inscriptionIcon + "`", inline: false },
                                                { name: "BTC Price", value: "`" + parseFloat(floorPrice).toFixed(3) + "₿`", inline: true },
                                                { name: "ETH Price", value: "`" + parseFloat(floorPriceETH).toFixed(3) + "Ξ`", inline: true },
                                                { name: "USD Price", value: "`" + parseFloat(floorPriceUSD).toFixed(2) + "$`", inline: true },
                                                { name: "Supply", value: "`" + supply + "`", inline: true },
                                                { name: "Total Volume", value: "`" + parseFloat(totalVolume).toFixed(3) + "₿\n(" + Intl.NumberFormat('en-US').format(parseFloat(totalVolume * BTCUsdtPrice).toFixed(0)) + "$)`", inline: true },
                                                { name: "Ongoin Txn", value: "`" + pendingTxn + "`", inline: true },
                                                { name: "Listing Count", value: "`" + totalListed + "`", inline: true },
                                                { name: "Listing Ratio", value: "`" + parseFloat(listingRatio).toFixed(2) + "%`", inline: true },
                                                { name: " ", value: " ", inline: true },
                                                { name: "Holder Count", value: "`" + owners + "`", inline: true },
                                                { name: "Holder Ratio", value: "`" + parseFloat(holderRatio).toFixed(2) + "%`", inline: true },
                                                { name: " ", value: " ", inline: true },
                                                { name: "Lowest Inscription", value: "`#" + inscriptionNumberMin + "`", inline: true },
                                                { name: "Highest Inscription", value: "`#" + inscriptionNumberMax + "`", inline: true },
                                                { name: "Links", value: '[magic eden](https://magiceden.io/ordinals/marketplace/' + coinAddress + ") ∙ " + '[twitter](' + twitter + ") ∙ " + '[discord](' + discord + ") ∙ " + '[website](' + website + ")", inline: false },


                                            )
                                            .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                        await interaction.editReply({ embeds: [getDataCollectionAddress] });


                                        //On enregistre le call API dans la database
                                        const timeStamp = Date.now();
                                        await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/data", apiCallName: "getCollectionInfos", apiProvider: "magic eden", timestamp: timeStamp.toString() })
                                        await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/data", apiCallName: "getCollectionStats", apiProvider: "magic eden", timestamp: timeStamp.toString() })
                                        await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/data", apiCallName: "btcUsdPrice", apiProvider: "bybit", timestamp: timeStamp.toString() })
                                        await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/data", apiCallName: "ethUsdPrice", apiProvider: "etherscan", timestamp: timeStamp.toString() })




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

                                        const balance = await web3.eth.getBalance(walletAddress) / 10 ** 18

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
                                            { name: "Address Tracked:", value: "```\n" +addressFormatted + "                                  ```", inline: false },
                                        )
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                        
                                    await interaction.editReply({ embeds: [botOff], components: [buttonsRow] });



                                }







                            } else if (!member.roles.cache.has(communityMemberRoleId)) {



                                const notMember = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle(`Bot Access`)
                                    .setDescription(">>> Showing access data")
                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .addFields(
                                        { name: " ", value: " ", inline: false },
                                        { name: "Status", value: "`Access Denied ❌`", inline: true },
                                        { name: "Required Role", value: "<@&" + communityMemberRoleId + ">", inline: true },
                                        { name: "Problem Detected", value: "Your access to the bot has been denied. You can only use the bot if you have the required role in this community. If you usually have access to the bot, make sure you're in the right community or contact an admin.", inline: false },
                                    )
                                    .setTimestamp()
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                await interaction.editReply({ embeds: [notMember] });

                            }


                        } else {


                            if (accessTier == "") {
                                accessTier = "Free Tier"
                            }


                            const botOff = new EmbedBuilder().setColor("#060A8F")
                                .setTitle(`Bot Access`)
                                .setDescription(">>> Showing the community's bot access")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .addFields(
                                    { name: 'Access Status', value: "`Denied 🔴`", inline: false },
                                    { name: 'Access Tier', value: "`" + accessTier.toUpperCase() + "`", inline: true },
                                    { name: 'Required Tier', value: "`A-TIER`", inline: true },
                                    { name: "Problem Detected", value: "Your access to this command has been denied. You need a higher access tier to use this feature. You can consult the available commands in this community by using `/access`.", inline: false },
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
                                { name: 'Access Status', value: "`Denied 🔴`", inline: true },
                                { name: 'Commands', value: "`Not available`", inline: true },
                                { name: "Problem Detected", value: "The bot access is currently inactive in this community. The community's administrator are the only one who can make it active or not, contact them for any inquiries.", inline: false },
                            )
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                        await interaction.editReply({ embeds: [botOff] });



                    }


                } else {


                    console.log("// Step 2 : Unauthorized - Executed ✅")


                    const botOff = new EmbedBuilder().setColor("#060A8F")
                        .setTitle(`Bot status`)
                        .setDescription(">>> Showing the bot status")
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .addFields(
                            { name: 'Global Status', value: "`Inactive 🔴`", inline: true },
                            { name: 'Commands', value: "`Not available`", inline: true },
                            { name: "Problem Detected", value: "The bot is currently inactive in this community. The community's administrator are the only who are able to switch the bot on, contact them for any inquiries.", inline: false },
                        )
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.editReply({ embeds: [botOff] });

                    console.log("// Step 3 : Answer - Executed ✅")


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





function createLink(slug, contract, twitter, website) {

    let baseLinks = '[opensea](https://opensea.io/collection/' + slug + ') ∙ ' +
        '[blur](https://blur.io/collection/' + contract + ') ∙ ' +
        '[magically](https://magically.gg/collection/' + contract + ') ∙ ' +
        '[nerds](https://magically.gg/collection/' + contract + ') ∙ ' +
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