//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const etherscanApiKey = process.env.etherscanApiKey

const axios = require('axios')


async function ethPrice(client) {

    const etherscanTokenPrice = await axios.get('https://api.etherscan.io/api?module=stats&action=ethprice&apikey=' + etherscanApiKey)
    const ethUsdPrice = etherscanTokenPrice.data.result.ethusd

    return ethUsdPrice
}

module.exports = ethPrice
