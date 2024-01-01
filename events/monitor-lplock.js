const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { wssInfura } = require("../config/web3config")
const colors = require('colors');

// Fonctions
const formatCoinValueSign = require("../functions/formatNumberEmbed")
const reduceText = require("../functions/reducetext")
const { getEthPrice } = require('../config/web3data')
const { getDeployment } = require("../functions/coin-utils")

// ON importe les fonctions de contrat
const pairContractAbi = require("../contracts/uniswap/pair.json")
const erc20Standard = require("../contracts/uniswap/erc20standart.json")
const pinklockAbi = require("../contracts/lockliquidity/pinklock.json")
const unxcAbi = require("../contracts/lockliquidity/uncx.json")
const wETHAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
const pinklockContractAddress = "0x71b5759d73262fbb223956913ecf4ecc51057641"
const uncxContractAddress = "0x663a5c229c09b049e36dcc11a9b0d4a8eb9db214"

// Création de l'instance des contrats
const unxcContract = new wssInfura.eth.Contract(unxcAbi, uncxContractAddress);
const pinklockContract = new wssInfura.eth.Contract(pinklockAbi, pinklockContractAddress);

// On définit les addresse DEAD
const deadAddress = [
    "0x0000000000000000000000000000000000000000",
    "0x000000000000000000000000000000000000dead"
]

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



