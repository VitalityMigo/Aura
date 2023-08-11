
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
const { accessSql, profileData, interactionData, adminsql, wallets, reportsql, sequelize } = require('../../../events/database');
const moment = require('moment');
const reduceText = require("../../../functions/reducetext")

//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const magicedenApiKey = process.env.magicedenApiKey
const bestinslotApiKey = process.env.bestinslotApiKey


// Configuration de l'en-tête d'autorisation
const headers = {
    'Authorization': `Bearer ${magicedenApiKey}`
};


// Configuration de l'en-tête d'autorisation
const BISHeader = {
    'x-api-key': bestinslotApiKey
};



//https request
const axios = require('axios')

function isBRC20BitcoinWallet(wallet) {
    const regex = /^bc1[a-zA-Z0-9]{39,59}$/;

    return regex.test(wallet);
}



const chartVisual1 = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('chartgenerator-button')
            .setLabel('visual')
            .setStyle(2)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId('portfolioswitchETH-button')
            // .setLabel('BTC')
            .setEmoji("<:RCETH:1123226220075700244>")
            .setStyle(3),
    );



module.exports = {
    id: 'portfolioswitchBTC-button',


    async execute(interaction) {
        if (!(interaction instanceof ButtonInteraction)) return;

        //Récupérer informations de l'utilisateur de la commande
        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id



        // try {

        //Checkpoint
        console.log("// Step 1 : Initialization - Executed ✅")

        if (interaction.message.interaction.user.id === authorId) {


            //Checkpoint
            console.log("// Step 2 : Authorization - Executed ✅")



            const lastInteractionData = await interactionData.findOne({ where: { authorId: authorId, commandName: "portfolio", serverId: serverId } })
            const embedReady = lastInteractionData.dataValues.embed2

            if (embedReady == "N/A") {




                let allWalletAddressOfAuthorBTC = []
                const allWalletsOfAuthor = await wallets.findAll({ where: { authorId: authorId } });
                for (let i = 0; i < allWalletsOfAuthor.length; i++) {
                    if (isBRC20BitcoinWallet(allWalletsOfAuthor[i].dataValues.walletAddress)) {
                        allWalletAddressOfAuthorBTC.push(allWalletsOfAuthor[i].dataValues.walletAddress);
                    }

                }

                const walletCount = allWalletAddressOfAuthorBTC.length

                if (walletCount > 0) {



                    const btcCallPrice = await axios.get("https://blockchain.info/q/24hrprice")
                    let BTCUsdPrice = btcCallPrice.data


                    let walletBTCBalance = 0
                    let tickerTable = []
                    let collectionTable = []

                    for (const selectedWallet of allWalletAddressOfAuthorBTC) {


                        const balance = await axios.get("https://blockchain.info/q/addressbalance/" + selectedWallet + "?confirmations=3")
                        walletBTCBalance += (balance.data) / (10 ** 8)


                        const urlBRC20 = "https://api.bestinslot.xyz/v3/brc20/wallet_balances?address=" + selectedWallet;
                        const responseBRC20 = await axios.get(urlBRC20, { BISHeader });
                        const brc20Call = await responseBRC20.data;


                        for (const ticker of brc20Call.data.data) {

                            tickerTable.push(ticker)

                        }

                        const url5 = `https://api-mainnet.magiceden.dev/v2/ord/btc/tokens?ownerAddress=${selectedWallet}&showAll=true&sortBy=priceDesc`;
                        const response5 = await axios.get(url5, { headers });
                        const data5 = await response5.data;

                        // Filtrer les objets qui ne contiennent pas de valeur collectionSymbol
                        const filteredTokens = data5.tokens.filter(token => token.collectionSymbol);

                        for (const collection of filteredTokens) {

                            collectionTable.push(collection)

                        }
                    }





                    // Tri du tableau JSON en fonction de la valeur "floorAsk * tokenCount" de chaque objet "collection" en ordre décroissant
                    const sortedByToken = tickerTable.sort((a, b) => b.overall_balance - a.overall_balance);

                    // Sélection des 5 premiers tokens
                    const top5tokens = sortedByToken.slice(0, 13);

                    let BRC20Overview = ""

                    for (const coin of top5tokens) {
                        console.log(coin)
                        let name = (coin.ticker).charAt(0).toUpperCase() + (coin.ticker).slice(1);
                        let symbol = (coin.ticker).toUpperCase()
                        let balance = parseFloat(coin.overall_balance).toFixed(0)

                        let lignMaxSize = 42
                        let leftPartNfts = "`" + name + " (" + symbol + "):"
                        let rightPartNfts = new Intl.NumberFormat('en-US').format(parseFloat(balance).toFixed(0)) + ' owned`\n'
                        let leftPartNFTsLenght = leftPartNfts.length
                        let rightPartNftsLenght = rightPartNfts.length
                        let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                        let spaceLenght = ""
                        for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }


                        BRC20Overview += "`" + name + " (" + symbol + "):" + spaceLenght + new Intl.NumberFormat('en-US').format(parseFloat(balance).toFixed(0)) + ' owned`\n';

                    }




                    // Créer un tableau récapitulatif avec le nombre d'occurrences de chaque valeur collectionSymbol
                    const summary = collectionTable.reduce((acc, token) => {
                        const symbol = token.collectionSymbol;
                        if (acc[symbol]) {
                            acc[symbol]++;
                        } else {
                            acc[symbol] = 1;
                        }
                        return acc;
                    }, {});

                    console.log(summary)


                    let fullBRC721Summary = []
                    let NFTTotalValue = 0

                    for (const collectionSymbol in summary) {

                        let obj = {}

                        const url6 = `https://api-mainnet.magiceden.dev/v2/ord/btc/stat?collectionSymbol=${collectionSymbol}`;
                        const response6 = await axios.get(url6, { headers });
                        const data6 = await response6.data;

                        if (data6.floorPrice) {

                            obj.name = collectionSymbol
                            obj.floorPrice = (data6.floorPrice) / (10 ** 8)
                            obj.owned = summary[collectionSymbol]
                            obj.value = ((data6.floorPrice) / (10 ** 8)) * summary[collectionSymbol]

                            fullBRC721Summary.push(obj)
                            NFTTotalValue += (data6.floorPrice) / (10 ** 8)
                        }
                    }

                    console.log(fullBRC721Summary)

                    // Tri du tableau JSON en fonction de la valeur "floorAsk * tokenCount" de chaque objet "collection" en ordre décroissant
                    const sortedByValue = fullBRC721Summary.sort((a, b) => b.value - a.value);



                    // Sélection des 13 premiers objets triés du tableau JSON
                    const top13Collections = sortedByValue.slice(0, 13);




                    let nftsOverview = ""

                    for (const obj of top13Collections) {

                        const name = (obj.name).toLowerCase()
                        const tokenCount = obj.owned
                        let totalPriceUsd = 0
                        let floorAskPrice = 0
                        let totalPrice = 0
                        let totalPriceUs = 0

                        floorAskPrice = parseFloat(obj.floorPrice).toFixed(3)
                        totalPrice = parseFloat(obj.value).toFixed(3)
                        totalPriceUs = (totalPrice * BTCUsdPrice).toFixed(0)
                        totalPriceUsd = new Intl.NumberFormat('en-US').format(totalPriceUs)



                        let lignMaxSize = 70
                        let leftPartNfts = "`" + reduceText(name, 30) + " ∙ " + tokenCount + " Owned ∙ " + floorAskPrice + "₿"
                        let rightPartNfts = totalPrice + "₿ (" + totalPriceUsd + "$)`\n"
                        let leftPartNFTsLenght = leftPartNfts.length
                        let rightPartNftsLenght = rightPartNfts.length
                        let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                        let spaceLenght = ""
                        for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }


                        nftsOverview += "`" + reduceText(name, 30) + " ∙ " + tokenCount + " Owned ∙ " + floorAskPrice + "₿" + spaceLenght + totalPrice + "₿ (" + totalPriceUsd + "$)`\n";


                    };



                    const walletValue = parseInt(walletBTCBalance) + NFTTotalValue


                    if (BRC20Overview == "") { BRC20Overview = "`No BRC20 tokens owned                      `" }
                    if (nftsOverview == "") { nftsOverview = "`No Ordinal NFTs owned                                             `  \n" }


                    const getPortfolioOneWallet = new EmbedBuilder().setColor("#060A8F")
                        .setTitle(`${authorName}'s portfolio`)
                        .setDescription(">>> Showing portfolio data")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        //.setImage([image])
                        .addFields(
                            { name: "Wallet", value: "`" + walletCount + " wallets`", inline: false },
                            { name: "Wallet Value", value: "`" + parseFloat(walletValue).toFixed(3) + "₿ (" + new Intl.NumberFormat('en-US').format(parseFloat((BTCUsdPrice * walletValue)).toFixed(0)) + "$)`", inline: true },
                            { name: "BTC Value", value: "`" + parseFloat(walletBTCBalance).toFixed(3) + "₿ (" + new Intl.NumberFormat('en-US').format(parseFloat((BTCUsdPrice * walletBTCBalance)).toFixed(0)) + "$)`", inline: true },
                            { name: "NFTs Value", value: "`" + NFTTotalValue.toFixed(3) + "₿ (" + new Intl.NumberFormat('en-US').format(parseFloat((NFTTotalValue * BTCUsdPrice)).toFixed(0)) + "$)`", inline: true },
                            { name: "BRC20 Tokens", value: BRC20Overview, inline: false },
                            { name: "NFTs Overview", value: nftsOverview, inline: false },

                        )
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                    await interaction.update({ embeds: [getPortfolioOneWallet], components: [chartVisual1] });



                    await interactionData.update({ embed2: JSON.stringify(getPortfolioOneWallet), }, { where: { authorId: authorId, commandName: "portfolio", serverId: serverId } })






                } else {

                    const getPortfolioALLWallet = new EmbedBuilder().setColor("#060A8F")
                        .setTitle(`${authorName}'s portfolio`)
                        .setDescription(">>> Showing Ethereum portfolio data")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .addFields(
                            { name: "Wallet", value: "```No Bitcoin wallet is registered in your portfolio.```", inline: false },

                        )
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.update({ embeds: [getPortfolioALLWallet], components: [chartVisual1] });


                    await interactionData.update({ embed2: JSON.stringify(getPortfolioALLWallet), }, { where: { authorId: authorId, commandName: "portfolio", serverId: serverId } })


                }

            } else {


                const embedReadyToGo = JSON.parse(embedReady)

                await interaction.update({ embeds: [embedReadyToGo], components: [chartVisual1] })




            }


        } else {

            const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                .setTitle("Bot Access")
                .setAuthor({ name: authorName, iconURL: userAvatar })
                .setDescription("This button is not for you. You can only click on buttons generated by your commands. Please try again with your personal data.")
                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                .setTimestamp()
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

            await interaction.reply({ embeds: [setfpEmbedNotForYou], ephemeral: true });


        }


        // } catch (error) {


        //     console.log("// Error - sent in report ❌")

        //     //On envoi une notif
        //     let botId = interaction.applicationId
        //     const botAdmins = await adminsql.findOne({ where: { botId: botId } })
        //     const mainServerId = botAdmins.dataValues.mainServerId
        //     const logChannelId = botAdmins.dataValues.logChannelId
        //     const guild = interaction.client.guilds.cache.get(mainServerId);
        //     const channel = guild.channels.cache.get(logChannelId);


        //     const adminAccessInfos = await accessSql.findOne({ where: { serverId: serverId } })
        //     let adminRoleId = adminAccessInfos.dataValues.adminRoleId
        //     let serverName = adminAccessInfos.dataValues.serverName
        //     const userRoleList = interaction.member._roles
        //     let userHighestRole = "Member"
        //     if (userRoleList.includes(adminRoleId)) { userHighestRole = "Team" }
        //     let reportCommand = "/team-marketingpage"

        //     const timeStamp = Date.now();
        //     const date = new Date(timeStamp);
        //     const dateLisible = date.toLocaleString();
        //     const date1 = moment(dateLisible, 'M/D/YYYY, h:mm:ss A');
        //     const formattedDate = date1.format('Do [of] MMMM YYYY');



        //     //On enregistre le call
        //     await reportsql.create({
        //         botId: botId,
        //         authorId: "Bot",
        //         serverName: serverName,
        //         authorRole: userHighestRole,
        //         serverId: serverId,
        //         date: formattedDate,
        //         reportType: "Bug",
        //         reportCommand: reportCommand,
        //         reportDescription: "```" + error.stack + "```",
        //         reportPriority: "5",
        //         reportState: "Not treated",
        //     })



        //     console.log("//////////\n\nDetails de l'erreur :\n\n" + error.stack + "\n\n//////////")

        //     const reduceText = require("../../../functions/reducetext")
        //     const roleTag = "1121510423687090186"


        //     const updateEmbed = new EmbedBuilder().setColor("#060A8F")
        //         .setTitle("New Report")
        //         .setDescription(">>> A new report has just been sent.")
        //         .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
        //         .setAuthor({ name: "Rolls Chasers Analytics", iconURL: "https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png" })
        //         .setTimestamp()
        //         .addFields(
        //             { name: " ", value: " ", inline: false },
        //             { name: "Content:", value: "A new `bug` has been submitted for the `" + reportCommand + "` command by `the bot report division` in `" + serverName + "`. You can use the administrator dashboard to consult it.", inline: false },
        //             { name: " ", value: " ", inline: false },
        //             { name: "Error:", value: "```" + reduceText(error.stack, 1024) + "```", inline: false },
        //         )
        //         .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


        //     await channel.send("<@&" + roleTag + ">");

        //     await channel.send({ embeds: [updateEmbed] });



        //     const errorAnswerUser = new EmbedBuilder().setColor("#060A8F")
        //         .setTitle("An error occured")
        //         .setDescription("An error has occurred while executing this command. These errors can occur for a variety of reasons, such as :\n∙ Unexpected traffic\n∙ API maintenance\n∙ Occasional bug\n\nPlease note that a report has already been sent to our team, who will fix the problem as soon as possible. You can still use `/report` to give more details about the error and help our team.")
        //         .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
        //         .setTimestamp()
        //         .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


        //     await interaction.reply({ embeds: [errorAnswerUser], ephemeral: true });


        //   }

    },
};




