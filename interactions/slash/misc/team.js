/**
 * @file Sample getdata command with slash command.
 * @author Vitality Migø
 */



const { ActionRowBuilder, EmbedBuilder, SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const { accessSql, profileData, adminsql, reportsql, usersql, sequelize } = require('../../../events/database');
const moment = require('moment');




/// DASHBOARD QUI PERMET DE MODIFIER LE PASSWORD, LES ROLE ADMIN/MEMBRE ETC, LE NOM DU SERVEUR, LE BOT EN ON/OFF ETC ETC. SYSTEME DE BOUTON POUR NAVIGUER AVEC PASSWORD MODAL POUR LE PREMIER LANCEMENT

module.exports = {
    data: new SlashCommandBuilder()
        .setName("team")
        .setDescription("Manage the bot in your community"),

    async execute(interaction) {


        if (interaction.guildId != null) {


        //Récupérer informations de l'utilisateur de la commande
        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png`;
        let serverId = interaction.member.guild.id
        let member = interaction.member;

        try {

            const communityRolePerms = await accessSql.findOne({ where: { serverId: serverId } })
            let communityMemberRoleId = communityRolePerms.dataValues.memberRoleId
            let communityAdminRoleId = communityRolePerms.dataValues.adminRoleId
            let botPowerStatut = communityRolePerms.dataValues.actualPower
            let communityStatut = communityRolePerms.dataValues.statut

            const authorProfile = await profileData.findOne({ where: { authorId: authorId } })



            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")



            if (member.roles.cache.has(communityMemberRoleId)) {


                if (member.roles.cache.has(communityAdminRoleId)) {

                    //Checkpoint
                    console.log("// Step 2 : Authorization - Executed ✅")



                    //On enregistre le user si il est pas encore dans la database
                    const timeStamp1 = Date.now();
                    const actualTimestamp1 = parseFloat(timeStamp1 / 1000).toFixed(0)
                    const isUser = await usersql.findOne({ where: { userId: authorId, serverId: serverId } })
                    if (isUser == null) { await usersql.create({ userId: authorId, userName: authorName, userAvatar: userAvatar, serverId: serverId, timestamp: actualTimestamp1 }) }



                    const passwordAdminDashboard = new ModalBuilder()
                        .setCustomId('passwordAdminDashboard')
                        .setTitle('Team Dashboard');

                    // Add components to modal

                    // Create the text input components
                    const password = new TextInputBuilder()
                        .setCustomId('passwordAdminDashboardRange1')
                        .setLabel("Password")
                        .setPlaceholder("The community's team password")
                        .setStyle(TextInputStyle.Short)
                        .setMinLength(5)
                        .setMaxLength(25);

                    // An action row only holds one text input,
                    // so you need one action row per text input.
                    const firstActionRowSetProfile = new ActionRowBuilder().addComponents(password);

                    // Add inputs to the modal
                    passwordAdminDashboard.addComponents(firstActionRowSetProfile);

                    // Show the modal to the user
                    await interaction.showModal(passwordAdminDashboard);


                } else if (!member.roles.cache.has(communityAdminRoleId)) {



                    const notMember = new EmbedBuilder().setColor("#060A8F")
                        .setTitle(`Bot Access`)
                        .setDescription(">>> Showing access data")
                        .setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "Statut", value: "`Access Denied ❌`", inline: true },
                            { name: "Required Role", value: "<@&" + communityAdminRoleId + ">", inline: true },
                            { name: "Problem Detected", value: "Your access to the `/admin` command has been denied. You can only use this if you have the required admin role in this community. If you usually have access to this command, make sure you're in the right community or contact an admin of the bot.", inline: false },
                        )
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })



                    if (authorProfile === null) { await interaction.reply({ embeds: [notMember] }); } else {
                        const authorPrivacyMode = authorProfile.dataValues.privacyMode

                        if (authorPrivacyMode.toLowerCase() === "private") { await interaction.reply({ embeds: [notMember], ephemeral: true });; }
                        if (authorPrivacyMode.toLowerCase() === "public") { await interaction.reply({ embeds: [notMember] }); }
                    }



                }



            } else if (!member.roles.cache.has(communityMemberRoleId)) {



                const notMember = new EmbedBuilder().setColor("#060A8F")
                    .setTitle(`Bot Access`)
                    .setDescription(">>> Showing access data")
                    .setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .addFields(
                        { name: " ", value: " ", inline: false },
                        { name: "Statut", value: "`Access Denied ❌`", inline: true },
                        { name: "Required Role", value: "<@&" + communityMemberRoleId + ">", inline: true },
                        { name: "Problem Detected", value: "Your access to the bot has been denied. You can only use the bot if you have the required role in this community. If you usually have access to the bot, make sure you're in the right community or contact an admin.", inline: false },
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });




                if (authorProfile === null) { await interaction.reply({ embeds: [notMember] }); } else {
                    const authorPrivacyMode = authorProfile.dataValues.privacyMode

                    if (authorPrivacyMode.toLowerCase() === "private") { await interaction.reply({ embeds: [notMember], ephemeral: true });; }
                    if (authorPrivacyMode.toLowerCase() === "public") { await interaction.reply({ embeds: [notMember] }); }
                }


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
            let reportCommand = "/team"

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


            await interaction.reply({ embeds: [errorAnswerUser], ephemeral: true });


        }

    } else if (interaction.guildId == null) {

        const errorAnswerUser = new EmbedBuilder().setColor("#060A8F")
        .setTitle("Aura")
        .setDescription(`Hey ${interaction.user.username}, we hope you're doing well !\n\nAlthough this may be possible in the future, Aura cannot be used in DM at the moment. If you want to have access to the bot, go here: <#1108757700885622784>.\n\nIf you have any questions, don't hesitate to contact one of our team member, or directly on Discord here : <#1121110417368956958>.\n\nHave a nice day 👑`)
        .setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
        .setTimestamp()
        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


    await interaction.reply({ embeds: [errorAnswerUser], ephemeral: true });



    }


    }
}

