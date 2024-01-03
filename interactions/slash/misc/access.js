/**
 * @file Sample getdata command with slash command.
 * @author Vitality Migø
 */

// Bouh

const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { accessSql, profileData, adminsql, reportsql, usersql, sequelize } = require('../../../events/database');
const moment = require('moment');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("access")
        .setDescription("Display your level of access to the bot"),

    async execute(interaction) {


        if (interaction.guildId != null) {


            //Récupérer informations de l'utilisateur de la commande
            let authorId = interaction.user.id;
            let authorName = interaction.user.username;
            let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
            let serverId = interaction.member.guild.id
            let member = interaction.member;
            let botId = interaction.applicationId


            //Lancement du try

            try {

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

                //Récupère régagle de privé/ou pas de l'utilisateur
                const authorProfile = await profileData.findOne({ where: { authorId: authorId } })

                if (authorProfile === null) { await interaction.deferReply(); } else {
                    const authorPrivacyMode = authorProfile.dataValues.privacyMode

                    if (authorPrivacyMode.toLowerCase() === "private") { await interaction.deferReply({ ephemeral: true }); }
                    if (authorPrivacyMode.toLowerCase() === "public") { await interaction.deferReply(); }
                }

                //Checkpoint
                console.log("// Step 1 : Initialization - Executed ✅")
                console.log("// Step 2 : Authorization - Executed ✅")



                let serverName = interaction.member.guild.name
                let serverLogo = interaction.member.guild.icon


                //On récupère les infos sur l'accès de la commu au bot
                const communityInfos = await accessSql.findOne({ where: { serverId: serverId } })

                if (communityInfos !== null) {


                    if (member.roles.cache.has(communityMemberRoleId)) {



                        let serverTier = communityInfos.dataValues.accessTier
                        let serverAccessTime = communityInfos.dataValues.accessSince
                        let serverAccessTimeFormatted = serverAccessTime * 1000

                        const date = new Date(serverAccessTimeFormatted);
                        const dateLisible = date.toLocaleString();

                        const date1 = moment(dateLisible, 'M/D/YYYY');
                        const formattedDate = date1.format('Do [of] MMMM YYYY');


                        //on définit le message renvoyé
                        let availableCommands = ""

                        if (serverTier.toLowerCase() === "s-tier") {
                            availableCommands = "`/access` ∙ `/alerts set` ∙ `/alerts get` ∙ `/alerts remove` ∙ `/blur data` ∙ `/blur bids` ∙ `/blur holders` ∙ `/cryptoprofit` ∙ `/coin` ∙ `/data` ∙ `/derisk collection` ∙ `/derisk txn` ∙ `/ens` ∙ `/gas calculator` ∙ `/gas tracker` ∙ `/getprofile` ∙ `/guide` ∙ `/inscription` ∙ `/market` ∙ `/portfolio` ∙ `/privacy` ∙ `/profile` ∙ `/profit` ∙ `/rcprofit` ∙ `/report` ∙ `/sats` ∙ `/status` ∙ `/track mints` ∙ `/track tokens` ∙ `/track trades` ∙ `/vouch` ∙ `/vouchleaderboard` ∙ `/wallet set` ∙ `/wallet get` ∙ `/wallet raw` ∙ `/wallet remove` ∙ `/walletgenerator`∙ `/watchlist set` ∙ `/watchlist get` ∙ `/watchlist remove`   "
                        }

                        if (serverTier.toLowerCase() === "a-tier") {
                            //availableCommands = "`/access` ∙ `/alerts set` ∙ `/alerts get` ∙ `/alerts remove` ∙ `/blur data` ∙ `/blur bids` ∙ `/blur holders` ∙ `/cryptoprofit` ∙ `/coin` ∙ `/data` ∙ `/derisk collection` ∙ `/derisk txn` ∙ `/ens` ∙ `/gas calculator` ∙ `/gas tracker` ∙ `/getprofile` ∙ `/guide` ∙ `/inscription` ∙ `/market` ∙ `/portfolio` ∙ `/privacy` ∙ `/profile` ∙ `/profit` ∙ `/rcprofit` ∙ `/report` ∙ `/sats` ∙ `/status` ∙ `/track mints` ∙ `/track tokens` ∙ `/track trades` ∙ `/vouch` ∙ `/vouchleaderboard` ∙ `/wallet set` ∙ `/wallet get` ∙ `/wallet raw` ∙ `/wallet remove` ∙ `/walletgenerator`∙ `/watchlist set` ∙ `/watchlist get` ∙ `/watchlist remove`   "

                            availableCommands = "`/access` ∙ `/data` ∙ `/derisk` ∙ `/ens` ∙ `/gastracker` ∙ `/gascalculator` ∙ `/getprofile` ∙ `/getwallets` ∙ `/getwatchlist` ∙ `/guide` ∙ `/privacy` ∙ `/profit` ∙ `/removewallet` ∙ `/removewatchlist` ∙ `/report` ∙ `/setwallet` ∙ `/setwatchlist` ∙ `/status ∙ `/walletgenerator` ∙ `/vouch` ∙ `/vouchleaderboard`"
                        }

                        if (serverTier.toLowerCase() === "b-tier") {

                            // availableCommands = "`/access` ∙ `/alerts set` ∙ `/alerts get` ∙ `/alerts remove` ∙ `/blur data` ∙ `/blur bids` ∙ `/blur holders` ∙ `/cryptoprofit` ∙ `/coin` ∙ `/data` ∙ `/derisk collection` ∙ `/derisk txn` ∙ `/ens` ∙ `/gas calculator` ∙ `/gas tracker` ∙ `/getprofile` ∙ `/guide` ∙ `/inscription` ∙ `/market` ∙ `/portfolio` ∙ `/privacy` ∙ `/profile` ∙ `/profit` ∙ `/rcprofit` ∙ `/report` ∙ `/sats` ∙ `/status` ∙ `/track mints` ∙ `/track tokens` ∙ `/track trades` ∙ `/vouch` ∙ `/vouchleaderboard` ∙ `/wallet set` ∙ `/wallet get` ∙ `/wallet raw` ∙ `/wallet remove` ∙ `/walletgenerator`∙ `/watchlist set` ∙ `/watchlist get` ∙ `/watchlist remove`   "

                            availableCommands = "`/access` ∙ `/getwallets` ∙ `/getprofile` ∙ `/guide` ∙ `/privacy` ∙ `/profit` ∙ `/report` ∙ `/removewallet` ∙ `/setwallet` ∙ `/status ∙ `/vouch` ∙ `/vouchleaderboard`"
                        }


                        console.log("// Step 3 : Analyze - Executed ✅")



                        const accessEmbed = new EmbedBuilder().setColor("#060A8F")
                            .setTitle(serverName + "'s access")
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setDescription(`>>> Display the level of access of ` + serverName + " to the bot ")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .addFields(
                                { name: 'Community', value: "`" + serverName + "`", inline: true },
                                { name: 'Access Tier', value: "`" + serverTier.toUpperCase() + "`", inline: true },
                                { name: 'Access Date', value: "`" + formattedDate + "`", inline: true },
                                { name: 'Available Commands:', value: availableCommands, inline: true },)
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [accessEmbed] });

                        console.log("// Step 4 : Answer - Executed ✅")


                    } else if (!member.roles.cache.has(communityMemberRoleId)) {

                        console.log("// Step 2 : Unauthorized - Executed ✅")


                        const notMember = new EmbedBuilder().setColor("#060A8F")
                            .setTitle(`Bot Access`)
                            .setDescription(">>> Showing access data")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .addFields(
                                { name: " ", value: " ", inline: false },
                                { name: "Status", value: "`Access Denied ❌`", inline: true },
                                { name: "Required Role", value: "<@&" + communityMemberRoleId + ">", inline: true },
                                { name: "Problem Detected", value: "Your access to the bot has been denied. You can only use the bot if you have the required role in this community. In the meantime, you have access to our free commands.", inline: false },
                            )
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                        await interaction.editReply({ embeds: [notMember] });

                        console.log("// Step 3 : Answer - Executed ✅")

                    }



                } else if (communityInfos === null) {

                    console.log("ici")
                    //Dans le cas où la communauté n'a pas accès
                    let availableCommands = " "


                    /////// A FAIRE  \\\\\\\\\
                    availableCommands = "`/access` ∙ `/derisk txn` ∙ `/guide` ∙ `/report` ∙ `/status` "


                    const accessEmbed = new EmbedBuilder().setColor("#060A8F")
                        .setTitle(serverName + "'s access")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setDescription(`>>> Display the level of access of ` + serverName + " to the bot ")
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .addFields(
                            { name: 'Community', value: "`" + serverName + "`", inline: true },
                            { name: 'Access Tier', value: "`Free Tier`", inline: true },
                            { name: 'Access Date', value: "`None`", inline: true },
                            { name: 'Available Commands:', value: availableCommands, inline: true },
                        )
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                    await interaction.editReply({ embeds: [accessEmbed] });

                    console.log("// Step 3 : Answer - Executed ✅")

                }







            } catch (error) {


                console.log("// Error - sent in report ❌")
                console.log("//////////\n\nDetails de l'erreur :\n\n" + error.stack + "\n\n//////////")

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
                let reportCommand = "/access"

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

