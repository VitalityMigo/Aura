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
const { accessSql, profileData, adminsql, reportsql, farmer_friendTech, infra_friendTech, sequelize } = require('../../../events/database');
const moment = require('moment');


const buttonRowNoWallet = new ActionRowBuilder()
    .addComponents(

        new ButtonBuilder()
            .setCustomId('friendtech_exec_setup-button')
            .setLabel('💻 Setup')
            .setStyle(1),

    )


module.exports = {
    id: 'button-friendtechtasksinfra-farmer-param-',

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



            const customId = interaction.customId
            const action = customId.split("-").pop()


            if (action == "status") {


                let taskEmbed = interaction.message.embeds[0].data

                const component1 = interaction.message.components[0]
                const component2 = interaction.message.components[1]
                let component3 = interaction.message.components[2]


                if (taskEmbed.fields.find(obj => obj.name === "Status").value == "`🟢 Active`") {

                    taskEmbed.fields.find(obj => obj.name === "Status").value = "`🔴 Not active`";
                    component3.components.find(obj => obj.data.label === "🔴 Disable").data.label = "🟢 Activate"


                    await farmer_friendTech.update({ active: "false", }, { where: { authorId: authorId } });
                    await interaction.update({ embeds: [taskEmbed], components: [component1, component2, component3], ephemeral: true });




                } else {

                    const userSetup = await infra_friendTech.findOne({ where: { authorId: authorId } })


                    if (userSetup != null) {

                        const taskDetails = await farmer_friendTech.findOne({ where: { authorId: authorId } })

                        const isBuyActive = taskDetails.dataValues.buy_0_3
                        const isSellActive = taskDetails.dataValues.sell_3_0

                        if (isBuyActive == "true" || isSellActive == "true") {


                            let taskEmbed = interaction.message.embeds[0].data

                            const component1 = interaction.message.components[0]
                            const component2 = interaction.message.components[1]
                            let component3 = interaction.message.components[2]



                            taskEmbed.fields.find(obj => obj.name === "Status").value = "`🟢 Active`";
                            component3.components.find(obj => obj.data.label === "🟢 Activate").data.label = "🔴 Disable"




                            await farmer_friendTech.update({ active: "true", }, { where: { authorId: authorId } });
                            await interaction.update({ embeds: [taskEmbed], components: [component1, component2, component3], ephemeral: true });

                        } else {

                            const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Farmer Setup")
                                .setDescription("You can't activate your task unless you activate one of the two Fren Strategy. Please try again after doing so.")
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                            await interaction.reply({ embeds: [gasTrackerEmbed], components: [], ephemeral: true });



                        }

                    } else {

                        const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Farmer Setup")
                            .setDescription("You can't activate your task unless you set a wallet to your profile using `/friendtech wallet` or using the button below. Please try again after doing so.")
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                        await interaction.reply({ embeds: [gasTrackerEmbed], components: [buttonRowNoWallet], ephemeral: true });



                    }


                }



            } else if (action == "buyactivate") {


                let taskEmbed = interaction.message.embeds[0].data

                const component1 = interaction.message.components[0]
                const component2 = interaction.message.components[1]
                let component3 = interaction.message.components[2]


                if (taskEmbed.fields.find(obj => obj.name === "Buy 0,3").value == "`✅`") {

                    taskEmbed.fields.find(obj => obj.name === "Buy 0,3").value = "`❌`";


                    if (taskEmbed.fields.find(obj => obj.name === "Sell 3,0").value == "`❌`") {

                        taskEmbed.fields.find(obj => obj.name === "Status").value = "`🔴 Not active`";
                        component3.components.find(obj => obj.data.label === "🔴 Disable").data.label = "🟢 Activate"

                        await farmer_friendTech.update({ buy_0_3: "false", active: "false" }, { where: { authorId: authorId } });
                        await interaction.update({ embeds: [taskEmbed], components: [component1, component2, component3], ephemeral: true });

                    } else {

                        await farmer_friendTech.update({ buy_0_3: "false", }, { where: { authorId: authorId } });
                        await interaction.update({ embeds: [taskEmbed], ephemeral: true });


                    }



                } else {

                    taskEmbed.fields.find(obj => obj.name === "Buy 0,3").value = "`✅`";

                    await farmer_friendTech.update({ buy_0_3: "true", }, { where: { authorId: authorId } });
                    await interaction.update({ embeds: [taskEmbed], ephemeral: true });

                }


            } else if (action == "sellactivate") {


                let taskEmbed = interaction.message.embeds[0].data

                const component1 = interaction.message.components[0]
                const component2 = interaction.message.components[1]
                let component3 = interaction.message.components[2]


                if (taskEmbed.fields.find(obj => obj.name === "Sell 3,0").value == "`✅`") {

                    taskEmbed.fields.find(obj => obj.name === "Sell 3,0").value = "`❌`";

                    if (taskEmbed.fields.find(obj => obj.name === "Buy 0,3").value == "`❌`") {

                        taskEmbed.fields.find(obj => obj.name === "Status").value = "`🔴 Not active`";
                        component3.components.find(obj => obj.data.label === "🔴 Disable").data.label = "🟢 Activate"

                        await farmer_friendTech.update({ sell_3_0: "false", active: "false" }, { where: { authorId: authorId } });
                        await interaction.update({ embeds: [taskEmbed], components: [component1, component2, component3], ephemeral: true });


                    } else {

                        await farmer_friendTech.update({ sell_3_0: "false", }, { where: { authorId: authorId } });
                        await interaction.update({ embeds: [taskEmbed], ephemeral: true });


                    }



                } else {

                    taskEmbed.fields.find(obj => obj.name === "Sell 3,0").value = "`✅`";

                    await farmer_friendTech.update({ sell_3_0: "true", }, { where: { authorId: authorId } });
                    await interaction.update({ embeds: [taskEmbed], ephemeral: true });

                }


            } else if (action == "maxprice") {



                const passwordAdminDashboard = new ModalBuilder()
                    .setCustomId('modal-friendtechtasksinfra-farmer-param-maxprice')
                    .setTitle('Set Max Buy Price');

                // Add components to modal

                // Create the text input components
                const channel = new TextInputBuilder()
                    .setCustomId('modal-friendtechtasksinfra-farmer-param-maxpriceR1')
                    .setLabel("Key Price")
                    .setPlaceholder("The max key price the bot is allowed to buy")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)




                // An action row only holds one text input,
                // so you need one action row per text input.
                const firstActionRowSetProfile = new ActionRowBuilder().addComponents(channel);


                // Add inputs to the modal
                passwordAdminDashboard.addComponents(firstActionRowSetProfile)

                // Show the modal to the user
                await interaction.showModal(passwordAdminDashboard);



            } else if (action == "minprice") {





                const passwordAdminDashboard = new ModalBuilder()
                    .setCustomId('modal-friendtechtasksinfra-farmer-param-minprice')
                    .setTitle('Set Min Buy Price');

                // Add components to modal

                // Create the text input components
                const channel = new TextInputBuilder()
                    .setCustomId('modal-friendtechtasksinfra-farmer-param-minpriceR1')
                    .setLabel("Key Price")
                    .setPlaceholder("The min key price the bot is allowed to sell")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)




                // An action row only holds one text input,
                // so you need one action row per text input.
                const firstActionRowSetProfile = new ActionRowBuilder().addComponents(channel);


                // Add inputs to the modal
                passwordAdminDashboard.addComponents(firstActionRowSetProfile)

                // Show the modal to the user
                await interaction.showModal(passwordAdminDashboard);



            } else if (action == "gaspreset") {



                const passwordAdminDashboard = new ModalBuilder()
                    .setCustomId('modal-friendtechtasksinfra-farmer-param-gaspreset')
                    .setTitle('Set Gas Preset');

                // Add components to modal

                // Create the text input components
                const channel = new TextInputBuilder()
                    .setCustomId('modal-friendtechtasksinfra-farmer-param-gaspresetR1')
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

                    await farmer_friendTech.update({ simulation: "false", }, { where: { authorId: authorId } });
                    await interaction.update({ embeds: [taskEmbed], ephemeral: true });

                } else {

                    taskEmbed.fields.find(obj => obj.name === "Simulation").value = "`✅`";

                    await farmer_friendTech.update({ simulation: "true", }, { where: { authorId: authorId } });
                    await interaction.update({ embeds: [taskEmbed], ephemeral: true });

                }


            } else if (action == "tutorial") {


                const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Friend.Tech Farmer Tutorial")
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                    .setDescription(">>> The Friend.Tech farmer task has several easy-to-use features.")
                    .addFields(
                        { name: " ", value: " ", inline: false },
                        { name: "*Status*", value: "Indicates whether the task is active or not. If it is active, the task runs within the set conditions. If not, it is not monitoring.", inline: false },
                        { name: " ", value: " ", inline: false },
                        { name: "*Buy 0,3*", value: "Enable or disable reciprocal purchases. When this option is selected, the bot will buy all users who buy your key if they meet the conditions.", inline: false },
                        { name: " ", value: " ", inline: false },
                        { name: "*Sell 3,0*", value: "Enable or disable reciprocal sell. When this option is selected, the bot will sell all users who sell your key if they meet the conditions.", inline: false },
                        { name: " ", value: " ", inline: false },
                        { name: "*Max. Buy Value*", value: "The maximum price at which the bot will make a reciprocal purchase. This prevents overpriced purchases.", inline: false },
                        { name: " ", value: " ", inline: false },
                        { name: "*Min. Sell Value*", value: "The minimum price at which the bot will make a reciprocal sell. This prevents useless liquidation.", inline: false },
                        { name: " ", value: " ", inline: false },
                        { name: "*Gas Preset*", value: "The gas settings to use. Classic (or 0) represents the basic setting, which can be modulated in % to make the order transactions more aggressive (10%, 30% etc).", inline: false },
                        { name: " ", value: " ", inline: false },
                        { name: "*Simulation*", value: "Select whether you want the transaction to be simulated internally before being launched or not. This allows to prevent a failed transaction from being launched, thus reducing the chances of losing gas fees.", inline: false },
                        { name: " ", value: " ", inline: false },
                        { name: " ", value: "*⚠️ All conditions are defaulted to any. To reset a field, press the corresponding button and leave the field empty.*", inline: false },

                    )
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
            let reportCommand = "/farmer-dash"

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


