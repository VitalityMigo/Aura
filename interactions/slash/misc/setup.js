/**
 * @file Sample getdata command with slash command.
 * @author Vitality Migø
 */



const { ActionRowBuilder, EmbedBuilder, SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder } = require("discord.js");
const { accessSql, profileData, adminsql, reportsql, usersql, sequelize } = require('../../../events/database');
const moment = require('moment');




/// DASHBOARD QUI PERMET DE MODIFIER LE PASSWORD, LES ROLE ADMIN/MEMBRE ETC, LE NOM DU SERVEUR, LE BOT EN ON/OFF ETC ETC. SYSTEME DE BOUTON POUR NAVIGUER AVEC PASSWORD MODAL POUR LE PREMIER LANCEMENT

module.exports = {
    data: new SlashCommandBuilder()
        .setName("setup")
        .setDescription("Manage the bot in your community")
        .addStringOption((option) =>
            option
                .setName("module")
                .setDescription("The module you want to set up or unset up")
                .setRequired(true)
                .setChoices(
                    {
                        name: 'Bot Access',
                        value: 'Bot Access',
                    },
                    {
                        name: 'Setup',
                        value: 'Setup',
                    },
                    {
                        name: 'Wallet Manager',
                        value: 'Wallet Manager',
                    },
                    {
                        name: 'ERC721 Sniper',
                        value: 'ERC721 Sniper',
                    },
                    {
                        name: 'ERC20 Minter',
                        value: 'ERC20 Minter',
                    },


                )),

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



        if (member.roles.cache.has(communityMemberRoleId)) {


            if (member.roles.cache.has(communityAdminRoleId) && authorId == "941039180262297701") {

                //Checkpoint
                console.log("// Step 2 : Authorization - Executed ✅")



                //On enregistre le user si il est pas encore dans la database
                const timeStamp1 = Date.now();
                const actualTimestamp1 = parseFloat(timeStamp1 / 1000).toFixed(0)
                const isUser = await usersql.findOne({ where: { userId: authorId, serverId: serverId } })
                if (isUser == null) { await usersql.create({ userId: authorId, userName: authorName, userAvatar: userAvatar, serverId: serverId, timestamp: actualTimestamp1 }) }

                const guildId = interaction.guildId
                const channelId = interaction.channelId
                const guildFetch = interaction.client.guilds.cache.get(guildId);
                const channelFetch = guildFetch.channels.cache.get(channelId);

                const authorProfile = await profileData.findOne({ where: { authorId: authorId } })





                const moduleChoice = interaction.options.getString("module");






                if (moduleChoice == "Bot Access") {





                    const buttons1Row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('getaccess1monthsubpage-button')
                                .setLabel('1 month (0.02Ξ)')
                                .setStyle(3),
                            new ButtonBuilder()
                                .setCustomId('getaccessRCpage-button')
                                .setLabel('RC Member')
                                .setStyle(3),
                            new ButtonBuilder()
                                .setCustomId('getaccessFFpage-button')
                                .setLabel('F&F')
                                .setStyle(3),
                            new ButtonBuilder()
                                .setCustomId('getaccess1monthsubconfirm-button')
                                .setLabel('Verify')
                                .setStyle(1),
                            new ButtonBuilder()
                                .setCustomId('getaccesssubstatut-button')
                                .setLabel('Sub. Statut')
                                .setStyle(1),
                            //     new ButtonBuilder()
                            //     .setCustomId('getaccess1monthsubverify-button')
                            //     .setLabel('verify wallet')
                            //     .setStyle(2),

                        );


                    const walletManager = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Get Access")
                        .setDescription(">>> Getting access to Aura is easy and takes a super low amount of time. If you want to do so, follow the steps below.")
                        // .setImage("https://media.discordapp.net/attachments/972981318134661130/1118294913449214094/Group_5.png?width=2206&height=736")
                        .addFields(
                            { name: ' ', value: " ", inline: false },
                            { name: 'Steps:', value: "• Choose your subscription plan below\n• Send the amount precised by the bot\n• Click on the button and paste the validated transaction's hash\n• Verify the wallet ownership and gain access to the bot.", inline: true },
                            { name: ' ', value: " ", inline: false },
                            { name: ' ', value: "If you encounter any issue, please open a ticket : <#1121110417368956958>", inline: false },
                            { name: ' ', value: " ", inline: false },
                            { name: ' ', value: "⚠️ *Please note that for the moment, we're only accepting ETH. Stay tuned for new payement options soon.*", inline: false },

                        )
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await channelFetch.send({ embeds: [walletManager], components: [buttons1Row] });





                } if (moduleChoice == "Setup") {




                    // //Official Links
                    // const walletManager = new EmbedBuilder().setColor("#060A8F")
                    //     .setTitle("Links")
                    //     .setDescription(">>> Below are all our official links. Please be aware that any other link is a potential scam.\n\n<:RCtwitter:1096014822837080174> [Twitter](https://twitter.com/AuraAnalytics)\n<:RCdiscord:1096014711407001651> [Discord](https://discord.gg/nMKzzfR6gx)\n:earth_africa: [Website](https://cdn.discordapp.com/attachments/1108757872315219968/1122318373078958130/image.png)\n<:RCGitbook:1122490833611014264> [Gitbook](https://rolls-chasers.gitbook.io/aura)")
                    //     .setImage("https://cdn.discordapp.com/attachments/949291624389816334/1122703923950665848/Pallette_8.png")
                    //     .setTimestamp()
                    //     .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    // await channelFetch.send({ embeds: [walletManager]});



                    // // Setup parcours
                    // const buttons1Row = new ActionRowBuilder()
                    //     .addComponents(
                    //         new ButtonBuilder()
                    //             .setCustomId('setupGuideStep1-button')
                    //             .setLabel('Start')
                    //             .setStyle(3),

                    //     );


                    // const walletManager = new EmbedBuilder().setColor("#060A8F")
                    //     .setTitle("Welcome to Aura !")
                    //     .setDescription("Here's the place that will show you how to get started using the bot.\n\nOf course, you don't have to go through this short guide, but we advise you to follow the 4 steps to get off to a good start.\n\nTo get started, click on **start** below")
                    //     .setImage("https://cdn.discordapp.com/attachments/949291624389816334/1122703923950665848/Pallette_8.png")
                    //     .setTimestamp()
                    //     .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    // await channelFetch.send({ embeds: [walletManager], components: [buttons1Row] });


                    // //Guide 
                    // const guideAllEmbed = new EmbedBuilder().setColor("#060A8F")
                    //     .setTitle("Guide")
                    //     .setDescription(">>> All the commands of Aura")
                    //     .setTimestamp()
                    //     .addFields(
                    //         { name: ' ', value: " ", inline: false },
                    //         { name: 'Global Commands', value: "** `/guide`** - display all the commands.\n** `/statut`** - display the bot's current statut\n** `/privacy`** - consult and modify your privacy settings\n** `/report`** - report an idea or a bug to our team\n** `/access`** - check your level of access to the bot", inline: false },
                    //         { name: 'Analytics Commands', value: "** `/blur`** - display blur metrics for your wallets.\n** `/cryptoprofit`** - display the profit/loss infos on a ERC20 coin accross your wallets.\n** `/coin`** - display key infos on a coin (ETH or BTC)\n** `/ens`** - display key infos about an ens name\n** `/gascalculator`** - display the gas infos for a mint\n** `/gastracker`** - display the gas metrics\n** `/data`** - display major metrics of a given collection (ETH or BTC)\n** `/derisk`** - display the derisk metrics on a given collection and wallet(s)\n** `/portfolio`** - display the key portfolio metrics across your wallets\n** `/profit`** - display the profit/loss infos across all your wallets (ETH or BTC)\n** `/rcprofit`** - display the profit/loss infos across all the community wallets\n** `/twitter`** - display the key metrics of a twitter profile\n** `/walletgenerator`** - generate an unlimited number of wallets and private key", inline: false },
                    //         { name: 'Community Commands', value: "** `/vouch`** - vouch for a community member.\n** `/vouchleaderboard`** - consult the vouch leaderboard\n** `/getprofile`** - consult the public profile of a community member\n** `/profile`** - access your personal dashboard", inline: false },
                    //         { name: 'Database Commands', value: "** `/setwallet`** - set a wallet to your portfolio.\n** `/getwallets`** - display the wallets registered in your portfolio\n** `/removewallet`** - remove a wallet from your portfolio\n** `/setalert`** - set a floor price alert\n** `/getalert`** - display the floor price alerts registered in your database\n** `/removealert`** - remove a floor price alert from your database\n** `/setwatchlist`** - set a project in your watchlist (ETH or BTC)\n** `/getwatchlist`** - display the projects currently in your watchlist\n** `/removewatchlist`** - remove a project from your watchlist", inline: false },
                    //         { name: 'Admin Only Commands', value: "** `/team`** - manage the bot settings for your community\n** `/vouchleaderboard (clear)`** - consult the vouch leaderboard and reset it.", inline: false },
                    //         { name: 'Links', value: "[gitbook](https://rolls-chasers.gitbook.io/aura) ∙ [twitter](https://twitter.com/AuraAnalytics) ∙ [discord](https://discord.gg/nMKzzfR6gx) ∙ [website](https://cdn.discordapp.com/attachments/1108757872315219968/1122318373078958130/image.png)", inline: false },

                    //     )
                    //     .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    // await channelFetch.send({ embeds: [guideAllEmbed] });



                    // const guideAllEmbed = new EmbedBuilder().setColor("#060A8F")
                    //     .setTitle("Frequently Asked Questions")
                    //     .setDescription(">>> A look at some frequently asked questions.")
                    //     .setTimestamp()
                    //     .addFields(
                    //         { name: ' ', value: " ", inline: false },
                    //         { name: 'What is Aura ?', value: "Aura is a tool designed to improve and facilitate the work of web3 traders and investors.", inline: false },
                    //         { name: ' ', value: " ", inline: false },
                    //         { name: 'How can I get access to Aura ?', value: "There are several ways to use Aura, both for communities and individual users. For individual users, go here : <#1108757700885622784>. For communities, you can send a message directly to our team or open a ticket. For more information, go [here](https://rolls-chasers.gitbook.io/aura).", inline: false },
                    //         { name: ' ', value: " ", inline: false },
                    //         { name: 'What do I get by taking the monthly subscription ?', value: "Aura monthly subscription gives you access to the tool on the Aura server. In addition, you gain access to a community of active web3 traders and investors. We'll be adding more benefits as we go along. You can go here <#1108757530076774512> to get a quick overview of Aura or [here](https://rolls-chasers.gitbook.io/aura/commands/commands/) for the full presentation.", inline: false },
                    //         { name: ' ', value: " ", inline: false },
                    //         { name: "What is the future of Aura ?", value: "Our team is constantly working to improve Aura's functionality and operation. Our aim is to be highly responsive so that we can always adapt to market conditions. You can find the theoretical roadmap [here](https://rolls-chasers.gitbook.io/aura/the-tool/roadmap).", inline: false },
                    //         { name: ' ', value: " ", inline: false },
                    //         { name: "I'd like some help to use the bot, where can I ask ?", value: "If you need any help, you can ask to our team in the chat or by opening a ticket.", inline: false },

                    //     )
                    //     .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    // await channelFetch.send({ embeds: [guideAllEmbed] });




                } else {


                    if (authorProfile === null) { await interaction.deferReply(); } else {
                        const authorPrivacyMode = authorProfile.dataValues.privacyMode

                        if (authorPrivacyMode.toLowerCase() === "private") { await interaction.deferReply({ ephemeral: true }); }
                        if (authorPrivacyMode.toLowerCase() === "public") { await interaction.deferReply(); }
                    }


                    const availableInTheNearFuture = new EmbedBuilder().setColor("#060A8F")
                        .setTitle(`Not Available`)
                        .setDescription("The command you try to use is currently being built and will be available in the near future. You can still use all the other commands in the meantime.")
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .setTimestamp()
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                    await interaction.editReply({ embeds: [availableInTheNearFuture] });



                    // const buttons1Row = new ActionRowBuilder()
                    //     .addComponents(
                    //         new ButtonBuilder()
                    //             .setCustomId('walletmanagerlaunch-button')
                    //             .setLabel('Launch')
                    //             .setStyle(2),

                    //     );


                    // const walletManager = new EmbedBuilder().setColor("#060A8F")
                    //     .setTitle("Wallet Manager")
                    //     .setDescription("The wallet manager lets you manage your wallets, funds and assets quickly and efficiently, saving you time and money.\n\nIf you haven't already done so, use main wallet to check the information in your main wallet.\n\nTo start using the module, press one of the button below.")
                    //     .setImage("https://cdn.discordapp.com/attachments/949291624389816334/1122703923950665848/Pallette_8.png")
                    //     .setTimestamp()
                    //                         .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                    // await channelFetch.send({ embeds: [walletManager], components: [buttons1Row] });

                }

            } else if (!member.roles.cache.has(communityAdminRoleId)) {






                const notMember = new EmbedBuilder().setColor("#060A8F")
                    .setTitle(`Bot Access`)
                    .setDescription(">>> Showing access data")
                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .addFields(
                        { name: " ", value: " ", inline: false },
                        { name: "Statut", value: "`Access Denied ❌`", inline: true },
                        { name: "Required Role", value: "<@&" + communityAdminRoleId + ">", inline: true },
                        { name: "Problem Detected", value: "Your access to the `/admin` command has been denied. You can only use this if you have the required admin role in this community. If you usually have access to this command, make sure you're in the right community or contact an admin of the bot.", inline: false },
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });






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
            let reportCommand = "/setup"

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


            await interaction.reply({ embeds: [errorAnswerUser], ephemeral: true });


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

