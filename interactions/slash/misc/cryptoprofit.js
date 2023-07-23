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



function isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);

}

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


const buttonsRow = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('cryptoprofitvisual-button')
            .setLabel('visual')
            .setStyle(2)
    );

module.exports = {
    data: new SlashCommandBuilder()
        .setName("cryptoprofit")
        .setDescription("Display your profit on a specific coin")
        .addStringOption(option =>
            option
                .setName("coin")
                .setDescription("The token address of the coin")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("wallet")
                .setDescription("The category you want to set up your wallet in")
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


            // try {



            const communityRolePerms = await accessSql.findOne({ where: { serverId: serverId } })
            let communityMemberRoleId = communityRolePerms.dataValues.memberRoleId
            let communityAdminRoleId = communityRolePerms.dataValues.adminRoleId
            let botPowerStatut = communityRolePerms.dataValues.actualPower
            let communityStatut = communityRolePerms.dataValues.statut

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

                        //Capter le prix du token (Protocol 0x API)

                        //Variable pour les options
                        const coinAddress = interaction.options.getString("coin")
                        const walletAddress = interaction.options.getString("wallet");


                        //Variable pour l'autocomplete de wallet et collection

                        const allWalletsAuthor = await wallets.findAll({ where: { authorId: authorId, walletCategory: "eth" } })
                        let allWalletsAuthorTable = allWalletsAuthor.map(wallet => wallet.walletAddress);



                        // Prix de l'ETH
                        const etherscanTokenPrice = await axios.get('https://api.etherscan.io/api?module=stats&action=ethprice&apikey=' + etherscanApiKey)
                        const ethUsdPrice = etherscanTokenPrice.data.result.ethusd





                        let buySpent = 0
                        let buyGasSpent = 0
                        let totalBuySpent = 0
                        let soldValue = 0
                        let soldGasValue = 0
                        let totalSoldValue = 0
                        let tokenBoughtCount = 0
                        let tokenSoldCount = 0
                        let tokenHeldCount = 0
                        let tradeInCount = 0
                        let tradeOutCount = 0
                        let airdropCount = 0
                        let realisedProfit = 0
                        let potentialProfit = 0
                        let avgBought = 0
                        let avgSold = 0
                        let avgHeld = 0

                        let coinName = "Ethereum"
                        let coinSymbol = "ETH"
                        let coinDecimal = "1"
                        let coinActualPriceEth = 1
                        let coinActualPriceUsd = 1
                        let walletTokenBalance = 0
                        let exampleCoinPrice = 0

                        let bisTokenInPriceEth = 1
                        let bisTokenOutPriceEth = 1

                        let roi = 0
                        let roiFormatted = "`" + 0 + "%" + "`"
                        let roiPrefix = "";
                        let roiSuffix = "";

                        let allHashTable = []
                        let chartImageLink = 'https://media.discordapp.net/attachments/941040609970491523/1088886350842974229/RC_banniere_discord_test.png?width=1920&height=1080'
                        let testWETH = ""
                        let testUSDT = ""





                        if (isValidEthereumAddress(coinAddress)) {


                            if (walletAddress.toLowerCase() !== 'all') {

                                const walletAddressName = await wallets.findOne({ where: { authorId: authorId, walletAddress: walletAddress } });
                                let walletName1 = walletAddress
                                let walletName = "`" + walletAddress.substring(0, 5) + "..." + walletAddress.substring(walletAddress.length - 4, walletAddress.length) + "`"
                                if (walletAddressName !== null) {
                                     walletName1 = walletAddressName.walletName
                                    walletName = "`" + walletName1 + " (" + walletAddress.substring(0, 5) + "..." + walletAddress.substring(walletAddress.length - 4, walletAddress.length) + ")`"

                                }



                                //On récupère les infos du coin
                                const coinInfos = await alchemy.core.getTokenMetadata(coinAddress)

                                coinName = coinInfos.name
                                coinSymbol = coinInfos.symbol
                                coinDecimal = coinInfos.decimals

                                //On load l'image
                                 chartImageLink = "https://api.chart-img.com/v1/tradingview/advanced-chart?key=" + chartApiKey + "&symbol=" + coinSymbol + "WETH&interval=1D&theme=dark&width=800&height=400"

console.log(chartImageLink)


                                const response = await Moralis.EvmApi.token.getTokenPrice({
                                    "chain": "0x1",
                                    "address": coinAddress,

                                });



                                coinActualPriceUsd = response.raw.usdPrice
                                coinActualPriceEth = 1 / (ethUsdPrice / coinActualPriceUsd)


                                const walletBalance = await axios.get('https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=' + coinAddress + '&address=' + walletAddress + '&tag=latest&apikey=' + etherscanApiKey)
                                tokenHeldCount = (walletBalance.data.result) / (10 ** coinDecimal)

                                const tokenTxnWalletContractCall = await axios.get("https://api.etherscan.io/api?module=account&action=tokentx&address=" + walletAddress + "&page=1&offset=10000&startblock=0&sort=desc&apikey=" + etherscanApiKey)
                                const internalTxnWalletCall = await axios.get("https://api.etherscan.io/api?module=account&action=txlistinternal&address=" + walletAddress + "&startblock=0&page=1&offset=10000&sort=asc&apikey=" + etherscanApiKey)
                                const normalTxnWalletCall = await axios.get("https://api.etherscan.io/api?module=account&action=txlist&address=" + walletAddress + "&startblock=0&page=1&offset=10000&sort=asc&apikey=" + etherscanApiKey)


                                let tokenTxnWalletContractTable = tokenTxnWalletContractCall.data.result
                                let tokenTxnWalletContractTableFiltered = tokenTxnWalletContractTable.filter(obj => obj.contractAddress == coinAddress.toLowerCase());
                                let internalTxnWalletTable = internalTxnWalletCall.data.result
                                let normalTxnWalletTable = normalTxnWalletCall.data.result




                                //On sépare en deux parties (trades in et trades out)
                                let tradeInTxn = []
                                let tradeOutTxn = []

                                for (const transaction of tokenTxnWalletContractTableFiltered) {

                                    if (transaction.to == walletAddress.toLowerCase()) { tradeInTxn.push(transaction) }
                                    if (transaction.from == walletAddress.toLowerCase()) { tradeOutTxn.push(transaction) }

                                }


                                console.log("// Début des deux blocs de transactions : ")
                                console.log(tradeInTxn)
                                console.log(tradeOutTxn)
                                console.log("Fin des deux blocs de transactions // ")

                                //On commence par les trade in
                                for (const transaction of tradeInTxn) {


                                    let hash = transaction.hash
                                    let contractAddress = transaction.contractAddress
                                    let value = (transaction.value) / (10 ** coinDecimal)
                                    let gasSpent = parseFloat(web3.utils.fromWei(((transaction.gasPrice) * (transaction.gasUsed)).toString(), 'ether'))
                                    let from = transaction.from
                                    let to = transaction.to

                                    let tokenLookup = await tokenTxnWalletContractTable.filter(obj => obj.hash == hash.toLowerCase() && obj !== transaction);
                                    let internalLookup = await internalTxnWalletTable.filter(obj => obj.hash == hash.toLowerCase());
                                    let normalLookup = await normalTxnWalletTable.filter(obj => obj.hash == hash.toLowerCase());

                                    allHashTable.push(hash)


                                    //Transfert in/Airdrop/Claim
                                    if (normalLookup.length <= 0 && tokenLookup.length <= 0 && internalLookup.length <= 0) {


                                        if (allWalletsAuthorTable.includes(from)) {

                                            console.log("C'est un Wallet -> Wallet ")


                                            buyGasSpent += gasSpent
                                            tokenBoughtCount += value

                                        } else {

                                            console.log("C'est un Airdrop ")

                                            airdropCount++
                                            tokenBoughtCount += value

                                        }


                                    } else if (tokenLookup.length > 0) {

                                        console.log("C'est un token -> token")

                                        let tokenInPrice = await Moralis.EvmApi.token.getTokenPrice({
                                            "chain": "0x1",
                                            "address": tokenLookup[0].contractAddress,
                                            "toBlock": tokenLookup[0].blockNumber,
                                        });

                                        bisTokenInPriceEth = parseFloat(web3.utils.fromWei((tokenInPrice.raw.nativePrice.value).toString(), 'ether'))

                                        tradeInCount++
                                        tokenBoughtCount += value
                                        buyGasSpent += gasSpent
                                        buySpent += (bisTokenInPriceEth) * ((tokenLookup[0].value) / (10 ** tokenInPrice.raw.tokenDecimals))

                                    } else if (normalLookup.length > 0) {

                                        if (normalLookup[0].value <= 0) {

                                            console.log("c'est un claim")

                                            airdropCount++
                                            buyGasSpent += gasSpent
                                            tokenBoughtCount += value


                                        } else if (normalLookup[0].value > 0) {

                                            console.log("c'est un ETH -> token")


                                            tradeInCount++
                                            buySpent += parseFloat(normalLookup[0].value / (10**18))
                                            buyGasSpent += gasSpent
                                            tokenBoughtCount += value



                                        }


                                    }


                                }



                                //Ensuite on fait les trade out
                                for (const transaction of tradeOutTxn) {



                                    let hash = transaction.hash
                                    let contractAddress = transaction.contractAddress
                                    let value = (transaction.value) / (10 ** coinDecimal)
                                    let gasSpent = parseFloat(web3.utils.fromWei(((transaction.gasPrice) * (transaction.gasUsed)).toString(), 'ether'))
                                    let from = transaction.from
                                    let to = transaction.to

                                    let tokenLookup = tokenTxnWalletContractTable.filter(obj => obj.hash == hash.toLowerCase() && obj !== transaction);
                                    let internalLookup = internalTxnWalletTable.filter(obj => obj.hash == hash.toLowerCase());
                                    let normalLookup = normalTxnWalletTable.filter(obj => obj.hash == hash.toLowerCase());

                                    allHashTable.push(hash)


                                    //Transfert in/Airdrop/Claim
                                    if (normalLookup.length <= 0 && tokenLookup.length <= 0 && internalLookup.length <= 0) {

                                        console.log("C'est un transfert")

                                        if (!allWalletsAuthorTable.includes(to)) {

                                            console.log("C'est un Wallet -> Wallet ")

                                            tokenSoldCount += value

                                        }


                                        soldGasValue += gasSpent


                                    } else if (tokenLookup.length > 0) {

                                        console.log("C'est un token -> token")

                                        let tokenInPrice = await Moralis.EvmApi.token.getTokenPrice({
                                            "chain": "0x1",
                                            "address": tokenLookup[0].contractAddress,
                                            "toBlock": tokenLookup[0].blockNumber,
                                        });

                                        bisTokenOutPriceEth = parseFloat(web3.utils.fromWei((tokenInPrice.raw.nativePrice.value).toString(), 'ether'))

                                        tradeOutCount++
                                        tokenSoldCount += value
                                        soldGasValue += gasSpent
                                        soldValue += (bisTokenOutPriceEth) * ((tokenLookup[0].value) / (10 ** tokenInPrice.raw.tokenDecimals))




                                    } else if (internalLookup.length > 0) {

                                        console.log("C'est un token -> ETH")


                                        tradeOutCount++
                                        soldValue += parseFloat(web3.utils.fromWei((internalLookup[0].value).toString(), 'ether'))
                                        soldGasValue += gasSpent
                                        tokenSoldCount += value
                                    }



                                }




                                //FAIRE LES APPROVE DANS NORMAL TXN
                                const approvalCall = await Moralis.EvmApi.token.getErc20Approvals({
                                    "chain": "0x1",
                                    "contractAddresses": [coinAddress],
                                    "walletAddresses": [walletAddress]
                                });

                                for (const appovalTxn of approvalCall.raw.result) {

                                    if (!allHashTable.includes(appovalTxn.transaction_hash)) {

                                        let normalLookup = await normalTxnWalletTable.filter(obj => obj.hash == (appovalTxn.transaction_hash).toLowerCase());

                                        if ((normalLookup[0].functionName).includes("approve") || (normalLookup[0].functionName).includes("approveAndCall")) {


                                            let gasSpent = parseFloat(web3.utils.fromWei(((normalLookup[0].gasPrice) * (normalLookup[0].gasUsed)).toString(), 'ether'))

                                            soldGasValue += gasSpent


                                        }
                                    }
                                }





                                //Calcul des valeurs à partir de celle récupérés
                                totalBuySpent = buySpent + buyGasSpent
                                totalSoldValue = soldValue - soldGasValue

                                realisedProfit = totalSoldValue - totalBuySpent
                                potentialProfit = realisedProfit + (coinActualPriceEth * tokenHeldCount)

                                heldValue = (coinActualPriceEth * tokenHeldCount) / tokenHeldCount
                                avgBuy = totalBuySpent / tokenBoughtCount
                                avgSell = totalSoldValue / tokenSoldCount


                                //ROI Variable
                                if (!coinActualPriceEth || !coinActualPriceUsd) {
                                    roi = "N/A"
                                } else {
                                    roi = (((((coinActualPriceEth * tokenHeldCount) + totalSoldValue) - totalBuySpent) / totalBuySpent) * 100).toFixed(2)
                                }


                                if (roi !== 0 && totalBuySpent !== 0) {

                                    if (roi > 0) {
                                        roiPrefix = "+";
                                        roiSuffix = " :chart_with_upwards_trend:";
                                    } else if (roi < 0) {
                                        roiSuffix = " :chart_with_downwards_trend:";
                                    }
                                    roiFormatted = "`" + roiPrefix + parseFloat(roi).toFixed(2) + "%" + "`" + roiSuffix;

                                } else if (roi === 0 || roi === "NaN") {

                                    roiFormatted = "`0.00%`"

                                } else if (!coinActualPriceEth || !coinActualPriceUsd) {

                                    roiFormatted = "`0.00%`"

                                } else if (totalBuySpent == 0 && (totalSoldValue + tokenHeldCount > 0)) {

                                    roiFormatted = "`INFINITY`<a:RCRich:1044762000837840926>"

                                }








                                //On stock les datas d'interaction pour le visuel
                                await interactionData.destroy({ where: { authorId: authorId, commandName: "cryptoprofit", serverId: serverId } })

                                await interactionData.create({

                                    authorId: authorId,
                                    authorName: authorName,
                                    serverId: serverId,
                                    walletAddress: walletAddress,
                                    commandName: "cryptoprofit",
                                    interactionId: interaction.id,
                                    walletName: "N/A",
                                    selecedTimestamp: actualTimestamp,
                                    embed1: "N/A",
                                    embed2: "N/A",
                                    embed3: "N/A",
                                    pageIndex: "N/A",
                                    actualPage: "N/A",
                                    walletCategory: "N/A",
                                    selectedCollection: coinAddress,
                                    collectionSlug: "N/A",
                                    collectionBanner: "N/A",
                                    avgDeriskPrice: "N/A",
                                    floorPrice: coinActualPriceEth.toString(),
                                    lowerMarketlace: "N/A",
                                    collectionName: coinName + " (" + coinSymbol.toUpperCase() + ")",
                                    walletCategory: "N/A",
                                    collectionTwitter: "N/A",
                                    collectionWebsite: "N/A",
                                    mintCount: airdropCount.toString(),
                                    buyCount: tokenBoughtCount.toString(),
                                    soldCount: tokenSoldCount.toString(),
                                    remaining: tokenHeldCount.toString(),
                                    avgBuy: parseFloat(avgBought).toFixed(3),
                                    avgSold: parseFloat(avgSold).toFixed(3),
                                    realisedProfit: parseFloat(realisedProfit).toFixed(3),
                                    potentialProfit: parseFloat(potentialProfit).toFixed(3),
                                    roi: roi.toString(),
                                    visualTitle: "N/A",
                                    userAvatar: userAvatar,
                                    nbMembersInvolved: "N/A",
                                    totalTradeCount: "N/A",

                                })







                                //Embed getRCprofitPrecisedAll
                                const cryptoProfitOneWallet = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle(coinName + " (" + coinSymbol.toUpperCase() + ")")
                                    .setDescription(">>> Displaying the profits made by the wallet `" + walletName + "` on `" + coinName + "`.")
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setImage(chartImageLink) // INSERER TRADING VIEW
                                    .addFields(
                                        { name: "Contract", value: "`" + coinAddress.toLowerCase() + "`", inline: false },
                                        { name: "Buy Spent", value: "`" + parseFloat(buySpent).toFixed(3) + "Ξ (" + parseFloat(buySpent * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                        { name: "Buy Gas Spent", value: "`" + parseFloat(buyGasSpent).toFixed(3) + "Ξ (" + parseFloat(buyGasSpent * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                        { name: "Total Spent", value: "`" + parseFloat(totalBuySpent).toFixed(3) + "Ξ (" + parseFloat(totalBuySpent * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                        { name: "Sold Value", value: "`" + parseFloat(soldValue).toFixed(3) + "Ξ (" + parseFloat(soldValue * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                        { name: "Sold Gas Value", value: "`" + parseFloat(soldGasValue).toFixed(3) + "Ξ (" + parseFloat(soldGasValue * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                        { name: "Total Sold Value", value: "`" + parseFloat(totalSoldValue).toFixed(3) + "Ξ (" + parseFloat(totalSoldValue * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                        { name: "Token Bought", value: "`" + tokenBoughtCount.toFixed(2) + "`", inline: true },
                                        { name: "Token Sold", value: "`" + tokenSoldCount.toFixed(2) + "`", inline: true },
                                        { name: "Token Held", value: "`" + tokenHeldCount.toFixed(2) + "`", inline: true },
                                        { name: "Trades in", value: "`" + tradeInCount + "`", inline: true },
                                        { name: "Trades out", value: "`" + tradeOutCount + "`", inline: true },
                                        { name: "Airdrop/Claim", value: "`" + airdropCount + "`", inline: true },
                                        { name: "AVG Bought", value: "`" + parseFloat(avgBuy).toFixed(3) + "Ξ (" + parseFloat(avgBuy * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                        { name: "AVG Sold", value: "`" + parseFloat(avgSold).toFixed(3) + "Ξ (" + parseFloat(avgSold * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                        { name: "AVG Held", value: "`" + parseFloat(avgHeld).toFixed(3) + "Ξ (" + parseFloat(avgHeld * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                        { name: "Realised Profit", value: "`" + parseFloat(realisedProfit).toFixed(3) + "Ξ (" + parseFloat(realisedProfit * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                        { name: "Potential Profit", value: "`" + parseFloat(potentialProfit).toFixed(3) + "Ξ (" + parseFloat(potentialProfit * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                        { name: "Potential ROI", value: roiFormatted, inline: true },
                                        { name: "Links", value: '[Etherscan](https://etherscan.io/address/' + coinAddress + ") ∙ " + '[DexTools](https://www.dextools.io/app/en/ether/pair-explorer/' + coinAddress + ") ∙ " + '[Honeypot](   https://honeypot.is/ethereum?address=' + coinAddress + ") ∙ " + '[DappRadar](https://dappradar.com/hub/token/eth/' + coinAddress + ")", inline: false },
                                    )
                                    .setTimestamp()
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [cryptoProfitOneWallet], components: [buttonsRow] });


                                //On enregistre le call API dans la database
                                let computeUnits = 10
                                await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/cryptoprofit", apiCallName: "getTokenMetadata", apiProvider: "alchemy", timestamp: timeStamp.toString() })
                                await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/cryptoprofit", apiCallName: "getChart", apiProvider: "chart", timestamp: timeStamp.toString() })
                                await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/cryptoprofit", apiCallName: "getNormalTxn", apiProvider: "etherscan", timestamp: timeStamp.toString() })
                                await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/cryptoprofit", apiCallName: "getInternalTxn", apiProvider: "etherscan", timestamp: timeStamp.toString() })
                                await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/cryptoprofit", apiCallName: "getErc20Txn", apiProvider: "etherscan", timestamp: timeStamp.toString() })
                                await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/cryptoprofit", apiCallName: "walletBalance", apiProvider: "etherscan", timestamp: timeStamp.toString() })
                                for (let i = 0; i < computeUnits; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/cryptoprofit", apiCallName: "getTokenPrice", apiProvider: "moralis", timestamp: timeStamp.toString() }) }
                                for (let i = 0; i < computeUnits; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/cryptoprofit", apiCallName: "getErc20Approvals", apiProvider: "moralis", timestamp: timeStamp.toString() }) }








                            } else if (walletAddress.toLowerCase() === 'all') {

                                if (allWalletsAuthorTable.length > 0) {


                                    //On initialise le tableau de call api pour mesurer
                                    let apiObj = {}
                                    let computeUnits = 10
                                    apiObj.getTokenMetadata = 0
                                    apiObj.getChart = 0
                                    apiObj.getNormalTxn = 0
                                    apiObj.getInternalTxn = 0
                                    apiObj.getErc20Txn = 0
                                    apiObj.getTokenPrice = 0
                                    apiObj.getErc20Approvals = 0
                                    apiObj.walletBalance = 0








                                    //On récupère les infos du coin
                                    const coinInfos = await alchemy.core.getTokenMetadata(coinAddress)
                                    coinName = coinInfos.name
                                    coinSymbol = coinInfos.symbol
                                    coinDecimal = coinInfos.decimals

                                    //On load l'image
                                    chartImageLink = "https://api.chart-img.com/v1/tradingview/advanced-chart?key=" + chartApiKey + "&symbol=" + coinSymbol + "WETH&interval=1D&theme=dark&width=800&height=400"



                                    const response = await Moralis.EvmApi.token.getTokenPrice({
                                        "chain": "0x1",
                                        "address": coinAddress,

                                    });


                                    apiObj.getTokenMetadata++
                                    apiObj.getChart++
                                    apiObj.getTokenPrice += computeUnits



                                    coinActualPriceUsd = response.raw.usdPrice
                                    coinActualPriceEth = 1 / (ethUsdPrice / coinActualPriceUsd)



                                    //On calcul le token held
                                    for (const wallet of allWalletsAuthorTable) {

                                        setTimeout(() => {

                                        }, 3000);

                                        const walletBalance = await axios.get('https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=' + coinAddress + '&address=' + wallet + '&tag=latest&apikey=' + etherscanApiKey)
                                        tokenHeldCount += (walletBalance.data.result) / (10 ** coinDecimal)

                                        apiObj.walletBalance++


                                        const tokenTxnWalletContractCall = await axios.get("https://api.etherscan.io/api?module=account&action=tokentx&address=" + wallet + "&page=1&offset=10000&startblock=0&sort=desc&apikey=" + etherscanApiKey)
                                        const internalTxnWalletCall = await axios.get("https://api.etherscan.io/api?module=account&action=txlistinternal&address=" + wallet + "&startblock=0&page=1&offset=10000&sort=asc&apikey=" + etherscanApiKey)
                                        const normalTxnWalletCall = await axios.get("https://api.etherscan.io/api?module=account&action=txlist&address=" + wallet + "&startblock=0&page=1&offset=10000&sort=asc&apikey=" + etherscanApiKey)

                                        apiObj.getNormalTxn = 0
                                        apiObj.getInternalTxn = 0
                                        apiObj.getErc20Txn = 0


                                        let tokenTxnWalletContractTable = tokenTxnWalletContractCall.data.result
                                        console.log(tokenTxnWalletContractTable)

                                        let tokenTxnWalletContractTableFiltered = tokenTxnWalletContractTable.filter(obj => obj.contractAddress == coinAddress.toLowerCase());
                                        let internalTxnWalletTable = internalTxnWalletCall.data.result
                                        let normalTxnWalletTable = normalTxnWalletCall.data.result



                                        //On sépare en deux parties (trades in et trades out)
                                        let tradeInTxn = []
                                        let tradeOutTxn = []

                                        for (const transaction of tokenTxnWalletContractTableFiltered) {

                                            if (transaction.to == wallet.toLowerCase()) { tradeInTxn.push(transaction) }
                                            if (transaction.from == wallet.toLowerCase()) { tradeOutTxn.push(transaction) }

                                        }


                                        console.log("// Début des deux blocs de transactions : ")
                                        console.log(tradeInTxn)
                                        console.log(tradeOutTxn)
                                        console.log("Fin des deux blocs de transactions // ")

                                        //On commence par les trade in
                                        for (const transaction of tradeInTxn) {


                                            let hash = transaction.hash
                                            let contractAddress = transaction.contractAddress
                                            let value = (transaction.value) / (10 ** coinDecimal)
                                            let gasSpent = parseFloat(web3.utils.fromWei(((transaction.gasPrice) * (transaction.gasUsed)).toString(), 'ether'))
                                            let from = transaction.from
                                            let to = transaction.to

                                            let tokenLookup = await tokenTxnWalletContractTable.filter(obj => obj.hash == hash.toLowerCase() && obj !== transaction);
                                            let internalLookup = await internalTxnWalletTable.filter(obj => obj.hash == hash.toLowerCase());
                                            let normalLookup = await normalTxnWalletTable.filter(obj => obj.hash == hash.toLowerCase());

                                            allHashTable.push(hash)


                                            //Transfert in/Airdrop/Claim
                                            if (normalLookup.length <= 0 && tokenLookup.length <= 0 && internalLookup.length <= 0) {


                                                if (allWalletsAuthorTable.includes(from)) {

                                                    console.log("C'est un Wallet -> Wallet ")


                                                    buyGasSpent += gasSpent
                                                    tokenBoughtCount += value

                                                } else {

                                                    console.log("C'est un Airdrop ")

                                                    airdropCount++
                                                    tokenBoughtCount += value

                                                }


                                            } else if (tokenLookup.length > 0) {

                                                console.log("C'est un token -> token")

                                                let tokenInPrice = await Moralis.EvmApi.token.getTokenPrice({
                                                    "chain": "0x1",
                                                    "address": tokenLookup[0].contractAddress,
                                                    "toBlock": tokenLookup[0].blockNumber,
                                                });

                                                bisTokenInPriceEth = parseFloat(web3.utils.fromWei((tokenInPrice.raw.nativePrice.value).toString(), 'ether'))

                                                tradeInCount++
                                                tokenBoughtCount += value
                                                buyGasSpent += gasSpent
                                                buySpent += (bisTokenInPriceEth) * ((tokenLookup[0].value) / (10 ** tokenInPrice.raw.tokenDecimals))


                                            } else if (normalLookup.length > 0) {

                                                if (normalLookup[0].value <= 0) {

                                                    console.log("c'est un claim")

                                                    airdropCount++
                                                    buyGasSpent += gasSpent
                                                    tokenBoughtCount += value


                                                } else if (normalLookup[0].value > 0) {

                                                    console.log("c'est un ETH -> token")


                                                    tradeInCount++
                                                    buySpent += parseFloat(normalLookup[0].value / (10**18))
                                                    buyGasSpent += gasSpent
                                                    tokenBoughtCount += value


                                                }


                                            }


                                        }



                                        //Ensuite on fait les trade out
                                        for (const transaction of tradeOutTxn) {



                                            let hash = transaction.hash
                                            let contractAddress = transaction.contractAddress
                                            let value = (transaction.value) / (10 ** coinDecimal)
                                            let gasSpent = parseFloat(web3.utils.fromWei(((transaction.gasPrice) * (transaction.gasUsed)).toString(), 'ether'))
                                            let from = transaction.from
                                            let to = transaction.to

                                            let tokenLookup = tokenTxnWalletContractTable.filter(obj => obj.hash == hash.toLowerCase() && obj !== transaction);
                                            let internalLookup = internalTxnWalletTable.filter(obj => obj.hash == hash.toLowerCase());
                                            let normalLookup = normalTxnWalletTable.filter(obj => obj.hash == hash.toLowerCase());

                                            allHashTable.push(hash)


                                            //Transfert in/Airdrop/Claim
                                            if (normalLookup.length <= 0 && tokenLookup.length <= 0 && internalLookup.length <= 0) {

                                                console.log("C'est un transfert")

                                                if (!allWalletsAuthorTable.includes(to)) {

                                                    console.log("C'est un Wallet -> Wallet ")

                                                    tokenSoldCount += value

                                                }


                                                soldGasValue += gasSpent


                                            } else if (tokenLookup.length > 0) {

                                                console.log("C'est un token -> token")

                                                let tokenInPrice = await Moralis.EvmApi.token.getTokenPrice({
                                                    "chain": "0x1",
                                                    "address": tokenLookup[0].contractAddress,
                                                    "toBlock": tokenLookup[0].blockNumber,
                                                });

                                                bisTokenOutPriceEth = parseFloat(web3.utils.fromWei((tokenInPrice.raw.nativePrice.value).toString(), 'ether'))

                                                tradeOutCount++
                                                tokenSoldCount += value
                                                soldGasValue += gasSpent
                                                soldValue += (bisTokenOutPriceEth) * ((tokenLookup[0].value) / (10 ** tokenInPrice.raw.tokenDecimals))




                                            } else if (internalLookup.length > 0) {

                                                console.log("C'est un token -> ETH")


                                                tradeOutCount++
                                                soldValue += parseFloat(web3.utils.fromWei((internalLookup[0].value).toString(), 'ether'))
                                                soldGasValue += gasSpent
                                                tokenSoldCount += value
                                            }



                                        }




                                        //FAIRE LES APPROVE DANS NORMAL TXN
                                        const approvalCall = await Moralis.EvmApi.token.getErc20Approvals({
                                            "chain": "0x1",
                                            "contractAddresses": [coinAddress],
                                            "walletAddresses": [wallet]
                                        });

                                        apiObj.getErc20Approvals += 10


                                        for (const appovalTxn of approvalCall.raw.result) {

                                            if (!allHashTable.includes(appovalTxn.transaction_hash)) {

                                                let normalLookup = await normalTxnWalletTable.filter(obj => obj.hash == (appovalTxn.transaction_hash).toLowerCase());


                                                if (normalLookup.length > 0) {

                                                    if ((normalLookup[0].functionName).includes("approve") || (normalLookup[0].functionName).includes("approveAndCall")) {


                                                        let gasSpent = parseFloat(web3.utils.fromWei(((normalLookup[0].gasPrice) * (normalLookup[0].gasUsed)).toString(), 'ether'))

                                                        soldGasValue += gasSpent


                                                    }

                                                }
                                            }
                                        }


                                    }


                                    //Calcul des valeurs à partir de celle récupérés
                                    totalBuySpent = buySpent + buyGasSpent
                                    totalSoldValue = soldValue - soldGasValue

                                    realisedProfit = totalSoldValue - totalBuySpent
                                    potentialProfit = realisedProfit + (coinActualPriceEth * tokenHeldCount)

                                    heldValue = (coinActualPriceEth * tokenHeldCount) / tokenHeldCount
                                    avgBuy = totalBuySpent / tokenBoughtCount
                                    avgSell = totalSoldValue / tokenSoldCount


                                    //ROI Variable
                                    if (!coinActualPriceEth || !coinActualPriceUsd) {
                                        roi = "N/A"
                                    } else {
                                        roi = (((((coinActualPriceEth * tokenHeldCount) + totalSoldValue) - totalBuySpent) / totalBuySpent) * 100).toFixed(2)
                                    }


                                    if (roi !== 0 && totalBuySpent !== 0) {

                                        if (roi > 0) {
                                            roiPrefix = "+";
                                            roiSuffix = " :chart_with_upwards_trend:";
                                        } else if (roi < 0) {
                                            roiSuffix = " :chart_with_downwards_trend:";
                                        }
                                        roiFormatted = "`" + roiPrefix + parseFloat(roi).toFixed(2) + "%" + "`" + roiSuffix;

                                    } else if (roi === 0 || roi === "NaN") {

                                        roiFormatted = "`0.00%`"

                                    } else if (!coinActualPriceEth || !coinActualPriceUsd) {

                                        roiFormatted = "`0.00%`"

                                    } else if (totalBuySpent == 0 && (totalSoldValue + tokenHeldCount > 0)) {

                                        roiFormatted = "`INFINITY`<a:RCRich:1044762000837840926>"

                                    }





                                    //On stock les datas d'interaction pour le visuel
                                    await interactionData.destroy({ where: { authorId: authorId, commandName: "cryptoprofit", serverId: serverId } })

                                    await interactionData.create({

                                        authorId: authorId,
                                        authorName: authorName,
                                        serverId: serverId,
                                        walletAddress: "all",
                                        commandName: "cryptoprofit",
                                        interactionId: interaction.id,
                                        walletName: "N/A",
                                        selecedTimestamp: actualTimestamp,
                                        embed1: "N/A",
                                        embed2: "N/A",
                                        embed3: "N/A",
                                        pageIndex: "N/A",
                                        actualPage: "N/A",
                                        walletCategory: "N/A",
                                        selectedCollection: coinAddress,
                                        collectionSlug: "N/A",
                                        collectionBanner: "N/A",
                                        avgDeriskPrice: "N/A",
                                        floorPrice: coinActualPriceEth.toString(),
                                        lowerMarketlace: "N/A",
                                        collectionName: coinName + " (" + coinSymbol.toUpperCase() + ")",
                                        walletCategory: "N/A",
                                        collectionTwitter: "N/A",
                                        collectionWebsite: "N/A",
                                        mintCount: airdropCount.toString(),
                                        buyCount: tokenBoughtCount.toString(),
                                        soldCount: tokenSoldCount.toString(),
                                        remaining: tokenHeldCount.toString(),
                                        avgBuy: parseFloat(avgBought).toFixed(3),
                                        avgSold: parseFloat(avgSold).toFixed(3),
                                        realisedProfit: parseFloat(realisedProfit).toFixed(3),
                                        potentialProfit: parseFloat(potentialProfit).toFixed(3),
                                        roi: roi.toString(),
                                        visualTitle: "N/A",
                                        userAvatar: userAvatar,
                                        nbMembersInvolved: "N/A",
                                        totalTradeCount: "N/A",

                                    })







                                    //Embed getRCprofitPrecisedAll
                                    const cryptoProfitOneWallet = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle(coinName + " (" + coinSymbol.toUpperCase() + ")")
                                        .setDescription(">>> Displaying the profits made on `" + allWalletsAuthorTable.length + "` wallets on `" + coinName + "`.")
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setImage(chartImageLink) // INSERER TRADING VIEW
                                        .addFields(
                                            { name: "Contract", value: "`" + coinAddress.toLowerCase() + "`", inline: false },
                                            { name: "Buy Spent", value: "`" + parseFloat(buySpent).toFixed(3) + "Ξ (" + parseFloat(buySpent * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                            { name: "Buy Gas Spent", value: "`" + parseFloat(buyGasSpent).toFixed(3) + "Ξ (" + parseFloat(buyGasSpent * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                            { name: "Total Spent", value: "`" + parseFloat(totalBuySpent).toFixed(3) + "Ξ (" + parseFloat(totalBuySpent * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                            { name: "Sold Value", value: "`" + parseFloat(soldValue).toFixed(3) + "Ξ (" + parseFloat(soldValue * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                            { name: "Sold Gas Value", value: "`" + parseFloat(soldGasValue).toFixed(3) + "Ξ (" + parseFloat(soldGasValue * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                            { name: "Total Sold Value", value: "`" + parseFloat(totalSoldValue).toFixed(3) + "Ξ (" + parseFloat(totalSoldValue * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                            { name: "Token Bought", value: "`" + tokenBoughtCount.toFixed(2) + "`", inline: true },
                                            { name: "Token Sold", value: "`" + tokenSoldCount.toFixed(2) + "`", inline: true },
                                            { name: "Token Held", value: "`" + tokenHeldCount.toFixed(2) + "`", inline: true },
                                            { name: "Trades in", value: "`" + tradeInCount + "`", inline: true },
                                            { name: "Trades out", value: "`" + tradeOutCount + "`", inline: true },
                                            { name: "Airdrop/Claim", value: "`" + airdropCount + "`", inline: true },
                                            { name: "AVG Bought", value: "`" + parseFloat(avgBuy).toFixed(3) + "Ξ (" + parseFloat(avgBuy * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                            { name: "AVG Sold", value: "`" + parseFloat(avgSold).toFixed(3) + "Ξ (" + parseFloat(avgSold * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                            { name: "AVG Held", value: "`" + parseFloat(avgHeld).toFixed(3) + "Ξ (" + parseFloat(avgHeld * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                            { name: "Realised Profit", value: "`" + parseFloat(realisedProfit).toFixed(3) + "Ξ (" + parseFloat(realisedProfit * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                            { name: "Potential Profit", value: "`" + parseFloat(potentialProfit).toFixed(3) + "Ξ (" + parseFloat(potentialProfit * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                            { name: "Potential ROI", value: roiFormatted, inline: true },
                                            { name: "Links", value: '[Etherscan](https://etherscan.io/address/' + coinAddress + ") ∙ " + '[DexTools](https://www.dextools.io/app/en/ether/pair-explorer/' + coinAddress + ") ∙ " + '[Honeypot](   https://honeypot.is/ethereum?address=' + coinAddress + ") ∙ " + '[DappRadar](https://dappradar.com/hub/token/eth/' + coinAddress + ")", inline: true },
                                        )
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });


                                    await interaction.editReply({ embeds: [cryptoProfitOneWallet], components: [buttonsRow] });



                                    //On rajoute les calls API à la database
                                    for (let i = 0; i < apiObj.getTokenMetadata; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/cryptoprofit", apiCallName: "getTokenMetadata", apiProvider: "alchemy", timestamp: timeStamp.toString() }) }
                                    for (let i = 0; i < apiObj.getChart; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/cryptoprofit", apiCallName: "getChart", apiProvider: "chart", timestamp: timeStamp.toString() }) }
                                    for (let i = 0; i < apiObj.getNormalTxn; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/cryptoprofit", apiCallName: "getNormalTxn", apiProvider: "etherscan", timestamp: timeStamp.toString() }) }
                                    for (let i = 0; i < apiObj.getInternalTxn; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/cryptoprofit", apiCallName: "getInternalTxn", apiProvider: "etherscan", timestamp: timeStamp.toString() }) }
                                    for (let i = 0; i < apiObj.getErc20Txn; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/cryptoprofit", apiCallName: "getErc20Txn", apiProvider: "etherscan", timestamp: timeStamp.toString() }) }
                                    for (let i = 0; i < apiObj.walletBalance; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/cryptoprofit", apiCallName: "walletBalance", apiProvider: "etherscan", timestamp: timeStamp.toString() }) }
                                    for (let i = 0; i < apiObj.getTokenPrice; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/cryptoprofit", apiCallName: "getTokenPrice", apiProvider: "moralis", timestamp: timeStamp.toString() }) }
                                    for (let i = 0; i < apiObj.getErc20Approvals; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/cryptoprofit", apiCallName: "getErc20Approvals", apiProvider: "moralis", timestamp: timeStamp.toString() }) }








                                } else {

                                    const setwalletErrorEmbed = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle(`No wallet`)
                                        .setDescription("Aura can't analyze your wallet's data because you don't have any wallet registered in your portfolio. Please use `/setwallet` to register a wallet in your portfolio then try again.")
                                        .setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                    await interaction.editReply({ embeds: [setwalletErrorEmbed] });





                                }




                            }


                        } else {

                            const setwalletErrorEmbed = new EmbedBuilder().setColor("#060A8F")
                                .setTitle(`Invalid Token Address`)
                                .setDescription("The token address you provided isn't a valid Ethereum contract address. Please try again using the appropriate form.")
                                .setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.editReply({ embeds: [setwalletErrorEmbed] });



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

            // } catch (error) {


            //     console.log("// Error - sent in report ❌")

            //     //On envoi une notif
            //     let botId = interaction.applicationId
            //     const botAdmins = await adminsql.findOne({ where: { botId: botId } })
            //     const mainServerId = botAdmins.dataValues.mainServerId
            //     const logChannelId = botAdmins.dataValues.logChannelId
            //     const guild = interaction.client.guilds.cache.get(mainServerId);
            //     const channel = guild.channels.cache.get(logChannelId);


            //     const adminAccessInfos = await accessSql.findOne({ where: { serverId: serverId } })
            //     let adminRoleId = adminAccessInfos.dataValues.adminRoleId
            //     let serverName = adminAccessInfos.dataValues.serverName
            //     const userRoleList = interaction.member._roles
            //     let userHighestRole = "Member"
            //     if (userRoleList.includes(adminRoleId)) { userHighestRole = "Team" }
            //     let reportCommand = "/cryptoprofit"


            //     const timeStamp = Date.now();
            //     const date = new Date(timeStamp);
            //     const dateLisible = date.toLocaleString();
            //     const date1 = moment(dateLisible, 'M/D/YYYY, h:mm:ss A');
            //     const formattedDate = date1.format('Do [of] MMMM YYYY');



            //     //On enregistre le call
            //     await reportsql.create({
            //         botId: botId,
            //         authorId: "Bot",
            //         serverName: serverName,
            //         authorRole: userHighestRole,
            //         serverId: serverId,
            //         date: formattedDate,
            //         reportType: "Bug",
            //         reportCommand: reportCommand,
            //         reportDescription: "```" + error.stack + "```",
            //         reportPriority: "5",
            //         reportState: "Not treated",
            //     })



            //     const updateEmbed = new EmbedBuilder().setColor("#060A8F")
            //         .setTitle("New Report")
            //         .setDescription(">>> A new report has just been sent.")
            //         .setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
            //         .setAuthor({ name: "Rolls Chasers Analytics", iconURL: "https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg" })
            //         .setTimestamp()
            //         .addFields(
            //             { name: " ", value: " ", inline: false },
            //             { name: "Content:", value: "A new `bug` has been submitted for the `" + reportCommand + "` command by `the bot report division` in `" + serverName + "`. You can use the administrator dashboard to consult it.", inline: false },

            //         )
            //         .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


            //     await channel.send({ embeds: [updateEmbed] });



            //     const errorAnswerUser = new EmbedBuilder().setColor("#060A8F")
            //         .setTitle("An error occured")
            //         .setDescription("An error has occurred while executing this command. These errors can occur for a variety of reasons, such as :\n∙ Unexpected traffic\n∙ API maintenance\n∙ Occasional bug\n\nPlease note that a report has already been sent to our team, who will fix the problem as soon as possible. You can still use `/report` to give more details about the error and help our team.")
            //         .setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
            //         .setTimestamp()
            //         .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


            //     await interaction.editReply({ embeds: [errorAnswerUser], ephemeral: true });

            // }

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

