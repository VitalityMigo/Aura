
/**
 * @file Sample button interaction
 * @author JAYZHVJ
 * @since 3.0.0
 * @version 3.2.2
 */

/**
 * @type {import('../../../typings').ButtonInteractionCommand}
 */






const { registerFont, createCanvas, loadImage } = require('canvas');
const { ButtonInteraction } = require('discord.js');
const { EmbedBuilder } = require("discord.js");
const { accessSql, profileData, adminsql, reportsql, sequelize } = require('../../../events/database');
const moment = require('moment');

const capFirstLetter = require("../../../functions/capfirstletter")




module.exports = {
    id: 'userBrandingIdentity-button',

    async execute(interaction) {
        if (!(interaction instanceof ButtonInteraction)) return;

        console.log("1")

        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096?size=4096`;
        let serverId = interaction.member.guild.id


        try {

        //Checkpoint
        console.log("// Step 1 : Initialization - Executed ✅")



        if (interaction.message.interaction.user.id === authorId) {


            //Checkpoint
            console.log("// Step 2 : Authorization - Executed ✅")


            const authorProfile = await profileData.findOne({ where: { authorId: authorId } })
            const serverProfile = await accessSql.findOne({ where: { serverId: serverId } })


            if (authorProfile === null) { await interaction.deferReply(); } else {
                const authorPrivacyMode = authorProfile.dataValues.privacyMode

                if (authorPrivacyMode.toLowerCase() === "private") { await interaction.deferReply({ ephemeral: true }); }
                if (authorPrivacyMode.toLowerCase() === "public") { await interaction.deferReply(); }
            }


            const userName = (authorProfile.dataValues.authorName)
            const userSpeciality = (authorProfile.dataValues.authorNature).split(' ')[0];
            const userRoleList = interaction.member._roles
            const userLogo = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096?size=4096`;
            const adminRoleId = serverProfile.dataValues.adminRoleId
            const memberRoleId = serverProfile.dataValues.memberRoleId
            const idPartOne = (authorId.toString()).slice(0, 3); // récupérer les 3 premiers chiffres
            const idPartTwo = (authorId.toString()).slice(-3); // récupérer les 3 derniers chiffres

            const userIdentityId = "0x" + idPartTwo + idPartOne
            let userHighestRole = "Member"

            if (userRoleList.includes(adminRoleId)) { userHighestRole = "Team" }




            if (serverId === "949291624389816331") {



                registerFont("./visual/rollschasers/font/sftransrobotic.ttf", { family: "SFTransrobotic" })

                const canvasFormatted = createCanvas(1000, 585.38);
                const ctxFormatted = canvasFormatted.getContext('2d');

                const templateIdentityCard = await loadImage("./visual/rollschasers/permanent/identitycard.png");
                ctxFormatted.drawImage(templateIdentityCard, 0, 0, canvasFormatted.width, canvasFormatted.height); // Ajouter l'image de fond au canvas




                //NAME
                ctxFormatted.font = "bold 34px SFTransrobotic";
                ctxFormatted.fillStyle = "#ffffff";
                ctxFormatted.fillText(userName.toString(), 376, 189);

                //ID
                ctxFormatted.font = "bold 34px SFTransrobotic";
                ctxFormatted.fillStyle = "#ffffff";
                ctxFormatted.fillText(userIdentityId.toString(), 376, 265);

                //CLASS
                ctxFormatted.font = "bold 34px SFTransrobotic";
                ctxFormatted.fillStyle = "#ffffff";
                ctxFormatted.fillText(userSpeciality.toString(), 376, 340);

                //SPECIALITY
                ctxFormatted.font = "bold 34px SFTransrobotic";
                ctxFormatted.fillStyle = "#ffffff";
                ctxFormatted.fillText(userHighestRole.toString(), 376, 415);



                //PROFILE PICTURE

                // Dessin du cercle de découpe
                const profileImage = await loadImage(userLogo);
                const imagesize = 263.6;
                const imagex = 654.1;
                const imagey = 161;
                ctxFormatted.drawImage(profileImage, imagex, imagey, imagesize, imagesize - 2.1);





                // Dessiner l'image de profil sur le canvas
                const buffer2 = canvasFormatted.toBuffer('image/png');

                await interaction.editReply({ files: [buffer2] })





            } else {

                registerFont("./visual/aura/font/firacode.ttf", { family: "FiraCode" })


                const canvasFormatted = createCanvas(1000, 585.38);
                const ctxFormatted = canvasFormatted.getContext('2d');

                const templateIdentityCard = await loadImage("./visual/aura/permanent/identitycard.png");
                ctxFormatted.drawImage(templateIdentityCard, 0, 0, canvasFormatted.width, canvasFormatted.height); // Ajouter l'image de fond au canvas




                //NAME
                ctxFormatted.font = "600 30px 'Fira Code'";
                ctxFormatted.fillStyle = "#ffffff";
                ctxFormatted.fillText(capFirstLetter(userName.toString()), 366, 220);

                //ID
                ctxFormatted.font = "600 30px 'Fira Code'";
                ctxFormatted.fillStyle = "#ffffff";
                ctxFormatted.fillText(userSpeciality.toString(), 366, 312);

                //SPECIALITY
                ctxFormatted.font = "600 30px 'Fira Code'";
                ctxFormatted.fillStyle = "#ffffff";
                ctxFormatted.fillText(userHighestRole.toString(), 366, 405);



                //PROFILE PICTURE
                const profileImage = await loadImage(userLogo);
                const imageSize = 263.6;
                const imageX = 644;
                const imageY = 168;
                const cornerRadius = 25.56;

                // Sauvegarde l'état du contexte pour l'ombre
                ctxFormatted.save();

                // Applique l'ombre aux propriétés du contexte
                ctxFormatted.shadowOffsetX = -4;
                ctxFormatted.shadowOffsetY = 6;
                ctxFormatted.shadowBlur = 95;
                ctxFormatted.shadowColor = "#242323";
                ctxFormatted.globalAlpha = 0.6;

                // Dessine le cercle de découpe avec l'ombre
                ctxFormatted.beginPath();
                ctxFormatted.moveTo(imageX + cornerRadius, imageY);
                ctxFormatted.arcTo(imageX + imageSize, imageY, imageX + imageSize, imageY + cornerRadius, cornerRadius);
                ctxFormatted.arcTo(imageX + imageSize, imageY + imageSize, imageX + imageSize - cornerRadius, imageY + imageSize, cornerRadius);
                ctxFormatted.arcTo(imageX, imageY + imageSize, imageX, imageY + imageSize - cornerRadius, cornerRadius);
                ctxFormatted.arcTo(imageX, imageY, imageX + cornerRadius, imageY, cornerRadius);
                ctxFormatted.closePath();
                ctxFormatted.clip();
                ctxFormatted.drawImage(profileImage, imageX, imageY, imageSize, imageSize - 2.1);

                // Restaure l'état du contexte pour supprimer l'ombre de tout autre dessin
                ctxFormatted.restore();

                // Dessin de l'image sans ombre
                ctxFormatted.beginPath();
                ctxFormatted.moveTo(imageX + cornerRadius, imageY);
                ctxFormatted.arcTo(imageX + imageSize, imageY, imageX + imageSize, imageY + cornerRadius, cornerRadius);
                ctxFormatted.arcTo(imageX + imageSize, imageY + imageSize, imageX + imageSize - cornerRadius, imageY + imageSize, cornerRadius);
                ctxFormatted.arcTo(imageX, imageY + imageSize, imageX, imageY + imageSize - cornerRadius, cornerRadius);
                ctxFormatted.arcTo(imageX, imageY, imageX + cornerRadius, imageY, cornerRadius);
                ctxFormatted.closePath();
                ctxFormatted.clip();
                ctxFormatted.drawImage(profileImage, imageX, imageY, imageSize, imageSize - 2.1);




                // Dessiner l'image de profil sur le canvas
                const buffer2 = canvasFormatted.toBuffer('image/png');

                await interaction.editReply({ files: [buffer2] })






            }
        } else {

            const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                .setTitle("Bot Access")
                .setAuthor({ name: authorName, iconURL: userAvatar })
                .setDescription("This button is not for you. You can only click on buttons generated by your commands. Please try again with your personal data.")
                .setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
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
            let reportCommand = "/user-brandingIdentity"

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
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


            await channel.send({ embeds: [updateEmbed] });



            const errorAnswerUser = new EmbedBuilder().setColor("#060A8F")
                .setTitle("An error occured")
                .setDescription("An error has occurred while executing this command. These errors can occur for a variety of reasons, such as :\n∙ Unexpected traffic\n∙ API maintenance\n∙ Occasional bug\n\nPlease note that a report has already been sent to our team, who will fix the problem as soon as possible. You can still use `/report` to give more details about the error and help our team.")
                .setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
                .setTimestamp()
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


            await interaction.editReply({ embeds: [errorAnswerUser], ephemeral: true });


        }
    },
};




