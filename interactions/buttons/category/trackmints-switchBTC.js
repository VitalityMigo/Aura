
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
const { accessSql, profileData, interactionData, wallets, adminsql, reportsql, sequelize } = require('../../../events/database');
const moment = require('moment');

const getTimeAgo = require("../../../functions/timeago")


//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const magicedenApiKey = process.env.magicedenApiKey



// Configuration de l'en-tête d'autorisation
const headers = {
    'Authorization': `Bearer ${magicedenApiKey}`
};


const axios = require('axios')




function formatString(inputString) {
    if (inputString.length <= 17) {
        return inputString;
    } else {
        return inputString.slice(0, 20) + '...';
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
    id: 'trackmintsswitchBTC-button',

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

            let walletCategory = lastInteractionData.dataValues.walletCategory



            if (walletCategory.toLowerCase() === "eth") {


                console.log("ici")


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
                        new ButtonBuilder()
                            .setCustomId('trackmintsswitchBTC-button')
                            .setEmoji("<:RCETH:1123226220075700244>")
                            .setStyle(3),

                    )

                //On construit les bouttons
                const buttonEthNo = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('trackmintETHbydate-button')
                            .setLabel('sort by date')
                            .setStyle(2)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('trackmintETHbyprice-button')
                            .setLabel('sort by price')
                            .setStyle(2)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('trackmintETHbygas-button')
                            .setLabel('sort by gas')
                            .setStyle(2)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('trackmintETHbyabc-button')
                            .setLabel('sort by abc')
                            .setStyle(2)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('trackmintsswitchBTC-button')
                            .setEmoji("<:RCETH:1123226220075700244>")
                            .setStyle(3),

                    )



                if (lastInteractionData.dataValues.embed2 === "N/A") {


                    await interaction.deferUpdate()


                    const walletAddressName = await wallets.findAll({ where: { authorId: authorId, walletCategory: "btc" } });

                    if (walletAddressName.length > 0) {


                        const walletAddresses = walletAddressName.map((wallet) => wallet.dataValues.walletAddress.toLowerCase());
                        const walletFormatted = "`" + walletAddresses.length + " addresses`"




                        const btcCallPrice = await axios.get("https://blockchain.info/q/24hrprice")
                        let BTCUsdPrice = await btcCallPrice.data

                        let tokenTable = []


                        for (const wallet of walletAddresses) {

                            const createCall = `https://api-mainnet.magiceden.dev/v2/ord/btc/activities?ownerAddress=` + wallet + "&kind=create";
                            const createCallFormatted = await axios.get(createCall, { headers });
                            const createData = await createCallFormatted.data.activities;

                            const mintCall = `https://api-mainnet.magiceden.dev/v2/ord/btc/activities?ownerAddress=` + wallet + "&kind=mint_broadcasted";
                            const mintCallFormatted = await axios.get(mintCall, { headers });
                            const mintData = await mintCallFormatted.data.activities;




                            for (const create of createData) {

                                if (create.collectionSymbol) {

                                    const mempoolCall = await axios.get("https://mempool.space/api/tx/" + create.txId)

                                    let obj = {}
                                    obj.hash = create.txId
                                    obj.name = create.collection.name
                                    obj.price = parseFloat((create.txValue) / (10 ** 8)).toFixed(3)
                                    obj.timestamp = mempoolCall.data.status.block_time
                                    obj.fees = mempoolCall.data.fee
                                    obj.id = create.token.inscriptionNumber
                                    obj.collectionSymbol = create.collectionSymbol
                                    obj.btc = BTCUsdPrice
                                    obj.walletFormatted = walletFormatted

                                    tokenTable.push(obj)
                                }

                            }

                            for (const mint of mintData) {

                                if (mint.collectionSymbol) {

                                    const mempoolCall = await axios.get("https://mempool.space/api/tx/" + mint.txId)

                                    let obj = {}
                                    obj.hash = mint.txId
                                    obj.name = mint.collection.name
                                    obj.price = (mint.listedPrice) / (10 ** 8)
                                    obj.timestamp = mempoolCall.data.status.block_time
                                    obj.fees = mempoolCall.data.fee
                                    obj.id = mint.token.inscriptionNumber
                                    obj.collectionSymbol = mint.collectionSymbol
                                    obj.btc = BTCUsdPrice
                                    obj.walletFormatted = walletFormatted

                                    tokenTable.push(obj)
                                }

                            }
                        }





                        tokenTable.sort((a, b) => b.timestamp - a.timestamp);


                        let mintsOverview = ""
                        let totalMintCost = 0
                        let collectionTable = []
                        let index = 0



                        for (const mint of tokenTable) {

                            index++

                            if (index <= 13) {

                                let timestamp = mint.timestamp
                                let tokenId = mint.id
                                let collection = mint.name
                                let price = parseFloat(mint.price).toFixed(3)
                                let gasUsed = mint.fees
                                let collectionSymbol = mint.collectionSymbol



                                let lignMaxSize = 70
                                let leftPartNfts = "`" + formatString(collection) + " (#" + tokenId + ")"
                                let rightPartNfts = parseFloat(price).toFixed(3) + "₿ • " + parseFloat(gasUsed).toFixed(0) + " sats • " + getTimeAgo(timestamp) + "`\n"
                                let leftPartNFTsLenght = leftPartNfts.length
                                let rightPartNftsLenght = rightPartNfts.length
                                let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                                let spaceLenght = ""
                                for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }



                                mintsOverview += leftPartNfts + spaceLenght + rightPartNfts

                                totalMintCost += parseFloat(price)

                                if (!collectionTable.includes(collectionSymbol)) { collectionTable.push(collectionSymbol) }

                            }
                        }


                        let avgMintCost = totalMintCost / index
                        let collectionCount = collectionTable.length

                        let isNoMint = false
                        if (mintsOverview == "") {
                            mintsOverview = "```No recent mint founds                                    ```"

                            isNoMint = true
                            avgMintCost = "0"

                        }


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


                        if (isNoMint == false) { await interaction.editReply({ embeds: [gasTrackerEmbed], components: [buttonEth] }) }
                        else { await interaction.editReply({ embeds: [gasTrackerEmbed], components: [buttonEthNo] }) }


                        await interactionData.update({ walletCategory: "btc", embed2: JSON.stringify(tokenTable), }, { where: { authorId: authorId, commandName: "trackmints", serverId: serverId } })



                    } else {

                        //On construit les bouttons
                        const buttonEth = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('trackmintETHbydate-button')
                                    .setLabel('sort by date')
                                    .setStyle(2)
                                    .setDisabled(true),
                                new ButtonBuilder()
                                    .setCustomId('trackmintETHbyprice-button')
                                    .setLabel('sort by price')
                                    .setStyle(2)
                                    .setDisabled(true),
                                new ButtonBuilder()
                                    .setCustomId('trackmintETHbygas-button')
                                    .setLabel('sort by gas')
                                    .setStyle(2)
                                    .setDisabled(true),
                                new ButtonBuilder()
                                    .setCustomId('trackmintETHbyabc-button')
                                    .setLabel('sort by abc')
                                    .setStyle(2)
                                    .setDisabled(true),
                                new ButtonBuilder()
                                    .setCustomId('trackmintsswitchBTC-button')
                                    // .setLabel('BTC')
                                    .setEmoji("<:RCETH:1123226220075700244>")
                                    .setStyle(3),

                            )


                        let mintsOverview = "```No Bitcoin wallet registered                                  ```"


                        const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Mint Tracker")
                            .setDescription(">>> Display your last mints on your wallet(s).")
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .addFields(
                                { name: "Wallet", value: "`0 address`", inline: false },
                                { name: "Collection Count", value: "`0 collection(s)`", inline: true },
                                { name: "Total Mint Spent", value: "`0.000Ξ (0.000$)`", inline: true },
                                { name: "Avg. Mint Spent", value: "`0.000Ξ (0.000$)`", inline: true },
                                { name: "Mints:", value: mintsOverview, inline: false },

                            )
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [gasTrackerEmbed], components: [buttonEth] });



                        await interactionData.update({ walletCategory: "btc" }, { where: { authorId: authorId, commandName: "trackmints", serverId: serverId } })



                    }

                } else {



                    let tokenTable = JSON.parse(lastInteractionData.dataValues.embed2)


                    if (tokenTable != "N/A" && lastInteractionData.dataValues.embed2 != "[]") {

                        let walletFormatted = tokenTable[0].walletFormatted

                        tokenTable.sort((a, b) => b.timestamp - a.timestamp);


                        let mintsOverview = ""
                        let totalMintCost = 0
                        let collectionTable = []
                        let index = tokenTable.length
                        let BTCUsdPrice = tokenTable[0].btc



                        for (const mint of tokenTable) {



                            let timestamp = mint.timestamp
                            let tokenId = mint.id
                            let collection = mint.name
                            let price = parseFloat(mint.price).toFixed(3)
                            let gasUsed = mint.fees
                            let collectionSymbol = mint.collectionSymbol



                            let lignMaxSize = 70
                            let leftPartNfts = "`" + formatString(collection) + " (#" + tokenId + ")"
                            let rightPartNfts = parseFloat(price).toFixed(3) + "₿ • " + parseFloat(gasUsed).toFixed(0) + " sats • " + getTimeAgo(timestamp) + "`\n"
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

                        let isNoMint = false
                        if (mintsOverview == "") {
                            mintsOverview = "```No recent mint founds                                    ```"

                            isNoMint = true
                            avgMintCost = "0"

                        }



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

                        if (isNoMint == false) { await interaction.update({ embeds: [gasTrackerEmbed], components: [buttonEth] }) }
                        else { await interaction.update({ embeds: [gasTrackerEmbed], components: [buttonEthNo] }) }



                        await interactionData.update({ walletCategory: "btc", }, { where: { authorId: authorId, commandName: "trackmints", serverId: serverId } })


                    } else {

                        let mintsOverview = "```No recent mint founds                                    ```"

                        const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Mint Tracker")
                            .setDescription(">>> Display your last mints on your wallet(s).")
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .addFields(
                                { name: "Wallet", value: "`0 address`", inline: false },
                                { name: "Collection Count", value: "`0 collection(s)`", inline: true },
                                { name: "Total Mint Spent", value: "`0.000₿ (0$)`", inline: true },
                                { name: "Avg. Mint Spent", value: "`0.000₿ (0$)`", inline: true },
                                { name: "Mints:", value: mintsOverview, inline: false },

                            )
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.update({ embeds: [gasTrackerEmbed], components: [buttonEthNo] });

                        await interactionData.update({ walletCategory: "btc" }, { where: { authorId: authorId, commandName: "trackmints", serverId: serverId } })




                    }
                }







            } else if (walletCategory.toLowerCase() === "btc") {
                console.log("ici")

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

                //On construit les bouttons
                const buttonEthNo = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('trackmintETHbydate-button')
                            .setLabel('sort by date')
                            .setStyle(2)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('trackmintETHbyprice-button')
                            .setLabel('sort by price')
                            .setStyle(2)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('trackmintETHbygas-button')
                            .setLabel('sort by gas')
                            .setStyle(2)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('trackmintETHbyabc-button')
                            .setLabel('sort by abc')
                            .setStyle(2)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('trackmintsswitchBTC-button')
                            .setEmoji("<:RCBTC:1123219824282189834>")
                            .setStyle(3),

                    )




                if (lastInteractionData.dataValues.embed1 !== "N/A" && lastInteractionData.dataValues.embed1 != "[]") {

                    let tokenTable = JSON.parse(lastInteractionData.dataValues.embed1)
                    console.log(lastInteractionData.dataValues.embed1)
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


                        totalMintCost += price
                        if (!collectionTable.includes(collectionAddress)) { collectionTable.push(collectionAddress) }







                    }
                    console.log(collectionTable)

                    let avgMintCost = totalMintCost / index
                    let collectionCount = collectionTable.length


                    let isNoMint = false
                    if (mintsOverview == "") {
                        mintsOverview = "```No recent mint founds                                    ```"

                        isNoMint = true
                        avgMintCost = "0"

                    }

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



                    if (isNoMint == false) { await interaction.update({ embeds: [gasTrackerEmbed], components: [buttonBtc] }) }
                    else { await interaction.update({ embeds: [gasTrackerEmbed], components: [buttonEthNo] }) }



                    await interactionData.update({ walletCategory: "eth", }, { where: { authorId: authorId, commandName: "trackmints", serverId: serverId } })





                } else {


                    //On construit les bouttons
                    const buttonEth = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('trackmintETHbydate-button')
                                .setLabel('sort by date')
                                .setStyle(2)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('trackmintETHbyprice-button')
                                .setLabel('sort by price')
                                .setStyle(2)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('trackmintETHbygas-button')
                                .setLabel('sort by gas')
                                .setStyle(2)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('trackmintETHbyabc-button')
                                .setLabel('sort by abc')
                                .setStyle(2)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('trackmintsswitchBTC-button')
                                .setEmoji("<:RCBTC:1123219824282189834>")
                                .setStyle(3),

                        )


                        let mintsOverview = "```No Ethereum wallet registered                                      ```"
                        if (lastInteractionData.dataValues.embed1 == "[]") { mintsOverview = "```No recent mint found                                      ```" }

                    

                    const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Mint Tracker")
                        .setDescription(">>> Display your last mints on your wallet(s).")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .addFields(
                            { name: "Wallet", value: "`0 address`", inline: false },
                            { name: "Collection Count", value: "`0 collection(s)`", inline: true },
                            { name: "Total Mint Spent", value: "`0.000Ξ (0$)`", inline: true },
                            { name: "Avg. Mint Spent", value: "`0.000Ξ (0$)`", inline: true },
                            { name: "Mints:", value: mintsOverview, inline: false },

                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.update({ embeds: [gasTrackerEmbed], components: [buttonEth] });

                    await interactionData.update({ walletCategory: "eth" }, { where: { authorId: authorId, commandName: "trackmints", serverId: serverId } })


                }
            }
        } else {

            const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                .setTitle("Bot Access")
                .setAuthor({ name: authorName, iconURL: userAvatar })
                .setDescription("This button is not made for you. You can only click on buttons that have been generated by your commands. Please try again with your personal data.")
                .setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
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
            let reportCommand = "/trackmints-switchBTC"

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
                .setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
                .setAuthor({ name: "Rolls Chasers Analytics", iconURL: "https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg" })
                .setTimestamp()
                .addFields(
                    { name: " ", value: " ", inline: false },
                    { name: "Content:", value: "A new `bug` has been submitted for the `" + reportCommand + "` command by `the bot report division` in `" + serverName + "`. You can use the administrator dashboard to consult it.", inline: false },

                )
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


            await channel.send({ embeds: [updateEmbed] });



            const errorAnswerUser = new EmbedBuilder().setColor("#060A8F")
                .setTitle("An error occured")
                .setDescription("An error has occurred while executing this command. These errors can occur for a variety of reasons, such as :\n∙ Unexpected traffic\n∙ API maintenance\n∙ Occasional bug\n\nPlease note that a report has already been sent to our team, who will fix the problem as soon as possible. You can still use `/report` to give more details about the error and help our team.")
                .setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
                .setTimestamp()
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


            await interaction.reply({ embeds: [errorAnswerUser], ephemeral: true });


        }

    },
};




