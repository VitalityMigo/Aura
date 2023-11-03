 const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
 const { apimonitorsql, apiproviderssql, adminsql, paymentHistory, accessSql, interactionData, reportsql, sequelize } = require('./database')

const factoryContractAbi = require("../contracts/uniswap/factory.json")
const pairContractAbi = require("../contracts/uniswap/pair.json")
const erc20Standard = require("../contracts/uniswap/erc20standart.json")

const pinklockAbi = require("../contracts/lockliquidity/pinklock.json")
const unxcAbi = require("../contracts/lockliquidity/uncx.json")



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



function formatWallet(input) {
    return input.length > 35 ? `${input.substring(0, 5)}…${input.substring(input.length - 4)}` : input;
}



// On définit le client et charge les channels
const client = require('../bot'); // Chemin vers le fichier client.js

let serverId = ""
let channelLPLocksId = ""
let channelLPLocks = ""

setTimeout(() => {

    const botId = client.user.id;

    if (botId == "1074328639165964368") {
        // PROD
        serverId = "1108754348818845729"
        channelLPLocksId = "1152250044481798214"

    } else if (botId == "1119666128411709552") {
        // DEV
        serverId = "1071576735298113667"
        channelLPLocksId = "1104225853023461388"
    }

    const botGuild = client.guilds.cache.get(serverId);
    channelLPLocks = botGuild.channels.cache.get(channelLPLocksId);

}, 3000);





// On définit les constantes et variables principales
const factoryContractAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const wETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"

const pinklockContractAddress = "0x71b5759d73262fbb223956913ecf4ecc51057641"
const uncxContractAddress = "0x663a5c229c09b049e36dcc11a9b0d4a8eb9db214"


// Création de l'instance du Factory Contract
const unxcContract = new web3.eth.Contract(unxcAbi, uncxContractAddress);
const pinklockContract = new web3.eth.Contract(pinklockAbi, pinklockContractAddress);

