/**
 * @file Sample autocomplete interaction for wallet names removal by authorID
 * @version 1.0.0
 */

/**
 * @type {import("../../../typings").AutocompleteInteraction}
 */

/**
 * Retrieve the wallets for a given author ID from the JSON data
 * @param {string} authorId The ID of the author to retrieve wallets for
 * @returns {Array} The wallets for the author
 */

const fs = require('fs');

const { apimonitorsql, reportsql, adminsql, wallets, sequelize } = require('../../../events/database');
const moment = require('moment');



module.exports = {
    name: "wallet",

    async execute(interaction) {

        let serverId = interaction.member.guild.id


        try {

            // Extract the focused value from the interaction options
            const focusedValue = interaction.options.getFocused();

            let authorId = interaction.user.id;

            // Retrieve the wallets for the authorID
            const walletsFilter = await wallets.findAll({ where: { authorId: authorId } });

            const choices = [{ name: "All", value: "All" }]
            walletsFilter.forEach(elem => {

                choices.push({ name: elem.walletName + " (" + elem.walletAddress.substring(0, 5) + "..." + elem.walletAddress.substring(elem.walletAddress.length - 4, elem.walletAddress.length) + ")", value: elem.walletAddress })

            })


            // Filter the wallet names based on the focused value
            const filtered = choices.filter((blaze) => blaze.name.startsWith(focusedValue));

            // Respond with the filtered wallet names as autocomplete choices
            await interaction.respond(

                filtered.map((choice) => ({ name: choice.name, value: choice.value }))


            ).catch((err) => {
                console.error('Erreur lors de la réponse à l\'interaction Discord:', err);
            });

            return;

        } catch (error) {


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
            let reportCommand = "/wallet-autocomplete"

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
                .setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
                .setAuthor({ name: "Rolls Chasers Analytics", iconURL: "https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg" })
                .setTimestamp()
                .addFields(
                    { name: " ", value: " ", inline: false },
                    { name: "Content:", value: "A new `bug` has been submitted for the `" + reportCommand + "` command by `the bot report division` in `" + serverName + "`. You can use the administrator dashboard to consult it.", inline: false },

                )
                .setFooter({ text: 'Rolls Chasers Analytics', iconURL: 'https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg' })


            await channel.send({ embeds: [updateEmbed] });



            const errorAnswerUser = new EmbedBuilder().setColor("#060A8F")
                .setTitle("An error occured")
                .setDescription("An error has occurred while executing this command. These errors can occur for a variety of reasons, such as :\n∙ Unexpected traffic\n∙ API maintenance\n∙ Occasional bug\n\nPlease note that a report has already been sent to our team, who will fix the problem as soon as possible. You can still use `/report` to give more details about the error and help our team.")
                .setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
                .setTimestamp()
                .setFooter({ text: 'Rolls Chasers Analytics', iconURL: 'https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg' })


            await interaction.reply({ embeds: [errorAnswerUser], ephemeral: true });


        }
    },
}; 
