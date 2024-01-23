/**
 * @file Sample getdata command with slash command.
 * @author Vitality Migø
 */



const { EmbedBuilder, SlashCommandBuilder, ButtonInteraction } = require("discord.js");
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { profileData, accessSql, reportsql, adminsql } = require('../../../events/database');
const moment = require('moment');

// Nodes
const { web3CloudflarePublic } = require("../../../config/web3config")

// Chart utils
const { fetchLogsBatch, groupByPeriod, convertSecondsToTime, timeScale, decodeUniswapSwapEvent, formatTimestamps, priceScale, priceIndice } = require("../../../functions/chart-utils")

// Nodes Canvas
const { createCanvas, loadImage } = require('canvas');

// Fonctions d'execution et de formattage
const { getToken, getMetrics } = require('../../../functions/coin-utils')
const { getEthPrice } = require("../../../config/web3data")

// Initialisation de l'addresse du wETH.
const wETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"




module.exports = {
    id: 'button_coin_tradepanel_chart_',

    async execute(interaction) {
        if (!(interaction instanceof ButtonInteraction)) return;

        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id
        let botId = interaction.applicationId

        // On defer la reply
        await interaction.deferReply({ ephemeral: true })


        try {

            //Checkpoint
            console.log("Initialization executed ✅")

            const customId = interaction.customId

            // Utilisation d'une expression régulière pour extraire l'adresse Ethereum
            const regex = /_0x([0-9a-fA-F]{40})/;
            const matches = customId.match(regex);

            if (matches && matches[1]) {


                // On commence par envoyer l'embed de chargement
                const errorAnswerUser = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Loading Chart...")
                    .setDescription("Aura is currently building your chart, wait a second <a:AuraLoading:1134068847616458792>")
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                await interaction.editReply({ embeds: [errorAnswerUser], ephemeral: true });



                // On récupère l'addresse du subject et défini le quickbuy à 1
                const contract = "0x" + matches[1]

                // On récupère le timestamp et le prix de l'ETH
                // Des valeurs qu'on utilisera par la suite dans le code
                const date = Date.now()
                const timestamp = parseInt(date / 1000)
                const ethPriceUsd = getEthPrice()
                const tokenCALL = getToken([contract])

                // On récupère les metrics du token (pool, version, etc).
                const metrics = await getMetrics(contract)
                const pair = metrics.pool
                const version = metrics.version


                // On défini les events d'Uniswap
                // Aussi, on trouve la version et séléctionne le topic adapté
                const events = {
                    uniswapV2: "0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822",
                    uniswapV3: "0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67"
                }
                let topic = events.uniswapV2
                if (version == "v3") { topic = events.uniswapV3 }

                // On définit quelque valeurs qui seront essentiels
                // notamment les blocs range ainsi que le nombre de batch.
                const blockRange = 799
                const currentBlock = await web3CloudflarePublic.eth.getBlockNumber();
                const toBlock = currentBlock
                const fromBlock = toBlock - blockRange
                const repetition = 20
                const batch = 800

                // On utilise fetchLogsBatch() pour récupérer les logs en effectuant plusieurs batch de requête.
                // On utilise le node Cloudflare public, il faut faire attention à la limite.
                // Cela renvoi un tableau avec les logs en version brut, d'Uniswap V2 ou V3
                const logsList = await fetchLogsBatch(fromBlock, toBlock, pair, topic, batch, repetition)

                // On récupère les infos du token
                // On résout la promesse
                const [token] = await Promise.all([tokenCALL]);
                const symbol = token[0].symbol
                const decimals = token[0].decimals

                // On utilise la liste des logs pour les transformer en swap
                // Pour cela on utilise decodeUniswapSwapEvent() qui permet de formatter ces logs en swap
                // Cette fonction peut être instable
                const swaps = []
                for (const swap of logsList) {
                    const decode = await decodeUniswapSwapEvent(version, swap.data, swap.topics, swap.blockNumber, currentBlock, contract, wETH, decimals, timestamp, ethPriceUsd)
                    swaps.push(decode)
                }

                // On utilise groupByPeriod() pour grouper les logs décoder
                // par groupes en fonction du timestamp, le nombre de groupe est définir par barsCount.
                const barsCount = 110
                const data = groupByPeriod(swaps, barsCount)

                // On sépare les résultats en deux groupes
                // d'un côtés les valeurs des bars, de l'autre les valeurs global
                const chart = data.chart
                const global = data.global

                // On trouve le min et max volume
                const vol = chart.reduce(
                    (acc, element, index) => {
                        const volume = element.data.volume;

                        if (volume !== 0 || index == 0) {
                            acc.max = Math.max(acc.max, volume);
                            acc.min = Math.min(acc.min, volume);
                        }

                        return acc;
                    },
                    { max: -Infinity, min: Infinity }
                );

                // Début du dessin de la chart sur le canvas.
                // On commence par ajouter le background
                const canvas = createCanvas(1200, 700);
                const ctx = canvas.getContext('2d');

                const background = await loadImage("./visual/aura/permanent/chart.png");
                ctx.drawImage(background, 0, 0, canvas.width, canvas.height); // Ajouter l'image de fond au canvas

                // On définit des valeurs
                const barSZ = 7
                const spaceSZ = 2.5
                const leftMargin = 45
                const rightMargin = 80
                const chartPRT = canvas.width - leftMargin - rightMargin
                const earliest = global.earliest
                const latest = global.latest
                const timelapse = latest - earliest

                const lowMargin = 135
                const upMargin = 100
                const pricePRT = canvas.height - lowMargin - upMargin
                const highest = global.highest
                const lowest = global.lowest
                const priceGap = highest - lowest
                const priceOnCanvas = pricePRT / priceGap

                // On commence par dessiner la chart
                for (let index = 0; index < chart.length; index++) {



                    const data = chart[index].data
                    const bars = chart[index].bars

                    if (data.volume > 0 || index == 0) {
                        // On vérifie qu'il y'a du volume sur cet interval

                        let entry = bars.exit
                        if (index !== 0) { entry = chart[index - 1].bars.exit }

                        let color = "#4578ED"
                        let bodyLow = entry
                        let bodyHigh = bars.exit
                        if (bars.buy == false) {
                            color = "#B3B5BD"
                            bodyLow = bars.exit
                            bodyHigh = entry
                        }



                        // Dessin du body
                        const bodyW = 7
                        const bodyH = (priceOnCanvas * (bodyHigh - bodyLow))
                        const bodyX = leftMargin + (index * (bodyW + spaceSZ))
                        const bodyY = upMargin + (priceOnCanvas * (highest - bodyHigh))


                        // Dessiner le rectangle
                        ctx.fillStyle = color; // Fill du rectangle
                        ctx.fillRect(bodyX, bodyY, bodyW, bodyH);

                        // Data de la mèche
                        const tigeW = 1
                        const tigeH = priceOnCanvas * (bars.high - bars.low)
                        const tigeX = bodyX + (bodyW / 2) - tigeW / 2
                        const tigeY = upMargin + (priceOnCanvas * (highest - bars.high))

                        // Dessiner la mèche de la candle
                        ctx.fillStyle = color; // Fill du rectangle
                        ctx.fillRect(tigeX, tigeY, tigeW, tigeH);


                        // Les datas de la charte de volume
                        const space = 2.5
                        const volHighest = 103
                        const volOnCanvas = volHighest / (vol.max - vol.min)
                        const margin = 9.5

                        const volW = 7
                        const volHigh = data.volume * volOnCanvas
                        const volX = bodyX + margin
                        const volY = canvas.height - 19 - volHigh // Elles commencent toutes à la même hauteur


                        // Dessiner le rectangle
                        ctx.fillStyle = 'rgba(64, 0, 248, 0.25)'; // Fill du rectangle
                        ctx.fillRect(volX, volY, volW, volHigh);

                        ctx.shadowBlur = 4; // Ajustez la taille du blur selon vos besoins
                        ctx.shadowColor = 'rgba(255, 255, 255, 0.4)'; // Blanc avec une transparence

                        // Dessiner le rectangle
                        ctx.strokeStyle = '#EDE0FF'; // Blanc avec une transparence
                        ctx.lineWidth = 0.45; // Ajustez l'épaisseur du contour selon vos besoins
                        ctx.strokeRect(volX, volY, volW, volHigh);

                        ctx.shadowBlur = 0;
                    }

                }


                // On fait l'échelle de temps grâce aux deux fonctions
                // Puis on formatte ces valeurs.
                const timeLadder = timeScale(chartPRT, earliest, timelapse)
                const timetamps = formatTimestamps(timeLadder, earliest, latest)

                // On écrit les différents niveau de temps sur le canvas.
                for (let index = 0; index < timeLadder.length; index++) {

                    const ladder = timetamps[index]
                    const ladderGap = 158
                    const firstLadder = 45
                    const fontGap = 0

                    const x = firstLadder + fontGap + (index * ladderGap)
                    const y = 693

                    ctx.font = "450 11px 'Fira Code'";
                    ctx.fillStyle = '#ffffff'; // Blanc avec une transparence
                    const dateSZ = ctx.measureText(ladder).width
                    ctx.fillText(ladder, x - dateSZ / 2, y);
                }


                // On calcul l'échelle de prix en fonction du rapport prix et taille du canvas
                const priceLadder = priceScale(priceOnCanvas, upMargin, highest)

                // On écrit les différents niveau de prix sur le canvas.
                for (let index = 0; index < priceLadder.length; index++) {

                    const ladder = priceLadder[index]
                    const ladderGap = 88.5
                    const firstLadder = 146
                    const fontGap = 5

                    const x = 1145
                    const y = firstLadder + fontGap + (index * ladderGap)

                    ctx.font = "450 14px 'Fira Code'";
                    ctx.fillStyle = '#ffffff'; // Blanc avec une transparence
                    ctx.fillText(priceIndice(ladder), x, y);


                }


                // On inscrit toutes les dernières valeurs telles que le nom du coin et plus.
                // On commence par le symbol du coin
                ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
                ctx.shadowBlur = 8.5;
                ctx.font = "500 33px 'Fira Code'";
                ctx.fillStyle = '#ffffff'; // Blanc avec une transparence
                const nameSZ = ctx.measureText("$" + symbol).width
                ctx.fillText("$" + symbol, 600 - nameSZ / 2, 39);

                // Nom du DEX utilisé
                const floor = "dex: uniswap"
                ctx.font = "250 12px 'Fira Code'";
                ctx.fillStyle = '#ffffff'; // Blanc avec une transparence
                ctx.fillText(floor, 25, 25);

                // Interval entre le début et la fin du canvas
                const interval = "interval: " + convertSecondsToTime(timelapse)
                ctx.font = "250 12px 'Fira Code'";
                ctx.fillStyle = '#ffffff'; // Blanc avec une transparence
                ctx.fillText(interval, 25, 45);


                // Dessiner l'image de profil sur le canvas
                const buffer2 = canvas.toBuffer('image/png');

                // On répond en envoyant la charte
                await interaction.editReply({ files: [buffer2], embeds: [], ephemeral: true })


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
            let reportCommand = "/nft-chart"

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