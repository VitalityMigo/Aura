//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const etherscanApiKey = process.env.etherscanApiKey

const axios = require('axios')


async function getContract(contractAddress) {
    try {

        const callABI = await axios.get("https://api.etherscan.io/api?module=contract&action=getsourcecode&address=" + contractAddress + "&apikey=" + etherscanApiKey)
        const result = await callABI.data.result[0].ABI
        const ABI = await JSON.parse(result)

      return ABI

    } catch (error) {
        console.error('Erreur:', error);
    }
}


module.exports = getContract;
