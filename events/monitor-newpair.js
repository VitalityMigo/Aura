const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");

//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const infuraApiKey = process.env.infuraApiKey

// WEB3
const Web3 = require('web3');
const web3 = new Web3('wss://mainnet.infura.io/ws/v3/' + infuraApiKey);


// Fonctions
const formatCoinValueSign = require("../functions/formatNumberEmbed")
const reduceText = require("../functions/reducetext")
const getEthPrice = require("../functions/getethprice")
const colors = require('colors');

// JSON et contrats ERC20 & Uniswap
const factoryContractAbi = require("../contracts/uniswap/factory.json")
const pairContractAbi = require("../contracts/uniswap/pair.json")
const erc20Standard = require("../contracts/uniswap/erc20standart.json")
const factoryContractAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const wETHAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"

// Création de l'instance du Factory Contract
const factoryContract = new web3.eth.Contract(factoryContractAbi, factoryContractAddress);

// On définit les addresse DEAD
const deadAddress = [
    "0x0000000000000000000000000000000000000000",
    "0x000000000000000000000000000000000000dead"
]

function formatWallet(input) {
    return input.length > 35 ? `${input.substring(0, 4)}…${input.substring(input.length - 4)}` : input;
}


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





let tokenAddress = ""

// Écouter l'événement de création de paire
factoryContract.events.PairCreated()
    .on('data', async eventData => {


        try {

            console.log(colors.magenta("🦄 Nouvelle paire crée"))

            // On récupère le timestamp de création de la paire
            // En secondes pas millisecondes
            const timeStamp = Date.now();
            const actualTimestamp = parseFloat(timeStamp / 1000).toFixed(0)
            const created = "<t:" + actualTimestamp + ":R>"


            // const ethCallPrice = await axios.get('https://api.etherscan.io/api?module=stats&action=ethprice&apikey=' + etherscanApiKey)
            // let ethPrice = ethCallPrice.data.result.ethusd



            // On récupère les logs de création
            const token0 = eventData.returnValues.token0.toLowerCase()
            const token1 = eventData.returnValues.token1.toLowerCase()
            const pairAddress = eventData.returnValues.pair.toLowerCase()
            const hash = eventData.transactionHash.toLowerCase()

            // On lance le call du prix de l'ETH
            const ethPriceCALL = getEthPrice()
            const txCALL = web3.eth.getTransaction(hash)



            // On vérifie que c'est bien du wETH qui est utilisé
            // On ne prend en compte que les paires qui sont en wETH
            // Possibilité d'améliorer en comptant toutes les quotes
            if (token0 == wETHAddress || token1 == wETHAddress) {


                if (token0.toLowerCase() !== wETHAddress.toLowerCase()) {

                    tokenAddress = token0

                } else if (token1.toLowerCase() !== wETHAddress.toLowerCase()) {

                    tokenAddress = token1

                }


                // On récupère les reserves de la paire
                // C'est le seul call qu'on fait à la paire
                const pairContract = new web3.eth.Contract(pairContractAbi, pairAddress);
                const reserves = await pairContract.methods.getReserves().call();




                // On initialise le contrat
                const tokenContract = new web3.eth.Contract(erc20Standard, tokenAddress);

                // On call toutes les fonctions du contrat en même temps
                const [decimals, rawSupply, ownerRaw] = await Promise.all([
                    tokenContract.methods.decimals().call(),
                    tokenContract.methods.totalSupply().call(),
                    tokenContract.methods.owner().call(),
                ]);
                const supply = rawSupply / 10 ** decimals
                const owner = ownerRaw.toLowerCase()


                // On résolve les promesses envoyés au début du code
                // Il y'a le prix de l'ETH est la transaction de création complète
                const [ethPrice, tx] = await Promise.all([ethPriceCALL, txCALL]);

                // On formatte les reserves
                // Puis on assigne les différentes valeurs
                const reserve = getTokenInPair(token0, token1, reserves, decimals)
                const pooledETH = reserve.quote
                const pooledTKN = reserve.token
                const liquidity = (pooledETH * 2) * ethPrice
                const price = easyPrice((pooledETH / pooledTKN) * ethPrice)
                const marketCap = price * supply

                // On récupère les information sur le deployer
                const txnCount = tx.nonce
                const deployer = tx.from.toLowerCase()
                const deployerBLNC = (await tokenContract.methods.balanceOf(deployer).call()) / 10 ** decimals
                const deployerAMNT = parseFloat((deployerBLNC * price) / ethPrice).toFixed(3) + "Ξ (" + parseFloat((deployerBLNC / supply) * 100).toFixed(1) + "%)"

                // On formatte les infos sur l'owner
                // On vérifie si le contrat est renoncé et si l'owner est le même que le dev
                let renounced = "✅ Yes"
                let ownerAMNT = deployerAMNT
                let ownerBLNC = deployerBLNC
                if (!deadAddress.includes(owner.toLowerCase())) {
                    // Le contrat n'est pas renoncé
                    renounced = "❌ No"
                    // On vérifie si le dev est le même que l'owner
                    if (owner.toLowerCase() !== deployer) {
                        ownerBLNC = (await tokenContract.methods.balanceOf(owner).call()) / 10 ** decimals
                        ownerAMNT = parseFloat((ownerBLNC * price) / ethPrice).toFixed(3) + "Ξ (" + parseFloat((ownerBLNC / supply) * 100).toFixed(1) + "%)"
                    }
                }

                // 0n crée les valeurs formattés
                // Ces valeurs vont directement dans l'embed
                const liquidityFRMT = "• Pair: [" + formatWallet(pairAddress) + "](https://etherscan.io/address/" + pairAddress + ")\n• Liquidity: `" + formatCoinValueSign(liquidity, 2) + "$`\n• Pooled WETH: `" + parseFloat(pooledETH).toFixed(3) + "Ξ`\n• Pooled Tokens: `" + formatCoinValueSign(pooledTKN, 2) + "`\n• LP Locks: `0.00% 🔒`"
                const deployerFRMT = "• Deployer: [" + formatWallet(deployer) + "](https://etherscan.io/address/" + deployer + ")\n• Amount: `" + formatCoinValueSign(deployerBLNC, 0) + "`\n• Balance: `" + deployerAMNT + "`\n• Txs: `" + txnCount + "`"
                const ownerFRMT = "• Owner: [" + formatWallet(owner) + "](https://etherscan.io/address/" + owner + ")\n• Amount: `" + formatCoinValueSign(ownerBLNC, 0) + "`\n• Balance: `" + ownerAMNT + "`"
                const tokenFRMT = "• Renounced: `" + renounced + "`\n• Supply: `" + formatCoinValueSign(supply, 2) + "`\n• Circulating: `" + formatCoinValueSign(supply, 2) + "`\n• Burned: `0.00% 🔥`"

                // On récupère le nom et symbol
                // On call toutes les fonctions du contrat en même temps
                const [symbol, name] = await Promise.all([
                    tokenContract.methods.symbol().call(),
                    tokenContract.methods.name().call(),
                ]);

                // On crée le boutton du trading panel
                const buttonsRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('button_exec_open_panel_' + tokenAddress.toLowerCase())
                            .setLabel('📊 Trade Panel')
                            .setStyle(1),
                    );


                console.log("Name: " + name + "(" + symbol + ")")
                console.log("Contract: " + pairAddress)
                console.log("Txn: " + hash)


                /// RENVOI DE L'EMBED
                const newPair = new EmbedBuilder().setColor("#060A8F")
                    .setTitle(reduceText(name, 40) + " (" + symbol.toUpperCase() + ")")
                    .setDescription(">>> A new pair has been created")
                    .addFields(
                        { name: " ", value: " ", inline: false },
                        { name: "Contract", value: "`" + tokenAddress + "`", inline: false },
                        { name: " ", value: " ", inline: false },

                        { name: "Price", value: "`" + parseFloat(price).toFixed(10) + "$`", inline: true },
                        { name: "Market Cap", value: "`" + formatCoinValueSign(marketCap) + "$`", inline: true },
                        { name: " ", value: " ", inline: true },

                        { name: " ", value: " ", inline: false },

                        { name: "🦍 Token", value: tokenFRMT, inline: true },
                        { name: "🐬 Pool", value: liquidityFRMT, inline: true },
                        { name: " ", value: " ", inline: true },

                        { name: " ", value: " ", inline: false },

                        { name: "👨🏽‍⚖️ Ownership", value: ownerFRMT, inline: true },
                        { name: "👨🏽‍💻 Deployer", value: deployerFRMT, inline: true },
                        { name: " ", value: " ", inline: true },

                        { name: " ", value: " ", inline: false },
                        { name: " ", value: "**➜** This pair was created: " + created, inline: true },
                        { name: " ", value: " ", inline: false },

                        { name: "Links", value: '[Etherscan](https://etherscan.io/address/' + tokenAddress + ") ∙ " + '[Etherscan LP](https://etherscan.io/address/' + pairAddress + ") ∙ " + '[DexScreener](https://dexscreener.com/ethereum/' + tokenAddress + ") ∙ " + '[DexSpy](https://dexspy.io/eth/token/' + tokenAddress + ") ∙ " + '[Uniswap](https://app.uniswap.org/#/tokens/ethereum/' + tokenAddress + ") ∙ " + '[DefiLlama](https://swap.defillama.com/?chain=ethereum&from=0x0000000000000000000000000000000000000000&to=' + tokenAddress + ") ∙ " + '[DexAnalyzer](https://www.dexanalyzer.io/token/' + tokenAddress + ") ∙ " + '[Honeypot](   https://honeypot.is/ethereum?address=' + tokenAddress + ") ∙ " + '[Holders](https://etherscan.io/token/tokenholderchart/' + tokenAddress + ")", inline: false },
                        { name: "Quicktasks", value: '[Thunder](http://localhost:7777/quickTask?module=defi&contract=' + tokenAddress + "&action=buy&blockchain=ethereum&platform=uniswapv2) ∙ " + '[Maestro]( https://t.me/MaestroSniperBot?start=' + tokenAddress + ") ∙ " + '[Sensei](https://app.thornhill.fun/defi?token=' + tokenAddress + "&venue=UNISWAP_V2&valueEth=0.05) ∙ " + '[Waifu]( http://localhost:7780/uniswapqt?contractAddress=' + tokenAddress + "&group=Default)", inline: false },


                    )
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });



                await channelNewPair.send({ embeds: [newPair], components: [buttonsRow] });




                if (renounced == "✅ Yes" && liquidity >= 10 && (deployerBLNC + ownerBLNC) == 0) {


                    newPair.setDescription(">>> A new filtered pair has been created. Filtered pairs have : ownership renounced, no balance owns by contract owner or deployer, and at least 10k of liquidity.")


                    await channelFilteredPair.send({ embeds: [newPair], components: [buttonsRow] });


                }





            }

        } catch (error) {

            console.log(error)


        }


    })
    .on('error', error => {


        console.error('Erreur:', error);
    });



