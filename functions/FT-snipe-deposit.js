const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");

const Web3 = require('web3')
const web3 = new Web3("https://1rpc.io/base")

const colors = require('colors');
const axios = require('axios')

const addTimeout = require("./addtimeout")
const encrypt = require("./encrypt")
const decrypt = require("./decrypt")

const getTwitterScore = require("./twitteraudit")
const getBuyPriceAfterFees = require("./FT-getbuyprice")
const sniperDepositTaskList = require("./FT-sniperdepositdbcall")
const snipeUserHandler = require('./FT-snipe-handler')

const shareContractAbi = require("../contracts/friendtech/share.json");
const shareContractAddress = "0xcf205808ed36593aa40a44f10c7f7c2f67d4a4d4"
const shareContract = new web3.eth.Contract(shareContractAbi, shareContractAddress);

const baseChainId = "8453"


function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}



const client = require('../bot'); // Chemin vers le fichier client.js
let guild = ""
let botChannel = ""
setTimeout(() => {

    guild = client.guilds.cache.get(guildId);
    botChannel = guild.channels.cache.get("1121481984812798084");


}, 3000);




async function FTSnipeDepositExec(obj) {


    try {


        const transaction = obj

        const userAddress = transaction.baseAddress.toLowerCase()
        const value = transaction.value
        const hash = transaction.hash
        const action = transaction.type

        const gasPricePromise = web3.eth.getGasPrice()




        const supply = await shareContract.methods.sharesSupply(userAddress).call();


        // Donc l'utilisateur est bien sur Friend.Tech
        if (supply > 0) {

            let userInfoCall = ""
            let isFTUser = true

            try {
                userInfoCall = await axios.get("https://prod-api.kosetto.com/users/" + userAddress.toLowerCase())
            } catch (error) {

                isFTUser = false
                console.log("Erreur dans la récupération des infos du user FT " + error.stack)
            }


            const twitterUsername = userInfoCall.data.twitterUsername
            const twitterName = userInfoCall.data.twitterName
            const twitterPfp = userInfoCall.data.twitterPfpUrl
            const holderCount = userInfoCall.data.holderCount
            const uniqueHolders = (holderCount / supply) * 100;




            const twitterAudit = await getTwitterScore(twitterUsername)
            const score = twitterAudit.capital
            const followers = twitterAudit.data.follower


            const buyPriceAfterFees = getBuyPriceAfterFees(parseInt(supply), 1) / 10 ** 18



            const options = {
                target: twitterUsername.toLowerCase(), // Remplacez par le nom d'utilisateur ou null
                price: buyPriceAfterFees.toString(), // Remplacez par la valeur souhaitée ou null
                supply: supply.toString(), // Remplacez par la valeur souhaitée ou null
                followers: followers.toString(), // Remplacez par la valeur souhaitée ou null
                twitterScore: score.toString(), // Remplacez par la valeur souhaitée ou null
                uniqueHolders: uniqueHolders.toString(), // Remplacez par la valeur souhaitée ou null
                deposit: value, // Remplacez par la valeur souhaitée ou null


            };


            const taskListRaw = await sniperDepositTaskList(options)
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


                        const data = await shareContract.methods.buyShares(userAddress, parseInt(task.amount)).encodeABI();

                        const valueWEI = await shareContract.methods.getBuyPriceAfterFee(userAddress, parseInt(task.amount)).call();


                        if (task.keyPrice == null || (parseFloat(valueWEI) / 10 ** 18) <= task.keyPrice) {

                            if (task.simulation == "true") {
                                try {
                                    await shareContract.methods.buyShares(userAddress, parseInt(task.amount)).estimateGas({ from: decrypt(task.walletAddress), value: valueWEI });
                                } catch (error) {

                                    isValid = false
                                    await botChannel.send("<@&1121510423687090186> Erreur évaluation du prix de snipe : " + error);

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
                                const signedTx = await web3.eth.accounts.signTransaction(txInfos, decrypt(task.walletPk));
                                const rawTransaction = signedTx.rawTransaction
                                const sendHash = signedTx.transactionHash


                                // On envoie
                                web3.eth.sendSignedTransaction(rawTransaction)

                                task.hash = sendHash
                                task.status = "true"
                                task.value = valueWEI


                                // La réponse est envoyé par la fonction adaptée
                            }
                        }

                    } catch (error) {

                        console.log("Erreur de boucle : " + error)

                        
                        await botChannel.send("Erreur de boucle snipe : " + error);


                    }
                }

                snipeUserHandler("new_deposit", twitterUsername, twitterName, twitterPfp, userAddress, taskList)

            }







        }



        // Else if pas bridge mais transfert







    } catch (error) {


        console.log("Error when sniping the new deposit : " + error.stack)
        await botChannel.send("<@&1121510423687090186> Erreur global snipe : " + error);



    }


}


module.exports = FTSnipeDepositExec

