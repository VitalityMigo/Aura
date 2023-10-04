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

const generateRandomString = require("../../../functions/randomkey")


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



module.exports = {
    id: 'friendtechtasksinfra-sniperlist-button-',

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

                const desiredTaskNb = customId.substring(customId.length - 1)

                // On trouve la task
                const userSnipeTasks = await sniper_friendTech.findAll({ where: { authorId: authorId } })
                const snipeTasksCount = userSnipeTasks.length
                const taskIndex = desiredTaskNb - 1



                // on vérifie l'existence de la task
                if (snipeTasksCount > 0) {

                    const desiredTask = userSnipeTasks[taskIndex].dataValues


                    // On récupère les valeurs de la task
                    const type = desiredTask.type
                    const status = desiredTask.active
                    const target = desiredTask.target
                    const amount = desiredTask.amount
                    const totalTask = desiredTask.repeat
                    const minPrice = desiredTask.min_total_price
                    const maxPrice = desiredTask.max_total_price
                    const minSupply = desiredTask.min_supply
                    const maxSupply = desiredTask.max_supply
                    const minFollowers = desiredTask.min_followers
                    const maxFollowers = desiredTask.max_followers
                    const minTwitterScore = desiredTask.min_twitter_score
                    const maxTwitterScore = desiredTask.max_twitter_score
                    const minUniqueHolders = desiredTask.min_unique_holders
                    const maxUniqueHolders = desiredTask.max_unique_holders
                    const minDepositValue = desiredTask.min_deposit_value
                    const maxDepositValue = desiredTask.max_deposit_value
                    const gasPreset = desiredTask.gas_preset
                    const simulation = desiredTask.simulation
                    const randomId = desiredTask.randomId


                    // On met en forme les valeurs
                    let statusFormatted = "🔴 Not active"
                    if (status == "true") { statusFormatted = "🟢 Active" }


                    let targetFormatted = "Any"
                    if (target != null) { targetFormatted = target }

                    let totalTaskFormatted = "No Limit"
                    if (totalTask != null) { totalTaskFormatted = totalTask }

                    let minPriceFormatted = "Any"
                    if (minPrice != null) { minPriceFormatted = minPrice + "Ξ" }

                    let maxPriceFormatted = "Any"
                    if (maxPrice != null) { maxPriceFormatted = maxPrice + "Ξ" }

                    let minSupplyFormatted = "Any"
                    if (minSupply != null) { minSupplyFormatted = minSupply }

                    let maxSupplyFormatted = "Any"
                    if (maxSupply != null) { maxSupplyFormatted = maxSupply }

                    let minFollowersFormatted = "Any"
                    if (minFollowers != null) { minFollowersFormatted = minFollowers }

                    let maxFollowersFormatted = "Any"
                    if (maxFollowers != null) { maxFollowersFormatted = maxFollowers }

                    let minDepositValueFormatted = "Any"
                    if (minDepositValue != null) { minDepositValueFormatted = minDepositValue + "Ξ" }

                    let maxDepositValueFormatted = "Any"
                    if (maxDepositValue != null) { maxDepositValueFormatted = maxDepositValue + "Ξ" }

                    let minTwitterScoreFormatted = "Any"
                    if (minTwitterScore != null) { minTwitterScoreFormatted = minTwitterScore + "%" }

                    let maxTwitterScoreFormatted = "Any"
                    if (maxTwitterScore != null) { maxTwitterScoreFormatted = maxTwitterScore + "%" }

                    let minUniqueHoldersFormatted = "Any"
                    if (minUniqueHolders != null) { minUniqueHoldersFormatted = minUniqueHolders + "%" }

                    let maxUniqueHoldersFormatted = "Any"
                    if (maxUniqueHolders != null) { maxUniqueHoldersFormatted = maxUniqueHolders + "%" }

                    let gasPresetFormatted = "Classic"
                    if (gasPreset != null) { gasPresetFormatted = gasPreset + "%" }

                    let simulationFormatted = "✅"
                    if (simulation == "false") { simulationFormatted = "❌" }


                    // Variable pour construire les bouttons
                    let tutorialType = "sniperdeposittutorial"
                    if (type == "new_user") { tutorialType = "sniperusertutorial" }

                    let statusLabel = "🟢 Activate"
                    if (status == true) { statusLabel = "🔴 Disable" }


                    // On construit les bouttons
                    const buttonsRow = new ActionRowBuilder()
                        .addComponents(

                            new ButtonBuilder()
                                .setCustomId('button-friendtechtasksinfra-sniper-param-target@' + randomId)
                                .setLabel('Set Target')
                                .setStyle(2),
                            new ButtonBuilder()
                                .setCustomId('button-friendtechtasksinfra-sniper-param-amount@' + randomId)
                                .setLabel('Set Amount')
                                .setStyle(2),
                            new ButtonBuilder()
                                .setCustomId('button-friendtechtasksinfra-sniper-param-totaltask@' + randomId)
                                .setLabel('Set Total Task')
                                .setStyle(2),
                            new ButtonBuilder()
                                .setCustomId('button-friendtechtasksinfra-sniper-param-price@' + randomId)
                                .setLabel('Set Price')
                                .setStyle(2),
                            new ButtonBuilder()
                                .setCustomId('button-friendtechtasksinfra-sniper-param-supply@' + randomId)
                                .setLabel('Set Supply')
                                .setStyle(2),

                        );

                    const buttonsRow2 = new ActionRowBuilder()
                        .addComponents(


                            new ButtonBuilder()
                                .setCustomId('button-friendtechtasksinfra-sniper-param-depositamount@' + randomId)
                                .setLabel('Set Deposit Value')
                                .setStyle(2),
                            new ButtonBuilder()
                                .setCustomId('button-friendtechtasksinfra-sniper-param-twitterscore@' + randomId)
                                .setLabel('Set Twitter Score')
                                .setStyle(2),
                            new ButtonBuilder()
                                .setCustomId('button-friendtechtasksinfra-sniper-param-uniqueholders@' + randomId)
                                .setLabel('Set Unique Holders')
                                .setStyle(2),
                            new ButtonBuilder()
                                .setCustomId('button-friendtechtasksinfra-sniper-param-gaspreset@' + randomId)
                                .setLabel('Set Gas Preset')
                                .setStyle(2),
                            new ButtonBuilder()
                                .setCustomId('button-friendtechtasksinfra-sniper-param-simulation@' + randomId)
                                .setLabel('Set Simulation')
                                .setStyle(2),



                        );


                    const buttonsRow3 = new ActionRowBuilder()
                        .addComponents(


                            new ButtonBuilder()
                                .setCustomId('button-friendtechtasksinfra-sniper-param-status@' + randomId)
                                .setLabel(statusLabel)
                                .setStyle(3),
                            new ButtonBuilder()
                                .setCustomId('button-friendtechtasksinfra-sniper-param-delete@' + randomId)
                                .setLabel('Delete')
                                .setStyle(4),
                            new ButtonBuilder()
                                .setCustomId('friendtechtasksinfra-' + tutorialType + '-button')
                                .setLabel('📑 Tutorial')
                                .setStyle(1),
                            new ButtonBuilder()
                                .setCustomId('friendtechtasksinfra-snipermenu-button')
                                .setLabel('↩️')
                                .setStyle(1),
                            new ButtonBuilder()
                                .setCustomId('friendtechtasksinfra-mainmenu-button')
                                .setLabel('🏠')
                                .setStyle(1),


                        );



                    // On construit le boutton variable
                    const maxTasks = 5; // Maximum de tâches
                    const buttonsRow4 = new ActionRowBuilder();

                    for (let i = 1; i <= maxTasks; i++) {
                        if (i <= snipeTasksCount) {
                            const style = i == desiredTaskNb ? 1 : 2; // Si c'est la tâche actuelle, style en bleu (1), sinon en gris (2)

                            buttonsRow4.addComponents(
                                new ButtonBuilder()
                                    .setCustomId(`friendtechtasksinfra-sniperlist-button-${i}`)
                                    .setLabel(`Task ${i}`)
                                    .setStyle(style)
                            );
                        } else {
                            // Si le numéro de tâche est supérieur au nombre de tâches disponibles, le bouton est désactivé.
                            buttonsRow4.addComponents(
                                new ButtonBuilder()
                                    .setCustomId(`friendtechtasksinfra-sniperlist-button-${i}`)
                                    .setLabel(`Task ${i}`)
                                    .setStyle(2) // Style en gris
                                    .setDisabled(true)
                            );
                        }
                    }

                    // Maintenant, actionRow contient les boutons générés dynamiquement en fonction du nombre de tâches et de la tâche actuelle.






                    // On renvoi l'embed adapté
                    if (type == "new_user") {




                        const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Friend.Tech Tasks")
                            .setDescription(">>> Displaying your sniper task")
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .addFields(
                                { name: "Status", value: "`" + statusFormatted + "`", inline: true },
                                { name: "Task Type", value: "`🐇 New User`", inline: true },
                                { name: " ", value: "**📖 CORE INFOS** ", inline: false },
                                { name: "Target", value: "`" + targetFormatted + "`", inline: true },
                                { name: "Amount/Txn", value: "`" + amount + "`", inline: true },
                                { name: "Total Task", value: "`" + totalTaskFormatted + "`", inline: true },
                                { name: " ", value: "**⚙️ ADVANCED SETTINGS** ", inline: false },
                                { name: "Min. Key Price", value: "`" + minPriceFormatted + "`", inline: true },
                                { name: "Max. Key Price", value: "`" + maxPriceFormatted + "`", inline: true },
                                { name: " ", value: " ", inline: false },
                                { name: "Min. Supply", value: "`" + minSupplyFormatted + "`", inline: true },
                                { name: "Max. Supply", value: "`" + maxSupplyFormatted + "`", inline: true },
                                { name: " ", value: " ", inline: false },
                                { name: "Min. Followers", value: "`" + minFollowersFormatted + "`", inline: true },
                                { name: "Max. Followers", value: "`" + maxFollowersFormatted + "`", inline: true },
                                { name: " ", value: " ", inline: false },
                                { name: "Min. Twitter Score", value: "`" + minTwitterScoreFormatted + "`", inline: true },
                                { name: "Max. Twitter Score", value: "`" + maxTwitterScoreFormatted + "`", inline: true },
                                { name: " ", value: " ", inline: false },
                                { name: "Min. Unique Holders", value: "`" + minUniqueHoldersFormatted + "`", inline: true },
                                { name: "Max. Unique Holders", value: "`" + maxUniqueHoldersFormatted + "`", inline: true },
                                { name: " ", value: "**😈 EXPERT MODE**", inline: false },
                                { name: "Gas Preset", value: "`" + gasPresetFormatted + "`", inline: true },
                                { name: "Simulation", value: "`" + simulationFormatted + "`", inline: true },
                                { name: " ", value: "*Automated tasks are sensitive operations. Please check your settings before activating.*", inline: false },




                            )
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.update({ embeds: [errorNotEthereum], components: [buttonsRow4, buttonsRow, buttonsRow2, buttonsRow3], ephemeral: true });




                    } else if (type == "new_deposit") {



                        const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Friend.Tech Tasks")
                            .setDescription(">>> Displaying your sniper tasks")
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .addFields(
                                { name: "Status", value: "`" + statusFormatted + "`", inline: true },
                                { name: "Task Type", value: "`📥 New Deposit`", inline: true },
                                { name: " ", value: "**📖 CORE INFOS** ", inline: false },
                                { name: "Target", value: "`" + targetFormatted + "`", inline: true },
                                { name: "Amount/Txn", value: "`" + amount + "`", inline: true },
                                { name: "Total Task", value: "`" + totalTaskFormatted + "`", inline: true },
                                { name: " ", value: "**⚙️ ADVANCED SETTINGS** ", inline: false },
                                { name: "Min. Key Price", value: "`" + minPriceFormatted + "`", inline: true },
                                { name: "Max. Key Price", value: "`" + maxPriceFormatted + "`", inline: true },
                                { name: " ", value: " ", inline: false },
                                { name: "Min. Supply", value: "`" + minSupplyFormatted + "`", inline: true },
                                { name: "Max. Supply", value: "`" + maxSupplyFormatted + "`", inline: true },
                                { name: " ", value: " ", inline: false },
                                { name: "Min. Deposit Value", value: "`" + minDepositValueFormatted + "`", inline: true },
                                { name: "Max. Deposit Value", value: "`" + maxDepositValueFormatted + "`", inline: true },
                                { name: " ", value: " ", inline: false },
                                { name: "Min. Twitter Score", value: "`" + minTwitterScoreFormatted + "`", inline: true },
                                { name: "Max. Twitter Score", value: "`" + maxTwitterScoreFormatted + "`", inline: true },
                                { name: " ", value: " ", inline: false },
                                { name: "Min. Unique Holders", value: "`" + minUniqueHoldersFormatted + "`", inline: true },
                                { name: "Max. Unique Holders", value: "`" + maxUniqueHoldersFormatted + "`", inline: true },
                                { name: " ", value: "**😈 EXPERT MODE**", inline: false },
                                { name: "Gas Preset", value: "`" + gasPresetFormatted + "`", inline: true },
                                { name: "Simulation", value: "`" + simulationFormatted + "`", inline: true },
                                { name: " ", value: "*Automated tasks are sensitive operations. Please check your settings before activating.*", inline: false },




                            )
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.update({ embeds: [errorNotEthereum], components: [buttonsRow4, buttonsRow, buttonsRow2, buttonsRow3], ephemeral: true });


                    }




                } else {


                    const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Sniper Tasks")
                        .setDescription(">>> Displaying your Friend.tech tasks")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .addFields(
                            { name: "Tasks", value: "```You don't have any sniper tasks set up on your account                            ```∟ To create your first task, go to the sniper home page by clicking on the ↩️ button below.", inline: true },

                        )
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.update({ embeds: [errorNotEthereum], components: [buttonsRowCancel], ephemeral: true });



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



