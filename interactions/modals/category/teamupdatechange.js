/**
 * @file Sample modal interaction
 * @author JAYZHVJ
 * @since 3.2.0
 * @version 3.2.2
 */

/**
 * @type {import('../../../typings').ModalInteractionCommand}
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { profileData, accessSql, reportsql, adminsql, sequelize } = require('../../../events/database');
const moment = require('moment');


const buttonRowAdminDashboard = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('adminDashboardUpdateChange-button')
            .setLabel('modify')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('adminDashboardMenu-button')
            .setLabel('menu')
            .setStyle(2),
    )


module.exports = {
    id: "updateAdminDashboardChange",

    async execute(interaction) {


        //Récupérer informations de l'utilisateur de la commande
        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id
        let botId = interaction.applicationId

        try {

            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")
            //Checkpoint
            console.log("// Step 2 : Authorization - Executed ✅")


            //Récupère le password donné par l'utilisateur
            const givenAdminChannel = interaction.fields.getTextInputValue('updateAdminDashboardChangeR0');
            const givenChannel = interaction.fields.getTextInputValue('updateAdminDashboardChangeR1');

            const adminAccessInfos = await accessSql.findOne({ where: { serverId: serverId } })
            let communityUpdate = adminAccessInfos.dataValues.updateChannel
            let adminUpdateChannel = adminAccessInfos.dataValues.adminUpdateChannel

            // FAIRE LES BOUTONS HANDLER




            if (givenChannel.toString() !== communityUpdate.toString() && adminUpdateChannel.toString() !== givenAdminChannel.toString()) {




                await accessSql.update({ updateChannel: givenChannel, }, { where: { serverId: serverId } })

                const passwordManagement = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Team Dashboard")
                    .setDescription(">>> Modify the update channel for your community")
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .setTimestamp()
                    .addFields(
                        { name: " ", value: " ", inline: false },
                        { name: "Update Mecanism", value: "The update channel is where our team will send you update about the bot. You can change the update channel by using the button below.", inline: true },
                        { name: " ", value: " ", inline: false },
                        { name: "New Admin Update Channel", value: "<#" + givenAdminChannel + ">", inline: true },
                        { name: "New Admin Update Channel ID", value: "`" + givenAdminChannel + "`", inline: true },
                        { name: " ", value: " ", inline: false },
                        { name: "New Community Update Channel", value: "<#" + givenChannel + ">", inline: true },
                        { name: "New Community Update Channel ID", value: "`" + givenChannel + "`", inline: true },
                        { name: " ", value: " ", inline: false },
                        { name: " ", value: "*✅ The update channels have been successfully updated.*", inline: false },



                    )
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                await interaction.update({ embeds: [passwordManagement], components: [buttonRowAdminDashboard] });







            } else {

                const passwordManagement = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Team Dashboard")
                    .setDescription(">>> Modify the update channel for your community")
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .setTimestamp()
                    .addFields(
                        { name: " ", value: " ", inline: false },
                        { name: "Update Mecanism", value: "The update channel is where our team will send you update about the bot. You can change the update channel by using the button below.", inline: true },
                        { name: " ", value: " ", inline: false },
                        { name: "Curren Update Channel", value: "<#" + communityUpdate + ">", inline: true },
                        { name: "Curren Update Channel", value: "`" + communityUpdate + "`", inline: true },
                        { name: " ", value: " ", inline: false },
                        { name: " ", value: "*❌ The channels you entered are the current update one, try again.*", inline: false },



                    )
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                await interaction.update({ embeds: [passwordManagement], components: [buttonRowAdminDashboard] });


            }
            return;

        } catch (error) {



            console.log("// Error - sent in report ❌")

            //On envoi une notif
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
            let reportCommand = "/team-updateChange"

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