// Fonctions qui permet de formatter les reserves en fonction
// de quel token est le 0 et le 1
function getTokenInPair(token0, token1, reserves, decimals) {

    // On récupère les valeurs 
    if (token0 === wETHAddress) {

        const reserve = {
            token: reserves._reserve1 / 10 ** decimals,
            quote: reserves._reserve0 / 10 ** 18,
        }

        return reserve

    } else if (token1 == wETHAddress) {

        const reserve = {
            token: reserves._reserve0 / 10 ** decimals,
            quote: reserves._reserve1 / 10 ** 18,
        }

        return reserve

    }
}



function priceIndice(price) {

    try {

        if (price > 0.01) {

            return parseFloat(price).toFixed(3)

        } else if (price > 0.001) {

            return parseFloat(price).toFixed(4)

        } else {

            const indices = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉', '₁₀', '₁₁', '₁₂', '₁₃', '₁₄', '₁₅', '₁₆', '₁₇', '₁₈', '₁₉'];
            const decimal = price.toString().split(".")[1]

            let count = 0
            for (const char of decimal) {
                if (char == "0") {
                    count++
                } else {
                    break
                }
            }

            const indice = indices[count]
            const firstNoZero = count
            const extra = decimal.substring(firstNoZero, firstNoZero + 2)

            return "0.0" + indice + extra

        }

    } catch (error) {
        console.log(error.stack)
        return price
    }

}

function easyPrice(price) {

    let prettierPrice = price

    if (!price) {

        prettierPrice = 0

    }

    return prettierPrice

}