// Écouter l'événement de création de paire
pinklockContract.events.LockAdded()
    .on('data', async eventData => {

        let tokenAddress = ""

        try {

            // Envoyer le call non résolu de l'ETH
            const ethPrice = getEthPrice()


            const pairAddress = eventData.returnValues.token.toLowerCase()
            const sender = eventData.returnValues.owner.toLowerCase()
            const lpLocked = eventData.returnValues.amount / 10 ** 18
            const unlockDate = eventData.returnValues.unlockDate
            const hash = eventData.transactionHash

            console.log(colors.magenta("🔒 Nouvelle LP Lock [PINK]"))
            console.log("Pair: " + pairAddress)
            console.log("Txn: " + hash)


            // on récupère les infos de la pool uniswap
            const pairContract = new wssInfura.eth.Contract(pairContractAbi, pairAddress);
            const token0 = (await pairContract.methods.token0().call()).toLowerCase()
            const token1 = (await pairContract.methods.token1().call()).toLowerCase()
            const reserves = await pairContract.methods.getReserves().call();

            // On récupère les infos du locks
            // Ca comprend la supply des LP, les locks, la partie etc
            const lpSupplyRaw = await pairContract.methods.totalSupply().call();
            const lpSupply = lpSupplyRaw / 10 ** 18
            const locked = 100 * lpLocked / lpSupply


            // On vérifie que c'est bien une paire en WETH
            if (token0 == wETHAddress || token1 == wETHAddress) {

                // On cherche le token qui est le contrat, pas le quote (tokenAddress)
                if (token0.toLowerCase() !== wETHAddress.toLowerCase()) {

                    tokenAddress = token0

                } else if (token1.toLowerCase() !== wETHAddress.toLowerCase()) {

                    tokenAddress = token1
                }



                // On initialise le contrat
                const tokenContract = new wssInfura.eth.Contract(erc20Standard, tokenAddress);

                // On call toutes les fonctions du contrat en même temps
                const [decimals, rawSupply, ownerRaw] = await Promise.all([
                    tokenContract.methods.decimals().call(),
                    tokenContract.methods.totalSupply().call(),
                    tokenContract.methods.owner().call(),
                ]);
                const supply = rawSupply / 10 ** decimals
                const owner = ownerRaw.toLowerCase()


                // On formatte les reserves
                // Puis on assigne les différentes valeurs
                const reserve = getTokenInPair(token0, token1, reserves, decimals)
                const pooledETH = reserve.quote
                const pooledTKN = reserve.token
                const liquidity = (pooledETH * 2) * ethPrice
                const price = easyPrice((pooledETH / pooledTKN) * ethPrice)
                const marketCap = price * supply


                // On récupère les information sur le deployer
                const deployerOBJ = await getDeployment(tokenAddress)
                const deployer = deployerOBJ.deployer
                const deployTx = deployerOBJ.txn
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
                const liquidityFRMT = "• Pair: [" + formatWallet(pairAddress) + "](https://etherscan.io/address/" + pairAddress + ")\n• Liquidity: `" + formatCoinValueSign(liquidity, 2) + "$`\n• Pooled WETH: `" + parseFloat(pooledETH).toFixed(3) + "Ξ`\n• Pooled Tokens: `" + formatCoinValueSign(pooledTKN, 2) + "`"
                const deployerFRMT = "• Deployer: [" + formatWallet(deployer) + "](https://etherscan.io/address/" + deployer + ")\n• Amount: `" + formatCoinValueSign(deployerBLNC, 0) + "`\n• Balance: `" + deployerAMNT + "`\n• Txn: [" + formatWallet(deployTx) + "](https://etherscan.io/address/" + deployTx + ")"
                const ownerFRMT = "• Owner: [" + formatWallet(owner) + "](https://etherscan.io/address/" + owner + ")\n• Amount: `" + formatCoinValueSign(ownerBLNC, 0) + "`\n• Balance: `" + ownerAMNT + "`"
                const tokenFRMT = "• Renounced: `" + renounced + "`\n• Supply: `" + formatCoinValueSign(supply, 2) + "`\n• Circulating: `" + formatCoinValueSign(supply, 2) + "`\n• Burned: `0.00% 🔥`"
                const lplocksFRMT = "• LP Supply: `" + lpSupply + "`\n• Locked: `" + parseFloat(locked).toFixed(2) + "% (" + lpLocked + ")` until <t:" + unlockDate + ":R>\n• Locker: [" + formatWallet(sender) + "](https://etherscan.io/address/" + sender + ") at this [tx](https://etherscan.io/tx/" + hash + ")"


                // On récupère le nom et symbol
                // On call toutes les fonctions du contrat en même temps
                const [symbol, name] = await Promise.all([
                    tokenContract.methods.symbol().call(),
                    tokenContract.methods.name().call(),
                ]);


                // On crée un boutton
                const buttonsRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('button_exec_open_panel_' + tokenAddress)
                            .setLabel('📊 Trade Panel')
                            .setStyle(1),
                    );



                /// RENVOI DE L'EMBED
                const newPair = new EmbedBuilder().setColor("#060A8F")
                    .setTitle(reduceText(name, 40) + " (" + symbol.toUpperCase() + ")")
                    .setDescription(">>> A pool just locked LP tokens")
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
                        { name: "🔒 LP Locks", value: lplocksFRMT, inline: false },
                        { name: " ", value: " ", inline: false },

                        { name: "Links", value: '[Etherscan](https://etherscan.io/address/' + tokenAddress + ") ∙ " + '[Etherscan LP](https://etherscan.io/address/' + pairAddress + ") ∙ " + '[DexScreener](https://dexscreener.com/ethereum/' + tokenAddress + ") ∙ " + '[DexSpy](https://dexspy.io/eth/token/' + tokenAddress + ") ∙ " + '[Uniswap](https://app.uniswap.org/#/tokens/ethereum/' + tokenAddress + ") ∙ " + '[DefiLlama](https://swap.defillama.com/?chain=ethereum&from=0x0000000000000000000000000000000000000000&to=' + tokenAddress + ") ∙ " + '[DexAnalyzer](https://www.dexanalyzer.io/token/' + tokenAddress + ") ∙ " + '[Honeypot](   https://honeypot.is/ethereum?address=' + tokenAddress + ") ∙ " + '[Holders](https://etherscan.io/token/tokenholderchart/' + tokenAddress + ") ∙ " + '[Locker Protocol](https://etherscan.io/address/' + uncxContractAddress + ")", inline: false },
                        { name: "Quicktasks", value: '[Thunder](http://localhost:7777/quickTask?module=defi&contract=' + tokenAddress + "&action=buy&blockchain=ethereum&platform=uniswapv2) ∙ " + '[Maestro]( https://t.me/MaestroSniperBot?start=' + tokenAddress + ") ∙ " + '[Sensei](https://app.thornhill.fun/defi?token=' + tokenAddress + "&venue=UNISWAP_V2&valueEth=0.05) ∙ " + '[Waifu]( http://localhost:7780/uniswapqt?contractAddress=' + tokenAddress + "&group=Default)", inline: false },


                    )
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });



                await channelLPLocks.send({ embeds: [newPair], components: [buttonsRow] });

            }

        } catch (error) {

            console.log(error.stack)


        }


    })
    .on('error', error => {


        console.log('Erreur:', error);
    });


