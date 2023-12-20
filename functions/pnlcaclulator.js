//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const etherscanApiKey = process.env.etherscanApiKey

const axios = require("axios")
const { getToken, getBalance, getSupply, getMetrics } = require("./coin-utils")
const getApprovals = require("./getApprovals")
const formatCoinValueSign = require("./formatNumberEmbed")
const getEthPrice = require("./getethprice")

const quoteTab = require("../contracts/uniswap/quote.json")
const quotes = quoteTab.map(item => item.contract.toLowerCase())


async function coinProfitSingle(cont, wall, time) {

    try {


        const data = {
            swapIn: 0,
            swapOut: 0,
            transfer: 0,
            approval: 0,
            buyAmount: 0,
            sellAmount: 0,
            heldAmount: 0,
            buyValue: 0,
            sellValue: 0,
            heldValue: 0,
            buyGas: 0,
            sellGas: 0,
            totalGas: 0,
            avgGas: 0,
            avgMCBuy: 0,
            avgMCSell: 0,
            currentMC: 0,
            realizedPNL: 0,
            potentialPNL: 0,
            realizedMLTP: 0,
            potentialMLTP: 0,
            realizedROI: 0,
            potentialROI: 0,
        }

        // On formatte tout en lower case
        const contract = cont.toLowerCase()
        const wallet = wall.toLowerCase()
        const timestamp = getTimestamp(time)

        // On lance tous les calls du début (résolu plus bas)
        const ethPrice = await getEthPrice()
        const priceCALL = getMetrics(contract)
        const heldCALL = getBalance(contract, wallet)
        const approvalsCALL = getApprovals(wallet, contract)


        // On récupère les infos du coin et lance le call supply (résolu plus bas)
        const token = await getToken([contract])
        const name = token[0].name
        const symbol = token[0].symbol.toUpperCase()
        const decimals = token[0].decimals
        const supplyCALL = getSupply(contract, decimals)


        // On récupère toutes les transactions de l'auteur
        // Cette version ne permet pas de visualiser un important panel de trade
        // Ici, on récupère tous les transfert de token pour avoir plus facilement "les token to token" esuite
        // Pour obtenir plus de transactions, il faudrait remplacer les deux call tokenTxs et les remplacer par :
        // const tokenTxs = (await axios.get("https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=" + contract + "&address=" + wallet + "&page=1&offset=10000&startblock=0&sort=desc&apikey=" + etherscanApiKey)).data.result
        // Puis, il faudrait trouver un moyen de trouver la transaction de contrepartie, peut être par un transaction receipt par exemple
        // Tous les appels sont lancés en parallèle
        const [internalTxs, normalTxs, tokenGlobalTxs] = await Promise.all([
            axios.get(`https://api.etherscan.io/api?module=account&action=txlistinternal&address=${wallet}&startblock=0&page=1&offset=10000&sort=asc&apikey=${etherscanApiKey}`).then(res => res.data.result.filter(item => parseInt(item.timeStamp) >= timestamp)),
            axios.get(`https://api.etherscan.io/api?module=account&action=txlist&address=${wallet}&startblock=0&page=1&offset=10000&sort=asc&apikey=${etherscanApiKey}`).then(res => res.data.result.filter(item => parseInt(item.timeStamp) >= timestamp)),
            axios.get(`https://api.etherscan.io/api?module=account&action=tokentx&address=${wallet}&page=1&offset=10000&startblock=0&sort=desc&apikey=${etherscanApiKey}`).then(res => res.data.result.filter(item => parseInt(item.timeStamp) >= timestamp)),
        ]);
        const tokenTxs = tokenGlobalTxs.filter(item => item.contractAddress.toLowerCase() == contract)

        // On intialise le tableau avec les hash
        // D'abord celui avec tous les hashs
        // Puis celui avec les hash des contreparties, pour ne pas qu'il soit compter deux fois
        const allTxs = []
        const counterTxs = []

        // On enclenche la boucle pour analyser chaque transaction
        for (const trade of tokenTxs) {


            // On initialise les valeurs de la transaction
            const from = trade.from.toLowerCase()
            const to = trade.to.toLowerCase()
            const amount = trade.value / 10 ** decimals
            const fees = parseFloat(trade.gasPrice * trade.gasUsed) / 10 ** 18
            const hash = trade.hash.toLowerCase()

            // On recherche les transactions similaires dans les autres types de transfert
            const tokenLKP = tokenGlobalTxs.find(item => item.hash == hash && item !== trade);
            const internalLKP = internalTxs.find(item => item.hash == hash);
            const normalLKP = normalTxs.find(item => item.hash == hash);

            // On regarde s'il existe un hash déjà compté en contrepartie 
            // Si oui, on ne la comptera pas plus tard
            const isCounterpart = counterTxs.find(item => item == hash)

            if (to === wallet) {
                // C'est un achat
                // Il est possible qu'il faille rajouter une vérification de la contrepartie pour éviter les doublons (comme pour sell)

                if (!tokenLKP && !internalLKP && !normalLKP) {
                    // Il n'y a pas de transfert connexes
                    // C'est un airdrop ou un transfer
                    // Pas de frais de gas
                    data.transfer++
                    data.buyAmount += amount

                } else if (tokenLKP) {
                    // Il y'a un transfert de token connexes
                    // Donc c'est probablement un swap token to token
                    // On ajoute un au nombre de trade
                    // On ajoute au nombre de token acheté, au gas et à la dépense

                    if (quotes.includes(tokenLKP.contractAddress.toLowerCase())) {
                        // On vérifie si le token en contrepartie fait partie de notre tableau de quote de base
                        // Si il en fait partie, on le considère comme un stablecoin au prix du dollar
                        // Sinon, le swap n'est pas compté
                        // On pourrait améliorer en allant chercher le prix du token précisément
                        // Au moins, en détéctant si c'est du wETH et en allant chercher le prix de l'ETH
                        const quoteAmt = tokenLKP.value / (10 ** quoteTab.find(item => item.contract == tokenLKP.contractAddress.toLowerCase()).decimals)

                        data.swapIn++
                        data.buyAmount += amount
                        data.buyValue += quoteAmt / ethPrice
                        data.buyGas += fees

                        // On push le hash de contrepartie
                        counterTxs.push(hash)
                    }

                } else if (normalLKP) {
                    // Il y'a un transfer connexes déclanché par le user (normal tx)
                    // C'est donc soit un déclanchement pour un claim soit un ETH to Token
                    // On ajoute le nombre de token acheté et la dépense
                    // On prend en compte les gas fees, mais aussi les potentiels refund 


                    // On check si c'est un claim ou un ETH to token
                    if (normalLKP.value > 0) { data.swapIn++ }
                    else { data.transfer++ }
                    data.buyValue += normalLKP.value / 10 ** 18
                    data.buyAmount += amount
                    data.buyGas += fees

                    // On vérifie s'il y a eu un remboursement
                    if (internalLKP) {
                        const isInternal = internalLKP.find(item => item.to == wallet);
                        if (isInternal) {
                            data.buyValue -= isInternal.value / 10 ** 18
                        }
                    }

                    // On push le hash de contrepartie
                    counterTxs.push(hash)
                }

                // On rajoute la tx au tableau
                allTxs.push({
                    hash: hash,
                    direction: "in"
                })


            } else if (from === wallet) {
                // C'est une vente

                if (!tokenLKP && !internalLKP && !normalLKP) {
                    // Il n'y a pas de transfert connexes
                    // C'est un airdrop ou un transfer
                    // Pas de frais de gas
                    data.transfer++
                    data.sellAmount += amount
                    data.sellGas += fees

                } else if (tokenLKP) {
                    // C'est un trade de token à token
                    // Ca ne prend en compte que les updates du token vers 1x token
                    // On doit comprendre le taux de conversion

                    if (tokenLKP.from.toLowerCase() != wallet) {
                        // On vérifie que le transfert connexes est bien la contrepartie
                        // et non pas un supplément du user
                        // Si oui, c'est un token to token classique

                        if (quotes.includes(tokenLKP.contractAddress.toLowerCase())) {
                            // On vérifie si le token en contrepartie fait partie de notre tableau de quote de base
                            // Si il en fait partie, on le considère comme un stablecoin au prix du dollar
                            // Sinon, le swap n'est pas compté
                            // On pourrait améliorer en allant chercher le prix du token précisément
                            // Au moins, en détéctant si c'est du wETH et en allant chercher le prix de l'ETH
                            const quoteAmt = tokenLKP.value / (10 ** quoteTab.find(item => item.contract == tokenLKP.contractAddress.toLowerCase()).decimals)

                            // On ajoute l'amount de token
                            data.sellAmount += amount

                            // On vérifie que la counterpart du trade n'a pas été analyser déjà
                            // Si il l'a pas été, le swap en lui même non plus
                            if (!isCounterpart) {
                                // On ajoute le nombre de token transféré et les gas
                                // même si la contrepartie a déjà été compter, car on se base là dessus
                                data.sellValue += quoteAmt / ethPrice
                                data.sellGas += fees
                                data.swapOut++
                                // On push le hash de contrepartie
                                counterTxs.push(hash)
                            }
                        }

                    } else if (internalLKP) {
                        // Si il y'a un remboursement en internal en plus du token échangé
                        // A éclaircir

                        // On ajoute l'amount de token
                        data.sellAmount += amount

                        // On vérifie que la counterpart du trade n'a pas été analyser déjà
                        // Si il l'a pas été, le swap en lui même non plus
                        if (!isCounterpart) {
                            // On ajoute le nombre de token transféré et les gas
                            // même si la contrepartie a déjà été compter, car on se base là dessus
                            data.sellValue += internalLKP.value / 10 ** 18
                            data.sellGas += fees
                            data.swapOut++
                            // On push le hash de contrepartie
                            counterTxs.push(hash)
                        }
                    }


                } else if (internalLKP) {
                    // Token envoyés par le user et ETH reçu
                    // C'est donc un swap out probablement

                   // On ajoute l'amount de token
                   data.sellAmount += amount


                    // On vérifie que la counterpart du trade n'a pas été analyser déjà
                    // Si il l'a pas été, le swap en lui même non plus
                    if (!isCounterpart) {
                        // On ajoute le nombre de token transféré et les gas
                        // même si la contrepartie a déjà été compter, car on se base là dessus
                        data.sellValue += internalLKP.value / 10 ** 18
                        data.sellGas += fees
                        data.swapOut++
                        // On push le hash de contrepartie
                        counterTxs.push(hash)
                    }
                }

                // On rajoute la tx au tableau
                allTxs.push({
                    hash: hash,
                    direction: "out"
                })

            }

        }

        // On rajoute les approvals avec une boucle
        // Le tableau est récupéré depuis le CALL en haut du code
        const [approvals] = await Promise.all([approvalsCALL]);
        for (const tx of approvals) {

            if (!allTxs.map(obj => obj.hash).includes((tx.transactionHash).toLowerCase())) {
                // On vérifie qu'on a pas déjà compter l'approval dans un buy & approve par exemple

                const normalLKP = await normalTxs.find(obj => obj.hash == (tx.transactionHash).toLowerCase());

                if (normalLKP) {

                    const fees = parseFloat(((normalLKP.gasPrice) * (normalLKP.gasUsed))) / 10 ** 18
                    data.sellGas += fees
                    data.approval++
                }
            }
        }


        // On récupère les valeurs CALL au début
        // On calcul quelques valeurs en plus
        const [priceRaw, heldRaw, supply] = await Promise.all([priceCALL, heldCALL, supplyCALL]);
        const priceUSD = priceRaw.priceUSD
        const priceETH = priceRaw.priceETH
        const held = heldRaw / 10 ** decimals

        // On ajoute les valeurs du holding actuel
        // REGLER LE FORMAT EN BN (actuellement exposant math)
        // Voir pour déduire held amount par Buy - Sell (seulement si tous les buy/sell sont comptés dans les transfert)
        data.heldAmount = held
        if (data.heldAmount > 0) { data.heldValue = (data.heldAmount * priceETH) }

        // On calcul les valeurs d'average
        if (data.buyValue) { data.avgMCBuy = (data.buyValue / data.buyAmount) * supply * ethPrice }
        if (data.sellValue) { data.avgMCSell = (data.sellValue / data.sellAmount) * supply * ethPrice }
        data.currentMC = supply * priceUSD

        // On calcul les valeurs de gas
        data.totalGas = data.buyGas + data.sellGas
        if (data.totalGas) { data.avgGas = data.totalGas / (data.swapIn + data.swapOut + data.transfer + data.approval) }

        // On calcul les valeurs de profit
        data.realizedPNL = data.sellValue - (data.buyValue + data.totalGas)
        data.potentialPNL = (data.sellValue + data.heldValue) - (data.buyValue + data.totalGas)

        // On calcul le ROI et MLTP
        if (data.sellValue) { data.realizedMLTP = data.sellValue / (data.buyValue + data.totalGas) }
        if (data.sellValue + data.heldValue >= 0.001) { data.potentialMLTP = (data.sellValue + data.heldValue) / (data.buyValue + data.totalGas) }
        if (data.sellValue - (data.buyValue + data.totalGas)) { data.realizedROI = ((data.sellValue - (data.buyValue + data.totalGas)) / (data.buyValue + data.totalGas)) * 100 }
        if ((data.sellValue + data.heldValue) - (data.buyValue + data.totalGas)) { data.potentialROI = (((data.sellValue + data.heldValue) - (data.buyValue + data.totalGas)) / (data.buyValue + data.totalGas)) * 100 }


        // Toutes les values ont été calculés, on fait du formattage
        const prettierData = {
            swapIn: data.swapIn,
            swapOut: data.swapOut,
            transfer: data.transfer,
            buyAmount: formatCoinValueSign(data.buyAmount, 2),
            sellAmount: formatCoinValueSign(data.sellAmount, 2),
            heldAmount: formatCoinValueSign(data.heldAmount, 2),
            buyValue: parseFloat(data.buyValue).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(data.buyValue * ethPrice).toFixed(0)) + "$)",
            sellValue: parseFloat(data.sellValue).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(data.sellValue * ethPrice).toFixed(0)) + "$)",
            heldValue: parseFloat(data.heldValue).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(data.heldValue * ethPrice).toFixed(0)) + "$)",
            buyGas: parseFloat(data.buyGas).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(data.buyGas * ethPrice).toFixed(0)) + "$)",
            sellGas: parseFloat(data.sellGas).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(data.sellGas * ethPrice).toFixed(0)) + "$)",
            totalGas: parseFloat(data.totalGas).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(data.totalGas * ethPrice).toFixed(0)) + "$)",
            avgGas: parseFloat(data.avgGas).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgGas * ethPrice).toFixed(0)) + "$)",
            avgMCBuy: formatCoinValueSign(data.avgMCBuy, 2) + "$",
            avgMCSell: formatCoinValueSign(data.avgMCSell, 2) + "$",
            currentMC: formatCoinValueSign(data.currentMC, 2) + "$",
            realizedPNL: parseFloat(data.realizedPNL).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(data.realizedPNL * ethPrice).toFixed(0)) + "$)",
            potentialPNL: parseFloat(data.potentialPNL).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(data.potentialPNL * ethPrice).toFixed(0)) + "$)",
            realizedMLTP: "x" + parseFloat(data.realizedMLTP).toFixed(2),
            potentialMLTP: "x" + parseFloat(data.potentialMLTP).toFixed(2),
            realizedROI: parseFloat(data.realizedROI).toFixed(2) + "%",
            potentialROI: parseFloat(data.potentialROI).toFixed(2) + "%",
        }

        const result = {
            token: {
                name: name,
                symbol: symbol,
                contract: contract,
                priceUSD: priceUSD,
                priceETH: priceETH,
                timestamp: timestamp
            },
            raw: data,
            prettier: prettierData
        }

        return result

    } catch (error) {

        console.log(error.stack)
        return null
    }

}



module.exports = {
    coinProfitSingle
}

// Fonction qui permet de calculer le timestamp
// Le timestamp est en secondes, pas millisecondes
function getTimestamp(selectedTime) {
    //Ajustement du Timestamp
    const actualTimestamp = parseFloat(Date.now() / 1000).toFixed(0)
    let selectedTimestamp = 0

    if (selectedTime === "1 Day") { selectedTimestamp = actualTimestamp - 86400 }
    if (selectedTime === "3 Days") { selectedTimestamp = actualTimestamp - 259200 }
    if (selectedTime === "7 Days") { selectedTimestamp = actualTimestamp - 604800 }
    if (selectedTime === "14 Days") { selectedTimestamp = actualTimestamp - 1209600 }
    if (selectedTime === "30 Days") { selectedTimestamp = actualTimestamp - 2592000 }
    if (selectedTime === "90 Days") { selectedTimestamp = actualTimestamp - 7776000 }
    if (selectedTime === "1 Year") { selectedTimestamp = actualTimestamp - 31536000 }

    return selectedTimestamp
}