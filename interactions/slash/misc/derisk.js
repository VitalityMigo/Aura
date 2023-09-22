/**
 * @file Sample getdata command with slash command.
 * @author Vitality Migø
 */


const { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { profileData, accessSql, wallets, interactionData, apimonitorsql, adminsql, reportsql, usersql, sequelize } = require('../../../events/database');
const moment = require('moment');
const isHttps = require('../../../functions/isHttps')

const dotenv = require("dotenv")
dotenv.config()
const reservoirApiKey = process.env.reservoirApiKey
const blockspanApiKey = process.env.blockspanApiKey
const alchemyApiKey = process.env.alchemyApiKey
const magicedenApiKey = process.env.magicedenApiKey


// Configuration de l'en-tête d'autorisation
const headers = {
    'Authorization': `Bearer ${magicedenApiKey}`
};



//https request
const axios = require('axios')


const sdk = require('api')('@reservoirprotocol/v2.0#2672bklexdpsbi');
sdk.auth(reservoirApiKey);


const sdk3 = require('api')('@reservoirprotocol/v3.0#1im010ljszuoex');
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
const alchemy = new Alchemy(settings);;
const alchemy2 = require('api')('@alchemy-docs/v1.0#24zcsa23lfbpdnv5');



function isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function isValidEthereumTxn(address) {
    return /^0x[a-fA-F0-9]{64}$/.test(address);
}

function isValidInput(input) {
    return /^(\w+|-)+$/.test(input);
}

function estLienHTTPS(val) {
    var lienRegex = /^(https:\/\/)/i; // Regex pour vérifier si le lien commence par "https://"

    return lienRegex.test(val);
}

function isBRC20BitcoinWallet(wallet) {
    const regex = /^bc1[a-zA-Z0-9]{39,59}$/;

    return regex.test(wallet);
}


//On appel le module Discord
module.exports = {
    data: new SlashCommandBuilder()
        .setName("derisk")
        .setDescription("Display your derisk price on a specific collection or txn")
        .addSubcommand(subcommand =>
            subcommand
                .setName("collection")
                .setDescription("Display your derisk price on a specific collection")
                .addStringOption(option =>
                    option
                        .setName("collection")
                        .setDescription("The collection you want to get your derisk price for")
                        .setRequired(true)
                        .setAutocomplete(true)

                )
                .addStringOption(option =>
                    option
                        .setName("wallet")
                        .setDescription("The wallet you want to get your derisk price for")
                        .setRequired(true)
                        .setAutocomplete(true)


                ),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("txn")
                .setDescription("Display your derisk price on a specific transaction")
                .addStringOption(option =>
                    option
                        .setName("hash")
                        .setDescription("The hash of your transaction")
                        .setRequired(true)

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


                    if (interaction.options.getSubcommand() === 'collection') {



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







                                    const buttonsRow = new ActionRowBuilder()
                                        .addComponents(
                                            new ButtonBuilder()
                                                .setCustomId('zzderiskalert-button')
                                                .setLabel('set derisk alert')
                                                .setStyle(2),
                                        );


                                    //Variable pour les options
                                    const selectedCollection = interaction.options.getString("collection");
                                    const selectedWallet = interaction.options.getString("wallet");






                                    //Si ce sont tous les wallets de l'utilisateur qui sont séléctionnées
                                    if (selectedWallet.toLowerCase() === "all") {



                                        if (isValidEthereumAddress(selectedCollection)) {


                                            const walletAuthor = await wallets.findAll({ where: { authorId: authorId, walletCategory: "eth" } })
                                            let walletCount = walletAuthor.length
                                            let walletsAuthorTable = [...new Set(walletAuthor.map(wallet => wallet.dataValues.walletAddress))];
                                            let walletsAuthorTableWithCollection = [];
                                            let tokenHoldTable = []


                                            if (walletsAuthorTable.length > 0) {


                                                //On initialise le tableau de call api pour mesurer
                                                let apiObj = {}
                                                apiObj.getCollectionsV5 = 0
                                                apiObj.getUsersUserCollectionsV2 = 0
                                                apiObj.getUsersUserTokensV6 = 0
                                                apiObj.getSalesV4 = 0
                                                apiObj.getTransaction = 0
                                                apiObj.getTransactionReceipt = 0
                                                apiObj.getAllTransfers = 0



                                                // Premier Call API Reservoir : Stats et infos sur la collection
                                                sdk.getCollectionsV5({ id: selectedCollection, accept: '*/*' })
                                                    .then(async ({ data }) => {

                                                        //Incrémentation compteur API
                                                        apiObj.getCollectionsV5++


                                                        // On déclare les variables liées à la collection séléctionné
                                                        let collectionName = data.collections[0].name
                                                        let collectionSlug = data.collections[0].slug
                                                        let collectionLogo = data.collections[0].image
                                                        let collectionBanner = data.collections[0].banner
                                                        let collectionTwitter = data.collections[0].twitterUsername
                                                        let collectionWebsite = data.collections[0].externalUrl


                                                        let collectionFp

                                                        if (!(data.collections[0].floorAsk.price)) {

                                                            collectionFp = "N/A"

                                                        } else if (data.collections[0].floorAsk.price) {

                                                            collectionFp = data.collections[0].floorAsk.price.amount.decimal + "Ξ"

                                                        }

                                                        // On déclare les variables de base
                                                        let royalties = data.collections[0].royalties.bps
                                                        let collectionRoyal = parseFloat(royalties / 100 + 0.5).toFixed(2) + "%"
                                                        let holdCount = 0;
                                                        let buySpentEth = 0; // variable pour Buy Spent
                                                        let gasSpent = 0
                                                        let totalSpent = 0 + "Ξ"
                                                        let avgBuy = 0 + "Ξ"
                                                        let avgGas = 0 + "Ξ"
                                                        let avgTotal = 0 + "Ξ"
                                                        let totalDerisk = 0 + "Ξ"
                                                        let avgDerisk = 0 + "Ξ"
                                                        let roi = 0
                                                        let roiFormatted = "`" + 0 + "%" + "`"
                                                        let roiPrefix = "";
                                                        let roiSuffix = "";





                                                        // Deuxième Call API Reservoir : Stats et infos sur les collections de l'utilisateur
                                                        for (const walletAddress of walletsAuthorTable) {
                                                            const { data: userData } = await sdk.getUsersUserCollectionsV2({ collection: selectedCollection, user: walletAddress, accept: '*/*' });

                                                            //Incrémentation compteur API
                                                            apiObj.getUsersUserCollectionsV2++


                                                            if (userData.collections.length > 0) {
                                                                walletsAuthorTableWithCollection.push(walletAddress);
                                                            }
                                                        }


                                                        //On vérifie si l'auteur a bien la collection dans son wallet, sinon renvoi 0 partout.
                                                        if (walletsAuthorTableWithCollection.length > 0) {


                                                            // Troisème Call API Reservoir : Stats et infos sur les tokens précis de l'utilisateur
                                                            for await (const walletAddress of walletsAuthorTableWithCollection) {
                                                                const { data: userTokens } = await sdk.getUsersUserTokensV6({ collection: selectedCollection, limit: '200', user: walletAddress, accept: '*/*' });

                                                                //Incrémentation compteur API
                                                                apiObj.getUsersUserTokensV6++


                                                                for (let i = 0; i < userTokens.tokens.length; i++) { tokenHoldTable.push(userTokens.tokens[i].token.tokenId); }
                                                            }


                                                            //Calculer le prix d'achat de chaque token de l'utilisateur
                                                            for (const tokenId of tokenHoldTable) {
                                                                const { data: userPriceToken } = await
                                                                    sdk.getSalesV4({
                                                                        token: selectedCollection + '%3A' + tokenId,
                                                                        limit: '100',
                                                                        accept: '*/*'
                                                                    })

                                                                //Incrémentation compteur API
                                                                apiObj.getSalesV4++




                                                                const filteredSales = userPriceToken.sales.filter(sale => walletsAuthorTable.includes(sale.to));

                                                                if (filteredSales.length <= 0) {


                                                                    buySpentEth += 0;
                                                                    gasSpent += 0;

                                                                } else if (filteredSales[0].orderSide === "bid") {

                                                                    buySpentEth += parseFloat(filteredSales[0].price.amount.native);



                                                                    gasSpent += 0;

                                                                } else {

                                                                    buySpentEth += parseFloat(filteredSales[0].price.amount.native);

                                                                    let tokenHashTxn = filteredSales[0].txHash

                                                                    const hashValueReader = await web3.eth.getTransaction(tokenHashTxn)
                                                                    const hashGasReader = await web3.eth.getTransactionReceipt(tokenHashTxn)
                                                                    const { data: hashTransferReader } = await bsp.getAllTransfers({ chain: 'eth-main', hash: tokenHashTxn, page_size: '100' })

                                                                    //Incrémentation compteur API
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

                                                                    gasSpent += (parseFloat(web3.utils.fromWei(((hashValueReader.gasPrice) * (hashGasReader.gasUsed)).toString(), 'ether'))) / uniqueIdCount;




                                                                }


                                                            }



                                                            //On déclare les variables de l'embed dans le cas où la collection est trouvé
                                                            holdCount = tokenHoldTable.length
                                                            totalSpent = gasSpent + buySpentEth
                                                            avgBuy = parseFloat(buySpentEth / holdCount).toFixed(3) + "Ξ"
                                                            avgGas = parseFloat(gasSpent / holdCount).toFixed(3) + "Ξ"
                                                            avgTotal = parseFloat((gasSpent + buySpentEth) / holdCount).toFixed(3) + "Ξ"
                                                            totalDerisk = ((gasSpent + buySpentEth) / (1 - ((royalties / 100 + 0.5) / 100))).toFixed(3) + "Ξ"
                                                            avgDerisk = parseFloat(((gasSpent + buySpentEth) / (1 - ((royalties / 100 + 0.5) / 100))) / holdCount).toFixed(3) + "Ξ"


                                                            //ROI Variable
                                                            if (!(data.collections[0].floorAsk.price)) {

                                                                roi = "N/A"

                                                            } else if (data.collections[0].floorAsk.price) {

                                                                roi = (((data.collections[0].floorAsk.price.amount.decimal - (totalSpent / holdCount)) / (totalSpent / holdCount)) * 100).toFixed(2)

                                                            }




                                                            // ROI format Variable
                                                            if (roi !== 0 && totalSpent !== 0 && collectionFp !== 'N/A') {

                                                                if (roi > 0) {
                                                                    roiPrefix = "+";
                                                                    roiSuffix = " :chart_with_upwards_trend:";
                                                                } else if (roi < 0) {
                                                                    roiSuffix = " :chart_with_downwards_trend:";
                                                                }
                                                                roiFormatted = "`" + roiPrefix + parseFloat(roi).toFixed(2) + "%" + "`" + roiSuffix;


                                                            } else if (roi === 0) {

                                                                roiFormatted = "`0`"

                                                            } else if (collectionFp === "N/A") {

                                                                roiFormatted = "'N/A'"

                                                            } else if (totalSpent === 0) {

                                                                roiFormatted = "`INFINITY`<a:RCRich:1044762000837840926>"

                                                            }



                                                            let linksFormatted = ""
                                                            if (isHttps(collectionWebsite) && collectionTwitter !== null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + selectedCollection + ") ∙ " + '[magically](https://magically.gg/collection/' + selectedCollection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + selectedCollection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ") ∙ " + '[website](' + collectionWebsite + ")" }
                                                            else if (!isHttps(collectionWebsite) && collectionTwitter !== null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + selectedCollection + ") ∙ " + '[magically](https://magically.gg/collection/' + selectedCollection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + selectedCollection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ")" }
                                                            else if (isHttps(collectionWebsite) && collectionTwitter == null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + selectedCollection + ") ∙ " + '[magically](https://magically.gg/collection/' + selectedCollection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + selectedCollection + ") ∙ " + '[website](' + collectionWebsite + ")" }
                                                            else { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + selectedCollection + ") ∙ " + '[magically](https://magically.gg/collection/' + selectedCollection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + selectedCollection + ")" }



                                                            const getderiskAllWallet = new EmbedBuilder().setColor("#060A8F")
                                                                .setTitle(`${authorName}'s derisk price on ${collectionName}`)
                                                                .setDescription(">>> Derisk data for all your wallets `(" + walletCount + ")` on " + collectionName + ".")
                                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                                .setImage(collectionBanner)
                                                                .addFields(
                                                                    { name: "Buy Spent", value: "`" + parseFloat(buySpentEth).toFixed(3) + "Ξ`", inline: true },
                                                                    { name: "Gas Spent", value: "`" + parseFloat(gasSpent).toFixed(3) + "Ξ`", inline: true },
                                                                    { name: "Total Spent", value: "`" + parseFloat(totalSpent).toFixed(3) + "Ξ`", inline: true },
                                                                    { name: "AVG Buy", value: "`" + `${avgBuy}` + "`", inline: true },
                                                                    { name: "AVG Gas", value: "`" + `${avgGas}` + "`", inline: true },
                                                                    { name: "AVG Total", value: "`" + `${avgTotal}` + "`", inline: true },
                                                                    { name: "Floor Price", value: "`" + `${collectionFp}` + "`", inline: true },
                                                                    { name: "Royalties", value: "`" + `${collectionRoyal}` + "`", inline: true },
                                                                    { name: "NFTs Hold", value: "`" + `${holdCount}` + "`", inline: true },
                                                                    { name: "Total Derisk", value: "`" + `${totalDerisk}` + "`", inline: true },
                                                                    { name: "AVG Derisk", value: "`" + `${avgDerisk}` + "`", inline: true },
                                                                    { name: "ROI", value: `${roiFormatted}`, inline: true },
                                                                    { name: "Links", value: linksFormatted, inline: true },
                                                                )
                                                                .setTimestamp()
                                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                                            await interaction.editReply({ embeds: [getderiskAllWallet], components: [buttonsRow] });


                                                            //Détruire dernière intéraction dans la base SQL dédié et crée la nouvelle pour derisk
                                                            await interactionData.destroy({ where: { authorId: authorId, commandName: "derisk", serverId: serverId } })

                                                            await interactionData.create({

                                                                authorId: authorId,
                                                                authorName: authorName,
                                                                serverId: serverId,
                                                                walletAddress: selectedWallet,
                                                                commandName: "derisk",
                                                                interactionId: interaction.id,
                                                                walletName: "N/A",
                                                                selecedTimestamp: "N/A",
                                                                embed1: "N/A",
                                                                embed2: "N/A",
                                                                embed3: "N/A",
                                                                pageIndex: "N/A",
                                                                actualPage: "N/A",
                                                                walletCategory: "N/A",
                                                                selectedCollection: selectedCollection,
                                                                collectionSlug: collectionSlug,
                                                                collectionBanner: collectionBanner,
                                                                avgDeriskPrice: avgDerisk,
                                                                floorPrice: collectionFp,
                                                                lowerMarketlace: data.collections[0].floorAsk.sourceDomain,
                                                                collectionName: collectionName,
                                                                walletCategory: "N/A",
                                                                collectionTwitter: collectionTwitter,
                                                                collectionWebsite: collectionWebsite,
                                                                buyCount: "N/A",
                                                                soldCount: "N/A",
                                                                remaining: "N/A",
                                                                avgBuy: "N/A",
                                                                avgSold: "N/A",
                                                                realisedProfit: "N/A",
                                                                potentialProfit: "N/A",
                                                                roi: "N/A",
                                                                visualTitle: "N/A",
                                                                userAvatar: "N/A",
                                                                nbMembersInvolved: "N/A",
                                                                totalTradeCount: "N/A",

                                                            })




                                                            //On enregistre le call API dans la database
                                                            const timeStamp = Date.now();
                                                            for (let i = 0; i < apiObj.getCollectionsV5; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/derisk", apiCallName: "getCollectionsV5", apiProvider: "reservoir", timestamp: timeStamp.toString() }) }
                                                            for (let i = 0; i < apiObj.getUsersUserCollectionsV2; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/derisk", apiCallName: "getUsersUserCollectionsV2", apiProvider: "reservoir", timestamp: timeStamp.toString() }) }
                                                            for (let i = 0; i < apiObj.getUsersUserTokensV6; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/derisk", apiCallName: "getUsersUserTokensV6", apiProvider: "reservoir", timestamp: timeStamp.toString() }) }
                                                            for (let i = 0; i < apiObj.getSalesV4; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/derisk", apiCallName: "getSalesV4", apiProvider: "reservoir", timestamp: timeStamp.toString() }) }
                                                            for (let i = 0; i < apiObj.getTransaction; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/derisk", apiCallName: "getTransaction", apiProvider: "web3.eth", timestamp: timeStamp.toString() }) }
                                                            for (let i = 0; i < apiObj.getTransactionReceipt; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/derisk", apiCallName: "getTransactionReceipt", apiProvider: "web3.eth", timestamp: timeStamp.toString() }) }
                                                            for (let i = 0; i < apiObj.getAllTransfers; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/derisk", apiCallName: "getAllTransfers", apiProvider: "blockspan", timestamp: timeStamp.toString() }) }



                                                        } else if (walletsAuthorTableWithCollection.length <= 0) {


                                                            let linksFormatted = ""
                                                            if (isHttps(collectionWebsite) && collectionTwitter !== null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + selectedCollection + ") ∙ " + '[magically](https://magically.gg/collection/' + selectedCollection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + selectedCollection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ") ∙ " + '[website](' + collectionWebsite + ")" }
                                                            else if (!isHttps(collectionWebsite) && collectionTwitter !== null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + selectedCollection + ") ∙ " + '[magically](https://magically.gg/collection/' + selectedCollection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + selectedCollection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ")" }
                                                            else if (isHttps(collectionWebsite) && collectionTwitter == null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + selectedCollection + ") ∙ " + '[magically](https://magically.gg/collection/' + selectedCollection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + selectedCollection + ") ∙ " + '[website](' + collectionWebsite + ")" }
                                                            else { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + selectedCollection + ") ∙ " + '[magically](https://magically.gg/collection/' + selectedCollection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + selectedCollection + ")" }




                                                            const getderiskzeroAllWallet = new EmbedBuilder().setColor("#060A8F")
                                                                .setTitle(`${authorName}'s derisk price on ${collectionName}`)
                                                                .setDescription(">>> Derisk data for all the wallets (`" + walletCount + "`) of <@" + authorId + "> on " + collectionName + ".")
                                                                .setImage(collectionBanner)
                                                                .addFields(
                                                                    { name: "Buy Spent", value: "`" + parseFloat(buySpentEth).toFixed(3) + "Ξ`", inline: true },
                                                                    { name: "Gas Spent", value: "`" + parseFloat(gasSpent).toFixed(3) + "Ξ`", inline: true },
                                                                    { name: "Total Spent", value: "`" + parseFloat(totalSpent).toFixed(3) + "Ξ`", inline: true },
                                                                    { name: "AVG Buy", value: "`" + `${avgBuy}` + "`", inline: true },
                                                                    { name: "AVG Gas", value: "`" + `${avgGas}` + "`", inline: true },
                                                                    { name: "AVG Total", value: "`" + `${avgTotal}` + "`", inline: true },
                                                                    { name: "Floor Price", value: "`" + `${collectionFp}` + "Ξ`", inline: true },
                                                                    { name: "Royalties", value: "`" + `${collectionRoyal}` + "`", inline: true },
                                                                    { name: "NFTs Hold", value: "`" + `${holdCount}` + "`", inline: true },
                                                                    { name: "Total Derisk", value: "`" + `${totalDerisk}` + "`", inline: true },
                                                                    { name: "AVG Derisk", value: "`" + `${avgDerisk}` + "`", inline: true },
                                                                    { name: "ROI", value: `${roiFormatted}`, inline: true },
                                                                    { name: "Links", value: linksFormatted, inline: true },
                                                                )
                                                                .setTimestamp()
                                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                                            await interaction.editReply({ embeds: [getderiskzeroAllWallet] });


                                                            //On enregistre le call API dans la database
                                                            const timeStamp = Date.now();
                                                            for (let i = 0; i < apiObj.getCollectionsV5; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/derisk", apiCallName: "getCollectionsV5", apiProvider: "reservoir", timestamp: timeStamp.toString() }) }
                                                            for (let i = 0; i < apiObj.getUsersUserCollectionsV2; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/derisk", apiCallName: "getUsersUserCollectionsV2", apiProvider: "reservoir", timestamp: timeStamp.toString() }) }
                                                            for (let i = 0; i < apiObj.getUsersUserTokensV6; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/derisk", apiCallName: "getUsersUserTokensV6", apiProvider: "reservoir", timestamp: timeStamp.toString() }) }
                                                            for (let i = 0; i < apiObj.getSalesV4; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/derisk", apiCallName: "getSalesV4", apiProvider: "reservoir", timestamp: timeStamp.toString() }) }
                                                            for (let i = 0; i < apiObj.getTransaction; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/derisk", apiCallName: "getTransaction", apiProvider: "web3.eth", timestamp: timeStamp.toString() }) }
                                                            for (let i = 0; i < apiObj.getTransactionReceipt; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/derisk", apiCallName: "getTransactionReceipt", apiProvider: "web3.eth", timestamp: timeStamp.toString() }) }
                                                            for (let i = 0; i < apiObj.getAllTransfers; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/derisk", apiCallName: "getAllTransfers", apiProvider: "blockspan", timestamp: timeStamp.toString() }) }


                                                        }


                                                    })



                                                const walletAuthor = await wallets.findAll({ where: { authorId: authorId, walletCategory: "btc" } })
                                                let walletCount = walletAuthor.length
                                                let walletsAuthorTable = [...new Set(walletAuthor.map(wallet => wallet.dataValues.walletAddress))];
                                                let walletsAuthorTableWithCollection = [];
                                                let tokenHoldTable = []







                                            } else {

                                                const setwalletErrorEmbed = new EmbedBuilder().setColor("#060A8F")
                                                    .setTitle(`No wallet`)
                                                    .setDescription("Aura can't analyze your wallet's data because you don't have any Ethereum wallet registered in your portfolio. Please use `/wallet set` or `/wallet raw` to register a wallet in your portfolio then try again.")
                                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                                    .setTimestamp()
                                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                                await interaction.editReply({ embeds: [setwalletErrorEmbed] });





                                            }

                                        } else if (isValidInput(selectedCollection)) {

                                            const walletAuthor = await wallets.findAll({ where: { authorId: authorId, walletCategory: "btc" } })
                                            let walletCount = walletAuthor.length
                                            let walletsAuthorTable = [...new Set(walletAuthor.map(wallet => wallet.dataValues.walletAddress))];
                                            let walletsAuthorTableWithCollection = [];
                                            let tokenHoldTable = []

                                            if (walletsAuthorTable.length > 0) {



                                                let collectionName = ""
                                                let collectionLogo = ""
                                                let twitter = ""
                                                let discord = ""
                                                let website = ""

                                                let buySpent = 0
                                                let buyGasSpent = 0
                                                let totalSpent = 0

                                                let holdCount = 0
                                                let royalties = 0
                                                let averageBuyValue = 0
                                                let averageGasValue = 0
                                                let averageTotalBuy = 0
                                                let totalHoldValue = 0
                                                let totalDerisk = 0
                                                let avgDerisk = 0
                                                let roi = 0
                                                let roiFormatted = 0


                                                const walletAddressName = await wallets.findOne({ where: { authorId: authorId, walletAddress: selectedWallet } });
                                                let walletName = selectedWallet
                                                let walletFormatted = "`" + selectedWallet.substring(0, 5) + "..." + selectedWallet.substring(selectedWallet.length - 4, selectedWallet.length) + "`"
                                                if (walletAddressName !== null) {
                                                    walletName = walletAddressName.walletName
                                                    walletFormatted = "`" + walletName + " (" + selectedWallet.substring(0, 5) + "..." + selectedWallet.substring(selectedWallet.length - 4, selectedWallet.length) + ")`"

                                                }



                                                const btcCallPrice = await axios.get("https://blockchain.info/q/24hrprice")
                                                let BTCUsdPrice = btcCallPrice.data


                                                const url = `https://api-mainnet.magiceden.dev/v2/ord/btc/collections/` + selectedCollection;
                                                const response = await axios.get(url, { headers });
                                                const data = await response.data;

                                                collectionLogo = data.imageURI
                                                collectionName = data.name
                                                twitter = data.twitterLink
                                                discord = data.discordLink
                                                website = data.websiteLink


                                                const url2 = `https://api-mainnet.magiceden.dev/v2/ord/btc/stat?collectionSymbol=` + selectedCollection;
                                                const response2 = await axios.get(url2, { headers });
                                                const data2 = await response2.data;


                                                const floorPrice = (data2.floorPrice) / (10 ** 8)



                                                let tokenHeldId = []

                                                for (const wallet of walletsAuthorTable) {

                                                    const url3 = `https://api-mainnet.magiceden.dev/v2/ord/btc/tokens?collectionSymbol=` + selectedCollection + `&ownerAddress=` + wallet + `&showAll=true&sortBy=priceAsc`;
                                                    const response3 = await axios.get(url3, { headers });
                                                    const data3 = await response3.data;



                                                    for (const token of data3.tokens) {
                                                        let obj = {}
                                                        obj.tokenId = token.id
                                                        obj.wallet = wallet
                                                        tokenHeldId.push(obj)
                                                    }

                                                }

                                                console.log("Held :\n" + tokenHeldId)

                                                if (tokenHeldId.length > 0) {


                                                    for (const token of tokenHeldId) {

                                                        //Buy classic
                                                        const tokenBuyLink = `https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=buying_broadcasted&tokenId=` + token.tokenId
                                                        const tokenBuyCall = await axios.get(tokenBuyLink, { headers });
                                                        const tokenBuy = await tokenBuyCall.data.activities;

                                                        const tokenBuyByWallet = tokenBuy.filter(activity => activity.oldOwner.toLowerCase() !== token.wallet.toLowerCase() && activity.newOwner.toLowerCase() == token.wallet.toLowerCase());


                                                        if (tokenBuyByWallet.length > 0) {

                                                            const mempoolCall = await axios.get("https://mempool.space/api/tx/" + tokenBuyByWallet[0].txId)

                                                            buySpent += ((tokenBuyByWallet[0].listedPrice) / (10 ** 8))
                                                            buyGasSpent += mempoolCall.data.fee / (10 ** 8)

                                                        } else {


                                                            //Create
                                                            const tokenCreateLink = `https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=create&tokenId=` + token.tokenInscription
                                                            const tokenCreateCall = await axios.get(tokenCreateLink, { headers });
                                                            const tokenCreate = await tokenCreateCall.data.activities;

                                                            const tokenCreateByWallet = tokenCreate.filter(activity => activity.newOwner.toLowerCase() == token.wallet.toLowerCase());

                                                            if (tokenCreateByWallet.length > 0) {

                                                                const mempoolCall = await axios.get("https://mempool.space/api/tx/" + tokenBuyByWallet[0].txId)

                                                                buySpent += ((tokenBuyByWallet[0].txValue) / (10 ** 8))
                                                                buyGasSpent += mempoolCall.data.fee / (10 ** 8)


                                                            } else {

                                                                //Mint
                                                                const tokenMintLink = `https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=mint_broadcasted&tokenId=` + token.tokenInscription
                                                                const tokenMintCall = await axios.get(tokenMintLink, { headers });
                                                                const tokenMint = await tokenMintCall.data.activities;

                                                                const tokenMintByWallet = tokenMint.filter(activity => activity.newOwner.toLowerCase() == token.wallet.toLowerCase());

                                                                if (tokenMintByWallet.length > 0) {

                                                                    const mempoolCall = await axios.get("https://mempool.space/api/tx/" + tokenBuyByWallet[0].txId)

                                                                    buySpent += ((tokenBuyByWallet[0].listedPrice) / (10 ** 8))
                                                                    buyGasSpent += mempoolCall.data.fee / (10 ** 8)


                                                                } else {

                                                                    //Transfert & Airdrop
                                                                    buySpent += 0
                                                                    buyGasSpent += 0

                                                                    p
                                                                }
                                                            }

                                                        }





                                                    }


                                                    console.log(buySpent)
                                                    console.log(buyGasSpent)


                                                    holdCount = tokenHeldId.length

                                                    totalSpent = buySpent + buyGasSpent
                                                    averageBuyValue = buySpent / holdCount
                                                    averageGasValue = buyGasSpent / holdCount
                                                    averageTotalBuy = (buySpent + buyGasSpent) / holdCount
                                                    totalHoldValue = floorPrice * holdCount

                                                    royalties = 2

                                                    totalDerisk = (buySpent + buyGasSpent) / (1 - ((royalties / 100 + 0.5) / 100))
                                                    avgDerisk = (((buySpent + buyGasSpent) / (1 - ((royalties / 100 + 0.5) / 100))) / holdCount)
                                                    roi = (((floorPrice - (totalSpent / holdCount)) / (totalSpent / holdCount)) * 100)


                                                    // ROI format Variable
                                                    if (roi !== 0 && totalSpent !== 0 && floorPrice) {

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

                                                    } else if (totalSpent === 0) {

                                                        roiFormatted = "`INFINITY`<a:RCRich:1044762000837840926>"

                                                    }



                                                } else {

                                                    roiFormatted = "`0.00%`"
                                                    royalties = 2

                                                }

                                                console.log(discord)
                                                console.log(twitter)
                                                console.log(website)

                                                let linksFormatted = ""
                                                if (estLienHTTPS(discord) && estLienHTTPS(website)) { linksFormatted = "[magic eden](https://magiceden.io/ordinals/marketplace/" + selectedCollection + ") ∙ " + '[ordinals](https://ordinalswallet.com/collection/' + selectedCollection + ") ∙ " + "[twitter](" + twitter + ") ∙ " + "[discord](" + discord + ") ∙ " + '[website](' + website + ")" }
                                                else if (estLienHTTPS(discord) && !estLienHTTPS(website)) { linksFormatted = "[magic eden](https://magiceden.io/ordinals/marketplace/" + selectedCollection + ") ∙ " + '[ordinals](https://ordinalswallet.com/collection/' + selectedCollection + ") ∙ " + "[twitter](" + twitter + ") ∙ " + "[discord](" + discord + ")" }
                                                else if (!estLienHTTPS(discord) && estLienHTTPS(website)) { linksFormatted = "[magic eden](https://magiceden.io/ordinals/marketplace/" + selectedCollection + ") ∙ " + '[ordinals](https://ordinalswallet.com/collection/' + selectedCollection + ") ∙ " + "[twitter](" + twitter + ") ∙ " + '[website](' + website + ")" }
                                                else { linksFormatted = "[magic eden](https://magiceden.io/ordinals/marketplace/" + selectedCollection + ") ∙ " + '[ordinals](https://ordinalswallet.com/collection/' + selectedCollection + ") ∙ " + "[twitter](" + twitter + ")" }

                                                console.log(collectionLogo)
                                                const getderiskSelectedWallet = new EmbedBuilder().setColor("#060A8F")
                                                    .setTitle(`${authorName}'s derisk price on ${collectionName}`)
                                                    .setDescription(">>> Derisk data for all your wallets `(" + walletCount + ")` on " + collectionName + ".")
                                                    .setThumbnail(collectionLogo)
                                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                                    .addFields(
                                                        { name: "Buy Spent", value: "`" + parseFloat(buySpent).toFixed(3) + "₿`", inline: true },
                                                        { name: "Gas Spent", value: "`" + parseFloat(buyGasSpent).toFixed(3) + "₿`", inline: true },
                                                        { name: "Total Spent", value: "`" + parseFloat(totalSpent).toFixed(3) + "₿`", inline: true },
                                                        { name: "AVG Buy", value: "`" + parseFloat(averageBuyValue).toFixed(3) + "₿`", inline: true },
                                                        { name: "AVG Gas", value: "`" + parseFloat(averageGasValue).toFixed(3) + "₿`", inline: true },
                                                        { name: "AVG Total", value: "`" + parseFloat(averageTotalBuy).toFixed(3) + "₿`", inline: true },
                                                        { name: "Floor Price", value: "`" + parseFloat(floorPrice).toFixed(3) + "₿`", inline: true },
                                                        { name: "Royalties", value: "`" + parseFloat(royalties + 0.5) + "%`", inline: true },
                                                        { name: "NFTs Held", value: "`" + holdCount + "`", inline: true },
                                                        { name: "Total Derisk", value: "`" + parseFloat(totalDerisk).toFixed(3) + "₿`", inline: true },
                                                        { name: "AVG Derisk", value: "`" + parseFloat(avgDerisk).toFixed(3) + "₿`", inline: true },
                                                        { name: "ROI", value: roiFormatted, inline: true },
                                                        { name: "Links", value: linksFormatted, inline: true },
                                                    )
                                                    .setTimestamp()
                                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });


                                                await interaction.editReply({ embeds: [getderiskSelectedWallet] });


                                            } else {

                                                const setwalletErrorEmbed = new EmbedBuilder().setColor("#060A8F")
                                                    .setTitle(`No wallet`)
                                                    .setDescription("Aura can't analyze your wallet's data because you don't have any Bitcoin wallet registered in your portfolio. Please use `/wallet set` or `/wallet raw` to register a wallet in your portfolio then try again.")
                                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                                    .setTimestamp()
                                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                                await interaction.editReply({ embeds: [setwalletErrorEmbed] });





                                            }


                                        } else {

                                            const setwalletErrorEmbed = new EmbedBuilder().setColor("#060A8F")
                                                .setTitle(`No wallet`)
                                                .setDescription("Aura can't analyze your wallet's data because the collection you selected isn't a valid one. Please try again selecting another one.")
                                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                .setTimestamp()
                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                            await interaction.editReply({ embeds: [setwalletErrorEmbed] });





                                        }



                                    } else if (selectedWallet.toLowerCase() !== "all") {


                                        const walletAuthor = await wallets.findAll({ where: { authorId: authorId, walletCategory: "eth" } })
                                        let walletsAuthorTable = [...new Set(walletAuthor.map(wallet => wallet.dataValues.walletAddress))];







                                        //On initialise le tableau de call api pour mesurer
                                        let apiObj = {}
                                        apiObj.getCollectionsV5 = 0
                                        apiObj.getUsersUserCollectionsV2 = 0
                                        apiObj.getUsersUserTokensV6 = 0
                                        apiObj.getSalesV4 = 0
                                        apiObj.getTransaction = 0
                                        apiObj.getTransactionReceipt = 0
                                        apiObj.getAllTransfers = 0



                                        let royalties = 0
                                        let collectionRoyal = 0 + "%"
                                        let holdCount = 0;
                                        let buySpentEth = 0; // variable pour Buy Spent
                                        let gasSpent = 0
                                        let totalSpent = 0 + "Ξ"
                                        let avgBuy = 0 + "Ξ"
                                        let avgGas = 0 + "Ξ"
                                        let avgTotal = 0 + "Ξ"
                                        let totalDerisk = 0 + "Ξ"
                                        let avgDerisk = 0 + "Ξ"
                                        let roi = 0
                                        let roiFormatted = "`" + 0 + "%" + "`"
                                        let roiPrefix = "";
                                        let roiSuffix = "";



                                        if (isValidEthereumAddress(selectedCollection)) {


                                            if (isValidEthereumAddress(selectedWallet)) {


                                                const walletAddressName = await wallets.findOne({ where: { authorId: authorId, walletAddress: selectedWallet } });
                                                let walletName1 = selectedWallet
                                                let walletName = "`" + selectedWallet.substring(0, 5) + "..." + selectedWallet.substring(selectedWallet.length - 4, selectedWallet.length) + "`"
                                                if (walletAddressName !== null) {
                                                    walletName1 = walletAddressName.walletName
                                                    walletName = "`" + walletName1 + " (" + selectedWallet.substring(0, 5) + "..." + selectedWallet.substring(selectedWallet.length - 4, selectedWallet.length) + ")`"

                                                }



                                                // Premier Call API Reservoir : Stats et infos sur la collection
                                                sdk.getCollectionsV5({ id: selectedCollection, accept: '*/*' })
                                                    .then(async ({ data }) => {

                                                        apiObj.getCollectionsV5++


                                                        // Deuxième Call API Reservoir : Stats et infos sur les collections de l'utilisateur
                                                        sdk.getUsersUserCollectionsV2({ collection: selectedCollection, user: selectedWallet, accept: '*/*' })
                                                            .then(async ({ data: userData }) => {

                                                                apiObj.getUsersUserCollectionsV2++


                                                                // On déclare les variables liées à l'API
                                                                let collectionName = data.collections[0].name
                                                                let collectionSlug = data.collections[0].slug
                                                                let collectionLogo = data.collections[0].image
                                                                let collectionBanner = data.collections[0].banner
                                                                let collectionTwitter = data.collections[0].twitterUsername
                                                                let collectionWebsite = data.collections[0].externalUrl
                                                                royalties = data.collections[0].royalties.bps
                                                                collectionRoyal = parseFloat(royalties / 100 + 0.5).toFixed(2) + "%"

                                                                let collectionFp

                                                                if (!(data.collections[0].floorAsk.price)) {

                                                                    collectionFp = "N/A"

                                                                } else if (data.collections[0].floorAsk.price) {

                                                                    collectionFp = data.collections[0].floorAsk.price.amount.decimal + "Ξ"

                                                                }




                                                                //On vérifie si l'auteur a bien la collection dans son wallet, sinon renvoi 0 partout.
                                                                if (userData.collections.length > 0) {



                                                                    // Troisème Call API Reservoir : Stats et infos sur les tokens précis de l'utilisateur
                                                                    sdk.getUsersUserTokensV6({ collection: selectedCollection, limit: '200', user: selectedWallet, accept: '*/*' })
                                                                        .then(async ({ data: userTokens }) => {

                                                                            apiObj.getUsersUserTokensV6++

                                                                            let tokenHoldTable = []; for (let i = 0; i < userTokens.tokens.length; i++) { tokenHoldTable.push(userTokens.tokens[i].token.tokenId); }



                                                                            for (const tokenId of tokenHoldTable) {
                                                                                const { data: userPriceToken } = await
                                                                                    sdk.getSalesV4({
                                                                                        token: selectedCollection + '%3A' + tokenId,
                                                                                        limit: '100',
                                                                                        accept: '*/*'
                                                                                    })

                                                                                apiObj.getSalesV4++


                                                                                const filteredSales = userPriceToken.sales.filter(sale => walletsAuthorTable.includes(sale.to));

                                                                                if (filteredSales.length <= 0) {


                                                                                    buySpentEth += 0;
                                                                                    gasSpent += 0;

                                                                                } else if (filteredSales[0].orderSide === "bid") {

                                                                                    buySpentEth += parseFloat(filteredSales[0].price.amount.native);



                                                                                    gasSpent += 0;

                                                                                } else {


                                                                                    buySpentEth += parseFloat(filteredSales[0].price.amount.native);

                                                                                    let tokenHashTxn = filteredSales[0].txHash

                                                                                    const hashValueReader = await web3.eth.getTransaction(tokenHashTxn)
                                                                                    const hashGasReader = await web3.eth.getTransactionReceipt(tokenHashTxn)
                                                                                    const { data: hashTransferReader } = await bsp.getAllTransfers({ chain: 'eth-main', hash: tokenHashTxn, page_size: '100' })


                                                                                    //Incrémentation compteur API
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

                                                                                    gasSpent += (parseFloat(web3.utils.fromWei(((hashValueReader.gasPrice) * (hashGasReader.gasUsed)).toString(), 'ether'))) / uniqueIdCount;


                                                                                }


                                                                            }







                                                                            //On déclare les variables de l'embed dans le cas où la collection est trouvé
                                                                            holdCount = userData.collections[0].ownership.tokenCount
                                                                            totalSpent = gasSpent + buySpentEth
                                                                            avgBuy = parseFloat(buySpentEth / holdCount).toFixed(3) + "Ξ"
                                                                            avgGas = parseFloat(gasSpent / holdCount).toFixed(3) + "Ξ"
                                                                            avgTotal = parseFloat((gasSpent + buySpentEth) / holdCount).toFixed(3) + "Ξ"
                                                                            totalDerisk = ((gasSpent + buySpentEth) / (1 - ((royalties / 100 + 0.5) / 100))).toFixed(3) + "Ξ"
                                                                            avgDerisk = parseFloat(((gasSpent + buySpentEth) / (1 - ((royalties / 100 + 0.5) / 100))) / holdCount).toFixed(3) + "Ξ"


                                                                            //ROI Variable
                                                                            if (!(data.collections[0].floorAsk.price)) {

                                                                                roi = "N/A"

                                                                            } else if (data.collections[0].floorAsk.price) {

                                                                                roi = (((data.collections[0].floorAsk.price.amount.decimal - (totalSpent / holdCount)) / (totalSpent / holdCount)) * 100).toFixed(2)

                                                                            }



                                                                            // ROI format Variable
                                                                            if (roi !== 0 && totalSpent !== 0 && collectionFp !== 'N/A') {

                                                                                if (roi > 0) {
                                                                                    roiPrefix = "+";
                                                                                    roiSuffix = " :chart_with_upwards_trend:";
                                                                                } else if (roi < 0) {
                                                                                    roiSuffix = " :chart_with_downwards_trend:";
                                                                                }
                                                                                roiFormatted = "`" + roiPrefix + parseFloat(roi).toFixed(2) + "%" + "`" + roiSuffix;


                                                                            } else if (roi === 0) {

                                                                                roiFormatted = "`0`"

                                                                            } else if (collectionFp === "N/A") {

                                                                                roiFormatted = "'N/A'"

                                                                            } else if (totalSpent === 0) {

                                                                                roiFormatted = "`INFINITY`<a:RCRich:1044762000837840926>"

                                                                            }


                                                                           
                                                                            let linksFormatted = ""
                                                                            if (isHttps(collectionWebsite) && collectionTwitter !== null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + selectedCollection + ") ∙ " + '[magically](https://magically.gg/collection/' + selectedCollection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + selectedCollection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ") ∙ " + '[website](' + collectionWebsite + ")" }
                                                                            else if (!isHttps(collectionWebsite) && collectionTwitter !== null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + selectedCollection + ") ∙ " + '[magically](https://magically.gg/collection/' + selectedCollection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + selectedCollection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ")" }
                                                                            else if (isHttps(collectionWebsite) && collectionTwitter == null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + selectedCollection + ") ∙ " + '[magically](https://magically.gg/collection/' + selectedCollection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + selectedCollection + ") ∙ " + '[website](' + collectionWebsite + ")" }
                                                                            else { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + selectedCollection + ") ∙ " + '[magically](https://magically.gg/collection/' + selectedCollection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + selectedCollection + ")" }




                                                                            const getderiskSelectedWallet = new EmbedBuilder().setColor("#060A8F")
                                                                                .setTitle(`${authorName}'s derisk price on ${collectionName}`)
                                                                                .setDescription(">>> Derisk data for your wallet `" + walletName + "` on " + collectionName + ".")
                                                                                .setImage(collectionBanner)
                                                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                                                .addFields(
                                                                                    { name: "Buy Spent", value: "`" + parseFloat(buySpentEth).toFixed(3) + "Ξ`", inline: true },
                                                                                    { name: "Gas Spent", value: "`" + parseFloat(gasSpent).toFixed(3) + "Ξ`", inline: true },
                                                                                    { name: "Total Spent", value: "`" + parseFloat(totalSpent).toFixed(3) + "Ξ`", inline: true },
                                                                                    { name: "AVG Buy", value: "`" + `${avgBuy}` + "`", inline: true },
                                                                                    { name: "AVG Gas", value: "`" + `${avgGas}` + "`", inline: true },
                                                                                    { name: "AVG Total", value: "`" + `${avgTotal}` + "`", inline: true },
                                                                                    { name: "Floor Price", value: "`" + `${collectionFp}` + "`", inline: true },
                                                                                    { name: "Royalties", value: "`" + `${collectionRoyal}` + "`", inline: true },
                                                                                    { name: "NFTs Hold", value: "`" + `${holdCount}` + "`", inline: true },
                                                                                    { name: "Total Derisk", value: "`" + `${totalDerisk}` + "`", inline: true },
                                                                                    { name: "AVG Derisk", value: "`" + `${avgDerisk}` + "`", inline: true },
                                                                                    { name: "ROI", value: `${roiFormatted}`, inline: true },
                                                                                    { name: "Links", value: linksFormatted, inline: true },
                                                                                )
                                                                                .setTimestamp()
                                                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });


                                                                            await interaction.editReply({ embeds: [getderiskSelectedWallet], components: [buttonsRow] });



                                                                            await interactionData.destroy({ where: { authorId: authorId, commandName: "derisk", serverId: serverId } })


                                                                            await interactionData.create({

                                                                                authorId: authorId,
                                                                                authorName: authorName,
                                                                                serverId: serverId,
                                                                                walletAddress: selectedWallet,
                                                                                commandName: "derisk",
                                                                                interactionId: interaction.id,
                                                                                walletName: "N/A",
                                                                                selecedTimestamp: "N/A",
                                                                                pageIndex: "N/A",
                                                                                actualPage: "N/A",
                                                                                embed1: "N/A",
                                                                                embed2: "N/A",
                                                                                embed3: "N/A",
                                                                                walletCategory: "N/A",
                                                                                selectedCollection: selectedCollection,
                                                                                collectionSlug: collectionSlug,
                                                                                collectionBanner: collectionBanner,
                                                                                avgDeriskPrice: avgDerisk,
                                                                                floorPrice: collectionFp,
                                                                                lowerMarketlace: data.collections[0].floorAsk.sourceDomain,
                                                                                collectionName: collectionName,
                                                                                walletCategory: "N/A",
                                                                                collectionTwitter: collectionTwitter,
                                                                                collectionWebsite: collectionWebsite,
                                                                                buyCount: "N/A",
                                                                                soldCount: "N/A",
                                                                                remaining: "N/A",
                                                                                avgBuy: "N/A",
                                                                                avgSold: "N/A",
                                                                                realisedProfit: "N/A",
                                                                                potentialProfit: "N/A",
                                                                                roi: "N/A",
                                                                                visualTitle: "N/A",
                                                                                userAvatar: "N/A",
                                                                                nbMembersInvolved: "N/A",
                                                                                totalTradeCount: "N/A",


                                                                            })


                                                                            

                                                                            //On enregistre le call API dans la database
                                                                            const timeStamp = Date.now();
                                                                            for (let i = 0; i < apiObj.getCollectionsV5; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/derisk", apiCallName: "getCollectionsV5", apiProvider: "reservoir", timestamp: timeStamp.toString() }) }
                                                                            for (let i = 0; i < apiObj.getUsersUserCollectionsV2; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/derisk", apiCallName: "getUsersUserCollectionsV2", apiProvider: "reservoir", timestamp: timeStamp.toString() }) }
                                                                            for (let i = 0; i < apiObj.getUsersUserTokensV6; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/derisk", apiCallName: "getUsersUserTokensV6", apiProvider: "reservoir", timestamp: timeStamp.toString() }) }
                                                                            for (let i = 0; i < apiObj.getSalesV4; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/derisk", apiCallName: "getSalesV4", apiProvider: "reservoir", timestamp: timeStamp.toString() }) }
                                                                            for (let i = 0; i < apiObj.getTransaction; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/derisk", apiCallName: "getTransaction", apiProvider: "web3.eth", timestamp: timeStamp.toString() }) }
                                                                            for (let i = 0; i < apiObj.getTransactionReceipt; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/derisk", apiCallName: "getTransactionReceipt", apiProvider: "web3.eth", timestamp: timeStamp.toString() }) }
                                                                            for (let i = 0; i < apiObj.getAllTransfers; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/derisk", apiCallName: "getAllTransfers", apiProvider: "blockspan", timestamp: timeStamp.toString() }) }


                                                                        })



                                                                } else if (userData.collections.length <= 0) {


                                                                    let linksFormatted = ""
                                                                    if (isHttps(collectionWebsite) && collectionTwitter !== null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + selectedCollection + ") ∙ " + '[magically](https://magically.gg/collection/' + selectedCollection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + selectedCollection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ") ∙ " + '[website](' + collectionWebsite + ")" }
                                                                    else if (!isHttps(collectionWebsite) && collectionTwitter !== null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + selectedCollection + ") ∙ " + '[magically](https://magically.gg/collection/' + selectedCollection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + selectedCollection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ")" }
                                                                    else if (isHttps(collectionWebsite) && collectionTwitter == null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + selectedCollection + ") ∙ " + '[magically](https://magically.gg/collection/' + selectedCollection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + selectedCollection + ") ∙ " + '[website](' + collectionWebsite + ")" }
                                                                    else { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + selectedCollection + ") ∙ " + '[magically](https://magically.gg/collection/' + selectedCollection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + selectedCollection + ")" }




                                                                    const getderiskZeroSelectedWallet = new EmbedBuilder().setColor("#060A8F")
                                                                        .setTitle(`${authorName}'s derisk price on ${collectionName}`)
                                                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                                                        .setDescription(">>> Derisk data your wallet `" + walletName + "` on " + collectionName + ".")
                                                                        .setImage(collectionBanner)
                                                                        .addFields(
                                                                            { name: "Buy Spent", value: "`" + parseFloat(buySpentEth).toFixed(3) + "Ξ`", inline: true },
                                                                            { name: "Gas Spent", value: "`" + parseFloat(gasSpent).toFixed(3) + "Ξ`", inline: true },
                                                                            { name: "Total Spent", value: "`" + parseFloat(totalSpent).toFixed(3) + "Ξ`", inline: true },
                                                                            { name: "AVG Buy", value: "`" + `${avgBuy}` + "`", inline: true },
                                                                            { name: "AVG Gas", value: "`" + `${avgGas}` + "`", inline: true },
                                                                            { name: "AVG Total", value: "`" + `${avgTotal}` + "`", inline: true },
                                                                            { name: "Floor Price", value: "`" + `${collectionFp}` + "`", inline: true },
                                                                            { name: "Royalties", value: "`" + `${collectionRoyal}` + "`", inline: true },
                                                                            { name: "NFTs Hold", value: "`" + `${holdCount}` + "`", inline: true },
                                                                            { name: "Total Derisk", value: "`" + `${totalDerisk}` + "`", inline: true },
                                                                            { name: "AVG Derisk", value: "`" + `${avgDerisk}` + "`", inline: true },
                                                                            { name: "ROI", value: `${roiFormatted}`, inline: true },
                                                                            { name: "Links", value: linksFormatted, inline: true },
                                                                        )
                                                                        .setTimestamp()
                                                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });


                                                                    await interaction.editReply({ embeds: [getderiskZeroSelectedWallet] });



                                                                    //On enregistre le call API dans la database
                                                                    const timeStamp = Date.now();
                                                                    for (let i = 0; i < apiObj.getCollectionsV5; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/derisk", apiCallName: "getCollectionsV5", apiProvider: "reservoir", timestamp: timeStamp.toString() }) }
                                                                    for (let i = 0; i < apiObj.getUsersUserCollectionsV2; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/derisk", apiCallName: "getUsersUserCollectionsV2", apiProvider: "reservoir", timestamp: timeStamp.toString() }) }
                                                                    for (let i = 0; i < apiObj.getUsersUserTokensV6; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/derisk", apiCallName: "getUsersUserTokensV6", apiProvider: "reservoir", timestamp: timeStamp.toString() }) }
                                                                    for (let i = 0; i < apiObj.getSalesV4; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/derisk", apiCallName: "getSalesV4", apiProvider: "reservoir", timestamp: timeStamp.toString() }) }
                                                                    for (let i = 0; i < apiObj.getTransaction; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/derisk", apiCallName: "getTransaction", apiProvider: "web3.eth", timestamp: timeStamp.toString() }) }
                                                                    for (let i = 0; i < apiObj.getTransactionReceipt; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/derisk", apiCallName: "getTransactionReceipt", apiProvider: "web3.eth", timestamp: timeStamp.toString() }) }
                                                                    for (let i = 0; i < apiObj.getAllTransfers; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/derisk", apiCallName: "getAllTransfers", apiProvider: "blockspan", timestamp: timeStamp.toString() }) }




                                                                }
                                                            })

                                                    })

                                            } else {

                                                const notMember = new EmbedBuilder().setColor("#060A8F")
                                                    .setTitle("Derisk")
                                                    .setDescription("Aura can't analyze your wallet metrics since you selected an Ethereum collection and a Bitcoin wallet. Please try again selecting both a Bitcoin or Ethereum collection and wallet.")
                                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                                    .setTimestamp()
                                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                                await interaction.editReply({ embeds: [notMember] });


                                            }


                                        } else if (isValidInput) {



                                            if (isBRC20BitcoinWallet(selectedWallet)) {



                                                let collectionName = ""
                                                let collectionLogo = ""
                                                let twitter = ""
                                                let discord = ""
                                                let website = ""

                                                let buySpent = 0
                                                let buyGasSpent = 0
                                                let totalSpent = 0

                                                let holdCount = 0
                                                let royalties = 0
                                                let averageBuyValue = 0
                                                let averageGasValue = 0
                                                let averageTotalBuy = 0
                                                let totalHoldValue = 0
                                                let totalDerisk = 0
                                                let avgDerisk = 0
                                                let roi = 0
                                                let roiFormatted = 0


                                                const walletAddressName = await wallets.findOne({ where: { authorId: authorId, walletAddress: selectedWallet } });
                                                let walletName = selectedWallet
                                                let walletFormatted = "`" + selectedWallet.substring(0, 5) + "..." + selectedWallet.substring(selectedWallet.length - 4, selectedWallet.length) + "`"
                                                if (walletAddressName !== null) {
                                                    walletName = walletAddressName.walletName
                                                    walletFormatted = "`" + walletName + " (" + selectedWallet.substring(0, 5) + "..." + selectedWallet.substring(selectedWallet.length - 4, selectedWallet.length) + ")`"

                                                }





                                                const url = `https://api-mainnet.magiceden.dev/v2/ord/btc/collections/` + selectedCollection;
                                                const response = await axios.get(url, { headers });
                                                const data = await response.data;

                                                collectionLogo = data.imageURI
                                                collectionName = data.name
                                                twitter = data.twitterLink
                                                discord = data.discordLink
                                                website = data.websiteLink


                                                const url2 = `https://api-mainnet.magiceden.dev/v2/ord/btc/stat?collectionSymbol=` + selectedCollection;
                                                const response2 = await axios.get(url2, { headers });
                                                const data2 = await response2.data;


                                                const floorPrice = (data2.floorPrice) / (10 ** 8)


                                                const url3 = `https://api-mainnet.magiceden.dev/v2/ord/btc/tokens?collectionSymbol=` + selectedCollection + `&ownerAddress=` + selectedWallet + `&showAll=true&sortBy=priceAsc`;
                                                const response3 = await axios.get(url3, { headers });
                                                const data3 = await response3.data;


                                                holdCount = (data3.tokens).length
                                                totalHoldValue = floorPrice * holdCount
                                                averageHeldValue = totalHoldValue / holdCount

                                                let tokenHeldId = []
                                                for (const token of data3.tokens) {
                                                    tokenHeldId.push(token.id)
                                                }

                                                console.log("Held :\n" + tokenHeldId)

                                                if (tokenHeldId.length > 0) {


                                                    for (const token of tokenHeldId) {

                                                        //Buy classic
                                                        const tokenBuyLink = `https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=buying_broadcasted&tokenId=` + token
                                                        const tokenBuyCall = await axios.get(tokenBuyLink, { headers });
                                                        const tokenBuy = await tokenBuyCall.data.activities;

                                                        const tokenBuyByWallet = tokenBuy.filter(activity => activity.oldOwner.toLowerCase() !== selectedWallet.toLowerCase() && activity.newOwner.toLowerCase() == selectedWallet.toLowerCase());


                                                        if (tokenBuyByWallet.length > 0) {

                                                            const mempoolCall = await axios.get("https://mempool.space/api/tx/" + tokenBuyByWallet[0].txId)

                                                            buySpent += ((tokenBuyByWallet[0].listedPrice) / (10 ** 8))
                                                            buyGasSpent += mempoolCall.data.fee / (10 ** 8)

                                                        } else {


                                                            //Create
                                                            const tokenCreateLink = `https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=create&tokenId=` + token.tokenInscription
                                                            const tokenCreateCall = await axios.get(tokenCreateLink, { headers });
                                                            const tokenCreate = await tokenCreateCall.data.activities;

                                                            const tokenCreateByWallet = tokenCreate.filter(activity => activity.newOwner.toLowerCase() == selectedWallet.toLowerCase());

                                                            if (tokenCreateByWallet.length > 0) {

                                                                const mempoolCall = await axios.get("https://mempool.space/api/tx/" + tokenBuyByWallet[0].txId)

                                                                buySpent += ((tokenBuyByWallet[0].txValue) / (10 ** 8))
                                                                buyGasSpent += mempoolCall.data.fee / (10 ** 8)

                                                            } else {

                                                                //Mint
                                                                const tokenMintLink = `https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=mint_broadcasted&tokenId=` + token.tokenInscription
                                                                const tokenMintCall = await axios.get(tokenMintLink, { headers });
                                                                const tokenMint = await tokenMintCall.data.activities;

                                                                const tokenMintByWallet = tokenMint.filter(activity => activity.newOwner.toLowerCase() == selectedWallet.toLowerCase());

                                                                if (tokenMintByWallet.length > 0) {

                                                                    const mempoolCall = await axios.get("https://mempool.space/api/tx/" + tokenBuyByWallet[0].txId)

                                                                    buySpent += ((tokenBuyByWallet[0].listedPrice) / (10 ** 8))
                                                                    buyGasSpent += mempoolCall.data.fee / (10 ** 8)

                                                                } else {

                                                                    //Transfert & Airdrop
                                                                    buySpent += 0
                                                                    buyGasSpent += 0

                                                                }
                                                            }

                                                        }





                                                    }
                                                    console.log(buySpent)
                                                    console.log(buyGasSpent)


                                                    totalSpent = buySpent + buyGasSpent
                                                    averageBuyValue = buySpent / holdCount
                                                    averageGasValue = buyGasSpent / holdCount
                                                    averageTotalBuy = (buySpent + buyGasSpent) / holdCount

                                                    royalties = 2

                                                    totalDerisk = (buySpent + buyGasSpent) / (1 - ((royalties / 100 + 0.5) / 100))
                                                    avgDerisk = (((buySpent + buyGasSpent) / (1 - ((royalties / 100 + 0.5) / 100))) / holdCount)
                                                    roi = (((floorPrice - (totalSpent / holdCount)) / (totalSpent / holdCount)) * 100)


                                                    // ROI format Variable
                                                    if (roi !== 0 && totalSpent !== 0 && floorPrice) {

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

                                                    } else if (totalSpent === 0) {

                                                        roiFormatted = "`INFINITY`<a:RCRich:1044762000837840926>"

                                                    }



                                                } else {

                                                    roiFormatted = "`0.00%`"
                                                    royalties = 2

                                                }

                                                console.log(discord)
                                                console.log(twitter)
                                                console.log(website)

                                                let linksFormatted = ""
                                                if (estLienHTTPS(discord) && estLienHTTPS(website)) { linksFormatted = "[magic eden](https://magiceden.io/ordinals/marketplace/" + selectedCollection + ") ∙ " + '[ordinals](https://ordinalswallet.com/collection/' + selectedCollection + ") ∙ " + "[twitter](" + twitter + ") ∙ " + "[discord](" + discord + ") ∙ " + '[website](' + website + ")" }
                                                else if (estLienHTTPS(discord) && !estLienHTTPS(website)) { linksFormatted = "[magic eden](https://magiceden.io/ordinals/marketplace/" + selectedCollection + ") ∙ " + '[ordinals](https://ordinalswallet.com/collection/' + selectedCollection + ") ∙ " + "[twitter](" + twitter + ") ∙ " + "[discord](" + discord + ")" }
                                                else if (!estLienHTTPS(discord) && estLienHTTPS(website)) { linksFormatted = "[magic eden](https://magiceden.io/ordinals/marketplace/" + selectedCollection + ") ∙ " + '[ordinals](https://ordinalswallet.com/collection/' + selectedCollection + ") ∙ " + "[twitter](" + twitter + ") ∙ " + '[website](' + website + ")" }
                                                else { linksFormatted = "[magic eden](https://magiceden.io/ordinals/marketplace/" + selectedCollection + ") ∙ " + '[ordinals](https://ordinalswallet.com/collection/' + selectedCollection + ") ∙ " + "[twitter](" + twitter + ")" }

                                                console.log(collectionLogo)
                                                const getderiskSelectedWallet = new EmbedBuilder().setColor("#060A8F")
                                                    .setTitle(collectionName)
                                                    .setDescription(">>> Derisk data for your wallet `" + walletFormatted + "` on " + collectionName + ".")
                                                    .setThumbnail(collectionLogo)
                                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                                    .addFields(
                                                        { name: "Buy Spent", value: "`" + parseFloat(buySpent).toFixed(3) + "₿`", inline: true },
                                                        { name: "Gas Spent", value: "`" + parseFloat(buyGasSpent).toFixed(3) + "₿`", inline: true },
                                                        { name: "Total Spent", value: "`" + parseFloat(totalSpent).toFixed(3) + "₿`", inline: true },
                                                        { name: "AVG Buy", value: "`" + parseFloat(averageBuyValue).toFixed(3) + "₿`", inline: true },
                                                        { name: "AVG Gas", value: "`" + parseFloat(averageGasValue).toFixed(3) + "₿`", inline: true },
                                                        { name: "AVG Total", value: "`" + parseFloat(averageTotalBuy).toFixed(3) + "₿`", inline: true },
                                                        { name: "Floor Price", value: "`" + parseFloat(floorPrice).toFixed(3) + "₿`", inline: true },
                                                        { name: "Royalties", value: "`" + parseFloat(royalties + 0.5) + "%`", inline: true },
                                                        { name: "NFTs Held", value: "`" + holdCount + "`", inline: true },
                                                        { name: "Total Derisk", value: "`" + parseFloat(totalDerisk).toFixed(3) + "₿`", inline: true },
                                                        { name: "AVG Derisk", value: "`" + parseFloat(avgDerisk).toFixed(3) + "₿`", inline: true },
                                                        { name: "ROI", value: roiFormatted, inline: true },
                                                        { name: "Links", value: linksFormatted, inline: true },
                                                    )
                                                    .setTimestamp()
                                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });


                                                await interaction.editReply({ embeds: [getderiskSelectedWallet] });







                                            } else {

                                                const notMember = new EmbedBuilder().setColor("#060A8F")
                                                    .setTitle("Derisk")
                                                    .setDescription("Aura can't analyze your wallet metrics because you selected a Bitcoin collection and an Ethereum wallet. Please try again selecting both a Bitcoin or Ethereum collection and wallet.")
                                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                                    .setTimestamp()
                                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                                await interaction.editReply({ embeds: [notMember] });


                                            }



                                        } else {

                                            const notMember = new EmbedBuilder().setColor("#060A8F")
                                                .setTitle("Derisk")
                                                .setDescription("The collection you selected isn't valid. Please try again selecting a valid Bitcoin or Ethereum collection. You can also find the desired collection by using the contract address (Ethereum) or Magic Eden ID (Bitcoin).")
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




                    } else if (interaction.options.getSubcommand() === 'txn') {




                        const txn = interaction.options.getString("hash");

                        if (isValidEthereumTxn(txn)) {


                            let selectedCollection = ""
                            let buySpent = 0
                            let buyGasSpent = 0
                            let buyTotal = 0
                            let tokenBought = 0
                            let name = ""
                            let isNFT = true


                            const hashValueReader = await web3.eth.getTransaction(txn)
                            const hashGasReader = await web3.eth.getTransactionReceipt(txn)
                            buyGasSpent += (parseFloat(web3.utils.fromWei(((hashValueReader.gasPrice) * (hashGasReader.gasUsed)).toString(), 'ether')))


                            await sdk3.getTransfersV3({
                                txHash: txn,
                                accept: '*/*'
                            }).then(async ({ data }) => {

                                if (data.transfers.length > 0) {

                                    for (const token of data.transfers) {



                                        let collection = token.token.contract
                                        let tokenId = token.token.tokenId
                                        let selectedWallet = token.to

                                        selectedCollection = token.token.contract
                                        tokenBought = data.transfers.length
                                        name = token.token.collection.name



                                        const { data: userBuy } = await alchemy2.getNFTSales({
                                            fromBlock: '0',
                                            toBlock: 'latest',
                                            order: 'desc',
                                            contractAddress: collection,
                                            tokenId: tokenId,
                                            buyerAddress: selectedWallet,
                                            limit: '1000',
                                            apiKey: alchemyApiKey
                                        })



                                        let sellerFee = 0
                                        let royaltyFee = 0
                                        let protocolFee = 0

                                        if (userBuy.nftSales.length > 0) {

                                            sellerFee = parseFloat(userBuy.nftSales[0].sellerFee.amount / (10 ** 18))
                                            if (userBuy.nftSales[0].royaltyFee.amount) { royaltyFee = parseFloat(userBuy.nftSales[0].royaltyFee.amount / (10 ** 18)) }
                                            if (userBuy.nftSales[0].protocolFee.amount) { protocolFee = parseFloat(userBuy.nftSales[0].protocolFee.amount / (10 ** 18)) }
                                            let totalBuyPrice = parseFloat(sellerFee + royaltyFee + protocolFee)

                                            buySpent += totalBuyPrice


                                        } else {

                                            const { data: mintInfos } = await
                                                sdk.getSalesV4({
                                                    token: collection + '%3A' + tokenId,
                                                    limit: '100',
                                                    accept: '*/*'
                                                })

                                            const filteredMint = mintInfos.sales.filter(sale => (sale.to).toLowerCase() == selectedWallet.toLowerCase() && sale.orderKind === "mint");

                                            if (filteredMint.length > 0) {

                                                let totalBuyPrice = parseFloat(filteredMint[0].price.amount.native).toFixed(3)

                                                buySpent += totalBuyPrice



                                            }
                                        }




                                    }

                                } else {

                                    isNFT = false

                                }


                            })

                            if (isNFT == true) {

                                let royalties = ""
                                let collectionRoyal = ""
                                let collectionSlug = ""
                                let collectionBanner = ""
                                let collectionTwitter = ""
                                let collectionWebsite = ""



                                // Premier Call API Reservoir : Stats et infos sur la collection
                                sdk.getCollectionsV5({ id: selectedCollection, accept: '*/*' })
                                    .then(async ({ data: collectionStats }) => {

                                        royalties = collectionStats.collections[0].royalties.bps
                                        collectionRoyal = parseFloat(royalties / 100 + 0.5).toFixed(2) + "%"
                                        collectionSlug = collectionStats.collections[0].slug
                                        collectionBanner = collectionStats.collections[0].banner
                                        collectionTwitter = collectionStats.collections[0].twitterUsername
                                        collectionWebsite = collectionStats.collections[0].externalUrl





                                        buySpent = buySpent
                                        gasSpent = buyGasSpent
                                        buyTotal = (buyGasSpent + buySpent)
                                        totalDerisk = ((buyGasSpent + buySpent) / (1 - ((royalties / 100 + 0.5) / 100))).toFixed(3) + "Ξ"
                                        avgDerisk = parseFloat(((buyGasSpent + buySpent) / (1 - ((royalties / 100 + 0.5) / 100))) / tokenBought).toFixed(3) + "Ξ"


                                        let linksFormatted = ""
                                        if (isHttps(collectionWebsite) && collectionTwitter !== null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + selectedCollection + ") ∙ " + '[magically](https://magically.gg/collection/' + selectedCollection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + selectedCollection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ") ∙ " + '[website](' + collectionWebsite + ")" }
                                        else if (!isHttps(collectionWebsite) && collectionTwitter !== null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + selectedCollection + ") ∙ " + '[magically](https://magically.gg/collection/' + selectedCollection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + selectedCollection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ")" }
                                        else if (isHttps(collectionWebsite) && collectionTwitter == null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + selectedCollection + ") ∙ " + '[magically](https://magically.gg/collection/' + selectedCollection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + selectedCollection + ") ∙ " + '[website](' + collectionWebsite + ")" }
                                        else { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + selectedCollection + ") ∙ " + '[magically](https://magically.gg/collection/' + selectedCollection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + selectedCollection + ")" }
                    



                                        const getderiskSelectedWallet = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle(name)
                                            .setDescription(">>> Derisk data for the provided transaction")
                                            .setImage(collectionBanner)
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .addFields(
                                                { name: "Txn", value: "`" + txn.toLowerCase() + "`", inline: false },
                                                { name: "Buy Spent", value: "`" + parseFloat(buySpent).toFixed(3) + "`", inline: true },
                                                { name: "Gas Spent", value: "`" + parseFloat(gasSpent).toFixed(3) + "`", inline: true },
                                                { name: "Total Spent", value: "`" + parseFloat(buyTotal).toFixed(3) + "`", inline: true },
                                                { name: "Total Derisk", value: "`" + totalDerisk + "`", inline: true },
                                                { name: "Avg. Derisk", value: "`" + avgDerisk + "`", inline: true },
                                                { name: "Royalties", value: "`" + collectionRoyal + "`", inline: true },
                                                { name: "Links", value: linksFormatted, inline: true },

                                            )
                                            .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });


                                        await interaction.editReply({ embeds: [getderiskSelectedWallet] });

                                    })


                            } else {

                                const availableInTheNearFuture = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle(`Derisk Txn`)
                                    .setDescription("Aura can't analyze the transaction derisk metrics because your transaction doesn't contain any NFT. Please try again with an appropriate transaction.")
                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setTimestamp()
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                await interaction.editReply({ embeds: [availableInTheNearFuture] });


                            }

                        } else {

                            const availableInTheNearFuture = new EmbedBuilder().setColor("#060A8F")
                                .setTitle(`Derisk Txn`)
                                .setDescription("Aura can't analyze your transaction because it's not an Ethereum one. Bitcoin derisk data and all our other features are only available to Aura subscribers. To get a subscription, go here : <#1108757700885622784>")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setTimestamp()
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                            await interaction.editReply({ embeds: [availableInTheNearFuture] });




                        }
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
                let reportCommand = "/derisk"

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

