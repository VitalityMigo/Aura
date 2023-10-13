const axios = require('axios')
const fs = require("fs")
const colors = require("colors")


//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const rpc1NodeBaseApiKey = process.env.rpc1NodeBaseApiKey
const blastNodeApiKey = process.env.blastNodeApiKey


const { web3Base1RPC, web3BaseBlast, web3BaseUnifra } = require('../config/web3config');


const shareContractAbi = require("../contracts/friendtech/share.json");
const shareContractAddress = "0xcf205808ed36593aa40a44f10c7f7c2f67d4a4d4"
const shareContract = new web3BaseBlast.eth.Contract(shareContractAbi, shareContractAddress);
const baseChainId = "8453"



const addTimeout = require("./addtimeout")
const sniperUserTaskList = require("./FT-snipeuserdbcall")
const getTwitterScore = require("./twitteraudit")
const getBuyPriceAfterFees = require("./FT-getbuyprice")
const decrypt = require("./decrypt")
const snipeUserHandler = require('./FT-snipe-handler')


function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}




// On définit le client et charge les channels
const client = require('../bot'); // Chemin vers le fichier client.js

let serverId = ""
let botChannel = ""
let botChannelId = ""
let botGuild


setTimeout(() => {

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





async function FTSnipeUserExec(transaction) {


    try {

        
        const gasPricePromise = web3BaseUnifra.eth.getGasPrice()


        const inputAddress = ("0x" + transaction.input.substr(34, 40)).toLowerCase()


        if (inputAddress == transaction.from.toLowerCase()) {

            const cachedUsers = require("../contracts/friendtech/newuser.json")
            const user = cachedUsers.find((object) => object.address.toLowerCase() == inputAddress.toLowerCase());

            if (user) {



                if (user.followers >= 0) {


                    const supply = await shareContract.methods.sharesSupply(inputAddress).call();
                    const buyPriceAfterFees = getBuyPriceAfterFees(parseInt(supply), 1) / 10 ** 18

                    const options = {
                        target: user.username.toLowerCase(), // Remplacez par le nom d'utilisateur ou null
                        price: buyPriceAfterFees.toString(), // Remplacez par la valeur souhaitée ou null
                        supply: supply.toString(), // Remplacez par la valeur souhaitée ou null
                        followers: user.followers.toString(), // Remplacez par la valeur souhaitée ou null
                        twitterScore: user.score.toString(), // Remplacez par la valeur souhaitée ou null
                        uniqueHolders: "100", // Remplacez par la valeur souhaitée ou null

                    };

                    const taskListRaw = await sniperUserTaskList(options)
                    const taskList = shuffleArray(taskListRaw)




                    if (taskList.length > 0) {


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


                                const data = await shareContract.methods.buyShares(inputAddress, parseInt(task.amount)).encodeABI();

                                const valueWEI = await shareContract.methods.getBuyPriceAfterFee(inputAddress, parseInt(task.amount)).call();


                                if (task.keyPrice == null || (parseFloat(valueWEI) / 10 ** 18) <= task.keyPrice) {

                                    if (task.simulation == "true") {
                                        try {
                                            await shareContract.methods.buyShares(inputAddress, parseInt(task.amount)).estimateGas({ from: decrypt(task.walletAddress), value: valueWEI });
                                        } catch (error) {

                                            isValid = false
                                            await botChannel.send("<@&1121510423687090186> Erreur évaluation du prix de snipe : " + error.stack);

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


                                        
                                        
                                        // On envoie
                                      //  web3BaseBlast.eth.sendSignedTransaction(rawTransaction)

                                        task.hash = sendHash
                                        task.status = "true"
                                        task.value = valueWEI

                                        console.log(colors.rainbow("Sniper Done !!!"))

                                        // La réponse est envoyé par la fonction adaptée
                                    }
                                }

                            } catch (error) {

                                console.log(colors.red("Erreur de boucle : " + error.stack))


                                await botChannel.send("Erreur de boucle snipe : " + error.stack);


                            }
                        }

                        snipeUserHandler("new_user", user.username, user.name, user.pfp, inputAddress, taskList)

                    }



                }

            }

        }
    } catch (error) {

        console.log("Erreur globale du snipe new user")
        console.log(error.stack)
        await botChannel.send("Erreur globale snipe : " + error.stack);

    }
}

module.exports = FTSnipeUserExec

