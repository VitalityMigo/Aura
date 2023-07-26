/**
 * @file Sample setwallet command with slash command.
 * @author VitalityMigo
 */

// On définit des constantes qui serviront dans l'ensemble de la commande
const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { profileData, accessSql, adminsql, reportsql, usersql, sequelize } = require('../../../events/database');
const moment = require('moment');



module.exports = {
    data: new SlashCommandBuilder()
        .setName("getprofile")
        .setDescription("Display the public profile of one of the community member")
        .addUserOption(option =>
            option
                .setName("member")
                .setDescription("The community member you want the profile to be displayed")
                .setRequired(true)

        ),

    // Début de l'éxecution de la commande
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



                        const selectedUser = interaction.options.getUser("member");

                        const cleanDiscordId = selectedUser.id

                        const userProfile = await profileData.findAll({ where: { authorId: cleanDiscordId } })


                        let projectsListFormatted = ""

                        if (userProfile.length > 0) {

                            if (userProfile[0].dataValues.authorNature !== "N/A" && userProfile[0].dataValues.authorJobs !== "N/A" && userProfile[0].dataValues.authorWeb2 !== "N/A" && userProfile[0].dataValues.authorWeb3 !== "N/A" && userProfile[0].dataValues.authorDiscord !== "N/A" && userProfile[0].dataValues.authorTwitter !== "N/A") {

                                let userId = userProfile[0].dataValues.authorId
                                let userAvatar1 = userProfile[0].dataValues.authorAvatar
                                let userName = userProfile[0].dataValues.authorName
                                let userTwitter = userProfile[0].dataValues.authorTwitter
                                let userDiscord = userProfile[0].dataValues.authorDiscord
                                let userWeb2 = userProfile[0].dataValues.authorWeb2
                                let userWeb3 = userProfile[0].dataValues.authorWeb3
                                let userJobs = userProfile[0].dataValues.authorJobs
                                let userNature = userProfile[0].dataValues.authorNature
                                let userUpdated = userProfile[0].dataValues.createdAt
                                let joinedTimestamp = parseFloat(userProfile[0].dataValues.authorJoined)






                                const baseStringTwitterHandle = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ";
                                const appropriateForm2 = new RegExp(`[^${baseStringTwitterHandle}]`, "g");
                                const cleanTwitterHandle = userTwitter.replace(appropriateForm2, "");


                                const separators = /[,/:;]/;
                                const projects = userJobs.split(separators);



                                for (const project of projects) {

                                    let projectFormatted = ""
                                    projectFormatted = project.trim().replace(/\s+/g, " ");

                                    let lignMaxSize = 40
                                    let leftPartNfts = projectFormatted
                                    let rightPartNfts = "Team Member\n"
                                    let leftPartNFTsLenght = leftPartNfts.length
                                    let rightPartNftsLenght = rightPartNfts.length
                                    let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                                    let spaceLenght = ""
                                    for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }


                                    projectsListFormatted += "`" + projectFormatted + spaceLenght + "Team`\n"


                                }

                                const date = new Date(userUpdated);
                                const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;


                                const date2 = new Date(joinedTimestamp)
                                const formattedDate2 = `${date2.getMonth() + 1}/${date2.getDate()}/${date2.getFullYear()}`;

                                const getProfileRenderOther = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle(`${userName}'s profile`)
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setDescription(`>>> Displaying the public profile of ` + userName)
                                    .setThumbnail(userAvatar1)
                                    .addFields(
                                        { name: 'Name:', value: "`" + userName + "`", inline: true },
                                        { name: 'Discord ID:', value: "`" + userId + "`", inline: true },
                                        { name: 'Speciality:', value: "`" + userNature + "`", inline: false },
                                        { name: 'Web2:', value: userWeb2, inline: false },
                                        { name: 'Web3:', value: userWeb3, inline: false },
                                        { name: 'Projects:', value: projectsListFormatted, inline: false },
                                        { name: ' ', value: " ", inline: false },
                                        { name: 'Member Since:', value: "`" + formattedDate2 + "`", inline: true },
                                        { name: 'Last Update:', value: "`" + formattedDate + "`", inline: true },
                                        { name: ' ', value: " ", inline: false },
                                        { name: ' ', value: '<:RCtwitter:1096014822837080174> [Twitter](https://twitter.com/' + userTwitter + ")", inline: true },
                                        { name: ' ', value: '<:RCdiscord:1096014711407001651> [Discord](' + userDiscord + ")", inline: true },
                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })                                    

                                // Send the embed as a response to the interaction
                                await interaction.editReply({ embeds: [getProfileRenderOther] });


                            } else if (userProfile[0].dataValues.authorNature === "N/A" && userProfile[0].dataValues.authorJobs === "N/A" && userProfile[0].dataValues.authorWeb2 === "N/A" && userProfile[0].dataValues.authorWeb3 === "N/A" && userProfile[0].dataValues.authorDiscord === "N/A" && userProfile[0].dataValues.authorTwitter === "N/A") {



                                const getProfileRenderOther = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Profile")
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setDescription(`The profile you're trying to display isn't available, which means the person either not a member of the community or not registered yet.`)
                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setTimestamp()
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                // Send the embed as a response to the interaction
                                await interaction.editReply({ embeds: [getProfileRenderOther] });



                            }
                        } else if (userProfile.length <= 0) {

                            const getProfileRenderOther = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Profile")
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setDescription(`The profile you're trying to display isn't available, which means the person is either not a member of the community or is not registered yet.`)
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setTimestamp()
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            // Send the embed as a response to the interaction
                            await interaction.editReply({ embeds: [getProfileRenderOther] });

                        }


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
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

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

                    await interaction.editReply({ embeds: [botOff] });



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
            let reportCommand = "/getprofile"

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
};

