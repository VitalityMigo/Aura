/**
 * @file Sample getdata command with slash command.
 * @author Vitality Migø
 */

const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { profileData, accessSql, reportsql, interactionData, wallets, apimonitorsql, adminsql, usersql, sequelize, infra_coin, tracker_coin } = require('../../../events/database');
const moment = require('moment');
const axios = require('axios')

// Nodes
const { web3CloudflarePublic } = require("../../../config/web3config")

// Fonctions d'execution et de formattage
const { getToken } = require('../../../functions/coin-utils')
const { coinProfitSingle } = require('../../../functions/pnlcaclulator')

const reduceText = require("../../../functions/reducetext")
const formatCoinValueSign = require("../../../functions/formatNumberEmbed")
const getApprovals = require("../../../functions/getApprovals")
const { getEthPrice } = require("../../../config/web3data")
const decrypt = require("../../../functions/decrypt")
const encrypt = require("../../../functions/encrypt")

// Initialisation du contrat de pair
const wETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"


// Fonctions
function isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
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



const buttonsRow = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('cryptoprofitvisual-button')
            .setLabel('visual')
            .setStyle(2)
    );

module.exports = {
    data: new SlashCommandBuilder()
        .setName("coin")
        .setDescription("Display various metrics about coin")
        .addSubcommand(subcommand =>
            subcommand
                .setName("profit")
                .setDescription("Display your profit on a specific coin")
                .addStringOption(option =>
                    option
                        .setName("token")
                        .setDescription("The token address of the coin")
                        .setRequired(true)
                        .setAutocomplete(true)

                )
                .addStringOption(option =>
                    option
                        .setName("wallet")
                        .setDescription("The wallet to analyze")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addStringOption(option =>
                    option
                        .setName("timelapse")
                        .setDescription("The timeplapse to analyze")
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
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("data")
                .setDescription("Display advanced metrics on a coin")
                .addStringOption(option =>
                    option
                        .setName("coin")
                        .setDescription("The contract address (ERC20) or token symbol (BRC20) of the coin")
                        .setRequired(true)
                        .setAutocomplete(true)
                ),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("wallet")
                .setDescription("Manage your buy and sell coin wallet")

        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("trades")
                .setDescription("Display the last trades made on a coin")
                .addStringOption(option =>
                    option
                        .setName("coin")
                        .setDescription("The token's contract address (ERC20)")
                        .setRequired(true)
                        .setAutocomplete(false)
                ),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("manager")
                .setDescription("Manage your ETH and ERC20 token")

        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("tracker")
                .setDescription("Manage your coin wallet tracker")

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





                                if (subcommand === 'profit') {

                                    //Checkpoint
                                    console.log("// Step 2 : Authorization - Executed ✅")


                                    //Variable pour les options
                                    // on récupère chacun d'entre eux
                                    const contract = interaction.options.getString("token")
                                    const wallet = interaction.options.getString("wallet");
                                    const time = interaction.options.getString("timelapse");


                                    if (isValidEthereumAddress(contract)) {


                                        if (wallet.toLowerCase() !== 'all') {



                                            if (isValidEthereumAddress(wallet)) {


                                                // On calcul les profits grâce à notre fonction
                                                const data = await coinProfitSingle(contract, wallet, time)

                                                if (data) {

                                                    // On sépare les data entre le raw et le prettier
                                                    // Les raw sont les data non traité
                                                    // Les prettier sont pour l'embed
                                                    const raw = data.raw
                                                    const prettier = data.prettier
                                                    const token = data.token


                                                    const cryptoProfitOneWallet = new EmbedBuilder().setColor("#060A8F")
                                                        .setTitle(reduceText(token.name, 35) + " (" + token.symbol + ")")
                                                        .setDescription(">>> Displaying your P&L on `$" + token.symbol + "`.")
                                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                                        .setImage("https://cdn.discordapp.com/attachments/1100572519896977490/1185619758008254474/e.png?ex=65904572&is=657dd072&hm=7a51469cad88b48198c5f230d13450d50c7e2717c5acdf97a82a6eb1fb5adad4&")
                                                        .addFields(
                                                            { name: "Contract:", value: "`" + token.contract + "`", inline: false },
                                                            { name: "Swap In:", value: "`" + prettier.swapIn + "`", inline: true },
                                                            { name: "Swap Out:", value: "`" + prettier.swapIn + "`", inline: true },
                                                            { name: "Airdrop & Transfer:", value: "`" + prettier.transfer + "`", inline: true },
                                                            { name: "Token Bought:", value: "`" + prettier.buyAmount + "`", inline: true },
                                                            { name: "Token Sold:", value: "`" + prettier.sellAmount + "`", inline: true },
                                                            { name: "Token Held:", value: "`" + prettier.heldAmount + "`", inline: true },
                                                            { name: "Buy Value:", value: "`" + prettier.buyValue + "`", inline: true },
                                                            { name: "Sold Value:", value: "`" + prettier.sellValue + "`", inline: true },
                                                            { name: "Held Value:", value: "`" + prettier.heldValue + "`", inline: true },
                                                            { name: "AVG MC Buy:", value: "`" + prettier.avgMCBuy + "`", inline: true },
                                                            { name: "AVG MC Sell:", value: "`" + prettier.avgMCSell + "`", inline: true },
                                                            { name: "Current MC:", value: "`" + prettier.currentMC + "`", inline: true },
                                                            { name: "Gas Cost:", value: "`" + prettier.totalGas + "`", inline: true },
                                                            { name: "Avg Gas Cost:", value: "`" + prettier.avgGas + "`", inline: true },
                                                            { name: " ", value: " ", inline: true },
                                                            { name: "Realised P&L:", value: "`" + prettier.realizedPNL + "`", inline: true },
                                                            { name: "Realised ROI:", value: "`" + prettier.realizedMLTP + " (" + prettier.realizedROI + ")`", inline: true },
                                                            { name: " ", value: " ", inline: true },
                                                            { name: "Potential P&L:", value: "`" + prettier.potentialPNL + "`", inline: true },
                                                            { name: "Potential ROI:", value: "`" + prettier.potentialMLTP + " (" + prettier.potentialROI + ")`", inline: true },
                                                            { name: " ", value: " ", inline: true },
                                                            { name: "Links", value: '[Etherscan](https://etherscan.io/address/' + contract + ") ∙ " + '[DexScreener](https://dexscreener.com/ethereum/' + contract + ") ∙ " + '[DexSpy](https://dexspy.io/eth/token/' + contract + ") ∙ " + '[DexAnalyzer](https://www.dexanalyzer.io/token/' + contract + ") ∙ " + '[Shuriken](https://app.shuriken.trade)', inline: false },
                                                        )
                                                        .setTimestamp()
                                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                                    await interaction.editReply({ embeds: [cryptoProfitOneWallet], components: [buttonsRow] });





                                                    //On stock les data d'interaction pour le visuel
                                                    await interactionData.destroy({ where: { authorId: authorId, commandName: "cryptoprofit", serverId: serverId } })

                                                    await interactionData.create({

                                                        authorId: authorId,
                                                        authorName: authorName,
                                                        serverId: serverId,
                                                        walletAddress: wallet,
                                                        commandName: "cryptoprofit",
                                                        interactionId: interaction.id,
                                                        selecedTimestamp: token.timestamp.toString(),
                                                        selectedCollection: contract,
                                                        floorPrice: token.priceETH.toString(),
                                                        collectionName: token.name + " (" + token.symbol + ")",
                                                        collectionSlug: token.symbol,
                                                        mintCount: raw.transfer.toString(),
                                                        buyCount: raw.buyAmount.toString(),
                                                        soldCount: raw.sellAmount.toString(),
                                                        remaining: raw.heldAmount.toString(),
                                                        avgBuy: parseFloat(raw.avgMCBuy).toFixed(3),
                                                        avgSold: parseFloat(raw.avgMCSell).toFixed(3),
                                                        realisedProfit: parseFloat(raw.realizedPNL).toFixed(3),
                                                        potentialProfit: parseFloat(raw.potentialPNL).toFixed(3),
                                                        roi: raw.potentialROI.toString(),
                                                        totalTradeCount: JSON.stringify({
                                                            buy: (raw.buyValue + raw.buyGas).toString(),
                                                            sell: (raw.sellValue - raw.sellGas).toString(),
                                                        }),
                                                        userAvatar: userAvatar,

                                                    })

                                                } else {

                                                    const notMember = new EmbedBuilder().setColor("#060A8F")
                                                        .setTitle(`Coin Profit`)
                                                        .setDescription("Aura can't analyze your wallet's profit data. Please try again or contact our team if the error persists.")
                                                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                                        .setTimestamp()
                                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                                    await interaction.editReply({ embeds: [notMember] });



                                                }



                                            } else if (isBRC20BitcoinWallet(selectedWallet)) {


                                                const notMember = new EmbedBuilder().setColor("#060A8F")
                                                    .setTitle(`Coin Profit`)
                                                    .setDescription("Aura can't analyze your wallet's data because the wallet you provided isn't an Ethereum wallet but a Bitcoin wallet. This command is only valid on Ethereum for the moment. Please use try again using the appropriate form.")
                                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                                    .setTimestamp()
                                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                                await interaction.editReply({ embeds: [notMember] });




                                            } else {

                                                const notMember = new EmbedBuilder().setColor("#060A8F")
                                                    .setTitle(`Coin Profit`)
                                                    .setDescription("Aura can't analyze your wallet's data because the wallet you provided isn't valid. Please use try again using the appropriate form.")
                                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                                    .setTimestamp()
                                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                                await interaction.editReply({ embeds: [notMember] });



                                            }



                                        } else if (wallet.toLowerCase() === 'all') {

                                            const setwalletErrorEmbed = new EmbedBuilder().setColor("#060A8F")
                                                .setTitle(`Not available`)
                                                .setDescription("We are currently optimising this feature. You can still use coin profit on a **single** wallet with `/coin profit`.")
                                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                .setTimestamp()
                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                            await interaction.editReply({ embeds: [setwalletErrorEmbed] });


                                        }


                                    } else {

                                        const setwalletErrorEmbed = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle(`Invalid Token Address`)
                                            .setDescription("The token address you provided isn't a valid Ethereum contract address. Please try again using the appropriate form.")
                                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                        await interaction.editReply({ embeds: [setwalletErrorEmbed] });



                                    }


                                } else if (subcommand === "data") {


                                    //Checkpoint
                                    console.log("// Step 2 : Authorization - Executed ✅")

                                    //On enregistre le user si il est pas encore dans la database
                                    const timeStamp = Date.now();
                                    const actualTimestamp = parseFloat(timeStamp / 1000).toFixed(0)
                                    const isUser = await usersql.findOne({ where: { userId: authorId, serverId: serverId } })
                                    if (isUser == null) { await usersql.create({ userId: authorId, userName: authorName, userAvatar: userAvatar, serverId: serverId, timestamp: actualTimestamp }) }


                                    //Variable pour les options
                                    const coinTicker = interaction.options.getString("coin")

                                    // On récupère le prix de l'ETH
                                    const ethPriceUsd = getEthPrice()

                                    // On charge l'image de la chart (pas obligatoire)
                                    //const chartImageLink = "https://api.chart-img.com/v1/tradingview/advanced-chart?key=" + chartApiKey + "&symbol=" + coinSymbol + "WETH&interval=1D&theme=dark&width=800&height=400"


                                    if (isValidEthereumAddress(coinTicker)) {


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
                                        let holdersTable = []

                                        let owner = "N/A"
                                        let deployer = "N/A"
                                        let deployerBalance = 0
                                        let supply = 0
                                        let marketcap = 0
                                        let honeypot
                                        let isHoneyPot = "N/A"
                                        let devBalance = 0
                                        let mintable
                                        let isMintable = "N/A"
                                        let pairAddress = ""
                                        let coinActualPriceUsd = 0
                                        let coinActualPriceEth = 0

                                        //On récupère les infos du coin
                                        const coinInfos = await getToken([coinTicker])

                                        if (coinInfos.length > 0) {


                                            coinName = coinInfos[0].name
                                            coinSymbol = coinInfos[0].symbol
                                            coinDecimal = coinInfos[0].decimals


                                            const coinPriceHistory = await axios.get("https://api.dexscreener.io/latest/dex/tokens/" + coinTicker.toLowerCase())

                                            const goPlusCallPromise = axios.get("https://api.gopluslabs.io/api/v1/token_security/1?contract_addresses=" + coinTicker)



                                            if (coinPriceHistory.data.pairs !== null) {

                                                const pairWeth = coinPriceHistory.data.pairs.filter((item) => item.quoteToken.address === '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');



                                                coinActualPriceUsd = pairWeth[0].priceUsd
                                                coinActualPriceEth = 1 / (ethPriceUsd / coinActualPriceUsd)



                                                volume1h = pairWeth[0].volume.h1
                                                volume6h = pairWeth[0].volume.h6
                                                volume1d = pairWeth[0].volume.h24
                                                pairAddress = pairWeth[0].pairAddress

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



                                            const [goPlusCall] = await Promise.all([goPlusCallPromise]);

                                            const contractAudit = goPlusCall.data.result


                                            const values = Object.values(contractAudit)


                                            if (values.length > 0) {

                                                owner = values[0].owner_address;
                                                deployerBalance = values[0].creator_balance;
                                                deployer = values[0].creator_address
                                                ownerBalance = values[0].owner_balance
                                                honeypot = values[0].is_honeypot
                                                supply = values[0].total_supply
                                                mintable = values[0].is_mintable
                                                holdersCount = values[0].holder_count
                                                holdersTable = values[0].holders
                                            }


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




                                            for (const holder of holdersTable) {

                                                let sign = ""
                                                if ((holder.address).toLowerCase() == pairAddress.toLowerCase()) { sign = " 🦄" }
                                                else if ((holder.address).toLowerCase() == owner.toLowerCase() || (holder.address).toLowerCase() == deployer.toLowerCase()) { sign = " 💻" }


                                                let wallet = formatWallet(holder.address) + sign
                                                let amount = formatCoinValueSign(holder.balance, 2)
                                                let value = formatCoinValueSign(holder.balance * coinActualPriceUsd, 2)
                                                let share = parseFloat((holder.balance / supply) * 100).toFixed(1)



                                                //Formattage
                                                let part1 = "`" + wallet.toLowerCase()
                                                let part2 = amount
                                                let part3 = value + "$ (" + share + "%)`\n"

                                                let spaceSize = 16 - ((part2.toString()).length)
                                                if (sign !== "") { spaceSize = 13 - ((part2.toString()).length) }
                                                let spaceLenght = ""
                                                for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

                                                let spaceSize2 = 28 - (part3.toString()).length
                                                let spaceLenght2 = ""
                                                for (let i = 0; i < spaceSize2; i++) { spaceLenght2 += " " }



                                                holdersFormatted += part1 + spaceLenght + part2 + spaceLenght2 + part3

                                            }





                                            marketcap = supply * coinActualPriceUsd

                                            if (holdersFormatted == "") { holdersFormatted = "No holders found for this token" }



                                            const buttonsRow = new ActionRowBuilder()
                                                .addComponents(
                                                    new ButtonBuilder()
                                                        .setCustomId('button_coin_exec_buy_' + coinTicker + "@xETH")
                                                        .setLabel('Buy x ETH')
                                                        .setStyle(3),
                                                    new ButtonBuilder()
                                                        .setCustomId('button_coin_exec_buy_' + coinTicker + "@0.05ETH")
                                                        .setLabel('Buy 0.05 ETH')
                                                        .setStyle(3),
                                                    new ButtonBuilder()
                                                        .setCustomId('button_coin_exec_buy_' + coinTicker + "@0.1ETH")
                                                        .setLabel('Buy 0.1 ETH')
                                                        .setStyle(3),
                                                    new ButtonBuilder()
                                                        .setCustomId('button_coin_exec_buy_' + coinTicker + "@0.2ETH")
                                                        .setLabel('Buy 0.2 ETH')
                                                        .setStyle(3),
                                                    new ButtonBuilder()
                                                        .setCustomId('button_coin_exec_buy_' + coinTicker + "@0.5ETH")
                                                        .setLabel('Buy 0.5 ETH')
                                                        .setStyle(3),

                                                );


                                            const buttonsRow1 = new ActionRowBuilder()
                                                .addComponents(
                                                    new ButtonBuilder()
                                                        .setCustomId('button_coin_exec_sell_' + coinTicker + "@x%")
                                                        .setLabel('Sell x %')
                                                        .setStyle(4),
                                                    new ButtonBuilder()
                                                        .setCustomId('button_coin_exec_sell_' + coinTicker + "@25%")
                                                        .setLabel('Sell 25%')
                                                        .setStyle(4),
                                                    new ButtonBuilder()
                                                        .setCustomId('button_coin_exec_sell_' + coinTicker + "@50%")
                                                        .setLabel('Sell 50%')
                                                        .setStyle(4),
                                                    new ButtonBuilder()
                                                        .setCustomId('button_coin_exec_sell_' + coinTicker + "@75%")
                                                        .setLabel('Sell 75%')
                                                        .setStyle(4),
                                                    new ButtonBuilder()
                                                        .setCustomId('button_coin_exec_sell_' + coinTicker + "@100%")
                                                        .setLabel('Sell 100%')
                                                        .setStyle(4),

                                                );

                                            const buttonsRow2 = new ActionRowBuilder()
                                                .addComponents(
                                                    new ButtonBuilder()
                                                        .setCustomId('button_coin_tradepanel_refresh_' + coinTicker)
                                                        .setLabel('🔁 Refresh')
                                                        .setStyle(1),
                                                    new ButtonBuilder()
                                                        .setCustomId('coin_infra_tradepanel_help-button')
                                                        .setLabel('📑 Tutorial')
                                                        .setStyle(1),
                                                    new ButtonBuilder()
                                                        .setCustomId('coin_infra_tradepanel_audit-button')
                                                        .setLabel('📡 Audit')
                                                        .setStyle(1),
                                                    new ButtonBuilder()
                                                        .setCustomId('button_coin_tradepanel_setup')
                                                        .setLabel('💻 Setup')
                                                        .setStyle(1)
                                                );


                                            // Image de la charte désactive
                                            // Pour des raisons d'efficacité et de clareté
                                            const getDataCollectionAddress = new EmbedBuilder().setColor("#060A8F")
                                                .setTitle(reduceText(coinName, 40) + " (" + coinSymbol.toUpperCase() + ")")
                                                .setDescription(">>> Displaying data for `$" + coinSymbol.toUpperCase() + "`.")
                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                //.setImage(chartImageLink)
                                                .addFields(
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
                                                    { name: "Holders:", value: holdersFormatted, inline: false },
                                                    { name: "Links", value: '[Etherscan](https://etherscan.io/address/' + coinTicker + ") ∙ " + '[Etherscan LP](https://etherscan.io/address/' + pairAddress + ") ∙ " + '[DexScreener](https://dexscreener.com/ethereum/' + coinTicker + ") ∙ " + '[DexSpy](https://dexspy.io/eth/token/' + coinTicker + ") ∙ " + '[Uniswap](https://app.uniswap.org/#/tokens/ethereum/' + coinTicker + ") ∙ " + '[DefiLlama](https://swap.defillama.com/?chain=ethereum&from=0x0000000000000000000000000000000000000000&to=' + coinTicker + ") ∙ " + '[DexAnalyzer](https://www.dexanalyzer.io/token/' + coinTicker + ") ∙ " + '[Honeypot](   https://honeypot.is/ethereum?address=' + coinTicker + ") ∙ " + '[Holders](https://etherscan.io/token/tokenholderchart/' + coinTicker + ")", inline: false },
                                                    { name: "Quicktasks", value: '[Thunder](http://localhost:7777/quickTask?module=defi&contract=' + coinTicker + "&action=buy&blockchain=ethereum&platform=uniswapv2) ∙ " + '[Maestro]( https://t.me/MaestroSniperBot?start=' + coinTicker + ") ∙ " + '[Sensei](https://app.thornhill.fun/defi?token=' + coinTicker + "&venue=UNISWAP_V2&valueEth=0.05) ∙ " + '[Waifu]( http://localhost:7780/uniswapqt?contractAddress=' + coinTicker + "&group=Default)", inline: false },


                                                )
                                                .setTimestamp()
                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                            await interaction.editReply({ embeds: [getDataCollectionAddress], components: [buttonsRow, buttonsRow1, buttonsRow2] });


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



                                } else if (subcommand === 'trades') {


                                    const date = Date.now()
                                    const timestamp = parseInt(date / 1000)


                                    const contract = interaction.options.getString("coin").toLowerCase()


                                    // On crée la paire grâce à la factory
                                    const factory = await getToken([contract])
                                    const symbol = factory[0].symbol

                                    const userFTEmbed = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle(symbol)
                                        .setDescription(">>> Displaying the last trades on`" + symbol + "`.")
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .addFields(
                                            { name: "Symbol", value: "`" + symbol + "`", inline: false },
                                            { name: "Contract", value: "`" + contract + "`", inline: false },
                                            { name: " ", value: " ", inline: false },
                                        )
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })



                                    const coinData = await axios.get("https://api.dexscreener.io/latest/dex/tokens/" + contract)

                                    if (coinData.data.pairs != null) {

                                        const pairData = coinData.data.pairs.filter((item) => item.quoteToken.address.toLowerCase() === wETH.toLowerCase() && item.dexId === "uniswap")[0]


                                        //const pool = pairData.pairAddress
                                        const version = pairData.labels[0]
                                        const tokenDecimals = factory[0].decimals
                                        const pool = pairData.pairAddress

                                        // Dernier bloc
                                        const blockRange = 799
                                        const toBlock = await web3CloudflarePublic.eth.getBlockNumber();
                                        const fromBlock = toBlock - blockRange


                                        // Définition des deux topics uniswap de swap
                                        const uniswap_swap_topicV2 = '0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822'; // Remplacez par le vrai topic V2
                                        const uniswap_swap_topicV3 = '0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67'; // Remplacez par le vrai topic V3

                                        // On séléctionne le topic approprié
                                        let uniswap_topic = uniswap_swap_topicV2
                                        if (version == "v3") { uniswap_topic = uniswap_swap_topicV3 }

                                        const eventsCall = await web3CloudflarePublic.eth.getPastLogs({
                                            fromBlock: fromBlock,
                                            toBlock: toBlock,
                                            address: pool,
                                            topics: [uniswap_topic],
                                        })



                                        const events = eventsCall.reverse()
                                        const eventsCount = events.length



                                        // INDEX
                                        let index = 0
                                        let trades = ""
                                        let trades2 = ""
                                        let trades3 = ""
                                        let trades4 = ""
                                        let trades5 = ""
                                        let trades6 = ""

                                        for (const swap of events) {

                                            const decode = await decodeUniswapSwapEvent(version, swap.data, swap.topics, swap.blockNumber, toBlock, contract, wETH, tokenDecimals, timestamp)

                                            // Formattage
                                            let act1 = "🟢"
                                            let act2 = "bought"
                                            if (decode.action == "sell") {
                                                act1 = "🔴"
                                                act2 = "sold"
                                            }

                                            if (index <= 5) {

                                                trades += "`" + act1 + "` " + "[" + formatWallet2(decode.sender, 18) + "](https://etherscan.io/address/" + decode.sender + ") `" + act2 + " " + formatCoinValueSign(decode.coin) + "` for `" + parseFloat(decode.eth).toFixed(3) + "Ξ` at `" + parseFloat(decode.price).toFixed(6) + "$` ∙ <t:" + decode.timestamp + ":R>\n"

                                                if (index == 5 || index == eventsCount) {


                                                    userFTEmbed.addFields(
                                                        { name: 'Coin Trades:', value: trades, inline: false },

                                                    );

                                                }


                                            } else if (index <= 10) {

                                                trades2 += "`" + act1 + "` " + "[" + formatWallet2(decode.sender, 18) + "](https://etherscan.io/address/" + decode.sender + ") `" + act2 + " " + formatCoinValueSign(decode.coin) + "` for `" + parseFloat(decode.eth).toFixed(3) + "Ξ` at `" + parseFloat(decode.price).toFixed(6) + "$` ∙ <t:" + decode.timestamp + ":R>\n"

                                                if (index == 10 || index == eventsCount) {

                                                    userFTEmbed.addFields(
                                                        { name: ' ', value: trades2, inline: false },

                                                    );

                                                }


                                            } else if (index <= 15) {

                                                trades3 += "`" + act1 + "` " + "[" + formatWallet2(decode.sender, 18) + "](https://etherscan.io/address/" + decode.sender + ") `" + act2 + " " + formatCoinValueSign(decode.coin) + "` for `" + parseFloat(decode.eth).toFixed(3) + "Ξ` at `" + parseFloat(decode.price).toFixed(6) + "$` ∙ <t:" + decode.timestamp + ":R>\n"


                                                if (index == 15 || index == eventsCount) {

                                                    userFTEmbed.addFields(
                                                        { name: ' ', value: trades3, inline: false },

                                                    );

                                                }

                                            } else if (index <= 20) {

                                                trades4 += "`" + act1 + "` " + "[" + formatWallet2(decode.sender, 18) + "](https://etherscan.io/address/" + decode.sender + ") `" + act2 + " " + formatCoinValueSign(decode.coin) + "` for `" + parseFloat(decode.eth).toFixed(3) + "Ξ` at `" + parseFloat(decode.price).toFixed(6) + "$` ∙ <t:" + decode.timestamp + ":R>\n"


                                                if (index == 20 || index == eventsCount) {

                                                    userFTEmbed.addFields(
                                                        { name: ' ', value: trades4, inline: false },

                                                    );

                                                }

                                            } else if (index <= 25) {

                                                trades5 += "`" + act1 + "` " + "[" + formatWallet2(decode.sender, 18) + "](https://etherscan.io/address/" + decode.sender + ") `" + act2 + " " + formatCoinValueSign(decode.coin) + "` for `" + parseFloat(decode.eth).toFixed(3) + "Ξ` at `" + parseFloat(decode.price).toFixed(6) + "$` ∙ <t:" + decode.timestamp + ":R>\n"


                                                if (index == 25 || index == eventsCount) {

                                                    userFTEmbed.addFields(
                                                        { name: ' ', value: trades5, inline: false },

                                                    );

                                                }

                                            } else if (index <= 30) {

                                                trades6 += "`" + act1 + "` " + "[" + formatWallet2(decode.sender, 18) + "](https://etherscan.io/address/" + decode.sender + ") `" + act2 + " " + formatCoinValueSign(decode.coin) + "` for `" + parseFloat(decode.eth).toFixed(3) + "Ξ` at `" + parseFloat(decode.price).toFixed(6) + "$` ∙ <t:" + decode.timestamp + ":R>\n"


                                                if (index == 30 || index == eventsCount) {

                                                    userFTEmbed.addFields(
                                                        { name: ' ', value: trades6, inline: false },

                                                    );

                                                }

                                            } else {
                                                break

                                            }


                                            index++

                                        }








                                        const buttonsRow = new ActionRowBuilder()
                                            .addComponents(
                                                new ButtonBuilder()
                                                    .setCustomId('button_coin_exec_buy_' + contract + "@xETH")
                                                    .setLabel('Buy x ETH')
                                                    .setStyle(3),
                                                new ButtonBuilder()
                                                    .setCustomId('button_coin_exec_buy_' + contract + "@0.05ETH")
                                                    .setLabel('Buy 0.05 ETH')
                                                    .setStyle(3),
                                                new ButtonBuilder()
                                                    .setCustomId('button_coin_exec_buy_' + contract + "@0.1ETH")
                                                    .setLabel('Buy 0.1 ETH')
                                                    .setStyle(3),
                                                new ButtonBuilder()
                                                    .setCustomId('button_coin_exec_buy_' + contract + "@0.2ETH")
                                                    .setLabel('Buy 0.2 ETH')
                                                    .setStyle(3),
                                                new ButtonBuilder()
                                                    .setCustomId('button_coin_exec_buy_' + contract + "@0.5ETH")
                                                    .setLabel('Buy 0.5 ETH')
                                                    .setStyle(3),

                                            );


                                        const buttonsRow1 = new ActionRowBuilder()
                                            .addComponents(
                                                new ButtonBuilder()
                                                    .setCustomId('button_coin_exec_sell_' + contract + "@x%")
                                                    .setLabel('Sell x %')
                                                    .setStyle(4),
                                                new ButtonBuilder()
                                                    .setCustomId('button_coin_exec_sell_' + contract + "@25%")
                                                    .setLabel('Sell 25%')
                                                    .setStyle(4),
                                                new ButtonBuilder()
                                                    .setCustomId('button_coin_exec_sell_' + contract + "@50%")
                                                    .setLabel('Sell 50%')
                                                    .setStyle(4),
                                                new ButtonBuilder()
                                                    .setCustomId('button_coin_exec_sell_' + contract + "@75%")
                                                    .setLabel('Sell 75%')
                                                    .setStyle(4),
                                                new ButtonBuilder()
                                                    .setCustomId('button_coin_exec_sell_' + contract + "@100%")
                                                    .setLabel('Sell 100%')
                                                    .setStyle(4),

                                            );

                                        const buttonsRow2 = new ActionRowBuilder()
                                            .addComponents(
                                                new ButtonBuilder()
                                                    .setCustomId('button_coin_tradelist_refresh_' + contract)
                                                    .setLabel('🔁 Refresh')
                                                    .setStyle(1),
                                                new ButtonBuilder()
                                                    .setCustomId('coin_infra_tradepanel_help-button')
                                                    .setLabel('📑 Tutorial')
                                                    .setStyle(1),
                                                new ButtonBuilder()
                                                    .setCustomId('coin_infra_tradepanel_audit-button')
                                                    .setLabel('📡 Audit')
                                                    .setStyle(1),
                                                new ButtonBuilder()
                                                    .setCustomId('button_coin_tradepanel_setup')
                                                    .setLabel('💻 Setup')
                                                    .setStyle(1)
                                            );


                                        await interaction.editReply({ embeds: [userFTEmbed], components: [buttonsRow, buttonsRow1, buttonsRow2] });



                                    } else {

                                        const notMember = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle(`Token Data`)
                                            .setDescription("The coin address you entered can't be retreive. This can happen for few reasons :\n\n• The token address (ERC20) doesn't exist\n• The coin isn't available anymore or is suspicious\n• You entered a symbol for a ERC20 and not a token address, double check.\n\nIf you think the problem is on our end, please use `/report` or contact an admin.")
                                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                        await interaction.editReply({ embeds: [notMember] });

                                    }








                                } else if (subcommand === 'manager') {


                                    const buttonsRow = new ActionRowBuilder()
                                        .addComponents(
                                            new ButtonBuilder()
                                                .setCustomId('button_coin_manager_exec_transferETH')
                                                .setLabel('Transfer ETH')
                                                .setStyle(3),
                                            new ButtonBuilder()
                                                .setCustomId('button_coin_manager_exec_transferERC20')
                                                .setLabel('Transfer Token')
                                                .setStyle(3),
                                            new ButtonBuilder()
                                                .setCustomId('button_coin_manager_exec_approveToken')
                                                .setLabel('Approve Token')
                                                .setStyle(1),
                                            new ButtonBuilder()
                                                .setCustomId('button_coin_manager_exec_revokeToken')
                                                .setLabel('Revoke Token')
                                                .setStyle(1),
                                            new ButtonBuilder()
                                                .setCustomId('button_coin_tradepanel_setup')
                                                .setLabel('💻 Setup')
                                                .setStyle(1)
                                        );


                                    const botOff = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle(`Coin Manager`)
                                        .setDescription("The coin manager allows you to manage your coin portfolio.\n\n**Fund Manager**\nSend, dispatch and manage your ETH or ERC20 tokens accross multiple wallets\n\n**Approval Manager**\nManage your token approvals : revoke, approve, modify an existing approval and more.")
                                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                    await interaction.editReply({ embeds: [botOff], components: [buttonsRow] });




                                } else if (subcommand === 'wallet') {




                                    const buttonsRowNew = new ActionRowBuilder()
                                        .addComponents(
                                            new ButtonBuilder()
                                                .setCustomId('button_infra_coin_walletsetup_import')
                                                .setLabel('import wallet')
                                                .setStyle(1),
                                            new ButtonBuilder()
                                                .setCustomId('button_infra_coin_walletsetup_generate')
                                                .setLabel('generate wallet')
                                                .setStyle(3),

                                        );


                                    const buttonsRowModify = new ActionRowBuilder()
                                        .addComponents(
                                            new ButtonBuilder()
                                                .setCustomId('button_infra_coin_walletsetup_import')
                                                .setLabel('modify wallet')
                                                .setStyle(1),
                                            new ButtonBuilder()
                                                .setCustomId('button_infra_coin_walletsetup_export')
                                                .setLabel('export')
                                                .setStyle(1),
                                            new ButtonBuilder()
                                                .setCustomId('button_infra_coin_walletsetup_delete')
                                                .setLabel('delete wallet')
                                                .setStyle(4)
                                        );

                                    const buttonsRowConfig = new ActionRowBuilder()
                                        .addComponents(
                                            new ButtonBuilder()
                                                .setCustomId('button_infra_coin_walletsetup_buy')
                                                .setLabel('Set Buy Value')
                                                .setStyle(2),
                                            new ButtonBuilder()
                                                .setCustomId('button_infra_coin_walletsetup_sell')
                                                .setLabel('Set Sell %')
                                                .setStyle(2),
                                            new ButtonBuilder()
                                                .setCustomId('button_infra_coin_walletsetup_gaspreset')
                                                .setLabel('Set Gas Preset')
                                                .setStyle(2),
                                            new ButtonBuilder()
                                                .setCustomId('button_infra_coin_walletsetup_maxgwei')
                                                .setLabel('Set Max Gwei')
                                                .setStyle(2),
                                            new ButtonBuilder()
                                                .setCustomId('button_infra_coin_walletsetup_slippage')
                                                .setLabel('Set Slippage')
                                                .setStyle(2)
                                        );

                                    const buttonsRowConfig2 = new ActionRowBuilder()
                                        .addComponents(
                                            new ButtonBuilder()
                                                .setCustomId('button_infra_coin_walletsetup_apemode')
                                                .setLabel('Set Ape Mode')
                                                .setStyle(2),
                                            new ButtonBuilder()
                                                .setCustomId('button_infra_coin_walletsetup_autoapproval')
                                                .setLabel('Set Auto Approval')
                                                .setStyle(2),
                                        );




                                    const userSetup = await infra_coin.findOne({ where: { authorId: authorId } })

                                    if (userSetup != null) {


                                        const walletAddress = decrypt(userSetup.dataValues.walletAddress)

                                        let buy_preset = parseFloat(userSetup.dataValues.buy_preset).toFixed(3)
                                        let sell_preset = parseFloat(userSetup.dataValues.sell_preset).toFixed(0)

                                        let gasPreset = userSetup.dataValues.gas_preset
                                        let max_gwei = userSetup.dataValues.max_gwei
                                        let slippage = userSetup.dataValues.slippage

                                        let ape_mode = userSetup.dataValues.ape_mode
                                        let auto_approval = userSetup.dataValues.auto_approval

                                        if (gasPreset == null) { gasPreset = "Auto" } else { gasPreset = "+" + parseFloat(gasPreset).toFixed(0) + "%" }
                                        if (slippage == null) { slippage = "Auto" } else { slippage = parseFloat(slippage).toFixed(1) + "%" }
                                        if (max_gwei == null) { max_gwei = "Auto" } else { max_gwei = parseFloat(max_gwei).toFixed(0) + " gwei" }

                                        if (ape_mode == "true") { ape_mode = "✅" } else { ape_mode = "❌" }
                                        if (auto_approval == "true") { auto_approval = "✅" } else { auto_approval = "❌" }

                                        const balance = await web3CloudflarePublic.eth.getBalance(walletAddress) / 10 ** 18

                                        const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle("Coin Setup")
                                            .setDescription(">>> Displaying your coin wallet setup")
                                            .setImage('https://cdn.discordapp.com/attachments/949291624389816334/1122703923950665848/Pallette_8.png')
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .addFields(
                                                { name: "Wallet:", value: "`" + walletAddress.toLowerCase() + "`\n∟ Balance: " + parseFloat(balance).toFixed(3) + "Ξ", inline: true },
                                                { name: " ", value: " ", inline: false },
                                                { name: "Default Buy Value:", value: "`" + buy_preset + "Ξ`", inline: true },
                                                { name: "Default Sell %:", value: "`" + sell_preset + "%`", inline: true },
                                                { name: " ", value: " ", inline: false },
                                                { name: "Default Gas:", value: "`" + gasPreset + "`", inline: true },
                                                { name: "Default Max Gwei:", value: "`" + max_gwei + "`", inline: true },
                                                { name: "Default Slippage:", value: "`" + slippage + "`", inline: true },
                                                { name: " ", value: " ", inline: false },
                                                { name: "Ape Mode", value: "`" + ape_mode + "`", inline: true },
                                                { name: "Auto Approval", value: "`" + auto_approval + "`", inline: true },
                                                { name: " ", value: " ", inline: false },
                                            )
                                            .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                        await interaction.editReply({ embeds: [errorNotEthereum], components: [buttonsRowModify, buttonsRowConfig, buttonsRowConfig2], ephemeral: true });


                                    } else if (userSetup == null) {




                                        const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle("Coin Setup")
                                            .setDescription(">>> Displaying your coin wallet setup")
                                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .addFields(
                                                { name: " ", value: "You don't have a wallet imported in your coin portfolio. To get started, use the button below.", inline: true },

                                            )
                                            .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                        await interaction.editReply({ embeds: [errorNotEthereum], components: [buttonsRowNew], ephemeral: true });


                                    }







                                } else if (subcommand === 'tracker') {


                                    const buttonsRow = new ActionRowBuilder()
                                        .addComponents(
                                            new ButtonBuilder()
                                                .setCustomId('button_coin_infra_tracker_add')
                                                .setLabel('Add Addresses')
                                                .setStyle(3),
                                            new ButtonBuilder()
                                                .setCustomId('button_coin_infra_tracker_remove')
                                                .setLabel('Remove Address')
                                                .setStyle(1),
                                            new ButtonBuilder()
                                                .setCustomId('button_coin_infra_tracker_reset')
                                                .setLabel('Reset')
                                                .setStyle(1),
                                            new ButtonBuilder()
                                                .setCustomId('button_coin_infra_tracker_refresh')
                                                .setLabel('🔁')
                                                .setStyle(1),
                                        );






                                    const userList = await tracker_coin.findAll({ where: { authorId: authorId } })

                                    let addressFormatted = "Address\n\n"
                                    const maxAddress = 15
                                    const spotLeft = maxAddress - userList.length

                                    let buys = "❌"
                                    let sells = "❌"
                                    let approvals = "❌"

                                    if (userList.length > 0) {

                                        if (userList[0].dataValues.buy == "true") { buys = "✅" }
                                        if (userList[0].dataValues.sell == "true") { sells = "✅" }
                                        if (userList[0].dataValues.mint == "true") { approvals = "✅" }


                                        const userListSliced = userList.slice(0, 16)
                                        for (const object of userListSliced) {


                                            addressFormatted += object.dataValues.address.toLowerCase() + "              \n"

                                        }



                                    } else {

                                        addressFormatted = "No tracked address found in your profile             "

                                    }

                                    const buttonsRow2 = new ActionRowBuilder()
                                        .addComponents(
                                            new ButtonBuilder()
                                                .setCustomId('button_coin_infra_tracker_buys')
                                                .setLabel('Toggle Buys')
                                                .setStyle(2)
                                                .setDisabled(userList.length == 0),
                                            new ButtonBuilder()
                                                .setCustomId('button_coin_infra_tracker_sells')
                                                .setLabel('Toggle Sells')
                                                .setStyle(2)
                                                .setDisabled(userList.length == 0),
                                            new ButtonBuilder()
                                                .setCustomId('button_coin_infra_tracker_approvals')
                                                .setLabel('Toggle Approvals')
                                                .setStyle(2)
                                                .setDisabled(userList.length == 0),
                                        );


                                    const botOff = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle(`Coin Tracker`)
                                        .setDescription(">>> Displaying your coin wallet tracker")
                                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                        .addFields(
                                            { name: " ", value: " ", inline: false },
                                            { name: "Address Count", value: "`" + userList.length + "`", inline: true },
                                            { name: "Spots Left", value: "`" + spotLeft + "`", inline: true },
                                            { name: " ", value: " ", inline: false },
                                            { name: "Address Tracked:", value: "```" + addressFormatted + "```", inline: false },
                                            { name: " ", value: " ", inline: false },
                                            { name: "Buys", value: "`" + buys + "`", inline: true },
                                            { name: "Sells", value: "`" + sells + "`", inline: true },
                                            { name: "Approvals", value: "`" + approvals + "`", inline: true },


                                        )
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });


                                    await interaction.editReply({ embeds: [botOff], components: [buttonsRow, buttonsRow2] });



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


// On crée quelques fonctions utiles
async function decodeUniswapSwapEvent(version, input, topics, block, toBlock, contract, wETH, decimals, timestamp) {

    if (version == "v2") {
        // On définit les valeurs finales
        let action
        let eth
        let token
        let from
        let price

        const ethprice = 2000

        // On isole les valeurs qui nous importent
        const input2 = input.slice(2)
        const amount0In = parseInt(input2.substring(0, 64), 16)
        const amount1In = parseInt(input2.substring(64, 128), 16)
        const amount0Out = parseInt(input2.substring(128, 192), 16)
        const amount1Out = parseInt(input2.substring(192, 256), 16)

        const sender = topics[1]
        const to = topics[2]

        // On définit lequel est A et lequel est B
        const a1 = contract.toLowerCase();
        const a2 = wETH.toLowerCase();
        const token0 = a1 < a2 ? contract : wETH;
        const token1 = a1 < a2 ? wETH : contract;


        //Calcul du timestamp a retravailler ! 

        const time = blockFromBlock(block, toBlock, timestamp)


        // // GET CODE POUR TAG (Est ce que c'est un bot ?)
        // const code = await web3.eth.getCode(sender);
        // let tag = ""
        // if (code != "0x") { tag = "🤖" }

        // Le 0 est le token
        if (token0.toLowerCase() == a1) {

            // Il n'y a pas de token qui rentre ni de wETH qui sort
            if (amount0In <= 0 && amount1Out <= 0) {

                action = "buy"
                eth = amount1In / 10 ** 18
                token = amount0Out / 10 ** decimals
                from = "0x" + to.substring(26, 66)
                price = (eth / token) * ethprice

            } else {

                // Il n'y a pas de wETH qui rentre ni de token qui sort

                action = "sell"
                eth = amount1Out / 10 ** 18
                token = amount0In / 10 ** decimals
                from = "0x" + sender.substring(26, 66)
                price = (eth / token) * ethprice


            }


        } else {
            // Le 1 est le token

            // Il n'y a pas de token qui rentre ni de wETH qui sort
            if (amount0In <= 0 && amount1Out <= 0) {

                action = "sell"
                eth = amount0Out / 10 ** 18
                token = amount1In / 10 ** decimals
                from = "0x" + sender.substring(26, 66)
                price = (eth / token) * ethprice

            } else {

                // Il n'y a pas de wETH qui rentre ni de token qui sort

                action = "buy"
                eth = amount0In / 10 ** 18
                token = amount1Out / 10 ** decimals
                from = "0x" + to.substring(26, 66)
                price = (eth / token) * ethprice


            }

        }

        const result = {
            action: action,
            eth: eth,
            coin: token,
            sender: from,
            timestamp: time,
            price: price
        }

        return result

    } else {


        // On définit les valeurs finales
        let action
        let eth
        let token
        let from
        let price

        const ethprice = 2000

        // On isole les valeurs qui nous importent
        const input2 = input.slice(2)
        const amount0 = parseInt(input2.substring(0, 64), 16).toFixed(0)
        const amount1 = parseInt(input2.substring(64, 128), 16)
        // const priceX96 = parseInt(input2.substring(128, 192), 16)
        // const liquidity = parseInt(input2.substring(192, 256), 16)
        // const tick = parseInt(input2.substring(256, 320), 16)

        const sender = topics[1]
        const to = topics[2]

        // On définit lequel est A et lequel est B
        const a1 = contract.toLowerCase();
        const a2 = wETH.toLowerCase();
        const token0 = a1 < a2 ? contract : wETH;
        const token1 = a1 < a2 ? wETH : contract;


        //Calcul du timestamp a retravailler ! 

        const time = blockFromBlock(block, toBlock, timestamp)


        // // GET CODE POUR TAG (Est ce que c'est un bot ?)
        // const code = await web3.eth.getCode(sender);
        // let tag = ""
        // if (code != "0x") { tag = "🤖" }

        // Le 0 est le token


        if (token0.toLowerCase() == a1) {

            // Il n'y a pas de token qui rentre ni de wETH qui sort
            if (amount0 < 0 && amount1 > 0) {

                action = "buy"
                eth = parseFloat(amount1 / 10 ** 18).toFixed(5)
                token = Math.abs(amount0) / 10 ** decimals
                from = "0x" + to.substring(26, 66)
                price = (eth / token) * ethprice

            } else {

                // Il n'y a pas de wETH qui rentre ni de token qui sort

                action = "sell"
                eth = parseFloat(amount1 / 10 ** 18).toFixed(5)
                token = Math.abs(amount0) / 10 ** decimals
                from = "0x" + to.substring(26, 66)
                price = (eth / token) * ethprice

            }


        } else {
            // Le 1 est le token

            if (amount0 < 0 && amount1 > 0) {

                action = "sell"
                eth = parseFloat(amount0 / 10 ** decimals).toFixed(5)
                token = Math.abs(amount1) / 10 ** 18
                from = "0x" + to.substring(26, 66)
                price = (eth / token) * ethprice

            } else {

                // Il n'y a pas de wETH qui rentre ni de token qui sort

                action = "buy"
                eth = parseFloat(amount0 / 10 ** decimals).toFixed(5)
                token = Math.abs(amount1) / 10 ** 18
                from = "0x" + to.substring(26, 66)
                price = (eth / token) * ethprice

            }

        }


        return {
            action: action,
            eth: eth,
            coin: token,
            sender: from,
            timestamp: time,
            price: price
        }

    }

}


function blockFromBlock(targetBlock, currentBlock, currentTimestamp) {
    const averageBlockTime = 12

    // Calculer la différence de blocs entre le bloc actuel et le bloc cible
    const blockDifference = targetBlock - currentBlock;

    // Calculer le temps écoulé en secondes
    const timeElapsed = blockDifference * averageBlockTime;

    // Estimer le timestamp du bloc cible
    const estimatedTimestamp = currentTimestamp + timeElapsed;

    return estimatedTimestamp;
}

