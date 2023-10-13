const { web3Base1RPC, web3BaseBlast, web3BaseUnifra } = require('../config/web3config');

const fs = require('fs').promises;

const targetFile = "contracts/friendtech/ordertargets.json"

const orderDepositTaskList = require("./FT-orderdbcall")
const orderHandler = require("./FT-order-handler")
const getPrice = require("./FT-getprice")

const decrypt = require("./decrypt")
const addTimeout = require("./addtimeout")


const shareContractAbi = require("../contracts/friendtech/share.json");
const shareContractAddress = "0xcf205808ed36593aa40a44f10c7f7c2f67d4a4d4"
const shareContract = new web3BaseBlast.eth.Contract(shareContractAbi, shareContractAddress);
const baseChainId = "8453"

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

            await addTimeout(3)

            const receipt = await web3BaseUnifra.eth.getTransactionReceipt(txn)

            return receipt

        }

    } catch (error) {

        return null

    }
}


async function orderExecFT(transaction) {


    try {

        await addTimeout(2)

        console.log("Starting order....")


        const subject = ("0x" + transaction.input.substring(34, 74)).toLowerCase()


        const cachedTargets = await fs.readFile(targetFile, 'utf8');
        const targetsList = JSON.parse(cachedTargets).map((object) => object.address.toLowerCase());


        if (targetsList.includes(subject)) {

            const gasPricePromise = web3BaseUnifra.eth.getGasPrice()


            const receipt = await getReceipt(transaction.hash)

            if (receipt != null && receipt.status != false) {

                const data = receipt.logs[0].data

                const supply = parseInt(data.substring(450, 514), 16)


                const options = {
                    target: subject,
                    keyPrice: (getPrice(supply, 1) / 10 ** 18)
                }

                const tasksArray = await orderDepositTaskList(options)
                const taskList = shuffleArray(tasksArray)


                // Construction fini, on passe à la txn


                for (const task of taskList) {

                    let isValid = true

                    try {

                        // On définit les presets de gas
                        const gasLimit = 200000;
                        const gas = 21000
                        let [gasPrice] = await Promise.all([gasPricePromise]);

                        if (task.gasPreset != null) {
                            gasPrice = parseInt(gasPrice * (1 + (parseFloat(task.gasPreset) / 100)))
                        }



                        // On check si c'est un buy ou un sell
                        if (task.type == "buy") {

                            const data = await shareContract.methods.buyShares(subject, parseInt(task.amount)).encodeABI();

                            const valueWEI = await shareContract.methods.getBuyPriceAfterFee(subject, parseInt(task.amount)).call();


                            if (task.simulation == "true") {
                                try {
                                    await shareContract.methods.buyShares(userAddress, parseInt(task.amount)).estimateGas({ from: decrypt(task.walletAddress), value: valueWEI });
                                } catch (error) {

                                    isValid = false
                                    await botChannel.send("<@&1121510423687090186> Erreur évaluation du prix de order : " + error.stack);

                                }
                            }



                            if (isValid == true) {


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

                                console.log(signedTx)

                                // On envoie
                                web3BaseBlast.eth.sendSignedTransaction(rawTransaction)

                                task.hash = sendHash
                                task.status = "true"
                                task.value = valueWEI
                                task.supply = supply


                                // La réponse est envoyé par la fonction adaptée
                            }


                        } else if (task.type == "sell") {




                            const data = await shareContract.methods.sellShares(subject, parseInt(task.amount)).encodeABI();

                            const valueWEI = 0



                            if (task.simulation == "true") {
                                try {
                                    await shareContract.methods.sellShares(userAddress, parseInt(task.amount)).estimateGas({ from: decrypt(task.walletAddress), value: valueWEI });
                                } catch (error) {

                                    isValid = false
                                    await botChannel.send("<@&1121510423687090186> Erreur évaluation du prix de order : " + error.stack);

                                }
                            }



                            if (isValid == true) {


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

                                console.log(signedTx)

                                // On envoie
                                web3BaseBlast.eth.sendSignedTransaction(rawTransaction)

                                task.hash = sendHash
                                task.status = "true"
                                task.value = valueWEI
                                task.supply = supply


                                // La réponse est envoyé par la fonction adaptée
                            }





                        }

                    } catch (error) {

                        console.log("Erreur de boucle : " + error)


                        await botChannel.send("Erreur de boucle order : " + error.stack);


                    }
                }

                orderHandler(subject, taskList, transaction)

            }
        }
    } catch (error) {


        await botChannel.send("<@&1121510423687090186> Erreur global order : " + error.stack);


    }



}


module.exports = orderExecFT




function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
