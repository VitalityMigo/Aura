
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
const { accessSql, profileData, reportsql, adminsql, interactionData, sequelize } = require('../../../events/database');
const moment = require('moment');

const reduceText = require("../../../functions/reducetext")
const getTwitterUserInfo = require("../../../functions/twitteruserinfo")
const getTimeAgo = require("../../../functions/timeago")
const countEmojis = require("../../../functions/isemoji")


const ethPrice = require("../../../functions/getethprice")
const { formatHoldersData, formatTradesData } = require('../../../functions/FT-useraccelerator');


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



function formatWallet(input) {
    return input.length > 35 ? `${input.substring(0, 10)}…${input.substring(input.length - 10)}` : input;
}




module.exports = {
    id: 'button_friendtech_user_panel_',

    async execute(interaction) {
        if (!(interaction instanceof ButtonInteraction)) return;

        //Récupérer informations de l'utilisateur de la commande
        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id
        let botId = interaction.applicationId

        await interaction.deferReply({ ephemeral: true })


        try {

            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")






            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")
            //Checkpoint
            console.log("// Step 2 : Authorization - Executed ✅")

            //Récupère le password donné par l'utilisateur

            const customId = interaction.customId


            // Utilisation d'une expression régulière pour extraire l'adresse Ethereum
            const regex = /_0x([0-9a-fA-F]{40})/;
            const matches = customId.match(regex);

            if (matches && matches[1]) {


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


                // On récupère l'addresse du subject et défini le quickbuy à 1
                userAddress = "0x" + matches[1]



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



                    // On renvoi le premier embed
                    const loadingEmbed = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Panel Loading <a:AuraLoading:1134068847616458792>")
                        .setDescription(">>> Displaying the transaction execution")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setThumbnail(twitterPfp)
                        .setTimestamp()
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "Target", value: "`" + twitterName + "`", inline: true },
                            { name: "Action", value: "`📊 Trade Panel`", inline: true },
                            { name: " ", value: " ", inline: false },
                            { name: " ", value: "**Trade Panel** <a:AuraLoading:1134068847616458792>", inline: false },

                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.editReply({ embeds: [loadingEmbed] });




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

                    await interaction.editReply({ embeds: [errorNotEthereum], ephemeral: true });


                }












            } else {


                const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Buy Shares")
                    .setDescription("An error occured while retreiving the subject's Friend.Tech address. Please try again using `/friendtech user` or contact a team member if you need help.")
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
            let reportCommand = "/admin-clientListFirstPage"

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