// Écouter l'événement de création de paire
pinklockContract.events.LockAdded()
    .on('data', async eventData => {

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





        try {


            const timeStamp = Date.now();
            const actualTimestamp = parseFloat(timeStamp / 1000).toFixed(0)


            const ethCallPrice = await axios.get('https://api.etherscan.io/api?module=stats&action=ethprice&apikey=' + etherscanApiKey)
            let ethPriceUsd = ethCallPrice.data.result.ethusd


          

            const pairAddress = eventData.returnValues.token.toLowerCase()
            const sender = eventData.returnValues.owner.toLowerCase()
            const supplyLocked = eventData.returnValues.amount / 10**18
            const unlockDate = eventData.returnValues.unlockDate
            const txnHash = eventData.transactionHash

            console.log(colors.magenta("🔒 Nouvelle LP Lock [PINK]"))
            console.log("Pair: " + pairAddress)
            console.log("Txn: " + txnHash)


            createdSince = "<t:" + unlockDate + ":R>"


               // on récupère les infos de la pool uniswap
               const pairContract = new web3.eth.Contract(pairContractAbi, pairAddress);
               const token0 = await pairContract.methods.token0().call();
               const token1 = await pairContract.methods.token1().call();


            // On commence la recherche de données 


            // On commence la recherche de données 


            // On définit le token qui est le bon
            let whichToken = "token0"
            if (token0.toLowerCase() == wETHAddress.toLowerCase() || token1.toLowerCase() == wETHAddress.toLowerCase()) {


                if (token0.toLowerCase() !== wETHAddress.toLowerCase()) {

                    tokenAddress = token0

                } else if (token1.toLowerCase() !== wETHAddress.toLowerCase()) {

                    tokenAddress = token1
                    whichToken = "token1"

                }


            }

            const reserves = await pairContract.methods.getReserves().call();
            const circulatingSupplyCall = await pairContract.methods.totalSupply().call();
            const lpSupply = circulatingSupplyCall / 10 ** 18
            const lockedPart = 100 * supplyLocked / lpSupply


            // On récupère les infos du token
            const tokenContract = new web3.eth.Contract(erc20Standard, tokenAddress.toLowerCase());

            const symbol = await tokenContract.methods.symbol().call();
            const name = await tokenContract.methods.name().call();
            const decimals = await tokenContract.methods.decimals().call();
            const totalSupplyCall = await tokenContract.methods.totalSupply().call();
            const owner = await tokenContract.methods.owner().call();
            const totalSupply = totalSupplyCall / 10 ** decimals

            // on estime le prix, marketcap et d'autre chose
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




            const deploymentInfos = await axios.get("https://api.etherscan.io/api?module=contract&action=getcontractcreation&contractaddresses=" + tokenAddress + "&apikey=" + etherscanApiKey)

            const devAddress = await deploymentInfos.data.result[0].contractCreator.toLowerCase()
            const deploymentTxn = await deploymentInfos.data.result[0].txHash


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


            const buttonsRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setCustomId('button_exec_open_panel_' + tokenAddress.toLowerCase())
                .setLabel('📊 Trade Panel')
                .setStyle(1),
            );

            /// RENVOI DE L'EMBED
            const newPair = new EmbedBuilder().setColor("#060A8F")
                .setTitle(reduceText(name, 40) + " (" + symbol.toUpperCase() + ")")
                .setDescription(">>> A pool just locked liquidities")
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
                    { name: "LP Token Supply", value: "`" + formatCoinValueSign(lpSupply) + "`", inline: true },
                    { name: "Locked Supply", value: "`" + parseFloat(lockedPart).toFixed(2) + "%`", inline: true },
                    { name: "Sender", value: "`" + formatWallet(sender.toUpperCase()) + "`", inline: true },
                    { name: "Unlock Date", value: createdSince, inline: true },
                    { name: "Links", value: '[Etherscan](https://etherscan.io/address/' + tokenAddress + ") ∙ " + '[Etherscan LP](https://etherscan.io/address/' + pairAddress + ") ∙ " + '[DexScreener](https://dexscreener.com/ethereum/' + tokenAddress + ") ∙ " + '[DexSpy](https://dexspy.io/eth/token/' + tokenAddress + ") ∙ " + '[Uniswap](https://app.uniswap.org/#/tokens/ethereum/' + tokenAddress + ") ∙ " + '[DefiLlama](https://swap.defillama.com/?chain=ethereum&from=0x0000000000000000000000000000000000000000&to=' + tokenAddress + ") ∙ " + '[DexAnalyzer](https://www.dexanalyzer.io/token/' + tokenAddress + ") ∙ " + '[Honeypot](   https://honeypot.is/ethereum?address=' + tokenAddress + ") ∙ " + '[Holders](https://etherscan.io/token/tokenholderchart/' + tokenAddress + ") ∙ " + '[Locker Protocol](https://etherscan.io/address/' + pinklockContractAddress + ")", inline: false },
                    { name: "Quicktasks", value: '[Thunder](http://localhost:7777/quickTask?module=defi&contract=' + tokenAddress + "&action=buy&blockchain=ethereum&platform=uniswapv2) ∙ " + '[Maestro]( https://t.me/MaestroSniperBot?start=' + tokenAddress + ") ∙ " + '[Sensei](https://app.thornhill.fun/defi?token=' + tokenAddress + "&venue=UNISWAP_V2&valueEth=0.05) ∙ " + '[Waifu]( http://localhost:7780/uniswapqt?contractAddress=' + tokenAddress + "&group=Default)", inline: false },


                )
                .setTimestamp()
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });



            await channelLPLocks.send({ embeds: [newPair], components: [buttonsRow] });



        } catch (error) {

            console.log(error)


        }


    })
    .on('error', error => {


        console.error('Erreur:', error);
    });


