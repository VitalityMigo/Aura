/**
 * @file Sample getdata command with slash command.
 * @author Vitality Migø
 */


const { ActionRowBuilder, EmbedBuilder, SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const { profileData, accessSql, adminsql, reportsql, usersql, sequelize } = require('../../../events/database');
const moment = require('moment');


module.exports = {
    data: new SlashCommandBuilder()
        .setName("report")
        .setDescription("Send a report for ideas you have or bug you noticed"),


    async execute(interaction) {


        if (interaction.guildId != null) {



        //Récupérer informations de l'utilisateur de la commande
        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id
        let member = interaction.member;

        try {

            const communityRolePerms = await accessSql.findOne({ where: { serverId: serverId } })
            let communityMemberRoleId = communityRolePerms.dataValues.memberRoleId
            let communityAdminRoleId = communityRolePerms.dataValues.adminRoleId
            let botPowerStatut = communityRolePerms.dataValues.actualPower
            let communityStatut = communityRolePerms.dataValues.statut



            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")

            if (communityStatut.toLowerCase() === "active") {


                if (botPowerStatut.toLowerCase() === "on") {


                    if (member.roles.cache.has(communityMemberRoleId)) {


                        //Checkpoint
                        console.log("// Step 2 : Authorization - Executed ✅")




                        //On enregistre le user si il est pas encore dans la database
                        const timeStamp1 = Date.now();
                        const actualTimestamp1 = parseFloat(timeStamp1 / 1000).toFixed(0)
                        const isUser = await usersql.findOne({ where: { userId: authorId, serverId: serverId } })
                        if (isUser == null) { await usersql.create({ userId: authorId, userName: authorName, userAvatar: userAvatar, serverId: serverId, timestamp: actualTimestamp1 }) }



                        const sendReportModal = new ModalBuilder()
                            .setCustomId('sendReportModal')
                            .setTitle('Report');

                        // Add components to modal

                        // Create the text input components
                        const reportType = new TextInputBuilder()
                            .setCustomId('reportType')
                            .setLabel("What's the reason behind your report")
                            .setPlaceholder('e.g. bug, idea, problem')
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(30);


                        const reportCommand = new TextInputBuilder()
                            .setCustomId('reportCommand')
                            .setLabel("Which command is the object of your report ?")
                            .setPlaceholder('e.g. /blur, /profit')
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(50);


                        const reportProblem = new TextInputBuilder()
                            .setCustomId('reportProblem')
                            .setLabel("Describe your problem/idea precisely")
                            .setPlaceholder('e.g. "When I try to use the command, the bot is not responding. This were my inputs : X, Y, Z etc"')
                            .setStyle(TextInputStyle.Paragraph)
                            .setMaxLength(500);


                        const reportScale = new TextInputBuilder()
                            .setCustomId('reportScale')
                            .setLabel("How important that problem/idea is (1 to 10)?")
                            .setPlaceholder('e.g. 1, 4, 7')
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(10);



                        // An action row only holds one text input,
                        // so you need one action row per text input.
                        const firstActionRowSetProfile = new ActionRowBuilder().addComponents(reportType);
                        const secondActionRowSetProfile = new ActionRowBuilder().addComponents(reportCommand);
                        const fourthActionRowSetProfile = new ActionRowBuilder().addComponents(reportProblem);
                        const fifthActionRowSetProfile = new ActionRowBuilder().addComponents(reportScale);

                        // Add inputs to the modal
                        sendReportModal.addComponents(firstActionRowSetProfile, secondActionRowSetProfile, fourthActionRowSetProfile, fifthActionRowSetProfile);

                        // Show the modal to the user
                        await interaction.showModal(sendReportModal);


                    } else if (!member.roles.cache.has(communityMemberRoleId)) {



                        const notMember = new EmbedBuilder().setColor("#060A8F")
                            .setTitle(`Bot Access`)
                            .setDescription(">>> Showing access data")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .addFields(
                                { name: " ", value: " ", inline: false },
                                { name: "Statut", value: "`Access Denied ❌`", inline: true },
                                { name: "Required Role", value: "<@&" + communityMemberRoleId + ">", inline: true },
                                { name: "Problem Detected", value: "Your access to the bot has been denied. You can only use the bot if you have the required role in this community. If you usually have access to the bot, make sure you're in the right community or contact an admin.", inline: false },
                            )
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [notMember] });

                    }

                } else if (botPowerStatut.toLowerCase() === "off") {


                    const botOff = new EmbedBuilder().setColor("#060A8F")
                        .setTitle(`Bot statut`)
                        .setDescription(">>> Showing the bot statut")
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .addFields(
                            { name: 'Global Statut', value: "`Inactive 🔴`", inline: true },
                            { name: 'Commands', value: "`Not available`", inline: true },
                            { name: "Problem Detected", value: "The bot is currently inactive in this community. The community's administrator are the only who are able to switch the bot on, contact them for any inquiries.", inline: false },
                        )
                        .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                    await interaction.reply({ embeds: [botOff] });



                }

            } else {


                const botOff = new EmbedBuilder().setColor("#060A8F")
                    .setTitle(`Bot Access`)
                    .setDescription(">>> Showing the community's bot access")
                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .addFields(
                        { name: 'Access Statut', value: "`Denied 🔴`", inline: true },
                        { name: 'Commands', value: "`Not available`", inline: true },
                        { name: "Problem Detected", value: "The bot access is currently inactive in this community. The community's administrator are the only one who can make it active or not, contact them for any inquiries.", inline: false },
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                await interaction.editReply({ embeds: [botOff] });



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
            let reportCommand = "/report"

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

    } else if (interaction.guildId == null) {

        const errorAnswerUser = new EmbedBuilder().setColor("#060A8F")
        .setTitle("Aura")
        .setDescription(`Hey ${interaction.user.username}, we hope you're doing well !\n\nAlthough this may be possible in the future, Aura cannot be used in DM at the moment. If you want to have access to the bot, go here: <#1108757700885622784>.\n\nIf you have any questions, don't hesitate to contact one of our team member, or directly on Discord here : <#1121110417368956958>.\n\nHave a nice day 👑`)
        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
        .setTimestamp()
        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


    await interaction.reply({ embeds: [errorAnswerUser], ephemeral: true });



    }

    }
}

