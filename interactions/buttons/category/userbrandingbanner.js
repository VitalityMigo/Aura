
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
const moment = require('moment');

const { registerFont, createCanvas, loadImage } = require('canvas');




module.exports = {
    id: 'userBrandingBanner-button',

    async execute(interaction) {
        if (!(interaction instanceof ButtonInteraction)) return;

        console.log("1")

        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
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




            if (serverId === "949291624389816331") {


                registerFont("./visual/rollschasers/font/sftransrobotic.ttf", { family: "SFTransrobotic" })


                const userIdentityId = "0x" + idPartTwo + idPartOne
                let userHighestRole = "Member"
                if (userRoleList.includes(adminRoleId)) { userHighestRole = "Team" }
                if (userRoleList.includes("949292449367461889")) { userHighestRole = "Founder" }

                //Préparer les lettres du rôle
                let userHighestRoleLetters = []
                for (let i = userHighestRole.length - 1; i >= 0; i--) {
                    userHighestRoleLetters.push(userHighestRole[i]);
                }
                //userName = "Bousculetout"

                //Préparer les lettres du Nom
                let userHighestNameLetters = []
                for (let i = 0; i < userName.length; i++) {
                    userHighestNameLetters.push(userName[i]);
                }

                // ON COMMENCE LE CANVAS

                const canvasFormatted = createCanvas(1500, 500);
                const ctxFormatted = canvasFormatted.getContext('2d');

                const templateIdentityCard = await loadImage("./visual/rollschasers/permanent/identitybanner.png");
                ctxFormatted.drawImage(templateIdentityCard, 0, 0, canvasFormatted.width, canvasFormatted.height); // Ajouter l'image de fond au canvas




                ctxFormatted.font = "bold 60px SFTransrobotic";
                ctxFormatted.fillStyle = "rgba(255, 255, 255, 0.7)"; // blanc opaque à 70%
                ctxFormatted.strokeStyle = "rgba(255, 255, 255, 1)"; // blanc opaque à 100%
                ctxFormatted.lineWidth = 3; // épaisseur de 3px
                ctxFormatted.textAlign = "right"; // aligner le texte à droite
                let letterSize = 0
                let letterX = 849
                let letterY = 289
                let letterSpace = 2.5
                for (const letter of userHighestRoleLetters) {
                    ctxFormatted.fillText(letter.toUpperCase(), letterX, letterY);
                    ctxFormatted.strokeText(letter.toUpperCase(), letterX, letterY);

                    letterSize = ctxFormatted.measureText(letter.toUpperCase()).width + ctxFormatted.lineWidth / 2;
                    letterX -= letterSize + letterSpace
                }
                ctxFormatted.textAlign = "start";

                //////////////////////////////////////////////////////////////////////////////////////////


                ctxFormatted.font = "bold 34px SFTransrobotic";
                ctxFormatted.fillStyle = "#00042D"; // blanc opaque à 70%
                ctxFormatted.strokeStyle = "#BEC9FF"; // blanc opaque à 100%
                ctxFormatted.lineWidth = 5; // épaisseur de 3px
                ctxFormatted.textAlign = "start"; // aligner le texte à droite
                let nameSpace = 2
                const nameTotalSize = ctxFormatted.measureText(userName.toUpperCase()).width + ((userHighestNameLetters.length - 1) * nameSpace) + ((userHighestNameLetters.length * 2) * 1.2)
                let nameSize = 0
                let nameX = 1187 - (nameTotalSize / 2)
                let nameY = 359
                for (const letter of userHighestNameLetters) {

                    ctxFormatted.strokeText(letter.toUpperCase(), nameX, nameY);
                    ctxFormatted.fillText(letter.toUpperCase(), nameX, nameY);

                    nameSize = ctxFormatted.measureText(letter.toUpperCase()).width + ctxFormatted.lineWidth / 2;
                    nameX += nameSize + nameSpace
                }
                ctxFormatted.textAlign = "start";


                // ctxFormatted.fillStyle = "#ffffff"; // blanc opaque à 70%
                // ctxFormatted.fillText(userName.toUpperCase(), 1199 - (nameTotalSize / 2), 430);




                //PROFILE PICTURE
                const profileImage = await loadImage(userLogo);
                const imagesize = 208;
                const imagex = 1083;
                const imagey = 89;
                ctxFormatted.beginPath();
                ctxFormatted.arc(imagex + imagesize / 2, imagey + imagesize / 2, imagesize / 2, 0, Math.PI * 2, true);
                ctxFormatted.closePath();
                ctxFormatted.clip();
                ctxFormatted.drawImage(profileImage, imagex, imagey, imagesize, imagesize);


                // Dessiner l'image de profil sur le canvas
                const buffer2 = canvasFormatted.toBuffer('image/png');

                await interaction.editReply({ files: [buffer2] })





            } else {



               console.log("coming soon")



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
        let reportCommand = "/user-brandingBanner"

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




