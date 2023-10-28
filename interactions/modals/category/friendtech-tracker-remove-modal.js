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
const { profileData, reportsql, accessSql, interactionData, adminsql, tracker_friendTech, sequelize } = require('../../../events/database');
const moment = require('moment');

const fs = require('fs')
const trackerFile = "contracts/friendtech/tracker.json"


function removeAtSymbol(word) {
    if (word.startsWith('@')) {
        return word.slice(1); // Supprime le "@" en prenant une sous-chaîne à partir du deuxième caractère.
    } else {
        return word; // Retourne le mot tel quel s'il n'y a pas de "@".
    }
}

module.exports = {
    id: "friendtechtrackerinfra-newtracker-remove-modal",

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
            const rawUsername = interaction.fields.getTextInputValue('friendtechtrackerinfra-newtracker-remove-modalR1');

            const username = removeAtSymbol(rawUsername).toLowerCase()

            const user = await tracker_friendTech.findOne({ where: { subjectUsername: username, authorId: authorId } })

            if (user !== null) {

                await tracker_friendTech.destroy({ where: { subjectUsername: username, authorId: authorId } })
                resetTrackerJson(username, authorId)

                let taskEmbed = interaction.message.embeds[0].data

                let dernierObjet = taskEmbed.fields[taskEmbed.fields.length - 1];
                if (dernierObjet.name.trim() != 'Page') {
                    dernierObjet.value = "✅ *Successfuly removed the user from your Friend Tech tracker.*"

                } else {

                    taskEmbed.fields.push({ name: " ", value: " ", inline: false })
                    taskEmbed.fields.push({ name: " ", value: "✅ *Successfuly removed the user from your Friend Tech tracker.*", inline: true })
    
                }



              

                await interaction.update({ embeds: [taskEmbed], ephemeral: true });


            } else {

                let taskEmbed = interaction.message.embeds[0].data

                let dernierObjet = taskEmbed.fields[taskEmbed.fields.length - 1];
                if (dernierObjet.name.trim() != 'Page') {
                    dernierObjet.value = "❌ *The provided user isn't registered in your tracker, try again.*"

                } else {

                    taskEmbed.fields.push({ name: " ", value: " ", inline: false })
                    taskEmbed.fields.push({ name: " ", value: "❌ *The provided user isn't registered in your tracker, try again.*", inline: true })

                }



                await interaction.update({ embeds: [taskEmbed], ephemeral: true });



            }

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
            let reportCommand = "/admin-clientNew1"

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



function resetTrackerJson(username, authorId) {

    const jsonData = JSON.parse(fs.readFileSync(trackerFile, 'utf-8'));

    // Étape 2 : Rechercher et supprimer l'objet
    const newData = jsonData.filter(item => item.author !== authorId || item.username.toLowerCase() !== username.toLowerCase());

    if (newData.length !== jsonData.length) {
        // Au moins un objet a été trouvé et supprimé, enregistre le fichier JSON mis à jour
        fs.writeFileSync(trackerFile, JSON.stringify(newData, null, 2), 'utf-8');
    }

}
