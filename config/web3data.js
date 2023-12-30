// const dotenv = require("dotenv");
// dotenv.config();
// const etherscanApiKey = process.env.etherscanApiKey;

// const axios = require("axios");

// let ethPrice; // Variable globale pour stocker le prix de l'ETH

// async function runConfig() {
//   // Mise à jour du prix de l'ETH
//   ethPrice = await getEthPrice();
//   console.log("Mise à jour du prix de l'ETH :", ethPrice);
// }

// async function getEthPrice() {

//     const etherscanTokenPrice = await axios.get('https://api.etherscan.io/api?module=stats&action=ethprice&apikey=' + etherscanApiKey)
//     const ethUsdPrice = etherscanTokenPrice.data.result.ethusd

//     return ethUsdPrice
// }
// // Appeler runConfig au démarrage
// runConfig();

// // Mise à jour toutes les heures (3600000 millisecondes)
// setInterval(runConfig, 15000);

// // Fonction pour récupérer la valeur actuelle de ethPrice
// function getEthPriceValue() {
//   return ethPrice;
// }

// // Exporte la fonction getEthPriceValue
// module.exports = {
//   getEthPriceValue,
// };