/**
 * @file Sample getdata command with slash command.
 * @author Vitality Migø
 */



const { EmbedBuilder, ButtonInteraction, SlashCommandBuilder } = require("discord.js");
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { profileData, accessSql, reportsql, interactionData, wallets, apimonitorsql, adminsql, usersql, sequelize } = require('../../../events/database');
const moment = require('moment');

const axios = require('axios')

const formatCoinValueSign = require("../../../functions/formatNumberEmbed")
const { getEthPrice } = require('../../../config/web3data')
const { getToken } = require('../../../functions/coin-utils')
const reduceText = require("../../../functions/reducetext")

// Fonctions
function formatWallet(input) {
    return input.length > 35 ? `${input.substring(0, 6)}…${input.substring(input.length - 6)}` : input;
}



module.exports = {
    id: 'button_exec_open_panel_',

    async execute(interaction) {
        if (!(interaction instanceof ButtonInteraction)) return;


        //Récupérer informations de l'utilisateur de la commande
        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id
        let botId = interaction.applicationId

        await interaction.deferReply({ ephemeral: true })


        try {


            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")


            //Checkpoint
            console.log("// Step 2 : Authorization - Executed ✅")


            //Récupère le password donné par l'utilisateur

            const customId = interaction.customId


            // Utilisation d'une expression régulière pour extraire l'adresse Ethereum
            const regex = /_0x([0-9a-fA-F]{40})/;
            const matches = customId.match(regex);

            if (matches && matches[1]) {

                try {




                    let volume1h = "N/A"
                    let volume6h = "N/A"
                    let volume1d = "N/A"
                    let evolution1h = 0
                    let evolution6h = 0
                    let evolution1d = 0
                    let liquidity = 0
                    let currentSupply = "N/A"
                    let poolGrowth = 0
                    let fdv = 0
                    let inTrades = "N/A"
                    let outTrades = "N/A"
                    let ownership = "N/A"
                    let holdersFormatted = ""
                    let holdersCount = 0
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

                    let volume1hFormatted = "`0.000Ξ (0$)`"
                    let volume6hFormatted = "`0.000Ξ (0$)`"
                    let volume1dFormatted = "`0.000Ξ (0$)`"





                    //Variable pour les options
                    const coinTicker = "0x" + matches[1]

                    const ethPriceUsd = getEthPrice()


                    //On récupère les infos du coin
                    const coinInfos = await getToken([coinTicker])

                    if (coinInfos.length > 0) {


                        coinName = coinInfos[0].name
                        coinSymbol = coinInfos[0].symbol
                        coinDecimal = coinInfos[0].decimals


                        // On renvoi le premier embed
                        const loadingEmbed = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Panel Loading <a:AuraLoading:1134068847616458792>")
                            .setDescription(">>> Displaying the coin panel")
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            // .setThumbnail(twitterPfp)
                            .setTimestamp()
                            .addFields(
                                { name: " ", value: " ", inline: false },
                                { name: "Target", value: "`" + coinSymbol.toUpperCase() + "`", inline: true },
                                { name: "Action", value: "`📊 Trade Panel`", inline: true },
                                { name: " ", value: " ", inline: false },
                                { name: " ", value: "**Trade Panel** <a:AuraLoading:1134068847616458792>", inline: false },

                            )
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [loadingEmbed], ephemeral: true });




                        //On load l'image
                        // const chartImageLink = "https://api.chart-img.com/v1/tradingview/advanced-chart?key=" + chartApiKey + "&symbol=" + coinSymbol + "WETH&interval=1D&theme=dark&width=800&height=400"



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
                            holdersTable = values[0].holders

                            if (holdersCount) { holdersCount = values[0].holder_count }
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

                        }

                        if (honeypot == "0") { isHoneyPot = "✅ No" }
                        else if (honeypot == "1") { isHoneyPot = "❌ Yes" }
                        else { isHoneyPot = "⚠️ No data" }

                        if (mintable == "0") { isMintable = "✅ No" }
                        else if (mintable == "1") { isMintable = "❌ Yes" }
                        else { isMintable = "⚠️ No data" }



                        if (holdersTable) {

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
                        }




                        if (supply) {
                            marketcap = supply * coinActualPriceUsd
                        } else {
                            marketcap = 0
                            supply = 0
                        }

                        if (holdersFormatted == "") { holdersFormatted = "```No holders found for this token              ```" }
                        if (!inTrades) { inTrades = 0 }
                        if (!outTrades) { outTrades = 0 }



                        if (volume1h != 'N/A' || !volume1h) { volume1hFormatted = "`" + parseFloat(volume1h / ethPriceUsd).toFixed(5) + "Ξ\n(" + new Intl.NumberFormat('en-US').format(parseFloat(volume1h).toFixed(0)) + "$)`" }
                        if (volume6h != 'N/A' || !volume6h) { volume6hFormatted = "`" + parseFloat(volume6h / ethPriceUsd).toFixed(5) + "Ξ\n(" + new Intl.NumberFormat('en-US').format(parseFloat(volume6h).toFixed(0)) + "$)`" }
                        if (volume1d != 'N/A' || !volume1d) { volume1dFormatted = "`" + parseFloat(volume1d / ethPriceUsd).toFixed(5) + "Ξ\n(" + new Intl.NumberFormat('en-US').format(parseFloat(volume1d).toFixed(0)) + "$)`" }



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
                                { name: "1H Volume", value: volume1hFormatted, inline: true },
                                { name: "6H Volume", value: volume6hFormatted, inline: true },
                                { name: "1D Volume", value: volume1dFormatted, inline: true },
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









                } catch (error) {

                    console.log(error)
                    const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Coin Panel")
                        .setDescription("An error occured whil retreiving the coin data. Please try again or feel free to contact a team member if you need help.")
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.editReply({ embeds: [errorNotEthereum], ephemeral: true });


                }












            } else {


                const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Coin Panel")
                    .setDescription("An error occured while retreiving the coin address. Please try again using `/coin data` or contact a team member if you need help.")
                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                    .setAuthor({ name: "Aura", iconURL: "https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png" })
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                await interaction.editReply({ embeds: [gasTrackerEmbed2], ephemeral: true });




            }


        } catch (error) {


            console.log("// Error - sent in report ❌")



            console.log("//////////\n\nDetails de l'erreur :\n\n" + error.stack + "\n\n//////////")

            const reduceText = require("../../../functions/reducetext")
            const roleTag = "1121510423687090186"


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
            let reportCommand = "/coin-openpanel"

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
    },
};



