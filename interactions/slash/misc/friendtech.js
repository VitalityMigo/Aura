/**
 * @file Sample setwallet command with slash command.
 * @author VitalityMigo
 */

// On définit des constantes qui serviront dans l'ensemble de la commande
const { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { profileData, accessSql, apimonitorsql, wallets, reportsql, adminsql, usersql, interactionData, watchlistSql, exe_friendTech, infra_friendTech, sequelize } = require('../../../events/database');

// Param d'infrastructure
const { authPrivacyMulti, communityInfos } = require("../../../functions/infra-utils")
const privateCMD = ['wallet', 'portfolio', 'tasks', 'bridge', 'tracker']

const reduceText = require("../../../functions/reducetext")
const getTwitterUserInfo = require("../../../functions/twitteruserinfo")
const getTimeAgo = require("../../../functions/timeago")
const getTimeAgoSmall = require("../../../functions/timeagosmall")
const countEmojis = require("../../../functions/isemoji")

const { getEthPrice } = require("../../../config/web3data")
const { formatHoldersData, formatTradesData } = require('../../../functions/FT-useraccelerator');


const moment = require("moment")
const decrypt = require("../../../functions/decrypt")
const encrypt = require("../../../functions/encrypt")


//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const friendtechApiKey = process.env.friendtechApiKey


const friendtechHeaders = {
    'Authorization': friendtechApiKey, // Remplacez VOTRE_TOKEN par le token d'authentification
    // Autres en-têtes si nécessaire
};


const axios = require('axios')


const { web3Base1RPC, web3BaseUnifra } = require('../../../config/web3config');


// On crée des instances des contrats
const mainnetBridgeContractAbi = require("../../../contracts/base/l1basebridge.json");
const mainnetBridgeProxyContractAddress = "0x3154cf16ccdb4c6d922629664174b904d80f2c35"
const mainnetBridgeContract = new web3BaseUnifra.eth.Contract(mainnetBridgeContractAbi, mainnetBridgeProxyContractAddress);




function removeAtSymbol(word) {
    if (word.startsWith('@')) {
        return word.slice(1); // Supprime le "@" en prenant une sous-chaîne à partir du deuxième caractère.
    } else {
        return word; // Retourne le mot tel quel s'il n'y a pas de "@".
    }
}


function formatWallet(input) {
    return input.length > 35 ? `${input.substring(0, 5)}…${input.substring(input.length - 4)}` : input;
}


// On fait les bouttons

const buttonsRow = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('friendtechprofitvisual-button')
            .setLabel('visual')
            .setStyle(2)
    );



const buttonsRowNew = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('infra_friendtechnewwallet-button')
            .setLabel('import wallet')
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId('infra_friendtechgeneratewallet-button')
            .setLabel('generate wallet')
            .setStyle(3),

    );

const buttonRowChoiceBridge = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('friendtech_exec_bridgeconfirm')
            .setLabel('Confirm')
            .setEmoji("✅")
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId('friendtech_exec_bridgecancel')
            .setLabel('Cancel')
            .setStyle(4),

    );


