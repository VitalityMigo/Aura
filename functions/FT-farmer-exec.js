const { web3Base1RPC, web3BaseBlast, web3BaseUnifra } = require('../config/web3config');

const fs = require('fs').promises;

const targetFile = "contracts/friendtech/farmer.json"

const farmerTaskListFT = require("./FT-farmerdbcall")
const farmerHandler = require("./FT-farmer-handler")
const getPrice = require("./FT-getprice")

const decrypt = require("./decrypt")
const addTimeout = require("./addtimeout")


const shareContractAbi = require("../contracts/friendtech/share.json");
const shareContractAddress = "0xcf205808ed36593aa40a44f10c7f7c2f67d4a4d4"
const shareContract = new web3BaseBlast.eth.Contract(shareContractAbi, shareContractAddress);
const baseChainId = "8453"
const defaultBaseGas = 150000000


const buySignature = "0x6945b123"
const sellSignature = "0xb51d0534"



let serverId
let botChannelId
let botChannel
let botGuild


setTimeout(() => {
    const client = require('../bot'); // Chemin vers le fichier client.js

    const botId = client.user.id;

    if (botId == "1074328639165964368") {
        // PROD

        serverId = "1108754348818845729"
        botChannelId = "1121481984812798084"


    } else if (botId == "1119666128411709552") {
        // DEV

        serverId = "1071576735298113667"
        botChannelId = "1104225853023461388"


    }

    botGuild = client.guilds.cache.get(serverId);
    botChannel = botGuild.channels.cache.get(botChannelId);

}, 4000);



async function getReceipt(txn) {
    try {
        const receipt = await web3BaseUnifra.eth.getTransactionReceipt(txn)

        if (receipt != null) {
            return receipt

        } else {

            await addTimeout(5)

            const receipt = await web3BaseUnifra.eth.getTransactionReceipt(txn)

            return receipt

        }

    } catch (error) {

        return null

    }
}


