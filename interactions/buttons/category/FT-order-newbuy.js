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
const { accessSql, profileData, adminsql, reportsql, order_friendTech, infra_friendTech, sequelize } = require('../../../events/database');
const moment = require('moment');

const generateRandomString = require("../../../functions/randomkey")



const buttonsRowNew = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('infra_friendtechnewwallet-button')
            .setLabel('import wallet')
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId('infra_friendtechgeneratewallet-button')
            .setLabel('generate wallet')
            .setStyle(3),

    );



module.exports = {
    id: 'friendtechtasksinfra-ordernewbuy-button',

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




                const userSetup = await infra_friendTech.findOne({ where: { authorId: authorId } })

                if (userSetup != null) {

                    const walletAddress = userSetup.dataValues.walletAddress
                    const walletPK = userSetup.dataValues.privateKey

                    const userOrderTasks = await order_friendTech.findAll({ where: { authorId: authorId } })
                    const orderTaskCount = userOrderTasks.length
                    const taskIndex = parseInt(orderTaskCount) + 1
                    const maxOrder = 5


                    if (orderTaskCount < maxOrder) {


                        const randomId = generateRandomString(20)

                        const timeStamp = Date.now();
                        const actualTimestamp = parseFloat(timeStamp / 1000).toFixed(0)


                        const buttonsRow = new ActionRowBuilder()
                            .addComponents(

                                new ButtonBuilder()
                                    .setCustomId('button-friendtechtasksinfra-order-param-target@' + randomId)
                                    .setLabel('Set Target')
                                    .setStyle(2),
                                new ButtonBuilder()
                                    .setCustomId('button-friendtechtasksinfra-order-param-amount@' + randomId)
                                    .setLabel('Set Amount')
                                    .setStyle(2),
                                new ButtonBuilder()
                                    .setCustomId('button-friendtechtasksinfra-order-param-price@' + randomId)
                                    .setLabel('Set Key Price')
                                    .setStyle(2),
                                new ButtonBuilder()
                                    .setCustomId('button-friendtechtasksinfra-order-param-gaspreset@' + randomId)
                                    .setLabel('Set Gas Preset')
                                    .setStyle(2),
                                new ButtonBuilder()
                                    .setCustomId('button-friendtechtasksinfra-order-param-simulation@' + randomId)
                                    .setLabel('Set Simulation')
                                    .setStyle(2),


                            );


                        const buttonsRow3 = new ActionRowBuilder()
                            .addComponents(


                                new ButtonBuilder()
                                    .setCustomId('button-friendtechtasksinfra-order-param-status@' + randomId)
                                    .setLabel('🟢 Activate')
                                    .setStyle(3),
                                new ButtonBuilder()
                                    .setCustomId('button-friendtechtasksinfra-order-param-delete@' + randomId)
                                    .setLabel('Delete')
                                    .setStyle(4),
                                new ButtonBuilder()
                                    .setCustomId('friendtechtasksinfra-orderbuytutorial-button')
                                    .setLabel('📑 Tutorial')
                                    .setStyle(1),
                                new ButtonBuilder()
                                    .setCustomId('friendtechtasksinfra-ordermenu-button')
                                    .setLabel('↩️')
                                    .setStyle(1),
                                new ButtonBuilder()
                                    .setCustomId('friendtechtasksinfra-mainmenu-button')
                                    .setLabel('🏠')
                                    .setStyle(1),


                            );




                        //On enregistre le call
                        order_friendTech.create({
                            authorId: authorId,
                            authorName: authorName,
                            type: "buy",
                            amount: '1',
                            repeat: "1",
                            simulation: "false",
                            active: "false",
                            taskNb: taskIndex.toString(),
                            walletAddress: walletAddress,
                            privateKey: walletPK,
                            created: actualTimestamp.toString(),
                            randomId: randomId.toString()
                        })




                        const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Friend.Tech Tasks")
                            .setDescription(">>> New deposit snipe settings")
                            //  .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .addFields(
                                { name: "Status", value: "`🔴 Not active`", inline: false },
                                { name: " ", value: " ", inline: false },
                                { name: " ", value: "**📖 CORE INFOS** ", inline: false },
                                { name: "Target", value: "`None`", inline: true },
                                { name: "Amount/Txn", value: "`1`", inline: true },
                                { name: "Total Task", value: "`No Limit`", inline: true },
                                { name: " ", value: " ", inline: false },
                                { name: " ", value: "**⚙️ ADVANCED SETTINGS** ", inline: false },
                                { name: "Buy Below:", value: "`None`", inline: true },
                                { name: "Buy Above:", value: "`None`", inline: true },
                                { name: " ", value: " ", inline: false },
                                { name: " ", value: "**😈 EXPERT MODE**", inline: false },
                                { name: "Gas Preset", value: "`Classic`", inline: true },
                                { name: "Simulation", value: "`❌`", inline: true },
                                { name: " ", value: "*Automated tasks are sensitive operations. Please check your settings and open your server DMs before activating.*", inline: false },




                            )
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.update({ embeds: [errorNotEthereum], components: [buttonsRow, buttonsRow3], ephemeral: true });




                    } else {


                        const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Friend Tech Setup")
                            .setDescription(">>> Displaying your Friend.tech tasks")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .addFields(
                                { name: " ", value: "You reached the maximum of sniper tasks per user, which is set at `5`. Please delete one of your sniper tasks before creating a new one.", inline: true },

                            )
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.reply({ embeds: [errorNotEthereum], ephemeral: true });




                    }




                } else {


                    const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Friend Tech Setup")
                        .setDescription(">>> Displaying your Friend.tech wallet setup")
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .addFields(
                            { name: " ", value: "You don't have a wallet imported in your Friend.tech portfolio. To get started, use the button below.", inline: true },

                        )
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.reply({ embeds: [errorNotEthereum], components: [buttonsRowNew], ephemeral: true });




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



