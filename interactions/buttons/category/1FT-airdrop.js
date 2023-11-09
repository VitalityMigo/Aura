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
const { accessSql, profileData, adminsql, reportsql, sequelize } = require('../../../events/database');
const moment = require('moment');

const axios = require('axios');
const getPrice = require("../../../functions/FT-getprice");
const { time } = require('console');

module.exports = {
    id: 'button_friendtech_airdrop_analysis_',

    async execute(interaction) {
        if (!(interaction instanceof ButtonInteraction)) return;

        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id
        let botId = interaction.applicationId

        await interaction.deferReply({ ephemeral: true })

        try {

            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")


            if (interaction.message.interaction.user.id === authorId) {

                //Checkpoint
                console.log("// Step 2 : Authorization - Executed ✅")

                const customId = interaction.customId

                const regex = /_0x([0-9a-fA-F]{40})/;
                const matches = customId.match(regex);


                if (matches && matches[1]) {

                    const address = "0x" + matches[1].toLowerCase()

                    // On envoi les deux calls
                    const holdingTablePromise = getFTHolding(address, "")
                    const tradeTablePromise = getTrades(address)

                    pointsFormatted = "• **Investment:** <a:AuraLoading:1134068847616458792>\n• **Estimated PPE:** <a:AuraLoading:1134068847616458792>\n• **Weekly Pts:** <a:AuraLoading:1134068847616458792>"


                    const embed1 = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Friend Tech Airdrop")
                        .setDescription(">>> Displaying your Friend Tech airdrop data")
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "Key Price:", value: "<a:AuraLoading:1134068847616458792>", inline: false },
                            { name: "Weigthed MC:", value: "<a:AuraLoading:1134068847616458792>", inline: true },
                            { name: "Portfolio Value:", value: "<a:AuraLoading:1134068847616458792>", inline: true },
                            { name: "MC/PV:", value: "<a:AuraLoading:1134068847616458792>", inline: true },
                            { name: " ", value: " ", inline: false },
                            { name: " ", value: pointsFormatted, inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: "Links", value: '[Friendtech](https://www.friend.tech/rooms/' + address + ") ∙ " + '[Twitter](https://twitter.com/) ∙ ' + '[Basescan](https://basescan.org/address/' + address + ") ∙ " + '[Holders](https://www.friend.tech/trades/' + address + ") ∙ " + '[Chart](https://www.degenz.finance/friendtech/portfolio?address=' + address + ")", inline: false }


                        )
                        .setAuthor({ name: "Aura", iconURL: "https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png" })
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.editReply({ embeds: [embed1] });




                    const user = await axios.get("https://prod-api.kosetto.com/users/" + address)

                    if (user) {

                        const twitterUsername = user.data.twitterUsername
                        const twitterName = user.data.twitterName
                        const holderCount = user.data.holderCount
                        const price = user.data.displayPrice / 10 ** 18
                        const holdingCount = user.data.holdingCount
                        const pfp = user.data.twitterPfpUrl
                        const supply = user.data.shareSupply


                        const marketcap = getFTMarketCap(supply)



                        const embed2 = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Friend Tech Airdrop")
                            .setDescription(">>> Displaying your Friend Tech airdrop data")
                            .setThumbnail(pfp)
                            .addFields(
                                { name: " ", value: " ", inline: false },
                                { name: "Key Price:", value: "`" + parseFloat(price).toFixed(3) + "Ξ`", inline: false },
                                { name: "Weigthed MC:", value: "`" + parseFloat(marketcap).toFixed(3) + "Ξ`", inline: true },
                                { name: "Portfolio Value:", value: "<a:AuraLoading:1134068847616458792>", inline: true },
                                { name: "MC/PV:", value: "<a:AuraLoading:1134068847616458792>", inline: true },
                                { name: " ", value: " ", inline: false },
                                { name: " ", value: pointsFormatted, inline: false },
                                { name: " ", value: " ", inline: false },
                                { name: "Links", value: '[Friendtech](https://www.friend.tech/rooms/' + address + ") ∙ " + '[Twitter](https://twitter.com/' + twitterUsername.toLowerCase() + ") ∙ " + '[Basescan](https://basescan.org/address/' + address + ") ∙ " + '[Holders](https://www.friend.tech/trades/' + address + ") ∙ " + '[Chart](https://www.degenz.finance/friendtech/portfolio?address=' + address + ")", inline: false }


                            )
                            .setAuthor({ name: "Aura", iconURL: "https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png" })
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [embed2] });



                        const heldValue = await Promise.all([holdingTablePromise]);
                        const mc_pv = marketcap / heldValue


                        const embed3 = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Friend Tech Airdrop")
                            .setDescription(">>> Displaying your Friend Tech airdrop data")
                            .setThumbnail(pfp)
                            .addFields(
                                { name: " ", value: " ", inline: false },
                                { name: "Key Price:", value: "`" + parseFloat(price).toFixed(3) + "Ξ`", inline: false },
                                { name: "Weigthed MC:", value: "`" + parseFloat(marketcap).toFixed(3) + "Ξ`", inline: true },
                                { name: "Portfolio Value:", value: "`" + parseFloat(heldValue).toFixed(3) + "Ξ`", inline: true },
                                { name: "MC/PV:", value: "`" + parseFloat(mc_pv).toFixed(0) + "`", inline: true },
                                { name: " ", value: " ", inline: false },
                                { name: " ", value: pointsFormatted, inline: false },
                                { name: " ", value: " ", inline: false },
                                { name: "Links", value: '[Friendtech](https://www.friend.tech/rooms/' + address + ") ∙ " + '[Twitter](https://twitter.com/' + twitterUsername.toLowerCase() + ") ∙ " + '[Basescan](https://basescan.org/address/' + address + ") ∙ " + '[Holders](https://www.friend.tech/trades/' + address + ") ∙ " + '[Chart](https://www.degenz.finance/friendtech/portfolio?address=' + address + ")", inline: false }


                            )
                            .setAuthor({ name: "Aura", iconURL: "https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png" })
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [embed3] });




                        const ethInvestedRaw = await Promise.all([tradeTablePromise]);
                        const ethInvested = ethInvestedRaw / 10 ** 18

                        const ppe = 48 * (mc_pv) + 59
                        const weekly = ppe * ethInvested

                         pointsFormatted = "• **Investment:** `" + parseFloat(ethInvested).toFixed(3) + "Ξ`\n• **Estimated PPE:** `" + Math.ceil(ppe) + "`\n• **Weekly Pts:** `" + Math.ceil(weekly) + " pts`"

                        const embed4 = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Friend Tech Airdrop")
                            .setDescription(">>> Displaying your Friend Tech airdrop data")
                            .setThumbnail(pfp)
                            .addFields(
                                { name: " ", value: " ", inline: false },
                                { name: "Key Price:", value: "`" + parseFloat(price).toFixed(3) + "Ξ`", inline: false },
                                { name: "Weigthed MC:", value: "`" + parseFloat(marketcap).toFixed(3) + "Ξ`", inline: true },
                                { name: "Portfolio Value:", value: "`" + parseFloat(heldValue).toFixed(3) + "Ξ`", inline: true },
                                { name: "MC/PV:", value: "`" + parseFloat(mc_pv).toFixed(0) + "`", inline: true },
                                { name: " ", value: " ", inline: false },
                                { name: " ", value: pointsFormatted, inline: false },
                                { name: " ", value: " ", inline: false },
                                { name: "Links", value: '[Friendtech](https://www.friend.tech/rooms/' + address + ") ∙ " + '[Twitter](https://twitter.com/' + twitterUsername.toLowerCase() + ") ∙ " + '[Basescan](https://basescan.org/address/' + address + ") ∙ " + '[Holders](https://www.friend.tech/trades/' + address + ") ∙ " + '[Chart](https://www.degenz.finance/friendtech/portfolio?address=' + address + ")", inline: false }


                            )
                            .setAuthor({ name: "Aura", iconURL: "https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png" })
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [embed4] });



                    } else {

                        const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Friend Tech Airdrop")
                            .setDescription("An error occured while retreiving your Friend Tech airdrop data. Please try again or contact a team member if you need help.")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setAuthor({ name: "Aura", iconURL: "https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png" })
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                        await interaction.editReply({ embeds: [gasTrackerEmbed2], ephemeral: true });


                    }



                } else {


                    const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Friend Tech Airdrop")
                        .setDescription("An error occured while retreiving your Friend Tech airdrop data. Please try again or contact a team member if you need help.")
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .setAuthor({ name: "Aura", iconURL: "https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png" })
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                    await interaction.editReply({ embeds: [gasTrackerEmbed2], ephemeral: true });




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
            let reportCommand = "/ft-airdrop"

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



// Fonctions annexes 


async function getFTHolding(userAddress, share) {

    let heldValue = 0


    let userHoldingCall = await axios.get("https://prod-api.kosetto.com/users/" + userAddress + "/token-holdings")
    let userHolding = userHoldingCall.data.users
    if (share != "") { userHolding = userHolding.filter((obj) => obj.twitterUsername.toLowerCase() == share.toLowerCase()); }


    if (userHoldingCall.data.nextPageStart != 50) {

        for (const holding of userHolding) {

            let holdingAddress = holding.address.toLowerCase()

            const holderInfo = await axios.get("https://prod-api.kosetto.com/users/" + holdingAddress)
            let holderPrice = holderInfo.data.displayPrice / 10 ** 18

            let balance = parseInt(holding.balance)
            let totalValue = balance * holderPrice


            heldValue += parseFloat(totalValue)



        }

    } else {

        for (const holding of userHolding) {


            let holdingAddress = holding.address.toLowerCase()


            const holderInfo = await axios.get("https://prod-api.kosetto.com/users/" + holdingAddress)
            let holderPrice = holderInfo.data.displayPrice / 10 ** 18

            let balance = parseInt(holding.balance)
            let totalValue = balance * holderPrice


            heldValue += parseFloat(totalValue)


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

                    let balance = parseInt(holding.balance)
                    let totalValue = balance * holderPrice


                    heldValue += parseFloat(totalValue)



                }


                itemsNumber += 50

            } else {
                break
            }
        }
    }

    return heldValue;


}


