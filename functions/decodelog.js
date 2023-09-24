

const Web3 = require('web3');
const web3 = new Web3("https://cloudflare-eth.com")




async function decodeLogs(eventABI, logHex) {

const decodedLogs = await web3.eth.abi.decodeLog(eventABI, logHex);

return decodedLogs

}

module.exports = decodeLogs
