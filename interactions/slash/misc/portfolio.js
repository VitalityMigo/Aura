/**
 * @file Sample getdata command with slash command.
 * @author Vitality Migø
 */



const { ActionRowBuilder, ButtonBuilder, EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { profileData, accessSql, interactionData, wallets, apimonitorsql, adminsql, reportsql, usersql, sequelize } = require('../../../events/database');
const moment = require('moment');

//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const etherscanApiKey = process.env.etherscanApiKey
const nftgoApiKey = process.env.nftgoApiKey
const reservoirApiKey = process.env.reservoirApiKey
const blockspanApiKey = process.env.blockspanApiKey
const magicedenApiKey = process.env.magicedenApiKey


// Configuration de l'en-tête d'autorisation
const headers = {
    'Authorization': `Bearer ${magicedenApiKey}`
};

//https request
const axios = require('axios')

//Reservoir API
const sdk = require('api')('@reservoirprotocol/v2.0#2672bklexdpsbi');
sdk.auth(reservoirApiKey);

//Reservoir API V2
const sdk2 = require('api')('@reservoirprotocol/v2.0#1xltvr918dlfmst76l');
sdk2.auth(reservoirApiKey);
sdk2.server('https://api.reservoir.tools');

//Block Span API
const bsp = require('api')('@blockspan/v1.0#9zxl2sledru983');
bsp.auth(blockspanApiKey);

//Web3 API + Cloudfare Provider
var Web3 = require("web3")
const web3 = new Web3("https://cloudflare-eth.com")

//NFT GO API
const nftGo = require('api')('@nftgo/v1.0#i65d19lewn3l7h');
nftGo.auth(nftgoApiKey);

function isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);

}

function isBRC20BitcoinWallet(wallet) {
    const regex = /^bc1[a-zA-Z0-9]{39,59}$/;

    return regex.test(wallet);
}

const chartVisual = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('chartgenerator-button')
            .setLabel('visual')
            .setStyle(2),
    );

const chartVisual1 = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('chartgenerator-button')
            .setLabel('visual')
            .setStyle(2)
            .setDisabled(true),
    );

const chartVisualAll = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('chartgenerator-button')
            .setLabel('visual')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('portfolioswitchBTC-button')
            // .setLabel('BTC')
            .setEmoji("<:RCBTC:1123219824282189834>")
            .setStyle(3),
    );

const chartVisualAllNoVisual = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('chartgenerator-button')
            .setLabel('visual')
            .setStyle(2)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId('portfolioswitchBTC-button')
            // .setLabel('BTC')
            .setEmoji("<:RCBTC:1123219824282189834>")
            .setStyle(3),
    );




