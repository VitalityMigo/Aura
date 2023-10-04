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
const { accessSql, profileData, adminsql, reportsql, sniper_friendTech, infra_friendTech, sequelize } = require('../../../events/database');
const moment = require('moment');


module.exports = {
    id: 'friendtechtasksinfra-sniperusertutorial-button',

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

               





                const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                .setTitle("Friend.Tech Trade Panel")
                .setAuthor({ name: authorName, iconURL: userAvatar })
                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                .setDescription(">>> The Friend.Tech trade panel has several easy-to-use features.")
                .addFields(
                    { name: " ", value: " ", inline: false },
                    { name: "*Status*", value: "Indicates whether the task is active or not. If it is active, the task runs within the set conditions. If not, it is not monitoring.", inline: false },
                    { name: " ", value: " ", inline: false },
                    { name: "*Target*", value: "Ask the bot to snipe the new Friend.Tech users only if its twitter username matches the one indicated in this field", inline: false },
                    { name: " ", value: " ", inline: false },
                    { name: "*Amount*", value: "The number of tokens to be purchased per new user. The bot will always try to buy the indicated number of tokens.", inline: false },
                    { name: " ", value: " ", inline: false },
                    { name: "*Total Task*", value: "The number of new users the bot must snipe before stopping. We count in the number of users sniped, not in the number of tokens purchased.", inline: false },
                    { name: " ", value: " ", inline: false },
                    { name: "*Min/Max Price*", value: "The minimum and/or maximum key price that the bot can snipe per transaction and therefore, per new Friend.Tech user. This price shouldn't includes gas fees but includes Friend.Tech fees.", inline: false },
                    { name: " ", value: " ", inline: false },
                    { name: "*Min/Max Supply*", value: "The minimum and/or maximum supply that the new user's key must have for the bot to snipe it.", inline: false },
                    { name: " ", value: " ", inline: false },
                    { name: "*Min/Max Followers*", value: "The minimum and/or maximum number of followers the new user must have on Twitter for the bot to snipe his key.", inline: false },
                    { name: " ", value: " ", inline: false },
                    { name: "*Min/Max Twitter Score*", value: "The minimum and/or maximum Twitter Score the new user must have for the bot to snipe his key. Based on the **Audit** algorithm, made by Aura.", inline: false },
                    { name: " ", value: " ", inline: false },
                    { name: "*Min/Max Unique Holders*", value: "The minimum and/or maximum unique holder ratio that the new user's share must have for the bot to snipe his key.", inline: false },
                    { name: " ", value: " ", inline: false },
                    { name: "*Gas Preset*", value: "The gas settings to use. Classic (or 0) represents the basic setting, which can be modulated in % to make the snipe transactions more aggressive (10%, 30% etc).", inline: false },
                    { name: " ", value: " ", inline: false },
                    { name: "*Simulation*", value: "Select whether you want the transaction to be simulated internally before being launched or not. This allows to prevent a failed transaction from being launched, thus reducing the chances of losing gas fees.", inline: false },
                    { name: " ", value: " ", inline: false },
                    { name: " ", value: "*⚠️ All conditions are defaulted to any. To reset a field, press the corresponding button and leave the field empty.*", inline: false },

                    )
                .setTimestamp()
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

            await interaction.reply({ embeds: [setfpEmbedNotForYou], ephemeral: true });













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
            let reportCommand = "/snipe-menu"

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



