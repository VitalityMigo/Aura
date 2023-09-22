
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
const { EmbedBuilder } = require("discord.js");
const { accessSql, profileData, adminsql, reportsql, sequelize } = require('../../../events/database');

const { registerFont, createCanvas, loadImage } = require('canvas');
const moment = require('moment');




module.exports = {
    id: 'userBrandingProfilePicture-button',

    async execute(interaction) {
        if (!(interaction instanceof ButtonInteraction)) return;

        console.log("1")

        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id


        try {



            const authorProfile = await profileData.findOne({ where: { authorId: authorId } })

            if (authorProfile === null) { await interaction.deferReply(); } else {
                const authorPrivacyMode = authorProfile.dataValues.privacyMode

                if (authorPrivacyMode.toLowerCase() === "private") { await interaction.deferReply({ ephemeral: true }); }
                if (authorPrivacyMode.toLowerCase() === "public") { await interaction.deferReply(); }
            }


            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")



            if (interaction.message.interaction.user.id === authorId) {

                //Checkpoint
                console.log("// Step 2 : Authorization - Executed ✅")

                const avatar = await loadImage(`https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`)



                if (serverId === "949291624389816331") {


                    //  || "1071576735298113667"

                    // Récupérer l'image du profil de l'utilisateur

                    const canvasFormatted = createCanvas(4096, 4096);
                    const ctxFormatted = canvasFormatted.getContext('2d');

                    //const avatar = await loadImage(`https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`);
                    const pfpLayer = await loadImage("./visual/rollschasers/permanent/identitypfp.png");



                    const centerX = canvasFormatted.width / 2;
                    const centerY = canvasFormatted.height / 2;
                    const radius = 2048;
                    ctxFormatted.beginPath();
                    ctxFormatted.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
                    ctxFormatted.closePath();
                    ctxFormatted.clip();


                    ctxFormatted.drawImage(avatar, 0, 0, canvasFormatted.width, canvasFormatted.height); // Ajouter l'image de fond au canvas
                    ctxFormatted.drawImage(pfpLayer, 0, 0, canvasFormatted.width, canvasFormatted.height); // Ajouter l'image de fond au canvas
                    // Découpe du cercle et centrage


                    // Dessiner l'image de profil sur le canvas
                    const buffer2 = canvasFormatted.toBuffer('image/png');

                    await interaction.editReply({ files: [buffer2] })




                } else {



                    const canvasFormatted = createCanvas(4096, 4096);
                    const ctxFormatted = canvasFormatted.getContext('2d');

                    // const avatar = await loadImage(`https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`);
                    const pfpLayer = await loadImage("./visual/aura/permanent/identitypfp.png");



                    const centerX = canvasFormatted.width / 2;
                    const centerY = canvasFormatted.height / 2;
                    const radius = 2048;
                    ctxFormatted.beginPath();
                    ctxFormatted.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
                    ctxFormatted.closePath();
                    ctxFormatted.clip();


                    ctxFormatted.drawImage(avatar, 0, 0, canvasFormatted.width, canvasFormatted.height); // Ajouter l'image de fond au canvas
                    ctxFormatted.drawImage(pfpLayer, 0, 0, canvasFormatted.width, canvasFormatted.height); // Ajouter l'image de fond au canvas
                    // Découpe du cercle et centrage


                    // Dessiner l'image de profil sur le canvas
                    const buffer2 = canvasFormatted.toBuffer('image/png');

                    await interaction.editReply({ files: [buffer2] })





                }
            } else {

                console.log("coming soon")



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
            let reportCommand = "/user-brandingPfp"

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


            await interaction.editReply({ embeds: [errorAnswerUser], ephemeral: true });


        }
    },
};




