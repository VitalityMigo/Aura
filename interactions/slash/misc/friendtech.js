/**
 * @file Sample setwallet command with slash command.
 * @author VitalityMigo
 */

// On définit des constantes qui serviront dans l'ensemble de la commande
const { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { profileData, accessSql, apimonitorsql, wallets, reportsql, adminsql, usersql, interactionData, watchlistSql, exe_friendTech, infra_friendTech, sequelize } = require('../../../events/database');

const reduceText = require("../../../functions/reducetext")
const getTwitterUserInfo = require("../../../functions/twitteruserinfo")
const getTimeAgo = require("../../../functions/timeago")
const countEmojis = require("../../../functions/isemoji")

const moment = require("moment")
const decrypt = require("../../../functions/decrypt")



//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const etherscanApiKey = process.env.etherscanApiKey
const friendtechApiKey = process.env.friendtechApiKey


const friendtechHeaders = {
    'Authorization': friendtechApiKey, // Remplacez VOTRE_TOKEN par le token d'authentification
    // Autres en-têtes si nécessaire
};


const axios = require('axios')




function removeAtSymbol(word) {
    if (word.startsWith('@')) {
        return word.slice(1); // Supprime le "@" en prenant une sous-chaîne à partir du deuxième caractère.
    } else {
        return word; // Retourne le mot tel quel s'il n'y a pas de "@".
    }
}






const buttonsRow = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('friendtechprofitvisual-button')
            .setLabel('visual')
            .setStyle(2)
    );




