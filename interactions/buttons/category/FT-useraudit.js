
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

const getTwitterScore = require("../../../functions/twitteraudit")
const getBaseDeposit = require("../../../functions/getdeposits")

const smartWalletJson = require("../../../contracts/friendtech/smartwallet.json")
const smartWalletTable = smartWalletJson.map(obj => obj.address.toLowerCase());

//Web3 API + Cloudfare Provider
var Web3 = require("web3")
const web3 = new Web3("https://1rpc.io/base")


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
    id: 'button_friendtech_infra_security_',

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

                    const user = await axios.get('https://preview.frenfren.pro/api/trpc/users.autocomplete?batch=1&input={"0":{"json":"' + userAddress + '"}}')
                    const userInfo = user.data[0].result.data.json.find(obj => obj.address.toLowerCase() === userAddress.toLowerCase())
                    
                    const frenScore = parseFloat(userInfo.frenScore * 100).toFixed(0)
                    const username = userInfo.twitterUsername
                    const supply = userInfo.shareSupply
                    const pfp = userInfo.twitterPfpUrl


                    // // Version ancienne, fonction au cas où
                    // const userInfo = await axios.get("https://prod-api.kosetto.com/users/" + userAddress)

                    // const username = userInfo.data.twitterUsername
                    // const name = userInfo.data.twitterName
                    // const supply = userInfo.data.shareSupply
                    // const pfp = userInfo.data.twitterPfpUrl


                    let twitterAuditFormatted = "∙ Score: `" + "   " + "`\n∙ Followers: `" + "   " + "` | Following: `" + "   " + "`\n∙ Tweets: `" + "   " + "` | Likes: `" + "   " + "`\n∙ Created: `" + "   " + "`"

                    let friendTechFormatted = "∙ Fren Score: `" + "   " + "`\n∙ Smart Money : `" + "   " + "`\n∙ Distribution: `" + "   " + "`\n∙ Self: `" + "   " + "`\n∙ Whales: `" + "   " + "` | Holding: `" + "   " + "`"

                    let walletFormatted = "∙ Balance: `" + "   " + "`\n∙ Deposits: `" + "   " + "` | Total: `" + "   " + "` | Last: `" + "   " + "`"



                    const gasTrackerEmbedBase = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Friend.Tech Audit")
                        .setDescription(">>> Displayng the Friend.Tech user audit")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setThumbnail(pfp)
                        .setTimestamp()
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "<:TWs:1153688442568450148> TWITTER <a:AuraLoading:1134068847616458792>", value: " ", inline: false },
                            { name: " ", value: twitterAuditFormatted, inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: "<:friendtech:1156421684585299988> FRIEND.TECH", value: " ", inline: false },
                            { name: " ", value: friendTechFormatted, inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: "<:basescan:1155624395038019616> WALLET", value: " ", inline: false },
                            { name: " ", value: walletFormatted, inline: false },
                            { name: "Links", value: '[Friendtech](https://www.friend.tech/rooms/' + userAddress + ") ∙ " + '[Twitter](https://twitter.com/' + username.toLowerCase() + ") ∙ " + '[Basescan](https://basescan.org/address/' + userAddress + ") ∙ " + '[Holders](https://www.friend.tech/trades/' + userAddress + ") ∙ " + '[Chart](https://www.degenz.finance/friendtech/portfolio?address=' + userAddress + ")", inline: false }


                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                    await interaction.editReply({ embeds: [gasTrackerEmbedBase], components: [], ephemeral: true });







                    // Etape 1 = Twitter 
                    const twitterAudit = await getTwitterScore(username)
                    console.log(twitterAudit)
                    const score = twitterAudit.capital
                    const twitterInfos = twitterAudit.data
                    const created = Math.floor(Date.parse(twitterInfos.created_at) / 1000)
                    const follower = Math.floor(Date.parse(twitterInfos.created_at) / 1000)


                    // On envoi la réponse
                    twitterAuditFormatted = "∙ Score: `" + score + "%`\n∙ Followers: `" + twitterInfos.follower + "` | Following: `" + twitterInfos.following + "`\n∙ Tweets: `" + twitterInfos.tweetCount + "` | Likes: `" + twitterInfos.likesCount + "`\n∙ Created: <t:" + twitterInfos.created_at + ":R>"


                    const gasTrackerEmbed0 = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Friend.Tech Audit")
                        .setDescription(">>> Displayng the Friend.Tech user audit")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setThumbnail(pfp)
                        .setTimestamp()
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "<:TWs:1153688442568450148> TWITTER", value: " ", inline: false },
                            { name: " ", value: twitterAuditFormatted, inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: "<:friendtech:1156421684585299988> FRIEND.TECH <a:AuraLoading:1134068847616458792>", value: " ", inline: false },
                            { name: " ", value: friendTechFormatted, inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: "<:basescan:1155624395038019616> WALLET", value: " ", inline: false },
                            { name: " ", value: walletFormatted, inline: false },
                            { name: "Links", value: '[Friendtech](https://www.friend.tech/rooms/' + userAddress + ") ∙ " + '[Twitter](https://twitter.com/' + username.toLowerCase() + ") ∙ " + '[Basescan](https://basescan.org/address/' + userAddress + ") ∙ " + '[Holders](https://www.friend.tech/trades/' + userAddress + ") ∙ " + '[Chart](https://www.degenz.finance/friendtech/portfolio?address=' + userAddress + ")", inline: false }


                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                    await interaction.editReply({ embeds: [gasTrackerEmbed0], components: [], ephemeral: true });





                    // Etape 2 = Friend.tech 
                    let holdersSW = []
                    let holdingDistribution = []
                    let holdersCount = 0
                    let whalesCount = 0
                    let whalesSupply = 0
                    let whalesRatio = 0


                    let userHoldingCall = await axios.get("https://prod-api.kosetto.com/users/" + userAddress + "/token/holders")
                    let userHolding = userHoldingCall.data.users
                    let self = 0

                    if (userHoldingCall.data.nextPageStart != 50) {

                        for (const holding of userHolding) {

                            holderCount++

                            let holdingAddress = holding.address.toLowerCase()
                            let holdingBalance = holding.balance
                            let ratio = (holdingBalance / supply) * 100


                            if (ratio > 25) {

                                whalesCount++
                                whalesSupply += parseFloat(holdingBalance)

                            }

                            const isSM = smartWalletJson.find(obj => obj.address == holdingAddress.toLowerCase())


                            if (isSM) {

                                isSM.balance = holdingBalance
                                holdersSW.push(isSM)

                            }

                            if (holdingAddress == userAddress.toLowerCase()) { self += parseFloat(holdingBalance) }

                            let obj2 = {}
                            obj2.name = holding.twitterName
                            obj2.username = holding.twitterUsername
                            obj2.balance = holding.balance
                            obj2.address = holding.address
                            holdingDistribution.push(obj2)


                            holdersCount++


                        }

                    } else {

                        for (const holding of userHolding) {

                            holderCount++

                            let holdingAddress = holding.address.toLowerCase()
                            let holdingBalance = holding.balance
                            let ratio = (supply / holdingBalance) * 100

                            if (ratio > 25) {

                                whalesCount++
                                whalesSupply += parseFloat(holdingBalance)

                            }

                            const isSM = smartWalletJson.find(obj => obj.address == holdingAddress.toLowerCase())
                            console.log(isSM)

                            if (isSM) {

                                isSM.balance = holdingBalance
                                holdersSW.push(isSM)

                            }



                            if (holdingAddress == userAddress.toLowerCase()) { self += parseFloat(holdingBalance) }

                            holdersCount++


                        }

                        let itemsNumber = 50
                        let callPage = ""

                        let continuation = userHoldingCall.data.nextPageStart

                        while (continuation != null) {




                            callPage = await axios.get("https://prod-api.kosetto.com/users/" + userAddress + "/token/holders?pageStart=" + itemsNumber)
                            callPageFiltered = callPage.data.users

                            continuation = callPage.data.nextPageStart

                            if (continuation != null) {

                                for (const holding of callPageFiltered) {

                                    holderCount++

                                    let holdingAddress = holding.address.toLowerCase()
                                    let holdingBalance = holding.balance
                                    let ratio = (supply / holdingBalance) * 100

                                    if (ratio > 25) {

                                        whalesCount++
                                        whalesSupply += parseFloat(holdingBalance)

                                    }

                                    const isSM = smartWalletJson.find(obj => obj.address == holdingAddress.toLowerCase())

                                    console.log(isSM)
                                    if (isSM) {

                                        isSM.balance = holdingBalance
                                        holdersSW.push(isSM)

                                    }


                                    if (holdingAddress == userAddress.toLowerCase()) { self += parseFloat(holdingBalance) }


                                    holdersCount++



                                }


                                itemsNumber += 50

                            } else {
                                break
                            }
                        }
                    }



                    for (const sm of holdersSW) {
                        sm.name
                    }