module.exports = {
    data: new SlashCommandBuilder()
        .setName("portfolio")
        .setDescription("Display your metrics summary on a specific wallet or on all your portfolio")
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



                            //Récupérer liste des wallets
                            let allWalletAddressOfAuthorTable = []
                            const allWalletsOfAuthor = await wallets.findAll({ where: { authorId: authorId } });
                            for (let i = 0; i < allWalletsOfAuthor.length; i++) {
                                allWalletAddressOfAuthorTable.push(allWalletsOfAuthor[i].dataValues.walletAddress);

                            }


                            //Variable pour les options
                            const selectedWallet = interaction.options.getString("wallet");



                            if (selectedWallet !== "All") {



                                //Si wallet ETH
                                if (isValidEthereumAddress(selectedWallet)) {

                                    const ethUsdPrice = await axios.get('https://api.etherscan.io/api?module=stats&action=ethprice&apikey=' + etherscanApiKey)
                                    const ethUsdPriceFormatted = await ethUsdPrice.data.result.ethusd


                                    const precisedWalletFind = await wallets.findOne({ where: { authorId: authorId, walletAddress: selectedWallet } });
                                    let precisedWalletNameofAuthor = ""
                                    if (precisedWalletFind !== null) {
                                        precisedWalletNameofAuthor = precisedWalletFind.dataValues.walletName + " (" + selectedWallet.substring(0, 5) + "..." + selectedWallet.substring(selectedWallet.length - 4, selectedWallet.length) + ")"
                                    } else { precisedWalletNameofAuthor = selectedWallet.substring(0, 5) + "..." + selectedWallet.substring(selectedWallet.length - 4, selectedWallet.length) }



                                    //On déclare deux variables
                                    let nftsValueEth = 0
                                    let nftsValueUsd = 0
                                    let walletValue = 0
                                    let top50CollectionTable = []



                                    //On récupère la balance de token
                                    const ethBalance = await web3.eth.getBalance(selectedWallet)
                                    const wethBalance = await axios.get('https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2&address=' + selectedWallet + '&tag=latest&apikey=' + etherscanApiKey)
                                    const usdcBalance = await axios.get('https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&address=' + selectedWallet + '&tag=latest&apikey=' + etherscanApiKey)
                                    const blurBalance = await axios.get('https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0x5283D291DBCF85356A21bA090E6db59121208b44&address=' + selectedWallet + '&tag=latest&apikey=' + etherscanApiKey)
                                    const apeBalance = await axios.get('https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0x4d224452801ACEd8B2F0aebE155379bb5D594381&address=' + selectedWallet + '&tag=latest&apikey=' + etherscanApiKey)
                                    const blurPoolBalance = await axios.get('https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0x0000000000A39bb272e79075ade125fd351887Ac&address=' + selectedWallet + '&tag=latest&apikey=' + etherscanApiKey)


                                    const ethBalanceFormatted = parseFloat(web3.utils.fromWei((ethBalance).toString(), 'ether'))
                                    const wethBalanceFormatted = wethBalance.data.result / (10 ** 18)
                                    const usdcBalanceFormatted = usdcBalance.data.result / (10 ** 6)
                                    const blurBalanceFormatted = blurBalance.data.result / (10 ** 18)
                                    const apeBalanceFormatted = apeBalance.data.result / (10 ** 18)
                                    const blurPoolBalanceFormatted = blurPoolBalance.data.result / (10 ** 18)


                                    // On récupère le prix USD des différentes cryptos
                                    const cryptoUsdtPrice = await axios.get('https://api-testnet.bybit.com/v5/market/tickers?category=linear')

                                    //const usdcUsdTPrice = cryptoUsdtPrice.data.result.list.find(obj => obj.symbol === "USDCUSDT").lastPrice;
                                    const usdcUsdTPrice = 1
                                    const blurUsdTPrice = cryptoUsdtPrice.data.result.list.find(obj => obj.symbol === "BLURUSDT").lastPrice;
                                    const apeUsdTPrice = cryptoUsdtPrice.data.result.list.find(obj => obj.symbol === "APEUSDT").lastPrice;

                                    //On récupère les variables pour formatter 
                                    let erc20lignsize = 42
                                    let wethSpaceSize = erc20lignsize - 27 - (wethBalanceFormatted.toFixed(3)).length - ((ethUsdPriceFormatted * wethBalanceFormatted).toFixed(0)).length
                                    let usdcSpaceSize = erc20lignsize - 24 - (usdcBalanceFormatted.toFixed(3)).length - ((usdcUsdTPrice * usdcBalanceFormatted).toFixed(0)).length
                                    let blurSpaceSize = erc20lignsize - 20 - (blurBalanceFormatted.toFixed(3)).length - ((blurUsdTPrice * blurBalanceFormatted).toFixed(0)).length
                                    let apeSpaceSize = erc20lignsize - 23 - (apeBalanceFormatted.toFixed(3)).length - ((apeUsdTPrice * apeBalanceFormatted).toFixed(0)).length

                                    //Incrémenter le space pour les ERC20
                                    let wethSpaceLenght = ""
                                    for (let i = 0; i < wethSpaceSize; i++) { wethSpaceLenght += " " }
                                    let usdcSpaceLenght = ""
                                    for (let i = 0; i < usdcSpaceSize; i++) { usdcSpaceLenght += " " }
                                    let blurSpaceLenght = ""
                                    for (let i = 0; i < blurSpaceSize; i++) { blurSpaceLenght += " " }
                                    let apeSpaceLenght = ""
                                    for (let i = 0; i < apeSpaceSize; i++) { apeSpaceLenght += " " }




                                    let nftsOverview = "";


                                    nftGo.get_metrics_eth_v2_address_metrics_get({ address: selectedWallet })
                                        .then(async ({ data: nftGoData }) => {

                                            nftsValueEth = nftGoData.portfolio_value.eth
                                            nftsValueUsd = nftGoData.portfolio_value.usd


                                            sdk2.getUsersUserCollectionsV2({ limit: '100', sortBy: 'allTimeVolume', user: selectedWallet, accept: '*/*' })
                                                .then(async ({ data }) => {


                                                    // Tri du tableau JSON en fonction de la valeur "floorAsk * tokenCount" de chaque objet "collection" en ordre décroissant
                                                    let sortedByFloor = data.collections.sort((a, b) => b.collection.floorAskPrice * b.ownership.tokenCount - a.collection.floorAskPrice * a.ownership.tokenCount);


                                                    // Sélection des 12 premiers objets triés du tableau JSON
                                                    let top12Collections = await sortedByFloor.slice(0, 13);



                                                    await top12Collections.forEach(collection => {

                                                        const na = collection.collection.slug.toString()
                                                        const name = na.toLowerCase()
                                                        const tokenCount = collection.ownership.tokenCount;
                                                        let totalPriceUsd = 0
                                                        let floorAskPrice = 0
                                                        let totalPrice = 0
                                                        let totalPriceUs = 0

                                                        if (collection.collection.floorAskPrice) {
                                                            floorAskPrice = (collection.collection.floorAskPrice).toFixed(3)
                                                            totalPrice = (tokenCount * floorAskPrice).toFixed(3)
                                                            totalPriceUs = (totalPrice * ethUsdPriceFormatted).toFixed(0)
                                                            totalPriceUsd = new Intl.NumberFormat('en-US').format(totalPriceUs)

                                                        } else if (!collection.collection.floorAskPrice) {

                                                            floorAskPrice = "0.000"
                                                            totalPrice = "0.000"
                                                            totalPriceUs = "0"
                                                            totalPriceUsd = "0"

                                                        }

                                                        let lignMaxSize = 70
                                                        let leftPartNfts = "`" + name + " ∙ " + tokenCount + " Owned ∙ " + floorAskPrice + "Ξ"
                                                        let rightPartNfts = totalPrice + "Ξ (" + totalPriceUsd + "$)`\n"
                                                        let leftPartNFTsLenght = leftPartNfts.length
                                                        let rightPartNftsLenght = rightPartNfts.length
                                                        let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                                                        let spaceLenght = ""
                                                        for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }


                                                        nftsOverview += "`" + name + " ∙ " + tokenCount + " Owned ∙ " + floorAskPrice + "Ξ" + spaceLenght + totalPrice + "Ξ (" + totalPriceUsd + "$)`\n";


                                                    });

                                                    ////////////////////////////////////////////////////////////////////////////////////////////////////////////





                                                    //Rajouter le if + le prix des autres tokens + Blur Pool
                                                    walletValue = nftsValueEth + ethBalanceFormatted + blurPoolBalanceFormatted + wethBalanceFormatted + (usdcBalanceFormatted / ethUsdPriceFormatted) + (blurUsdTPrice * blurBalanceFormatted / ethUsdPriceFormatted) + (apeUsdTPrice * apeBalanceFormatted / ethUsdPriceFormatted)


                                                    if (nftsOverview == "") { nftsOverview = "`No Ethereum NFTs owned                                             `  \n" }

                                                    console.log(ethUsdPrice.data.result)
                                                    console.log(ethUsdPriceFormatted)


                                                    const getPortfolioOneWallet = new EmbedBuilder().setColor("#060A8F")
                                                        .setTitle(`${authorName}'s portfolio`)
                                                        .setDescription(">>> Showing Ethereum portfolio data")
                                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                                        //.setImage([image])
                                                        .addFields(
                                                            { name: "Wallet", value: "`" + precisedWalletNameofAuthor + "`", inline: false },
                                                            { name: "Wallet Value", value: "`" + walletValue.toFixed(3) + "Ξ (" + (ethUsdPriceFormatted * walletValue).toFixed(0) + "$)`", inline: true },
                                                            { name: "ETH Value", value: "`" + ethBalanceFormatted.toFixed(3) + "Ξ (" + (ethUsdPriceFormatted * ethBalanceFormatted).toFixed(0) + "$)`", inline: true },
                                                            { name: "NFTs Value", value: "`" + nftsValueEth.toFixed(3) + "Ξ (" + nftsValueUsd.toFixed(0) + "$)`", inline: true },
                                                            { name: "ERC 20 Tokens", value: "`Wrapped ETH (wETH): " + wethSpaceLenght + wethBalanceFormatted.toFixed(3) + " (" + (ethUsdPriceFormatted * wethBalanceFormatted).toFixed(0) + "$)`\n`USD Coin (USDC): " + usdcSpaceLenght + usdcBalanceFormatted.toFixed(3) + " (" + (usdcUsdTPrice * usdcBalanceFormatted).toFixed(0) + "$)`\n`Blur (BLUR): " + blurSpaceLenght + blurBalanceFormatted.toFixed(3) + " (" + (blurUsdTPrice * blurBalanceFormatted).toFixed(0) + "$)`\n`Ape Coin (APE): " + apeSpaceLenght + apeBalanceFormatted.toFixed(3) + " (" + (apeUsdTPrice * apeBalanceFormatted).toFixed(0) + "$)`", inline: false },
                                                            { name: "NFTs Overview", value: nftsOverview, inline: false },
                                                            // { name: "Wallet ETH Chart", value: "`XXX`", inline: false },



                                                        )
                                                        .setTimestamp()
                                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                                    await interaction.editReply({ embeds: [getPortfolioOneWallet], components: [chartVisual] });




                                                    //On enregistre le call API dans la database
                                                    const timeStamp = Date.now();
                                                    await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/portfolio", apiCallName: "ethBalance", apiProvider: "web3.eth", timestamp: timeStamp.toString() })
                                                    await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/portfolio", apiCallName: "wethBalance", apiProvider: "etherscan", timestamp: timeStamp.toString() })
                                                    await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/portfolio", apiCallName: "usdcBalance", apiProvider: "etherscan", timestamp: timeStamp.toString() })
                                                    await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/portfolio", apiCallName: "blurBalance", apiProvider: "etherscan", timestamp: timeStamp.toString() })
                                                    await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/portfolio", apiCallName: "apeBalance", apiProvider: "etherscan", timestamp: timeStamp.toString() })
                                                    await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/portfolio", apiCallName: "blurPoolBalance", apiProvider: "etherscan", timestamp: timeStamp.toString() })
                                                    await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/portfolio", apiCallName: "cryptoUsdtPrice", apiProvider: "bybit", timestamp: timeStamp.toString() })
                                                    await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/portfolio", apiCallName: "ethUsdPrice", apiProvider: "etherscan", timestamp: timeStamp.toString() })
                                                    await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/portfolio", apiCallName: "get_metrics_eth_v2_address_metrics_get", apiProvider: "nftGo", timestamp: timeStamp.toString() })
                                                    await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/portfolio", apiCallName: "getUsersUserCollectionsV2", apiProvider: "reservoir", timestamp: timeStamp.toString() })




                                                })
                                        })


                                    //On fait le call à la base SQL
                                    await interactionData.destroy({ where: { authorId: authorId, commandName: "portfolio", serverId: serverId } })

                                    await interactionData.create({

                                        authorId: authorId,
                                        authorName: authorName,
                                        serverId: serverId,
                                        commandName: "portfolio",
                                        interactionId: interaction.id,
                                        walletAddress: selectedWallet,
                                        walletCategory: "N/A",
                                        embed1: "N/A",
                                        embed2: "N/A",
                                        embed3: "N/A",
                                        pageIndex: "N/A",
                                        actualPage: "N/A",
                                        walletName: "N/A",
                                        selecedTimestamp: "N/A",
                                        selectedCollection: "N/A",
                                        collectionSlug: "N/A",
                                        collectionBanner: "N/A",
                                        avgDeriskPrice: "N/A",
                                        floorPrice: "N/A",
                                        lowerMarketlace: "N/A",
                                        collectionName: "N/A",
                                        collectionTwitter: "N/A",
                                        collectionWebsite: "N/A",
                                        buyCount: "N/A",
                                        soldCount: "N/A",
                                        remaining: "N/A",
                                        avgBuy: "N/A",
                                        avgSold: "N/A",
                                        realisedProfit: "N/A",
                                        potentialProfit: "N/A",
                                        roi: "N/A",
                                        visualTitle: "N/A",
                                        userAvatar: userAvatar,
                                        nbMembersInvolved: "N/A",
                                        totalTradeCount: "N/A",

                                    })


                                } else if (isBRC20BitcoinWallet(selectedWallet)) {



                                    const precisedWalletFind = await wallets.findOne({ where: { authorId: authorId, walletAddress: selectedWallet } });
                                    let precisedWalletNameofAuthor = ""
                                    if (precisedWalletFind !== null) {
                                        precisedWalletNameofAuthor = precisedWalletFind.dataValues.walletName + " (" + selectedWallet.substring(0, 5) + "..." + selectedWallet.substring(selectedWallet.length - 4, selectedWallet.length) + ")"
                                    } else { precisedWalletNameofAuthor = selectedWallet.substring(0, 5) + "..." + selectedWallet.substring(selectedWallet.length - 4, selectedWallet.length) }



                                    const btcCallPrice = await axios.get("https://blockchain.info/q/24hrprice")
                                    let BTCUsdPrice = btcCallPrice.data


                                    const balance = await axios.get("https://blockchain.info/q/addressbalance/" + selectedWallet + "?confirmations=3")
                                    const walletBTCBalance = parseFloat((balance.data) / (10 ** 8)).toFixed(3)



                                    const brc20Call = await axios.get("https://api.bestinslot.xyz/v3/brc20/wallet_balances?address=" + selectedWallet)
                                    const Brc20Data = brc20Call.data.data

                                    // Tri du tableau JSON en fonction de la valeur "floorAsk * tokenCount" de chaque objet "collection" en ordre décroissant
                                    const sortedByToken = Brc20Data.sort((a, b) => b.overall_balance - a.overall_balance);

                                    // Sélection des 5 premiers tokens
                                    const top5tokens = sortedByToken.slice(0, 5);

                                    let BRC20Overview = ""

                                    console.log(top5tokens)

                                    for (const coin of top5tokens) {

                                        let name = (coin.ticker).charAt(0).toUpperCase() + (coin.ticker).slice(1);
                                        let symbol = (coin.ticker).toUpperCase()
                                        let balance = parseFloat(coin.overall_balance).toFixed(0)

                                        let lignMaxSize = 42
                                        let leftPartNfts = "`" + name + " (" + symbol + "):"
                                        let rightPartNfts = new Intl.NumberFormat('en-US').format(parseFloat(balance).toFixed(0)) + ' owned`\n'
                                        let leftPartNFTsLenght = leftPartNfts.length
                                        let rightPartNftsLenght = rightPartNfts.length
                                        let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                                        let spaceLenght = ""
                                        for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }


                                        BRC20Overview += "`" + name + " (" + symbol + "):" + spaceLenght + new Intl.NumberFormat('en-US').format(parseFloat(balance).toFixed(0)) + ' owned`\n';

                                    }




                                    const url5 = `https://api-mainnet.magiceden.dev/v2/ord/btc/tokens?ownerAddress=${selectedWallet}&showAll=true&sortBy=priceDesc`;
                                    const response5 = await axios.get(url5, { headers });
                                    const data5 = await response5.data;



                                    // Filtrer les objets qui ne contiennent pas de valeur collectionSymbol
                                    const filteredTokens = data5.tokens.filter(token => token.collectionSymbol);

                                    // Créer un tableau récapitulatif avec le nombre d'occurrences de chaque valeur collectionSymbol
                                    const summary = filteredTokens.reduce((acc, token) => {
                                        const symbol = token.collectionSymbol;
                                        if (acc[symbol]) {
                                            acc[symbol]++;
                                        } else {
                                            acc[symbol] = 1;
                                        }
                                        return acc;
                                    }, {});



                                    let fullBRC721Summary = []
                                    let NFTTotalValue = 0

                                    for (const collectionSymbol in summary) {

                                        let obj = {}

                                        const url6 = `https://api-mainnet.magiceden.dev/v2/ord/btc/stat?collectionSymbol=${collectionSymbol}`;
                                        const response6 = await axios.get(url6, { headers });
                                        const data6 = await response6.data;

                                        if (data6.floorPrice) {

                                            obj.name = collectionSymbol
                                            obj.floorPrice = (data6.floorPrice) / (10 ** 8)
                                            obj.owned = summary[collectionSymbol]
                                            obj.value = ((data6.floorPrice) / (10 ** 8)) * summary[collectionSymbol]

                                            fullBRC721Summary.push(obj)
                                            NFTTotalValue += (data6.floorPrice) / (10 ** 8)
                                        }
                                    }


                                    // Tri du tableau JSON en fonction de la valeur "floorAsk * tokenCount" de chaque objet "collection" en ordre décroissant
                                    const sortedByValue = fullBRC721Summary.sort((a, b) => b.value - a.value);



                                    // Sélection des 13 premiers objets triés du tableau JSON
                                    const top13Collections = sortedByValue.slice(0, 13);




                                    let nftsOverview = ""

                                    for (const obj of top13Collections) {

                                        const name = (obj.name).toLowerCase()
                                        const tokenCount = obj.owned
                                        let totalPriceUsd = 0
                                        let floorAskPrice = 0
                                        let totalPrice = 0
                                        let totalPriceUs = 0

                                        floorAskPrice = parseFloat(obj.floorPrice).toFixed(3)
                                        totalPrice = parseFloat(obj.value).toFixed(3)
                                        totalPriceUs = (totalPrice * BTCUsdPrice).toFixed(0)
                                        totalPriceUsd = new Intl.NumberFormat('en-US').format(totalPriceUs)



                                        let lignMaxSize = 70
                                        let leftPartNfts = "`" + name + " ∙ " + tokenCount + " Owned ∙ " + floorAskPrice + "₿"
                                        let rightPartNfts = totalPrice + "₿ (" + totalPriceUsd + "$)`\n"
                                        let leftPartNFTsLenght = leftPartNfts.length
                                        let rightPartNftsLenght = rightPartNfts.length
                                        let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                                        let spaceLenght = ""
                                        for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }


                                        nftsOverview += "`" + name + " ∙ " + tokenCount + " Owned ∙ " + floorAskPrice + "₿" + spaceLenght + totalPrice + "₿ (" + totalPriceUsd + "$)`\n";


                                    };



                                    const walletValue = parseInt(walletBTCBalance) + NFTTotalValue


                                    if (BRC20Overview == "") { BRC20Overview = "`No BRC20 tokens owned                      `" }
                                    if (nftsOverview == "") { nftsOverview = "`No Ordinal NFTs owned                                             `  \n" }

                                    const getPortfolioOneWallet = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle(`${authorName}'s portfolio`)
                                        .setDescription(">>> Showing Bitcoin portfolio data")
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        //.setImage([image])
                                        .addFields(
                                            { name: "Wallet", value: "`" + precisedWalletNameofAuthor + "`", inline: false },
                                            { name: "Wallet Value", value: "`" + parseFloat(walletValue).toFixed(3) + "₿ (" + (BTCUsdPrice * walletValue).toFixed(0) + "$)`", inline: true },
                                            { name: "BTC Value", value: "`" + walletBTCBalance + "₿ (" + (BTCUsdPrice * walletBTCBalance).toFixed(0) + "$)`", inline: true },
                                            { name: "NFTs Value", value: "`" + NFTTotalValue.toFixed(3) + "₿ (" + parseFloat(NFTTotalValue * BTCUsdPrice).toFixed(0) + "$)`", inline: true },
                                            { name: "BRC20 Tokens", value: BRC20Overview, inline: false },
                                            { name: "NFTs Overview", value: nftsOverview, inline: false },

                                        )
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                    await interaction.editReply({ embeds: [getPortfolioOneWallet], components: [chartVisual1] });


                                }







                            } else if (selectedWallet === "All") {



                                //On définit la plage de wallet
                                let allWalletAddressOfAuthorTable = []
                                const allWalletsOfAuthor = await wallets.findAll({ where: { authorId: authorId } });
                                for (let i = 0; i < allWalletsOfAuthor.length; i++) {

                                    if (isValidEthereumAddress(allWalletsOfAuthor[i].dataValues.walletAddress)) {
                                        allWalletAddressOfAuthorTable.push(allWalletsOfAuthor[i].dataValues.walletAddress);
                                    }

                                    console.log(allWalletAddressOfAuthorTable)

                                }


                                let walletCount = allWalletAddressOfAuthorTable.length


                                if (allWalletsOfAuthor.length > 0) {


                                    if (walletCount > 0) {


                                        const ethUsdPrice = await axios.get('https://api.etherscan.io/api?module=stats&action=ethprice&apikey=' + etherscanApiKey)



                                        //On initialise le tableau de call api pour mesurer
                                        let apiObj = {}
                                        apiObj.ethBalance = 0
                                        apiObj.wethBalance = 0
                                        apiObj.usdcBalance = 0
                                        apiObj.blurBalance = 0
                                        apiObj.apeBalance = 0
                                        apiObj.blurPoolBalance = 0
                                        apiObj.cryptoUsdtPrice = 0
                                        apiObj.ethUsdPrice = 0
                                        apiObj.get_metrics_eth_v2_address_metrics_get = 0
                                        apiObj.getUsersUserCollectionsV2 = 0



                                        //On déclare deux variables
                                        let nftsValueEth = 0
                                        let nftsValueUsd = 0
                                        let walletValue = 0
                                        let nftsOverview = "";
                                        let floorHoldingTable = []
                                        const promises = []




                                        //Variable de balance 
                                        let ethBalanceFormatted = 0
                                        let wethBalanceFormatted = 0
                                        let usdcBalanceFormatted = 0
                                        let blurBalanceFormatted = 0
                                        let apeBalanceFormatted = 0
                                        let blurPoolBalanceFormatted = 0

                                        // On récupère le prix USD des différentes cryptos
                                        const cryptoUsdtPrice = await axios.get('https://api-testnet.bybit.com/v5/market/tickers?category=linear')
                                        let usdcUsdTPrice = "1"
                                        //usdcUsdTPrice = cryptoUsdtPrice.data.result.list.find(obj => obj.symbol === "USDCUSDT").lastPrice 
                                        const blurUsdTPrice = cryptoUsdtPrice.data.result.list.find(obj => obj.symbol === "BLURUSDT").lastPrice;
                                        const apeUsdTPrice = cryptoUsdtPrice.data.result.list.find(obj => obj.symbol === "APEUSDT").lastPrice;

                                        //On incrémente les calls API
                                        apiObj.cryptoUsdtPrice++
                                        apiObj.ethUsdPrice++


                                        for (const selectedWallet of allWalletAddressOfAuthorTable) {

                                            //On récupère la balance de token
                                            const ethBalance = await web3.eth.getBalance(selectedWallet)
                                            const wethBalance = await axios.get('https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2&address=' + selectedWallet + '&tag=latest&apikey=' + etherscanApiKey)
                                            const usdcBalance = await axios.get('https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&address=' + selectedWallet + '&tag=latest&apikey=' + etherscanApiKey)
                                            const blurBalance = await axios.get('https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0x5283D291DBCF85356A21bA090E6db59121208b44&address=' + selectedWallet + '&tag=latest&apikey=' + etherscanApiKey)
                                            const apeBalance = await axios.get('https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0x4d224452801ACEd8B2F0aebE155379bb5D594381&address=' + selectedWallet + '&tag=latest&apikey=' + etherscanApiKey)
                                            const blurPoolBalance = await axios.get('https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0x0000000000A39bb272e79075ade125fd351887Ac&address=' + selectedWallet + '&tag=latest&apikey=' + etherscanApiKey)


                                            ethBalanceFormatted += parseFloat(web3.utils.fromWei((ethBalance).toString(), 'ether'))
                                            wethBalanceFormatted += wethBalance.data.result / (10 ** 18)
                                            usdcBalanceFormatted += usdcBalance.data.result / (10 ** 6)
                                            blurBalanceFormatted += blurBalance.data.result / (10 ** 18)
                                            apeBalanceFormatted += apeBalance.data.result / (10 ** 18)
                                            blurPoolBalanceFormatted = blurPoolBalance.data.result / (10 ** 18)


                                            //On incrémente les calls API
                                            apiObj.ethBalance++
                                            apiObj.wethBalance++
                                            apiObj.usdcBalance++
                                            apiObj.blurBalance++
                                            apiObj.apeBalance++
                                            apiObj.blurPoolBalance++



                                            const promise1 = nftGo.get_metrics_eth_v2_address_metrics_get({ address: selectedWallet })
                                                .then(async ({ data: nftGoData }) => {

                                                    nftsValueEth += nftGoData.portfolio_value.eth
                                                    nftsValueUsd += nftGoData.portfolio_value.usd

                                                })
                                            promises.push(promise1)

                                            //On incrémente les calls API
                                            apiObj.get_metrics_eth_v2_address_metrics_get++


                                            await Promise.all(promises)

                                            const promise2 = sdk2.getUsersUserCollectionsV2({ limit: '100', sortBy: 'allTimeVolume', user: selectedWallet, accept: '*/*' })
                                                .then(async ({ data }) => {

                                                    const result = data.collections.map(item => {

                                                        return {
                                                            slug: item.collection.slug,
                                                            floorAskPrice: item.collection.floorAskPrice,
                                                            ownership: item.ownership.tokenCount
                                                        }
                                                    });

                                                    floorHoldingTable.push(result)

                                                })

                                            promises.push(promise2)


                                            //On incrémente les calls API
                                            apiObj.getUsersUserCollectionsV2++



                                        }
                                        await Promise.all(promises)


                                        // Tri du tableau JSON en fonction de la valeur "floorAsk * tokenCount" de chaque objet "collection" en ordre décroissant
                                        const sortedByFloor = floorHoldingTable.flat().sort((a, b) => {
                                            const productA = a.floorAskPrice * parseInt(a.ownership);
                                            const productB = b.floorAskPrice * parseInt(b.ownership);
                                            return productB - productA;
                                        });




                                        // Sélection des 12 premiers objets triés du tableau JSON
                                        let top12Collections = await sortedByFloor.slice(0, 13);



                                        await top12Collections.forEach(collection => {


                                            const na = collection.slug.toString()
                                            const name = na.toLowerCase()
                                            const tokenCount = collection.ownership;
                                            let totalPriceUsd = 0
                                            let floorAskPrice = 0
                                            let totalPrice = 0
                                            let totalPriceUs = 0


                                            if (collection.floorAskPrice) {

                                                floorAskPrice = (collection.floorAskPrice).toFixed(3)
                                                totalPrice = (tokenCount * floorAskPrice).toFixed(3)
                                                totalPriceUs = (totalPrice * ethUsdPrice.data.result.ethusd).toFixed(0)
                                                totalPriceUsd = new Intl.NumberFormat('en-US').format(totalPriceUs)


                                            } else if (!collection.floorAskPrice) {

                                                floorAskPrice = "0.000"
                                                totalPrice = "0.000"
                                                totalPriceUs = "0"
                                                totalPriceUsd = "0"

                                            }

                                            let lignMaxSize = 70
                                            let leftPartNfts = "`" + name + " ∙ " + tokenCount + " Owned ∙ " + floorAskPrice + "Ξ"
                                            let rightPartNfts = totalPrice + "Ξ (" + totalPriceUsd + "$)`\n"
                                            let leftPartNFTsLenght = leftPartNfts.length
                                            let rightPartNftsLenght = rightPartNfts.length
                                            let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                                            let spaceLenght = ""
                                            for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }



                                            nftsOverview += "`" + name + " ∙ " + tokenCount + " Owned ∙ " + floorAskPrice + "Ξ" + spaceLenght + totalPrice + "Ξ (" + totalPriceUsd + "$)`\n";


                                        });



                                        //On récupère les variables pour formatter 
                                        let erc20lignsize = 42
                                        let wethSpaceSize = erc20lignsize - 27 - (wethBalanceFormatted.toFixed(3)).length - ((ethUsdPrice.data.result.ethusd * wethBalanceFormatted).toFixed(0)).length
                                        let usdcSpaceSize = erc20lignsize - 24 - (usdcBalanceFormatted.toFixed(3)).length - ((usdcUsdTPrice * usdcBalanceFormatted).toFixed(0)).length
                                        let blurSpaceSize = erc20lignsize - 20 - (blurBalanceFormatted.toFixed(3)).length - ((blurUsdTPrice * blurBalanceFormatted).toFixed(0)).length
                                        let apeSpaceSize = erc20lignsize - 23 - (apeBalanceFormatted.toFixed(3)).length - ((apeUsdTPrice * apeBalanceFormatted).toFixed(0)).length

                                        //Incrémenter le space pour les ERC20
                                        let wethSpaceLenght = ""
                                        for (let i = 0; i < wethSpaceSize; i++) { wethSpaceLenght += " " }
                                        let usdcSpaceLenght = ""
                                        for (let i = 0; i < usdcSpaceSize; i++) { usdcSpaceLenght += " " }
                                        let blurSpaceLenght = ""
                                        for (let i = 0; i < blurSpaceSize; i++) { blurSpaceLenght += " " }
                                        let apeSpaceLenght = ""
                                        for (let i = 0; i < apeSpaceSize; i++) { apeSpaceLenght += " " }


                                        //Rajouter le if + le prix des autres tokens
                                        walletValue = nftsValueEth + ethBalanceFormatted + blurPoolBalanceFormatted + wethBalanceFormatted + (usdcBalanceFormatted / ethUsdPrice.data.result.ethusd) + (blurUsdTPrice * blurBalanceFormatted / ethUsdPrice.data.result.ethusd) + (apeUsdTPrice * apeBalanceFormatted / ethUsdPrice.data.result.ethusd)

                                        if (nftsOverview == "") { nftsOverview = "`No Ethereum NFTs owned                                             `  \n" }

                                        const getPortfolioALLWallet = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle(`${authorName}'s portfolio`)
                                            .setDescription(">>> Showing Ethereum portfolio data")
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .addFields(
                                                { name: "Wallet", value: "`" + walletCount + " wallets`", inline: false },
                                                { name: "Wallet Value", value: "`" + walletValue.toFixed(3) + "Ξ (" + (ethUsdPrice.data.result.ethusd * walletValue).toFixed(0) + "$)`", inline: true },
                                                { name: "ETH Value", value: "`" + ethBalanceFormatted.toFixed(3) + "Ξ (" + (ethUsdPrice.data.result.ethusd * ethBalanceFormatted).toFixed(0) + "$)`", inline: true },
                                                { name: "NFTs Value", value: "`" + nftsValueEth.toFixed(3) + "Ξ (" + nftsValueUsd.toFixed(0) + "$)`", inline: true },
                                                { name: "ERC 20 Tokens", value: "`Wrapped ETH (wETH): " + wethSpaceLenght + wethBalanceFormatted.toFixed(3) + " (" + (ethUsdPrice.data.result.ethusd * wethBalanceFormatted).toFixed(0) + "$)`\n`USD Coin (USDC): " + usdcSpaceLenght + usdcBalanceFormatted.toFixed(3) + " (" + (usdcUsdTPrice * usdcBalanceFormatted).toFixed(0) + "$)`\n`Blur (BLUR): " + blurSpaceLenght + blurBalanceFormatted.toFixed(3) + " (" + (blurUsdTPrice * blurBalanceFormatted).toFixed(0) + "$)`\n`Ape Coin (APE): " + apeSpaceLenght + apeBalanceFormatted.toFixed(3) + " (" + (apeUsdTPrice * apeBalanceFormatted).toFixed(0) + "$)`", inline: false },
                                                { name: "NFTs Overview", value: nftsOverview, inline: false },



                                            )
                                            .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                        await interaction.editReply({ embeds: [getPortfolioALLWallet], components: [chartVisualAll] });



                                        //On enregistre le call API dans la database
                                        const timeStamp = Date.now();
                                        for (let i = 0; i < apiObj.ethBalance; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/portfolio", apiCallName: "ethBalance", apiProvider: "etherscan", timestamp: timeStamp.toString() }) }
                                        for (let i = 0; i < apiObj.wethBalance; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/portfolio", apiCallName: "wethBalance", apiProvider: "etherscan", timestamp: timeStamp.toString() }) }
                                        for (let i = 0; i < apiObj.usdcBalance; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/portfolio", apiCallName: "usdcBalance", apiProvider: "etherscan", timestamp: timeStamp.toString() }) }
                                        for (let i = 0; i < apiObj.blurBalance; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/portfolio", apiCallName: "blurBalance", apiProvider: "etherscan", timestamp: timeStamp.toString() }) }
                                        for (let i = 0; i < apiObj.apeBalance; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/portfolio", apiCallName: "apeBalance", apiProvider: "etherscan", timestamp: timeStamp.toString() }) }
                                        for (let i = 0; i < apiObj.blurPoolBalance; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/portfolio", apiCallName: "blurPoolBalance", apiProvider: "etherscan", timestamp: timeStamp.toString() }) }
                                        for (let i = 0; i < apiObj.cryptoUsdtPrice; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/portfolio", apiCallName: "cryptoUsdtPrice", apiProvider: "bybit", timestamp: timeStamp.toString() }) }
                                        for (let i = 0; i < apiObj.ethUsdPrice; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/portfolio", apiCallName: "ethUsdPrice", apiProvider: "etherscan", timestamp: timeStamp.toString() }) }
                                        for (let i = 0; i < apiObj.get_metrics_eth_v2_address_metrics_get; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/portfolio", apiCallName: "get_metrics_eth_v2_address_metrics_get", apiProvider: "nftgo", timestamp: timeStamp.toString() }) }
                                        for (let i = 0; i < apiObj.getUsersUserCollectionsV2; i++) { await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/portfolio", apiCallName: "getUsersUserCollectionsV2", apiProvider: "reservoir", timestamp: timeStamp.toString() }) }




                                        //On fait le call à la base SQL
                                        await interactionData.destroy({ where: { authorId: authorId, commandName: "portfolio", serverId: serverId } })

                                        await interactionData.create({

                                            authorId: authorId,
                                            authorName: authorName,
                                            serverId: serverId,
                                            commandName: "portfolio",
                                            interactionId: interaction.id,
                                            walletAddress: selectedWallet,
                                            walletCategory: "N/A",
                                            embed1: JSON.stringify(getPortfolioALLWallet),
                                            embed2: "N/A",
                                            embed3: "N/A",
                                            pageIndex: "N/A",
                                            actualPage: "N/A",
                                            walletName: "N/A",
                                            selecedTimestamp: "N/A",
                                            selectedCollection: "N/A",
                                            collectionSlug: "N/A",
                                            collectionBanner: "N/A",
                                            avgDeriskPrice: "N/A",
                                            floorPrice: "N/A",
                                            lowerMarketlace: "N/A",
                                            collectionName: "N/A",
                                            collectionTwitter: "N/A",
                                            collectionWebsite: "N/A",
                                            buyCount: "N/A",
                                            soldCount: "N/A",
                                            remaining: "N/A",
                                            avgBuy: "N/A",
                                            avgSold: "N/A",
                                            realisedProfit: "N/A",
                                            potentialProfit: "N/A",
                                            roi: "N/A",
                                            visualTitle: "N/A",
                                            userAvatar: userAvatar,
                                            nbMembersInvolved: "N/A",
                                            totalTradeCount: "N/A",

                                        })





                                    } else {

                                        const getPortfolioALLWallet = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle(`${authorName}'s portfolio`)
                                            .setDescription(">>> Showing Ethereum portfolio data")
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .addFields(
                                                { name: "Wallet", value: "```No Ethereum wallet is registered in your portfolio.```", inline: false },

                                            )
                                            .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                        await interaction.editReply({ embeds: [getPortfolioALLWallet], components: [chartVisualAllNoVisual] });


                                        //On fait le call à la base SQL
                                        await interactionData.destroy({ where: { authorId: authorId, commandName: "portfolio", serverId: serverId } })

                                        await interactionData.create({

                                            authorId: authorId,
                                            authorName: authorName,
                                            serverId: serverId,
                                            commandName: "portfolio",
                                            interactionId: interaction.id,
                                            walletAddress: selectedWallet,
                                            walletCategory: "N/A",
                                            embed1: JSON.stringify(getPortfolioALLWallet),
                                            embed2: "N/A",
                                            embed3: "N/A",
                                            pageIndex: "N/A",
                                            actualPage: "N/A",
                                            walletName: "N/A",
                                            selecedTimestamp: "N/A",
                                            selectedCollection: "N/A",
                                            collectionSlug: "N/A",
                                            collectionBanner: "N/A",
                                            avgDeriskPrice: "N/A",
                                            floorPrice: "N/A",
                                            lowerMarketlace: "N/A",
                                            collectionName: "N/A",
                                            collectionTwitter: "N/A",
                                            collectionWebsite: "N/A",
                                            buyCount: "N/A",
                                            soldCount: "N/A",
                                            remaining: "N/A",
                                            avgBuy: "N/A",
                                            avgSold: "N/A",
                                            realisedProfit: "N/A",
                                            potentialProfit: "N/A",
                                            roi: "N/A",
                                            visualTitle: "N/A",
                                            userAvatar: userAvatar,
                                            nbMembersInvolved: "N/A",
                                            totalTradeCount: "N/A",

                                        })



                                    }


                                } else {

                                    const setwalletErrorEmbed = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle(`No wallet`)
                                        .setDescription("Aura can't analyze your wallet's data because you don't have any Ethereum or Bitcoin wallet registered in your portfolio. Please use `/setwallet` to register a wallet in your portfolio then try again.")
                                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                    await interaction.editReply({ embeds: [setwalletErrorEmbed] });
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
                let reportCommand = "/portfolio"

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


                const updateEmbed = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("New Report")
                    .setDescription(">>> A new report has just been sent.")
                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                    .setAuthor({ name: "Rolls Chasers Analytics", iconURL: "https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png" })
                    .setTimestamp()
                    .addFields(
                        { name: " ", value: " ", inline: false },
                        { name: "Content:", value: "A new `bug` has been submitted for the `" + reportCommand + "` command by `the bot report division` in `" + serverName + "`. You can use the administrator dashboard to consult it.", inline: false },

                    )
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


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