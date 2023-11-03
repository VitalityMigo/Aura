const { EmbedBuilder } = require("discord.js");
const { apimonitorsql, apiproviderssql, adminsql, paymentHistory, accessSql, interactionData, reportsql, sequelize } = require('./database')

const factoryContractAbi = require("../contracts/uniswap/factory.json")
const pairContractAbi = require("../contracts/uniswap/pair.json")
const erc20Standard = require("../contracts/uniswap/erc20standart.json")


const formatCoinValueSign = require("../functions/formatNumberEmbed")
const reduceText = require("../functions/reducetext")

//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const infuraApiKey = process.env.infuraApiKey
const etherscanApiKey = process.env.etherscanApiKey


const Web3 = require('web3');
//const web3 = new Web3("https://cloudflare-eth.com")
const web3 = new Web3('wss://mainnet.infura.io/ws/v3/' + infuraApiKey);

const axios = require('axios')
const colors = require('colors');



// On définit le client et charge les channels
const client = require('../bot'); // Chemin vers le fichier client.js

let serverId = ""
let channelNewPairId = ""
let channelFilteredPairId = ""

let channelNewPair = ""
let channelFilteredPair = ""

setTimeout(() => {

    const botId = client.user.id;

    if (botId == "1074328639165964368") {
        // PROD
        serverId = "1108754348818845729"
        channelNewPairId = "1147118393355411467"
        channelFilteredPairId = "1147118992822116382"

    } else if (botId == "1119666128411709552") {
        // DEV
        serverId = "1071576735298113667"
        channelNewPairId = "1104225853023461388"
        channelFilteredPairId = "1104225853023461388"
    }

    const botGuild = client.guilds.cache.get(serverId);
    channelNewPair = botGuild.channels.cache.get(channelNewPairId);
    channelFilteredPair = botGuild.channels.cache.get(channelFilteredPairId);

}, 3000);







// const botId = client.user.id;
// const botInfos = await adminsql.findOne({ where: { botId: botId } })
// const botServer = botInfos.mainServerId
// const botChannelId = botInfos.logChannelId
// const botGuild = client.guilds.cache.get(botServer);
// const botChannelFormatted = botGuild.channels.cache.get(botChannelId);




// On définit les constantes et variables principales
const factoryContractAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const wETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"


let tokenAddress = ""

let priceEth = 0
let priceUsd = 0
let marketCap = 0
let pooledETH = 0
let pooledToken = 0
let liquidity = 0
let reserveToken0 = ""
let reserveToken1 = ""

let ownership = "N/A"
let devBalance = 0
let deployerBalance = 0
let ownerBalance = 0
let createdSince = "`Unknown`"



// Création de l'instance du Factory Contract
const factoryContract = new web3.eth.Contract(factoryContractAbi, factoryContractAddress);