console.log(supply)
console.log(holderCount)

                    let distribution = parseFloat((holderCount / supply) * 100).toFixed(0)
                    let selfRatio = parseFloat((self / supply) * 100).toFixed(0)

                    if (whalesSupply > 0) {
                        whalesRatio = parseFloat((whalesSupply / supply) * 100).toFixed(0)
                    }


                    //On edit avec les infos
                    friendTechFormatted = "∙ Fren Score: `" + frenScore + "%`\n∙ Smart Money : `" + holdersSW.length + " in`\n∙ Distribution: `" + distribution + "%`\n∙ Self: `" + self + " (" + selfRatio + "%)`\n∙ Whales: `" + whalesCount + "` | Holding: `" + whalesSupply + " (" + whalesRatio + "%)`"

                    const gasTrackerEmbed1 = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Friend.Tech Audit")
                        .setDescription(">>> Displayng the Friend.Tech user audit")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setThumbnail(pfp)
                        .setTimestamp()
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "<:TWs:1153688442568450148> TWITTER", value: " ", inline: false },
                            { name: " ", value: twitterAuditFormatted, inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: "<:friendtech:1156421684585299988> FRIEND.TECH", value: " ", inline: false },
                            { name: " ", value: friendTechFormatted, inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: "<:basescan:1155624395038019616> WALLET <a:AuraLoading:1134068847616458792>", value: " ", inline: false },
                            { name: " ", value: walletFormatted, inline: false },
                            { name: "Links", value: '[Friendtech](https://www.friend.tech/rooms/' + userAddress + ") ∙ " + '[Twitter](https://twitter.com/' + username.toLowerCase() + ") ∙ " + '[Basescan](https://basescan.org/address/' + userAddress + ") ∙ " + '[Holders](https://www.friend.tech/trades/' + userAddress + ") ∙ " + '[Chart](https://www.degenz.finance/friendtech/portfolio?address=' + userAddress + ")", inline: false }


                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                    await interaction.editReply({ embeds: [gasTrackerEmbed1], components: [], ephemeral: true });








                    // Etape 3 = Wallet
                    const b = await web3.eth.getBalance(userAddress)
                    const userBalance = parseFloat(b / 10 ** 18).toFixed(3)


                    const fundingTable = await getBaseDeposit(userAddress)


                    let totalDeposit = 0
                    let depositCount = 0
                    let lastDepositTime = 0
                    let lastDepositHash = 0

                    if (fundingTable.length > 0) {

                        lastDepositTime = fundingTable[0].timestamp
                        fundingTable[0].hash

                        for (const deposit of fundingTable) {

                            depositCount++
                            totalDeposit += parseFloat(deposit.value)


                        }

                    }



