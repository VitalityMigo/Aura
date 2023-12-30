/**
 * @file Sample getdata command with slash command.
 * @author Vitality Migø
 */



const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { profileData, accessSql, reportsql, interactionData, wallets, apimonitorsql, adminsql, usersql, sequelize, infra_coin, tracker_nft, infra_nft } = require('../../../events/database');
const moment = require('moment');
const axios = require('axios')

const { magiceden } = require("../../../config/web3config")

const getEthPrice = require('../../../functions/getethprice')
const isHttps = require('../../../functions/isHttps')
const capFirstLetter = require("../../../functions/capfirstletter")




function isValidInput(input) {
    return /^(\w+|-)+$/.test(input);
}

function isBRC20BitcoinWallet(wallet) {
    const regex = /^bc1[a-zA-Z0-9]{39,59}$/;

    return regex.test(wallet);
}

function formatWallet(input) {
    return input.length > 35 ? `${input.substring(0, 6)}…${input.substring(input.length - 6)}` : input;
}

function formatWallet2(input) {
    return input.length > 35 ? `${input.substring(0, 4)}…${input.substring(input.length - 4)}` : input;
}

function cutString(string) {
    stringLength = string.length
    if (stringLength > 300) {
        return string.substring(0, 300) + "..."
    } else {
        return string
    }
}


function isSATS(str) {
    return str.endsWith(".sats");
}

function isBRC20BitcoinWallet(wallet) {
    const regex = /^bc1[a-zA-Z0-9]{39,59}$/;

    return regex.test(wallet);
}


