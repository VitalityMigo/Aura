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
const { accessSql, profileData, adminsql, reportsql, farmer_friendTech, sequelize, infra_friendTech } = require('../../../events/database');
const moment = require('moment');

const fs = require('fs')
const targetsJSON = 'contracts/friendtech/farmer.json'

const decrypt = require("../../../functions/decrypt")


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
    id: 'friendtechtasksinfra-farmermenu-button',

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


            let isBuyActive
            let isSellActive
            let max_key_price
            let min_key_price
            let gas_preset
            let simulation
            let status
            let wallet



            // On set la base
            let statusFormatted = "🔴 Not active"
            let buyActivate = "❌"
            let sellActivate = "❌"
            let minKeyValue = "Any"
            let maxKeyValue = "Any"
            let gasPresetFormatted = "Classic"
            let simulationFormatted = "✅"
            let statusLabel = "🟢 Activate"


            // Call pour vérifier l'existence
            const userSetup = await farmer_friendTech.findOne({ where: { authorId: authorId } })
            let isSet = false

            if (userSetup != null) {

                wallet = userSetup.dataValues.authorWallet
                isBuyActive = userSetup.dataValues.buy_0_3
                isSellActive = userSetup.dataValues.sell_3_0
                max_key_price = userSetup.dataValues.max_key_price
                min_key_price = userSetup.dataValues.min_key_price
                gas_preset = userSetup.dataValues.gas_preset
                simulation = userSetup.dataValues.min_key_price
                status = userSetup.dataValues.active

                isSet = true

            } else {

                // Call pour vérifier l'existence
                const userSetup = await infra_friendTech.findOne({ where: { authorId: authorId } })

                if (userSetup != null) {

                    wallet = userSetup.dataValues.walletAddress
                    const pk = userSetup.dataValues.privateKey

                    await farmer_friendTech.destroy({ where: { authorId: authorId } })

                    await farmer_friendTech.create({

                        authorId: authorId,
                        authorName: authorName,
                        authorWallet: decrypt(wallet).toLowerCase(),
                        type: "farmer",
                        buy_0_3: "false",
                        sell_3_0: "false",
                        simulation: "false",
                        active: "false",
                        walletAddress: wallet,
                        privateKey: pk
                    })

                    isSet = true
                    addTarget(decrypt(wallet), authorId)
                }
            }


            if (isSet == true) {

                // On met en forme
                if (status == "true") { statusFormatted = "🟢 Active" }
                if (isBuyActive == "true") { buyActivate = "✅" }
                if (isSellActive == "true") { sellActivate = "✅" }
                if (min_key_price != null) { sellActivate = parseFloat(min_key_price).toFixed(3) + "Ξ " }
                if (max_key_price != null) { sellActivate = parseFloat(max_key_price).toFixed(3) + "Ξ " }
                if (gas_preset != null) { gasPresetFormatted = "+" + gas_preset + "%" }
                if (simulation == "false") { simulationFormatted = "❌" }
                if (status == "true") { statusLabel = "🔴 Disable" }






                // On construit les bouttons
                const buttonsRow = new ActionRowBuilder()
                    .addComponents(

                        new ButtonBuilder()
                            .setCustomId('button-friendtechtasksinfra-farmer-param-buyactivate')
                            .setLabel('Toggle 0,3')
                            .setStyle(2),
                        new ButtonBuilder()
                            .setCustomId('button-friendtechtasksinfra-farmer-param-maxprice')
                            .setLabel('Set Max. Price')
                            .setStyle(2),
                        new ButtonBuilder()
                            .setCustomId('button-friendtechtasksinfra-farmer-param-sellactivate')
                            .setLabel('Toggle 3,0')
                            .setStyle(2),
                        new ButtonBuilder()
                            .setCustomId('button-friendtechtasksinfra-farmer-param-minprice')
                            .setLabel('Set Min. Price')
                            .setStyle(2),

                    );


                const buttonsRow2 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('button-friendtechtasksinfra-farmer-param-gaspreset')
                            .setLabel('Set Gas Preset')
                            .setStyle(2),
                        new ButtonBuilder()
                            .setCustomId('button-friendtechtasksinfra-farmer-param-simulation')
                            .setLabel('Set Simulation')
                            .setStyle(2),
                    );


                const buttonsRow3 = new ActionRowBuilder()
                    .addComponents(


                        new ButtonBuilder()
                            .setCustomId('button-friendtechtasksinfra-farmer-param-status')
                            .setLabel(statusLabel)
                            .setStyle(3),
                        new ButtonBuilder()
                            .setCustomId('button-friendtechtasksinfra-farmer-param-tutorial')
                            .setLabel('📑 Tutorial')
                            .setStyle(1),
                        new ButtonBuilder()
                            .setCustomId('button_friendtech_airdrop_analysis_' + wallet)
                            .setLabel('💦 Airdrop')
                            .setStyle(1),
                        new ButtonBuilder()
                            .setCustomId('button_friendtech_portfolio_exec_myportfolio')
                            .setLabel('👝 My Portfolio')
                            .setStyle(1),
                        new ButtonBuilder()
                            .setCustomId('friendtechtasksinfra-mainmenu-button')
                            .setLabel('🏠')
                            .setStyle(1),


                    );




                const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Friend.Tech Tasks")
                    .setDescription(">>> Displaying your farmer task")
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .addFields(
                        { name: "Status", value: "`" + statusFormatted + "`", inline: false },
                        { name: " ", value: " ", inline: false },
                        { name: " ", value: "**👫 FREN STRATEGY** ", inline: false },
                        { name: "Buy 0,3", value: "`" + buyActivate + "`", inline: true },
                        { name: "Max. Buy Value", value: "`" + maxKeyValue + "`", inline: true },
                        { name: " ", value: " ", inline: false },
                        { name: "Sell 3,0", value: "`" + sellActivate + "`", inline: true },
                        { name: "Min. Sell Value", value: "`" + minKeyValue + "`", inline: true },
                        { name: " ", value: " ", inline: false },
                        { name: " ", value: "**😈 EXPERT MODE**", inline: false },
                        { name: "Gas Preset", value: "`" + gasPresetFormatted + "`", inline: true },
                        { name: "Simulation", value: "`" + simulationFormatted + "`", inline: true },
                        { name: " ", value: " ", inline: false },
                        { name: " ", value: "*Automated tasks are sensitive operations. Please check your settings and open your server DMs before activating.*", inline: false },




                    )
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                await interaction.update({ embeds: [errorNotEthereum], components: [buttonsRow, buttonsRow2, buttonsRow3], ephemeral: true });

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



function addTarget(address, authorId) {
    // Charger le contenu du fichier JSON
    let contenuFichier = fs.readFileSync(targetsJSON);
    let existingData = JSON.parse(contenuFichier);

    // Vérifier si l'adresse n'est pas déjà présente dans le tableau
    if (!existingData.some(item => item.authorId == authorId)) {
        // Ajouter la nouvelle adresse au tableau
        const obj = {
            user: authorId,
            address: address.toLowerCase()
        }

        existingData.push(obj);

        // Écrire le tableau mis à jour dans le fichier JSON
        fs.writeFileSync(targetsJSON, JSON.stringify(existingData, null, 2));
    }
}
