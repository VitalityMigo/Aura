/**
 * @file Sample getdata command with slash command.
 * @author Vitality Migø
 */




const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { profileData, accessSql, adminsql, vouchData, reportsql, usersql, sequelize } = require('../../../events/database');

const moment = require('moment');


module.exports = {
    data: new SlashCommandBuilder()
        .setName("vouchleaderboard")
        .setDescription("Display the vouch leaderboard on a specific amount of time")
        .addStringOption(option =>
            option
                .setName("clear")
                .setDescription("Choose to clear the vouch database or not")
                .setRequired(false)
                .setChoices(
                    {
                        name: 'Yes',
                        value: 'Yes',
                    },
                    {
                        name: 'No',
                        value: 'No',
                    },
                ),
        ),

    async execute(interaction) {


        if (interaction.guildId != null) {


            //Récupérer informations de l'utilisateur de la commande
            let authorId = interaction.user.id;
            let authorName = interaction.user.username;
            let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
            let serverId = interaction.member.guild.id
            let member = interaction.member;
            let botId = interaction.applicationId


            
            try {

                const botAdmins = await adminsql.findOne({ where: { botId: botId } })
                const botGlobalState = botAdmins.dataValues.botState

                let communityMemberRoleId = ""
                let communityAdminRoleId = ""
                let botPowerStatut = ""
                let communityStatut = ""
                let accessTier = ""

                //Récupère info varibale sur le bot et le serveur
                const communityRolePerms = await accessSql.findOne({ where: { serverId: serverId } })
                if (communityRolePerms != null) {
                    communityMemberRoleId = communityRolePerms.dataValues.memberRoleId
                    communityAdminRoleId = communityRolePerms.dataValues.adminRoleId
                    botPowerStatut = communityRolePerms.dataValues.actualPower
                    communityStatut = communityRolePerms.dataValues.statut
                    accessTier = communityRolePerms.dataValues.accessTier
                }




                const authorProfile = await profileData.findOne({ where: { authorId: authorId } })

                if (authorProfile === null) { await interaction.deferReply(); } else {
                    const authorPrivacyMode = authorProfile.dataValues.privacyMode

                    if (authorPrivacyMode.toLowerCase() === "private") { await interaction.deferReply({ ephemeral: true }); }
                    if (authorPrivacyMode.toLowerCase() === "public") { await interaction.deferReply(); }
                }


                //Checkpoint
                console.log("// Step 1 : Initialization - Executed ✅")


                if (botGlobalState.toLowerCase() === "on") {


                    if (communityStatut.toLowerCase() === "active" || communityStatut == "") {

                        if (accessTier.toLowerCase() == "b-tier" || accessTier.toLowerCase() == "a-tier" || accessTier.toLowerCase() == "s-tier") {



                        if (member.roles.cache.has(communityMemberRoleId)) {

                            //Checkpoint
                            console.log("// Step 2 : Authorization - Executed ✅")



                            //On enregistre le user si il est pas encore dans la database
                            const timeStamp1 = Date.now();
                            const actualTimestamp1 = parseFloat(timeStamp1 / 1000).toFixed(0)
                            const isUser = await usersql.findOne({ where: { userId: authorId, serverId: serverId } })
                            if (isUser == null) { await usersql.create({ userId: authorId, userName: authorName, userAvatar: userAvatar, serverId: serverId, timestamp: actualTimestamp1 }) }


                            let clear = interaction.options.getString("clear");
                            if (!clear) { clear = "No" }

                            const allEntries = await vouchData.findAll({ where: { serverId: serverId } });


                            if (allEntries.length == 0) {


                                const vouchLeaderboardInvalid = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle(`Vouch Leaderboard`)
                                    .setDescription("There's no entry into the vouch database, wait for the members to vouch and try later. Also, make sure to select the clear option properly")
                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setTimestamp()
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [vouchLeaderboardInvalid] });



                            } else {

                                let voucherCount = 0
                                let membersCount = 0

                                let voucherIdTable = []
                                for (let i = 0; i < allEntries.length; i++) {
                                    const objectId = allEntries[i].dataValues.authorId;
                                    if (!voucherIdTable.includes(objectId)) {

                                        voucherIdTable.push(objectId)

                                    }
                                }
                                if (voucherIdTable.length > 0) { voucherCount = voucherIdTable.length }

                                // Compter le nombre d'entrées pour chaque memberId
                                const counts = {};
                                for (const entry of allEntries) {
                                    const memberId = entry.memberId;
                                    counts[memberId] = (counts[memberId] || 0) + 1;
                                }

                                // Trier les membres en fonction du nombre d'entrées
                                const members = Object.keys(counts).map(memberId => {
                                    return { memberId: memberId, count: counts[memberId] };
                                });
                                members.sort((a, b) => b.count - a.count);


                                if (members.length > 0) { membersCount = members.length }

                                let membersFiltered = members.slice(0, 10);


                                let vouchLeaderboardValue = ""
                                // Afficher le classement
                                for (const member of membersFiltered) {

                                    vouchLeaderboardValue += member.memberId + " ∙ " + member.count + " points\n"


                                }


                                const timestampsGrabber = allEntries.map(item => item.dataValues.vouchTimestamp);
                                const firstVouch = Math.min.apply(null, timestampsGrabber);
                                const firstVouchFormatted = firstVouch * 1000

                                const date = new Date(firstVouchFormatted);
                                const dateLisible = date.toLocaleString();

                                const date1 = moment(dateLisible, 'M/D/YYYY, h:mm:ss A');
                                const formattedDate = date1.format('Do [of] MMMM YYYY');


                                if (clear === "Yes") {

                                    if (member.roles.cache.has(communityAdminRoleId)) {

                                        await vouchData.destroy({ where: { serverId: serverId } });


                                        const vouchEmbed = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle(`Vouch Leaderboard`)
                                            .setDescription(">>> Vouch leaderboard since the `" + formattedDate + "`")
                                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .addFields(
                                                { name: "Voucher", value: "`" + voucherCount + " vouchers`", inline: true },
                                                { name: "Member", value: "`" + membersCount + " members`", inline: true },
                                                { name: "Leaderboard", value: vouchLeaderboardValue, inline: false },

                                            )
                                            .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                        await interaction.editReply({ embeds: [vouchEmbed] }, { ephemeral: true });


                                    } else if (!member.roles.cache.has(communityAdminRoleId)) {

                                        const notMember = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle(`Bot Access`)
                                            .setDescription(">>> Showing access data")
                                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .addFields(
                                                { name: " ", value: " ", inline: false },
                                                { name: "Status", value: "`Access Denied ❌`", inline: true },
                                                { name: "Required Role", value: "<@&" + communityAdminRoleId + ">", inline: true },
                                                { name: "Problem Detected", value: "Your access to the `clear` option of the command has been denied. You can only use this if you have the required admin role in this community. If you usually have access to this command option, make sure you're in the right community or contact an admin of the bot.", inline: false },
                                            )
                                            .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                        await interaction.editReply({ embeds: [notMember] });



                                    }

                                } else if (clear === "No") {
                                    const vouchEmbed = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle(`Vouch Leaderboard`)
                                        .setDescription(">>> Vouch leaderboard since the `" + formattedDate + "`")
                                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .addFields(
                                            { name: "Voucher", value: "`" + voucherCount + " vouchers`", inline: true },
                                            { name: "Member", value: "`" + membersCount + " members`", inline: true },
                                            { name: "Leaderboard", value: vouchLeaderboardValue, inline: false },

                                        )
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                    await interaction.editReply({ embeds: [vouchEmbed] }, { ephemeral: true });




                                }

                            }

                        } else if (!member.roles.cache.has(communityMemberRoleId)) {



                            const notMember = new EmbedBuilder().setColor("#060A8F")
                                .setTitle(`Bot Access`)
                                .setDescription(">>> Showing access data")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Status", value: "`Access Denied ❌`", inline: true },
                                    { name: "Required Role", value: "<@&" + communityMemberRoleId + ">", inline: true },
                                    { name: "Problem Detected", value: "Your access to the bot has been denied. You can only use the bot if you have the required role in this community. If you usually have access to the bot, make sure you're in the right community or contact an admin.", inline: false },
                                )
                                .setTimestamp()
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                            await interaction.editReply({ embeds: [notMember] });



                        }

                    } else {

                        accessTier = "Free Tier"

                        const botOff = new EmbedBuilder().setColor("#060A8F")
                            .setTitle(`Bot Access`)
                            .setDescription(">>> Showing the community's bot access")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .addFields(
                                { name: 'Access Status', value: "`Denied 🔴`", inline: false },
                                { name: 'Access Tier', value: "`" + accessTier.toUpperCase() + "`", inline: true },
                                { name: 'Access Tier', value: "`B-TIER`", inline: true },
                                { name: "Problem Detected", value: "Your access to this command has been denied. You need a higher access tier to use this feature. You can consult the available commands in this community by using `/access`.", inline: false },
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
                                { name: 'Access Status', value: "`Denied 🔴`", inline: true },
                                { name: 'Commands', value: "`Not available`", inline: true },
                                { name: "Problem Detected", value: "The bot access is currently inactive in this community. The community's administrator are the only one who can make it active or not, contact them for any inquiries.", inline: false },
                            )
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                        await interaction.editReply({ embeds: [botOff] });

                    }


                } else {


                    console.log("// Step 2 : Unauthorized - Executed ✅")


                    const botOff = new EmbedBuilder().setColor("#060A8F")
                        .setTitle(`Bot status`)
                        .setDescription(">>> Showing the bot status")
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .addFields(
                            { name: 'Global Status', value: "`Inactive 🔴`", inline: true },
                            { name: 'Commands', value: "`Not available`", inline: true },
                            { name: "Problem Detected", value: "The bot is currently inactive in this community. The community's administrator are the only who are able to switch the bot on, contact them for any inquiries.", inline: false },
                        )
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.editReply({ embeds: [botOff] });

                    console.log("// Step 3 : Answer - Executed ✅")


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
                let reportCommand = "/vouchleaderboard"

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
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png' })


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

}

