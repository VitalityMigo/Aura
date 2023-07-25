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
const { accessSql, profileData, adminsql, paymentHistory, reportsql, sequelize } = require('../../../events/database');
const moment = require('moment');

const axios = require('axios')




module.exports = {
    id: 'getaccesssubstatut-button',

    async execute(interaction) {
        if (!(interaction instanceof ButtonInteraction)) return;

        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id
        let botId = interaction.applicationId

        try {

            console.log("// Step 1 : Initialization - Executed ✅")




            //On enregistre le user si il est pas encore dans la database
            const timeStamp = Date.now();
            const actualTimestamp = parseFloat(timeStamp / 1000).toFixed(0)


            const txnHistoryCall = await paymentHistory.findAll({ where: { authorId: authorId } })

            if (txnHistoryCall.length > 0) {

                const maxTimestampObj = txnHistoryCall[0]; // Accéder à l'objet payment

                for (let i = 1; i < txnHistoryCall.length; i++) {
                    const currentObj = txnHistoryCall[i];
                    if (currentObj.dataValues.timestamp > maxTimestampObj.dataValues.timestamp) {
                        maxTimestampObj = currentObj;
                    }
                }

                const timestampDifference = actualTimestamp - maxTimestampObj.dataValues.timestamp

                const secondsInDay = 86400;
                let days = Math.floor(timestampDifference / secondsInDay); // Nombre de jours complets


                if (days < 30) {

                    const daysLeft = 31 - days

                    if (days === 0) { days = "today" } else { days = days + " days ago." }

                    const walletManager = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Get Access")
                        .setDescription("You don't need to take another subscribtion.\n\nYour last subscription payment was `" + days + "` which means you have approximatively `" + daysLeft + "` days left of subscription.\n\nIf you need any help, feel free to open a ticket.")
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.reply({ embeds: [walletManager], ephemeral: true });


                } else {

                    const walletManager = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Get Access")
                        .setDescription("You don't have any ongoing subscription.\n\nYou can gain access to the bot by choosing one of our plans below, simply click on a plan and follow the precised intructions.\n\nIf you need any help, feel free to open a ticket.")
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.reply({ embeds: [walletManager], ephemeral: true });



                }
            } else {


                const walletManager = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Get Access")
                    .setDescription("You don't have any ongoing subscription.\n\nYou can gain access to the bot by choosing one of our plans below, simply click on a plan and follow the precised intructions.\n\nIf you need any help, feel free to open a ticket.")
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                await interaction.reply({ embeds: [walletManager], ephemeral: true });





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
            let reportCommand = "getaccess-substatut"

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



            const updateEmbed = new EmbedBuilder().setColor("#060A8F")
                .setTitle("New Report")
                .setDescription(">>> A new report has just been sent.")
                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                .setAuthor({ name: "Rolls Chasers Analytics", iconURL: "https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png" })
                .setTimestamp()
                .addFields(
                    { name: " ", value: " ", inline: false },
                    { name: "Content:", value: "A new `bug` has been submitted for the `" + reportCommand + "` command by `the bot report division` in `" + serverName + "`. You can use the administrator dashboard to consult it.", inline: false },

                )
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


            await channel.send({ embeds: [updateEmbed] });



            const errorAnswerUser = new EmbedBuilder().setColor("#060A8F")
                .setTitle("An error occured")
                .setDescription("An error has occurred while executing this command. These errors can occur for a variety of reasons, such as :\n∙ Unexpected traffic\n∙ API maintenance\n∙ Occasional bug\n\nPlease note that a report has already been sent to our team, who will fix the problem as soon as possible. You can still use `/report` to give more details about the error and help our team.")
                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                .setTimestamp()
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


            await interaction.editReply({ embeds: [errorAnswerUser], ephemeral: true });


        }
    },
};