// Écouter l'événement de création de paire
factoryContract.events.PairCreated()
    .on('data', async eventData => {


        try {

            console.log(colors.magenta("🦄 Nouvelle paire crée"))


            const timeStamp = Date.now();
            const actualTimestamp = parseFloat(timeStamp / 1000).toFixed(0)


            const ethCallPrice = await axios.get('https://api.etherscan.io/api?module=stats&action=ethprice&apikey=' + etherscanApiKey)
            let ethPriceUsd = ethCallPrice.data.result.ethusd





            const token0 = eventData.returnValues.token0;
            const token1 = eventData.returnValues.token1;
            const pairAddress = eventData.returnValues.pair.toLowerCase()
            const txnHash = eventData.transactionHash


            let whichToken = "token0"

            if (token0.toLowerCase() == wETHAddress.toLowerCase() || token1.toLowerCase() == wETHAddress.toLowerCase()) {


                if (token0.toLowerCase() !== wETHAddress.toLowerCase()) {

                    tokenAddress = token0

                } else if (token1.toLowerCase() !== wETHAddress.toLowerCase()) {

                    tokenAddress = token1
                    whichToken = "token1"

                }

                //const tokenABI = await axios.get(`https://api.etherscan.io/api?module=contract&action=getabi&address=${contractAddress}&apikey=${etherscanApiKey}`)


                const pairContract = new web3.eth.Contract(pairContractAbi, pairAddress);

                const reserves = await pairContract.methods.getReserves().call();
                //const circulatingSupplyCall = await pairContract.methods.totalSupply().call();


                const tokenContract = new web3.eth.Contract(erc20Standard, tokenAddress.toLowerCase());


                const symbol = await tokenContract.methods.symbol().call();
                const name = await tokenContract.methods.name().call();
                const decimals = await tokenContract.methods.decimals().call();
                const totalSupplyCall = await tokenContract.methods.totalSupply().call();
                const owner = await tokenContract.methods.owner().call();

                const totalSupply = totalSupplyCall / 10 ** decimals

                console.log("Name: " + name + "(" + symbol + ")")
                console.log("Contract: " + tokenAddress)
                console.log("Txn: " + txnHash)






                if (token0.toLowerCase() !== wETHAddress.toLowerCase()) {


                    reserveToken0 = reserves._reserve0 / 10 ** decimals
                    reserveToken1 = reserves._reserve1 / 10 ** 18

                    pooledETH = reserveToken1
                    pooledToken = reserveToken0
                    liquidity = (reserveToken1 * 2) * ethPriceUsd

                    if (reserveToken1 != 0) {

                        priceEth = reserveToken1 / reserveToken0

                    }


                } else if (token1.toLowerCase() !== wETHAddress.toLowerCase()) {

                    reserveToken0 = reserves._reserve0 / 10 ** 18
                    reserveToken1 = reserves._reserve1 / 10 ** decimals

                    pooledETH = reserveToken0
                    pooledToken = reserveToken1
                    liquidity = (reserveToken0 * 2) * ethPriceUsd

                    if (reserveToken0 != 0) {

                        priceEth = reserveToken0 / reserveToken1
                    }
                }




                priceUsd = priceEth * ethPriceUsd
                marketCap = priceUsd * totalSupply;




                // Utilisez web3 pour obtenir les détails de la transaction
                const creationTxnCall = await web3.eth.getTransaction(txnHash)

                const devAddress = creationTxnCall.from; // Adresse de l'expéditeur (owner) de la transaction

                const balanceOfDeployer = await tokenContract.methods.balanceOf(devAddress).call();
                deployerBalance = balanceOfDeployer / 10 ** decimals



                if (owner.toLowerCase() == "0x0000000000000000000000000000000000000000" || owner.toLowerCase() == "0x000000000000000000000000000000000000dead") {

                    ownership = "✅ Renounced"
                    devBalance = parseFloat((deployerBalance * priceUsd) / priceUsd).toFixed(3) + "Ξ (" + parseFloat((deployerBalance / totalSupply) * 100).toFixed(1) + "%)"

                } else {

                    if (owner.toLowerCase() != devAddress.toLowerCase()) {

                        const balanceOfOwner = await tokenContract.methods.balanceOf(owner).call();
                        ownerBalance = balanceOfOwner / 10 ** decimals

                    }

                    ownership = "❌ Not renounced"
                    devBalance = parseFloat(((deployerBalance + ownerBalance / 2) * priceUsd) / ethPriceUsd).toFixed(3) + "Ξ (" + parseFloat((((deployerBalance + ownerBalance) / 2) / totalSupply) * 100).toFixed(1) + "%)"

                }

                createdSince = "<t:" + actualTimestamp + ":R>"

                const buttonsRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('button_exec_open_panel_' + tokenAddress.toLowerCase())
                            .setLabel(':bar_chart: Trade Panel')
                            .setStyle(1),
                    );


                /// RENVOI DE L'EMBED
                const newPair = new EmbedBuilder().setColor("#060A8F")
                    .setTitle(reduceText(name, 40) + " (" + symbol.toUpperCase() + ")")
                    .setDescription(">>> A new pair has been created")
                    .addFields(
                        { name: " ", value: " ", inline: false },
                        { name: "Contract", value: "`" + tokenAddress.toLowerCase() + "`", inline: false },
                        { name: "ETH Price", value: "`" + parseFloat(priceEth).toFixed(5) + "Ξ`", inline: true },
                        { name: "USD Price", value: "`" + priceUsd + "$`", inline: true },
                        { name: " ", value: " ", inline: true },
                        { name: "Supply", value: "`" + formatCoinValueSign(totalSupply, 2) + "`", inline: true },
                        { name: "Circulating Supply", value: "`" + formatCoinValueSign(totalSupply, 2) + "`", inline: true },
                        { name: "Market Cap", value: "`" + formatCoinValueSign(marketCap) + "$`", inline: true },
                        { name: "Liquidity", value: "`" + formatCoinValueSign(liquidity) + "$`", inline: true },
                        { name: "Pooled ETH", value: "`" + parseFloat(pooledETH).toFixed(3) + "Ξ`", inline: true },
                        { name: "Pooled " + symbol.toUpperCase(), value: "`" + formatCoinValueSign(pooledToken) + "`", inline: true },
                        { name: "Dev. Balance", value: "`" + devBalance + "`", inline: true },
                        { name: "Ownership", value: "`" + ownership + "`", inline: true },
                        { name: "Pair Created", value: createdSince, inline: true },
                        { name: "Links", value: '[Etherscan](https://etherscan.io/address/' + tokenAddress + ") ∙ " + '[Etherscan LP](https://etherscan.io/address/' + pairAddress + ") ∙ " + '[DexScreener](https://dexscreener.com/ethereum/' + tokenAddress + ") ∙ " + '[DexSpy](https://dexspy.io/eth/token/' + tokenAddress + ") ∙ " + '[Uniswap](https://app.uniswap.org/#/tokens/ethereum/' + tokenAddress + ") ∙ " + '[DefiLlama](https://swap.defillama.com/?chain=ethereum&from=0x0000000000000000000000000000000000000000&to=' + tokenAddress + ") ∙ " + '[DexAnalyzer](https://www.dexanalyzer.io/token/' + tokenAddress + ") ∙ " + '[Honeypot](   https://honeypot.is/ethereum?address=' + tokenAddress + ") ∙ " + '[Holders](https://etherscan.io/token/tokenholderchart/' + tokenAddress + ")", inline: false },
                        { name: "Quicktasks", value: '[Thunder](http://localhost:7777/quickTask?module=defi&contract=' + tokenAddress + "&action=buy&blockchain=ethereum&platform=uniswapv2) ∙ " + '[Maestro]( https://t.me/MaestroSniperBot?start=' + tokenAddress + ") ∙ " + '[Sensei](https://app.thornhill.fun/defi?token=' + tokenAddress + "&venue=UNISWAP_V2&valueEth=0.05) ∙ " + '[Waifu]( http://localhost:7780/uniswapqt?contractAddress=' + tokenAddress + "&group=Default)", inline: false },


                    )
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });



                await channelNewPair.send({ embeds: [newPair], components: [buttonsRow] });




                if (ownership == "✅ Renounced" && liquidity >= 10 && (deployerBalance + ownerBalance) <= 0) {


                    newPair.setDescription(">>> A new filtered pair has been created. Filtered pairs have : ownership renounced, no balance owns by contract owner or deployer, and at least 10k of liquidity.")


                    await channelFilteredPair.send({ embeds: [newPair], components: [buttonsRow] });


                }


                // // On vérifie qu'aucun token similaire n'est dispo
                // const tokenDB = erc20.findOne({ where: { contractAddress: tokenAddress.toLowerCase() } })


                // // Il existe pas, on le crée
                // if (tokenDB == null) {

                //     let infoTable = []
                //     let obj = {}
                //     obj.supply = totalSupply
                //     obj.deployer = devAddress.toLowerCase()
                //     obj.deployerBalance = deployerBalance
                //     obj.owner = owner.toLowerCase()
                //     obj.ownerBalance = ownerBalance
                //     obj.decimals = decimals
                //     infoTable.push(obj)

                //     let infoTable2 = []
                //     let obj2 = {}
                //     obj.pair = pairAddress.toLowerCase()
                //     obj.tokenIndex = whichToken
                //     obj.priceUsd = priceUsd.toString()
                //     obj.marketCap = marketCap.toString()
                //     obj.liquidity = liquidity.toString()
                //     obj.pooledETH = pooledETH.toString()
                //     obj.createdAt = actualTimestamp
                //     infoTable2.push(obj2)



                //     //On enregistre le call
                //     erc20.create({
                //         interactionId: "1",
                //         contractAddress: tokenAddress.toLowerCase(),
                //         name: name.toString(),
                //         symbol: symbol.toString(),
                //         type: type,
                //         table1: JSON.stringify(infoTable),
                //         table2: JSON.stringify(infoTable2),
                //         created: actualTimestamp,

                //     })

                // } else if (tokenDB != null) {

                //     let infoTable = JSON.parse(tokenDB.dataValues.table1)


                //     infoTable[0].supply = totalSupply
                //     infoTable[0].deployer = deployer.toLowerCase()
                //     infoTable[0].deployerBalance = deployerBalance
                //     infoTable[0].owner = owner.toLowerCase()
                //     infoTable[0].ownerBalance = ownerBalance
                //     infoTable[0].decimals = decimals.toString()

                //     let infoTable2 = []
                //     let obj = {}
                //     obj.pair = pairAddress.toLowerCase()
                //     obj.tokenIndex = whichToken
                //     obj.priceUsd = priceUsd.toString()
                //     obj.marketCap = marketCap.toString()
                //     obj.liquidity = liquidity.toString()
                //     obj.pooledETH = pooledETH.toString()
                //     obj.createdAt = actualTimestamp
                //     infoTable2.push(obj)


                //     await erc20.update({
                //         table1: JSON.stringify(infoTable),
                //         table2: JSON.stringify(infoTable2),
                //     }, { where: { contractAddress: tokenAddress.toLowerCase() } })





                // }






            }

        } catch (error) {

            console.log(error)


        }


    })
    .on('error', error => {


        console.error('Erreur:', error);
    });










