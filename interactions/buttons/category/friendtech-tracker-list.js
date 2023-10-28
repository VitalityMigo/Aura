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
const { ActionRowBuilder, EmbedBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const { accessSql, profileData, adminsql, reportsql, tracker_friendTech, interactionData, sequelize } = require('../../../events/database');
const moment = require('moment');

const reduceText = require("../../../functions/reducetext");

function formatWallet(input) {
    return input.length > 35 ? `${input.substring(0, 10)}…${input.substring(input.length - 10)}` : input;
}




module.exports = {
    id: 'friendtechtrackerinfra-listtracker-button',

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



                const buttonsRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('button_friendtech_tracker_list_first')
                            .setLabel('first page')
                            .setStyle(2)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('button_friendtech_tracker_list_previous')
                            .setLabel('previous page')
                            .setStyle(2)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('button_friendtech_tracker_list_next')
                            .setLabel('next page')
                            .setStyle(2),
                        new ButtonBuilder()
                            .setCustomId('button_friendtech_tracker_list_last')
                            .setLabel('last page')
                            .setStyle(2),
                    );


                const buttonsRowNo = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('button_friendtech_tracker_list_first')
                            .setLabel('first page')
                            .setStyle(2)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('button_friendtech_tracker_list_previous')
                            .setLabel('previous page')
                            .setStyle(2)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('button_friendtech_tracker_list_next')
                            .setLabel('next page')
                            .setStyle(2)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('button_friendtech_tracker_list_last')
                            .setLabel('last page')
                            .setStyle(2)
                            .setDisabled(true),
                    );

                const buttonsRowUtils = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('button_friendtech_tracker_list_remove')
                            .setLabel('Remove')
                            .setStyle(4),
                        new ButtonBuilder()
                            .setCustomId('button_friendtech_tracker_list_reset')
                            .setLabel('Reset')
                            .setStyle(1),
                        new ButtonBuilder()
                            .setCustomId('button_friendtech_tracker_list_refresh')
                            .setLabel('Refresh')
                            .setStyle(1),

                        new ButtonBuilder()
                            .setCustomId('button_friendtech_tracker_list_menu')
                            .setLabel('🏠')
                            .setStyle(1),
                    );



                const userList = await tracker_friendTech.findAll({ where: { authorId: authorId } })
                const userCount = userList.length
                const spotLeft = 25 - userCount


                if (userCount > 0) {


                    const itemsPerPage = 16; // Nombre d'objets par page
                    const pageIndex = Math.ceil(userCount / itemsPerPage);


                    let formatted = "Username                                          Wallet\n\n"
                    const simplifiedTable = []
                    let index = 0

                    for (const user of userList) {

                        index++


                        const username = user.dataValues.subjectUsername
                        const address = user.dataValues.subjectWallet


                        if (index <= itemsPerPage) {

                            let lignMaxSize = 55
                            let leftPartNfts = reduceText(username, 30)
                            let rightPartNfts = formatWallet(address)
                            let leftPartNFTsLenght = leftPartNfts.length
                            let rightPartNftsLenght = rightPartNfts.length
                            let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                            let spaceLenght = ""
                            for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }


                            formatted += leftPartNfts + spaceLenght + rightPartNfts + "\n"
                        }

                        let loopObj = {
                            username: username,
                            address: address
                        }
                        simplifiedTable.push(loopObj)


                    }

                    const linksFormatted = '[Friendtech](https://www.friend.tech) ∙ ' + '[Twitter](https://twitter.com/friendtech) ∙ ' + '[Trending](https://www.friend.tech/search) ∙ ' + '[Dune Analytics](https://dune.com/whale_hunter/friend-tech-ultimate-analytics)'

                    const getBlurOneWallet = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Friend Tech Tracker")
                        .setDescription(">>> Displaying your tracked Friend Tech users")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "User Count", value: "`" + userCount + "`", inline: true },
                            { name: "Spot Left", value: "`" + spotLeft + "`", inline: true },
                            { name: "Tracking:", value: "```" + formatted + "```", inline: false },
                            { name: "Links", value: linksFormatted, inline: false },
                            { name: "Page", value: "`[1/" + pageIndex + "]`", inline: true },

                        )
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                    if (pageIndex <= 1) { await interaction.update({ embeds: [getBlurOneWallet], components: [buttonsRowNo, buttonsRowUtils] }); }
                    else { await interaction.update({ embeds: [getBlurOneWallet], components: [buttonsRow, buttonsRowUtils] }); }




                    // Store the interaction
                    const infoTable = []
                    let obj = {
                        userCount: userCount,
                        spotLeft: spotLeft,
                        link: linksFormatted,
                    }
                    infoTable.push(obj)


                    await interactionData.destroy({ where: { authorId: authorId, serverId: serverId, commandName: "friendtech-tracker-list" } })

                    await interactionData.create({

                        authorId: authorId,
                        authorName: authorName,
                        serverId: serverId,
                        commandName: "friendtech-tracker-list",
                        interactionId: interaction.id,
                        embed1: JSON.stringify(simplifiedTable),
                        embed2: JSON.stringify(infoTable),
                        pageIndex: pageIndex.toString(),
                        actualPage: "1",

                    })


                } else {


                    const buttonsRowUtils = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('button_friendtech_tracker_list_menu')
                                .setLabel('🏠')
                                .setStyle(1),
                        );




                    const maxTracked = 25
                    const formatted = "No tracked user found for your profile                  "
                    const links = '[Friendtech](https://www.friend.tech) ∙ ' + '[Twitter](https://twitter.com/friendtech) ∙ ' + '[Trending](https://www.friend.tech/search) ∙ ' + '[Dune Analytics](https://dune.com/whale_hunter/friend-tech-ultimate-analytics)'

                    const getBlurOneWallet = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Friend Tech Tracker")
                        .setDescription(">>> Displaying your tracked Friend Tech users")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "User Count", value: "`0`", inline: true },
                            { name: "Spot Left", value: "`" + maxTracked + "`", inline: true },
                            { name: "Tracking:", value: "```" + formatted + "```", inline: false },
                            { name: "Links", value: links, inline: false },
                            { name: "Page", value: "`[1/1]`", inline: true },

                        )
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.update({ embeds: [getBlurOneWallet], components: [buttonsRowUtils] })



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



