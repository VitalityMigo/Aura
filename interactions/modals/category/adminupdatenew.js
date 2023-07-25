/**
 * @file Sample modal interaction
 * @author JAYZHVJ
 * @since 3.2.0
 * @version 3.2.2
 */

/**
 * @type {import('../../../typings').ModalInteractionCommand}
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { profileData, reportsql, watchlistSql, walletsgenerated, vouchData, wallets, accessSql, interactionData, adminsql, sequelize } = require('../../../events/database');
const moment = require('moment');




const buttonRowAdminDashboard = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('RCDashboardNewUpdate-button')
            .setLabel('new update')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('RCDashboardMenu-button')
            .setLabel('menu')
            .setStyle(2),
    )




module.exports = {
    id: "RCDashboardNewUpdateModal",

    async execute(interaction) {


        //Récupérer informations de l'utilisateur de la commande
        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id
        let botId = interaction.applicationId

        try {

            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")
            //Checkpoint
            console.log("// Step 2 : Authorization - Executed ✅")



            //Récupère le password donné par l'utilisateur
            const content = interaction.fields.getTextInputValue('RCDashboardNewUpdateModalR1');

            const accessList = await accessSql.findAll()
            const serverCount = accessList.length
            let serverUpdateTable = []

            for (let index = 0; index < serverCount; index++) {

                let obj = {}
                obj.serverName = accessList[index].dataValues.serverName
                obj.serverId = accessList[index].dataValues.serverId
                obj.updateChannel = accessList[index].dataValues.updateChannel

                serverUpdateTable.push(obj)

            }
            console.log(serverUpdateTable)




            for (const community of serverUpdateTable) {

                let communityServerName = community.serverName
                let communityServerId = community.serverId
                let communityChannelId = community.updateChannel

                const guild = interaction.client.guilds.cache.get(communityServerId);
                const channel = guild.channels.cache.get(communityChannelId);

                const updateEmbed = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("New Update")
                    .setDescription(">>> Hey " + communityServerName + "'s community, a new update is available !")
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .setTimestamp()
                    .addFields(
                        { name: " ", value: " ", inline: false },
                        { name: "Content:", value: content, inline: false },
                        { name: " ", value: " ", inline: false },
                        { name: " ", value: "Have a nice day, and thanks for your trust 🧠 !", inline: false },

                    )
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                await channel.send({ embeds: [updateEmbed] });


            }


            const passwordManagement = new EmbedBuilder().setColor("#060A8F")
                .setTitle("Admin Dashboard")
                .setDescription(">>> Send an update to all the bot's communities")
                .setAuthor({ name: authorName, iconURL: userAvatar })
                .setTimestamp()
                .addFields(
                    { name: " ", value: " ", inline: false },
                    { name: "Update Mecanism", value: "The update page allows the bot administrators to send a message to all the servers that uses the bot. Use the button below to start a message", inline: true },
                    { name: " ", value: " ", inline: false },
                    { name: "Statut", value: "There's currently `" + serverCount + "` communities that will receive the update.", inline: true },
                    { name: " ", value: " ", inline: false },
                    { name: " ", value: "*The update has been sent to all the communities.* ✅", inline: false },



                )
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


            await interaction.update({ embeds: [passwordManagement], components: [buttonRowAdminDashboard] });

            return;

        } catch (error) {



            console.log("// Error - sent in report ❌")

            //On envoi une notif
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
            let reportCommand = "/admin-updateNew"

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
                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                .setAuthor({ name: "Rolls Chasers Analytics", iconURL: "https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png" })
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
                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                .setTimestamp()
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


            await interaction.reply({ embeds: [errorAnswerUser], ephemeral: true });


        }
    },
};
