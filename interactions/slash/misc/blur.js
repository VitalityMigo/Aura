/**
 * @file Sample getdata command with slash command.
 * @author Vitality Migø
 */



const { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { profileData, accessSql, wallets, apimonitorsql, adminsql, reportsql, usersql, interactionData, sequelize } = require('../../../events/database');
const moment = require('moment');



//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const etherscanApiKey = process.env.etherscanApiKey
const reservoirApiKey = process.env.reservoirApiKey
const alchemyApiKey = process.env.alchemyApiKey


//HTTPS requests
const axios = require('axios')

//Web3 API + Cloudfare Provider
var Web3 = require("web3")
const web3 = new Web3("https://cloudflare-eth.com")

var Contract = require('web3-eth-contract');
//const contract = new Contract.setProvider("https://cloudflare-eth.com")

const alchemy2 = require('api')('@alchemy-docs/v1.0#24zcsa23lfbpdnv5');



//Reservoir API
const sdk = require('api')('@reservoirprotocol/v2.0#2672bklexdpsbi');
sdk.auth(reservoirApiKey);


const sdk3 = require('api')('@reservoirprotocol/v3.0#2n2re32lkmyg6l7');
sdk3.auth(reservoirApiKey);

function formatWallet(input) {
    return input.length > 35 ? `${input.substring(0, 10)}…${input.substring(input.length - 10)}` : input;
}


function isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}


function isBRC20BitcoinWallet(wallet) {
    const regex = /^bc1[a-zA-Z0-9]{39,59}$/;

    return regex.test(wallet);
}

