const { EmbedBuilder } = require("discord.js");
const { apimonitorsql, apiproviderssql, adminsql, paymentHistory, accessSql, interactionData, reportsql, erc20, sequelize } = require('./database')

const erc20Standard = require("../contracts/uniswap/erc20standart.json")
const erc721Standard = require("../contracts/blur/erc721standard.json")

const formatCoinValueSign = require("../functions/formatNumberEmbed")
const reduceText = require("../functions/reducetext")
const contractType = require("../functions/contracttype")
const blockInfosTreatment = require("../functions/newblock")

//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const infuraApiKey = process.env.infuraApiKey
const etherscanApiKey = process.env.etherscanApiKey



const Web3 = require('web3');
const web3Call = new Web3("https://cloudflare-eth.com")
const web3 = new Web3(new Web3.providers.WebsocketProvider(`wss://mainnet.infura.io/ws/v3/${infuraApiKey}`, {
    clientConfig: {
        // Ajustez la taille maximale des trames et des messages selon vos besoins.
        maxReceivedFrameSize: 10000000000, // Taille maximale des trames reçues en octets.
        maxReceivedMessageSize: 10000000000, // Taille maximale des messages reçus en octets.
    }
}));

const axios = require('axios')



function formatWallet(input) {
    return input.length > 35 ? `${input.substring(0, 6)}…${input.substring(input.length - 6)}` : input;
}


// On définit le client et charge les channels
const client = require('../bot'); // Chemin vers le fichier client.js

let serverId = ""
let channelNewERC20ContractId = ""
let channelNewERC721ContractId = ""

let channelNewERC20Contract = ""
let channelNewERC721Contract = ""

setTimeout(() => {

    const botId = client.user.id;

    if (botId == "1074328639165964368") {
        // PROD

        serverId = "1108754348818845729"
        channelNewERC20ContractId = "1148045555667304528"
        channelNewERC721ContractId = "1148045614920241192"

    } else if (botId == "1119666128411709552") {
        // DEV

        serverId = "1071576735298113667"
        channelNewERC20ContractId = "1104225853023461388"
        channelNewERC721ContractId = "1104225853023461388"
    }

    const botGuild = client.guilds.cache.get(serverId);
    channelNewERC20Contract = botGuild.channels.cache.get(channelNewERC20ContractId);
    channelNewERC721Contract = botGuild.channels.cache.get(channelNewERC721ContractId);

}, 3000);








let contract = ""
let type = ""
let name = ""
let symbol = ""

let createdSince = ""
let deployer = ""
let ownership = ""
let devBalance = ""
let deployerTxnCount = ""
let deploymentTxn = ""

let supply = ""
let totalSupply = ""
let decimals = ""
let owner = ""
let deployerBalance = ""
let ownerBalance = ""

