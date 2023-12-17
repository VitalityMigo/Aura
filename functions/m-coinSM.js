const { EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require("discord.js");
const colors = require('colors');

const Web3 = require('web3');
const web3 = new Web3("https://cloudflare-eth.com")

// Fonctions
const addTimeout = require("./addtimeout")
const uniswapDecoder = require("./uniswap-decoder.js")
const { getTokenSupply } = require("./coin-utils.js")
const formatCoinValueSign = require("./formatNumberEmbed.js")
const getEthPrice = require("./getethprice.js")

// On récupère la liste des wallet track
const coinSMFile = require("../contracts/uniswap/smartmoney.json");

// On initialise des valeurs clés
const swapUniV2 = "0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822"
const swapUniV3 = "0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67"
const swapTopicsArray = [swapUniV2, swapUniV3]
const wETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
const uniLogo = "<:uniswap:1185751246913675374>"

function formatWallet(input) {
    return input.length > 35 ? `${input.substring(0, 5)}…${input.substring(input.length - 5)}` : input;
}

// On définit le client et charge les channels
const client = require('../bot'); // Chemin vers le fichier client.js

let serverId = ""
let channelId = ""
let channel = ""
let botGuild = ""

setTimeout(() => {

    const botId = client.user.id;

    if (botId == "1074328639165964368") {
        // PROD

        serverId = "1108754348818845729"
        channelId = "1152587443208470629"

    } else if (botId == "1119666128411709552") {
        // DEV

        serverId = "1071576735298113667"
        channelId = "1155457483649851443"
    }

    botGuild = client.guilds.cache.get(serverId);
    channel = botGuild.channels.cache.get(channelId);

}, 4000);




async function coinSmartmoney(transaction) {


    try {

        await addTimeout(5)

        // const transaction = await web3.eth.getTransaction(hash)

        const sender = transaction.from.toLowerCase()
        const exchange = transaction.to.toLowerCase()
        const input = transaction.input
        const hash = transaction.hash


        if (input != "0x") {

            let receipt = ""
            let isValid = true

            try {
                // on récupère le receipt
                receipt = await web3.eth.getTransactionReceipt(hash)

            } catch (error) {
                console.log("Erreur lors de la récupération de la txn FT SM :" + error)
                isValid = false
            }


            if (isValid == true && receipt.status == true) {



                // On récupère et décode les logs de la transaction
                const logs = receipt.logs
                const swapLogs = logs.filter(log => {
                    return log.topics.some(topic => swapTopicsArray.includes(topic));
                });
                const swapCount = swapLogs.length


                if (swapCount > 0) {
                    // Si il y'a effectivement un swap

                    // On décode le swap
                    const swap = await uniswapDecoder(swapLogs)

                    // On calcul les gas fees
                    const contract = swap.target.address
                    const fees = receipt.gasUsed * (receipt.effectiveGasPrice / 10 ** 18)

                    // On récupère les infos du trader
                    const name = coinSMFile.find(item => item.address == sender).name

                    // On formatte le champ de trade
                    const swapTitle = "Swap of " + swap.tokenIn.symbol + " to " + swap.tokenOut.symbol

                    // On formatte la zone principale
                    let trade = ""
                    let value = 0
                    let amount = 0
                    let supply = 0
                    let quote = 1

                    // En fonction du sens, on va chercher les valeurs de l'embed
                    if (swap.action == "buy") {
                        value = swap.tokenIn.amount
                        amount = swap.tokenOut.amount
                        supply = await getTokenSupply(swap.tokenOut.address, 16) / 10 ** swap.tokenOut.decimals

                        let sign = "$"
                        if (swap.tokenIn.address == wETH) { sign = "Ξ"; quote = await getEthPrice() }
                        trade = "Token In: " + value + sign + "\nToken Out: " + new Intl.NumberFormat('en-US').format(Math.ceil(swap.tokenOut.amount))
                    } else {
                        value = swap.tokenOut.amount
                        amount = swap.tokenIn.amount
                        supply = await getTokenSupply(swap.tokenIn.address, 16) / 10 ** swap.tokenIn.decimals

                        let sign = "$"
                        if (swap.tokenOut.address == wETH) { sign = "Ξ"; quote = await getEthPrice() }
                        trade = "Token In: " + new Intl.NumberFormat('en-US').format(Math.ceil(swap.tokenIn.amount)) + "\nToken Out: " + value + sign
                    }

                    // On calcul les valeurs de prix

                    const price = (value / amount) * parseFloat(quote)
                    const marketCap = price * supply
                    trade += "\nMarket Cap:" + new Intl.NumberFormat('en-US').format(Math.ceil(marketCap)) + "$                   "


                    // Format des metrics
                    const metrics = "Price: `" + priceIndice(price) + "$`\nFees: `" + parseFloat(fees).toFixed(3) + "Ξ`\nDEX: " + uniLogo + "\n"

                    // On formatte les liens
                    const links = '[Etherscan](https://etherscan.io/address/' + contract + ") ∙ " + '[DexScreener](https://dexscreener.com/ethereum/' + contract + ") ∙ " + '[DexSpy](https://dexspy.io/eth/token/' + contract + ") ∙ " + '[DexAnalyzer](https://www.dexanalyzer.io/token/' + contract + ") ∙ " + + '[Suriken](https://app.shuriken.trade) ∙ ' + '[Honeypot](   https://honeypot.is/ethereum?address=' + contract + ")"

                    // On crée le boutton
                    const buttonsRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('button_exec_open_panel_' + contract)
                                .setLabel('📊 Trade Panel')
                                .setStyle(1),
                        );


                    // Console.log() pour le check
                    console.log(colors.green("🤑 New smart money trade coin"))

                    // On crée et envoi l'embed
                    const userFTEmbed = new EmbedBuilder().setColor("#010616")
                        .setTitle("New Smart Trade")
                        .setDescription(">>> A new smart trade has been detected")
                        .setImage("https://cdn.discordapp.com/attachments/1100572519896977490/1185619758008254474/e.png?ex=65904572&is=657dd072&hm=7a51469cad88b48198c5f230d13450d50c7e2717c5acdf97a82a6eb1fb5adad4&")
                        .setTimestamp()
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "From", value: "[" + name + "](https://etherscan.io/address/" + sender + ")", inline: true },
                            { name: "To", value: "[" + formatWallet(exchange) + "](https://etherscan.io/address/" + exchange + ")", inline: true },
                            { name: "Metrics", value: metrics, inline: true },
                            { name: swapTitle, value: "```css\n" + trade + "```", inline: false },
                            { name: "Links", value: links, inline: false }

                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await channel.send({ embeds: [userFTEmbed], components: [buttonsRow] });



                }
            }
        }

    } catch (error) {

        console.log("Erreur lors de la récupération de la transaction de smart money :" + error.stack)


    }

}
//coinSmartmoney("0xed1d008cfe0d0a8db08650adde406ec33009aa95746a3fa25ea3922065353bd1")

module.exports = coinSmartmoney



function priceIndice(price) {

    if (price > 0.01) {

        return parseFloat(price).toFixed(3)

    } else if (price > 0.001) {

        return parseFloat(price).toFixed(4)

    } else {

        const indices = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉', '₁₀', '₁₁', '₁₂', '₁₃', '₁₄', '₁₅', '₁₆', '₁₇', '₁₈', '₁₉'];
        const decimal = price.toString().split(".")[1]
        console.log(price.toString())
        let count = 0
        for (const char of decimal) {
            if (char == "0") {
                count++
            } else {
                break
            }
        }

        const indice = indices[count]
        const firstNoZero = count
        const extra = decimal.substring(firstNoZero, firstNoZero + 2)

        return "0.0" + indice + extra

    }

}
