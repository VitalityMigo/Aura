/**
 * @file Sample getdata command with slash command.
 * @author Vitality Migø
 */


const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { profileData, accessSql, reportsql, interactionData, wallets, apimonitorsql, adminsql, usersql, sequelize } = require('../../../events/database');
const moment = require('moment');
const formatCoinValueSign = require("../../../functions/formatNumberEmbed")
const getContract = require("../../../functions/getContract")
const reduceText = require("../../../functions/reducetext")

//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const etherscanApiKey = process.env.etherscanApiKey
const reservoirApiKey = process.env.reservoirApiKey
const blockspanApiKey = process.env.blockspanApiKey
const alchemyApiKey = process.env.alchemyApiKey
const moralisApiKey = process.env.moralisApiKey
const chartApiKey = process.env.chartApiKey
const chainbaseApiKey = process.env.chainbaseApiKey
const magicedenApiKey = process.env.chainbaseApiKey

const axios = require('axios')

const Moralis = require("moralis").default;
Moralis.start({ apiKey: moralisApiKey });


const chainbase = require('api')('@chainbase/v1.0#2hsmm26liym3825');


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



// Configuration de l'en-tête d'autorisation
const headers = {
    'Authorization': `Bearer ${magicedenApiKey}`
};



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



function formatWallet(input) {
    return input.length > 35 ? `${input.substring(0, 6)}…${input.substring(input.length - 6)}` : input;
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
                .setAutocomplete(true)
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



                //Récupère régagle de privé/ou pas de l'utilisateur
                const authorProfile = await profileData.findOne({ where: { authorId: authorId } })

                if (authorProfile === null) { await interaction.deferReply(); } else {
                    const authorPrivacyMode = authorProfile.dataValues.privacyMode

                    if (authorPrivacyMode.toLowerCase() === "private") { await interaction.deferReply({ ephemeral: true }); }
                    if (authorPrivacyMode.toLowerCase() === "public") { await interaction.deferReply(); }
                }

                //Checkpoint
                console.log("// Step 1 : Initialization - Executed ✅")

                if (botGlobalState.toLowerCase() === "on") {


                    if (communityStatut.toLowerCase() === "active" || communityStatut == "") {

                        if (accessTier.toLowerCase() == "s-tier" || accessTier.toLowerCase() == "a-tier") {

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
                                console.log(coinTicker)
                                //Récupère le prix de l'ETH
                                const ethCallPrice = await axios.get('https://api.etherscan.io/api?module=stats&action=ethprice&apikey=' + etherscanApiKey)
                                let ethPriceUsd = ethCallPrice.data.result.ethusd



                                if (!isValidEthereumAddress(coinTicker)) {

                                    //Calculer les timestamp
                                    const timestamp1d = actualTimestamp - 86400
                                    const timestamp3d = actualTimestamp - 259200
                                    const timestamp7d = actualTimestamp - 604800



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

                                        if (coinStats.data.data.coin.tags.includes("brc-20")) {

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
                                            let linksFormatted = "[satswatcher](https://satswatcher.io/token/" + coinTicker.toUpperCase() + ") ∙ "
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
                                    let currentSupply = "N/A"
                                    let poolGrowth = "N/A"
                                    let fdv = "N/A"
                                    let inTrades = "N/A"
                                    let outTrades = "N/A"
                                    let ownership = "N/A"
                                    let holdersFormatted = ""
                                    let holdersCount = "N/A"

                                    let owner = "N/A"
                                    let deployerBalance = 0
                                    let supply = 0
                                    let marketcap = 0
                                    let honeypot
                                    let isHoneyPot = "N/A"
                                    let devBalance = 0
                                    let mintable
                                    let isMintable = "N/A"

                                    //On récupère les infos du coin
                                    const coinInfos = await alchemy.core.getTokenMetadata(coinTicker)

                                    if (coinInfos.symbol !== "") {


                                        coinName = coinInfos.name
                                        coinSymbol = coinInfos.symbol
                                        coinDecimal = coinInfos.decimals

                                        //On load l'image
                                        const chartImageLink = "https://api.chart-img.com/v1/tradingview/advanced-chart?key=" + chartApiKey + "&symbol=" + coinSymbol + "WETH&interval=1D&theme=dark&width=800&height=400"




                                      


                                        const coinPriceHistory = await axios.get("https://api.dexscreener.io/latest/dex/tokens/" + coinTicker.toLowerCase())

                                        const pairWeth = coinPriceHistory.data.pairs.filter((item) => item.quoteToken.address === '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');



                                        if (coinPriceHistory.data.pairs !== null) {

                                            coinActualPriceUsd = pairWeth[0].priceUsd
                                            coinActualPriceEth = 1 / (ethPriceUsd / coinActualPriceUsd)



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
                                            poolGrowth = parseFloat(pairWeth[0].liquidity.quote).toFixed(3)

                                            fdv = pairWeth[0].fdv

                                            inTrades = pairWeth[0].txns.h24.buys
                                            outTrades = pairWeth[0].txns.h24.sells

                                            coinActualPriceUsd = pairWeth[0].priceUsd

                                        }



                                        const goPlusCall = await axios.get("https://api.gopluslabs.io/api/v1/token_security/1?contract_addresses=" + coinTicker)
                                        const contractAudit = goPlusCall.data.result


                                        const values = Object.values(contractAudit)
                                        console.log(values)

                                        if (values.length > 0) {

                                            console.log(values[0])

                                            owner = values[0].owner_address;
                                            deployerBalance = values[0].creator_balance;
                                            ownerBalance = values[0].owner_balance
                                            honeypot = values[0].is_honeypot
                                            supply = values[0].total_supply
                                            mintable = values[0].is_mintable
                                        }

                                        console.log("ici")
                                        console.log("dep " + deployerBalance)
                                        console.log("own " + ownerBalance)
                                        console.log("price " + coinActualPriceUsd)
                                        console.log("supply " + supply)

                                        if (owner.toLowerCase() == "0x0000000000000000000000000000000000000000" || owner.toLowerCase() == "0x000000000000000000000000000000000000dead") {

                                            ownership = "✅ Renounced"
                                            devBalance = parseFloat((deployerBalance * coinActualPriceUsd) / ethPriceUsd).toFixed(3) + "Ξ (" + parseFloat((deployerBalance / supply) * 100).toFixed(1) + "%)"

                                        } else {

                                            ownership = "❌ Not renounced"
                                            devBalance = parseFloat(((deployerBalance + ownerBalance) * coinActualPriceUsd) / ethPriceUsd).toFixed(3) + "Ξ (" + parseFloat(((deployerBalance + ownerBalance) / supply) * 100).toFixed(1) + "%)"

                                        }


                                        if (devBalance.startsWith("NaN")) {
                                            devBalance = "0.000Ξ (0.0%)"
                                            console.log("bug dev balance")
                                        }

                                        if (honeypot == "0") { isHoneyPot = "✅ No" }
                                        else if (honeypot == "1") { isHoneyPot = "❌ Yes" }
                                        else { isHoneyPot = "⚠️ No data" }

                                        if (mintable == "0") { isMintable = "✅ No" }
                                        else if (mintable == "1") { isMintable = "❌ Yes" }
                                        else { isMintable = "⚠️ No data" }





                                        marketcap = supply * coinActualPriceUsd




                                        // FORMAT DES HOLDERS
                                        let holdersTable
                                        await chainbase.getTopTokenHolders({ chain_id: '1', contract_address: coinTicker, page: '1', limit: '8', 'x-api-key': chainbaseApiKey })
                                            .then(async ({ data: holdersData }) => {

                                                holdersTable = holdersData.data
                                                holdersCount = holdersData.count

                                            })



                                        for (const holder of holdersTable) {


                                            let wallet = formatWallet(holder.wallet_address)
                                            let amount = formatCoinValueSign(holder.amount, 2)
                                            let value = formatCoinValueSign(holder.amount * coinActualPriceUsd, 2)
                                            let share = parseFloat((holder.amount / supply) * 100).toFixed(1)



                                            //Formattage
                                            let part1 = "`" + wallet.toLowerCase()
                                            let part2 = amount
                                            let part3 = value + "$ (" + share + "%)`\n"

                                            let spaceSize = 16 - ((part2.toString()).length)
                                            let spaceLenght = ""
                                            for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

                                            let spaceSize2 = 28 - (part3.toString()).length
                                            let spaceLenght2 = ""
                                            for (let i = 0; i < spaceSize2; i++) { spaceLenght2 += " " }



                                            holdersFormatted += part1 + spaceLenght + part2 + spaceLenght2 + part3

                                        }



                                        // //On commence l'audit 
                                        // const contract = await getContract(coinTicker)
                                        // const circulating = await contract.methods.totalSupply().call();
                                        // currentSupply = circulating / (10 ** coinDecimal)



                                        console.log(devBalance)
                                        if (holdersFormatted == "") { holdersFormatted = "No holders found for this token" }

                                        const getDataCollectionAddress = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle(reduceText(coinName, 40) + " (" + coinSymbol.toUpperCase() + ")")
                                            .setDescription(">>> Displaying data for `$" + coinSymbol.toUpperCase() + "`.")
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setImage(chartImageLink)
                                            .addFields(
                                                { name: " ", value: " ", inline: false },
                                                { name: "Contract", value: "`" + coinTicker.toLowerCase() + "`", inline: false },
                                                { name: "ETH Price", value: "`" + parseFloat(coinActualPriceEth).toFixed(5) + "Ξ`", inline: true },
                                                { name: "USD Price", value: "`" + coinActualPriceUsd + "$`", inline: true },
                                                { name: " ", value: " ", inline: true },
                                                { name: "Supply", value: "`" + formatCoinValueSign(supply, 2) + "`", inline: true },
                                                { name: "Circulating Supply", value: "`" + formatCoinValueSign(supply, 2) + "`", inline: true },
                                                { name: "Buys 24h | Sells 24h", value: "`📈" + inTrades + "|📉" + outTrades + "`", inline: true },
                                                { name: "Market Cap", value: "`" + formatCoinValueSign(marketcap) + "$`", inline: true },
                                                { name: "FDV", value: "`" + formatCoinValueSign(fdv) + "$`", inline: true },
                                                { name: "Holders Count", value: "`" + holdersCount + "`", inline: true },
                                                { name: "Liquidity", value: "`" + liquidity + "$`", inline: true },
                                                { name: "Pooled ETH", value: "`" + poolGrowth + "Ξ`", inline: true },
                                                { name: "Dev. Balance", value: "`" + devBalance + "`", inline: true },
                                                { name: "Mintable", value: "`" + isMintable + "`", inline: true },
                                                { name: "Honeypot", value: "`" + isHoneyPot + "`", inline: true },
                                                { name: "Ownership", value: "`" + ownership + "`", inline: true },
                                                { name: "1H Volume", value: "`" + parseFloat(volume1h / ethPriceUsd).toFixed(5) + "Ξ\n(" + new Intl.NumberFormat('en-US').format(parseFloat(volume1h).toFixed(0)) + "$)`", inline: true },
                                                { name: "6H Volume", value: "`" + parseFloat(volume6h / ethPriceUsd).toFixed(5) + "Ξ\n(" + new Intl.NumberFormat('en-US').format(parseFloat(volume6h).toFixed(0)) + "$)`", inline: true },
                                                { name: "1D Volume", value: "`" + parseFloat(volume1d / ethPriceUsd).toFixed(5) + "Ξ\n(" + new Intl.NumberFormat('en-US').format(parseFloat(volume1d).toFixed(0)) + "$)`", inline: true },
                                                { name: "1H Price Change", value: "`" + evolution1h + "%`", inline: true },
                                                { name: "6H Price Change", value: "`" + evolution6h + "%`", inline: true },
                                                { name: "1D Price Change", value: "`" + evolution1d + "%`", inline: true },
                                                //{ name: " ", value: " ", inline: true },
                                                { name: "Holders:", value: holdersFormatted, inline: false },
                                                { name: "Links", value: '[Etherscan](https://etherscan.io/address/' + coinTicker + ") ∙ " + '[DexScreener](https://dexscreener.com/ethereum/' + coinTicker + ") ∙ " + '[Uniswap](https://app.uniswap.org/#/tokens/ethereum/' + coinTicker + ") ∙ " + '[DefiLlama](https://swap.defillama.com/?chain=ethereum&from=0x0000000000000000000000000000000000000000&to=' + coinTicker + ") ∙ " + '[Honeypot](   https://honeypot.is/ethereum?address=' + coinTicker + ")", inline: false },


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





