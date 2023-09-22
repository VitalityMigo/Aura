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
const { ActionRowBuilder, ButtonBuilder, EmbedBuilder } = require('discord.js');
const { accessSql, profileData, adminsql, reportsql, sequelize } = require('../../../events/database');
const moment = require('moment');


const buttonsRowNoProfile = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('userSetProfile-button')
            .setLabel('create profile')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('userMenu-button')
            .setLabel('menu')
            .setStyle(2),


    );

const buttonsRowYesProfile = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('userModifyProfile-button')
            .setLabel('modify profile')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('userResetProfile-button')
            .setLabel('reset profile')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('userMenu-button')
            .setLabel('menu')
            .setStyle(2),

    );


module.exports = {
    id: 'userProfile-button',

    async execute(interaction) {
        if (!(interaction instanceof ButtonInteraction)) return;

        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;


        try {

        //Checkpoint
        console.log("// Step 1 : Initialization - Executed ✅")



        if (interaction.message.interaction.user.id === authorId) {

            //Checkpoint
            console.log("// Step 2 : Authorization - Executed ✅")

            const userProfile = await profileData.findAll({ where: { authorId: authorId } })


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
                    console.log(cleanTwitterHandle);


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
                    console.log(date2)

                    const getProfileRenderOther = new EmbedBuilder().setColor("#060A8F")
                        .setTitle(authorName + "'s Dashboard")
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
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    // Send the embed as a response to the interaction
                    await interaction.update({ embeds: [getProfileRenderOther], components: [buttonsRowYesProfile] });


                } else if (userProfile[0].dataValues.authorNature === "N/A" && userProfile[0].dataValues.authorJobs === "N/A" && userProfile[0].dataValues.authorWeb2 === "N/A" && userProfile[0].dataValues.authorWeb3 === "N/A" && userProfile[0].dataValues.authorDiscord === "N/A" && userProfile[0].dataValues.authorTwitter === "N/A") {



                    const getProfileRenderOther = new EmbedBuilder().setColor("#060A8F")
                        .setTitle(authorName + "'s Dashboard")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setDescription(`>>> Showing all the infos about your public profile.`)
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "Public Profile Mecanism", value: "The Aura bot allows the user to set a public profile, which can be consult by any member of the communities he's part of. You can use the button below to set it.", inline: true },
                            { name: " ", value: " ", inline: false },
                            { name: "Status", value: "Your profile is currently `not registered`.", inline: false },

                        )
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    // Send the embed as a response to the interaction
                    await interaction.update({ embeds: [getProfileRenderOther], components: [buttonsRowNoProfile] });



                }
            } else if (userProfile.length <= 0) {

                const getProfileRenderOther = new EmbedBuilder().setColor("#060A8F")
                    .setTitle(authorName + "'s Dashboard")
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .setDescription(`>>> Showing all the infos about your public profile.`)
                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                    .addFields(
                        { name: " ", value: " ", inline: false },
                        { name: "Public Profile Mecanism", value: "The Aura bot allows the user to set a public profile, which can be consult by any member of the communities he's part of. You can use the button below to set it.", inline: true },
                        { name: " ", value: " ", inline: false },
                        { name: "Status", value: "Your profile is currently `not registered`.", inline: false },

                    )
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                // Send the embed as a response to the interaction
                await interaction.update({ embeds: [getProfileRenderOther], components: [buttonsRowNoProfile] });



            }







        } else {

            const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                .setTitle("Bot Access")
                .setAuthor({ name: authorName, iconURL: userAvatar })
                .setDescription("This button is not for you. You can only click on buttons generated by your commands. Please try again with your personal data.")
                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
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
        let reportCommand = "/user-profilePage"

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



