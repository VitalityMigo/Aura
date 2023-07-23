
/**
 * @file Sample button interaction
 * @author JAYZHVJ
 * @since 3.0.0
 * @version 3.2.2
 */

/**
 * @type {import('../../../typings').ButtonInteractionCommand}
 */


const { ButtonInteraction } = require('discord.js');
const { ActionRowBuilder, EmbedBuilder, ButtonBuilder } = require("discord.js");
const { accessSql, profileData, reportsql, adminsql, sequelize } = require('../../../events/database');
const moment = require('moment');



const buttonRowAdminDashboard = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('teamSubCancelSub-button')
            .setLabel('cancel sub.')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('teamSubModifyWallet-button')
            .setLabel('modify wallet')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('adminDashboardMenu-button')
            .setLabel('menu')
            .setStyle(2),
    )

const buttonRowAdminDashboard2 = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('teamSubModifyWallet-button')
            .setLabel('modify wallet')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('adminDashboardMenu-button')
            .setLabel('menu')
            .setStyle(2),
    )



module.exports = {
    id: 'adminDashboardSubscribtion-button',

    async execute(interaction) {
        if (!(interaction instanceof ButtonInteraction)) return;

        //Récupérer informations de l'utilisateur de la commande
        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id


        try {

        //Checkpoint
        console.log("// Step 1 : Initialization - Executed ✅")


        if ( interaction.user.id === authorId) {

            //Checkpoint
            console.log("// Step 2 : Authorization - Executed ✅")

            const communityAccess = await accessSql.findOne({ where: { serverId: serverId } })

            let adminWalletAddress = communityAccess.dataValues.adminWalletAddress
            let subscribtionPrice = communityAccess.dataValues.subscribtionPrice
            let communityStatut = communityAccess.dataValues.statut
            let subscribtionStatut = communityAccess.dataValues.subscribtionStatut
            let subscribtionStatutFormatted = "Lifetime"
            let actualPowerFormatted = 'Active'

            if (communityStatut.toLowerCase() !== "active") { actualPowerFormatted = "Unactive" }


            if (subscribtionStatut.toLowerCase() !== "lifetime") {

                if (parseInt(subscribtionStatut) <= 0) {

                    subscribtionStatutFormatted = subscribtionStatut + " days late"

                } else if (parseInt(subscribtionStatut) > 0) {

                    subscribtionStatutFormatted = subscribtionStatut + " days left"

                }

            }

            if (communityStatut.toLowerCase() === "active") {


                const passwordManagement = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Team Dashboard")
                    .setDescription(">>> Manage the community's susbscribtion to the bot")
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .setTimestamp()
                    .addFields(
                        { name: " ", value: " ", inline: false },
                        { name: "Susbscribtion Mecanism", value: "The subscribtion page is what allows the community team's member to consult and manage the community's subscribtion to the bot. The subscribtion can be paid directly from this page using one of the methods below.", inline: true },
                        { name: " ", value: " ", inline: false },
                        { name: "Payment Methods", value: "`Private Key` - Use this button to enter the community's wallet private key and perform the month payement.\n`Submit proof` - Use this button to enter the hash of the txn with the month's payment, using the wallet attached to the community, in a delay of 3 days maximum.", inline: false },
                        { name: " ", value: " ", inline: false },
                        { name: "Sub. State", value: "`" + actualPowerFormatted + "`", inline: true },
                        { name: "Sub. Statut", value: "`" + subscribtionStatutFormatted + "`", inline: true },
                        { name: " ", value: " ", inline: false },
                        { name: "Team's Wallet", value: "`" + adminWalletAddress + "`", inline: false },
                        { name: "Pricing", value: "`" + parseFloat(subscribtionPrice).toFixed(3) + "Ξ/month`", inline: false },
                        { name: " ", value: " ", inline: false },
                        { name: " ", value: "The payment can be done at this address : `0x862284B87b774bbEC86c4f13bA6c283C4552AfAB (rollschasers.eth)`.", inline: false },

                    )
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                await interaction.update({ embeds: [passwordManagement], components: [buttonRowAdminDashboard2] });







            } else if (communityStatut.toLowerCase() !== "active") {


                const passwordManagement = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Team Dashboard")
                    .setDescription(">>> Manage the community's susbscribtion to the bot")
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .setTimestamp()
                    .addFields(
                        { name: " ", value: " ", inline: false },
                        { name: "Susbscribtion Mecanism", value: "The subscribtion page is what allows the community team's member to consult and manage the community's subscribtion to the bot. The subscribtion can be paid directly from this page using one of the methods below.", inline: true },
                        { name: " ", value: " ", inline: false },
                        { name: "Payment Methods", value: "`Private Key` - Use this button to enter the community's wallet private key and perform the month payement.\n`Submit proof` - Use this button to enter the hash of the month's payment, using the wallet attached to the community.", inline: false },
                        { name: " ", value: " ", inline: false },
                        { name: "Sub. State", value: "`" + actualPowerFormatted + "`", inline: true },
                        { name: "Sub. Statut", value: "`" + subscribtionStatutFormatted + "`", inline: true },
                        { name: " ", value: " ", inline: false },
                        { name: "Team's Wallet", value: "`" + adminWalletAddress + "`", inline: true },
                        { name: "Pricing", value: "`" + parseFloat(subscribtionPrice).toFixed(3) + "Ξ/month`", inline: true },
                        { name: " ", value: " ", inline: false },
                        { name: " ", value: "The payment can be done at this address : `0x862284B87b774bbEC86c4f13bA6c283C4552AfAB (rollschasers.eth)`.", inline: false },
                        { name: " ", value: " ", inline: false },
                        { name: " ", value: "*Your community's access to the bot will been suspended soon because your monthly payment havn't been made. Please contact our team.⚠️*", inline: false },

                    )
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                await interaction.update({ embeds: [passwordManagement], components: [buttonRowAdminDashboard] });

            }

        } else {

            const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                .setTitle("Bot Access")
                .setAuthor({ name: authorName, iconURL: userAvatar })
                .setDescription("This button is not for you. You can only click on buttons generated by your commands. Please try again with your personal data.")
                .setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
                .setTimestamp()
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

            await interaction.reply({ embeds: [setfpEmbedNotForYou], ephemeral: true });



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
        let reportCommand = "/admin-subscribtionPage"

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


        await interaction.reply({ embeds: [errorAnswerUser], ephemeral: true });


    }

    },
};




