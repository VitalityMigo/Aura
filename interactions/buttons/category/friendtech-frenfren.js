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
const { accessSql, profileData, adminsql, reportsql, interactionData, sequelize } = require('../../../events/database');
const moment = require('moment');

const axios = require("axios")

function reduceText(text, maxLength) {
    if (text.length > maxLength) {
        return text.substring(0, maxLength - 3) + "…";
    }
    return text;
}



function formatNumber(number) {
    if (number >= 1e6) {
        return (number / 1e6).toFixed(1) + 'M';
    } else if (number >= 1e3) {
        return (number / 1e3).toFixed(1) + 'k';
    } else {
        return number.toString();
    }
}




const buttonRow = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('friendtechairdrop-frenfrenmenu-button')
            .setLabel('(3, 3)')
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId('friendtechairdrop-frennotfrenmenu-button')
            .setLabel('(3, 0)')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('friendtechairdrop-notfrenfrenmenu-button')
            .setLabel('(0, 3)')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('friendtechairdrop-menu-button')
            .setLabel('menu')
            .setStyle(3),
    )


module.exports = {
    id: 'friendtechairdrop-frenfrenmenu-button',

    async execute(interaction) {
        if (!(interaction instanceof ButtonInteraction)) return;

        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id
        let botId = interaction.applicationId

        try {

            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")



            if (interaction.message.interaction.user.id === authorId) {

                //Checkpoint
                console.log("// Step 2 : Authorization - Executed ✅")



                const lastInteraction = await interactionData.findOne({ where: { authorId: authorId, commandName: "friendtech-airdrop", serverId: serverId } })

                const infoTable = JSON.parse(lastInteraction.dataValues.embed2)

                const points = infoTable[0].airdropPoints
                const portfolio = infoTable[0].portfolioValue
                const frenScore = infoTable[0].frenScore
                const frenCount = infoTable[0].frenCount
                const holderCount = infoTable[0].holderCount
                const holdingCount = infoTable[0].holdingCount
                const userAddress = infoTable[0].userAddress
                const twitterUsername = infoTable[0].twitterUsername

                const embed1 = lastInteraction.dataValues.embed1


                let holdingTable = []
                let frenTable = []


                if (embed1 == "N/A") {



                    const userHoldingCall = await axios.get("https://prod-api.kosetto.com/users/" + userAddress + "/token-holdings")
                const userHolding = userHoldingCall.data.users


                if (userHoldingCall.data.nextPageStart != 50) {

                    for (const holding of userHolding) {

                        let obj = {}
                        obj.address = holding.address.toLowerCase()
                        obj.twitterUsername = holding.twitterUsername
                        obj.balance = holding.balance
                        holdingTable.push(obj)

                    }

                } else {

                    for (const holding of userHolding) {



                        let obj = {}
                        obj.address = holding.address.toLowerCase()
                        obj.twitterUsername = holding.twitterUsername
                        obj.balance = holding.balance
                        holdingTable.push(obj)


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


                                let obj = {}
                                obj.address = holding.address.toLowerCase()
                                obj.twitterUsername = holding.twitterUsername
                                obj.balance = holding.balance
                                holdingTable.push(obj)



                            }


                            itemsNumber += 50

                        } else {
                            break
                        }
                    }
                }



                const userHoldersCall = await axios.get("https://prod-api.kosetto.com/users/" + userAddress + "/token/holders")
                const userHolders = userHoldersCall.data.users


                if (userHoldersCall.data.nextPageStart != 50) {

                    for (const holding of userHolders) {

                        let obj = {}
                        obj.address = holding.address.toLowerCase()
                        obj.twitterUsername = holding.twitterUsername
                        obj.holder = holding.balance

                        // On crée le tableau
                        const user = holdingTable.find((user) => user.address.toLowerCase() == holding.address.toLowerCase());

                        if (user) {

                            obj.holding = user.balance
                            obj.relation = "(3, 3)"

                            if (user.address.toLowerCase() != userAddress.toLowerCase()) {
                                frenTable.push(obj)
                            }

                        } else {

                            obj.holding = "0"
                            obj.relation = "(3, 0)"
                            frenTable.push(obj)


                        }



                    }

                } else {

                    for (const holding of userHolders) {

                        let obj = {}
                        obj.address = holding.address.toLowerCase()
                        obj.twitterUsername = holding.twitterUsername
                        obj.holder = holding.balance

                        // On crée le tableau
                        const user = holdingTable.find((user) => user.address.toLowerCase() == holding.address.toLowerCase());
                        if (user) {

                            obj.holding = user.balance
                            obj.relation = "(3, 3)"

                            if (user.address.toLowerCase() != userAddress.toLowerCase()) {
                                frenTable.push(obj)
                            }

                        } else {

                            obj.holding = "0"
                            obj.relation = "(3, 0)"
                            frenTable.push(obj)


                        }

                    }

                    let itemsNumber = 50
                    let callPage = ""

                    let continuation = userHoldersCall.data.nextPageStart

                    while (continuation != null) {


                        callPage = await axios.get("https://prod-api.kosetto.com/users/" + userAddress + "/token/holders?pageStart=" + itemsNumber)
                        callPageFiltered = callPage.data.users
                        if (share != "") { callPageFiltered = callPageFiltered.filter((obj) => obj.twitterUsername.toLowerCase() == share.toLowerCase()); }

                        continuation = callPage.data.nextPageStart

                        if (continuation != null) {

                            for (const holding of userHolders) {

                                let obj = {}
                                obj.address = holding.address.toLowerCase()
                                obj.twitterUsername = holding.twitterUsername
                                obj.holder = holding.balance

                                // On crée le tableau
                                const user = holdingTable.find((user) => user.address.toLowerCase() == holding.address.toLowerCase());

                                if (user) {

                                    obj.holding = user.balance
                                    obj.relation = "(3, 3)"

                                    if (user.address.toLowerCase() != userAddress.toLowerCase()) {
                                        frenTable.push(obj)
                                    }

                                } else {

                                    obj.holding = "0"
                                    obj.relation = "(3, 0)"
                                    frenTable.push(obj)


                                }

                                if (user.address.toLowerCase() != userAddress.toLowerCase()) {
                                    frenTable.push(obj)
                                }

                            }


                            itemsNumber += 50

                        } else {
                            break
                        }
                    }
                }



                for (const holding of holdingTable) {

                    if (!frenTable.includes(holding.address.toLowerCase())) {

                        let obj = {}
                        obj.address = holding.address
                        obj.twitterUsername = holding.twitterUsername
                        obj.holder = "0"
                        obj.holding = holding.balance
                        obj.relation = "(0, 3)"
                        frenTable.push(obj)


                    }

                }




            } else {


                frenTable = JSON.parse(embed1)

            }



                let frenfrenFormatted = "Username                 Amount    Holding      Relation\n\n"
                let index = 0

                const frenTableFiltered = frenTable.filter(obj => obj.relation == "(3, 3)")

                for (const fren of frenTableFiltered) {

                    index++

                    if (index <= 16) {

                        let part1 = reduceText(fren.twitterUsername, 20)
                        let part2 = fren.holder
                        let part3 = fren.holding
                        let part4 = fren.relation


                        let spaceSize = 31 - (part1.length + part2.length)
                        let spaceLenght = ""
                        for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

                        let spaceSize2 = 42 - (part1.length + part2.length + part3.length + spaceSize)
                        let spaceLenght2 = ""
                        for (let i = 0; i < spaceSize2; i++) { spaceLenght2 += " " }

                        let spaceSize3 = 56 - (part1.length + part2.length + part3.length + spaceSize + part4.length + spaceSize2)
                        let spaceLenght3 = ""
                        for (let i = 0; i < spaceSize3; i++) { spaceLenght3 += " " }



                        frenfrenFormatted += part1 + spaceLenght + part2 + spaceLenght2 + part3 + spaceLenght3 + part4 + "\n"

                    }


                }

            



                if (frenfrenFormatted == "Username                 Amount    Holding      Relation\n\n") { frenfrenFormatted = "No Fren, Fren relation found for this user               " }


                const userFTEmbed = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Friend.Tech Interactions")
                    .setDescription(">>> Displaying friend.tech airdrop")
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .setTimestamp()
                    .addFields(
                        { name: " ", value: " ", inline: false },
                        { name: "Fren Score", value: "`" + parseFloat(frenScore).toFixed(1) + "%`", inline: false },
                        { name: "Fren Count", value: "`" + frenCount + "`", inline: true },
                        { name: "Holders", value: "`" + holderCount + "`", inline: true },
                        { name: "Holding:", value: "`" + holdingCount + "`", inline: true },
                        { name: " ", value: " ", inline: false },
                        { name: "(Fren, Fren):", value: "```" + frenfrenFormatted + "```", inline: false },
                        { name: "Links", value: '[Friendtech](https://www.friend.tech/rooms/' + userAddress + ") ∙ " + '[Twitter](https://twitter.com/' + twitterUsername.toLowerCase() + ") ∙ " + '[Basescan](https://basescan.org/address/' + userAddress + ") ∙ " + '[Holders](https://www.friend.tech/trades/' + userAddress + ") ∙ " + '[Chart](https://www.degenz.finance/friendtech/portfolio?address=' + userAddress + ") ∙ " + '[Airdrop](https://www.friend.tech/airdrop)' + ")", inline: false },
                        { name: "Page", value: "`[1/1]`", inline: false },



                    )
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                await interaction.update({ embeds: [userFTEmbed], components: [buttonRow] })


                
                interactionData.update({ embed1: JSON.stringify(frenTable) }, { where: { authorId: authorId, commandName: "friendtech-airdrop", serverId: serverId } });



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
            let reportCommand = "/admin-botOff"

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



