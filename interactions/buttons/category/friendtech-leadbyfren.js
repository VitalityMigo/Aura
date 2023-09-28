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
            .setCustomId('friendtechairdrop-leaderboardbyfren-button')
            .setLabel('sort by fren score')
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId('friendtechairdrop-leaderboardbyairdrop-button')
            .setLabel('sort by airdrop pts')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('friendtechairdrop-leaderboardbyportfolio-button')
            .setLabel('sort by portfolio ')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('friendtechairdrop-leaderboardbyholders-button')
            .setLabel('sort by holders ')
            .setStyle(2),
    )


    const buttonRow2 = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('friendtechairdrop-menu-button')
            .setLabel('menu')
            .setStyle(3),
    )



module.exports = {
    id: 'friendtechairdrop-leaderboardbyfren-button',

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

                const userPoints = infoTable[0].airdropPoints
                const userPortfolio = infoTable[0].portfolioValue
                const userFrenScore = infoTable[0].frenScore
                const userAddress = infoTable[0].userAddress
                const twitterUsername = infoTable[0].twitterUsername


                // On va chercher le tableau
                const byFrenCall = await axios.get('https://preview.frenfren.pro/api/trpc/users.autocomplete,users.frens?batch=1&input={"0":{"json":""},"1":{"json":{"orderBy":"frenScore"}}}')

                const byFrenTable = byFrenCall.data[1].result.data.json.users


                let byFrenFormatted = "Username            Holders    P.Value    Points   (3,3)\n\n"

                let index = 0

                for (const user of byFrenTable) {


                    index++

                    if (index <= 16) {

                        const twitterUsername = user.twitterUsername
                        const holderCount = user.holderCount
                        const portfolioValue = user.portfolioValue.value
                        const airdropPoints = formatNumber(parseFloat(user.totalPoints).toFixed(1))
                        const frenScore = parseFloat(user.frenScore * 100).toFixed(0)

                        //const volume = feesCollected / subjectFees


                        let part1 = reduceText(twitterUsername, 18)
                        let part2 = holderCount.toString()
                        let part3 = parseFloat(portfolioValue).toFixed(1) + "Ξ"
                        let part4 = airdropPoints.toString()
                        let part5 = frenScore + "%"


                        let spaceSize = 27 - (part1.length + part2.length)
                        let spaceLenght = ""
                        for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

                        let spaceSize2 = 38 - (part1.length + part2.length + part3.length + spaceSize)
                        let spaceLenght2 = ""
                        for (let i = 0; i < spaceSize2; i++) { spaceLenght2 += " " }

                        let spaceSize3 = 48 - (part1.length + part2.length + part3.length + spaceSize + part4.length + spaceSize2)
                        let spaceLenght3 = ""
                        for (let i = 0; i < spaceSize3; i++) { spaceLenght3 += " " }

                        let spaceSize4 = 56 - (part1.length + part2.length + part3.length + spaceSize + part4.length + spaceSize2 + part5.length + spaceSize3)
                        let spaceLenght4 = ""
                        for (let i = 0; i < spaceSize4; i++) { spaceLenght4 += " " }



                        byFrenFormatted += part1 + spaceLenght + part2 + spaceLenght2 + part3 + spaceLenght3 + part4 + spaceLenght4 + part5 + "\n"

                    }






                }



                const userFTEmbed = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Friend.Tech Interactions")
                    .setDescription(">>> Displaying friend.tech airdrop")
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .setTimestamp()
                    .addFields(
                        { name: " ", value: " ", inline: false },
                        { name: "User Points", value: "`" + userPoints + "`", inline: true },
                        { name: "User Portfolio", value: "`" + parseFloat(userPortfolio).toFixed(3) + "Ξ`", inline: true },
                        { name: "User Fren Score", value: "`" + parseFloat(userFrenScore).toFixed(1) + "%`", inline: true },
                        { name: "Leaderboard:", value: "```" + byFrenFormatted + "```", inline: false },
                        { name: "Links", value: '[Friendtech](https://www.friend.tech/rooms/' + userAddress + ") ∙ " + '[Twitter](https://twitter.com/' + twitterUsername.toLowerCase() + ") ∙ " + '[Basescan](https://basescan.org/address/' + userAddress + ") ∙ " + '[Holders](https://www.friend.tech/trades/' + userAddress + ") ∙ " + '[Chart](https://www.degenz.finance/friendtech/portfolio?address=' + userAddress + ") ∙ " + '[Airdrop](https://www.friend.tech/airdrop)' + " ∙ " + '[Search](https://twitter.com/search?q=friendtech%20airdrop)', inline: false },
                        { name: "Page", value: "`[1/1]`", inline: false },


                       // { name: "Links", value: links, inline: false },
                        // { name: "Page", value: "`[1/" + pageIndex + "]`", inline: false },



                    )
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


            await interaction.update({ embeds: [userFTEmbed], components: [buttonRow, buttonRow2] })





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