function getFTMarketCap(supply) {

    let market_cap = 0

    for (let i = 1; i <= supply; i++) {
        const price = getPrice(i, 1); // Prix de la share pour la supply actuelle
        market_cap += price / 10 ** 18;
    }

    return market_cap;


}



async function getTrades(userAddress) {

    const timestamp = getTimestampDernierSamedi()

    let invested = 0


    let userHoldingCall = await axios.get("https://prod-api.kosetto.com/users/" + userAddress + "/trade-activity")
    let userHolding = userHoldingCall.data.users

    

    if (userHoldingCall.data.nextPageStart != 50) {

        for (const holding of userHolding) {

            if (holding.createdAt > (timestamp * 1000)) {

                if (holding.isBuy == true) {

                    
                    invested += parseInt(holding.ethAmount)
                }
            } else {

                return invested
            }


        }

    } else {

        for (const holding of userHolding) {

            if (holding.createdAt > (timestamp * 1000)) {

                
                if (holding.isBuy == true) {

                    
                    invested += parseInt(holding.ethAmount)
                }
            } else {

                return invested
            }


        }

        let itemsNumber = 50
        let callPage = ""

        let continuation = userHoldingCall.data.nextPageStart

        while (continuation != null) {




            callPage = await axios.get("https://prod-api.kosetto.com/users/" + userAddress + "/trade-activity?pageStart=" + itemsNumber)
            callPageFiltered = callPage.data.users

            continuation = callPage.data.nextPageStart

            if (continuation != null) {

                for (const holding of userHolding) {

                    if (holding.createdAt > (timestamp * 1000)) {

                        if (holding.isBuy == true) {

                            invested += parseInt(holding.ethAmount)
                        }
                    } else {

                        return invested
                    }


                }


                itemsNumber += 50

            } else {
                break
            }
        }
    }

    return invested;


}


// Fonction pour obtenir le timestamp du dernier samedi à minuit
function getTimestampDernierSamedi() {
    const aujourdHui = new Date();
    const jourActuel = aujourdHui.getDay(); // 0 pour dimanche, 1 pour lundi, ..., 6 pour samedi
    const joursDepuisDernierSamedi = jourActuel === 6 ? 0 : jourActuel + 1; // Si aujourd'hui est samedi, joursDepuisDernierSamedi sera 0

    // Calcul de la date du dernier samedi à minuit
    const dernierSamedi = new Date(aujourdHui);
    dernierSamedi.setDate(aujourdHui.getDate() - joursDepuisDernierSamedi);
    dernierSamedi.setHours(0, 0, 0, 0); // Réglage de l'heure à minuit

    // Obtention du timestamp
    const timestamp = dernierSamedi.getTime() / 1000; // Divisé par 1000 pour obtenir les secondes au lieu des millisecondes

    return timestamp;
}
