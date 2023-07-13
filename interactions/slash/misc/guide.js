/**
 * @file Sample setwallet command with slash command.
 * @author VitalityMigo
 */



const { EmbedBuilder, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require("discord.js");
const { profileData, reportsql, usersql, adminsql } = require('../../../events/database');
const moment = require('moment');



const selectMenuCommand = new StringSelectMenuBuilder()
    .setCustomId('selectCommandGuide')
    .setPlaceholder('Display the guide of a specific command')
    .addOptions(
        new StringSelectMenuOptionBuilder()
            .setValue('selectMainpage')
            .setLabel('Main page'),
        new StringSelectMenuOptionBuilder()
            .setValue('selectAccess')
            .setLabel('access'),
        new StringSelectMenuOptionBuilder()
            .setValue('selectAlerts')
            .setLabel('alerts'),
        new StringSelectMenuOptionBuilder()
            .setValue('selectBlur')
            .setLabel('blur'),
        new StringSelectMenuOptionBuilder()
            .setValue('selectCoin')
            .setLabel('coin'),
        new StringSelectMenuOptionBuilder()
            .setValue('selectCryptoprofit')
            .setLabel('cryptoprofit'),
        new StringSelectMenuOptionBuilder()
            .setValue('selectGetData')
            .setLabel('data'),
        new StringSelectMenuOptionBuilder()
            .setValue('selectGetderisk')
            .setLabel('derisk'),
        new StringSelectMenuOptionBuilder()
            .setValue('selectEns')
            .setLabel('ens'),
        new StringSelectMenuOptionBuilder()
            .setValue('selectGascalculator')
            .setLabel('gascalculator'),
        new StringSelectMenuOptionBuilder()
            .setValue('selectGastracker')
            .setLabel('gastracker'),
        new StringSelectMenuOptionBuilder()
            .setValue('selectGetprofile')
            .setLabel('getprofile'),
        new StringSelectMenuOptionBuilder()
            .setValue('selectMarket')
            .setLabel('market'),
        new StringSelectMenuOptionBuilder()
            .setValue('selectPortfolio')
            .setLabel('portfolio'),
        new StringSelectMenuOptionBuilder()
            .setValue('selectPrivacy')
            .setLabel('privacy'),
        new StringSelectMenuOptionBuilder()
            .setValue('selectProfile')
            .setLabel('profile'),
        new StringSelectMenuOptionBuilder()
            .setValue('selectProfit')
            .setLabel('profit'),
        new StringSelectMenuOptionBuilder()
            .setValue('selectRcprofit')
            .setLabel('rcprofit'),
        new StringSelectMenuOptionBuilder()
            .setValue('selectReport')
            .setLabel('report'),
        new StringSelectMenuOptionBuilder()
            .setValue('selectTeam')
            .setLabel('team'),
        new StringSelectMenuOptionBuilder()
            .setValue('selectVouch')
            .setLabel('vouch'),
        new StringSelectMenuOptionBuilder()
            .setValue('selectVouchleaderboard')
            .setLabel('vouchleaderboard'),
        new StringSelectMenuOptionBuilder()
            .setValue('selectWallet')
            .setLabel('wallets'),
        new StringSelectMenuOptionBuilder()
            .setValue('selectWalletgenerator')
            .setLabel('walletgenerator'),
        new StringSelectMenuOptionBuilder()
            .setValue('selectWatchlist')
            .setLabel('watchlist'),
    );

const selectCommandGuide = new ActionRowBuilder()
    .addComponents(selectMenuCommand);




module.exports = {
    data: new SlashCommandBuilder()
        .setName("guide")
        .setDescription("Display the command guide of the bot"),

    // Début de l'éxecution de la commande
    async execute(interaction) {


        if (interaction.guildId != null) {


        // On déclare les variables présentes dans l'exécution (Embed, conditions etc)
        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png`;
        let serverId = interaction.member.guild.id
        let member = interaction.member;

        try {

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



            // Vérifie si le wallet est une addresse ETH valide

            const guideAllEmbed = new EmbedBuilder().setColor("#060A8F")
				.setTitle("Guide")
				.setDescription(">>> All the commands of Rolls Chasers Analytics. You can use `/access` to check which commands you have access too. Some commands are always in private mode, others are only in public mode.")
				.setTimestamp()
				.setAuthor({ name: authorName, iconURL: userAvatar })
				.addFields(
					{ name: ' ', value: " ", inline: false },
					{ name: 'Global Commands', value: "** `/access`** - check your level of access to the bot\n** `/guide`** - display all the commands.\n** `/statut`** - display the bot's actual statut\n** `/privacy`** - consult and modify your privacy settings\n** `/report`** - report an idea or a bug to our team", inline: false },
					{ name: 'Analytics Commands', value: "** `/blur`** - display blur metrics for your wallets.\n** `/cryptoprofit`** - display the profit/loss infos on a ERC20 coin accross your wallets.\n** `/coin`** - display key infos on a coin (ETH or BTC)\n** `/data`** - display major metrics of a given collection (ETH or BTC)\n**`/derisk collection`** - display the derisk metrics on a given collection\n** `/derisk txn`** - display the derisk metrics on a given transaction\n** `/ens`** - display key infos about an ens name\n** `/gas calculator`** - display the gas infos for a mint\n** `/gas tracker`** - display the gas metrics\n** `/incription`** - display major metrics for a given inscription\n ** `/market`** - get the Bitcoin or Ethereum main market metrics\n** `/portfolio`** - display the key portfolio metrics across your wallets\n** `/profit`** - display the profit/loss infos across all your wallets (ETH or BTC)\n** `/sats`** - display key infos of a SATS name\n** `/walletgenerator`** - generate an unlimited number of wallets and private key", inline: false },
					{ name: 'Community Commands', value: "** `/getprofile`** - consult the public profile of a community member\n** `/profile`** - access your personal dashboard\n** `/vouch`** - vouch for a community member.\n** `/vouchleaderboard`** - consult the vouch leaderboard", inline: false },
					{ name: 'Database Commands', value: "** `/alert set`** - set a floor price alert\n** `/alert get`** - display the floor price alerts registered in your database\n** `/alert remove`** - remove a floor price alert from your database\n** `/wallet set`** - set a wallet to your portfolio.\n** `/wallet get`** - display the wallets registered in your portfolio\n** `/wallet remove`** - remove a wallet from your portfolio\n** `/watchlist set`** - set a project in your watchlist (ETH or BTC)\n** `/watchlist get`** - display the projects currently in your watchlist\n** `/watchlist remove`** - remove a project from your watchlist", inline: false },
					{ name: 'Admin Only Commands', value: "** `/team`** - manage the bot settings for your community\n** `/vouchleaderboard (clear)`** - consult the vouch leaderboard and reset it.", inline: false },
					{ name: 'Links', value: "[gitbook](https://app.gitbook.com/o/j7C1DeeFIe87I5WriMNd/s/TXXkKns7Ok7jrCFftkKD/bots/rc-profit-bot) ∙ [twitter](https://twitter.com/AuraAnalytics) ∙ [discord](https://discord.gg/nMKzzfR6gx) ∙ [website](https://cdn.discordapp.com/attachments/1108757872315219968/1122318373078958130/image.png)", inline: false },

				)
				.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

            await interaction.editReply({ embeds: [guideAllEmbed], components: [selectCommandGuide] });



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
            let reportCommand = "/guide"

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


