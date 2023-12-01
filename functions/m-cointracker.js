const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { tracker_coin, Op, sequelize } = require('../events/database')


const axios = require('axios')
const colors = require('colors');
const fs = require('fs').promises;


const reduceText = require("./reducetext")
const addTimeout = require("./addtimeout")
const { getToken } = require('./coin-utils')
const uniswapDecoder = require("./uniswap-decoder.js")
const formatCoinValueSign = require("./formatNumberEmbed.js")


//Web3 API + Cloudfare Provider
var Web3 = require("web3")
const web3 = new Web3("https://cloudflare-eth.com")


const pairABI = require("../contracts/uniswap/pair.json")
const quotes = require("../contracts/uniswap/quote.json")


const approvalSig = "0x095ea7b3"
const swapUniV2 = "0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822"
const swapUniV3 = "0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67"
const swapTopicsArray = [swapUniV2, swapUniV3]
const wETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"

const typeUniswapV3SwapEvent = [
    { type: 'int256', name: 'amount0' },
    { type: 'int256', name: 'amount1' },
    { type: 'uint160', name: 'sqrtPriceX96' },
    { type: 'uint128', name: 'liquidity' },
    { type: 'int24', name: 'tick' }
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



async function coinTracker(obj) {


    await addTimeout(3)


    try {

        const transaction = obj

        const hash = transaction.hash
        const from = transaction.from.toLowerCase()
        const input = transaction.input
        const signature = input.substring(0, 10)
        const contract = transaction.to



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

                        const symbol = swap.target.symbol
                        const address = swap.target.address


                        let action = "📈 Buy"
                        let value_symbol = "$"
                        let filteredTasks = trackList.filter(item => item.dataValues.buy == "true")
                        if (swap.tokenIn.address.toLowerCase() == wETH) { value_symbol = "Ξ" }
                        let value = swap.tokenIn.amount
                        let amount = swap.tokenOut.amount

                        // On formatte
                        if (swap.action == "sell") {
                            action = "📉 Sell";
                            value_symbol = "$"
                            if (swap.tokenOut.address.toLowerCase() == wETH) { value_symbol = "Ξ" }
                            filteredTasks = trackList.filter(item => item.dataValues.sell == "true")
                            value = swap.tokenOut.amount
                            amount = swap.tokenIn.amount

                        }

                        if (filteredTasks.length > 0) {

                            const trackedAuthor = filteredTasks.map(item => item.dataValues.authorId)

                            const formattedData = "Amount: " + formatCoinValueSign(amount) + "\nValue: " + parseFloat(value).toFixed(3) + value_symbol


                            const userFTEmbed = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Coin Tracker")
                                .setDescription(">>> A new trade has been detected")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setTimestamp()
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "From", value: "[" + (formatWallet(from.toLowerCase())) + "](https://etherscan.io/address/" + from + ")", inline: true },
                                    { name: "Target", value: "`" + symbol + "`", inline: true },
                                    { name: "Action", value: "`" + action + "`", inline: true },
                                    { name: " ", value: "```js\n" + formattedData + "```", inline: false },
                                    { name: "Links", value: '[Etherscan](https://etherscan.io/address/' + address + ") ∙ " + '[DexScreener](https://dexscreener.com/ethereum/' + address + ") ∙ " + '[DexSpy](https://dexspy.io/eth/token/' + address + ") ∙ " + '[Uniswap](https://app.uniswap.org/#/tokens/ethereum/' + address + ") ∙ " + '[Txn](https://etherscan.io/txn/' + hash + ")", inline: false }

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


                const token = await getToken([contract])
                const decimals = token[0].decimals
                const symbol = token[0].symbol

                const approvalTypes = [
                    { type: 'address', name: 'spender' },
                    { type: 'uint256', name: 'amount' },
                ];

                const decodedLogs = web3.eth.abi.decodeParameters(approvalTypes, "0x" + input.slice(10))

                let router = decodedLogs.spender
                let amount = decodedLogs.amount / 10 ** decimals

                if (uniRouters.includes(router.toLowerCase())) {
                    router = "Uniswap"
                } else {
                    router = formatWallet(router)
                }


                let action = "✅ Approve"
                if (parseInt(amount) == 0) { action = "❌ Revoke"; amount = "Min" }
                else if (/^[\d\.]+[eE][\+\-]?\d+$/.test(amount.toString())) {
                    amount = "Max";
                } else { amount = formatCoinValueSign(amount) }

                const formattedData = "Amount: " + amount + "\nSpender: " + router


                const userFTEmbed = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Coin Tracker")
                    .setDescription(">>> A new approval has been detected")
                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                    .setTimestamp()
                    .addFields(
                        { name: " ", value: " ", inline: false },
                        { name: "From", value: "[" + (formatWallet(from.toLowerCase())) + "](https://etherscan.io/address/" + from + ")", inline: true },
                        { name: "Target", value: "`" + symbol + "`", inline: true },
                        { name: "Action", value: "`" + action + "`", inline: true },
                        { name: " ", value: "```js\n" + formattedData + "```", inline: false },
                        { name: "Links", value: '[Etherscan](https://etherscan.io/address/' + contract + ") ∙ " + '[DexScreener](https://dexscreener.com/ethereum/' + contract + ") ∙ " + '[DexSpy](https://dexspy.io/eth/token/' + contract + ") ∙ " + '[Uniswap](https://app.uniswap.org/#/tokens/ethereum/' + contract + ") ∙ " + '[Txn](https://etherscan.io/txn/' + hash + ")", inline: false }

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

// async function main(hash) {

//     const y = await web3.eth.getTransaction()

//     coinTracker(y)
// }
// main()
module.exports = coinTracker