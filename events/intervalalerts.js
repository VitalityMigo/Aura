//;
const { isBuffer } = require('util');
const { alertsDown, alertsUp, Collections, Authors, adminsql, reportsql, sequelize } = require('./database');

const { EmbedBuilder } = require("discord.js");


//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const reservoirApiKey2 = process.env.reservoirApiKey2

const sdk = require('api')('@reservoirprotocol/v1.0#wt5eflddacli0');
sdk.auth(reservoirApiKey2);

const moment = require('moment');


let channel
let Marketplace
let fpMarketplace
let newFp
let collectionBanner
let collectionTwitter
let collectionWebsite
let collectionSlug

//let tagSent

async function intervalalerts(client) {

    const getfpEmbedUp = new EmbedBuilder().setColor("#060A8F");
    const getfp2EmbedUp = new EmbedBuilder().setColor("#060A8F");
    const getfpEmbedDown = new EmbedBuilder().setColor("#060A8F");
    const getfp2EmbedDown = new EmbedBuilder().setColor("#060A8F");

    //Select * from alertsUp and alertsDown

    const notSentCollectionUp = await alertsUp.findAll({ attributes: ['alertupId', 'collection', 'collectionName', 'authorId', 'fp', 'fp2', 'channelId'], logging: false });
    const notSentCollectionDown = await alertsDown.findAll({ attributes: ['alertdownId', 'collection', 'collectionName', 'authorId', 'fp', 'fp2', 'channelId'], logging: false });

    //for each element of alertsup

    const botId = client.user.id;

    notSentCollectionUp.forEach(elem => {

        try {

            sdk.getEventsCollectionsFlooraskV1({ collection: elem.collection, accept: '*/*' })
                .then(async ({ data }) => {

                    fp = data.events[0].floorAsk.price

                    //console.log("FP WHEN DECLARED : " + fp + " For collection : "+elem.collectionName)

                    Marketplace = data.events[0].floorAsk.source


                    //console.log(fp)

                    if (Marketplace !== 'opensea.io' && Marketplace !== 'OpenSea' && Marketplace !== 'looksrare.org' && Marketplace !== 'LooksRare' && Marketplace !== 'magically.gg' && Marketplace !== 'rarible.com' && Marketplace !== 'Magically' && Marketplace !== 'x2y2.io' && Marketplace !== 'X2Y2') {
                        fp = data.events[1].floorAsk.price
                        Marketplace = data.events[1].floorAsk.source
                    }
                    channel = client.channels.cache.get(elem.channelId)

                    //If the floor is higher and message is not sent

                    if (fp >= parseFloat(elem.fp)) {

                        sdk.getCollectionsV5({ id: elem.collection, accept: '*/*' })
                            .then(async ({ data }) => {

                                collectionBanner = data.collections[0].banner
                                collectionTwitter = data.collections[0].twitterUsername
                                collectionWebsite = data.collections[0].externalUrl
                                collectionSlug = data.collections[0].slug


                                newFp = data.collections[0].floorAsk.price.amount.decimal
                                fpMarketplace = data.collections[0].floorAsk.sourceDomain
                                if (fpMarketplace === 'opensea.io' || fpMarketplace === 'OpenSea') {
                                    Marketplace = '[<:opensea:1062318570761101352> OpenSea](https://opensea.io/collection/' + data.collections[0].slug + ')'
                                }
                                if (fpMarketplace === 'looksrare.org' || fpMarketplace === 'LooksRare') {
                                    Marketplace = '[<:looksrare:1062318572786941983> LooksRare](https://looksrare.org/collections/' + elem.collection + ')'
                                }
                                if (fpMarketplace === 'magically.gg' || fpMarketplace === 'rarible.com' || fpMarketplace === 'sudoswap' || fpMarketplace === 'Magically' || fpMarketplace === 'alienswap.xyz') {
                                    Marketplace = '[<:ASxRCPNG:1070385409080696902> Magically](https://magically.gg/collection/' + elem.collection + ')'
                                }

                                if (fpMarketplace === 'x2y2.io' || fpMarketplace === 'X2Y2') {
                                    Marketplace = '[<:x2y2:1062318571654496317> X2Y2](https://x2y2.io/collection/' + elem.collection + ')'
                                }
                                if (fpMarketplace === 'blur.io') {
                                    Marketplace = '[<:blur:1062318577782378516> Blur](https://blur.io/collection/' + elem.collection + ')'
                                }

                                getfpEmbedUp.setTitle(`${elem.collectionName}`)
                                    .setAuthor({ name: "RC-Bot", iconURL: 'https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg', url: 'https://twitter.com/jayzhvj_eth' })
                                    .setDescription("The upward alert for **" + elem.collectionName + "** has been triggered <a:ol_gifsc_PepeMoneyRain87:1039923196163526676>")
                                    .setImage(collectionBanner)
                                    .addFields(
                                        { name: 'Floor Price', value: "`" + newFp + ' ETH`', inline: true },
                                        { name: 'Alert :chart_with_upwards_trend:', value: "`" + elem.fp + ' ETH`', inline: true },
                                        { name: 'Marketplace', value: Marketplace, inline: true },
                                        { name: "Links", value: '[alphashark](https://magically.gg/collection/' + elem.collection + ") ∙ " + '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + elem.collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + elem.collection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ") ∙ " + '[website](' + collectionWebsite + ")", inline: false }


                                    ).setTimestamp()
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })
                                alertsUp.update({ fp: null }, { where: { alertupId: elem.alertupId } });
                                await channel.send({
                                    content: "<@" + elem.authorId + ">",
                                    embeds: [getfpEmbedUp],
                                    //ephemeral : true

                                });

                            })

                            .catch(err => console.error(err));

                        //We update the fields

                    }

                    if (fp >= parseFloat(elem.fp2)) {

                        sdk.getCollectionsV5({ id: elem.collection, accept: '*/*' })
                            .then(async ({ data }) => {

                                collectionBanner = data.collections[0].banner
                                collectionTwitter = data.collections[0].twitterUsername
                                collectionWebsite = data.collections[0].externalUrl
                                collectionSlug = data.collections[0].slug

                                fpMarketplace = data.collections[0].floorAsk.sourceDomain
                                newFp = data.collections[0].floorAsk.price.amount.decimal
                                if (fpMarketplace === 'opensea.io' || fpMarketplace === 'OpenSea') {
                                    Marketplace = '[<:opensea:1062318570761101352> OpenSea](https://opensea.io/collection/' + data.collections[0].slug + ')'
                                }
                                if (fpMarketplace === 'looksrare.org' || fpMarketplace === 'LooksRare') {
                                    Marketplace = '[<:looksrare:1062318572786941983> LooksRare](https://looksrare.org/collections/' + elem.collection + ')'
                                }
                                if (fpMarketplace === 'magically.gg' || fpMarketplace === 'rarible.com' || fpMarketplace === 'sudoswap' || fpMarketplace === 'Magically' || fpMarketplace === 'alienswap.xyz') {
                                    Marketplace = '[<:ASxRCPNG:1070385409080696902> Magically](https://magically.gg/collection/' + elem.collection + ')'
                                }

                                if (fpMarketplace === 'x2y2.io' || fpMarketplace === 'X2Y2') {
                                    Marketplace = '[<:x2y2:1062318571654496317> X2Y2](https://x2y2.io/collection/' + elem.collection + ')'
                                }
                                if (fpMarketplace === 'blur.io') {
                                    Marketplace = '[<:blur:1062318577782378516> Blur](https://blur.io/collection/' + elem.collection + ')'
                                }

                                getfp2EmbedUp.setTitle(`${elem.collectionName}`)
                                    .setURL('https://magically.gg/collection/' + elem.collection)
                                    .setAuthor({ name: "RC-Bot", iconURL: 'https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg', url: 'https://twitter.com/jayzhvj_eth' })
                                    .setDescription("The upward alert for **" + elem.collectionName + "** has been triggered <a:ol_gifsc_PepeMoneyRain87:1039923196163526676>")
                                    .setImage(collectionBanner)
                                    .addFields(
                                        { name: 'Marketplace', value: Marketplace, inline: true },
                                        { name: 'Floor Price', value: "`" + newFp + ' ETH`', inline: true },
                                        { name: 'Alert :chart_with_upwards_trend:', value: "`" + elem.fp2 + ' ETH`', inline: true },
                                        { name: "Links", value: '[alphashark](https://magically.gg/collection/' + elem.collection + ") ∙ " + '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + elem.collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + elem.collection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ") ∙ " + '[website](' + collectionWebsite + ")", inline: false }

                                    ).setTimestamp()
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                alertsUp.update({ fp2: null }, { where: { alertupId: elem.alertupId } });
                                await channel.send({
                                    content: "<@" + elem.authorId + ">",
                                    embeds: [getfp2EmbedUp],
                                    //ephemeral : true
                                });
                            })

                            .catch(err => console.error(err));
                    }

                    if (!elem.fp && !elem.fp2) { alertsUp.destroy({ where: { alertupId: elem.alertupId } }); }

                })

                .catch(err => console.error(err));

        } catch (error) {


            //On envoi une notif
            const botAdmins = adminsql.findOne({ where: { botId: botId } })
            const mainServerId = botAdmins.dataValues.mainServerId
            const logChannelId = botAdmins.dataValues.logChannelId
            const guild = interaction.client.guilds.cache.get(mainServerId);
            const channel = guild.channels.cache.get(logChannelId);


            let reportCommand = "/interval-alerts"

            const timeStamp = Date.now();
            const date = new Date(timeStamp);
            const dateLisible = date.toLocaleString();
            const date1 = moment(dateLisible, 'M/D/YYYY, h:mm:ss A');
            const formattedDate = date1.format('Do [of] MMMM YYYY');



            //On enregistre le call
            reportsql.create({
                botId: botId,
                authorId: "Bot",
                serverName: "Back End System",
                authorRole: "Bot",
                serverId: "Back End System",
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
                .setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
                .setAuthor({ name: "Rolls Chasers Analytics", iconURL: "https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg" })
                .setTimestamp()
                .addFields(
                    { name: " ", value: " ", inline: false },
                    { name: "Content:", value: "A new `bug` has been submitted for the `" + reportCommand + "` command by `the bot report division` in `Back End System`. You can use the administrator dashboard to consult it.", inline: false },

                )
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

            channel.send({ embeds: [updateEmbed] });


        }
    });









    //for each element of alertdown
    notSentCollectionDown.forEach(elem => {


        try {
            sdk.getEventsCollectionsFlooraskV1({ collection: elem.collection, accept: '*/*' })
                .then(async ({ data }) => {
                    fp = data.events[0].floorAsk.price
                    Marketplace = data.events[0].floorAsk.source


                    if (Marketplace !== 'opensea.io' && Marketplace !== 'OpenSea' && Marketplace !== 'looksrare.org' && Marketplace !== 'LooksRare' && Marketplace !== 'magically.gg' && Marketplace !== 'rarible.com' && Marketplace !== 'Magically' && Marketplace !== 'x2y2.io' && Marketplace !== 'X2Y2') {
                        fp = data.events[1].floorAsk.price
                        Marketplace = data.events[1].floorAsk.source
                    }

                    //console.log(fp)
                    channel = client.channels.cache.get(elem.channelId)

                    //If the floor is lower and message is not sent

                    if (fp <= parseFloat(elem.fp)) {
                        sdk.getCollectionsV5({ id: elem.collection, accept: '*/*' })
                            .then(async ({ data }) => {

                                collectionBanner = data.collections[0].banner
                                collectionTwitter = data.collections[0].twitterUsername
                                collectionWebsite = data.collections[0].externalUrl
                                collectionSlug = data.collections[0].slug


                                newFp = data.collections[0].floorAsk.price.amount.decimal
                                fpMarketplace = data.collections[0].floorAsk.sourceDomain

                                fpMarketplace = data.collections[0].floorAsk.sourceDomain
                                if (fpMarketplace === 'opensea.io' || fpMarketplace === 'OpenSea') {
                                    Marketplace = '<:opensea:1062318570761101352> [OpenSea](https://opensea.io/collection/' + data.collections[0].slug + ')'
                                }
                                if (fpMarketplace === 'looksrare.org' || fpMarketplace === 'LooksRare') {
                                    Marketplace = '<:looksrare:1062318572786941983> [LooksRare](https://looksrare.org/collections/' + elem.collection + ')'
                                }
                                if (fpMarketplace === 'magically.gg' || fpMarketplace === 'rarible.com' || fpMarketplace === 'sudoswap' || fpMarketplace === 'Magically' || fpMarketplace === 'alienswap.xyz') {
                                    Marketplace = '<:ASxRCPNG:1070385409080696902> [Magically](https://magically.gg/collection/' + elem.collection + ')'
                                }

                                if (fpMarketplace === 'x2y2.io' || fpMarketplace === 'X2Y2') {
                                    Marketplace = '<:x2y2:1062318571654496317> [ X2Y2](https://x2y2.io/collection/' + elem.collection + ')'
                                }
                                if (fpMarketplace === 'blur.io') {
                                    Marketplace = '<:blur:1062318577782378516> [Blur](https://blur.io/collection/' + elem.collection + ')'
                                }

                                getfpEmbedDown.setTitle(`${elem.collectionName}`)
                                    .setAuthor({ name: "RC-Bot", iconURL: 'https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg', url: 'https://twitter.com/jayzhvj_eth' })
                                    .setURL('https://magically.gg/collection/' + elem.collection)
                                    .setDescription("The downward alert for **" + elem.collectionName + "** has been triggered <a:ol_gifsc_PepeMoneyRain87:1039923196163526676>")
                                    .setImage(collectionBanner)
                                    .addFields(
                                        { name: 'Marketplace', value: Marketplace, inline: true },
                                        { name: 'Floor Price', value: "`" + newFp + ' ETH`', inline: true },
                                        { name: 'Alert :chart_with_downwards_trend:', value: "`" + elem.fp + ' ETH`', inline: true },
                                        { name: "Links", value: '[alphashark](https://magically.gg/collection/' + elem.collection + ") ∙ " + '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + elem.collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + elem.collection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ") ∙ " + '[website](' + collectionWebsite + ")", inline: false }

                                    ).setTimestamp()
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })
                                alertsDown.update({ fp: null }, { where: { alertdownId: elem.alertdownId } });
                                await channel.send({
                                    content: "<@" + elem.authorId + ">",
                                    embeds: [getfpEmbedDown],
                                    // ephemeral: true
                                });
                            }).catch(err => console.error(err));
                    }

                    if (fp <= parseFloat(elem.fp2)) {

                        sdk.getCollectionsV5({ id: elem.collection, accept: '*/*' })
                            .then(async ({ data }) => {

                                collectionBanner = data.collections[0].banner
                                collectionTwitter = data.collections[0].twitterUsername
                                collectionWebsite = data.collections[0].externalUrl
                                collectionSlug = data.collections[0].slug


                                newFp = data.collections[0].floorAsk.price.amount.decimal
                                fpMarketplace = data.collections[0].floorAsk.sourceDomain
                                if (fpMarketplace === 'opensea.io' || fpMarketplace === 'OpenSea') {
                                    Marketplace = '[<:opensea:1062318570761101352> OpenSea](https://opensea.io/collection/' + data.collections[0].slug + ')'
                                }
                                if (fpMarketplace === 'looksrare.org' || fpMarketplace === 'LooksRare') {
                                    Marketplace = '[<:looksrare:1062318572786941983> LooksRare](https://looksrare.org/collections/' + elem.collection + ')'
                                }
                                if (fpMarketplace === 'magically.gg' || fpMarketplace === 'rarible.com' || fpMarketplace === 'sudoswap' || fpMarketplace === 'Magically' || fpMarketplace === 'alienswap.xyz') {
                                    Marketplace = '[<:ASxRCPNG:1070385409080696902> Magically](https://magically.gg/collection/' + elem.collection + ')'
                                }

                                if (fpMarketplace === 'x2y2.io' || fpMarketplace === 'X2Y2') {
                                    Marketplace = '[<:x2y2:1062318571654496317> X2Y2](https://x2y2.io/collection/' + elem.collection + ')'
                                }
                                if (fpMarketplace === 'blur.io') {
                                    Marketplace = '[<:blur:1062318577782378516> Blur](https://blur.io/collection/' + elem.collection + ')'
                                }

                                getfp2EmbedDown.setTitle(`${elem.collectionName}`)
                                    .setAuthor({ name: "RC-Bot", iconURL: 'https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg', url: 'https://twitter.com/jayzhvj_eth' })
                                    .setURL('https://magically.gg/collection/' + elem.collection)
                                    .setDescription("The alert downward alert for **" + elem.collectionName + "** has been triggered <a:ol_gifsc_PepeMoneyRain87:1039923196163526676>")
                                    .setImage(collectionBanner)
                                    .addFields(
                                        { name: 'Marketplace', value: Marketplace, inline: true },
                                        { name: 'Floor Price', value: "`" + newFp + ' ETH`', inline: true },
                                        { name: 'Alert :chart_with_downwards_trend:', value: "`" + elem.fp2 + ' ETH`', inline: true },
                                        { name: "Links", value: '[alphashark](https://magically.gg/collection/' + elem.collection + ") ∙ " + '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + elem.collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + elem.collection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ") ∙ " + '[website](' + collectionWebsite + ")", inline: false }

                                    ).setTimestamp()
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                alertsDown.update({ fp2: null }, { where: { alertdownId: elem.alertdownId } });
                                //await channel.send("<@" + elem.authorId + ">");
                                await channel.send({
                                    content: "<@" + elem.authorId + ">",
                                    embeds: [getfp2EmbedDown],
                                    // ephemeral: true
                                });
                            }).catch(err => console.error(err));

                    }

                    if (!elem.fp && !elem.fp2) { alertsDown.destroy({ where: { alertdownId: elem.alertdownId } }); }

                })

                .catch(err => console.error(err));


        } catch (error) {


            //On envoi une notif
            const botAdmins = adminsql.findOne({ where: { botId: botId } })
            const mainServerId = botAdmins.dataValues.mainServerId
            const logChannelId = botAdmins.dataValues.logChannelId
            const guild = interaction.client.guilds.cache.get(mainServerId);
            const channel = guild.channels.cache.get(logChannelId);


            const adminAccessInfos = accessSql.findOne({ where: { serverId: serverId } })
            let adminRoleId = adminAccessInfos.dataValues.adminRoleId
            let serverName = adminAccessInfos.dataValues.serverName
            const userRoleList = interaction.member._roles
            let userHighestRole = "Member"
            if (userRoleList.includes(adminRoleId)) { userHighestRole = "Team" }
            let reportCommand = "/interval-alerts"

            const timeStamp = Date.now();
            const date = new Date(timeStamp);
            const dateLisible = date.toLocaleString();
            const date1 = moment(dateLisible, 'M/D/YYYY, h:mm:ss A');
            const formattedDate = date1.format('Do [of] MMMM YYYY');



            //On enregistre le call
            reportsql.create({
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
                .setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
                .setAuthor({ name: "Rolls Chasers Analytics", iconURL: "https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg" })
                .setTimestamp()
                .addFields(
                    { name: " ", value: " ", inline: false },
                    { name: "Content:", value: "A new `bug` has been submitted for the `" + reportCommand + "` command by `the bot report division` in `" + serverName + "`. You can use the administrator dashboard to consult it.", inline: false },

                )
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


            channel.send({ embeds: [updateEmbed] });




        }
    });




}

module.exports = intervalalerts