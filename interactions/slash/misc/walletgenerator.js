/**
 * @file Sample getdata command with slash command.
 * @author Vitality Migø
 */


const fs = require('fs');


const { ActionRowBuilder, ButtonBuilder, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { profileData, accessSql, adminsql, walletsgenerated, wallets, apimonitorsql, reportsql, usersql, sequelize } = require('../../../events/database');
const moment = require('moment');
const decrypt = require('../../../functions/decrypt');
const encrypt = require('../../../functions/encrypt');


//Web3 API + Cloudfare Provider
var Web3 = require("web3")
const web3 = new Web3("https://cloudflare-eth.com")



module.exports = {
    data: new SlashCommandBuilder()
        .setName("walletgenerator")
        .setDescription("Create hundreeds of wallet in few seconds")
        .addStringOption(option =>
            option
                .setName("count")
                .setDescription("The number of wallets you want to create.")
                .setRequired(true)
        ),


    async execute(interaction) {


        if (interaction.guildId != null) {


            await interaction.deferReply({ ephemeral: true });



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





                //Checkpoint
                console.log("// Step 1 : Initialization - Executed ✅")

                if (botGlobalState.toLowerCase() === "on") {


                    if (communityStatut.toLowerCase() === "active" || communityStatut == "") {

                        if (accessTier.toLowerCase() == "s-tier") {

                            if (member.roles.cache.has(communityMemberRoleId)) {


                                //Checkpoint
                                console.log("// Step 2 : Authorization - Executed ✅")




                                //On enregistre le user si il est pas encore dans la database
                                const timeStamp1 = Date.now();
                                const actualTimestamp1 = parseFloat(timeStamp1 / 1000).toFixed(0)
                                const isUser = await usersql.findOne({ where: { userId: authorId, serverId: serverId } })
                                if (isUser == null) { await usersql.create({ userId: authorId, userName: authorName, userAvatar: userAvatar, serverId: serverId, timestamp: actualTimestamp1 }) }



                                let walletNumber = interaction.options.getString("count");

                                let walletTable = []
                                let walletCreatedList = ""
                                let generationStatut = "`Failed`"





                                for (let i = 0; i < walletNumber; i++) {

                                    const wallet = web3.eth.accounts.create();

                                    walletTable.push(wallet);


                                }

                                const filteredWalletTable = walletTable.map(obj => ({ address: obj.address, privateKey: obj.privateKey, authorId: authorId }));
                                const filteredWalletAddresses = walletTable.map(obj => obj.address);

                                await walletsgenerated.destroy({ where: { authorId: authorId } })

                                for (let i = 0; i < filteredWalletTable.length; i++) {

                                    await walletsgenerated.create({

                                        authorId: filteredWalletTable[i].authorId,
                                        walletAddress: encrypt(filteredWalletTable[i].address),
                                        privateKey: encrypt(filteredWalletTable[i].privateKey),

                                    })

                                }

                                let walletDisplayLimit = 0

                                for (const address of filteredWalletAddresses) {


                                    if (walletDisplayLimit < 19) {

                                        walletCreatedList += address + ",        \n"

                                    } else if (walletDisplayLimit === 19) {

                                        walletCreatedList += "and " + (walletNumber - 19) + " more..."

                                    } else if (walletDisplayLimit > 19) {



                                    }
                                    walletDisplayLimit += 1


                                }


                                generationStatut = "`Succeed`"







                                const walletUserAll = await wallets.findAll({ where: { authorId: authorId } })

                                const registeredWalletLength = walletUserAll.length
                                // const walletTableLength = walletsTable.length
                                // const walletLength = uniqueWalletAddresses.length
                                const walletAvailable = 24 - registeredWalletLength





                                let buttonsRow = ''
                                let walletAvailableButton = 24 - registeredWalletLength
                                if (walletNumber < walletAvailableButton) { walletAvailableButton = walletNumber }

                                if (walletAvailable > 0) {

                                    buttonsRow = new ActionRowBuilder()
                                        .addComponents(
                                            new ButtonBuilder()
                                                .setCustomId('download-button')
                                                .setLabel('Download CSV')
                                                .setStyle(2),
                                            new ButtonBuilder()
                                                .setCustomId('walletgeneratoraddwallets-button')
                                                .setLabel('Add ' + walletAvailableButton + " wallets")
                                                .setStyle(2),
                                            // new ButtonBuilder()
                                            //   .setCustomId('walletmanagermenu-button')
                                            //   .setLabel('menu')
                                            //   .setStyle(2), 

                                        );

                                } else {


                                    buttonsRow = new ActionRowBuilder()
                                        .addComponents(
                                            new ButtonBuilder()
                                                .setCustomId('download-button')
                                                .setLabel('Download CSV')
                                                .setStyle(2),
                                            // new ButtonBuilder()
                                            //   .setCustomId('walletmanagermenu-button')
                                            //   .setLabel('menu')
                                            //   .setStyle(2), 

                                        );

                                }



                                const walletGenerator = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Wallet Generator")
                                    .setDescription(">>> `" + walletNumber + "` wallets have been successfully generated")
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setTimestamp()
                                    .addFields(
                                        { name: "Wallet Count", value: "`" + walletNumber + "`", inline: true },
                                        { name: "Network", value: "`Ethereum (ETH)`", inline: true },
                                        { name: "Generation Status", value: generationStatut, inline: true },
                                        { name: "Wallets Created:", value: "```" + walletCreatedList + "```", inline: false },
                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [walletGenerator], components: [buttonsRow] });




                                //On enregistre le call API dans la database
                                const timeStamp = Date.now();
                                await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/walletgenerator", apiCallName: "walletCreate", apiProvider: "web3.eth", timestamp: timeStamp.toString() })




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


                            if (accessTier == "") {
								accessTier = "Free Tier"
							}


                            const botOff = new EmbedBuilder().setColor("#060A8F")
                                .setTitle(`Bot Access`)
                                .setDescription(">>> Showing the community's bot access")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .addFields(
                                    { name: 'Access Status', value: "`Denied 🔴`", inline: false },
                                    { name: 'Access Tier', value: "`" + accessTier.toUpperCase() + "`", inline: true },
                                    { name: 'Required Tier', value: "`S-TIER`", inline: true },
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
                let reportCommand = "/walletgenerator"

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