function isValidBtcInscription(str) {
    // Vérifier si la chaîne est uniquement composée de chiffres
    if (/^\d+$/.test(str)) {
        return true;
    }

    if (/^[a-zA-Z0-9]{66}$/.test(str)) {
        return true;
    }

    return false;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ordinal")
        .setDescription("Ordinals analytics and insigths")
        .addSubcommand(subcommand =>
            subcommand
                .setName("data")
                .setDescription("Display various data of a collection")
                .addStringOption(option =>
                    option
                        .setName("collection")
                        .setDescription("The collection's name or slug")
                        .setRequired(true)
                        .setAutocomplete(true)

                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("inscription")
                .setDescription("Display various data of a Bitcoin inscription")
                .addStringOption(option =>
                    option
                        .setName("id")
                        .setDescription("The inscription ID or hash")
                        .setRequired(true)
                ),

        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("profit")
                .setDescription("Display your profit on a collection")
                .addStringOption(option =>
                    option
                        .setName("collection")
                        .setDescription("The collection to analyse")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addStringOption(option =>
                    option
                        .setName("wallet")
                        .setDescription("The wallet to analyse")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addStringOption(option =>
                    option
                        .setName("timelapse")
                        .setDescription("The period of time to analyse")
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

                const subcommand = interaction.options.getSubcommand()



                const authorProfile = await profileData.findOne({ where: { authorId: authorId } })

                if (authorProfile === null) {

                    if (subcommand != 'wallet') {
                        await interaction.deferReply();
                    } else { await interaction.deferReply({ ephemeral: true }) }

                } else {
                    const authorPrivacyMode = authorProfile.dataValues.privacyMode

                    if (authorPrivacyMode.toLowerCase() === "private" || subcommand === 'wallet') { await interaction.deferReply({ ephemeral: true }); }
                    if (authorPrivacyMode.toLowerCase() === "public" && subcommand != 'wallet') { await interaction.deferReply(); }
                }

                //Checkpoint
                console.log("// Step 1 : Initialization - Executed ✅")


                if (botGlobalState.toLowerCase() === "on") {

                    if (communityStatut.toLowerCase() === "active" || communityStatut == "") {

                        if (accessTier.toLowerCase() == "s-tier" || accessTier.toLowerCase() == "a-tier") {

                            if (member.roles.cache.has(communityMemberRoleId)) {


                                if (subcommand === "data") {


                                    // Toute les collections ont été séléctionner


                                    const setwalletErrorEmbed = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle(`Not available`)
                                        .setDescription("We are currently optimising this feature. You can still use our Ethereum NFT features with `/nft`.")
                                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                    await interaction.editReply({ embeds: [setwalletErrorEmbed] });




                                    /// API de Magic Eden renvoi "trop de request", à vérifier \\\


                                    //   //Variable pour les options
                                    //   const coinAddress = interaction.options.getString("collection");


                                    // // Prix de l'ETH
                                    // const ethUsdPrice = await getEthPrice()

                                    // // Prix du BTC
                                    // const cryptoUsdtPrice = await axios.get('https://api-testnet.bybit.com/v5/market/tickers?category=linear')
                                    // const BTCUsdtPrice = cryptoUsdtPrice.data.result.list.find(obj => obj.symbol === "BTCUSDT").lastPrice;



                                    // const url = `https://api-mainnet.magiceden.dev/v2/ord/btc/collections/` + coinAddress;
                                    // const response = await axios.get(url, { headers: magiceden });
                                    // const data = await response.data;

                                    // if (response.data) {

                                    //     const description = data.description
                                    //     const collectionLogo = data.imageURI
                                    //     const supply = data.supply
                                    //     const name = data.name
                                    //     const twitter = data.twitterLink
                                    //     const discord = data.discordLink
                                    //     const website = data.websiteLink
                                    //     const inscriptionIcon = data.inscriptionIcon



                                    //     const url2 = `https://api-mainnet.magiceden.dev/v2/ord/btc/stat?collectionSymbol=` + coinAddress;
                                    //     const response2 = await axios.get(url2, { headers: magiceden });
                                    //     const data2 = await response2.data;


                                    //     const totalVolume = (data2.totalVolume) / (10 ** 8)
                                    //     const owners = data2.owners
                                    //     const floorPrice = (data2.floorPrice) / (10 ** 8)
                                    //     const floorPriceUSD = floorPrice * BTCUsdtPrice
                                    //     const floorPriceETH = floorPriceUSD / ethUsdPrice
                                    //     const totalListed = data2.totalListed
                                    //     const inscriptionNumberMin = data2.inscriptionNumberMin
                                    //     const inscriptionNumberMax = data2.inscriptionNumberMax
                                    //     const pendingTxn = data2.pendingTransactions


                                    //     //Quelques calculs
                                    //     const listingRatio = (totalListed / supply) * 100;
                                    //     const holderRatio = (owners / supply) * 100;




                                    //     const getDataCollectionAddress = new EmbedBuilder().setColor("#060A8F")
                                    //         .setTitle(name)
                                    //         .setDescription(description)
                                    //         .setAuthor({ name: authorName, iconURL: userAvatar })
                                    //         .setThumbnail(collectionLogo)
                                    //         .addFields(
                                    //             { name: " ", value: " ", inline: true },
                                    //             { name: "Inscription", value: "`" + inscriptionIcon + "`", inline: false },
                                    //             { name: "BTC Price", value: "`" + parseFloat(floorPrice).toFixed(3) + "₿`", inline: true },
                                    //             { name: "ETH Price", value: "`" + parseFloat(floorPriceETH).toFixed(3) + "Ξ`", inline: true },
                                    //             { name: "USD Price", value: "`" + parseFloat(floorPriceUSD).toFixed(2) + "$`", inline: true },
                                    //             { name: "Supply", value: "`" + supply + "`", inline: true },
                                    //             { name: "Total Volume", value: "`" + parseFloat(totalVolume).toFixed(3) + "₿\n(" + Intl.NumberFormat('en-US').format(parseFloat(totalVolume * BTCUsdtPrice).toFixed(0)) + "$)`", inline: true },
                                    //             { name: "Ongoin Txn", value: "`" + pendingTxn + "`", inline: true },
                                    //             { name: "Listing Count", value: "`" + totalListed + "`", inline: true },
                                    //             { name: "Listing Ratio", value: "`" + parseFloat(listingRatio).toFixed(2) + "%`", inline: true },
                                    //             { name: " ", value: " ", inline: true },
                                    //             { name: "Holder Count", value: "`" + owners + "`", inline: true },
                                    //             { name: "Holder Ratio", value: "`" + parseFloat(holderRatio).toFixed(2) + "%`", inline: true },
                                    //             { name: " ", value: " ", inline: true },
                                    //             { name: "Lowest Inscription", value: "`#" + inscriptionNumberMin + "`", inline: true },
                                    //             { name: "Highest Inscription", value: "`#" + inscriptionNumberMax + "`", inline: true },
                                    //             { name: "Links", value: '[magic eden](https://magiceden.io/ordinals/marketplace/' + coinAddress + ") ∙ " + '[twitter](' + twitter + ") ∙ " + '[discord](' + discord + ") ∙ " + '[website](' + website + ")", inline: false },


                                    //         )
                                    //         .setTimestamp()
                                    //         .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                    //     await interaction.editReply({ embeds: [getDataCollectionAddress] });

                                    // } else {
                                    //     // La collection n'est pas trouvé


                                    //     const setwalletErrorEmbed = new EmbedBuilder().setColor("#060A8F")
                                    //         .setTitle(`Invalid Collection`)
                                    //         .setDescription("The NFT collection you provided isn't a valid Ordinal collection slug. Please try again using the appropriate form.")
                                    //         .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    //         .setAuthor({ name: authorName, iconURL: userAvatar })
                                    //         .setTimestamp()
                                    //         .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                    //     await interaction.editReply({ embeds: [setwalletErrorEmbed] });

                                    // }

                                } else if (subcommand === 'profit') {



                                    const setwalletErrorEmbed = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle(`Not available`)
                                        .setDescription("We are currently optimising this feature. You can still use our Ethereum NFT features with `/nft`.")
                                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                    await interaction.editReply({ embeds: [setwalletErrorEmbed] });


                                    /// API de Magic Eden renvoi "trop de request", à vérifier \\\


                                    // if (isValidInput(selectedCollection)) {


                                    //     if (isBRC20BitcoinWallet(walletAddress)) {



                                    //         let name = ""
                                    //         let collectionLogo = ""
                                    //         let twitter = ""
                                    //         let discord = ""
                                    //         let website = ""

                                    //         let mintSpent = 0
                                    //         let mintGasSpent = 0
                                    //         let totalMintSpent = 0
                                    //         let buyMarketplaceSpent = 0
                                    //         let buyMarketplaceGasSpent = 0
                                    //         let buyMarketplaceTotalSpent = 0
                                    //         let soldValue = 0
                                    //         let soldGasValue = 0
                                    //         let totalSoldValue = 0
                                    //         let mintCount = 0
                                    //         let buyMarketplaceCount = 0
                                    //         let totalBuyCount = 0
                                    //         let holdCount = 0
                                    //         let soldCount = 0
                                    //         let transferCount = 0
                                    //         let transferCountFormated = 0
                                    //         let averageMintValue = 0
                                    //         let averageBuyValue = 0
                                    //         let averageSpentValue = 0
                                    //         let averageSoldValue = 0
                                    //         let averageHeldValue = 0
                                    //         let totalHoldValue = 0
                                    //         let realisedProfit = 0
                                    //         let potentialProfit = 0
                                    //         let roiFormatted = 0


                                    //         const btcCallPrice = await axios.get("https://blockchain.info/q/24hrprice")
                                    //         const BTCUsdPrice = btcCallPrice.data




                                    //         const url = `https://api-mainnet.magiceden.dev/v2/ord/btc/collections/` + selectedCollection;
                                    //         const response = await axios.get(url, { headers: magiceden });
                                    //         const data = await response.data;

                                    //         collectionLogo = data.imageURI
                                    //         name = data.name
                                    //         twitter = data.twitterLink
                                    //         discord = data.discordLink
                                    //         website = data.websiteLink


                                    //         const url2 = `https://api-mainnet.magiceden.dev/v2/ord/btc/stat?collectionSymbol=` + selectedCollection;
                                    //         const response2 = await axios.get(url2, { headers: magiceden });
                                    //         const data2 = await response2.data;


                                    //         const floorPrice = (data2.floorPrice) / (10 ** 8)


                                    //         const url3 = `https://api-mainnet.magiceden.dev/v2/ord/btc/tokens?collectionSymbol=` + selectedCollection + `&ownerAddress=` + walletAddress + `&showAll=true&sortBy=priceAsc`;
                                    //         const response3 = await axios.get(url3, { headers: magiceden });
                                    //         const data3 = await response3.data;


                                    //         totalHoldValue = floorPrice * holdCount
                                    //         averageHeldValue = totalHoldValue / holdCount

                                    //         let tokenHeldId = []
                                    //         for (const token of data3.tokens) {
                                    //             tokenHeldId.push(token.id)
                                    //         }


                                    //         //On calcul le prix et méthode d'achat des token held
                                    //         for (const token of tokenHeldId) {

                                    //             //Buy classic
                                    //             const tokenBuyLink = `https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=buying_broadcasted&tokenId=` + token
                                    //             const tokenBuyCall = await axios.get(tokenBuyLink, { headers: magiceden });
                                    //             const tokenBuy = await tokenBuyCall.data.activities;

                                    //             const tokenBuyByWallet = tokenBuy.filter(activity => activity.oldOwner.toLowerCase() !== walletAddress.toLowerCase() && activity.newOwner.toLowerCase() == walletAddress.toLowerCase() && ((Date.parse(activity.createdAt)) / 1000) >= selectedTimestamp);


                                    //             if (tokenBuyByWallet.length > 0) {

                                    //                 const mempoolCall = await axios.get("https://mempool.space/api/tx/" + tokenBuyByWallet[0].txId)

                                    //                 buyMarketplaceSpent += ((tokenBuyByWallet[0].listedPrice) / (10 ** 8))
                                    //                 buyMarketplaceGasSpent += mempoolCall.data.fee / (10 ** 8)
                                    //                 buyMarketplaceCount += 1

                                    //             } else {


                                    //                 //Create
                                    //                 const tokenCreateLink = `https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=create&tokenId=` + token.tokenInscription
                                    //                 const tokenCreateCall = await axios.get(tokenCreateLink, { headers: magiceden });
                                    //                 const tokenCreate = await tokenCreateCall.data.activities;

                                    //                 const tokenCreateByWallet = tokenCreate.filter(activity => activity.newOwner.toLowerCase() == walletAddress.toLowerCase() && ((Date.parse(activity.createdAt)) / 1000) >= selectedTimestamp);

                                    //                 if (tokenCreateByWallet.length > 0) {

                                    //                     const mempoolCall = await axios.get("https://mempool.space/api/tx/" + tokenBuyByWallet[0].txId)

                                    //                     mintSpent += ((tokenBuyByWallet[0].txValue) / (10 ** 8))
                                    //                     mintGasSpent += mempoolCall.data.fee / (10 ** 8)
                                    //                     mintCount += 1

                                    //                 } else {

                                    //                     //Mint
                                    //                     const tokenMintLink = `https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=mint_broadcasted&tokenId=` + token.tokenInscription
                                    //                     const tokenMintCall = await axios.get(tokenMintLink, { headers: magiceden });
                                    //                     const tokenMint = await tokenMintCall.data.activities;

                                    //                     const tokenMintByWallet = tokenMint.filter(activity => activity.newOwner.toLowerCase() == walletAddress.toLowerCase() && ((Date.parse(activity.createdAt)) / 1000) >= selectedTimestamp);

                                    //                     if (tokenMintByWallet.length > 0) {

                                    //                         const mempoolCall = await axios.get("https://mempool.space/api/tx/" + tokenBuyByWallet[0].txId)

                                    //                         mintSpent += ((tokenBuyByWallet[0].listedPrice) / (10 ** 8))
                                    //                         mintGasSpent += mempoolCall.data.fee / (10 ** 8)
                                    //                         mintCount += 1

                                    //                     } else {

                                    //                         //Transfert & Airdrop
                                    //                         buyMarketplaceSpent += 0
                                    //                         buyMarketplaceGasSpent += 0
                                    //                         transferCount += 1

                                    //                     }
                                    //                 }

                                    //             }





                                    //         }



                                    //         //Call pour récupérer les token sold
                                    //         const recentSalesLink = `https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=buying_broadcasted&ownerAddress=` + walletAddress + "&collectionSymbol=" + selectedCollection
                                    //         const recentSalesCall = await axios.get(recentSalesLink, { headers: magiceden });
                                    //         const recentSales = await recentSalesCall.data.activities;

                                    //         const filteredTable = recentSales.filter(activity => activity.oldOwner.toLowerCase() == walletAddress.toLowerCase() && activity.newOwner.toLowerCase() !== walletAddress.toLowerCase() && ((Date.parse(activity.createdAt)) / 1000) >= selectedTimestamp);




                                    //         //On calcul le prix et méthode d'achat des token sold
                                    //         for (const token of filteredTable) {


                                    //             //Calculer le prix de vente + les gas.
                                    //             const mempoolCall = await axios.get("https://mempool.space/api/tx/" + token.txId)

                                    //             soldGasValue += mempoolCall.data.fee / (10 ** 8)
                                    //             soldValue += token.listedPrice / (10 ** 8)
                                    //             soldCount += 1


                                    //             ////// SWITCH //////


                                    //             //Calculer le prix d'achat.

                                    //             //Buy classic
                                    //             const tokenBuyLink = `https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=buying_broadcasted&tokenId=` + token.tokenId
                                    //             const tokenBuyCall = await axios.get(tokenBuyLink, { headers: magiceden });
                                    //             const tokenBuy = await tokenBuyCall.data.activities;

                                    //             const tokenBuyByWallet = tokenBuy.filter(activity => activity.oldOwner.toLowerCase() !== walletAddress.toLowerCase() && activity.newOwner.toLowerCase() == walletAddress.toLowerCase() && ((Date.parse(activity.createdAt)) / 1000) >= selectedTimestamp);


                                    //             if (tokenBuyByWallet.length > 0) {

                                    //                 const mempoolCall = await axios.get("https://mempool.space/api/tx/" + tokenBuyByWallet[0].txId)

                                    //                 buyMarketplaceSpent += ((tokenBuyByWallet[0].listedPrice) / (10 ** 8))
                                    //                 buyMarketplaceGasSpent += mempoolCall.data.fee / (10 ** 8)
                                    //                 buyMarketplaceCount += 1

                                    //             } else {


                                    //                 //Create
                                    //                 const tokenCreateLink = `https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=create&tokenId=` + token.tokenId
                                    //                 const tokenCreateCall = await axios.get(tokenCreateLink, { headers: magiceden });
                                    //                 const tokenCreate = await tokenCreateCall.data.activities;

                                    //                 const tokenCreateByWallet = tokenCreate.filter(activity => activity.newOwner.toLowerCase() == walletAddress.toLowerCase() && ((Date.parse(activity.createdAt)) / 1000) >= selectedTimestamp);

                                    //                 if (tokenCreateByWallet.length > 0) {

                                    //                     const mempoolCall = await axios.get("https://mempool.space/api/tx/" + tokenBuyByWallet[0].txId)

                                    //                     mintSpent += ((tokenBuyByWallet[0].txValue) / (10 ** 8))
                                    //                     mintGasSpent += mempoolCall.data.fee / (10 ** 8)
                                    //                     mintCount += 1

                                    //                 } else {

                                    //                     //Mint
                                    //                     const tokenMintLink = `https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=mint_broadcasted&tokenId=` + token.tokenId
                                    //                     const tokenMintCall = await axios.get(tokenMintLink, { headers: magiceden });
                                    //                     const tokenMint = await tokenMintCall.data.activities;

                                    //                     const tokenMintByWallet = tokenMint.filter(activity => activity.newOwner.toLowerCase() == walletAddress.toLowerCase() && ((Date.parse(activity.createdAt)) / 1000) >= selectedTimestamp);

                                    //                     if (tokenMintByWallet.length > 0) {

                                    //                         const mempoolCall = await axios.get("https://mempool.space/api/tx/" + tokenBuyByWallet[0].txId)

                                    //                         mintSpent += ((tokenBuyByWallet[0].listedPrice) / (10 ** 8))
                                    //                         mintGasSpent += mempoolCall.data.fee / (10 ** 8)
                                    //                         mintCount += 1

                                    //                     } else {

                                    //                         //Transfert & Airdrop
                                    //                         buyMarketplaceSpent += 0
                                    //                         buyMarketplaceGasSpent += 0
                                    //                         transferCount += 1

                                    //                     }
                                    //                 }

                                    //             }


                                    //         }


                                    //         if (transferCount > 0) { transferCountFormated = "+" + transferCount }


                                    //         totalMintSpent = mintSpent + mintGasSpent
                                    //         buyMarketplaceTotalSpent = buyMarketplaceSpent - buyMarketplaceGasSpent
                                    //         totalSoldValue = soldValue - soldGasValue

                                    //         totalBuyCount = mintCount + buyMarketplaceCount
                                    //         holdCount = tokenHeldId.length
                                    //         totalHoldValue = floorPrice * holdCount
                                    //         if (holdCount > 0) { averageHeldValue = floorPrice } else { averageHeldValue = 0 }

                                    //         if (totalMintSpent > 0) { averageMintValue = totalMintSpent / mintCount }
                                    //         if (buyMarketplaceTotalSpent > 0) { averageBuyValue = buyMarketplaceTotalSpent / buyMarketplaceCount }
                                    //         if (totalBuyCount > 0) { averageSpentValue = (totalMintSpent + buyMarketplaceTotalSpent) / totalBuyCount }
                                    //         if (soldCount > 0) { averageSoldValue = soldValue / soldCount }

                                    //         realisedProfit = totalSoldValue - (totalMintSpent + buyMarketplaceTotalSpent)
                                    //         potentialProfit = (totalSoldValue + totalHoldValue) - (totalMintSpent + buyMarketplaceTotalSpent)
                                    //         roi = ((((totalHoldValue + totalSoldValue) - (totalMintSpent + buyMarketplaceTotalSpent)) / (totalMintSpent + buyMarketplaceTotalSpent)) * 100).toFixed(2)


                                    //         // ROI format Variable
                                    //         let roiPrefix = ""
                                    //         let roiSuffix = ""

                                    //         if (roi !== 0 && (totalMintSpent + buyMarketplaceTotalSpent) !== 0 && floorPrice) {

                                    //             if (roi > 0) {
                                    //                 roiPrefix = "+";
                                    //                 roiSuffix = " :chart_with_upwards_trend:";
                                    //             } else if (roi < 0) {
                                    //                 roiSuffix = " :chart_with_downwards_trend:";
                                    //             }
                                    //             roiFormatted = "`" + roiPrefix + parseFloat(roi).toFixed(2) + "%" + "`" + roiSuffix;


                                    //         } else if (roi == 0) {

                                    //             roiFormatted = "`0.00%`"

                                    //         } else if (!floorPrice) {

                                    //             roiFormatted = "'N/A'"

                                    //         } else if ((totalMintSpent + buyMarketplaceTotalSpent) == 0) {

                                    //             roiFormatted = "`INFINITY`<a:RCRich:1044762000837840926>"

                                    //         }


                                    //         let linksFormatted = ""
                                    //         if (estLienHTTPS(discord) && estLienHTTPS(website)) { linksFormatted = "[magic eden](https://magiceden.io/ordinals/marketplace/" + selectedCollection + ") ∙ " + '[ordinals](https://ordinalswallet.com/collection/' + selectedCollection + ") ∙ " + "[twitter](" + twitter + ") ∙ " + "[discord](" + discord + ") ∙ " + '[website](' + website + ")" }
                                    //         else if (estLienHTTPS(discord) && !estLienHTTPS(website)) { linksFormatted = "[magic eden](https://magiceden.io/ordinals/marketplace/" + selectedCollection + ") ∙ " + '[ordinals](https://ordinalswallet.com/collection/' + selectedCollection + ") ∙ " + "[twitter](" + twitter + ") ∙ " + "[discord](" + discord + ")" }
                                    //         else if (!estLienHTTPS(discord) && estLienHTTPS(website)) { linksFormatted = "[magic eden](https://magiceden.io/ordinals/marketplace/" + selectedCollection + ") ∙ " + '[ordinals](https://ordinalswallet.com/collection/' + selectedCollection + ") ∙ " + "[twitter](" + twitter + ") ∙ " + '[website](' + website + ")" }
                                    //         else { linksFormatted = "[magic eden](https://magiceden.io/ordinals/marketplace/" + selectedCollection + ") ∙ " + '[ordinals](https://ordinalswallet.com/collection/' + selectedCollection + ") ∙ " + "[twitter](" + twitter + ")" }




                                    //         let selectedTimeFormatted = selectedTime
                                    //         if (!selectedTime) { selectedTimeFormatted = "All Time" }


                                    //         //Embed getRCprofitPrecisedAll
                                    //         const embed1 = new EmbedBuilder().setColor("#060A8F")
                                    //             .setTitle(`${name}`)
                                    //             .setDescription(">>> `" + selectedTimeFormatted + "` profits made by the `" + precisedWalletNameofAuthor + "` wallet of " + authorName + " on " + name)
                                    //             .setAuthor({ name: authorName, iconURL: userAvatar })
                                    //             .setThumbnail(collectionLogo)
                                    //             .addFields(
                                    //                 { name: "Mint Spent", value: "`" + parseFloat(mintSpent).toFixed(3) + "₿ (" + parseFloat(mintSpent * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                    //                 { name: "Mint Gas Spent", value: "`" + parseFloat(mintGasSpent).toFixed(3) + "₿ (" + parseFloat(mintGasSpent * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                    //                 { name: "Total Mint Spent", value: "`" + parseFloat(totalMintSpent).toFixed(3) + "₿ (" + parseFloat(totalMintSpent * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                    //                 { name: "Buy Spent", value: "`" + parseFloat(buyMarketplaceSpent).toFixed(3) + "₿ (" + parseFloat(buyMarketplaceSpent * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                    //                 { name: "Buy Gas Spent", value: "`" + parseFloat(buyMarketplaceGasSpent).toFixed(3) + "₿ (" + parseFloat(buyMarketplaceGasSpent * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                    //                 { name: "Total Buy Spent", value: "`" + parseFloat(buyMarketplaceTotalSpent).toFixed(3) + "₿ (" + parseFloat(buyMarketplaceTotalSpent * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                    //                 { name: "Sold Value", value: "`" + parseFloat(soldValue).toFixed(3) + "₿ (" + parseFloat(soldValue * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                    //                 { name: "Sold Gas Value", value: "`" + parseFloat(soldGasValue).toFixed(3) + "₿ (" + parseFloat(soldGasValue * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                    //                 { name: "Total Sold Value", value: "`" + parseFloat(totalSoldValue).toFixed(3) + "₿ (" + parseFloat(totalSoldValue * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                    //                 { name: "NFT Mint Count", value: "`" + mintCount + "`", inline: true },
                                    //                 { name: "NFT Buy Count", value: "`" + buyMarketplaceCount + "`", inline: true },
                                    //                 { name: "NFT Total Count", value: "`" + totalBuyCount + "`", inline: true },
                                    //                 { name: "NFT Held Count", value: "`" + holdCount + "`", inline: true },
                                    //                 { name: "NFT Sold Count", value: "`" + soldCount + "`", inline: true },
                                    //                 { name: "NFT Transfer Count", value: "`" + transferCountFormated + "`", inline: true },
                                    //                 { name: "AVG Mint Value ", value: "`" + parseFloat(averageMintValue).toFixed(3) + "₿ (" + parseFloat(averageMintValue * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                    //                 { name: "AVG Buy Value ", value: "`" + parseFloat(averageBuyValue).toFixed(3) + "₿ (" + parseFloat(averageBuyValue * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                    //                 { name: "AVG Spent Value ", value: "`" + parseFloat(averageSpentValue).toFixed(3) + "₿ (" + parseFloat(averageSpentValue * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                    //                 { name: "AVG Sold Value", value: "`" + parseFloat(averageSoldValue).toFixed(3) + "₿ (" + parseFloat(averageSoldValue * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                    //                 { name: "AVG Held Value", value: "`" + parseFloat(averageHeldValue).toFixed(3) + "₿ (" + parseFloat(averageHeldValue * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                    //                 { name: "Total Held Value", value: "`" + parseFloat(totalHoldValue).toFixed(3) + "₿ (" + parseFloat(totalHoldValue * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                    //                 { name: "Realised Profit", value: "`" + parseFloat(realisedProfit).toFixed(3) + "₿ (" + parseFloat(realisedProfit * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                    //                 { name: "Potential Profit", value: "`" + parseFloat(potentialProfit).toFixed(3) + "₿ (" + parseFloat(potentialProfit * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                    //                 { name: "Potential ROI", value: roiFormatted, inline: true },
                                    //                 { name: " ", value: "*Please note that Aura isn't analyzing Blur V3 contract sales for the moment. We're working on it to make it available ASAP.*", inline: false },
                                    //                 //{ name: "Links", value: linksFormatted, inline: false },

                                    //             )
                                    //             .setTimestamp()
                                    //             .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                    //         await interaction.editReply({ embeds: [embed1], components: [buttonsRow] });



                                    //         await interactionData.destroy({ where: { authorId: authorId, commandName: "profit", serverId: serverId } })

                                    //         await interactionData.create({

                                    //             authorId: authorId,
                                    //             authorName: authorName,
                                    //             serverId: serverId,
                                    //             walletAddress: "N/A",
                                    //             commandName: "profit",
                                    //             interactionId: interaction.id,
                                    //             walletName: "N/A",
                                    //             selecedTimestamp: "N/A",
                                    //             embed1: "N/A",
                                    //             embed2: "N/A",
                                    //             embed3: "N/A",
                                    //             pageIndex: "N/A",
                                    //             actualPage: "N/A",
                                    //             walletCategory: "btc",
                                    //             selectedCollection: selectedCollection,
                                    //             collectionSlug: "N/A",
                                    //             collectionBanner: "N/A",
                                    //             avgDeriskPrice: "N/A",
                                    //             floorPrice: floorPrice.toString(),
                                    //             lowerMarketlace: "N/A",
                                    //             collectionName: name,
                                    //             collectionTwitter: "N/A",
                                    //             collectionWebsite: "N/A",
                                    //             buyCount: totalBuyCount.toString(),
                                    //             mintCount: mintCount.toString(),
                                    //             soldCount: soldCount.toString(),
                                    //             remaining: holdCount.toString(),
                                    //             avgBuy: parseFloat(averageSpentValue).toFixed(3),
                                    //             avgSold: parseFloat(averageSoldValue).toFixed(3),
                                    //             realisedProfit: parseFloat(realisedProfit).toFixed(3),
                                    //             potentialProfit: parseFloat(potentialProfit).toFixed(3),
                                    //             roi: roi.toString(),
                                    //             visualTitle: "N/A",
                                    //             userAvatar: userAvatar,
                                    //             nbMembersInvolved: "N/A",
                                    //             totalTradeCount: "N/A",

                                    //         })



                                    //     } else {

                                    //         const notMember = new EmbedBuilder().setColor("#060A8F")
                                    //             .setTitle("Profit")
                                    //             .setDescription("Aura can't analyze your wallet metrics because you selected a Ethereum collection and a Bitcoin wallet. Please try again selecting both a Bitcoin or Ethereum collection and wallet.")
                                    //             .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    //             .setAuthor({ name: authorName, iconURL: userAvatar })
                                    //             .setTimestamp()
                                    //             .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                    //         await interaction.editReply({ embeds: [notMember] });


                                    //     }






                                    // } else {


                                    //     const notMember = new EmbedBuilder().setColor("#060A8F")
                                    //         .setTitle("Profit")
                                    //         .setDescription("The collection you selected isn't valid. Please try again selecting a valid Bitcoin or Ethereum collection. You can also find the desired collection by using the contract address (Ethereum) or Magic Eden ID (Bitcoin).")
                                    //         .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    //         .setAuthor({ name: authorName, iconURL: userAvatar })
                                    //         .setTimestamp()
                                    //         .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                    //     await interaction.editReply({ embeds: [notMember] });




                                    // }

                                } else if (subcommand === "inscription") {

                                    const selectedID = interaction.options.getString("id");


                                    if (isValidBtcInscription(selectedID.toLowerCase())) {


                                        const btcCallPrice = await axios.get("https://blockchain.info/q/24hrprice")
                                        let BTCUsdPrice = btcCallPrice.data


                                        let isExistingInscription = true
                                        let call = ''

                                        try {

                                            call = await axios.get("https://api.hiro.so/ordinals/v1/inscriptions/" + selectedID.toLowerCase())


                                        } catch (error) {

                                            isExistingInscription = false

                                        }

                                        if (isExistingInscription == true) {

                                            const inscriptionNumber = call.data.number
                                            const inscriptionRarity = call.data.sat_rarity
                                            const inscriptionSatID = call.data.sat_ordinal
                                            const blockNumber = call.data.genesis_block_height
                                            const inscriptionCost = ((call.data.genesis_fee) / (10 ** 8)) + ((call.data.value) / (10 ** 8))
                                            const inscriptionDate = call.data.timestamp
                                            const inscriptionBlockHash = call.data.genesis_block_hash
                                            const inscriptionAddress = call.data.genesis_address
                                            const ownerAddress = call.data.address
                                            const inscriptionTxnHash = call.data.tx_id
                                            const inscriptionFullID = call.data.id


                                            const date = new Date(inscriptionDate);
                                            const dateLisible = date.toLocaleString();

                                            const date1 = moment(dateLisible, 'M/D/YYYY, h:mm:ss A');
                                            const formattedDate = date1.format('Do [of] MMMM YYYY');




                                            const marketOverviewEmbed1 = new EmbedBuilder().setColor("#060A8F")
                                                .setTitle(`Inscription details`)
                                                .setDescription(">>> Displaying the main data of the Bicoin insctiption.")
                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                .setThumbnail("https://ord-mirror.magiceden.dev/content/" + inscriptionFullID)
                                                .addFields(
                                                    { name: " ", value: " ", inline: false },
                                                    { name: "Inscription", value: "`#" + inscriptionNumber + "`", inline: true },
                                                    { name: "Sat. Rarity", value: "`" + capFirstLetter(inscriptionRarity) + "`", inline: true },
                                                    { name: "Sat. ID", value: "`" + inscriptionSatID + "`", inline: true },
                                                    { name: "Inscr. Block", value: "`" + blockNumber + "`", inline: true },
                                                    { name: "Inscr. Cost", value: "`" + inscriptionCost + "₿\n(" + new Intl.NumberFormat('en-US').format(parseFloat(BTCUsdPrice * inscriptionCost).toFixed(3)) + "$)`", inline: true },
                                                    { name: "Inscr. Date", value: "`" + formattedDate + "`", inline: true },
                                                    { name: "Author Address:", value: "`" + inscriptionAddress.toLowerCase() + "`", inline: false },
                                                    { name: "Genesis Txn:", value: "`" + inscriptionTxnHash.toLowerCase() + "`", inline: false },
                                                    { name: "Owner:", value: "`" + ownerAddress.toLowerCase() + "`", inline: false },
                                                    { name: "Links", value: '[inscription](https://ordinals.hiro.so/inscription/' + selectedID + ") ∙ " + '[owner](https://mempool.space/address/' + ownerAddress + ") ∙ " + '[genesis address](https://mempool.space/address/' + inscriptionAddress + ") ∙ " + '[transaction](https://mempool.space/tx/' + inscriptionTxnHash + ") ∙ " + '[block](https://mempool.space/block/' + inscriptionBlockHash + ")", inline: true },

                                                )
                                                .setTimestamp()
                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                            await interaction.editReply({ embeds: [marketOverviewEmbed1] });


                                        } else {


                                            const botOff = new EmbedBuilder().setColor("#060A8F")
                                                .setTitle("Invalid Inscription")
                                                .setDescription("The Bitcoin inscription you provided `" + selectedID.toLowerCase() + "` doesn't exist. Please try again using an existing Bitcoin inscription.")
                                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                .setTimestamp()
                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                            await interaction.editReply({ embeds: [botOff] });



                                        }

                                    } else {


                                        const botOff = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle("Invalid Inscription")
                                            .setDescription("The Bitcoin inscription you provided isn't valid. A Bitcoin inscription must be either a number, or a 66 characters string composed of letters and numbers.")
                                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                        await interaction.editReply({ embeds: [botOff] });



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





function createLink(slug, contract, twitter, website) {

    let baseLinks = '[opensea](https://opensea.io/collection/' + slug + ') ∙ ' +
        '[blur](https://blur.io/collection/' + contract + ') ∙ ' +
        '[magically](https://magically.gg/collection/' + contract + ') ∙ ' +
        '[nerds](https://app.nftnerds.ai/collection/' + contract + ') ∙ ' +
        //'[opensea pro](https://pro.opensea.io/collection/' + links.contract + ') ∙ ' +
        //'[tiny astro](https://tinyastro.io/en/analytics/eth/' + links.contract + ') ∙ ' +
        '[etherscan](https://app.nftnerds.ai/collection/' + contract + ')';

    if (twitter !== null) {
        baseLinks += ' ∙ [twitter](https://twitter.com/' + twitter + ')';
    }

    if (isHttps(website)) {
        baseLinks += ' ∙ [website](' + website + ')';
    }

    return baseLinks;
}