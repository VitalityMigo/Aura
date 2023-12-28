

const { web3CloudflarePublic } = require("../config/web3config")


async function decodeLogs(eventABI, logHex) {

const decodedLogs = await web3CloudflarePublic.eth.abi.decodeLog(eventABI, logHex);

return decodedLogs

}

module.exports = decodeLogs