unxcContract.events.onDeposit()
    .on('data', async eventData => {


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





        try {


            const timeStamp = Date.now();
            const actualTimestamp = parseFloat(timeStamp / 1000).toFixed(0)


            const ethCallPrice = await axios.get('https://api.etherscan.io/api?module=stats&action=ethprice&apikey=' + etherscanApiKey)
            let ethPriceUsd = ethCallPrice.data.result.ethusd



            const pairAddress = eventData.returnValues.lpToken.toLowerCase()
            const sender = eventData.returnValues.user.toLowerCase()
            const supplyLocked = eventData.returnValues.amount / 10**18
            const unlockDate = eventData.returnValues.unlockDate
            const txnHash = eventData.transactionHash

            console.log(colors.magenta("🔒 Nouvelle LP Lock [UNCX]"))
            console.log("Pair: " + pairAddress)
            console.log("Txn: " + txnHash)


            createdSince = "<t:" + unlockDate + ":R>"


               // on récupère les infos de la pool uniswap
               const pairContract = new web3.eth.Contract(pairContractAbi, pairAddress);
               const token0 = await pairContract.methods.token0().call();
               const token1 = await pairContract.methods.token1().call();


            // On commence la recherche de données 


            // On définit le token qui est le bon
            let whichToken = "token0"
            if (token0.toLowerCase() == wETHAddress.toLowerCase() || token1.toLowerCase() == wETHAddress.toLowerCase()) {


                if (token0.toLowerCase() !== wETHAddress.toLowerCase()) {

                    tokenAddress = token0

                } else if (token1.toLowerCase() !== wETHAddress.toLowerCase()) {

                    tokenAddress = token1
                    whichToken = "token1"

                }


            }

    
            const reserves = await pairContract.methods.getReserves().call();
            const circulatingSupplyCall = await pairContract.methods.totalSupply().call();
            const lpSupply = circulatingSupplyCall / 10 ** 18
            const lockedPart = 100 * supplyLocked / lpSupply


            // On récupère les infos du token
            const tokenContract = new web3.eth.Contract(erc20Standard, tokenAddress.toLowerCase());

            const symbol = await tokenContract.methods.symbol().call();
            const name = await tokenContract.methods.name().call();
            const decimals = await tokenContract.methods.decimals().call();
            const totalSupplyCall = await tokenContract.methods.totalSupply().call();
            const owner = await tokenContract.methods.owner().call();
            const totalSupply = totalSupplyCall / 10 ** decimals

            // on estime le prix, marketcap et d'autre chose
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




            const deploymentInfos = await axios.get("https://api.etherscan.io/api?module=contract&action=getcontractcreation&contractaddresses=" + tokenAddress + "&apikey=" + etherscanApiKey)

            const devAddress = await deploymentInfos.data.result[0].contractCreator.toLowerCase()
            const deploymentTxn = await deploymentInfos.data.result[0].txHash


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

            const buttonsRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setCustomId('button_exec_open_panel_' + tokenAddress.toLowerCase())
                .setLabel('📊 Trade Panel')
                .setStyle(1),
            );


            /// RENVOI DE L'EMBED
            const newPair = new EmbedBuilder().setColor("#060A8F")
                .setTitle(reduceText(name, 40) + " (" + symbol.toUpperCase() + ")")
                .setDescription(">>> A pool just locked liquidities")
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
                    { name: "LP Token Supply", value: "`" + formatCoinValueSign(lpSupply) + "`", inline: true },
                    { name: "Locked Supply", value: "`" + parseFloat(lockedPart).toFixed(2) + "%`", inline: true },
                    { name: "Sender", value: "`" + formatWallet(sender.toUpperCase()) + "`", inline: true },
                    { name: "Unlock Date", value: createdSince, inline: true },
                    { name: "Links", value: '[Etherscan](https://etherscan.io/address/' + tokenAddress + ") ∙ " + '[Etherscan LP](https://etherscan.io/address/' + pairAddress + ") ∙ " + '[DexScreener](https://dexscreener.com/ethereum/' + tokenAddress + ") ∙ " + '[DexSpy](https://dexspy.io/eth/token/' + tokenAddress + ") ∙ " + '[Uniswap](https://app.uniswap.org/#/tokens/ethereum/' + tokenAddress + ") ∙ " + '[DefiLlama](https://swap.defillama.com/?chain=ethereum&from=0x0000000000000000000000000000000000000000&to=' + tokenAddress + ") ∙ " + '[DexAnalyzer](https://www.dexanalyzer.io/token/' + tokenAddress + ") ∙ " + '[Honeypot](   https://honeypot.is/ethereum?address=' + tokenAddress + ") ∙ " + '[Holders](https://etherscan.io/token/tokenholderchart/' + tokenAddress + ") ∙ " + '[Locker Protocol](https://etherscan.io/address/' + uncxContractAddress + ")", inline: false },
                    { name: "Quicktasks", value: '[Thunder](http://localhost:7777/quickTask?module=defi&contract=' + tokenAddress + "&action=buy&blockchain=ethereum&platform=uniswapv2) ∙ " + '[Maestro]( https://t.me/MaestroSniperBot?start=' + tokenAddress + ") ∙ " + '[Sensei](https://app.thornhill.fun/defi?token=' + tokenAddress + "&venue=UNISWAP_V2&valueEth=0.05) ∙ " + '[Waifu]( http://localhost:7780/uniswapqt?contractAddress=' + tokenAddress + "&group=Default)", inline: false },


                )
                .setTimestamp()
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });



            await channelLPLocks.send({ embeds: [newPair], components: [buttonsRow] });



        } catch (error) {

            console.log(error)


        }


    })
    .on('error', error => {


        console.error('Erreur:', error);
    });









