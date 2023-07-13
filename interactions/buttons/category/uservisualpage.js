
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
const { accessSql, profileData, adminsql, reportsql, sequelize } = require('../../../events/database');
const moment = require('moment');



const buttonsUserVisual1 = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('userFirstVisual-button')
            .setLabel('1')
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId('userSecondVisual-button')
            .setLabel('2')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('userThirdVisual-button')
            .setLabel('3')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('userMenu-button')
            .setLabel('menu')
            .setStyle(2),
    );

const buttonsUserVisual2 = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('userFirstVisual-button')
            .setLabel('1')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('userSecondVisual-button')
            .setLabel('2')
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId('userThirdVisual-button')
            .setLabel('3')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('userMenu-button')
            .setLabel('menu')
            .setStyle(2),
    );

const buttonsUserVisual3 = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('userFirstVisual-button')
            .setLabel('1')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('userSecondVisual-button')
            .setLabel('2')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('userThirdVisual-button')
            .setLabel('3')
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId('userMenu-button')
            .setLabel('menu')
            .setStyle(2),
    );





module.exports = {
    id: 'userVisual-button',

    async execute(interaction) {
        if (!(interaction instanceof ButtonInteraction)) return;


        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png`;
        let serverId = interaction.member.guild.id


        try {

        //Checkpoint
        console.log("// Step 1 : Initialization - Executed ✅")



        if (interaction.message.interaction.user.id === authorId) {


            //Checkpoint
            console.log("// Step 2 : Authorization - Executed ✅")


            let visualSelect = ""

            const privacyBigDataAuthor = await profileData.findOne({ where: { authorId: authorId } })



            if (privacyBigDataAuthor !== null) {

                if (privacyBigDataAuthor.dataValues.visualSelect !== "1" && privacyBigDataAuthor.dataValues.visualSelect !== "2" && privacyBigDataAuthor.dataValues.visualSelect !== "3") {

                    await profileData.update({ visualSelect: "1", }, { where: { authorId: authorId } })
                    visualSelect = "1"


                } else if (privacyBigDataAuthor.dataValues.visualSelect === "1" || privacyBigDataAuthor.dataValues.visualSelect === "2" || privacyBigDataAuthor.dataValues.visualSelect === "3") {

                    visualSelect = privacyBigDataAuthor.dataValues.visualSelect
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


                visualSelect = "1"

            }





            const privateMode = new EmbedBuilder().setColor("#060A8F")
                .setTitle(authorName + "'s Dashboard")
                .setDescription(">>> Display the actual privacy settings of " + authorName)
                .setAuthor({ name: authorName, iconURL: userAvatar })
                .setTimestamp()
                .addFields(
                    { name: " ", value: " ", inline: false },
                    { name: "Visual Mecanism", value: "The Rolls Chasers Analytics bot allows the user to choose between few profit visual. Use the button below to choose the visual you'd like to use.", inline: true },
                    { name: " ", value: " ", inline: false },
                    { name: "Statut", value: "Your are currently using the `visual " + visualSelect + "`.", inline: false }
                )
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


            if (visualSelect === "1") { await interaction.update({ embeds: [privateMode], components: [buttonsUserVisual1] }); }
            if (visualSelect === "2") { await interaction.update({ embeds: [privateMode], components: [buttonsUserVisual2] }); }
            if (visualSelect.toLowerCase() === "3") { await interaction.update({ embeds: [privateMode], components: [buttonsUserVisual3] }); }




        } else {

            const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                .setTitle("Bot Access")
                .setAuthor({ name: authorName, iconURL: userAvatar })
                .setDescription("This button is not for you. You can only click on buttons generated by your commands. Please try again with your personal data.")
                .setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
                .setTimestamp()
                .setFooter({ text: 'Rolls Chasers Bot', iconURL: 'https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg' })

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
        let reportCommand = "/user-visualPage"

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




