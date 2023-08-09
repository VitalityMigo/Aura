
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



const buttonsUserVisual1Disable = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('userFirstVisual-button')
            .setLabel('1')
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId('userSecondVisual-button')
            .setLabel('2')
            .setStyle(2)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId('userThirdVisual-button')
            .setLabel('3')
            .setStyle(2)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId('userMenu-button')
            .setLabel('menu')
            .setStyle(2),
    );

const buttonsUserVisual2Disable = new ActionRowBuilder()
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
            .setStyle(2)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId('userMenu-button')
            .setLabel('menu')
            .setStyle(2),
    );


const buttonsUserVisual3Disable = new ActionRowBuilder()
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
            .setStyle(2)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId('userMenu-button')
            .setLabel('menu')
            .setStyle(2),
    );






module.exports = {
    id: 'userFirstVisual-button',

    async execute(interaction) {
        if (!(interaction instanceof ButtonInteraction)) return;


        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id


        try {

            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")



            if (interaction.message.interaction.user.id === authorId) {

                //Checkpoint
                console.log("// Step 2 : Authorization - Executed ✅")

                let visualSelect = ""
                let image = ""
                let buttonSelected = ""






                const privacyBigDataAuthor = await profileData.findOne({ where: { authorId: authorId } })


                if (privacyBigDataAuthor !== null) {

                    if (privacyBigDataAuthor.dataValues.visualSelect !== "1" && privacyBigDataAuthor.dataValues.visualSelect !== "2" && privacyBigDataAuthor.dataValues.visualSelect !== "3") {

                        await profileData.update({ visualSelect: "1", }, { where: { authorId: authorId } })
                        visualSelect = "1"

                        if (serverId === "949291624389816331") {

                            //  || "1071576735298113667"

                            image = "https://media.discordapp.net/attachments/941040609970491523/1101624764507881554/rcprofittemplate1.png?width=1108&height=1108"

                            buttonSelected = ""
                            buttonSelected = buttonsUserVisual1

                        } else if (serverId == "944918328135286804") {


                            image = "https://cdn.discordapp.com/attachments/1117449908803338280/1128017207675342978/embassy_template.png"

                            buttonSelected = ""
                            buttonSelected = buttonsUserVisual1Disable

                        } else {


                            image = "https://media.discordapp.net/attachments/941040609970491523/1101624764507881554/rcprofittemplate1.png?width=1108&height=1108"

                            buttonSelected = ""
                            buttonSelected = buttonsUserVisual1Disable

                        }

                    } else if (privacyBigDataAuthor.dataValues.visualSelect === "1" || privacyBigDataAuthor.dataValues.visualSelect === "2" || privacyBigDataAuthor.dataValues.visualSelect === "3") {


                        visualSelect = "1"
                        await profileData.update({ visualSelect: "1", }, { where: { authorId: authorId } })

                        if (serverId === "949291624389816331") {

                            //|| "1071576735298113667"

                            image = "https://media.discordapp.net/attachments/941040609970491523/1101624764507881554/rcprofittemplate1.png?width=1108&height=1108"

                            buttonSelected = ""
                            buttonSelected = buttonsUserVisual1


                        } else if (serverId == "944918328135286804") {


                            image = "https://cdn.discordapp.com/attachments/1117449908803338280/1128017207675342978/embassy_template.png"

                            buttonSelected = ""
                            buttonSelected = buttonsUserVisual1Disable

                        } else {


                            image = "https://media.discordapp.net/attachments/941040609970491523/1101624764507881554/rcprofittemplate1.png?width=1108&height=1108"

                            buttonSelected = ""
                            buttonSelected = buttonsUserVisual1Disable

                        }

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
                    .setTitle("User Dashboard")
                    .setDescription(">>> Display the current privacy settings of " + authorName)
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .setTimestamp()
                    .setImage(image)
                    .addFields(
                        { name: " ", value: " ", inline: false },
                        { name: "Visual Mecanism", value: "The Rolls Chasers Analytics bot allows the user to choose between few profit visual. Use the button below to choose the visual you'd like to use.", inline: true },
                        { name: " ", value: " ", inline: false },
                        { name: "Status", value: "Your are currently using the `visual 1`.", inline: false },
                        { name: " ", value: " ", inline: false },
                        { name: " ", value: "*✅ The profit visual selection has been successfully updated.*", inline: false },

                    )
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                await interaction.update({ embeds: [privateMode], components: [buttonSelected] });



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
            let reportCommand = "/user-visual1"

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