module.exports = {
    data: new SlashCommandBuilder()
        .setName("friendtech")
        .setDescription("Display various metrics about friend.tech")
        .addSubcommand(subcommand =>
            subcommand
                .setName("user")
                .setDescription("Get various metrics about a friend.tech user")
                .addStringOption(option =>
                    option
                        .setName("twitter")
                        .setDescription("The user's twitter username (i.e vitalitymigo")
                        .setRequired(true)

                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("portfolio")
                .setDescription("Display various metrics about a friend.tech user's portfolio")
                .addStringOption(option =>
                    option
                        .setName("twitter")
                        .setDescription("The user's twitter username (i.e vitalitymigo")
                        .setRequired(true)

                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("trades")
                .setDescription("Display the recent trades of a Friend.tech share")
                .addStringOption(option =>
                    option
                        .setName("twitter")
                        .setDescription("The user's twitter username (i.e vitalitymigo")
                        .setRequired(true)

                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("stats")
                .setDescription("Display global friend.tech stats and metrics")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("holders")
                .setDescription("Display a friend.tech share holders")
                .addStringOption(option =>
                    option
                        .setName("twitter")
                        .setDescription("The user's twitter username (i.e vitalitymigo")
                        .setRequired(true)

                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("profit")
                .setDescription("Display your friend.tech profits")
                .addStringOption(option =>
                    option
                        .setName("twitter")
                        .setDescription("The user's twitter username (i.e vitalitymigo")
                        .setRequired(true)

                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("wallet")
                .setDescription("Manage your Friend.tech buy and sell wallet")

        ),







    // Début de l'éxecution de la commande
    async execute(interaction) {


        if (interaction.guildId != null) {



            //Récupérer informations de l'utilisateur de la commande
            let authorId = interaction.user.id;
            let authorName = interaction.user.username;
            let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
            let serverId = interaction.member.guild.id
            let member = interaction.member;
            let botId = interaction.applicationId



            try {

                const botAdmins = await adminsql.findOne({ where: { botId: botId } })
                const botGlobalState = botAdmins.dataValues.botState

                let communityMemberRoleId = ""
                let communityAdminRoleId = ""
                let botPowerStatut = ""
                let communityStatut = ""
                let accessTier = ""

                //Récupère info varibale sur le bot et le serveur
                const communityRolePerms = await accessSql.findOne({ where: { serverId: serverId } })
                if (communityRolePerms != null) {
                    communityMemberRoleId = communityRolePerms.dataValues.memberRoleId
                    communityAdminRoleId = communityRolePerms.dataValues.adminRoleId
                    botPowerStatut = communityRolePerms.dataValues.actualPower
                    communityStatut = communityRolePerms.dataValues.statut
                    accessTier = communityRolePerms.dataValues.accessTier
                }



                //Récupère régagle de privé/ou pas de l'utilisateur
                const authorProfile = await profileData.findOne({ where: { authorId: authorId } })

                if (authorProfile === null) { await interaction.deferReply(); } else {
                    const authorPrivacyMode = authorProfile.dataValues.privacyMode

                    if (authorPrivacyMode.toLowerCase() === "private") { await interaction.deferReply({ ephemeral: true }); }
                    if (authorPrivacyMode.toLowerCase() === "public") { await interaction.deferReply(); }
                }



                //Checkpoint
                console.log("// Step 1 : Initialization - Executed ✅")


                if (botGlobalState.toLowerCase() === "on") {


                    if (communityStatut.toLowerCase() === "active" || communityStatut == "") {

                        if (accessTier.toLowerCase() == "a-tier" || accessTier.toLowerCase() == "s-tier") {

                            if (member.roles.cache.has(communityMemberRoleId)) {

                                //Checkpoint
                                console.log("// Step 2 : Authorization - Executed ✅")



                                //On enregistre le user si il est pas encore dans la database
                                const timeStamp1 = Date.now();
                                const actualTimestamp1 = parseFloat(timeStamp1 / 1000).toFixed(0)
                                const isUser = await usersql.findOne({ where: { userId: authorId, serverId: serverId } })
                                if (isUser == null) { await usersql.create({ userId: authorId, userName: authorName, userAvatar: userAvatar, serverId: serverId, timestamp: actualTimestamp1 }) }


                                if (interaction.options.getSubcommand() === 'user') {

                                  


                                    let id = ""
                                    let address = ""
                                    let twitterUsername = ""
                                    let twitterName = ""
                                    let twitterPfp = ""
                                    let twitterUserId = ""

                                    let holderCount = 0
                                    let shareSupply = 0
                                    let price = 0
                                    let totalFeesCollected = 0
                                    let marketCap = 0

                                    let holdersFormattedEmbeds = ""
                                    let uniqueHolders = 0

                                    let lastTrade = 0
                                    let lastMessage = 0
                                    let lastOnlineTimestamp = 0

                                    let airdropTier = "UNRANKED"
                                    let airdropPoints = 0

                                    let volume6h = 0
                                    let volume1d = 0
                                    let volume7d = 0

                                    let tradersFormatted = ""

                                    let followers = 0
                                    let following = 0
                                    let created = 0

                                    let userAddress = ""

                                    let findUser = []
                                    let isMatch = true
                                    let isExactMatch = true



                                    const usernameProvided = interaction.options.getString("twitter").toLowerCase()

                                    const givenUsername = removeAtSymbol(usernameProvided)



                                    try {
                                        findUser = await axios.get('https://prod-api.kosetto.com/search/users?username=' + givenUsername, { headers: friendtechHeaders })

                                    } catch (error) {
                                        isMatch = false
                                    }


                                    if (isMatch == true) {


                                        const user = findUser.data.users.find((user) => user.twitterUsername.toLowerCase() == givenUsername.toLowerCase());


                                        if (user) {


                                            userAddress = user.address







                                            try {

                                                // Prix de l'ETH
                                                const etherscanTokenPrice = await axios.get('https://api.etherscan.io/api?module=stats&action=ethprice&apikey=' + etherscanApiKey)
                                                const ethUsdPrice = etherscanTokenPrice.data.result.ethusd


                                                const userInfoCall = await axios.get("https://prod-api.kosetto.com/users/" + userAddress)



                                                address = userInfoCall.data.address
                                                id = userInfoCall.data.id
                                                twitterUsername = userInfoCall.data.twitterUsername
                                                twitterName = userInfoCall.data.twitterName
                                                twitterPfp = userInfoCall.data.twitterPfpUrl
                                                twitterUserId = userInfoCall.data.twitterUserId
                                                lastOnlineTimestamp = parseFloat(userInfoCall.data.lastOnline / 1000).toFixed(0)
                                                lastMessage = parseFloat(userInfoCall.data.lastMessageTime / 1000).toFixed(0)
                                                holderCount = userInfoCall.data.holderCount
                                                shareSupply = userInfoCall.data.shareSupply
                                                price = userInfoCall.data.displayPrice / 10 ** 18
                                                totalFeesCollected = userInfoCall.data.lifetimeFeesCollectedInWei / 10 ** 18



                                                const twitterInfos = await getTwitterUserInfo(twitterUsername)
                                                followers = twitterInfos.followers_count
                                                following = twitterInfos.friends_count

                                                const created = Math.floor(((new Date(twitterInfos.created_at)).getTime() / 1000))

                                                // Call holders
                                                const holderInfoCall = await axios.get("https://prod-api.kosetto.com/users/" + userAddress + "/token/holders")


                                                // On construit la table d'holders
                                                let index = 0

                                                for (const holders of holderInfoCall.data.users) {

                                                    index++

                                                    if (index <= 10) {

                                                        let holderName = holders.twitterUsername
                                                        let holderBalance = holders.balance
                                                        let holderValue = holderBalance * price
                                                        let holderRatio = parseFloat((holderBalance / shareSupply) * 100).toFixed(2)


                                                        let part1 = "`" + reduceText(holderName, 30)
                                                        let part2 = parseFloat(holderValue).toFixed(3) + "Ξ"
                                                        let part3 = holderBalance + " (" + holderRatio + "%)`\n"
                                                        // let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)

                                                        let spaceSize = 38 - (part2).length - part1.length
                                                        let spaceLenght = ""
                                                        for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

                                                        let spaceSize2 = 19 - (part3).length
                                                        let spaceLenght2 = ""
                                                        for (let i = 0; i < spaceSize2; i++) { spaceLenght2 += " " }




                                                        holdersFormattedEmbeds += part1 + spaceLenght + part2 + spaceLenght2 + part3

                                                    }
                                                }






                                                // trade de l'auteur
                                                const tradeInfoCall = await axios.get(" https://prod-api.kosetto.com/users/" + userAddress + "/trade-activity")

                                                lastTrade = parseFloat(tradeInfoCall.data.users[0].createdAt / 1000).toFixed(0)



                                                // On construit la table d'activité
                                                let index2 = 0

                                                for (const trade of tradeInfoCall.data.users) {

                                                    index2++

                                                    if (index2 <= 6) {

                                                        let username = trade.twitterUsername
                                                        let name = trade.twitterName

                                                        let amount = trade.shareAmount
                                                        let price = parseFloat(trade.ethAmount / 10 ** 18).toFixed(3)
                                                        let time = parseFloat(trade.createdAt / 1000).toFixed(0)
                                                        let isBuy = trade.isBuy

                                                        let action = "🟢 Bought "
                                                        if (isBuy == false) { action = "🔴 Sold " }

                                                        tradersFormatted += "`" + action + amount + "` [" + reduceText(name, 18) + "](https://twitter.com/" + username + ") `for " + price + "Ξ` ∙ <t:" + time + ":R>\n"

                                                    }
                                                }





                                                //airdrop stats de l'auteur
                                                const airdropInfos = await axios.get(" https://prod-api.kosetto.com/points/" + userAddress)


                                                airdropTier = airdropInfos.data.tier.toUpperCase()
                                                airdropPoints = airdropInfos.data.totalPoints




                                                // Calcul des dernières valeurs
                                                marketCap = price * shareSupply
                                                uniqueHolders = (holderCount / shareSupply) * 100;

                                                if (holdersFormattedEmbeds == "") { holdersFormattedEmbeds = "```No holders found for this share.                         ```" }
                                                if (tradersFormatted == "") { tradersFormatted = "```No recent trade found for this share.                    ```" }


                                                const buttonRow = new ActionRowBuilder()
                                                .addComponents(
                                                    new ButtonBuilder()
                                                        .setCustomId('button_friendtech_exec_buy_' + userAddress)
                                                        .setLabel('buy')
                                                        .setStyle(3),
                                                   
                                                )



                                                const userFTEmbed = new EmbedBuilder().setColor("#060A8F")
                                                    .setTitle(twitterName)
                                                    .setDescription(">>> Displaying the friend.tech metrics of `" + twitterName + "`.")
                                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                                    .setThumbnail(twitterPfp)
                                                    .setTimestamp()
                                                    .addFields(
                                                        { name: "Name", value: "`" + twitterName + "`", inline: true },
                                                        { name: "Username", value: "`" + twitterUsername + "`", inline: true },
                                                        { name: " ", value: " ", inline: true },
                                                        { name: "Followers", value: "`" + followers + "`", inline: true },
                                                        { name: "Following", value: "`" + following + "`", inline: true },
                                                        { name: "Created", value: "<t:" + created + ":R>", inline: true },
                                                        { name: " ", value: " ", inline: false },
                                                        { name: "Price", value: "`" + parseFloat(price).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(price * ethUsdPrice).toFixed(0)) + "$)`", inline: true },
                                                        { name: "Market Cap", value: "`" + parseFloat(marketCap).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(marketCap * ethUsdPrice).toFixed(0)) + "$)`", inline: true },
                                                        { name: " ", value: " ", inline: true },
                                                        { name: "Share Supply", value: "`" + shareSupply + "`", inline: true },
                                                        { name: "Holders", value: "`" + holderCount + "`", inline: true },
                                                        { name: "Unique Holders", value: "`" + parseFloat(uniqueHolders).toFixed(1) + "%`", inline: true },
                                                        { name: "Airdrop Pts.", value: "`" + airdropPoints + "`", inline: true },
                                                        { name: "Airdrop Tier", value: "`" + airdropTier + "`", inline: true },
                                                        { name: "Collected Fees", value: "`" + parseFloat(totalFeesCollected).toFixed(3) + "Ξ`", inline: true },
                                                        { name: " ", value: " ", inline: false },
                                                        { name: "Last Online", value: "<t:" + lastOnlineTimestamp + ":R>", inline: true },
                                                        { name: "Last Message", value: "<t:" + lastMessage + ":R>", inline: true },
                                                        { name: "Last Trade", value: "<t:" + lastTrade + ":R>", inline: true },
                                                        { name: "Holders:", value: holdersFormattedEmbeds, inline: false },
                                                        { name: "Last Trades:", value: tradersFormatted, inline: false },
                                                        { name: "FT Wallet:", value: "```" + userAddress + "```", inline: false },
                                                        { name: "Links", value: '[Friendtech](https://www.friend.tech/rooms/' + userAddress + ") ∙ " + '[Twitter](https://twitter.com/' + twitterUsername.toLowerCase() + ") ∙ " + '[Basescan](https://basescan.org/address/' + userAddress + ") ∙ " + '[Dune Analytics](https://dune.com/whale_hunter/friend-tech-ultimate-analytics)' + " ∙ " + '[Holders](https://www.friend.tech/trades/' + userAddress + ")", inline: false }

                                                    )
                                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                                await interaction.editReply({ embeds: [userFTEmbed],components: [buttonRow] });



                                            } catch (error) {


                                                const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                                    .setTitle("Friend Tech")
                                                    .setDescription("An error occured whil retreiving the Friend.tech profile. Please try again or feel free to contact a team member if you need help.")
                                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                                    .setTimestamp()
                                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                                await interaction.editReply({ embeds: [errorNotEthereum] });


                                            }





                                        } else {

                                            let usernameSuggestionFormatted = ""

                                            let index = 0
                                            for (const suggestion of findUser.data.users) {
                                                index++
                                                if (index <= 5) {

                                                    usernameSuggestionFormatted += "∙ " + suggestion.twitterUsername + "\n"
                                                } else {

                                                    break
                                                }

                                            }


                                            const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                                .setTitle("Friend Tech")
                                                .setDescription("The exact twitter username you entered isn't registered in Friend.tech.\n\n**Maybe you are looking for:** \n\n" + usernameSuggestionFormatted)
                                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                .setTimestamp()
                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                            await interaction.editReply({ embeds: [errorNotEthereum] });





                                        }

                                    } else {


                                        const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle("Friend Tech")
                                            .setDescription("The twitter username you entered isn't registered in Friend.tech. Please try again with a valid username.")
                                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                        await interaction.editReply({ embeds: [errorNotEthereum] });



                                    }

                                } else if (interaction.options.getSubcommand() === 'portfolio') {

                                    let totalFTValue = 0
                                    let totalSharesValue = 0
                                    let totalFeesCollected = 0

                                    let holdingCount = 0
                                    let totalShares = 0

                                    let holdingTable = []
                                    let holdingFormatted = ""

                                    let twitterUsername = ""
                                    let twitterName = ""
                                    let twitterPfp = ""


                                    let findUser = []
                                    let isMatch = true
                                    let isExactMatch = true



                                    const usernameProvided = interaction.options.getString("twitter").toLowerCase()

                                    const givenUsername = removeAtSymbol(usernameProvided)


                                    try {
                                        findUser = await axios.get('https://prod-api.kosetto.com/search/users?username=' + givenUsername, { headers: friendtechHeaders })
                                    } catch (error) {
                                        isMatch = false
                                    }


                                    if (isMatch == true) {


                                        const user = findUser.data.users.find((user) => user.twitterUsername.toLowerCase() == givenUsername.toLowerCase());


                                        if (user) {


                                            userAddress = user.address






                                            try {





                                                // Prix de l'ETH
                                                const etherscanTokenPrice = await axios.get('https://api.etherscan.io/api?module=stats&action=ethprice&apikey=' + etherscanApiKey)
                                                const ethUsdPrice = etherscanTokenPrice.data.result.ethusd




                                                const userInfoCall = await axios.get("https://prod-api.kosetto.com/users/" + userAddress)

                                                holdingCount = userInfoCall.data.holdingCount
                                                totalFeesCollected = userInfoCall.data.lifetimeFeesCollectedInWei / 10 ** 18
                                                twitterUsername = userInfoCall.data.twitterUsername
                                                twitterName = userInfoCall.data.twitterName
                                                twitterPfp = userInfoCall.data.twitterPfpUrl


                                                let userHoldingCall = await axios.get("https://prod-api.kosetto.com/users/" + userAddress + "/token-holdings")



                                                if (userHoldingCall.data.nextPageStart != 50) {

                                                    for (const holding of userHoldingCall.data.users) {

                                                        let holdingAddress = holding.address.toLowerCase()

                                                        const holderInfo = await axios.get("https://prod-api.kosetto.com/users/" + holdingAddress)
                                                        let holderPrice = holderInfo.data.displayPrice / 10 ** 18


                                                        let obj = {}
                                                        obj.username = holding.twitterUsername
                                                        obj.balance = holding.balance
                                                        obj.price = holderPrice

                                                        if (!holdingTable.includes(obj)) {

                                                            totalShares += parseFloat(holding.balance)
                                                            totalSharesValue += parseFloat(holderPrice * holding.balance)

                                                            holdingTable.push(obj)
                                                        }
                                                    }

                                                } else {

                                                    for (const holding of userHoldingCall.data.users) {


                                                        let holdingAddress = holding.address.toLowerCase()

                                                        const holderInfo = await axios.get("https://prod-api.kosetto.com/users/" + holdingAddress)
                                                        let holderPrice = holderInfo.data.displayPrice / 10 ** 18


                                                        let obj = {}
                                                        obj.username = holding.twitterUsername
                                                        obj.balance = holding.balance
                                                        obj.price = holderPrice

                                                        if (!holdingTable.includes(obj)) {

                                                            totalShares += parseFloat(holding.balance)
                                                            totalSharesValue += parseFloat(holderPrice * holding.balance)

                                                            holdingTable.push(obj)
                                                        }
                                                    }

                                                    let itemsNumber = 50
                                                    let callPage = ""

                                                    let continuation = userHoldingCall.data.nextPageStart

                                                    while (continuation != null) {




                                                        callPage = await axios.get("https://prod-api.kosetto.com/users/" + userAddress + "/token-holdings?pageStart=" + itemsNumber)

                                                        continuation = callPage.data.nextPageStart

                                                        if (continuation != null) {

                                                            for (const holding of callPage.data.users) {

                                                                let holdingAddress = holding.address.toLowerCase()

                                                                const holderInfo = await axios.get("https://prod-api.kosetto.com/users/" + holdingAddress)
                                                                let holderPrice = holderInfo.data.displayPrice / 10 ** 18


                                                                let obj = {}
                                                                obj.username = holding.twitterUsername
                                                                obj.balance = holding.balance
                                                                obj.price = holderPrice

                                                                if (!holdingTable.includes(obj)) {

                                                                    totalShares += parseFloat(holding.balance)
                                                                    totalSharesValue += parseFloat(holderPrice * holding.balance)

                                                                    holdingTable.push(obj)
                                                                }
                                                            }


                                                            itemsNumber += 50

                                                        } else {
                                                            break
                                                        }
                                                    }
                                                }


                                                // Tri du tableau JSON en fonction de la valeur "floorAsk * tokenCount" de chaque objet "collection" en ordre décroissant
                                                let holdingTableSorted = holdingTable.sort((a, b) => b.balance * b.price - a.balance * a.price)




                                                let index = 0

                                                // On construit la table d'holders
                                                for (const holding of holdingTableSorted) {

                                                    index++

                                                    if (index <= 12) {

                                                        let holderName = holding.username
                                                        let holderBalance = holding.balance
                                                        let price = parseFloat(holding.price).toFixed(3)
                                                        let holderValue = parseFloat(holderBalance * holding.price).toFixed(3)
                                                        let holderValueUsd = parseFloat((holderBalance * price) * ethUsdPrice).toFixed(0)


                                                        let lignMaxSize = 55
                                                        let leftPartNfts = "`" + reduceText(holderName, 30) + " ∙ " + holderBalance + " Owned ∙ " + price + "Ξ"
                                                        let rightPartNfts = holderValue + "Ξ (" + holderValueUsd + "$)`\n"
                                                        let leftPartNFTsLenght = leftPartNfts.length
                                                        let rightPartNftsLenght = rightPartNfts.length
                                                        let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                                                        let spaceLenght = ""
                                                        for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }


                                                        holdingFormatted += leftPartNfts + spaceLenght + rightPartNfts





                                                    } else {
                                                        break
                                                    }
                                                }


                                                totalFTValue = totalSharesValue + totalFeesCollected

                                                if (holdingFormatted == "") { holdingFormatted = "```No shares found for this user.                         ```" }



                                                const userFTEmbed = new EmbedBuilder().setColor("#060A8F")
                                                    .setTitle(twitterName + "'s portfolio")
                                                    .setDescription(">>> Displaying the friend.tech portfolio metrics of `" + twitterName + "`.")
                                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                                    .setThumbnail(twitterPfp)
                                                    .setTimestamp()
                                                    .addFields(
                                                        { name: " ", value: " ", inline: false },
                                                        { name: "Total Value", value: "`" + parseFloat(totalFTValue).toFixed(3) + "Ξ`", inline: true },
                                                        { name: "Shares Value", value: "`" + parseFloat(totalSharesValue).toFixed(3) + "Ξ`", inline: true },
                                                        { name: "Total Fees Collected", value: "`" + parseFloat(totalFeesCollected).toFixed(5) + "Ξ`", inline: true },
                                                        { name: "Unique Shares Count", value: "`" + holdingCount + "`", inline: true },
                                                        { name: "Total Shares Count", value: "`" + totalShares + "`", inline: true },
                                                        { name: "Shares:", value: holdingFormatted, inline: false },
                                                        { name: "Links", value: '[Friendtech](https://www.friend.tech/rooms/' + userAddress + ") ∙ " + '[Twitter](https://twitter.com/' + twitterUsername.toLowerCase() + ") ∙ " + '[Basescan](https://basescan.org/address/' + userAddress + ") ∙ " + '[Dune Analytics](https://dune.com/whale_hunter/friend-tech-ultimate-analytics)' + " ∙ " + '[Holding](https://www.friend.tech/trades/' + userAddress + ")", inline: false }

                                                    )
                                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                                await interaction.editReply({ embeds: [userFTEmbed] });


                                            } catch (error) {

                                                console.log(error)

                                                const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                                    .setTitle("Friend Tech")
                                                    .setDescription("An error occured while gathering your data. Please try again or contact a team member")
                                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                                    .setTimestamp()
                                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                                await interaction.editReply({ embeds: [errorNotEthereum] });


                                            }




                                        } else {

                                            let usernameSuggestionFormatted = ""

                                            let index = 0
                                            for (const suggestion of findUser.data.users) {
                                                index++
                                                if (index <= 5) {

                                                    usernameSuggestionFormatted += "∙ " + suggestion.twitterUsername + "\n"
                                                } else {

                                                    break
                                                }

                                            }


                                            const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                                .setTitle("Friend Tech")
                                                .setDescription("The exact twitter username you entered isn't registered in Friend.tech.\n\n**Maybe you are looking for:** \n\n" + usernameSuggestionFormatted)
                                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                .setTimestamp()
                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                            await interaction.editReply({ embeds: [errorNotEthereum] });





                                        }

                                    } else {


                                        const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle("Friend Tech")
                                            .setDescription("The twitter username you entered isn't registered in Friend.tech. Please try again with a valid username.")
                                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                        await interaction.editReply({ embeds: [errorNotEthereum] });



                                    }



                                } else if (interaction.options.getSubcommand() === 'trades') {


                                    let userAddress = ""

                                    let findUser = []
                                    let isMatch = true

                                    const usernameProvided = interaction.options.getString("twitter").toLowerCase()

                                    const givenUsername = removeAtSymbol(usernameProvided)


                                    try {
                                        findUser = await axios.get('https://prod-api.kosetto.com/search/users?username=' + givenUsername, { headers: friendtechHeaders })

                                    } catch (error) {

                                        isMatch = false
                                    }


                                    if (isMatch == true) {


                                        const user = findUser.data.users.find((user) => user.twitterUsername.toLowerCase() == givenUsername.toLowerCase());


                                        if (user) {


                                            userAddress = user.address


                                            try {






                                                let shareTradesFormatted1 = ""
                                                let shareTradesFormatted2 = ""
                                                let shareTradesFormatted3 = ""

                                                let userTradesFormatted1 = ""
                                                let userTradesFormatted2 = ""
                                                let userTradesFormatted3 = ""

                                                let twitterName = ""
                                                let twitterUsername = ""
                                                let twitterPfp = ""



                                                const userInfoCall = await axios.get("https://prod-api.kosetto.com/users/" + userAddress)


                                                twitterUsername = userInfoCall.data.twitterUsername
                                                twitterName = userInfoCall.data.twitterName
                                                twitterPfp = userInfoCall.data.twitterPfpUrl




                                                const userFTEmbed = new EmbedBuilder().setColor("#060A8F")
                                                    .setTitle(twitterName)
                                                    .setDescription(">>> Displaying the friend.tech metrics of `" + twitterName + "`.")
                                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                                    .setThumbnail(twitterPfp)
                                                    .setTimestamp()
                                                    .addFields(
                                                        { name: "Name", value: "`" + twitterName + "`", inline: true },
                                                        { name: "Username", value: "`" + twitterUsername + "`", inline: true },
                                                        { name: " ", value: " ", inline: true },

                                                    )
                                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })






                                                // On commence les deux tableaux
                                                const shareTrades = await axios.get('https://prod-api.kosetto.com/users/' + userAddress + "/token/trade-activity", { headers: friendtechHeaders })
                                                const shareTradeSingle = shareTrades.data.users
                                                const shareTradeLength = shareTradeSingle.length




                                                let index = 0

                                                for (const trade of shareTradeSingle) {

                                                    index++

                                                    if (index <= 15) {

                                                        let name = trade.twitterName
                                                        let username = trade.twitterUsername
                                                        let isBuy = trade.isBuy
                                                        let amount = trade.shareAmount
                                                        let time = Math.floor(trade.createdAt / 1000)
                                                        let price = trade.ethAmount / 10 ** 18


                                                        let action1 = "🟢"
                                                        let action2 = "bought"

                                                        if (isBuy == false) { action1 = "🔴"; action2 = "sold" }



                                                        if (index <= 5) {

                                                            shareTradesFormatted1 += "`" + action1 + "` " + "[" + reduceText(name, 18) + "](https://twitter.com/" + username + ") `" + action2 + " " + amount + " for " + parseFloat(price).toFixed(3) + "Ξ` ∙ <t:" + time + ":R>\n"

                                                            if (index == 5 || index == shareTradeLength) {

                                                                userFTEmbed.addFields(
                                                                    { name: 'Share Trades:', value: shareTradesFormatted1, inline: false },

                                                                );

                                                            }


                                                        } else if (index <= 10) {

                                                            shareTradesFormatted2 += "`" + action1 + "` " + "[" + reduceText(name, 18) + "](https://twitter.com/" + username + ") `" + action2 + " " + amount + " for " + parseFloat(price).toFixed(3) + "Ξ` ∙ <t:" + time + ":R>\n"

                                                            if (index == 10 || index == shareTradeLength) {

                                                                userFTEmbed.addFields(
                                                                    { name: ' ', value: shareTradesFormatted2, inline: false },

                                                                );

                                                            }


                                                        } else if (index <= 15) {

                                                            shareTradesFormatted3 += "`" + action1 + "` " + "[" + reduceText(name, 18) + "](https://twitter.com/" + username + ") `" + action2 + " " + amount + " for " + parseFloat(price).toFixed(3) + "Ξ` ∙ <t:" + time + ":R>\n"


                                                            if (index == 15 || index == shareTradeLength) {

                                                                userFTEmbed.addFields(
                                                                    { name: ' ', value: shareTradesFormatted3, inline: false },

                                                                );

                                                            }

                                                        } else {
                                                            break
                                                        }




                                                    }



                                                }



                                                userFTEmbed.addFields(
                                                    { name: ' ', value: " ", inline: false },

                                                );


                                                const userTrades = await axios.get(" https://prod-api.kosetto.com/users/" + userAddress + "/trade-activity")
                                                const userTradeSingle = userTrades.data.users
                                                const userTradeLength = userTradeSingle.length

                                                let index2 = 0

                                                for (const trade of userTradeSingle) {

                                                    index2++

                                                    if (index2 <= 15) {

                                                        let name = trade.twitterName
                                                        let username = trade.twitterUsername
                                                        let isBuy = trade.isBuy
                                                        let amount = trade.shareAmount
                                                        let time = Math.floor(trade.createdAt / 1000)
                                                        let price = trade.ethAmount / 10 ** 18


                                                        let action = "🟢 Bought "
                                                        if (isBuy == false) { action = "🔴 Sold " }



                                                        if (index2 <= 5) {

                                                            userTradesFormatted1 += "`" + action + amount + "` [" + reduceText(name, 18) + "](https://twitter.com/" + username + ") `for " + parseFloat(price).toFixed(3) + "Ξ` ∙ <t:" + time + ":R>\n"

                                                            if (index2 == 5 || index2 == userTradeLength) {

                                                                userFTEmbed.addFields(
                                                                    { name: 'User Activity:', value: userTradesFormatted1, inline: false },

                                                                );

                                                            }

                                                        } else if (index2 <= 10) {

                                                            userTradesFormatted2 += "`" + action + amount + "` [" + reduceText(name, 18) + "](https://twitter.com/" + username + ") `for " + parseFloat(price).toFixed(3) + "Ξ` ∙ <t:" + time + ":R>\n"


                                                            if (index2 == 10 || index2 == userTradeLength) {

                                                                userFTEmbed.addFields(
                                                                    { name: ' ', value: userTradesFormatted2, inline: false },

                                                                );

                                                            }

                                                        } else if (index2 <= 15) {

                                                            userTradesFormatted3 += "`" + action + amount + "` [" + reduceText(name, 18) + "](https://twitter.com/" + username + ") `for " + parseFloat(price).toFixed(3) + "Ξ` ∙ <t:" + time + ":R>\n"

                                                            if (index2 == 15 || index2 == userTradeLength) {

                                                                userFTEmbed.addFields(
                                                                    { name: ' ', value: userTradesFormatted3, inline: false },

                                                                );

                                                            }


                                                        } else {
                                                            break
                                                        }




                                                    }



                                                }




                                                userFTEmbed.addFields(
                                                    { name: ' ', value: " ", inline: false },

                                                );


                                                if (shareTradesFormatted1 == "") {
                                                    shareTradesFormatted1 = "```No recent trade found for this share                    ```"

                                                    userFTEmbed.addFields(
                                                        { name: 'Share Trades:', value: shareTradesFormatted1, inline: false },

                                                    );

                                                }



                                                if (userTradesFormatted1 == "") {
                                                    userTradesFormatted1 = "```No recent activity found for this user                  ```"

                                                    userFTEmbed.addFields(
                                                        { name: 'User Activity:', value: userTradesFormatted1, inline: false },

                                                    );

                                                }




                                                userFTEmbed.addFields(
                                                    { name: ' ', value: " ", inline: false },
                                                    { name: "Links", value: '[Friendtech](https://www.friend.tech/rooms/' + userAddress + ") ∙ " + '[Twitter](https://twitter.com/' + twitterUsername.toLowerCase() + ") ∙ " + '[Basescan](https://basescan.org/address/' + userAddress + ") ∙ " + '[Dune Analytics](https://dune.com/whale_hunter/friend-tech-ultimate-analytics)' + " ∙ " + '[Holders](https://www.friend.tech/trades/' + userAddress + ")", inline: false }

                                                );






                                                await interaction.editReply({ embeds: [userFTEmbed] });














                                            } catch (error) {

                                                console.log(error)

                                                const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                                    .setTitle("Friend Tech")
                                                    .setDescription("An error occured while gathering your data. Please try again or contact a team member")
                                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                                    .setTimestamp()
                                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                                await interaction.editReply({ embeds: [errorNotEthereum] });


                                            }




                                        } else {

                                            let usernameSuggestionFormatted = ""

                                            let index = 0
                                            for (const suggestion of findUser.data.users) {
                                                index++
                                                if (index <= 5) {

                                                    usernameSuggestionFormatted += "∙ " + suggestion.twitterUsername + "\n"
                                                } else {

                                                    break
                                                }

                                            }


                                            const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                                .setTitle("Friend Tech")
                                                .setDescription("The exact twitter username you entered isn't registered in Friend.tech.\n\n**Maybe you are looking for:** \n\n" + usernameSuggestionFormatted)
                                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                .setTimestamp()
                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                            await interaction.editReply({ embeds: [errorNotEthereum] });





                                        }

                                    } else {


                                        const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle("Friend Tech")
                                            .setDescription("The twitter username you entered isn't registered in Friend.tech. Please try again with a valid username.")
                                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                        await interaction.editReply({ embeds: [errorNotEthereum] });



                                    }


                                } else if (interaction.options.getSubcommand() === 'stats') {




                                    let totalFTValue = 0
                                    let totalSharesValue = 0
                                    let totalFeesCollected = 0

                                    let holdingCount = 0
                                    let totalShares = 0

                                    let holdingTable = []
                                    let holdingFormatted = ""

                                    let twitterUsername = ""
                                    let twitterName = ""
                                    let twitterPfp = ""


                                    let findUser = []
                                    let isMatch = true
                                    let isExactMatch = true
















                                    let trendingFormatted = ""
                                    let topShareFormatted = ""
                                    let lastMessengersFormatted = ""
                                    let recentTradesFormatted = ""



                                    const trendingCall = await axios.get("https://prod-api.kosetto.com/lists/trending")
                                    const trendingTable = trendingCall.data.users


                                    let indexTrending = 0
                                    for (const trending of trendingTable) {

                                        indexTrending++

                                        if (indexTrending <= 8) {

                                            const name = trending.twitterName
                                            const username = trending.twitterUsername
                                            const price = trending.displayPrice / 10 ** 18
                                            const volume = trending.volume / 10 ** 18


                                            let lignMaxSize = 60
                                            let leftPartNfts = "`" + reduceText(name, 20)
                                            let rightPartNfts = "Price: " + parseFloat(price).toFixed(3) + "Ξ ∙ Vol: " + parseFloat(volume).toFixed(1) + "`"
                                            let leftPartNFTsLenght = leftPartNfts.length
                                            let rightPartNftsLenght = rightPartNfts.length
                                            let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                                            let spaceLenght = ""
                                            for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }


                                            trendingFormatted += leftPartNfts + spaceLenght + rightPartNfts + " [<:TWs:1153688442568450148>](https://twitter.com/" + username + ")\n"
                                        } else {
                                            break
                                        }
                                    }




                                    const topSharesCall = await axios.get("https://prod-api.kosetto.com/lists/top-by-price")
                                    const topSharesTable = topSharesCall.data.users


                                    let indexTop = 0

                                    for (const top of topSharesTable) {

                                        indexTop++

                                        if (indexTop <= 8) {

                                            const name = top.twitterName
                                            const username = top.twitterUsername
                                            const price = top.displayPrice / 10 ** 18
                                            const supply = top.shareSupply
                                            const time = Math.floor(top.lastOnline / 1000)




                                            let lignMaxSize = 60
                                            let leftPartNfts = "`" + reduceText(name, 20)
                                            let rightPartNfts = "Supply: " + parseFloat(supply).toFixed(0) + " ∙ Price: " + parseFloat(price).toFixed(3) + "Ξ`"
                                            let leftPartNFTsLenght = leftPartNfts.length
                                            let rightPartNftsLenght = rightPartNfts.length
                                            let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                                            let spaceLenght = ""
                                            for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }


                                            topShareFormatted += leftPartNfts + spaceLenght + rightPartNfts + " [<:TWs:1153688442568450148>](https://twitter.com/" + username + ")\n"

                                        } else {
                                            break
                                        }

                                    }





                                    const recentMessagersCall = await axios.get("https://prod-api.kosetto.com/lists/recent-messagers")
                                    const recentMessagersTable = recentMessagersCall.data.users

                                    let indexRecent = 0
                                    for (const recent of recentMessagersTable) {

                                        indexRecent++

                                        if (indexRecent <= 8) {

                                            const name = recent.twitterName
                                            const username = recent.twitterUsername
                                            const time = getTimeAgo(Math.floor(recent.lastMessageTimestamp / 1000))
                                            const price = recent.ethDisplayPrice / 10 ** 18




                                            let lignMaxSize = 60
                                            let leftPartNfts = "`" + reduceText(name, 20)
                                            let rightPartNfts = "Price: " + parseFloat(price).toFixed(3) + "Ξ ∙ " + time + "`"
                                            let leftPartNFTsLenght = leftPartNfts.length
                                            let rightPartNftsLenght = rightPartNfts.length
                                            let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                                            let spaceLenght = ""
                                            for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }


                                            lastMessengersFormatted += leftPartNfts + spaceLenght + rightPartNfts + " [<:TWs:1153688442568450148>](https://twitter.com/" + username + ")\n"


                                        } else {
                                            break
                                        }
                                    }


                                    const lastTrades = await axios.get("https://prod-api.kosetto.com/global-activity", { headers: friendtechHeaders })
                                    const lastTradesTable = lastTrades.data.events


                                    let indexTrades = 0

                                    for (const trades of lastTradesTable) {

                                        indexTrades++

                                        if (indexTrades <= 6) {

                                            const traderName = trades.trader.name
                                            const traderUsername = trades.trader.username

                                            const shareName = trades.subject.name
                                            const shareUsername = trades.subject.username

                                            const price = trades.ethAmount / 10 ** 18
                                            const amount = trades.shareAmount
                                            const isBuy = trades.isBuy
                                            const time = Math.floor(trades.createdAt / 1000)


                                            let action1 = "🟢"
                                            let action2 = "bought"

                                            if (isBuy == false) { action1 = "🔴"; action2 = "sold" }



                                            recentTradesFormatted += "`" + action1 + "` " + "[" + reduceText(traderName, 18) + "](https://twitter.com/" + traderUsername + ") `" + action2 + " " + amount + " of` " + "[" + reduceText(shareName, 18) + "](https://twitter.com/" + shareUsername + ")" + " `for " + parseFloat(price).toFixed(3) + "Ξ` ∙ <t:" + time + ":R>\n"

                                        } else {
                                            break
                                        }

                                    }









                                    const userFTEmbed = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle("Friend.tech market")
                                        .setDescription(">>> Displaying various friend.tech metrics.")
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        // .setImage("https://cdn.discordapp.com/attachments/1104225853023461388/1153666519952269392/image.png")
                                        .setTimestamp()
                                        .addFields(
                                            { name: " ", value: " ", inline: false },
                                            { name: "Trending Shares:", value: trendingFormatted, inline: true },
                                            { name: " ", value: " ", inline: false },
                                            { name: "Top Shares:", value: topShareFormatted, inline: true },
                                            { name: " ", value: " ", inline: false },
                                            { name: "Last Messengers:", value: lastMessengersFormatted, inline: true },
                                            { name: " ", value: " ", inline: false },
                                            { name: "Recent Trades", value: recentTradesFormatted, inline: true },
                                            { name: "Links", value: '[Friendtech](https://www.friend.tech) ∙ ' + '[Twitter](https://twitter.com/friendtech) ∙ ' + '[Trending](https://www.friend.tech/search) ∙ ' + '[Dune Analytics](https://dune.com/whale_hunter/friend-tech-ultimate-analytics)', inline: false }

                                        )
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                    await interaction.editReply({ embeds: [userFTEmbed] });









                                } else if (interaction.options.getSubcommand() === 'holders') {



                                    const buttonsRow = new ActionRowBuilder()
                                        .addComponents(
                                            new ButtonBuilder()
                                                .setCustomId('friendtechholderfirst-button')
                                                .setLabel('first page')
                                                .setStyle(2)
                                                .setDisabled(true),
                                            new ButtonBuilder()
                                                .setCustomId('friendtechholderprevious-button')
                                                .setLabel('previous page')
                                                .setStyle(2)
                                                .setDisabled(true),
                                            new ButtonBuilder()
                                                .setCustomId('friendtechholdernext-button')
                                                .setLabel('next page')
                                                .setStyle(2),
                                            new ButtonBuilder()
                                                .setCustomId('friendtechholderlast-button')
                                                .setLabel('last page')
                                                .setStyle(2),
                                        );

                                    const buttonsRowNo = new ActionRowBuilder()
                                        .addComponents(
                                            new ButtonBuilder()
                                                .setCustomId('friendtechholderfirst-button')
                                                .setLabel('first page')
                                                .setStyle(2)
                                                .setDisabled(true),
                                            new ButtonBuilder()
                                                .setCustomId('friendtechholderprevious-button')
                                                .setLabel('previous page')
                                                .setStyle(2)
                                                .setDisabled(true),
                                            new ButtonBuilder()
                                                .setCustomId('friendtechholdernext-button')
                                                .setLabel('next page')
                                                .setStyle(2)
                                                .setDisabled(true),
                                            new ButtonBuilder()
                                                .setCustomId('friendtechholderlast-button')
                                                .setLabel('last page')
                                                .setStyle(2)
                                                .setDisabled(true),
                                        );




                                    let findUser = []
                                    let isMatch = true

                                    const usernameProvided = interaction.options.getString("twitter").toLowerCase()

                                    const givenUsername = removeAtSymbol(usernameProvided)



                                    try {
                                        findUser = await axios.get('https://prod-api.kosetto.com/search/users?username=' + givenUsername, { headers: friendtechHeaders })

                                    } catch (error) {
                                        isMatch = false
                                    }


                                    if (isMatch == true) {


                                        const user = findUser.data.users.find((user) => user.twitterUsername.toLowerCase() == givenUsername.toLowerCase());


                                        if (user) {


                                            userAddress = user.address







                                            try {



                                                const userInfoCall = await axios.get("https://prod-api.kosetto.com/users/" + userAddress)

                                                let holderCount = userInfoCall.data.holderCount
                                                let supply = userInfoCall.data.shareSupply
                                                let twName = userInfoCall.data.twitterName
                                                let twUsername = userInfoCall.data.twitterUsername
                                                let price = userInfoCall.data.displayPrice / 10 ** 18



                                                const holdersCall = await axios.get("https://prod-api.kosetto.com/users/" + userAddress + "/token/holders")
                                                const holdersTable = holdersCall.data.users


                                                if (holdersTable.length > 0) {

                                                    let fullHoldingTable = []


                                                    if (holdersCall.data.nextPageStart != 50) {

                                                        for (const holding of holdersTable) {

                                                            let name = holding.twitterName
                                                            let username = holding.twitterUsername
                                                            let address = holding.address
                                                            let tokenCount = holding.balance
                                                            let supplyPercentage = (tokenCount / supply) * 100;


                                                            let obj = {}
                                                            obj.username = username
                                                            obj.name = name
                                                            obj.amount = tokenCount
                                                            obj.supplyPercentage = supplyPercentage
                                                            obj.address = address

                                                            if (!fullHoldingTable.includes(obj)) {

                                                                fullHoldingTable.push(obj)
                                                            }
                                                        }

                                                    } else {

                                                        for (const holding of holdersTable) {

                                                            let name = holding.twitterName
                                                            let username = holding.twitterUsername
                                                            let address = holding.address
                                                            let tokenCount = holding.balance
                                                            let supplyPercentage = (tokenCount / supply) * 100;


                                                            let obj = {}
                                                            obj.username = username
                                                            obj.name = name
                                                            obj.amount = tokenCount
                                                            obj.supplyPercentage = supplyPercentage
                                                            obj.address = address

                                                            if (!fullHoldingTable.includes(obj)) {

                                                                fullHoldingTable.push(obj)
                                                            }
                                                        }

                                                        let itemsNumber = 50
                                                        let callPage = ""

                                                        let continuation = holdersCall.data.nextPageStart

                                                        while (continuation != null) {




                                                            callPage = await axios.get("https://prod-api.kosetto.com/users/" + userAddress + "/token/holders?pageStart=" + itemsNumber)

                                                            continuation = callPage.data.nextPageStart

                                                            if (continuation != null) {

                                                                for (const holding of callPage.data.users) {

                                                                    let name = holding.twitterName
                                                                    let username = holding.twitterUsername
                                                                    let address = holding.address
                                                                    let tokenCount = holding.balance
                                                                    let supplyPercentage = (tokenCount / supply) * 100;


                                                                    let obj = {}
                                                                    obj.username = username
                                                                    obj.name = name
                                                                    obj.amount = tokenCount
                                                                    obj.supplyPercentage = supplyPercentage
                                                                    obj.address = address

                                                                    if (!fullHoldingTable.includes(obj)) {

                                                                        fullHoldingTable.push(obj)
                                                                    }
                                                                }


                                                                itemsNumber += 50

                                                            } else {
                                                                break
                                                            }
                                                        }
                                                    }







                                                    console.log(fullHoldingTable)
                                                    console.log(fullHoldingTable.length)





                                                    // On construit le tableau d'holders pour toute l'interaction
                                                    let top10Holders = 0
                                                    let top25Holders = 0
                                                    let top50Holders = 0

                                                    let holdersTableDB = []
                                                    let holdersFormatted = "Owner                                           # Held\n\n"

                                                    let index = 0





                                                    for (const holders of fullHoldingTable) {



                                                        let name = holders.name
                                                        let username = holders.username
                                                        let address = holders.address
                                                        let tokenCount = holders.amount
                                                        let supplyPercentage = holders.supplyPercentage


                                                        if (index <= 15) {


                                                            let lignMaxSize = 55
                                                            let leftPartNfts = reduceText(username, 25)

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
                                                        obj.name = name
                                                        obj.username = username
                                                        obj.tokenCount = tokenCount
                                                        obj.supplyPercentage = supplyPercentage
                                                        holdersTableDB.push(obj)

                                                        index++


                                                    }


                                                    const itemsPerPage = 16; // Nombre d'objets par page
                                                    pageIndex = Math.ceil(holderCount / itemsPerPage);



                                                    let linksFormatted = '[Friendtech](https://www.friend.tech/rooms/' + userAddress + ") ∙ " + '[Twitter](https://twitter.com/' + twUsername.toLowerCase() + ") ∙ " + '[Basescan](https://basescan.org/address/' + userAddress + ") ∙ " + '[Dune Analytics](https://dune.com/whale_hunter/friend-tech-ultimate-analytics)' + " ∙ " + '[Holders](https://www.friend.tech/trades/' + userAddress + ")"


                                                    const getBlurOneWallet = new EmbedBuilder().setColor("#060A8F")
                                                        .setTitle(twName + "'s holders")
                                                        .setDescription(">>> Displaying the top holders of `" + twName + "`.")
                                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                                        .addFields(
                                                            { name: " ", value: " ", inline: false },
                                                            { name: "Supply", value: "`" + supply + "`", inline: false },
                                                            { name: "Top 10 Holders", value: "`" + top10Holders + " (" + parseFloat((top10Holders / supply) * 100).toFixed(2) + "%)`", inline: true },
                                                            { name: "Top 25 Holders", value: "`" + top25Holders + " (" + parseFloat((top25Holders / supply) * 100).toFixed(2) + "%)`", inline: true },
                                                            { name: "Top 50 Holders", value: "`" + top50Holders + " (" + parseFloat((top50Holders / supply) * 100).toFixed(2) + "%)`", inline: true },
                                                            { name: "Holders:", value: "```" + holdersFormatted + "```", inline: false },
                                                            { name: "Links", value: linksFormatted, inline: false },
                                                            { name: "Page", value: "`[1/" + pageIndex + "]`", inline: true },

                                                        )
                                                        .setTimestamp()
                                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                                                    if (pageIndex <= 1) { await interaction.editReply({ embeds: [getBlurOneWallet], components: [buttonsRowNo] }); }
                                                    else { await interaction.editReply({ embeds: [getBlurOneWallet], components: [buttonsRow] }); }





                                                    let holderDataTable = []
                                                    let obj = {}
                                                    obj.name = twName
                                                    obj.username = twUsername
                                                    obj.supply = supply
                                                    obj.top10Holders = top10Holders + " (" + parseFloat((top10Holders / supply) * 100).toFixed(2) + "%)"
                                                    obj.top25Holders = top25Holders + " (" + parseFloat((top25Holders / supply) * 100).toFixed(2) + "%)"
                                                    obj.top50Holders = top50Holders + " (" + parseFloat((top50Holders / supply) * 100).toFixed(2) + "%)"
                                                    obj.links = linksFormatted
                                                    holderDataTable.push(obj)


                                                    //On fait le call àbn  la base SQL
                                                    await interactionData.destroy({ where: { authorId: authorId, commandName: "friendtech-holder", serverId: serverId } })

                                                    await interactionData.create({

                                                        authorId: authorId,
                                                        authorName: authorName,
                                                        serverId: serverId,
                                                        commandName: "friendtech-holder",
                                                        interactionId: interaction.id,
                                                        walletAddress: "N/A",
                                                        walletCategory: "N/A",
                                                        embed1: JSON.stringify(fullHoldingTable),
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




                                                    let holdersFormatted = "No holders found for this collection                "
                                                    let twName = "Blur"

                                                    const getBlurOneWallet = new EmbedBuilder().setColor("#060A8F")
                                                        .setTitle(twName + "'s holders")
                                                        .setDescription(">>> Displaying the top holders of `" + twName + "`.")
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

                                                    /// TEMPORAIRE
                                                    await interaction.editReply({ embeds: [getBlurOneWallet], components: [buttonsRowNo] })


                                                }



                                            } catch (error) {

                                                console.log(error)
                                                const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                                    .setTitle("Friend Tech")
                                                    .setDescription("An error occured whil retreiving the Friend.tech profile. Please try again or feel free to contact a team member if you need help.")
                                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                                    .setTimestamp()
                                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                                await interaction.editReply({ embeds: [errorNotEthereum] });


                                            }





                                        } else {

                                            let usernameSuggestionFormatted = ""

                                            let index = 0
                                            for (const suggestion of findUser.data.users) {
                                                index++
                                                if (index <= 5) {

                                                    usernameSuggestionFormatted += "∙ " + suggestion.twitterUsername + "\n"
                                                } else {

                                                    break
                                                }

                                            }


                                            const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                                .setTitle("Friend Tech")
                                                .setDescription("The exact twitter username you entered isn't registered in Friend.tech.\n\n**Maybe you are looking for:** \n\n" + usernameSuggestionFormatted)
                                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                .setTimestamp()
                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                            await interaction.editReply({ embeds: [errorNotEthereum] });





                                        }

                                    } else {


                                        const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle("Friend Tech")
                                            .setDescription("The twitter username you entered isn't registered in Friend.tech. Please try again with a valid username.")
                                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                        await interaction.editReply({ embeds: [errorNotEthereum] });



                                    }

                                } else if (interaction.options.getSubcommand() === 'profit') {


                                    let findUser = []
                                    let isMatch = true

                                    const usernameProvided = interaction.options.getString("twitter").toLowerCase()

                                    const givenUsername = removeAtSymbol(usernameProvided)



                                    try {
                                        findUser = await axios.get('https://prod-api.kosetto.com/search/users?username=' + givenUsername, { headers: friendtechHeaders })

                                    } catch (error) {
                                        isMatch = false
                                    }


                                    if (isMatch == true) {


                                        const user = findUser.data.users.find((user) => user.twitterUsername.toLowerCase() == givenUsername.toLowerCase());


                                        if (user) {


                                            userAddress = user.address


                                            try {


                                                // VALEURS DE L'EMBED
                                                let buySpent = 0
                                                let buyFeeSpent = 0
                                                let totalBuySpent = 0

                                                let soldValue = 0
                                                let soldFeeValue = 0
                                                let totalSoldValue = 0

                                                let protocolFee = 0
                                                let creatorFeeSpent = 0
                                                let creatorFeeEarned = 0
                                                let totalFee = 0

                                                let avgBuy = 0
                                                let avgSold = 0
                                                let avgHeld = 0

                                                let buyCount = 0
                                                let soldCount = 0
                                                let heldCount = 0

                                                let shareCount = 0
                                                let tradeCount = 0
                                                let transferCount = 0


                                                let realizedProfit = 0
                                                let potentialProfit = 0
                                                let potentialRoi = 0
                                                let roiFormatted = ""


                                                // PARAMERTRE DE FEE FRIEND.TECH
                                                const protocolPart = 5
                                                const creatorPart = 5
                                                const totalFees = 10


                                                // VALEUR DE CALCUL
                                                let sharesTable = []

                                                let heldValue = 0
                                                let roiPrefix = ""
                                                let roiSuffix = ""



                                                // Prix de l'ETH
                                                const etherscanTokenPrice = await axios.get('https://api.etherscan.io/api?module=stats&action=ethprice&apikey=' + etherscanApiKey)
                                                const ethUsdPrice = etherscanTokenPrice.data.result.ethusd


                                                heldValue = await getFTHolding(userAddress)



                                                const userInfoCall = await axios.get("https://prod-api.kosetto.com/users/" + userAddress)

                                                let twName = userInfoCall.data.twitterName
                                                let twUsername = userInfoCall.data.twitterUsername

                                                heldCount = userInfoCall.data.holdingCount



                                                const holdersCall = await axios.get("https://prod-api.kosetto.com/users/" + userAddress + "/trade-activity")
                                                const holdersTable = holdersCall.data.users





                                                if (holdersCall.data.nextPageStart != 50) {

                                                    for (const holding of holdersTable) {

                                                        let name = holding.twitterName
                                                        let username = holding.twitterUsername
                                                        let subjectAddress = holding.subject
                                                        let isBuy = holding.isBuy
                                                        let amount = holding.shareAmount
                                                        let price = holding.ethAmount / 10 ** 18
                                                        let time = holding.createdAt


                                                        // C'est un in
                                                        if (isBuy == true) {



                                                            buyCount += parseFloat(amount)
                                                            tradeCount += parseFloat(amount)
                                                            buySpent += price * (1 + (totalFees / 100))
                                                            buyFeeSpent += price * (totalFees / 100)


                                                        } else {
                                                            // C'est un out

                                                            soldCount += parseFloat(amount)
                                                            tradeCount += parseFloat(amount)
                                                            soldValue += price * (1 - (totalFees / 100))
                                                            soldFeeValue += price * (totalFees / 100)



                                                        }


                                                        if (!sharesTable.includes(subjectAddress.toLowerCase())) {
                                                            sharesTable.push(subjectAddress.toLowerCase())
                                                        }




                                                    }

                                                } else {

                                                    for (const holding of holdersTable) {

                                                        let name = holding.twitterName
                                                        let username = holding.twitterUsername
                                                        let subjectAddress = holding.subject
                                                        let isBuy = holding.isBuy
                                                        let amount = holding.shareAmount
                                                        let price = holding.ethAmount / 10 ** 18
                                                        let time = holding.createdAt


                                                        // C'est un in
                                                        if (isBuy == true) {



                                                            buyCount += parseFloat(amount)
                                                            tradeCount += parseFloat(amount)
                                                            buySpent += price * (1 + (totalFees / 100))
                                                            buyFeeSpent += price * (totalFees / 100)


                                                        } else {
                                                            // C'est un out

                                                            soldCount += parseFloat(amount)
                                                            tradeCount += parseFloat(amount)
                                                            soldValue += price * (1 - (totalFees / 100))
                                                            soldFeeValue += price * (totalFees / 100)

                                                        }


                                                        if (!sharesTable.includes(subjectAddress.toLowerCase())) {
                                                            sharesTable.push(subjectAddress.toLowerCase())
                                                        }


                                                    }

                                                    let itemsNumber = 50
                                                    let callPage = ""

                                                    let continuation = holdersCall.data.nextPageStart

                                                    while (continuation != null) {




                                                        callPage = await axios.get("https://prod-api.kosetto.com/users/" + userAddress + "/trade-activity?pageStart=" + itemsNumber)

                                                        continuation = callPage.data.nextPageStart

                                                        if (continuation != null) {

                                                            for (const holding of callPage.data.users) {

                                                                let name = holding.twitterName
                                                                let username = holding.twitterUsername
                                                                let subjectAddress = holding.subject
                                                                let isBuy = holding.isBuy
                                                                let amount = holding.shareAmount
                                                                let price = holding.ethAmount / 10 ** 18
                                                                let time = holding.createdAt


                                                                // C'est un in
                                                                if (isBuy == true) {



                                                                    buyCount += parseFloat(amount)
                                                                    tradeCount += parseFloat(amount)
                                                                    buySpent += price * (1 + (totalFees / 100))
                                                                    buyFeeSpent += price * (totalFees / 100)


                                                                } else {
                                                                    // C'est un out

                                                                    soldCount += parseFloat(amount)
                                                                    tradeCount += parseFloat(amount)
                                                                    soldValue += price * (1 - (totalFees / 100))
                                                                    soldFeeValue += price * (totalFees / 100)

                                                                }


                                                                if (!sharesTable.includes(subjectAddress.toLowerCase())) {
                                                                    sharesTable.push(subjectAddress.toLowerCase())
                                                                }

                                                            }


                                                            itemsNumber += 50

                                                        } else {
                                                            break
                                                        }
                                                    }
                                                }





                                                console.log(heldValue)

                                                tradeCount = parseFloat(buyCount) + parseFloat(tradeCount)
                                                shareCount = sharesTable.length

                                                totalFee = parseFloat(buyFeeSpent) + parseFloat(soldFeeValue)
                                                protocolFee = totalFee / 2
                                                creatorFeeSpent = totalFee / 2

                                                totalBuySpent = parseFloat(buySpent) + parseFloat(buyFeeSpent)
                                                totalSoldValue = parseFloat(soldValue) - parseFloat(soldFeeValue)


                                                avgBuy = totalBuySpent / buyCount
                                                avgSold = totalSoldValue / soldCount
                                                avgHeld = heldValue / heldCount


                                                potentialProfit = (totalSoldValue + heldValue) - totalBuySpent // Ajouter royalties ?
                                                realizedProfit = totalSoldValue - totalBuySpent
                                                potentialRoi = ((((heldValue + totalSoldValue) - totalBuySpent) / totalBuySpent) * 100).toFixed(2)


                                                if (potentialRoi != 0 && totalBuySpent != 0) {

                                                    if (potentialRoi > 0) {
                                                        roiPrefix = "+";
                                                        roiSuffix = " :chart_with_upwards_trend:";
                                                    } else if (potentialRoi < 0) {
                                                        roiSuffix = " :chart_with_downwards_trend:";
                                                    }

                                                    roiFormatted = "`" + roiPrefix + parseFloat(potentialRoi).toFixed(2) + "%" + "`" + roiSuffix;

                                                } else if (potentialRoi == 0 || potentialRoi == "NaN") {

                                                    roiFormatted = "`0.00%`"

                                                } else if (totalBuySpent == 0 && (soldCount + heldCount > 0)) {

                                                    roiFormatted = "`INFINITY`<a:RCRich:1044762000837840926>"

                                                }









                                                const getBlurOneWallet = new EmbedBuilder().setColor("#060A8F")
                                                    .setTitle(twName + "'s profit")
                                                    .setDescription(">>> Displaying the friend.tech profits of `" + twName + "`.")
                                                    .setImage("https://media.discordapp.net/attachments/1104225853023461388/1153666519952269392/image.png?width=2206&height=552")
                                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                                    .addFields(
                                                        { name: "Name", value: "`" + twName + "`", inline: true },
                                                        { name: "Username", value: "`" + twUsername + "`", inline: true },
                                                        { name: " ", value: " ", inline: false },

                                                        { name: "Buy Spent", value: "`" + parseFloat(buySpent).toFixed(3) + "Ξ (" + parseFloat(buySpent * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                        { name: "Buy Fee Spent", value: "`" + parseFloat(buyFeeSpent).toFixed(3) + "Ξ (" + parseFloat(buyFeeSpent * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                        { name: "Total Buy Spent", value: "`" + parseFloat(totalBuySpent).toFixed(3) + "Ξ (" + parseFloat(totalBuySpent * ethUsdPrice).toFixed(0) + "$)`", inline: true },

                                                        { name: "Sold Value", value: "`" + parseFloat(soldValue).toFixed(3) + "Ξ (" + parseFloat(soldValue * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                        { name: "Sold Fee Value", value: "`" + parseFloat(soldFeeValue).toFixed(3) + "Ξ (" + parseFloat(soldFeeValue * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                        { name: "Total sold Value", value: "`" + parseFloat(totalSoldValue).toFixed(3) + "Ξ (" + parseFloat(totalSoldValue * ethUsdPrice).toFixed(0) + "$)`", inline: true },

                                                        { name: "Protocol Fees", value: "`" + parseFloat(protocolFee).toFixed(3) + "Ξ (" + parseFloat(protocolFee * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                        { name: "Creator Fees", value: "`" + parseFloat(creatorFeeSpent).toFixed(3) + "Ξ (" + parseFloat(creatorFeeSpent * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                        { name: "Total Fees", value: "`" + parseFloat(totalFee).toFixed(3) + "Ξ (" + parseFloat(totalFee * ethUsdPrice).toFixed(0) + "$)`", inline: true },

                                                        { name: "Buy Count", value: "`" + buyCount + "`", inline: true },
                                                        { name: "Sold Count", value: "`" + soldCount + "`", inline: true },
                                                        { name: "Held Count", value: "`" + heldCount + "`", inline: true },

                                                        { name: "Trade Count", value: "`" + tradeCount + "`", inline: true },
                                                        { name: "Share Count", value: "`" + shareCount + "`", inline: true },
                                                        { name: "Transfer Count", value: "`" + transferCount + "`", inline: true },

                                                        { name: "AVG Buy", value: "`" + parseFloat(avgBuy).toFixed(3) + "Ξ (" + parseFloat(avgBuy * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                        { name: "AVG Sell", value: "`" + parseFloat(avgSold).toFixed(3) + "Ξ (" + parseFloat(avgSold * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                        { name: "AVG Held", value: "`" + parseFloat(avgHeld).toFixed(3) + "Ξ (" + parseFloat(avgHeld * ethUsdPrice).toFixed(0) + "$)`", inline: true },

                                                        { name: "Realised Profit", value: "`" + parseFloat(realizedProfit).toFixed(3) + "Ξ (" + parseFloat(realizedProfit * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                        { name: "Potential Profit", value: "`" + parseFloat(potentialProfit).toFixed(3) + "Ξ (" + parseFloat(potentialProfit * ethUsdPrice).toFixed(0) + "$)`", inline: true },
                                                        { name: "Potential ROI", value: roiFormatted, inline: true },


                                                        { name: "Links", value: '[Friendtech](https://www.friend.tech/rooms/' + userAddress + ") ∙ " + '[Twitter](https://twitter.com/' + twUsername.toLowerCase() + ") ∙ " + '[Basescan](https://basescan.org/address/' + userAddress + ") ∙ " + '[Dune Analytics](https://dune.com/whale_hunter/friend-tech-ultimate-analytics)' + " ∙ " + '[Holders](https://www.friend.tech/trades/' + userAddress + ")", inline: false }

                                                    )
                                                    .setTimestamp()
                                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                                /// TEMPORAIRE
                                                await interaction.editReply({ embeds: [getBlurOneWallet], components: [buttonsRow] })




                                                await interactionData.destroy({ where: { authorId: authorId, commandName: "friendtech-profit", serverId: serverId } })

                                                await interactionData.create({

                                                    authorId: authorId,
                                                    authorName: authorName,
                                                    serverId: serverId,
                                                    walletAddress: "N/A",
                                                    commandName: "friendtech-profit",
                                                    interactionId: interaction.id,
                                                    walletName: "N/A",
                                                    selecedTimestamp: "N/A",
                                                    embed1: "N/A",
                                                    embed2: "N/A",
                                                    embed3: "N/A",
                                                    pageIndex: "N/A",
                                                    actualPage: "N/A",
                                                    walletCategory: "eth",
                                                    selectedCollection: twUsername,
                                                    collectionSlug: "N/A",
                                                    collectionBanner: "N/A",
                                                    avgDeriskPrice: "N/A",
                                                    floorPrice: "N/A",
                                                    lowerMarketlace: "N/A",
                                                    collectionName: twName,
                                                    collectionTwitter: "N/A",
                                                    collectionWebsite: "N/A",
                                                    buyCount: buyCount.toString(),
                                                    mintCount: tradeCount.toString(),
                                                    soldCount: soldCount.toString(),
                                                    remaining: heldCount.toString(),
                                                    avgBuy: parseFloat(avgBuy).toFixed(3),
                                                    avgSold: parseFloat(avgSold).toFixed(3),
                                                    realisedProfit: parseFloat(realizedProfit).toFixed(3),
                                                    potentialProfit: parseFloat(potentialProfit).toFixed(3),
                                                    roi: potentialRoi.toString(),
                                                    visualTitle: "N/A",
                                                    userAvatar: userAvatar,
                                                    nbMembersInvolved: "N/A",
                                                    totalTradeCount: "N/A",

                                                })












                                            } catch (error) {

                                                console.log(error)
                                                const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                                    .setTitle("Friend Tech")
                                                    .setDescription("An error occured whil retreiving the Friend.tech profile. Please try again or feel free to contact a team member if you need help.")
                                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                                    .setTimestamp()
                                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                                await interaction.editReply({ embeds: [errorNotEthereum] });


                                            }





                                        } else {

                                            let usernameSuggestionFormatted = ""

                                            let index = 0
                                            for (const suggestion of findUser.data.users) {
                                                index++
                                                if (index <= 5) {

                                                    usernameSuggestionFormatted += "∙ " + suggestion.twitterUsername + "\n"
                                                } else {

                                                    break
                                                }

                                            }


                                            const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                                .setTitle("Friend Tech")
                                                .setDescription("The exact twitter username you entered isn't registered in Friend.tech.\n\n**Maybe you are looking for:** \n\n" + usernameSuggestionFormatted)
                                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                .setTimestamp()
                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                            await interaction.editReply({ embeds: [errorNotEthereum] });





                                        }

                                    } else {


                                        const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle("Friend Tech")
                                            .setDescription("The twitter username you entered isn't registered in Friend.tech. Please try again with a valid username.")
                                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                        await interaction.editReply({ embeds: [errorNotEthereum] });



                                    }


                                } else if (interaction.options.getSubcommand() === 'wallet') {




                                    const buttonsRowNew = new ActionRowBuilder()
                                        .addComponents(
                                            new ButtonBuilder()
                                                .setCustomId('infra_friendtechnewwallet-button')
                                                .setLabel('import wallet')
                                                .setStyle(1),

                                        );


                                    const buttonsRowModify = new ActionRowBuilder()
                                        .addComponents(
                                            new ButtonBuilder()
                                                .setCustomId('infra_friendtechmodifywallet-button')
                                                .setLabel('modify wallet')
                                                .setStyle(1),
                                            new ButtonBuilder()
                                                .setCustomId('infra_friendtechexportwallet-button')
                                                .setLabel('export')
                                                .setStyle(1),
                                            new ButtonBuilder()
                                                .setCustomId('infra_friendtechdeletewallet-button')
                                                .setLabel('delete wallet')
                                                .setStyle(4)
                                        );



                                    const userSetup = await infra_friendTech.findOne({ where: { authorId: authorId } })

                                    if (userSetup != null) {


                                        const walletAddress = decrypt(userSetup.dataValues.walletAddress)

                                        const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle("Friend Tech Setup")
                                            .setDescription(">>> Displaying your Friend.tech wallet setup")
                                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .addFields(
                                                { name: "Wallet:", value: "`" + walletAddress.toLowerCase() + "`", inline: true },

                                            )
                                            .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                        await interaction.editReply({ embeds: [errorNotEthereum], components: [buttonsRowModify] });


                                    } else if (userSetup == null) {




                                        const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle("Friend Tech Setup")
                                            .setDescription(">>> Displaying your Friend.tech wallet setup")
                                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .addFields(
                                                { name: " ", value: "You don't have a wallet imported in your Friend.tech portfolio. To get started, use the button below.", inline: true },

                                            )
                                            .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                        await interaction.editReply({ embeds: [errorNotEthereum], components: [buttonsRowNew] });


                                    }







                                }
                            } else if (!member.roles.cache.has(communityMemberRoleId)) {





                                const notMember = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle(`Bot Access`)
                                    .setDescription(">>> Showing access data")
                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .addFields(
                                        { name: " ", value: " ", inline: false },
                                        { name: "Status", value: "`Access Denied ❌`", inline: true },
                                        { name: "Required Role", value: "<@&" + communityMemberRoleId + ">", inline: true },
                                        { name: "Problem Detected", value: "Your access to the bot has been denied. You can only use the bot if you have the required role in this community. If you usually have access to the bot, make sure you're in the right community or contact an admin.", inline: false },
                                    )
                                    .setTimestamp()
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                await interaction.editReply({ embeds: [notMember] });

                            }

                        } else {

                            if (accessTier == "") {
                                accessTier = "Free Tier"
                            }

                            const botOff = new EmbedBuilder().setColor("#060A8F")
                                .setTitle(`Bot Access`)
                                .setDescription(">>> Showing the community's bot access")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .addFields(
                                    { name: 'Access Status', value: "`Denied 🔴`", inline: false },
                                    { name: 'Access Tier', value: "`" + accessTier.toUpperCase() + "`", inline: true },
                                    { name: 'Required Tier', value: "`B-TIER`", inline: true },
                                    { name: "Problem Detected", value: "Your access to this command has been denied. You need a higher access tier to use this feature. You can consult the available commands in this community by using `/access`.", inline: false },
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
                                { name: 'Access Status', value: "`Denied 🔴`", inline: true },
                                { name: 'Commands', value: "`Not available`", inline: true },
                                { name: "Problem Detected", value: "The bot access is currently inactive in this community. The community's administrator are the only one who can make it active or not, contact them for any inquiries.", inline: false },
                            )
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                        await interaction.editReply({ embeds: [botOff] });

                    }


                } else {


                    console.log("// Step 2 : Unauthorized - Executed ✅")


                    const botOff = new EmbedBuilder().setColor("#060A8F")
                        .setTitle(`Bot status`)
                        .setDescription(">>> Showing the bot status")
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .addFields(
                            { name: 'Global Status', value: "`Inactive 🔴`", inline: true },
                            { name: 'Commands', value: "`Not available`", inline: true },
                            { name: "Problem Detected", value: "The bot is currently inactive in this community. The community's administrator are the only who are able to switch the bot on, contact them for any inquiries.", inline: false },
                        )
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.editReply({ embeds: [botOff] });

                    console.log("// Step 3 : Answer - Executed ✅")


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
                let reportCommand = "/friendtech"

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
                    .setFooter({ text: 'Powered by Aura', iconURL: 'https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png' })


                await interaction.editReply({ embeds: [errorAnswerUser], ephemeral: true });


            }

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
};



async function getFTHolding(userAddress) {

    let heldValue = 0


    let userHoldingCall = await axios.get("https://prod-api.kosetto.com/users/" + userAddress + "/token-holdings")



    if (userHoldingCall.data.nextPageStart != 50) {

        for (const holding of userHoldingCall.data.users) {

            let holdingAddress = holding.address.toLowerCase()

            const holderInfo = await axios.get("https://prod-api.kosetto.com/users/" + holdingAddress)
            let holderPrice = holderInfo.data.displayPrice / 10 ** 18

            let balance = holding.balance
            let totalValue = balance * holderPrice

            heldValue += parseFloat(totalValue)



        }

    } else {

        for (const holding of userHoldingCall.data.users) {


            let holdingAddress = holding.address.toLowerCase()


            const holderInfo = await axios.get("https://prod-api.kosetto.com/users/" + holdingAddress)
            let holderPrice = holderInfo.data.displayPrice / 10 ** 18

            let balance = holding.balance
            let totalValue = balance * holderPrice

            heldValue += parseFloat(totalValue)

        }

        let itemsNumber = 50
        let callPage = ""

        let continuation = userHoldingCall.data.nextPageStart

        while (continuation != null) {




            callPage = await axios.get("https://prod-api.kosetto.com/users/" + userAddress + "/token-holdings?pageStart=" + itemsNumber)

            continuation = callPage.data.nextPageStart

            if (continuation != null) {

                for (const holding of callPage.data.users) {

                    let holdingAddress = holding.address.toLowerCase()

                    const holderInfo = await axios.get("https://prod-api.kosetto.com/users/" + holdingAddress)
                    let holderPrice = holderInfo.data.displayPrice / 10 ** 18

                    let balance = holding.balance
                    let totalValue = balance * holderPrice

                    heldValue += parseFloat(totalValue)


                }


                itemsNumber += 50

            } else {
                break
            }
        }
    }


    return heldValue





}