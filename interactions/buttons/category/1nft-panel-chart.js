/**
 * @file Sample getdata command with slash command.
 * @author Vitality Migø
 */



const { EmbedBuilder, SlashCommandBuilder, ButtonInteraction } = require("discord.js");
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { profileData, accessSql, reportsql, adminsql } = require('../../../events/database');
const moment = require('moment');


// On récupère les nodes et API
const { reservoirI } = require("../../../config/web3config")

// Nodes Canvas
const { createCanvas, loadImage } = require('canvas');



// Fonctions
function isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}


module.exports = {
    id: 'button_nft_tradepanel_chart_',

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

                // On defer la reply
                await interaction.deferReply({ ephemeral: true })
               
                // On commence par envoyer l'embed de chargement
                const errorAnswerUser = new EmbedBuilder().setColor("#060A8F")
                .setTitle("Loading Chart...")
                .setDescription("Aura is currently building your chart, wait a second <a:AuraLoading:1134068847616458792>")
                .setTimestamp()
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


            await interaction.editReply({ embeds: [errorAnswerUser], ephemeral: true });



                // On récupère l'addresse du subject et défini le quickbuy à 1
                const contract = "0x" + matches[1]


                let sales

                await reservoirI.getSalesV6({
                    contract: contract,
                    includeTokenMetadata: 'true',
                    includeDeleted: 'false',
                    sortBy: 'time',
                    sortDirection: 'desc',
                    limit: '1000',
                    accept: '*/*'
                })
                    .then(({ data }) =>
                        sales = data.sales.reverse().map(item => ({
                            price: item.price.amount.decimal,
                            timestamp: item.timestamp - data.sales[0].timestamp,
                            origin: item.timestamp,
                            collection: item.token.collection.name
                        })))
                    .catch(err => console.error(err));



                // Filtrer les "sales rares" en comparant la moyenne des 5 autour de chaque vente
                const filteredSales = sales.filter((sale, i) => {
                    const average = calculateAverage(sales, i, 10);
                    const threshold = 1.25; // Changer cela selon votre critère (20% de plus, par exemple)
                    const thresholdLow = 0.85; // Changer cela selon votre critère (20% de plus, par exemple)
                    return sale.price <= threshold * average && sale.price >= thresholdLow * average;
                });

                // Trouver la plus petite et la plus grande valeur pour la propriété 'price'
                const { minPrice, maxPrice } = filteredSales.reduce((acc, curr) => {
                    const price = curr.price

                    // Trouver la plus petite valeur
                    acc.minPrice = Math.min(acc.minPrice, price);

                    // Trouver la plus grande valeur
                    acc.maxPrice = Math.max(acc.maxPrice, price);

                    return acc;
                }, { minPrice: Infinity, maxPrice: -Infinity });


                // Maintenant il faut 
                //   const upGap = maxPrice * xxx

                // Dessiner
                const canvas = createCanvas(1200, 700);
                const ctx = canvas.getContext('2d');

                // // Définir le fond noir
                // ctx.fillStyle = '#0A0A0A'; // #000 représente le code hexadécimal pour le noir
                //  ctx.fillRect(0, 0, canvas.width, canvas.height);
                const background = await loadImage("./visual/aura/permanent/chart.png");
                ctx.drawImage(background, 0, 0, canvas.width, canvas.height); // Ajouter l'image de fond au canvas

                // // Filtrer les données selon votre critère
                // const filteredSalesData = salesData.filter(sale => sale.price < 1);

                // Activer l'effet de goutte de lumière pour les contours des cercles
                const leftMargin = 45
                const rightMargin = 80
                const chartPRT = canvas.width - leftMargin - rightMargin
                const time = sales[sales.length - 1].timestamp

                const priceGap = maxPrice - minPrice
                const volumePRT = 135
                const titlePRT = 100
                const pricePRT = canvas.height - volumePRT - titlePRT
                const priceOnCanvas = pricePRT / priceGap


                // On récupère le tableau final
                // On reprend le tab de base et on filter les sales au dessus du max
                // Ca nous laisse avec le même min/max mais 
                const salesTAB = sortBigSales(sales, maxPrice, minPrice)


                // Dessiner les points du graphique
                salesTAB.forEach((sale, index) => {
                    const x = leftMargin + (chartPRT / time) * sale.timestamp
                    const y = titlePRT + (priceOnCanvas * (maxPrice - sale.price))

                    // Dessin du cercle
                    const arc = 2 * Math.PI
                    const sizeA = 4.3
                    const sizeB = 0
                    const stk = sizeA / 6

                    // Dessiner le cercle principal (légèrement transparent)
                    ctx.fillStyle = 'rgba(207, 191, 225, 0.4)'; // Blanc avec une transparence
                    ctx.beginPath();
                    ctx.arc(x, y, sizeA, sizeB, arc); // 8 est le rayon du cercle, ajustez-le selon vos besoins
                    ctx.fill();
                    ctx.closePath();

                    // On met le petit glow
                    ctx.shadowBlur = 4; // Ajustez la taille du blur selon vos besoins
                    ctx.shadowColor = 'rgba(255, 255, 255, 0.4)'; // Blanc avec une transparence

                    // Dessiner le contour non transparent autour du cercle principal
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'; // Blanc avec une transparence
                    ctx.lineWidth = stk; // Ajustez l'épaisseur du contour selon vos besoins
                    ctx.beginPath();
                    ctx.arc(x, y, sizeA, sizeB, arc);
                    ctx.stroke();
                    ctx.closePath();

                    ctx.shadowBlur = 0;

                });







                // On récupère l'échelle de prix
                const priceLadder = priceScale(priceOnCanvas, titlePRT, maxPrice)

                for (let index = 0; index < priceLadder.length; index++) {

                    const ladder = priceLadder[index]
                    const ladderGap = 88.5
                    const firstLadder = 146
                    const fontGap = 5

                    const x = 1145
                    const y = firstLadder + fontGap + (index * ladderGap)

                    ctx.font = "450 14px 'Fira Code'";
                    ctx.fillStyle = '#ffffff'; // Blanc avec une transparence
                    ctx.fillText(ladder, x, y);


                }




                // Charte de volume
                const bars = 91
                const volumeTAB = groupByTimestamp2(salesTAB, bars)



                const { minVol, maxVol } = volumeTAB.reduce((acc, curr) => {
                    const vol = curr.total

                    // Trouver la plus petite valeur
                    acc.minVol = Math.min(acc.minVol, vol);

                    // Trouver la plus grande valeur
                    acc.maxVol = Math.max(acc.maxVol, vol);

                    return acc;
                }, { minVol: Infinity, maxVol: -Infinity });

                // Les datas de la charte de volume
                const wide = 10
                const space = 2
                const highest = 105
                const volOnCanvas = highest / (maxVol - minVol)
                const volLeftMargin = 39

                // Dessin du volume
                volumeTAB.forEach((sale, index) => {
                    const indexMargin = (wide + space) * index // On note à quel index on est
                    const high = sale.total * volOnCanvas

                    const x = volLeftMargin + indexMargin // La position sur le canvas
                    const y = canvas.height - 21 - high // Elles commencent toutes à la même hauteur


                    // Dessiner le rectangle
                    ctx.fillStyle = 'rgba(64, 0, 248, 0.25)'; // Fill du rectangle
                    ctx.fillRect(x, y, wide, high);

                    ctx.shadowBlur = 4; // Ajustez la taille du blur selon vos besoins
                    ctx.shadowColor = 'rgba(255, 255, 255, 0.4)'; // Blanc avec une transparence

                    // Dessiner le rectangle
                    ctx.strokeStyle = '#EDE0FF'; // Blanc avec une transparence
                    ctx.lineWidth = 0.6; // Ajustez l'épaisseur du contour selon vos besoins
                    ctx.strokeRect(x, y, wide, high);

                    ctx.shadowBlur = 0;


                })


                // On fait l'échelle de temps
                // On récupère l'échelle de prix
                const timeLadder = timeScale(salesTAB, chartPRT)
                const timetamps = formatTimestamps(timeLadder, salesTAB)

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



                // On fait les dernière opérations de format
                // Comme le nom, le floor etc
                // Dessiner les points du graphique

                // Nom de la collection
                const name = sales[0].collection
                ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
                ctx.shadowBlur = 8.5;
                ctx.font = "500 31px 'Fira Code'";
                ctx.fillStyle = '#ffffff'; // Blanc avec une transparence
                const nameSZ = ctx.measureText(name).width
                ctx.fillText(name, 600 - nameSZ / 2, 39);

                // Floor de la collection
                const floor = "floor: " + getLastValidSale(salesTAB) + "Ξ"
                ctx.font = "250 12px 'Fira Code'";
                ctx.fillStyle = '#ffffff'; // Blanc avec une transparence
                ctx.fillText(floor, 25, 25);

                // Interval
                const interval = "interval: " + convertSecondsToTime(salesTAB[salesTAB.length - 1].timestamp)
                ctx.font = "250 12px 'Fira Code'";
                ctx.fillStyle = '#ffffff'; // Blanc avec une transparence
                ctx.fillText(interval, 25, 45);


                // Dessiner l'image de profil sur le canvas
                const buffer2 = canvas.toBuffer('image/png');

                await interaction.editReply({ files: [buffer2], embeds: [], ephemeral: true })

               

            } else {


                const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("NFT Data")
                    .setDescription("An error occured while retreiving the NFT address. Please try again using `/nft data` or contact a team member if you need help.")
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


// Fonctions
function calculateAverage(arr, i, count) {
    const start = Math.max(0, i - Math.floor(count / 2));
    const end = Math.min(arr.length, i + Math.ceil(count / 2));
    const sum = arr.slice(start, end).reduce((acc, curr) => acc + curr.price, 0);
    return sum / (end - start);
}

function sortBigSales(array, max, min) {

    const result = array.filter(item => item.price <= max && item.price >= min)
    return result
}


function groupByTimestamp2(sales, numBars) {
    const result = [];

    // Triez les ventes par timestamp
    sales.sort((a, b) => a.timestamp - b.timestamp);

    // Calculez le gap total entre la première et la dernière vente
    const totalTimestampGap = sales[sales.length - 1].timestamp - sales[0].timestamp;

    // Calculez la taille de chaque barre en termes de timestamp
    const barTimestampSize = totalTimestampGap / numBars;

    // Initialisez les compteurs
    let currentBarIndex = 0;
    let currentBarSales = 0;
    let currentBarVolume = 0;
    let currentBarTimestamp = sales[0].timestamp;

    // Parcourez les ventes pour créer les barres de volume
    for (const sale of sales) {
        while (sale.timestamp >= currentBarTimestamp + barTimestampSize) {
            // Créez un objet représentant la barre actuelle
            result.push({
                index: currentBarIndex,
                sales: currentBarSales,
                total: currentBarVolume,
            });

            // Réinitialisez les compteurs pour la prochaine barre
            currentBarIndex++;
            currentBarSales = 0;
            currentBarVolume = 0;
            currentBarTimestamp += barTimestampSize;
        }

        // Mettez à jour les compteurs pour la vente actuelle
        currentBarSales++;
        currentBarVolume += sale.price;
    }

    return result;
}


function priceScale(priceOnCanvas, maxSaleLocation, maxSale) {

    // On définit les valeurs de base
    const places = 6
    const space = 88.5

    // On calcul le nombre de CM de différence entre la vente
    // max et la première échelle (initialGap)
    const firstLadder = 146
    const initialGap = firstLadder - maxSaleLocation

    // On calcul le nombre d'ETH dans un centimètre
    // en utilisant le priceOnCanvas (CM par ETH).
    // Puis on calcul le prix en ETH du premier gap
    const ethPerCm = 1 / priceOnCanvas

    const result = []

    for (let index = 0; index < places; index++) {

        let gap = maxSale - (initialGap + (index * space)) * ethPerCm;

        if (gap < 0.1) {
            gap = parseFloat(gap).toFixed(3)
        } else if (gap < 1 && gap >= 0.1) {
            gap = parseFloat(gap).toFixed(2)
        } else if (gap < 10 && gap >= 1) {
            gap = parseFloat(gap).toFixed(1)
        } else {
            gap = parseFloat(gap).toFixed(1)
        }

        result.push(gap)

    }
    return result
}

function getLastValidSale(sales) {
    const numSalesToConsider = 10;

    if (sales.length < numSalesToConsider) {
        // Il n'y a pas assez de ventes pour appliquer la logique, renvoie simplement la dernière vente
        return sales[sales.length - 1];
    }

    let i = sales.length - 1;

    while (i >= numSalesToConsider - 1) {
        const currentSales = sales.slice(i - (numSalesToConsider - 1), i + 1);
        const averagePrice = currentSales.slice(0, -1).reduce((sum, sale) => sum + sale.price, 0) / (numSalesToConsider - 1);

        const lastSale = currentSales[numSalesToConsider - 1];
        const priceDifference = Math.abs(lastSale.price - averagePrice);
        const priceThreshold = 1.0; // Ajustez selon vos besoins

        if (priceDifference <= priceThreshold) {
            // La dernière vente est cohérente, renvoie la dernière vente
            return lastSale.price;
        }

        i--;
    }

    // Si aucune vente cohérente n'est trouvée, renvoie simplement la dernière vente
    return sales[sales.length - 1].price;
}

function convertSecondsToTime(seconds) {
    const secondsInMinute = 60;
    const secondsInHour = 3600;
    const secondsInDay = 86400;
    const secondsInWeek = 604800;
    const secondsInMonth = 2592000;

    if (seconds < secondsInMinute) {
        return seconds + "s";
    } else if (seconds < secondsInHour) {
        const minutes = Math.round(seconds / secondsInMinute);
        return minutes + "m";
    } else if (seconds < secondsInDay) {
        const hours = Math.round(seconds / secondsInHour);
        return hours + "h";
    } else if (seconds < secondsInWeek) {
        const days = Math.round(seconds / secondsInDay);
        return days + "d";
    } else if (seconds < secondsInMonth) {
        const weeks = Math.round(seconds / secondsInWeek);
        return weeks + "w";
    } else {
        const months = Math.round(seconds / secondsInMonth);
        return months + "M";
    }
}

function timeScale(data, frameSZ) {

    // On met les valeurs de base
    const initialSpace = 146
    const space = 158
    const places = 7
    const littleGap = 11

    const frameTime = data[data.length - 1].timestamp
    const originTime = data[0].origin

    const timePerCm = frameTime / frameSZ
    const firstTime = originTime - (littleGap * timePerCm)

    const result = []

    for (let index = 0; index < places; index++) {

        let gap = firstTime + (((index) * space) * timePerCm)

        result.push(gap)

    }

    return result
}

function formatTimestamps(timestamps, data) {
    const firstSale = data[0].origin
    const lastSale = data[data.length - 1].origin

    const timeDiff = lastSale - firstSale;
    const oneHour = 3600; // en secondes
    const oneDay = 24 * oneHour;
    const oneWeek = 7 * oneDay;

    const firstTimestamp = timestamps[0];
    const lastTimestamp = timestamps[timestamps.length - 1];

    // On définit les timestamp variable
    let secondTimestamp = 0
    let currentDate = new Date(firstTimestamp * 1000);


    const formattedTimestamps = timestamps.map((timestamp, index) => {
        const date = new Date(timestamp * 1000); // convertir en millisecondes

        if (timeDiff <= oneDay * 2) {
            // Option 1: moins de 24 heures
            if (index === 0) {
                // C'est le premier timestamp
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            } else {
                if ((date.getDate() === new Date(firstTimestamp * 1000).getDate() && date.getMonth() === new Date(firstTimestamp * 1000).getMonth())
                    || (date.getDate() === new Date(secondTimestamp * 1000).getDate() && date.getMonth() === new Date(secondTimestamp * 1000).getMonth())) {
                    // Même jour que le premier timestamp
                    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' });
                } else {
                    // Autre jour
                    secondTimestamp = timestamp
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                }
            }
        } else if (timeDiff <= oneWeek) {
            // Option 2: Entre 1 et 7 jours
            const isSameDay = date.getDate() === currentDate.getDate();
            const isSameMonth = date.getMonth() === currentDate.getMonth();


            if (index === 0) {
                return ' '
            } else {

                if (isSameDay && isSameMonth && timeDiff > oneDay) {
                    // Répétition du jour, afficher heures/minutes
                    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' });
                } else {
                    // Nouveau jour, afficher mois/jour
                    currentDate = new Date(timestamp * 1000);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }

            }
        } else {
            // Option 3: Plus de 7 jours
            if (index === 0) {
                return ' '
            } else {

                // Nouveau jour, afficher jour/mois
                return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
            }
        }
    });
    return formattedTimestamps;
}