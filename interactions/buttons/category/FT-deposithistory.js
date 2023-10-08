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


//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const etherscanApiKey = process.env.etherscanApiKey

const axios = require('axios')


const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(`https://1rpc.io/base`))




const getBaseDeposit = require("../../../functions/getdeposits");

const minValue = 0.1


module.exports = {
    id: 'button_friendtech_deposit_history_',

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

            const regex = /_0x([0-9a-fA-F]{40})/;
            const matches = customId.match(regex);

            let userAddress = ""

            if (matches && matches[1]) {


                userAddress = ("0x" + matches[1]).toLowerCase()


                const transfersPromise = axios.get('https://api.basescan.org/api?module=account&action=txlist&address=' + userAddress + '&startblock=0&endblock=99999999&page=1&offset=100&sort=asc&apikey=' + etherscanApiKey)
                const bridgeInPromise = getBaseDeposit(userAddress)
                const userBalanceCall = web3.eth.getBalance(userAddress)


                let [transfersRaw, bridgeRaw] = await Promise.all([transfersPromise, bridgeInPromise]);

                const transfersRaw2 = transfersRaw.data.result.filter(obj => obj.input == "0x" && obj.value >= minValue)
                const bridgeIn = bridgeRaw.filter(obj => obj.value >= minValue)


                const transfers = []
                for (const txn of transfersRaw2) {

                    let obj = {}
                    obj.hash = txn.hash
                    obj.timestamp = parseInt(txn.timeStamp)
                    obj.value = parseFloat(txn.value) / 10 ** 18
                    obj.from = txn.from.toLowerCase()
                    obj.to = txn.to.toLowerCase()
                    obj.type = "Transfer"

                    transfers.push(obj)

                }

                // Combinez les deux tableaux
                const combinedArray = transfers.concat(bridgeIn);

                // Triez le tableau combiné par ordre décroissant de timeStamp
                combinedArray.sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));


                let movesHistoryFormatted = "\n"
                let movesIn = 0
                let movesOut = 0
                let index = 0

                for (const move of combinedArray) {


                    if (index <= 14) {

                        if (move.type == "Transfer") {


                            if (move.from == userAddress) {
                                // transfer out
                                movesOut++

                                movesHistoryFormatted += "`" + "🔴" + "` Sent `" + parseFloat(move.value).toFixed(3) + "Ξ` through a `transfer` ∙ <t:" + move.timestamp + ":R>\n"


                            } else if (move.to == userAddress) {
                                // transfer in
                                movesIn++

                                movesHistoryFormatted += "`" + "🟢" + "` Received `" + parseFloat(move.value).toFixed(3) + "Ξ` through a `transfer` ∙ <t:" + move.timestamp + ":R>\n"

                            }


                        } else {
                            // bridge in
                            movesIn++

                            movesHistoryFormatted += "`" + "🟢" + "` Received `" + parseFloat(move.value).toFixed(3) + "Ξ` through a `bridge` ∙ <t:" + move.timestamp + ":R>\n"


                        }

                    } else {
                        break
                    }

                    index++


                }


                let [userBalance] = await Promise.all([userBalanceCall])

                
                const addressFormatted = "`" + userAddress + "`\n∟ *Balance:* " + parseFloat(userBalance / 10 ** 18).toFixed(3) + "Ξ"


                const links = '[Friendtech](https://www.friend.tech/rooms/' + userAddress + ") ∙ " + '[Basescan](https://basescan.org/address/' + userAddress + ") ∙ " + '[Deposit](https://basescan.org/address/' + userAddress + "#deposittxs) ∙ " + '[Holders](https://www.friend.tech/trades/' + userAddress + ") ∙ " + '[Chart](https://www.degenz.finance/friendtech/portfolio?address=' + userAddress + ")"


                const userFTEmbed = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Funds Tracker")
                    .setDescription(">>> Displaying the recent funds moves above `0.1Ξ`")
                    .setThumbnail("https://media.discordapp.net/attachments/1155457483649851443/1160700226772930601/4305554.png?ex=65359d52&is=65232852&hm=a8c67a697de444dc39a7c64667947df92ea84984ffb75ee311ff8c10af642130&=&width=1024&height=1024")
                    .setTimestamp()
                    .addFields(
                        { name: " ", value: " ", inline: false },
                        { name: "Address", value: addressFormatted, inline: true },
                        { name: " ", value: " ", inline: false },
                        { name: "Transfers In", value: "`" + movesIn + "`", inline: true },
                        { name: "Transfers Out", value: "`" + movesOut + "`", inline: true },
                        { name: " ", value: " ", inline: false },
                        { name: "Last Funds Moves:", value: movesHistoryFormatted, inline: true },
                        { name: " ", value: " ", inline: false },
                        { name: "Links", value: links, inline: false },



                    )
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                await interaction.editReply({ embeds: [userFTEmbed] });







            } else {


                const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Fund Tracker")
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



