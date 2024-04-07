/**
 * @file Sample getdata command with slash command.
 * @author Vitality Migø
 */



const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { profileData, accessSql, reportsql, interactionData, wallets, apimonitorsql, adminsql, usersql, sequelize, infra_coin, tracker_nft, infra_nft } = require('../../../events/database');
const moment = require('moment');
const axios = require('axios')

// Param d'infrastructure
const { authPrivacyMulti, communityInfos, freeAccess } = require("../../../functions/infra-utils")
const privateCMD = []
const excluded = ['profit']

const { magiceden } = require("../../../config/web3config")

const { ordiProfit, ordiProfitMultiple } = require("../../../functions/ordicalculator")
const isHttps = require('../../../functions/isHttps')
const capFirstLetter = require("../../../functions/capfirstletter")

function estLienHTTPS(val) {
    var lienRegex = /^(https:\/\/)/i; // Regex pour vérifier si le lien commence par "https://"

    return lienRegex.test(val);
}
function formatWallet2(input) {
    return input.length > 35 ? `${input.substring(0, 4)}…${input.substring(input.length - 4)}` : input;
}


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

            const subcommand = interaction.options.getSubcommand()

            try {

                console.log("Initialization: executed ✅")

                // Récupère les infos de la communauté
                const community = await communityInfos(serverId)

                //Récupère régagle de privé/ou pas de l'utilisateur
                const privacy = await authPrivacyMulti(authorId, subcommand, privateCMD)
                if (privacy) { await interaction.deferReply({ ephemeral: true }) }
                else { await interaction.deferReply() }


                // Les vérifications
                if (community.statut) {

                    if (community.tier === 's-tier' || community.tier === 'a-tier' || freeAccess(subcommand, excluded)) {

                        if (member.roles.cache.has(community.member)) {


                            if (subcommand === "data") {

                                //   //Variable pour les options
                                const coinAddress = interaction.options.getString("collection");

                                // Prix du BTC
                                const cryptoUsdtPrice = await axios.get('https://api-testnet.bybit.com/v5/market/tickers?category=linear')
                                const BTCUsdtPrice = cryptoUsdtPrice.data.result.list.find(obj => obj.symbol === "BTCUSDT").lastPrice;



                                const url = `https://api-mainnet.magiceden.dev/v2/ord/btc/collections/` + coinAddress;
                                const response = await axios.get(url, { headers: magiceden });
                                const data = await response.data;



                                if (response.data) {
                                    // Il y'a bien une collection

                                    const description = data.description
                                    const collectionLogo = data.imageURI
                                    const supply = data.supply
                                    const name = data.name
                                    const twitter = data.twitterLink
                                    const discord = data.discordLink
                                    const website = data.websiteLink
                                    const created = data.createdAt


                                    const url2 = `https://api-mainnet.magiceden.dev/v2/ord/btc/stat?collectionSymbol=` + coinAddress;
                                    const response2 = await axios.get(url2, { headers: magiceden });
                                    const data2 = await response2.data;

                                    const totalVolume = (data2.totalVolume) / (10 ** 8)
                                    const owners = data2.owners
                                    const floorPrice = (data2.floorPrice) / (10 ** 8)
                                    const floorPriceUSD = floorPrice * BTCUsdtPrice
                                    const totalListed = data2.totalListed
                                    const inscriptionNumberMin = data2.inscriptionNumberMin
                                    const inscriptionNumberMax = data2.inscriptionNumberMax
                                    const marketcap = floorPrice * supply
                                    const marketcapUsd = floorPriceUSD * supply


                                    //Quelques calculs
                                    const listingRatio = (totalListed / supply) * 100;
                                    const holderRatio = (owners / supply) * 100;


                                    // On formatte la date
                                    const date = new Date(created);
                                    const jour = ('0' + date.getDate()).slice(-2); // Obtient le jour avec 2 chiffres
                                    const mois = ('0' + (date.getMonth() + 1)).slice(-2); // Obtient le mois avec 2 chiffres
                                    const annee = date.getFullYear(); // Obtient l'année
                                    const dateFormated = mois + "/" + jour + "/" + annee;



                                    const getDataCollectionAddress = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle(name)
                                        .setDescription(description)
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setThumbnail(collectionLogo)
                                        .addFields(
                                            { name: " ", value: " ", inline: false },
                                            { name: "BTC Price", value: "`" + parseFloat(floorPrice).toFixed(3) + "₿`", inline: true },
                                            { name: "USD Price", value: "`" + parseFloat(floorPriceUSD).toFixed(2) + "$`", inline: true },
                                            { name: " ", value: " ", inline: true },
                                            { name: "Total Supply", value: "`" + supply + "`", inline: true },
                                            { name: "Total Volume", value: "`" + parseFloat(totalVolume).toFixed(3) + "₿\n(" + Intl.NumberFormat('en-US').format(parseFloat(totalVolume * BTCUsdtPrice).toFixed(0)) + "$)`", inline: true },
                                            //{ name: "Ongoin Txn", value: "`" + pendingTxn + "`", inline: true },
                                            { name: " ", value: " ", inline: true },
                                            { name: "Total Listing", value: "`" + totalListed + "`", inline: true },
                                            { name: "Listing Ratio", value: "`" + parseFloat(listingRatio).toFixed(2) + "%`", inline: true },
                                            { name: " ", value: " ", inline: true },
                                            { name: "Total Owners", value: "`" + owners + "`", inline: true },
                                            { name: "Unique Owners", value: "`" + parseFloat(holderRatio).toFixed(2) + "%`", inline: true },
                                            { name: " ", value: " ", inline: true },
                                            { name: "Market Cap", value: "`" + parseFloat(marketcap).toFixed(3) + "₿\n(" + Intl.NumberFormat('en-US').format(parseFloat(marketcapUsd).toFixed(0)) + "$)`", inline: true },
                                            { name: "Inscription Gap", value: "`" + inscriptionNumberMin + " - " + inscriptionNumberMax + "`", inline: true },
                                            { name: "Created At", value: "`" + dateFormated + "`", inline: true },
                                            { name: "Links", value: '[magic eden](https://magiceden.io/ordinals/marketplace/' + coinAddress + ") ∙ " + '[twitter](' + twitter + ") ∙ " + '[discord](' + discord + ") ∙ " + '[website](' + website + ")", inline: false },
                                        )
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                    await interaction.editReply({ embeds: [getDataCollectionAddress] });

                                } else {
                                    // La collection n'est pas trouvé


                                    const setwalletErrorEmbed = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle(`Invalid Collection`)
                                        .setDescription("The NFT collection you provided isn't a valid Ordinal collection slug. Please try again using the appropriate form.")
                                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                    await interaction.editReply({ embeds: [setwalletErrorEmbed] });

                                }

                            } else if (subcommand === 'profit') {


                                /// API de Magic Eden renvoi "trop de request", à vérifier \\\
                                const slug = interaction.options.getString("collection");
                                const wallet = interaction.options.getString("wallet");
                                const timeframe = interaction.options.getString("timelapse");

                                const time = getTimestamp(timeframe)

                                if (isValidInput(slug)) {

                                    // Si le wallet est un wallet unique de type BRC20 on continu
                                    // sinon on descend dans le if.
                                    if (wallet !== 'all' && isBRC20BitcoinWallet(wallet)) {

                                        const data = await ordiProfit(slug, wallet, time)

                                        // On sépare les data entre le raw et le prettier
                                        // Les raw sont les data non traité
                                        // Les prettier sont pour l'embed
                                        const raw = data.raw
                                        const prettier = data.prettier
                                        const collection = data.collection

                                        // On rajoute un warning car parfois, on ne trouve pas le mint value correctement.
                                        // On compense avec un boutton permettant de modifier cette value.
                                        const warning = "*Some inscription creation transactions may not be detected by the bot. You can adjust the total mint value with the button below in case of an error.*"

                                        // Maintenat, on rajoute un composant aux bouttons s'il y'a plus qu'un mint.
                                        // Cela permet de limiter la triche.
                                        // On ajoute le boutton
                                        const visualBTN = new ActionRowBuilder()
                                            .addComponents(
                                                new ButtonBuilder()
                                                    .setCustomId('profitvisual-button')
                                                    .setLabel('visual')
                                                    .setStyle(2),
                                                new ButtonBuilder().setCustomId('ordiprofit-edit-mintvalue-button')
                                                    .setLabel('📝 Edit Mint Value')
                                                    .setStyle(2)
                                                    .setDisabled(raw.mint ? false : true)
                                            );

                                        //Embed getRCprofitPrecisedAll
                                        const answer = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle(collection.name)
                                            .setDescription(">>> Displaying the P&L made by `" + formatWallet2(wallet) + "`")
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setThumbnail(collection.icon)
                                            .addFields(
                                                { name: "Mint Value:", value: "`" + prettier.mintValue + "`", inline: true },
                                                { name: "Mint Gas:", value: "`" + prettier.mintGas + "`", inline: true },
                                                { name: "Mint Total:", value: "`" + prettier.mintTotal + "`", inline: true },

                                                { name: "Buy Value:", value: "`" + prettier.buyValue + "`", inline: true },
                                                { name: "Buy Gas:", value: "`" + prettier.buyGas + "`", inline: true },
                                                { name: "Buy Total:", value: "`" + prettier.buyTotal + "`", inline: true },

                                                { name: "Sales Value:", value: "`" + prettier.sellValue + "`", inline: true },
                                                { name: "Sales Gas:", value: "`" + prettier.sellGas + "`", inline: true },
                                                { name: "Sales Total:", value: "`" + prettier.sellTotal + "`", inline: true },

                                                { name: "Tokens Minted:", value: "`" + prettier.mint + "`", inline: true },
                                                { name: "Tokens Bought:", value: "`" + prettier.buy + "`", inline: true },
                                                { name: "Airdrop & Transfer:", value: "`" + prettier.airdrop + "`", inline: true },

                                                { name: "Tokens Sold:", value: "`" + prettier.sell + "`", inline: true },
                                                { name: "Tokens Held:", value: "`" + prettier.held + "`", inline: true },
                                                { name: "Transactions:", value: "`" + prettier.txs + "`", inline: true },

                                                { name: "Avg Mint Value:", value: "`" + prettier.avgMint + "`", inline: true },
                                                { name: "Avg Buy Value:", value: "`" + prettier.avgBuy + "`", inline: true },
                                                { name: "Avg Spent Value:", value: "`" + prettier.avgTotal + "`", inline: true },

                                                { name: "Avg Sold Value:", value: "`" + prettier.avgSold + "`", inline: true },
                                                { name: "Avg Held Value:", value: "`" + prettier.avgHeld + "`", inline: true },
                                                { name: "Avg Gas Value:", value: "`" + prettier.avgGas + "`", inline: true },

                                                { name: "Current P&L:", value: "`" + prettier.realisedPNL + "`", inline: true },
                                                { name: "Potential P&L:", value: "`" + prettier.potentialPNL + "`", inline: true },
                                                { name: "ROI:", value: "`" + prettier.potentialROI + "`", inline: true },

                                                { name: "Links", value: '[magiceden](https://magiceden.io/ordinals/marketplace/' + slug + ") ∙ " + '[ordi.market](https://ordinals.market/collection/' + slug + ") ∙ " + '[okx](https://www.okx.com/fr/web3/marketplace/nft/collection/btc/' + slug + ") ∙ " + '[ordi.wallet](https://ordinalswallet.com/collection/' + slug + ") ∙ " + '[memepool](https://mempool.space/fr/address/' + wallet + ')\n\n' + warning, inline: false },
                                            )
                                            .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                        await interaction.editReply({ embeds: [answer], components: [visualBTN] });

                                        // On enregistre les informations dans la base SQL
                                        // L'interaction sera récupéré pour générer le visuel de profit
                                        await interactionData.destroy({ where: { authorId: authorId, commandName: "profit", serverId: serverId } })

                                        await interactionData.create({

                                            authorId: authorId,
                                            authorName: authorName,
                                            serverId: serverId,
                                            commandName: "profit",
                                            interactionId: interaction.id,
                                            walletCategory: "btc",
                                            selectedCollection: collection.contract,
                                            floorPrice: collection.floor.toString(),
                                            collectionName: collection.name,
                                            mintCount: raw.mint.toString(),
                                            buyCount: raw.buy.toString(),
                                            soldCount: raw.sell.toString(),
                                            remaining: raw.held.toString(),
                                            avgBuy: parseFloat(raw.avgTotal).toFixed(4),
                                            avgSold: parseFloat(raw.avgSold).toFixed(4),
                                            realisedProfit: parseFloat(raw.realisedPNL).toFixed(4),
                                            potentialProfit: parseFloat(raw.potentialPNL).toFixed(4),
                                            roi: raw.potentialROI.toString(),
                                            totalTradeCount: JSON.stringify({
                                                buy: (raw.buyTotal + raw.mintTotal).toString(),
                                                sell: raw.sellTotal.toString(),
                                            }),
                                            userAvatar: userAvatar,
                                            embed1: collection.btcPrice.toString(),
                                            embed3: JSON.stringify(data)
                                        })

                                    } else if (wallet.toLowerCase() === 'all') {

                                        // Il y'a plusieurs wallets séléctionné, par conséquent on utilise
                                        // la fonction multiple wallet.

                                        // On récupère les wallets de l'utilisateur, puis on les map pour pouvoir les mettre dans
                                        // un array qu'on met en lower cases.
                                        const storage = await wallets.findAll({ where: { authorId: authorId, walletCategory: "btc" } })
                                        const walletList = storage.map(i => i.dataValues.walletAddress)
                                        const count = walletList.length

                                        // On vérifie que l'utilisateur a des wallets, sinon on renvoi une
                                        // erreur qui dit qu'il n'y a plus de wallets.
                                        if (count > 0) {


                                            // On calcul les profits grâce à notre fonction
                                            const data = await ordiProfitMultiple(slug, walletList, time)

                                            if (data) {


                                                // On sépare les data entre le raw et le prettier
                                                // Les raw sont les data non traité
                                                // Les prettier sont pour l'embed
                                                const raw = data.raw
                                                const prettier = data.prettier
                                                const collection = data.collection

                                                // On rajoute un warning car parfois, on ne trouve pas le mint value correctement.
                                                // On compense avec un boutton permettant de modifier cette value.
                                                const warning = "*Some inscription creation transactions may not be detected by the bot. You can adjust the total mint value with the button below in case of an error.*"

                                                // Maintenat, on rajoute un composant aux bouttons s'il y'a plus qu'un mint.
                                                // Cela permet de limiter la triche.
                                                // On ajoute le boutton
                                                const visualBTN = new ActionRowBuilder()
                                                    .addComponents(
                                                        new ButtonBuilder()
                                                            .setCustomId('profitvisual-button')
                                                            .setLabel('visual')
                                                            .setStyle(2),
                                                        new ButtonBuilder().setCustomId('ordiprofit-edit-mintvalue-button')
                                                            .setLabel('📝 Edit Mint Value')
                                                            .setStyle(2)
                                                            .setDisabled(raw.mint ? false : true)
                                                    );

                                                //Embed getRCprofitPrecisedAll
                                                const answer = new EmbedBuilder().setColor("#060A8F")
                                                    .setTitle(collection.name)
                                                    .setDescription(">>> Displaying the P&L made by `" + count + "` wallets")
                                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                                    .setThumbnail(collection.icon)
                                                    .addFields(
                                                        { name: "Mint Value:", value: "`" + prettier.mintValue + "`", inline: true },
                                                        { name: "Mint Gas:", value: "`" + prettier.mintGas + "`", inline: true },
                                                        { name: "Mint Total:", value: "`" + prettier.mintTotal + "`", inline: true },

                                                        { name: "Buy Value:", value: "`" + prettier.buyValue + "`", inline: true },
                                                        { name: "Buy Gas:", value: "`" + prettier.buyGas + "`", inline: true },
                                                        { name: "Buy Total:", value: "`" + prettier.buyTotal + "`", inline: true },

                                                        { name: "Sales Value:", value: "`" + prettier.sellValue + "`", inline: true },
                                                        { name: "Sales Gas:", value: "`" + prettier.sellGas + "`", inline: true },
                                                        { name: "Sales Total:", value: "`" + prettier.sellTotal + "`", inline: true },

                                                        { name: "Tokens Minted:", value: "`" + prettier.mint + "`", inline: true },
                                                        { name: "Tokens Bought:", value: "`" + prettier.buy + "`", inline: true },
                                                        { name: "Airdrop & Transfer:", value: "`" + prettier.airdrop + "`", inline: true },

                                                        { name: "Tokens Sold:", value: "`" + prettier.sell + "`", inline: true },
                                                        { name: "Tokens Held:", value: "`" + prettier.held + "`", inline: true },
                                                        { name: "Transactions:", value: "`" + prettier.txs + "`", inline: true },

                                                        { name: "Avg Mint Value:", value: "`" + prettier.avgMint + "`", inline: true },
                                                        { name: "Avg Buy Value:", value: "`" + prettier.avgBuy + "`", inline: true },
                                                        { name: "Avg Spent Value:", value: "`" + prettier.avgTotal + "`", inline: true },

                                                        { name: "Avg Sold Value:", value: "`" + prettier.avgSold + "`", inline: true },
                                                        { name: "Avg Held Value:", value: "`" + prettier.avgHeld + "`", inline: true },
                                                        { name: "Avg Gas Value:", value: "`" + prettier.avgGas + "`", inline: true },

                                                        { name: "Current P&L:", value: "`" + prettier.realisedPNL + "`", inline: true },
                                                        { name: "Potential P&L:", value: "`" + prettier.potentialPNL + "`", inline: true },
                                                        { name: "ROI:", value: "`" + prettier.potentialROI + "`", inline: true },

                                                        { name: "Links", value: '[magiceden](https://magiceden.io/ordinals/marketplace/' + slug + ") ∙ " + '[ordi.market](https://ordinals.market/collection/' + slug + ") ∙ " + '[okx](https://www.okx.com/fr/web3/marketplace/nft/collection/btc/' + slug + ") ∙ " + '[ordi.wallet](https://ordinalswallet.com/collection/' + slug + ") ∙ " + '[memepool](https://mempool.space/fr/address/' + wallet + ')\n\n' + warning, inline: false },
                                                    )
                                                    .setTimestamp()
                                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                                await interaction.editReply({ embeds: [answer], components: [visualBTN] });

                                                // On enregistre les informations dans la base SQL
                                                // L'interaction sera récupéré pour générer le visuel de profit
                                                await interactionData.destroy({ where: { authorId: authorId, commandName: "profit", serverId: serverId } })

                                                await interactionData.create({

                                                    authorId: authorId,
                                                    authorName: authorName,
                                                    serverId: serverId,
                                                    commandName: "profit",
                                                    interactionId: interaction.id,
                                                    walletCategory: "btc",
                                                    selectedCollection: collection.contract,
                                                    floorPrice: collection.floor.toString(),
                                                    collectionName: collection.name,
                                                    mintCount: raw.mint.toString(),
                                                    buyCount: raw.buy.toString(),
                                                    soldCount: raw.sell.toString(),
                                                    remaining: raw.held.toString(),
                                                    avgBuy: parseFloat(raw.avgTotal).toFixed(4),
                                                    avgSold: parseFloat(raw.avgSold).toFixed(4),
                                                    realisedProfit: parseFloat(raw.realisedPNL).toFixed(4),
                                                    potentialProfit: parseFloat(raw.potentialPNL).toFixed(4),
                                                    roi: raw.potentialROI.toString(),
                                                    totalTradeCount: JSON.stringify({
                                                        buy: (raw.buyTotal + raw.mintTotal).toString(),
                                                        sell: raw.sellTotal.toString(),
                                                    }),
                                                    userAvatar: userAvatar,
                                                    embed1: collection.btcPrice.toString(),
                                                    embed3: JSON.stringify(data)
                                                })


                                            } else {

                                                const notMember = new EmbedBuilder().setColor("#060A8F")
                                                    .setTitle(`Ordinals Profit`)
                                                    .setDescription("Aura can't analyze your wallet's profit data. Please try again or contact our team if the error persists.")
                                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                                    .setTimestamp()
                                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                                await interaction.editReply({ embeds: [notMember] });

                                            }

                                        } else {

                                            const notMember = new EmbedBuilder().setColor("#060A8F")
                                                .setTitle(`NFT Profit`)
                                                .setDescription("Aura can't analyze your wallet's data because you don't have any Ethereum wallet registered. Please use try again after adding wallets to your profile.")
                                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                .setTimestamp()
                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                            await interaction.editReply({ embeds: [notMember] });

                                        }

                                    } else {

                                        const notMember = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle("Profit")
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
                let reportCommand = "/cryptoprofit"


                const timeStamp = Date.now();
                const date = new Date(timeStamp);
                const dateLisible = date.toLocaleString();
                const date1 = moment(dateLisible, 'M/D/YYYY, h:mm:ss A');
                const formattedDate = date1.format('Do [of] MMMM YYYY');



                // //On enregistre le call
                // await reportsql.create({
                //     botId: botId,
                //     authorId: "Bot",
                //     serverName: serverName,
                //     authorRole: userHighestRole,
                //     serverId: serverId,
                //     date: formattedDate,
                //     reportType: "Bug",
                //     reportCommand: reportCommand,
                //     reportDescription: "```" + error.stack + "```",
                //     reportPriority: "5",
                //     reportState: "Not treated",
                // })



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
                        { name: "Content:", value: "A new `bug` has been submitted for the `" + reportCommand + "` command by `the bot report division` by `" + authorId + "`. You can use the administrator dashboard to consult it.", inline: false },
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


// Fonction qui permet de calculer le timestamp
// Le timestamp est en secondes, pas millisecondes
function getTimestamp(selectedTime) {
    //Ajustement du Timestamp
    const actualTimestamp = parseFloat(Date.now() / 1000).toFixed(0)
    let selectedTimestamp = 0

    if (selectedTime === "1 Day") { selectedTimestamp = actualTimestamp - 86400 }
    if (selectedTime === "3 Days") { selectedTimestamp = actualTimestamp - 259200 }
    if (selectedTime === "7 Days") { selectedTimestamp = actualTimestamp - 604800 }
    if (selectedTime === "14 Days") { selectedTimestamp = actualTimestamp - 1209600 }
    if (selectedTime === "30 Days") { selectedTimestamp = actualTimestamp - 2592000 }
    if (selectedTime === "90 Days") { selectedTimestamp = actualTimestamp - 7776000 }
    if (selectedTime === "1 Year") { selectedTimestamp = actualTimestamp - 31536000 }

    return selectedTimestamp
}