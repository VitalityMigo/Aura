/**
 * @file Sample getdata command with slash command.
 * @author Vitality Migø
 */

const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { profileData, accessSql, apimonitorsql, adminsql, reportsql, usersql, sequelize } = require('../../../events/database');
const moment = require('moment');

//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const etherscanApiKey = process.env.etherscanApiKey
const reservoirApiKey = process.env.reservoirApiKey
const blockspanApiKey = process.env.blockspanApiKey
const gallopApiKey = process.env.gallopApiKey
const magicedenApiKey = process.env.magicedenApiKey


//Https requests
const axios = require('axios')

//Reservoir API
const sdk = require('api')('@reservoirprotocol/v2.0#2672bklexdpsbi');
sdk.auth(reservoirApiKey);


//Block Span API
const bsp = require('api')('@blockspan/v1.0#9zxl2sledru983');
bsp.auth(blockspanApiKey);

//Gallop API
const gallop = require('api')('@gallop/v1.0#4uq6vlfu0opx7');
gallop.auth(gallopApiKey);

//Web3 API + Cloudfare Provider
var Web3 = require("web3")
const web3 = new Web3("https://cloudflare-eth.com")


// Configuration de l'en-tête d'autorisation
const headers = {
    'Authorization': `Bearer ${magicedenApiKey}`
};


function isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}


