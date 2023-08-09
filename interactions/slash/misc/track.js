/**
 * @file Sample setwallet command with slash command.
 * @author VitalityMigo
 */

// On définit des constantes qui serviront dans l'ensemble de la commande
const { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const moment = require('moment');
const csv = require('fast-csv');

const getTimeAgo = require("../../../functions/timeago")


const { profileData, accessSql, apimonitorsql, wallets, reportsql, adminsql, usersql, interactionData, watchlistSql, sequelize } = require('../../../events/database');
const fs = require('fs');




//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const reservoirApiKey = process.env.reservoirApiKey
const magicedenApiKey = process.env.magicedenApiKey
const etherscanApiKey = process.env.etherscanApiKey
const alchemyApiKey = process.env.alchemyApiKey


//Web3 API + Cloudfare Provider
var Web3 = require("web3")
const web3 = new Web3("https://cloudflare-eth.com")

//Reservoir API
const sdk = require('api')('@reservoirprotocol/v2.0#2672bklexdpsbi');
sdk.auth(reservoirApiKey);
//;

const sdk2 = require('api')('@reservoirprotocol/v3.0#434y7jljnak92y');
sdk2.auth(reservoirApiKey);

const sdk3 = require('api')('@reservoirprotocol/v3.0#1im010ljszuoex');
sdk3.auth(reservoirApiKey);

const { Network, Alchemy } = require('alchemy-sdk')
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


const axios = require('axios');
const { embed } = require("bitcoinjs-lib/src/payments");


function isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}


function isBRC20BitcoinWallet(wallet) {
    const regex = /^bc1[a-zA-Z0-9]{39,59}$/;

    return regex.test(wallet);
}

function isValidInput(input) {
    return /^(\w+|-)+$/.test(input);
}

function formatString(inputString) {
    if (inputString.length <= 17) {
        return inputString;
    } else {
        return inputString.slice(0, 20) + '...';
    }
}

function formatBTCWallet(input) {
    return input.length > 42 ? `${input.substring(0, 19)}...${input.substring(input.length - 20)}` : input;
}

function formatTokenId(inputString) {
    if (inputString.length <= 5) {
        return inputString;
    } else {
        return inputString.slice(0, 5) + '.';
    }
}


