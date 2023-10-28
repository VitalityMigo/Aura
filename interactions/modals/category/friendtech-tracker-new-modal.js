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


const axios = require('axios');
const fs = require("fs")

const trackerFile = "contracts/friendtech/tracker.json"


function removeAtSymbol(word) {
    if (word.startsWith('@')) {
        return word.slice(1); // Supprime le "@" en prenant une sous-chaîne à partir du deuxième caractère.
    } else {
        return word; // Retourne le mot tel quel s'il n'y a pas de "@".
    }
}




module.exports = {
    id: "friendtechtrackerinfra-newtracker-modal",

    async execute(interaction) {


        //Récupérer informations de l'utilisateur de la commande
        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id
        let botId = interaction.applicationId

        await interaction.deferReply({ ephemeral: true })

        try {


            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")
            //Checkpoint
            console.log("// Step 2 : Authorization - Executed ✅")

            //Récupère le password donné par l'utilisateur
            const inputRawUsernames = interaction.fields.getTextInputValue('friendtechtrackerinfra-newtracker-modalR1');

            const separators = /[,\/:;-\s]/;  // Ajout de \s pour représenter l'espace
            const usernameListRaw1 = inputRawUsernames.split(separators);
            const usernameListRaw2 = usernameListRaw1.filter(item => item !== '');

            const usernameList = [...new Set(usernameListRaw2.map(item => item.toLowerCase()))];
            const userCount = usernameList.length

            let isEnough = true


            if (userCount > 0) {


                const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Friend.Tech Tracker")
                    .setDescription("Adding `" + userCount + "` users to your Friend Tech tracker, please hold on for few seconds <a:AuraLoading:1134068847616458792>\n\n**→ Added**`0` **out of** `" + userCount + "` **users.**")
                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                await interaction.editReply({ embeds: [errorNotEthereum], components: [], ephemeral: true });

                const userTrackers = await tracker_friendTech.findAll({ where: { authorId: authorId } })
                const trackerCount = userTrackers.length
                const trackerLeft = 25 - trackerCount
                const alreadyRegistered = userTrackers.map(obj => obj.dataValues.subjectUsername.toLowerCase())

                const filteredListRaw = usernameList.slice(0, trackerLeft)
                const filteredList = filteredListRaw.filter(obj => !alreadyRegistered.includes(obj.toLowerCase()))



                let added = 0
                let index = 0
                let userFormatted = ""
                let isDone = false

                if (filteredList.length > 0) {

                    for (const obj of filteredList) {

                        index++
                        try {

                            const objForm = removeAtSymbol(obj)

                            let user
                            let isValid = true

                            try {
                                user = await axios.get("https://prod-api.kosetto.com/twitter-users/" + objForm)
                            } catch (error) {
                                isValid = false

                            }

                            if (isValid == true && user) {

                                const address = user.data.address.toLowerCase()
                                const username = user.data.twitterUsername.toLowerCase()
                                const name = user.data.twitterName
                                const pfp = user.data.twitterPfpUrl


                                tracker_friendTech.create({
                                    authorName: authorName,
                                    authorId: authorId,
                                    subjectUsername: username,
                                    subjectName: name,
                                    subjectWallet: address,
                                    subjectPfp: pfp,
                                })

                                pushAddress(address, username, authorId)

                                added++

                                const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Friend.Tech Tracker")
                                    .setDescription("Adding `" + userCount + "` users to your Friend Tech tracker, please hold on for few seconds <a:AuraLoading:1134068847616458792>\n\n**→ Added**`" + added + "` **out of** `" + userCount + "` **users.**")
                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setTimestamp()
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [errorNotEthereum], components: [], ephemeral: true });

                                // On formatte pour la réponse
                                if (added == 1) {
                                    userFormatted += username
                                } else {
                                    userFormatted += " • " + username
                                }


                            }

                            if (index == filteredList.length) {
                                isDone = true
                            }


                        } catch (error) { }

                    }

                } else { isEnough = false }


                if (isEnough == true) {

                    let answered = false

                    while (isDone == true && answered == false) {

                        if (answered == false) {
                            answered = true

                            const errorNotEthereum2 = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Friend.Tech Tracker")
                                .setDescription("Successfuly added `" + added + "` users out of `" + userCount + "` to your tracker ✅.")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .addFields(
                                    { name: "List", value: "```" + userFormatted + "```", inline: true },
                                    { name: " ", value: " ", inline: false },
                                    { name: " ", value: "**→ Please open your DMs to receive the alerts**", inline: false },

                                )
                                .setTimestamp()
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.editReply({ embeds: [errorNotEthereum2], components: [], ephemeral: true });

                        } else {
                            break
                        }

                    }


                } else {

                    const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Friend.Tech Tracker")
                        .setDescription("The input provided contains `0` valid and not registered twitter username, please try again providing at least `1` Twitter username")
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.editReply({ embeds: [errorNotEthereum], components: [], ephemeral: true });


                }




            } else {


                const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Friend.Tech Tracker")
                    .setDescription("The input provided contains `0` valid and not registered twitter username, please try again providing at least `1` Twitter username")
                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                await interaction.editReply({ embeds: [errorNotEthereum], components: [], ephemeral: true });



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



// Function



function pushAddress(address, username, authorId) {
    let existingData = []
    if (fs.existsSync(trackerFile)) {
        const fileContent = fs.readFileSync(trackerFile, 'utf8');
        existingData = JSON.parse(fileContent);
    }

    existingData.push({
        username: username.toLowerCase(),
        address: address.toLowerCase(),
        author: authorId,
    }
    );

    // Écrivez le fichier JSON avec la nouvelle liste
    fs.writeFileSync(trackerFile, JSON.stringify(existingData, null, 2));
}