if (fundingTable.length > 0) { 
                    // On envoi la réponse
                    walletFormatted = "∙ Balance: `" + userBalance + "Ξ`\n∙ Deposits: `" + depositCount + "` | Total: `" + parseFloat(totalDeposit).toFixed(3) + "Ξ` | Last: <t:" + lastDepositTime + ":R> [here](https://basescan.org/tx/" + lastDepositHash + ")"

                } else {

                    // On envoi la réponse
                    walletFormatted = "∙ Balance: `" + userBalance + "Ξ`\n∙ Deposits: `" + depositCount + "` | Total: `" + parseFloat(totalDeposit).toFixed(3) + "Ξ` | Last: `None`"

                }

                    const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Friend.Tech Audit")
                        .setDescription(">>> Displayng the Friend.Tech user audit")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setThumbnail(pfp)
                        .setTimestamp()
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "<:TWs:1153688442568450148> TWITTER", value: " ", inline: false },
                            { name: " ", value: twitterAuditFormatted, inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: "<:friendtech:1156421684585299988> FRIEND.TECH", value: " ", inline: false },
                            { name: " ", value: friendTechFormatted, inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: "<:basescan:1155624395038019616> WALLET", value: " ", inline: false },
                            { name: " ", value: walletFormatted, inline: false },
                            { name: "Links", value: '[Friendtech](https://www.friend.tech/rooms/' + userAddress + ") ∙ " + '[Twitter](https://twitter.com/' + username.toLowerCase() + ") ∙ " + '[Basescan](https://basescan.org/address/' + userAddress + ") ∙ " + '[Holders](https://www.friend.tech/trades/' + userAddress + ") ∙ " + '[Chart](https://www.degenz.finance/friendtech/portfolio?address=' + userAddress + ")", inline: false }


                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                    await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [], ephemeral: true });






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
            let reportCommand = "/ft-audit"

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



