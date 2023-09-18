/**
 * @file Sample setwallet command with slash command.
 * @author VitalityMigo
 */

// On définit des constantes qui serviront dans l'ensemble de la commande
const { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { profileData, accessSql, apimonitorsql, wallets, reportsql, adminsql, usersql, interactionData, watchlistSql, sequelize } = require('../../../events/database');

const reduceText = require("../../../functions/reducetext")
const getTwitterUserInfo = require("../../../functions/twitteruserinfo")

//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const etherscanApiKey = process.env.etherscanApiKey
const friendtechApiKey = process.env.friendtechApiKey

const axios = require('axios')


function isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}


const friendtechHeaders = {
    'Authorization': friendtechApiKey, // Remplacez VOTRE_TOKEN par le token d'authentification
    // Autres en-têtes si nécessaire
};



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
                        .setName("address")
                        .setDescription("The user's friend.tech Base address")
                        .setRequired(true)

                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("portfolio")
                .setDescription("Display various metrics about a friend.tech user's portfolio")
                .addStringOption(option =>
                    option
                        .setName("address")
                        .setDescription("The user's friend.tech Base address")
                        .setRequired(true)

                )
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



            //  try {

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



                                const givenUsername = interaction.options.getString("address").toLowerCase()



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

                                            console.log(airdropInfos)
                                            airdropTier = airdropInfos.data.tier.toUpperCase()
                                            airdropPoints = airdropInfos.data.totalPoints




                                            // Calcul des dernières valeurs
                                            marketCap = price * shareSupply
                                            uniqueHolders = (holderCount / shareSupply) * 100;

                                            if (holdersFormattedEmbeds == "") { holdersFormattedEmbeds = "```No holders found for this share.                         ```" }
                                            if (tradersFormatted == "") { tradersFormatted = "```No recent trade found for this share.                    ```" }





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

                                            await interaction.editReply({ embeds: [userFTEmbed] });



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


                                const userAddress = interaction.options.getString("address").toLowerCase()


                                if (isValidEthereumAddress(userAddress)) {




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

                                                console.log("ici")
                                                console.log(continuation)

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
                                                    console.log(itemsNumber)
                                                } else {
                                                    break
                                                }
                                            }
                                        }


                                        // Tri du tableau JSON en fonction de la valeur "floorAsk * tokenCount" de chaque objet "collection" en ordre décroissant
                                        let holdingTableSorted = holdingTable.sort((a, b) => b.balance * b.price - a.balance * a.price)

                                        console.log(holdingTableSorted)


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

                                        console.log(holdingFormatted)

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

                                        const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle("Friend Tech")
                                            .setDescription("The wallet address you entered isn't registered on Friend Tech. Please try again using a valid wallet.")
                                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                        await interaction.editReply({ embeds: [errorNotEthereum] });


                                    }



                                } else {


                                    const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle("Friend Tech")
                                        .setDescription("The wallet address you entered isn't a valid Ethereum (Base) wallet address. Please try again using a valid wallet.")
                                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                    await interaction.editReply({ embeds: [errorNotEthereum] });



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
            //     let reportCommand = "/friendtech"

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
            //         .setFooter({ text: 'Powered by Rolls Chasers Analytics', iconURL: 'https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png' })


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
};