module.exports = {
    data: new SlashCommandBuilder()
        .setName("track")
        .setDescription("Track your trades, mint, tokens and more.")
        .addSubcommand(subcommand =>
            subcommand
                .setName("tokens")
                .setDescription("Display your tokens for a given collection accross your wallet(s)")
                .addStringOption(option =>
                    option
                        .setName("collection")
                        .setDescription("The collection to analyze")
                        .setRequired(true)
                        .setAutocomplete(true)
                    //)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("mints")
                .setDescription("Display your last mints made on your wallet(s)")
                .addStringOption(option =>
                    option
                        .setName("wallet")
                        .setDescription("The wallet you'd like to track")
                        .setRequired(true)
                        .setAutocomplete(true)
                    //)
                ),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("trades")
                .setDescription("Display your last closed position summary")
                .addStringOption(option =>
                    option
                        .setName("wallet")
                        .setDescription("The wallet you'd like to track")
                        .setRequired(true)
                        .setAutocomplete(true)
                    //)
                ),
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
                    const timeStamp1 = Date.now();
                    const actualTimestamp1 = parseFloat(timeStamp1 / 1000).toFixed(0)
                    const isUser = await usersql.findOne({ where: { userId: authorId, serverId: serverId } })
                    if (isUser == null) { await usersql.create({ userId: authorId, userName: authorName, userAvatar: userAvatar, serverId: serverId, timestamp: actualTimestamp1 }) }


                    if (interaction.options.getSubcommand() === 'trades') {









                        const selectedWallet = interaction.options.getString("wallet");

                        if (selectedWallet.toLowerCase() !== 'all') {



                            const buttonsRow = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('tracktradesByDate-button')
                                        .setLabel('sort by date')
                                        .setStyle(1),
                                    new ButtonBuilder()
                                        .setCustomId('tracktradesByProfit-button')
                                        .setLabel('sort by profit')
                                        .setStyle(2),
                                    new ButtonBuilder()
                                        .setCustomId('tracktradesByROI-button')
                                        .setLabel('sort by ROI')
                                        .setStyle(2),
                                    new ButtonBuilder()
                                        .setCustomId('tracktradesByabc-button')
                                        .setLabel('sort by abc')
                                        .setStyle(2)
                                );

                            const buttonsRowNo = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('tracktradesByDate-button')
                                        .setLabel('sort by date')
                                        .setStyle(2)
                                        .setDisabled(true),
                                    new ButtonBuilder()
                                        .setCustomId('tracktradesByProfit-button')
                                        .setLabel('sort by profit')
                                        .setStyle(2)
                                        .setDisabled(true),
                                    new ButtonBuilder()
                                        .setCustomId('tracktradesByROI-button')
                                        .setLabel('sort by ROI')
                                        .setStyle(2)
                                        .setDisabled(true),
                                    new ButtonBuilder()
                                        .setCustomId('tracktradesByabc-button')
                                        .setLabel('sort by abc')
                                        .setStyle(2)
                                        .setDisabled(true),
                                );


                            if (isValidEthereumAddress(selectedWallet)) {

                                const walletAddressName = await wallets.findOne({ where: { authorId: authorId, walletAddress: selectedWallet } });
                                let walletName = selectedWallet
                                let walletFormatted = "`" + selectedWallet.substring(0, 5) + "..." + selectedWallet.substring(selectedWallet.length - 4, selectedWallet.length) + "`"
                                if (walletAddressName !== null) {
                                    walletName = walletAddressName.walletName
                                    walletFormatted = "`" + walletName + " (" + selectedWallet.substring(0, 5) + "..." + selectedWallet.substring(selectedWallet.length - 4, selectedWallet.length) + ")`"

                                }



                                //Récupère le prix de l'ETH
                                const ethCallPrice = await axios.get('https://api.etherscan.io/api?module=stats&action=ethprice&apikey=' + etherscanApiKey)
                                let ethusdtPrice = ethCallPrice.data.result.ethusd



                                let holdingTable = []
                                let flipOverview = ""
                                let collectionTable = []
                                let roiTotal = 0
                                let averageRoi = 0
                                let totalProfit = 0
                                let flipCount = 0
                                let averageProfit = 0



                                await sdk2.getUsersActivityV6({ users: selectedWallet, limit: '200', sortBy: 'eventTimestamp', includeMetadata: 'false', types: 'sale', accept: '*/*' })
                                    .then(async ({ data }) => {


                                        const filteredTable = data.activities.filter(activity => activity.fromAddress.toLowerCase() == selectedWallet.toLowerCase() && activity.toAddress.toLowerCase() !== selectedWallet.toLowerCase());

                                        // console.log(data.activities)
                                        // console.log("\n\n\n")

                                        let index = 0


                                        for (const token of filteredTable) {

                                            index++

                                            if (index <= 13) {

                                                let collection = "Unknow"

                                                await sdk3.getCollectionsV6({ id: token.collection.collectionId, accept: '*/*' })
                                                    .then(async ({ data: collectionData }) => {

                                                        collection = await collectionData.collections[0].name

                                                    })

                                                let obj = {}
                                                obj.collection = token.collection.collectionId
                                                obj.collectionName = collection
                                                obj.tokenId = token.token.tokenId
                                                obj.priceBuy = token.price.amount.decimal
                                                obj.hash = token.txHash
                                                obj.timestamp = token.timestamp
                                                holdingTable.push(obj)




                                            } else {
                                                break
                                            }

                                        }


                                        holdingTable.sort((a, b) => b.timestamp - a.timestamp);

                                        //console.log(holdingTable)

                                        let summaryTable = []

                                        for (const token of holdingTable) {

                                            let priceSell = token.priceBuy
                                            let tokenId = token.tokenId
                                            let collection = token.collection
                                            let collectionName = token.collectionName
                                            let hash = token.hash
                                            let timestamp = token.timestamp



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

                                            //console.log(userBuy)

                                            let obj = {}
                                            obj.name = collectionName
                                            obj.token = tokenId
                                            obj.timestamp = timestamp


                                            let sellerFee = 0
                                            let royaltyFee = 0
                                            let protocolFee = 0

                                            if (userBuy.nftSales.length > 0) {
                                                sellerFee = parseFloat(userBuy.nftSales[0].sellerFee.amount / (10 ** 18))
                                                if (userBuy.nftSales[0].royaltyFee.amount) { royaltyFee = parseFloat(userBuy.nftSales[0].royaltyFee.amount / (10 ** 18)) }
                                                if (userBuy.nftSales[0].protocolFee.amount) { protocolFee = parseFloat(userBuy.nftSales[0].protocolFee.amount / (10 ** 18)) }
                                                let totalBuyPrice = parseFloat(sellerFee + royaltyFee + protocolFee)

                                                console.log(collectionName + " / " + tokenId + " / " + totalBuyPrice + " ------> " + collection)
                                                //console.log(userBuy.nftSales[0].sellerFee)
                                                obj.profit = parseFloat(priceSell - totalBuyPrice).toFixed(3)
                                                obj.roi = parseFloat(((priceSell - totalBuyPrice) / totalBuyPrice) * 100).toFixed(2)

                                                roiTotal += ((priceSell - totalBuyPrice) / totalBuyPrice) * 100
                                                totalProfit += priceSell - totalBuyPrice

                                            } else {

                                                const { data: mintInfos } = await
                                                    sdk.getSalesV4({
                                                        token: collection + '%3A' + tokenId,
                                                        limit: '100',
                                                        accept: '*/*'
                                                    })

                                                const filteredMint = mintInfos.sales.filter(sale => (sale.to).toLowerCase() == selectedWallet.toLowerCase() && sale.orderKind === "mint");

                                                if (filteredMint.length > 0) {

                                                    console.log(collectionName)
                                                    console.log(filteredMint)

                                                    let totalBuyPrice = parseFloat(filteredMint[0].price.amount.native).toFixed(3)
                                                    obj.profit = parseFloat(priceSell - totalBuyPrice).toFixed(3)
                                                    obj.roi = parseFloat(((priceSell - totalBuyPrice) / totalBuyPrice) * 100).toFixed(2)

                                                    roiTotal += ((priceSell - totalBuyPrice) / totalBuyPrice) * 100
                                                    totalProfit += priceSell - totalBuyPrice

                                                    console.log()


                                                } else {

                                                    obj.profit = parseFloat(priceSell).toFixed(3)
                                                    obj.roi = 100

                                                    roiTotal += 100
                                                    totalProfit += priceSell


                                                }
                                            }


                                            if (!collectionTable.includes(collection.toLowerCase())) { collectionTable.push(collection.toLowerCase()) }

                                            summaryTable.push(obj)


                                        }

                                        console.log(summaryTable)

                                        for (const flip of summaryTable) {




                                            let collection = flip.name
                                            let tokenId = flip.token
                                            let profit = flip.profit
                                            let roi = flip.roi
                                            let timestamp = flip.timestamp

                                            let profitFormatted = profit
                                            let roiFormatted = roi

                                            if (profit) {
                                                if (profit > 0) {
                                                    roiFormatted = "+" + roi
                                                }

                                            } else if (!profit) {
                                                profitFormatted = "0.000"
                                            }

                                            if (!roi) {
                                                roiFormatted = "0.00"
                                            }


                                            let lignMaxSize = 70
                                            let leftPartNfts = "`" + formatString(collection) + " (#" + tokenId + ")"
                                            let rightPartNfts = profitFormatted + "Ξ • " + roiFormatted + "% • " + getTimeAgo(timestamp) + "`\n"
                                            let leftPartNFTsLenght = leftPartNfts.length
                                            let rightPartNftsLenght = rightPartNfts.length
                                            let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                                            let spaceLenght = ""
                                            for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }


                                            flipOverview += leftPartNfts + spaceLenght + rightPartNfts


                                            flipCount++


                                        }


                                        collectionCount = collectionTable.length
                                        averageProfit = parseFloat(totalProfit / flipCount).toFixed(3)
                                        averageRoi = parseFloat(roiTotal / flipCount).toFixed(3)

                                        let isNoMint = false
                                        if (flipOverview == "") {
                                            flipOverview = "```No recent trade found                                   ```"

                                            isNoMint = true
                                            averageProfit = "0"
                                            averageRoi = "0.00"
                                        }



                                        if (averageRoi > 0) {
                                            averageRoi = "+" + averageRoi
                                        }





                                        const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle("Mint Tracker")
                                            .setDescription(">>> Display your last closed position on a specific wallet.")
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setTimestamp()
                                            .addFields(
                                                { name: "Wallet", value: walletFormatted, inline: false },
                                                { name: "Collection Count", value: "`" + collectionCount + " collection(s)`", inline: false },
                                                { name: "Total Profit", value: "`" + parseFloat(totalProfit).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(totalProfit * ethusdtPrice).toFixed(0)) + "$)`", inline: true },
                                                { name: "Avg. Profit", value: "`" + parseFloat(averageProfit).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(averageProfit * ethusdtPrice).toFixed(0)) + "$)`", inline: true },
                                                { name: "Avg. ROI", value: "`" + averageRoi + "%`", inline: true },
                                                { name: "Mints:", value: flipOverview, inline: false },

                                            )
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })



                                        if (isNoMint == true) { await interaction.editReply({ embeds: [gasTrackerEmbed], components: [buttonsRowNo] }) }
                                        else {

                                            await interaction.editReply({ embeds: [gasTrackerEmbed], components: [buttonsRow] })




                                            let embedInfos = []
                                            let object = {}
                                            object.ethusdtPrice = ethusdtPrice
                                            object.walletFormatted = walletFormatted
                                            object.collectionCount = collectionCount
                                            object.totalProfit = totalProfit
                                            object.averageProfit = averageProfit
                                            object.averageRoi = averageRoi
                                            embedInfos.push(object)



                                            //On fait le call à la base SQL
                                            await interactionData.destroy({ where: { authorId: authorId, commandName: "tracktrades", serverId: serverId } })

                                            await interactionData.create({

                                                authorId: authorId,
                                                authorName: authorName,
                                                serverId: serverId,
                                                commandName: "tracktrades",
                                                interactionId: interaction.id,
                                                walletAddress: selectedWallet,
                                                walletCategory: "eth",
                                                embed1: JSON.stringify(summaryTable),
                                                embed2: JSON.stringify(embedInfos),
                                                embed3: "N/A",

                                            })
                                        }

                                    }).catch(async err => {

                                        const notMember = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle(`Token Tracker`)
                                            .setDescription("Aura can't analyze your wallet's data because the wallet you provided isn't active. Please use try again using an active wallet.")
                                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                        await interaction.editReply({ embeds: [notMember] });



                                    });



                            } else if (isBRC20BitcoinWallet(selectedWallet)) {


                                const walletAddressName = await wallets.findOne({ where: { authorId: authorId, walletAddress: selectedWallet } });
                                let walletName = selectedWallet
                                let walletFormatted = "`" + selectedWallet.substring(0, 5) + "..." + selectedWallet.substring(selectedWallet.length - 4, selectedWallet.length) + "`"
                                if (walletAddressName !== null) {
                                    walletName = walletAddressName.walletName
                                    walletFormatted = "`" + walletName + " (" + selectedWallet.substring(0, 5) + "..." + selectedWallet.substring(selectedWallet.length - 4, selectedWallet.length) + ")`"

                                }



                                const btcCallPrice = await axios.get("https://blockchain.info/q/24hrprice")
                                let BTCUsdPrice = btcCallPrice.data



                                let holdingTable = []
                                let flipOverview = ""
                                let collectionTable = []
                                let roiTotal = 0
                                let averageRoi = 0
                                let totalProfit = 0
                                let flipCount = 0
                                let averageProfit = 0



                                const recentSalesLink = `https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=buying_broadcasted&ownerAddress=` + selectedWallet
                                const recentSalesCall = await axios.get(recentSalesLink, { headers });
                                const recentSales = await recentSalesCall.data.activities;

                                const filteredTable = recentSales.filter(activity => activity.oldOwner.toLowerCase() == selectedWallet.toLowerCase() && activity.newOwner.toLowerCase() !== selectedWallet.toLowerCase());


                                let index = 0

                                for (const token of filteredTable) {

                                    index++

                                    if (index <= 13) {

                                        if (token.collectionSymbol) {


                                            let obj = {}
                                            obj.name = token.collectionSymbol
                                            obj.collectionName = token.collection.name
                                            obj.tokenId = token.token.inscriptionNumber
                                            obj.tokenInscription = token.tokenId
                                            obj.priceSell = token.listedPrice / (10 ** 8)
                                            obj.hash = token.txId
                                            obj.timestamp = (Date.parse(token.createdAt)) / 1000;
                                            holdingTable.push(obj)


                                        }

                                    } else {
                                        break
                                    }

                                }

                                holdingTable.sort((a, b) => b.timestamp - a.timestamp);




                                let summaryTable = []
                                for (const token of holdingTable) {


                                    const tokenBuyLink = `https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=buying_broadcasted&tokenId=` + token.tokenInscription
                                    const tokenBuyCall = await axios.get(tokenBuyLink, { headers });
                                    const tokenBuy = await tokenBuyCall.data.activities;

                                    const tokenBuyByWallet = tokenBuy.filter(activity => activity.oldOwner.toLowerCase() !== selectedWallet.toLowerCase() && activity.newOwner.toLowerCase() == selectedWallet.toLowerCase());

                                    let collection = token.name


                                    if (!collectionTable.includes(collection.toLowerCase())) { collectionTable.push(collection.toLowerCase()) }

                                    if (tokenBuyByWallet.length > 0) {



                                        let obj = {}
                                        obj.name = token.collectionName
                                        obj.token = token.tokenId
                                        obj.timestamp = token.timestamp
                                        obj.profit = parseFloat(token.priceSell - ((tokenBuyByWallet[0].listedPrice) / (10 ** 8))).toFixed(3)
                                        obj.roi = parseFloat(((token.priceSell - ((tokenBuyByWallet[0].listedPrice) / (10 ** 8))) / ((tokenBuyByWallet[0].listedPrice) / (10 ** 8))) * 100).toFixed(2)
                                        summaryTable.push(obj)

                                        roiTotal += ((token.priceSell - ((tokenBuyByWallet[0].listedPrice) / (10 ** 8))) / ((tokenBuyByWallet[0].listedPrice) / (10 ** 8))) * 100
                                        totalProfit += token.priceSell - ((tokenBuyByWallet[0].listedPrice) / (10 ** 8))


                                    } else {



                                        const tokenCreateLink = `https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=create&tokenId=` + token.tokenInscription
                                        const tokenCreateCall = await axios.get(tokenCreateLink, { headers });
                                        const tokenCreate = await tokenCreateCall.data.activities;

                                        const tokenCreateByWallet = tokenCreate.filter(activity => activity.newOwner.toLowerCase() == selectedWallet.toLowerCase());

                                        if (tokenCreateByWallet.length > 0) {



                                            let obj = {}
                                            obj.name = token.name
                                            obj.token = token.tokenId
                                            obj.timestamp = token.timestamp
                                            obj.profit = parseFloat(token.priceSell - ((tokenCreateByWallet[0].txValue) / (10 ** 8))).toFixed(3)
                                            obj.roi = parseFloat(((token.priceSell - ((tokenCreateByWallet[0].txValue) / (10 ** 8))) / ((tokenCreateByWallet[0].txValue) / (10 ** 8))) * 100).toFixed(2)
                                            summaryTable.push(obj)

                                            roiTotal += ((token.priceSell - ((tokenCreateByWallet[0].txValue) / (10 ** 8))) / ((tokenCreateByWallet[0].txValue) / (10 ** 8))) * 100
                                            totalProfit += token.priceSell - ((tokenCreateByWallet[0].txValue) / (10 ** 8))




                                        } else {

                                            const tokenMintLink = `https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=mint_broadcasted&tokenId=` + token.tokenInscription
                                            const tokenMintCall = await axios.get(tokenMintLink, { headers });
                                            const tokenMint = await tokenMintCall.data.activities;

                                            const tokenMintByWallet = tokenMint.filter(activity => activity.newOwner.toLowerCase() == selectedWallet.toLowerCase());

                                            if (tokenMintByWallet.length > 0) {


                                                let obj = {}
                                                obj.name = token.name
                                                obj.token = token.tokenId
                                                obj.timestamp = token.timestamp
                                                obj.profit = parseFloat(token.priceSell - ((tokenMintByWallet[0].listedPrice) / (10 ** 8))).toFixed(3)
                                                obj.roi = parseFloat(((token.priceSell - ((tokenMintByWallet[0].listedPrice) / (10 ** 8))) / ((tokenMintByWallet[0].listedPrice) / (10 ** 8))) * 100).toFixed(2)
                                                summaryTable.push(obj)

                                                roiTotal += ((token.priceSell - ((tokenMintByWallet[0].listedPrice) / (10 ** 8))) / ((tokenMintByWallet[0].listedPrice) / (10 ** 8))) * 100
                                                totalProfit += token.priceSell - ((tokenMintByWallet[0].listedPrice) / (10 ** 8))



                                            } else {


                                                let obj = {}
                                                obj.name = token.name
                                                obj.token = token.tokenId
                                                obj.timestamp = token.timestamp
                                                obj.profit = token.priceSell
                                                obj.roi = 100
                                                summaryTable.push(obj)

                                                roiTotal += 100
                                                totalProfit += token.priceSell






                                            }
                                        }

                                    }
                                }


                                for (const flip of summaryTable) {




                                    let collection = flip.name
                                    let tokenId = flip.token
                                    let profit = flip.profit
                                    let roi = flip.roi
                                    let timestamp = flip.timestamp

                                    let profitFormatted = profit
                                    let roiFormatted = roi

                                    if (profit) {
                                        if (parseFloat(profit).toFixed(3) > 0) {
                                            roiFormatted = "+" + roi
                                        }

                                    } else if (!profit) {
                                        profitFormatted = "0.000"
                                    }

                                    if (!roi) {
                                        roiFormatted = "0.00"
                                    }


                                    let lignMaxSize = 70
                                    let leftPartNfts = "`" + formatString(collection) + " (#" + tokenId + ")"
                                    let rightPartNfts = profitFormatted + "₿ • " + roiFormatted + "% • " + getTimeAgo(timestamp) + "`\n"
                                    let leftPartNFTsLenght = leftPartNfts.length
                                    let rightPartNftsLenght = rightPartNfts.length
                                    let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                                    let spaceLenght = ""
                                    for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }


                                    flipOverview += leftPartNfts + spaceLenght + rightPartNfts


                                    flipCount++


                                }


                                collectionCount = collectionTable.length
                                averageProfit = parseFloat(totalProfit / flipCount).toFixed(3)
                                averageRoi = parseFloat(roiTotal / flipCount).toFixed(3)







                                let isNoMint = false
                                if (flipOverview == "") {
                                    flipOverview = "```No recent trade found                                   ```"

                                    isNoMint = true
                                    averageProfit = "0"
                                    averageRoi = "0.00"
                                }



                                if (averageRoi > 0) {
                                    averageRoi = "+" + averageRoi
                                }



                                const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Mint Tracker")
                                    .setDescription(">>> Display your last closed position on a specific wallet.")
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setTimestamp()
                                    .addFields(
                                        { name: "Wallet", value: walletFormatted, inline: false },
                                        { name: "Collection Count", value: "`" + collectionCount + " collection(s)`", inline: false },
                                        { name: "Total Profit", value: "`" + parseFloat(totalProfit).toFixed(3) + "₿ (" + new Intl.NumberFormat('en-US').format(parseFloat(totalProfit * BTCUsdPrice).toFixed(0)) + "$)`", inline: true },
                                        { name: "Avg. Profit", value: "`" + parseFloat(averageProfit).toFixed(3) + "₿ (" + new Intl.NumberFormat('en-US').format(parseFloat(averageProfit * BTCUsdPrice).toFixed(0)) + "$)`", inline: true },
                                        { name: "Avg. ROI", value: "`" + averageRoi + "%`", inline: true },
                                        { name: "Mints:", value: flipOverview, inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                console.log(isNoMint)

                                try {
                                    if (isNoMint == true) { await interaction.editReply({ embeds: [gasTrackerEmbed], components: [buttonsRowNo] }) }
                                    else {

                                        await interaction.editReply({ embeds: [gasTrackerEmbed], components: [buttonsRow] })




                                        let embedInfos = []
                                        let object = {}
                                        object.BTCUsdPrice = BTCUsdPrice
                                        object.walletFormatted = walletFormatted
                                        object.collectionCount = collectionCount
                                        object.totalProfit = totalProfit
                                        object.averageProfit = averageProfit
                                        object.averageRoi = averageRoi
                                        embedInfos.push(object)


                                        //On fait le call à la base SQL
                                        await interactionData.destroy({ where: { authorId: authorId, commandName: "tracktrades", serverId: serverId } })

                                        await interactionData.create({

                                            authorId: authorId,
                                            authorName: authorName,
                                            serverId: serverId,
                                            commandName: "tracktrades",
                                            interactionId: interaction.id,
                                            walletAddress: selectedWallet,
                                            walletCategory: "btc",
                                            embed1: JSON.stringify(summaryTable),
                                            embed2: JSON.stringify(embedInfos),
                                            embed3: "N/A",

                                        })


                                    }

                                } catch (error) {


                                    const notMember = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle(`Token Tracker`)
                                        .setDescription("Aura can't analyze your wallet's data because the wallet you provided isn't active. Please use try again using an active wallet.")
                                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                    await interaction.editReply({ embeds: [notMember] });


                                }

                            } else {

                                const notMember = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle(`Token Tracker`)
                                    .setDescription("Aura can't analyze your wallet's data because the wallet you provided isn't valid. Please use try again using the appropriate form.")
                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setTimestamp()
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                await interaction.editReply({ embeds: [notMember] });



                            }
                        } else if (selectedWallet.toLowerCase() == 'all') {




                        }







                    } else if (interaction.options.getSubcommand() === 'mints') {


                        const selectedWallet = interaction.options.getString("wallet");




                        if (selectedWallet.toLowerCase() !== 'all') {

                            const walletAddressName = await wallets.findOne({ where: { authorId: authorId, walletAddress: selectedWallet } });
                            let walletName = selectedWallet
                            let walletFormatted = "`" + selectedWallet.substring(0, 5) + "..." + selectedWallet.substring(selectedWallet.length - 4, selectedWallet.length) + "`"
                            if (walletAddressName !== null) {
                                walletName = walletAddressName.walletName
                                walletFormatted = "`" + walletName + " (" + selectedWallet.substring(0, 5) + "..." + selectedWallet.substring(selectedWallet.length - 4, selectedWallet.length) + ")`"

                            }


                            if (isValidEthereumAddress(selectedWallet)) {

                                //On construit les bouttons
                                const buttonEth = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('trackmintETHbydate-button')
                                            .setLabel('sort by date')
                                            .setStyle(1),
                                        new ButtonBuilder()
                                            .setCustomId('trackmintETHbyprice-button')
                                            .setLabel('sort by price')
                                            .setStyle(2),
                                        new ButtonBuilder()
                                            .setCustomId('trackmintETHbygas-button')
                                            .setLabel('sort by gas')
                                            .setStyle(2),
                                        new ButtonBuilder()
                                            .setCustomId('trackmintETHbyabc-button')
                                            .setLabel('sort by abc')
                                            .setStyle(2),

                                    )

                                //On construit les bouttons
                                const buttonEthNo = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('trackmintETHbydate-button')
                                            .setLabel('sort by date')
                                            .setStyle(2)
                                            .setDisabled(true),
                                        new ButtonBuilder()
                                            .setCustomId('trackmintETHbyprice-button')
                                            .setLabel('sort by price')
                                            .setStyle(2)
                                            .setDisabled(true),
                                        new ButtonBuilder()
                                            .setCustomId('trackmintETHbygas-button')
                                            .setLabel('sort by gas')
                                            .setStyle(2)
                                            .setDisabled(true),
                                        new ButtonBuilder()
                                            .setCustomId('trackmintETHbyabc-button')
                                            .setLabel('sort by abc')
                                            .setStyle(2)
                                            .setDisabled(true),


                                    )


                                //Récupère le prix de l'ETH
                                const ethCallPrice = await axios.get('https://api.etherscan.io/api?module=stats&action=ethprice&apikey=' + etherscanApiKey)
                                let ethusdtPrice = ethCallPrice.data.result.ethusd



                                let mintsOverview = ""
                                let totalMintCost = 0
                                let collectionTable = []
                                let tokenTable = []
                                let index = 0




                                await sdk2.getUsersActivityV6({ users: selectedWallet, limit: '20', sortBy: 'eventTimestamp', types: 'mint', accept: '*/*' })
                                    .then(async ({ data }) => {


                                        for (const mint of data.activities) {



                                            let txnHash = mint.txHash
                                            const hashGasReader = await web3.eth.getTransaction(txnHash)


                                            if ((hashGasReader.from).toLowerCase() == selectedWallet.toLowerCase()) {


                                                index++

                                                if (index <= 13) {




                                                    let price = 0
                                                    if (mint.price) { price = mint.price.amount.decimal }
                                                    else { price = 0 }

                                                    let timestamp = mint.timestamp
                                                    let tokenId = formatTokenId(mint.token.tokenId)
                                                    let collection = mint.collection.collectionName
                                                    let collectionAddress = mint.collection.collectionId

                                                    let gasUsed = (parseFloat(hashGasReader.gasPrice / (10 ** 9)))



                                                    let lignMaxSize = 70
                                                    let leftPartNfts = "`" + formatString(collection) + " (#" + tokenId + ")"
                                                    let rightPartNfts = parseFloat(price).toFixed(3) + "Ξ • " + parseFloat(gasUsed).toFixed(0) + " gwei • " + getTimeAgo(timestamp) + "`\n"
                                                    let leftPartNFTsLenght = leftPartNfts.length
                                                    let rightPartNftsLenght = rightPartNfts.length
                                                    let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                                                    let spaceLenght = ""
                                                    for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }


                                                    mintsOverview += leftPartNfts + spaceLenght + rightPartNfts


                                                    totalMintCost += price
                                                    if (!collectionTable.includes(collectionAddress)) { collectionTable.push(collectionAddress) }

                                                    let obj = {}
                                                    obj.collection = collection
                                                    obj.price = price
                                                    obj.txnHash = txnHash
                                                    obj.timestamp = timestamp
                                                    obj.collectionAddress = collectionAddress
                                                    obj.tokenId = tokenId
                                                    obj.gasUsed = gasUsed
                                                    obj.eth = ethusdtPrice
                                                    obj.walletFormatted = walletFormatted

                                                    tokenTable.push(obj)




                                                }
                                            }

                                        }








                                        let avgMintCost = totalMintCost / index
                                        let collectionCount = collectionTable.length

                                        let isNoMint = false
                                        if (mintsOverview == "") {
                                            mintsOverview = "```No recent mint founds                                    ```"

                                            isNoMint = true
                                            avgMintCost = "0"

                                        }


                                        const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle("Mint Tracker")
                                            .setDescription(">>> Display your last mints on a specific wallet.")
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setTimestamp()
                                            .addFields(
                                                { name: "Wallet", value: walletFormatted, inline: false },
                                                { name: "Collection Count", value: "`" + collectionCount + " collection(s)`", inline: true },
                                                { name: "Total Mint Spent", value: "`" + parseFloat(totalMintCost).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(totalMintCost * ethusdtPrice).toFixed(0)) + "$)`", inline: true },
                                                { name: "Avg. Mint Spent", value: "`" + parseFloat(avgMintCost).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(avgMintCost * ethusdtPrice).toFixed(0)) + "$)`", inline: true },
                                                { name: "Mints:", value: mintsOverview, inline: false },

                                            )
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                                        if (isNoMint == false) { await interaction.editReply({ embeds: [gasTrackerEmbed], components: [buttonEth] }) }
                                        else { await interaction.editReply({ embeds: [gasTrackerEmbed], components: [buttonEthNo] }) }




                                        //On fait le call à la base SQL
                                        await interactionData.destroy({ where: { authorId: authorId, commandName: "trackmints", serverId: serverId } })

                                        await interactionData.create({

                                            authorId: authorId,
                                            authorName: authorName,
                                            serverId: serverId,
                                            commandName: "trackmints",
                                            interactionId: interaction.id,
                                            walletAddress: selectedWallet,
                                            walletCategory: "eth",
                                            embed1: JSON.stringify(tokenTable),
                                            embed2: "N/A",
                                            embed3: "N/A",

                                        })



                                    }).catch(async err => {


                                        const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle("Mint Tracker")
                                            .setDescription("The wallet your provided isn't a valid Ethereum or Bitcoin address. Please try again using the appropriate form.")
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                        await interaction.editReply({ embeds: [gasTrackerEmbed] });

                                    })





                            } else if (isBRC20BitcoinWallet(selectedWallet)) {


                                //On construit les bouttons
                                const buttonBtc = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('trackmintETHbydate-button')
                                            .setLabel('sort by date')
                                            .setStyle(1),
                                        new ButtonBuilder()
                                            .setCustomId('trackmintETHbyprice-button')
                                            .setLabel('sort by price')
                                            .setStyle(2),
                                        new ButtonBuilder()
                                            .setCustomId('trackmintETHbygas-button')
                                            .setLabel('sort by gas')
                                            .setStyle(2),
                                        new ButtonBuilder()
                                            .setCustomId('trackmintETHbyabc-button')
                                            .setLabel('sort by abc')
                                            .setStyle(2),

                                    )

                                //On construit les bouttons
                                const buttonEthNo = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('trackmintETHbydate-button')
                                            .setLabel('sort by date')
                                            .setStyle(2)
                                            .setDisabled(true),
                                        new ButtonBuilder()
                                            .setCustomId('trackmintETHbyprice-button')
                                            .setLabel('sort by price')
                                            .setStyle(2)
                                            .setDisabled(true),
                                        new ButtonBuilder()
                                            .setCustomId('trackmintETHbygas-button')
                                            .setLabel('sort by gas')
                                            .setStyle(2)
                                            .setDisabled(true),
                                        new ButtonBuilder()
                                            .setCustomId('trackmintETHbyabc-button')
                                            .setLabel('sort by abc')
                                            .setStyle(2)
                                            .setDisabled(true),


                                    )

                                const btcCallPrice = await axios.get("https://blockchain.info/q/24hrprice")
                                let BTCUsdPrice = await btcCallPrice.data


                                const createCall = `https://api-mainnet.magiceden.dev/v2/ord/btc/activities?ownerAddress=` + selectedWallet + "&kind=create";
                                const createCallFormatted = await axios.get(createCall, { headers });
                                const createData = await createCallFormatted.data.activities;

                                const mintCall = `https://api-mainnet.magiceden.dev/v2/ord/btc/activities?ownerAddress=` + selectedWallet + "&kind=mint_broadcasted";
                                const mintCallFormatted = await axios.get(mintCall, { headers });
                                const mintData = await mintCallFormatted.data.activities;



                                let tokenTable = []

                                for (const create of createData) {

                                    if (create.collectionSymbol) {

                                        const mempoolCall = await axios.get("https://mempool.space/api/tx/" + create.txId)

                                        let obj = {}
                                        obj.hash = create.txId
                                        obj.name = create.collection.name
                                        obj.price = parseFloat((create.txValue) / (10 ** 8)).toFixed(3)
                                        obj.timestamp = mempoolCall.data.status.block_time
                                        obj.fees = mempoolCall.data.fee
                                        obj.id = create.token.inscriptionNumber
                                        obj.collectionSymbol = create.collectionSymbol
                                        obj.btc = BTCUsdPrice
                                        obj.walletFormatted = walletFormatted

                                        tokenTable.push(obj)
                                    }

                                }

                                for (const mint of mintData) {

                                    if (mint.collectionSymbol) {

                                        const mempoolCall = await axios.get("https://mempool.space/api/tx/" + mint.txId)
                                        console.log(mempoolCall.data)

                                        let obj = {}
                                        obj.hash = mint.txId
                                        obj.name = mint.collection.name
                                        obj.price = (mint.listedPrice) / (10 ** 8)
                                        obj.timestamp = mempoolCall.data.status.block_time
                                        obj.fees = mempoolCall.data.fee
                                        obj.id = mint.token.inscriptionNumber
                                        obj.collectionSymbol = mint.collectionSymbol
                                        obj.btc = BTCUsdPrice
                                        obj.walletFormatted = walletFormatted

                                        tokenTable.push(obj)
                                    }

                                }


                                tokenTable.sort((a, b) => b.timestamp - a.timestamp);


                                let mintsOverview = ""
                                let totalMintCost = 0
                                let collectionTable = []
                                let index = 0



                                for (const mint of tokenTable) {

                                    index++

                                    if (index <= 13) {

                                        let timestamp = mint.timestamp
                                        let tokenId = mint.id
                                        let collection = mint.name
                                        let price = parseFloat(mint.price).toFixed(3)
                                        let gasUsed = mint.fees
                                        let collectionSymbol = mint.collectionSymbol



                                        let lignMaxSize = 70
                                        let leftPartNfts = "`" + formatString(collection) + " (#" + tokenId + ")"
                                        let rightPartNfts = parseFloat(price).toFixed(3) + "₿ • " + parseFloat(gasUsed).toFixed(0) + " sats • " + getTimeAgo(timestamp) + "`\n"
                                        let leftPartNFTsLenght = leftPartNfts.length
                                        let rightPartNftsLenght = rightPartNfts.length
                                        let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                                        let spaceLenght = ""
                                        for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }



                                        mintsOverview += leftPartNfts + spaceLenght + rightPartNfts

                                        totalMintCost += parseFloat(price)

                                        if (!collectionTable.includes(collectionSymbol)) { collectionTable.push(collectionSymbol) }

                                    }
                                }


                                let avgMintCost = totalMintCost / index
                                let collectionCount = collectionTable.length

                                let isNoMint = false
                                if (mintsOverview == "") {
                                    mintsOverview = "```No recent mint founds                                    ```"

                                    isNoMint = true
                                    avgMintCost = "0"
                                }

                                const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Mint Tracker")
                                    .setDescription(">>> Display your last mints on your wallet(s).")
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setTimestamp()
                                    .addFields(
                                        { name: "Wallet", value: walletFormatted, inline: false },
                                        { name: "Collection Count", value: "`" + collectionCount + " collection(s)`", inline: true },
                                        { name: "Total Mint Spent", value: "`" + parseFloat(totalMintCost).toFixed(3) + "₿ (" + new Intl.NumberFormat('en-US').format(parseFloat(totalMintCost * BTCUsdPrice).toFixed(0)) + "$)`", inline: true },
                                        { name: "Avg. Mint Spent", value: "`" + parseFloat(avgMintCost).toFixed(3) + "₿ (" + new Intl.NumberFormat('en-US').format(parseFloat(avgMintCost * BTCUsdPrice).toFixed(0)) + "$)`", inline: true },
                                        { name: "Mints:", value: mintsOverview, inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                if (isNoMint == false) { await interaction.editReply({ embeds: [gasTrackerEmbed], components: [buttonBtc] }) }
                                else { await interaction.editReply({ embeds: [gasTrackerEmbed], components: [buttonEthNo] }) }



                                //On fait le call à la base SQL
                                await interactionData.destroy({ where: { authorId: authorId, commandName: "trackmints", serverId: serverId } })

                                await interactionData.create({

                                    authorId: authorId,
                                    authorName: authorName,
                                    serverId: serverId,
                                    commandName: "trackmints",
                                    interactionId: interaction.id,
                                    walletAddress: selectedWallet,
                                    walletCategory: "btc",
                                    embed1: JSON.stringify(tokenTable),
                                    embed2: "N/A",
                                    embed3: "N/A",

                                })

                            } else if (!isValidEthereumAddress(selectedWallet) && !isBRC20BitcoinWallet(selectedWallet)) {

                                const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Mint Tracker")
                                    .setDescription("The wallet your provided isn't a valid Ethereum or Bitcoin address. Please try again using the appropriate form.")
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setTimestamp()
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                await interaction.editReply({ embeds: [gasTrackerEmbed] });


                            }



                        } else if (selectedWallet.toLowerCase() == 'all') {


                            //On construit les bouttons
                            const buttonEth = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('trackmintETHbydate-button')
                                        .setLabel('sort by date')
                                        .setStyle(1),
                                    new ButtonBuilder()
                                        .setCustomId('trackmintETHbyprice-button')
                                        .setLabel('sort by price')
                                        .setStyle(2),
                                    new ButtonBuilder()
                                        .setCustomId('trackmintETHbygas-button')
                                        .setLabel('sort by gas')
                                        .setStyle(2),
                                    new ButtonBuilder()
                                        .setCustomId('trackmintETHbyabc-button')
                                        .setLabel('sort by abc')
                                        .setStyle(2),
                                    new ButtonBuilder()
                                        .setCustomId('trackmintsswitchBTC-button')
                                        // .setLabel('BTC')
                                        .setEmoji("<:RCBTC:1123219824282189834>")
                                        .setStyle(3),

                                )

                            //On construit les bouttons
                            const buttonEthNo = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('trackmintETHbydate-button')
                                        .setLabel('sort by date')
                                        .setStyle(2)
                                        .setDisabled(true),
                                    new ButtonBuilder()
                                        .setCustomId('trackmintETHbyprice-button')
                                        .setLabel('sort by price')
                                        .setStyle(2)
                                        .setDisabled(true),
                                    new ButtonBuilder()
                                        .setCustomId('trackmintETHbygas-button')
                                        .setLabel('sort by gas')
                                        .setStyle(2)
                                        .setDisabled(true),
                                    new ButtonBuilder()
                                        .setCustomId('trackmintETHbyabc-button')
                                        .setLabel('sort by abc')
                                        .setStyle(2)
                                        .setDisabled(true),
                                    new ButtonBuilder()
                                        .setCustomId('trackmintsswitchBTC-button')
                                        .setEmoji("<:RCBTC:1123219824282189834>")
                                        .setStyle(3),

                                )


                            const walletAddressName = await wallets.findAll({ where: { authorId: authorId, walletCategory: "eth" } });


                            if (walletAddressName.length > 0) {

                                const walletAddresses = walletAddressName.map((wallet) => wallet.dataValues.walletAddress.toLowerCase());
                                const walletFormatted = "`" + walletAddresses.length + " addresses`"

                                console.log(walletAddresses)



                                //Récupère le prix de l'ETH
                                const ethCallPrice = await axios.get('https://api.etherscan.io/api?module=stats&action=ethprice&apikey=' + etherscanApiKey)
                                let ethusdtPrice = ethCallPrice.data.result.ethusd



                                let mintsOverview = ""
                                let totalMintCost = 0
                                let collectionTable = []
                                let tokenTable = []
                                let index = 0




                                await sdk2.getUsersActivityV6({ users: walletAddresses, limit: '20', sortBy: 'eventTimestamp', types: 'mint', accept: '*/*' })
                                    .then(async ({ data }) => {


                                        for (const mint of data.activities) {



                                            let txnHash = mint.txHash
                                            const hashGasReader = await web3.eth.getTransaction(txnHash)


                                            if ((walletAddresses.includes((hashGasReader.from).toLowerCase()))) {

                                                index++

                                                if (index <= 13) {




                                                    let price = 0
                                                    if (mint.price) { price = mint.price.amount.decimal }
                                                    else { price = 0 }

                                                    let timestamp = mint.timestamp
                                                    let tokenId = formatTokenId(mint.token.tokenId)
                                                    let collection = mint.collection.collectionName
                                                    let collectionAddress = mint.collection.collectionId

                                                    let gasUsed = (parseFloat(hashGasReader.gasPrice / (10 ** 9)))



                                                    let lignMaxSize = 70
                                                    let leftPartNfts = "`" + formatString(collection) + " (#" + tokenId + ")"
                                                    let rightPartNfts = parseFloat(price).toFixed(3) + "Ξ • " + parseFloat(gasUsed).toFixed(0) + " gwei • " + getTimeAgo(timestamp) + "`\n"
                                                    let leftPartNFTsLenght = leftPartNfts.length
                                                    let rightPartNftsLenght = rightPartNfts.length
                                                    let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                                                    let spaceLenght = ""
                                                    for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }


                                                    mintsOverview += leftPartNfts + spaceLenght + rightPartNfts


                                                    totalMintCost += price
                                                    if (!collectionTable.includes(collectionAddress)) { collectionTable.push(collectionAddress) }

                                                    let obj = {}
                                                    obj.collection = collection
                                                    obj.price = price
                                                    obj.txnHash = txnHash
                                                    obj.timestamp = timestamp
                                                    obj.collectionAddress = collectionAddress
                                                    obj.tokenId = tokenId
                                                    obj.gasUsed = gasUsed
                                                    obj.eth = ethusdtPrice
                                                    obj.walletFormatted = walletFormatted

                                                    tokenTable.push(obj)




                                                }
                                            }

                                        }







                                        let avgMintCost = totalMintCost / index
                                        let collectionCount = collectionTable.length

                                        console.log(avgMintCost)

                                        let isNoMint = false
                                        if (mintsOverview == "") {
                                            mintsOverview = "```No recent mint founds                                    ```"

                                            isNoMint = true
                                            avgMintCost = "0"

                                        }

                                        const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle("Mint Tracker")
                                            .setDescription(">>> Display your last mints on your wallet(s).")
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setTimestamp()
                                            .addFields(
                                                { name: "Wallet", value: walletFormatted, inline: false },
                                                { name: "Collection Count", value: "`" + collectionCount + " collection(s)`", inline: true },
                                                { name: "Total Mint Spent", value: "`" + parseFloat(totalMintCost).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(totalMintCost * ethusdtPrice).toFixed(0)) + "$)`", inline: true },
                                                { name: "Avg. Mint Spent", value: "`" + parseFloat(avgMintCost).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(avgMintCost * ethusdtPrice).toFixed(0)) + "$)`", inline: true },
                                                { name: "Mints:", value: mintsOverview, inline: false },

                                            )
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                                        if (isNoMint == false) { await interaction.editReply({ embeds: [gasTrackerEmbed], components: [buttonEth] }) }
                                        else { await interaction.editReply({ embeds: [gasTrackerEmbed], components: [buttonEthNo] }) }




                                        //On fait le call à la base SQL
                                        await interactionData.destroy({ where: { authorId: authorId, commandName: "trackmints", serverId: serverId } })

                                        await interactionData.create({

                                            authorId: authorId,
                                            authorName: authorName,
                                            serverId: serverId,
                                            commandName: "trackmints",
                                            interactionId: interaction.id,
                                            walletAddress: selectedWallet,
                                            walletCategory: "eth",
                                            embed1: JSON.stringify(tokenTable),
                                            embed2: "N/A",
                                            embed3: "N/A",

                                        })



                                    }).catch(async err => { })


                            } else {


                                const allWallet = await wallets.findAll({ where: { authorId: authorId } });

                                if (allWallet.length > 0) {

                                    //On construit les bouttons
                                    const buttonEth = new ActionRowBuilder()
                                        .addComponents(
                                            new ButtonBuilder()
                                                .setCustomId('trackmintETHbydate-button')
                                                .setLabel('sort by date')
                                                .setStyle(2)
                                                .setDisabled(true),
                                            new ButtonBuilder()
                                                .setCustomId('trackmintETHbyprice-button')
                                                .setLabel('sort by price')
                                                .setStyle(2)
                                                .setDisabled(true),
                                            new ButtonBuilder()
                                                .setCustomId('trackmintETHbygas-button')
                                                .setLabel('sort by gas')
                                                .setStyle(2)
                                                .setDisabled(true),
                                            new ButtonBuilder()
                                                .setCustomId('trackmintETHbyabc-button')
                                                .setLabel('sort by abc')
                                                .setStyle(2)
                                                .setDisabled(true),
                                            new ButtonBuilder()
                                                .setCustomId('trackmintsswitchBTC-button')
                                                // .setLabel('BTC')
                                                .setEmoji("<:RCBTC:1123219824282189834>")
                                                .setStyle(3),

                                        )


                                    let mintsOverview = "```No Ethereum wallet registered                                  ```"


                                    const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle("Mint Tracker")
                                        .setDescription(">>> Display your last mints on your wallet(s).")
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .addFields(
                                            { name: "Wallet", value: "`0 address`", inline: false },
                                            { name: "Collection Count", value: "`0 collection(s)`", inline: true },
                                            { name: "Total Mint Spent", value: "`0.000Ξ (0.000$)`", inline: true },
                                            { name: "Avg. Mint Spent", value: "`0.000Ξ (0.000$)`", inline: true },
                                            { name: "Mints:", value: mintsOverview, inline: false },

                                        )
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                    await interaction.editReply({ embeds: [gasTrackerEmbed], components: [buttonEth] });



                                    //On fait le call à la base SQL
                                    await interactionData.destroy({ where: { authorId: authorId, commandName: "trackmints", serverId: serverId } })

                                    await interactionData.create({

                                        authorId: authorId,
                                        authorName: authorName,
                                        serverId: serverId,
                                        commandName: "trackmints",
                                        interactionId: interaction.id,
                                        walletAddress: selectedWallet,
                                        walletCategory: "eth",
                                        embed1: "N/A",
                                        embed2: "N/A",
                                        embed3: "N/A",

                                    })




                                } else {




                                    const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle("Mint Tracker")
                                        .setDescription("Aura can't analyze your wallet's data because you don't have any Ethereum or Bitcoin wallet registered in your portfolio. Please use `/wallet set` or `/wallet raw` to register a wallet in your portfolio then try again.")
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                    await interaction.editReply({ embeds: [gasTrackerEmbed] });






                                }
                            }
                        }



                    } else if (interaction.options.getSubcommand() === 'tokens') {

                        const selectedCollection = interaction.options.getString("collection");



                        ////////////////////////////////////////////////////////////////////////////////////



                        if (isValidEthereumAddress(selectedCollection)) {

                            const walletAddressName = await wallets.findAll({ where: { authorId: authorId, walletCategory: "eth" } });
                            const walletAddresses = walletAddressName.map((wallet) => wallet.dataValues.walletAddress.toLowerCase());
                            const walletCount = walletAddresses.length

                            // Prix de l'ETH
                            const etherscanTokenPrice = await axios.get('https://api.etherscan.io/api?module=stats&action=ethprice&apikey=' + etherscanApiKey)
                            const ethUsdPrice = etherscanTokenPrice.data.result.ethusd


                            if (walletCount > 0) {

                                let tokenOverview = ""
                                let totalHeldValue = 0
                                let tokenCount = 0
                                let isHolder = 0

                                let collectionFloor = 0
                                let collectionName = ""
                                let collectionBanner = ""

                                let holdingTable = []


                                for (const wallet of walletAddresses) {

                                    await sdk2.getUsersUserCollectionsV3({ collection: selectedCollection, limit: '100', user: wallet, accept: '*/*' })
                                        .then(async ({ data }) => {


                                            if ((data.collections).length > 0) {


                                                collectionName = data.collections[0].collection.name
                                                collectionBanner = data.collections[0].collection.banner
                                                collectionFloor = data.collections[0].collection.floorAskPrice.amount.decimal

                                                if (parseInt(data.collections[0].ownership.tokenCount) > 0) {

                                                    tokenCount += parseInt(data.collections[0].ownership.tokenCount)
                                                    isHolder++

                                                    let obj = {}
                                                    obj.wallet = wallet
                                                    obj.count = parseInt(data.collections[0].ownership.tokenCount)
                                                    holdingTable.push(obj)
                                                }
                                            }
                                        })

                                }


                                if (holdingTable.length <= 0) {


                                    await sdk2.getCollectionsV5({ id: selectedCollection, accept: '*/*' })
                                        .then(async ({ data: collectionData }) => {

                                            console.log(collectionData.collections[0].floorAsk)
                                            collectionName = collectionData.collections[0].name
                                            collectionBanner = collectionData.collections[0].banner

                                            if (!collectionData.collections[0].floorAsk.price) { totalHeldValue = "0.000" }
                                            else { collectionFloor = collectionData.collections[0].floorAsk.price.amount.decimal }






                                        })


                                }


                                console.log(holdingTable)
                                holdingTable.sort((a, b) => b.count - a.count);

                                let index = 0
                                for (const address of holdingTable) {

                                    index++

                                    if (index <= 13) {

                                        let lignMaxSize = 70
                                        let leftPartNfts = "`" + (address.wallet).toLowerCase()
                                        let rightPartNfts = address.count + " tokens`\n"
                                        let leftPartNFTsLenght = leftPartNfts.length
                                        let rightPartNftsLenght = rightPartNfts.length
                                        let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                                        let spaceLenght = ""
                                        for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }



                                        tokenOverview += leftPartNfts + spaceLenght + rightPartNfts

                                    } else {
                                        break
                                    }
                                }


                                if (collectionFloor) { totalHeldValue = parseFloat(collectionFloor * tokenCount).toFixed(3) }
                                if (tokenOverview == "") { tokenOverview = "```No tokens of the specified collection detected                          ```" }



                                const tokenHolding = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle(collectionName)
                                    .setDescription(">>> Track your tokens of a given collection accross your wallet(s).")
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    // .setImage(collectionBanner)
                                    .addFields(
                                        { name: "Wallets", value: "`" + walletCount + " addresses`", inline: false },
                                        { name: "Token Found", value: "`" + tokenCount + " tokens`", inline: true },
                                        { name: "Total Value", value: "`" + totalHeldValue + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(ethUsdPrice * totalHeldValue).toFixed(2)) + "$)`", inline: true },
                                        { name: "Tokens:", value: tokenOverview, inline: false },
                                    )
                                    .setTimestamp()
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                await interaction.editReply({ embeds: [tokenHolding] });



                                //console.log("floor : " + collectionFloor)

                                ////////////////////////////////////////////////////////////////////////////////////

                            } else {



                                const notMember = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle(`Token Tracker`)
                                    .setDescription("Aura can't analyze your wallet's data because you don't have any Ethereum wallet registered in your portfolio. Please use `/wallet set` or `/wallet raw` to register a wallet in your portfolio then try again.")
                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setTimestamp()
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                await interaction.editReply({ embeds: [notMember] });


                            }
                        } else if (isValidInput(selectedCollection)) {


                            const walletAddressName = await wallets.findAll({ where: { authorId: authorId, walletCategory: "btc" } });
                            const walletAddresses = walletAddressName.map((wallet) => wallet.dataValues.walletAddress.toLowerCase());
                            const walletCount = walletAddresses.length

                            const btcCallPrice = await axios.get("https://blockchain.info/q/24hrprice")
                            let BTCUsdPrice = btcCallPrice.data

                            const url5 = `https://api-mainnet.magiceden.dev/v2/ord/btc/tokens?collectionSymbol=bitcoin-frogs&ownerAddress=bc1qc5cd94mq8juv953hqqqgefaqunuanqpk9t762d&showAll=true&limit=120&sortBy=priceAsc`;
                            const response5 = await axios.get(url5, { headers });
                            const data5 = await response5.data;



                            if (walletCount > 0) {

                                let tokenOverview = ""
                                let totalHeldValue = 0
                                let tokenCount = 0
                                let isHolder = 0

                                let collectionFloor = 0
                                let collectionName = ""
                                let collectionBanner = ""

                                let holdingTable = []

                                const statCall = `https://api-mainnet.magiceden.dev/v2/ord/btc/stat?collectionSymbol=` + selectedCollection
                                const stats = await axios.get(statCall, { headers });
                                const statsResponse = await stats.data;

                                collectionFloor = statsResponse.floorPrice / (10 ** 8)



                                for (const wallet of walletAddresses) {


                                    const url = `https://api-mainnet.magiceden.dev/v2/ord/btc/tokens?collectionSymbol=` + selectedCollection + "&ownerAddress=" + wallet + `&showAll=true&limit=120&sortBy=priceAsc`;
                                    const response = await axios.get(url, { headers });
                                    const data = await response.data;



                                    if ((data.tokens).length > 0) {

                                        if ((data.tokens[0].collection)) {

                                            collectionName = (data.tokens[0].collection.name)
                                        }

                                        if (parseInt(data.total) > 0) {

                                            tokenCount += parseInt(data.total)
                                            isHolder++

                                            let obj = {}
                                            obj.wallet = wallet
                                            obj.count = parseInt(data.total)
                                            holdingTable.push(obj)
                                        }
                                    }


                                }

                                let isNotValid = false
                                if (holdingTable.length <= 0) {

                                    const infoCall = `https://api-mainnet.magiceden.dev/v2/ord/btc/collections/` + selectedCollection
                                    const infos = await axios.get(infoCall, { headers });
                                    const infoAnswer = await infos.data;

                                    if (infoAnswer.name) {
                                        collectionName = infoAnswer.name

                                    } else {

                                        isNotValid = true
                                    }
                                }


                                if (isNotValid == false) {




                                    holdingTable.sort((a, b) => b.count - a.count);
                                    console.log(holdingTable)

                                    let index = 0


                                    for (const address of holdingTable) {

                                        index++

                                        if (index <= 13) {

                                            let lignMaxSize = 70
                                            let leftPartNfts = "`" + formatBTCWallet(address.wallet).toLowerCase()
                                            let rightPartNfts = address.count + " tokens`\n"
                                            let leftPartNFTsLenght = leftPartNfts.length
                                            let rightPartNftsLenght = rightPartNfts.length
                                            let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                                            let spaceLenght = ""
                                            for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }



                                            tokenOverview += leftPartNfts + spaceLenght + rightPartNfts

                                        } else {
                                            break
                                        }
                                    }


                                    if (collectionFloor) { totalHeldValue = parseFloat(collectionFloor * tokenCount).toFixed(3) }
                                    if (tokenOverview == "") { tokenOverview = "```No tokens of the specified collection detected                          ```" }



                                    const tokenHolding = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle(collectionName)
                                        .setDescription(">>> Track your tokens of a given collection accross your wallet(s).")
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        // .setImage(collectionBanner)
                                        .addFields(
                                            { name: "Wallets", value: "`" + walletCount + " addresses`", inline: false },
                                            { name: "Token Found", value: "`" + tokenCount + " tokens`", inline: true },
                                            { name: "Total Value", value: "`" + totalHeldValue + "₿ (" + new Intl.NumberFormat('en-US').format(parseFloat(BTCUsdPrice * totalHeldValue).toFixed(2)) + "$)`", inline: true },
                                            { name: "Tokens:", value: tokenOverview, inline: false },
                                        )
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                    await interaction.editReply({ embeds: [tokenHolding] });

                                } else {


                                    const notMember = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle(`Token Tracker`)
                                        .setDescription("Aura can't analyze your wallet's data because the collection you selected isn't valid. Please try again with a valid collection")
                                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                    await interaction.editReply({ embeds: [notMember] });




                                }

                            } else {



                                const notMember = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle(`Token Tracker`)
                                    .setDescription("Aura can't analyze your wallet's data because you don't have any Bitcoin wallet registered in your portfolio. Please use `/wallet set` or `/wallet raw` to register a wallet in your portfolio then try again.")
                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setTimestamp()
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                await interaction.editReply({ embeds: [notMember] });


                            }
                        } else {

                            const notMember = new EmbedBuilder().setColor("#060A8F")
                                .setTitle(`Token Tracker`)
                                .setDescription("Aura can't analyze your wallet's data because the collection you selected isn't valid. Please try again with another one.")
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

            } else if (botPowerStatut.toLowerCase() === "off") {


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
        	let reportCommand = "/track"

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
        		.setFooter({ text: 'Powered by Rolls Chasers Analytics', iconURL: 'https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png' })


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

