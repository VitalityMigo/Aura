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
    id: "teamDashboardGiveaway-modal",

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


            const authorProfile = await profileData.findOne({ where: { authorId: authorId } })

            if (authorProfile === null) { await interaction.deferReply(); } else {
                const authorPrivacyMode = authorProfile.dataValues.privacyMode

                if (authorPrivacyMode.toLowerCase() === "private") { await interaction.deferReply({ ephemeral: true }); }
                if (authorPrivacyMode.toLowerCase() === "public") { await interaction.deferReply(); }
            }


            //On récupère les valeurs remplis dans le modal
            const project = interaction.fields.getTextInputValue('teamDashboardGiveawayR1');
            const whitelists = interaction.fields.getTextInputValue('teamDashboardGiveawayR2');
            const projectsAth = interaction.fields.getTextInputValue('teamDashboardGiveawayR3');
            const mintPrice = interaction.fields.getTextInputValue('teamDashboardGiveawayR4');

            const potentialProfit = parseFloat((projectsAth - mintPrice) * whitelists).toFixed(3)


            if (serverId === "949291624389816331") {



                const templateOneCollection = await loadImage("./visual/rollschasers/permanent/giveawayprofit.png");

                const canvasFormatted = createCanvas(1000, 1000);
                const ctxFormatted = canvasFormatted.getContext('2d');

                ctxFormatted.drawImage(templateOneCollection, 0, 0, canvasFormatted.width, canvasFormatted.height); // Ajouter l'image de fond au canvas



                //WL COUNT
                ctxFormatted.font = "bold 33px Futura";
                ctxFormatted.fillStyle = "#ffffff";
                ctxFormatted.fillText(whitelists.toString(), 480, 430);

                //WL COUNT
                ctxFormatted.font = "bold 33px Futura";
                ctxFormatted.fillStyle = "#ffffff";
                ctxFormatted.fillText(parseFloat(mintPrice).toFixed(3) + "Ξ", 480, 531);

                //WL COUNT
                ctxFormatted.font = "bold 33px Futura";
                ctxFormatted.fillStyle = "#ffffff";
                ctxFormatted.fillText(parseFloat(projectsAth).toFixed(3) + "Ξ", 480, 632);


                ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////




                //Potential PROFIT
                ctxFormatted.font = "bold 70px SFTransrobotic";
                if (potentialProfit >= 0) { ctxFormatted.fillStyle = "#00db00"; } else if (potentialProfit < 0) { ctxFormatted.fillStyle = "#e60015"; }
                const potentialProfitText = ctxFormatted.measureText((parseFloat(potentialProfit).toFixed(3)).toString() + "Ξ").width
                ctxFormatted.fillText(potentialProfit.toString() + "Ξ", 500 - potentialProfitText / 2, 852);


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
                ctxFormatted.font = "bold 32px SFTransrobotic";
                ctxFormatted.fillStyle = "#ffffff";
                const userNameSize = ctxFormatted.measureText("Group Profits").width;
                ctxFormatted.fillText("Group Profits", 779.5, 982);


                // Dessin du cercle de découpe
                const imagesize = 33;
                const imagex = 737.5
                const imagey = 957;
                const profileImage = await loadImage("https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png");
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




                    const templateOneCollection = await loadImage("./visual/embassy/permanent/giveawayprofit.png");

                    const canvasFormatted = createCanvas(1000, 1000);
                    const ctxFormatted = canvasFormatted.getContext('2d');
    
                    ctxFormatted.drawImage(templateOneCollection, 0, 0, canvasFormatted.width, canvasFormatted.height); // Ajouter l'image de fond au canvas
    
    
    
                    //WL COUNT
                    ctxFormatted.font = "bold 40px akira";
                    ctxFormatted.fillStyle = "#ffffff";
                    const wlCountText = ctxFormatted.measureText(whitelists.toString()).width
                    ctxFormatted.fillText(whitelists.toString(), 275 - (wlCountText/2), 426);
    
                    //WL COUNT
                    ctxFormatted.font = "bold 40px akira";
                    ctxFormatted.fillStyle = "#ffffff";
                    const mintPricetText = ctxFormatted.measureText(parseFloat(mintPrice).toFixed(3) + "Ξ").width
                    ctxFormatted.fillText(parseFloat(mintPrice).toFixed(3) + "Ξ", 716 - (mintPricetText / 2), 426);
    
                    //WL COUNT
                    ctxFormatted.font = "bold 40px akira";
                    ctxFormatted.fillStyle = "#ffffff";
                    const athText = ctxFormatted.measureText(parseFloat(projectsAth).toFixed(3) + "Ξ").width
                    ctxFormatted.fillText(parseFloat(projectsAth).toFixed(3) + "Ξ", 275 - athText/2, 694);
    
    
    
                    //Potential PROFIT
                    ctxFormatted.font = "bold 40px akira";
                    if (potentialProfit >= 0) { ctxFormatted.fillStyle = "#00db00"; } else if (potentialProfit < 0) { ctxFormatted.fillStyle = "#e60015"; }
                    const potentialProfitText = ctxFormatted.measureText((parseFloat(potentialProfit).toFixed(3)).toString() + "Ξ").width
                    ctxFormatted.fillText(potentialProfit.toString() + "Ξ", 716 - potentialProfitText / 2, 694);
    
    
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
    
    
    
    
    
    
                    // Dessiner l'image de profil sur le canvas
                    const buffer2 = canvasFormatted.toBuffer('image/png');
    
                    await interaction.editReply({ files: [buffer2] })
    
    



            } else {


                const templateOneCollection = await loadImage("./visual/aura/permanent/giveawayprofit.png");

                const canvasFormatted = createCanvas(1000, 1000);
                const ctxFormatted = canvasFormatted.getContext('2d');

                ctxFormatted.drawImage(templateOneCollection, 0, 0, canvasFormatted.width, canvasFormatted.height); // Ajouter l'image de fond au canvas



                //WL COUNT
                ctxFormatted.font = "600 42px 'Fira Code'";
                ctxFormatted.fillStyle = "#ffffff";
                const wlSize = ctxFormatted.measureText(whitelists.toString()).width
                ctxFormatted.fillText(whitelists.toString(), 195 - wlSize / 2, 472);

                //WL COUNT
                ctxFormatted.font = "600 42px 'Fira Code'";
                ctxFormatted.fillStyle = "#ffffff";
                const mintSize = ctxFormatted.measureText(parseFloat(mintPrice).toFixed(3) + "Ξ").width
                ctxFormatted.fillText(parseFloat(mintPrice).toFixed(3) + "Ξ", 500 - mintSize / 2, 472);

                //WL COUNT
                ctxFormatted.font = "600 42px 'Fira Code'";
                ctxFormatted.fillStyle = "#ffffff";
                const athSize = ctxFormatted.measureText(parseFloat(projectsAth).toFixed(3) + "Ξ").width
                ctxFormatted.fillText(parseFloat(projectsAth).toFixed(3) + "Ξ", 805 - athSize / 2, 472);


                ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////




                //Potential PROFIT
                ctxFormatted.font = "60px opt";
                if (potentialProfit >= 0) { ctxFormatted.fillStyle = "#00db00"; } else if (potentialProfit < 0) { ctxFormatted.fillStyle = "#e60015"; }
                const potentialProfitText = ctxFormatted.measureText((parseFloat(potentialProfit).toFixed(3)).toString() + "Ξ").width
                ctxFormatted.fillText(potentialProfit.toString() + "Ξ", 500 - potentialProfitText / 2, 810);


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





                //NOM USER
                ctxFormatted.textBaseline = "alphabetic";
                ctxFormatted.font = "600 25px 'Fira Code'";
                ctxFormatted.fillStyle = "#ffffff";
                const userNameSize = ctxFormatted.measureText("Group Profits").width;
                ctxFormatted.fillText("Group Profits", 779.5, 982);


                // Dessin du cercle de découpe
                const imagesize = 33;
                const imagex = 737.5
                const imagey = 957;
                const profileImage = await loadImage("https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png");
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
            let reportCommand = "/teammarketinggiveaway-modal"

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