async function farmerExecFT(transaction) {


    try {

        await addTimeout(2)



        const subject = ("0x" + transaction.input.substring(34, 74)).toLowerCase()
        const from = transaction.from.toLowerCase()

        // On ne prend pas en compte les auto buy/sell
        if (from != subject) {

            const cachedTargets = await fs.readFile(targetFile, 'utf8');
            const targetsList = JSON.parse(cachedTargets).map((object) => object.address.toLowerCase());


            if (targetsList.includes(subject)) {



                console.log("Starting farmer....")



                const receipt = await getReceipt(transaction.hash)

                if (receipt != null && receipt.status != false) {

                    const data = receipt.logs[0].data

                    const supply = parseInt(data.substring(450, 514), 16)

                    let action = "buy"
                    if (transaction.input.startsWith(sellSignature)) { action = "sell" }

                    const options = {
                        address: subject,
                        keyPrice: (getPrice(supply, 1) / 10 ** 18),
                        action: action
                    }

                    const taskList = await farmerTaskListFT(options)

                    // Construction fini, on passe à la txn

                    if (taskList != null) {

                        const task = taskList.dataValues

                        let isValid = true

                        try {


                            // On check si c'est un buy ou un sell
                            if (task.type == "buy") {


                                const holdingRaw = await shareContract.methods.sharesBalance(from, task.address).call()
                                const holding = parseInt(holdingRaw)

                                if (holding <= 0) {

                                    const data = await shareContract.methods.buyShares(from, 1).encodeABI();

                                    const valueWEI = await shareContract.methods.getBuyPriceAfterFee(from, 1).call();


                                    if (task.simulation == "true") {
                                        try {
                                            await shareContract.methods.buyShares(from, 1).estimateGas({ from: decrypt(task.walletAddress), value: valueWEI });
                                        } catch (error) {

                                            isValid = false
                                            await botChannel.send("<@&1121510423687090186> Erreur évaluation du prix de order : " + error.stack);

                                        }
                                    }



                                    if (isValid == true) {


                                        // On définit les presets de gas
                                        const gasLimit = 200000;
                                        const gas = 21000
                                        let gasPrice = await web3BaseUnifra.eth.getGasPrice()

                                        if (task.gasPreset != null && gasPrice) {
                                            gasPrice = parseInt(gasPrice * (1 + (parseFloat(task.gasPreset) / 100)))
                                        }

                                        // Si erreur de gas, default gas
                                        if (!gasPrice) {
                                            gasPrice = defaultBaseGas
                                        }



                                        //On construit l'objet de transaction
                                        const txInfos = {
                                            gasPrice: gasPrice,
                                            gas: gas,
                                            gasLimit: gasLimit,
                                            to: shareContractAddress,
                                            value: valueWEI,
                                            data: data,
                                            chainId: baseChainId,

                                        };

                                        // On signe
                                        const signedTx = await web3BaseBlast.eth.accounts.signTransaction(txInfos, decrypt(task.walletPk));
                                        const rawTransaction = signedTx.rawTransaction
                                        const sendHash = signedTx.transactionHash


                                        // On envoie
                                        web3BaseBlast.eth.sendSignedTransaction(rawTransaction)

                                        task.hash = sendHash
                                        task.status = "true"
                                        task.value = valueWEI
                                        task.supply = supply
                                        task.amount = '1'


                                        // La réponse est envoyé par la fonction adaptée
                                    }
                                }

                            } else if (task.type == "sell") {




                                const holdingRaw = await shareContract.methods.sharesBalance(from, task.address).call()
                                const holding = parseInt(holdingRaw)
                                const fromHoldingRaw = await shareContract.methods.sharesBalance(task.address, from).call()
                                const fromHolding = parseInt(fromHoldingRaw)

                                if (holding > 0 && fromHolding <= 0) {

                                    const data = await shareContract.methods.sellShares(from, holding).encodeABI();
                                    const valueWEI = 0


                                    if (task.simulation == "true") {
                                        try {
                                            await shareContract.methods.sellShares(from, holding).estimateGas({ from: decrypt(task.walletAddress), value: valueWEI });
                                        } catch (error) {

                                            isValid = false
                                            await botChannel.send("<@&1121510423687090186> Erreur évaluation du prix de order : " + error.stack);

                                        }
                                    }



                                    if (isValid == true) {


                                        // On définit les presets de gas
                                        const gasLimit = 200000;
                                        const gas = 21000
                                        let gasPrice = await web3BaseUnifra.eth.getGasPrice()

                                        if (task.gasPreset != null && gasPrice) {
                                            gasPrice = parseInt(gasPrice * (1 + (parseFloat(task.gasPreset) / 100)))
                                        }

                                        // Si erreur de gas, default gas
                                        if (!gasPrice) {
                                            gasPrice = defaultBaseGas
                                        }



                                        //On construit l'objet de transaction
                                        const txInfos = {
                                            gasPrice: gasPrice,
                                            gas: gas,
                                            gasLimit: gasLimit,
                                            to: shareContractAddress,
                                            value: valueWEI,
                                            data: data,
                                            chainId: baseChainId,

                                        };

                                        // On signe
                                        const signedTx = await web3BaseBlast.eth.accounts.signTransaction(txInfos, decrypt(task.walletPk));
                                        const rawTransaction = signedTx.rawTransaction
                                        const sendHash = signedTx.transactionHash


                                        // On envoie
                                        web3BaseBlast.eth.sendSignedTransaction(rawTransaction)

                                        task.hash = sendHash
                                        task.status = "true"
                                        task.value = valueWEI
                                        task.supply = supply
                                        task.amount = holding


                                        // La réponse est envoyé par la fonction adaptée
                                    }
                                }



                            }

                        } catch (error) {

                            console.log("Erreur farm condition : " + error)


                            await botChannel.send("Erreur de condition farm : " + error.stack);


                        }


                        farmerHandler(from, task)
                    }
                }
            }


        }
    } catch (error) {


        await botChannel.send("<@&1121510423687090186> Erreur global farm : " + error.stack);


    }



}


module.exports = farmerExecFT
