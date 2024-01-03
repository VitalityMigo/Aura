/**
 * @file Sample setwallet command with slash command.
 * @author VitalityMigo
 */

// On définit des constantes qui serviront dans l'ensemble de la commande
const { ActionRowBuilder, EmbedBuilder, SlashCommandBuilder, ButtonBuilder } = require("discord.js");
const { profileData, accessSql, apimonitorsql, adminsql, usersql, reportsql, sequelize } = require('../../../events/database');
const moment = require('moment');
const axios = require('axios')

// Param d'infrastructure
const { authPrivacy, communityInfos } = require("../../../functions/infra-utils")

// On récupère les nodes et API
const { nftgo, magiceden } = require("../../../config/web3config");
const { getEthPrice } = require("../../../config/web3data");


module.exports = {
    data: new SlashCommandBuilder()
        .setName("market")
        .setDescription("Display various global metrics of the market")
        .addStringOption(option =>
            option
                .setName("chain")
                .setDescription("The chain to retreive market data on")
                .setRequired(true)
                .setChoices(
                    {
                        name: 'Ethereum',
                        value: 'Ethereum',
                    },
                    {
                        name: 'Bitcoin',
                        value: 'Bitcoin',
                    },
                )
        )
        .addStringOption(option =>
            option
                .setName("timelapse")
                .setDescription("The time range to retreive market data on (Ethereum only)")
                .setRequired(false)
                .setChoices(
                    {
                        name: '1 hour',
                        value: '1 hour',
                    },
                    {
                        name: '6 hours',
                        value: '6 hours',
                    },
                    {
                        name: '12 hours',
                        value: '12 hours',
                    },
                    {
                        name: '1 Day',
                        value: '1 Day',
                    },
                    {
                        name: '7 Days',
                        value: '7 Days',
                    },

                )
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
            let botId = interaction.applicationId


            try {

                console.log("Initialization: executed ✅")

                // Récupère les infos de la communauté
                const community = await communityInfos(serverId)

                //Récupère régagle de privé/ou pas de l'utilisateur
                const privacy = await authPrivacy(authorId)
                if (privacy) { await interaction.deferReply({ ephemeral: true }) }
                else { await interaction.deferReply() }


                // Les vérifications
                if (community.statut) {

                    if (community.tier === 's-tier' || community.tier === 'a-tier') {

                        if (member.roles.cache.has(community.member)) {


                            const selectedTimestamp = interaction.options.getString("timelapse");
                            const selectedChain = interaction.options.getString("chain");


                            let timeRange = ""
                            if (selectedTimestamp === "1 hour") {
                                timeRange = "1h"
                            } else if (selectedTimestamp === "6 hours") {
                                timeRange = "6h"
                            } else if (selectedTimestamp === "12 hours") {
                                timeRange = "12h"
                            } else if (selectedTimestamp === "1 Day" || !selectedTimestamp) {
                                console.log("hi")
                                timeRange = "24h"
                            } else if (selectedTimestamp === "7 Days") {
                                timeRange = "7d"
                            }

                            let timeRange2 = ""
                            if (selectedTimestamp === "1 hour") {
                                timeRange2 = "24h"
                            } else if (selectedTimestamp === "6 hours") {
                                timeRange2 = "24h"
                            } else if (selectedTimestamp === "12 hours") {
                                timeRange2 = "24h"
                            } else if (selectedTimestamp === "1 Day" || !selectedTimestamp) {
                                console.log("hi")

                                timeRange2 = "24h"
                            } else if (selectedTimestamp === "7 Days") {
                                timeRange2 = "7d"
                            }

                            let timeRange3 = ""
                            if (selectedTimestamp === "1 hour") {
                                timeRange3 = "1h"
                            } else if (selectedTimestamp === "6 hours") {
                                timeRange3 = "6h"
                            } else if (selectedTimestamp === "12 hours") {
                                timeRange3 = "1d"
                            } else if (selectedTimestamp === "1 Day" || !selectedTimestamp) {
                                timeRange3 = "1d"
                            } else if (selectedTimestamp === "7 Days") {
                                timeRange3 = "7d"
                            }

                            let timeRange4 = selectedTimestamp
                            if (!selectedTimestamp) { timeRange4 = '1 day' }

                            if (selectedChain.toLowerCase() == "ethereum") {




                                let marketCap = 0
                                let marketSentiment = 0
                                let marketSentimentFormatted = "Neutral"
                                let holderCount = 0
                                let whaleCount = 0
                                let traderCount = 0
                                let saleCount = 0
                                let totalVolume = 0
                                let trendingFormatted = ""
                                let marketplacesFormatted = ""
                                let liveMintsFormatted = ""

                                let indicator = ""
                                let avgVolume30D = 0
                                let avgTrader30D = 0
                                let avgSaleCount30D = 0
                                let traderRatio = 0
                                let volumeRatio = 0
                                let salesRatio = 0
                                let globalEvolution = 0
                                let roiPrefix1 = ""
                                let roiSuffix1 = ""
                                let roiPrefix2 = ""
                                let roiSuffix2 = ""
                                let roiPrefix3 = ""
                                let roiSuffix3 = ""
                                let traderRatioFormatted = "0.00%"
                                let volumeRatioFormatted = "0.00%"
                                let salesRatioFormatted = "0.00%"
                                let globalEvolutionFormatted = "Neutral"

                                //Récupère le prix de l'ETH
                                const ethusdtPrice = getEthPrice()


                                //Call API sur les data générales
                                nftgo.get_metrics_eth_v1_market_metrics_get()
                                    .then(async ({ data: marketdata }) => {
                                        console.log("check 1")


                                        nftgo.get_collection_ranking_eth_v1_market_rank_collection__time_range__get({ by: 'volume', with_rarity: 'false', asc: 'false', offset: '0', limit: '10', time_range: timeRange })
                                            .then(async ({ data: topCollectionRanking }) => {

                                                console.log("check 2")


                                                nftgo.get_marketplace_leaderboard_eth_v1_market_rank_marketplaces__time_range__get({ sort_by: 'volume', asc: 'false', offset: '0', limit: '6', exclude_wash_trading: 'false', time_range: timeRange2 })
                                                    .then(async ({ data: topMarketplacesRanking }) => {
                                                        console.log("check 3")

                                                        marketCap = marketdata.market_cap_usd
                                                        marketSentiment = marketdata.market_sentiment.score
                                                        holderCount = marketdata.holder_num
                                                        whaleCount = marketdata.whale_num


                                                        if (marketSentiment <= 20) { marketSentimentFormatted = "Extreme Fear" }
                                                        else if (marketSentiment > 20 && marketSentiment <= 40) { marketSentimentFormatted = "Fear" }
                                                        else if (marketSentiment > 40 && marketSentiment <= 60) { marketSentimentFormatted == "Neutral" }
                                                        else if (marketSentiment > 60 && marketSentiment <= 80) { marketSentimentFormatted = "Greed" }
                                                        else if (marketSentiment > 80 && marketSentiment <= 100) { marketSentimentFormatted = "Extreme Greed" }


                                                        // CALCUL DES VALEURS VARIABLES DU CALL
                                                        if (selectedTimestamp === "1 hour") {
                                                            saleCount = marketdata.sale_num['24h'] / 24
                                                            traderCount = marketdata.trader_num['24h'] / 24
                                                            totalVolume = marketdata.volume['24h'] / 24

                                                            avgVolume30D = (marketdata.volume['30d'] / 30) / 24
                                                            avgTrader30D = (marketdata.trader_num['30d'] / 30) / 24
                                                            avgSaleCount30D = (marketdata.sale_num['30d'] / 30) / 24

                                                            indicator = "1H"
                                                        } else if (selectedTimestamp === "6 hours") {
                                                            saleCount = marketdata.sale_num['24h'] / 4
                                                            traderCount = marketdata.trader_num['24h'] / 4
                                                            totalVolume = marketdata.volume['24h'] / 4

                                                            avgVolume30D = (marketdata.volume['30d'] / 30) / 4
                                                            avgTrader30D = (marketdata.trader_num['30d'] / 30) / 4
                                                            avgSaleCount30D = (marketdata.sale_num['30d'] / 30) / 4


                                                            indicator = "6H"
                                                        } else if (selectedTimestamp === "12 hour") {
                                                            saleCount = marketdata.sale_num['24h'] / 2
                                                            traderCount = marketdata.trader_num['24h'] / 2
                                                            totalVolume = marketdata.volume['24h'] / 2

                                                            avgVolume30D = (marketdata.volume['30d'] / 30) / 2
                                                            avgTrader30D = (marketdata.trader_num['30d'] / 30) / 2
                                                            avgSaleCount30D = (marketdata.sale_num['30d'] / 30) / 2


                                                            indicator = "12H"
                                                        } else if (selectedTimestamp === "1 Day" || !selectedTimestamp) {
                                                            saleCount = marketdata.sale_num['24h']
                                                            traderCount = marketdata.trader_num['24h']
                                                            totalVolume = marketdata.volume['24h']

                                                            avgVolume30D = marketdata.volume['30d'] / 30
                                                            avgTrader30D = marketdata.trader_num['30d'] / 30
                                                            avgSaleCount30D = marketdata.sale_num['30d'] / 30


                                                            indicator = "1D"
                                                        } else if (selectedTimestamp === "7 Days") {
                                                            saleCount = marketdata.sale_num['7d']
                                                            traderCount = marketdata.trader_num['7d']
                                                            totalVolume = marketdata.volume['7d']

                                                            avgVolume30D = (marketdata.volume['30d'] / 30) * 7
                                                            avgTrader30D = (marketdata.trader_num['30d'] / 30) * 7
                                                            avgSaleCount30D = (marketdata.sale_num['30d'] / 30) * 7


                                                            indicator = "7D"
                                                        }


                                                        //Calcul des ratio
                                                        traderRatio = ((traderCount - avgTrader30D) / avgTrader30D) * 100
                                                        salesRatio = ((saleCount - avgSaleCount30D) / avgSaleCount30D) * 100
                                                        volumeRatio = ((totalVolume - avgVolume30D) / avgVolume30D) * 100

                                                        // Formattage des ratio
                                                        if (traderRatio > 0) {
                                                            roiPrefix1 = "+";
                                                            roiSuffix1 = " :chart_with_upwards_trend:";
                                                        } else if (traderRatio < 0) {
                                                            roiSuffix1 = " :chart_with_downwards_trend:";
                                                        }
                                                        traderRatioFormatted = "`" + roiPrefix1 + parseFloat(traderRatio).toFixed(2) + "%" + "`" + roiSuffix1;

                                                        if (salesRatio > 0) {
                                                            roiPrefix2 = "+";
                                                            roiSuffix2 = " :chart_with_upwards_trend:";
                                                        } else if (salesRatio < 0) {
                                                            roiSuffix2 = " :chart_with_downwards_trend:";
                                                        }
                                                        salesRatioFormatted = "`" + roiPrefix2 + parseFloat(salesRatio).toFixed(2) + "%" + "`" + roiSuffix2;

                                                        if (volumeRatio > 0) {
                                                            roiPrefix3 = "+";
                                                            roiSuffix3 = " :chart_with_upwards_trend:";
                                                        } else if (volumeRatio < 0) {
                                                            roiSuffix3 = " :chart_with_downwards_trend:";
                                                        }
                                                        volumeRatioFormatted = "`" + roiPrefix3 + parseFloat(volumeRatio).toFixed(2) + "%" + "`" + roiSuffix3;


                                                        if (volumeRatio > 0) { globalEvolution += 1 } else if (volumeRatio < 0) { globalEvolution -= 1 }
                                                        if (salesRatio > 0) { globalEvolution += 1 } else if (salesRatio < 0) { globalEvolution -= 1 }
                                                        if (traderRatio > 0) { globalEvolution += 1 } else if (traderRatio < 0) { globalEvolution -= 1 }

                                                        if (globalEvolution > 0) { globalEvolutionFormatted = "Positive" } else if (globalEvolution < 0) { globalEvolutionFormatted = "Negative" }




                                                        for (const obj of topCollectionRanking.collections) {


                                                            let collectionName = obj.slug
                                                            let collectionFloor = obj.floor_price_eth
                                                            let collectionHolder = obj.holder_num
                                                            let collectionWhale = obj.whale_num
                                                            let collectionVolume = obj.volume_eth
                                                            let collectionWhaleRatio = (collectionWhale * 100 / collectionHolder)

                                                            // let collectionNameFormatted = truncatePhrase(collectionName);

                                                            let lignMaxSize = 69
                                                            let leftPartNfts = "`" + collectionName + ":"
                                                            let rightPartNfts = parseFloat(collectionFloor).toFixed(3) + "Ξ ∙ " + parseFloat(collectionVolume).toFixed(0) + "Ξ ∙ " + collectionHolder + " owners ∙ " + parseFloat(collectionWhaleRatio).toFixed(2) + "% whales\n"
                                                            let leftPartNFTsLenght = leftPartNfts.length
                                                            let rightPartNftsLenght = rightPartNfts.length
                                                            let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                                                            let spaceLenght = ""
                                                            for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

                                                            trendingFormatted += "`" + collectionName + ":" + spaceLenght + parseFloat(collectionFloor).toFixed(3) + "Ξ ∙ " + parseFloat(collectionVolume).toFixed(0) + "Ξ ∙ " + collectionHolder + " owners ∙ " + parseFloat(collectionWhaleRatio).toFixed(2) + "% whales`\n"


                                                        }


                                                        let volume = 0;
                                                        topMarketplacesRanking.marketplaces_info.forEach((marketplace) => {
                                                            volume += marketplace.volume_eth;
                                                        });
                                                        const marketShares = {};
                                                        topMarketplacesRanking.marketplaces_info.forEach((marketplace) => {
                                                            const share = ((marketplace.volume_eth / volume) * 100).toFixed(2);
                                                            marketShares[marketplace.marketplace_name] = share;
                                                        });


                                                        for (const obj of topMarketplacesRanking.marketplaces_info) {

                                                            let marketplaceName = obj.marketplace_name
                                                            let marketplaceNameFormatted = (obj.marketplace_name).toLowerCase()


                                                            if (marketplaceName !== "Blur Aggregator" && marketplaceName !== "CryptoPunks") {

                                                                let marketplaceVolume = obj.volume_eth
                                                                let marketplaceSales = obj.sale_num
                                                                let marketplaceTrader = obj.trader_num
                                                                let marketShare = 0

                                                                marketShare = marketShares[marketplaceName]



                                                                if (selectedTimestamp === "1 hour") {
                                                                    marketplaceVolume = (obj.volume_eth) / 24
                                                                    marketplaceSales = (obj.sale_num) / 24
                                                                    marketplaceTrader = (obj.trader_num) / 24

                                                                } else if (selectedTimestamp === "6 hours") {
                                                                    marketplaceVolume = (obj.volume_eth) / 4
                                                                    marketplaceSales = (obj.sale_num) / 4
                                                                    marketplaceTrader = (obj.trader_num) / 4

                                                                } else if (selectedTimestamp === "12 hour") {
                                                                    marketplaceVolume = (obj.volume_eth) / 2
                                                                    marketplaceSales = (obj.sale_num) / 2
                                                                    marketplaceTrader = (obj.trader_num) / 2

                                                                } else if (selectedTimestamp === "1 Day") {
                                                                    marketplaceVolume = obj.volume_eth
                                                                    marketplaceSales = obj.sale_num
                                                                    marketplaceTrader = obj.trader_num

                                                                } else if (selectedTimestamp === "7 Days") {
                                                                    marketplaceVolume = obj.volume_eth
                                                                    marketplaceSales = obj.sale_num
                                                                    marketplaceTrader = obj.trader_num
                                                                }



                                                                let lignMaxSize = 69
                                                                let leftPartNfts = "`" + marketplaceNameFormatted + ":"
                                                                let rightPartNfts = parseFloat(marketplaceVolume).toFixed(0) + "Ξ ∙ " + parseFloat(marketplaceSales).toFixed(0) + " sales ∙ " + parseFloat(marketplaceTrader).toFixed(0) + " traders ∙ " + parseFloat(marketShare).toFixed(2) + "%`\n"
                                                                let leftPartNFTsLenght = leftPartNfts.length
                                                                let rightPartNftsLenght = rightPartNfts.length
                                                                let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                                                                let spaceLenght = ""
                                                                for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

                                                                marketplacesFormatted += "`" + marketplaceNameFormatted + ":" + spaceLenght + parseFloat(marketplaceVolume).toFixed(0) + "Ξ ∙ " + parseFloat(marketplaceSales).toFixed(0) + " sales ∙ " + parseFloat(marketplaceTrader).toFixed(0) + " traders ∙ " + parseFloat(marketShare).toFixed(2) + "%`\n"

                                                            }
                                                        }




                                                        const marketOverviewEmbed1 = new EmbedBuilder().setColor("#060A8F")
                                                            .setTitle(`Market overview`)
                                                            .setDescription(">>> Displaying the `" + timeRange4 + "` Ethereum NFT market metrics")
                                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                                            .addFields(
                                                                { name: "ETH Price", value: "`" + parseFloat(ethusdtPrice).toFixed(2) + "$`", inline: true },
                                                                { name: "Market Cap", value: "`" + parseFloat(marketCap / ethusdtPrice).toFixed(3) + "Ξ\n(" + new Intl.NumberFormat('en-US').format(parseFloat(marketCap).toFixed(0)) + "$)`", inline: true },
                                                                { name: "Market Sentiment", value: "`" + marketSentimentFormatted + "`", inline: true },
                                                                { name: indicator + " Volume", value: "`" + parseFloat(totalVolume / ethusdtPrice).toFixed(3) + "Ξ\n(" + new Intl.NumberFormat('en-US').format(parseFloat(totalVolume).toFixed(0)) + "$)`", inline: true },
                                                                { name: "90D Average", value: "`" + parseFloat(avgVolume30D / ethusdtPrice).toFixed(3) + "Ξ\n(" + new Intl.NumberFormat('en-US').format(parseFloat(avgVolume30D).toFixed(0)) + "$)`", inline: true },
                                                                { name: "Volume Evolution", value: volumeRatioFormatted, inline: true },
                                                                { name: indicator + " Trader Count", value: "`" + parseFloat(traderCount).toFixed(0) + " traders`", inline: true },
                                                                { name: "90D Average", value: "`" + parseFloat(avgTrader30D).toFixed(0) + " traders`", inline: true },
                                                                { name: "Traders Evolution", value: traderRatioFormatted, inline: true },
                                                                { name: indicator + " Sale Count", value: "`" + parseFloat(saleCount).toFixed(0) + " sales`", inline: true },
                                                                { name: "90D Average", value: "`" + parseFloat(avgSaleCount30D).toFixed(0) + " sales`", inline: true },
                                                                { name: "Sales Evolution", value: salesRatioFormatted, inline: true },
                                                                { name: "Holder Count", value: "`" + holderCount + " holders`", inline: true },
                                                                { name: "Whale Count", value: "`" + whaleCount + " whales`", inline: true },
                                                                { name: "Global Evolution", value: "`" + globalEvolutionFormatted + "`", inline: true },
                                                                { name: " ", value: " ", inline: false },
                                                                { name: "Trending (" + timeRange + ")", value: trendingFormatted, inline: false },
                                                                { name: " ", value: " ", inline: false },
                                                                { name: "Marketplaces (" + timeRange + ")", value: marketplacesFormatted, inline: false },
                                                                { name: "Page", value: "`[1/1]`", inline: false },

                                                            )
                                                            .setTimestamp()
                                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                                        await interaction.editReply({ embeds: [marketOverviewEmbed1] });



                                                        //On enregistre le call API dans la database
                                                        const timeStamp = Date.now();
                                                        await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/market", apiCallName: "ethUsdPrice", apiProvider: "etherscan", timestamp: timeStamp.toString() })
                                                        await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/market", apiCallName: "get_metrics_eth_v1_market_metrics_get", apiProvider: "nftgo", timestamp: timeStamp.toString() })
                                                        await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/market", apiCallName: "get_collection_ranking_eth_v1_market_rank_collection__time_range__get", apiProvider: "nftgo", timestamp: timeStamp.toString() })
                                                        await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/market", apiCallName: "get_marketplace_leaderboard_eth_v1_market_rank_marketplaces__time_range__get", apiProvider: "nftgo", timestamp: timeStamp.toString() })




                                                    })

                                            })
                                    })


                            } else if (selectedChain.toLowerCase() == "bitcoin") {



                                const btcCallPrice = await axios.get("https://blockchain.info/q/24hrprice")
                                let BTCUsdPrice = btcCallPrice.data

                                const marketCapCall = await axios.get("https://blockchain.info/q/marketcap")
                                let BTCMarketCap = marketCapCall.data

                                const btcSupplyCall = await axios.get("https://blockchain.info/q/totalbc")
                                let supply = (btcSupplyCall.data) / (10 ** 8)

                                // const timeBetweenBlockCall = await axios.get("https://blockchain.info/q/interval")
                                // let timeBetweenBlock = timeBetweenBlockCall.data

                                const volumeCall = await axios.get("https://blockchain.info/q/24hrbtcsent")
                                let volume = (volumeCall.data) / (10 ** 8)

                                const txnCountCall = await axios.get("https://blockchain.info/q/24hrtransactioncount")
                                let txnCount = txnCountCall.data





                                //Call API sur les data générales
                                nftgo.get_metrics_eth_v1_market_metrics_get()
                                    .then(async ({ data: marketdata }) => {


                                        //ON FAIT LE MARKET SENTIMENT
                                        marketSentiment = marketdata.market_sentiment.score

                                        if (marketSentiment <= 20) { marketSentimentFormatted = "Extreme Fear" }
                                        else if (marketSentiment > 20 && marketSentiment <= 40) { marketSentimentFormatted = "Fear" }
                                        else if (marketSentiment > 40 && marketSentiment <= 60) { marketSentimentFormatted == "Neutral" }
                                        else if (marketSentiment > 60 && marketSentiment <= 80) { marketSentimentFormatted = "Greed" }
                                        else if (marketSentiment > 80 && marketSentiment <= 100) { marketSentimentFormatted = "Extreme Greed" }





                                        const url5 = `https://api-mainnet.magiceden.dev/v2/ord/btc/popular_collections?window=` + timeRange3 + `&limit=12`;
                                        const response5 = await axios.get(url5, { headers: magiceden });
                                        const data5 = await response5.data;


                                        let trendingFormatted = ""

                                        for (const obj of data5) {


                                            let collectionName = (obj.name).toLowerCase()
                                            let collectionFloor = (obj.floorPrice) / (10 ** 8)
                                            let collectionHolder = obj.owners
                                            let collectionSupply = obj.supply
                                            let collectionVolume = (obj.totalVolume) / (10 ** 8)
                                            let collectionSales = obj.sales

                                            // let collectionNameFormatted = truncatePhrase(collectionName);

                                            let lignMaxSize = 69
                                            let leftPartNfts = "`" + collectionName + ":"
                                            let rightPartNfts = parseFloat(collectionFloor).toFixed(3) + "₿ ∙ " + parseFloat(collectionVolume).toFixed(0) + "₿ ∙ " + parseFloat(collectionSales).toFixed(0) + " sales ∙ " + collectionHolder + " owners`\n"
                                            let leftPartNFTsLenght = leftPartNfts.length
                                            let rightPartNftsLenght = rightPartNfts.length
                                            let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                                            let spaceLenght = ""
                                            for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

                                            trendingFormatted += "`" + collectionName + ":" + spaceLenght + parseFloat(collectionFloor).toFixed(3) + "₿ ∙ " + parseFloat(collectionVolume).toFixed(0) + "₿ ∙ " + parseFloat(collectionSales).toFixed(0) + " sales ∙ " + collectionHolder + " owners`\n"


                                        }






                                        const marketOverviewEmbed1 = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle(`Market overview`)
                                            .setDescription(">>> Displaying the `" + timeRange4 + "` Bitcoin NFT market metrics")
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .addFields(
                                                { name: "BTC Price", value: "`" + new Intl.NumberFormat('en-US').format(parseFloat(BTCUsdPrice).toFixed(2)) + "$)`", inline: true },
                                                { name: "BTC Market Cap", value: "`" + parseFloat(BTCMarketCap / BTCUsdPrice).toFixed(3) + "₿\n(" + new Intl.NumberFormat('en-US').format(parseFloat(BTCMarketCap).toFixed(0)) + "$)`", inline: true },
                                                { name: "Market Sentiment", value: "`" + marketSentimentFormatted + "`", inline: true },

                                                { name: "Global Supply", value: "`" + new Intl.NumberFormat('en-US').format(parseFloat(supply).toFixed(0)) + "`", inline: true },
                                                { name: "1D Volume", value: "`" + parseFloat(volume).toFixed(3) + "₿\n(" + new Intl.NumberFormat('en-US').format(parseFloat(volume * BTCUsdPrice).toFixed(0)) + "$)`", inline: true },
                                                { name: "Total Trades", value: "`" + txnCount + "`", inline: true },

                                                { name: " ", value: " ", inline: false },
                                                { name: "Trending (" + timeRange3 + ")", value: trendingFormatted, inline: false },
                                                { name: "Page", value: "`[1/1]`", inline: false },

                                            )
                                            .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                        await interaction.editReply({ embeds: [marketOverviewEmbed1] });

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
                let reportCommand = "/market"


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
};

