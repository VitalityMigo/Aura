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
const { accessSql, profileData, adminsql, reportsql, order_friendTech, infra_friendTech, sniper_friendTech, sequelize } = require('../../../events/database');
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
    id: 'friendtechtasksinfra-sniperautoselllist-button-',

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

                let desiredTaskNb = customId.substring(customId.length - 1)


                // On trouve la task
                const userSnipeTasks = await order_friendTech.findAll({ where: { authorId: authorId, type: "auto_sell" } })
                const snipeTasksCount = userSnipeTasks.length

                if (desiredTaskNb == "F") { desiredTaskNb = "1" }
                if (desiredTaskNb == "L") { desiredTaskNb = snipeTasksCount }


                const taskIndex = desiredTaskNb - 1



                // on vérifie l'existence de la task
                if (snipeTasksCount > 0) {

                    const desiredTask = userSnipeTasks[taskIndex].dataValues


                    // On récupère les valeurs de la task
                    const type = "🤖 Auto Sell Order"
                    const status = desiredTask.active
                    const target = desiredTask.target
                    const amount = desiredTask.amount
                    const totalTask = desiredTask.repeat
                    const stop_loss = desiredTask.min_key_price
                    const take_profit = desiredTask.max_key_price
                    const gasPreset = desiredTask.gas_preset
                    const simulation = desiredTask.simulation
                    const randomId = desiredTask.randomId
                    const averageBuy = desiredTask.min_value
                    const createdBy = desiredTask.created


                    // On met en forme les valeurs
                    let statusFormatted = "🔴 Not active"
                    if (status == "true") { statusFormatted = "🟢 Active" }


                    let statusLabel = "🟢 Activate"
                    if (status == "true") { statusLabel = "🔴 Disable" }


                    let averageBuyFormatted = "`Unknown`"
                    if (averageBuy != null) { averageBuyFormatted = averageBuy }

                    // on formatte stop loss et take profit
                    let stopLossFormatted = "`None`"
                    let slPriceFormatted = "`None`"
                    let slProfitFormatted = "`None`"
                    if (stop_loss != null) {

                        stopLossFormatted = "`" + parseFloat(((stop_loss / averageBuy) * 100) - 100).toFixed(0) + "% (x" + parseFloat((1 + (stop_loss / averageBuy - 1))).toFixed(1) + ")`"
                        slPriceFormatted = "`" + parseFloat(stop_loss).toFixed(3) + "Ξ`"
                        slProfitFormatted = "`" + parseFloat((parseFloat(stop_loss) - parseFloat(averageBuy)) * parseInt(amount)).toFixed(3) + "Ξ`"
                    }


                    let takeProfitFormatted = "`None`"
                    let tpPriceFormatted = "`None`"
                    let tpProfitFormatted = "`None`"
                    // on formatte stop loss et take profit
                    if (take_profit != null) {
                        takeProfitFormatted = "`+" + parseFloat(((take_profit / averageBuy) * 100) - 100).toFixed(0) + "% (x" + parseFloat(1 + (take_profit / averageBuy) - 1).toFixed(1) + ")`"
                        tpPriceFormatted = "`" + parseFloat(take_profit).toFixed(3) + "Ξ`"
                        tpProfitFormatted = "`" + parseFloat((parseFloat(take_profit) - parseFloat(averageBuy)) * parseInt(amount)).toFixed(3) + "Ξ`"
                    }


                    let created_by = "`Deleted Snipe`"
                    if (createdBy != null) {
                        const userSnipeTasks = await sniper_friendTech.findOne({ where: { authorId: authorId, randomId: createdBy } })
                        if (userSnipeTasks != null) {
                            if (userSnipeTasks.dataValues.type == "new_user") {
                                created_by = "`Task " + userSnipeTasks.dataValues.taskNb + " (New User)`"
                            } else if (userSnipeTasks.dataValues.type == "new_deposit") {
                                created_by = "`Task " + userSnipeTasks.dataValues.taskNb + " (New Deposit)`"
                            }
                        }
                    }

                    // On construit les bouttons

                    const buttonsRow = generateButtonRow(desiredTaskNb, snipeTasksCount)


                    const buttonsRow2 = new ActionRowBuilder()
                        .addComponents(

                            new ButtonBuilder()
                                .setCustomId('button-friendtechtasksinfra-autosell-param-delete@' + randomId)
                                .setLabel('Delete')
                                .setStyle(4),
                            new ButtonBuilder()
                                .setCustomId('friendtechtasksinfra-autoselltutorial-button')
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



                    // Maintenant, actionRow contient les boutons générés dynamiquement en fonction du nombre de tâches et de la tâche actuelle.


                    const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Friend.Tech Tasks")
                        .setDescription(">>> Displaying your auto sells task")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .addFields(
                            { name: "Status", value: "`" + statusFormatted + "`", inline: true },
                            { name: "Task Type", value: "`" + type + "`", inline: true },
                            { name: " ", value: " ", inline: false },
                            { name: " ", value: "**📖 CORE INFOS** ", inline: false },
                            { name: "Target", value: "`" + target + "`", inline: true },
                            { name: "Amount/Txn", value: "`" + amount + "`", inline: true },
                            { name: "Total Task", value: "`" + totalTask + "`", inline: true },
                            { name: " ", value: " ", inline: false },
                            { name: " ", value: "**🤖 Auto Sell Settings** ", inline: false },
                            { name: "Avg. Buy", value: "`" + parseFloat(averageBuyFormatted).toFixed(3) + "Ξ`", inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: "Stop Loss:", value: stopLossFormatted, inline: true },
                            { name: "Key Price:", value: slPriceFormatted, inline: true },
                            { name: "PnL:", value: slProfitFormatted, inline: true },
                            { name: " ", value: " ", inline: false },
                            { name: "Take Profit:", value: takeProfitFormatted, inline: true },
                            { name: "Key Price:", value: tpPriceFormatted, inline: true },
                            { name: "PnL:", value: tpProfitFormatted, inline: true },
                            { name: " ", value: " ", inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: " ", value: "**→ Created by:** " + created_by, inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: "Page", value: "`[" + desiredTaskNb + "/" + snipeTasksCount + "]`", inline: false },
                            { name: " ", value: "*Auto sells can't be modified once created by the snipe execution. You can delete it and replace it by a sell order for more personalization.*", inline: false },





                        )
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.update({ embeds: [errorNotEthereum], components: [buttonsRow, buttonsRow2], ephemeral: true });







                } else {


                    const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Order Tasks")
                        .setDescription(">>> Displaying your Friend.tech auto sells")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .addFields(
                            { name: "Tasks", value: "```You don't have any auto sells set up on your account                            ```∟ To create your first task, go to the order home page by clicking on the ↩️ button below.", inline: true },

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



function generateButtonRow(desiredTaskNb, snipeTasksCount) {
    const buttonsRow = new ActionRowBuilder();

    desiredTaskNb = parseInt(desiredTaskNb)
    snipeTasksCount = parseInt(snipeTasksCount)


    if (snipeTasksCount != 1 && desiredTaskNb - 1 != 1 && desiredTaskNb + 1 != snipeTasksCount) {

        // First page button
        buttonsRow.addComponents(
            new ButtonBuilder()
                .setCustomId('friendtechtasksinfra-sniperautoselllist-button-1')
                .setLabel('First page')
                .setStyle(2)
                .setDisabled(desiredTaskNb === 1 || snipeTasksCount === 1)
        );

        // Previous page button
        buttonsRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`friendtechtasksinfra-sniperautoselllist-button-${desiredTaskNb - 1}`)
                .setLabel('Previous page')
                .setStyle(2)
                .setDisabled(desiredTaskNb === 1)
        );

        // Next page button
        buttonsRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`friendtechtasksinfra-sniperautoselllist-button-${desiredTaskNb + 1}`)
                .setLabel('Next page')
                .setStyle(2)
                .setDisabled(desiredTaskNb === snipeTasksCount)
        );

        // Last page button
        buttonsRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`friendtechtasksinfra-sniperautoselllist-button-${snipeTasksCount}`)
                .setLabel('Last page')
                .setStyle(2)
                .setDisabled(desiredTaskNb === snipeTasksCount || snipeTasksCount === 1)
        );

    } else if (snipeTasksCount == 1) {


        // First page button
        buttonsRow.addComponents(
            new ButtonBuilder()
                .setCustomId('friendtechtasksinfra-sniperautoselllist-button-1bis')
                .setLabel('First page')
                .setStyle(2)
                .setDisabled(true)
        );

        // Previous page button
        buttonsRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`friendtechtasksinfra-sniperautoselllist-button-${desiredTaskNb - 1}`)
                .setLabel('Previous page')
                .setStyle(2)
                .setDisabled(true)
        );

        // Next page button
        buttonsRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`friendtechtasksinfra-sniperautoselllist-button-${desiredTaskNb + 1}`)
                .setLabel('Next page')
                .setStyle(2)
                .setDisabled(true)
        );

        // Last page button
        buttonsRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`friendtechtasksinfra-sniperautoselllist-button-1`)
                .setLabel('Last page')
                .setStyle(2)
                .setDisabled(true)
        );



    } else if (desiredTaskNb - 1 == 1) {


        // First page button
        buttonsRow.addComponents(
            new ButtonBuilder()
                .setCustomId('friendtechtasksinfra-sniperautoselllist-button-F')
                .setLabel('First page')
                .setStyle(2)
                .setDisabled(false)
        );

        // Previous page button
        buttonsRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`friendtechtasksinfra-sniperautoselllist-button-1`)
                .setLabel('Previous page')
                .setStyle(2)
                .setDisabled(false)
        );

        // Next page button
        buttonsRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`friendtechtasksinfra-sniperautoselllist-button-${desiredTaskNb + 1}`)
                .setLabel('Next page')
                .setStyle(2)
                .setDisabled(desiredTaskNb === snipeTasksCount)
        );

        // Last page button
        buttonsRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`friendtechtasksinfra-sniperautoselllist-button-${snipeTasksCount}`)
                .setLabel('Last page')
                .setStyle(2)
                .setDisabled(desiredTaskNb === snipeTasksCount || snipeTasksCount === 1)
        );




    } else if (desiredTaskNb + 1 == snipeTasksCount) {


        // First page button
        buttonsRow.addComponents(
            new ButtonBuilder()
                .setCustomId('friendtechtasksinfra-sniperautoselllist-button-1')
                .setLabel('First page')
                .setStyle(2)
                .setDisabled(desiredTaskNb === 1 || snipeTasksCount === 1)
        );

        // Previous page button
        buttonsRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`friendtechtasksinfra-sniperautoselllist-button-${desiredTaskNb - 1}`)
                .setLabel('Previous page')
                .setStyle(2)
                .setDisabled(desiredTaskNb === 1)
        );

        // Next page button
        buttonsRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`friendtechtasksinfra-sniperautoselllist-button-${desiredTaskNb + 1}`)
                .setLabel('Next page')
                .setStyle(2)
                .setDisabled(false)
        );

        // Last page button
        buttonsRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`friendtechtasksinfra-sniperautoselllist-button-F`)
                .setLabel('Last page')
                .setStyle(2)
                .setDisabled(false)
        );



    }

    return buttonsRow;
}

