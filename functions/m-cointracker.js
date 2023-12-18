const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { tracker_coin, Op, sequelize } = require('../events/database')

//Web3 API + Cloudfare Provider
var Web3 = require("web3")
const web3 = new Web3("https://cloudflare-eth.com")


const reduceText = require("./reducetext")
const addTimeout = require("./addtimeout")
const { getTokenSupply, getToken } = require('./coin-utils')
const uniswapDecoder = require("./uniswap-decoder.js")
const formatCoinValueSign = require("./formatNumberEmbed.js")
const getEthPrice = require("./getethprice.js")


const approvalSig = "0x095ea7b3"
const swapUniV2 = "0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822"
const swapUniV3 = "0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67"
const swapTopicsArray = [swapUniV2, swapUniV3]
const wETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
const uniLogo = "<:uniswap:1185751246913675374>"

const approvalTypes = [
    { type: 'address', name: 'spender' },
    { type: 'uint256', name: 'amount' },
];

const uniRouters = [
    "0xf164fc0ec4e93095b804a4795bbe1e041497b92a",
    "0x7a250d5630b4cf539739df2c5dacb4c659f2488d",
    "0xe592427a0aece92de3edee1f18e0157c05861564",
    "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45",
    "0x3a76621ec895124badc1fc36d58f3b1265363540",
    "0x000000000022d473030f116ddee9f6b43ac78ba3"
]

function formatWallet(input) {
    return input.length > 35 ? `${input.substring(0, 5)}…${input.substring(input.length - 4)}` : input;
}



// On définit le client et charge les channels
const client = require('../bot'); // Chemin vers le fichier client.js


let serverId = ""
let botGuild = ""

setTimeout(() => {

    const botId = client.user.id;

    if (botId == "1074328639165964368") {
        // PROD

        serverId = "1108754348818845729"

    } else if (botId == "1119666128411709552") {
        // DEV

        serverId = "1071576735298113667"

    }

    botGuild = client.guilds.cache.get(serverId);

}, 4000);



