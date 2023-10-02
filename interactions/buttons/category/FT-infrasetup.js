// On définit des constantes qui serviront dans l'ensemble de la commande
const { ButtonInteraction } = require('discord.js');
const { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { profileData, accessSql, apimonitorsql, wallets, reportsql, adminsql, usersql, interactionData, watchlistSql, exe_friendTech, infra_friendTech, sequelize } = require('../../../events/database');
const moment = require('moment');
const decrypt = require("../../../functions/decrypt")



module.exports = {
    id: 'friendtech_exec_setup-button',

    async execute(interaction) {
        if (!(interaction instanceof ButtonInteraction)) return;

        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id
        let botId = interaction.applicationId

        try {

            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")




            //Checkpoint
            console.log("// Step 2 : Authorization - Executed ✅")




            const buttonsRowNew = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('infra_friendtechnewwallet-button')
                        .setLabel('import wallet')
                        .setStyle(1),
                    new ButtonBuilder()
                        .setCustomId('infra_friendtechgeneratewallet-button')
                        .setLabel('generate wallet')
                        .setStyle(3),

                );


            const buttonsRowModify = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('infra_friendtechmodifywallet-button')
                        .setLabel('modify wallet')
                        .setStyle(1),
                    new ButtonBuilder()
                        .setCustomId('infra_friendtechexportwallet-button')
                        .setLabel('export')
                        .setStyle(1),
                    new ButtonBuilder()
                        .setCustomId('infra_friendtechdeletewallet-button')
                        .setLabel('delete wallet')
                        .setStyle(4)
                );



            const userSetup = await infra_friendTech.findOne({ where: { authorId: authorId } })

            if (userSetup != null) {


                const walletAddress = decrypt(userSetup.dataValues.walletAddress)

                const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Friend Tech Setup")
                    .setDescription(">>> Displaying your Friend.tech wallet setup")
                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .addFields(
                        { name: "Wallet:", value: "`" + walletAddress.toLowerCase() + "`", inline: true },

                    )
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                await interaction.reply({ embeds: [errorNotEthereum], components: [buttonsRowModify], ephemeral: true });


            } else if (userSetup == null) {




                const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Friend Tech Setup")
                    .setDescription(">>> Displaying your Friend.tech wallet setup")
                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .addFields(
                        { name: " ", value: "You don't have a wallet imported in your Friend.tech portfolio. To get started, use the button below.", inline: true },

                    )
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                await interaction.reply({ embeds: [errorNotEthereum], components: [buttonsRowNew], ephemeral: true });


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
            let reportCommand = "/FT-setup"

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


            await interaction.reply({ embeds: [errorAnswerUser], ephemeral: true });


        }
    },
};



