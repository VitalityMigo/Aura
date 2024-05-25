const { magiceden } = require("../config/web3config")
//3892fec1-8293-4509-bae5-e438936df4a8
//const magiceden = { 'Authorization': `Bearer 4c035019-0512-488e-804a-2bc0fa9a44f6` };
//const magicedenRunes = { 'Authorization': `Bearer 3892fec1-8293-4509-bae5-e438936df4a8` };
const unisate = { 'Authorization': 'Bearer 58ee790459d886e2a178ef40b51a4b981ae6faeb289210117ae21b993aeaabc3' }
const axios = require("axios")
const decimals = 8

const { getRuneMetrics, getRuneActivityByWallet, isBRC20BitcoinWallet, isHiddenRuneTransfer, getTransaction, getRuneBalance, satsToBtc, isHiddenRunesBuying, isHiddenRunesSplit } = require("./btc-utils")
const { getBtcPrice } = require('../config/web3data.js')
const addTimeout = require("./addtimeout")
const formatCoinValueSign = require("./formatNumberEmbed")



/// BRC20




// RUNES


async function runesProfitSingle(cont, wall, time) {

    try {


        const data = {
            swapIn: 0,
            swapOut: 0,
            transfer: 0,
            split: 0,
            mint: 0,
            airdrop: 0,
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
            avgBuy: 0,
            avgSell: 0,
            currentMC: 0,
            realizedPNL: 0,
            potentialPNL: 0,
            realizedMLTP: 0,
            potentialMLTP: 0,
            realizedROI: 0,
            potentialROI: 0,
        }

        // On formatte tout en lower case
        const slug = cont.toUpperCase()
        const wallet = wall.toLowerCase()
        const timestamp = getTimestamp(time)

        // On lance tous les calls du début (résolu plus bas)
        const btcPrice = getBtcPrice()
        const tokenPRM = getRuneMetrics(slug, btcPrice)
        const heldPRM = getRuneBalance(slug, wallet)

        // On récupère l'activité du wallet en fonction du timestamp, du wallet et de la slug
        const activity = await getRuneActivityByWallet(slug, wallet, timestamp)
        //  const activity = activity1.filter(i => i.txId === "667aae821390b9a9ec6f823346a0f1d240ab7fb68d63a1ffadb21e3f3976c6f1")
        // console.log(activity)// tempo

        const txArray = []
        // On initialise la boucle dans laquelle on va construire l'arborécence
        for (const item of activity) {

            // On vérifie que la tx a pas déjà été traité.
            // Si c'est le cas on la prend pas en compte.
            if (!txArray.includes(item.txId)) {

                // On commence par regarder si c'est une vente. Si c'est le cas, la transaction
                // précédente sera toujours un send ou un received.
                if (item.action == 'buying_broadcasted') {
                    // C'est une vente sur le marché secondaire, on identifie si c'est un 
                    // buy ou un sell en utilisant les data déjà faite et ajoutée.

                    if (item.isBuy === true) {
                        // C'est un achat, on fait le code en fonction en ajoutant le nombre de token 
                        // acheté, le prix d'achat, les gas fees
                        data.buyAmount += item.amount
                        data.buyValue += item.price
                        data.swapIn++

                        // On ajoute les data de gas
                        const txn = await getTransaction(item.txId)
                        data.buyGas += satsToBtc(txn.fee)

                    } else if (item.isBuy === false) {
                        // C'est une vente, on fait le code en fonction en ajoutant le nombre de token 
                        // vendue, le prix de vente reçu, et pas de gas fees
                        data.sellAmount += item.amount
                        data.sellValue += item.price
                        data.swapOut++
                    }
                    // On ajoute la tx à la liste des transactions
                    txArray.push(item.txId)

                } else if (item.action == 'split_broadcast') {
                    // Cela représente les split, donc on les considère ainsi en ajoutant au compteur
                    // et en mettant les frais de transactions dans le total payée

                    // On ajoute les data de gas
                    const txn = await getTransaction(item.txId)
                    data.sellGas += satsToBtc(txn.fee)
                    data.split++

                    // On ajoute la tx à la liste des transactions
                    txArray.push(item.txId)

                } else if (item.action === 'received') {
                    // Cela représente une situation dans laquelle le wallet recoit 
                    // des tokens. Ca peut être un transfert/airdrop, un mint, ou un split.
                    // On commence par vérifier si c'est un split ou pas.

                    // On regarde les autres transactions avec le même id
                    // On peut opti en signifiant si cette txn a déjà été traité comme un split hidden.
                    const counterpart = activity.filter(i => i.txId === item.txId)
                    const isSplit = isHiddenRunesSplit(counterpart)
                    const isHiddenBuy = isHiddenRunesBuying(counterpart)
                    const isHiddenTransfer = isHiddenRuneTransfer(counterpart)

                    if (!isHiddenBuy) {
                        // Est ce que c'est un achat, si oui on le compte pas car
                        // il sera pris en compte ensuite dans le buying broadcasted

                        if (isSplit) {
                            // C'est un hidden split, donc on compte juste les gas
                            // On ajoute les data de gas
                            const txn = await getTransaction(item.txId)
                            data.sellGas += satsToBtc(txn.fee)
                            data.split++

                        } else if (isHiddenTransfer) {
                            // On recherche si c'est un transfer caché. Les transfert cachés sont des transfert qui sont 
                            // fait en envoyant un paquet, puis en recevant la différence des tokens qui n'ont pas été envoyés.
                            // Ici on regarde les received donc les tokens qu'on envoi (la received arrive en premier dans la boucle).
                            //const sent = counterpart.find(i => i.action === "sent").amount
                            //const received = counterpart.find(i => i.action === "received").amount
                            const txn = await getTransaction(item.txId)
                            data.transfer++
                            data.sellGas += satsToBtc(txn.fee)

                        } else {
                            // C'est un airdrop ou un transfer car il n'y a pas de split associé
                            // mais ça peut ausis être un mint donc on vérifie.
                            const txn = await getTransaction(item.txId)
                            const inflow = txn.vin // On utilise le flux pour déterminer si c'est un mint ou un airdrop
                            const outflow = txn.vout // On utilise le flux pour déterminer si c'est un mint ou un airdrop

                            // On surveille les flow out et in et on regroupe les receiver et 
                            // senders en deux liste de wallet uniques
                            //   const valueIn = satsToBtc(inflow.filter(i => i.scriptpubkey_address === wallet).reduce((total, transaction) => total + transaction.value, 0));
                            const senders = [...new Set(inflow.filter(i => i.scriptpubkey_address).map(i => i.scriptpubkey_address))].length
                            //   const valueOut = satsToBtc(outflow.filter(i => i.scriptpubkey_address === wallet).reduce((total, transaction) => total + transaction.value, 0));
                            const receivers = [...new Set(outflow.filter(i => i.scriptpubkey_address && isBRC20BitcoinWallet(i.scriptpubkey_address)).map(i => i.scriptpubkey_address))].length

                            if (receivers < 3) {

                                if (senders === 1) {
                                    // Il y a qu'un seul senders, c'est donc un mint. Ca peut être un wallet BCP1 si c'est
                                    //avec Unisat ou un wallet 3Q si c'est Xverse.
                                    data.mint++
                                    data.buyAmount = item.amount
                                    data.buyGas += satsToBtc(txn.fee)
                                } else {
                                    // Il y'a plus qu'un wallet, donc surement un payeur et un envoi. On considère que c'est un achat
                                    // Pour ces raisons on ajoute les datas qui vont avec. Il faut aussi qu'on définisse la valeu.
                                    // On calcul la valeur qui sort du premier wallet qui n'est pas un wallet taproot ou du premier qui est notre wallet

                                    const value = inflow.find(i => !isBRC20BitcoinWallet(i.prevout.scriptpubkey_address) || i.prevout.scriptpubkey_address === wallet).prevout.value

                                    data.swapIn++
                                    data.buyAmount += item.amount
                                    data.buyValue += satsToBtc(value)
                                    data.buyGas += satsToBtc(txn.fee)
                                }
                            } else {
                                data.airdrop++
                            }

                            // [...new Set(txn.data.vout.map(item => item.scriptpubkey_address.toLowerCase()))].length;
                        }
                        // On ajoute la tx à la liste des transactions
                        txArray.push(item.txId)
                    }

                } else if (item.action === 'sent') {
                    // Cela représente une situation dans laquelle le wallet recoit 
                    // des tokens. Ca peut être un transfert/airdrop, un mint, ou un split.
                    // On commence par vérifier si c'est un split ou pas.

                    // On regarde les autres transactions avec le même id
                    // On peut opti en signifiant si cette txn a déjà été traité comme un split hidden.
                    const counterpart = activity.filter(i => i.txId === item.txId)
                    const isSplit = isHiddenRunesSplit(counterpart)
                    const isHiddenBuy = isHiddenRunesBuying(counterpart)
                    //const isHiddenTransfer = isHiddenRuneTransfer(counterpart)

                    if (!isHiddenBuy) {
                        // Est ce que c'est un achat, si oui on le compte pas car
                        // il sera pris en compte ensuite dans le buying broadcasted

                        if (isSplit) {
                            // C'est un hidden split, donc on compte juste les gas
                            // On ajoute les data de gas
                            const txn = await getTransaction(item.txId)
                            data.sellGas += satsToBtc(txn.fee)
                            data.split++

                        } else {

                            // // C'est un airdrop ou un transfer car il n'y a pas de split associé
                            // // mais ça peut ausis être un mint donc on vérifie.
                            //    const txn = await getTransaction(item.txId)
                            //   const inflow = txn.vin // On utilise le flux pour déterminer si c'est un mint ou un airdrop
                            //   const senders = [...new Set(inflow.filter(i => i.scriptpubkey_address).map(i => i.scriptpubkey_address))].length



                            ////// ICI IL FAUT FAIRE LE HIDDEN SELL ^^^^^^^



                            // C'est un transfer car il n'y a pas de split associé
                            // mais ça peut ausis être un mint donc on vérifie.
                            data.transfer++
                            // On peut rajouter les gas fees ici mais ça demande un call en plus
                        }
                        // On ajoute la tx à la liste des transactions
                        txArray.push(item.txId)
                    }
                }
                // On ajoute un léger delay, type 1/3 de seconde
                await addTimeout(0.25)
            }
        }

        // On récupère les valeurs CALL au début
        // On calcul quelques valeurs en plus
        const [token, held] = await Promise.all([tokenPRM, heldPRM]);

        // On ajoute les valeurs du holding actuel
        // REGLER LE FORMAT EN BN (actuellement exposant math)
        // Voir pour déduire held amount par Buy - Sell (seulement si tous les buy/sell sont comptés dans les transfert)
        data.heldAmount = held
        if (data.heldAmount > 0) { data.heldValue = (data.heldAmount * token.price) }

        // On calcul les valeurs d'average
        if (data.buyValue) { data.avgMCBuy = (data.buyValue / data.buyAmount) * token.supply * btcPrice; data.avgBuy = (data.buyValue / data.buyAmount) * btcPrice }
        if (data.sellValue) { data.avgMCSell = (data.sellValue / data.sellAmount) * token.supply * btcPrice; data.avgSell = (data.sellValue / data.sellAmount) * btcPrice }
        data.currentMC = token.supply * token.price * btcPrice

        // On calcul les valeurs de gas
        data.totalGas = data.buyGas + data.sellGas
        if (data.totalGas) { data.avgGas = data.totalGas / (data.swapIn + data.swapOut + data.transfer + data.split + data.mint) }

        // On calcul les valeurs de profit
        data.realizedPNL = data.sellValue - (data.buyValue + data.totalGas)
        data.potentialPNL = (data.sellValue + data.heldValue) - (data.buyValue + data.totalGas)

        // On calcul le ROI et MLTP
        if (data.sellValue) { data.realizedMLTP = data.sellValue / (data.buyValue + data.totalGas) }
        if (data.sellValue + data.heldValue >= 0.001) { data.potentialMLTP = (data.sellValue + data.heldValue) / (data.buyValue + data.totalGas) }
        if (data.sellValue - (data.buyValue + data.totalGas)) { data.realizedROI = ((data.sellValue - (data.buyValue + data.totalGas)) / (data.buyValue + data.totalGas)) * 100 }
        if ((data.sellValue + data.heldValue) - (data.buyValue + data.totalGas)) { data.potentialROI = (((data.sellValue + data.heldValue) - (data.buyValue + data.totalGas)) / (data.buyValue + data.totalGas)) * 100 }

        // On formatte le ROI
        // Le ROI doit être formatter ici car il peut être infinity
        let prettierROI = parseFloat(data.potentialROI).toFixed(2) + "%"
        let prettierMLTP = "x" + parseFloat(data.potentialMLTP).toFixed(2)
        if (data.potentialROI == Infinity) {
            prettierROI = "∞ %"
            prettierMLTP = "x0.00"
        }

        // Toutes les values ont été calculés, on fait du formattage
        const prettierData = {
            swapIn: data.swapIn,
            swapOut: data.swapOut,
            airdrop: data.airdrop + data.mint,
            buyAmount: formatCoinValueSign(data.buyAmount, 2),
            sellAmount: formatCoinValueSign(data.sellAmount, 2),
            heldAmount: formatCoinValueSign(data.heldAmount, 2),
            buyValue: parseFloat(data.buyValue).toFixed(4) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.buyValue * btcPrice).toFixed(0)) + ")",
            sellValue: parseFloat(data.sellValue).toFixed(4) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.sellValue * btcPrice).toFixed(0)) + ")",
            heldValue: parseFloat(data.heldValue).toFixed(4) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.heldValue * btcPrice).toFixed(0)) + ")",
            buyGas: parseFloat(data.buyGas).toFixed(4) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.buyGas * btcPrice).toFixed(0)) + ")",
            sellGas: parseFloat(data.sellGas).toFixed(4) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.sellGas * btcPrice).toFixed(0)) + ")",
            totalGas: parseFloat(data.totalGas).toFixed(4) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.totalGas * btcPrice).toFixed(0)) + ")",
            avgGas: parseFloat(data.avgGas).toFixed(4) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgGas * btcPrice).toFixed(0)) + ")",
            avgMCBuy: "$" + formatCoinValueSign(data.avgMCBuy, 2),
            avgMCSell: "$" + formatCoinValueSign(data.avgMCSell, 2),
            currentMC: "$" + formatCoinValueSign(data.currentMC, 2),
            realizedPNL: parseFloat(data.realizedPNL).toFixed(4) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.realizedPNL * btcPrice).toFixed(0)) + ")",
            potentialPNL: parseFloat(data.potentialPNL).toFixed(4) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.potentialPNL * btcPrice).toFixed(0)) + ")",
            realizedMLTP: "x" + parseFloat(data.realizedMLTP).toFixed(2),
            potentialMLTP: prettierMLTP,
            realizedROI: parseFloat(data.realizedROI).toFixed(2) + "%",
            potentialROI: prettierROI,
        }

        const result = {
            token: {
                name: token.name,
                symbol: token.symbol,
                slug: token.ticker,
                price: token.price,
                logo: token.logo,
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

// runesProfitSingle(

//     "SHITONBITCOIN",
//     'bc1p52c6r00l27nnaw5893uu7xprzedjyvxqq5g2vt9mz08m68dfngcq9tm2nh'
// )
// Mint BLOKBLOKBLOKJE
// Airdrop DECENTRALIZED


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


module.exports = {
    runesProfitSingle
}
