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



            //Lancement du try

            try {

                //Récupère info varibale sur le bot et le serveur
                const communityRolePerms = await accessSql.findOne({ where: { serverId: serverId } })
                let communityMemberRoleId = communityRolePerms.dataValues.memberRoleId
                let communityAdminRoleId = communityRolePerms.dataValues.adminRoleId
                let botPowerStatut = communityRolePerms.dataValues.actualPower
                let communityStatut = communityRolePerms.dataValues.statut

                //Récupère régagle de privé/ou pas de l'utilisateur
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




                            // On enregistre le user si il est pas encore dans la database
                            const timeStamp = Date.now();
                            const actualTimestamp = parseFloat(timeStamp / 1000).toFixed(0)
                            const isUser = await usersql.findOne({ where: { userId: authorId, serverId: serverId } })
                            if (isUser == null) { await usersql.create({ userId: authorId, userName: authorName, userAvatar: userAvatar, serverId: serverId, timestamp: actualTimestamp }) }



                            let serverName = interaction.member.guild.name
                            let serverLogo = interaction.member.guild.icon


                            //On récupère les infos sur l'accès de la commu au bot
                            const communityInfos = await accessSql.findOne({ where: { serverId: serverId } })

                            if (communityInfos !== null) {

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
                                    availableCommands = "`/access` ∙ `/blur` ∙ `/data` ∙ `/derisk` ∙ `/ens` ∙ `/gascalculator` ∙ `/gastracker` ∙ `/getalerts` ∙ `/getprofile` ∙ `/getwallets` ∙ `/getwatchlist` ∙ `/guide` ∙ `/market` ∙ `/portfolio` ∙ `/privacy` ∙ `/profile` ∙ `/profit` ∙ `/rcprofit` ∙ `/removealert` ∙ `/removewallet` ∙ `/removewatchlist` ∙ `/report` ∙ `/setalert` ∙ `/setwallet` ∙ `/setwatchlist` ∙ `/statut` ∙ `/twitter` ∙ `/vouch` ∙ `/vouchleaderboard` ∙ `/walletgenerator`"
                                }

                                if (serverTier.toLowerCase() === "a-tier") {
                                    availableCommands = "`/access` ∙ `/data` ∙ `/derisk` ∙ `/ens` ∙ `/gastracker` ∙ `/gascalculator` ∙ `/getprofile` ∙ `/getwallets` ∙ `/getwatchlist` ∙ `/guide` ∙ `/privacy` ∙ `/profit` ∙ `/removewallet` ∙ `/removewatchlist` ∙ `/report` ∙ `/setwallet` ∙ `/setwatchlist` ∙ `/statut ∙ `/walletgenerator` ∙ `/vouch` ∙ `/vouchleaderboard`"
                                }

                                if (serverTier.toLowerCase() === "b-tier") {
                                    availableCommands = "`/access` ∙ `/getwallets` ∙ `/getprofile` ∙ `/guide` ∙ `/privacy` ∙ `/profit` ∙ `/report` ∙ `/removewallet` ∙ `/setwallet` ∙ `/statut ∙ `/vouch` ∙ `/vouchleaderboard`"
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


                            } else if (communityInfos === null) {

                                //Dans le cas où la communauté n'a pas accès
                                let availableCommands = ""

                                availableCommands = "```No access for " + serverName + " to Rolls Chasers Analytics. Please use the bot in a community that has access or contact an administrator to get help.```"


                                const accessEmbed = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle(serverName + "'s access")
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setDescription(`>>> Display the level of access of ` + serverName + " to the bot ")
                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .addFields(
                                        { name: 'Community', value: "`" + serverName + "`", inline: true },
                                        { name: 'Access Tier', value: "`No access`", inline: true },
                                        { name: 'Access Date', value: "`No access`", inline: true },
                                        { name: 'Available Commands:', value: availableCommands, inline: true },
                                    )
                                    .setTimestamp()
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                                await interaction.editReply({ embeds: [accessEmbed] });

                                console.log("// Step 3 : Answer - Executed ✅")

                            }


                            

                        } else if (!member.roles.cache.has(communityMemberRoleId)) {

                            console.log("// Step 2 : Unauthorized - Executed ✅")


                            const notMember = new EmbedBuilder().setColor("#060A8F")
                                .setTitle(`Bot Access`)
                                .setDescription("As a public user, you have access to few commands :\n\n• `access` - allows you to display your level of access to the bot\n• `data` - display the key metrics of a Bitcoin or Ethereum collection\n• `derisk txn` - dipslay the derisk (break even) metrics of a given ERC721 transaction\n• `guide` - display the bot's command list and infos.\n\nIf you'd like to gain full access to Aura, go here : <#1108757700885622784>.")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.editReply({ embeds: [notMember] });

                            console.log("// Step 3 : Answer - Executed ✅")


                        }



                    } else if (botPowerStatut.toLowerCase() === "off") {


                        console.log("// Step 2 : Unauthorized - Executed ✅")


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
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [botOff] });

                        console.log("// Step 3 : Answer - Executed ✅")


                    }

                } else {

                    console.log("// Step 2 : Unauthorized - Executed ✅")


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


                console.log(error)

                const reduceText = require("../../../functions/reducetext")

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
                        { name: "Error:", value: reduceText(error.stack, 1024), inline: false },

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