unxcContract.events.onDeposit()
    .on('data', async eventData => {


        let tokenAddress = ""

        try {


            // Envoyer le call non résolu de l'ETH
            const ethPrice = getEthPrice()


            const pairAddress = eventData.returnValues.lpToken.toLowerCase()
            const sender = eventData.returnValues.user.toLowerCase()
            const lpLocked = eventData.returnValues.amount / 10 ** 18
            const unlockDate = eventData.returnValues.unlockDate
            const hash = eventData.transactionHash

            console.log(colors.magenta("🔒 Nouvelle LP Lock [UNCX]"))
            console.log("Pair: " + pairAddress)
            console.log("Txn: " + hash)


            // on récupère les infos de la pool uniswap
            const pairContract = new wssInfura.eth.Contract(pairContractAbi, pairAddress);
            const token0 = (await pairContract.methods.token0().call()).toLowerCase()
            const token1 = (await pairContract.methods.token1().call()).toLowerCase()
            const reserves = await pairContract.methods.getReserves().call();

            // On récupère les infos du locks
            // Ca comprend la supply des LP, les locks, la partie etc
            const lpSupplyRaw = await pairContract.methods.totalSupply().call();
            const lpSupply = lpSupplyRaw / 10 ** 18
            const locked = 100 * lpLocked / lpSupply



            // On vérifie que c'est bien une paire en WETH
            if (token0 == wETHAddress || token1 == wETHAddress) {

                // On cherche le token qui est le contrat, pas le quote (tokenAddress)
                if (token0.toLowerCase() !== wETHAddress.toLowerCase()) {

                    tokenAddress = token0

                } else if (token1.toLowerCase() !== wETHAddress.toLowerCase()) {

                    tokenAddress = token1
                }



                // On initialise le contrat
                const tokenContract = new wssInfura.eth.Contract(erc20Standard, tokenAddress);

                // On call toutes les fonctions du contrat en même temps
                const [decimals, rawSupply, ownerRaw] = await Promise.all([
                    tokenContract.methods.decimals().call(),
                    tokenContract.methods.totalSupply().call(),
                    tokenContract.methods.owner().call(),
                ]);
                const supply = rawSupply / 10 ** decimals
                const owner = ownerRaw.toLowerCase()


                // On formatte les reserves
                // Puis on assigne les différentes valeurs
                const reserve = getTokenInPair(token0, token1, reserves, decimals)
                const pooledETH = reserve.quote
                const pooledTKN = reserve.token
                const liquidity = (pooledETH * 2) * ethPrice
                const price = easyPrice((pooledETH / pooledTKN) * ethPrice)
                const marketCap = price * supply



                // On récupère les information sur le deployer
                const deployerOBJ = await getDeployment(tokenAddress)
                const deployer = deployerOBJ.deployer
                const deployTx = deployerOBJ.txn
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
                const liquidityFRMT = "• Pair: [" + formatWallet(pairAddress) + "](https://etherscan.io/address/" + pairAddress + ")\n• Liquidity: `" + formatCoinValueSign(liquidity, 2) + "$`\n• Pooled WETH: `" + parseFloat(pooledETH).toFixed(3) + "Ξ`\n• Pooled Tokens: `" + formatCoinValueSign(pooledTKN, 2) + "`"
                const deployerFRMT = "• Deployer: [" + formatWallet(deployer) + "](https://etherscan.io/address/" + deployer + ")\n• Amount: `" + formatCoinValueSign(deployerBLNC, 0) + "`\n• Balance: `" + deployerAMNT + "`\n• Txn: [" + formatWallet(deployTx) + "](https://etherscan.io/address/" + deployTx + ")"
                const ownerFRMT = "• Owner: [" + formatWallet(owner) + "](https://etherscan.io/address/" + owner + ")\n• Amount: `" + formatCoinValueSign(ownerBLNC, 0) + "`\n• Balance: `" + ownerAMNT + "`"
                const tokenFRMT = "• Renounced: `" + renounced + "`\n• Supply: `" + formatCoinValueSign(supply, 2) + "`\n• Circulating: `" + formatCoinValueSign(supply, 2) + "`\n• Burned: `0.00% 🔥`"
                const lplocksFRMT = "• LP Supply: `" + lpSupply + "`\n• Locked: `" + parseFloat(locked).toFixed(2) + "% (" + lpLocked + ")` until <t:" + unlockDate + ":R>\n• Locker: [" + formatWallet(sender) + "](https://etherscan.io/address/" + sender + ") at this [tx](https://etherscan.io/tx/" + hash + ")"


                // On récupère le nom et symbol
                // On call toutes les fonctions du contrat en même temps
                const [symbol, name] = await Promise.all([
                    tokenContract.methods.symbol().call(),
                    tokenContract.methods.name().call(),
                ]);


                // On crée un boutton
                const buttonsRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('button_exec_open_panel_' + tokenAddress)
                            .setLabel('📊 Trade Panel')
                            .setStyle(1),
                    );



                /// RENVOI DE L'EMBED
                const newPair = new EmbedBuilder().setColor("#060A8F")
                    .setTitle(reduceText(name, 40) + " (" + symbol.toUpperCase() + ")")
                    .setDescription(">>> A pool just locked LP tokens")
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
                        { name: "🔒 LP Locks", value: lplocksFRMT, inline: false },
                        { name: " ", value: " ", inline: false },

                        { name: "Links", value: '[Etherscan](https://etherscan.io/address/' + tokenAddress + ") ∙ " + '[Etherscan LP](https://etherscan.io/address/' + pairAddress + ") ∙ " + '[DexScreener](https://dexscreener.com/ethereum/' + tokenAddress + ") ∙ " + '[DexSpy](https://dexspy.io/eth/token/' + tokenAddress + ") ∙ " + '[Uniswap](https://app.uniswap.org/#/tokens/ethereum/' + tokenAddress + ") ∙ " + '[DefiLlama](https://swap.defillama.com/?chain=ethereum&from=0x0000000000000000000000000000000000000000&to=' + tokenAddress + ") ∙ " + '[DexAnalyzer](https://www.dexanalyzer.io/token/' + tokenAddress + ") ∙ " + '[Honeypot](   https://honeypot.is/ethereum?address=' + tokenAddress + ") ∙ " + '[Holders](https://etherscan.io/token/tokenholderchart/' + tokenAddress + ") ∙ " + '[Locker Protocol](https://etherscan.io/address/' + uncxContractAddress + ")", inline: false },
                        { name: "Quicktasks", value: '[Thunder](http://localhost:7777/quickTask?module=defi&contract=' + tokenAddress + "&action=buy&blockchain=ethereum&platform=uniswapv2) ∙ " + '[Maestro]( https://t.me/MaestroSniperBot?start=' + tokenAddress + ") ∙ " + '[Sensei](https://app.thornhill.fun/defi?token=' + tokenAddress + "&venue=UNISWAP_V2&valueEth=0.05) ∙ " + '[Waifu]( http://localhost:7780/uniswapqt?contractAddress=' + tokenAddress + "&group=Default)", inline: false },


                    )
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });



                await channelLPLocks.send({ embeds: [newPair], components: [buttonsRow] });

            }


        } catch (error) {

            console.log(error.stack)


        }


    })
    .on('error', error => {


        console.log('Erreur:', error);
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





