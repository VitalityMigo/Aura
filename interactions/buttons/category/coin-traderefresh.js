/**
 * @file Sample button interaction
 * @author JAYZHVJ
 * @since 3.0.0
 * @version 3.2.2
 */

/**
 * @type {import('../../../typings').ButtonInteractionCommand}
 */


const { ButtonInteraction } = require('discord.js');
const { ActionRowBuilder, EmbedBuilder, ButtonBuilder } = require("discord.js");
const { profileData, accessSql, reportsql, interactionData, wallets, apimonitorsql, adminsql, usersql, sequelize } = require('../../../events/database');
const moment = require('moment');

// Fonctions d'execution et de formattage
const { createFactory } = require('../../../functions/coin-utils')

const reduceText = require("../../../functions/reducetext")
const formatCoinValueSign = require("../../../functions/formatNumberEmbed")
const getApprovals = require("../../../functions/getApprovals")
const getEthPrice = require('../../../functions/getethprice')



//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const etherscanApiKey = process.env.etherscanApiKey
const reservoirApiKey = process.env.reservoirApiKey
const blockspanApiKey = process.env.blockspanApiKey
const alchemyApiKey = process.env.alchemyApiKey
const moralisApiKey = process.env.moralisApiKey
const chartApiKey = process.env.chartApiKey
const magicedenApiKey = process.env.chainbaseApiKey


// Axios
const axios = require('axios')


// Instance des APIs cryptos
const Moralis = require("moralis").default;

//Reservoir API
const sdk = require('api')('@reservoirprotocol/v2.0#2672bklexdpsbi');
sdk.auth(reservoirApiKey);
//;

//Block Span API
const bsp = require('api')('@blockspan/v1.0#9zxl2sledru983');
bsp.auth(blockspanApiKey);


//Web3 API + Cloudfare Provider
var Web3 = require("web3")
const web3 = new Web3("https://cloudflare-eth.com")

//Alchemy API 
const { Network, Alchemy } = require('alchemy-sdk');
const { match } = require('assert');
const settings = {
    apiKey: alchemyApiKey, // Replace with your Alchemy API Key.
    network: Network.ETH_MAINNET, // Replace with your network.
};
const alchemy = new Alchemy(settings);
const alchemy2 = require('api')('@alchemy-docs/v1.0#24zcsa23lfbpdnv5');


// Fonctions


function formatWallet2(input) {
    return input.length > 35 ? `${input.substring(0, 4)}…${input.substring(input.length - 4)}` : input;
}


// Initialisation du contrat de pair
const wETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"




module.exports = {
    id: 'button_coin_tradelist_refresh_',

    async execute(interaction) {
        if (!(interaction instanceof ButtonInteraction)) return;

        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id
        let botId = interaction.applicationId



        try {

            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")




            //Checkpoint
            console.log("// Step 2 : Authorization - Executed ✅")



            const customId = interaction.customId


            // Utilisation d'une expression régulière pour extraire l'adresse Ethereum
            const regex = /_0x([0-9a-fA-F]{40})/;
            const matches = customId.match(regex);

            if (matches && matches[1]) {


                await interaction.deferUpdate({ ephemeral: true })


                    const date = Date.now()
                    const timestamp = parseInt(date / 1000)


                    const contract = "0x" + matches[1]

                    const random_address = "0x862284B87b774bbEC86c4f13bA6c283C4552AfAB"
                    const random_slippage = 0
                    const transfer_events = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"

                    // On crée la paire grâce à la factory
                    const factory = await createFactory(
                        "swap_eth_to_token",
                        contract,
                        random_address,
                        random_slippage
                    )

                    const userFTEmbed = new EmbedBuilder().setColor("#060A8F")
                        .setTitle(factory.toToken.symbol)
                        .setDescription(">>> Displaying the last trades on`" + factory.toToken.symbol + "`.")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .addFields(
                            { name: "Symbol", value: "`" + factory.toToken.symbol + "`", inline: false },
                            { name: "Contract", value: "`" + contract + "`", inline: false },
                            { name: " ", value: " ", inline: false },

                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })



                    const coinData = await axios.get("https://api.dexscreener.io/latest/dex/tokens/" + contract)

                    if (coinData.data.pairs != null) {

                        const pairData = coinData.data.pairs.filter((item) => item.quoteToken.address.toLowerCase() === wETH.toLowerCase() && item.dexId === "uniswap")[0]


                        //const pool = pairData.pairAddress
                        const version = pairData.labels[0]
                        const tokenDecimals = factory.toToken.decimals
                        const pool = pairData.pairAddress

                        // Définition des deux topics uniswap de swap
                        const uniswap_swap_topicV2 = '0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822'; // Remplacez par le vrai topic V2
                        const uniswap_swap_topicV3 = '0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67'; // Remplacez par le vrai topic V3

                        // On séléctionne le topic approprié
                        let uniswap_topic = uniswap_swap_topicV2
                        if (version == "v3") { uniswap_topic = uniswap_swap_topicV3 }

                        if (version == 'v2') {


                            // Dernier bloc
                            const blockRange = 799
                            const toBlock = await web3.eth.getBlockNumber();
                            const fromBlock = toBlock - blockRange


                            // Obtenez les événements avec les deux topics
                            // On regarde les derniers évênements
                            const eventsCall = await web3.eth.getPastLogs({
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

                                const decode = await decodeUniswapSwapEventV2(swap.data, swap.topics, swap.blockNumber, toBlock, contract, wETH, tokenDecimals, timestamp)

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





                        }


                  

                        await interaction.editReply({ embeds: [userFTEmbed]  });



                    } else {

                        const notMember = new EmbedBuilder().setColor("#060A8F")
                            .setTitle(`Token Data`)
                            .setDescription("The coin address you entered can't be retreive. This can happen for few reasons :\n\n• The token address (ERC20) doesn't exist\n• The coin isn't available anymore or is suspicious\n• You entered a symbol for a ERC20 and not a token address, double check.\n\nIf you think the problem is on our end, please use `/report` or contact an admin.")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                        await interaction.reply({ embeds: [notMember], components: [], ephemeral: true });

                    }








                


             

            } else {


                const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Coin Data")
                    .setDescription("An error occured while retreiving the coin address. Please try again using `/coin data` or contact a team member if you need help.")
                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                    .setAuthor({ name: "Aura", iconURL: "https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png" })
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                await interaction.reply({ embeds: [gasTrackerEmbed2], ephemeral: true });




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
            let reportCommand = "/coin-refresh"

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


            await interaction.reply({ embeds: [errorAnswerUser], ephemeral: true });


        }
    },
};




// Fonctions d'aide
// On crée quelques fonctions utiles
async function decodeUniswapSwapEventV2(input, topics, block, toBlock, contract, wETH, decimals, timestamp) {

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


    return {
        action: action,
        eth: eth,
        coin: token,
        sender: from,
        timestamp: time,
        price: price
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

