const dotenv = require("dotenv");
dotenv.config();
const etherscanApiKey = process.env.etherscanApiKey;

const axios = require("axios");
const colors = require('colors')

// On initialise les valeurs qu'on va utiliser souvent
let ethPrice
let btcPrice

async function main() {

    // Mise à jour du prix de l'ETH
    ethPrice = await callETH();
    btcPrice = await callBTC()
    console.log(colors.blue("⛩ New ETH price:", ethPrice + " | New BTC price:", btcPrice));
    
    // D'autre valeurs peuvent être rajouter
}


async function callETH() {

    const etherscanTokenPrice = await axios.get('https://api.etherscan.io/api?module=stats&action=ethprice&apikey=' + etherscanApiKey)
    const ethUsdPrice = etherscanTokenPrice.data.result.ethusd

    return ethUsdPrice
}

async function callBTC() {

    const call = await axios.get("https://blockchain.info/q/24hrprice")
    const result = call.data
    return result
}


// Fonction pour récupérer la valeur actuelle de ethPrice
function getEthPrice() {
    return ethPrice;
}

function getBtcPrice() {
    return btcPrice;
}


// On appelle main au démarrage
// Mise à jour tous les X temps
// setInterval(main, 15000);
main();


// Exporte la fonction getEthPriceValue
module.exports = {
    main,
    getEthPrice,
    getBtcPrice
};