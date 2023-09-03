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
const web3 = new Web3('wss://mainnet.infura.io/ws/v3/' + infuraApiKey);

const axios = require('axios')



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


      const timeStamp = Date.now();
      const actualTimestamp = parseFloat(timeStamp / 1000).toFixed(0)


      const ethCallPrice = await axios.get('https://api.etherscan.io/api?module=stats&action=ethprice&apikey=' + etherscanApiKey)
      let ethPriceUsd = ethCallPrice.data.result.ethusd




      console.log(" ")
      console.log("NEW")
      console.log('Nouvelle paire créée:', eventData);



      const token0 = eventData.returnValues.token0;
      const token1 = eventData.returnValues.token1;
      const pairAddress = eventData.returnValues.pair.toLowerCase()
      const txnHash = eventData.transactionHash




      if (token0.toLowerCase() == wETHAddress.toLowerCase() || token1.toLowerCase() == wETHAddress.toLowerCase()) {


        if (token0.toLowerCase() !== wETHAddress.toLowerCase()) {

          tokenAddress = token0
          console.log("token 0 est le token")

        } else if (token1.toLowerCase() !== wETHAddress.toLowerCase()) {

          tokenAddress = token1
          console.log("token 1 est le token")

        }

        //const tokenABI = await axios.get(`https://api.etherscan.io/api?module=contract&action=getabi&address=${contractAddress}&apikey=${etherscanApiKey}`)


        const pairContract = new web3.eth.Contract(pairContractAbi, pairAddress);

        const reserves = await pairContract.methods.getReserves().call();
        //const circulatingSupplyCall = await pairContract.methods.totalSupply().call();

        console.log("step 1")
        const tokenContract = new web3.eth.Contract(erc20Standard, tokenAddress.toLowerCase());
        console.log("step 2 complete")

        const symbol = await tokenContract.methods.symbol().call();
        const name = await tokenContract.methods.name().call();
        const decimals = await tokenContract.methods.decimals().call();
        const totalSupplyCall = await tokenContract.methods.totalSupply().call();
        const owner = await tokenContract.methods.owner().call();

        const totalSupply = totalSupplyCall / 10 ** decimals
        //const circulatingSupply = circulatingSupplyCall / 10 ** decimals


        console.log(reserves)

        console.log(name + " (" + symbol + ")")
        console.log("supply: " + totalSupply)






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
        console.log('Adresse de l\'expéditeur :', devAddress);
        const balanceOfDeployer = await tokenContract.methods.balanceOf(devAddress).call();
        deployerBalance = balanceOfDeployer / 10 ** decimals

        console.log("addresse owner : " + owner)
        console.log("Price USD : " + priceUsd)
        console.log("Price ETH : " + priceEth)
        console.log("MC : " + marketCap)
        console.log("MC : " + deployerBalance)



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
            { name: "Links", value: '[Etherscan](https://etherscan.io/address/' + tokenAddress + ") ∙ " + '[Etherscan LP](https://etherscan.io/address/' + pairAddress + ") ∙ " + '[DexScreener](https://dexscreener.com/ethereum/' + tokenAddress + ") ∙ " + '[DexSpy](https://dexspy.io/eth/token/' + tokenAddress + ") ∙ " + '[Uniswap](https://app.uniswap.org/#/tokens/ethereum/' + tokenAddress + ") ∙ " + '[DefiLlama](https://swap.defillama.com/?chain=ethereum&from=0x0000000000000000000000000000000000000000&to=' + tokenAddress + ") ∙ " + '[Honeypot](   https://honeypot.is/ethereum?address=' + tokenAddress + ") ∙ " + '[Holders](https://etherscan.io/token/tokenholderchart/' + tokenAddress + ")", inline: false },


          )
          .setTimestamp()
          .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });



        await channelNewPair.send({ embeds: [newPair] });


        

        if (ownership == "✅ Renounced" && liquidity >= 10 && (deployerBalance + ownerBalance) <= 0) {
          console.log("ici")

          newPair.setDescription(">>> A new filtered pair has been created. Filtered pairs have : ownership renounced, no balance owns by contract owner or deployer, and at least 10k of liquidity.")


          await channelFilteredPair.send({ embeds: [newPair] });


        }
      }

    } catch (error) {

      console.log(error)


    }


  })
  .on('error', error => {


    console.error('Erreur:', error);
  });










