
const { web3Base1RPC } = require('../config/web3config');

async function getBaseDeposit(address) {


    try {

        const contract = "0x4200000000000000000000000000000000000010"
        const approvalTopic = "0x31b2166ff604fc5672ea5df08a78081d2bc6d746cadce880747f3643d819e83d"
        const wallet = "0x" + "0".repeat(24) + address.slice(2);

        const filter = {
            address: contract,
            topics: [
                approvalTopic,
                null,
                wallet.toLowerCase()

            ],
            fromBlock: 0, // Bloc de départ
            toBlock: 'latest', // Bloc final (dernier bloc)
        };


        const logs = await web3Base1RPC.eth.getPastLogs(filter);

        let table = []
        for (const log of logs) {

            const block = await web3Base1RPC.eth.getBlock(log.blockNumber)
        
            let obj = {}
            obj.hash = log.transactionHash
            obj.value = decodeHexData(log.data) / 10 ** 18
            obj.timestamp = block.timestamp
            table.push(obj)

            
        }

        return table

    } catch (error) {
        console.error('Erreur :', error);
    }


}

module.exports = getBaseDeposit


function decodeHexData(hexString) {
    // Ignorer les 32 premiers caractères (partie fixe)
    const remainingHex = hexString.slice(0, 66);


    const modifiedHexString = remainingHex.replace(/^(0x|0)0*/, '$1');
    const decimalValue = parseInt(modifiedHexString, 16);

    return decimalValue
}

