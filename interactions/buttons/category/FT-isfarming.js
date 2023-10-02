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

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(`https://1rpc.io/base`))

const axios = require('axios')



const reduceText = require("../../../functions/reducetext")
const addTimeout = require("../../../functions/addtimeout")
const getTimeAgoSmall = require("../../../functions/timeagosmall")
const farmingFTScore = require("../../../functions/ft-farmingscore")



const shareContractAbi = require("../../../contracts/friendtech/share.json");
const shareContractAddress = "0xcf205808ed36593aa40a44f10c7f7c2f67d4a4d4"
const shareContract = new web3.eth.Contract(shareContractAbi, shareContractAddress);


const callPage = 1
const perPage = 50




module.exports = {
    id: 'ft_interaction_',

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




                //Checkpoint
                console.log("// Step 2 : Authorization - Executed ✅")


                const customId = interaction.customId
                const regex = /_(0x[a-fA-F0-9]{40})_(0x[a-fA-F0-9]{40})/;

                const matches = customId.match(regex);


                if (matches && matches[1] && matches[2]) {


                    const trader = matches[1];
                    const subject = matches[2];




                    let traderName = ""
                    let traderUsername = ""
                    let traderFrenRatio = 0
                    let traderFrenCount = 0
                    let traderHolding = 0

                    let subjectName = ""
                    let subjectUsername = ""
                    let subjectFrenRatio = 0
                    let subjectFrenCount = 0
                    let subjectHolding = 0

                    let holdingFormatted = ""
                    let relation = ""

                    let tradeCount = 0
                    let tradeType = ""
                    let farming = "❌ Probably not"
                    let action1 = ""

                    let farmingScore = 5



                    const frenfrenCall = await axios.get('https://preview.frenfren.pro/api/trpc/trades.list?batch=1&input={"0":{"json":{"trader":["' + trader + '","' + subject + '"],"subject":["' + trader + '","' + subject + '"],"page":' + callPage + ',"perPage":' + perPage + ',"filter":{},"excludeSelfTrades":true,"withFriends":null},"meta":{"values":{"withFriends":["undefined"]}}}}')


                    // On récupère le nombre de trades
                    const tradeTable = frenfrenCall.data[0].result.data.json.trades
                    tradeCount = frenfrenCall.data[0].result.data.json.total



                    if (tradeTable.length > 0) {


                        const traderTable = tradeTable.filter(obj => obj.ftHolder.trader.address.toLowerCase() == trader.toLowerCase())
                        const subjectTable = tradeTable.filter(obj => obj.ftHolder.trader.address.toLowerCase() == subject.toLowerCase())


                        // On prend les stats (3,3)
                        if (traderTable.length > 0) {

                            console.log("ici")
                            traderFrenRatio = parseFloat(traderTable[0].ftHolder.trader.frenScore * 100).toFixed(0)
                            traderFrenCount = traderTable[0].ftHolder.trader.frenfrenCount
                            traderHolding = traderTable[0].ftHolder.shareAmount
                            traderUsername = traderTable[0].ftHolder.trader.twitterUsername


                            subjectFrenRatio = parseFloat(traderTable[0].ftHolder.subject.frenScore * 100).toFixed(0)
                            subjectFrenCount = traderTable[0].ftHolder.subject.frenfrenCount
                            subjectUsername = traderTable[0].ftHolder.subject.twitterUsername



                        }

                        if (subjectTable.length > 0) {


                            subjectHolding = subjectTable[0].ftHolder.shareAmount


                            if (traderTable.length <= 0) {


                                subjectFrenRatio = parseFloat(subjectTable[0].ftHolder.trader.frenScore * 100).toFixed(0)
                                subjectFrenCount = subjectTable[0].ftHolder.trader.frenfrenCount
                                subjectUsername = subjectTable[0].ftHolder.trader.twitterUsername

                                traderFrenRatio = parseFloat(subjectTable[0].ftHolder.subject.frenScore * 100).toFixed(0)
                                traderFrenCount = subjectTable[0].ftHolder.subject.frenfrenCount
                                traderUsername = subjectTable[0].ftHolder.subject.twitterUsername
                            }

                        }


                        /////// On construit le tableau de trade
                        let interactionsFormatted = "T/S           Type      Share         Value         Date\n\n"
                        let index = 0

                        for (const trade of tradeTable) {

                            index++



                            let ethAmount = trade.ethAmount
                            let feesAmount = trade.protocolEthAmount + trade.subjectEthAmount
                            let txnHash = trade.txHash
                            let shareAmount = trade.shareAmount
                            let isBuy = trade.isBuy
                            let newHeldCount = trade.ftHolder.shareAmount
                            let date = new Date(trade.createdAt)
                            let traderName = trade.ftHolder.trader.twitterUsername
                            let subjectName = trade.ftHolder.subject.twitterUsername
                            let traderAddress = trade.ftHolder.trader.address.toLowerCase()
                            let subjectAddress = trade.ftHolder.subject.address.toLowerCase()



                            let timestamp = Math.floor((date.setHours(date.getHours() + 2)) / 1000)



                            // on definit le tag et le type d'action
                            let actionType = "Buy"
                            let actionTag = "Buy"
                            let direction = "➡️"
                            let amount = ""

                            let isNewHolding = trade.isNewHolding
                            let isLastHolding = trade.isLastHolding
                            let isReciprocat = trade.isReciprocat


                            if (isBuy == false) { actionType = "Sell"; actionTag = "Sell" }
                            if (isNewHolding === true) { actionTag = "Entry" }
                            if (isLastHolding === true) { actionTag = "Exit" }
                            if (isReciprocat === true) { actionTag = "Mutual" }





                            // On incrémente les différents compteurs 

                            if (isBuy == true) {

                                amount = "+" + shareAmount

                                if (subjectAddress.toLowerCase() == trader.toLowerCase()) { direction = "⬅️" }

                            } else {

                                amount = "-" + shareAmount

                                if (subjectAddress.toLowerCase() == trader.toLowerCase()) { direction = "⬅️" }

                            }

                            if (index == 1) {

                                action1 = actionTag

                                
                            }



                            if (index <= 5) {

                                let part1 = direction
                                let part2 = actionTag
                                let part3 = amount.toString()
                                let part4 = parseFloat(ethAmount).toFixed(3) + "Ξ"
                                let part5 = getTimeAgoSmall(timestamp)


                                let spaceSize = 18 - (part1.length + part2.length)
                                let spaceLenght = ""
                                for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

                                let spaceSize2 = 29 - (part1.length + part2.length + part3.length + spaceSize)
                                let spaceLenght2 = ""
                                for (let i = 0; i < spaceSize2; i++) { spaceLenght2 += " " }

                                let spaceSize3 = 43 - (part1.length + part2.length + part3.length + spaceSize + part4.length + spaceSize2)
                                let spaceLenght3 = ""
                                for (let i = 0; i < spaceSize3; i++) { spaceLenght3 += " " }

                                let spaceSize4 = 56 - (part1.length + part2.length + part3.length + spaceSize + part4.length + spaceSize2 + part5.length + spaceSize3)
                                let spaceLenght4 = ""
                                for (let i = 0; i < spaceSize4; i++) { spaceLenght4 += " " }



                                interactionsFormatted += part1 + spaceLenght + part2 + spaceLenght2 + part3 + spaceLenght3 + part4 + spaceLenght4 + part5 + "\n"

                            }





                        }







                        holdingFormatted = "`" + traderHolding + " | " + subjectHolding + "`"

                        if (traderHolding > 0 && subjectHolding > 0) { relation = "`(3, 3)`" }
                        else if (traderHolding > 0 && subjectHolding <= 0) { relation = "`(3, 0)`" }
                        else if (traderHolding <= 0 && subjectHolding > 0) { relation = "`(0, 3)`" }
                        else { relation = "`(0, 0)`" }


                        farming = farmingFTScore(action1, traderFrenRatio, subjectFrenRatio)



                        // On formatte le nom et le socre d'holding
                        const traderScore = traderFrenRatio + "% (" + traderFrenCount + ")"
                        const subjectScore = subjectFrenRatio + "% (" + subjectFrenCount + ")"



                        const traderFormatted = "`" + traderUsername + "`\n*Score:* " + traderScore + "\n∟[<:TWs:1153688442568450148>](https://twitter.com/" + traderUsername + ")[<:basescan:1155624395038019616>](https://basescan.org/address/" + trader + ")[<:friendtech:1156421684585299988>](https://www.friend.tech/rooms/" + trader + ")"
                        const subjectFormatted = "`" + subjectUsername + "`\n*Score:* " + subjectScore + "\n∟[<:TWs:1153688442568450148>](https://twitter.com/" + subjectUsername + ")[<:basescan:1155624395038019616>](https://basescan.org/address/" + subject + ")[<:friendtech:1156421684585299988>](https://www.friend.tech/rooms/" + subject + ")"




                        const links = '[Friendtech](https://www.friend.tech/)' + " ∙ " + '[Twitter](https://twitter.com/' + ") ∙ " + '[Basescan](https://basescan.org/address/' + trader + "?toaddress=" + subject + ") ∙ " + '[Chart 1](https://www.degenz.finance/friendtech/portfolio?address=' + trader + ") ∙ " + '[Chart 2](https://www.degenz.finance/friendtech/portfolio?address=' + subject + ") ∙ " + '[FrenFren](https://preview.frenfren.pro/trades/exchanges/' + trader + "/" + subject + ")"


                        const userFTEmbed = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Relation Insights")
                            .setDescription(">>> Displaying the relation insights")
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .addFields(
                                { name: " ", value: " ", inline: false },
                                { name: "Trader", value: traderFormatted, inline: true },
                                { name: "Subject", value: subjectFormatted, inline: true },
                                { name: " ", value: " ", inline: false },
                                { name: " ", value: " ", inline: false },
                                { name: "Farming", value: "`" + farming + "`", inline: true },
                                { name: "Trade Type", value: "`" + action1 + "`", inline: true },
                                { name: "Relation", value: relation, inline: true },
                                { name: "Last trades:", value: "```" + interactionsFormatted + "```", inline: false },
                                { name: " ", value: "*The T/S field shows who is the trader and who is the seller*", inline: false },
                                { name: "Links", value: links, inline: false },



                            )
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                        await interaction.editReply({ embeds: [userFTEmbed] });




                    } else {

                        // On va chercher les infos manquantes
                        // const frenfrenCall = await axios.get('https://preview.frenfren.pro/api/trpc/trades.list?batch=1&input={"0":{"json":{"trader":["' + user1Address + '","' + user2Address + '"],page":' + callPage + ',"perPage":' + perPage + ',"filter":{},"excludeSelfTrades":true,"withFriends":null},"meta":{"values":{"withFriends":["undefined"]}}}}')
                        const lastCall = await axios.get('https://preview.frenfren.pro/api/trpc/trades.list?batch=1&input={"0":{"json":{"trader":["' + trader + '","' + subject + '"],"subject":["' + trader + '","' + subject + '"],"page":' + callPage + ',"perPage":' + perPage + ',"filter":{},"excludeSelfTrades":true,"withFriends":null},"meta":{"values":{"withFriends":["undefined"]}}}}')

                        const tradeTable2 = lastCall.data[0].result.data.json.trades
                        const tradeUser1Table = tradeTable2.filter(obj => obj.ftHolder.trader.address.toLowerCase() == trader.toLowerCase())
                        const tradeUser2Table = tradeTable2.filter(obj => obj.ftHolder.trader.address.toLowerCase() == subject.toLowerCase())

                        // On prend les stats (3,3)
                        if (tradeUser1Table.length > 0) {
                            traderFrenRatio = parseFloat(tradeUser1Table[0].ftHolder.trader.frenScore * 100).toFixed(0)
                            traderFrenCount = tradeUser1Table[0].ftHolder.trader.frenfrenCount
                            traderUsername = tradeUser1Table[0].ftHolder.trader.twitterUsername
                        } else {

                            const frenfrenCall = await axios.get('https://preview.frenfren.pro/api/trpc/users.autocomplete?batch=1&input={"0":{"json":"' + trader + '"}}')
                            const user1Profile = frenfrenCall.data[0].result.data.json.find(obj => obj.address.toLowerCase() === trader.toLowerCase())
                            traderFrenRatio = parseFloat(user1Profile.frenScore * 100).toFixed(0)
                            traderFrenCount = user1Profile.frenfrenCount
                            traderUsername = user1Profile.twitterUsername

                        }

                        if (tradeUser2Table.length > 0) {
                            subjectFrenRatio = parseFloat(tradeUser2Table[0].ftHolder.trader.frenScore * 100).toFixed(0)
                            subjectFrenCount = tradeUser2Table[0].ftHolder.trader.frenfrenCount
                            subjectUsername = tradeUser2Table[0].ftHolder.trader.twitterUsername

                        } else {

                            const frenfrenCall = await axios.get('https://preview.frenfren.pro/api/trpc/users.autocomplete?batch=1&input={"0":{"json":"' + subject + '"}}')
                            const user2Profile = frenfrenCall.data[0].result.data.json.find(obj => obj.address.toLowerCase() === subject.toLowerCase())
                            subjectFrenRatio = parseFloat(user2Profile.frenScore * 100).toFixed(0)
                            subjectFrenCount = user2Profile.frenfrenCount
                            subjectUsername = user2Profile.twitterUsername

                        }


                        const user1Score = traderFrenRatio + "% (" + traderFrenCount + ")"
                        const user2Score = subjectFrenRatio + "% (" + subjectFrenCount + ")"


                        const user1Formatted = "`" + traderUsername + "`\n*Score:* " + user1Score + "\n∟[<:TWs:1153688442568450148>](https://twitter.com/" + traderUsername + ")[<:basescan:1155624395038019616>](https://basescan.org/address/" + trader + ")[<:friendtech:1156421684585299988>](https://www.friend.tech/rooms/" + trader + ")"
                        const user2Formatted = "`" + subjectUsername + "`\n*Score:* " + user2Score + "\n∟[<:TWs:1153688442568450148>](https://twitter.com/" + subjectUsername + ")[<:basescan:1155624395038019616>](https://basescan.org/address/" + subject + ")[<:friendtech:1156421684585299988>](https://www.friend.tech/rooms/" + subject + ")"



                        const links = '[Friendtech](https://www.friend.tech/)' + " ∙ " + '[Twitter](https://twitter.com/' + ") ∙ " + '[Basescan](https://basescan.org/address/' + trader + "?toaddress=" + subject + ") ∙ " + '[Chart 1](https://www.degenz.finance/friendtech/portfolio?address=' + trader + ") ∙ " + '[Chart 2](https://www.degenz.finance/friendtech/portfolio?address=' + subject + ") ∙ " + '[FrenFren](https://preview.frenfren.pro/trades/exchanges/' + trader + "/" + subject + ")"


                        let interactionsFormatted = "No interaction found between these two users            "


                        const userFTEmbed = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Relation Insights")
                            .setDescription(">>> Displaying the relation insights")
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .addFields(
                                { name: " ", value: " ", inline: false },
                                { name: "Trader", value: user1Formatted, inline: true },
                                { name: "Subject", value: user2Formatted, inline: true },
                                { name: " ", value: " ", inline: false },
                                { name: "Farming", value: "`⚠️ No data`", inline: true },
                                { name: "Trade Type", value: "`None`", inline: true },
                                { name: "Relation", value: "`(0, 0)`", inline: true },
                                { name: "Interactions:", value: "```" + interactionsFormatted + "```", inline: false },
                                { name: "Links", value: links, inline: false },


                            )
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [userFTEmbed] });






                    }



                } else {


                    const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Buy Shares")
                        .setDescription("An error occured while retreiving the subject's Friend.Tech address. Please try again using `/friendtech user` or contact a team member if you need help.")
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .setAuthor({ name: "Aura", iconURL: "https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png" })
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                    await interaction.editReply({ embeds: [gasTrackerEmbed2], ephemeral: true });




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
            let reportCommand = "/FT-isfarming"

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



