const { web3Infura } = require("../config/web3config")


async function getApprovals(address, contract) {


    try {


        const approvalTopic = "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925"
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

module.exports = getApprovals