// ON lance l'écoute
web3.eth.subscribe('newBlockHeaders', async (error, header) => {


    try {

        setTimeout(() => {

        }, 1500);

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


        console.log("//// New Block ⏩ " + blockNumber)

        await web3.eth.getBlock(blockNumber, true, async (error, block) => {
            if (error) {
                console.error('Erreur lors de la récupération du bloc :', error);
                return;
            }


            // Parcourez les transactions du bloc
            block.transactions.forEach(async transaction => {

                transactionCount++

                if (transaction.to == null && transaction.input !== '0x' && transaction.value == 0) {

                    await web3.eth.getTransactionReceipt(transaction.hash)
                        .then(async receipt => {


                            if (receipt) {

                                if (receipt.contractAddress !== null) {

                                    contractCount++

                                    contract = receipt.contractAddress
                                    deployer = receipt.from
                                    deploymentTxn = receipt.transactionHash
                                    deployerTxnCount = (transaction.nonce + 1).toString()
                                    type = await contractType(contract)

                                    console.log(`🟢 Nouveau contrat déployé : ` + deploymentTxn + " au bloc " + blockNumber);
                                    console.log(`L'adresse du contrat déployé est : ${contract} at  ${deploymentTxn} from ${deployer} and type ${type}`);


                                    if (type == "ERC20") {

                                        const tokenContract = await new web3Call.eth.Contract(erc20Standard, contract);
                                        decimals = await tokenContract.methods.decimals().call();
                                        owner = await tokenContract.methods.owner().call();
                                        name = await tokenContract.methods.name().call();
                                        symbol = await tokenContract.methods.symbol().call();
                                        supply = await tokenContract.methods.totalSupply().call();
                                        totalSupply = supply / 10 ** decimals

                                        const balanceOfDeployer = await tokenContract.methods.balanceOf(deployer).call();
                                        deployerBalance = balanceOfDeployer / 10 ** decimals

                                        if (owner.toLowerCase() == "0x0000000000000000000000000000000000000000" || owner.toLowerCase() == "0x000000000000000000000000000000000000dead") {

                                            ownership = "✅ Renounced"
                                            devBalance = formatCoinValueSign(deployerBalance) + " (" + parseFloat((deployerBalance / totalSupply) * 100).toFixed(1) + "%)"

                                        } else {

                                            if (owner.toLowerCase() != deployer.toLowerCase()) {

                                                const balanceOfOwner = await tokenContract.methods.balanceOf(owner).call();
                                                ownerBalance = balanceOfOwner / 10 ** decimals

                                            }

                                            ownership = "❌ Not renounced"
                                            devBalance = formatCoinValueSign(deployerBalance + ownerBalance) + " (" + parseFloat(((deployerBalance + ownerBalance) / totalSupply) * 100).toFixed(1) + "%)"

                                        }






                                        const newERC20 = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle(reduceText(name, 40) + " (" + symbol.toUpperCase() + ")")
                                            .setDescription(">>> A new ERC20 contract has been created")
                                            .addFields(
                                                { name: " ", value: " ", inline: false },
                                                { name: "Contract", value: "`" + contract.toLowerCase() + "`", inline: false },
                                                { name: "Supply", value: "`" + formatCoinValueSign(totalSupply, 2) + "`", inline: true },
                                                { name: "Type", value: "`" + type.toUpperCase() + "`", inline: true },
                                                { name: "Dev. Txn Count", value: "`" + deployerTxnCount + "`", inline: true },
                                                { name: "Dev. Balance", value: "`" + devBalance + "`", inline: true },
                                                { name: "Ownership", value: "`" + ownership + "`", inline: true },
                                                { name: "Contract Created", value: createdSince, inline: true },
                                                { name: "Links", value: '[Etherscan](https://etherscan.io/address/' + contract + ") ∙ " + '[DexScreener](https://dexscreener.com/ethereum/' + contract + ") ∙ " + '[DexSpy](https://dexspy.io/eth/token/' + contract + ") ∙ " + '[Uniswap](https://app.uniswap.org/#/tokens/ethereum/' + contract + ") ∙ " + '[DefiLlama](https://swap.defillama.com/?chain=ethereum&from=0x0000000000000000000000000000000000000000&to=' + contract + ") ∙ " + '[DexAnalyzer](https://www.dexanalyzer.io/token/' + contract + ") ∙ " + '[Honeypot](   https://honeypot.is/ethereum?address=' + contract + ") ∙ " + '[Holders](https://etherscan.io/token/tokenholderchart/' + contract + ")", inline: false },
                                                { name: "Quicktasks", value: '[Thunder](http://localhost:7777/quickTask?module=defi&contract=' + contract + "&action=buy&blockchain=ethereum&platform=uniswapv2) ∙ " + '[Maestro]( https://t.me/MaestroSniperBot?start=' + contract + ") ∙ " + '[Sensei](https://app.thornhill.fun/defi?token=' + contract + "&venue=UNISWAP_V2&valueEth=0.05) ∙ " + '[Waifu]( http://localhost:7780/uniswapqt?contractAddress=' + contract + "&group=Default)", inline: false },


                                            )
                                            .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });



                                        await channelNewERC20Contract.send({ embeds: [newERC20] });


                                        let obj20 = {}
                                        obj20.name = name
                                        obj20.symbal = symbol
                                        obj20.type = type
                                        obj20.contract = contract
                                        contractList.push(obj20)


                                    } else if (type == "ERC721") {



                                        const tokenContract = await new web3Call.eth.Contract(erc721Standard, contract);
                                        owner = await tokenContract.methods.owner().call();
                                        name = await tokenContract.methods.name().call();
                                        symbol = await tokenContract.methods.symbol().call();
                                        totalSupply = await tokenContract.methods.totalSupply().call();

                                        const balanceOfDeployer = await tokenContract.methods.balanceOf(deployer).call();
                                        deployerBalance = balanceOfDeployer

                                        if (owner.toLowerCase() == "0x0000000000000000000000000000000000000000" || owner.toLowerCase() == "0x000000000000000000000000000000000000dead") {

                                            ownership = "✅ Renounced"
                                            devBalance = formatCoinValueSign(deployerBalance) + " (" + parseFloat((deployerBalance / totalSupply) * 100).toFixed(1) + "%)"

                                        } else {

                                            if (owner.toLowerCase() != deployer.toLowerCase()) {

                                                const balanceOfOwner = await tokenContract.methods.balanceOf(owner).call();
                                                ownerBalance = balanceOfOwner

                                            }

                                            ownership = "❌ Not renounced"
                                            devBalance = formatCoinValueSign(deployerBalance + ownerBalance) + " (" + parseFloat(((deployerBalance + ownerBalance) / totalSupply) * 100).toFixed(1) + "%)"

                                        }






                                        const newERC721 = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle(name)
                                            .setDescription(">>> A new ERC721 contract has been created")
                                            .addFields(
                                                { name: " ", value: " ", inline: false },
                                                { name: "Contract", value: "`" + contract.toLowerCase() + "`", inline: false },
                                                { name: "Supply", value: "`" + formatCoinValueSign(totalSupply, 2) + "`", inline: true },
                                                { name: "Type", value: "`" + type.toUpperCase() + "`", inline: true },
                                                { name: "Dev. Txn Count", value: "`" + deployerTxnCount + "`", inline: true },
                                                { name: "Dev. Balance", value: "`" + devBalance + "`", inline: true },
                                                { name: "Ownership", value: "`" + ownership + "`", inline: true },
                                                { name: "Contract Created", value: createdSince, inline: true },
                                                { name: "Links", value: '[Etherscan](https://etherscan.io/address/' + contract + ") ∙ " + '[Opensea](https://opensea.io/collection/' + contract + ") ∙ " + '[Blur](https://blur.io/collection/' + contract + ") ∙ " + '[Magically](https://magically.gg/collection/' + contract + ") ∙ " + '[Holders](https://blur.io/collection/' + contract + "/holders) ∙ " + '[Deployer](https://etherscan.io/address/' + contract + ")", inline: false },


                                            )
                                            .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });



                                        await channelNewERC721Contract.send({ embeds: [newERC721] });


                                        let obj721 = {}
                                        obj721.name = name
                                        obj721.symbal = symbol
                                        obj721.type = type
                                        obj721.contract = contract
                                        contractList.push(obj721)



                                    }


                                    // //On vérifie qu'aucun token similaire n'est dispo
                                    // const tokenDB = erc20.findOne({ where: { contractAddress: contract.toLowerCase() } })


                                    // // Il existe pas, on le crée
                                    // if (tokenDB == null) {

                                    //     let infoTable = []
                                    //     let obj = {}
                                    //     obj.supply = totalSupply
                                    //     obj.deployer = deployer.toLowerCase()
                                    //     obj.deploymentTxn = deploymentTxn
                                    //     obj.deployerBalance = deployerBalance
                                    //     obj.owner = owner.toLowerCase()
                                    //     obj.ownerBalance = ownerBalance
                                    //     obj.decimals = decimals
                                    //     obj.block = blockNumber.toString()
                                    //     infoTable.push(obj)

                                    //     //On enregistre le call
                                    //     erc20.create({
                                    //         interactionId: "1",
                                    //         contractAddress: contract.toLowerCase(),
                                    //         name: name.toString(),
                                    //         symbol: symbol.toString(),
                                    //         type: type,
                                    //         table1: JSON.stringify(infoTable),
                                    //         created: actualTimestamp.toString()

                                    //     })

                                    // } else if (tokenDB != null) {

                                    //     let infoTable = JSON.parse(tokenDB.dataValues.table1)

                                    //     infoTable[0].supply = totalSupply
                                    //     infoTable[0].deployer = deployer.toLowerCase()
                                    //     infoTable[0].deploymentTxn = deploymentTxn
                                    //     infoTable[0].deployerBalance = deployerBalance
                                    //     infoTable[0].owner = owner.toLowerCase()
                                    //     infoTable[0].ownerBalance = ownerBalance
                                    //     infoTable[0].decimals = decimals
                                    //     infoTable[0].block = blockNumber.toString()


                                    //     await erc20.update({
                                    //         table1: JSON.stringify(infoTable),
                                    //         created: actualTimestamp.toString()
                                    //     }, { where: { contractAddress: contract.toLowerCase() } })





                                    // }



                                }

                            }


                        })
                        .catch(error => {
                            console.error('Erreur lors de la récupération du reçu de la transaction :', error);
                        });


                }

                ////////////

                // Code de wallet tracker pour txn normal
                // else {




                //     console.log("txn");

                // }

                ////////////


            })
        });



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

        console.log("Lancement de la fonction")
        blockInfosTreatment(blockInfos, contractList)





    } catch (error) {
        console.log(error);

        // Faites quelque chose avec l'adresse du nouveau contrat, par exemple, enregistrez-la dans une base de données.
    }




});