async function coinTracker(transaction) {


    await addTimeout(4)


    try {

        const hash = transaction.hash
        const from = transaction.from.toLowerCase()
        const input = transaction.input
        const signature = input.substring(0, 10)
        const exchange = transaction.to



        let receipt = ""
        let isValid = true
        let action = ""

        // On vérifie si c'est un approval ou pas
        if (signature !== approvalSig) {

            // On fait la liste de ceux qui ont effectivement 
            const whereClause = {
                address: from,
                [Op.or]: [
                    { buy: "true" },
                    { sell: "true" },
                ],
            };

            const trackList = await tracker_coin.findAll(whereClause)

            if (trackList.length > 0) {



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

                        const swap = await uniswapDecoder(swapLogs)

                        // On calcul les gas fees
                        const contract = swap.target.address
                        const fees = receipt.gasUsed * (receipt.effectiveGasPrice / 10 ** 18)

                        // On formatte le champ de trade
                        const swapTitle = "Swap of " + swap.tokenIn.symbol + " to " + swap.tokenOut.symbol


                        // On formatte la zone principale
                        let trade = ""
                        let value = 0
                        let amount = 0
                        let supply = 0
                        let quote = 1
                        let filteredTasks = []

                        // En fonction du sens, on va chercher les valeurs de l'embed

                        if (swap.action == "buy") {
                            value = swap.tokenIn.amount
                            amount = swap.tokenOut.amount
                            supply = await getTokenSupply(swap.tokenOut.address, 16) / 10 ** swap.tokenOut.decimals
                            filteredTasks = trackList.filter(item => item.dataValues.buy == "true")

                            let sign = "$"
                            if (swap.tokenIn.address.toLowerCase() == wETH) { sign = "Ξ"; quote = await getEthPrice() }
                            trade = "Token In: " + parseFloat(value).toFixed(3) + sign + "\nToken Out: " + new Intl.NumberFormat('en-US').format(Math.ceil(swap.tokenOut.amount))
                        } else {
                            value = swap.tokenOut.amount
                            amount = swap.tokenIn.amount
                            supply = await getTokenSupply(swap.tokenIn.address, 16) / 10 ** swap.tokenIn.decimals
                            filteredTasks = trackList.filter(item => item.dataValues.sell == "true")

                            let sign = "$"
                            if (swap.tokenOut.address.toLowerCase() == wETH) { sign = "Ξ"; quote = await getEthPrice() }
                            trade = "Token In: " + new Intl.NumberFormat('en-US').format(Math.ceil(swap.tokenIn.amount)) + "\nToken Out: " + parseFloat(value).toFixed(3) + sign
                        }

                        if (filteredTasks.length > 0) {

                            const trackedAuthor = [...new Set(filteredTasks.map(item => item.dataValues.authorId))];

                            // On calcul les valeurs de prix
                            const price = (value / amount) * parseFloat(quote)
                            const marketCap = price * supply
                            trade += "\nMarket Cap: " + new Intl.NumberFormat('en-US').format(Math.ceil(marketCap)) + "$                   "


                            // Format des metrics
                            const metrics = "Price: `" + priceIndice(price) + "$`\nFees: `" + parseFloat(fees).toFixed(3) + "Ξ`\nDEX: " + uniLogo + "\n"

                            // On formatte les liens
                            const links = '[Etherscan](https://etherscan.io/address/' + contract + ") ∙ " + '[DexScreener](https://dexscreener.com/ethereum/' + contract + ") ∙ " + '[DexSpy](https://dexspy.io/eth/token/' + contract + ") ∙ " + '[DexAnalyzer](https://www.dexanalyzer.io/token/' + contract + ") ∙ " + '[Shuriken](https://app.shuriken.trade)'


                            // On crée et envoi l'embed
                            const userFTEmbed = new EmbedBuilder().setColor("#010616")
                                .setTitle("Coin Tracker")
                                .setDescription(">>> A new trade has been detected")
                                .setImage("https://cdn.discordapp.com/attachments/1100572519896977490/1185619758008254474/e.png?ex=65904572&is=657dd072&hm=7a51469cad88b48198c5f230d13450d50c7e2717c5acdf97a82a6eb1fb5adad4&")
                                .setTimestamp()
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "From", value: "[" + formatWallet(from.toLowerCase()) + "](https://etherscan.io/address/" + from + ")", inline: true },
                                    { name: "To", value: "[" + formatWallet(exchange) + "](https://etherscan.io/address/" + exchange + ")", inline: true },
                                    { name: "Metrics", value: metrics, inline: true },
                                    { name: swapTitle, value: "```css\n" + trade + "```", inline: false },
                                    { name: "Links", value: links, inline: false }

                                )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            for (const author of trackedAuthor) {

                                try {

                                    const member = await botGuild.members.fetch(author);


                                    await member.send({ embeds: [userFTEmbed], components: [] });

                                } catch (error) {

                                    console.log("Impossible d'envoyer le tracker dans les DMs du user: " + error.stack)
                                }

                            }


                        }
                    }




                }
            }

            // C'est un approval
        } else if (signature == approvalSig) {

            // On fait la liste de ceux qui ont effectivement 
            const trackList = await tracker_coin.findAll({ where: { address: from, approval: "true" } })

            if (trackList.length > 0) {

                const trackedAuthor = trackList.map(item => item.dataValues.authorId)


                const token = await getToken([exchange])
                const decimals = token[0].decimals
                const symbol = token[0].symbol
                const contract = token[0].contractAddress

                // Paramètres de gas
                const gasUsed = transaction.gas
                const gasPrice = parseInt(transaction.gasPrice) / 10 ** 9
                const fees = gasUsed * (gasPrice / 10 ** 9)




                const decodedLogs = web3.eth.abi.decodeParameters(approvalTypes, "0x" + input.slice(10))

                let router = decodedLogs.spender
                let amount = decodedLogs.amount / 10 ** decimals

                if (uniRouters.includes(router.toLowerCase())) {
                    router = "Uniswap"
                } else {
                    router = formatWallet(router)
                }


                let action = "Approved"
                if (parseInt(amount) == 0) { action = "Revoked" }
                else if (/^[\d\.]+[eE][\+\-]?\d+$/.test(amount.toString())) {
                    amount = "Max";
                } else { amount = formatCoinValueSign(amount) }

                const title = action + " " + symbol + " for router"
                const approval = "Amount: " + amount + "\nSpender: " + router + "                      "

                // Format des metrics
                const metrics = "Fees: `" + parseFloat(fees).toFixed(3) + "Ξ`\nGas price: `" + parseFloat(gasPrice).toFixed(2) + " gwei`\nGas Used: `" + new Intl.NumberFormat('en-US').format(Math.ceil(gasUsed)) + "`"

                // On formatte les liens
                const links = '[Etherscan](https://etherscan.io/address/' + contract + ") ∙ " + '[DexScreener](https://dexscreener.com/ethereum/' + contract + ") ∙ " + '[DexSpy](https://dexspy.io/eth/token/' + contract + ") ∙ " + '[DexAnalyzer](https://www.dexanalyzer.io/token/' + contract + ") ∙ " + '[Shuriken](https://app.shuriken.trade)'


                // On crée et envoi l'embed
                const userFTEmbed = new EmbedBuilder().setColor("#010616")
                    .setTitle("Coin Tracker")
                    .setDescription(">>> A new trade has been detected")
                    .setImage("https://cdn.discordapp.com/attachments/1100572519896977490/1185619758008254474/e.png?ex=65904572&is=657dd072&hm=7a51469cad88b48198c5f230d13450d50c7e2717c5acdf97a82a6eb1fb5adad4&")
                    .setTimestamp()
                    .addFields(
                        { name: " ", value: " ", inline: false },
                        { name: "From", value: "[" + formatWallet(from.toLowerCase()) + "](https://etherscan.io/address/" + from + ")", inline: true },
                        { name: "To", value: "[" + formatWallet(exchange) + "](https://etherscan.io/address/" + exchange + ")", inline: true },
                        { name: "Metrics", value: metrics, inline: true },
                        { name: title, value: "```js\n" + approval + "```", inline: false },
                        { name: "Links", value: links, inline: false }

                    )
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                for (const author of trackedAuthor) {

                    try {

                        const member = await botGuild.members.fetch(author);


                        await member.send({ embeds: [userFTEmbed], components: [] });

                    } catch (error) {

                        console.log("Impossible d'envoyer le tracker dans les DMs du user: " + error.stack)
                    }

                }






            }




        }











    } catch (error) {

        console.log("Erreur global wallet tracker: " + error.stack)
    }

}
//coinTracker('')


module.exports = coinTracker



function priceIndice(price) {

    if (price > 0.01) {

        return parseFloat(price).toFixed(3)

    } else if (price > 0.001) {

        return parseFloat(price).toFixed(4)

    } else {

        const indices = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉', '₁₀', '₁₁', '₁₂', '₁₃', '₁₄', '₁₅', '₁₆', '₁₇', '₁₈', '₁₉'];
        const decimal = price.toString().split(".")[1]

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