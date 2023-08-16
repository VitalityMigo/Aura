//Web3 API + Cloudfare Provider
var Web3 = require("web3")
const web3 = new Web3("https://cloudflare-eth.com")

const axios = require('axios')


async function getContract(contractAddress) {
    try {

        const callABI = await axios.get("https://api.etherscan.io/api?module=contract&action=getabi&address=" + contractAddress + "&apikey=8IZSH5PEV7Y61NH7FTGVVT3999D33IAEFV")
        const result = callABI.data.result
        const ABI = await JSON.parse(result)

        // Obtenir les détails du contrat
        const contract = new web3.eth.Contract(ABI, contractAddress);

        return contract
        
    } catch (error) {
        console.error('Erreur:', error);
    }
}

module.exports = getContract;
