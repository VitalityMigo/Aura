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
const magicedenApiKey = process.env.magicedenApiKey

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
const { Network, Alchemy } = require('alchemy-sdk');
const { isValid } = require("date-fns");
const settings = {
    apiKey: alchemyApiKey, // Replace with your Alchemy API Key.
    network: Network.ETH_MAINNET, // Replace with your network.
};
const alchemy = new Alchemy(settings);
const alchemy2 = require('api')('@alchemy-docs/v1.0#24zcsa23lfbpdnv5');

// Configuration de l'en-tête d'autorisation
const headers = {
    'Authorization': `Bearer ${magicedenApiKey}`
};


function isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function estLienHTTPS(val) {
    var lienRegex = /^(https:\/\/)/i; // Regex pour vérifier si le lien commence par "https://"

    return lienRegex.test(val);
}


function isValidInput(input) {
    return /^(\w+|-)+$/.test(input);
}

function isBRC20BitcoinWallet(wallet) {
    const regex = /^bc1[a-zA-Z0-9]{39,59}$/;

    return regex.test(wallet);
}



module.exports = {
    data: new SlashCommandBuilder()
        .setName("profit")
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
                .setName("wallet")
                .setDescription("The category you want to set up your wallet in")
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption(option =>
            option
                .setName("timelapse")
                .setDescription("The category you want to set up your wallet in")
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


                        if (accessTier.toLowerCase() == "b-tier" || accessTier.toLowerCase() == "a-tier" || accessTier.toLowerCase() == "s-tier") {


                            if (member.roles.cache.has(communityMemberRoleId)) {


                                //Checkpoint
                                console.log("// Step 2 : Authorization - Executed ✅")



                                //On enregistre le user si il est pas encore dans la database
                                const timeStamp1 = Date.now();
                                const actualTimestamp1 = parseFloat(timeStamp1 / 1000).toFixed(0)
                                const isUser = await usersql.findOne({ where: { userId: authorId, serverId: serverId } })
                                if (isUser == null) { await usersql.create({ userId: authorId, userName: authorName, userAvatar: userAvatar, serverId: serverId, timestamp: actualTimestamp1 }) }



                                //Variable pour les options
                                const walletAddress = interaction.options.getString("wallet");
                                const selectedCollection = interaction.options.getString("collection");
                                const selectedTime = interaction.options.getString("timelapse");


                                //Variable pour l'autocomplete de wallet et collection
                                const walletChoices = await wallets.findOne({ where: { walletAddress: walletAddress } })

                                //Récupérer Timestamp
                                const timeStamp = Date.now();
                                const actualTimestamp = parseFloat(timeStamp / 1000).toFixed(0)
                                let selectedTimestamp = 0

                                const buttonsRow = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('profitvisual-button')
                                            .setLabel('visual')
                                            .setStyle(2)
                                    );




                                //Check si soit Wallet soit Category




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
                                let totalHoldValue = 0
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
                                let averageMintValue = 0
                                let averageBuyValue = 0

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

                                //New variable
                                let collectionContractTableCount = 0
                                let averageFloor = 0
                                let totalFloorHolding = 0
                                let walletConcerned = 0




                                //Condition qui vérifie si c'est Wallet ou Category qui a été séléctionné, dans ce cas Wallet

                                // Condition qui vérifie que le choix de wallet est legit, dans ce cas non


                                    // Si wallet est all
                                    if (walletAddress.toLowerCase() === "all") {

                                        //Définir la plage de wallet
                                        let allWalletAddressOfAuthorTable = []
                                        const allWalletsOfAuthor = await wallets.findAll({ where: { authorId: authorId, walletCategory: "eth" } });
                                        const allWalletsOfAuthorBTC = await wallets.findAll({ where: { authorId: authorId, walletCategory: "btc" } });
                                        for (let i = 0; i < allWalletsOfAuthor.length; i++) { allWalletAddressOfAuthorTable.push(allWalletsOfAuthor[i].dataValues.walletAddress); }
                                        walletConcerned = allWalletsOfAuthor.length
                                        if (walletConcerned < 0) { walletConcerned = "0" }
                                        console.log(allWalletAddressOfAuthorTable)


                                        if ((allWalletAddressOfAuthorTable.length + allWalletsOfAuthorBTC.length) > 0) {



                                            //Ajustement du Timestamp
                                            if (selectedTime === "1 Day") { selectedTimestamp = actualTimestamp - 86400 }
                                            if (selectedTime === "3 Days") { selectedTimestamp = actualTimestamp - 259200 }
                                            if (selectedTime === "7 Days") { selectedTimestamp = actualTimestamp - 604800 }
                                            if (selectedTime === "14 Days") { selectedTimestamp = actualTimestamp - 1209600 }
                                            if (selectedTime === "30 Days") { selectedTimestamp = actualTimestamp - 2592000 }
                                            if (selectedTime === "90 Days") { selectedTimestamp = actualTimestamp - 7776000 }
                                            if (selectedTime === "1 Year") { selectedTimestamp = actualTimestamp - 31536000 }
                                            if (selectedTime === "All Time" || !selectedTime) { selectedTimestamp = 0 }




                                            // SI collection = All, wallet = All et pas wallet category
                                            if (selectedCollection.toLowerCase() === "all") {



                                                ////////////////// A BUILD (ALL COLLECTION) \\\\\\\\\\\\\\\\\\\\



                                                ////////////////// A BUILD (ALL COLLECTION) \\\\\\\\\\\\\\\\\\\\

                                                const availableInTheNearFuture = new EmbedBuilder().setColor("#060A8F")
                                                    .setTitle(`${authorName}'s profit`)
                                                    .setDescription("The option you try to use is currently being built and will be available in the near future. You can still use all the commands not including `all collections` in the meantime.")
                                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                    .setTimestamp()
                                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                                await interaction.editReply({ embeds: [availableInTheNearFuture] });


                                                ////////////////// A BUILD (ALL COLLECTION) \\\\\\\\\\\\\\\\\\\\



                                                ////////////////// A BUILD (ALL COLLECTION) \\\\\\\\\\\\\\\\\\\\





                                                // SI collection précise, wallet = All et pas wallet category
                                            } else if (selectedCollection !== "all") {





                                                if (isValidEthereumAddress(selectedCollection)) {

                                                    if (allWalletAddressOfAuthorTable.length > 0) {



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



                                                                // Récuperer les ID des tokens hold 
                                                                for await (const walletAddress of allWalletAddressOfAuthorTable) {
                                                                    const { data: userTokens } = await sdk.getUsersUserTokensV6({ collection: selectedCollection, limit: '200', user: walletAddress, accept: '*/*' });


                                                                    for (let i = 0; i < userTokens.tokens.length; i++) { tokenHoldTable.push(userTokens.tokens[i].token.tokenId); }

                                                                    if (userTokens.tokens.length > 0) { walletsInvolvedTable.push(walletAddress) }


                                                                    //On incrément le compteur de call API
                                                                    apiObj.getUsersUserTokensV6++
                                                                }




                                                                // Récuperer les ID des tokens sell 
                                                                for await (const walletAddress of allWalletAddressOfAuthorTable) {
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


                                                                    const filteredSales = userPriceToken.sales.filter(sale => allWalletAddressOfAuthorTable.includes(sale.to));

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

                                                                    const filteredSales = userPriceToken.sales.filter(sale => allWalletAddressOfAuthorTable.includes(sale.to));

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



                                                                    const filteredSales = userPriceToken.sales.filter(sale => allWalletAddressOfAuthorTable.includes(sale.from));

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

                                                                if (totalSpent > 0) {
                                                                    if (buyMarketplaceTotalSpent > 0) {
                                                                        averageBuyValue = buyMarketplaceTotalSpent / buyMarketplaceCount

                                                                    }
                                                                    averageSpentValue = totalSpent / totalTokenTradedCount

                                                                    if (mintCount > 0) {
                                                                        averageMintValue = totalMintSpent / mintCount
                                                                    }
                                                                }

                                                                if (totalSoldValue > 0) {
                                                                    averageSoldValue = totalSoldValue / soldCount
                                                                }

                                                                if (holdCount > 0) {
                                                                    totalHoldValue = holdCount * collectionFp
                                                                    averageHoldValue = totalHoldValue / holdCount

                                                                }


                                                                potentialProfit = (soldValue + totalHoldValue) - totalSpent // Ajouter royalties ?
                                                                realisedProfit = soldValue - totalSpent

                                                                //ROI Variable
                                                                if (!(data.collections[0].floorAsk.price) && secondcollectionFp.openSea.floorPrice === 0) {
                                                                    roi = "N/A"
                                                                } else {
                                                                    roi = ((((totalHoldValue + soldValue) - totalSpent) / totalSpent) * 100).toFixed(2)
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





                                                                let selectedTimeFormatted = selectedTime
                                                                if (!selectedTime) { selectedTimeFormatted = "All Time" }



                                                                //Embed getRCprofitPrecisedAll
                                                                const getprofitAllWalletOneCollection = new EmbedBuilder().setColor("#060A8F")
                                                                    .setTitle(`${collectionName}`)
                                                                    .setDescription(">>> `" + selectedTimeFormatted + "` profits made by all the wallets `(" + walletConcerned + ")` of " + authorName + " on " + collectionName)
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
                                                                        { name: "AVG Mint Value ", value: "`" + parseFloat(averageMintValue).toFixed(3) + "Ξ (" + parseFloat(averageMintValue * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                        { name: "AVG Buy Value ", value: "`" + parseFloat(averageBuyValue).toFixed(3) + "Ξ (" + parseFloat(averageBuyValue * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                        { name: "AVG Spent Value ", value: "`" + parseFloat(averageSpentValue).toFixed(3) + "Ξ (" + parseFloat(averageSpentValue * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                        { name: "AVG Sold Value", value: "`" + parseFloat(averageSoldValue).toFixed(3) + "Ξ (" + parseFloat(averageSoldValue * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                        { name: "AVG Hold Value", value: "`" + parseFloat(averageHoldValue).toFixed(3) + "Ξ (" + parseFloat(averageHoldValue * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                        { name: "Total Hold Value", value: "`" + parseFloat(totalHoldValue).toFixed(3) + "Ξ (" + parseFloat(totalHoldValue * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                        { name: "Realised Profit", value: "`" + parseFloat(realisedProfit).toFixed(3) + "Ξ (" + parseFloat(realisedProfit * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                        { name: "Potential Profit", value: "`" + parseFloat(potentialProfit).toFixed(3) + "Ξ (" + parseFloat(potentialProfit * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                        { name: "Potential ROI", value: roiFormatted, inline: true },
                                                                        { name: " ", value: "*Please note that Aura isn't analyzing Blur V3 contract sales for the moment. We're working on it to make it available ASAP.*", inline: false },


                                                                    )
                                                                    .setTimestamp()
                                                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                                                await interaction.editReply({ embeds: [getprofitAllWalletOneCollection], components: [buttonsRow] });




                                                                //////CALL BASE SQL


                                                                await interactionData.destroy({ where: { authorId: authorId, commandName: "profit", serverId: serverId } })

                                                                await interactionData.create({

                                                                    authorId: authorId,
                                                                    authorName: authorName,
                                                                    serverId: serverId,
                                                                    walletAddress: "N/A",
                                                                    commandName: "profit",
                                                                    interactionId: interaction.id,
                                                                    walletName: "N/A",
                                                                    selecedTimestamp: "N/A",
                                                                    embed1: "N/A",
                                                                    embed2: "N/A",
                                                                    embed3: "N/A",
                                                                    pageIndex: "N/A",
                                                                    actualPage: "N/A",
                                                                    walletCategory: "eth",
                                                                    selectedCollection: selectedCollection,
                                                                    collectionSlug: "N/A",
                                                                    collectionBanner: "N/A",
                                                                    avgDeriskPrice: "N/A",
                                                                    floorPrice: collectionFp.toString(),
                                                                    lowerMarketlace: "N/A",
                                                                    collectionName: collectionName,
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

                                                                //////CALL BASE SQL



                                                                //On enregistre le call API dans la database
                                                                const timeStamp = Date.now();
                                                                await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/profit", apiCallName: "ethUsdPrice", apiProvider: "etherscan", timestamp: timeStamp.toString() })
                                                                for (let i = 0; i < apiObj.getCollectionsV5; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/profit", apiCallName: "getCollectionsV5", apiProvider: "reservoir", timestamp: timeStamp.toString() }) }
                                                                for (let i = 0; i < apiObj.getFloorPrice; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/profit", apiCallName: "getFloorPrice", apiProvider: "alchemy", timestamp: timeStamp.toString() }) }
                                                                for (let i = 0; i < apiObj.getUsersUserTokensV6; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/profit", apiCallName: "getUsersUserTokensV6", apiProvider: "reservoir", timestamp: timeStamp.toString() }) }
                                                                for (let i = 0; i < apiObj.getNFTSales; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/profit", apiCallName: "getNFTSales", apiProvider: "alchemy2", timestamp: timeStamp.toString() }) }
                                                                for (let i = 0; i < apiObj.getSalesV4; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/profit", apiCallName: "getSalesV4", apiProvider: "reservoir", timestamp: timeStamp.toString() }) }
                                                                for (let i = 0; i < apiObj.getTransaction; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/profit", apiCallName: "getTransaction", apiProvider: "web3.eth", timestamp: timeStamp.toString() }) }
                                                                for (let i = 0; i < apiObj.getTransactionReceipt; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/profit", apiCallName: "getTransactionReceipt", apiProvider: "web3.eth", timestamp: timeStamp.toString() }) }
                                                                for (let i = 0; i < apiObj.getAllTransfers; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/profit", apiCallName: "getAllTransfers", apiProvider: "blockspan", timestamp: timeStamp.toString() }) }





                                                            })

                                                    } else {

                                                        const setwalletErrorEmbed = new EmbedBuilder().setColor("#060A8F")
                                                            .setTitle(`No wallet`)
                                                            .setDescription("Aura can't analyze your wallet's data on this collection because you don't have any Ethereum wallet registered in your portfolio. Please use `/wallet set` or `/wallet raw` to register a wallet in your portfolio then try again.")
                                                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                                            .setTimestamp()
                                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                                        await interaction.editReply({ embeds: [setwalletErrorEmbed] });

                                                    }

                                                } else if (isValidInput(selectedCollection)) {






                                                    const btcWalletCount = allWalletsOfAuthorBTC.length
                                                    const btcWalletTable = [...new Set(allWalletsOfAuthorBTC.map(wallet => wallet.dataValues.walletAddress))];

                                                    if (btcWalletTable.length > 0) {


                                                        let name = ""
                                                        let collectionLogo = ""
                                                        let twitter = ""
                                                        let discord = ""
                                                        let website = ""

                                                        let mintSpent = 0
                                                        let mintGasSpent = 0
                                                        let totalMintSpent = 0
                                                        let buyMarketplaceSpent = 0
                                                        let buyMarketplaceGasSpent = 0
                                                        let buyMarketplaceTotalSpent = 0
                                                        let soldValue = 0
                                                        let soldGasValue = 0
                                                        let totalSoldValue = 0
                                                        let mintCount = 0
                                                        let buyMarketplaceCount = 0
                                                        let totalBuyCount = 0
                                                        let holdCount = 0
                                                        let soldCount = 0
                                                        let transferCount = 0
                                                        let transferCountFormated = 0
                                                        let averageMintValue = 0
                                                        let averageBuyValue = 0
                                                        let averageSpentValue = 0
                                                        let averageSoldValue = 0
                                                        let averageHeldValue = 0
                                                        let totalHoldValue = 0
                                                        let realisedProfit = 0
                                                        let potentialProfit = 0
                                                        let roiFormatted = 0


                                                        const btcCallPrice = await axios.get("https://blockchain.info/q/24hrprice")
                                                        const BTCUsdPrice = btcCallPrice.data




                                                        const url = `https://api-mainnet.magiceden.dev/v2/ord/btc/collections/` + selectedCollection;
                                                        const response = await axios.get(url, { headers });
                                                        const data = await response.data;

                                                        collectionLogo = data.imageURI
                                                        name = data.name
                                                        twitter = data.twitterLink
                                                        discord = data.discordLink
                                                        website = data.websiteLink


                                                        const url2 = `https://api-mainnet.magiceden.dev/v2/ord/btc/stat?collectionSymbol=` + selectedCollection;
                                                        const response2 = await axios.get(url2, { headers });
                                                        const data2 = await response2.data;


                                                        const floorPrice = (data2.floorPrice) / (10 ** 8)

                                                        let tokenHeldId = []
                                                        console.log(btcWalletTable)
                                                        for (const walletAddress of btcWalletTable) {

                                                            const url3 = `https://api-mainnet.magiceden.dev/v2/ord/btc/tokens?collectionSymbol=` + selectedCollection + `&ownerAddress=` + walletAddress + `&showAll=true&sortBy=priceAsc`;
                                                            const response3 = await axios.get(url3, { headers });
                                                            const data3 = await response3.data;

                                                            for (const token of data3.tokens) {
                                                                tokenHeldId.push(token.id)
                                                            }
                                                        }
                                                        console.log(tokenHeldId)

                                                        totalHoldValue = floorPrice * tokenHeldId.length
                                                        averageHeldValue = totalHoldValue / holdCount



                                                        //On calcul le prix et méthode d'achat des token held
                                                        for (const token of tokenHeldId) {

                                                            //Buy classic
                                                            const tokenBuyLink = `https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=buying_broadcasted&tokenId=` + token
                                                            const tokenBuyCall = await axios.get(tokenBuyLink, { headers });
                                                            const tokenBuy = await tokenBuyCall.data.activities;

                                                            const tokenBuyByWallet = tokenBuy.filter(activity => activity.oldOwner.toLowerCase() !== walletAddress.toLowerCase() && activity.newOwner.toLowerCase() == walletAddress.toLowerCase() && ((Date.parse(activity.createdAt)) / 1000) >= selectedTimestamp);


                                                            if (tokenBuyByWallet.length > 0) {

                                                                const mempoolCall = await axios.get("https://mempool.space/api/tx/" + tokenBuyByWallet[0].txId)

                                                                buyMarketplaceSpent += ((tokenBuyByWallet[0].listedPrice) / (10 ** 8))
                                                                buyMarketplaceGasSpent += mempoolCall.data.fee / (10 ** 8)
                                                                buyMarketplaceCount += 1

                                                            } else {


                                                                //Create
                                                                const tokenCreateLink = `https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=create&tokenId=` + token.tokenInscription
                                                                const tokenCreateCall = await axios.get(tokenCreateLink, { headers });
                                                                const tokenCreate = await tokenCreateCall.data.activities;

                                                                const tokenCreateByWallet = tokenCreate.filter(activity => activity.newOwner.toLowerCase() == walletAddress.toLowerCase() && ((Date.parse(activity.createdAt)) / 1000) >= selectedTimestamp);

                                                                if (tokenCreateByWallet.length > 0) {

                                                                    const mempoolCall = await axios.get("https://mempool.space/api/tx/" + tokenBuyByWallet[0].txId)

                                                                    mintSpent += ((tokenBuyByWallet[0].txValue) / (10 ** 8))
                                                                    mintGasSpent += mempoolCall.data.fee / (10 ** 8)
                                                                    mintCount += 1

                                                                } else {

                                                                    //Mint
                                                                    const tokenMintLink = `https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=mint_broadcasted&tokenId=` + token.tokenInscription
                                                                    const tokenMintCall = await axios.get(tokenMintLink, { headers });
                                                                    const tokenMint = await tokenMintCall.data.activities;

                                                                    const tokenMintByWallet = tokenMint.filter(activity => activity.newOwner.toLowerCase() == walletAddress.toLowerCase() && ((Date.parse(activity.createdAt)) / 1000) >= selectedTimestamp);

                                                                    if (tokenMintByWallet.length > 0) {

                                                                        const mempoolCall = await axios.get("https://mempool.space/api/tx/" + tokenBuyByWallet[0].txId)

                                                                        mintSpent += ((tokenBuyByWallet[0].listedPrice) / (10 ** 8))
                                                                        mintGasSpent += mempoolCall.data.fee / (10 ** 8)
                                                                        mintCount += 1

                                                                    } else {

                                                                        //Transfert & Airdrop
                                                                        buyMarketplaceSpent += 0
                                                                        buyMarketplaceGasSpent += 0
                                                                        transferCount += 1

                                                                    }
                                                                }

                                                            }





                                                        }


                                                        for (const walletAddress of btcWalletTable) {


                                                            //Call pour récupérer les token sold
                                                            const recentSalesLink = `https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=buying_broadcasted&ownerAddress=` + walletAddress + "&collectionSymbol=" + selectedCollection
                                                            const recentSalesCall = await axios.get(recentSalesLink, { headers });
                                                            const recentSales = await recentSalesCall.data.activities;

                                                            const filteredTable = recentSales.filter(activity => activity.oldOwner.toLowerCase() == walletAddress.toLowerCase() && activity.newOwner.toLowerCase() !== walletAddress.toLowerCase() && ((Date.parse(activity.createdAt)) / 1000) >= selectedTimestamp);




                                                            //On calcul le prix et méthode d'achat des token sold
                                                            for (const token of filteredTable) {


                                                                //Calculer le prix de vente + les gas.
                                                                const mempoolCall = await axios.get("https://mempool.space/api/tx/" + token.txId)

                                                                soldGasValue += mempoolCall.data.fee / (10 ** 8)
                                                                soldValue += token.listedPrice / (10 ** 8)
                                                                soldCount += 1


                                                                ////// SWITCH //////


                                                                //Calculer le prix d'achat.

                                                                //Buy classic
                                                                const tokenBuyLink = `https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=buying_broadcasted&tokenId=` + token.tokenId
                                                                const tokenBuyCall = await axios.get(tokenBuyLink, { headers });
                                                                const tokenBuy = await tokenBuyCall.data.activities;

                                                                const tokenBuyByWallet = tokenBuy.filter(activity => activity.oldOwner.toLowerCase() !== walletAddress.toLowerCase() && activity.newOwner.toLowerCase() == walletAddress.toLowerCase() && ((Date.parse(activity.createdAt)) / 1000) >= selectedTimestamp);


                                                                if (tokenBuyByWallet.length > 0) {

                                                                    const mempoolCall = await axios.get("https://mempool.space/api/tx/" + tokenBuyByWallet[0].txId)

                                                                    buyMarketplaceSpent += ((tokenBuyByWallet[0].listedPrice) / (10 ** 8))
                                                                    buyMarketplaceGasSpent += mempoolCall.data.fee / (10 ** 8)
                                                                    buyMarketplaceCount += 1

                                                                } else {


                                                                    //Create
                                                                    const tokenCreateLink = `https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=create&tokenId=` + token.tokenId
                                                                    const tokenCreateCall = await axios.get(tokenCreateLink, { headers });
                                                                    const tokenCreate = await tokenCreateCall.data.activities;

                                                                    const tokenCreateByWallet = tokenCreate.filter(activity => activity.newOwner.toLowerCase() == walletAddress.toLowerCase() && ((Date.parse(activity.createdAt)) / 1000) >= selectedTimestamp);

                                                                    if (tokenCreateByWallet.length > 0) {

                                                                        const mempoolCall = await axios.get("https://mempool.space/api/tx/" + tokenBuyByWallet[0].txId)

                                                                        mintSpent += ((tokenBuyByWallet[0].txValue) / (10 ** 8))
                                                                        mintGasSpent += mempoolCall.data.fee / (10 ** 8)
                                                                        mintCount += 1

                                                                    } else {

                                                                        //Mint
                                                                        const tokenMintLink = `https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=mint_broadcasted&tokenId=` + token.tokenId
                                                                        const tokenMintCall = await axios.get(tokenMintLink, { headers });
                                                                        const tokenMint = await tokenMintCall.data.activities;

                                                                        const tokenMintByWallet = tokenMint.filter(activity => activity.newOwner.toLowerCase() == walletAddress.toLowerCase() && ((Date.parse(activity.createdAt)) / 1000) >= selectedTimestamp);

                                                                        if (tokenMintByWallet.length > 0) {

                                                                            const mempoolCall = await axios.get("https://mempool.space/api/tx/" + tokenBuyByWallet[0].txId)

                                                                            mintSpent += ((tokenBuyByWallet[0].listedPrice) / (10 ** 8))
                                                                            mintGasSpent += mempoolCall.data.fee / (10 ** 8)
                                                                            mintCount += 1

                                                                        } else {

                                                                            //Transfert & Airdrop
                                                                            buyMarketplaceSpent += 0
                                                                            buyMarketplaceGasSpent += 0
                                                                            transferCount += 1

                                                                        }
                                                                    }

                                                                }


                                                            }
                                                        }



                                                        if (transferCount > 0) { transferCountFormated = "+" + transferCount }


                                                        totalMintSpent = mintSpent + mintGasSpent
                                                        buyMarketplaceTotalSpent = buyMarketplaceSpent - buyMarketplaceGasSpent
                                                        totalSoldValue = soldValue - soldGasValue

                                                        totalBuyCount = mintCount + buyMarketplaceCount
                                                        holdCount = tokenHeldId.length
                                                        totalHoldValue = floorPrice * holdCount
                                                        if (holdCount > 0) { averageHeldValue = floorPrice } else { averageHeldValue = 0 }

                                                        if (totalMintSpent > 0) { averageMintValue = totalMintSpent / mintCount }
                                                        if (buyMarketplaceTotalSpent > 0) { averageBuyValue = buyMarketplaceTotalSpent / buyMarketplaceCount }
                                                        if (totalBuyCount > 0) { averageSpentValue = (totalMintSpent + buyMarketplaceTotalSpent) / totalBuyCount }
                                                        if (soldCount > 0) { averageSoldValue = soldValue / soldCount }

                                                        realisedProfit = totalSoldValue - (totalMintSpent + buyMarketplaceTotalSpent)
                                                        potentialProfit = (totalSoldValue + totalHoldValue) - (totalMintSpent + buyMarketplaceTotalSpent)
                                                        roi = ((((totalHoldValue + totalSoldValue) - (totalMintSpent + buyMarketplaceTotalSpent)) / (totalMintSpent + buyMarketplaceTotalSpent)) * 100).toFixed(2)


                                                        // ROI format Variable
                                                        let roiPrefix = ""
                                                        let roiSuffix = ""

                                                        if (roi !== 0 && (totalMintSpent + buyMarketplaceTotalSpent) !== 0 && floorPrice) {

                                                            if (roi > 0) {
                                                                roiPrefix = "+";
                                                                roiSuffix = " :chart_with_upwards_trend:";
                                                            } else if (roi < 0) {
                                                                roiSuffix = " :chart_with_downwards_trend:";
                                                            }
                                                            roiFormatted = "`" + roiPrefix + parseFloat(roi).toFixed(2) + "%" + "`" + roiSuffix;


                                                        } else if (roi == 0) {

                                                            roiFormatted = "`0.00%`"

                                                        } else if (!floorPrice) {

                                                            roiFormatted = "'N/A'"

                                                        } else if ((totalMintSpent + buyMarketplaceTotalSpent) == 0) {

                                                            roiFormatted = "`INFINITY`<a:RCRich:1044762000837840926>"

                                                        }


                                                        let linksFormatted = ""
                                                        if (estLienHTTPS(discord) && estLienHTTPS(website)) { linksFormatted = "[magic eden](https://magiceden.io/ordinals/marketplace/" + selectedCollection + ") ∙ " + '[ordinals](https://ordinalswallet.com/collection/' + selectedCollection + ") ∙ " + "[twitter](" + twitter + ") ∙ " + "[discord](" + discord + ") ∙ " + '[website](' + website + ")" }
                                                        else if (estLienHTTPS(discord) && !estLienHTTPS(website)) { linksFormatted = "[magic eden](https://magiceden.io/ordinals/marketplace/" + selectedCollection + ") ∙ " + '[ordinals](https://ordinalswallet.com/collection/' + selectedCollection + ") ∙ " + "[twitter](" + twitter + ") ∙ " + "[discord](" + discord + ")" }
                                                        else if (!estLienHTTPS(discord) && estLienHTTPS(website)) { linksFormatted = "[magic eden](https://magiceden.io/ordinals/marketplace/" + selectedCollection + ") ∙ " + '[ordinals](https://ordinalswallet.com/collection/' + selectedCollection + ") ∙ " + "[twitter](" + twitter + ") ∙ " + '[website](' + website + ")" }
                                                        else { linksFormatted = "[magic eden](https://magiceden.io/ordinals/marketplace/" + selectedCollection + ") ∙ " + '[ordinals](https://ordinalswallet.com/collection/' + selectedCollection + ") ∙ " + "[twitter](" + twitter + ")" }




                                                        let selectedTimeFormatted = selectedTime
                                                        if (!selectedTime) { selectedTimeFormatted = "All Time" }


                                                        //Embed getRCprofitPrecisedAll
                                                        const embed1 = new EmbedBuilder().setColor("#060A8F")
                                                            .setTitle(`${name}`)
                                                            .setDescription(">>> `" + selectedTimeFormatted + "` profits made by all the wallets `[" + btcWalletTable.length + "]` of " + authorName + " on " + name)
                                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                                            .setThumbnail(collectionLogo)
                                                            .addFields(
                                                                { name: "Mint Spent", value: "`" + parseFloat(mintSpent).toFixed(3) + "₿ (" + parseFloat(mintSpent * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "Mint Gas Spent", value: "`" + parseFloat(mintGasSpent).toFixed(3) + "₿ (" + parseFloat(mintGasSpent * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "Total Mint Spent", value: "`" + parseFloat(totalMintSpent).toFixed(3) + "₿ (" + parseFloat(totalMintSpent * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "Buy Spent", value: "`" + parseFloat(buyMarketplaceSpent).toFixed(3) + "₿ (" + parseFloat(buyMarketplaceSpent * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "Buy Gas Spent", value: "`" + parseFloat(buyMarketplaceGasSpent).toFixed(3) + "₿ (" + parseFloat(buyMarketplaceGasSpent * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "Total Buy Spent", value: "`" + parseFloat(buyMarketplaceTotalSpent).toFixed(3) + "₿ (" + parseFloat(buyMarketplaceTotalSpent * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "Sold Value", value: "`" + parseFloat(soldValue).toFixed(3) + "₿ (" + parseFloat(soldValue * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "Sold Gas Value", value: "`" + parseFloat(soldGasValue).toFixed(3) + "₿ (" + parseFloat(soldGasValue * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "Total Sold Value", value: "`" + parseFloat(totalSoldValue).toFixed(3) + "₿ (" + parseFloat(totalSoldValue * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "NFT Mint Count", value: "`" + mintCount + "`", inline: true },
                                                                { name: "NFT Buy Count", value: "`" + buyMarketplaceCount + "`", inline: true },
                                                                { name: "NFT Total Count", value: "`" + totalBuyCount + "`", inline: true },
                                                                { name: "NFT Held Count", value: "`" + holdCount + "`", inline: true },
                                                                { name: "NFT Sold Count", value: "`" + soldCount + "`", inline: true },
                                                                { name: "NFT Transfer Count", value: "`" + transferCountFormated + "`", inline: true },
                                                                { name: "AVG Mint Value ", value: "`" + parseFloat(averageMintValue).toFixed(3) + "₿ (" + parseFloat(averageMintValue * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "AVG Buy Value ", value: "`" + parseFloat(averageBuyValue).toFixed(3) + "₿ (" + parseFloat(averageBuyValue * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "AVG Spent Value ", value: "`" + parseFloat(averageSpentValue).toFixed(3) + "₿ (" + parseFloat(averageSpentValue * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "AVG Sold Value", value: "`" + parseFloat(averageSoldValue).toFixed(3) + "₿ (" + parseFloat(averageSoldValue * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "AVG Held Value", value: "`" + parseFloat(averageHeldValue).toFixed(3) + "₿ (" + parseFloat(averageHeldValue * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "Total Held Value", value: "`" + parseFloat(totalHoldValue).toFixed(3) + "₿ (" + parseFloat(totalHoldValue * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "Realised Profit", value: "`" + parseFloat(realisedProfit).toFixed(3) + "₿ (" + parseFloat(realisedProfit * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "Potential Profit", value: "`" + parseFloat(potentialProfit).toFixed(3) + "₿ (" + parseFloat(potentialProfit * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                { name: "Potential ROI", value: roiFormatted, inline: true },
                                                                { name: " ", value: "*Please note that Aura isn't analyzing Blur V3 contract sales for the moment. We're working on it to make it available ASAP.*", inline: false },
                                                                //{ name: "Links", value: linksFormatted, inline: false },

                                                            )
                                                            .setTimestamp()
                                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                                        await interaction.editReply({ embeds: [embed1], components: [buttonsRow] });





                                                        await interactionData.destroy({ where: { authorId: authorId, commandName: "profit", serverId: serverId } })

                                                        await interactionData.create({

                                                            authorId: authorId,
                                                            authorName: authorName,
                                                            serverId: serverId,
                                                            walletAddress: "N/A",
                                                            commandName: "profit",
                                                            interactionId: interaction.id,
                                                            walletName: "N/A",
                                                            selecedTimestamp: "N/A",
                                                            embed1: "N/A",
                                                            embed2: "N/A",
                                                            embed3: "N/A",
                                                            pageIndex: "N/A",
                                                            actualPage: "N/A",
                                                            walletCategory: "btc",
                                                            selectedCollection: selectedCollection,
                                                            collectionSlug: "N/A",
                                                            collectionBanner: "N/A",
                                                            avgDeriskPrice: "N/A",
                                                            floorPrice: floorPrice.toString(),
                                                            lowerMarketlace: "N/A",
                                                            collectionName: name,
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

                                                    } else {

                                                        const setwalletErrorEmbed = new EmbedBuilder().setColor("#060A8F")
                                                            .setTitle(`No wallet`)
                                                            .setDescription("Aura can't analyze your wallet's data on this collection because you don't have any Ethereum wallet registered in your portfolio. Please use `/wallet set` or `/wallet raw` to register a wallet in your portfolio then try again.")
                                                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                                            .setTimestamp()
                                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                                        await interaction.editReply({ embeds: [setwalletErrorEmbed] });



                                                    }




                                                } else {



                                                    const notMember = new EmbedBuilder().setColor("#060A8F")
                                                        .setTitle("Profit")
                                                        .setDescription("The collection you selected isn't valid. Please try again selecting a valid Bitcoin or Ethereum collection. You can also find the desired collection by using the contract address (Ethereum) or Magic Eden ID (Bitcoin).")
                                                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                                        .setTimestamp()
                                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                                    await interaction.editReply({ embeds: [notMember] });




                                                }
                                            }

                                        } else {

                                            const setwalletErrorEmbed = new EmbedBuilder().setColor("#060A8F")
                                                .setTitle(`No wallet`)
                                                .setDescription("Aura can't analyze your wallet's data because you don't have any wallet registered in your portfolio. Please use `/wallet set` or `/wallet raw` to register a wallet in your portfolio then try again.")
                                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                .setTimestamp()
                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                            await interaction.editReply({ embeds: [setwalletErrorEmbed] });
                                        }

                                        //Si wallet est un wallet précis
                                    } else if (walletAddress.toLowerCase() !== "all") {

                                        //On définit la plage de wallet
                                        let precisedWalletofAuthorTable = []
                                        let precisedWalletNameofAuthor = ""

                                        const WalletofAuthor = await wallets.findOne({ where: { authorId: authorId, walletAddress: walletAddress } });
                                        if (WalletofAuthor !== null) {
                                            precisedWalletofAuthorTable.push(WalletofAuthor.dataValues.walletAddress)
                                            precisedWalletNameofAuthor = WalletofAuthor.dataValues.walletName
                                        } else { precisedWalletNameofAuthor = walletAddress.substring(0, 5) + "..." + walletAddress.substring(walletAddress.length - 4, walletAddress.length) }


                                        //Ajustement du Timestamp
                                        if (selectedTime === "1 Day") { selectedTimestamp = actualTimestamp - 86400 }
                                        if (selectedTime === "3 Days") { selectedTimestamp = actualTimestamp - 259200 }
                                        if (selectedTime === "7 Days") { selectedTimestamp = actualTimestamp - 604800 }
                                        if (selectedTime === "14 Days") { selectedTimestamp = actualTimestamp - 1209600 }
                                        if (selectedTime === "30 Days") { selectedTimestamp = actualTimestamp - 2592000 }
                                        if (selectedTime === "90 Days") { selectedTimestamp = actualTimestamp - 7776000 }
                                        if (selectedTime === "1 Year") { selectedTimestamp = actualTimestamp - 31536000 }
                                        if (selectedTime === "All Time" || !selectedTime) { selectedTimestamp = 0 }




                                        // SI collection = ALL, wallet précis et pas wallet category
                                        if (selectedCollection.toLowerCase() === "all") {



                                            ////////////////// A BUILD (ALL COLLECTION) \\\\\\\\\\\\\\\\\\\\



                                            ////////////////// A BUILD (ALL COLLECTION) \\\\\\\\\\\\\\\\\\\\

                                            const availableInTheNearFuture = new EmbedBuilder().setColor("#060A8F")
                                                .setTitle(`${authorName}'s profit`)
                                                .setDescription("The option you try to use is currently being built and will be available in the near future. You can still use all the commands not including `all collections` in the meantime.")
                                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                .setTimestamp()
                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                            await interaction.editReply({ embeds: [availableInTheNearFuture] });


                                            ////////////////// A BUILD (ALL COLLECTION) \\\\\\\\\\\\\\\\\\\\



                                            ////////////////// A BUILD (ALL COLLECTION) \\\\\\\\\\\\\\\\\\\\





                                            // SI collection précise, wallet précis et pas wallet category
                                        } else if (selectedCollection.toLowerCase() !== "all") {


                                            if (isValidEthereumAddress(selectedCollection)) {




                                                if (isValidEthereumAddress(walletAddress)) {





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



                                                            // Récuperer les ID des tokens hold 
                                                            for await (const walletAddress of precisedWalletofAuthorTable) {
                                                                const { data: userTokens } = await sdk.getUsersUserTokensV6({ collection: selectedCollection, limit: '200', user: walletAddress, accept: '*/*' });


                                                                for (let i = 0; i < userTokens.tokens.length; i++) { tokenHoldTable.push(userTokens.tokens[i].token.tokenId); }

                                                                if (userTokens.tokens.length > 0) { walletsInvolvedTable.push(walletAddress) }


                                                                //On incrément le compteur de call API
                                                                apiObj.getUsersUserTokensV6++
                                                            }




                                                            // Récuperer les ID des tokens sell 
                                                            for await (const walletAddress of precisedWalletofAuthorTable) {
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

                                                            console.log(tokenHoldTable)
                                                            console.log(tokenSoldTable)



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


                                                                const filteredSales = userPriceToken.sales.filter(sale => precisedWalletofAuthorTable.includes(sale.to));

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


                                                                const filteredSales = userPriceToken.sales.filter(sale => precisedWalletofAuthorTable.includes(sale.to));

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


                                                                const filteredSales = userPriceToken.sales.filter(sale => precisedWalletofAuthorTable.includes(sale.from));

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

                                                            if (totalSpent > 0) {
                                                                if (buyMarketplaceTotalSpent > 0) {
                                                                    averageBuyValue = buyMarketplaceTotalSpent / buyMarketplaceCount

                                                                }
                                                                averageSpentValue = totalSpent / totalTokenTradedCount

                                                                if (mintCount > 0) {
                                                                    averageMintValue = totalMintSpent / mintCount
                                                                }
                                                            }

                                                            if (totalSoldValue > 0) {
                                                                averageSoldValue = totalSoldValue / soldCount
                                                            }

                                                            if (holdCount > 0) {
                                                                totalHoldValue = holdCount * collectionFp
                                                                averageHoldValue = totalHoldValue / holdCount

                                                            }


                                                            potentialProfit = (soldValue + totalHoldValue) - totalSpent // Ajouter royalties ?
                                                            realisedProfit = soldValue - totalSpent


                                                            //ROI Variable
                                                            if (!(data.collections[0].floorAsk.price) && secondcollectionFp.openSea.floorPrice === 0) {
                                                                roi = "N/A"
                                                            } else {
                                                                roi = ((((totalHoldValue + soldValue) - totalSpent) / totalSpent) * 100).toFixed(2)
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







                                                            let selectedTimeFormatted = selectedTime
                                                            if (!selectedTime) { selectedTimeFormatted = "All Time" }

                                                            //Embed getRCprofitPrecisedAll
                                                            const getprofitOneWalletOneCollection = new EmbedBuilder().setColor("#060A8F")
                                                                .setTitle(`${collectionName}`)
                                                                .setDescription(">>> `" + selectedTimeFormatted + "` profits made by the `" + precisedWalletNameofAuthor + "` wallet of " + authorName + " on " + collectionName)
                                                                .setAuthor({ name: authorName, iconURL: userAvatar })
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
                                                                    { name: "AVG Mint Value ", value: "`" + parseFloat(averageMintValue).toFixed(3) + "Ξ (" + parseFloat(averageMintValue * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                    { name: "AVG Buy Value ", value: "`" + parseFloat(averageBuyValue).toFixed(3) + "Ξ (" + parseFloat(averageBuyValue * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                    { name: "AVG Spent Value ", value: "`" + parseFloat(averageSpentValue).toFixed(3) + "Ξ (" + parseFloat(averageSpentValue * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                    { name: "AVG Sold Value", value: "`" + parseFloat(averageSoldValue).toFixed(3) + "Ξ (" + parseFloat(averageSoldValue * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                    { name: "AVG Hold Value", value: "`" + parseFloat(averageHoldValue).toFixed(3) + "Ξ (" + parseFloat(averageHoldValue * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                    { name: "Total Hold Value", value: "`" + parseFloat(totalHoldValue).toFixed(3) + "Ξ (" + parseFloat(totalHoldValue * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                    { name: "Realised Profit", value: "`" + parseFloat(realisedProfit).toFixed(3) + "Ξ (" + parseFloat(realisedProfit * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                    { name: "Potential Profit", value: "`" + parseFloat(potentialProfit).toFixed(3) + "Ξ (" + parseFloat(potentialProfit * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                                    { name: "Potential ROI", value: roiFormatted, inline: true },
                                                                    { name: " ", value: "*Please note that Aura isn't analyzing Blur V3 contract sales for the moment. We're working on it to make it available ASAP.*", inline: false },

                                                                )
                                                                .setTimestamp()
                                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                                            await interaction.editReply({ embeds: [getprofitOneWalletOneCollection], components: [buttonsRow] });





                                                            //////CALL BASE SQL


                                                            await interactionData.destroy({ where: { authorId: authorId, commandName: "profit", serverId: serverId } })

                                                            await interactionData.create({

                                                                authorId: authorId,
                                                                authorName: authorName,
                                                                serverId: serverId,
                                                                walletAddress: "N/A",
                                                                commandName: "profit",
                                                                interactionId: interaction.id,
                                                                walletName: "N/A",
                                                                selecedTimestamp: "N/A",
                                                                embed1: "N/A",
                                                                embed2: "N/A",
                                                                embed3: "N/A",
                                                                pageIndex: "N/A",
                                                                actualPage: "N/A",
                                                                walletCategory: "eth",
                                                                selectedCollection: selectedCollection,
                                                                collectionSlug: "N/A",
                                                                collectionBanner: "N/A",
                                                                avgDeriskPrice: "N/A",
                                                                floorPrice: collectionFp.toString(),
                                                                lowerMarketlace: "N/A",
                                                                collectionName: collectionName,
                                                                collectionTwitter: "N/A",
                                                                collectionWebsite: "N/A",
                                                                mintCount: mintCount.toString(),
                                                                buyCount: totalBuyCount.toString(),
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

                                                            //////CALL BASE SQL



                                                            //On enregistre le call API dans la database
                                                            const timeStamp = Date.now();
                                                            await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/profit", apiCallName: "ethUsdPrice", apiProvider: "etherscan", timestamp: timeStamp.toString() })
                                                            for (let i = 0; i < apiObj.getCollectionsV5; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/profit", apiCallName: "getCollectionsV5", apiProvider: "reservoir", timestamp: timeStamp.toString() }) }
                                                            for (let i = 0; i < apiObj.getFloorPrice; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/profit", apiCallName: "getFloorPrice", apiProvider: "alchemy", timestamp: timeStamp.toString() }) }
                                                            for (let i = 0; i < apiObj.getUsersUserTokensV6; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/profit", apiCallName: "getUsersUserTokensV6", apiProvider: "reservoir", timestamp: timeStamp.toString() }) }
                                                            for (let i = 0; i < apiObj.getNFTSales; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/profit", apiCallName: "getNFTSales", apiProvider: "alchemy2", timestamp: timeStamp.toString() }) }
                                                            for (let i = 0; i < apiObj.getSalesV4; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/profit", apiCallName: "getSalesV4", apiProvider: "reservoir", timestamp: timeStamp.toString() }) }
                                                            for (let i = 0; i < apiObj.getTransaction; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/profit", apiCallName: "getTransaction", apiProvider: "web3.eth", timestamp: timeStamp.toString() }) }
                                                            for (let i = 0; i < apiObj.getTransactionReceipt; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/profit", apiCallName: "getTransactionReceipt", apiProvider: "web3.eth", timestamp: timeStamp.toString() }) }
                                                            for (let i = 0; i < apiObj.getAllTransfers; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/profit", apiCallName: "getAllTransfers", apiProvider: "blockspan", timestamp: timeStamp.toString() }) }






                                                        })

                                                } else {

                                                    const notMember = new EmbedBuilder().setColor("#060A8F")
                                                        .setTitle("Derisk")
                                                        .setDescription("Aura can't analyze your wallet metrics because you selected a Ethereum collection and a Bitcoin wallet. Please try again selecting both a Bitcoin or Ethereum collection and wallet.")
                                                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                                        .setTimestamp()
                                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                                    await interaction.editReply({ embeds: [notMember] });


                                                }


                                            } else if (isValidInput(selectedCollection)) {


                                                if (isBRC20BitcoinWallet(walletAddress)) {



                                                    let name = ""
                                                    let collectionLogo = ""
                                                    let twitter = ""
                                                    let discord = ""
                                                    let website = ""

                                                    let mintSpent = 0
                                                    let mintGasSpent = 0
                                                    let totalMintSpent = 0
                                                    let buyMarketplaceSpent = 0
                                                    let buyMarketplaceGasSpent = 0
                                                    let buyMarketplaceTotalSpent = 0
                                                    let soldValue = 0
                                                    let soldGasValue = 0
                                                    let totalSoldValue = 0
                                                    let mintCount = 0
                                                    let buyMarketplaceCount = 0
                                                    let totalBuyCount = 0
                                                    let holdCount = 0
                                                    let soldCount = 0
                                                    let transferCount = 0
                                                    let transferCountFormated = 0
                                                    let averageMintValue = 0
                                                    let averageBuyValue = 0
                                                    let averageSpentValue = 0
                                                    let averageSoldValue = 0
                                                    let averageHeldValue = 0
                                                    let totalHoldValue = 0
                                                    let realisedProfit = 0
                                                    let potentialProfit = 0
                                                    let roiFormatted = 0


                                                    const btcCallPrice = await axios.get("https://blockchain.info/q/24hrprice")
                                                    const BTCUsdPrice = btcCallPrice.data




                                                    const url = `https://api-mainnet.magiceden.dev/v2/ord/btc/collections/` + selectedCollection;
                                                    const response = await axios.get(url, { headers });
                                                    const data = await response.data;

                                                    collectionLogo = data.imageURI
                                                    name = data.name
                                                    twitter = data.twitterLink
                                                    discord = data.discordLink
                                                    website = data.websiteLink


                                                    const url2 = `https://api-mainnet.magiceden.dev/v2/ord/btc/stat?collectionSymbol=` + selectedCollection;
                                                    const response2 = await axios.get(url2, { headers });
                                                    const data2 = await response2.data;


                                                    const floorPrice = (data2.floorPrice) / (10 ** 8)


                                                    const url3 = `https://api-mainnet.magiceden.dev/v2/ord/btc/tokens?collectionSymbol=` + selectedCollection + `&ownerAddress=` + walletAddress + `&showAll=true&sortBy=priceAsc`;
                                                    const response3 = await axios.get(url3, { headers });
                                                    const data3 = await response3.data;


                                                    totalHoldValue = floorPrice * holdCount
                                                    averageHeldValue = totalHoldValue / holdCount

                                                    let tokenHeldId = []
                                                    for (const token of data3.tokens) {
                                                        tokenHeldId.push(token.id)
                                                    }


                                                    //On calcul le prix et méthode d'achat des token held
                                                    for (const token of tokenHeldId) {

                                                        //Buy classic
                                                        const tokenBuyLink = `https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=buying_broadcasted&tokenId=` + token
                                                        const tokenBuyCall = await axios.get(tokenBuyLink, { headers });
                                                        const tokenBuy = await tokenBuyCall.data.activities;

                                                        const tokenBuyByWallet = tokenBuy.filter(activity => activity.oldOwner.toLowerCase() !== walletAddress.toLowerCase() && activity.newOwner.toLowerCase() == walletAddress.toLowerCase() && ((Date.parse(activity.createdAt)) / 1000) >= selectedTimestamp);


                                                        if (tokenBuyByWallet.length > 0) {

                                                            const mempoolCall = await axios.get("https://mempool.space/api/tx/" + tokenBuyByWallet[0].txId)

                                                            buyMarketplaceSpent += ((tokenBuyByWallet[0].listedPrice) / (10 ** 8))
                                                            buyMarketplaceGasSpent += mempoolCall.data.fee / (10 ** 8)
                                                            buyMarketplaceCount += 1

                                                        } else {


                                                            //Create
                                                            const tokenCreateLink = `https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=create&tokenId=` + token.tokenInscription
                                                            const tokenCreateCall = await axios.get(tokenCreateLink, { headers });
                                                            const tokenCreate = await tokenCreateCall.data.activities;

                                                            const tokenCreateByWallet = tokenCreate.filter(activity => activity.newOwner.toLowerCase() == walletAddress.toLowerCase() && ((Date.parse(activity.createdAt)) / 1000) >= selectedTimestamp);

                                                            if (tokenCreateByWallet.length > 0) {

                                                                const mempoolCall = await axios.get("https://mempool.space/api/tx/" + tokenBuyByWallet[0].txId)

                                                                mintSpent += ((tokenBuyByWallet[0].txValue) / (10 ** 8))
                                                                mintGasSpent += mempoolCall.data.fee / (10 ** 8)
                                                                mintCount += 1

                                                            } else {

                                                                //Mint
                                                                const tokenMintLink = `https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=mint_broadcasted&tokenId=` + token.tokenInscription
                                                                const tokenMintCall = await axios.get(tokenMintLink, { headers });
                                                                const tokenMint = await tokenMintCall.data.activities;

                                                                const tokenMintByWallet = tokenMint.filter(activity => activity.newOwner.toLowerCase() == walletAddress.toLowerCase() && ((Date.parse(activity.createdAt)) / 1000) >= selectedTimestamp);

                                                                if (tokenMintByWallet.length > 0) {

                                                                    const mempoolCall = await axios.get("https://mempool.space/api/tx/" + tokenBuyByWallet[0].txId)

                                                                    mintSpent += ((tokenBuyByWallet[0].listedPrice) / (10 ** 8))
                                                                    mintGasSpent += mempoolCall.data.fee / (10 ** 8)
                                                                    mintCount += 1

                                                                } else {

                                                                    //Transfert & Airdrop
                                                                    buyMarketplaceSpent += 0
                                                                    buyMarketplaceGasSpent += 0
                                                                    transferCount += 1

                                                                }
                                                            }

                                                        }





                                                    }



                                                    //Call pour récupérer les token sold
                                                    const recentSalesLink = `https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=buying_broadcasted&ownerAddress=` + walletAddress + "&collectionSymbol=" + selectedCollection
                                                    const recentSalesCall = await axios.get(recentSalesLink, { headers });
                                                    const recentSales = await recentSalesCall.data.activities;

                                                    const filteredTable = recentSales.filter(activity => activity.oldOwner.toLowerCase() == walletAddress.toLowerCase() && activity.newOwner.toLowerCase() !== walletAddress.toLowerCase() && ((Date.parse(activity.createdAt)) / 1000) >= selectedTimestamp);




                                                    //On calcul le prix et méthode d'achat des token sold
                                                    for (const token of filteredTable) {


                                                        //Calculer le prix de vente + les gas.
                                                        const mempoolCall = await axios.get("https://mempool.space/api/tx/" + token.txId)

                                                        soldGasValue += mempoolCall.data.fee / (10 ** 8)
                                                        soldValue += token.listedPrice / (10 ** 8)
                                                        soldCount += 1


                                                        ////// SWITCH //////


                                                        //Calculer le prix d'achat.

                                                        //Buy classic
                                                        const tokenBuyLink = `https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=buying_broadcasted&tokenId=` + token.tokenId
                                                        const tokenBuyCall = await axios.get(tokenBuyLink, { headers });
                                                        const tokenBuy = await tokenBuyCall.data.activities;

                                                        const tokenBuyByWallet = tokenBuy.filter(activity => activity.oldOwner.toLowerCase() !== walletAddress.toLowerCase() && activity.newOwner.toLowerCase() == walletAddress.toLowerCase() && ((Date.parse(activity.createdAt)) / 1000) >= selectedTimestamp);


                                                        if (tokenBuyByWallet.length > 0) {

                                                            const mempoolCall = await axios.get("https://mempool.space/api/tx/" + tokenBuyByWallet[0].txId)

                                                            buyMarketplaceSpent += ((tokenBuyByWallet[0].listedPrice) / (10 ** 8))
                                                            buyMarketplaceGasSpent += mempoolCall.data.fee / (10 ** 8)
                                                            buyMarketplaceCount += 1

                                                        } else {


                                                            //Create
                                                            const tokenCreateLink = `https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=create&tokenId=` + token.tokenId
                                                            const tokenCreateCall = await axios.get(tokenCreateLink, { headers });
                                                            const tokenCreate = await tokenCreateCall.data.activities;

                                                            const tokenCreateByWallet = tokenCreate.filter(activity => activity.newOwner.toLowerCase() == walletAddress.toLowerCase() && ((Date.parse(activity.createdAt)) / 1000) >= selectedTimestamp);

                                                            if (tokenCreateByWallet.length > 0) {

                                                                const mempoolCall = await axios.get("https://mempool.space/api/tx/" + tokenBuyByWallet[0].txId)

                                                                mintSpent += ((tokenBuyByWallet[0].txValue) / (10 ** 8))
                                                                mintGasSpent += mempoolCall.data.fee / (10 ** 8)
                                                                mintCount += 1

                                                            } else {

                                                                //Mint
                                                                const tokenMintLink = `https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=mint_broadcasted&tokenId=` + token.tokenId
                                                                const tokenMintCall = await axios.get(tokenMintLink, { headers });
                                                                const tokenMint = await tokenMintCall.data.activities;

                                                                const tokenMintByWallet = tokenMint.filter(activity => activity.newOwner.toLowerCase() == walletAddress.toLowerCase() && ((Date.parse(activity.createdAt)) / 1000) >= selectedTimestamp);

                                                                if (tokenMintByWallet.length > 0) {

                                                                    const mempoolCall = await axios.get("https://mempool.space/api/tx/" + tokenBuyByWallet[0].txId)

                                                                    mintSpent += ((tokenBuyByWallet[0].listedPrice) / (10 ** 8))
                                                                    mintGasSpent += mempoolCall.data.fee / (10 ** 8)
                                                                    mintCount += 1

                                                                } else {

                                                                    //Transfert & Airdrop
                                                                    buyMarketplaceSpent += 0
                                                                    buyMarketplaceGasSpent += 0
                                                                    transferCount += 1

                                                                }
                                                            }

                                                        }


                                                    }


                                                    if (transferCount > 0) { transferCountFormated = "+" + transferCount }


                                                    totalMintSpent = mintSpent + mintGasSpent
                                                    buyMarketplaceTotalSpent = buyMarketplaceSpent - buyMarketplaceGasSpent
                                                    totalSoldValue = soldValue - soldGasValue

                                                    totalBuyCount = mintCount + buyMarketplaceCount
                                                    holdCount = tokenHeldId.length
                                                    totalHoldValue = floorPrice * holdCount
                                                    if (holdCount > 0) { averageHeldValue = floorPrice } else { averageHeldValue = 0 }

                                                    if (totalMintSpent > 0) { averageMintValue = totalMintSpent / mintCount }
                                                    if (buyMarketplaceTotalSpent > 0) { averageBuyValue = buyMarketplaceTotalSpent / buyMarketplaceCount }
                                                    if (totalBuyCount > 0) { averageSpentValue = (totalMintSpent + buyMarketplaceTotalSpent) / totalBuyCount }
                                                    if (soldCount > 0) { averageSoldValue = soldValue / soldCount }

                                                    realisedProfit = totalSoldValue - (totalMintSpent + buyMarketplaceTotalSpent)
                                                    potentialProfit = (totalSoldValue + totalHoldValue) - (totalMintSpent + buyMarketplaceTotalSpent)
                                                    roi = ((((totalHoldValue + totalSoldValue) - (totalMintSpent + buyMarketplaceTotalSpent)) / (totalMintSpent + buyMarketplaceTotalSpent)) * 100).toFixed(2)


                                                    // ROI format Variable
                                                    let roiPrefix = ""
                                                    let roiSuffix = ""

                                                    if (roi !== 0 && (totalMintSpent + buyMarketplaceTotalSpent) !== 0 && floorPrice) {

                                                        if (roi > 0) {
                                                            roiPrefix = "+";
                                                            roiSuffix = " :chart_with_upwards_trend:";
                                                        } else if (roi < 0) {
                                                            roiSuffix = " :chart_with_downwards_trend:";
                                                        }
                                                        roiFormatted = "`" + roiPrefix + parseFloat(roi).toFixed(2) + "%" + "`" + roiSuffix;


                                                    } else if (roi == 0) {

                                                        roiFormatted = "`0.00%`"

                                                    } else if (!floorPrice) {

                                                        roiFormatted = "'N/A'"

                                                    } else if ((totalMintSpent + buyMarketplaceTotalSpent) == 0) {

                                                        roiFormatted = "`INFINITY`<a:RCRich:1044762000837840926>"

                                                    }


                                                    let linksFormatted = ""
                                                    if (estLienHTTPS(discord) && estLienHTTPS(website)) { linksFormatted = "[magic eden](https://magiceden.io/ordinals/marketplace/" + selectedCollection + ") ∙ " + '[ordinals](https://ordinalswallet.com/collection/' + selectedCollection + ") ∙ " + "[twitter](" + twitter + ") ∙ " + "[discord](" + discord + ") ∙ " + '[website](' + website + ")" }
                                                    else if (estLienHTTPS(discord) && !estLienHTTPS(website)) { linksFormatted = "[magic eden](https://magiceden.io/ordinals/marketplace/" + selectedCollection + ") ∙ " + '[ordinals](https://ordinalswallet.com/collection/' + selectedCollection + ") ∙ " + "[twitter](" + twitter + ") ∙ " + "[discord](" + discord + ")" }
                                                    else if (!estLienHTTPS(discord) && estLienHTTPS(website)) { linksFormatted = "[magic eden](https://magiceden.io/ordinals/marketplace/" + selectedCollection + ") ∙ " + '[ordinals](https://ordinalswallet.com/collection/' + selectedCollection + ") ∙ " + "[twitter](" + twitter + ") ∙ " + '[website](' + website + ")" }
                                                    else { linksFormatted = "[magic eden](https://magiceden.io/ordinals/marketplace/" + selectedCollection + ") ∙ " + '[ordinals](https://ordinalswallet.com/collection/' + selectedCollection + ") ∙ " + "[twitter](" + twitter + ")" }




                                                    let selectedTimeFormatted = selectedTime
                                                    if (!selectedTime) { selectedTimeFormatted = "All Time" }


                                                    //Embed getRCprofitPrecisedAll
                                                    const embed1 = new EmbedBuilder().setColor("#060A8F")
                                                        .setTitle(`${name}`)
                                                        .setDescription(">>> `" + selectedTimeFormatted + "` profits made by the `" + precisedWalletNameofAuthor + "` wallet of " + authorName + " on " + name)
                                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                                        .setThumbnail(collectionLogo)
                                                        .addFields(
                                                            { name: "Mint Spent", value: "`" + parseFloat(mintSpent).toFixed(3) + "₿ (" + parseFloat(mintSpent * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                                            { name: "Mint Gas Spent", value: "`" + parseFloat(mintGasSpent).toFixed(3) + "₿ (" + parseFloat(mintGasSpent * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                                            { name: "Total Mint Spent", value: "`" + parseFloat(totalMintSpent).toFixed(3) + "₿ (" + parseFloat(totalMintSpent * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                                            { name: "Buy Spent", value: "`" + parseFloat(buyMarketplaceSpent).toFixed(3) + "₿ (" + parseFloat(buyMarketplaceSpent * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                                            { name: "Buy Gas Spent", value: "`" + parseFloat(buyMarketplaceGasSpent).toFixed(3) + "₿ (" + parseFloat(buyMarketplaceGasSpent * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                                            { name: "Total Buy Spent", value: "`" + parseFloat(buyMarketplaceTotalSpent).toFixed(3) + "₿ (" + parseFloat(buyMarketplaceTotalSpent * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                                            { name: "Sold Value", value: "`" + parseFloat(soldValue).toFixed(3) + "₿ (" + parseFloat(soldValue * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                                            { name: "Sold Gas Value", value: "`" + parseFloat(soldGasValue).toFixed(3) + "₿ (" + parseFloat(soldGasValue * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                                            { name: "Total Sold Value", value: "`" + parseFloat(totalSoldValue).toFixed(3) + "₿ (" + parseFloat(totalSoldValue * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                                            { name: "NFT Mint Count", value: "`" + mintCount + "`", inline: true },
                                                            { name: "NFT Buy Count", value: "`" + buyMarketplaceCount + "`", inline: true },
                                                            { name: "NFT Total Count", value: "`" + totalBuyCount + "`", inline: true },
                                                            { name: "NFT Held Count", value: "`" + holdCount + "`", inline: true },
                                                            { name: "NFT Sold Count", value: "`" + soldCount + "`", inline: true },
                                                            { name: "NFT Transfer Count", value: "`" + transferCountFormated + "`", inline: true },
                                                            { name: "AVG Mint Value ", value: "`" + parseFloat(averageMintValue).toFixed(3) + "₿ (" + parseFloat(averageMintValue * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                                            { name: "AVG Buy Value ", value: "`" + parseFloat(averageBuyValue).toFixed(3) + "₿ (" + parseFloat(averageBuyValue * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                                            { name: "AVG Spent Value ", value: "`" + parseFloat(averageSpentValue).toFixed(3) + "₿ (" + parseFloat(averageSpentValue * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                                            { name: "AVG Sold Value", value: "`" + parseFloat(averageSoldValue).toFixed(3) + "₿ (" + parseFloat(averageSoldValue * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                                            { name: "AVG Held Value", value: "`" + parseFloat(averageHeldValue).toFixed(3) + "₿ (" + parseFloat(averageHeldValue * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                                            { name: "Total Held Value", value: "`" + parseFloat(totalHoldValue).toFixed(3) + "₿ (" + parseFloat(totalHoldValue * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                                            { name: "Realised Profit", value: "`" + parseFloat(realisedProfit).toFixed(3) + "₿ (" + parseFloat(realisedProfit * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                                            { name: "Potential Profit", value: "`" + parseFloat(potentialProfit).toFixed(3) + "₿ (" + parseFloat(potentialProfit * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                                            { name: "Potential ROI", value: roiFormatted, inline: true },
                                                            { name: " ", value: "*Please note that Aura isn't analyzing Blur V3 contract sales for the moment. We're working on it to make it available ASAP.*", inline: false },
                                                            //{ name: "Links", value: linksFormatted, inline: false },

                                                        )
                                                        .setTimestamp()
                                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                                    await interaction.editReply({ embeds: [embed1], components: [buttonsRow] });



                                                    await interactionData.destroy({ where: { authorId: authorId, commandName: "profit", serverId: serverId } })

                                                    await interactionData.create({

                                                        authorId: authorId,
                                                        authorName: authorName,
                                                        serverId: serverId,
                                                        walletAddress: "N/A",
                                                        commandName: "profit",
                                                        interactionId: interaction.id,
                                                        walletName: "N/A",
                                                        selecedTimestamp: "N/A",
                                                        embed1: "N/A",
                                                        embed2: "N/A",
                                                        embed3: "N/A",
                                                        pageIndex: "N/A",
                                                        actualPage: "N/A",
                                                        walletCategory: "btc",
                                                        selectedCollection: selectedCollection,
                                                        collectionSlug: "N/A",
                                                        collectionBanner: "N/A",
                                                        avgDeriskPrice: "N/A",
                                                        floorPrice: floorPrice.toString(),
                                                        lowerMarketlace: "N/A",
                                                        collectionName: name,
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



                                                } else {

                                                    const notMember = new EmbedBuilder().setColor("#060A8F")
                                                        .setTitle("Derisk")
                                                        .setDescription("Aura can't analyze your wallet metrics because you selected a Ethereum collection and a Bitcoin wallet. Please try again selecting both a Bitcoin or Ethereum collection and wallet.")
                                                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                                        .setTimestamp()
                                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                                    await interaction.editReply({ embeds: [notMember] });


                                                }






                                            } else {


                                                const notMember = new EmbedBuilder().setColor("#060A8F")
                                                    .setTitle("Profit")
                                                    .setDescription("The collection you selected isn't valid. Please try again selecting a valid Bitcoin or Ethereum collection. You can also find the desired collection by using the contract address (Ethereum) or Magic Eden ID (Bitcoin).")
                                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                                    .setTimestamp()
                                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                                await interaction.editReply({ embeds: [notMember] });




                                            }
                                        }
                                    }

                                

                                //Condition qui vérifie si c'est Wallet ou Category qui a été séléctionné, dans ce cas Category




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
                                    { name: 'Required Tier', value: "`B-TIER`", inline: true },
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
                let reportCommand = "/profit"


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

