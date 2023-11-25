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
const { accessSql, profileData, adminsql, reportsql, sequelize } = require('../../../events/database');
const moment = require('moment');




module.exports = {
    id: 'button_coin_manager_exec_',

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


                const customId = interaction.customId

                const match = customId.match(/button_coin_manager_exec_(.+)/);


                if (match && match[1]) {

                    const action = match[1]


                    if (action == "transferETH") {



                        const passwordAdminDashboard = new ModalBuilder()
                            .setCustomId('modal_coin_manager_exec_' + action)
                            .setTitle('Transfer ETH');

                        // Add components to modal

                        // Create the text input components
                        const channel = new TextInputBuilder()
                            .setCustomId('modal_coin_manager_exec_' + action + 'R1')
                            .setLabel("ETH Amount (i.e 0.8 for 0.8 ETH)")
                            .setPlaceholder("The amount of ETH to transfer")
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(100)

                        // Create the text input components
                        const channel2 = new TextInputBuilder()
                            .setCustomId('modal_coin_manager_exec_' + action + 'R2')
                            .setLabel("Receivers (one or few ethereum addresses)")
                            .setPlaceholder("0x..., 0x..., 0x...")
                            .setStyle(TextInputStyle.Paragraph)





                        // An action row only holds one text input,
                        // so you need one action row per text input.
                        const firstActionRowSetProfile = new ActionRowBuilder().addComponents(channel);
                        const secondActionRowSetProfile = new ActionRowBuilder().addComponents(channel2);


                        // Add inputs to the modal
                        passwordAdminDashboard.addComponents(firstActionRowSetProfile, secondActionRowSetProfile)

                        // Show the modal to the user
                        await interaction.showModal(passwordAdminDashboard);




                    } else if (action == "transferERC20") {

                        const passwordAdminDashboard = new ModalBuilder()
                            .setCustomId('modal_coin_manager_exec_' + action)
                            .setTitle('Transfer ERC20');

                        // Add components to modal

                        // Create the text input components
                        const channel0 = new TextInputBuilder()
                            .setCustomId('modal_coin_manager_exec_' + action + 'R1')
                            .setLabel("ERC20 Contract")
                            .setPlaceholder("The token's contract address")
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(100)


                        // Create the text input components
                        const channel = new TextInputBuilder()
                            .setCustomId('modal_coin_manager_exec_' + action + 'R2')
                            .setLabel("Token Ratio (i.e 50 for 50%)")
                            .setPlaceholder("The ratio of token held to transfer")
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(100)

                        // Create the text input components
                        const channel2 = new TextInputBuilder()
                            .setCustomId('modal_coin_manager_exec_' + action + 'R3')
                            .setLabel("Receivers (one or few ethereum addresses)")
                            .setPlaceholder("0x..., 0x..., 0x...")
                            .setStyle(TextInputStyle.Paragraph)





                        // An action row only holds one text input,
                        // so you need one action row per text input.
                        const heyActionRowSetProfile = new ActionRowBuilder().addComponents(channel0);
                        const firstActionRowSetProfile = new ActionRowBuilder().addComponents(channel);
                        const secondActionRowSetProfile = new ActionRowBuilder().addComponents(channel2);


                        // Add inputs to the modal
                        passwordAdminDashboard.addComponents(heyActionRowSetProfile, firstActionRowSetProfile, secondActionRowSetProfile)

                        // Show the modal to the user
                        await interaction.showModal(passwordAdminDashboard);



                    } else if (action == "approveToken") {



                        const passwordAdminDashboard = new ModalBuilder()
                            .setCustomId('modal_coin_manager_exec_' + action)
                            .setTitle('Approve Token');

                        // Add components to modal

                        // Create the text input components
                        const channel = new TextInputBuilder()
                            .setCustomId('modal_coin_manager_exec_' + action + 'R1')
                            .setLabel("ERC20 Contract")
                            .setPlaceholder("The token's contract address")
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(42)

                        // Create the text input components
                        const channel2 = new TextInputBuilder()
                            .setCustomId('modal_coin_manager_exec_' + action + 'R2')
                            .setLabel("Spender")
                            .setPlaceholder("The address to approve")
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(42)




                        // An action row only holds one text input,
                        // so you need one action row per text input.
                        const firstActionRowSetProfile = new ActionRowBuilder().addComponents(channel);
                        const secondActionRowSetProfile = new ActionRowBuilder().addComponents(channel2);


                        // Add inputs to the modal
                        passwordAdminDashboard.addComponents(firstActionRowSetProfile, secondActionRowSetProfile)

                        // Show the modal to the user
                        await interaction.showModal(passwordAdminDashboard);





                    } else if (action == "revokeToken") {




                        const passwordAdminDashboard = new ModalBuilder()
                            .setCustomId('modal_coin_manager_exec_' + action)
                            .setTitle('Revoke Token');

                        // Add components to modal

                        // Create the text input components
                        const channel = new TextInputBuilder()
                            .setCustomId('modal_coin_manager_exec_' + action + 'R1')
                            .setLabel("ERC20 Contract")
                            .setPlaceholder("The token's contract address")
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(100)

                        // Create the text input components
                        const channel2 = new TextInputBuilder()
                            .setCustomId('modal_coin_manager_exec_' + action + 'R2')
                            .setLabel("Spender")
                            .setPlaceholder("The address(es) or contract(s) to revoke")
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(100)





                        // An action row only holds one text input,
                        // so you need one action row per text input.
                        const firstActionRowSetProfile = new ActionRowBuilder().addComponents(channel);
                        const secondActionRowSetProfile = new ActionRowBuilder().addComponents(channel2);


                        // Add inputs to the modal
                        passwordAdminDashboard.addComponents(firstActionRowSetProfile, secondActionRowSetProfile)

                        // Show the modal to the user
                        await interaction.showModal(passwordAdminDashboard);





                    }

                } else {

                    const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Coin Manager")
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
            let reportCommand = "/admin-botOff"

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



