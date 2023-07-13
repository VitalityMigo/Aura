/**
 * @file Sample getdata command with slash command.
 * @author Vitality Migø
 */




const { ActionRowBuilder, ButtonBuilder, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { profileData, accessSql, adminsql, reportsql, usersql, sequelize } = require('../../../events/database');
const moment = require('moment');



const buttonsRowprivate = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('private-button')
            .setLabel('🔒 turn private')
            .setStyle(2),

    );

const buttonsRowpublic = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('public-button')
            .setLabel('🔓 turn public')
            .setStyle(2),

    );



module.exports = {
    data: new SlashCommandBuilder()
        .setName("privacy")
        .setDescription("Choose to be in public or private mode"),


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

            if (authorProfile === null) { await interaction.deferReply(); } else {
                const authorPrivacyMode = authorProfile.dataValues.privacyMode

                if (authorPrivacyMode.toLowerCase() === "private") { await interaction.deferReply({ ephemeral: true }); }
                if (authorPrivacyMode.toLowerCase() === "public") { await interaction.deferReply(); }
            }



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



                        let privacyModeFormatted = ""
                        let privacyMode = ""

                        const privacyBigDataAuthor = await profileData.findOne({ where: { authorId: authorId } })


                        if (privacyBigDataAuthor !== null) {

                            if (privacyBigDataAuthor.dataValues.privacyMode !== "private" && privacyBigDataAuthor.dataValues.privacyMode !== "public") {

                                await profileData.update({ privacyMode: "public", }, { where: { authorId: authorId } })
                                privacyMode = "public"


                            } else if (privacyBigDataAuthor.dataValues.privacyMode === "private" || privacyBigDataAuthor.dataValues.privacyMode === "public") {

                                privacyMode = privacyBigDataAuthor.dataValues.privacyMode
                            }


                        } else if (privacyBigDataAuthor === null) {

                            await profileData.create({
                                authorId: authorId,
                                authorAvatar: userAvatar,
                                authorName: authorName,
                                authorTwitter: "N/A",
                                authorDiscord: "N/A",
                                authorWeb2: "N/A",
                                authorWeb3: "N/A",
                                authorJobs: "N/A",
                                authorNature: "N/A",
                                authorJoined: "N/A",
                                privacyMode: "public",
                                visualSelect: "1",

                            })


                            privacyMode = "public"

                        }



                        if (privacyMode.toLowerCase() === "private") { privacyModeFormatted = "`private mode 🔒`" }
                        if (privacyMode.toLowerCase() === "public") { privacyModeFormatted = "`public mode 🔓`" }


                        const privateMode = new EmbedBuilder().setColor("#060A8F")
                            .setTitle(authorName + "'s privacy")
                            .setDescription(">>> Display the actual privacy settings of " + authorName)
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .addFields(
                                { name: " ", value: " ", inline: false },
                                { name: "Privacy Mecanism", value: "In `private mode`, only you can see the result of the commands you're using, which is not the case in `public mode`. Not that some commands are always private.\n\nChanging the privacy settings will modify your privacy settings accross all the servers that are using Rolls Chasers Analytics.", inline: true },
                                { name: " ", value: " ", inline: false },
                                { name: "Statut", value: "Your are in " + privacyModeFormatted, inline: false }
                            )
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        if (privacyMode.toLowerCase() === "private") { await interaction.editReply({ embeds: [privateMode], components: [buttonsRowpublic] }); }
                        if (privacyMode.toLowerCase() === "public") { await interaction.editReply({ embeds: [privateMode], components: [buttonsRowprivate] }); }



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

                        await interaction.editReply({ embeds: [notMember] });


                    }

                } else if (botPowerStatut.toLowerCase() === "off") {


                    const botOff = new EmbedBuilder().setColor("#060A8F")
                        .setTitle(`Bot statut`)
                        .setDescription(">>> Showing the bot statut")
                        .setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .addFields(
                            { name: 'Global Statut', value: "`Inactive 🔴`", inline: true },
                            { name: 'Commands', value: "`Not available`", inline: true },
                            { name: "Problem Detected", value: "The bot is currently inactive in this community. The community's administrator are the only who are able to switch the bot on, contact them for any inquiries.", inline: false },
                        )
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                    await interaction.editReply({ embeds: [botOff] });



                }

            } else {


                const botOff = new EmbedBuilder().setColor("#060A8F")
                    .setTitle(`Bot Access`)
                    .setDescription(">>> Showing the community's bot access")
                    .setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
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
            let reportCommand = "/privacy"

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