const buttonRowChoiceNoBridge = new ActionRowBuilder()
    .addComponents(

        new ButtonBuilder()
            .setCustomId('friendtech_exec_bridgecancel')
            .setLabel('Cancel')
            .setStyle(4),

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
                        .setRequired(true),
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
                .addStringOption(option =>
                    option
                        .setName("share")
                        .setDescription("Filter the user's PnL by a specific share (i.e vitalitymigo)")
                        .setRequired(false)

                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("wallet")
                .setDescription("Manage your Friend.tech buy and sell wallet")

        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("bridge")
                .setDescription("Bridge ETH from the mainnet to Base and vise versa")
                .addStringOption(option =>
                    option
                        .setName("type")
                        .setDescription("Select the direction for bridging ETH")
                        .setRequired(true)
                        .setChoices(
                            {
                                name: 'Mainnet to Base',
                                value: 'mainnet_to_base',
                            },
                            {
                                name: 'Base to Mainnet',
                                value: 'base_to_mainnet',
                            }
                        )
                )
                .addStringOption(option =>
                    option
                        .setName("amount")
                        .setDescription("The amount of ETH to bridge")
                        .setRequired(true)

                ),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("interactions")
                .setDescription("Display the Friend.Tech interactions between two users")
                .addStringOption(option =>
                    option
                        .setName("twitter1")
                        .setDescription("The first user's twitter username (i.e vitalitymigo")
                        .setRequired(true)

                )
                .addStringOption(option =>
                    option
                        .setName("twitter2")
                        .setDescription("The second user's twitter username (i.e apedegennft.eth")
                        .setRequired(true)

                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("airdrop")
                .setDescription("Display the airdrop metrics of a Friend.Tech user")
                .addStringOption(option =>
                    option
                        .setName("twitter")
                        .setDescription("The user's twitter username (i.e vitalitymigo")
                        .setRequired(true)

                )

        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("tasks")
                .setDescription("Create and manage your Friend.Tech automation tasks")

        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("tracker")
                .setDescription("Create and manage your Friend.Tech tracking alerts")

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

            const subcommand = interaction.options.getSubcommand()

            try {

                console.log("Initialization: executed ✅")

                // Récupère les infos de la communauté
                const community = await communityInfos(serverId)

                //Récupère régagle de privé/ou pas de l'utilisateur
                const privacy = await authPrivacyMulti(authorId, subcommand, privateCMD)
                if (privacy) { await interaction.deferReply({ ephemeral: true }) }
                else { await interaction.deferReply() }


                // Les vérifications
                if (community.statut) {

                    if (community.tier === 's-tier' || community.tier === 'a-tier') {

                        if (member.roles.cache.has(community.member)) {


                            if (subcommand === 'user') {




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

                                // let holdersFormattedEmbeds = ""
                                let uniqueHolders = 0

                                let lastTrade = 0
                                let lastMessage = 0
                                let lastOnlineTimestamp = 0
                                let joinedAt = 0

                                let airdropTier = "UNRANKED"
                                let airdropPoints = 0

                                let watchlistCount = 0
                                let holdingCount = 0

                                let volume6h = 0
                                let volume1d = 0
                                let volume7d = 0

                                //  let tradersFormatted = ""

                                let followers = "`None`"
                                let following = "`None`"
                                let created = "`Unknwon`"

                                let userAddress = ""

                                let findUser = []
                                let isMatch = true
                                let isExactMatch = true
                                let pfp2 = ""



                                const usernameProvided = interaction.options.getString("twitter").toLowerCase()

                                const givenUsername = removeAtSymbol(usernameProvided)
                                const ethUsdPrice = getEthPrice()


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

                                            const twitterPromise = getTwitterUserInfo(user.twitterUsername)
                                            const tradersPromise = formatTradesData(userAddress)
                                            // const airdropInfoCall = axios.get("https://prod-api.kosetto.com/points/" + userAddress, { headers: friendtechHeaders })
                                            const balanceCall = web3BaseUnifra.eth.getBalance(userAddress)


                                            const userInfoCall = await axios.get("https://prod-api.kosetto.com/users/" + userAddress)



                                            address = userInfoCall.data.address
                                            id = userInfoCall.data.id
                                            twitterUsername = userInfoCall.data.twitterUsername
                                            twitterName = userInfoCall.data.twitterName
                                            twitterUserId = userInfoCall.data.twitterUserId
                                            lastOnlineTimestamp = parseFloat(userInfoCall.data.lastOnline / 1000).toFixed(0)
                                            lastMessage = parseFloat(userInfoCall.data.lastMessageTime / 1000).toFixed(0)
                                            joinedAt = 1
                                            holderCount = userInfoCall.data.holderCount
                                            shareSupply = userInfoCall.data.shareSupply
                                            price = userInfoCall.data.displayPrice / 10 ** 18
                                            totalFeesCollected = userInfoCall.data.lifetimeFeesCollectedInWei / 10 ** 18
                                            pfp2 = userInfoCall.data.twitterPfpUrl
                                            watchlistCount = userInfoCall.data.watchlistCount
                                            holdingCount = userInfoCall.data.holdingCount




                                            const holdersPromise = formatHoldersData(userAddress, price, shareSupply)




                                            // Calcul des dernières valeurs
                                            marketCap = price * shareSupply
                                            uniqueHolders = (holderCount / shareSupply) * 100;




                                            const buttonRow = new ActionRowBuilder()
                                                .addComponents(
                                                    new ButtonBuilder()
                                                        .setCustomId('button_friendtech_exec_buy_' + userAddress)
                                                        .setLabel('📈 Buy')
                                                        .setStyle(3),
                                                    new ButtonBuilder()
                                                        .setCustomId('button_friendtech_exec_quickbuy_' + userAddress)
                                                        .setLabel('💫 Flash Buy')
                                                        .setStyle(3),
                                                    new ButtonBuilder()
                                                        .setCustomId('button_friendtech_exec_sell_' + userAddress)
                                                        .setLabel('📉 Sell')
                                                        .setStyle(4),
                                                    new ButtonBuilder()
                                                        .setCustomId('button_friendtech_exec_quicksell_' + userAddress)
                                                        .setLabel('❄️ Flash Sell')
                                                        .setStyle(4),
                                                    new ButtonBuilder()
                                                        .setCustomId('friendtech_exec_setup-button')
                                                        .setLabel('💻 Setup')
                                                        .setStyle(1),

                                                )


                                            const buttonRow2 = new ActionRowBuilder()
                                                .addComponents(
                                                    new ButtonBuilder()
                                                        .setCustomId('button_friendtech_user_refresh_' + userAddress)
                                                        .setLabel('🔄 Refresh')
                                                        .setStyle(1),
                                                    new ButtonBuilder()
                                                        .setCustomId('friendtech_infra_help-button')
                                                        .setLabel('📑 Tutorial')
                                                        .setStyle(1),
                                                    new ButtonBuilder()
                                                        .setCustomId('button_friendtech_infra_security_' + userAddress)
                                                        .setLabel('📡 Audit')
                                                        .setStyle(1),


                                                )


                                            let [balanceRaw, twitterInfos] = await Promise.all([balanceCall, twitterPromise]);

                                            if (twitterInfos) {
                                                followers = twitterInfos.followers_count
                                                following = twitterInfos.friends_count
                                                let pfp = twitterInfos.profile_image_url_https
                                                twitterPfp = pfp.replace("_normal", "")

                                                created = "<t:" + Math.floor(((new Date(twitterInfos.created_at)).getTime() / 1000)) + ":R>"
                                            } else {
                                                twitterPfp = pfp2
                                            }


                                            const balance = balanceRaw / 10 ** 18
                                            // On récup les points d'airdrops
                                            //  airdropTier = airdropInfos.data.tier.toUpperCase()
                                            //  airdropPoints = airdropInfos.data.totalPoints
                                            //  let airdropRank = airdropInfos.data.leaderboard


                                            let [holdersFormattedEmbeds, tradersFormatted] = await Promise.all([holdersPromise, tradersPromise]);


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
                                                    { name: "Created", value: created, inline: true },
                                                    { name: " ", value: " ", inline: false },
                                                    { name: "Price", value: "`" + parseFloat(price).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(price * ethUsdPrice).toFixed(0)) + "$)`", inline: true },
                                                    { name: "Market Cap", value: "`" + parseFloat(marketCap).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(marketCap * ethUsdPrice).toFixed(0)) + "$)`", inline: true },
                                                    { name: " ", value: " ", inline: true },
                                                    { name: "Share Supply", value: "`" + shareSupply + "`", inline: true },
                                                    { name: "Holders", value: "`" + holderCount + "`", inline: true },
                                                    { name: "Unique Holders", value: "`" + parseFloat(uniqueHolders).toFixed(1) + "%`", inline: true },
                                                    { name: "Holding", value: "`" + holdingCount + "`", inline: true },
                                                    { name: "Watchlist", value: "`" + watchlistCount + "`", inline: true },
                                                    { name: "Balance", value: "`" + parseFloat(balance).toFixed(3) + "Ξ`", inline: true },
                                                    { name: " ", value: " ", inline: false },
                                                    { name: "Last Online", value: "<t:" + lastOnlineTimestamp + ":R>", inline: true },
                                                    { name: "Last Message", value: "<t:" + lastMessage + ":R>", inline: true },
                                                    { name: "Joined At", value: "<t:" + joinedAt + ":R>", inline: true },
                                                    { name: "Holders:", value: holdersFormattedEmbeds, inline: false },
                                                    { name: "Last Trades:", value: tradersFormatted, inline: false },
                                                    { name: "FT Wallet:", value: "```" + userAddress + "```", inline: false },
                                                    { name: "Links", value: '[Friendtech](https://www.friend.tech/rooms/' + userAddress + ") ∙ " + '[Twitter](https://twitter.com/' + twitterUsername.toLowerCase() + ") ∙ " + '[Basescan](https://basescan.org/address/' + userAddress + ") ∙ " + '[Holders](https://www.friend.tech/trades/' + userAddress + ") ∙ " + '[Chart](https://www.degenz.finance/friendtech/portfolio?address=' + userAddress + ")", inline: false }

                                                )
                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                            await interaction.editReply({ embeds: [userFTEmbed], components: [buttonRow, buttonRow2] });



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

                            } else if (subcommand === 'portfolio') {




                                let totalFTValue = 0
                                let totalSharesValue = 0
                                let totalFeesCollected = 0

                                let holdingCount = 0
                                let totalShares = 0

                                let holdingTable = []

                                let twitterUsername = ""
                                let twitterName = ""
                                let twitterPfp = ""


                                let findUser = []
                                let isMatch = true
                                let isExactMatch = true


                                let userSetAddress = "0x"
                                let userAddress = ""

                                const usernameProvided = interaction.options.getString("twitter").toLowerCase()

                                const givenUsername = removeAtSymbol(usernameProvided)


                                try {
                                    findUser = await axios.get('https://prod-api.kosetto.com/search/users?username=' + givenUsername, { headers: friendtechHeaders })
                                } catch (error) {
                                    isMatch = false
                                }


                                if (isMatch == true) {


                                    const user = findUser.data.users.find((user) => user.twitterUsername.toLowerCase() == givenUsername.toLowerCase());
                                    console.log("1")


                                    if (user) {


                                        userAddress = user.address.toLowerCase()






                                        try {

                                            const userSetup = await infra_friendTech.findOne({ where: { authorId: authorId } })
                                            let isUserSetupDisable = false

                                            if (userSetup != null) {
                                                userSetAddress = decrypt(userSetup.dataValues.walletAddress).toLowerCase()

                                                if (userSetAddress == userAddress) {
                                                    isUserSetupDisable = true
                                                }
                                            }







                                            const buttonsRowNoPortfolio = new ActionRowBuilder()
                                                .addComponents(
                                                    new ButtonBuilder()
                                                        .setCustomId('friendtech-portfolio-first-button')
                                                        .setLabel('first page')
                                                        .setStyle(2)
                                                        .setDisabled(true),
                                                    new ButtonBuilder()
                                                        .setCustomId('friendtech-portfolio-previous-button')
                                                        .setLabel('previous page')
                                                        .setStyle(2)
                                                        .setDisabled(true),
                                                    new ButtonBuilder()
                                                        .setCustomId('friendtech-portfolio-next-button')
                                                        .setLabel('next page')
                                                        .setStyle(2)
                                                        .setDisabled(true),
                                                    new ButtonBuilder()
                                                        .setCustomId('friendtech-portfolio-last-button')
                                                        .setLabel('last page')
                                                        .setStyle(2)
                                                        .setDisabled(true),
                                                    new ButtonBuilder()
                                                        .setCustomId('button_friendtech_portfolio_exec_myportfolio')
                                                        .setLabel('👝 My Portfolio')
                                                        .setStyle(1)
                                                        .setDisabled(isUserSetupDisable),
                                                );


                                            const buttonsRowPortfolio = new ActionRowBuilder()
                                                .addComponents(
                                                    new ButtonBuilder()
                                                        .setCustomId('friendtech-portfolio-first-button')
                                                        .setLabel('first page')
                                                        .setStyle(2)
                                                        .setDisabled(true),
                                                    new ButtonBuilder()
                                                        .setCustomId('friendtech-portfolio-previous-button')
                                                        .setLabel('previous page')
                                                        .setStyle(2)
                                                        .setDisabled(true),
                                                    new ButtonBuilder()
                                                        .setCustomId('friendtech-portfolio-next-button')
                                                        .setLabel('next page')
                                                        .setStyle(2),
                                                    new ButtonBuilder()
                                                        .setCustomId('friendtech-portfolio-last-button')
                                                        .setLabel('last page')
                                                        .setStyle(2),
                                                    new ButtonBuilder()
                                                        .setCustomId('button_friendtech_portfolio_exec_myportfolio')
                                                        .setLabel('👝 My Portfolio')
                                                        .setStyle(1)
                                                        .setDisabled(isUserSetupDisable),
                                                );


                                            const buttonsRowPortfolioAction = new ActionRowBuilder()
                                                .addComponents(
                                                    new ButtonBuilder()
                                                        .setCustomId('button_friendtech_portfolio_exec_liqAll')
                                                        .setLabel('💣 Liquidate All')
                                                        .setStyle(4),
                                                    new ButtonBuilder()
                                                        .setCustomId('button_friendtech_portfolio_exec_liqFew')
                                                        .setLabel('🧯 Liquidate Few')
                                                        .setStyle(4),
                                                    new ButtonBuilder()
                                                        .setCustomId('button_friendtech_portfolio_exec_liqOne')
                                                        .setLabel('🎯 Liquidate One')
                                                        .setStyle(3),
                                                    new ButtonBuilder()
                                                        .setCustomId('button_friendtech_portfolio_exec_liqOverOne')
                                                        .setLabel('🪄 Liquidate +1')
                                                        .setStyle(3),

                                                );

                                            const buttonsRowPortfolioAction2 = new ActionRowBuilder()
                                                .addComponents(
                                                    new ButtonBuilder()
                                                        .setCustomId('button_friendtech_portfolio_exec_refresh')
                                                        .setLabel('🔁 Refresh')
                                                        .setStyle(1),
                                                    new ButtonBuilder()
                                                        .setCustomId('button_friendtech_portfolio_exec_tutorial')
                                                        .setLabel('📑 Tutorial')
                                                        .setStyle(1),
                                                    new ButtonBuilder()
                                                        .setCustomId('button_friendtech_portfolio_exec_userlookup')
                                                        .setLabel('👁 User Lookup')
                                                        .setStyle(1),
                                                    new ButtonBuilder()
                                                        .setCustomId('friendtech_exec_setup-button')
                                                        .setLabel('💻 Setup')
                                                        .setStyle(1),



                                                );



                                            const userBalance = parseFloat(await web3BaseUnifra.eth.getBalance(userAddress)) / 10 ** 18
                                            //{}


                                            const userInfoCall = await axios.get("https://prod-api.kosetto.com/users/" + userAddress)

                                            holdingCount = userInfoCall.data.holdingCount
                                            totalFeesCollected = userInfoCall.data.lifetimeFeesCollectedInWei / 10 ** 18
                                            twitterUsername = userInfoCall.data.twitterUsername
                                            twitterName = userInfoCall.data.twitterName
                                            twitterPfp = userInfoCall.data.twitterPfpUrl


                                            let userHoldingCall = await axios.get("https://prod-api.kosetto.com/users/" + userAddress + "/token-holdings")

                                            console.log("2")


                                            if (userHoldingCall.data.nextPageStart != 50) {

                                                for (const holding of userHoldingCall.data.users) {

                                                    let holdingAddress = holding.address.toLowerCase()

                                                    const holderInfo = await axios.get("https://prod-api.kosetto.com/users/" + holdingAddress)
                                                    let holderPrice = holderInfo.data.displayPrice / 10 ** 18


                                                    let obj = {}
                                                    obj.username = holding.twitterUsername
                                                    obj.address = holding.address.toLowerCase()
                                                    obj.pfp = holding.twitterPfpUrl.toLowerCase()
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
                                                    obj.address = holding.address.toLowerCase()
                                                    obj.pfp = holding.twitterPfpUrl.toLowerCase()
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
                                                            obj.username = holding.twitterUsername.toLowerCase()
                                                            obj.pfp = holding.twitterPfpUrl.toLowerCase()
                                                            obj.address = holding.address.toLowerCase()
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



                                            let holdingFormatted = "Subject                  #Held        Price        Value\n\n"
                                            let index = 0

                                            // On construit la table d'holders
                                            for (const holding of holdingTableSorted) {

                                                index++

                                                if (index <= 16) {

                                                    let holderName = reduceText(holding.username, 26).toLowerCase()
                                                    let holderBalance = holding.balance
                                                    let price = parseFloat(holding.price).toFixed(3)
                                                    let holderValue = parseFloat(holderBalance * holding.price).toFixed(3)


                                                    let part1 = holderName
                                                    let part2 = holderBalance
                                                    let part3 = parseFloat(price).toFixed(2) + "Ξ"
                                                    let part4 = parseFloat(holderValue).toFixed(2) + "Ξ\n"


                                                    let spaceSize = 30 - part2.length - part1.length
                                                    let spaceLenght = ""
                                                    for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

                                                    let spaceSize2 = 13 - part3.length
                                                    let spaceLenght2 = ""
                                                    for (let i = 0; i < spaceSize2; i++) { spaceLenght2 += " " }

                                                    let spaceSize3 = 13 - part4.length
                                                    let spaceLenght3 = ""
                                                    for (let i = 0; i < spaceSize3; i++) { spaceLenght3 += " " }


                                                    holdingFormatted += part1 + spaceLenght + part2 + spaceLenght2 + part3 + spaceLenght3 + part4



                                                } else {
                                                    break
                                                }
                                            }

                                            const itemsPerPage = 16; // Nombre d'objets par page
                                            const pageIndex = Math.ceil(holdingTableSorted.length / itemsPerPage);


                                            totalFTValue = totalSharesValue + userBalance

                                            if (holdingFormatted == "") { holdingFormatted = "```No shares found for this user.                         ```" }


                                            console.log("3")
                                            const userFTEmbed = new EmbedBuilder().setColor("#060A8F")
                                                .setTitle(twitterName + "'s portfolio")
                                                .setDescription(">>> Displaying the friend.tech portfolio metrics.")
                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                //.setThumbnail(twitterPfp)
                                                .setTimestamp()
                                                .addFields(
                                                    { name: " ", value: " ", inline: false },
                                                    { name: "Total Value", value: "`" + parseFloat(totalFTValue).toFixed(3) + "Ξ`", inline: true },
                                                    { name: "Shares Value", value: "`" + parseFloat(totalSharesValue).toFixed(3) + "Ξ`", inline: true },
                                                    { name: "Base ETH Value", value: "`" + parseFloat(userBalance).toFixed(3) + "Ξ`", inline: true },
                                                    { name: " ", value: " ", inline: false },
                                                    { name: "Shares:", value: "```" + holdingFormatted + "```", inline: false },
                                                    { name: "Links", value: '[Friendtech](https://www.friend.tech/rooms/' + userAddress + ") ∙ " + '[Twitter](https://twitter.com/' + twitterUsername.toLowerCase() + ") ∙ " + '[Basescan](https://basescan.org/address/' + userAddress + ") ∙ " + '[Holding](https://www.friend.tech/trades/' + userAddress + ") ∙ " + '[Chart](https://www.degenz.finance/friendtech/portfolio?address=' + userAddress + ")", inline: false },
                                                    { name: "Page:", value: "`[1/" + pageIndex + "]`", inline: false },

                                                )
                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                                            if (isUserSetupDisable == false) {
                                                if (pageIndex <= 1) { await interaction.editReply({ embeds: [userFTEmbed], components: [buttonsRowNoPortfolio] }); }
                                                else { await interaction.editReply({ embeds: [userFTEmbed], components: [buttonsRowPortfolio] }); }
                                            } else {
                                                if (pageIndex <= 1) { await interaction.editReply({ embeds: [userFTEmbed], components: [buttonsRowNoPortfolio, buttonsRowPortfolioAction, buttonsRowPortfolioAction2] }); }
                                                else { await interaction.editReply({ embeds: [userFTEmbed], components: [buttonsRowPortfolio, buttonsRowPortfolioAction, buttonsRowPortfolioAction2] }); }

                                            }


                                            let holdingDataTable = []
                                            let obj = {}
                                            obj.name = twitterName
                                            obj.username = twitterUsername
                                            obj.address = userAddress
                                            obj.totalValue = parseFloat(totalFTValue).toFixed(3) + "Ξ"
                                            obj.shareValue = parseFloat(totalSharesValue).toFixed(3) + "Ξ"
                                            obj.userBalance = parseFloat(userBalance).toFixed(3) + "Ξ"
                                            obj.links = '[Friendtech](https://www.friend.tech/rooms/' + userAddress + ") ∙ " + '[Twitter](https://twitter.com/' + twitterUsername.toLowerCase() + ") ∙ " + '[Basescan](https://basescan.org/address/' + userAddress + ") ∙ " + '[Holding](https://www.friend.tech/trades/' + userAddress + ") ∙ " + '[Chart](https://www.degenz.finance/friendtech/portfolio?address=' + userAddress + ")"
                                            holdingDataTable.push(obj)


                                            //On fait le call àbn  la base SQL
                                            await interactionData.destroy({ where: { authorId: authorId, commandName: "friendtech-portfolio", serverId: serverId } })

                                            await interactionData.create({

                                                authorId: authorId,
                                                authorName: authorName,
                                                serverId: serverId,
                                                commandName: "friendtech-portfolio",
                                                interactionId: interaction.id,
                                                walletAddress: "N/A",
                                                walletCategory: "N/A",
                                                embed1: JSON.stringify(holdingTableSorted),
                                                embed2: JSON.stringify(holdingDataTable),
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



                            } else if (subcommand === 'trades') {


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

                                                    let name = trade.trader.name
                                                    let username = trade.trader.username
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

                                                    let name = trade.subject.name
                                                    let username = trade.subject.username
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
                                                { name: "Links", value: '[Friendtech](https://www.friend.tech/rooms/' + userAddress + ") ∙ " + '[Twitter](https://twitter.com/' + twitterUsername.toLowerCase() + ") ∙ " + '[Basescan](https://basescan.org/address/' + userAddress + ") ∙ " + '[Holders](https://www.friend.tech/trades/' + userAddress + ") ∙ " + '[Chart](https://www.degenz.finance/friendtech/portfolio?address=' + userAddress + ")", inline: false }

                                            );



                                            const buttonRow = new ActionRowBuilder()
                                                .addComponents(
                                                    new ButtonBuilder()
                                                        .setCustomId('button_friendtech_exec_buy_' + userAddress)
                                                        .setLabel('📈 Buy')
                                                        .setStyle(3),
                                                    new ButtonBuilder()
                                                        .setCustomId('button_friendtech_exec_quickbuy_' + userAddress)
                                                        .setLabel('💫 Flash Buy')
                                                        .setStyle(3),
                                                    new ButtonBuilder()
                                                        .setCustomId('button_friendtech_exec_sell_' + userAddress)
                                                        .setLabel('📉 Sell')
                                                        .setStyle(4),
                                                    new ButtonBuilder()
                                                        .setCustomId('button_friendtech_exec_quicksell_' + userAddress)
                                                        .setLabel('❄️ Flash Sell')
                                                        .setStyle(4),
                                                    new ButtonBuilder()
                                                        .setCustomId('friendtech_exec_setup-button')
                                                        .setLabel('💻 Setup')
                                                        .setStyle(1),

                                                )


                                            const buttonRow2 = new ActionRowBuilder()
                                                .addComponents(
                                                    new ButtonBuilder()
                                                        .setCustomId('button_friendtech_trade_refresh_' + userAddress)
                                                        .setLabel('🔄 Refresh')
                                                        .setStyle(1),
                                                    new ButtonBuilder()
                                                        .setCustomId('friendtech_infra_help-button')
                                                        .setLabel('📑 Tutorial')
                                                        .setStyle(1),
                                                    new ButtonBuilder()
                                                        .setCustomId('button_friendtech_infra_security_' + userAddress)
                                                        .setLabel('📡 Audit')
                                                        .setStyle(1),


                                                )






                                            await interaction.editReply({ embeds: [userFTEmbed], components: [buttonRow, buttonRow2] });




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


                            } else if (subcommand === 'stats') {




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









                            } else if (subcommand === 'holders') {



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
                                            let twUsername = user.twitterUsername
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



                                                let linksFormatted = '[Friendtech](https://www.friend.tech/rooms/' + userAddress + ") ∙ " + '[Twitter](https://twitter.com/' + twUsername.toLowerCase() + ") ∙ " + '[Basescan](https://basescan.org/address/' + userAddress + ") ∙ " + '[Holders](https://www.friend.tech/trades/' + userAddress + ") ∙ " + '[Chart](https://www.degenz.finance/friendtech/portfolio?address=' + userAddress + ")"


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

                            } else if (subcommand === 'profit') {


                                let findUser = []
                                let isMatch = true

                                const usernameProvided = interaction.options.getString("twitter").toLowerCase()

                                let shareProvided = ""
                                if (interaction.options.getString("share")) {
                                    shareProvided = removeAtSymbol(interaction.options.getString("share")).toLowerCase()
                                }


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
                                            const etherscanTokenPrice = getEthPrice()
                                            const ethUsdPrice = etherscanTokenPrice.data.result.ethusd


                                            const holdingTable = await getFTHolding(userAddress, shareProvided)

                                            heldValue = holdingTable.heldValue
                                            heldCount = holdingTable.heldCount


                                            const userInfoCall = await axios.get("https://prod-api.kosetto.com/users/" + userAddress)

                                            let twName = userInfoCall.data.twitterName
                                            let twUsername = userInfoCall.data.twitterUsername
                                            let twPfp = userInfoCall.data.twitterPfpUrl

                                            //        heldCount = userInfoCall.data.holdingCount



                                            const holdersCall = await axios.get("https://prod-api.kosetto.com/users/" + userAddress + "/trade-activity")
                                            let holdersTable = holdersCall.data.users

                                            if (shareProvided != "") { holdersTable = holdersTable.filter((obj) => obj.twitterUsername.toLowerCase() == shareProvided.toLowerCase()); }




                                            if (holdersCall.data.nextPageStart != 50) {

                                                for (const holding of holdersTable) {

                                                    let subjectAddress = holding.subject.address
                                                    let isBuy = holding.isBuy
                                                    let amount = holding.shareAmount
                                                    let price = holding.ethAmount / 10 ** 18
                                                    let time = holding.createdAt

                                                    // C'est un in
                                                    if (isBuy == true) {



                                                        buyCount += parseFloat(amount)
                                                        tradeCount += parseFloat(amount)
                                                        buySpent += price
                                                        buyFeeSpent += price * (totalFees / 100)


                                                    } else {
                                                        // C'est un out

                                                        soldCount += parseFloat(amount)
                                                        tradeCount += parseFloat(amount)
                                                        soldValue += price
                                                        soldFeeValue += price * (totalFees / 100)



                                                    }


                                                    if (!sharesTable.includes(subjectAddress.toLowerCase())) {
                                                        sharesTable.push(subjectAddress.toLowerCase())
                                                    }




                                                }

                                            } else {

                                                for (const holding of holdersTable) {


                                                    let subjectAddress = holding.subject.address
                                                    let isBuy = holding.isBuy
                                                    let amount = holding.shareAmount
                                                    let price = holding.ethAmount / 10 ** 18
                                                    let time = holding.createdAt


                                                    // C'est un in
                                                    if (isBuy == true) {



                                                        buyCount += parseFloat(amount)
                                                        tradeCount += parseFloat(amount)
                                                        buySpent += price
                                                        buyFeeSpent += price * (totalFees / 100)


                                                    } else {
                                                        // C'est un out

                                                        soldCount += parseFloat(amount)
                                                        tradeCount += parseFloat(amount)
                                                        soldValue += price
                                                        soldFeeValue += price * (totalFees / 100)



                                                    }


                                                    if (!sharesTable.includes(subjectAddress.toLowerCase())) {
                                                        sharesTable.push(subjectAddress.toLowerCase())
                                                    }


                                                }

                                                let itemsNumber = 50
                                                let callPage = ""
                                                let callPageFiltered = ""

                                                let continuation = holdersCall.data.nextPageStart

                                                while (continuation != null) {




                                                    callPage = await axios.get("https://prod-api.kosetto.com/users/" + userAddress + "/trade-activity?pageStart=" + itemsNumber)

                                                    callPageFiltered = callPage.data.users
                                                    if (shareProvided != "") { callPageFiltered = callPageFiltered.filter((obj) => obj.twitterUsername.toLowerCase() == shareProvided.toLowerCase()); }

                                                    continuation = callPage.data.nextPageStart

                                                    if (continuation != null) {

                                                        for (const holding of callPageFiltered) {

                                                            let subjectAddress = holding.subject.address
                                                            let isBuy = holding.isBuy
                                                            let amount = holding.shareAmount
                                                            let price = holding.ethAmount / 10 ** 18
                                                            let time = holding.createdAt

                                                            // C'est un in
                                                            if (isBuy == true) {



                                                                buyCount += parseFloat(amount)
                                                                tradeCount += parseFloat(amount)
                                                                buySpent += price
                                                                buyFeeSpent += price * (totalFees / 100)


                                                            } else {
                                                                // C'est un out

                                                                soldCount += parseFloat(amount)
                                                                tradeCount += parseFloat(amount)
                                                                soldValue += price
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


                                            if (totalBuySpent > 0) { avgBuy = totalBuySpent / buyCount }
                                            if (totalSoldValue > 0) { avgSold = totalSoldValue / soldCount }
                                            if (heldValue > 0) { avgHeld = heldValue / heldCount }


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


                                                    { name: "Links", value: '[Friendtech](https://www.friend.tech/rooms/' + userAddress + ") ∙ " + '[Twitter](https://twitter.com/' + twUsername.toLowerCase() + ") ∙ " + '[Basescan](https://basescan.org/address/' + userAddress + ") ∙ " + '[Holders](https://www.friend.tech/trades/' + userAddress + ") ∙ " + '[Chart](https://www.degenz.finance/friendtech/portfolio?address=' + userAddress + ")", inline: false }

                                                )
                                                .setTimestamp()
                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                                            // On modifie la description pour préciser sur quelle share si présent
                                            if (shareProvided != "") {
                                                console.log("ici")
                                                getBlurOneWallet.setDescription(">>> Displaying the friend.tech profits of `" + twName + "` on `" + shareProvided + "`.")
                                            }

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
                                                collectionBanner: twPfp,
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



                            } else if (subcommand === 'interactions') {


                                const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Friend.Tech Interactions")
                                    //  .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .addFields(
                                        { name: " ", value: "We are currently optimizing this feature which is in maintenance and will be available again soon. Make sure to check our future <#1108756917414793216> to be informed when it's up again.", inline: true },
                                    )
                                    .setTimestamp()
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [errorNotEthereum], components: [], ephemeral: true });



                                // CODE DE PROF, A REMPLACER QUAND FIX

                                // ++++++++++

                                // const buttonsRow = new ActionRowBuilder()
                                //     .addComponents(
                                //         new ButtonBuilder()
                                //             .setCustomId('friendtech-interactionfirstpage-button')
                                //             .setLabel('first page')
                                //             .setStyle(2)
                                //             .setDisabled(true),
                                //         new ButtonBuilder()
                                //             .setCustomId('friendtech-interactionpreviouspage-button')
                                //             .setLabel('previous page')
                                //             .setStyle(2)
                                //             .setDisabled(true),
                                //         new ButtonBuilder()
                                //             .setCustomId('friendtech-interactionnextpage-button')
                                //             .setLabel('next page')
                                //             .setStyle(2),
                                //         new ButtonBuilder()
                                //             .setCustomId('friendtech-interactionlastpage-button')
                                //             .setLabel('last page')
                                //             .setStyle(2),
                                //     );

                                // const buttonsRowNo = new ActionRowBuilder()
                                //     .addComponents(
                                //         new ButtonBuilder()
                                //             .setCustomId('friendtech-interactionfirstpage-button')
                                //             .setLabel('first page')
                                //             .setStyle(2)
                                //             .setDisabled(true),
                                //         new ButtonBuilder()
                                //             .setCustomId('friendtech-interactionpreviouspage-button')
                                //             .setLabel('previous page')
                                //             .setStyle(2)
                                //             .setDisabled(true),
                                //         new ButtonBuilder()
                                //             .setCustomId('friendtech-interactionnextpage-button')
                                //             .setLabel('next page')
                                //             .setStyle(2)
                                //             .setDisabled(true),
                                //         new ButtonBuilder()
                                //             .setCustomId('friendtech-interactionlastpage-button')
                                //             .setLabel('last page')
                                //             .setStyle(2)
                                //             .setDisabled(true),
                                //     );



                                // const selectedUser1 = interaction.options.getString("twitter1").toLowerCase()
                                // const selectedUser2 = interaction.options.getString("twitter2").toLowerCase()

                                // // On formatte sans le @
                                // const givenUsername1 = removeAtSymbol(selectedUser1)
                                // const givenUsername2 = removeAtSymbol(selectedUser2)



                                // let findUser1 = []
                                // let findUser2 = []
                                // let isMatch = true

                                // let user1Address = ""
                                // let user2Address = ""

                                // let user1FrenRatio = ""
                                // let user2FrenRatio = ""
                                // let user1FrenCount = ""
                                // let user2FrenCount = ""

                                // let holdingFormatted = ""


                                // let user1HoldingCount = 0
                                // let user2HoldingCount = 0

                                // let fullTable = []
                                // let infoTable = []


                                // try {
                                //     findUser1 = await axios.get('https://prod-api.kosetto.com/search/users?username=' + givenUsername1, { headers: friendtechHeaders })
                                //     findUser2 = await axios.get('https://prod-api.kosetto.com/search/users?username=' + givenUsername2, { headers: friendtechHeaders })

                                // } catch (error) {
                                //     isMatch = false
                                // }


                                // if (isMatch == true) {


                                //     const user1 = findUser1.data.users.find((user) => user.twitterUsername.toLowerCase() == givenUsername1.toLowerCase());
                                //     const user2 = findUser2.data.users.find((user) => user.twitterUsername.toLowerCase() == givenUsername2.toLowerCase());


                                //     if (user1 && user2) {


                                //         user1Address = user1.address
                                //         user2Address = user2.address

                                //         try {


                                //             let relation = ""

                                //             let perPage = 50
                                //             let callPage = 1






                                //             const user1Name = user1.twitterName
                                //             const user2Name = user2.twitterName


                                //             const frenfrenCall = await axios.get('https://preview.frenfren.pro/api/trpc/trades.list?batch=1&input={"0":{"json":{"trader":["' + user1Address + '","' + user2Address + '"],"subject":["' + user1Address + '","' + user2Address + '"],"page":' + callPage + ',"perPage":' + perPage + ',"filter":{},"excludeSelfTrades":true,"withFriends":null},"meta":{"values":{"withFriends":["undefined"]}}}}')


                                //             // On récupère le nombre de trades
                                //             const tradeTable = frenfrenCall.data[0].result.data.json.trades

                                //             if (tradeTable.length > 0) {


                                //                 const tradeUser1Table = tradeTable.filter(obj => obj.ftHolder.trader.address.toLowerCase() == user1Address.toLowerCase())
                                //                 const tradeUser2Table = tradeTable.filter(obj => obj.ftHolder.trader.address.toLowerCase() == user2Address.toLowerCase())


                                //                 // On prend les stats (3,3)
                                //                 if (tradeUser1Table.length > 0) {
                                //                     user1FrenRatio = parseFloat(tradeUser1Table[0].ftHolder.trader.frenScore * 100).toFixed(0)
                                //                     user1FrenCount = tradeUser1Table[0].ftHolder.trader.frenfrenCount
                                //                 } else {
                                //                     const frenfrenCall = await axios.get('https://preview.frenfren.pro/api/trpc/users.autocomplete?batch=1&input={"0":{"json":"' + givenUsername1 + '"}}', { headers: frenfrenHeader })
                                //                     const user1Profile = frenfrenCall.data[0].result.data.json.find(obj => obj.address.toLowerCase() === user1Address.toLowerCase())
                                //                     user1FrenRatio = parseFloat(user1Profile.frenScore * 100).toFixed(0)
                                //                     user1FrenCount = user1Profile.frenfrenCount


                                //                 }

                                //                 if (tradeUser2Table.length > 0) {
                                //                     user2FrenRatio = parseFloat(tradeUser2Table[0].ftHolder.trader.frenScore * 100).toFixed(0)
                                //                     user2FrenCount = tradeUser2Table[0].ftHolder.trader.frenfrenCount
                                //                 } else {
                                //                     const frenfrenCall = await axios.get('https://preview.frenfren.pro/api/trpc/users.autocomplete?batch=1&input={"0":{"json":"' + givenUsername2 + '"}}', { headers: frenfrenHeader })
                                //                     const user2Profile = frenfrenCall.data[0].result.data.json.find(obj => obj.address.toLowerCase() === user2Address.toLowerCase())
                                //                     user2FrenRatio = parseFloat(user2Profile.frenScore * 100).toFixed(0)
                                //                     user2FrenCount = user2Profile.frenfrenCount


                                //                 }


                                //                 /////// On construit le tableau de trade
                                //                 let interactionsFormatted = "T/S           Type      Share         Value         Date\n\n"
                                //                 let index = 0

                                //                 for (const trade of tradeTable) {




                                //                     let ethAmount = trade.ethAmount
                                //                     let feesAmount = trade.protocolEthAmount + trade.subjectEthAmount
                                //                     let txnHash = trade.txHash
                                //                     let shareAmount = trade.shareAmount
                                //                     let isBuy = trade.isBuy
                                //                     let newHeldCount = trade.ftHolder.shareAmount
                                //                     let date = new Date(trade.createdAt)
                                //                     let traderName = trade.ftHolder.trader.twitterUsername
                                //                     let subjectName = trade.ftHolder.subject.twitterUsername
                                //                     let traderAddress = trade.ftHolder.trader.address.toLowerCase()
                                //                     let subjectAddress = trade.ftHolder.subject.address.toLowerCase()



                                //                     let timestamp = Math.floor((date.setHours(date.getHours() + 2)) / 1000)



                                //                     // on definit le tag et le type d'action
                                //                     let actionType = "Buy"
                                //                     let actionTag = "Buy"
                                //                     let direction = "➡️"
                                //                     let amount = ""

                                //                     let isNewHolding = trade.isNewHolding
                                //                     let isLastHolding = trade.isLastHolding
                                //                     let isReciprocat = trade.isReciprocat


                                //                     if (isBuy == false) { actionType = "Sell"; actionTag = "Sell" }
                                //                     if (isNewHolding === true) { actionTag = "Entry" }
                                //                     if (isLastHolding === true) { actionTag = "Exit" }
                                //                     if (isReciprocat === true) { actionTag = "Mutual" }





                                //                     // On incrémente les différents compteurs 

                                //                     if (isBuy == true) {

                                //                         amount = "+" + shareAmount

                                //                         if (traderAddress.toLowerCase() == user1Address.toLowerCase()) { user1HoldingCount += parseFloat(shareAmount) }
                                //                         else if (subjectAddress.toLowerCase() == user1Address.toLowerCase()) { user2HoldingCount += parseFloat(shareAmount); direction = "⬅️" }

                                //                     } else {

                                //                         amount = "-" + shareAmount

                                //                         if (traderAddress.toLowerCase() == user1Address.toLowerCase()) { user1HoldingCount -= parseFloat(shareAmount) }
                                //                         else if (subjectAddress.toLowerCase() == user1Address.toLowerCase()) { user2HoldingCount -= parseFloat(shareAmount); direction = "⬅️" }

                                //                     }


                                //                     index++

                                //                     if (index <= 16) {

                                //                         let part1 = direction
                                //                         let part2 = actionTag
                                //                         let part3 = amount.toString()
                                //                         let part4 = parseFloat(ethAmount).toFixed(3) + "Ξ"
                                //                         let part5 = getTimeAgoSmall(timestamp)


                                //                         let spaceSize = 18 - (part1.length + part2.length)
                                //                         let spaceLenght = ""
                                //                         for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

                                //                         let spaceSize2 = 29 - (part1.length + part2.length + part3.length + spaceSize)
                                //                         let spaceLenght2 = ""
                                //                         for (let i = 0; i < spaceSize2; i++) { spaceLenght2 += " " }

                                //                         let spaceSize3 = 43 - (part1.length + part2.length + part3.length + spaceSize + part4.length + spaceSize2)
                                //                         let spaceLenght3 = ""
                                //                         for (let i = 0; i < spaceSize3; i++) { spaceLenght3 += " " }

                                //                         let spaceSize4 = 56 - (part1.length + part2.length + part3.length + spaceSize + part4.length + spaceSize2 + part5.length + spaceSize3)
                                //                         let spaceLenght4 = ""
                                //                         for (let i = 0; i < spaceSize4; i++) { spaceLenght4 += " " }



                                //                         interactionsFormatted += part1 + spaceLenght + part2 + spaceLenght2 + part3 + spaceLenght3 + part4 + spaceLenght4 + part5 + "\n"

                                //                     }

                                //                     // On construit le tableau pour le stocker et les pages suivantes
                                //                     let obj = {}
                                //                     obj.traderName = traderName
                                //                     obj.traderAddress = traderAddress
                                //                     obj.subjectName = subjectName
                                //                     obj.subjectAddress = subjectAddress
                                //                     obj.amount = amount
                                //                     obj.ethAmount = ethAmount
                                //                     obj.feesAmount = feesAmount
                                //                     obj.isBuy = isBuy
                                //                     obj.actionType = actionType
                                //                     obj.actionTag = actionTag
                                //                     obj.txnHash = txnHash
                                //                     obj.newHeldCount = newHeldCount
                                //                     obj.timestamp = timestamp
                                //                     fullTable.push(obj)





                                //                 }



                                //                 // On formatte le nom et le socre d'holding
                                //                 const user1Score = user1FrenRatio + "% (" + user1FrenCount + ")"
                                //                 const user2Score = user2FrenRatio + "% (" + user2FrenCount + ")"


                                //                 const user1Formatted = "`" + user1Name + "`\n*Score:* " + user1Score + "\n∟[<:TWs:1153688442568450148>](https://twitter.com/" + givenUsername1 + ")[<:basescan:1155624395038019616>](https://basescan.org/address/" + user1Address + ")[<:friendtech:1156421684585299988>](https://www.friend.tech/rooms/" + user1Address + ")"
                                //                 const user2Formatted = "`" + user2Name + "`\n*Score:* " + user2Score + "\n∟[<:TWs:1153688442568450148>](https://twitter.com/" + givenUsername2 + ")[<:basescan:1155624395038019616>](https://basescan.org/address/" + user2Address + ")[<:friendtech:1156421684585299988>](https://www.friend.tech/rooms/" + user2Address + ")"


                                //                 holdingFormatted = "`" + user1HoldingCount + " | " + user2HoldingCount + "`"

                                //                 if (user1HoldingCount > 0 && user2HoldingCount > 0) { relation = "`(3, 3)`" }
                                //                 else if (user1HoldingCount > 0 && user2HoldingCount <= 0) { relation = "`(3, 0)`" }
                                //                 else if (user1HoldingCount <= 0 && user2HoldingCount > 0) { relation = "`(0, 3)`" }
                                //                 else { relation = "`(0, 0)`" }



                                //                 const tradeCount = fullTable.length
                                //                 const itemsPerPage = 16; // Nombre d'objets par page
                                //                 const pageIndex = Math.ceil(tradeCount / itemsPerPage);


                                //                 const links = '[Friendtech](https://www.friend.tech/)' + " ∙ " + '[Twitter](https://twitter.com/' + ") ∙ " + '[Basescan](https://basescan.org/address/' + user1Address + "?toaddress=" + user2Address + ") ∙ " + '[Chart 1](https://www.degenz.finance/friendtech/portfolio?address=' + user1Address + ") ∙ " + '[Chart 2](https://www.degenz.finance/friendtech/portfolio?address=' + user2Address + ") ∙ " + '[FrenFren](https://preview.frenfren.pro/trades/exchanges/' + user1Address + "/" + user2Address + ")"


                                //                 const userFTEmbed = new EmbedBuilder().setColor("#060A8F")
                                //                     .setTitle("Friend.Tech Interactions")
                                //                     .setDescription(">>> Displaying the friend.tech interactions")
                                //                     .setAuthor({ name: authorName, iconURL: userAvatar })
                                //                     .setTimestamp()
                                //                     .addFields(
                                //                         { name: " ", value: " ", inline: false },
                                //                         { name: "User 1", value: user1Formatted, inline: true },
                                //                         { name: "User 2", value: user2Formatted, inline: true },
                                //                         { name: " ", value: " ", inline: false },
                                //                         { name: "Trades", value: "`" + tradeCount + "`", inline: true },
                                //                         { name: "Relation", value: relation, inline: true },
                                //                         { name: "Holding", value: holdingFormatted, inline: true },
                                //                         { name: "Interactions:", value: "```" + interactionsFormatted + "```", inline: false },
                                //                         { name: " ", value: "*The T/S field shows who is the trader and who is the seller*", inline: false },
                                //                         { name: "Links", value: links, inline: false },
                                //                         { name: "Page", value: "`[1/" + pageIndex + "]`", inline: false },



                                //                     )
                                //                     .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                                //                 if (pageIndex <= 1) { await interaction.editReply({ embeds: [userFTEmbed], components: [buttonsRowNo] }); }
                                //                 else { await interaction.editReply({ embeds: [userFTEmbed], components: [buttonsRow] }); }



                                //                 // On crée le tableau d'infos
                                //                 let infoObj = {}
                                //                 infoObj.user1Name = user1Name
                                //                 infoObj.user1Address = user1Address
                                //                 infoObj.user1Formatted = user1Formatted
                                //                 infoObj.user2Name = user2Name
                                //                 infoObj.user2Address = user1Address
                                //                 infoObj.user2Formatted = user2Formatted
                                //                 infoObj.relation = relation
                                //                 infoObj.holding = holdingFormatted
                                //                 infoObj.tradeCount = tradeCount
                                //                 infoObj.links = links
                                //                 infoTable.push(infoObj)




                                //                 //On fait le call àbn  la base SQL
                                //                 await interactionData.destroy({ where: { authorId: authorId, commandName: "friendtech-interactions", serverId: serverId } })

                                //                 await interactionData.create({

                                //                     authorId: authorId,
                                //                     authorName: authorName,
                                //                     serverId: serverId,
                                //                     commandName: "friendtech-interactions",
                                //                     interactionId: interaction.id,
                                //                     walletAddress: "N/A",
                                //                     walletCategory: "collection",
                                //                     embed1: JSON.stringify(fullTable),
                                //                     embed2: JSON.stringify(infoTable),
                                //                     embed3: "N/A",
                                //                     pageIndex: pageIndex.toString(),
                                //                     actualPage: "1",
                                //                     walletName: "N/A",
                                //                     selecedTimestamp: "N/A",
                                //                     selectedCollection: "N/A",
                                //                     collectionSlug: "N/A",
                                //                     collectionBanner: "N/A",
                                //                     avgDeriskPrice: "N/A",
                                //                     floorPrice: "N/A",
                                //                     lowerMarketlace: "N/A",
                                //                     collectionName: "N/A",
                                //                     buyCount: "N/A",
                                //                     soldCount: "N/A",
                                //                     remaining: "N/A",
                                //                     avgBuy: "N/A",
                                //                     avgSold: "N/A",
                                //                     realisedProfit: "N/A",
                                //                     potentialProfit: "N/A",
                                //                     roi: "N/A",
                                //                     visualTitle: "N/A",
                                //                     userAvatar: "N/A",
                                //                     nbMembersInvolved: "N/A",
                                //                     totalTradeCount: "N/A",
                                //                 })







                                //             } else {



                                //                 // On va chercher les infos manquantes
                                //                 // const frenfrenCall = await axios.get('https://preview.frenfren.pro/api/trpc/trades.list?batch=1&input={"0":{"json":{"trader":["' + user1Address + '","' + user2Address + '"],page":' + callPage + ',"perPage":' + perPage + ',"filter":{},"excludeSelfTrades":true,"withFriends":null},"meta":{"values":{"withFriends":["undefined"]}}}}')
                                //                 const lastCall = await axios.get('https://preview.frenfren.pro/api/trpc/trades.list?batch=1&input={"0":{"json":{"trader":["' + user1Address + '","' + user2Address + '"],"subject":["' + user1Address + '","' + user2Address + '"],"page":' + callPage + ',"perPage":' + perPage + ',"filter":{},"excludeSelfTrades":true,"withFriends":null},"meta":{"values":{"withFriends":["undefined"]}}}}')

                                //                 const tradeTable2 = lastCall.data[0].result.data.json.trades
                                //                 const tradeUser1Table = tradeTable2.filter(obj => obj.ftHolder.trader.address.toLowerCase() == user1Address.toLowerCase())
                                //                 const tradeUser2Table = tradeTable2.filter(obj => obj.ftHolder.trader.address.toLowerCase() == user2Address.toLowerCase())

                                //                 // On prend les stats (3,3)
                                //                 if (tradeUser1Table.length > 0) {
                                //                     user1FrenRatio = parseFloat(tradeUser1Table[0].ftHolder.trader.frenScore * 100).toFixed(0)
                                //                     user1FrenCount = tradeUser1Table[0].ftHolder.trader.frenfrenCount
                                //                 } else {

                                //                     const frenfrenCall = await axios.get('https://preview.frenfren.pro/api/trpc/users.autocomplete?batch=1&input={"0":{"json":"' + givenUsername1 + '"}}', { headers: frenfrenHeader })
                                //                     const user1Profile = frenfrenCall.data[0].result.data.json.find(obj => obj.address.toLowerCase() === user1Address.toLowerCase())
                                //                     user1FrenRatio = parseFloat(user1Profile.frenScore * 100).toFixed(0)
                                //                     user1FrenCount = user1Profile.frenfrenCount
                                //                 }

                                //                 if (tradeUser2Table.length > 0) {
                                //                     user2FrenRatio = parseFloat(tradeUser2Table[0].ftHolder.trader.frenScore * 100).toFixed(0)
                                //                     user2FrenCount = tradeUser2Table[0].ftHolder.trader.frenfrenCount
                                //                 } else {

                                //                     const frenfrenCall = await axios.get('https://preview.frenfren.pro/api/trpc/users.autocomplete?batch=1&input={"0":{"json":"' + givenUsername2 + '"}}', { headers: frenfrenHeader })
                                //                     const user2Profile = frenfrenCall.data[0].result.data.json.find(obj => obj.address.toLowerCase() === user2Address.toLowerCase())
                                //                     user2FrenRatio = parseFloat(user2Profile.frenScore * 100).toFixed(0)
                                //                     user2FrenCount = user2Profile.frenfrenCount
                                //                 }


                                //                 const user1Score = user1FrenRatio + "% (" + user1FrenCount + ")"
                                //                 const user2Score = user2FrenRatio + "% (" + user2FrenCount + ")"


                                //                 const user1Formatted = "`" + user1Name + "`\n*Score:* " + user1Score + "\n∟[<:TWs:1153688442568450148>](https://twitter.com/" + givenUsername1 + ")[<:basescan:1155624395038019616>](https://basescan.org/address/" + user1Address + ")[<:friendtech:1156421684585299988>](https://www.friend.tech/rooms/" + user1Address + ")"
                                //                 const user2Formatted = "`" + user2Name + "`\n*Score:* " + user2Score + "\n∟[<:TWs:1153688442568450148>](https://twitter.com/" + givenUsername2 + ")[<:basescan:1155624395038019616>](https://basescan.org/address/" + user2Address + ")[<:friendtech:1156421684585299988>](https://www.friend.tech/rooms/" + user2Address + ")"



                                //                 const links = '[Friendtech](https://www.friend.tech/)' + " ∙ " + '[Twitter](https://twitter.com/' + ") ∙ " + '[Basescan](https://basescan.org/address/' + user1Address + "?toaddress=" + user2Address + ") ∙ " + '[Chart 1](https://www.degenz.finance/friendtech/portfolio?address=' + user1Address + ") ∙ " + '[Chart 2](https://www.degenz.finance/friendtech/portfolio?address=' + user2Address + ") ∙ " + '[FrenFren](https://preview.frenfren.pro/trades/exchanges/' + user1Address + "/" + user2Address + ")"


                                //                 let interactionsFormatted = "No interaction found between these two users            "


                                //                 const userFTEmbed = new EmbedBuilder().setColor("#060A8F")
                                //                     .setTitle("Friend.Tech Interactions")
                                //                     .setDescription(">>> Displaying the friend.tech interactions")
                                //                     .setAuthor({ name: authorName, iconURL: userAvatar })
                                //                     .setTimestamp()
                                //                     .addFields(
                                //                         { name: " ", value: " ", inline: false },
                                //                         { name: "User 1", value: user1Formatted, inline: true },
                                //                         { name: "User 2", value: user2Formatted, inline: true },
                                //                         { name: " ", value: " ", inline: false },
                                //                         { name: "Relation", value: "`(0, 0)`", inline: true },
                                //                         { name: "Trades", value: "`0`", inline: true },
                                //                         { name: "Holding", value: "`0 | 0`", inline: true },
                                //                         { name: "Interactions:", value: "```" + interactionsFormatted + "```", inline: false },
                                //                         { name: "Links", value: links, inline: false },


                                //                     )
                                //                     .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                //                 await interaction.editReply({ embeds: [userFTEmbed], components: [buttonsRowNo] });



                                //             }


                                //         } catch (error) {


                                //             const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                //                 .setTitle("Friend Tech")
                                //                 .setDescription("An error occured while gathering your data. Please try again or contact a team member")
                                //                 .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                //                 .setAuthor({ name: authorName, iconURL: userAvatar })
                                //                 .setTimestamp()
                                //                 .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                //             await interaction.editReply({ embeds: [errorNotEthereum] });



                                //             console.log("erreur try catch: " + error.stack)
                                //         }


                                //     } else {

                                //         const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                //             .setTitle("Friend Tech")
                                //             .setDescription("One or both of the twitter username(s) you entered isn't registered in Friend.tech. Please try again with valid usernames.")
                                //             .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                //             .setAuthor({ name: authorName, iconURL: userAvatar })
                                //             .setTimestamp()
                                //             .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                //         await interaction.editReply({ embeds: [errorNotEthereum] });


                                //     }
                                // } else {

                                //     const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                //         .setTitle("Friend Tech")
                                //         .setDescription("One or both of the twitter username(s) you entered isn't registered in Friend.tech. Please try again with valid usernames.")
                                //         .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                //         .setAuthor({ name: authorName, iconURL: userAvatar })
                                //         .setTimestamp()
                                //         .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                //     await interaction.editReply({ embeds: [errorNotEthereum] });

                                // }





                            } else if (subcommand === 'airdrop') {





                                const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Friend.Tech Airdrop")
                                    //  .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .addFields(
                                        { name: " ", value: "We are currently optimizing this feature which is in maintenance and will be available again soon. Make sure to check our future <#1108756917414793216> to be informed when it's up again.", inline: true },
                                    )
                                    .setTimestamp()
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [errorNotEthereum], components: [], ephemeral: true });





                                // CODE PROD, A REMPLACER QUAND FIX

                                //  +++++++

                                // let userAddress = ""

                                // let findUser = []
                                // let isMatch = true

                                // const usernameProvided = interaction.options.getString("twitter").toLowerCase()

                                // const givenUsername = removeAtSymbol(usernameProvided)


                                // try {
                                //     findUser = await axios.get('https://preview.frenfren.pro/api/trpc/users.autocomplete?batch=1&input={"0":{"json":"' + givenUsername + '"}}', { headers: frenfrenHeader })

                                // } catch (error) {

                                //     isMatch = false
                                // }


                                // if (isMatch == true) {


                                //     const user = findUser.data[0].result.data.json.find(obj => obj.twitterUsername.toLowerCase() == givenUsername.toLowerCase())


                                //     if (user) {


                                //         userAddress = user.address


                                //         try {


                                //             const buttonsRow = new ActionRowBuilder()
                                //                 .addComponents(
                                //                     new ButtonBuilder()
                                //                         .setCustomId('friendtechairdrop-frenfrenmenu-button')
                                //                         .setLabel('Fren Analyzer')
                                //                         .setStyle(3),
                                //                     new ButtonBuilder()
                                //                         .setCustomId('friendtechairdrop-leaderboardbyfren-button')
                                //                         .setLabel('Leaderboard')
                                //                         .setStyle(1),

                                //                 );


                                //             const userInfoCall = await axios.get("https://prod-api.kosetto.com/users/" + userAddress)


                                //             const twitterName = user.twitterName
                                //             const twitterUsername = user.twitterUsername
                                //             const twitterPfp = userInfoCall.data.twitterPfpUrl

                                //             const keyPrice = user.keyPrice
                                //             const shareSupply = user.shareSupply
                                //             const holdingCount = user.holdingCount
                                //             const holderCount = user.holderCount

                                //             const portfolioValue = user.portfolioValue.value
                                //             const feesCollected = user.feesCollected
                                //             const subjectFees = 0.05
                                //             const volume = feesCollected / subjectFees


                                //             const airdropTier = user.tier
                                //             const airdropPoints = user.totalPoints
                                //             const expiredPoints = user.expiredPoints

                                //             const frenScore = user.frenScore * 100
                                //             const frenCount = user.frenfrenCount


                                //             let active = "❌ No"
                                //             if (expiredPoints == false) { active = "✅ Yes" }



                                //             const airdropFTBase = new EmbedBuilder().setColor("#060A8F")
                                //                 .setTitle(twitterName + "'s Airdrop")
                                //                 .setDescription(">>> Displaying Friend.Tech airdrop metrics")
                                //                 .setAuthor({ name: authorName, iconURL: userAvatar })
                                //                 .setThumbnail(twitterPfp)
                                //                 .setTimestamp()
                                //                 .addFields(
                                //                     { name: "Name", value: "`" + twitterName + "`", inline: true },
                                //                     { name: "Username", value: "`" + twitterUsername + "`", inline: true },
                                //                     { name: " ", value: " ", inline: true },
                                //                     { name: " ", value: " ", inline: false },
                                //                     { name: "Supply", value: "`" + shareSupply + "`", inline: true },
                                //                     { name: "Holders", value: "`" + holderCount + "`", inline: true },
                                //                     { name: "Holding", value: "`" + holdingCount + "`", inline: true },
                                //                     { name: "Portfolio", value: "`" + parseFloat(portfolioValue).toFixed(3) + "Ξ`", inline: true },
                                //                     { name: "Volume", value: "`" + parseFloat(volume).toFixed(3) + "Ξ`", inline: true },
                                //                     { name: "Fees Collected", value: "`" + parseFloat(feesCollected).toFixed(3) + "Ξ`", inline: true },
                                //                     { name: "Airdrop Points", value: "`" + airdropPoints + " pts`", inline: true },
                                //                     { name: "Airdrop Tier", value: "`" + airdropTier + "`", inline: true },
                                //                     { name: "Active", value: "`" + active + "`", inline: true },
                                //                     { name: "Fren Count", value: "`" + frenCount + "`", inline: true },
                                //                     { name: "Fren Score", value: "`" + parseFloat(frenScore).toFixed(2) + "%`", inline: true },
                                //                     { name: "Links", value: '[Friendtech](https://www.friend.tech/rooms/' + userAddress + ") ∙ " + '[Twitter](https://twitter.com/' + twitterUsername.toLowerCase() + ") ∙ " + '[Basescan](https://basescan.org/address/' + userAddress + ") ∙ " + '[Holders](https://www.friend.tech/trades/' + userAddress + ") ∙ " + '[Chart](https://www.degenz.finance/friendtech/portfolio?address=' + userAddress + ") ∙ " + '[Airdrop](https://www.friend.tech/airdrop)' + " ∙ " + '[Search](https://twitter.com/search?q=friendtech%20airdrop)', inline: false }


                                //                 )
                                //                 .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })



                                //             await interaction.editReply({ embeds: [airdropFTBase], components: [buttonsRow] });



                                //             // On construit l'info table
                                //             let infoTable = []
                                //             let obj = {}
                                //             obj.userAddress = userAddress
                                //             obj.twitterName = twitterName
                                //             obj.twitterUsername = twitterUsername
                                //             obj.twitterPfp = twitterPfp
                                //             obj.shareSupply = shareSupply
                                //             obj.holderCount = holderCount
                                //             obj.holdingCount = holdingCount
                                //             obj.portfolioValue = portfolioValue
                                //             obj.volume = volume
                                //             obj.feesCollected = feesCollected
                                //             obj.airdropPoints = airdropPoints
                                //             obj.airdropTier = airdropTier
                                //             obj.active = active
                                //             obj.frenScore = frenScore
                                //             obj.frenCount = frenCount
                                //             infoTable.push(obj)



                                //             //On fait le call àbn  la base SQL
                                //             await interactionData.destroy({ where: { authorId: authorId, commandName: "friendtech-airdrop", serverId: serverId } })

                                //             await interactionData.create({

                                //                 authorId: authorId,
                                //                 authorName: authorName,
                                //                 serverId: serverId,
                                //                 commandName: "friendtech-airdrop",
                                //                 interactionId: interaction.id,
                                //                 walletAddress: "N/A",
                                //                 walletCategory: "collection",
                                //                 embed1: 'N/A',
                                //                 embed2: JSON.stringify(infoTable),
                                //                 embed3: JSON.stringify(airdropFTBase),
                                //                 pageIndex: "N/A",
                                //                 actualPage: "N/A",
                                //                 walletName: "N/A",
                                //                 selecedTimestamp: "N/A",
                                //                 selectedCollection: "N/A",
                                //                 collectionSlug: "N/A",
                                //                 collectionBanner: "N/A",
                                //                 avgDeriskPrice: "N/A",
                                //                 floorPrice: "N/A",
                                //                 lowerMarketlace: "N/A",
                                //                 collectionName: "N/A",
                                //                 buyCount: "N/A",
                                //                 soldCount: "N/A",
                                //                 remaining: "N/A",
                                //                 avgBuy: "N/A",
                                //                 avgSold: "N/A",
                                //                 realisedProfit: "N/A",
                                //                 potentialProfit: "N/A",
                                //                 roi: "N/A",
                                //                 visualTitle: "N/A",
                                //                 userAvatar: "N/A",
                                //                 nbMembersInvolved: "N/A",
                                //                 totalTradeCount: "N/A",
                                //             })










                                //         } catch (error) {

                                //             console.log(error)

                                //             const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                //                 .setTitle("Friend Tech")
                                //                 .setDescription("An error occured while gathering your data. Please try again or contact a team member")
                                //                 .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                //                 .setAuthor({ name: authorName, iconURL: userAvatar })
                                //                 .setTimestamp()
                                //                 .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                //             await interaction.editReply({ embeds: [errorNotEthereum] });


                                //         }




                                //     } else {

                                //         let usernameSuggestionFormatted = ""

                                //         let index = 0
                                //         for (const suggestion of findUser.data[0].result.data.json) {
                                //             index++
                                //             if (index <= 5) {

                                //                 usernameSuggestionFormatted += "∙ " + suggestion.twitterUsername + "\n"
                                //             } else {

                                //                 break
                                //             }

                                //         }


                                //         const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                //             .setTitle("Friend Tech")
                                //             .setDescription("The exact twitter username you entered isn't registered in Friend.tech.\n\n**Maybe you are looking for:** \n\n" + usernameSuggestionFormatted)
                                //             .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                //             .setAuthor({ name: authorName, iconURL: userAvatar })
                                //             .setTimestamp()
                                //             .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                //         await interaction.editReply({ embeds: [errorNotEthereum] });





                                //     }

                                // } else {


                                //     const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                //         .setTitle("Friend Tech")
                                //         .setDescription("The twitter username you entered isn't registered in Friend.tech. Please try again with a valid username.")
                                //         .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                //         .setAuthor({ name: authorName, iconURL: userAvatar })
                                //         .setTimestamp()
                                //         .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                //     await interaction.editReply({ embeds: [errorNotEthereum] });



                                // }











                            } else if (subcommand === 'tracker') {





                                const buttonsRow = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('friendtechtrackerinfra-newtracker-button')
                                            .setLabel('✨ Add Users')
                                            .setStyle(1),
                                        new ButtonBuilder()
                                            .setCustomId('friendtechtrackerinfra-listtracker-button')
                                            .setLabel('🧾 List Users')
                                            .setStyle(3),

                                    );




                                const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Friend.Tech Tracker")
                                    .setDescription(">>> Displaying the Friend.Tech tracker dashboard")
                                    //  .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .addFields(
                                        { name: "Tracker Mechanism", value: "The Friend.Tech tracker is a system that allows you to track the actions made by a single or multiple Friend.Tech user(s). This panel contains two sections:\n\n**✨ Add Users**\nAdd one or few Friend Tech user to your tracker to monitor their activity live. Aura accepts a maximum of 25 users.\n\n**🧾 List Users**\nConsult, delete and manage all the user you are currently tracking. An easy way to adapt your tracker to your new strategy.", inline: true },
                                    )
                                    .setTimestamp()
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [errorNotEthereum], components: [buttonsRow], ephemeral: true });

















                            } else if (subcommand === 'wallet') {




                                const buttonsRowNew = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('infra_friendtechnewwallet-button')
                                            .setLabel('import wallet')
                                            .setStyle(1),
                                        new ButtonBuilder()
                                            .setCustomId('infra_friendtechgeneratewallet-button')
                                            .setLabel('generate wallet')
                                            .setStyle(3),

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

                                    await interaction.editReply({ embeds: [errorNotEthereum], components: [buttonsRowModify], ephemeral: true });


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

                                    await interaction.editReply({ embeds: [errorNotEthereum], components: [buttonsRowNew], ephemeral: true });


                                }







                            } else if (subcommand === 'bridge') {

                                const value = interaction.options.getString("amount")
                                const type = interaction.options.getString("type")

                                const userSetup = await infra_friendTech.findOne({ where: { authorId: authorId } })



                                if (userSetup != null) {

                                    const walletAddress = decrypt(userSetup.dataValues.walletAddress).toLowerCase()
                                    const PK = decrypt(userSetup.dataValues.privateKey).toLowerCase()


                                    const receiver = walletAddress

                                    const action = "🌐 Bridge"


                                    const data = "0x"
                                    const deaultGas = 0
                                    const valueWEI = web3BaseUnifra.utils.toWei(value.toString(), 'ether')


                                    if (type === "mainnet_to_base") {


                                        const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle("Bridge Funds")
                                            .setDescription(">>> Displaying the simulated transaction data")
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setTimestamp()
                                            .addFields(
                                                { name: " ", value: " ", inline: false },
                                                { name: "From", value: "`" + formatWallet(walletAddress) + "`\n∟ Mainnet", inline: true },
                                                { name: "To", value: "`" + formatWallet(walletAddress) + "`\n∟ Base", inline: true },
                                                { name: "Action", value: "`" + action + "`", inline: true },
                                                { name: " ", value: "**Simulation loading** <a:AuraLoading:1134068847616458792>", inline: false },

                                            )
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })



                                        await interaction.editReply({ embeds: [gasTrackerEmbed], ephemeral: true });



                                        let simulation = true
                                        let gasUsed = ""
                                        let errorMessageFormatted = ""

                                        try {

                                            gasUsed = await mainnetBridgeContract.methods.depositETHTo(receiver, deaultGas, data).estimateGas({ from: walletAddress.toLowerCase(), value: valueWEI });

                                        } catch (error) {

                                            simulation = false
                                            let message = error.message

                                            if (message.startsWith("Returned")) {
                                                errorMessageFormatted = message.replace("Returned error: ", "")
                                            }
                                            console.log("Erreur lors de l'estimation du bridge: " + error.stack)

                                        }

                                        if (simulation == true) {



                                            const simulationFormatted = "Bridge: Mainnet >>> Base\n\nSender: " + walletAddress.toLowerCase() + "\nAmount:" + parseFloat(value).toFixed(4) + "Ξ"


                                            const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                                .setTitle("Bridge Funds")
                                                .setDescription(">>> Displayng the simulated transaction data")
                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                .setTimestamp()
                                                .addFields(
                                                    { name: " ", value: " ", inline: false },
                                                    { name: "From", value: "`" + formatWallet(walletAddress) + "`\n∟ Mainnet", inline: true },
                                                    { name: "To", value: "`" + formatWallet(walletAddress) + "`\n∟ Base", inline: true },
                                                    { name: "Action", value: "`" + action + "`", inline: true },
                                                    { name: " ", value: " ", inline: false },
                                                    { name: "Transaction Data ✅", value: "```css\n" + simulationFormatted + "```", inline: false },
                                                    { name: " ", value: "*The selected amount will be bridged to the base chain at the same address as the sender.*", inline: false },

                                                )
                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                                            await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [buttonRowChoiceBridge], ephemeral: true });



                                            exe_friendTech.destroy({ where: { authorId: authorId, serverId: serverId, treated: null, isBuy: "bridge" } });

                                            // On enregistre les infos
                                            let table = []
                                            let obj = {}
                                            obj.sender = encrypt(walletAddress)
                                            obj.senderPK = encrypt(PK)
                                            obj.type = type
                                            obj.action = "🌐 Bridge"
                                            obj.gasUnits = gasUsed.toString()
                                            table.push(obj)

                                            await exe_friendTech.create({

                                                serverId: serverId,
                                                authorId: authorId,
                                                authorName: authorName,
                                                isBuy: "bridge",
                                                subject: JSON.stringify(table),
                                                value: valueWEI.toString(),
                                                simulation: "true",

                                            })


                                        } else {

                                            const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                                .setTitle("Bridge Funds")
                                                .setDescription(">>> Displayng the simulated transaction")
                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                .setTimestamp()
                                                .addFields(
                                                    { name: " ", value: " ", inline: false },
                                                    { name: "From", value: "`" + formatWallet(walletAddress) + "`\n∟ Mainnet", inline: false },
                                                    { name: "To", value: "`" + formatWallet(walletAddress) + "`\n∟ Base", inline: true },
                                                    { name: "Action", value: "`" + action + "`", inline: true },
                                                    { name: "Transaction Data 🚫", value: "```The transaction simulation failed.\n\n" + errorMessageFormatted + "```", inline: false },

                                                )
                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                                            await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [buttonRowChoiceNoBridge], ephemeral: true });

                                        }




                                    } else if (type === "base_to_mainnet") {


                                        const availableInTheNearFuture = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle(`${authorName}'s profit`)
                                            .setDescription("The command you try to use is currently being built and will be available in the near future. You can still use all the other commands in the meantime.")
                                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                            .setTimestamp()
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                        await interaction.editReply({ embeds: [availableInTheNearFuture] });



                                    }



                                } else {


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

                                    await interaction.editReply({ embeds: [errorNotEthereum], components: [buttonsRowNew], ephemeral: true });




                                }



                            } else if (subcommand === 'tasks') {





                                const buttonsRow = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('friendtechtasksinfra-snipermenu-button')
                                            .setLabel('🥷 Sniper')
                                            .setStyle(1),
                                        new ButtonBuilder()
                                            .setCustomId('friendtechtasksinfra-ordermenu-button')
                                            .setLabel('🔮 Order')
                                            .setStyle(1),
                                        new ButtonBuilder()
                                            .setCustomId('friendtechtasksinfra-farmermenu-button')
                                            .setLabel('👨🏽‍🌾 Farmer')
                                            .setStyle(1),
                                        new ButtonBuilder()
                                            .setCustomId('friendtech_exec_setup-button')
                                            .setLabel('💻 Setup')
                                            .setStyle(3),

                                    );


                                const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Friend.Tech Tasks")
                                    .setDescription(">>> Displaying the Friend.Tech task dashboard")
                                    //  .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .addFields(
                                        { name: "Tasks Mechanism", value: "Friend.Tech tasks are all actions that allow you to automate certain actions so that you don't miss any opportunities. There are two types of tasks:\n\n**🥷 Sniper**\nSnipe tasks let you use Aura to automatically buy keys when a specific event occurs.\n\n**🔮 Order**\nOrder tasks allow you to automate the purchase or sale of keys when certain conditions are met, just as in conventional finance.\n\n**👨🏽‍🌾 Farmer**\nFarmer tasks allows you to fully automate your friendtech farming with numerous customization options.", inline: true },
                                    )
                                    .setTimestamp()
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [errorNotEthereum], components: [buttonsRow], ephemeral: true });








                            }



                        } else {



                            const notMember = new EmbedBuilder().setColor("#060A8F")
                                .setTitle(`Bot Access`)
                                .setDescription(">>> Showing access data")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Status", value: "`Denied ❌`", inline: true },
                                    { name: "Required Role", value: "<@&" + community.member + ">", inline: true },
                                    { name: "Reason:", value: "Your access to the bot has been denied. You can only use the bot if you have the required role in this community.", inline: false },
                                )
                                .setTimestamp()
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                            await interaction.editReply({ embeds: [notMember] });


                        }

                    } else {

                        const botOff = new EmbedBuilder().setColor("#060A8F")
                            .setTitle(`Bot Access`)
                            .setDescription("You can't use this feature. The access tier of this community is too low. Please contact an admin of the community to upgrade the access ❌")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                        await interaction.editReply({ embeds: [botOff] });
                    }

                } else {

                    const botOff = new EmbedBuilder().setColor("#060A8F")
                        .setTitle(`Bot Access`)
                        .setDescription("You can't use this feature. Aura is currently inactive in this community. Please contact an admin of the community to sort out an access to the bot ❌")
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                    await interaction.editReply({ embeds: [botOff] });

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


                await interaction.editReply({ embeds: [errorAnswerUser], components: [], ephemeral: true });


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








async function getFTHolding(userAddress, share) {

    let heldValue = 0
    let heldCount = 0



    let userHoldingCall = await axios.get("https://prod-api.kosetto.com/users/" + userAddress + "/token-holdings")
    let userHolding = userHoldingCall.data.users
    if (share != "") { userHolding = userHolding.filter((obj) => obj.twitterUsername.toLowerCase() == share.toLowerCase()); }


    if (userHoldingCall.data.nextPageStart != 50) {

        for (const holding of userHolding) {

            let holdingAddress = holding.address.toLowerCase()

            const holderInfo = await axios.get("https://prod-api.kosetto.com/users/" + holdingAddress)
            let holderPrice = holderInfo.data.displayPrice / 10 ** 18

            let balance = holding.balance
            let totalValue = balance * holderPrice

            heldValue += parseFloat(totalValue)
            heldCount += parseFloat(balance)



        }

    } else {

        for (const holding of userHolding) {


            let holdingAddress = holding.address.toLowerCase()


            const holderInfo = await axios.get("https://prod-api.kosetto.com/users/" + holdingAddress)
            let holderPrice = holderInfo.data.displayPrice / 10 ** 18

            let balance = holding.balance
            let totalValue = balance * holderPrice

            heldValue += parseFloat(totalValue)
            heldCount += parseFloat(balance)

        }

        let itemsNumber = 50
        let callPage = ""

        let continuation = userHoldingCall.data.nextPageStart

        while (continuation != null) {




            callPage = await axios.get("https://prod-api.kosetto.com/users/" + userAddress + "/token-holdings?pageStart=" + itemsNumber)
            callPageFiltered = callPage.data.users
            if (share != "") { callPageFiltered = callPageFiltered.filter((obj) => obj.twitterUsername.toLowerCase() == share.toLowerCase()); }

            continuation = callPage.data.nextPageStart

            if (continuation != null) {

                for (const holding of callPageFiltered) {

                    let holdingAddress = holding.address.toLowerCase()

                    const holderInfo = await axios.get("https://prod-api.kosetto.com/users/" + holdingAddress)
                    let holderPrice = holderInfo.data.displayPrice / 10 ** 18

                    let balance = holding.balance
                    let totalValue = balance * holderPrice

                    heldValue += parseFloat(totalValue)
                    heldCount += parseFloat(balance)


                }


                itemsNumber += 50

            } else {
                break
            }
        }
    }

    return { heldValue, heldCount };






}