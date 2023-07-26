/**
 * @file Sample getdata command with slash command.
 * @author Vitality Migø
 */


const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { profileData, accessSql, reportsql, interactionData, wallets, apimonitorsql, adminsql, usersql, sequelize } = require('../../../events/database');
const moment = require('moment');

//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const etherscanApiKey = process.env.etherscanApiKey
const reservoirApiKey = process.env.reservoirApiKey
const blockspanApiKey = process.env.blockspanApiKey
const alchemyApiKey = process.env.alchemyApiKey
const moralisApiKey = process.env.moralisApiKey
const chartApiKey = process.env.chartApiKey


const axios = require('axios')

const Moralis = require("moralis").default;
Moralis.start({ apiKey: moralisApiKey });




//Reservoir API
const sdk = require('api')('@reservoirprotocol/v2.0#2672bklexdpsbi');
sdk.auth(reservoirApiKey);
//;

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


function isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}



module.exports = {
    data: new SlashCommandBuilder()
        .setName("coin")
        .setDescription("Display key data about a specific ERC20 or BRC-20 token")
        .addStringOption(option =>
            option
                .setName("coin")
                .setDescription("The contract address (ERC20) or token symbol (BRC20) of the coin")
                .setRequired(true)
        ),

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
                            const timeStamp = Date.now();
                            const actualTimestamp = parseFloat(timeStamp / 1000).toFixed(0)
                            const isUser = await usersql.findOne({ where: { userId: authorId, serverId: serverId } })
                            if (isUser == null) { await usersql.create({ userId: authorId, userName: authorName, userAvatar: userAvatar, serverId: serverId, timestamp: actualTimestamp }) }


                            //Variable pour les options
                            const coinTicker = interaction.options.getString("coin")

                            //Récupère le prix de l'ETH
                            const ethCallPrice = await axios.get('https://api.etherscan.io/api?module=stats&action=ethprice&apikey=' + etherscanApiKey)
                            let ethPriceUsd = ethCallPrice.data.result.ethusd



                            if (!isValidEthereumAddress(coinTicker)) {

                                console.log(actualTimestamp)
                                //Calculer les timestamp
                                const timestamp1d = actualTimestamp - 86400
                                const timestamp3d = actualTimestamp - 259200
                                const timestamp7d = actualTimestamp - 604800



                                //Premier bash de call



                                const symbolLookup = await axios.get(" https://api.coinranking.com/v2/coins?search=" + coinTicker + "&referenceCurrencyUuid=razxDUgYGNAdQ")



                                if (symbolLookup.data.data.coins.length > 0) {



                                    let coinId = symbolLookup.data.data.coins[0].uuid
                                    let coinSymbol = symbolLookup.data.data.coins[0].symbol
                                    let coinName = symbolLookup.data.data.coins[0].name
                                    let coinIcon = symbolLookup.data.data.coins[0].iconUrl
                                    let coinMarketcap = symbolLookup.data.data.coins[0].marketCap
                                    let coinPriceEth = symbolLookup.data.data.coins[0].price
                                    let coinPriceBtc = symbolLookup.data.data.coins[0].btcPrice
                                    let coinPriceUsd = (ethPriceUsd * coinPriceEth).toFixed(5)
                                    let coinVolume24h = symbolLookup.data.data.coins[0]['24hVolume']


                                    const coinStats = await axios.get("https://api.coinranking.com/v2/coin/" + coinId)

                                    let actualSupply = coinStats.data.data.coin.supply.total
                                    let circulatingSupply = Intl.NumberFormat('en-US').format(parseFloat(coinStats.data.data.coin.supply.circulating).toFixed(0))
                                    let maxSupply = Intl.NumberFormat('en-US').format(parseFloat(coinStats.data.data.coin.supply.max).toFixed(0))
                                    let coinath = coinStats.data.data.coin.allTimeHigh.price
                                    let description = coinStats.data.data.coin.description
                                    let change = coinStats.data.data.coin.supply.change
                                    let exchange = coinStats.data.data.coin.numberOfExchanges
                                    let pairs = coinStats.data.data.coin.numberOfMarkets
                                    let coinRankingLink = coinStats.data.data.coin.coinrankingUrl
                                    let inscriptionId = "not available"




                                    //On calcule le prix historique pour 1d, 3d et 7d
                                    const coinPriceHistory = await axios.get("https://api.coinranking.com/v2/coin/" + coinId + "/history?timePeriod=3m")

                                    let price1d = 0
                                    let price3d = 0
                                    let price7d = 0
                                    let differenceMin = Infinity;
                                    let differenceMin2 = Infinity;
                                    let differenceMin3 = Infinity;


                                    //Price 1d
                                    coinPriceHistory.data.data.history.forEach(item => {
                                        const difference = Math.abs(item.timestamp - timestamp1d);
                                        if (difference < differenceMin) {
                                            differenceMin = difference;
                                            price1d = item.price;
                                        }
                                    });
                                    let evolution1d = parseFloat(((coinPriceUsd - price1d) / price1d) * 100).toFixed(2)
                                    if (evolution1d > 0) { evolution1d = "+" + evolution1d }


                                    //Price 3d
                                    coinPriceHistory.data.data.history.forEach(item => {
                                        const difference = Math.abs(item.timestamp - timestamp3d);
                                        if (difference < differenceMin2) {
                                            differenceMin2 = difference;
                                            price3d = item.price;
                                        }
                                    });
                                    let evolution3d = parseFloat(((coinPriceUsd - price3d) / price3d) * 100).toFixed(2)
                                    if (evolution3d > 0) { evolution3d = "+" + evolution3d }


                                    //Price 7d
                                    coinPriceHistory.data.data.history.forEach(item => {
                                        const difference = Math.abs(item.timestamp - timestamp7d);
                                        if (difference < differenceMin3) {
                                            differenceMin3 = difference;
                                            price7d = item.price;
                                        }
                                    });
                                    let evolution7d = parseFloat(((coinPriceUsd - price7d) / price7d) * 100).toFixed(2)
                                    if (evolution7d > 0) { evolution7d = "+" + evolution7d }







                                    if (description == null) { description = ">>> Displaying key data of " + "`$" + coinSymbol.toUpperCase() + "`" }
                                    if (maxSupply == "NaN") { maxSupply = "No limit." }
                                    if (circulatingSupply == "NaN") { circulatingSupply = Intl.NumberFormat('en-US').format(parseFloat(coinStats.data.data.coin.supply.total).toFixed(0)) }


                                    //On met en forme les liens
                                    let linksFormatted = ""
                                    for (const links of coinStats.data.data.coin.links) {

                                        let name = links.name
                                        let url = links.url
                                        let type = links.type

                                        if (name.includes("ordiscan")) {

                                            type = "ordiscan"

                                            let inscriptionLink = url.split("/")
                                            inscriptionId = inscriptionLink[inscriptionLink.length - 1]
                                        }

                                        linksFormatted += '[' + type + '](' + url + ") ∙ "



                                    }

                                    linksFormatted += '[coinranking](' + coinRankingLink + ") ∙ " + '[twitter search](https://twitter.com/search?q=' + coinSymbol + "&src=typed_query)"


                                    const getDataCollectionAddress = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle(coinName + " (" + coinSymbol.toUpperCase() + ")")
                                        .setDescription(description)
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setThumbnail(coinIcon)
                                        .addFields(
                                            { name: " ", value: " ", inline: false },
                                            { name: "Inscription", value: "`" + inscriptionId + "`", inline: false },
                                            { name: "BTC Price", value: "`" + parseFloat(coinPriceBtc).toFixed(5) + "₿`", inline: true },
                                            { name: "ETH Price", value: "`" + parseFloat(coinPriceEth).toFixed(5) + "Ξ`", inline: true },
                                            { name: "USD Price", value: "`" + new Intl.NumberFormat('en-US').format((ethPriceUsd * coinPriceEth).toFixed(5)) + "$`", inline: true },
                                            { name: "Supply", value: "`" + new Intl.NumberFormat('en-US').format(parseFloat(actualSupply).toFixed(0)) + "`", inline: true },
                                            { name: "Circulating Supply", value: "`" + circulatingSupply + "`", inline: true },
                                            { name: "Max Supply", value: "`" + maxSupply + "`", inline: true },
                                            { name: "1D Volume", value: "`" + parseFloat(coinVolume24h).toFixed(5) + "Ξ\n(" + new Intl.NumberFormat('en-US').format((ethPriceUsd * coinVolume24h).toFixed(0)) + "$)`", inline: true },
                                            { name: "Market Cap", value: "`" + parseFloat(coinMarketcap).toFixed(5) + "Ξ\n(" + new Intl.NumberFormat('en-US').format((ethPriceUsd * coinMarketcap).toFixed(0)) + "$)`", inline: true },
                                            { name: "ATH", value: "`" + parseFloat(coinath / ethPriceUsd).toFixed(5) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(coinath).toFixed(0)) + "$)`", inline: true },
                                            { name: "1D Price", value: "`" + new Intl.NumberFormat('en-US').format(parseFloat(price1d).toFixed(5)) + "$`", inline: true },
                                            { name: "1D Evolution", value: "`" + evolution1d + "%`", inline: true },
                                            { name: " ", value: " ", inline: true },
                                            { name: "3D Price", value: "`" + new Intl.NumberFormat('en-US').format(parseFloat(price3d).toFixed(5)) + "$`", inline: true },
                                            { name: "3D Evolution", value: "`" + evolution3d + "%`", inline: true },
                                            { name: " ", value: " ", inline: true },
                                            { name: "7D Price", value: "`" + new Intl.NumberFormat('en-US').format(parseFloat(price7d).toFixed(5)) + "$`", inline: true },
                                            { name: "7D Evolution", value: "`" + evolution7d + "%`", inline: true },
                                            { name: " ", value: " ", inline: true },
                                            { name: "Exchanges", value: "`" + exchange + "`", inline: true },
                                            { name: "Pairs", value: "`" + pairs + "`", inline: true },
                                            { name: "Links", value: linksFormatted, inline: false },


                                        )
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                    await interaction.editReply({ embeds: [getDataCollectionAddress] });




                                    await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/coin", apiCallName: "getCoinInfo", apiProvider: "coinranking", timestamp: timeStamp.toString() })
                                    await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/coin", apiCallName: "getCoinStats", apiProvider: "coinranking", timestamp: timeStamp.toString() })
                                    await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/coin", apiCallName: "getCoinPriceHistory", apiProvider: "coinranking", timestamp: timeStamp.toString() })

                                } else {

                                    const getDataCollectionAddress = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Coin")
                                    .setDescription("The token symbol you entered `" + coinTicker + "` isn't a valid BRC20 token symbol. If the token you'd like to analyze is an ERC20 token, please enter the Ethereum token address instead. If it's a BRC20 token, please enter a valid token symbol.")
                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setTimestamp()
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [getDataCollectionAddress] });



                                    await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/coin", apiCallName: "getCoinInfo", apiProvider: "coinranking", timestamp: timeStamp.toString() })

                                }

                            } else {


                                let volume1h = "N/A"
                                let volume6h = "N/A"
                                let volume1d = "N/A"
                                let evolution1h = "N/A"
                                let evolution6h = "N/A"
                                let evolution1d = "N/A"
                                let liquidity = "N/A"
                                let initialLiquidity = "N/A"
                                let poolGrowth = "N/A"
                                let fdv = "N/A"
                                let inTrades = "N/A"
                                let outTrades = "N/A"





                                //On récupère les infos du coin
                                const coinInfos = await alchemy.core.getTokenMetadata(coinTicker)
                                if (coinInfos.symbol !== "") {


                                    coinName = coinInfos.name
                                    coinSymbol = coinInfos.symbol
                                    coinDecimal = coinInfos.decimals

                                    //On load l'image
                                    const chartImageLink = "https://api.chart-img.com/v1/tradingview/advanced-chart?key=" + chartApiKey + "&symbol=" + coinSymbol + "WETH&interval=1D&theme=dark&width=800&height=400"






                                    const response = await Moralis.EvmApi.token.getTokenPrice({
                                        "chain": "0x1",
                                        "address": coinTicker,

                                    });

                                    coinActualPriceUsd = response.raw.usdPrice
                                    coinActualPriceEth = 1 / (ethPriceUsd / coinActualPriceUsd)




                                    const coinPriceHistory = await axios.get("https://api.dexscreener.io/latest/dex/tokens/" + coinTicker.toLowerCase())
                                    console.log(coinPriceHistory.data)

                                    if (coinPriceHistory.data.pairs !== null) {

                                        const pairWeth = coinPriceHistory.data.pairs.filter((item) => item.quoteToken.address === '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');

                                        volume1h = pairWeth[0].volume.h1
                                        volume6h = pairWeth[0].volume.h6
                                        volume1d = pairWeth[0].volume.h24

                                        evolution1h = pairWeth[0].priceChange.h1
                                        evolution6h = pairWeth[0].priceChange.h6
                                        evolution1d = pairWeth[0].priceChange.h24

                                        if (evolution1h > 0) { evolution1h = "+" + evolution1h }
                                        if (evolution6h > 0) { evolution6h = "+" + evolution6h }
                                        if (evolution1d > 0) { evolution1d = "+" + evolution1d }

                                        liquidity = new Intl.NumberFormat('en-US').format((pairWeth[0].liquidity.usd).toFixed(0))
                                        initialLiquidity = Intl.NumberFormat('en-US').format((pairWeth[0].liquidity.base).toFixed(0))
                                        poolGrowth = parseFloat(pairWeth[0].liquidity.quote).toFixed(0)

                                        fdv = pairWeth[0].fdv

                                        inTrades = pairWeth[0].txns.h24.buys
                                        outTrades = pairWeth[0].txns.h24.sells


                                    }

                                    //Supply
                                    const coinSupply = await axios.get("https://api.etherscan.io/api?module=stats&action=tokensupply&contractaddress=" + coinTicker + "&apikey=" + etherscanApiKey)
                                    let supply = parseFloat((coinSupply.data.result) / (10 ** coinDecimal)).toFixed(0)

                                    let marketcap = supply * coinActualPriceUsd




                                    const getDataCollectionAddress = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle(coinName + " (" + coinSymbol.toUpperCase() + ")")
                                        .setDescription(">>> Displaying data for `$" + coinSymbol.toUpperCase() + "`.")
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setImage(chartImageLink)
                                        .addFields(
                                            { name: " ", value: " ", inline: false },
                                            { name: "Contract", value: "`" + coinTicker.toLowerCase() + "`", inline: false },
                                            { name: "ETH Price", value: "`" + parseFloat(coinActualPriceEth).toFixed(5) + "Ξ`", inline: true },
                                            { name: "USD Price", value: "`" + new Intl.NumberFormat('en-US').format(coinActualPriceUsd.toFixed(5)) + "$`", inline: true },
                                            { name: " ", value: " ", inline: true },
                                            { name: "Supply", value: "`" + supply + "`", inline: true },
                                            { name: "Circulating Supply", value: "`" + supply + "`", inline: true },
                                            { name: "Buys 24h | Sells 24h", value: "`📈" + inTrades + "|📉" + outTrades + "`", inline: true },
                                            { name: "Liquidity", value: "`" + liquidity + "$`", inline: true },
                                            { name: "Initial Liquidity", value: "`" + initialLiquidity + "$`", inline: true },
                                            { name: "Pool Growth", value: "`" + poolGrowth + "%`", inline: true },
                                            { name: "1H Volume", value: "`" + parseFloat(volume1h / ethPriceUsd).toFixed(5) + "Ξ\n(" + new Intl.NumberFormat('en-US').format(parseFloat(volume1h).toFixed(0)) + "$)`", inline: true },
                                            { name: "1H Price Change", value: "`" + evolution1h + "%`", inline: true },
                                            { name: " ", value: " ", inline: true },
                                            { name: "6H Volume", value: "`" + parseFloat(volume6h / ethPriceUsd).toFixed(5) + "Ξ\n(" + new Intl.NumberFormat('en-US').format(parseFloat(volume6h).toFixed(0)) + "$)`", inline: true },
                                            { name: "6H Price Change", value: "`" + evolution6h + "%`", inline: true },
                                            { name: " ", value: " ", inline: true },
                                            { name: "1D Volume", value: "`" + parseFloat(volume1d / ethPriceUsd).toFixed(5) + "Ξ\n(" + new Intl.NumberFormat('en-US').format(parseFloat(volume1d).toFixed(0)) + "$)`", inline: true },
                                            { name: "1D Price Change", value: "`" + evolution1d + "%`", inline: true },
                                            { name: " ", value: " ", inline: true },
                                            { name: "Market Cap", value: "`" + parseFloat(marketcap / ethPriceUsd).toFixed(0) + "Ξ\n(" + new Intl.NumberFormat('en-US').format(parseFloat(marketcap).toFixed(0)) + "$)`", inline: true },
                                            { name: "Diluated Value", value: "`" + parseFloat(fdv / ethPriceUsd).toFixed(0) + "Ξ\n(" + new Intl.NumberFormat('en-US').format(parseFloat(fdv).toFixed(0)) + "$)`", inline: true },
                                            { name: "Links", value: '[Etherscan](https://etherscan.io/address/' + coinTicker + ") ∙ " + '[DexTools](https://www.dextools.io/app/en/ether/pair-explorer/' + coinTicker + ") ∙ " + '[Honeypot](   https://honeypot.is/ethereum?address=' + coinTicker + ") ∙ " + '[DappRadar](https://dappradar.com/hub/token/eth/' + coinTicker + ")", inline: false },


                                        )
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                    await interaction.editReply({ embeds: [getDataCollectionAddress] });




                                    await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/coin", apiCallName: "getTokenMetadata", apiProvider: "alchemy", timestamp: timeStamp.toString() })
                                    await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/coin", apiCallName: "getTokenPrice", apiProvider: "moralis", timestamp: timeStamp.toString() })
                                    await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/coin", apiCallName: "getChart", apiProvider: "chart", timestamp: timeStamp.toString() })
                                    await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/coin", apiCallName: "getPriceHistoryETH", apiProvider: "dexScreener", timestamp: timeStamp.toString() })
                                    await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/coin", apiCallName: "getTokenSupply", apiProvider: "etherscan", timestamp: timeStamp.toString() })



                                } else {




                                    const notMember = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle(`Token Data`)
                                        .setDescription("The coin address or ticker you entered can't be retreive. This can happen for few reasons :\n\n• The token address (ERC20) or symbol (BRC20) doesn't exist\n• The coin isn't available anymore or is suspicious\n• You entered a symbol for a ERC20 and not a token address, double check.\n\nIf you think the problem is on our end, please use `/report` or contact an admin.")
                                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                    await interaction.editReply({ embeds: [notMember] });




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



