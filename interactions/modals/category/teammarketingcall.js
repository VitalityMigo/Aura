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
const { profileData, accessSql, adminsql, reportsql, sequelize } = require('../../../events/database');
const moment = require('moment');

const { registerFont, createCanvas, loadImage } = require('canvas');

registerFont("./visual/rollschasers/font/sftransrobotic.ttf", { family: "SFTransrobotic" })
registerFont("./visual/aura/font/opt.ttf", { family: "opt" })
registerFont("./visual/embassy/font/akira.ttf", { family: "EmbassyGothic" })



const capFirstLetter = require("../../../functions/capfirstletter")


const buttonRowAdminDashboard = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('teamDashboardGiveaway-button')
            .setLabel('giveaway')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('teamDashboardCall-button')
            .setLabel('call')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('adminDashboardMenu-button')
            .setLabel('menu')
            .setStyle(2),
    )




module.exports = {
    id: "teamDashboardCall-modal",

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

            const authorProfile = await profileData.findOne({ where: { authorId: authorId } })

            if (authorProfile === null) { await interaction.deferReply(); } else {
                const authorPrivacyMode = authorProfile.dataValues.privacyMode

                if (authorPrivacyMode.toLowerCase() === "private") { await interaction.deferReply({ ephemeral: true }); }
                if (authorPrivacyMode.toLowerCase() === "public") { await interaction.deferReply(); }
            }

            //Checkpoint
            console.log("// Step 2 : Authorization - Executed ✅")


            const project = interaction.fields.getTextInputValue('teamDashboardCallR1');
            const callFp = interaction.fields.getTextInputValue('teamDashboardCallR2');
            const projectsAth = interaction.fields.getTextInputValue('teamDashboardCallR3');
            const callerId = interaction.fields.getTextInputValue('teamDashboardCallR4');

            const callerInfos = await interaction.guild.members.fetch(callerId);
            let callerUsername = callerInfos.user.username
            let callerAvatar = `https://cdn.discordapp.com/avatars/${callerId}/${callerInfos.user.avatar}.png?size=4096`;

            let profit = projectsAth - callFp
            let profitSign = "+"
            if (profit < 0) { profitSign = "" }


            if (serverId === "949291624389816331") {





                const templateOneCollection = await loadImage("./visual/rollschasers/permanent/callprofit.png");

                const canvasFormatted = createCanvas(1000, 1000);
                const ctxFormatted = canvasFormatted.getContext('2d');

                ctxFormatted.drawImage(templateOneCollection, 0, 0, canvasFormatted.width, canvasFormatted.height); // Ajouter l'image de fond au canvas



                //Call FP
                ctxFormatted.font = "bold 38px Futura";
                ctxFormatted.fillStyle = "#E5EAFF";
                const callFpText = ctxFormatted.measureText(parseFloat(callFp).toFixed(3) + "Ξ").width
                ctxFormatted.fillText(parseFloat(callFp).toFixed(3) + "Ξ", 198 - (callFpText / 2), 780);

                //WL COUNT
                ctxFormatted.font = "bold 38px Futura";
                ctxFormatted.fillStyle = "#E5EAFF";
                const callATHText = ctxFormatted.measureText(parseFloat(projectsAth).toFixed(3) + "Ξ").width
                ctxFormatted.fillText(parseFloat(projectsAth).toFixed(3) + "Ξ", 818 - (callATHText / 2), 467);



                ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////




                //WL COUNT
                ctxFormatted.font = "bold 75px SFTransrobotic";
                if (profit >= 0) { ctxFormatted.fillStyle = "#00db00"; } else if (profit < 0) { ctxFormatted.fillStyle = "#e60015"; }
                const profitText = ctxFormatted.measureText(profitSign + parseFloat(profit).toFixed(3) + "Ξ").width
                ctxFormatted.fillText(profitSign + parseFloat(profit).toFixed(3) + "Ξ", 769 - (profitText / 2), 784);




                //NOM COLLECTION
                const MAX_WIDTH = 515;
                let fontSize = 28;
                const targetHeight = 400;

                ctxFormatted.fillStyle = "rgba(255, 255, 255, 0.93)";
                ctxFormatted.font = `bold ${fontSize}px Futura`;
                let collectionNameTextSize = ctxFormatted.measureText(project.toUpperCase()).width;

                while (collectionNameTextSize > MAX_WIDTH) {
                    fontSize -= 1;
                    ctxFormatted.font = `bold ${fontSize}px Futura`;
                    collectionNameTextSize = ctxFormatted.measureText(project.toUpperCase()).width;
                }

                ctxFormatted.font = `bold ${fontSize}px Futura`;
                ctxFormatted.textBaseline = "middle";
                ctxFormatted.fillText(project.toUpperCase(), 500 - collectionNameTextSize / 2, 303);





                //NOM USER
                ctxFormatted.textBaseline = "alphabetic";
                ctxFormatted.font = "bold 40px SFTransrobotic";
                ctxFormatted.fillStyle = "#ffffff";
                const callerNameSize = ctxFormatted.measureText(callerUsername.toUpperCase()).width;
                ctxFormatted.fillText(callerUsername.toUpperCase(), 920 - callerNameSize, 950);


                // Dessin du cercle de découpe
                const imagesize = 50;
                const imagex = 920 - callerNameSize - 67
                const imagey = 913;
                const profileImage = await loadImage(callerAvatar);
                ctxFormatted.beginPath();
                ctxFormatted.arc(imagex + imagesize / 2, imagey + imagesize / 2, imagesize / 2, 0, Math.PI * 2, true);
                ctxFormatted.lineWidth = 2.15;
                ctxFormatted.strokeStyle = "#ffffff";
                ctxFormatted.stroke();
                ctxFormatted.closePath();
                ctxFormatted.clip();
                ctxFormatted.drawImage(profileImage, imagex, imagey, imagesize, imagesize);
                ctxFormatted.beginPath();
                ctxFormatted.arc(imagex + imagesize / 2, imagey + imagesize / 2, imagesize / 2 + 0.25, 0, Math.PI * 2, true);




                // Dessiner l'image de profil sur le canvas
                const buffer2 = canvasFormatted.toBuffer('image/png');

                await interaction.editReply({ files: [buffer2] })



            } else if (serverId === "944918328135286804") {




                const templateOneCollection = await loadImage("./visual/embassy/permanent/callprofit.png");

                const canvasFormatted = createCanvas(1000, 1000);
                const ctxFormatted = canvasFormatted.getContext('2d');

                ctxFormatted.drawImage(templateOneCollection, 0, 0, canvasFormatted.width, canvasFormatted.height); // Ajouter l'image de fond au canvas


                //Call FP
                ctxFormatted.font = "bold 38px akira";
                ctxFormatted.fillStyle = "#E5EAFF";
                const callFpText = ctxFormatted.measureText(parseFloat(callFp).toFixed(3) + "Ξ").width
                ctxFormatted.fillText(parseFloat(callFp).toFixed(3) + "Ξ", 202 - (callFpText / 2), 770);

                //WL COUNT
                ctxFormatted.font = "bold 38px akira";
                ctxFormatted.fillStyle = "#E5EAFF";
                const callATHText = ctxFormatted.measureText(parseFloat(projectsAth).toFixed(3) + "Ξ").width
                ctxFormatted.fillText(parseFloat(projectsAth).toFixed(3) + "Ξ", 498 - (callATHText / 2), 770);


                //WL COUNT
                ctxFormatted.font = "bold 38px akira";
                if (profit >= 0) { ctxFormatted.fillStyle = "#00db00"; } else if (profit < 0) { ctxFormatted.fillStyle = "#e60015"; }
                const profitText = ctxFormatted.measureText(profitSign + parseFloat(profit).toFixed(3) + "Ξ").width
                ctxFormatted.fillText(profitSign + parseFloat(profit).toFixed(3) + "Ξ", 774 - (profitText / 2), 770);



                //NOM COLLECTION
                const MAX_WIDTH = 515;
                let fontSize = 30;
                const targetHeight = 400;


                ctxFormatted.fillStyle = "#ffffff";
                ctxFormatted.font = `bold ${fontSize}px akira`;
                let collectionNameTextSize = ctxFormatted.measureText(project.toUpperCase()).width;

                while (collectionNameTextSize > MAX_WIDTH) {
                    fontSize -= 1;
                    ctxFormatted.font = `bold ${fontSize}px akira`;
                    collectionNameTextSize = ctxFormatted.measureText(project.toUpperCase()).width;
                }

                ctxFormatted.font = `bold ${fontSize}px akira`;
                ctxFormatted.textBaseline = "middle";
                ctxFormatted.fillText(project.toUpperCase(), 500 - collectionNameTextSize / 2, 302);


                //NOM USER
                ctxFormatted.textBaseline = "alphabetic";
                ctxFormatted.font = "bold 42px akira";
                ctxFormatted.fillStyle = "#ffffff";
                ctxFormatted.fillText(callerUsername.toUpperCase(), 392, 593);


                // Dessin du cercle de découpe
                const imagesize = 205.5;
                const imagex = 139 
                const imagey = 465;
                const profileImage = await loadImage(callerAvatar);
                ctxFormatted.beginPath();
                ctxFormatted.arc(imagex + imagesize / 2, imagey + imagesize / 2, imagesize / 2, 0, Math.PI * 2, true);
                ctxFormatted.closePath();
                ctxFormatted.clip();
                ctxFormatted.drawImage(profileImage, imagex, imagey, imagesize, imagesize);
                ctxFormatted.beginPath();
                ctxFormatted.arc(imagex + imagesize / 2, imagey + imagesize / 2, imagesize / 2 + 0.25, 0, Math.PI * 2, true);




                // Dessiner l'image de profil sur le canvas
                const buffer2 = canvasFormatted.toBuffer('image/png');

                await interaction.editReply({ files: [buffer2] })








            } else {







                const templateOneCollection = await loadImage("./visual/aura/permanent/callprofit.png");

                const canvasFormatted = createCanvas(1000, 1000);
                const ctxFormatted = canvasFormatted.getContext('2d');

                ctxFormatted.drawImage(templateOneCollection, 0, 0, canvasFormatted.width, canvasFormatted.height); // Ajouter l'image de fond au canvas



                //WL COUNT
                ctxFormatted.font = "600 42px 'Fira Code'";
                ctxFormatted.fillStyle = "#ffffff";
                const callFpSize = ctxFormatted.measureText(parseFloat(callFp).toFixed(3) + "Ξ").width
                ctxFormatted.fillText(parseFloat(callFp).toFixed(3) + "Ξ", 270 - callFpSize / 2, 472);

                //WL COUNT
                ctxFormatted.font = "600 42px 'Fira Code'";
                ctxFormatted.fillStyle = "#ffffff";
                const athSize = ctxFormatted.measureText(parseFloat(projectsAth).toFixed(3) + "Ξ").width
                ctxFormatted.fillText(parseFloat(projectsAth).toFixed(3) + "Ξ", 730 - athSize / 2, 472);


                ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


                 //WL COUNT
                 ctxFormatted.font = "60px opt";
                 if (profit >= 0) { ctxFormatted.fillStyle = "#00db00"; } else if (profit < 0) { ctxFormatted.fillStyle = "#e60015"; }
                 const profitText = ctxFormatted.measureText(profitSign + parseFloat(profit).toFixed(3) + "Ξ").width
                 ctxFormatted.fillText(profitSign + parseFloat(profit).toFixed(3) + "Ξ", 500 - (profitText / 2), 800);
 
 

                //NOM COLLECTION
                const MAX_WIDTH = 515;
                let fontSize = 33;
                const targetHeight = 400;


                ctxFormatted.fillStyle = "rgba(255, 255, 255, 0.93)";
                ctxFormatted.font = `800 ${fontSize}px 'Fira Code'`;
                let collectionNameTextSize = ctxFormatted.measureText(project.toUpperCase()).width;

                while (collectionNameTextSize > MAX_WIDTH) {
                    fontSize -= 1;
                    ctxFormatted.font = `800 ${fontSize}px 'Fira Code'`;
                    collectionNameTextSize = ctxFormatted.measureText(project.toUpperCase()).width;
                }

                ctxFormatted.font = `800 ${fontSize}px 'Fira Code'`;
                ctxFormatted.textBaseline = "middle";
                ctxFormatted.fillText(project.toUpperCase(), 500 - collectionNameTextSize / 2, 314);




                  //NOM COLLECTION
                  const MAX_WIDTH2 = 335;
                  let fontSize2 = 40;
  
  
                  ctxFormatted.fillStyle = "rgba(255, 255, 255, 0.93)";
                  ctxFormatted.font = `700 ${fontSize2}px 'Fira Code'`;
                  let collectionNameTextSize2 = ctxFormatted.measureText(capFirstLetter(callerUsername)).width;
  
                  while (collectionNameTextSize2 > MAX_WIDTH2) {
                    fontSize2 -= 1;
                      ctxFormatted.font = `700 ${fontSize2}px 'Fira Code'`;
                      collectionNameTextSize2 = ctxFormatted.measureText(capFirstLetter(callerUsername)).width;
                  }
  
                  ctxFormatted.font = `700 ${fontSize2}px 'Fira Code'`;
                  ctxFormatted.fillText(capFirstLetter(callerUsername), 600, 919.5);
  
  


              

                //NOM USER
                // ctxFormatted.textBaseline = "alphabetic";
                // ctxFormatted.font = "700 40px 'Fira Code'";
                // ctxFormatted.fillStyle = "#ffffff";
                // const userNameSize = ctxFormatted.measureText(capFirstLetter(callerUsername)).width;
                // ctxFormatted.fillText(capFirstLetter(callerUsername), 600, 938);


                // Dessin du cercle de découpe
                const imagesize = 70;
                const imagex = 510
                const imagey = 884.5;
                const profileImage = await loadImage(callerAvatar);
                ctxFormatted.beginPath();
                ctxFormatted.arc(imagex + imagesize / 2, imagey + imagesize / 2, imagesize / 2, 0, Math.PI * 2, true);
                ctxFormatted.lineWidth = 2.15;
                ctxFormatted.strokeStyle = "#ffffff";
                ctxFormatted.stroke();
                ctxFormatted.closePath();
                ctxFormatted.clip();
                ctxFormatted.drawImage(profileImage, imagex, imagey, imagesize, imagesize);
                ctxFormatted.beginPath();
                ctxFormatted.arc(imagex + imagesize / 2, imagey + imagesize / 2, imagesize / 2 + 0.25, 0, Math.PI * 2, true);





                // Dessiner l'image de profil sur le canvas
                const buffer2 = canvasFormatted.toBuffer('image/png');

                await interaction.editReply({ files: [buffer2] })







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
            let reportCommand = "/teammarketingcall-modal"

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
