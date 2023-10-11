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
const { accessSql, profileData, adminsql, reportsql, sniper_friendTech, infra_friendTech, sequelize } = require('../../../events/database');
const moment = require('moment');


const addTimeount = require("../../../functions/addtimeout")





const buttonsRowCancel = new ActionRowBuilder()
    .addComponents(

        new ButtonBuilder()
            .setCustomId('friendtechtasksinfra-snipermenu-button')
            .setLabel('↩️')
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId('friendtechtasksinfra-mainmenu-button')
            .setLabel('🏠')
            .setStyle(1),


    );

const buttonRowNoWallet = new ActionRowBuilder()
    .addComponents(

        new ButtonBuilder()
            .setCustomId('friendtech_exec_setup-button')
            .setLabel('💻 Setup')
            .setStyle(1),

    )


module.exports = {
    id: 'button-friendtechtasksinfra-sniper-param-',

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

                const parts = customId.split("@");
                const action = parts[0].split("-").pop() || null;
                const uniqueId = parts[1] || null;





                if (action == "delete") {






                    const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Deleting Task")
                        .setDescription(">>> Sniper settings")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "Deleting Task <a:AuraLoading:1134068847616458792>", value: " ", inline: false },

                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })



                    await interaction.update({ embeds: [gasTrackerEmbed], components: [], ephemeral: true });



                    await sniper_friendTech.destroy({ where: { authorId: authorId, randomId: uniqueId } });

                    await addTimeount(0.5)


                    const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Task Cancelled")
                        .setDescription(">>> Displaying the simulated transaction data")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "Task Cancelled ✅", value: "Your task has been successfully cancelled , you can recreate a new one from the Friend.Tech task panel", inline: false },

                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })



                    await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [buttonsRowCancel], ephemeral: true });





                } else if (action == "status") {


                    let taskEmbed = interaction.message.embeds[0].data

                    const component1 = interaction.message.components[0]
                    const component2 = interaction.message.components[1]
                    let component3 = interaction.message.components[interaction.message.components.length - 1]
                    let componentBonus = ""
                    if (interaction.message.components.length == 4) {

                        componentBonus = interaction.message.components[2]


                    }

                    if (taskEmbed.fields.find(obj => obj.name === "Status").value == "`🟢 Active`") {

                        taskEmbed.fields.find(obj => obj.name === "Status").value = "`🔴 Not active`";
                        component3.components.find(obj => obj.data.label === "🔴 Disable").data.label = "🟢 Activate"




                        await sniper_friendTech.update({ active: "false", }, { where: { authorId: authorId, randomId: uniqueId } });

                        if (componentBonus == "") {
                            await interaction.update({ embeds: [taskEmbed], components: [component1, component2, component3], ephemeral: true });
                        } else {

                            await interaction.update({ embeds: [taskEmbed], components: [component1, component2, componentBonus, component3], ephemeral: true });

                        }


                    } else {

                        const userSetup = await infra_friendTech.findOne({ where: { authorId: authorId } })

                        if (userSetup != null) {




                            taskEmbed.fields.find(obj => obj.name === "Status").value = "`🟢 Active`";
                            component3.components.find(obj => obj.data.label === "🟢 Activate").data.label = "🔴 Disable"



                            await sniper_friendTech.update({ active: "true", }, { where: { authorId: authorId, randomId: uniqueId } });

                            if (componentBonus == "") {
                                await interaction.update({ embeds: [taskEmbed], components: [component1, component2, component3], ephemeral: true });
                            } else {

                                await interaction.update({ embeds: [taskEmbed], components: [component1, component2, componentBonus, component3], ephemeral: true });

                            }

                        } else {

                            const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Sniper Setup")
                                .setDescription("You can't activate your task unless your set a wallet to your profile using `/friendtech wallet` or using the button below. Please try again after doing so.")
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                            await interaction.reply({ embeds: [gasTrackerEmbed], components: [buttonRowNoWallet], ephemeral: true });



                        }
                    }



                } else if (action == "amount") {




                    const passwordAdminDashboard = new ModalBuilder()
                        .setCustomId('modal-friendtechtasksinfra-sniper-param-amount@' + uniqueId)
                        .setTitle('Set Amount');

                    // Add components to modal

                    // Create the text input components
                    const channel = new TextInputBuilder()
                        .setCustomId('modal-friendtechtasksinfra-sniper-param-amount@' + uniqueId + 'R1')
                        .setLabel("Amount")
                        .setPlaceholder("The amount of token to snipe per user")
                        .setStyle(TextInputStyle.Short)
                        .setMinLength(1)
                        .setMaxLength(2)



                    // An action row only holds one text input,
                    // so you need one action row per text input.
                    const firstActionRowSetProfile = new ActionRowBuilder().addComponents(channel);


                    // Add inputs to the modal
                    passwordAdminDashboard.addComponents(firstActionRowSetProfile)

                    // Show the modal to the user
                    await interaction.showModal(passwordAdminDashboard);



                } else if (action == "target") {


                    const passwordAdminDashboard = new ModalBuilder()
                        .setCustomId('modal-friendtechtasksinfra-sniper-param-target@' + uniqueId)
                        .setTitle('Set Target');

                    // Add components to modal

                    // Create the text input components
                    const channel = new TextInputBuilder()
                        .setCustomId('modal-friendtechtasksinfra-sniper-param-target@' + uniqueId + 'R1')
                        .setLabel("Target Username")
                        .setPlaceholder("The Twitter username of the new user to snipe")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)



                    // An action row only holds one text input,
                    // so you need one action row per text input.
                    const firstActionRowSetProfile = new ActionRowBuilder().addComponents(channel);


                    // Add inputs to the modal
                    passwordAdminDashboard.addComponents(firstActionRowSetProfile)

                    // Show the modal to the user
                    await interaction.showModal(passwordAdminDashboard);







                } else if (action == "totaltask") {


                    const passwordAdminDashboard = new ModalBuilder()
                        .setCustomId('modal-friendtechtasksinfra-sniper-param-totaltask@' + uniqueId)
                        .setTitle('Set Total Task');

                    // Add components to modal

                    // Create the text input components
                    const channel = new TextInputBuilder()
                        .setCustomId('modal-friendtechtasksinfra-sniper-param-totaltask@' + uniqueId + 'R1')
                        .setLabel("Amount")
                        .setPlaceholder("The amount of snipe the bot execute before stopping")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)



                    // An action row only holds one text input,
                    // so you need one action row per text input.
                    const firstActionRowSetProfile = new ActionRowBuilder().addComponents(channel);


                    // Add inputs to the modal
                    passwordAdminDashboard.addComponents(firstActionRowSetProfile)

                    // Show the modal to the user
                    await interaction.showModal(passwordAdminDashboard);




                } else if (action == "price") {




                    const passwordAdminDashboard = new ModalBuilder()
                        .setCustomId('modal-friendtechtasksinfra-sniper-param-price@' + uniqueId)
                        .setTitle('Set Price');

                    // Add components to modal

                    // Create the text input components
                    const channel = new TextInputBuilder()
                        .setCustomId('modal-friendtechtasksinfra-sniper-param-price@' + uniqueId + 'R1')
                        .setLabel("Minimum Price")
                        .setPlaceholder("The minimum key price")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)

                    const channel2 = new TextInputBuilder()
                        .setCustomId('modal-friendtechtasksinfra-sniper-param-price@' + uniqueId + 'R2')
                        .setLabel("Maximum Price")
                        .setPlaceholder("The maximum key price")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)



                    // An action row only holds one text input,
                    // so you need one action row per text input.
                    const firstActionRowSetProfile = new ActionRowBuilder().addComponents(channel);
                    const firstActionRowSetProfile2 = new ActionRowBuilder().addComponents(channel2);


                    // Add inputs to the modal
                    passwordAdminDashboard.addComponents(firstActionRowSetProfile, firstActionRowSetProfile2)

                    // Show the modal to the user
                    await interaction.showModal(passwordAdminDashboard);



                } else if (action == "supply") {





                    const passwordAdminDashboard = new ModalBuilder()
                        .setCustomId('modal-friendtechtasksinfra-sniper-param-supply@' + uniqueId)
                        .setTitle('Set Supply');

                    // Add components to modal

                    // Create the text input components
                    const channel = new TextInputBuilder()
                        .setCustomId('modal-friendtechtasksinfra-sniper-param-supply@' + uniqueId + 'R1')
                        .setLabel("Minimum Supply")
                        .setPlaceholder("The minimum supply of the key")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)

                    const channel2 = new TextInputBuilder()
                        .setCustomId('modal-friendtechtasksinfra-sniper-param-supply@' + uniqueId + 'R2')
                        .setLabel("Maximum Supply")
                        .setPlaceholder("The maximum supply of the key")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)



                    // An action row only holds one text input,
                    // so you need one action row per text input.
                    const firstActionRowSetProfile = new ActionRowBuilder().addComponents(channel);
                    const firstActionRowSetProfile2 = new ActionRowBuilder().addComponents(channel2);


                    // Add inputs to the modal
                    passwordAdminDashboard.addComponents(firstActionRowSetProfile, firstActionRowSetProfile2)

                    // Show the modal to the user
                    await interaction.showModal(passwordAdminDashboard);




                } else if (action == "followers") {


                    const passwordAdminDashboard = new ModalBuilder()
                        .setCustomId('modal-friendtechtasksinfra-sniper-param-followers@' + uniqueId)
                        .setTitle('Set Followers');

                    // Add components to modal

                    // Create the text input components
                    const channel = new TextInputBuilder()
                        .setCustomId('modal-friendtechtasksinfra-sniper-param-followers@' + uniqueId + 'R1')
                        .setLabel("Minimum Followers")
                        .setPlaceholder("The minimum number of Twitter followers")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)


                    const channel2 = new TextInputBuilder()
                        .setCustomId('modal-friendtechtasksinfra-sniper-param-followers@' + uniqueId + 'R2')
                        .setLabel("Maximum Followers")
                        .setPlaceholder("The maximum number of Twitter followers")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)




                    // An action row only holds one text input,
                    // so you need one action row per text input.
                    const firstActionRowSetProfile = new ActionRowBuilder().addComponents(channel);
                    const firstActionRowSetProfile2 = new ActionRowBuilder().addComponents(channel2);


                    // Add inputs to the modal
                    passwordAdminDashboard.addComponents(firstActionRowSetProfile, firstActionRowSetProfile2)

                    // Show the modal to the user
                    await interaction.showModal(passwordAdminDashboard);







                } else if (action == "twitterscore") {


                    const passwordAdminDashboard = new ModalBuilder()
                        .setCustomId('modal-friendtechtasksinfra-sniper-param-twitterscore@' + uniqueId)
                        .setTitle('Set Twitter Score');

                    // Add components to modal

                    // Create the text input components
                    const channel = new TextInputBuilder()
                        .setCustomId('modal-friendtechtasksinfra-sniper-param-twitterscore@' + uniqueId + 'R1')
                        .setLabel("Minimum Twitter Score")
                        .setPlaceholder("The minimum Twitter score (1 to 100)")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)

                    const channel2 = new TextInputBuilder()
                        .setCustomId('modal-friendtechtasksinfra-sniper-param-twitterscore@' + uniqueId + 'R2')
                        .setLabel("Maximum Twitter Score")
                        .setPlaceholder("The maximum Twitter score (1 to 100)")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)



                    // An action row only holds one text input,
                    // so you need one action row per text input.
                    const firstActionRowSetProfile = new ActionRowBuilder().addComponents(channel);
                    const firstActionRowSetProfile2 = new ActionRowBuilder().addComponents(channel2);


                    // Add inputs to the modal
                    passwordAdminDashboard.addComponents(firstActionRowSetProfile, firstActionRowSetProfile2)

                    // Show the modal to the user
                    await interaction.showModal(passwordAdminDashboard);



                } else if (action == "uniqueholders") {


                    const passwordAdminDashboard = new ModalBuilder()
                        .setCustomId('modal-friendtechtasksinfra-sniper-param-uniqueholders@' + uniqueId)
                        .setTitle('Set Unique Holders');

                    // Add components to modal

                    // Create the text input components
                    const channel = new TextInputBuilder()
                        .setCustomId('modal-friendtechtasksinfra-sniper-param-uniqueholders@' + uniqueId + 'R1')
                        .setLabel("Minimum Unique Holders")
                        .setPlaceholder("The minimum ratio of unique holders (1 to 100)")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)

                    const channel2 = new TextInputBuilder()
                        .setCustomId('modal-friendtechtasksinfra-sniper-param-uniqueholders@' + uniqueId + 'R2')
                        .setLabel("Maximum Unique Holders")
                        .setPlaceholder("The maximum ratio of unique holders (1 to 100)")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)



                    // An action row only holds one text input,
                    // so you need one action row per text input.
                    const firstActionRowSetProfile = new ActionRowBuilder().addComponents(channel);
                    const firstActionRowSetProfile2 = new ActionRowBuilder().addComponents(channel2);


                    // Add inputs to the modal
                    passwordAdminDashboard.addComponents(firstActionRowSetProfile, firstActionRowSetProfile2)

                    // Show the modal to the user
                    await interaction.showModal(passwordAdminDashboard);



                } else if (action == "gaspreset") {



                    const passwordAdminDashboard = new ModalBuilder()
                        .setCustomId('modal-friendtechtasksinfra-sniper-param-gaspreset@' + uniqueId)
                        .setTitle('Set Gas Preset');

                    // Add components to modal

                    // Create the text input components
                    const channel = new TextInputBuilder()
                        .setCustomId('modal-friendtechtasksinfra-sniper-param-gaspreset@' + uniqueId + 'R1')
                        .setLabel("Gas Ratio")
                        .setPlaceholder("The percentage of gas used in addition to the base (in %)")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)




                    // An action row only holds one text input,
                    // so you need one action row per text input.
                    const firstActionRowSetProfile = new ActionRowBuilder().addComponents(channel);


                    // Add inputs to the modal
                    passwordAdminDashboard.addComponents(firstActionRowSetProfile)

                    // Show the modal to the user
                    await interaction.showModal(passwordAdminDashboard);



                } else if (action == "simulation") {



                    let taskEmbed = interaction.message.embeds[0].data


                    if (taskEmbed.fields.find(obj => obj.name === "Simulation").value == "`✅`") {

                        taskEmbed.fields.find(obj => obj.name === "Simulation").value = "`❌`";

                        await sniper_friendTech.update({ simulation: "false", }, { where: { authorId: authorId, randomId: uniqueId } });
                        await interaction.update({ embeds: [taskEmbed], ephemeral: true });

                    } else {

                        taskEmbed.fields.find(obj => obj.name === "Simulation").value = "`✅`";

                        await sniper_friendTech.update({ simulation: "true", }, { where: { authorId: authorId, randomId: uniqueId } });
                        await interaction.update({ embeds: [taskEmbed], ephemeral: true });

                    }


                } else if (action == "depositamount") {



                    const passwordAdminDashboard = new ModalBuilder()
                        .setCustomId('modal-friendtechtasksinfra-sniper-param-depositamount@' + uniqueId)
                        .setTitle('Set Deposit Value');

                    // Add components to modal

                    // Create the text input components
                    const channel = new TextInputBuilder()
                        .setCustomId('modal-friendtechtasksinfra-sniper-param-depositamount@' + uniqueId + 'R1')
                        .setLabel("Minimum Deposit Value")
                        .setPlaceholder("The minimum value of the user's deposit")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)

                    const channel2 = new TextInputBuilder()
                        .setCustomId('modal-friendtechtasksinfra-sniper-param-depositamount@' + uniqueId + 'R2')
                        .setLabel("Maximum Deposit Value")
                        .setPlaceholder("The maximum value of the user's deposit")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)



                    // An action row only holds one text input,
                    // so you need one action row per text input.
                    const firstActionRowSetProfile = new ActionRowBuilder().addComponents(channel);
                    const firstActionRowSetProfile2 = new ActionRowBuilder().addComponents(channel2);


                    // Add inputs to the modal
                    passwordAdminDashboard.addComponents(firstActionRowSetProfile, firstActionRowSetProfile2)

                    // Show the modal to the user
                    await interaction.showModal(passwordAdminDashboard);


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
            let reportCommand = "/snipe-menu"

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



