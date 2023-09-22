/**
 * @file Sample getdata command with slash command.
 * @author Vitality Migø
 */

const { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { profileData, accessSql, interactionData, reportsql, apimonitorsql, wallets, adminsql, usersql, sequelize } = require('../../../events/database');
const moment = require('moment');

//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const etherscanApiKey = process.env.etherscanApiKey
const reservoirApiKey = process.env.reservoirApiKey
const blockspanApiKey = process.env.blockspanApiKey
const alchemyApiKey = process.env.alchemyApiKey



//https request
const axios = require('axios')

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




module.exports = {
    data: new SlashCommandBuilder()
        .setName("rcprofit")
        .setDescription("Display your profit on a specific collection or period of time")
        .addStringOption(option =>
            option
                .setName("collection")
                .setDescription("The category you want to set up your wallet in")
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption(option =>
            option
                .setName("timelapse")
                .setDescription("The category you want to set up your wallet in")
                .setRequired(true)
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


                        if (accessTier.toLowerCase() == "s-tier") {

                            if (member.roles.cache.has(communityMemberRoleId)) {

                                if (member.roles.cache.has(communityAdminRoleId)) {

                                    //Checkpoint
                                    console.log("// Step 2 : Authorization - Executed ✅")



                                    //On enregistre le user si il est pas encore dans la database
                                    const timeStamp1 = Date.now();
                                    const actualTimestamp1 = parseFloat(timeStamp1 / 1000).toFixed(0)
                                    const isUser = await usersql.findOne({ where: { userId: authorId, serverId: serverId } })
                                    if (isUser == null) { await usersql.create({ userId: authorId, userName: authorName, userAvatar: userAvatar, serverId: serverId, timestamp: actualTimestamp1 }) }



                                    //Récupérer Timestamp
                                    const timeStamp = Date.now();
                                    const actualTimestamp = parseFloat(timeStamp / 1000).toFixed(0)
                                    let selectedTimestamp = 0

                                    const buttonVisual = new ActionRowBuilder()
                                        .addComponents(
                                            new ButtonBuilder()
                                                .setCustomId('rcprofitvisual-button')
                                                .setLabel('visual')
                                                .setStyle(2)
                                        );



                                    //Variable pour les options
                                    const selectedCollection = interaction.options.getString("collection");
                                    const selectedTime = interaction.options.getString("timelapse");

                                    //Récupérer tous les wallets de RC dans la base SQL
                                    const allWallets = await wallets.findAll({ where: { walletCategory: "eth" } });
                                    let rcWalletsTable = allWallets.map(wallet => wallet.walletAddress);


                                    if (rcWalletsTable.length > 0) {

                                        //Variable Tableau
                                        let tokenHoldTable = []
                                        let tokenSoldTable = []
                                        let walletsInvolvedTable = []
                                        let membersInvolvedTable = []
                                        let totalMemberInvolvedCountTable = []
                                        let allCollectionCommandErc20TxnTable = []




                                        // Prix de l'ETH
                                        const etherscanTokenPrice = await axios.get('https://api.etherscan.io/api?module=stats&action=ethprice&apikey=' + etherscanApiKey)
                                        const ethUsdPrice = etherscanTokenPrice.data.result.ethusd


                                        //Variable API
                                        let holdCount = 0;
                                        let mintSpent = 0
                                        let mintGasSpent = 0
                                        let totalMintSpent = 0
                                        let buyMarketplaceSpent = 0
                                        let buyMarketplaceGasSpent = 0
                                        let buyMarketplaceTotalSpent = 0
                                        let soldValue = 0
                                        let soldGasValue = 0
                                        let totalSoldValue = 0
                                        let soldCount = 0
                                        let mintCount = 0
                                        let incomingTransferCount = 0
                                        let outgoingTransferCount = 0
                                        let transferCount = 0
                                        let buyMarketplaceCount = 0
                                        let averageSpentValue = 0
                                        let realisedProfit = 0
                                        let potentialProfit = 0
                                        let potentialPnL = 0
                                        let nbMemberInvolved = 0
                                        let topProfitMember = 0
                                        let topProfitWallet = 0
                                        let averageSoldValue = 0
                                        let averageHoldValue = 0
                                        let totalBuyCount = 0
                                        let totalBuySpent = 0
                                        let totalSpent = 0
                                        let roi = 0
                                        let roiFormatted = "`" + 0 + "%" + "`"
                                        let roiPrefix = "";
                                        let roiSuffix = "";
                                        let transferPrefix = "";
                                        let topTrade = 0

                                        //Variable ALL
                                        let buySpentAll = 0
                                        let buyGasSpentAll = 0
                                        let totalBuySpentAll = 0
                                        let soldValueAll = 0
                                        let soldGasValueAll = 0
                                        let totalSoldValueAll = 0
                                        let SoldTradeCountAll = 0
                                        let BuyTradeCountAll = 0
                                        let totalTradeCountAll = 0
                                        let collectionCountTableAll = []
                                        let failedCountAll = 0
                                        let approvalCountAll = 0
                                        let averageSpentValueAll = 0
                                        let averageSoldValueAll = 0
                                        let averageProfitValueAll = 0
                                        let realisedProfitAll = 0
                                        let realisedPnlAll = 0
                                        let winLossRatioAll = 0
                                        let nbMemberInvolvedAll = 0
                                        let topProfitMemberAll = 0
                                        let topProfitWalletAll = 0
                                        let winLossRatioAllTable = []
                                        let mintCountAll = 0
                                        let closedTradeProfit = 0




                                        //Check si Role Admin oui

                                        //Condition qui vérifie si c'est Wallet ou Category qui a été séléctionné, dans ce cas Wallet
                                        if (selectedCollection.toLowerCase() === "all") {


                                            //On initialise le tableau de call api pour mesurer
                                            let apiObj = {}
                                            apiObj.erc20Transfer = 0
                                            apiObj.normalTransaction = 0
                                            apiObj.internalTransaction = 0
                                            apiObj.erc721Transfer = 0





                                            //Ajustement du Timestamp
                                            if (selectedTime === "1 Day") { selectedTimestamp = actualTimestamp - 86400 }
                                            if (selectedTime === "3 Days") { selectedTimestamp = actualTimestamp - 259200 }
                                            if (selectedTime === "7 Days") { selectedTimestamp = actualTimestamp - 604800 }
                                            if (selectedTime === "14 Days") { selectedTimestamp = actualTimestamp - 1209600 }
                                            if (selectedTime === "30 Days") { selectedTimestamp = actualTimestamp - 2592000 }
                                            if (selectedTime === "90 Days") { selectedTimestamp = actualTimestamp - 7776000 }
                                            if (selectedTime === "1 Year") { selectedTimestamp = actualTimestamp - 31536000 }
                                            if (selectedTime === "All Time") { selectedTimestamp = 0 }



                                            //Récupérer block par timestamp
                                            const etherscanBlockByTimestamp = await axios.get('https://api.etherscan.io/api?module=block&action=getblocknobytime&timestamp=' + selectedTimestamp + '&closest=before&apikey=' + etherscanApiKey)






                                            for await (const walletAddress of rcWalletsTable) {


                                                //On initialise le tableau de call api pour mesurer
                                                let buySpentAllUser = 0
                                                let soldGasValueAllUser = 0
                                                let buyGasSpentAllUser = 0
                                                let soldValueAllUser = 0
                                                let realisedProfitAllUser = 0
                                                let userWlObject = {}


                                                const etherscan1TxnByAddress = await axios.get('https://api.etherscan.io/api?module=account&action=tokentx&address=' + walletAddress + '&page=1&offset=10000&startblock=' + etherscanBlockByTimestamp.data.result + '&sort=desc&apikey=' + etherscanApiKey)
                                                const etherscan3TxnByAddress = await axios.get('https://api.etherscan.io/api?module=account&action=txlist&address=' + walletAddress + '&page=1&offset=10000&startblock=' + etherscanBlockByTimestamp.data.result + '&sort=desc&apikey=' + etherscanApiKey)
                                                const etherscan4TxnByAddress = await axios.get('https://api.etherscan.io/api?module=account&action=txlistinternal&address=' + walletAddress + '&page=1&offset=10000&startblock=' + etherscanBlockByTimestamp.data.result + '&sort=desc&apikey=' + etherscanApiKey)
                                                const etherscan2TxnByAddress = await axios.get('https://api.etherscan.io/api?module=account&action=tokennfttx&address=' + walletAddress + '&page=1&offset=10000&startblock=' + etherscanBlockByTimestamp.data.result + '&sort=desc&apikey=' + etherscanApiKey)


                                                //On incrément le compteur de call API
                                                apiObj.erc20Transfer++
                                                apiObj.normalTransaction++
                                                apiObj.internalTransaction++
                                                apiObj.erc721Transfer++



                                                const filteredEtherscan3TxnByAddressErc721 = etherscan3TxnByAddress.data.result.filter(txn => {
                                                    return (txn.value > 0 || txn.functionName.includes("setApprovalForAll") || txn.functionName.includes("mint"))
                                                        && txn.input.length > 10
                                                        && !txn.functionName.includes("withdraw")
                                                });


                                                for (let i = 0; i < filteredEtherscan3TxnByAddressErc721.length; i++) {

                                                    if (filteredEtherscan3TxnByAddressErc721[i].from = walletAddress) {


                                                        if (filteredEtherscan3TxnByAddressErc721[i].isError === "1") {

                                                            failedCountAll += 1

                                                        } else if (filteredEtherscan3TxnByAddressErc721[i].functionName.includes("setApprovalForAll") && filteredEtherscan3TxnByAddressErc721[i].isError !== "1") {

                                                            buySpentAll += 0;
                                                            soldGasValueAll += parseFloat(web3.utils.fromWei(((filteredEtherscan3TxnByAddressErc721[i].gasPrice) * (filteredEtherscan3TxnByAddressErc721[i].gasUsed)).toString(), 'ether'));
                                                            approvalCountAll += 1

                                                            //User ranking
                                                            buySpentAllUser += 0;
                                                            soldGasValueAllUser += parseFloat(web3.utils.fromWei(((filteredEtherscan3TxnByAddressErc721[i].gasPrice) * (filteredEtherscan3TxnByAddressErc721[i].gasUsed)).toString(), 'ether'));



                                                        } else {


                                                            buySpentAll += parseFloat(web3.utils.fromWei((filteredEtherscan3TxnByAddressErc721[i].value).toString(), 'ether'))
                                                            buyGasSpentAll += parseFloat(web3.utils.fromWei(((filteredEtherscan3TxnByAddressErc721[i].gasPrice) * (filteredEtherscan3TxnByAddressErc721[i].gasUsed)).toString(), 'ether'));
                                                            BuyTradeCountAll += 1

                                                            //User ranking
                                                            buySpentAllUser += parseFloat(web3.utils.fromWei((filteredEtherscan3TxnByAddressErc721[i].value).toString(), 'ether'))
                                                            buyGasSpentAllUser += parseFloat(web3.utils.fromWei(((filteredEtherscan3TxnByAddressErc721[i].gasPrice) * (filteredEtherscan3TxnByAddressErc721[i].gasUsed)).toString(), 'ether'));


                                                            if (filteredEtherscan3TxnByAddressErc721[i].functionName.includes("mint") && filteredEtherscan3TxnByAddressErc721[i].isError !== "1") {

                                                                const filteredetherscan2TxnByAddress = await etherscan2TxnByAddress.data.result.filter((element) => {
                                                                    return element.hash === filteredEtherscan3TxnByAddressErc721[i].hash;
                                                                });

                                                                mintCountAll += filteredetherscan2TxnByAddress.length

                                                            }
                                                        }

                                                    } else if (filteredEtherscan3TxnByAddressErc721[i].to = walletAddress) {

                                                        if (filteredEtherscan3TxnByAddressErc721[i].isError === "1") {

                                                            failedCountAll += 1

                                                        } else if (filteredEtherscan3TxnByAddressErc721[i].isError !== "1") {

                                                            soldValueAll += parseFloat(web3.utils.fromWei((filteredEtherscan3TxnByAddressErc721[i].value).toString(), 'ether'))
                                                            SoldTradeCountAll += 1

                                                            //User ranking
                                                            soldValueAllUser += parseFloat(web3.utils.fromWei((filteredEtherscan3TxnByAddressErc721[i].value).toString(), 'ether'))
                                                        }

                                                    }
                                                }



                                                //On calcul les tokens ERC20 - Il faut capter quand prendre en compte l'argent : 
                                                const filteredEtherscan3TxnByAddressErc20 = etherscan3TxnByAddress.data.result.filter(txn => {
                                                    return (txn.value === "0" && !txn.functionName.includes("setApprovalForAll") && !txn.functionName.includes("mint"))
                                                        && txn.input.length > 10
                                                        && !txn.functionName.includes("withdraw")
                                                });

                                                for (let i = 0; i < filteredEtherscan3TxnByAddressErc20.length; i++) { allCollectionCommandErc20TxnTable.push(filteredEtherscan3TxnByAddressErc20[i].hash); }

                                                for (let i = 0; i < etherscan1TxnByAddress.length; i++) {


                                                    //// REMPLACER PAR LE BON (ERC20 call)
                                                    if (etherscan1TxnByAddress[i].from = walletAddress && allCollectionCommandErc20TxnTable.includes(etherscan1TxnByAddress[i].hash) && filteredEtherscan3TxnByAddressErc20[i].isError !== "1") {

                                                        buySpentAll += (parseFloat(web3.utils.fromWei((etherscan1TxnByAddress[i].value).toString(), 'ether')))
                                                        BuyTradeCountAll += 1
                                                        soldGasValueAll += parseFloat(web3.utils.fromWei(((filteredEtherscan3TxnByAddressErc721[i].gasPrice) * (filteredEtherscan3TxnByAddressErc721[i].gasUsed)).toString(), 'ether'));

                                                        //User ranking
                                                        buySpentAllUser += (parseFloat(web3.utils.fromWei((etherscan1TxnByAddress[i].value).toString(), 'ether')))
                                                        soldGasValueAllUser += parseFloat(web3.utils.fromWei(((filteredEtherscan3TxnByAddressErc721[i].gasPrice) * (filteredEtherscan3TxnByAddressErc721[i].gasUsed)).toString(), 'ether'));


                                                    } else if (filteredEtherscan3TxnByAddressErc721[i].isError === "1") {

                                                        failedCountAll += 1

                                                    }
                                                }


                                                for (let i = 0; i < etherscan4TxnByAddress.data.result.length; i++) {

                                                    if (etherscan4TxnByAddress.data.result[i].to = walletAddress) {

                                                        soldValueAll += parseFloat(web3.utils.fromWei((etherscan4TxnByAddress.data.result[i].value).toString(), 'ether'))
                                                        SoldTradeCountAll += 1

                                                        //User ranking
                                                        soldValueAllUser += parseFloat(web3.utils.fromWei((etherscan4TxnByAddress.data.result[i].value).toString(), 'ether'))

                                                    }

                                                }
                                                userWlObject.walletAddress = walletAddress
                                                userWlObject.buySpentAllUser = buySpentAllUser
                                                userWlObject.buyGasSpentAllUser = buyGasSpentAllUser
                                                userWlObject.soldValueAllUser = soldValueAllUser
                                                userWlObject.soldGasValueAllUser = soldGasValueAllUser
                                                userWlObject.realisedProfitAllUser = (soldGasValueAllUser + soldValueAllUser) - (buyGasSpentAllUser + buySpentAllUser)

                                                winLossRatioAllTable.push(userWlObject)

                                            }



                                            //On déclare les variables calculées de l'embed
                                            totalBuySpentAll = buySpentAll + buyGasSpentAll
                                            totalSoldValueAll = soldValueAll + soldGasValueAll
                                            totalTradeCountAll = BuyTradeCountAll + SoldTradeCountAll
                                            averageSpentValueAll = totalBuySpentAll / BuyTradeCountAll
                                            averageSoldValueAll = totalSoldValueAll / SoldTradeCountAll
                                            realisedProfitAll = totalSoldValueAll - totalBuySpentAll
                                            averageProfitValueAll = averageSoldValueAll - averageSpentValueAll
                                            closedTradeProfit = averageProfitValueAll * SoldTradeCountAll


                                            if (totalSoldValueAll === 0 && totalBuySpentAll === 0) {
                                                roi = "N/A"
                                            } else {
                                                roi = (((totalSoldValueAll - totalBuySpentAll) / totalBuySpentAll) * 100).toFixed(2)
                                            }


                                            if (roi !== 0 && totalBuySpentAll !== 0) {

                                                if (roi > 0) {
                                                    roiPrefix = "+";
                                                    roiSuffix = " :chart_with_upwards_trend:";
                                                } else if (roi < 0) {
                                                    roiSuffix = " :chart_with_downwards_trend:";
                                                }
                                                realisedPnlAll = "`" + roiPrefix + parseFloat(roi).toFixed(2) + "%" + "`" + roiSuffix;

                                            } else if (roi === 0 || roi === "NaN") {

                                                realisedPnlAll = "`0.00%`"

                                            } else if (totalBuySpentAll === 0 && (soldCount + holdCount > 0)) {

                                                realisedPnlAll = "`INFINITY`<a:RCRich:1044762000837840926>"

                                            }




                                            const walletWithMoreProfit = winLossRatioAllTable.reduce((acc, obj) => {
                                                if (obj.realisedProfitAllUser > acc.value) {
                                                    return { value: obj.realisedProfitAllUser, walletAddress: obj.walletAddress };
                                                } else {
                                                    return acc;
                                                }
                                            }, { value: -Infinity, walletAddress: null });

                                            const walletsName = await wallets.findOne({ where: { walletAddress: walletWithMoreProfit.walletAddress } })
                                            topProfitWalletAll = walletWithMoreProfit.walletAddress.substring(0, 5) + "..." + walletWithMoreProfit.walletAddress.substring(walletWithMoreProfit.walletAddress.length - 4, walletWithMoreProfit.walletAddress.length)
                                            topProfitMemberAll = walletsName.dataValues.authorUsername.split(' ')[0]

                                            const totalObjects = winLossRatioAllTable.length;
                                            const positiveObjects = winLossRatioAllTable.filter(obj => obj.realisedProfitAllUser > 0).length;
                                            winLossRatioAll = positiveObjects / totalObjects * 100;



                                            let walletsInvolvedTableAll = winLossRatioAllTable.filter(item => item.buySpentAllUser !== 0 && item.soldValueAllUser !== 0).map(item => item.walletAddress);
                                            let walletsInvolveCountAll = walletsInvolvedTableAll.length

                                            for (const walletAddress of walletsInvolvedTableAll) {
                                                const findIdOfWallets = await wallets.findOne({ where: { walletAddress: walletAddress } })
                                                totalMemberInvolvedCountTable.push(findIdOfWallets.dataValues.authorUsername)
                                                if (!membersInvolvedTable.includes(findIdOfWallets.dataValues.authorId)) {
                                                    membersInvolvedTable.push(findIdOfWallets.dataValues.authorId)
                                                    nbMemberInvolvedAll = + 1
                                                }

                                            }



                                            const getRCprofitAllPrecised = new EmbedBuilder().setColor("#060A8F")
                                                .setTitle(`Global group profits`)
                                                .setDescription(">>> Global profits made by the group during the last `" + selectedTime + "`.")
                                                .setImage('https://cdn.discordapp.com/attachments/949291624389816334/1122703923950665848/Pallette_8.png')
                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                .addFields(
                                                    { name: "Buy Spent", value: "`" + parseFloat(buySpentAll).toFixed(3) + "Ξ (" + parseFloat(buySpentAll * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                    { name: "Buy Gas Spent", value: "`" + parseFloat(buyGasSpentAll).toFixed(3) + "Ξ (" + parseFloat(buyGasSpentAll * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                    { name: "Total Buy Spent", value: "`" + parseFloat(totalBuySpentAll).toFixed(3) + "Ξ (" + parseFloat(totalBuySpentAll * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                    { name: "Sold Value", value: "`" + parseFloat(soldValueAll).toFixed(3) + "Ξ (" + parseFloat(soldValueAll * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                    { name: "Sold Gas Value", value: "`" + parseFloat(soldGasValueAll).toFixed(3) + "Ξ (" + parseFloat(soldGasValueAll * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                    { name: "Total Sold Value", value: "`" + parseFloat(totalSoldValueAll).toFixed(3) + "Ξ (" + parseFloat(soldValueAll * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                    { name: "Buy Trade Count", value: "`" + BuyTradeCountAll + "`", inline: true },
                                                    { name: "Sold Trade Count", value: "`" + SoldTradeCountAll + "`", inline: true },
                                                    { name: "Total Trade Count", value: "`" + totalTradeCountAll + "`", inline: true },
                                                    { name: "Mint Count", value: "`" + mintCountAll + "`", inline: true },
                                                    { name: "Approval Count", value: "`" + approvalCountAll + "`", inline: true },
                                                    { name: "Failed Count", value: "`" + failedCountAll + "`", inline: true },
                                                    { name: "AVG Spent Value", value: "`" + parseFloat(averageSpentValueAll).toFixed(3) + "Ξ (" + parseFloat(averageSpentValueAll * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                    { name: "AVG Sold Value", value: "`" + parseFloat(averageSoldValueAll).toFixed(3) + "Ξ (" + parseFloat(averageSoldValueAll * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                    { name: "AVG Profit Value", value: "`" + parseFloat(averageProfitValueAll).toFixed(3) + "Ξ (" + parseFloat(averageProfitValueAll * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                    { name: "Realised Profit", value: "`" + (parseFloat(realisedProfitAll).toFixed(3)).toString() + "Ξ (" + parseFloat(realisedProfitAll * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                    { name: "Realised PNL", value: realisedPnlAll, inline: true },
                                                    { name: "Win/Loss Ratio", value: "`" + parseFloat(closedTradeProfit).toFixed(3) + "Ξ (" + parseFloat(closedTradeProfit * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                    { name: "Top Trader", value: "`" + topProfitMemberAll + "`", inline: true },
                                                    { name: "Top Profit Wallet", value: "`" + topProfitWalletAll + "`", inline: true },
                                                    { name: "Members Involved", value: "`" + nbMemberInvolvedAll + "`", inline: true },

                                                )
                                                .setTimestamp()
                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                            await interaction.editReply({ embeds: [getRCprofitAllPrecised] });



                                            /////////// CALL BASE SQL -----> REVOIR EMBED + VALEUR STOCKE + GENERATION VISUEL

                                            await interactionData.destroy({ where: { authorId: authorId, commandName: "rcprofit", serverId: serverId } })

                                            await interactionData.create({

                                                authorId: authorId,
                                                authorName: authorName,
                                                serverId: serverId,
                                                walletAddress: "N/A",
                                                commandName: "rcprofit",
                                                interactionId: interaction.id,
                                                walletName: "N/A",
                                                selecedTimestamp: selectedTime,
                                                embed1: "N/A",
                                                embed2: "N/A",
                                                embed3: "N/A",
                                                pageIndex: "N/A",
                                                actualPage: "N/A",
                                                walletCategory: "N/A",
                                                selectedCollection: selectedCollection,
                                                collectionSlug: "N/A",
                                                collectionBanner: "N/A",
                                                avgDeriskPrice: "N/A",
                                                floorPrice: "N/A",
                                                lowerMarketlace: "N/A",
                                                walletCategory: "N/A",
                                                collectionTwitter: "N/A",
                                                collectionWebsite: "N/A",
                                                buyCount: BuyTradeCountAll.toString(),
                                                mintCount: mintCountAll.toString(),
                                                soldCount: SoldTradeCountAll.toString(),
                                                remaining: "N/A",
                                                avgBuy: parseFloat(averageSpentValueAll).toFixed(3),
                                                avgSold: parseFloat(averageSoldValueAll).toFixed(3),
                                                realisedProfit: parseFloat(realisedProfitAll).toFixed(3),
                                                potentialProfit: "N/A",
                                                roi: roi.toString(),
                                                visualTitle: "N/A",
                                                userAvatar: userAvatar,
                                                nbMembersInvolved: nbMemberInvolvedAll.toString(),
                                                totalTradeCount: totalTradeCountAll.toString(),

                                            })


                                            //////////// CALL BASE SQL : FIN




                                            //On enregistre le call API dans la database
                                            const timeStamp = Date.now();
                                            await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/rcprofit", apiCallName: "ethUsdPrice", apiProvider: "etherscan", timestamp: timeStamp.toString() })
                                            await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/rcprofit", apiCallName: "blockByTimestamp", apiProvider: "etherscan", timestamp: timeStamp.toString() })
                                            for (let i = 0; i < apiObj.erc20Transfer; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/rcprofit", apiCallName: "erc20Transfer", apiProvider: "etherscan", timestamp: timeStamp.toString() }) }
                                            for (let i = 0; i < apiObj.normalTransaction; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/rcprofit", apiCallName: "normalTransaction", apiProvider: "etherscan", timestamp: timeStamp.toString() }) }
                                            for (let i = 0; i < apiObj.internalTransaction; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/rcprofit", apiCallName: "internalTransaction", apiProvider: "etherscan", timestamp: timeStamp.toString() }) }
                                            for (let i = 0; i < apiObj.erc721Transfer; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/rcprofit", apiCallName: "erc721Transfer", apiProvider: "etherscan", timestamp: timeStamp.toString() }) }





                                            //Condition qui vérifie si c'est Wallet ou Category qui a été séléctionné, dans ce cas Category
                                        } else if (selectedCollection.toLowerCase() !== "all") {



                                            //On initialise le tableau de call api pour mesurer
                                            let apiObj = {}
                                            apiObj.getCollectionsV5 = 0
                                            apiObj.getFloorPrice = 0
                                            apiObj.getUsersUserTokensV6 = 0
                                            apiObj.getNFTSales = 0
                                            apiObj.getSalesV4 = 0
                                            apiObj.getTransaction = 0
                                            apiObj.getTransactionReceipt = 0
                                            apiObj.getAllTransfers = 0



                                            //Variable API
                                            sdk.getCollectionsV5({ id: selectedCollection, accept: '*/*' })
                                                .then(async ({ data }) => {

                                                    //On incrément le compteur de call API
                                                    apiObj.getCollectionsV5++


                                                    const secondcollectionFp = await alchemy.nft.getFloorPrice(selectedCollection)

                                                    //On incrément le compteur de call API
                                                    apiObj.getFloorPrice++



                                                    let collectionName = data.collections[0].name
                                                    let collectionLogo = data.collections[0].image
                                                    let collectionSlug = data.collections[0].slug
                                                    let collectionFp
                                                    let collectionBanner = data.collections[0].banner

                                                    if (!(data.collections[0].floorAsk.price) && secondcollectionFp.openSea.floorPrice === 0) {

                                                        collectionFp = "N/A"

                                                    } else if (data.collections[0].floorAsk.price) {

                                                        collectionFp = data.collections[0].floorAsk.price.amount.decimal

                                                    } else if (secondcollectionFp.openSea.floorPrice !== 0) {

                                                        collectionFp = secondcollectionFp.openSea.floorPrice
                                                    }

                                                    let royalties = data.collections[0].royalties.bps
                                                    let collectionRoyal = parseFloat(royalties / 100 + 0.5).toFixed(2) + "%"



                                                    // Si category est all
                                                    if (selectedTime.toLowerCase() === "all time") {



                                                        // Récupérer les token hold puis -> même que get derisk 
                                                        for await (const walletAddress of rcWalletsTable) {
                                                            const { data: userTokens } = await sdk.getUsersUserTokensV6({ collection: selectedCollection, limit: '200', user: walletAddress, accept: '*/*' });


                                                            for (let i = 0; i < userTokens.tokens.length; i++) { tokenHoldTable.push(userTokens.tokens[i].token.tokenId); }

                                                            if (userTokens.tokens.length > 0) { walletsInvolvedTable.push(walletAddress) }


                                                            //On incrément le compteur de call API
                                                            apiObj.getUsersUserTokensV6++
                                                        }



                                                        // Récuperer les tokens sell (+ prix achat + méthode ?)
                                                        for await (const walletAddress of rcWalletsTable) {
                                                            const { data: userSoldTokens } = await alchemy2.getNFTSales({
                                                                fromBlock: '0',
                                                                toBlock: 'latest',
                                                                order: 'desc',
                                                                contractAddress: selectedCollection,
                                                                sellerAddress: walletAddress,
                                                                limit: '1000',
                                                                apiKey: alchemyApiKey
                                                            })

                                                            for (let i = 0; i < userSoldTokens.nftSales.length; i++) { tokenSoldTable.push(userSoldTokens.nftSales[i].tokenId); }
                                                            if (userSoldTokens.nftSales.length > 0) { walletsInvolvedTable.push(walletAddress) }


                                                            //On incrément le compteur de call API
                                                            apiObj.getNFTSales++
                                                        }






                                                        // Récuperer le méthode (mint) prix d'achat et de vente de chaque token (vente : avec from = selectedWallet / achat : avec to = selectedWallet  )
                                                        // // A adapter
                                                        for (const tokenId of tokenHoldTable) {
                                                            const { data: userPriceToken } = await
                                                                sdk.getSalesV4({
                                                                    token: selectedCollection + '%3A' + tokenId,
                                                                    limit: '100',
                                                                    accept: '*/*'
                                                                })

                                                            //On incrément le compteur de call API
                                                            apiObj.getSalesV4++


                                                            const filteredSales = userPriceToken.sales.filter(sale => rcWalletsTable.includes(sale.to));

                                                            if (filteredSales.length <= 0) {


                                                                buyMarketplaceSpent += 0;
                                                                buyMarketplaceGasSpent += 0;
                                                                incomingTransferCount += 1
                                                                outgoingTransferCount += 0


                                                            } else if (filteredSales[0].orderSide === "bid") {

                                                                buyMarketplaceSpent += parseFloat(filteredSales[0].price.amount.native);
                                                                buyMarketplaceGasSpent += 0;
                                                                buyMarketplaceCount += 1




                                                            } else {


                                                                let tokenHashTxn = filteredSales[0].txHash

                                                                const hashValueReader = await web3.eth.getTransaction(tokenHashTxn)
                                                                const hashGasReader = await web3.eth.getTransactionReceipt(tokenHashTxn)
                                                                const { data: hashTransferReader } = await bsp.getAllTransfers({ chain: 'eth-main', hash: tokenHashTxn, page_size: '100' })


                                                                //On incrément le compteur de call API
                                                                apiObj.getTransaction++
                                                                apiObj.getTransactionReceipt++
                                                                apiObj.getAllTransfers++


                                                                const hashTransferReaderObject = hashTransferReader.results;
                                                                const uniqueIds = {}; // stockage temporaire des ids uniques
                                                                let uniqueIdCount = 0; // compteur d'ids uniques

                                                                for (let i = 0; i < hashTransferReaderObject.length; i++) {
                                                                    const objectId = hashTransferReaderObject[i].id;
                                                                    if (!uniqueIds[objectId]) { // si cet id n'a pas été vu auparavant
                                                                        uniqueIds[objectId] = true; // marquer l'id comme vu
                                                                        uniqueIdCount++; // incrémenter le compteur d'ids uniques
                                                                    }
                                                                }

                                                                if (filteredSales[0].orderKind === "mint") {

                                                                    mintSpent += parseFloat(filteredSales[0].price.amount.native);
                                                                    mintGasSpent += (parseFloat(web3.utils.fromWei(((hashValueReader.gasPrice) * (hashGasReader.gasUsed)).toString(), 'ether'))) / uniqueIdCount;
                                                                    mintCount += 1

                                                                } else {

                                                                    buyMarketplaceSpent += parseFloat(filteredSales[0].price.amount.native);
                                                                    buyMarketplaceGasSpent += (parseFloat(web3.utils.fromWei(((hashValueReader.gasPrice) * (hashGasReader.gasUsed)).toString(), 'ether'))) / uniqueIdCount;
                                                                    buyMarketplaceCount += 1

                                                                }
                                                            }
                                                        }



                                                        // Même chose pour token sold
                                                        for (const tokenId of tokenSoldTable) {
                                                            const { data: userPriceToken } = await
                                                                sdk.getSalesV4({
                                                                    token: selectedCollection + '%3A' + tokenId,
                                                                    limit: '100',
                                                                    accept: '*/*'
                                                                })

                                                            //On incrément le compteur de call API
                                                            apiObj.getSalesV4++



                                                            const filteredSales = userPriceToken.sales.filter(sale => rcWalletsTable.includes(sale.to));

                                                            if (filteredSales.length <= 0) {


                                                                buyMarketplaceSpent += 0;
                                                                buyMarketplaceGasSpent += 0;
                                                                incomingTransferCount += 1
                                                                outgoingTransferCount += 0

                                                            } else if (filteredSales[0].orderSide === "bid") {

                                                                buyMarketplaceSpent += parseFloat(filteredSales[0].price.amount.native);
                                                                buyMarketplaceGasSpent += 0;
                                                                buyMarketplaceCount += 1


                                                            } else {

                                                                let tokenHashTxn = filteredSales[0].txHash

                                                                const hashValueReader = await web3.eth.getTransaction(tokenHashTxn)
                                                                const hashGasReader = await web3.eth.getTransactionReceipt(tokenHashTxn)
                                                                const { data: hashTransferReader } = await bsp.getAllTransfers({ chain: 'eth-main', hash: tokenHashTxn, page_size: '100' })


                                                                //On incrément le compteur de call API
                                                                apiObj.getTransaction++
                                                                apiObj.getTransactionReceipt++
                                                                apiObj.getAllTransfers++


                                                                const hashTransferReaderObject = hashTransferReader.results;
                                                                const uniqueIds = {}; // stockage temporaire des ids uniques
                                                                let uniqueIdCount = 0; // compteur d'ids uniques

                                                                for (let i = 0; i < hashTransferReaderObject.length; i++) {
                                                                    const objectId = hashTransferReaderObject[i].id;
                                                                    if (!uniqueIds[objectId]) { // si cet id n'a pas été vu auparavant
                                                                        uniqueIds[objectId] = true; // marquer l'id comme vu
                                                                        uniqueIdCount++; // incrémenter le compteur d'ids uniques
                                                                    }
                                                                }

                                                                if (filteredSales[0].orderKind === "mint") {

                                                                    mintSpent += parseFloat(filteredSales[0].price.amount.native);
                                                                    mintGasSpent += (parseFloat(web3.utils.fromWei(((hashValueReader.gasPrice) * (hashGasReader.gasUsed)).toString(), 'ether'))) / uniqueIdCount;
                                                                    mintCount += 1

                                                                } else {

                                                                    buyMarketplaceSpent += parseFloat(filteredSales[0].price.amount.native);
                                                                    buyMarketplaceGasSpent += (parseFloat(web3.utils.fromWei(((hashValueReader.gasPrice) * (hashGasReader.gasUsed)).toString(), 'ether'))) / uniqueIdCount;
                                                                    buyMarketplaceCount += 1
                                                                }

                                                            }
                                                        }


                                                        // Calculer la valeur des ventes de token sold
                                                        for (const tokenId of tokenSoldTable) {
                                                            const { data: userPriceToken } = await
                                                                sdk.getSalesV4({
                                                                    token: selectedCollection + '%3A' + tokenId,
                                                                    limit: '100',
                                                                    accept: '*/*'
                                                                })

                                                            //On incrément le compteur de call API
                                                            apiObj.getSalesV4++


                                                            const filteredSales = userPriceToken.sales.filter(sale => rcWalletsTable.includes(sale.from));

                                                            if (filteredSales.length <= 0) {


                                                                soldValue += 0;
                                                                soldGasValue += 0;
                                                                incomingTransferCount += 0
                                                                outgoingTransferCount += 1

                                                            } else if (filteredSales[0].orderSide === "bid") {

                                                                soldValue += parseFloat(filteredSales[0].price.amount.native);


                                                                let tokenHashTxn = filteredSales[0].txHash

                                                                const hashValueReader = await web3.eth.getTransaction(tokenHashTxn)
                                                                const hashGasReader = await web3.eth.getTransactionReceipt(tokenHashTxn)
                                                                const { data: hashTransferReader } = await bsp.getAllTransfers({ chain: 'eth-main', hash: tokenHashTxn, page_size: '100' })


                                                                //On incrément le compteur de call API
                                                                apiObj.getTransaction++
                                                                apiObj.getTransactionReceipt++
                                                                apiObj.getAllTransfers++


                                                                const hashTransferReaderObject = hashTransferReader.results;
                                                                const uniqueIds = {}; // stockage temporaire des ids uniques
                                                                let uniqueIdCount = 0; // compteur d'ids uniques

                                                                for (let i = 0; i < hashTransferReaderObject.length; i++) {
                                                                    const objectId = hashTransferReaderObject[i].id;
                                                                    if (!uniqueIds[objectId]) { // si cet id n'a pas été vu auparavant
                                                                        uniqueIds[objectId] = true; // marquer l'id comme vu
                                                                        uniqueIdCount++; // incrémenter le compteur d'ids uniques
                                                                    }
                                                                }

                                                                soldGasValue += (parseFloat(web3.utils.fromWei(((hashValueReader.gasPrice) * (hashGasReader.gasUsed)).toString(), 'ether'))) / uniqueIdCount;



                                                            } else {

                                                                soldValue += parseFloat(filteredSales[0].price.amount.native);
                                                                soldGasValue += 0;


                                                            }
                                                        }



                                                        //Résultat calcul API
                                                        totalTokenTradedCount = tokenHoldTable.length + tokenSoldTable.length
                                                        holdCount = tokenHoldTable.length
                                                        totalBuyCount = buyMarketplaceCount + mintCount
                                                        soldCount = tokenSoldTable.length
                                                        transferCount = incomingTransferCount - outgoingTransferCount

                                                        totalMintSpent = mintGasSpent + mintSpent
                                                        buyMarketplaceTotalSpent = buyMarketplaceGasSpent + buyMarketplaceSpent
                                                        totalSoldValue = soldValue - soldGasValue
                                                        totalSpent = buyMarketplaceTotalSpent + totalMintSpent

                                                        if (totalSpent > 0) { averageSpentValue = totalSpent / totalTokenTradedCount }
                                                        if (totalSoldValue > 0) { averageSoldValue = totalSoldValue / soldCount }

                                                        if (holdCount > 0) { averageHoldValue = holdCount * collectionFp }


                                                        potentialProfit = (soldValue + averageHoldValue) - totalSpent // Ajouter royalties ?
                                                        realisedProfit = soldValue - totalSpent


                                                        //ROI Variable
                                                        if (!(data.collections[0].floorAsk.price) && secondcollectionFp.openSea.floorPrice === 0) {
                                                            roi = "N/A"
                                                        } else {
                                                            roi = ((((averageHoldValue + soldValue) - totalSpent) / totalSpent) * 100).toFixed(2)
                                                        }


                                                        if (roi !== 0 && totalSpent !== 0 && collectionFp !== 'N/A') {

                                                            if (roi > 0) {
                                                                roiPrefix = "+";
                                                                roiSuffix = " :chart_with_upwards_trend:";
                                                            } else if (roi < 0) {
                                                                roiSuffix = " :chart_with_downwards_trend:";
                                                            }
                                                            roiFormatted = "`" + roiPrefix + parseFloat(roi).toFixed(2) + "%" + "`" + roiSuffix;

                                                        } else if (roi === 0 || roi === "NaN") {

                                                            roiFormatted = "`0.00%`"

                                                        } else if (collectionFp === "N/A") {

                                                            roiFormatted = "'N/A'"

                                                        } else if (totalSpent === 0 && (soldCount + holdCount > 0)) {

                                                            roiFormatted = "`INFINITY`<a:RCRich:1044762000837840926>"

                                                        }

                                                        // Transfer mise en forme
                                                        if (transferCount > 0) {
                                                            transferPrefix = "+";
                                                        } else if (transferCount < 0) {
                                                            transferPrefix = "-";
                                                        } else {
                                                            transferPrefix = ""
                                                        }
                                                        let transferCountFormated = transferPrefix + parseFloat(transferCount)



                                                        ////


                                                        //Trois dernière ligne de l'embed

                                                        let walletsInvolveCount = walletsInvolvedTable.length

                                                        for (const walletAddress of walletsInvolvedTable) {
                                                            const findIdOfWallets = await wallets.findOne({ where: { walletAddress: walletAddress } })

                                                            totalMemberInvolvedCountTable.push(findIdOfWallets.dataValues.authorUsername)
                                                            if (!membersInvolvedTable.includes(findIdOfWallets.dataValues.authorId)) {
                                                                membersInvolvedTable.push(findIdOfWallets.dataValues.authorId)
                                                                nbMemberInvolved = + 1
                                                            }

                                                        }



                                                        function valeurPlusRecurrente(totalMemberInvolvedCountTable) {
                                                            let compteur = {};
                                                            let maxCompteur = 0;
                                                            let valeurPlusRecurrente = totalMemberInvolvedCountTable[0];

                                                            for (let i = 0; i < totalMemberInvolvedCountTable.length; i++) {
                                                                let valeur = totalMemberInvolvedCountTable[i];
                                                                compteur[valeur] = (compteur[valeur] || 0) + 1;
                                                                if (compteur[valeur] > maxCompteur) {
                                                                    maxCompteur = compteur[valeur];
                                                                    valeurPlusRecurrente = valeur;
                                                                }
                                                            }

                                                            const valeurLaPlusRecurrente = valeurPlusRecurrente;
                                                            return valeurLaPlusRecurrente;
                                                        }

                                                        topProfitMemberUnformatted = valeurPlusRecurrente(totalMemberInvolvedCountTable);
                                                        if (topProfitMemberUnformatted) {
                                                            topProfitMember = topProfitMemberUnformatted.split(' ')[0];
                                                        }


                                                   


                                                        //Embed getRCprofitPrecisedAll
                                                        const getRCprofitPrecisedAll = new EmbedBuilder().setColor("#060A8F")
                                                            .setTitle(`Group profits on ${collectionName}`)
                                                            .setDescription(">>> `All time` profits made by the group on " + collectionName)
                                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                                            //.setThumbnail(collectionLogo)
                                                            .setImage(collectionBanner)
                                                            .addFields(
                                                                { name: "Mint Spent", value: "`" + parseFloat(mintSpent).toFixed(3) + "Ξ (" + parseFloat(mintSpent * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "Mint Gas Spent", value: "`" + parseFloat(mintGasSpent).toFixed(3) + "Ξ (" + parseFloat(mintGasSpent * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "Total Mint Spent", value: "`" + parseFloat(totalMintSpent).toFixed(3) + "Ξ (" + parseFloat(totalMintSpent * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "Buy Spent", value: "`" + parseFloat(buyMarketplaceSpent).toFixed(3) + "Ξ (" + parseFloat(buyMarketplaceSpent * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "Buy Gas Spent", value: "`" + parseFloat(buyMarketplaceGasSpent).toFixed(3) + "Ξ (" + parseFloat(buyMarketplaceGasSpent * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "Total Buy Spent", value: "`" + parseFloat(buyMarketplaceTotalSpent).toFixed(3) + "Ξ (" + parseFloat(buyMarketplaceTotalSpent * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "Sold Value", value: "`" + parseFloat(soldValue).toFixed(3) + "Ξ (" + parseFloat(soldValue * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "Sold Gas Value", value: "`" + parseFloat(soldGasValue).toFixed(3) + "Ξ (" + parseFloat(soldGasValue * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "Total Sold Value", value: "`" + parseFloat(totalSoldValue).toFixed(3) + "Ξ (" + parseFloat(totalSoldValue * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "NFT Mint Count", value: "`" + mintCount + "`", inline: true },
                                                                { name: "NFT Buy Count", value: "`" + buyMarketplaceCount + "`", inline: true },
                                                                { name: "NFT Total Count", value: "`" + totalBuyCount + "`", inline: true },
                                                                { name: "NFT Hold Count", value: "`" + holdCount + "`", inline: true },
                                                                { name: "NFT Sold Count", value: "`" + soldCount + "`", inline: true },
                                                                { name: "NFT Transfer Count", value: "`" + transferCountFormated + "`", inline: true },
                                                                { name: "AVG Spent Value ", value: "`" + parseFloat(averageSpentValue).toFixed(3) + "Ξ (" + parseFloat(averageSpentValue * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "AVG Sold Value", value: "`" + parseFloat(averageSoldValue).toFixed(3) + "Ξ (" + parseFloat(averageSoldValue * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "AVG Hold Value", value: "`" + parseFloat(averageHoldValue).toFixed(3) + "Ξ (" + parseFloat(averageHoldValue * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "Realised Profit", value: "`" + parseFloat(realisedProfit).toFixed(3) + "Ξ (" + parseFloat(realisedProfit * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "Potential Profit", value: "`" + parseFloat(potentialProfit).toFixed(3) + "Ξ (" + parseFloat(potentialProfit * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "Potential PNL", value: roiFormatted, inline: true },
                                                                { name: "Floor Price", value: "`" + collectionFp + "Ξ`", inline: true },
                                                                { name: "Top Profit Member", value: "`" + topProfitMember + "`", inline: true },
                                                                { name: "NB Member Involved", value: "`" + nbMemberInvolved + "`", inline: true },
                                                            )
                                                            .setTimestamp()
                                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                                        await interaction.editReply({ embeds: [getRCprofitPrecisedAll], components: [buttonVisual] });


                                                             ///CALL BASE SQL

                                                             await interactionData.destroy({ where: { authorId: authorId, commandName: "rcprofit", serverId: serverId, } })

                                                             await interactionData.create({
     
                                                                 authorId: authorId,
                                                                 authorName: authorName,
                                                                 serverId: serverId,
                                                                 walletAddress: "N/A",
                                                                 commandName: "rcprofit",
                                                                 interactionId: interaction.id,
                                                                 walletName: "N/A",
                                                                 selecedTimestamp: selectedTime,
                                                                 embed1: "N/A",
                                                                 embed2: "N/A",
                                                                 embed3: "N/A",
                                                                 pageIndex: "N/A",
                                                                 actualPage: "N/A",
                                                                 walletCategory: "N/A",
                                                                 selectedCollection: selectedCollection,
                                                                 collectionSlug: "N/A",
                                                                 collectionBanner: "N/A",
                                                                 avgDeriskPrice: "N/A",
                                                                 floorPrice: collectionFp.toString(),
                                                                 lowerMarketlace: "N/A",
                                                                 collectionName: collectionName,
                                                                 walletCategory: "N/A",
                                                                 collectionTwitter: "N/A",
                                                                 collectionWebsite: "N/A",
                                                                 buyCount: totalBuyCount.toString(),
                                                                 mintCount: mintCount.toString(),
                                                                 soldCount: soldCount.toString(),
                                                                 remaining: holdCount.toString(),
                                                                 avgBuy: parseFloat(averageSpentValue).toFixed(3),
                                                                 avgSold: parseFloat(averageSoldValue).toFixed(3),
                                                                 realisedProfit: parseFloat(realisedProfit).toFixed(3),
                                                                 potentialProfit: parseFloat(potentialProfit).toFixed(3),
                                                                 roi: roi.toString(),
                                                                 visualTitle: "N/A",
                                                                 userAvatar: userAvatar,
                                                                 nbMembersInvolved: "N/A",
                                                                 totalTradeCount: "N/A",
     
                                                             })
     
     
                                                             /// CALL BASE SQL : FIN
     
     


                                                        //On enregistre le call API dans la database
                                                        const timeStamp = Date.now();
                                                        await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/rcprofit", apiCallName: "ethUsdPrice", apiProvider: "etherscan", timestamp: timeStamp.toString() })
                                                        for (let i = 0; i < apiObj.getCollectionsV5; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/rcprofit", apiCallName: "getCollectionsV5", apiProvider: "reservoir", timestamp: timeStamp.toString() }) }
                                                        for (let i = 0; i < apiObj.getFloorPrice; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/rcprofit", apiCallName: "getFloorPrice", apiProvider: "alchemy", timestamp: timeStamp.toString() }) }
                                                        for (let i = 0; i < apiObj.getUsersUserTokensV6; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/rcprofit", apiCallName: "getUsersUserTokensV6", apiProvider: "reservoir", timestamp: timeStamp.toString() }) }
                                                        for (let i = 0; i < apiObj.getNFTSales; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/rcprofit", apiCallName: "getNFTSales", apiProvider: "alchemy2", timestamp: timeStamp.toString() }) }
                                                        for (let i = 0; i < apiObj.getSalesV4; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/rcprofit", apiCallName: "getSalesV4", apiProvider: "reservoir", timestamp: timeStamp.toString() }) }
                                                        for (let i = 0; i < apiObj.getTransaction; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/rcprofit", apiCallName: "getTransaction", apiProvider: "web3.eth", timestamp: timeStamp.toString() }) }
                                                        for (let i = 0; i < apiObj.getTransactionReceipt; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/rcprofit", apiCallName: "getTransactionReceipt", apiProvider: "web3.eth", timestamp: timeStamp.toString() }) }
                                                        for (let i = 0; i < apiObj.getAllTransfers; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/rcprofit", apiCallName: "getAllTransfers", apiProvider: "blockspan", timestamp: timeStamp.toString() }) }






                                                        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////







                                                    } else if (selectedTime.toLowerCase() !== "all time") {


                                                        //Ajustement du Timestamp
                                                        if (selectedTime === "1 Day") { selectedTimestamp = actualTimestamp - 86400 }
                                                        if (selectedTime === "3 Days") { selectedTimestamp = actualTimestamp - 259200 }
                                                        if (selectedTime === "7 Days") { selectedTimestamp = actualTimestamp - 604800 }
                                                        if (selectedTime === "14 Days") { selectedTimestamp = actualTimestamp - 1209600 }
                                                        if (selectedTime === "30 Days") { selectedTimestamp = actualTimestamp - 2592000 }
                                                        if (selectedTime === "90 Days") { selectedTimestamp = actualTimestamp - 7776000 }
                                                        if (selectedTime === "1 Year") { selectedTimestamp = actualTimestamp - 31536000 }



                                                        // Récuperer les ID des tokens hold 
                                                        for await (const walletAddress of rcWalletsTable) {
                                                            const { data: userTokens } = await sdk.getUsersUserTokensV6({ collection: selectedCollection, limit: '200', user: walletAddress, accept: '*/*' });


                                                            for (let i = 0; i < userTokens.tokens.length; i++) { tokenHoldTable.push(userTokens.tokens[i].token.tokenId); }

                                                            if (userTokens.tokens.length > 0) { walletsInvolvedTable.push(walletAddress) }

                                                            //On incrément le compteur de call API
                                                            apiObj.getUsersUserTokensV6++
                                                        }









                                                        // Récuperer les ID des tokens sell 
                                                        for await (const walletAddress of rcWalletsTable) {
                                                            const { data: userSoldTokens } = await alchemy2.getNFTSales({
                                                                fromBlock: '0',
                                                                toBlock: 'latest',
                                                                order: 'desc',
                                                                contractAddress: selectedCollection,
                                                                sellerAddress: walletAddress,
                                                                limit: '1000',
                                                                apiKey: alchemyApiKey
                                                            })

                                                            for (let i = 0; i < userSoldTokens.nftSales.length; i++) { tokenSoldTable.push(userSoldTokens.nftSales[i].tokenId); }

                                                            if (userSoldTokens.nftSales.length > 0) { walletsInvolvedTable.push(walletAddress) }


                                                            //On incrément le compteur de call API
                                                            apiObj.getNFTSales++
                                                        }




                                                        // Récuperer le méthode (mint) prix d'achat et de vente de chaque token (vente : avec from = selectedWallet / achat : avec to = selectedWallet  )
                                                        for (const tokenId of tokenHoldTable) {
                                                            const { data: userPriceToken } = await
                                                                sdk.getSalesV4({
                                                                    token: selectedCollection + '%3A' + tokenId,
                                                                    startTimestamp: selectedTimestamp,
                                                                    limit: '100',
                                                                    accept: '*/*'
                                                                })

                                                            //On incrément le compteur de call API
                                                            apiObj.getSalesV4++


                                                            const filteredSales = userPriceToken.sales.filter(sale => rcWalletsTable.includes(sale.to));

                                                            if (filteredSales.length <= 0) {


                                                                buyMarketplaceSpent += 0;
                                                                buyMarketplaceGasSpent += 0;
                                                                incomingTransferCount += 1
                                                                outgoingTransferCount += 0


                                                            } else if (filteredSales[0].orderSide === "bid") {

                                                                buyMarketplaceSpent += parseFloat(filteredSales[0].price.amount.native);
                                                                buyMarketplaceGasSpent += 0;
                                                                buyMarketplaceCount += 1




                                                            } else {


                                                                let tokenHashTxn = filteredSales[0].txHash

                                                                const hashValueReader = await web3.eth.getTransaction(tokenHashTxn)
                                                                const hashGasReader = await web3.eth.getTransactionReceipt(tokenHashTxn)
                                                                const { data: hashTransferReader } = await bsp.getAllTransfers({ chain: 'eth-main', hash: tokenHashTxn, page_size: '100' })


                                                                //On incrément le compteur de call API
                                                                apiObj.getTransaction++
                                                                apiObj.getTransactionReceipt++
                                                                apiObj.getAllTransfers++



                                                                const hashTransferReaderObject = hashTransferReader.results;
                                                                const uniqueIds = {}; // stockage temporaire des ids uniques
                                                                let uniqueIdCount = 0; // compteur d'ids uniques

                                                                for (let i = 0; i < hashTransferReaderObject.length; i++) {
                                                                    const objectId = hashTransferReaderObject[i].id;
                                                                    if (!uniqueIds[objectId]) { // si cet id n'a pas été vu auparavant
                                                                        uniqueIds[objectId] = true; // marquer l'id comme vu
                                                                        uniqueIdCount++; // incrémenter le compteur d'ids uniques
                                                                    }
                                                                }

                                                                if (filteredSales[0].orderKind === "mint") {

                                                                    mintSpent += parseFloat(filteredSales[0].price.amount.native);
                                                                    mintGasSpent += (parseFloat(web3.utils.fromWei(((hashValueReader.gasPrice) * (hashGasReader.gasUsed)).toString(), 'ether'))) / uniqueIdCount;
                                                                    mintCount += 1

                                                                } else {

                                                                    buyMarketplaceSpent += parseFloat(filteredSales[0].price.amount.native);
                                                                    buyMarketplaceGasSpent += (parseFloat(web3.utils.fromWei(((hashValueReader.gasPrice) * (hashGasReader.gasUsed)).toString(), 'ether'))) / uniqueIdCount;
                                                                    buyMarketplaceCount += 1

                                                                }
                                                            }
                                                        }



                                                        // Même chose pour token sold
                                                        for (const tokenId of tokenSoldTable) {
                                                            const { data: userPriceToken } = await
                                                                sdk.getSalesV4({
                                                                    token: selectedCollection + '%3A' + tokenId,
                                                                    startTimestamp: selectedTimestamp,
                                                                    limit: '100',
                                                                    accept: '*/*'
                                                                })

                                                            //On incrément le compteur de call API
                                                            apiObj.getSalesV4++


                                                            const filteredSales = userPriceToken.sales.filter(sale => rcWalletsTable.includes(sale.to));

                                                            if (filteredSales.length <= 0) {


                                                                buyMarketplaceSpent += 0;
                                                                buyMarketplaceGasSpent += 0;
                                                                incomingTransferCount += 1
                                                                outgoingTransferCount += 0

                                                            } else if (filteredSales[0].orderSide === "bid") {

                                                                buyMarketplaceSpent += parseFloat(filteredSales[0].price.amount.native);
                                                                buyMarketplaceGasSpent += 0;
                                                                buyMarketplaceCount += 1


                                                            } else {

                                                                let tokenHashTxn = filteredSales[0].txHash

                                                                const hashValueReader = await web3.eth.getTransaction(tokenHashTxn)
                                                                const hashGasReader = await web3.eth.getTransactionReceipt(tokenHashTxn)
                                                                const { data: hashTransferReader } = await bsp.getAllTransfers({ chain: 'eth-main', hash: tokenHashTxn, page_size: '100' })


                                                                //On incrément le compteur de call API
                                                                apiObj.getTransaction++
                                                                apiObj.getTransactionReceipt++
                                                                apiObj.getAllTransfers++



                                                                const hashTransferReaderObject = hashTransferReader.results;
                                                                const uniqueIds = {}; // stockage temporaire des ids uniques
                                                                let uniqueIdCount = 0; // compteur d'ids uniques

                                                                for (let i = 0; i < hashTransferReaderObject.length; i++) {
                                                                    const objectId = hashTransferReaderObject[i].id;
                                                                    if (!uniqueIds[objectId]) { // si cet id n'a pas été vu auparavant
                                                                        uniqueIds[objectId] = true; // marquer l'id comme vu
                                                                        uniqueIdCount++; // incrémenter le compteur d'ids uniques
                                                                    }
                                                                }

                                                                if (filteredSales[0].orderKind === "mint") {

                                                                    mintSpent += parseFloat(filteredSales[0].price.amount.native);
                                                                    mintGasSpent += (parseFloat(web3.utils.fromWei(((hashValueReader.gasPrice) * (hashGasReader.gasUsed)).toString(), 'ether'))) / uniqueIdCount;
                                                                    mintCount += 1

                                                                } else {

                                                                    buyMarketplaceSpent += parseFloat(filteredSales[0].price.amount.native);
                                                                    buyMarketplaceGasSpent += (parseFloat(web3.utils.fromWei(((hashValueReader.gasPrice) * (hashGasReader.gasUsed)).toString(), 'ether'))) / uniqueIdCount;
                                                                    buyMarketplaceCount += 1
                                                                }

                                                            }
                                                        }





                                                        // Calculer la valeur des ventes de token sold
                                                        for (const tokenId of tokenSoldTable) {
                                                            const { data: userPriceToken } = await
                                                                sdk.getSalesV4({
                                                                    token: selectedCollection + '%3A' + tokenId,
                                                                    startTimestamp: selectedTimestamp,
                                                                    limit: '100',
                                                                    accept: '*/*'
                                                                })

                                                            //On incrément le compteur de call API
                                                            apiObj.getSalesV4++


                                                            const filteredSales = userPriceToken.sales.filter(sale => rcWalletsTable.includes(sale.from));

                                                            if (filteredSales.length <= 0) {


                                                                soldValue += 0;
                                                                soldGasValue += 0;
                                                                incomingTransferCount += 0
                                                                outgoingTransferCount += 1

                                                            } else if (filteredSales[0].orderSide === "bid") {

                                                                soldValue += parseFloat(filteredSales[0].price.amount.native);


                                                                let tokenHashTxn = filteredSales[0].txHash

                                                                const hashValueReader = await web3.eth.getTransaction(tokenHashTxn)
                                                                const hashGasReader = await web3.eth.getTransactionReceipt(tokenHashTxn)
                                                                const { data: hashTransferReader } = await bsp.getAllTransfers({ chain: 'eth-main', hash: tokenHashTxn, page_size: '100' })


                                                                //On incrément le compteur de call API
                                                                apiObj.getTransaction++
                                                                apiObj.getTransactionReceipt++
                                                                apiObj.getAllTransfers++



                                                                const hashTransferReaderObject = hashTransferReader.results;
                                                                const uniqueIds = {}; // stockage temporaire des ids uniques
                                                                let uniqueIdCount = 0; // compteur d'ids uniques

                                                                for (let i = 0; i < hashTransferReaderObject.length; i++) {
                                                                    const objectId = hashTransferReaderObject[i].id;
                                                                    if (!uniqueIds[objectId]) { // si cet id n'a pas été vu auparavant
                                                                        uniqueIds[objectId] = true; // marquer l'id comme vu
                                                                        uniqueIdCount++; // incrémenter le compteur d'ids uniques
                                                                    }
                                                                }

                                                                soldGasValue += (parseFloat(web3.utils.fromWei(((hashValueReader.gasPrice) * (hashGasReader.gasUsed)).toString(), 'ether'))) / uniqueIdCount;



                                                            } else {

                                                                soldValue += parseFloat(filteredSales[0].price.amount.native);
                                                                soldGasValue += 0;


                                                            }
                                                        }



                                                        //Résultat calcul API
                                                        totalTokenTradedCount = tokenHoldTable.length + tokenSoldTable.length
                                                        holdCount = tokenHoldTable.length
                                                        totalBuyCount = buyMarketplaceCount + mintCount
                                                        soldCount = tokenSoldTable.length
                                                        transferCount = incomingTransferCount - outgoingTransferCount

                                                        totalMintSpent = mintGasSpent + mintSpent
                                                        buyMarketplaceTotalSpent = buyMarketplaceGasSpent + buyMarketplaceSpent
                                                        totalSoldValue = soldValue - soldGasValue
                                                        totalSpent = buyMarketplaceTotalSpent + totalMintSpent

                                                        if (totalSpent > 0) { averageSpentValue = totalSpent / totalTokenTradedCount }
                                                        if (totalSoldValue > 0) { averageSoldValue = totalSoldValue / soldCount }

                                                        if (holdCount > 0) { averageHoldValue = holdCount * collectionFp }


                                                        potentialProfit = (soldValue + averageHoldValue) - totalSpent // Ajouter royalties ?
                                                        realisedProfit = soldValue - totalSpent


                                                        //ROI Variable
                                                        if (!(data.collections[0].floorAsk.price) && secondcollectionFp.openSea.floorPrice === 0) {
                                                            roi = "N/A"
                                                        } else {
                                                            roi = ((((averageHoldValue + soldValue) - totalSpent) / totalSpent) * 100).toFixed(2)
                                                        }


                                                        if (roi !== 0 && totalSpent !== 0 && collectionFp !== 'N/A') {

                                                            if (roi > 0) {
                                                                roiPrefix = "+";
                                                                roiSuffix = " :chart_with_upwards_trend:";
                                                            } else if (roi < 0) {
                                                                roiSuffix = " :chart_with_downwards_trend:";
                                                            }
                                                            roiFormatted = "`" + roiPrefix + parseFloat(roi).toFixed(2) + "%" + "`" + roiSuffix;

                                                        } else if (roi === 0 || roi === "NaN") {

                                                            roiFormatted = "`0.00%`"

                                                        } else if (collectionFp === "N/A") {

                                                            roiFormatted = "'N/A'"

                                                        } else if (totalSpent === 0 && (soldCount + holdCount > 0)) {

                                                            roiFormatted = "`INFINITY`<a:RCRich:1044762000837840926>"

                                                        }

                                                        // Transfer mise en forme
                                                        if (transferCount > 0) {
                                                            transferPrefix = "+";
                                                        } else if (transferCount < 0) {
                                                            transferPrefix = "-";
                                                        } else {
                                                            transferPrefix = ""
                                                        }
                                                        let transferCountFormated = transferPrefix + parseFloat(transferCount)


                                                        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

                                                        //Trois dernière ligne de l'embed


                                                        for (const walletAddress of walletsInvolvedTable) {
                                                            const findIdOfWallets = await wallets.findOne({ where: { walletAddress: walletAddress } })

                                                            totalMemberInvolvedCountTable.push(findIdOfWallets.dataValues.authorUsername)
                                                            if (!membersInvolvedTable.includes(findIdOfWallets.dataValues.authorId)) {
                                                                membersInvolvedTable.push(findIdOfWallets.dataValues.authorId)
                                                                nbMemberInvolved = + 1
                                                            }

                                                        }



                                                        function valeurPlusRecurrente(totalMemberInvolvedCountTable) {
                                                            let compteur = {};
                                                            let maxCompteur = 0;
                                                            let valeurPlusRecurrente = totalMemberInvolvedCountTable[0];

                                                            for (let i = 0; i < totalMemberInvolvedCountTable.length; i++) {
                                                                let valeur = totalMemberInvolvedCountTable[i];
                                                                compteur[valeur] = (compteur[valeur] || 0) + 1;
                                                                if (compteur[valeur] > maxCompteur) {
                                                                    maxCompteur = compteur[valeur];
                                                                    valeurPlusRecurrente = valeur;
                                                                }
                                                            }

                                                            const valeurLaPlusRecurrente = valeurPlusRecurrente;
                                                            return valeurLaPlusRecurrente;
                                                        }

                                                        topProfitMemberUnformatted = valeurPlusRecurrente(totalMemberInvolvedCountTable);
                                                        if (topProfitMemberUnformatted) {
                                                            topProfitMember = topProfitMemberUnformatted.split(' ')[0];
                                                        }





                                                       










                                                        //Embed getRCprofitPrecisedAll
                                                        const getRCprofitPrecisedPrecised = new EmbedBuilder().setColor("#060A8F")
                                                            .setTitle(`Group profits on ${collectionName}`)
                                                            .setDescription(">>> `" + selectedTime + "` profits made by the group on " + collectionName)
                                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                                            //.setThumbnail(collectionLogo)
                                                            .setImage(collectionBanner)
                                                            .addFields(
                                                                { name: "Mint Spent", value: "`" + parseFloat(mintSpent).toFixed(3) + "Ξ (" + parseFloat(mintSpent * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "Mint Gas Spent", value: "`" + parseFloat(mintGasSpent).toFixed(3) + "Ξ (" + parseFloat(mintGasSpent * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "Total Mint Spent", value: "`" + parseFloat(totalMintSpent).toFixed(3) + "Ξ (" + parseFloat(totalMintSpent * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "Buy Spent", value: "`" + parseFloat(buyMarketplaceSpent).toFixed(3) + "Ξ (" + parseFloat(buyMarketplaceSpent * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "Buy Gas Spent", value: "`" + parseFloat(buyMarketplaceGasSpent).toFixed(3) + "Ξ (" + parseFloat(buyMarketplaceGasSpent * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "Total Buy Spent", value: "`" + parseFloat(buyMarketplaceTotalSpent).toFixed(3) + "Ξ (" + parseFloat(buyMarketplaceTotalSpent * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "Sold Value", value: "`" + parseFloat(soldValue).toFixed(3) + "Ξ (" + parseFloat(soldValue * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "Sold Gas Value", value: "`" + parseFloat(soldGasValue).toFixed(3) + "Ξ (" + parseFloat(soldGasValue * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "Total Sold Value", value: "`" + parseFloat(totalSoldValue).toFixed(3) + "Ξ (" + parseFloat(totalSoldValue * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "NFT Mint Count", value: "`" + mintCount + "`", inline: true },
                                                                { name: "NFT Buy Count", value: "`" + buyMarketplaceCount + "`", inline: true },
                                                                { name: "NFT Total Count", value: "`" + totalBuyCount + "`", inline: true },
                                                                { name: "NFT Hold Count", value: "`" + holdCount + "`", inline: true },
                                                                { name: "NFT Sold Count", value: "`" + soldCount + "`", inline: true },
                                                                { name: "NFT Transfer Count", value: "`" + transferCountFormated + "`", inline: true },
                                                                { name: "AVG Spent Value ", value: "`" + parseFloat(averageSpentValue).toFixed(3) + "Ξ (" + parseFloat(averageSpentValue * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "AVG Sold Value", value: "`" + parseFloat(averageSoldValue).toFixed(3) + "Ξ (" + parseFloat(averageSoldValue * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "AVG Hold Value", value: "`" + parseFloat(averageHoldValue).toFixed(3) + "Ξ (" + parseFloat(averageHoldValue * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "Realised Profit", value: "`" + parseFloat(realisedProfit).toFixed(3) + "Ξ (" + parseFloat(realisedProfit * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "Potential Profit", value: "`" + parseFloat(potentialProfit).toFixed(3) + "Ξ (" + parseFloat(potentialProfit * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "Potential PNL", value: roiFormatted, inline: true },
                                                                { name: "Floor Price", value: "`" + collectionFp + "Ξ`", inline: true },
                                                                { name: "Top Member", value: "`" + topProfitMember + "`", inline: true },
                                                                { name: "Member Involved", value: "`" + nbMemberInvolved + "`", inline: true },
                                                            )
                                                            .setTimestamp()
                                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                                        await interaction.editReply({ embeds: [getRCprofitPrecisedPrecised], components: [buttonVisual] });


                                                         /////////// CALL BASE SQL

                                                         await interactionData.destroy({ where: { authorId: authorId, commandName: "rcprofit", serverId: serverId } })

                                                         await interactionData.create({
 
                                                             authorId: authorId,
                                                             authorName: authorName,
                                                             serverId: serverId,
                                                             walletAddress: "N/A",
                                                             commandName: "rcprofit",
                                                             interactionId: interaction.id,
                                                             walletName: "N/A",
                                                             selecedTimestamp: selectedTime,
                                                             embed1: "N/A",
                                                             embed2: "N/A",
                                                             embed3: "N/A",
                                                             pageIndex: "N/A",
                                                             actualPage: "N/A",
                                                             walletCategory: "N/A",
                                                             selectedCollection: selectedCollection,
                                                             collectionSlug: "N/A",
                                                             collectionBanner: "N/A",
                                                             avgDeriskPrice: "N/A",
                                                             floorPrice: collectionFp.toString(),
                                                             lowerMarketlace: "N/A",
                                                             collectionName: collectionName,
                                                             walletCategory: "N/A",
                                                             collectionTwitter: "N/A",
                                                             collectionWebsite: "N/A",
                                                             buyCount: totalBuyCount.toString(),
                                                             mintCount: mintCount.toString(),
                                                             soldCount: soldCount.toString(),
                                                             remaining: holdCount.toString(),
                                                             avgBuy: parseFloat(averageSpentValue).toFixed(3),
                                                             avgSold: parseFloat(averageSoldValue).toFixed(3),
                                                             realisedProfit: parseFloat(realisedProfit).toFixed(3),
                                                             potentialProfit: parseFloat(potentialProfit).toFixed(3),
                                                             roi: roi.toString(),
                                                             visualTitle: "N/A",
                                                             userAvatar: userAvatar,
                                                             nbMembersInvolved: "N/A",
                                                             totalTradeCount: "N/A",
 
                                                         })
 
 
                                                         //////////// CALL BASE SQL : FIN
 


                                                        //On enregistre le call API dans la database
                                                        const timeStamp = Date.now();
                                                        await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/rcprofit", apiCallName: "ethUsdPrice", apiProvider: "etherscan", timestamp: timeStamp.toString() })
                                                        for (let i = 0; i < apiObj.getCollectionsV5; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/rcprofit", apiCallName: "getCollectionsV5", apiProvider: "reservoir", timestamp: timeStamp.toString() }) }
                                                        for (let i = 0; i < apiObj.getFloorPrice; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/rcprofit", apiCallName: "getFloorPrice", apiProvider: "alchemy", timestamp: timeStamp.toString() }) }
                                                        for (let i = 0; i < apiObj.getUsersUserTokensV6; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/rcprofit", apiCallName: "getUsersUserTokensV6", apiProvider: "reservoir", timestamp: timeStamp.toString() }) }
                                                        for (let i = 0; i < apiObj.getNFTSales; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/rcprofit", apiCallName: "getNFTSales", apiProvider: "alchemy2", timestamp: timeStamp.toString() }) }
                                                        for (let i = 0; i < apiObj.getSalesV4; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/rcprofit", apiCallName: "getSalesV4", apiProvider: "reservoir", timestamp: timeStamp.toString() }) }
                                                        for (let i = 0; i < apiObj.getTransaction; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/rcprofit", apiCallName: "getTransaction", apiProvider: "web3.eth", timestamp: timeStamp.toString() }) }
                                                        for (let i = 0; i < apiObj.getTransactionReceipt; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/rcprofit", apiCallName: "getTransactionReceipt", apiProvider: "web3.eth", timestamp: timeStamp.toString() }) }
                                                        for (let i = 0; i < apiObj.getAllTransfers; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/rcprofit", apiCallName: "getAllTransfers", apiProvider: "blockspan", timestamp: timeStamp.toString() }) }





                                                    }
                                                })

                                        }


                                    } else {

                                        const setwalletErrorEmbed = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle(`No wallet`)
                                            .setDescription("Aura can't analyze the community's wallet data because you don't have any wallet registered in your community portfolio. Please use `/wallet set` or `/wallet raw` to register a wallet in your portfolio then try again.")
                                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                        await interaction.editReply({ embeds: [setwalletErrorEmbed] });





                                    }




                                    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                } else if (!member.roles.cache.has(communityAdminRoleId)) {



                                    const notMember = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle(`Bot Access`)
                                        .setDescription(">>> Showing access data")
                                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .addFields(
                                            { name: " ", value: " ", inline: false },
                                            { name: "Status", value: "`Access Denied ❌`", inline: true },
                                            { name: "Required Role", value: "<@&" + communityAdminRoleId + ">", inline: true },
                                            { name: "Problem Detected", value: "Your access to the `clear` option of the command has been denied. You can only use this if you have the required admin role in this community. If you usually have access to this command option, make sure you're in the right community or contact an admin of the bot.", inline: false },
                                        )
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                    await interaction.editReply({ embeds: [notMember] });





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
                                    { name: 'Required Tier', value: "`S-TIER`", inline: true },
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
                let reportCommand = "/rcprofit"

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

