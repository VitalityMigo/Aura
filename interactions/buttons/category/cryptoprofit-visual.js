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
const formatNumberVisual = require("../../../functions/reducenumbervisual")
const { registerFont, createCanvas, loadImage } = require('canvas');
const { getEthPrice } = require("../../../config/web3data")

//On enregistre les fonts
registerFont("./visual/rollschasers/font/sftransrobotic.ttf", { family: "SFTransrobotic" })
registerFont("./visual/embassy/font/akira.ttf", { family: "EmbassyGothic" })
registerFont("./visual/eglfamily/font/roboto.ttf", { family: "roboto" })
registerFont("./visual/eglfamily/font/robotovr.ttf", { family: "rbt" })


module.exports = {
  id: 'cryptoprofitvisual-button',

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
        const ethUsdPrice = getEthPrice()


        //On stock le call API
        const timeStamp = Date.now();
        await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/profit-visual", apiCallName: "ethUsdPrice", apiProvider: "etherscan", timestamp: timeStamp.toString() })



        //RECUPERER STATS PROFIT LAST INTERACTION
        const lastInteractionRcprofit = await interactionData.findOne({ where: { authorId: authorId, commandName: "cryptoprofit", serverId: serverId } })

        let userName = lastInteractionRcprofit.dataValues.authorName
        let userLogo = lastInteractionRcprofit.dataValues.userAvatar
        let selectedTimestamp = lastInteractionRcprofit.dataValues.selecedTimestamp
        let collectionName = lastInteractionRcprofit.dataValues.collectionName
        let collectionSlug = lastInteractionRcprofit.dataValues.collectionSlug
        let floorPrice = lastInteractionRcprofit.dataValues.floorPrice
        let buyCount = lastInteractionRcprofit.dataValues.buyCount
        let airdropCount = lastInteractionRcprofit.dataValues.mintCount
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
        let symbol = lastInteractionRcprofit.dataValues.embed1
        let avgBuyPrice = JSON.parse(lastInteractionRcprofit.dataValues.embed2).avgBuy



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


        
        if (serverId === "949291624389816331") {
          // Rolls Chasers




          if (visualSelect === "2" || privacyBigDataAuthor === null) {

            const templateOneCollection = await loadImage("./visual/rollschasers/permanent/cryptoprofittemplate2.png");



            const canvasFormatted = createCanvas(1000, 1000);
            const ctx = canvasFormatted.getContext('2d');

            ctx.drawImage(templateOneCollection, 0, 0, canvasFormatted.width, canvasFormatted.height); // Ajouter l'image de fond au canvas



            //MINT COUNT
            ctx.font = "bold 22px Futura";
            ctx.fillStyle = "#ffffff";
            ctx.fillText(formatNumberVisual(buyCount), 337, 226.5);

            //BUY COUNT
            ctx.font = "bold 22px Futura";
            ctx.fillStyle = "#ffffff";
            ctx.fillText(airdropCount.toString(), 337, 271.5);

            //AVG BUY
            ctx.font = "bold 22px Futura";
            ctx.fillStyle = "#ffffff";
            ctx.fillText((formatNumberVisual(avgBuy)).toString() + "$", 337, 316.5);


            //SOLD COUNT
            ctx.font = "bold 22px Futura";
            ctx.fillStyle = "#ffffff";
            ctx.fillText(formatNumberVisual(soldCount), 337, 387.5);

            //REMAINING
            ctx.font = "bold 22px Futura";
            ctx.fillStyle = "#ffffff";
            ctx.fillText(formatNumberVisual(remaining), 337, 433);

            //AVG SOLD
            ctx.font = "bold 22px Futura";
            ctx.fillStyle = "#ffffff";
            ctx.fillText((formatNumberVisual(avgSold)).toString() + "$", 337, 477.5);


            //HELD VALUE
            ctx.font = "bold 22px Futura";
            ctx.fillStyle = "#ffffff";
            ctx.fillText((parseFloat((remaining * floorPrice).toFixed(3))).toString() + "Ξ", 337, 548.5);


            //REALIZED PROFIT
            ctx.font = "bold 22px Futura";
            ctx.fillStyle = "#ffffff";
            ctx.fillText(parseFloat(realisedProfit).toFixed(3) + "Ξ", 337, 594);

            //Potential ROI
            ctx.font = "bold 22px Futura";
            ctx.fillStyle = "#ffffff";
            ctx.fillText(parseFloat(potentialRoiFormatted).toFixed(3) + "%", 337, 639);



            //////////////////////////////////////////////////////////////////////

            // POTENTIAL PROFIT
            ctx.font = "bold 68px Futura";
            ctx.fillStyle = "#ffffff";
            const text = parseFloat(potentialProfit).toFixed(3) + "Ξ" // (" + Intl.NumberFormat('en-US').format((parseFloat(potentialProfit * ethUsdPrice).toFixed(0))) + "$)";
            ctx.font = "bold 35px Futura";
            const text2 = "(" + Intl.NumberFormat('en-US').format((parseFloat(potentialProfit * ethUsdPrice).toFixed(0))) + "$)";


            const bigTextSize2 = ctx.measureText(text2).width;
            ctx.font = "bold 54px Futura";
            const bigTextSize = ctx.measureText(text).width;
            const x = 285 - bigTextSize / 2;
            const y = 795 - 68; // 68 est la hauteur de la police
            const padding = 15; // Ajoutez du padding autour du texte
            const borderRadius = 4; // Rayon des coins arrondis
            let lineLonger = 11

            // Dessinez les coins arrondis sans liaisons
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 4;


            ctx.beginPath();
            ctx.arc(x - padding + borderRadius - 7, y - padding + borderRadius, borderRadius, Math.PI, 3 * Math.PI / 2);
            ctx.moveTo(x - padding - 7, y + 68 + padding - borderRadius + 40); // définir le point de départ de la ligne avec un padding de 20
            ctx.lineTo(x - padding - 7, y + 68 - lineLonger + padding - borderRadius + 40);
            ctx.moveTo(x - padding + borderRadius - 7, y + 68 + padding + 40); // définir le point de départ de la ligne avec un padding de 20
            ctx.lineTo(x + lineLonger - padding + borderRadius - 7, y + 68 + padding + 40);

            ctx.stroke();

            ctx.beginPath();
            ctx.arc(x + bigTextSize + padding - borderRadius + 7, y - padding + borderRadius, borderRadius, 3 * Math.PI / 2, 2 * Math.PI);
            ctx.moveTo(x + padding + bigTextSize + 7, y - padding + borderRadius); // définir le point de départ de la ligne avec un padding de 20
            ctx.lineTo(x + padding + bigTextSize + 7, y + lineLonger - padding + borderRadius);
            ctx.moveTo(x + padding + bigTextSize - borderRadius + 7, y - padding); // définir le point de départ de la ligne avec un padding de 20
            ctx.lineTo(x + bigTextSize - lineLonger + padding - borderRadius + 7, y - padding);
            ctx.stroke();
            ctx.beginPath();

            ctx.arc(x + bigTextSize + padding - borderRadius + 7, y + 68 + padding - borderRadius + 40, borderRadius, 0, Math.PI / 2);
            ctx.moveTo(x + bigTextSize + padding + 7, y + 68 + padding - borderRadius + 40); // définir le point de départ de la ligne avec un padding de 20
            ctx.lineTo(x + bigTextSize + padding + 7, y + 68 - lineLonger + padding - borderRadius + 40);
            ctx.moveTo(x + padding + bigTextSize - borderRadius + 7, y + 68 + padding + 40); // définir le point de départ de la ligne avec un padding de 20
            ctx.lineTo(x + bigTextSize - lineLonger + padding - borderRadius + 7, y + 68 + padding + 40);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(x - padding + borderRadius - 7, y + 68 + padding - borderRadius + 40, borderRadius, Math.PI / 2, Math.PI);
            ctx.moveTo(x - padding - 7, y - padding + borderRadius); // définir le point de départ de la ligne avec un padding de 20
            ctx.lineTo(x - padding - 7, y + lineLonger - padding + borderRadius);
            ctx.moveTo(x - padding + borderRadius - 7, y - padding); // définir le point de départ de la ligne avec un padding de 20
            ctx.lineTo(x + lineLonger - padding + borderRadius - 7, y - padding);
            ctx.stroke();

            // Dessinez le texte
            ctx.fillStyle = "#e60015";
            if (potentialProfit >= 0) { ctx.fillStyle = "#00db00"; } else if (potentialProfit < 0) { ctx.fillStyle = "#e60015"; }
            ctx.fillText(text, x, y + 51);
            ctx.font = "bold 35px Futura";
            ctx.fillText(text2, 285 - bigTextSize2 / 2, y + 103);



            ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



            //NOM COLLECTION
            ctx.font = "bold 40px Futura";
            ctx.fillStyle = "rgba(255, 255, 255, 0.93)";
            ctx.lineWidth = 2;
            ctx.strokeStyle = "#ffffff";
            //ctx.fillStyle = "#E0E7FF";

            const collectionNameWords = collectionName.toString().split(' ');
            let collectionNameFirstPart = '';
            let collectionNameSecondPart = '';
            let collectionNameTextSize = 0;

            // Loop through the words to determine where to split the collection name
            for (let i = 0; i < collectionNameWords.length; i++) {
              const word = collectionNameWords[i];
              const wordSize = ctx.measureText(word + ' ').width;

              if (collectionNameTextSize + wordSize <= 610) {
                collectionNameFirstPart += word + ' ';
                collectionNameTextSize += wordSize;

              } else {
                collectionNameSecondPart += word + ' ';
              }
            }

            if (!collectionNameSecondPart) {
              ctx.font = "bold 40px Futura";
              ctx.fillText(collectionNameFirstPart.trim(), 126, 145);
              ctx.strokeText(collectionNameFirstPart, 126, 145);
            } else if (collectionNameSecondPart) {
              ctx.font = "bold 34px Futura";
              ctx.fillText(collectionNameFirstPart.trim(), 126, 100);
              ctx.strokeText(collectionNameFirstPart, 126, 100);
              ctx.fillText(collectionNameSecondPart.trim(), 126, 145);
              ctx.strokeText(collectionNameSecondPart, 126, 145);
            }




            // Dessiner une ligne diagonale
            ctx.lineWidth = 3;
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.moveTo(129, 178);
            ctx.lineTo(129 + 65, 178);
            ctx.stroke();






            //NOM USER
            ctx.font = "bold 34px SFTransrobotic";
            ctx.fillStyle = "#ffffff";
            const userNameSize = ctx.measureText(authorName.toString()).width;
            ctx.fillText(authorName.toString(), (975 - userNameSize), 976);


            // Dessin du cercle de découpe
            const profileImage = await loadImage(userLogo);
            const imagesize = 53;
            const imagex = 965 - userNameSize - imagesize;
            const imagey = 938;
            ctx.beginPath();
            ctx.arc(imagex + imagesize / 2, imagey + imagesize / 2, imagesize / 2, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(profileImage, imagex, imagey, imagesize, imagesize);



            //Génrerer, envoyer et supprimer le visuel
            const randomString = generateRandomString(10);

            // Dessiner l'image de profil sur le canvas
            const buffer2 = canvasFormatted.toBuffer('image/png');

            await interaction.editReply({ files: [buffer2] })








            ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

          } else if (visualSelect === "3") {







            const templateOneCollection = await loadImage("./visual/rollschasers/permanent/cryptoprofittemplate3.png");


            const canvasFormatted = createCanvas(1000, 1000);
            const ctx = canvasFormatted.getContext('2d');

            ctx.drawImage(templateOneCollection, 0, 0, canvasFormatted.width, canvasFormatted.height); // Ajouter l'image de fond au canvas




            ctx.font = "bold 58px SFTransrobotic";
            ctx.textBaseline = "alphabetic";
            const MAX_WIDTH = 766;
            let fontSize = 58;


            ctx.fillStyle = "#ffffff";
            let collectionNameTextSize = ctx.measureText(collectionName).width;

            while (collectionNameTextSize > MAX_WIDTH) {
              fontSize -= 0.5;
              ctx.font = `bold ${fontSize}px Futura`;
              collectionNameTextSize = ctx.measureText(collectionName).width;
            }

            ctx.font = `bold ${fontSize}px SFTransrobotic`;
            ctx.textBaseline = "middle";
            ctx.fillText(collectionName, 40, 542);
            ctx.textBaseline = "alphabetic";








            //Mint COUNT
            ctx.font = "bold 28px Futura";
            ctx.fillStyle = "#ffffff";
            ctx.fillText(formatNumberVisual(buyCount), 343, 726);

            //BUY COUNT
            ctx.font = "bold 28px Futura";
            ctx.fillStyle = "#ffffff";
            ctx.fillText(airdropCount.toString(), 343, 774);

            //AVG SPENT VALUE
            ctx.font = "bold 28px Futura";
            ctx.fillStyle = "#ffffff";
            ctx.fillText(parseFloat(avgBuy).toFixed(3) + "Ξ", 343, 823);

            //AVG SALE VALUE
            ctx.font = "bold 28px Futura";
            ctx.fillStyle = "#ffffff";
            ctx.fillText(parseFloat(avgSold).toFixed(3) + "Ξ", 343, 872);


            //SOLD COUNT
            ctx.font = "bold 28px Futura";
            ctx.fillStyle = "#ffffff";
            ctx.fillText(formatNumberVisual(soldCount), 840, 726);

            //REMAINING COUNT
            ctx.font = "bold 28px Futura";
            ctx.fillStyle = "#ffffff";
            ctx.fillText(formatNumberVisual(remaining), 840, 774);


            //TOTAL HELD VALUE
            ctx.font = "bold 28px Futura";
            ctx.fillStyle = "#ffffff";
            ctx.fillText((parseFloat(remaining * floorPrice).toFixed(3)).toString() + "Ξ", 840, 823);

            //REALIZED PROFIT
            ctx.font = "bold 28px Futura";
            ctx.fillStyle = "#ffffff";
            ctx.fillText(parseFloat(realisedProfit).toFixed(3) + "Ξ", 840, 872);

            //REALIZED ROI
            ctx.font = "bold 35px SFTransrobotic";
            if (potentialProfit >= 0) { ctx.fillStyle = "#00db00"; } else if (potentialProfit < 0) { ctx.fillStyle = "#e60015"; }
            ctx.fillText(potentialRoiFormatted.toString() + "%", 840, 540);

            //POTENTIAL PROFIT (USD)
            ctx.font = "bold 80px SFTransrobotic";
            if (potentialProfit >= 0) { ctx.fillStyle = "#00db00"; } else if (potentialProfit < 0) { ctx.fillStyle = "#e60015"; }
            ctx.fillText("$" + Intl.NumberFormat('en-US').format((parseFloat(potentialProfit * ethUsdPrice).toFixed(0))), 45, 653);

            //POTENTIAL PROFIT (ETH)
            ctx.font = "bold 80px SFTransrobotic";
            if (potentialProfit >= 0) { ctx.fillStyle = "#00db00"; } else if (potentialProfit < 0) { ctx.fillStyle = "#e60015"; }
            ctx.fillText(parseFloat(potentialProfit).toFixed(3) + "Ξ", 547, 653);






            //NOM USER
            ctx.font = "bold 34px SFTransrobotic";
            ctx.fillStyle = "#ffffff";
            const userNameSize = ctx.measureText(authorName.toString()).width;
            ctx.fillText(authorName.toString(), (975 - userNameSize), 973);


            // Dessin du cercle de découpe
            const imagesize = 48;
            const imagex = 965 - userNameSize - imagesize;
            const imagey = 940;
            const profileImage = await loadImage(userLogo);
            ctx.beginPath();
            ctx.arc(imagex + imagesize / 2, imagey + imagesize / 2, imagesize / 2, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(profileImage, imagex, imagey, imagesize, imagesize);



            const randomString = generateRandomString(10);

            // Dessiner l'image de profil sur le canvas
            const buffer2 = canvasFormatted.toBuffer('image/png');

            await interaction.editReply({ files: [buffer2] })

















          } else if (visualSelect === "1") {

            const templateOneCollection = await loadImage("./visual/rollschasers/permanent/cryptoprofittemplate1.png");

            const canvasFormatted = createCanvas(1000, 1000);
            const ctx = canvasFormatted.getContext('2d');

            ctx.drawImage(templateOneCollection, 0, 0, canvasFormatted.width, canvasFormatted.height); // Ajouter l'image de fond au canvas



            //MINT COUNT
            ctx.font = "bold 31px Futura";
            ctx.fillStyle = "#E5EAFF";
            const mintCountText = ctx.measureText(formatNumberVisual(buyCount)).width
            ctx.fillText(formatNumberVisual(buyCount), 197 - mintCountText / 2, 420);

            //BUY COUNT
            ctx.font = "bold 31px Futura";
            ctx.fillStyle = "#E5EAFF";
            const buyCountText = ctx.measureText(airdropCount.toString()).width
            ctx.fillText(airdropCount.toString(), 498 - buyCountText / 2, 420);

            //AVG BUY
            ctx.font = "bold 31px Futura";
            ctx.fillStyle = "#E5EAFF";
            const avgBuyCountText = ctx.measureText((parseFloat(avgBuy).toFixed(3)).toString() + "Ξ").width
            ctx.fillText((parseFloat(avgBuy).toFixed(3)).toString() + "Ξ", 795 - avgBuyCountText / 2, 420);

            //SOLD COUNT
            ctx.font = "bold 31px Futura";
            ctx.fillStyle = "#E5EAFF";
            const soldCountText = ctx.measureText(formatNumberVisual(soldCount)).width
            ctx.fillText(formatNumberVisual(soldCount), 197 - soldCountText / 2, 585);

            //REMAINING
            ctx.font = "bold 31px Futura";
            ctx.fillStyle = "#E5EAFF";
            const remainingText = ctx.measureText(formatNumberVisual(remaining)).width
            ctx.fillText(formatNumberVisual(remaining), 498 - remainingText / 2, 585);

            //AVG SOLD
            ctx.font = "bold 31px Futura";
            ctx.fillStyle = "#E5EAFF";
            const avgSoldText = ctx.measureText((parseFloat(avgSold).toFixed(3)).toString() + "Ξ").width
            ctx.fillText((parseFloat(avgSold).toFixed(3)).toString() + "Ξ", 795 - avgSoldText / 2, 585);


            //REALIZED PROFIT
            ctx.font = "bold 31px Futura";
            if (realisedProfit >= 0) { ctx.fillStyle = "#00db00"; } else if (potentialProfit < 0) { ctx.fillStyle = "#e60015"; }
            const realisedProfitText = ctx.measureText((parseFloat(realisedProfit).toFixed(3)).toString() + "Ξ").width
            ctx.fillText((parseFloat(realisedProfit).toFixed(3)).toString() + "Ξ", 201 - realisedProfitText / 2, 749);

            //Potential PROFIT
            ctx.font = "bold 31px Futura";
            if (potentialProfit >= 0) { ctx.fillStyle = "#00db00"; } else if (potentialProfit < 0) { ctx.fillStyle = "#e60015"; }
            const potentialProfitText = ctx.measureText((parseFloat(potentialProfit).toFixed(3)).toString() + "Ξ").width
            ctx.fillText((parseFloat(potentialProfit).toFixed(3)).toString() + "Ξ", 498 - potentialProfitText / 2, 749);

            //Potential ROI
            ctx.font = "bold 31px Futura";
            if (potentialProfit >= 0) { ctx.fillStyle = "#00db00"; } else if (potentialProfit < 0) { ctx.fillStyle = "#e60015"; }
            const potentialRoiText = ctx.measureText(potentialRoiFormatted.toString() + "%").width
            ctx.fillText(potentialRoiFormatted.toString() + "%", 795 - potentialRoiText / 2, 749);


            ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


            //NOM COLLECTION
            const MAX_WIDTH = 515;
            let fontSize = 28;
            const targetHeight = 400;


            ctx.fillStyle = "rgba(255, 255, 255, 0.93)";
            let collectionNameTextSize = ctx.measureText(collectionName.toUpperCase()).width;

            while (collectionNameTextSize > MAX_WIDTH) {
              fontSize -= 1;
              ctx.font = `bold ${fontSize}px Futura`;
              collectionNameTextSize = ctx.measureText(collectionName.toUpperCase()).width;
            }

            ctx.font = `bold ${fontSize}px Futura`;
            ctx.textBaseline = "middle";
            ctx.fillText(collectionName.toUpperCase(), 500 - collectionNameTextSize / 2, 303);




            const profileImage = await loadImage(userLogo);

            //NOM USER
            ctx.font = "bold 38px SFTransrobotic";
            ctx.fillStyle = "#ffffff";
            const userNameSize = ctx.measureText(authorName.toString()).width;
            ctx.fillText(authorName.toString(), (975 - userNameSize), 966);


            const imagesize = 56;
            const imagex = 965 - userNameSize - imagesize;
            const imagey = 934;


            // Dessin du cercle de découpe
            ctx.beginPath();
            ctx.arc(imagex + imagesize / 2, imagey + imagesize / 2, imagesize / 2, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();

            ctx.drawImage(profileImage, imagex, imagey, imagesize, imagesize);





            const randomString = generateRandomString(10);

            // Dessiner l'image de profil sur le canvas
            const buffer2 = canvasFormatted.toBuffer('image/png');
            //  fs.writeFileSync("./visual/rollschasers/temporary/" + randomString + "-" + authorId + "profitvisual.png", buffer2);

            await interaction.editReply({ files: [buffer2] })



          }

        } else if (serverId == "944918328135286804") {
          // Embassy



          const templateOneCollection = await loadImage("./visual/embassy/permanent/cryptoprofittemplate1.png");


          const canvasFormatted = createCanvas(1000, 1000);
          const ctx = canvasFormatted.getContext('2d');

          ctx.drawImage(templateOneCollection, 0, 0, canvasFormatted.width, canvasFormatted.height); // Ajouter l'image de fond au canvas



          ctx.font = "33px EmbassyGothic";
          ctx.textBaseline = "alphabetic";
          const MAX_WIDTH = 850;
          let fontSize = 33;


          ctx.fillStyle = "#ffffff";
          let collectionNameTextSize = ctx.measureText(collectionName).width;

          while (collectionNameTextSize > MAX_WIDTH) {
            fontSize -= 0.5;
            ctx.font = `${fontSize}px EmbassyGothic`;
            collectionNameTextSize = ctx.measureText(collectionName).width;
          }

          ctx.font = `${fontSize}px EmbassyGothic`;
          ctx.textBaseline = "middle";
          ctx.fillText(collectionName, 500 - collectionNameTextSize / 2, 455);
          ctx.textBaseline = "alphabetic";



          //BUY COUNT
          ctx.font = "bold 38px Courrier New";
          ctx.fillStyle = "#ffffff";
          const buyCountTextSize = ctx.measureText(formatNumberVisual(buyCount)).width;
          ctx.fillText(formatNumberVisual(buyCount), 222 - buyCountTextSize / 2, 590);



          //SOLD COUNT
          ctx.font = "bold 38px Courrier New";
          ctx.fillStyle = "#ffffff";
          const soldCountTextSize = ctx.measureText(formatNumberVisual(soldCount)).width;
          ctx.fillText(formatNumberVisual(soldCount), 504 - soldCountTextSize / 2, 590);

          //REMAINING COUNT
          ctx.font = "bold 38px Courrier New";
          ctx.fillStyle = "#ffffff";
          const remainingTextSize = ctx.measureText(formatNumberVisual(remaining)).width;
          ctx.fillText(formatNumberVisual(remaining), 803 - remainingTextSize / 2, 590);


          //AVG SPENT VALUE
          ctx.font = "bold 38px Courrier New";
          ctx.fillStyle = "#ffffff";
          const avgSpentTextSize = ctx.measureText(parseFloat(avgBuy).toFixed(3) + "Ξ").width;
          ctx.fillText(parseFloat(avgBuy).toFixed(3) + "Ξ", 222 - avgSpentTextSize / 2, 740);

          //AVG SALE VALUE
          ctx.font = "bold 38px Courrier New";
          ctx.fillStyle = "#ffffff";
          const avgSaleTextSize = ctx.measureText(parseFloat(avgSold).toFixed(3) + "Ξ").width;
          ctx.fillText(parseFloat(avgSold).toFixed(3) + "Ξ", 504 - avgSaleTextSize / 2, 740);


          //Realized PROFIT (ETH)
          ctx.font = "bold 38px Courrier New";
          //if (realisedProfit >= 0) { ctx.fillStyle = "#00db00"; } else if (realisedProfit < 0) { ctx.fillStyle = "#e60015"; }
          const realizedProfitTextSize = ctx.measureText(parseFloat(realisedProfit).toFixed(3) + "Ξ").width;
          ctx.fillText(parseFloat(realisedProfit).toFixed(3) + "Ξ", 803 - realizedProfitTextSize / 2, 740);



          //POTENTIAL PROFIT (ETH)
          ctx.font = "bold 45px EmbassyGothic";
          if (potentialProfit >= 0) { ctx.fillStyle = "#00db00"; } else if (potentialProfit < 0) { ctx.fillStyle = "#e60015"; }
          const potentialProfitTextSize = ctx.measureText(parseFloat(potentialProfit).toFixed(3) + "Ξ (" + potentialRoiFormatted + "%)").width;
          ctx.fillText(parseFloat(potentialProfit).toFixed(3) + "Ξ (" + potentialRoiFormatted + "%)", 500 - potentialProfitTextSize / 2, 876);






          //NOM USER
          ctx.font = "bold 34px Courrier New";
          ctx.fillStyle = "#ffffff";
          const userNameSize = ctx.measureText(authorName.toString()).width;
          ctx.fillText(authorName.toString(), (945 - userNameSize), 950);


          // Dessin du cercle de découpe
          const imagesize = 48;
          const imagex = 935 - userNameSize - imagesize;
          const imagey = 914;
          const profileImage = await loadImage(userLogo);
          ctx.beginPath();
          ctx.arc(imagex + imagesize / 2, imagey + imagesize / 2, imagesize / 2, 0, Math.PI * 2, true);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(profileImage, imagex, imagey, imagesize, imagesize);



          const randomString = generateRandomString(10);

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
          const coinTx = "$" + collectionSlug
          // Puis on met la font et la couleur
          ctx.font = "65px roboto";
          ctx.fillStyle = "#FFFFFF";
          // Enfin on calcul la taille et remplit
          const coinSz = ctx.measureText(coinTx).width;
          ctx.fillText(coinTx, 500 - coinSz / 2, 110);


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



          344

          //NOM USER
          ctx.font = " 18px roboto";
          ctx.fillStyle = "#E7E7E7";
          const userNameSize = ctx.measureText(authorName.toString()).width;
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

          registerFont("./visual/alphabirds/font/utmfutura.ttf", { family: "UTM Futura Extra", weight: 'extra-bold' })


          const templateOneCollection = await loadImage("./visual/alphabirds/permanent/cryptoprofittemplate1.png");


          const canvasFormatted = createCanvas(1920, 1080);
          const ctx = canvasFormatted.getContext('2d');

          ctx.drawImage(templateOneCollection, 0, 0, canvasFormatted.width, canvasFormatted.height); // Ajouter l'image de fond au canvas


          const symbolTXT = '$' + symbol
          ctx.font = " 76px 'UTM Futura Extra'";
          ctx.fillStyle = "#ffffff";
          ctx.fillText(symbolTXT, 217, 423);


          const profitTXT = parseFloat(potentialProfit).toFixed(3)
          ctx.font = " 88px 'UTM Futura Extra'";
          ctx.fillStyle = "#ffffff";
          ctx.fillText(profitTXT, 309, 754);

          const roiTXT = parseFloat(potentialRoi).toFixed(1) + "%"
          ctx.font = " 50px 'UTM Futura Extra'";
          ctx.fillStyle = "#828282";
          ctx.fillText(roiTXT, 354, 555);

          const avgBuyTXT = parseFloat(avgBuyPrice).toFixed(3)
          ctx.font = " 50px 'UTM Futura Extra'";
          ctx.fillStyle = "#828282";
          ctx.fillText(avgBuyTXT, 512, 611);

          const buyTXT = "$" + formatDollars(totalBuy * ethUsdPrice)
          ctx.font = " 50px 'UTM Futura Extra'";
          ctx.fillStyle = "#828282";
          ctx.fillText(buyTXT, 658, 817);

          const profitUsdTXT = "$" + formatDollars(potentialProfit * ethUsdPrice)
          ctx.font = " 50px 'UTM Futura Extra'";
          ctx.fillStyle = "#828282";
          ctx.fillText(profitUsdTXT, 621, 496);

          const name = "@" + authorName.toUpperCase()
          ctx.font = " 33px 'UTM Futura Extra'";
          ctx.fillStyle = "#ffffff";
          ctx.fillText(name, 87, 1042);

          // Dessiner l'image de profil sur le canvas
          const buffer2 = canvasFormatted.toBuffer('image/png');

          await interaction.editReply({ files: [buffer2] })

        } else {

          registerFont("./visual/aura/font/opt.ttf", { family: "O PTIImprovNewWideNine,O" })

          const templateOneCollection = await loadImage("./visual/aura/permanent/cryptoprofittemplate1.png");



          const canvasFormatted = createCanvas(1000, 1000);
          const ctx = canvasFormatted.getContext('2d');

          ctx.drawImage(templateOneCollection, 0, 0, canvasFormatted.width, canvasFormatted.height); // Ajouter l'image de fond au canvas



          //MINT COUNT
          ctx.font = "700 35px 'Fira Code'";
          ctx.fillStyle = "#E5EAFF";
          const mintCountText = ctx.measureText(formatNumberVisual(buyCount)).width
          ctx.fillText(formatNumberVisual(buyCount), 190 - mintCountText / 2, 420);

          //BUY COUNT
          ctx.font = "700 35px 'Fira Code'";
          ctx.fillStyle = "#E5EAFF";
          const buyCountText = ctx.measureText(airdropCount.toString()).width
          ctx.fillText(airdropCount.toString(), 498 - buyCountText / 2, 420);

          //AVG BUY
          ctx.font = "700 35px 'Fira Code'";
          ctx.fillStyle = "#E5EAFF";
          const avgBuyCountText = ctx.measureText((formatNumberVisual(avgBuy)).toString() + "$").width
          ctx.fillText((formatNumberVisual(avgBuy)).toString() + "$", 812 - avgBuyCountText / 2, 420);

          //SOLD COUNT
          ctx.font = "700 35px 'Fira Code'";
          ctx.fillStyle = "#E5EAFF";
          const soldCountText = ctx.measureText(formatNumberVisual(soldCount)).width
          ctx.fillText(formatNumberVisual(soldCount), 190 - soldCountText / 2, 585);

          //REMAINING
          ctx.font = "700 35px 'Fira Code'";
          ctx.fillStyle = "#E5EAFF";
          const remainingText = ctx.measureText(formatNumberVisual(remaining)).width
          ctx.fillText(formatNumberVisual(remaining), 500 - remainingText / 2, 585);

          //AVG SOLD
          ctx.font = "700 35px 'Fira Code'";
          ctx.fillStyle = "#E5EAFF";
          const avgSoldText = ctx.measureText((formatNumberVisual(avgSold)).toString() + "$").width
          ctx.fillText((formatNumberVisual(avgSold)).toString() + "$", 812 - avgSoldText / 2, 585);


          //REALIZED PROFIT
          ctx.font = "700 35px 'Fira Code'";
          if (realisedProfit >= 0) { ctx.fillStyle = "#00db00"; } else if (potentialProfit < 0) { ctx.fillStyle = "#e60015"; }
          const realisedProfitText = ctx.measureText((parseFloat(realisedProfit).toFixed(3)).toString() + "Ξ").width
          ctx.fillText((parseFloat(realisedProfit).toFixed(3)).toString() + "Ξ", 190 - realisedProfitText / 2, 749);

          //Potential PROFIT
          ctx.font = "700 35px 'Fira Code'";
          if (potentialProfit >= 0) { ctx.fillStyle = "#00db00"; } else if (potentialProfit < 0) { ctx.fillStyle = "#e60015"; }
          const potentialProfitText = ctx.measureText((parseFloat(potentialProfit).toFixed(3)).toString() + "Ξ").width
          ctx.fillText((parseFloat(potentialProfit).toFixed(3)).toString() + "Ξ", 500 - potentialProfitText / 2, 749);

          //Potential ROI
          ctx.font = "700 35px 'Fira Code'";
          if (potentialProfit >= 0) { ctx.fillStyle = "#00db00"; } else if (potentialProfit < 0) { ctx.fillStyle = "#e60015"; }
          if (potentialRoiFormatted.toLowerCase() !== "infinity") {
            const potentialRoiText = ctx.measureText(potentialRoiFormatted.toString() + "%").width
            ctx.fillText(potentialRoiFormatted.toString() + "%", 812 - potentialRoiText / 2, 749);
          } else {
            const potentialRoiText = ctx.measureText(potentialRoiFormatted.toString()).width
            ctx.fillText(potentialRoiFormatted.toString(), 812 - potentialRoiText / 2, 749);
          }

          ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


          //NOM COLLECTION
          const MAX_WIDTH = 515;
          let fontSize = 33;
          const targetHeight = 400;


          ctx.fillStyle = "rgba(255, 255, 255, 0.93)";
          let collectionNameTextSize = ctx.measureText(collectionName.toUpperCase()).width;

          while (collectionNameTextSize > MAX_WIDTH) {
            fontSize -= 1;
            ctx.font = `700 ${fontSize}px 'Fira Code'`;
            collectionNameTextSize = ctx.measureText(collectionName.toUpperCase()).width;
          }

          ctx.font = `700 ${fontSize}px 'Fira Code'`;
          ctx.textBaseline = "middle";
          ctx.fillText(collectionName.toUpperCase(), 500 - collectionNameTextSize / 2, 304);




          const profileImage = await loadImage(userLogo);


          //NOM USER
          const MAX_WIDTH2 = 290;
          let fontSize2 = 21;


          ctx.fillStyle = "#ffffff";
          const userNameSize = ctx.measureText(authorName.toUpperCase()).width;

          while (userNameSize > MAX_WIDTH2) {
            fontSize2 -= 1;
            ctx.font = `${fontSize2}px 'O PTIImprovNewWideNine,O'`;
            userNameSize = ctx.measureText(authorName.toUpperCase()).width;
          }





          const imagesize = 50
          const startImageAndName = 792


          let pfpAndNameSize = ctx.measureText(imagesize + 8 + authorName.toUpperCase()).width;

          ctx.font = `${fontSize2}px 'O PTIImprovNewWideNine,O'`;
          ctx.textBaseline = "middle";
          ctx.fillText(authorName.toUpperCase(), startImageAndName + imagesize + 12 - (pfpAndNameSize / 2), 969);


          const imagex = startImageAndName - (pfpAndNameSize / 2)
          const imagey = 944;


          // Dessin du cercle de découpe
          ctx.beginPath();
          ctx.arc(imagex + imagesize / 2, imagey + imagesize / 2, imagesize / 2, 0, Math.PI * 2, true);
          ctx.closePath();
          ctx.clip();

          ctx.drawImage(profileImage, imagex, imagey, imagesize, imagesize);



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
      let reportCommand = "/cryptoprofit-visual"

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
    return parseFloat(number / 1000000000).toFixed(0) + 'B';
  }
  if (number >= 1000000) {
    return parseFloat(number / 1000000).toFixed(0) + 'M';
  }
  if (number >= 1000) {
    return parseFloat(number / 1000).toFixed(0) + 'K';
  }
  return parseFloat(number).toFixed(0);
}