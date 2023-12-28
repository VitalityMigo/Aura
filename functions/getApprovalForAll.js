const { web3Infura } = require("../config/web3config")


async function getApprovalForAll(address, contract) {


    try {


        const approvalTopic = "0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31"
        const wallet = "0x" + "0".repeat(24) + address.slice(2);

        const filter = {
            address: contract,
            topics: [
                approvalTopic,
                wallet
            ],
            fromBlock: 0, // Bloc de départ
            toBlock: 'latest', // Bloc final (dernier bloc)
        };

        
        const logs = await web3Infura.eth.getPastLogs(filter);

        return logs

    } catch (error) {
        console.error('Erreur :', error);
    }






}

module.exports = getApprovalForAll