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
const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

const { accessSql, profileData, interactionData, adminsql, reportsql, alertsDown, alertsUp, sequelize } = require('../../../events/database');
const moment = require('moment');

module.exports = {
    id: 'zzderiskalert-button',

    async execute(interaction) {
        if (!(interaction instanceof ButtonInteraction)) return;

        //Récupérer informations de l'utilisateur de la commande
        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id


        try {

        //Checkpoint
        console.log("// Step 1 : Initialization - Executed ✅")



        if (interaction.message.interaction.user.id === authorId) {

            //Checkpoint
            console.log("// Step 2 : Authorization - Executed ✅")

            const authorProfile = await profileData.findOne({ where: { authorId: authorId } })

            if (authorProfile === null) { await interaction.deferReply(); } else {
                const authorPrivacyMode = authorProfile.dataValues.privacyMode

                if (authorPrivacyMode.toLowerCase() === "private") { await interaction.deferReply({ ephemeral: true }); }
                if (authorPrivacyMode.toLowerCase() === "public") { await interaction.deferReply(); }
            }



            let channelId = interaction.channelId



            const authorLastDeriskInteraction = await interactionData.findAll({ where: { authorId: authorId, serverId: serverId, commandName: "derisk" } })

            let collectionName = authorLastDeriskInteraction[0].dataValues.collectionName
            let collectionSlug = authorLastDeriskInteraction[0].dataValues.collectionSlug
            let collectionFp = authorLastDeriskInteraction[0].dataValues.floorPrice
            let lowerMarketplace = authorLastDeriskInteraction[0].dataValues.lowerMarketlace
            let avgDeriskPrice = authorLastDeriskInteraction[0].dataValues.avgDeriskPrice
            let collectionBanner = authorLastDeriskInteraction[0].dataValues.collectionBanner
            let seclectedCollection = authorLastDeriskInteraction[0].dataValues.selectedCollection
            let collectionTwitter = authorLastDeriskInteraction[0].dataValues.collectionTwitter
            let collectionWebsite = authorLastDeriskInteraction[0].dataValues.collectionWebsite

            //Faire l'émoji d'alerte (format)
            let alertFormatted = ""
            let Marketplace = ""

            if (avgDeriskPrice > collectionFp) {

                //FAIRE LE CALL POUR SET L'ALERTE 

                alertFormatted = "`" + parseFloat(avgDeriskPrice).toFixed(3) + " Ξ`:chart_with_upwards_trend:"

            } else if (avgDeriskPrice < collectionFp) {

                //FAIRE LE CALL POUR SET L'ALERTE 

                alertFormatted = "`" + parseFloat(avgDeriskPrice).toFixed(3) + "Ξ`:chart_with_downwards_trend:"

            }


            //Correct formatting of Marketplace for EMBED
            if (lowerMarketplace === 'opensea.io') {
                Marketplace = '[<:opensea:1062318570761101352>OpenSea](https://opensea.io/collection/' + collectionSlug + ')'
            }
            if (lowerMarketplace === 'looksrare.org') {
                Marketplace = '[<:looksrare:1062318572786941983>LooksRare](https://looksrare.org/collections/' + seclectedCollection + ')'
            }
            if (lowerMarketplace === 'magically.gg' || lowerMarketplace === 'rarible.com' || lowerMarketplace === 'sudoswap') {
                Marketplace = '[<:ASxRCPNG:1070385409080696902> Magically](https://magically.gg/collection/' + seclectedCollection + ')'
            }
            if (lowerMarketplace === 'x2y2.io') {
                Marketplace = '[<:x2y2:1062318571654496317>X2Y2](https://x2y2.io/collection/' + seclectedCollection + ')'
            }
            if (lowerMarketplace === 'blur.io') {
                Marketplace = '[<:blur:1062318577782378516>Blur](https://blur.io/collection/' + seclectedCollection + ')'

            }


            const existingAlertUp = await alertsUp.findOne({ where: { collection: seclectedCollection, authorId: authorId } });
            const existingAlertDown = await alertsDown.findOne({ where: { collection: seclectedCollection, authorId: authorId } });



            await alertsDown.destroy({ where: { collection: seclectedCollection, authorId: authorId } })

            /////////// SET L'ALERTE DANS LA DATABASE
            if (avgDeriskPrice > collectionFp) {


                await alertsUp.create({
                    collection: seclectedCollection,
                    collectionName: collectionName,
                    authorId: authorId,
                    fp: parseFloat(avgDeriskPrice).toFixed(3),
                    channelId: channelId,
                })


            } else if (avgDeriskPrice < collectionFp) {


                await alertsDown.create({
                    collection: seclectedCollection,
                    collectionName: collectionName,
                    authorId: authorId,
                    fp: parseFloat(avgDeriskPrice).toFixed(3),
                    channelId: channelId,
                })


            }


            /////////// SET L'ALERTE DANS LA DATABASE


            const setfpEmbed = new EmbedBuilder().setColor("#060A8F")
                .setTitle(`${collectionName}`)
                .setAuthor({ name: authorName, iconURL: userAvatar })
                .setDescription(">>> A new alert has been set for **" + collectionName + "**.")
                .setImage(collectionBanner)
                .addFields(
                    { name: 'Floor Price', value: "`" + parseFloat(collectionFp).toFixed(3) + 'Ξ`', inline: true },
                    { name: 'Alerts', value: alertFormatted, inline: true },
                    { name: 'Marketplace', value: Marketplace, inline: true },
                    //{ name: 'Creation Date', value: "`" + formattedDate + "`", inline: false },
                    { name: "Links", value: '[magically](https://magically.gg/collection/' + seclectedCollection + ") ∙ " + '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + seclectedCollection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + seclectedCollection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ") ∙ " + '[website](' + collectionWebsite + ")", inline: false }

                )
                .setTimestamp()
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })
            await interaction.editReply({
                embeds: [setfpEmbed],
                ephemeral: true
            });



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
        let reportCommand = "/derisk-setAlert"

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
                .setAuthor({ name: "Rolls Chasers Analytics", iconURL: "https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png" })
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


