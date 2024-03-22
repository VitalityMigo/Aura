const { sol } = require("../config/web3config")

const { getMetrics, getTokenBalance, getSupply, getSolPrice, getTokenAccountAddress, getTransactionHistory, findWalletIndexInAccounts } = require("./sol-utils")
const formatCoinValueSign = require("./formatNumberEmbed")
const isOnlyFees = (fees, solAMNT) => fees === solAMNT;

const solAddress = "So11111111111111111111111111111111111111112"
const decimals = 9

// Main
async function solCoinProfit(contract, wallet, time) {

    try {


        const data = {
            swapIn: 0,
            swapOut: 0,
            transfer: 0,
            approval: 0,
            failed: 0,
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

        // On lance les calls de base
        const metricsCALL = getMetrics(contract)
        const supplyCALL = getSupply(contract)
        const solPriceCALL = getSolPrice()


        // On récupère la sub-addresse
        // C'est l'addresse qui correspond à la paire main wallet & token
        const address = await getTokenAccountAddress(contract, wallet)


        // On lance les calls pour récupérer le nombre de token held
        const heldCALL = getTokenBalance(address.raw)

        // On récupère l'historique de transaction de la sub addresse
        // Cette historique renverra toutes les txn sur le token
        // On tri par txn finalized
        const txRaw = (await getTransactionHistory(address.raw))
        const tx = txRaw.filter(item => item.confirmationStatus == "finalized").map(item => item.signature).reverse()

        // On récupère l'ensemble des transactions parse
        // C'est cette liste qu'on va analyser
        const transactions = await sol.getParsedTransactions(tx, {
            "maxSupportedTransactionVersion": 0
        });

        // On commence la boucle qui va incrémenter les objets
        // C'est cette boucle qui analyse les swaps
        // Tx prend cela en compte
        for (const tx of transactions) {

            // On récupère l'index du wallet dans la liste des accounts de la transaction
            // On lui donne la transaction, et le main wallet
            const index = findWalletIndexInAccounts(tx, wallet)

            // On commence par récupèrer la balance de SOL avant et après la transaction
            // On fait ensuite la soustraction pour connaitre le prix payé
            // Cela prend en compte les fees puisque on regarde la balance 
            const solPre = tx.meta.preBalances[index]
            const solPost = tx.meta.postBalances[index]
            const solAMNT = (solPost - solPre) / 10 ** decimals

            // Ensuite, on observe la balance du token avant et après
            // On vérifie aussi s'il y'a des tokens, ça peut être une failed txn ou autre.
            // Il peut aussi y avoir 0 tokens, donc on ne regarde pas que l'erreur
            let tokenPost = 0
            let tokenPre = 0
            const preBalanceTable = tx.meta.preTokenBalances.find(item => item.mint == contract && item.owner == wallet)
            const postBalanceTable = tx.meta.postTokenBalances.find(item => item.mint == contract && item.owner == wallet)

            // On vérifie qu'il y'avait des tokens avant
            // Si oui, on ajoute les valeurs correspondante
            if (preBalanceTable) {
                tokenPre = preBalanceTable.uiTokenAmount.uiAmount
            }
            // On vérifie qu'il y'a des tokens après
            // Si oui, on ajoute les valeurs correspondante
            if (postBalanceTable) {
                tokenPost = postBalanceTable.uiTokenAmount.uiAmount
            }
            // On ajote les deux valeurs pour voir la différence
            // Ca nous donne le nombre de tokens envoyés ou reçu
            const tknTrade = tokenPost - tokenPre

            // On récupère les fees
            const fees = tx.meta.fee / 10 ** decimals
            const onlyFees = isOnlyFees(fees, Math.abs(solAMNT))
            const error = tx.meta.err

            // On vérifie si la transaction a réussi
            // Si oui, on fait le process classique
            // Si non, on compte que les gas
            if (!error) {

                // On définit si c'est un achat ou une vente
                if (solAMNT < 0) {
                    // Du SOL est envoyé

                    if (tknTrade > 0) {
                        // Il y'a une perte de SOL, des tokens qui rentre
                        // Donc, c'est un airdrop, un transfer in, ou un claim

                        if (!onlyFees) {
                            // Le SOL dépensé n'est pas égal au fees
                            // C'est donc un swap in, on prend tout en compte

                            data.swapIn++
                            data.buyAmount += tknTrade
                            data.buyValue += Math.abs(solAMNT) // Relative de - à +
                            data.buyGas += fees
                        } else {
                            // Le SOL dépensé est égal au fees et des tokens rentrent
                            // C'est donc un claim, on prend tout en compte

                            data.transfer++
                            data.buyGas += fees
                            data.buyAmount += tknTrade
                        }


                    } else if (tknTrade < 0 && onlyFees) {
                        // Il y'a une perte de token avec la transaction : soit venten, soit transfer
                        // La valeur SOL dépensé est égal au fees, donc c'est un transfert
                        // Pour les transfert on compte juste ceux entrant, mais on compte les gas

                        data.sellGas += fees
                        data.sellAmount += Math.abs(tknTrade)
                    }

                } else if (solAMNT > 0) {
                    // Sell

                    if (tknTrade < 0) {
                        // C'est un swap out

                        data.swapOut++
                        data.sellAmount += Math.abs(tknTrade)
                        data.sellValue += solAMNT
                        data.sellGas += fees

                    } else {
                        // Transfert ou approval

                        data.sellGas += fees
                        data.transfer++

                    }

                } else if (solAMNT == 0) {
                    // Il y'a pas de changement dans le nombre de SOL
                    // C'est surement un airdrop

                    if (tknTrade > 0) {
                        // On vérifie si il y'a des tokens recu, si oui c'est un airdrop

                        data.transfer++
                    }
                }

            } else {
                // Failed transaction
                // On prend en compte juste les gas
                data.buyGas += fees
                data.failed++
            }

        }

        // On récupère les valeurs CALL au début
        // On récupère les infos du token
        // On calcul quelques valeurs en plus
        const [metrics, held, supply, solPrice] = await Promise.all([metricsCALL, heldCALL, supplyCALL, solPriceCALL]);
        const priceUSD = metrics.priceUSD
        const priceSOL = metrics.priceSOL

        // On ajoute les valeurs du holding actuel
        // REGLER LE FORMAT EN BN (actuellement exposant math)
        // Voir pour déduire held amount par Buy - Sell (seulement si tous les buy/sell sont comptés dans les transfert)
        data.heldAmount = held
        if (data.heldAmount > 0) { data.heldValue = (data.heldAmount * priceSOL) }

        // On calcul les valeurs d'average
        if (data.buyValue) { data.avgMCBuy = (data.buyValue / data.buyAmount) * supply * solPrice }
        if (data.sellValue) { data.avgMCSell = (data.sellValue / data.sellAmount) * supply * solPrice }
        data.currentMC = supply * priceUSD

        // On finit les valeus du tableau
        // On calcul les valeurs de gas
        data.totalGas = data.buyGas + data.sellGas
        if (data.totalGas) { data.avgGas = data.totalGas / (data.swapIn + data.swapOut + data.transfer + data.approval + data.failed) }

        // On calcul les valeurs de profit
        data.realizedPNL = data.sellValue - (data.buyValue + data.totalGas)
        data.potentialPNL = (data.sellValue + data.heldValue) - (data.buyValue + data.totalGas)

        // On calcul le ROI et MLTP
        if (data.sellValue) { data.realizedMLTP = data.sellValue / (data.buyValue + data.totalGas) }
        if (data.sellValue + data.heldValue >= 0.001) { data.potentialMLTP = (data.sellValue + data.heldValue) / (data.buyValue + data.totalGas) }
        if (data.sellValue - (data.buyValue + data.totalGas)) { data.realizedROI = ((data.sellValue - (data.buyValue + data.totalGas)) / (data.buyValue + data.totalGas)) * 100 }
        if ((data.sellValue + data.heldValue) - (data.buyValue + data.totalGas)) { data.potentialROI = (((data.sellValue + data.heldValue) - (data.buyValue + data.totalGas)) / (data.buyValue + data.totalGas)) * 100 }

        // On récupère les metadatas
        const name = metrics.token.name
        const symbol = metrics.token.symbol

        // Toutes les values ont été calculés, on fait du formattage
        const prettierData = {
            swapIn: data.swapIn,
            swapOut: data.swapOut,
            transfer: data.transfer,
            buyAmount: formatCoinValueSign(data.buyAmount, 2),
            sellAmount: formatCoinValueSign(data.sellAmount, 2),
            heldAmount: formatCoinValueSign(data.heldAmount, 2),
            buyValue: parseFloat(data.buyValue).toFixed(3) + " SOL ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.buyValue * solPrice).toFixed(0)) + ")",
            sellValue: parseFloat(data.sellValue).toFixed(3) + " SOL ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.sellValue * solPrice).toFixed(0)) + ")",
            heldValue: parseFloat(data.heldValue).toFixed(3) + " SOL ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.heldValue * solPrice).toFixed(0)) + ")",
            buyGas: parseFloat(data.buyGas).toFixed(3) + " SOL ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.buyGas * solPrice).toFixed(0)) + ")",
            sellGas: parseFloat(data.sellGas).toFixed(3) + " SOL ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.sellGas * solPrice).toFixed(0)) + ")",
            totalGas: parseFloat(data.totalGas).toFixed(3) + " SOL ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.totalGas * solPrice).toFixed(0)) + ")",
            avgGas: parseFloat(data.avgGas).toFixed(3) + " SOL ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgGas * solPrice).toFixed(0)) + ")",
            avgMCBuy: "$" + formatCoinValueSign(data.avgMCBuy, 2),
            avgMCSell: "$" + formatCoinValueSign(data.avgMCSell, 2),
            currentMC: "$" + formatCoinValueSign(data.currentMC, 2),
            realizedPNL: parseFloat(data.realizedPNL).toFixed(3) + " SOL ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.realizedPNL * solPrice).toFixed(0)) + ")",
            potentialPNL: parseFloat(data.potentialPNL).toFixed(3) + " SOL ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.potentialPNL * solPrice).toFixed(0)) + ")",
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
                priceSOL: priceSOL,
                sol: solPrice,
            },
            raw: data,
            prettier: prettierData,
            tx: tx
        }

        return result

    } catch (error) {

        console.log(error.stack)
        return null
    }

}

module.exports = {
    solCoinProfit
}


