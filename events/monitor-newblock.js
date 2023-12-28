
//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const infuraApiKey = process.env.infuraApiKey

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.WebsocketProvider(`wss://mainnet.infura.io/ws/v3/${infuraApiKey}`, {
    clientConfig: {
        // Ajustez la taille maximale des trames et des messages selon vos besoins.
        maxReceivedFrameSize: 10000000000, // Taille maximale des trames reçues en octets.
        maxReceivedMessageSize: 10000000000, // Taille maximale des messages reçus en octets.
    }
}));


const colors = require('colors');
const fs = require("fs").promises

const blockInfosTreatment = require("../functions/m-newblock")
const coinSmartmoney = require("../functions/m-coinSM")
const addTimeout = require("../functions/addtimeout")
const newContract = require("../functions/m-newcontract")
const coinTracker = require("../functions/m-cointracker")
const nftMonitors = require("../functions/1p-nftmonitors")

// Smart wallet
const coinSMFile = require("../contracts/uniswap/smartmoney.json")
const coinSMList = coinSMFile.map(item => item.address.toLowerCase())

// Coin tracker
const trackerFile = "contracts/uniswap/tracker.json"

// Marketplace NFT
const blurV3_address = "0xb2ecfe4e4d61f8790bbb9de2d1259b9e2410cea5"
const seaport15_address = "0x00000000000000adc04c56bf30ac9d3c0aaf14dc"



// ON lance l'écoute
web3.eth.subscribe('newBlockHeaders', async (error, header) => {

    try {

        await addTimeout(1.5)

        const timeStamp = Date.now();
        const actualTimestamp = parseFloat(timeStamp / 1000).toFixed(0)
        createdSince = "<t:" + actualTimestamp + ":R>"

        if (error) {
            console.error('Erreur lors de l écoute des en-têtes de bloc :', error);
            return;
        }

        //On récupère les infos du block
        const blockNumber = header.number
        const blockMiner = header.miner
        const blockGasLimit = header.gasLimit
        const blockGasUsed = header.gasUsed
        const blockBaseFee = header.baseFeePerGas / 10 ** 9
        const blockTimestamp = header.timestamp


        let transactionCount = 0
        let contractCount = 0
        let contractList = []

        // On met à jour le fichier des wallets survéillés
        // Fait ici car besoin d'une mise à jour en direct
        const cachedTargets = await fs.readFile(trackerFile, 'utf8');
        const targetsTable = JSON.parse(cachedTargets)
        const targetsList = targetsTable.map((object) => object.address.toLowerCase());


        await web3.eth.getBlock(blockNumber, true, async (error, block) => {
            if (error) {
                console.error('Erreur lors de la récupération du bloc :', error);
                return;
            }

            // Parcourez les transactions du bloc
            block.transactions.forEach(async transaction => {

                transactionCount++

                // On déclare les valeurs de la transaction
                // Valeurs réutilisé tout au long des monitors et executant
                const to = transaction.to
                const from = transaction.from.toLowerCase()
                const value = transaction.value
                const input = transaction.input


                // Nouveau contrat
                if (to == null && input !== '0x' && value == 0) {

                    newContract(transaction)

                }



                // Transactions smart money erc20
                if (coinSMList.includes(from)) {

                    coinSmartmoney(transaction)

                }



                // Wallet tracker ERC20
                if (targetsList.includes(from)) {

                    coinTracker(transaction)

                }


                // Wallet tracker ERC721
                if (to != null && (to.toLowerCase() === blurV3_address || to.toLowerCase() === seaport15_address)) {

                    nftMonitors(transaction)

                }


            })
        });








        // Pour chaque block on récupère les informations
        // On les envoie à la fonction qui affiche le nouveau bloc
        //Block monitor
        let burntFees = (header.baseFeePerGas / 10 ** 18) * blockGasUsed

        let blockInfos = []
        let objBlock = {}
        objBlock.blockNumber = blockNumber
        objBlock.transactionCount = transactionCount
        objBlock.contractCount = contractCount
        objBlock.blockBaseFee = blockBaseFee
        objBlock.blockGasUsed = blockGasUsed
        objBlock.blockGasLimit = blockGasLimit
        objBlock.burntFees = burntFees
        objBlock.blockMiner = blockMiner
        objBlock.blockTimestamp = blockTimestamp
        blockInfos.push(objBlock)

        blockInfosTreatment(blockInfos, contractList)

        console.log(colors.blue("🔗 New Block: " + blockNumber))





    } catch (error) {
        console.log(error);

        // Faites quelque chose avec l'adresse du nouveau contrat, par exemple, enregistrez-la dans une base de données.
    }




});


