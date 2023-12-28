const { wssBase } = require("../config/web3config.js")

const newFriendtechUser = require('../functions/m-newFTuser')
const newSmartMoneyTrade = require('../functions/m-FTsmartmoney')
const newFTDeposit = require("../functions/m-newbasedeposit")
const FTSnipeDepositExec = require("../functions/FT-snipe-deposit")
const FTSnipeUserExec = require('../functions/FT-snipe-user')
const orderExecFT = require("../functions/FT-order-exec")
const trackerHandler = require("../functions/m-FTtracker.js")
const farmerExecFT = require('../functions/FT-farmer-exec.js')

// On définit les constantes et variables principales
const shareContractAddress = "0xcf205808ed36593aa40a44f10c7f7c2f67d4a4d4";
const smartWalletJson = require("../contracts/friendtech/smartwallet.json")
const smartWalletTable = smartWalletJson.map(obj => obj.address);
const transferSig = "0x"
const transferMin = 2


wssBase.eth.subscribe('newBlockHeaders', async (error, header) => {


    try {


        const blockNumber = header.number


        await wssBase.eth.getBlock(blockNumber, true, async (error, block) => {

            if (error) {
                console.error('Erreur lors de la récupération du bloc :', error);
                return;
            }



            await block.transactions.forEach(async transaction => {

                const input = transaction.input
                const contract = transaction.to
                const value = transaction.value
                const from = transaction.from
                const type = transaction.type
                const mint = parseInt(transaction.mint, 16)
                const hash = transaction.hash

                const buySignature = "0x6945b123"
                const sellSignature = "0xb51d0534"
                const newValue = "0"
                const valueEth = value / 10 ** 18


                if (valueEth >= transferMin && input == transferSig) {

                    const obj = {
                        mainnetAddress: from.toLowerCase(),
                        baseAddress: contract.toLowerCase(),
                        value: valueEth,
                        hash: hash,
                        type: "📥 Transfer",
                    }

                    FTSnipeDepositExec(obj)
                    newFTDeposit(obj)

                }


                // On renvoi vers le new user
                if (input.startsWith(buySignature) && contract.toLowerCase() == shareContractAddress.toLowerCase() && newValue == value) {



                    FTSnipeUserExec(transaction)

                    newFriendtechUser(transaction)


                }

                // On renvoi vers les trade order
                if ((input.startsWith(buySignature) || input.startsWith(sellSignature)) && contract.toLowerCase() == shareContractAddress.toLowerCase()) {


                    orderExecFT(transaction)
                    
                    trackerHandler(transaction)

                    farmerExecFT(transaction)

                }




                // On vérifie que ça vient d'un wallet SM, que le contrat est bien FT, que la valeur est différente de 0, et que c'est un buy ou un sell
                if (smartWalletTable.includes(from.toLowerCase()) && contract.toLowerCase() == shareContractAddress.toLowerCase() && (input.startsWith(sellSignature) || (input.startsWith(buySignature) && newValue != value))) {

                    newSmartMoneyTrade(transaction)

                }


                // // New user GM.io
                // if ((input.startsWith(gmInviteSelfSig) || input.startsWith(gmInviteSig)) && contract.toLowerCase() == gmContract.toLowerCase()) {

                //     newGMUser(transaction)

                // }







            })
        });

    } catch (error) {


        console.log("Erreur lors de la récupération du bloc: " + error)

    }


});