module.exports = {
    data: new SlashCommandBuilder()
        .setName("data")
        .setDescription("Display major metrics of a collection")
        .addStringOption(option =>
            option
                .setName("collection")
                .setDescription("The collection you want to display")
                .setRequired(true)
                .setAutocomplete(true)
        ),


    async execute(interaction) {


        if (interaction.guildId != null) {


            //Récupérer informations de l'utilisateur de la commande
            let authorId = interaction.user.id;
            let authorName = interaction.user.username;
            let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png`;
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
                            const timeStamp = Date.now();
                            const actualTimestamp = parseFloat(timeStamp / 1000).toFixed(0)
                            const isUser = await usersql.findOne({ where: { userId: authorId, serverId: serverId } })
                            if (isUser == null) { await usersql.create({ userId: authorId, userName: authorName, userAvatar: userAvatar, serverId: serverId, timestamp: actualTimestamp }) }



                            //Variable pour les options
                            const selectedCollection = interaction.options.getString("collection");
                            const coinAddress = interaction.options.getString("collection");


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


                                        const ethUsdPrice = await axios.get('https://api.etherscan.io/api?module=stats&action=ethprice&apikey=' + etherscanApiKey)




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
                                        ethPriceUsd = ethUsdPrice.data.result.ethusd
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

                                            if (floorChange1D > 0) { roiPrefix = "+"; roiSuffix = " :chart_with_upwards_trend:"; } else if (floorChange1D < 0) { roiSuffix = " :chart_with_downwards_trend:"; } floorChange1DFormatted = "`" + roiPrefix + parseFloat(floorChange1D).toFixed(2) + "%" + "`" + roiSuffix;

                                            // if (floorChange1D > 0) { roiPrefix = "+"; roiSuffix = " :chart_with_upwards_trend:"; } else if (floorChange1D < 0) { roiSuffix = " :chart_with_downwards_trend:"; } floorChange1DFormatted = "`" + roiPrefix + parseFloat(floorChange1D).toFixed(2) + "% (" + ((collectionFloor1D - collectionFloor) * ethPriceUsd).toFixed(0) +  "$)`";

                                        } else if (floorChange1D === 0 || floorChange1D === "NaN") { floorChange1DFormatted = "`0.00%`" } else if (floorChange1D === "N/A") { floorChange1DFormatted = "'N/A'" }


                                        // Mise en forme 7D Change
                                        if (floorChange7D !== 0 && collectionFloor) {

                                            if (floorChange7D > 0) { roiPrefix7 = "+"; roiSuffix7 = " :chart_with_upwards_trend:"; } else if (floorChange7D < 0) { roiSuffix7 = " :chart_with_downwards_trend:"; } floorChange7DFormatted = "`" + roiPrefix7 + parseFloat(floorChange7D).toFixed(2) + "%" + "`" + roiSuffix7;

                                        } else if (floorChange7D === 0 || floorChange7D === "NaN") { floorChange7DFormatted = "`0.00%`" } else if (floorChange7D === "N/A") { floorChange7DFormatted = "'N/A'" }


                                        // Mise en forme 7D Change
                                        if (floorChange30D !== 0 && collectionFloor) {

                                            if (floorChange30D > 0) { roiPrefix30 = "+"; roiSuffix30 = " :chart_with_upwards_trend:"; } else if (floorChange30D < 0) { roiSuffix30 = " :chart_with_downwards_trend:"; } floorChange30DFormatted = "`" + roiPrefix30 + parseFloat(floorChange30D).toFixed(2) + "%" + "`" + roiSuffix30;

                                        } else if (floorChange30D === 0 || floorChange30D === "NaN") { floorChange30DFormatted = "`0.00%`" } else if (floorChange30D === "N/A") { floorChange30DFormatted = "'N/A'" }


                                        ////////////////////////////////////////////////////////   FAIRE LES ARRONDIS ////////////////////////////////////////////////////////



                                        //On fait la fonction pour trouver la valeur des walls à afficher
                                        let wall1 = 0
                                        let wall2 = 0
                                        let wall3 = 0

                                        if (collectionFloor >= 10) {
                                            wall1 = ((Math.ceil((collectionFloor) * 1) / 1) + 2).toFixed(1);
                                            wall2 = ((Math.ceil((collectionFloor) * 1) / 1) + 5).toFixed(1);
                                            wall3 = ((Math.ceil((collectionFloor) * 1) / 1) + 10).toFixed(1);
                                        } else if (collectionFloor >= 1 && collectionFloor < 10) {
                                            wall1 = ((Math.ceil((collectionFloor) * 10) / 10) + 0.5).toFixed(1);
                                            wall2 = ((Math.ceil((collectionFloor) * 10) / 10) + 1).toFixed(1);
                                            wall3 = ((Math.ceil((collectionFloor) * 10) / 10) + 2).toFixed(1);
                                        } else if (collectionFloor >= 0.3 && collectionFloor < 1) {
                                            wall1 = ((Math.ceil((collectionFloor) * 10) / 10) + 0.15).toFixed(2);
                                            wall2 = ((Math.ceil((collectionFloor) * 10) / 10) + 0.3).toFixed(2);
                                            wall3 = ((Math.ceil((collectionFloor) * 10) / 10) + 0.5).toFixed(2);
                                        } else if (collectionFloor >= 0.1 && collectionFloor < 0.3) {
                                            wall1 = ((Math.ceil((collectionFloor) * 10) / 10) + 0.1).toFixed(2);
                                            wall2 = ((Math.ceil((collectionFloor) * 10) / 10) + 0.2).toFixed(2);
                                            wall3 = ((Math.ceil((collectionFloor) * 10) / 10) + 0.3).toFixed(2);
                                        } else if (collectionFloor >= 0.01 && collectionFloor < 0.1) {
                                            wall1 = ((Math.ceil((collectionFloor) * 100) / 100) + 0.05).toFixed(2);
                                            wall2 = ((Math.ceil((collectionFloor) * 100) / 100) + 0.1).toFixed(2);
                                            wall3 = ((Math.ceil((collectionFloor) * 100) / 100) + 0.15).toFixed(2);
                                        } else if (collectionFloor < 0.01) {
                                            wall1 = ((Math.ceil((collectionFloor) * 1000) / 1000) + 0.02).toFixed(2);
                                            wall2 = ((Math.ceil((collectionFloor) * 1000) / 1000) + 0.04).toFixed(2);
                                            wall3 = ((Math.ceil((collectionFloor) * 1000) / 1000) + 0.07).toFixed(2);
                                        }





                                        gallop.getEthLiveListings({ collection_address: '0x64Ad353BC90A04361c4810Ae7b3701f3bEb48D7e' })
                                            .then(async ({ data: collectionListings }) => {

                                                //On définit le nombre de listings avant chaque wall
                                                let toWall1Count = 0;
                                                let toWall2Count = 0
                                                let toWall3Count = 0


                                                for (let i = 0; i < collectionListings.response.listings.length; i++) {
                                                    const ethValue = collectionListings.response.listings[i].eth_value;
                                                    if (ethValue < wall1) {
                                                        toWall1Count++;
                                                    } if (ethValue < wall2) {
                                                        toWall2Count++;
                                                    } if (ethValue < wall3) {
                                                        toWall3Count++;
                                                    }
                                                }


                                                const date = new Date(collectionDate);
                                                //const dateLisible = date.toLocaleString();

                                                const dateLisible = date.toLocaleDateString("fr-FR", {
                                                    day: "numeric",
                                                    month: "numeric",
                                                    year: "numeric",
                                                });


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
                                                        { name: "1st Wall (" + wall1 + "Ξ)", value: "`" + toWall1Count + "`", inline: true },
                                                        { name: "2nd Wall (" + wall2 + "Ξ)", value: "`" + toWall2Count + "`", inline: true },
                                                        { name: "3rd Wall (" + wall3 + "Ξ)", value: "`" + toWall3Count + "`", inline: true },
                                                        { name: "Market Cap", value: "`" + collectionMarketCap.toFixed(3) + "Ξ (" + Intl.NumberFormat('en-US').format((ethPriceUsd * collectionMarketCap).toFixed(0)) + "$)`", inline: true },
                                                        { name: "Creation Date", value: "`" + dateLisible + "`", inline: true },
                                                        { name: "Royalties", value: "`" + collectionRoyaltiesFormatted + "`", inline: true },
                                                        { name: "Links", value: '[alphashark](https://magically.gg/collection/' + selectedCollection + ") ∙ " + '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + selectedCollection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + selectedCollection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ") ∙ " + '[website](' + collectionWebsite + ")", inline: true },


                                                    )
                                                    .setTimestamp()
                                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                                await interaction.editReply({ embeds: [getDataCollectionAddress] });





                                                //On enregistre le call API dans la database
                                                const timeStamp = Date.now();
                                                await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/data", apiCallName: "getCollectionsV5", apiProvider: "reservoir", timestamp: timeStamp.toString() })
                                                await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/data", apiCallName: "getEthLiveListings", apiProvider: "gallop", timestamp: timeStamp.toString() })
                                                await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/data", apiCallName: "ethUsdPrice", apiProvider: "etherscan", timestamp: timeStamp.toString() })


                                            })
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


                        } else if (!member.roles.cache.has(communityMemberRoleId)) {



                            const notMember = new EmbedBuilder().setColor("#060A8F")
                                .setTitle(`Bot Access`)
                                .setDescription(">>> Showing access data")
                                .setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
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
                            .setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
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
                        .setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
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
                let reportCommand = "/getdata"

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


                await interaction.editReply({ embeds: [errorAnswerUser], ephemeral: true });


            }

        } else if (interaction.guildId == null) {

            const errorAnswerUser = new EmbedBuilder().setColor("#060A8F")
                .setTitle("Aura")
                .setDescription(`Hey ${interaction.user.username}, we hope you're doing well !\n\nAlthough this may be possible in the future, Aura cannot be used in DM at the moment. If you want to have access to the bot, go here: <#1108757700885622784>.\n\nIf you have any questions, don't hesitate to contact one of our team member, or directly on Discord here : <#1121110417368956958>.\n\nHave a nice day 👑`)
                .setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
                .setTimestamp()
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


            await interaction.reply({ embeds: [errorAnswerUser], ephemeral: true });



        }


    }
}

