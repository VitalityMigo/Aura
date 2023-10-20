
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

function formatWallet(input) {
    return input.length > 35 ? `${input.substring(0, 10)}…${input.substring(input.length - 10)}` : input;
}





module.exports = {
    id: 'friendtech-portfolio-first-button',

    async execute(interaction) {
        if (!(interaction instanceof ButtonInteraction)) return;

        //Récupérer informations de l'utilisateur de la commande
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



                const lastInteraction = await interactionData.findOne({ where: { authorId: authorId, commandName: "friendtech-portfolio", serverId: serverId } })

                //On récupère le tableau des bids
                const holderTableFull = JSON.parse(lastInteraction.dataValues.embed1)

                // On récupère les informations gloals des bids de la collection
                const holderDataTable = JSON.parse(lastInteraction.dataValues.embed2)


                const name = holderDataTable[0].name
                const username = holderDataTable[0].username
                const address = holderDataTable[0].address
                const totalFTValue = holderDataTable[0].totalValue
                const totalSharesValue = holderDataTable[0].shareValue
                const userBalance = holderDataTable[0].userBalance
                const links = holderDataTable[0].links

                const pageIndex = lastInteraction.dataValues.pageIndex
                const newPage = "1"



                let holdingTableSorted = holderTableFull.slice(0, 16);

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



                let buttonRow1 = interaction.message.components[0]
                buttonRow1.components.find(obj => obj.data.label === "first page").data.disabled = true
                buttonRow1.components.find(obj => obj.data.label === "previous page").data.disabled = true
                buttonRow1.components.find(obj => obj.data.label === "next page").data.disabled = false
                buttonRow1.components.find(obj => obj.data.label === "last page").data.disabled = false





                const userFTEmbed = new EmbedBuilder().setColor("#060A8F")
                    .setTitle(name + "'s portfolio")
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
                        { name: "Links", value: links, inline: false },
                        { name: "Page:", value: "`[1/" + pageIndex + "]`", inline: false },

                    )
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                if (interaction.message.components.length == 3) {

                    let buttonRow2 = interaction.message.components[1]
                    let buttonRow3 = interaction.message.components[2]

                    await interaction.update({ embeds: [userFTEmbed], components: [buttonRow1, buttonRow2, buttonRow3], ephemeral: true });


                } else {

                    await interaction.update({ embeds: [userFTEmbed], components: [buttonRow1], ephemeral: true });

                }


                await interactionData.update({ actualPage: newPage.toString(), }, { where: { authorId: authorId, commandName: "friendtech-portfolio", serverId: serverId } })






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



