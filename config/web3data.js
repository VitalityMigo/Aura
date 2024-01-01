const dotenv = require("dotenv");
dotenv.config();
const etherscanApiKey = process.env.etherscanApiKey;

const axios = require("axios");
const colors = require('colors')

// On initialise les valeurs qu'on va utiliser souvent
let ethPrice

async function main() {

    // Mise à jour du prix de l'ETH
    ethPrice = await callETH();
    console.log(colors.blue("⛩ New ETH price:", ethPrice));

    // D'autre valeurs peuvent être rajouter
}


async function callETH() {

    const etherscanTokenPrice = await axios.get('https://api.etherscan.io/api?module=stats&action=ethprice&apikey=' + etherscanApiKey)
    const ethUsdPrice = etherscanTokenPrice.data.result.ethusd

    return ethUsdPrice
}


// Fonction pour récupérer la valeur actuelle de ethPrice
function getEthPrice() {
    return ethPrice;
}


// On appelle main au démarrage
// Mise à jour tous les X temps
// setInterval(main, 15000);
main();


// Exporte la fonction getEthPriceValue
module.exports = {
    main,
    getEthPrice,
};