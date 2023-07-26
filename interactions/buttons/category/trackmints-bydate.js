
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
const { accessSql, profileData, interactionData, adminsql, reportsql, sequelize } = require('../../../events/database');
const moment = require('moment');

const getTimeAgo = require("../../../functions/timeago")


function formatTokenId(inputString) {
    if (inputString.length <= 5) {
        return inputString;
    } else {
        return inputString.slice(0, 5) + '.';
    }
}

function formatString(inputString) {
    if (inputString.length <= 17) {
        return inputString;
    } else {
        return inputString.slice(0, 20) + '...';
    }
}



module.exports = {
    id: 'trackmintETHbydate-button',

    async execute(interaction) {
        if (!(interaction instanceof ButtonInteraction)) return;

        //Récupérer informations de l'utilisateur de la commande
        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id


         try {

        //Checkpoint
        console.log("// Step 1 : Initialization - Executed ✅")



        if (interaction.message.interaction.user.id === authorId) {

            //Checkpoint
            console.log("// Step 2 : Authorization - Executed ✅")


            const lastInteractionData = await interactionData.findOne({ where: { authorId: authorId, commandName: "trackmints", serverId: serverId } })

            let walletAddress = lastInteractionData.dataValues.walletAddress
            let walletCategory = lastInteractionData.dataValues.walletCategory



            if (walletAddress.toLowerCase() !== "all") {


                let tokenTable = JSON.parse(lastInteractionData.dataValues.embed1)
                let walletFormatted = tokenTable[0].walletFormatted






                if (walletCategory.toLowerCase() === "eth") {


                    //On construit les bouttons
                    const buttonEth = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('trackmintETHbydate-button')
                                .setLabel('sort by date')
                                .setStyle(1),
                            new ButtonBuilder()
                                .setCustomId('trackmintETHbyprice-button')
                                .setLabel('sort by price')
                                .setStyle(2),
                            new ButtonBuilder()
                                .setCustomId('trackmintETHbygas-button')
                                .setLabel('sort by gas')
                                .setStyle(2),
                            new ButtonBuilder()
                                .setCustomId('trackmintETHbyabc-button')
                                .setLabel('sort by abc')
                                .setStyle(2),
                        
                        )

                    tokenTable.sort((a, b) => b.timestamp - a.timestamp);


                    let mintsOverview = ""
                    let totalMintCost = 0
                    let collectionTable = []
                    let index = tokenTable.length
                    let ethusdtPrice = tokenTable[0].eth

                    console.log(tokenTable)

                    for (const mint of tokenTable) {


                        let price = mint.price
                        let timestamp = mint.timestamp
                        let tokenId = mint.tokenId
                        let collection = mint.collection
                        let collectionAddress = mint.collectionAddress
                        let gasUsed = mint.gasUsed
                        let txnHash = mint.txnHash



                        let lignMaxSize = 70
                        let leftPartNfts = "`" + formatString(collection) + " (#" + tokenId + ")"
                        let rightPartNfts = parseFloat(price).toFixed(3) + "Ξ • " + parseFloat(gasUsed).toFixed(0) + " gwei • " + getTimeAgo(timestamp) + "`\n"
                        let leftPartNFTsLenght = leftPartNfts.length
                        let rightPartNftsLenght = rightPartNfts.length
                        let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                        let spaceLenght = ""
                        for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }


                        mintsOverview += leftPartNfts + spaceLenght + rightPartNfts


                        totalMintCost += parseFloat(price)
                        if (!collectionTable.includes(collectionAddress)) { collectionTable.push(collectionAddress) }







                    }
                    console.log(collectionTable)

                    let avgMintCost = totalMintCost / index
                    let collectionCount = collectionTable.length

                    if (mintsOverview == "") { mintsOverview = "```No recent mint founds                                    ```" }


                    const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Mint Tracker")
                        .setDescription(">>> Display your last mints on your wallet(s).")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .addFields(
                            { name: "Wallet", value: walletFormatted, inline: false },
                            { name: "Collection Count", value: "`" + collectionCount + " collection(s)`", inline: true },
                            { name: "Total Mint Spent", value: "`" + parseFloat(totalMintCost).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(totalMintCost * ethusdtPrice).toFixed(0)) + "$)`", inline: true },
                            { name: "Avg. Mint Spent", value: "`" + parseFloat(avgMintCost).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(avgMintCost * ethusdtPrice).toFixed(0)) + "$)`", inline: true },
                            { name: "Mints:", value: mintsOverview, inline: false },

                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.update({ embeds: [gasTrackerEmbed], components: [buttonEth] });


                } else if (walletCategory.toLowerCase() === "btc") {


                    //On construit les bouttons
                    const buttonBtc = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('trackmintETHbydate-button')
                                .setLabel('sort by date')
                                .setStyle(1),
                            new ButtonBuilder()
                                .setCustomId('trackmintETHbyprice-button')
                                .setLabel('sort by price')
                                .setStyle(2),
                            new ButtonBuilder()
                                .setCustomId('trackmintETHbygas-button')
                                .setLabel('sort by gas')
                                .setStyle(2),
                            new ButtonBuilder()
                                .setCustomId('trackmintETHbyabc-button')
                                .setLabel('sort by abc')
                                .setStyle(2),
                            


                        )



                    tokenTable.sort((a, b) => b.timestamp - a.timestamp);



                    let mintsOverview = ""
                    let totalMintCost = 0
                    let collectionTable = []
                    let index = tokenTable.length
                    let BTCUsdPrice = tokenTable[0].btc

                    console.log(tokenTable)

                    for (const mint of tokenTable) {


                        let price = mint.price
                        let timestamp = mint.timestamp
                        let tokenId = mint.id
                        let collection = mint.name
                        let gasUsed = mint.fees
                        let txnHash = mint.txnHash
                        let collectionSymbol = mint.collectionSymbol


                        let lignMaxSize = 70
                        let leftPartNfts = "`" + formatString(collection) + " (#" + tokenId + ")"
                        let rightPartNfts = parseFloat(price).toFixed(3) + "₿ • " + parseFloat(gasUsed).toFixed(0) + " gwei • " + getTimeAgo(timestamp) + "`\n"
                        let leftPartNFTsLenght = leftPartNfts.length
                        let rightPartNftsLenght = rightPartNfts.length
                        let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                        let spaceLenght = ""
                        for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }


                        mintsOverview += leftPartNfts + spaceLenght + rightPartNfts


                        totalMintCost += parseFloat(price)
                        if (!collectionTable.includes(collectionSymbol)) { collectionTable.push(collectionSymbol) }







                    }

                    let avgMintCost = totalMintCost / index
                    let collectionCount = collectionTable.length

                    if (mintsOverview == "") { mintsOverview = "```No recent mint founds                                    ```" }


                    const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Mint Tracker")
                        .setDescription(">>> Display your last mints on your wallet(s).")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .addFields(
                            { name: "Wallet", value: walletFormatted, inline: false },
                            { name: "Collection Count", value: "`" + collectionCount + " collection(s)`", inline: true },
                            { name: "Total Mint Spent", value: "`" + parseFloat(totalMintCost).toFixed(3) + "₿ (" + new Intl.NumberFormat('en-US').format(parseFloat(totalMintCost * BTCUsdPrice).toFixed(0)) + "$)`", inline: true },
                            { name: "Avg. Mint Spent", value: "`" + parseFloat(avgMintCost).toFixed(3) + "₿ (" + new Intl.NumberFormat('en-US').format(parseFloat(avgMintCost * BTCUsdPrice).toFixed(0)) + "$)`", inline: true },
                            { name: "Mints:", value: mintsOverview, inline: false },

                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.update({ embeds: [gasTrackerEmbed], components: [buttonBtc] });








                }

            } else if (walletAddress.toLowerCase() == "all") {




                if (walletCategory.toLowerCase() === "eth") {


                    //On construit les bouttons
                    const buttonBtc = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('trackmintETHbydate-button')
                                .setLabel('sort by date')
                                .setStyle(1),
                            new ButtonBuilder()
                                .setCustomId('trackmintETHbyprice-button')
                                .setLabel('sort by price')
                                .setStyle(2),
                            new ButtonBuilder()
                                .setCustomId('trackmintETHbygas-button')
                                .setLabel('sort by gas')
                                .setStyle(2),
                            new ButtonBuilder()
                                .setCustomId('trackmintETHbyabc-button')
                                .setLabel('sort by abc')
                                .setStyle(2),
                            new ButtonBuilder()
                                .setCustomId('trackmintsswitchBTC-button')
                                .setEmoji("<:RCBTC:1123219824282189834>")
                                .setStyle(3),


                        )

                    let tokenTable = JSON.parse(lastInteractionData.dataValues.embed1)
                    let ethusdtPrice = tokenTable[0].eth
                    let walletFormatted = tokenTable[0].walletFormatted

                    tokenTable.sort((a, b) => b.timestamp - a.timestamp);



                    let mintsOverview = ""
                    let totalMintCost = 0
                    let collectionTable = []
                    let index = tokenTable.length

                    console.log(tokenTable)

                    for (const mint of tokenTable) {


                        let price = mint.price
                        let timestamp = mint.timestamp
                        let tokenId = mint.tokenId
                        let collection = mint.collection
                        let collectionAddress = mint.collectionAddress
                        let gasUsed = mint.gasUsed
                        let txnHash = mint.txnHash



                        let lignMaxSize = 70
                        let leftPartNfts = "`" + formatString(collection) + " (#" + tokenId + ")"
                        let rightPartNfts = parseFloat(price).toFixed(3) + "Ξ • " + parseFloat(gasUsed).toFixed(0) + " gwei • " + getTimeAgo(timestamp) + "`\n"
                        let leftPartNFTsLenght = leftPartNfts.length
                        let rightPartNftsLenght = rightPartNfts.length
                        let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                        let spaceLenght = ""
                        for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }


                        mintsOverview += leftPartNfts + spaceLenght + rightPartNfts


                        totalMintCost += parseFloat(price)
                        if (!collectionTable.includes(collectionAddress)) { collectionTable.push(collectionAddress) }







                    }
                    console.log(collectionTable)

                    let avgMintCost = totalMintCost / index
                    let collectionCount = collectionTable.length

                    if (mintsOverview == "") { mintsOverview = "```No recent mint founds                                    ```" }


                    const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Mint Tracker")
                        .setDescription(">>> Display your last mints on your wallet(s).")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .addFields(
                            { name: "Wallet", value: walletFormatted, inline: false },
                            { name: "Collection Count", value: "`" + collectionCount + " collection(s)`", inline: true },
                            { name: "Total Mint Spent", value: "`" + parseFloat(totalMintCost).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(totalMintCost * ethusdtPrice).toFixed(0)) + "$)`", inline: true },
                            { name: "Avg. Mint Spent", value: "`" + parseFloat(avgMintCost).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(avgMintCost * ethusdtPrice).toFixed(0)) + "$)`", inline: true },
                            { name: "Mints:", value: mintsOverview, inline: false },

                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.update({ embeds: [gasTrackerEmbed], components: [buttonBtc] });






                } else if (walletCategory.toLowerCase() === "btc") {


                    //On construit les bouttons
                    const buttonBtc = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('trackmintETHbydate-button')
                                .setLabel('sort by date')
                                .setStyle(1),
                            new ButtonBuilder()
                                .setCustomId('trackmintETHbyprice-button')
                                .setLabel('sort by price')
                                .setStyle(2),
                            new ButtonBuilder()
                                .setCustomId('trackmintETHbygas-button')
                                .setLabel('sort by gas')
                                .setStyle(2),
                            new ButtonBuilder()
                                .setCustomId('trackmintETHbyabc-button')
                                .setLabel('sort by abc')
                                .setStyle(2),
                            new ButtonBuilder()
                                .setCustomId('trackmintsswitchBTC-button')
                                .setEmoji("<:RCETH:1123226220075700244>")
                                .setStyle(3),


                        )

                    let tokenTable = JSON.parse(lastInteractionData.dataValues.embed2)
                    let BTCUsdPrice = tokenTable[0].btc
                    let walletFormatted = tokenTable[0].walletFormatted


                    tokenTable.sort((a, b) => b.timestamp - a.timestamp);


                    let mintsOverview = ""
                    let totalMintCost = 0
                    let collectionTable = []
                    let index = tokenTable.length

                    console.log(tokenTable)

                    for (const mint of tokenTable) {

                        console.log(mint)

                        let price = mint.price
                        let timestamp = mint.timestamp
                        let tokenId = mint.id
                        let collection = mint.name
                        let gasUsed = mint.fees
                        let txnHash = mint.txnHash
                        let collectionSymbol = mint.collectionSymbol


                        let lignMaxSize = 70
                        let leftPartNfts = "`" + formatString(collection) + " (#" + tokenId + ")"
                        let rightPartNfts = parseFloat(price).toFixed(3) + "₿ • " + parseFloat(gasUsed).toFixed(0) + " gwei • " + getTimeAgo(timestamp) + "`\n"
                        let leftPartNFTsLenght = leftPartNfts.length
                        let rightPartNftsLenght = rightPartNfts.length
                        let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                        let spaceLenght = ""
                        for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }


                        mintsOverview += leftPartNfts + spaceLenght + rightPartNfts


                        totalMintCost += parseFloat(price)
                        if (!collectionTable.includes(collectionSymbol)) { collectionTable.push(collectionSymbol) }


                    }

                    let avgMintCost = totalMintCost / index
                    let collectionCount = collectionTable.length

                    if (mintsOverview == "") { mintsOverview = "```No recent mint founds                                    ```" }


                    const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Mint Tracker")
                        .setDescription(">>> Display your last mints on your wallet(s).")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .addFields(
                            { name: "Wallet", value: walletFormatted, inline: false },
                            { name: "Collection Count", value: "`" + collectionCount + " collection(s)`", inline: true },
                            { name: "Total Mint Spent", value: "`" + parseFloat(totalMintCost).toFixed(3) + "₿ (" + new Intl.NumberFormat('en-US').format(parseFloat(totalMintCost * BTCUsdPrice).toFixed(0)) + "$)`", inline: true },
                            { name: "Avg. Mint Spent", value: "`" + parseFloat(avgMintCost).toFixed(3) + "₿ (" + new Intl.NumberFormat('en-US').format(parseFloat(avgMintCost * BTCUsdPrice).toFixed(0)) + "$)`", inline: true },
                            { name: "Mints:", value: mintsOverview, inline: false },

                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.update({ embeds: [gasTrackerEmbed], components: [buttonBtc] });








                }
            }




            } else {

                const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Bot Access")
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .setDescription("This button is not made for you. You can only click on buttons that have been generated by your commands. Please try again with your personal data.")
                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                await interaction.reply({ embeds: [setfpEmbedNotForYou], ephemeral: true });


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
                let reportCommand = "/trackmints-bydate"

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
                .setAuthor({ name: "Rolls Chasers Analytics", iconURL: "https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png" })
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




