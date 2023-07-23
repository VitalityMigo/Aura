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
const { profileData, accessSql, adminsql, reportsql, sequelize } = require('../../../events/database');
const moment = require('moment');


const buttonRowAdminDashboard1 = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('RCDashboardPassword-button')
            .setLabel('password')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('RCDashboardTeam-button')
            .setLabel('team')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('RCDashboardPower-button')
            .setLabel('power')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('RCDashboardClient-button')
            .setLabel('client')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('RCDashboardUpdate-button')
            .setLabel('update')
            .setStyle(2),
    )

const buttonRowAdminDashboard3 = new ActionRowBuilder()
    .addComponents(


        new ButtonBuilder()
            .setCustomId('RCDashboardReport-button')
            .setLabel('report')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('RCDashboardData-button')
            .setLabel('data')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('RCDashboardInvite-button')
            .setLabel('invite')
            .setStyle(2),
    );

const buttonRowAdminDashboard2 = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('RCDashboardPasswordError-button')
            .setLabel('try again')
            .setStyle(2),
    );



module.exports = {
    id: "passwordRCDashboard",

    async execute(interaction) {


        //Récupérer informations de l'utilisateur de la commande
        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id
        let botId = interaction.applicationId

        try {

            //récupère les infos persos de l'auteur
            const authorProfile = await profileData.findOne({ where: { authorId: authorId } })
            if (authorProfile === null) { await interaction.deferReply(); } else {
                const authorPrivacyMode = authorProfile.dataValues.privacyMode

                if (authorPrivacyMode.toLowerCase() === "private") { await interaction.deferReply({ ephemeral: true }); }
                if (authorPrivacyMode.toLowerCase() === "public") { await interaction.deferReply(); }
            }


            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")
            //Checkpoint
            console.log("// Step 2 : Authorization - Executed ✅")



            //Récupère le password donné par l'utilisateur
            const givenIdentifiant = interaction.fields.getTextInputValue('identifiantRCDashboardRange1');
            const givenPassword = interaction.fields.getTextInputValue('passwordRCDashboardRange1');

            const botAdmins = await adminsql.findOne({ where: { botId: botId } })
            const botIdentifier = botAdmins.dataValues.botIdentifiant
            const botPassword = botAdmins.dataValues.botPassword


            if (givenIdentifiant.toString() === botIdentifier.toString() && givenPassword.toString() === botPassword.toString()) {

                /// DASHBOARD QUI PERMET DE MODIFIER LE PASSWORD, LES ROLE ADMIN/MEMBRE ETC, LE NOM DU SERVEUR, LE BOT EN ON/OFF ETC ETC. SYSTEME DE BOUTON POUR NAVIGUER AVEC PASSWORD MODAL POUR LE PREMIER LANCEMENT

                const adminDashboardMainEmbed = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Admin Dashboard")
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .setDescription(">>> Manage the bot's global settings")
                    .setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
                    .addFields(
                        { name: ' ', value: " ", inline: false },
                        { name: 'Dashboard', value: "This page allows you to modify the global settings of the Rolls Chasers Analytics Bot. Make sure to always remember the password to be able to access it, and never share it.", inline: false },
                        { name: ' ', value: " ", inline: false },
                        { name: 'Settings', value: "`Password` - Manage the bot's administrator password\n`Team` - Manage the team's access to the bot\n`Power` - Manage the global state of the bot\n`Database` - Manage the database of the bot\n`Report` - Sort and consult the reports\n`Update` - Send a bot update to communities\n`Data` - Display various data about the bot use\n`Client` - Display various data about the clients\n`Invite` - Generate an invite link for the bot", inline: false },
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                await interaction.editReply({ embeds: [adminDashboardMainEmbed], components: [buttonRowAdminDashboard1, buttonRowAdminDashboard3] })

            } else {


                const adminDashboardMainEmbedError = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Admin Dashboard")
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .setDescription("The identifier or password you entered is incorrect. Try another identifier or password, or contact a team member if you need help.")
                    .setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                await interaction.editReply({ embeds: [adminDashboardMainEmbedError], components: [buttonRowAdminDashboard2] })

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
            let reportCommand = "/admin-gate"

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
                .setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
                .setAuthor({ name: "Rolls Chasers Analytics", iconURL: "https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg" })
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
                .setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
                .setTimestamp()
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


            await interaction.editReply({ embeds: [errorAnswerUser], ephemeral: true });


        }
    },
};