function reduceTextCurrent(text, maxLength) {
    if (text.length > maxLength) {
        return text.substring(0, maxLength - 3) + '…';
    }
    return text;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("blur")
        .setDescription("Display various Blur related metrics")
        .addSubcommand(subcommand =>
            subcommand
                .setName("data")
                .setDescription("Display your portfolio metrics regarding Blur tokens")
                .addStringOption(option =>
                    option
                        .setName("wallet")
                        .setDescription("The wallet you want to display")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("bids")
                .setDescription("Display collection(s) or wallet(s) Blur bid metrics")
                .addStringOption(option =>
                    option
                        .setName("collection")
                        .setDescription("The collection to analyze")
                        .setRequired(false)
                        .setAutocomplete(true)
                )
                .addStringOption(option =>
                    option
                        .setName("wallet")
                        .setDescription("The wallet to analyze")
                        .setRequired(false)
                        .setAutocomplete(true)
                ),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("holders")
                .setDescription("Display a specfic collection's holders")
                .addStringOption(option =>
                    option
                        .setName("collection")
                        .setDescription("The collection to analyze")
                        .setRequired(true)
                        .setAutocomplete(true),
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("lends")
                .setDescription("Display a specfic collection's lends")
                .addStringOption(option =>
                    option
                        .setName("collection")
                        .setDescription("The collection to analyze")
                        .setRequired(false)
                       // .setAutocomplete(true)
                )
                .addStringOption(option =>
                    option
                        .setName("wallet")
                        .setDescription("The wallet to analyze")
                        .setRequired(false)
                       // .setAutocomplete(true)

                )
        ),






    async execute(interaction) {


        if (interaction.guildId != null) {


            //Récupérer informations de l'utilisateur de la commande
            let authorId = interaction.user.id;
            let authorName = interaction.user.username;
            let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
            let serverId = interaction.member.guild.id
            let member = interaction.member;




            // try {


            const communityRolePerms = await accessSql.findOne({ where: { serverId: serverId } })
            let communityMemberRoleId = communityRolePerms.dataValues.memberRoleId
            let communityAdminRoleId = communityRolePerms.dataValues.adminRoleId
            let botPowerStatut = communityRolePerms.dataValues.actualPower
            let communityStatut = communityRolePerms.dataValues.statut

            //Récupère régagle de privé/ou pas de l'utilisateur
            const authorProfile = await profileData.findOne({ where: { authorId: authorId } })

            if (authorProfile === null) { await interaction.deferReply(); } else {
                const authorPrivacyMode = authorProfile.dataValues.privacyMode

                if (authorPrivacyMode.toLowerCase() === "private") { await interaction.deferReply({ ephemeral: true }); }
                if (authorPrivacyMode.toLowerCase() === "public") { await interaction.deferReply(); }
            }

            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")

            if (communityStatut.toLowerCase() === "active") {


                if (botPowerStatut.toLowerCase() === "on") {


                    if (member.roles.cache.has(communityMemberRoleId)) {

                        //Checkpoint
                        console.log("// Step 2 : Authorization - Executed ✅")


                        //On enregistre le user si il est pas encore dans la database
                        const timeStamp = Date.now();
                        const actualTimestamp = parseFloat(timeStamp / 1000).toFixed(0)
                        const isUser = await usersql.findOne({ where: { userId: authorId, serverId: serverId } })
                        if (isUser == null) { await usersql.create({ userId: authorId, userName: authorName, userAvatar: userAvatar, serverId: serverId, timestamp: actualTimestamp }) }


                        //Récupérer liste des wallets
                        let allWalletAddressOfAuthorTable = []
                        const allWalletsOfAuthor = await wallets.findAll({ where: { authorId: authorId, walletCategory: "eth" } });
                        for (let i = 0; i < allWalletsOfAuthor.length; i++) { allWalletAddressOfAuthorTable.push(allWalletsOfAuthor[i].dataValues.walletAddress); }





                        if (interaction.options.getSubcommand() === 'data') {


                            //Variable pour les options
                            const selectedWallet = interaction.options.getString("wallet");



                            if (selectedWallet.toLowerCase() !== "all") {


                                if (isValidEthereumAddress(selectedWallet)) {


                                    const WalletofAuthor = await wallets.findOne({ where: { authorId: authorId, walletAddress: selectedWallet } });
                                    let precisedWalletNameofAuthor = ""
                                    if (WalletofAuthor !== null) {
                                        precisedWalletNameofAuthor = WalletofAuthor.dataValues.walletName
                                    } else { precisedWalletNameofAuthor = selectedWallet.substring(0, 5) + "..." + selectedWallet.substring(selectedWallet.length - 4, selectedWallet.length) }


                                    //On récupère la balance de token
                                    const blurWalletBalance = await axios.get('https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0x5283D291DBCF85356A21bA090E6db59121208b44&address=' + selectedWallet + '&tag=latest&apikey=' + etherscanApiKey)
                                    const blurPoolWalletBalance = await axios.get('https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0x0000000000A39bb272e79075ade125fd351887Ac&address=' + selectedWallet + '&tag=latest&apikey=' + etherscanApiKey)
                                    const blurPoolContractBalance = await web3.eth.getBalance("0x0000000000A39bb272e79075ade125fd351887Ac")

                                    const blurBalanceFormatted = blurWalletBalance.data.result / (10 ** 18)
                                    const blurPoolBalanceFormatted = blurPoolWalletBalance.data.result / (10 ** 18)
                                    const blurPoolContractBalanceFormatted = parseFloat(web3.utils.fromWei((blurPoolContractBalance).toString(), 'ether'))


                                    // On récupère le prix USD des différentes cryptos
                                    const ethUsdPrice = await axios.get('https://api.etherscan.io/api?module=stats&action=ethprice&apikey=' + etherscanApiKey)
                                    const cryptoUsdtPrice = await axios.get('https://api-testnet.bybit.com/v5/market/tickers?category=linear')
                                    const blurUsdTPrice = cryptoUsdtPrice.data.result.list.find(obj => obj.symbol === "BLURUSDT").lastPrice;




                                    let lignMaxSize = 70
                                    let leftPartNfts = "`" + selectedWallet
                                    let rightPartNfts = blurPoolBalanceFormatted.toFixed(4) + "Ξ`\n"
                                    let leftPartNFTsLenght = leftPartNfts.length
                                    let rightPartNftsLenght = rightPartNfts.length
                                    let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                                    let spaceLenght = ""
                                    for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }



                                    // CODE POUR METTRE EN VERSION US (897,897.88$)           
                                    //new Intl.NumberFormat('en-US').format(


                                    const getBlurOneWallet = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle(`${authorName}'s Blur portfolio`)
                                        .setDescription(">>> Showing `" + precisedWalletNameofAuthor + "` data on Blur")
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .addFields(
                                            { name: "Blur Wallet Balance", value: "`" + blurBalanceFormatted.toFixed(3) + " BLUR (" + (blurUsdTPrice * blurBalanceFormatted).toFixed(3) + "$)`", inline: true },
                                            { name: "Blur Pool Wallet Balance", value: "`" + blurPoolBalanceFormatted.toFixed(3) + "Ξ (" + (ethUsdPrice.data.result.ethusd * blurPoolBalanceFormatted).toFixed(3) + "$)`", inline: true },
                                            { name: "Pool Share Held Ratio", value: "`" + ((blurPoolBalanceFormatted * 100) / blurPoolContractBalanceFormatted).toFixed(10) + "% `", inline: true },
                                            { name: "Blur Pool Contract Balance", value: "`" + blurPoolContractBalanceFormatted.toFixed(3) + "Ξ (" + (ethUsdPrice.data.result.ethusd * blurPoolContractBalanceFormatted).toFixed(3) + "$)`", inline: false },
                                            { name: "Wallet", value: "`" + selectedWallet + spaceLenght + blurPoolBalanceFormatted.toFixed(4) + "Ξ`", inline: false },

                                        )
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                    await interaction.editReply({ embeds: [getBlurOneWallet] });


                                    //On enregistre le call API dans la database
                                    const timeStamp = Date.now();
                                    await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/blur", apiCallName: "blurWalletBalance", apiProvider: "etherscan", timestamp: timeStamp.toString() })
                                    await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/blur", apiCallName: "blurPoolWalletBalance", apiProvider: "etherscan", timestamp: timeStamp.toString() })
                                    await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/blur", apiCallName: "blurPoolContractBalance", apiProvider: "web3.eth", timestamp: timeStamp.toString() })
                                    await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/blur", apiCallName: "ethUsdPrice", apiProvider: "etherscan", timestamp: timeStamp.toString() })
                                    await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/blur", apiCallName: "blurUsdPrice", apiProvider: "etherscan", timestamp: timeStamp.toString() })


                                } else if (isBRC20BitcoinWallet(selectedWallet)) {


                                    const notMember = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle(`Blur Data`)
                                        .setDescription("Aura can't analyze your wallet's data because the wallet you provided isn't an Ethereum wallet but a Bitcoin wallet. Please use try again using the appropriate form.")
                                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                    await interaction.editReply({ embeds: [notMember] });




                                } else {

                                    const notMember = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle(`Blur Data`)
                                        .setDescription("Aura can't analyze your wallet's data because the wallet you provided isn't valid. Please use try again using the appropriate form.")
                                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                    await interaction.editReply({ embeds: [notMember] });



                                }



                            } else if (selectedWallet.toLowerCase() == "all") {


                                if (allWalletAddressOfAuthorTable.length > 0) {


                                    const promises = [];
                                    const sleep = require('sleep-promise');


                                    let blurBalanceFormatted = 0
                                    let blurPoolBalanceFormatted = 0
                                    let blurPoolContractBalanceFormatted = 0
                                    let blurPoolContractBalanceFormattedTable = []

                                    let walletsValue = ""

                                    const blurPoolContractBalance = await web3.eth.getBalance("0x0000000000A39bb272e79075ade125fd351887Ac")

                                    // On récupère le prix USD des différentes cryptos
                                    const ethUsdPrice = await axios.get('https://api.etherscan.io/api?module=stats&action=ethprice&apikey=' + etherscanApiKey)
                                    const cryptoUsdtPrice = await axios.get('https://api-testnet.bybit.com/v5/market/tickers?category=linear')
                                    const blurUsdTPrice = cryptoUsdtPrice.data.result.list.find(obj => obj.symbol === "BLURUSDT").lastPrice;


                                    for (const wallet of allWalletAddressOfAuthorTable) {

                                        promises.push((async () => {

                                            await Promise.all(promises);

                                            //On récupère la balance de token
                                            const blurWalletBalance = await axios.get('https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0x5283D291DBCF85356A21bA090E6db59121208b44&address=' + wallet + '&tag=latest&apikey=' + etherscanApiKey)
                                            const blurPoolWalletBalance = await axios.get('https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0x0000000000A39bb272e79075ade125fd351887Ac&address=' + wallet + '&tag=latest&apikey=' + etherscanApiKey)



                                            blurBalanceFormatted += blurWalletBalance.data.result / (10 ** 18)
                                            blurPoolBalanceFormatted += blurPoolWalletBalance.data.result / (10 ** 18)
                                            blurPoolContractBalanceFormatted += parseFloat(web3.utils.fromWei((blurPoolContractBalance).toString(), 'ether'))




                                            let obj = {}
                                            obj.walletAddress = wallet
                                            obj.walletPoolBalance = blurPoolWalletBalance.data.result / (10 ** 18)
                                            blurPoolContractBalanceFormattedTable.push(obj)

                                            await sleep(500);
                                        })());
                                    }

                                    await Promise.all(promises);



                                    let blurPoolContractBalanceFormattedTableSorted = blurPoolContractBalanceFormattedTable.sort((a, b) => b.walletPoolBalance - a.walletPoolBalance);

                                    let blurPoolContractBalanceFormattedTableSortedFormatted = blurPoolContractBalanceFormattedTableSorted.slice(0, 13);



                                    blurPoolContractBalanceFormattedTableSortedFormatted.forEach(wallet => {

                                        let lignMaxSize = 70
                                        let leftPartNfts = "`" + wallet.walletAddress
                                        let rightPartNfts = wallet.walletPoolBalance.toFixed(4) + "Ξ`\n"
                                        let leftPartNFTsLenght = leftPartNfts.length
                                        let rightPartNftsLenght = rightPartNfts.length
                                        let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                                        let spaceLenght = ""
                                        for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }


                                        walletsValue += "`" + wallet.walletAddress + spaceLenght + wallet.walletPoolBalance.toFixed(4) + "Ξ`\n"





                                    })



                                    const getBlurAllWallet = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle(`${authorName}'s Blur portfolio`)
                                        .setDescription(">>> Display Blur data for `" + allWalletAddressOfAuthorTable.length + "` wallets of " + authorName)
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .addFields(
                                            { name: "Blur Wallet Balance", value: "`" + blurBalanceFormatted.toFixed(3) + " BLUR (" + (blurUsdTPrice * blurBalanceFormatted).toFixed(3) + "$)`", inline: true },
                                            { name: "Blur Pool Wallet Balance", value: "`" + blurPoolBalanceFormatted.toFixed(3) + "Ξ (" + (ethUsdPrice.data.result.ethusd * blurPoolBalanceFormatted).toFixed(3) + "$)`", inline: true },
                                            { name: "Blur Pool Contract Balance", value: "`" + blurPoolContractBalanceFormatted.toFixed(3) + "Ξ (" + (ethUsdPrice.data.result.ethusd * blurPoolContractBalanceFormatted).toFixed(3) + "$)`", inline: false },
                                            { name: "Wallets", value: walletsValue, inline: false },

                                        )
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                    await interaction.editReply({ embeds: [getBlurAllWallet] });



                                    //On enregistre le call API dans la database
                                    for (let i = 0; i < allWalletsOfAuthor.length; i++) {

                                        const timeStamp = Date.now();
                                        await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/blur", apiCallName: "blurWalletBalance", apiProvider: "etherscan", timestamp: timeStamp.toString() })
                                        await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/blur", apiCallName: "blurPoolWalletBalance", apiProvider: "etherscan", timestamp: timeStamp.toString() })
                                        await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/blur", apiCallName: "blurPoolContractBalance", apiProvider: "web3.eth", timestamp: timeStamp.toString() })
                                        await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/blur", apiCallName: "ethUsdPrice", apiProvider: "etherscan", timestamp: timeStamp.toString() })
                                        await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/blur", apiCallName: "blurUsdPrice", apiProvider: "etherscan", timestamp: timeStamp.toString() })

                                    }



                                } else {

                                    const setwalletErrorEmbed = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle(`No wallet`)
                                        .setDescription("Aura can't analyze your wallet's data because you don't have any wallet registered in your portfolio. Please use `/wallet set` or `/wallet raw` to register a wallet in your portfolio then try again.")
                                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                    await interaction.editReply({ embeds: [setwalletErrorEmbed] });





                                }
                            }

                        } else if (interaction.options.getSubcommand() === 'bids') {


                            const buttonsRow = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('blurbidpfirst-button')
                                        .setLabel('first page')
                                        .setStyle(2)
                                        .setDisabled(true),
                                    new ButtonBuilder()
                                        .setCustomId('blurbidprevious-button')
                                        .setLabel('previous page')
                                        .setStyle(2)
                                        .setDisabled(true),
                                    new ButtonBuilder()
                                        .setCustomId('blurbidnext-button')
                                        .setLabel('next page')
                                        .setStyle(2),
                                    new ButtonBuilder()
                                        .setCustomId('blurbidlast-button')
                                        .setLabel('last page')
                                        .setStyle(2),
                                );

                            const buttonsRowNo = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('blurbidpfirst-button')
                                        .setLabel('first page')
                                        .setStyle(2)
                                        .setDisabled(true),
                                    new ButtonBuilder()
                                        .setCustomId('blurbidprevious-button')
                                        .setLabel('previous page')
                                        .setStyle(2)
                                        .setDisabled(true),
                                    new ButtonBuilder()
                                        .setCustomId('blurbidnext-button')
                                        .setLabel('next page')
                                        .setStyle(2)
                                        .setDisabled(true),
                                    new ButtonBuilder()
                                        .setCustomId('blurbidlast-button')
                                        .setLabel('last page')
                                        .setStyle(2)
                                        .setDisabled(true),
                                );


                            //Variable pour les options
                            const selectedCollection = interaction.options.getString("collection");
                            const selectedWallet = interaction.options.getString("wallet");


                            if (!selectedWallet) {


                                if (selectedCollection) {


                                    // Premier Call API Reservoir : Stats et infos sur la collection
                                    await sdk.getCollectionsV5({ id: selectedCollection, accept: '*/*', includeTopBid: 'false', includeOwnerCount: 'false', includeSalesCount: 'false' })
                                        .then(async ({ data: collectionData }) => {


                                            let collectionName = collectionData.collections[0].name
                                            let collectionTwitter = collectionData.collections[0].twitterUsername
                                            let collectionWebsite = collectionData.collections[0].externalUrl
                                            let collectionBanner = collectionData.collections[0].banner
                                            let collectionSlug = collectionData.collections[0].slug
                                            let collectionFloor = collectionData.collections[0].floorAsk.price.amount.decimal
                                            let rank = collectionData.collections[0].rank.allTime


                                            // Premier Call API Reservoir : Stats et infos sur la collection
                                            await sdk3.getOrdersBidsV6({
                                                collection: selectedCollection,
                                                sources: 'blur.io',
                                                includeCriteriaMetadata: 'true',
                                                includeRawData: 'true',
                                                includeDepth: 'true',
                                                accept: '*/*'
                                            })
                                                .then(async ({ data: bidData }) => {


                                                    const dataTable = bidData.orders[0]

                                                    if (bidData.orders.length) {

                                                        let bidTableFull = dataTable.rawData.pricePoints


                                                        let totalBidders = await bidTableFull.reduce((total, item) => total + item.bidderCount, 0);
                                                        let totalBdidValue = await bidTableFull.reduce((total, item) => total + parseFloat(item.price) * item.executableSize, 0);
                                                        let totalBid = await bidTableFull.reduce((total, item) => total + item.executableSize, 0);




                                                        const maxTotalBidValue = Math.max(...bidTableFull.map(item => parseFloat(item.price) * item.executableSize));

                                                        // Calculer le nombre de ❚ en fonction de la valeur de "price x executableSize" et normaliser à une limite maximum de 25
                                                        await bidTableFull.forEach(item => {
                                                            const normalizedBars = Math.ceil((parseFloat(item.price) * item.executableSize) / maxTotalBidValue * 25);
                                                            item.bars = "❚".repeat(normalizedBars);
                                                        });

                                                        let bidTable = bidTableFull.slice(0, 16);

                                                        let bidsFormatted = "Price                              Size     Total  User\n\n"

                                                        for (const bid of bidTable) {

                                                            let price = bid.price
                                                            let bidderCount = bid.bidderCount
                                                            let bidDepth = bid.executableSize
                                                            let bars = bid.bars


                                                            let lignMaxSize = 55
                                                            let part1 = parseFloat(price).toFixed(2) + "Ξ " + bars
                                                            let part2 = bidDepth
                                                            let part3 = parseFloat(price * bidDepth).toFixed(2) + "Ξ"
                                                            let part4 = bidderCount + "\n"
                                                            // let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)

                                                            let spaceSize = 39 - (bidDepth.toString()).length - part1.length
                                                            let spaceLenght = ""
                                                            for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

                                                            let spaceSize2 = 10 - ((parseFloat(price * bidDepth).toFixed(2) + "Ξ").toString()).length
                                                            let spaceLenght2 = ""
                                                            for (let i = 0; i < spaceSize2; i++) { spaceLenght2 += " " }

                                                            let spaceSize3 = 7 - ((bidderCount + "\n").toString()).length
                                                            let spaceLenght3 = ""
                                                            for (let i = 0; i < spaceSize3; i++) { spaceLenght3 += " " }


                                                            bidsFormatted += part1 + spaceLenght + part2 + spaceLenght2 + part3 + spaceLenght3 + part4


                                                        };



                                                        const bidRowCount = bidTableFull.length
                                                        const itemsPerPage = 16; // Nombre d'objets par page
                                                        let pageIndex = Math.ceil(bidRowCount / itemsPerPage);


                                                        if (bidTable.length <= 0) { bidsFormatted = "No bids found for this collection." }


                                                        const getBlurOneWallet = new EmbedBuilder().setColor("#060A8F")
                                                            .setTitle(collectionName + "'s bids")
                                                            .setDescription(">>> Displaying the Blur bid metrics of `" + collectionName + "`.")
                                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                                            .addFields(
                                                                { name: "Floor Price", value: "`" + parseFloat(collectionFloor).toFixed(3) + "Ξ`", inline: true },
                                                                { name: "Rank", value: "`" + rank + "`", inline: true },
                                                                { name: " ", value: " ", inline: true },
                                                                { name: "Total Bids Value", value: "`" + parseFloat(totalBdidValue).toFixed(3) + "Ξ`", inline: true },
                                                                { name: "Bid Count", value: "`" + totalBid + "`", inline: true },
                                                                { name: "Unique Bidders", value: "`" + totalBidders + "`", inline: true },
                                                                { name: "Bids", value: "```" + bidsFormatted + "```", inline: true },
                                                                { name: "Links", value: '[magically](https://magically.gg/collection/' + selectedCollection + ") ∙ " + '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + selectedCollection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + selectedCollection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ") ∙ " + '[website](' + collectionWebsite + ")", inline: false },
                                                                { name: "Page", value: "`[1/" + pageIndex + "]`", inline: true },

                                                            )
                                                            .setTimestamp()
                                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })



                                                        if (pageIndex <= 1) { await interaction.editReply({ embeds: [getBlurOneWallet], components: [buttonsRowNo] }); }
                                                        else { await interaction.editReply({ embeds: [getBlurOneWallet], components: [buttonsRow] }); }





                                                        let bidUserDataTable = []
                                                        let obj = {}
                                                        obj.collectionName = collectionName
                                                        obj.collectionFloor = collectionFloor
                                                        obj.rank = rank
                                                        obj.totalBdidValue = totalBdidValue
                                                        obj.totalBid = totalBid
                                                        obj.totalBidders = totalBidders
                                                        obj.links = '[magically](https://magically.gg/collection/' + selectedCollection + ") ∙ " + '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + selectedCollection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + selectedCollection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ") ∙ " + '[website](' + collectionWebsite + ")"
                                                        bidUserDataTable.push(obj)


                                                        //On fait le call àbn  la base SQL
                                                        await interactionData.destroy({ where: { authorId: authorId, commandName: "blur-bid", serverId: serverId } })

                                                        await interactionData.create({

                                                            authorId: authorId,
                                                            authorName: authorName,
                                                            serverId: serverId,
                                                            commandName: "blur-bid",
                                                            interactionId: interaction.id,
                                                            walletAddress: "N/A",
                                                            walletCategory: "collection",
                                                            embed1: JSON.stringify(bidTableFull),
                                                            embed2: JSON.stringify(bidUserDataTable),
                                                            embed3: "N/A",
                                                            pageIndex: pageIndex.toString(),
                                                            actualPage: "1",
                                                            walletName: "N/A",
                                                            selecedTimestamp: "N/A",
                                                            selectedCollection: "N/A",
                                                            collectionSlug: "N/A",
                                                            collectionBanner: "N/A",
                                                            avgDeriskPrice: "N/A",
                                                            floorPrice: "N/A",
                                                            lowerMarketlace: "N/A",
                                                            collectionName: "N/A",
                                                            buyCount: "N/A",
                                                            soldCount: "N/A",
                                                            remaining: "N/A",
                                                            avgBuy: "N/A",
                                                            avgSold: "N/A",
                                                            realisedProfit: "N/A",
                                                            potentialProfit: "N/A",
                                                            roi: "N/A",
                                                            visualTitle: "N/A",
                                                            userAvatar: "N/A",
                                                            nbMembersInvolved: "N/A",
                                                            totalTradeCount: "N/A",
                                                        })

                                                    } else {


                                                        let bidsFormatted = "No bids found for this collection                       "
                                                        let pageIndex = '1'

                                                        const getBlurOneWallet = new EmbedBuilder().setColor("#060A8F")
                                                            .setTitle(collectionName + "'s bids")
                                                            .setDescription(">>> Displaying the Blur bid metrics of `" + collectionName + "`.")
                                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                                            .addFields(
                                                                { name: "Floor Price", value: "`0.000Ξ`", inline: true },
                                                                { name: "Rank", value: "`Not found`", inline: true },
                                                                { name: " ", value: " ", inline: true },
                                                                { name: "Total Bids Value", value: "`0.000Ξ`", inline: true },
                                                                { name: "Bid Count", value: "`0`", inline: true },
                                                                { name: "Unique Bidders", value: "0`", inline: true },
                                                                { name: "Bids", value: "```" + bidsFormatted + "```", inline: true },
                                                                { name: "Links", value: '[magically](https://magically.gg/collection/' + selectedCollection + ") ∙ " + '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + selectedCollection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + selectedCollection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ") ∙ " + '[website](' + collectionWebsite + ")", inline: false },
                                                                { name: "Page", value: "`[1/" + pageIndex + "]`", inline: true },

                                                            )
                                                            .setTimestamp()
                                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                                        await interaction.editReply({ embeds: [getBlurOneWallet], components: [buttonsRowNo] });


                                                    }
                                                })


                                        })



                                } else if (!selectedCollection) {


                                    const getBlurOneWallet = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle("Blur bids")
                                        .setDescription("Welcome to the Blur bids feature. This command allows you to display various metrics depending on the input you select.\n\n• Use the `collection` option to analyze a specific collection\n• Use the `wallet` option to analyze one or few wallet(s)\n• Use both filter to analyze the bids of one or few wallet(s) on a specific collection.")
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setImage("https://cdn.discordapp.com/attachments/1108757847208099941/1135761331123916800/Screenshot_2023-08-01_at_04.29.46.png")
                                        .addFields(
                                            { name: "Note", value: "Please note that for the moment, we're only supporting Blur's executable collection bids. Trait bids will available soon too.", inline: false },


                                        )
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })



                                    await interaction.editReply({ embeds: [getBlurOneWallet] })


                                }

                            } else if (selectedWallet) {

                                if (!selectedCollection) {



                                    if (selectedWallet.toLowerCase() !== 'all') {

                                        const walletAddressName = await wallets.findOne({ where: { authorId: authorId, walletAddress: selectedWallet } });
                                        let walletName1 = selectedWallet
                                        let walletName = "`" + selectedWallet.substring(0, 5) + "..." + selectedWallet.substring(selectedWallet.length - 4, selectedWallet.length) + "`"
                                        if (walletAddressName !== null) {
                                            walletName1 = walletAddressName.walletName
                                            walletName = "`" + walletName1 + " (" + selectedWallet.substring(0, 5) + "..." + selectedWallet.substring(selectedWallet.length - 4, selectedWallet.length) + ")`"

                                        }




                                        // Premier Call API Reservoir : Stats et infos sur les bids

                                        sdk3.getOrdersBidsV6({
                                            maker: selectedWallet,
                                            sources: 'blur.io',
                                            includeCriteriaMetadata: 'true',
                                            includeRawData: 'true',
                                            includeDepth: 'true',
                                            accept: '*/*'
                                        }).then(async ({ data: bidData }) => {


                                            const dataTable = bidData.orders

                                            let bidsFormatted = "No bids found for this address(es)                    "
                                            let availableLiquidity = 0
                                            let bidCount = 0
                                            let uniqueContracts = 0
                                            let pageIndex = "1"

                                            let sortedAuthorBid = []



                                            if (dataTable.length > 0) {


                                                // Le nombre de valeur "contract" unique
                                                uniqueContracts = new Set(dataTable.map((item) => item.contract)).size;

                                                // Le nombre d'objet ayant une valeur side égal à "buy"
                                                bidCount = dataTable.filter((item) => item.side === 'buy').length;


                                                // Étape 1 : Regrouper les objets par "contract" et "item.price.amount.decimal"
                                                const groupedObjects = {};
                                                for (const obj of dataTable) {
                                                    const key = `${obj.contract}:${obj.price.amount.decimal}`;
                                                    if (!groupedObjects[key]) {
                                                        groupedObjects[key] = {
                                                            totalQuantity: 0,
                                                            price: obj.price.amount.decimal,
                                                            contract: obj.contract,
                                                        };
                                                    }

                                                    groupedObjects[key].totalQuantity += obj.quantityRemaining;
                                                    groupedObjects[key].priceWithCount = obj.price.amount.decimal * obj.quantityRemaining;

                                                }



                                                // Étape 3 : Trier le tableau en utilisant "price" puis "priceWithCount"
                                                sortedAuthorBid = Object.values(groupedObjects).sort((a, b) => {
                                                    if (a.price !== b.price) {
                                                        return b.price - a.price;
                                                    } else {
                                                        return b.priceWithCount - a.priceWithCount;
                                                    }
                                                });

                                                const contractList = new Set(dataTable.map((item) => item.contract))
                                                for (const contract of contractList) {
                                                    // Premier Call API Reservoir : Stats et infos sur la collection
                                                    await sdk.getCollectionsV5({ id: contract, accept: '*/*', includeTopBid: 'false', includeOwnerCount: 'false', includeSalesCount: 'false' })
                                                        .then(async ({ data: collectionData }) => {

                                                            let name = await reduceTextCurrent(collectionData.collections[0].name, 22)
                                                            let floor = await collectionData.collections[0].floorAsk.price.amount.decimal

                                                            for (const obj of sortedAuthorBid) {
                                                                if (obj.contract.toLowerCase() === contract.toLowerCase()) {
                                                                    obj.name = name;
                                                                    obj.floor = floor;
                                                                }
                                                            }
                                                        })
                                                }


                                                availableLiquidity = sortedAuthorBid.reduce((max, item) => {
                                                    return item.priceWithCount > max ? item.priceWithCount : max;
                                                }, 0);


                                                let bidTable = sortedAuthorBid.slice(0, 16);

                                                bidsFormatted = "Collection               Floor    Price   Bid      Total\n\n"


                                                for (const bid of bidTable) {




                                                    let name = await reduceTextCurrent(bid.name, 22)
                                                    let floor = bid.floor
                                                    let price = bid.price
                                                    let bidCount = bid.totalQuantity
                                                    let totalValue = bid.priceWithCount





                                                    let lignMaxSize = 55
                                                    let part1 = name
                                                    let part2 = parseFloat(floor).toFixed(2) + "Ξ"
                                                    let part3 = parseFloat(price).toFixed(2) + "Ξ"
                                                    let part4 = bidCount.toString()
                                                    let part5 = parseFloat(totalValue).toFixed(2) + "Ξ\n"
                                                    // let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)

                                                    let spaceSize = 30 - part2.length - name.length
                                                    let spaceLenght = ""
                                                    for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

                                                    let spaceSize2 = 9 - part3.length
                                                    let spaceLenght2 = ""
                                                    for (let i = 0; i < spaceSize2; i++) { spaceLenght2 += " " }

                                                    let spaceSize3 = 6 - part4.length
                                                    let spaceLenght3 = ""
                                                    for (let i = 0; i < spaceSize3; i++) { spaceLenght3 += " " }

                                                    let spaceSize4 = 12 - part5.length
                                                    let spaceLenght4 = ""
                                                    for (let i = 0; i < spaceSize4; i++) { spaceLenght4 += " " }


                                                    bidsFormatted += part1 + spaceLenght + part2 + spaceLenght2 + part3 + spaceLenght3 + part4 + spaceLenght4 + part5


                                                };



                                                const bidRowCount = sortedAuthorBid.length
                                                const itemsPerPage = 16; // Nombre d'objets par page
                                                pageIndex = Math.ceil(bidRowCount / itemsPerPage);


                                            }




                                            const getBlurOneWallet = new EmbedBuilder().setColor("#060A8F")
                                                .setTitle("Blur Bids")
                                                .setDescription(">>> Displaying the Blur bid metrics of `" + walletName + "`.")
                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                .addFields(
                                                    { name: "Bid Liquidity", value: "`" + parseFloat(availableLiquidity).toFixed(3) + "Ξ`", inline: false },
                                                    { name: "Bid Count", value: "`" + bidCount + "`", inline: true },
                                                    { name: "Collection Count", value: "`" + uniqueContracts + "`", inline: true },
                                                    { name: "Bids", value: "```" + bidsFormatted + "```", inline: false },
                                                    { name: "Links", value: "[opensea](https://opensea.io/" + selectedWallet + ") ∙ " + '[blur](https://blur.io/' + selectedWallet + ") ∙ " + '[etherscan](https://etherscan.io/address/' + selectedWallet + ") ∙ " + '[magically](https://magically.gg/portfolio/wallet/' + selectedWallet + ") ∙ " + '[nansen](https://portfolio.nansen.ai/dashboard/' + selectedWallet + ")", inline: false },
                                                    { name: "Page", value: "`[1/" + pageIndex + "]`", inline: true },

                                                )
                                                .setTimestamp()
                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })



                                            if (pageIndex <= 1) { await interaction.editReply({ embeds: [getBlurOneWallet], components: [buttonsRowNo] }); }
                                            else { await interaction.editReply({ embeds: [getBlurOneWallet], components: [buttonsRow] }); }




                                            let bidUserDataTable = []
                                            let obj = {}
                                            obj.walletName = walletName
                                            obj.availableLiquidity = availableLiquidity
                                            obj.bidCount = bidCount
                                            obj.uniqueContracts = uniqueContracts
                                            obj.links = "[opensea](https://opensea.io/" + selectedWallet + ") ∙ " + '[blur](https://blur.io/' + selectedWallet + ") ∙ " + '[etherscan](https://etherscan.io/address/' + selectedWallet + ") ∙ " + '[magically](https://magically.gg/portfolio/wallet/' + selectedWallet + ") ∙ " + '[nansen](https://portfolio.nansen.ai/dashboard/' + selectedWallet + ")"
                                            bidUserDataTable.push(obj)


                                            //On fait le call àbn  la base SQL
                                            await interactionData.destroy({ where: { authorId: authorId, commandName: "blur-bid", serverId: serverId } })

                                            await interactionData.create({

                                                authorId: authorId,
                                                authorName: authorName,
                                                serverId: serverId,
                                                commandName: "blur-bid",
                                                interactionId: interaction.id,
                                                walletAddress: selectedWallet.toString(),
                                                walletCategory: "wallet",
                                                embed1: JSON.stringify(sortedAuthorBid),
                                                embed2: JSON.stringify(bidUserDataTable),
                                                embed3: "N/A",
                                                pageIndex: pageIndex.toString(),
                                                actualPage: "1",
                                                walletName: "N/A",
                                                selecedTimestamp: "N/A",
                                                selectedCollection: "N/A",
                                                collectionSlug: "N/A",
                                                collectionBanner: "N/A",
                                                avgDeriskPrice: "N/A",
                                                floorPrice: "N/A",
                                                lowerMarketlace: "N/A",
                                                collectionName: "N/A",
                                                buyCount: "N/A",
                                                soldCount: "N/A",
                                                remaining: "N/A",
                                                avgBuy: "N/A",
                                                avgSold: "N/A",
                                                realisedProfit: "N/A",
                                                potentialProfit: "N/A",
                                                roi: "N/A",
                                                visualTitle: "N/A",
                                                userAvatar: "N/A",
                                                nbMembersInvolved: "N/A",
                                                totalTradeCount: "N/A",
                                            })



                                        })

                                    } else if (selectedWallet.toLowerCase() == "all") {


                                        const allWalletsAuthor = await wallets.findAll({ where: { authorId: authorId, walletCategory: "eth" } })
                                        let allWalletsAuthorTable = allWalletsAuthor.map(wallet => wallet.walletAddress.toLowerCase());
                                        const walletCount = allWalletsAuthorTable.length

                                        if (allWalletsAuthorTable.length > 0) {


                                            // Premier Call API Reservoir : Stats et infos sur les bids

                                            let dataTable = []

                                            for (const selectedWallet of allWalletsAuthorTable) {

                                                await sdk3.getOrdersBidsV6({
                                                    maker: selectedWallet,
                                                    sources: 'blur.io',
                                                    includeCriteriaMetadata: 'true',
                                                    includeRawData: 'true',
                                                    includeDepth: 'true',
                                                    accept: '*/*'
                                                }).then(async ({ data: bidData }) => {

                                                    const dataSingleWallet = bidData.orders

                                                    for (const obj of dataSingleWallet) {
                                                        dataTable.push(obj)
                                                    }

                                                })

                                            }


                                            let bidsFormatted = "No bids found for this address(es)                    "
                                            let availableLiquidity = 0
                                            let bidCount = 0
                                            let uniqueContracts = 0
                                            let pageIndex = "1"

                                            let sortedAuthorBid = []

                                            if (dataTable.length > 0) {


                                                // Le nombre de valeur "contract" unique
                                                uniqueContracts = new Set(dataTable.map((item) => item.contract)).size;

                                                // Le nombre d'objet ayant une valeur side égal à "buy"
                                                bidCount = dataTable.filter((item) => item.side === 'buy').length;


                                                // Étape 1 : Regrouper les objets par "contract" et "item.price.amount.decimal"
                                                const groupedObjects = {};
                                                for (const obj of dataTable) {
                                                    const key = `${obj.contract}:${obj.price.amount.decimal}`;
                                                    if (!groupedObjects[key]) {
                                                        groupedObjects[key] = {
                                                            totalQuantity: 0,
                                                            price: obj.price.amount.decimal,
                                                            contract: obj.contract,
                                                        };
                                                    }

                                                    groupedObjects[key].totalQuantity += obj.quantityRemaining;
                                                    groupedObjects[key].priceWithCount = obj.price.amount.decimal * obj.quantityRemaining;

                                                }



                                                // Étape 3 : Trier le tableau en utilisant "price" puis "priceWithCount"
                                                sortedAuthorBid = Object.values(groupedObjects).sort((a, b) => {
                                                    if (a.price !== b.price) {
                                                        return b.price - a.price;
                                                    } else {
                                                        return b.priceWithCount - a.priceWithCount;
                                                    }
                                                });

                                                const contractList = new Set(dataTable.map((item) => item.contract))
                                                for (const contract of contractList) {
                                                    // Premier Call API Reservoir : Stats et infos sur la collection
                                                    await sdk.getCollectionsV5({ id: contract, accept: '*/*', includeTopBid: 'false', includeOwnerCount: 'false', includeSalesCount: 'false' })
                                                        .then(async ({ data: collectionData }) => {

                                                            let name = await reduceTextCurrent(collectionData.collections[0].name, 22)
                                                            let floor = await collectionData.collections[0].floorAsk.price.amount.decimal

                                                            for (const obj of sortedAuthorBid) {
                                                                if (obj.contract.toLowerCase() === contract.toLowerCase()) {
                                                                    obj.name = name;
                                                                    obj.floor = floor;
                                                                }
                                                            }
                                                        })
                                                }


                                                availableLiquidity = sortedAuthorBid.reduce((max, item) => {
                                                    return item.priceWithCount > max ? item.priceWithCount : max;
                                                }, 0);


                                                let bidTable = sortedAuthorBid.slice(0, 16);

                                                bidsFormatted = "Collection               Floor    Price   Bid      Total\n\n"


                                                for (const bid of bidTable) {




                                                    let name = await reduceTextCurrent(bid.name, 22)
                                                    let floor = bid.floor
                                                    let price = bid.price
                                                    let bidCount = bid.totalQuantity
                                                    let totalValue = bid.priceWithCount





                                                    let lignMaxSize = 55
                                                    let part1 = name
                                                    let part2 = parseFloat(floor).toFixed(2) + "Ξ"
                                                    let part3 = parseFloat(price).toFixed(2) + "Ξ"
                                                    let part4 = bidCount.toString()
                                                    let part5 = parseFloat(totalValue).toFixed(2) + "Ξ\n"
                                                    // let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)

                                                    let spaceSize = 30 - part2.length - name.length
                                                    let spaceLenght = ""
                                                    for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

                                                    let spaceSize2 = 9 - part3.length
                                                    let spaceLenght2 = ""
                                                    for (let i = 0; i < spaceSize2; i++) { spaceLenght2 += " " }

                                                    let spaceSize3 = 6 - part4.length
                                                    let spaceLenght3 = ""
                                                    for (let i = 0; i < spaceSize3; i++) { spaceLenght3 += " " }

                                                    let spaceSize4 = 12 - part5.length
                                                    let spaceLenght4 = ""
                                                    for (let i = 0; i < spaceSize4; i++) { spaceLenght4 += " " }


                                                    bidsFormatted += part1 + spaceLenght + part2 + spaceLenght2 + part3 + spaceLenght3 + part4 + spaceLenght4 + part5


                                                };



                                                const bidRowCount = sortedAuthorBid.length
                                                const itemsPerPage = 16; // Nombre d'objets par page
                                                pageIndex = Math.ceil(bidRowCount / itemsPerPage);


                                            }



                                            const getBlurOneWallet = new EmbedBuilder().setColor("#060A8F")
                                                .setTitle("Blur Bids")
                                                .setDescription(">>> Displaying the Blur bid metrics of all your wallets `(" + walletCount + ")`.")
                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                .addFields(
                                                    { name: "Bid Liquidity", value: "`" + parseFloat(availableLiquidity).toFixed(3) + "Ξ`", inline: false },
                                                    { name: "Bid Count", value: "`" + bidCount + "`", inline: true },
                                                    { name: "Collection Count", value: "`" + uniqueContracts + "`", inline: true },
                                                    { name: "Bids", value: "```" + bidsFormatted + "```", inline: false },
                                                    { name: "Page", value: "`[1/" + pageIndex + "]`", inline: true },

                                                )
                                                .setTimestamp()
                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })



                                            if (pageIndex <= 1) { await interaction.editReply({ embeds: [getBlurOneWallet], components: [buttonsRowNo] }); }
                                            else { await interaction.editReply({ embeds: [getBlurOneWallet], components: [buttonsRow] }); }



                                            let bidUserDataTable = []
                                            let obj = {}
                                            obj.walletName = " all you wallets `(" + walletCount + ")`."
                                            obj.availableLiquidity = availableLiquidity
                                            obj.bidCount = bidCount
                                            obj.uniqueContracts = uniqueContracts
                                            obj.links = "https://blur.io/collections"
                                            bidUserDataTable.push(obj)


                                            //On fait le call àbn  la base SQL
                                            await interactionData.destroy({ where: { authorId: authorId, commandName: "blur-bid", serverId: serverId } })

                                            await interactionData.create({

                                                authorId: authorId,
                                                authorName: authorName,
                                                serverId: serverId,
                                                commandName: "blur-bid",
                                                interactionId: interaction.id,
                                                walletAddress: selectedWallet.toString(),
                                                walletCategory: "wallet",
                                                embed1: JSON.stringify(sortedAuthorBid),
                                                embed2: JSON.stringify(bidUserDataTable),
                                                embed3: "N/A",
                                                pageIndex: pageIndex.toString(),
                                                actualPage: "1",
                                                walletName: "N/A",
                                                selecedTimestamp: "N/A",
                                                selectedCollection: "N/A",
                                                collectionSlug: "N/A",
                                                collectionBanner: "N/A",
                                                avgDeriskPrice: "N/A",
                                                floorPrice: "N/A",
                                                lowerMarketlace: "N/A",
                                                collectionName: "N/A",
                                                buyCount: "N/A",
                                                soldCount: "N/A",
                                                remaining: "N/A",
                                                avgBuy: "N/A",
                                                avgSold: "N/A",
                                                realisedProfit: "N/A",
                                                potentialProfit: "N/A",
                                                roi: "N/A",
                                                visualTitle: "N/A",
                                                userAvatar: "N/A",
                                                nbMembersInvolved: "N/A",
                                                totalTradeCount: "N/A",
                                            })




                                        } else {

                                            const setwalletErrorEmbed = new EmbedBuilder().setColor("#060A8F")
                                                .setTitle(`No wallet`)
                                                .setDescription("Aura can't analyze your wallet's data because you don't have any wallet registered in your portfolio. Please use `/wallet set` or `/wallet raw` to register a wallet in your portfolio then try again.")
                                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                .setTimestamp()
                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                            await interaction.editReply({ embeds: [setwalletErrorEmbed] });





                                        }

                                    }




                                } if (selectedCollection) {

                                    if (selectedWallet.toLowerCase() !== 'all') {

                                        const walletAddressName = await wallets.findOne({ where: { authorId: authorId, walletAddress: selectedWallet } });
                                        let walletName1 = selectedWallet
                                        let walletName = "`" + selectedWallet.substring(0, 5) + "..." + selectedWallet.substring(selectedWallet.length - 4, selectedWallet.length) + "`"
                                        if (walletAddressName !== null) {
                                            walletName1 = walletAddressName.walletName
                                            walletName = "`" + walletName1 + " (" + selectedWallet.substring(0, 5) + "..." + selectedWallet.substring(selectedWallet.length - 4, selectedWallet.length) + ")`"

                                        }

                                        await sdk.getCollectionsV5({ id: selectedCollection, accept: '*/*', includeTopBid: 'false', includeOwnerCount: 'false', includeSalesCount: 'false' })
                                            .then(async ({ data: collectionData }) => {

                                                let collectionName = collectionData.collections[0].name
                                                let collectionTwitter = collectionData.collections[0].twitterUsername
                                                let collectionWebsite = collectionData.collections[0].externalUrl
                                                let collectionBanner = collectionData.collections[0].banner
                                                let collectionSlug = collectionData.collections[0].slug
                                                let rank = collectionData.collections[0].rank.allTime



                                                // Premier Call API Reservoir : Stats et infos sur les bids

                                                sdk3.getOrdersBidsV6({
                                                    maker: selectedWallet,
                                                    sources: 'blur.io',
                                                    includeCriteriaMetadata: 'true',
                                                    includeRawData: 'true',
                                                    includeDepth: 'true',
                                                    accept: '*/*'
                                                }).then(async ({ data: bidData }) => {


                                                    const dataTable = bidData.orders

                                                    let bidsFormatted = "No bids found for this addresse on this collection     "
                                                    let availableLiquidity = 0
                                                    let bidCount = 0
                                                    let totalValue = 0
                                                    let pageIndex = "1"

                                                    let sortedAuthorBid = []



                                                    if (dataTable.length > 0) {

                                                        sortedAuthorBid = dataTable.filter((item) => item.side === 'buy' && item.contract.toLowerCase() == selectedCollection.toLowerCase());

                                                        sortedAuthorBid.sort((a, b) => {

                                                            let multiplicationA
                                                            let multiplicationB



                                                            multiplicationA = a.price.amount.decimal;
                                                            multiplicationB = b.price.amount.decimal;

                                                            if (multiplicationA == multiplicationB) {

                                                                multiplicationA = a.quantityRemaining * a.price.amount.decimal;
                                                                multiplicationB = b.quantityRemaining * b.price.amount.decimal;


                                                            }
                                                            // Pour trier par ordre décroissant, utilisez la différence b - a
                                                            return multiplicationB - multiplicationA;
                                                        });

                                                        console.log(sortedAuthorBid)

                                                        bidCount = sortedAuthorBid.reduce((acc, obj) => acc + obj.quantityRemaining, 0);

                                                        availableLiquidity = sortedAuthorBid.reduce((max, obj) => {
                                                            const value = obj.quantityRemaining * obj.price.amount.decimal;
                                                            return value > max ? value : max;
                                                        }, 0);

                                                        totalValue = sortedAuthorBid.reduce((acc, obj) => {
                                                            const value = obj.quantityRemaining * obj.price.amount.decimal;
                                                            return acc + value;
                                                        }, 0);




                                                        let bidTable = sortedAuthorBid.slice(0, 16);

                                                        bidsFormatted = "Collection               Floor    Price   Bid      Total\n\n"

                                                        for (const bid of bidTable) {


                                                            let name = await reduceTextCurrent(collectionData.collections[0].name, 22)
                                                            let floor = collectionData.collections[0].floorAsk.price.amount.decimal
                                                            let price = bid.price.amount.decimal
                                                            let bidCount = bid.quantityRemaining
                                                            let totalValue = bid.quantityRemaining * bid.price.amount.decimal



                                                            let part1 = name
                                                            let part2 = parseFloat(floor).toFixed(2) + "Ξ"
                                                            let part3 = parseFloat(price).toFixed(2) + "Ξ"
                                                            let part4 = bidCount.toString()
                                                            let part5 = parseFloat(totalValue).toFixed(2) + "Ξ\n"
                                                            // let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)

                                                            let spaceSize = 30 - part2.length - name.length
                                                            let spaceLenght = ""
                                                            for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

                                                            let spaceSize2 = 9 - part3.length
                                                            let spaceLenght2 = ""
                                                            for (let i = 0; i < spaceSize2; i++) { spaceLenght2 += " " }

                                                            let spaceSize3 = 6 - part4.length
                                                            let spaceLenght3 = ""
                                                            for (let i = 0; i < spaceSize3; i++) { spaceLenght3 += " " }

                                                            let spaceSize4 = 12 - part5.length
                                                            let spaceLenght4 = ""
                                                            for (let i = 0; i < spaceSize4; i++) { spaceLenght4 += " " }


                                                            bidsFormatted += part1 + spaceLenght + part2 + spaceLenght2 + part3 + spaceLenght3 + part4 + spaceLenght4 + part5


                                                        };



                                                        const bidRowCount = sortedAuthorBid.length
                                                        const itemsPerPage = 16; // Nombre d'objets par page
                                                        pageIndex = Math.ceil(bidRowCount / itemsPerPage);


                                                    }



                                                    const getBlurOneWallet = new EmbedBuilder().setColor("#060A8F")
                                                        .setTitle(collectionName + "'s bids")
                                                        .setDescription(">>> Displaying the Blur bid metrics of `" + walletName + "` on `" + collectionName + "`.")
                                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                                        .addFields(
                                                            { name: "Total Value", value: "`" + parseFloat(totalValue).toFixed(3) + "Ξ`", inline: false },
                                                            { name: "Bid Liquidity", value: "`" + parseFloat(availableLiquidity).toFixed(3) + "Ξ`", inline: true },
                                                            { name: "Bid Count", value: "`" + bidCount + "`", inline: true },
                                                            { name: "Rank", value: "`" + rank + "`", inline: true },
                                                            { name: "Bids", value: "```" + bidsFormatted + "```", inline: false },
                                                            { name: "Links", value: '[magically](https://magically.gg/collection/' + selectedCollection + ") ∙ " + '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + selectedCollection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + selectedCollection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ") ∙ " + '[website](' + collectionWebsite + ")", inline: false },
                                                            { name: "Page", value: "`[1/" + pageIndex + "]`", inline: true },

                                                        )
                                                        .setTimestamp()
                                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })



                                                    if (pageIndex <= 1) { await interaction.editReply({ embeds: [getBlurOneWallet], components: [buttonsRowNo] }); }
                                                    else { await interaction.editReply({ embeds: [getBlurOneWallet], components: [buttonsRow] }); }




                                                    let bidUserDataTable = []
                                                    let obj = {}
                                                    obj.walletName = walletName
                                                    obj.totalValue = totalValue
                                                    obj.availableLiquidity = availableLiquidity
                                                    obj.bidCount = bidCount
                                                    obj.links = "[opensea](https://opensea.io/" + selectedWallet + ") ∙ " + '[blur](https://blur.io/' + selectedWallet + ") ∙ " + '[etherscan](https://etherscan.io/address/' + selectedWallet + ") ∙ " + '[magically](https://magically.gg/portfolio/wallet/' + selectedWallet + ") ∙ " + '[nansen](https://portfolio.nansen.ai/dashboard/' + selectedWallet + ")"
                                                    obj.collectionName = collectionName
                                                    bidUserDataTable.push(obj)


                                                    //On fait le call àbn  la base SQL
                                                    await interactionData.destroy({ where: { authorId: authorId, commandName: "blur-bid", serverId: serverId } })

                                                    await interactionData.create({

                                                        authorId: authorId,
                                                        authorName: authorName,
                                                        serverId: serverId,
                                                        commandName: "blur-bid",
                                                        interactionId: interaction.id,
                                                        walletAddress: selectedWallet.toString(),
                                                        walletCategory: "wallet & collection",
                                                        embed1: JSON.stringify(sortedAuthorBid),
                                                        embed2: JSON.stringify(bidUserDataTable),
                                                        embed3: "N/A",
                                                        pageIndex: pageIndex.toString(),
                                                        actualPage: "1",
                                                        walletName: "N/A",
                                                        selecedTimestamp: "N/A",
                                                        selectedCollection: "N/A",
                                                        collectionSlug: "N/A",
                                                        collectionBanner: "N/A",
                                                        avgDeriskPrice: "N/A",
                                                        floorPrice: "N/A",
                                                        lowerMarketlace: "N/A",
                                                        collectionName: "N/A",
                                                        buyCount: "N/A",
                                                        soldCount: "N/A",
                                                        remaining: "N/A",
                                                        avgBuy: "N/A",
                                                        avgSold: "N/A",
                                                        realisedProfit: "N/A",
                                                        potentialProfit: "N/A",
                                                        roi: "N/A",
                                                        visualTitle: "N/A",
                                                        userAvatar: "N/A",
                                                        nbMembersInvolved: "N/A",
                                                        totalTradeCount: "N/A",
                                                    })

                                                })


                                            })

                                    } else if (selectedWallet.toLowerCase() == "all") {


                                        const allWalletsAuthor = await wallets.findAll({ where: { authorId: authorId, walletCategory: "eth" } })
                                        let allWalletsAuthorTable = allWalletsAuthor.map(wallet => wallet.walletAddress.toLowerCase());
                                        const walletCount = allWalletsAuthorTable.length

                                        await sdk.getCollectionsV5({ id: selectedCollection, accept: '*/*', includeTopBid: 'false', includeOwnerCount: 'false', includeSalesCount: 'false' })
                                            .then(async ({ data: collectionData }) => {

                                                let collectionName = collectionData.collections[0].name
                                                let collectionTwitter = collectionData.collections[0].twitterUsername
                                                let collectionWebsite = collectionData.collections[0].externalUrl
                                                let collectionSlug = collectionData.collections[0].slug
                                                let rank = collectionData.collections[0].rank.allTime



                                                if (allWalletsAuthorTable.length > 0) {


                                                    // Premier Call API Reservoir : Stats et infos sur les bids
                                                    let dataTable = []
                                                    for (const selectedWallet of allWalletsAuthorTable) {

                                                        await sdk3.getOrdersBidsV6({
                                                            maker: selectedWallet,
                                                            sources: 'blur.io',
                                                            includeCriteriaMetadata: 'true',
                                                            includeRawData: 'true',
                                                            includeDepth: 'true',
                                                            accept: '*/*'
                                                        }).then(async ({ data: bidData }) => {

                                                            const dataSingleWallet = bidData.orders

                                                            for (const obj of dataSingleWallet) {
                                                                dataTable.push(obj)
                                                            }

                                                        })

                                                    }



                                                    let bidsFormatted = "No bids found for this addresses on this collection    "
                                                    let availableLiquidity = 0
                                                    let bidCount = 0
                                                    let totalValue = 0
                                                    let pageIndex = "1"

                                                    let sortedAuthorBid = []



                                                    if (dataTable.length > 0) {

                                                        sortedAuthorBid = dataTable.filter((item) => item.side === 'buy' && item.contract.toLowerCase() == selectedCollection.toLowerCase());

                                                        sortedAuthorBid.sort((a, b) => {

                                                            let multiplicationA
                                                            let multiplicationB



                                                            multiplicationA = a.price.amount.decimal;
                                                            multiplicationB = b.price.amount.decimal;

                                                            if (multiplicationA == multiplicationB) {

                                                                multiplicationA = a.quantityRemaining * a.price.amount.decimal;
                                                                multiplicationB = b.quantityRemaining * b.price.amount.decimal;


                                                            }
                                                            // Pour trier par ordre décroissant, utilisez la différence b - a
                                                            return multiplicationB - multiplicationA;
                                                        });

                                                        console.log(sortedAuthorBid)

                                                        bidCount = sortedAuthorBid.reduce((acc, obj) => acc + obj.quantityRemaining, 0);

                                                        availableLiquidity = sortedAuthorBid.reduce((max, obj) => {
                                                            const value = obj.quantityRemaining * obj.price.amount.decimal;
                                                            return value > max ? value : max;
                                                        }, 0);

                                                        totalValue = sortedAuthorBid.reduce((acc, obj) => {
                                                            const value = obj.quantityRemaining * obj.price.amount.decimal;
                                                            return acc + value;
                                                        }, 0);




                                                        let bidTable = sortedAuthorBid.slice(0, 16);

                                                        bidsFormatted = "Collection               Floor    Price   Bid      Total\n\n"

                                                        for (const bid of bidTable) {


                                                            let name = await reduceTextCurrent(collectionData.collections[0].name, 22)
                                                            let floor = collectionData.collections[0].floorAsk.price.amount.decimal
                                                            let price = bid.price.amount.decimal
                                                            let bidCount = bid.quantityRemaining
                                                            let totalValue = bid.quantityRemaining * bid.price.amount.decimal



                                                            let part1 = name
                                                            let part2 = parseFloat(floor).toFixed(2) + "Ξ"
                                                            let part3 = parseFloat(price).toFixed(2) + "Ξ"
                                                            let part4 = bidCount.toString()
                                                            let part5 = parseFloat(totalValue).toFixed(2) + "Ξ\n"
                                                            // let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)

                                                            let spaceSize = 30 - part2.length - name.length
                                                            let spaceLenght = ""
                                                            for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

                                                            let spaceSize2 = 9 - part3.length
                                                            let spaceLenght2 = ""
                                                            for (let i = 0; i < spaceSize2; i++) { spaceLenght2 += " " }

                                                            let spaceSize3 = 6 - part4.length
                                                            let spaceLenght3 = ""
                                                            for (let i = 0; i < spaceSize3; i++) { spaceLenght3 += " " }

                                                            let spaceSize4 = 12 - part5.length
                                                            let spaceLenght4 = ""
                                                            for (let i = 0; i < spaceSize4; i++) { spaceLenght4 += " " }


                                                            bidsFormatted += part1 + spaceLenght + part2 + spaceLenght2 + part3 + spaceLenght3 + part4 + spaceLenght4 + part5


                                                        };



                                                        const bidRowCount = sortedAuthorBid.length
                                                        const itemsPerPage = 16; // Nombre d'objets par page
                                                        pageIndex = Math.ceil(bidRowCount / itemsPerPage);


                                                    }

                                                    if (pageIndex) { pageIndex = "1" }

                                                    const getBlurOneWallet = new EmbedBuilder().setColor("#060A8F")
                                                        .setTitle(collectionName + "'s bids")
                                                        .setDescription(">>> Displaying the Blur bid metrics of all your wallets`(" + walletCount + ")` on `" + collectionName + "`.")
                                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                                        .addFields(
                                                            { name: "Total Value", value: "`" + parseFloat(totalValue).toFixed(3) + "Ξ`", inline: false },
                                                            { name: "Bid Liquidity", value: "`" + parseFloat(availableLiquidity).toFixed(3) + "Ξ`", inline: true },
                                                            { name: "Bid Count", value: "`" + bidCount + "`", inline: true },
                                                            { name: "Rank", value: "`" + rank + "`", inline: true },
                                                            { name: "Bids", value: "```" + bidsFormatted + "```", inline: false },
                                                            { name: "Links", value: '[magically](https://magically.gg/collection/' + selectedCollection + ") ∙ " + '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + selectedCollection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + selectedCollection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ") ∙ " + '[website](' + collectionWebsite + ")", inline: false },
                                                            { name: "Page", value: "`[1/" + pageIndex + "]`", inline: true },

                                                        )
                                                        .setTimestamp()
                                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })



                                                    // if (pageIndex <= 1) { await interaction.editReply({ embeds: [getBlurOneWallet], components: [buttonsRowNo] }); }
                                                    // else { await interaction.editReply({ embeds: [getBlurOneWallet], components: [buttonsRow] }); }

                                                    /// TEMPORAIRE
                                                    await interaction.editReply({ embeds: [getBlurOneWallet], components: [buttonsRowNo] })


                                                    let bidUserDataTable = []
                                                    let obj = {}
                                                    obj.walletName = walletCount
                                                    obj.totalValue = totalValue
                                                    obj.availableLiquidity = availableLiquidity
                                                    obj.bidCount = bidCount
                                                    obj.links = "[opensea](https://opensea.io/" + selectedWallet + ") ∙ " + '[blur](https://blur.io/' + selectedWallet + ") ∙ " + '[etherscan](https://etherscan.io/address/' + selectedWallet + ") ∙ " + '[magically](https://magically.gg/portfolio/wallet/' + selectedWallet + ") ∙ " + '[nansen](https://portfolio.nansen.ai/dashboard/' + selectedWallet + ")"
                                                    bidUserDataTable.push(obj)


                                                    //On fait le call àbn  la base SQL
                                                    await interactionData.destroy({ where: { authorId: authorId, commandName: "blur-bid", serverId: serverId } })

                                                    await interactionData.create({

                                                        authorId: authorId,
                                                        authorName: authorName,
                                                        serverId: serverId,
                                                        commandName: "blur-bid",
                                                        interactionId: interaction.id,
                                                        walletAddress: selectedWallet.toString(),
                                                        walletCategory: "wallet & collection",
                                                        embed1: JSON.stringify(sortedAuthorBid),
                                                        embed2: JSON.stringify(bidUserDataTable),
                                                        embed3: "N/A",
                                                        pageIndex: pageIndex.toString(),
                                                        actualPage: "1",
                                                        walletName: "N/A",
                                                        selecedTimestamp: "N/A",
                                                        selectedCollection: "N/A",
                                                        collectionSlug: "N/A",
                                                        collectionBanner: "N/A",
                                                        avgDeriskPrice: "N/A",
                                                        floorPrice: "N/A",
                                                        lowerMarketlace: "N/A",
                                                        collectionName: "N/A",
                                                        buyCount: "N/A",
                                                        soldCount: "N/A",
                                                        remaining: "N/A",
                                                        avgBuy: "N/A",
                                                        avgSold: "N/A",
                                                        realisedProfit: "N/A",
                                                        potentialProfit: "N/A",
                                                        roi: "N/A",
                                                        visualTitle: "N/A",
                                                        userAvatar: "N/A",
                                                        nbMembersInvolved: "N/A",
                                                        totalTradeCount: "N/A",
                                                    })




                                                } else {

                                                    const setwalletErrorEmbed = new EmbedBuilder().setColor("#060A8F")
                                                        .setTitle(`No wallet`)
                                                        .setDescription("Aura can't analyze your wallet's data because you don't have any wallet registered in your portfolio. Please use `/wallet set` or `/wallet raw` to register a wallet in your portfolio then try again.")
                                                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                                        .setTimestamp()
                                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                                    await interaction.editReply({ embeds: [setwalletErrorEmbed] });





                                                }
                                            })

                                    }

                                }
                            }
                        } else if (interaction.options.getSubcommand() === 'holders') {
                            console.log("ici")



                            const buttonsRow = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('blurholderfirst-button')
                                        .setLabel('first page')
                                        .setStyle(2)
                                        .setDisabled(true),
                                    new ButtonBuilder()
                                        .setCustomId('blurholderprevious-button')
                                        .setLabel('previous page')
                                        .setStyle(2)
                                        .setDisabled(true),
                                    new ButtonBuilder()
                                        .setCustomId('blurholdernext-button')
                                        .setLabel('next page')
                                        .setStyle(2),
                                    new ButtonBuilder()
                                        .setCustomId('blurholderlast-button')
                                        .setLabel('last page')
                                        .setStyle(2),
                                );

                            const buttonsRowNo = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('blurholderfirst-button')
                                        .setLabel('first page')
                                        .setStyle(2)
                                        .setDisabled(true),
                                    new ButtonBuilder()
                                        .setCustomId('blurholderprevious-button')
                                        .setLabel('previous page')
                                        .setStyle(2)
                                        .setDisabled(true),
                                    new ButtonBuilder()
                                        .setCustomId('blurholdernext-button')
                                        .setLabel('next page')
                                        .setStyle(2)
                                        .setDisabled(true),
                                    new ButtonBuilder()
                                        .setCustomId('blurholderlast-button')
                                        .setLabel('last page')
                                        .setStyle(2)
                                        .setDisabled(true),
                                );




                            const selectedCollection = interaction.options.getString("collection");

                            const walletAddressName = await wallets.findAll({ where: { authorId: authorId, walletCategory: "eth" } });
                            const walletAddresses = walletAddressName.map((wallet) => wallet.dataValues.walletAddress.toLowerCase());


                            let holdersList = []
                            let holdersTable = []
                            let collectionName = "Blur"
                            let supply = "10000"
                            let pageIndex

                            let collectionTwitter = ""
                            let collectionWebsite = ""
                            let collectionSlug = ""
                            let deployer = ""

                            let top10Holders = 0
                            let top25Holders = 0
                            let top50Holders = 0

                            let holdersFormatted = ""


                            const { data: collectionInfos } = await alchemy2.getContractMetadata({
                                contractAddress: selectedCollection,
                                apiKey: alchemyApiKey
                            })


                            supply = collectionInfos.contractMetadata.totalSupply
                            collectionName = collectionInfos.contractMetadata.openSea.collectionName
                            collectionTwitter = collectionInfos.contractMetadata.openSea.twitterUsername
                            collectionWebsite = collectionInfos.contractMetadata.openSea.externalUrl
                            collectionSlug = collectionInfos.contractMetadata.openSea.collectionSlug
                            if (collectionInfos.contractMetadata.contractDeployer) { deployer = collectionInfos.contractMetadata.contractDeployer }

                            console.log(collectionInfos.contractMetadata.contractDeployer)




                            // Premier Call API Reservoir : Stats et infos sur la collection
                            await sdk3.getOwnersV2({ contract: selectedCollection, limit: '500', accept: '*/*' })
                                .then(async ({ data: collectionHolders }) => {


                                    holdersList = await collectionHolders.owners


                                    if (holdersList.length > 0) {

                                        let index = 0

                                        holdersFormatted = "Owner                                           # Held\n\n"

                                        for (const holders of holdersList) {



                                            let address = holders.address
                                            let tokenCount = holders.ownership.tokenCount
                                            let supplyPercentage = (tokenCount / supply) * 100;
                                            let isUser = "no"
                                            let isDeployer = "no"

                                            if (walletAddresses.includes(address.toLowerCase())) { isUser = "yes" }
                                            if (address.toLowerCase() == deployer.toLowerCase()) { isDeployer = "yes" }


                                            if (index <= 15) {


                                                let lignMaxSize = 55
                                                let leftPartNfts = formatWallet(address)
                                                if (isUser.toLowerCase() == "yes") { leftPartNfts += " (you)" }
                                                if (isDeployer.toLowerCase() == "yes") { leftPartNfts += " (deployer)" }

                                                let rightPartNfts = tokenCount + " (" + parseFloat(supplyPercentage).toFixed(2) + "%)\n"
                                                let leftPartNFTsLenght = leftPartNfts.length
                                                let rightPartNftsLenght = rightPartNfts.length
                                                let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                                                let spaceLenght = ""
                                                for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }


                                                holdersFormatted += leftPartNfts + spaceLenght + rightPartNfts


                                            }


                                            if (index <= 9) { top10Holders += parseInt(tokenCount) }
                                            if (index <= 24) { top25Holders += parseInt(tokenCount) }
                                            if (index <= 49) { top50Holders += parseInt(tokenCount) }


                                            let obj = {}

                                            obj.address = address
                                            obj.tokenCount = tokenCount
                                            obj.supplyPercentage = supplyPercentage
                                            obj.isUser = isUser
                                            obj.isDeployer = isDeployer
                                            holdersTable.push(obj)

                                            index++


                                        }




                                        const bidRowCount = holdersList.length
                                        const itemsPerPage = 16; // Nombre d'objets par page
                                        pageIndex = Math.ceil(bidRowCount / itemsPerPage);



                                        const getBlurOneWallet = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle(collectionName + "'s holders")
                                            .setDescription(">>> Displaying the top holders of `" + collectionName + "`.")
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .addFields(
                                                { name: " ", value: " ", inline: false },
                                                { name: "Supply", value: "`" + supply + "`", inline: false },
                                                { name: "Top 10 Holders", value: "`" + top10Holders + " (" + parseFloat((top10Holders / supply) * 100).toFixed(2) + "%)`", inline: true },
                                                { name: "Top 25 Holders", value: "`" + top25Holders + " (" + parseFloat((top25Holders / supply) * 100).toFixed(2) + "%)`", inline: true },
                                                { name: "Top 50 Holders", value: "`" + top50Holders + " (" + parseFloat((top50Holders / supply) * 100).toFixed(2) + "%)`", inline: true },
                                                { name: "Holders:", value: "```" + holdersFormatted + "```", inline: false },
                                                { name: "Links", value: '[magically](https://magically.gg/collection/' + selectedCollection + ") ∙ " + '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + selectedCollection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + selectedCollection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ") ∙ " + '[website](' + collectionWebsite + ")", inline: false },
                                                { name: "Page", value: "`[1/" + pageIndex + "]`", inline: true },

                                            )
                                            .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                                        if (pageIndex <= 1) { await interaction.editReply({ embeds: [getBlurOneWallet], components: [buttonsRowNo] }); }
                                        else { await interaction.editReply({ embeds: [getBlurOneWallet], components: [buttonsRow] }); }



                                        let holderDataTable = []
                                        let obj = {}
                                        obj.collectionName = collectionName
                                        obj.supply = supply
                                        obj.top10Holders = top10Holders + " (" + parseFloat((top10Holders / supply) * 100).toFixed(2) + "%)"
                                        obj.top25Holders = top25Holders + " (" + parseFloat((top25Holders / supply) * 100).toFixed(2) + "%)"
                                        obj.top50Holders = top50Holders + " (" + parseFloat((top50Holders / supply) * 100).toFixed(2) + "%)"
                                        obj.links = '[magically](https://magically.gg/collection/' + selectedCollection + ") ∙ " + '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + selectedCollection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + selectedCollection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ") ∙ " + '[website](' + collectionWebsite + ")"
                                        holderDataTable.push(obj)


                                        //On fait le call àbn  la base SQL
                                        await interactionData.destroy({ where: { authorId: authorId, commandName: "blur-holder", serverId: serverId } })

                                        await interactionData.create({

                                            authorId: authorId,
                                            authorName: authorName,
                                            serverId: serverId,
                                            commandName: "blur-holder",
                                            interactionId: interaction.id,
                                            walletAddress: "N/A",
                                            walletCategory: "N/A",
                                            embed1: JSON.stringify(holdersTable),
                                            embed2: JSON.stringify(holderDataTable),
                                            embed3: "N/A",
                                            pageIndex: pageIndex.toString(),
                                            actualPage: "1",
                                            walletName: "N/A",
                                            selecedTimestamp: "N/A",
                                            selectedCollection: "N/A",
                                            collectionSlug: "N/A",
                                            collectionBanner: "N/A",
                                            avgDeriskPrice: "N/A",
                                            floorPrice: "N/A",
                                            lowerMarketlace: "N/A",
                                            collectionName: "N/A",
                                            buyCount: "N/A",
                                            soldCount: "N/A",
                                            remaining: "N/A",
                                            avgBuy: "N/A",
                                            avgSold: "N/A",
                                            realisedProfit: "N/A",
                                            potentialProfit: "N/A",
                                            roi: "N/A",
                                            visualTitle: "N/A",
                                            userAvatar: "N/A",
                                            nbMembersInvolved: "N/A",
                                            totalTradeCount: "N/A",
                                        })




                                    } else {

                                        holdersFormatted = "No holders found for this collection                "
                                        collectionName = "Blur"

                                        const getBlurOneWallet = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle(collectionName + "'s holders")
                                            .setDescription(">>> Displaying the top holders of `" + collectionName + "`.")
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .addFields(
                                                { name: " ", value: " ", inline: false },
                                                { name: "Supply", value: "`Not found`", inline: false },
                                                { name: "Top 10 Holders", value: "`0 (0.00%)`", inline: true },
                                                { name: "Top 25 Holders", value: "`0 (0.00%)`", inline: true },
                                                { name: "Top 50 Holders", value: "`0 (0.00%)`", inline: true },
                                                { name: "Holders:", value: "```" + holdersFormatted + "```", inline: false },
                                                { name: "Page", value: "`[1/1]`", inline: true },

                                            )
                                            .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })



                                        // if (pageIndex <= 1) { await interaction.editReply({ embeds: [getBlurOneWallet], components: [buttonsRowNo] }); }
                                        // else { await interaction.editReply({ embeds: [getBlurOneWallet], components: [buttonsRow] }); }

                                        /// TEMPORAIRE
                                        await interaction.editReply({ embeds: [getBlurOneWallet], components: [buttonsRowNo] })



                                    }





                                })



                        } else if (interaction.options.getSubcommand() === 'lends') {


                            // const selectedCollection = interaction.options.getString("collection");

                            // const contractAddressBlur = "0x29469395eAf6f95920E59F858042f0e28D98a20B"
                            // const contractAbiBlur = require("../../../blurcontract.json")



                            // const myContract = new web3.eth.Contract(contractAbiBlur, contractAddressBlur);


                            // const eventName = 'borrow'; // Nom de l'événement que vous souhaitez écouter
                            // const options = {
                            //     fromBlock: 17847803, // Numéro de bloc à partir duquel vous souhaitez commencer
                            //     toBlock: 'latest', // Numéro de bloc jusqu'auquel vous souhaitez récupérer les événements
                            //    // topics: ['0x558a9295c62e9e1b12a21c8fe816f4816a2e0269a53157edbfa16017b11b9ac9'], // Tableau de topics hexadécimaux pour filtrer les événements
                            // };
                            // console.log("ici")

                            // //console.log( myContract.getPastEvents(eventName, options))


                            // await myContract.getPastEvents(eventName, options)
                            //     .then(events => {

                            //         console.log("ici")

                            //         console.log("ici");
                            //         console.log(events[0]);

                            //     })
                            //     .catch(error => {

                            //         console.error(error);

                            //     });


                            const availableInTheNearFuture = new EmbedBuilder().setColor("#060A8F")
                                .setTitle(`${authorName}'s profit`)
                                .setDescription("The command you try to use is currently being built and will be available in the near future. You can still use all the other commands in the meantime.")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setTimestamp()
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.editReply({ embeds: [availableInTheNearFuture] });





                        }
                    } else if (!member.roles.cache.has(communityMemberRoleId)) {



                        const notMember = new EmbedBuilder().setColor("#060A8F")
                            .setTitle(`Bot Access`)
                            .setDescription(">>> Showing access data")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .addFields(
                                { name: " ", value: " ", inline: false },
                                { name: "Statut", value: "`Access Denied ❌`", inline: true },
                                { name: "Required Role", value: "<@&" + communityMemberRoleId + ">", inline: true },
                                { name: "Problem Detected", value: "Your access to the bot has been denied. You can only use the bot if you have the required role in this community. If you usually have access to the bot, make sure you're in the right community or contact an admin.", inline: false },
                            )
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                        await interaction.editReply({ embeds: [notMember] });


                    }

                } else if (botPowerStatut.toLowerCase() === "off") {


                    const botOff = new EmbedBuilder().setColor("#060A8F")
                        .setTitle(`Bot statut`)
                        .setDescription(">>> Showing the bot statut")
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .addFields(
                            { name: 'Global Statut', value: "`Inactive 🔴`", inline: true },
                            { name: 'Commands', value: "`Not available`", inline: true },
                            { name: "Problem Detected", value: "The bot is currently inactive in this community. The community's administrator are the only who are able to switch the bot on, contact them for any inquiries.", inline: false },
                        )
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                    await interaction.editReply({ embeds: [botOff] });




                }

            } else {


                const botOff = new EmbedBuilder().setColor("#060A8F")
                    .setTitle(`Bot Access`)
                    .setDescription(">>> Showing the community's bot access")
                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .addFields(
                        { name: 'Access Statut', value: "`Denied 🔴`", inline: true },
                        { name: 'Commands', value: "`Not available`", inline: true },
                        { name: "Problem Detected", value: "The bot access is currently inactive in this community. The community's administrator are the only one who can make it active or not, contact them for any inquiries.", inline: false },
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                await interaction.editReply({ embeds: [botOff] });



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
            //     let reportCommand = "/blur"

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


            //     await interaction.editReply({ embeds: [errorAnswerUser], ephemeral: true });


            // }


        } else if (interaction.guildId == null) {

            const errorAnswerUser = new EmbedBuilder().setColor("#060A8F")
                .setTitle("Aura")
                .setDescription(`Hey ${interaction.user.username}, we hope you're doing well !\n\nAlthough this may be possible in the future, Aura cannot be used in DM at the moment. If you want to have access to the bot, go here: <#1108757700885622784>.\n\nIf you have any questions, don't hesitate to contact one of our team member, or directly on Discord here : <#1121110417368956958>.\n\nHave a nice day 👑`)
                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                .setTimestamp()
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


            await interaction.reply({ embeds: [errorAnswerUser], ephemeral: true });



        }


    }
}