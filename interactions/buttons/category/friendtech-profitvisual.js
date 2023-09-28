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
const { accessSql, profileData, interactionData, apimonitorsql, adminsql, reportsql, sequelize } = require('../../../events/database');
const moment = require('moment');

const generateRandomString = require('../../../functions/randomkey');
const { registerFont, createCanvas, loadImage } = require('canvas');

registerFont("./visual/rollschasers/font/sftransrobotic.ttf", { family: "SFTransrobotic" })
registerFont("./visual/aura/font/opt.ttf", { family: "opt" })
registerFont("./visual/embassy/font/akira.ttf", { family: "EmbassyGothic" })




const axios = require('axios')



module.exports = {
    id: 'friendtechprofitvisual-button',

    async execute(interaction) {
        if (!(interaction instanceof ButtonInteraction)) return;

        //Récupérer informations de l'utilisateur de la commande
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

                // Prix de l'ETH
                const etherscanTokenPrice = await axios.get('https://api.etherscan.io/api?module=stats&action=ethprice&apikey=RH7J523GC2J7GV34WQGJZQPB8ZWKZP57Y8')
                const ethUsdPrice = etherscanTokenPrice.data.result.ethusd


                //On stock le call API
                const timeStamp = Date.now();
                await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/profit-visual", apiCallName: "ethUsdPrice", apiProvider: "etherscan", timestamp: timeStamp.toString() })



                //RECUPERER STATS PROFIT LAST INTERACTION
                const lastInteractionRcprofit = await interactionData.findOne({ where: { authorId: authorId, commandName: "friendtech-profit", serverId: serverId } })

                let userName = lastInteractionRcprofit.dataValues.collectionName
                let chain = lastInteractionRcprofit.dataValues.walletCategory
                let userLogo = lastInteractionRcprofit.dataValues.collectionBanner
                let selectedTimestamp = lastInteractionRcprofit.dataValues.selecedTimestamp

                let subjectTwitter = lastInteractionRcprofit.dataValues.collectionName
                let sharePrice = lastInteractionRcprofit.dataValues.floorPrice
                let buyCount = lastInteractionRcprofit.dataValues.buyCount
                let tradeCount = lastInteractionRcprofit.dataValues.mintCount
                let soldCount = lastInteractionRcprofit.dataValues.soldCount
                let remaining = lastInteractionRcprofit.dataValues.remaining
                let avgBuy = lastInteractionRcprofit.dataValues.avgBuy
                let avgSold = lastInteractionRcprofit.dataValues.avgSold
                let realisedProfit = lastInteractionRcprofit.dataValues.realisedProfit
                let potentialProfit = lastInteractionRcprofit.dataValues.potentialProfit
                let potentialRoi = lastInteractionRcprofit.dataValues.roi
                let potentialRoiFormatted = "0.00"



                if (potentialRoi !== 0 && avgBuy !== 0 && potentialRoi !== "NaN") {

                    potentialRoiFormatted = parseFloat(potentialRoi).toFixed(2)

                } else if (avgBuy === 0 && (soldCount + remaining > 0)) {


                    roiFormatted = "999"

                } else if (potentialRoi === "NaN") {


                    potentialRoiFormatted = "0.00"

                }


                const privacyBigDataAuthor = await profileData.findOne({ where: { authorId: authorId } })

                let visualSelect = ""
                if (privacyBigDataAuthor !== null) {
                    visualSelect = privacyBigDataAuthor.dataValues.visualSelect
                }


                let sign = "Ξ"

                //₿


                /// SEULEMENT DISPO AVEC LE VISUEL AURA


                const templateOneCollection = await loadImage("./visual/aura/permanent/FTProfittemplate1.png");



                const canvasFormatted = createCanvas(1000, 1000);
                const ctxFormatted = canvasFormatted.getContext('2d');

                ctxFormatted.drawImage(templateOneCollection, 0, 0, canvasFormatted.width, canvasFormatted.height); // Ajouter l'image de fond au canvas



                //MINT COUNT
                ctxFormatted.font = "700 35px 'Fira Code'";
                ctxFormatted.fillStyle = "#E5EAFF";
                const mintCountText = ctxFormatted.measureText(buyCount.toString()).width
                ctxFormatted.fillText(buyCount.toString(), 190 - mintCountText / 2, 420);

                //BUY COUNT
                ctxFormatted.font = "700 35px 'Fira Code'";
                ctxFormatted.fillStyle = "#E5EAFF";
                const buyCountText = ctxFormatted.measureText(tradeCount.toString()).width
                ctxFormatted.fillText(tradeCount.toString(), 498 - buyCountText / 2, 420);

                //AVG BUY
                ctxFormatted.font = "700 35px 'Fira Code'";
                ctxFormatted.fillStyle = "#E5EAFF";
                const avgBuyCountText = ctxFormatted.measureText((parseFloat(avgBuy).toFixed(3)).toString() + sign).width
                ctxFormatted.fillText((parseFloat(avgBuy).toFixed(3)).toString() + sign, 812 - avgBuyCountText / 2, 420);

                //SOLD COUNT
                ctxFormatted.font = "700 35px 'Fira Code'";
                ctxFormatted.fillStyle = "#E5EAFF";
                const soldCountText = ctxFormatted.measureText(soldCount.toString()).width
                ctxFormatted.fillText(soldCount.toString(), 190 - soldCountText / 2, 585);

                //REMAINING
                ctxFormatted.font = "700 35px 'Fira Code'";
                ctxFormatted.fillStyle = "#E5EAFF";
                const remainingText = ctxFormatted.measureText(remaining.toString()).width
                ctxFormatted.fillText(remaining.toString(), 500 - remainingText / 2, 585);

                //AVG SOLD
                ctxFormatted.font = "700 35px 'Fira Code'";
                ctxFormatted.fillStyle = "#E5EAFF";
                const avgSoldText = ctxFormatted.measureText((parseFloat(avgSold).toFixed(3)).toString() + sign).width
                ctxFormatted.fillText((parseFloat(avgSold).toFixed(3)).toString() + sign, 812 - avgSoldText / 2, 585);


                //REALIZED PROFIT
                ctxFormatted.font = "700 35px 'Fira Code'";
                if (realisedProfit >= 0) { ctxFormatted.fillStyle = "#00db00"; } else if (potentialProfit < 0) { ctxFormatted.fillStyle = "#e60015"; }
                const realisedProfitText = ctxFormatted.measureText((parseFloat(realisedProfit).toFixed(3)).toString() + sign).width
                ctxFormatted.fillText(realisedProfit.toString() + sign, 190 - realisedProfitText / 2, 749);

                //Potential PROFIT
                ctxFormatted.font = "700 35px 'Fira Code'";
                if (potentialProfit >= 0) { ctxFormatted.fillStyle = "#00db00"; } else if (potentialProfit < 0) { ctxFormatted.fillStyle = "#e60015"; }
                const potentialProfitText = ctxFormatted.measureText((parseFloat(potentialProfit).toFixed(3)).toString() + sign).width
                ctxFormatted.fillText(potentialProfit.toString() + sign, 500 - potentialProfitText / 2, 749);

                //Potential ROI
                ctxFormatted.font = "700 35px 'Fira Code'";
                if (potentialProfit >= 0) { ctxFormatted.fillStyle = "#00db00"; } else if (potentialProfit < 0) { ctxFormatted.fillStyle = "#e60015"; }
                if (potentialRoiFormatted.toLowerCase() !== "infinity") {
                    const potentialRoiText = ctxFormatted.measureText(potentialRoiFormatted.toString() + "%").width
                    ctxFormatted.fillText(potentialRoiFormatted.toString() + "%", 812 - potentialRoiText / 2, 749);
                } else {
                    const potentialRoiText = ctxFormatted.measureText(potentialRoiFormatted.toString()).width
                    ctxFormatted.fillText(potentialRoiFormatted.toString(), 812 - potentialRoiText / 2, 749);
                }

                ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


                //NOM COLLECTION
                const MAX_WIDTH = 515;
                let fontSize = 33;
                const targetHeight = 400;


                const middleText = "Friend.Tech"

                ctxFormatted.fillStyle = "rgba(255, 255, 255, 0.93)";
                let collectionNameTextSize = ctxFormatted.measureText(middleText.toUpperCase()).width;

                while (collectionNameTextSize > MAX_WIDTH) {
                    fontSize -= 1;
                    ctxFormatted.font = `700 ${fontSize}px 'Fira Code'`;
                    collectionNameTextSize = ctxFormatted.measureText(middleText.toUpperCase()).width;
                }

                ctxFormatted.font = `700 ${fontSize}px 'Fira Code'`;
                ctxFormatted.textBaseline = "middle";
                ctxFormatted.fillText(middleText.toUpperCase(), 500 - collectionNameTextSize / 2, 304);




                const profileImage = await loadImage(userLogo);


                //NOM USER
                const MAX_WIDTH2 = 290;
                let fontSize2 = 21;


                ctxFormatted.fillStyle = "#ffffff";
                let userNameSize = ctxFormatted.measureText(subjectTwitter.toUpperCase()).width;

                while (userNameSize > MAX_WIDTH2) {
                    fontSize2 -= 1;
                    ctxFormatted.font = `${fontSize2}px opt`;
                    userNameSize = ctxFormatted.measureText(subjectTwitter.toUpperCase()).width;
                }




                const imagesize = 50
                const startImageAndName = 792


                let pfpAndNameSize = ctxFormatted.measureText(imagesize + 8 + subjectTwitter.toUpperCase()).width;

                ctxFormatted.font = `${fontSize2}px opt`;
                ctxFormatted.textBaseline = "middle";
                ctxFormatted.fillText(subjectTwitter.toUpperCase(), startImageAndName + imagesize + 12 - (pfpAndNameSize / 2), 969);


                const imagex = startImageAndName - (pfpAndNameSize / 2)
                const imagey = 944;


                // Dessin du cercle de découpe
                ctxFormatted.beginPath();
                ctxFormatted.arc(imagex + imagesize / 2, imagey + imagesize / 2, imagesize / 2, 0, Math.PI * 2, true);
                ctxFormatted.closePath();
                ctxFormatted.clip();

                ctxFormatted.drawImage(profileImage, imagex, imagey, imagesize, imagesize);



                // Dessiner l'image de profil sur le canvas
                const buffer2 = canvasFormatted.toBuffer('image/png');
                //  fs.writeFileSync("./visual/rollschasers/temporary/" + randomString + "-" + authorId + "profitvisual.png", buffer2);

                await interaction.editReply({ files: [buffer2] })






            } else {

                const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Bot Access")
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .setDescription("This button is not for you. You can only click on buttons generated by your commands. Please try again with your personal data.")
                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
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
            let reportCommand = "/profit-visual"

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








