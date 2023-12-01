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
const { ActionRowBuilder, EmbedBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const { accessSql, profileData, adminsql, reportsql, tracker_coin, sequelize } = require('../../../events/database');
const moment = require('moment');

const fs = require('fs')
const targetsJSON = 'contracts/uniswap/tracker.json';


module.exports = {
    id: 'button_coin_infra_tracker_',

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



            if (interaction.message.interaction.user.id === authorId) {

                //Checkpoint
                console.log("// Step 2 : Authorization - Executed ✅")


                const customId = interaction.customId

                const match = customId.match(/button_coin_infra_tracker_(.+)/);


                if (match && match[1]) {

                    const action = match[1];


                    if (action === "add") {


                        const passwordAdminDashboard = new ModalBuilder()
                            .setCustomId('modal_coin_infra_tracker_add')
                            .setTitle('Add Addresses');

                        // Add components to modal

                        // Create the text input components
                        const channel = new TextInputBuilder()
                            .setCustomId('modal_coin_infra_tracker_addR1')
                            .setLabel("Address(es)")
                            .setPlaceholder("0x..., 0x..., 0x...")
                            .setStyle(TextInputStyle.Paragraph)


                        // An action row only holds one text input,
                        // so you need one action row per text input.
                        const firstActionRowSetProfile = new ActionRowBuilder().addComponents(channel);


                        // Add inputs to the modal
                        passwordAdminDashboard.addComponents(firstActionRowSetProfile)

                        // Show the modal to the user
                        await interaction.showModal(passwordAdminDashboard);





                    } else if (action === "remove") {


                        const passwordAdminDashboard = new ModalBuilder()
                            .setCustomId('modal_coin_infra_tracker_remove')
                            .setTitle('Remove Address');

                        // Add components to modal

                        // Create the text input components
                        const channel = new TextInputBuilder()
                            .setCustomId('modal_coin_infra_tracker_removeR1')
                            .setLabel("Address")
                            .setPlaceholder("0x...")
                            .setStyle(TextInputStyle.Short)


                        // An action row only holds one text input,
                        // so you need one action row per text input.
                        const firstActionRowSetProfile = new ActionRowBuilder().addComponents(channel);


                        // Add inputs to the modal
                        passwordAdminDashboard.addComponents(firstActionRowSetProfile)

                        // Show the modal to the user
                        await interaction.showModal(passwordAdminDashboard);





                    } else if (action === "refresh") {




                        const buttonsRow = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('button_coin_infra_tracker_add')
                                    .setLabel('Add Addresses')
                                    .setStyle(3),
                                new ButtonBuilder()
                                    .setCustomId('button_coin_infra_tracker_remove')
                                    .setLabel('Remove Address')
                                    .setStyle(1),
                                new ButtonBuilder()
                                    .setCustomId('button_coin_infra_tracker_reset')
                                    .setLabel('Reset')
                                    .setStyle(1),
                                new ButtonBuilder()
                                    .setCustomId('button_coin_infra_tracker_refresh')
                                    .setLabel('🔁')
                                    .setStyle(1),
                            );






                        const userList = await tracker_coin.findAll({ where: { authorId: authorId } })

                        let addressFormatted = "Address\n\n"
                        const maxAddress = 15
                        const spotLeft = maxAddress - userList.length

                        let buys = "❌"
                        let sells = "❌"
                        let approvals = "❌"

                        if (userList.length > 0) {

                            if (userList[0].dataValues.buy == "true") { buys = "✅" }
                            if (userList[0].dataValues.sell == "true") { sells = "✅" }
                            if (userList[0].dataValues.mint == "true") { approvals = "✅" }


                            const userListSliced = userList.slice(0, 16)
                            for (const object of userListSliced) {


                                addressFormatted += object.dataValues.address.toLowerCase() + "              \n"

                            }



                        } else {

                            addressFormatted = "No tracked address found in your profile             "

                        }

                        const buttonsRow2 = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('button_coin_infra_tracker_buys')
                                    .setLabel('Toggle Buys')
                                    .setStyle(2)
                                    .setDisabled(userList.length == 0),
                                new ButtonBuilder()
                                    .setCustomId('button_coin_infra_tracker_sells')
                                    .setLabel('Toggle Sells')
                                    .setStyle(2)
                                    .setDisabled(userList.length == 0),
                                new ButtonBuilder()
                                    .setCustomId('button_coin_infra_tracker_approvals')
                                    .setLabel('Toggle Approvals')
                                    .setStyle(2)
                                    .setDisabled(userList.length == 0),
                            );


                        const botOff = new EmbedBuilder().setColor("#060A8F")
                            .setTitle(`Coin Tracker`)
                            .setDescription(">>> Displaying your coin wallet tracker")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .addFields(
                                { name: " ", value: " ", inline: false },
                                { name: "Address Count", value: "`" + userList.length + "`", inline: true },
                                { name: "Spots Left", value: "`" + spotLeft + "`", inline: true },
                                { name: " ", value: " ", inline: false },
                                { name: "Address Tracked:", value: "```" + addressFormatted + "```", inline: false },
                                { name: " ", value: " ", inline: false },
                                { name: "Buys", value: "`" + buys + "`", inline: true },
                                { name: "Sells", value: "`" + sells + "`", inline: true },
                                { name: "Approvals", value: "`" + approvals + "`", inline: true },
                            )
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });


                        await interaction.update({ embeds: [botOff], components: [buttonsRow, buttonsRow2] });




                    } else if (action === "reset") {




                        const buttonsRow = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('button_coin_infra_tracker_add')
                                    .setLabel('Add Addresses')
                                    .setStyle(3),
                                new ButtonBuilder()
                                    .setCustomId('button_coin_infra_tracker_remove')
                                    .setLabel('Remove Address')
                                    .setStyle(1),
                                new ButtonBuilder()
                                    .setCustomId('button_coin_infra_tracker_reset')
                                    .setLabel('Reset')
                                    .setStyle(1),
                                new ButtonBuilder()
                                    .setCustomId('button_coin_infra_tracker_refresh')
                                    .setLabel('🔁')
                                    .setStyle(1),
                            );


                        const buttonsRow2 = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('button_coin_infra_tracker_buys')
                                    .setLabel('Toggle Buys')
                                    .setStyle(2),
                                new ButtonBuilder()
                                    .setCustomId('button_coin_infra_tracker_sells')
                                    .setLabel('Toggle Sells')
                                    .setStyle(2),
                                new ButtonBuilder()
                                    .setCustomId('button_coin_infra_tracker_approvals')
                                    .setLabel('Toggle Approvals')
                                    .setStyle(2)
                            );




                        await tracker_coin.destroy({ where: { authorId: authorId } })

                        deleteAllAddress(authorId)

                        let buys = "❌"
                        let sells = "❌"
                        let approvals = "❌"


                        const addressFormatted = "No tracked address found in your profile             "


                        const botOff = new EmbedBuilder().setColor("#060A8F")
                            .setTitle(`Coin Tracker`)
                            .setDescription(">>> Displaying your coin wallet tracker")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .addFields(
                                { name: " ", value: " ", inline: false },
                                { name: "Address Count", value: "`0`", inline: true },
                                { name: "Spots Left", value: "`15`", inline: true },
                                { name: " ", value: " ", inline: false },
                                { name: "Address Tracked:", value: "```" + addressFormatted + "```", inline: false },
                                { name: " ", value: " ", inline: false },
                                { name: "Buys", value: "`" + buys + "`", inline: true },
                                { name: "Sells", value: "`" + sells + "`", inline: true },
                                { name: "Approvals", value: "`" + approvals + "`", inline: true },


                            )
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });


                        await interaction.update({ embeds: [botOff], components: [buttonsRow, buttonsRow2] });




                    } else if (action === "buys") {


                        let taskEmbed = interaction.message.embeds[0].data

                        if (taskEmbed.fields.find(obj => obj.name === "Buys").value == "`✅`") {

                            taskEmbed.fields.find(obj => obj.name === "Buys").value = "`❌`";

                            await tracker_coin.update({ buy: "false", }, { where: { authorId: authorId } });
                            await interaction.update({ embeds: [taskEmbed], ephemeral: true });

                        } else {

                            taskEmbed.fields.find(obj => obj.name === "Buys").value = "`✅`";

                            await tracker_coin.update({ buy: "true", }, { where: { authorId: authorId } });
                            await interaction.update({ embeds: [taskEmbed], ephemeral: true });

                        }


                    } else if (action === "sells") {


                        let taskEmbed = interaction.message.embeds[0].data

                        if (taskEmbed.fields.find(obj => obj.name === "Sells").value == "`✅`") {

                            taskEmbed.fields.find(obj => obj.name === "Sells").value = "`❌`";

                            await tracker_coin.update({ sell: "false", }, { where: { authorId: authorId } });
                            await interaction.update({ embeds: [taskEmbed], ephemeral: true });

                        } else {

                            taskEmbed.fields.find(obj => obj.name === "Sells").value = "`✅`";

                            await tracker_coin.update({ sell: "true", }, { where: { authorId: authorId } });
                            await interaction.update({ embeds: [taskEmbed], ephemeral: true });

                        }


                    } else if (action === "approvals") {


                        let taskEmbed = interaction.message.embeds[0].data

                        if (taskEmbed.fields.find(obj => obj.name === "Approvals").value == "`✅`") {

                            taskEmbed.fields.find(obj => obj.name === "Approvals").value = "`❌`";

                            await tracker_coin.update({ approval: "false", }, { where: { authorId: authorId } });
                            await interaction.update({ embeds: [taskEmbed], ephemeral: true });

                        } else {

                            taskEmbed.fields.find(obj => obj.name === "Approvals").value = "`✅`";

                            await tracker_coin.update({ approval: "true", }, { where: { authorId: authorId } });
                            await interaction.update({ embeds: [taskEmbed], ephemeral: true });

                        }


                    }


                } else {

                    const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Coin Tracker")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setDescription("An error occured while retrieving your data. Please try again or contact a team member if the issue persists.")
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.reply({ embeds: [setfpEmbedNotForYou], ephemeral: true });

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
            let reportCommand = "/coin-tracker-param"

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



function deleteAllAddress(authorId) {
    let existingData = []
    if (fs.existsSync(targetsJSON)) {
        const fileContent = fs.readFileSync(targetsJSON, 'utf8');
        existingData = JSON.parse(fileContent);
    }

    const filterData = existingData.filter(item => item.authorId != authorId)

    // Écrivez le fichier JSON avec la nouvelle liste
    fs.writeFileSync(targetsJSON, JSON.stringify(filterData, null, 2));
}
