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
const axios = require('axios')

const generateRandomString = require('../../../functions/randomkey');
const { createCanvas, loadImage } = require('canvas');


module.exports = {
  id: 'profitvisual-button',

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
        const lastInteractionRcprofit = await interactionData.findOne({ where: { authorId: authorId, commandName: "profit", serverId: serverId } })

        let userName = lastInteractionRcprofit.dataValues.authorName
        let chain = lastInteractionRcprofit.dataValues.walletCategory
        let userLogo = lastInteractionRcprofit.dataValues.userAvatar
        let selectedTimestamp = lastInteractionRcprofit.dataValues.selecedTimestamp
        let collectionName = lastInteractionRcprofit.dataValues.collectionName
        let floorPrice = lastInteractionRcprofit.dataValues.floorPrice
        let buyCount = lastInteractionRcprofit.dataValues.buyCount
        let mintCount = lastInteractionRcprofit.dataValues.mintCount
        let soldCount = lastInteractionRcprofit.dataValues.soldCount
        let remaining = lastInteractionRcprofit.dataValues.remaining
        let avgBuy = lastInteractionRcprofit.dataValues.avgBuy
        let avgSold = lastInteractionRcprofit.dataValues.avgSold
        let realisedProfit = lastInteractionRcprofit.dataValues.realisedProfit
        let potentialProfit = lastInteractionRcprofit.dataValues.potentialProfit
        let potentialRoi = lastInteractionRcprofit.dataValues.roi
        let potentialRoiFormatted = "0.00"
        let totalBuy = JSON.parse(lastInteractionRcprofit.dataValues.totalTradeCount).buy
        let totalSell = JSON.parse(lastInteractionRcprofit.dataValues.totalTradeCount).sell


        if (potentialRoi !== 0 && avgBuy !== 0 && floorPrice !== 'N/A' && potentialRoi !== "NaN") {

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
        let nativePrice = ethUsdPrice
        if (chain.toLowerCase() == "btc") { sign = "B"; nativePrice = parseFloat(lastInteractionRcprofit.dataValues.embed1) }

        //₿

        if (serverId === "949291624389816331") {




          if (visualSelect === "2" || privacyBigDataAuthor === null) {

            const templateOneCollection = await loadImage("./visual/rollschasers/permanent/profittemplate2.png");

            const canvasFormatted = createCanvas(1000, 1000);
            const ctxFormatted = canvasFormatted.getContext('2d');

            ctxFormatted.drawImage(templateOneCollection, 0, 0, canvasFormatted.width, canvasFormatted.height); // Ajouter l'image de fond au canvas



            //MINT COUNT
            ctxFormatted.font = "bold 22px Futura";
            ctxFormatted.fillStyle = "#ffffff";
            ctxFormatted.fillText(mintCount.toString(), 337, 226.5);

            //BUY COUNT
            ctxFormatted.font = "bold 22px Futura";
            ctxFormatted.fillStyle = "#ffffff";
            ctxFormatted.fillText(buyCount.toString(), 337, 271.5);

            //AVG BUY
            ctxFormatted.font = "bold 22px Futura";
            ctxFormatted.fillStyle = "#ffffff";
            ctxFormatted.fillText((parseFloat(avgBuy).toFixed(3)).toString() + sign, 337, 316.5);


            //SOLD COUNT
            ctxFormatted.font = "bold 22px Futura";
            ctxFormatted.fillStyle = "#ffffff";
            ctxFormatted.fillText(soldCount.toString(), 337, 387.5);

            //REMAINING
            ctxFormatted.font = "bold 22px Futura";
            ctxFormatted.fillStyle = "#ffffff";
            ctxFormatted.fillText(remaining.toString(), 337, 433);

            //AVG SOLD
            ctxFormatted.font = "bold 22px Futura";
            ctxFormatted.fillStyle = "#ffffff";
            ctxFormatted.fillText((parseFloat(avgSold).toFixed(3)).toString() + sign, 337, 477.5);


            //HELD VALUE
            ctxFormatted.font = "bold 22px Futura";
            ctxFormatted.fillStyle = "#ffffff";
            ctxFormatted.fillText((parseFloat((remaining * floorPrice).toFixed(3))).toString() + sign, 337, 548.5);


            //REALIZED PROFIT
            ctxFormatted.font = "bold 22px Futura";
            ctxFormatted.fillStyle = "#ffffff";
            ctxFormatted.fillText(realisedProfit.toString() + sign, 337, 594);

            //Potential ROI
            ctxFormatted.font = "bold 22px Futura";
            ctxFormatted.fillStyle = "#ffffff";
            ctxFormatted.fillText(potentialRoiFormatted.toString() + "%", 337, 639);



            //////////////////////////////////////////////////////////////////////

            // POTENTIAL PROFIT
            ctxFormatted.font = "bold 68px Futura";
            ctxFormatted.fillStyle = "#ffffff";
            const text = potentialProfit.toString() + sign // (" + Intl.NumberFormat('en-US').format((parseFloat(potentialProfit * ethUsdPrice).toFixed(0))) + "$)";
            ctxFormatted.font = "bold 35px Futura";
            const text2 = "(" + Intl.NumberFormat('en-US').format((parseFloat(potentialProfit * ethUsdPrice).toFixed(0))) + "$)";
            const textPart1 = potentialProfit.toString() + sign
            const textPart2 = + "(" + Intl.NumberFormat('en-US').format((parseFloat(potentialProfit * ethUsdPrice).toFixed(0))) + "$)";
            const text3 = potentialProfit.toString() + sign // (" + Intl.NumberFormat('en-US').format((parseFloat(potentialProfit * ethUsdPrice).toFixed(0))) + "$)";


            const bigTextSize2 = ctxFormatted.measureText(text2).width;
            ctxFormatted.font = "bold 54px Futura";
            const bigTextSize = ctxFormatted.measureText(text).width;
            const x = 285 - bigTextSize / 2;
            const y = 795 - 68; // 68 est la hauteur de la police
            const padding = 15; // Ajoutez du padding autour du texte
            const borderRadius = 4; // Rayon des coins arrondis
            let lineLonger = 11

            // Dessinez les coins arrondis sans liaisons
            ctxFormatted.strokeStyle = "#ffffff";
            ctxFormatted.lineWidth = 4;


            ctxFormatted.beginPath();
            ctxFormatted.arc(x - padding + borderRadius - 7, y - padding + borderRadius, borderRadius, Math.PI, 3 * Math.PI / 2);
            ctxFormatted.moveTo(x - padding - 7, y + 68 + padding - borderRadius + 40); // définir le point de départ de la ligne avec un padding de 20
            ctxFormatted.lineTo(x - padding - 7, y + 68 - lineLonger + padding - borderRadius + 40);
            ctxFormatted.moveTo(x - padding + borderRadius - 7, y + 68 + padding + 40); // définir le point de départ de la ligne avec un padding de 20
            ctxFormatted.lineTo(x + lineLonger - padding + borderRadius - 7, y + 68 + padding + 40);

            ctxFormatted.stroke();

            ctxFormatted.beginPath();
            ctxFormatted.arc(x + bigTextSize + padding - borderRadius + 7, y - padding + borderRadius, borderRadius, 3 * Math.PI / 2, 2 * Math.PI);
            ctxFormatted.moveTo(x + padding + bigTextSize + 7, y - padding + borderRadius); // définir le point de départ de la ligne avec un padding de 20
            ctxFormatted.lineTo(x + padding + bigTextSize + 7, y + lineLonger - padding + borderRadius);
            ctxFormatted.moveTo(x + padding + bigTextSize - borderRadius + 7, y - padding); // définir le point de départ de la ligne avec un padding de 20
            ctxFormatted.lineTo(x + bigTextSize - lineLonger + padding - borderRadius + 7, y - padding);
            ctxFormatted.stroke();
            ctxFormatted.beginPath();

            ctxFormatted.arc(x + bigTextSize + padding - borderRadius + 7, y + 68 + padding - borderRadius + 40, borderRadius, 0, Math.PI / 2);
            ctxFormatted.moveTo(x + bigTextSize + padding + 7, y + 68 + padding - borderRadius + 40); // définir le point de départ de la ligne avec un padding de 20
            ctxFormatted.lineTo(x + bigTextSize + padding + 7, y + 68 - lineLonger + padding - borderRadius + 40);
            ctxFormatted.moveTo(x + padding + bigTextSize - borderRadius + 7, y + 68 + padding + 40); // définir le point de départ de la ligne avec un padding de 20
            ctxFormatted.lineTo(x + bigTextSize - lineLonger + padding - borderRadius + 7, y + 68 + padding + 40);
            ctxFormatted.stroke();

            ctxFormatted.beginPath();
            ctxFormatted.arc(x - padding + borderRadius - 7, y + 68 + padding - borderRadius + 40, borderRadius, Math.PI / 2, Math.PI);
            ctxFormatted.moveTo(x - padding - 7, y - padding + borderRadius); // définir le point de départ de la ligne avec un padding de 20
            ctxFormatted.lineTo(x - padding - 7, y + lineLonger - padding + borderRadius);
            ctxFormatted.moveTo(x - padding + borderRadius - 7, y - padding); // définir le point de départ de la ligne avec un padding de 20
            ctxFormatted.lineTo(x + lineLonger - padding + borderRadius - 7, y - padding);
            ctxFormatted.stroke();

            // Dessinez le texte
            ctxFormatted.fillStyle = "#e60015";
            if (potentialProfit >= 0) { ctxFormatted.fillStyle = "#00db00"; } else if (potentialProfit < 0) { ctxFormatted.fillStyle = "#e60015"; }
            ctxFormatted.fillText(text, x, y + 51);
            ctxFormatted.font = "bold 35px Futura";
            ctxFormatted.fillText(text2, 285 - bigTextSize2 / 2, y + 103);



            ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



            //NOM COLLECTION
            ctxFormatted.font = "bold 40px Futura";
            ctxFormatted.fillStyle = "rgba(255, 255, 255, 0.93)";
            ctxFormatted.lineWidth = 2;
            ctxFormatted.strokeStyle = "#ffffff";
            //ctxFormatted.fillStyle = "#E0E7FF";

            const collectionNameWords = collectionName.toString().split(' ');
            let collectionNameFirstPart = '';
            let collectionNameSecondPart = '';
            let collectionNameTextSize = 0;

            // Loop through the words to determine where to split the collection name
            for (let i = 0; i < collectionNameWords.length; i++) {
              const word = collectionNameWords[i];
              const wordSize = ctxFormatted.measureText(word + ' ').width;

              if (collectionNameTextSize + wordSize <= 610) {
                collectionNameFirstPart += word + ' ';
                collectionNameTextSize += wordSize;

              } else {
                collectionNameSecondPart += word + ' ';
              }
            }

            if (!collectionNameSecondPart) {
              ctxFormatted.font = "bold 40px Futura";
              ctxFormatted.fillText(collectionNameFirstPart.trim(), 126, 145);
              ctxFormatted.strokeText(collectionNameFirstPart, 126, 145);
            } else if (collectionNameSecondPart) {
              ctxFormatted.font = "bold 34px Futura";
              ctxFormatted.fillText(collectionNameFirstPart.trim(), 126, 100);
              ctxFormatted.strokeText(collectionNameFirstPart, 126, 100);
              ctxFormatted.fillText(collectionNameSecondPart.trim(), 126, 145);
              ctxFormatted.strokeText(collectionNameSecondPart, 126, 145);
            }




            // Dessiner une ligne diagonale
            ctxFormatted.lineWidth = 3;
            ctxFormatted.fillStyle = "#ffffff";
            ctxFormatted.beginPath();
            ctxFormatted.moveTo(129, 178);
            ctxFormatted.lineTo(129 + 65, 178);
            ctxFormatted.stroke();






            //NOM USER
            ctxFormatted.font = "bold 34px SFTransrobotic";
            ctxFormatted.fillStyle = "#ffffff";
            const userNameSize = ctxFormatted.measureText(authorName.toString()).width;
            ctxFormatted.fillText(authorName.toString(), (975 - userNameSize), 976);


            // Dessin du cercle de découpe
            const profileImage = await loadImage(userLogo);
            const imagesize = 53;
            const imagex = 965 - userNameSize - imagesize;
            const imagey = 938;
            ctxFormatted.beginPath();
            ctxFormatted.arc(imagex + imagesize / 2, imagey + imagesize / 2, imagesize / 2, 0, Math.PI * 2, true);
            ctxFormatted.closePath();
            ctxFormatted.clip();
            ctxFormatted.drawImage(profileImage, imagex, imagey, imagesize, imagesize);



            //Génrerer, envoyer et supprimer le visuel
            const randomString = generateRandomString(10);

            // Dessiner l'image de profil sur le canvas
            const buffer2 = canvasFormatted.toBuffer('image/png');

            await interaction.editReply({ files: [buffer2] })








            ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

          } else if (visualSelect === "3") {







            const templateOneCollection = await loadImage("./visual/aura/permanent/profittemplate3.png");

            const canvasFormatted = createCanvas(1000, 1000);
            const ctxFormatted = canvasFormatted.getContext('2d');

            ctxFormatted.drawImage(templateOneCollection, 0, 0, canvasFormatted.width, canvasFormatted.height); // Ajouter l'image de fond au canvas




            ctxFormatted.font = "bold 58px SFTransrobotic";
            ctxFormatted.textBaseline = "alphabetic";
            const MAX_WIDTH = 766;
            let fontSize = 58;


            ctxFormatted.fillStyle = "#ffffff";
            let collectionNameTextSize = ctxFormatted.measureText(collectionName).width;

            while (collectionNameTextSize > MAX_WIDTH) {
              fontSize -= 0.5;
              ctxFormatted.font = `bold ${fontSize}px Futura`;
              collectionNameTextSize = ctxFormatted.measureText(collectionName).width;
            }

            ctxFormatted.font = `bold ${fontSize}px SFTransrobotic`;
            ctxFormatted.textBaseline = "middle";
            ctxFormatted.fillText(collectionName, 40, 530);
            ctxFormatted.textBaseline = "alphabetic";








            //Mint COUNT
            ctxFormatted.font = "bold 28px Futura";
            ctxFormatted.fillStyle = "#ffffff";
            ctxFormatted.fillText(mintCount.toString(), 343, 726);

            //BUY COUNT
            ctxFormatted.font = "bold 28px Futura";
            ctxFormatted.fillStyle = "#ffffff";
            ctxFormatted.fillText(buyCount.toString(), 343, 774);

            //AVG SPENT VALUE
            ctxFormatted.font = "bold 28px Futura";
            ctxFormatted.fillStyle = "#ffffff";
            ctxFormatted.fillText(avgBuy.toString() + sign, 343, 823);

            //AVG SALE VALUE
            ctxFormatted.font = "bold 28px Futura";
            ctxFormatted.fillStyle = "#ffffff";
            ctxFormatted.fillText(avgSold.toString() + sign, 343, 872);


            //SOLD COUNT
            ctxFormatted.font = "bold 28px Futura";
            ctxFormatted.fillStyle = "#ffffff";
            ctxFormatted.fillText(soldCount.toString(), 840, 726);

            //REMAINING COUNT
            ctxFormatted.font = "bold 28px Futura";
            ctxFormatted.fillStyle = "#ffffff";
            ctxFormatted.fillText(remaining.toString(), 840, 774);


            //TOTAL HELD VALUE
            ctxFormatted.font = "bold 28px Futura";
            ctxFormatted.fillStyle = "#ffffff";
            ctxFormatted.fillText((parseFloat(remaining * floorPrice).toFixed(3)).toString() + sign, 840, 823);

            //REALIZED PROFIT
            ctxFormatted.font = "bold 28px Futura";
            ctxFormatted.fillStyle = "#ffffff";
            ctxFormatted.fillText(realisedProfit.toString() + sign, 840, 872);

            //REALIZED ROI
            ctxFormatted.font = "bold 35px SFTransrobotic";
            if (potentialProfit >= 0) { ctxFormatted.fillStyle = "#00db00"; } else if (potentialProfit < 0) { ctxFormatted.fillStyle = "#e60015"; }
            ctxFormatted.fillText(potentialRoiFormatted.toString() + "%", 840, 540);

            //POTENTIAL PROFIT (USD)
            ctxFormatted.font = "bold 80px SFTransrobotic";
            if (potentialProfit >= 0) { ctxFormatted.fillStyle = "#00db00"; } else if (potentialProfit < 0) { ctxFormatted.fillStyle = "#e60015"; }
            ctxFormatted.fillText("$" + Intl.NumberFormat('en-US').format((parseFloat(potentialProfit * ethUsdPrice).toFixed(0))), 45, 653);

            //POTENTIAL PROFIT (ETH)
            ctxFormatted.font = "bold 80px SFTransrobotic";
            if (potentialProfit >= 0) { ctxFormatted.fillStyle = "#00db00"; } else if (potentialProfit < 0) { ctxFormatted.fillStyle = "#e60015"; }
            ctxFormatted.fillText(potentialProfit.toString() + sign, 547, 653);






            //NOM USER
            ctxFormatted.font = "bold 34px SFTransrobotic";
            ctxFormatted.fillStyle = "#ffffff";
            const userNameSize = ctxFormatted.measureText(authorName.toString()).width;
            ctxFormatted.fillText(authorName.toString(), (975 - userNameSize), 973);


            // Dessin du cercle de découpe
            const imagesize = 48;
            const imagex = 965 - userNameSize - imagesize;
            const imagey = 940;
            const profileImage = await loadImage(userLogo);
            ctxFormatted.beginPath();
            ctxFormatted.arc(imagex + imagesize / 2, imagey + imagesize / 2, imagesize / 2, 0, Math.PI * 2, true);
            ctxFormatted.closePath();
            ctxFormatted.clip();
            ctxFormatted.drawImage(profileImage, imagex, imagey, imagesize, imagesize);



            const randomString = generateRandomString(10);

            // Dessiner l'image de profil sur le canvas
            const buffer2 = canvasFormatted.toBuffer('image/png');

            await interaction.editReply({ files: [buffer2] })

















          } else if (visualSelect === "1") {

            const templateOneCollection = await loadImage("./visual/rollschasers/permanent/profittemplate1.png");

            const canvasFormatted = createCanvas(1000, 1000);
            const ctxFormatted = canvasFormatted.getContext('2d');

            ctxFormatted.drawImage(templateOneCollection, 0, 0, canvasFormatted.width, canvasFormatted.height); // Ajouter l'image de fond au canvas



            //MINT COUNT
            ctxFormatted.font = "bold 31px Futura";
            ctxFormatted.fillStyle = "#E5EAFF";
            const mintCountText = ctxFormatted.measureText(mintCount.toString()).width
            ctxFormatted.fillText(mintCount.toString(), 197 - mintCountText / 2, 420);

            //BUY COUNT
            ctxFormatted.font = "bold 31px Futura";
            ctxFormatted.fillStyle = "#E5EAFF";
            const buyCountText = ctxFormatted.measureText(buyCount.toString()).width
            ctxFormatted.fillText(buyCount.toString(), 498 - buyCountText / 2, 420);

            //AVG BUY
            ctxFormatted.font = "bold 31px Futura";
            ctxFormatted.fillStyle = "#E5EAFF";
            const avgBuyCountText = ctxFormatted.measureText((parseFloat(avgBuy).toFixed(3)).toString() + sign).width
            ctxFormatted.fillText((parseFloat(avgBuy).toFixed(3)).toString() + sign, 795 - avgBuyCountText / 2, 420);

            //SOLD COUNT
            ctxFormatted.font = "bold 31px Futura";
            ctxFormatted.fillStyle = "#E5EAFF";
            const soldCountText = ctxFormatted.measureText(soldCount.toString()).width
            ctxFormatted.fillText(soldCount.toString(), 197 - soldCountText / 2, 585);

            //REMAINING
            ctxFormatted.font = "bold 31px Futura";
            ctxFormatted.fillStyle = "#E5EAFF";
            const remainingText = ctxFormatted.measureText(remaining.toString()).width
            ctxFormatted.fillText(remaining.toString(), 498 - remainingText / 2, 585);

            //AVG SOLD
            ctxFormatted.font = "bold 31px Futura";
            ctxFormatted.fillStyle = "#E5EAFF";
            const avgSoldText = ctxFormatted.measureText((parseFloat(avgSold).toFixed(3)).toString() + sign).width
            ctxFormatted.fillText((parseFloat(avgSold).toFixed(3)).toString() + sign, 795 - avgSoldText / 2, 585);


            //REALIZED PROFIT
            ctxFormatted.font = "bold 31px Futura";
            if (realisedProfit >= 0) { ctxFormatted.fillStyle = "#00db00"; } else if (potentialProfit < 0) { ctxFormatted.fillStyle = "#e60015"; }
            const realisedProfitText = ctxFormatted.measureText((parseFloat(realisedProfit).toFixed(3)).toString() + sign).width
            ctxFormatted.fillText(realisedProfit.toString() + sign, 201 - realisedProfitText / 2, 749);

            //Potential PROFIT
            ctxFormatted.font = "bold 31px Futura";
            if (potentialProfit >= 0) { ctxFormatted.fillStyle = "#00db00"; } else if (potentialProfit < 0) { ctxFormatted.fillStyle = "#e60015"; }
            const potentialProfitText = ctxFormatted.measureText((parseFloat(potentialProfit).toFixed(3)).toString() + sign).width
            ctxFormatted.fillText(potentialProfit.toString() + sign, 498 - potentialProfitText / 2, 749);

            //Potential ROI
            ctxFormatted.font = "bold 31px Futura";
            if (potentialProfit >= 0) { ctxFormatted.fillStyle = "#00db00"; } else if (potentialProfit < 0) { ctxFormatted.fillStyle = "#e60015"; }
            const potentialRoiText = ctxFormatted.measureText(potentialRoiFormatted.toString() + "%").width
            ctxFormatted.fillText(potentialRoiFormatted.toString() + "%", 795 - potentialRoiText / 2, 749);


            ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


            //NOM COLLECTION
            const MAX_WIDTH = 515;
            let fontSize = 28;
            const targetHeight = 400;


            ctxFormatted.fillStyle = "rgba(255, 255, 255, 0.93)";
            let collectionNameTextSize = ctxFormatted.measureText(collectionName.toUpperCase()).width;

            while (collectionNameTextSize > MAX_WIDTH) {
              fontSize -= 1;
              ctxFormatted.font = `bold ${fontSize}px Futura`;
              collectionNameTextSize = ctxFormatted.measureText(collectionName.toUpperCase()).width;
            }

            ctxFormatted.font = `bold ${fontSize}px Futura`;
            ctxFormatted.textBaseline = "middle";
            ctxFormatted.fillText(collectionName.toUpperCase(), 500 - collectionNameTextSize / 2, 303);




            const profileImage = await loadImage(userLogo);

            //NOM USER
            ctxFormatted.font = "bold 38px SFTransrobotic";
            ctxFormatted.fillStyle = "#ffffff";
            const userNameSize = ctxFormatted.measureText(authorName.toString()).width;
            ctxFormatted.fillText(authorName.toString(), (975 - userNameSize), 966);


            const imagesize = 56;
            const imagex = 965 - userNameSize - imagesize;
            const imagey = 934;


            // Dessin du cercle de découpe
            ctxFormatted.beginPath();
            ctxFormatted.arc(imagex + imagesize / 2, imagey + imagesize / 2, imagesize / 2, 0, Math.PI * 2, true);
            ctxFormatted.closePath();
            ctxFormatted.clip();

            ctxFormatted.drawImage(profileImage, imagex, imagey, imagesize, imagesize);





            const randomString = generateRandomString(10);

            // Dessiner l'image de profil sur le canvas
            const buffer2 = canvasFormatted.toBuffer('image/png');
            //  fs.writeFileSync("./visual/rollschasers/temporary/" + randomString + "-" + authorId + "profitvisual.png", buffer2);

            await interaction.editReply({ files: [buffer2] })



          }

        } else if (serverId === "944918328135286804") {





          const templateOneCollection = await loadImage("./visual/embassy/permanent/profittemplate1.png");


          const canvasFormatted = createCanvas(1000, 1000);
          const ctxFormatted = canvasFormatted.getContext('2d');

          ctxFormatted.drawImage(templateOneCollection, 0, 0, canvasFormatted.width, canvasFormatted.height); // Ajouter l'image de fond au canvas



          ctxFormatted.font = "33px EmbassyGothic";
          ctxFormatted.textBaseline = "alphabetic";
          const MAX_WIDTH = 850;
          let fontSize = 33;


          ctxFormatted.fillStyle = "#ffffff";
          let collectionNameTextSize = ctxFormatted.measureText(collectionName).width;

          while (collectionNameTextSize > MAX_WIDTH) {
            fontSize -= 0.5;
            ctxFormatted.font = `${fontSize}px EmbassyGothic`;
            collectionNameTextSize = ctxFormatted.measureText(collectionName).width;
          }

          ctxFormatted.font = `${fontSize}px EmbassyGothic`;
          ctxFormatted.textBaseline = "middle";
          ctxFormatted.fillText(collectionName, 500 - collectionNameTextSize / 2, 455);
          ctxFormatted.textBaseline = "alphabetic";



          //BUY COUNT
          ctxFormatted.font = "bold 38px Courrier New";
          ctxFormatted.fillStyle = "#ffffff";
          const buyCountTextSize = ctxFormatted.measureText(buyCount.toString()).width;
          ctxFormatted.fillText(buyCount.toString(), 222 - buyCountTextSize / 2, 590);



          //SOLD COUNT
          ctxFormatted.font = "bold 38px Courrier New";
          ctxFormatted.fillStyle = "#ffffff";
          const soldCountTextSize = ctxFormatted.measureText(soldCount.toString()).width;
          ctxFormatted.fillText(soldCount.toString(), 504 - soldCountTextSize / 2, 590);

          //REMAINING COUNT
          ctxFormatted.font = "bold 38px Courrier New";
          ctxFormatted.fillStyle = "#ffffff";
          const remainingTextSize = ctxFormatted.measureText(remaining.toString()).width;
          ctxFormatted.fillText(remaining.toString(), 803 - remainingTextSize / 2, 590);


          //AVG SPENT VALUE
          ctxFormatted.font = "bold 38px Courrier New";
          ctxFormatted.fillStyle = "#ffffff";
          const avgSpentTextSize = ctxFormatted.measureText(avgBuy.toString() + sign).width;
          ctxFormatted.fillText(avgBuy.toString() + sign, 222 - avgSpentTextSize / 2, 740);

          //AVG SALE VALUE
          ctxFormatted.font = "bold 38px Courrier New";
          ctxFormatted.fillStyle = "#ffffff";
          const avgSaleTextSize = ctxFormatted.measureText(avgSold.toString() + sign).width;
          ctxFormatted.fillText(avgSold.toString() + sign, 504 - avgSaleTextSize / 2, 740);


          //Realized PROFIT (ETH)
          ctxFormatted.font = "bold 38px Courrier New";
          //if (realisedProfit >= 0) { ctxFormatted.fillStyle = "#00db00"; } else if (realisedProfit < 0) { ctxFormatted.fillStyle = "#e60015"; }
          const realizedProfitTextSize = ctxFormatted.measureText(realisedProfit.toString() + sign).width;
          ctxFormatted.fillText(realisedProfit.toString() + sign, 803 - realizedProfitTextSize / 2, 740);



          //POTENTIAL PROFIT (ETH)
          ctxFormatted.font = "bold 45px EmbassyGothic";
          if (potentialProfit >= 0) { ctxFormatted.fillStyle = "#00db00"; } else if (potentialProfit < 0) { ctxFormatted.fillStyle = "#e60015"; }
          const potentialProfitTextSize = ctxFormatted.measureText(potentialProfit.toString() + sign + " (" + potentialRoiFormatted + "%)").width;
          ctxFormatted.fillText(potentialProfit.toString() + sign + " (" + potentialRoiFormatted + "%)", 500 - potentialProfitTextSize / 2, 876);






          //NOM USER
          ctxFormatted.font = "bold 34px Courrier New";
          ctxFormatted.fillStyle = "#ffffff";
          const userNameSize = ctxFormatted.measureText(authorName.toString()).width;
          ctxFormatted.fillText(authorName.toString(), (945 - userNameSize), 950);


          // Dessin du cercle de découpe
          const imagesize = 48;
          const imagex = 935 - userNameSize - imagesize;
          const imagey = 914;
          const profileImage = await loadImage(userLogo);
          ctxFormatted.beginPath();
          ctxFormatted.arc(imagex + imagesize / 2, imagey + imagesize / 2, imagesize / 2, 0, Math.PI * 2, true);
          ctxFormatted.closePath();
          ctxFormatted.clip();
          ctxFormatted.drawImage(profileImage, imagex, imagey, imagesize, imagesize);


          // Dessiner l'image de profil sur le canvas
          const buffer2 = canvasFormatted.toBuffer('image/png');

          await interaction.editReply({ files: [buffer2] })

















        } else if (serverId == "1177408233799954443") {
          // EGL Family


          const templateOneCollection = await loadImage("./visual/eglfamily/permanent/cryptoprofittemplate1.png");


          const canvasFormatted = createCanvas(1000, 630.2);
          const ctx = canvasFormatted.getContext('2d');

          ctx.drawImage(templateOneCollection, 0, 0, canvasFormatted.width, canvasFormatted.height); // Ajouter l'image de fond au canvas

          // Nom du coin
          // ON commence par formatter le texte
          const collectionTxt = collectionName
          const MAX_WIDTH = 515;
          let fontSize = 50;
          ctx.font = `${fontSize}px roboto`;
          let collectionSz = ctx.measureText(collectionTxt).width;
          while (collectionSz > MAX_WIDTH) {
            fontSize -= 1;
            ctx.font = `${fontSize}px roboto`;
            collectionSz = ctx.measureText(collectionTxt).width;
          }
          ctx.fillStyle = "#FFFFFF";
          ctx.textAlign = "left";
          ctx.fillText(collectionTxt, 500 - collectionSz / 2, 110);



          // Profit potentiel
          // ON commence par formatter le texte
          let profitTx = parseFloat(potentialProfit).toFixed(3) + " eth"
          if (potentialProfit > 0) { profitTx = "+" + parseFloat(potentialProfit).toFixed(3) + " eth" }
          // Puis on met la font et la couleur
          ctx.font = "107px roboto";
          ctx.fillStyle = "#04D9FF";
          // Enfin on calcul la taille et remplit
          const profitSz = ctx.measureText(profitTx).width;
          ctx.fillText(profitTx, 500 - profitSz / 2, 330);

          // Effet de lueur
          ctx.shadowColor = 'rgba(4, 217, 255, 0.7)';
          ctx.shadowBlur = 10;
          // Duplique le texte avec une couleur de fond différente
          ctx.fillStyle = '#04D9FF';
          ctx.fillText(profitTx, 500 - profitSz / 2, 330);

          // USD Profit
          ctx.textAlign = 'right';
          ctx.font = "38px rbt";
          ctx.fillStyle = "#04D9FF";
          const usdTx = parseFloat(potentialProfit * ethUsdPrice).toFixed(2) + " USD"
          ctx.fillText(usdTx, 725, 390);

          // ROI
          ctx.textAlign = 'left';
          ctx.font = "38px rbt";
          ctx.fillStyle = "#04D9FF";
          const roiTx = "ROI: " + parseFloat(potentialRoi).toFixed(0) + "%"
          ctx.fillText(roiTx, 270, 390);


          // Réinitialise l'effet de lueur
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;




          // Cout total
          // ON commence par formatter le texte
          const spentTx = parseFloat(totalBuy).toFixed(3) + "Ξ"
          // Puis on met la font et la couleur
          ctx.font = "light 19px rbt";
          ctx.fillStyle = "#E7E7E7";
          // Enfin on calcul la taille et remplit
          ctx.fillText(spentTx, 410, 490);


          // Sales total
          // ON commence par formatter le texte
          const salesTx = parseFloat(totalSell).toFixed(3) + "Ξ"
          // Puis on met la font et la couleur
          ctx.font = "light 19px rbt";
          ctx.fillStyle = "#E7E7E7";
          // Enfin on calcul la taille et remplit
          ctx.fillText(salesTx, 688, 490);



          //NOM USER
          ctx.font = " 18px roboto";
          ctx.fillStyle = "#E7E7E7";
          ctx.fillText(authorName.toString(), 830, 569);


          // Dessin du cercle de découpe
          const imagesize = 35;
          const imagex = 783
          const imagey = 544;
          const profileImage = await loadImage(userLogo);
          ctx.beginPath();
          ctx.arc(imagex + imagesize / 2, imagey + imagesize / 2, imagesize / 2, 0, Math.PI * 2, true);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(profileImage, imagex, imagey, imagesize, imagesize);




          // Dessiner l'image de profil sur le canvas
          const buffer2 = canvasFormatted.toBuffer('image/png');

          await interaction.editReply({ files: [buffer2] })




        } else if (serverId == "965053346794840174") {
          // Alpha Birds


          let templateOneCollection = await loadImage("./visual/alphabirds/permanent/profittemplate1.png");
          if (chain.toLowerCase() == "btc") { templateOneCollection = await loadImage("./visual/alphabirds/permanent/ordiprofitemplate1.png"); }

          const canvasFormatted = createCanvas(1920, 1080);
          const ctx = canvasFormatted.getContext('2d');

          ctx.drawImage(templateOneCollection, 0, 0, canvasFormatted.width, canvasFormatted.height); // Ajouter l'image de fond au canvas


          // Nom de la collection
          const MAX_WIDTH = 670
          let fontSize = 70;
          ctx.font = `${fontSize}px 'UTM Futura Extra'`;
          let size = ctx.measureText(collectionName).width;

          while (size > MAX_WIDTH) {
            fontSize -= 1;
            ctx.font = `${fontSize}px 'UTM Futura Extra'`;
            size = ctx.measureText(collectionName).width;
          }
          ctx.fillStyle = "#ffffff";
          ctx.font = `${fontSize}px 'UTM Futura Extra'`;
          ctx.fillText(collectionName, 217, 423);


          const profitTXT = parseFloat(potentialProfit).toFixed(3)
          ctx.font = "88px 'UTM Futura Extra'";
          ctx.fillStyle = "#ffffff";
          ctx.fillText(profitTXT, 310, 754);

          let roiTXT = parseFloat(potentialRoi).toFixed(1) + "%"
          let roiY = 555
          ctx.font = "50px 'UTM Futura Extra'";
          if (potentialRoi.toLowerCase() === "infinity") { roiTXT = "∞"; ctx.font = "80px 'UTM Futura Extra'"; roiY = 565 }
          ctx.fillStyle = "#828282";
          ctx.fillText(roiTXT, 354, roiY);

          const avgBuyTXT = parseFloat(avgBuy).toFixed(3)
          ctx.font = "50px 'UTM Futura Extra'";
          ctx.fillStyle = "#828282";
          ctx.fillText(avgBuyTXT, 512, 611);

          const buyTXT = "$" + formatDollars(totalBuy * nativePrice)
          ctx.font = "50px 'UTM Futura Extra'";
          ctx.fillStyle = "#828282";
          ctx.fillText(buyTXT, 658, 817);

          const profitUsdTXT = "$" + formatDollars(potentialProfit * nativePrice)
          ctx.font = "50px 'UTM Futura Extra'";
          ctx.fillStyle = "#828282";
          ctx.fillText(profitUsdTXT, 621, 496);

          const name = "@" + authorName.toUpperCase()
          ctx.font = "33px 'UTM Futura Extra'";
          ctx.fillStyle = "#ffffff";
          ctx.fillText(name, 87, 1042);

          // Dessiner l'image de profil sur le canvas
          const buffer2 = canvasFormatted.toBuffer('image/png');

          await interaction.editReply({ files: [buffer2] })

        } else if (serverId == "1090331629827924020") {
          // Taproot Alpha

          let templateOneCollection
          if (chain.toLowerCase() == "btc") { templateOneCollection = await loadImage("./visual/taproot/permanent/ordiprofittemplate1.png"); }

          const canvasFormatted = createCanvas(1000, 1000);
          const ctx = canvasFormatted.getContext('2d');

          ctx.drawImage(templateOneCollection, 0, 0, canvasFormatted.width, canvasFormatted.height); // Ajouter l'image de fond au canvas


          // Nom de la collection
          const MAX_WIDTH = 491
          let fontSize = 63;
          ctx.font = `${fontSize}px Luckiest`;
          let size = ctx.measureText(collectionName).width;

          while (size > MAX_WIDTH) {
            fontSize -= 1;
            ctx.font = `700 ${fontSize}px Luckiest`;
            size = ctx.measureText(collectionName).width;
          }
          ctx.fillStyle = "#407E3F";
          ctx.font = `${fontSize}px Luckiest`;
          ctx.fillText(collectionName, 92, 392);


          const buyCountTXT = parseInt(buyCount) + parseInt(mintCount)
          ctx.font = " 33px Luckiest";
          ctx.fillStyle = "#000000";
          ctx.fillText(buyCountTXT, 350, 468);

          const avgBuyTXT = parseFloat(avgBuy).toFixed(4)
          ctx.font = " 33px Luckiest";
          ctx.fillStyle = "#000000";
          ctx.fillText(avgBuyTXT, 350, 532);

          const roiTXT = parseFloat(potentialRoi).toFixed(1) + "%"
          ctx.font = " 33px Luckiest";
          ctx.fillStyle = "#000000";
          ctx.fillText(roiTXT, 350, 596);

          const profitTXT = parseFloat(potentialProfit).toFixed(4)
          ctx.font = " 70px Luckiest";
          ctx.fillStyle = "#000000";
          ctx.fillText(profitTXT, 180, 738);


          // const buyTXT = "$" + formatDollars(totalBuy * nativePrice)
          // ctx.font = " 50px 'UTM Futura Extra'";
          // ctx.fillStyle = "#828282";
          // ctx.fillText(buyTXT, 658, 817);

          const profitUsdTXT = "($" + formatDollars(potentialProfit * nativePrice) + ")"
          const nativeProfitSize = ctx.measureText(profitTXT).width;
          ctx.font = " 37px Luckiest";
          ctx.fillStyle = "#000000";
          const usdProfitSize = ctx.measureText(profitUsdTXT).width;
          ctx.fillText(profitUsdTXT, 180 + (nativeProfitSize / 2) - (usdProfitSize / 2), 787);

          const name = "@" + authorName.toUpperCase()
          ctx.font = " 27px Luckiest";
          ctx.fillStyle = "#000000";
          ctx.fillText(name, 45, 980);

          // Dessiner l'image de profil sur le canvas
          const buffer2 = canvasFormatted.toBuffer('image/png');

          await interaction.editReply({ files: [buffer2] })

        } else {



          const templateOneCollection = await loadImage("./visual/aura/permanent/profittemplate1.png");

          const canvasFormatted = createCanvas(1000, 1000);
          const ctxFormatted = canvasFormatted.getContext('2d');

          ctxFormatted.drawImage(templateOneCollection, 0, 0, canvasFormatted.width, canvasFormatted.height); // Ajouter l'image de fond au canvas


          //MINT COUNT
          ctxFormatted.font = "700 35px 'Fira Code'";
          ctxFormatted.fillStyle = "#E5EAFF";
          const mintCountText = ctxFormatted.measureText(mintCount.toString()).width
          ctxFormatted.fillText(mintCount.toString(), 190 - mintCountText / 2, 420);

          //BUY COUNT
          ctxFormatted.font = "700 35px 'Fira Code'";
          ctxFormatted.fillStyle = "#E5EAFF";
          const buyCountText = ctxFormatted.measureText(buyCount.toString()).width
          ctxFormatted.fillText(buyCount.toString(), 498 - buyCountText / 2, 420);

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

          if (chain.toLowerCase() == "eth") {

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

          } else {
            // C'est BTC.

            //REALIZED PROFIT
            ctxFormatted.font = "700 35px 'Fira Code'";
            if (realisedProfit >= 0) { ctxFormatted.fillStyle = "#00db00"; } else if (potentialProfit < 0) { ctxFormatted.fillStyle = "#e60015"; }
            const realisedProfitText = ctxFormatted.measureText((parseFloat(realisedProfit).toFixed(3)).toString() + sign).width
            ctxFormatted.fillText(realisedProfit.toString() + sign, 190 - realisedProfitText / 2, 730);
            // On ajoute le prix en USD.
            const realisedUSD = "($" + parseFloat(realisedProfit * nativePrice).toFixed(0) + ")"
            ctxFormatted.font = "700 22px 'Fira Code'";
            const realisedUSDText = ctxFormatted.measureText(realisedUSD.toString()).width
            ctxFormatted.fillText(realisedUSD, 190 - realisedUSDText / 2, 763);

            //Potential PROFIT
            ctxFormatted.font = "700 35px 'Fira Code'";
            if (potentialProfit >= 0) { ctxFormatted.fillStyle = "#00db00"; } else if (potentialProfit < 0) { ctxFormatted.fillStyle = "#e60015"; }
            const potentialProfitText = ctxFormatted.measureText((parseFloat(potentialProfit).toFixed(3)).toString() + sign).width
            ctxFormatted.fillText(potentialProfit.toString() + sign, 500 - potentialProfitText / 2, 730);
            // On ajoute le prix en USD.
            const potentialUSD = "($" + parseFloat(potentialProfit * nativePrice).toFixed(0) + ")"
            ctxFormatted.font = "700 22px 'Fira Code'";
            const potentialUSDText = ctxFormatted.measureText(potentialUSD.toString()).width
            ctxFormatted.fillText(potentialUSD, 500 - potentialUSDText / 2, 763);

            //Potential ROI
            ctxFormatted.font = "700 35px 'Fira Code'";
            if (potentialProfit >= 0) { ctxFormatted.fillStyle = "#00db00"; } else if (potentialProfit < 0) { ctxFormatted.fillStyle = "#e60015"; }
            if (potentialRoiFormatted.toLowerCase() !== "infinity") {
              const potentialRoiText = ctxFormatted.measureText(potentialRoiFormatted.toString() + "%").width
              ctxFormatted.fillText(potentialRoiFormatted.toString() + "%", 812 - potentialRoiText / 2, 730);
              // On ajoute le prix en USD.
              const multiplier = "(x" + parseFloat(1 + parseFloat(potentialRoiFormatted) / 100).toFixed(1) + ")"
              ctxFormatted.font = "700 22px 'Fira Code'";
              const potentialUSDText = ctxFormatted.measureText(multiplier.toString()).width
              ctxFormatted.fillText(multiplier, 812 - potentialUSDText / 2, 763);

            } else {

              const potentialRoiText = ctxFormatted.measureText(potentialRoiFormatted.toString()).width
              ctxFormatted.fillText(potentialRoiFormatted.toString(), 812 - potentialRoiText / 2, 730);
              // On ajoute le mulitplicateur.
              const multiplier = "(x ∞)"
              ctxFormatted.font = "700 22px 'Fira Code'";
              const potentialUSDText = ctxFormatted.measureText(multiplier.toString()).width
              ctxFormatted.fillText(multiplier, 812 - potentialUSDText / 2, 763);
            }

          }

          ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


          //NOM COLLECTION
          const MAX_WIDTH = 515;
          let fontSize = 33;
          const targetHeight = 400;


          ctxFormatted.fillStyle = "rgba(255, 255, 255, 0.93)";
          let collectionNameTextSize = ctxFormatted.measureText(collectionName.toUpperCase()).width;

          while (collectionNameTextSize > MAX_WIDTH) {
            fontSize -= 1;
            ctxFormatted.font = `700 ${fontSize}px 'Fira Code'`;
            collectionNameTextSize = ctxFormatted.measureText(collectionName.toUpperCase()).width;
          }

          ctxFormatted.font = `700 ${fontSize}px 'Fira Code'`;
          ctxFormatted.textBaseline = "middle";
          ctxFormatted.fillText(collectionName.toUpperCase(), 500 - collectionNameTextSize / 2, 304);




          const profileImage = await loadImage(userLogo);


          //NOM USER
          const MAX_WIDTH2 = 290;
          let fontSize2 = 21;


          ctxFormatted.fillStyle = "#ffffff";
          const userNameSize = ctxFormatted.measureText(authorName.toUpperCase()).width;

          while (userNameSize > MAX_WIDTH2) {
            fontSize2 -= 1;
            ctxFormatted.font = `${fontSize2}px 'O PTIImprovNewWideNine,O'`;
            userNameSize = ctxFormatted.measureText(authorName.toUpperCase()).width;
          }




          const imagesize = 50
          const startImageAndName = 792


          let pfpAndNameSize = ctxFormatted.measureText(imagesize + 8 + authorName.toUpperCase()).width;

          ctxFormatted.font = `${fontSize2}px 'O PTIImprovNewWideNine,O'`;
          ctxFormatted.textBaseline = "middle";
          ctxFormatted.fillText(authorName.toUpperCase(), startImageAndName + imagesize + 12 - (pfpAndNameSize / 2), 969);


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


        }



      } else {

        const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
          .setTitle("Bot Access")
          .setAuthor({ name: authorName, iconURL: userAvatar })
          .setDescription("This button is not for you. You can only click on buttons generated by your commands. Please try again with your personal data.")
          .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
          .setTimestamp()
          .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

        await interaction.editReply({ embeds: [setfpEmbedNotForYou], ephemeral: true });



      }


    } catch (error) {

      console.log("//////////\n\nDetails de l'erreur :\n\n" + error.stack + "\n\n//////////")


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







function formatDollars(number) {
  if (number >= 1000000000) {
    return parseFloat(number / 1000000000).toFixed(3) + 'B';
  }
  if (number >= 1000000) {
    return parseFloat(number / 1000000).toFixed(2) + 'M';
  }
  if (number >= 1000) {
    return parseFloat(number / 1000).toFixed(1) + 'K';
  }
  return parseFloat(number).toFixed(0);
}


