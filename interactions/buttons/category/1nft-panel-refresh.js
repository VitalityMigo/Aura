/**
 * @file Sample getdata command with slash command.
 * @author Vitality Migø
 */



const { EmbedBuilder, ButtonInteraction } = require("discord.js");
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { accessSql, reportsql, apimonitorsql, adminsql } = require('../../../events/database');
const moment = require('moment');
const axios = require('axios')

//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const etherscanApiKey = process.env.etherscanApiKey

const { reservoirA, magiceden } = require("../../../config/web3config")

const { getEthPrice } = require('../../../config/web3data')
const isHttps = require('../../../functions/isHttps')


// Fonctions
function isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
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
    id: 'button_nft_tradepanel_refresh_',

    async execute(interaction) {
        if (!(interaction instanceof ButtonInteraction)) return;

        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id
        let botId = interaction.applicationId


        try {

            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")




            //Checkpoint
            console.log("// Step 2 : Authorization - Executed ✅")



            const customId = interaction.customId


            // Utilisation d'une expression régulière pour extraire l'adresse Ethereum
            const regex = /_0x([0-9a-fA-F]{40})/;
            const matches = customId.match(regex);

            if (matches && matches[1]) {

                await interaction.deferUpdate({ ephemeral: true })


                // On récupère l'addresse du subject et défini le quickbuy à 1
                const selectedCollection = "0x" + matches[1]


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


                            if (!isHttps(collectionBanner)) {
                                collectionBanner = "https://cdn.discordapp.com/attachments/949291624389816334/1122703923950665848/Pallette_8.png"
                            }

                            if (collectionDescription) {
                                collectionDescription = cutString(collectionDescription)
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
                                    { name: "Links", value: linksFormatted, inline: true },


                                )
                                .setTimestamp()
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.editReply({ embeds: [getDataCollectionAddress], components: [buttonRow, buttonRow1, buttonRow2] });








                        })




                } else {


                    // Prix de l'ETH
                    const etherscanTokenPrice = getEthPrice()
                    const ethUsdPrice = etherscanTokenPrice.data.result.ethusd


                    const cryptoUsdtPrice = await axios.get('https://api-testnet.bybit.com/v5/market/tickers?category=linear')
                    const BTCUsdtPrice = cryptoUsdtPrice.data.result.list.find(obj => obj.symbol === "BTCUSDT").lastPrice;



                    const url = `https://api-mainnet.magiceden.dev/v2/ord/btc/collections/` + coinAddress;
                    const response = await axios.get(url, { headers: magiceden });
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
                    const response2 = await axios.get(url2, { headers: magiceden });
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


            } else {


                const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("NFT Data")
                    .setDescription("An error occured while retreiving the NFT address. Please try again using `/nft data` or contact a team member if you need help.")
                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                    .setAuthor({ name: "Aura", iconURL: "https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png" })
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                await interaction.reply({ embeds: [gasTrackerEmbed2], ephemeral: true });




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
            let reportCommand = "/nft-refresh"

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



