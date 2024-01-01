//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const etherscanApiKey = process.env.etherscanApiKey

const { nftgoHead } = require("../config/web3config")


const axios = require("axios")
const { getToken, getBalance, getSupply, getMetrics } = require("./coin-utils")
const getApprovals = require("./getApprovals")
const formatCoinValueSign = require("./formatNumberEmbed")
const { getEthPrice } = require('../config/web3data.js')

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
        const ethPrice = getEthPrice()
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

/////////////////////////////////////////////////////////////////////////////////////////////////////////


//// Travail sur NFT profit

// //Récupérer les clefs API
// const dotenv = require("dotenv")
// dotenv.config()
// const infuraApiKey = process.env.infuraApiKey

const { getCollection } = require("./1nft-utils")
const getApprovalForAll = require("./getApprovalForAll")
const poolTab = require("../contracts/nft/pools.json")
const pools = poolTab.map(item => item.contract.toLowerCase())
const mintAddress = "0x0000000000000000000000000000000000000000"
const decimals = 18

async function nftProfitSingle(cont, wall, time) {

    try {

        const data = {
            mint: 0,
            buy: 0,
            total: 0,
            sell: 0,
            held: 0,
            airdrop: 0,
            transfer: 0,
            approval: 0,
            trade: 0,
            mintValue: 0,
            mintGas: 0,
            mintTotal: 0,
            buyValue: 0,
            buyGas: 0,
            buyTotal: 0,
            totalValue: 0,
            sellValue: 0,
            sellGas: 0,
            sellTotal: 0,
            heldValue: 0,
            totalGas: 0,
            avgMint: 0,
            avgBuy: 0,
            avgTotal: 0,
            avgSold: 0,
            avgGas: 0,
            avgHeld: 0,
            realisedPNL: 0,
            potentialPNL: 0,
            potentialROI: 0,
        }

        // On formatte tout en lower case
        const contract = cont.toLowerCase()
        const wallet = wall.toLowerCase()
        const timestamp = getTimestamp(time)

        // On lance les calls en synchrone
        // Ils seront résolu plus bas pour gagner du temps
        const ethPrice = getEthPrice()
        const collectionCALL = getCollection([contract])
        const approvalsCALL = getApprovalForAll(wallet, contract)



        const [internalTxs, normalTxs, nftTxs, tokenGlobalTxs] = await Promise.all([
            axios.get(`https://api.etherscan.io/api?module=account&action=txlistinternal&address=${wallet}&startblock=0&page=1&offset=10000&sort=asc&apikey=${etherscanApiKey}`).then(res => res.data.result.filter(item => parseInt(item.timeStamp) >= timestamp)),
            axios.get(`https://api.etherscan.io/api?module=account&action=txlist&address=${wallet}&startblock=0&page=1&offset=10000&sort=asc&apikey=${etherscanApiKey}`).then(res => res.data.result.filter(item => parseInt(item.timeStamp) >= timestamp)),
            axios.get(`https://api.etherscan.io/api?module=account&action=tokennfttx&contractaddress=${contract}&address=${wallet}&page=1&offset=10000&startblock=0&sort=desc&apikey=${etherscanApiKey}`).then(res => res.data.result.filter(item => parseInt(item.timeStamp) >= timestamp)),
            axios.get(`https://api.etherscan.io/api?module=account&action=tokentx&address=${wallet}&page=1&offset=10000&startblock=0&sort=desc&apikey=${etherscanApiKey}`).then(res => res.data.result.filter(item => parseInt(item.timeStamp) >= timestamp)),
        ]);
        const tokenTxs = tokenGlobalTxs.filter(item => pools.includes(item.contractAddress.toLowerCase()))

        // On intialise le tableau avec les hash
        // D'abord celui avec tous les hashs
        // Puis celui avec les hash des contreparties, pour ne pas qu'il soit compter deux fois
        const allTxs = []
        const counterTxs = []


        for (const trade of nftTxs) {


            // On initialise les valeurs de la transaction
            const from = trade.from.toLowerCase()
            const to = trade.to.toLowerCase()
            const value = trade.value / 10 ** 18
            const tokenId = trade.tokenId
            const fees = parseFloat(trade.gasPrice * trade.gasUsed) / 10 ** 18
            const hash = trade.hash.toLowerCase()


            // On recherche les transactions similaires dans les autres types de transfert
            // On sépare les tokenOut et tokenIn car il ne faut pas que des royalties soient confondus en cas de bid acceptés
            const normalLKP = normalTxs.find(item => item.hash == hash);
            const tokenLKPIn = tokenTxs.filter(item => item.hash == hash && item.from == from);
            const tokenLKPOut = tokenTxs.filter(item => item.hash == hash && item.to == from);
            const internalLKP = internalTxs.filter(item => item.hash == hash);

            // On regarde la taille de internal vu que c'est un filter
            const internalSize = internalLKP.length
            const tokenSizeIn = tokenLKPIn.length
            const tokenSizeOut = tokenLKPOut.length

            // On regarde s'il existe un hash déjà compté en contrepartie 
            // Si oui, on ne la comptera pas plus tard
            const isCounterpart = counterTxs.find(item => item == hash)

            if (to === wallet) {
                // C'est un achat


                if (!tokenSizeIn && !internalSize && !normalLKP) {
                    // Il n'y a aucune transaction en contrepartie
                    // C'est soit un transfert soit un airdrop
                    // Le wallet n'a rien payé

                    data.airdrop++

                } else if (normalLKP) {
                    // Il y'a une contrepartie dans un txn normal
                    // Cela veut dire que le user a lancé une transaction de lui même
                    // Il faut vérifier si c'est un mint ou un achat normal

                    if (from === mintAddress) {
                        // Le token a été transférer depuis une addresse dead, c'est donc un mint
                        // On incrémente les valeurs et catégorise en mint

                        // On ajoute le nombre de mint
                        data.mint++

                        // On vérifie que la counterpart du trade n'a pas été analyser déjà
                        // Si il l'a pas été, le trade en lui même non plus
                        if (!isCounterpart) {
                            // On ajoute le nombre de token transféré et les gas
                            // même si la contrepartie a déjà été compter, car on se base là dessus
                            data.mintGas += fees
                            data.mintValue += normalLKP.value / 10 ** decimals
                            // On push le hash de contrepartie
                            counterTxs.push(hash)
                        }

                    } else {
                        // C'est un buy classique
                        // On incrémente seulement les valeurs de buy

                        // On ajoute le nombre de buy
                        data.buy++

                        // On vérifie que la counterpart du trade n'a pas été analyser déjà
                        // Si il l'a pas été, le trade en lui même non plus
                        if (!isCounterpart) {
                            // On ajoute le nombre de token transféré et les gas
                            // même si la contrepartie a déjà été compter, car on se base là dessus
                            data.buyGas += fees
                            data.buyValue += normalLKP.value / 10 ** decimals
                            // On push le hash de contrepartie
                            counterTxs.push(hash)
                        }
                    }

                    // On regarde s'il y'a eu un remboursement
                    // Dans le cas où des tokens ont pas pu être acheter
                    // Donc la marketplace rembource
                    if (internalSize && !isCounterpart) {

                        // On fait une boucle au cas où il y'a plusieurs remboursement
                        for (const internal of internalLKP) {
                            data.buyValue -= internal.value / 10 ** decimals
                        }
                    }

                } else if (tokenSizeIn) {
                    // C'est probablement une bid accepté
                    // Il suffit maintenant de chercher le token utilisé pour bid
                    // et d'ajouter les valeus correspondantes en buy

                    // On ajoute le nombre de buy
                    data.buy++

                    // On ajoute les gas seulement une fois
                    if (!isCounterpart) {
                        data.buyGas += fees
                    }

                    // On utilise une boucle pour 
                    for (const tokenTxn of tokenLKPIn) {


                        const poolTKN = poolTab.find(item => item.contract == tokenTxn.contractAddress.toLowerCase())

                        if (poolTKN) {
                            // C'est une bid du user qui a été accepter
                            // On caclul donc la valeur en fonction des decimal du tableau
                            // Prend en compte Blur ETH et WETH

                            // On vérifie que la counterpart du trade n'a pas été analyser déjà
                            // Si il l'a pas été, le trade en lui même non plus
                            if (!isCounterpart) {
                                // On ajoute le nombre de token transféré et les gas
                                // même si la contrepartie a déjà été compter, car on se base là dessus
                                data.buyValue += tokenTxn.value / 10 ** poolTKN.decimals
                                // On push le hash de contrepartie
                                counterTxs.push(hash)
                            }
                        }


                    }



                }


                // On push dans le tableau de hash
                allTxs.push({
                    hash: hash,
                    direction: "in"
                })


            } else if (from === wallet) {
                // C'est une vente

                if (!tokenSizeOut && !internalSize && !normalLKP) {
                    // Il n'y a aucune transaction en contrepartie
                    // C'est probablement un transfert out
                    // Le wallet paye les gas du transfert

                    data.airdrop--
                    data.sellGas++

                } else if (internalSize) {
                    // Il y'a une contrepartie dans un txn internal
                    // Cela veut dire que le user vendu un de ses items listés

                    // On ajoute le nombre de sell
                    data.sell++

                    // On vérifie que la counterpart du trade n'a pas été analyser déjà
                    // Si il l'a pas été, le trade en lui même non plus
                    if (internalSize && !isCounterpart) {
                        // On ajoute le nombre de token transféré et les gas
                        // même si la contrepartie a déjà été compter, car on se base là dessus

                        // On push tous les transfer internal vers l'auteur
                        for (const internal of internalLKP) {
                            data.sellValue += internal.value / 10 ** decimals
                        }
                        // On push le hash de contrepartie
                        counterTxs.push(hash)
                    }

                } else if (tokenSizeOut) {
                    // C'est probablement une bid accepté
                    // Il suffit maintenant de chercher le token utilisé pour bid
                    // et d'ajouter les valeus correspondantes en sell

                    // On ajoute le nombre de sell
                    data.sell++

                    // On ajoute les gas seulement une fois
                    if (!isCounterpart) {
                        data.sellGas += fees
                    }

                    // On utilise une boucle pour prendre tous les transfer de token vers le user en cas de bulk sell
                    for (const tokenTxn of tokenLKPOut) {


                        const poolTKN = poolTab.find(item => item.contract == tokenTxn.contractAddress.toLowerCase())

                        if (poolTKN) {
                            // C'est une bid du user qui a été accepter
                            // On caclul donc la valeur en fonction des decimal du tableau
                            // Prend en compte Blur ETH et WETH

                            // On vérifie que la counterpart du trade n'a pas été analyser déjà
                            // Si il l'a pas été, le trade en lui même non plus
                            if (!isCounterpart) {
                                // On ajoute le nombre de token transféré et les gas
                                // même si la contrepartie a déjà été compter, car on se base là dessus
                                data.sellValue += tokenTxn.value / 10 ** poolTKN.decimals
                                // On push le hash de contrepartie
                                counterTxs.push(hash)
                            }
                        }


                    }


                } else if (normalLKP) {
                    // C'est un transfert car il n'y a :
                    // pas de token en échange (bid accepté), ni d'ETH (listing vendu)
                    // On vérifie quand même la contrepartie, ça peut être un bulk transfer avec plusieurs tokens

                    // On déduit du nombre d'airdrop et transfert
                    data.airdrop--

                    // On vérifie que la counterpart du trade n'a pas été analyser déjà
                    // Si il l'a pas été, le trade en lui même non plus
                    if (!isCounterpart) {
                        // On ajoute le nombre de token transféré et les gas
                        // même si la contrepartie a déjà été compter, car on se base là dessus
                        data.sellGas += fees
                        // On push le hash de contrepartie
                        counterTxs.push(hash)
                    }


                }


                // On push dans le tableau de hash
                allTxs.push({
                    hash: hash,
                    direction: "out"
                })
            }




        }


        // On récupère le tableau des approvals
        const [approvals] = await Promise.all([approvalsCALL]);
        for (const tx of approvals) {

            if (!allTxs.map(obj => obj.hash).includes((tx.transactionHash).toLowerCase())) {
                // On vérifie qu'on a pas déjà compter l'approval dans un buy & approve par exemple

                const normalLKP = await normalTxs.find(obj => obj.hash == (tx.transactionHash).toLowerCase());

                if (normalLKP) {

                    const fees = parseFloat(((normalLKP.gasPrice) * (normalLKP.gasUsed))) / 10 ** 18
                    data.sellGas += fees
                    data.approval++

                    // On push dans le tableau de hash
                    allTxs.push({
                        hash: tx.transactionHash,
                        direction: "approval"
                    })


                }
            }
        }


        // On résolve les call en attente lancé au début du code
        const [collectionRaw] = await Promise.all([collectionCALL]);
        // On construit l'objet collectio
        const floor = collectionRaw[0].floor


        // On commence par additioner les valeurs de base pour les calculs
        data.mintTotal = data.mintValue + data.mintGas
        data.buyTotal = data.buyValue + data.buyGas
        data.sellTotal = data.sellValue - data.sellGas
        data.totalGas = data.buyGas + data.sellGas + data.mintGas
        data.totalValue = data.buyTotal + data.mintTotal

        // Puis les valeurs en plus
        data.total = data.buy + data.mint
        data.held = data.total + data.airdrop - data.sell
        data.trade = [...new Set(allTxs.map(item => item.hash))].length

        // On continu avec les average
        if (data.buyTotal) { data.avgBuy = data.buyTotal / data.buy }
        if (data.mintTotal) { data.avgMint = data.mintTotal / data.mint }
        if (data.totalValue) { data.avgTotal = (data.totalValue) / data.total }
        if (data.sellValue) { data.avgSold = data.sellTotal / data.sell }
        if (floor && data.held) { data.avgHeld = floor; data.heldValue = floor * data.held }
        if (data.totalGas && data.trade) { data.avgGas = data.totalGas / data.trade }

        // Enfin, on calcul les valeurs de PNL 
        // On calcul les valeurs de profit
        data.realisedPNL = data.sellTotal - data.totalValue
        data.potentialPNL = (data.sellTotal + data.heldValue) - data.totalValue

        // On calcul le ROI
        if ((data.sellTotal + data.heldValue) - (data.totalValue)) {
            data.potentialROI = (((data.sellTotal + data.heldValue) - (data.totalValue)) / (data.totalValue)) * 100
        }

        // On formatte le ROI
        // Le ROI doit être formatter ici car il peut être infinity
        let prettierROI = parseFloat(data.potentialROI).toFixed(2) + "%"
        if (data.potentialROI == Infinity) {
            prettierROI = "∞ %"
        }



        // Toutes les values ont été calculés, on fait du formattage
        const prettier = {
            mintValue: parseFloat(data.mintValue).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(data.mintValue * ethPrice).toFixed(0)) + "$)",
            mintGas: parseFloat(data.mintGas).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(data.mintGas * ethPrice).toFixed(0)) + "$)",
            mintTotal: parseFloat(data.mintTotal).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(data.mintTotal * ethPrice).toFixed(0)) + "$)",
            buyValue: parseFloat(data.buyValue).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(data.buyValue * ethPrice).toFixed(0)) + "$)",
            buyGas: parseFloat(data.buyGas).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(data.buyGas * ethPrice).toFixed(0)) + "$)",
            buyTotal: parseFloat(data.buyTotal).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(data.buyTotal * ethPrice).toFixed(0)) + "$)",
            sellValue: parseFloat(data.sellValue).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(data.sellValue * ethPrice).toFixed(0)) + "$)",
            sellGas: parseFloat(data.sellGas).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(data.sellGas * ethPrice).toFixed(0)) + "$)",
            sellTotal: parseFloat(data.sellTotal).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(data.sellTotal * ethPrice).toFixed(0)) + "$)",
            mint: new Intl.NumberFormat('en-US').format(parseFloat(data.mint).toFixed(0)),
            buy: new Intl.NumberFormat('en-US').format(parseFloat(data.buy).toFixed(0)),
            airdrop: new Intl.NumberFormat('en-US').format(parseFloat(data.airdrop).toFixed(0)),
            sell: new Intl.NumberFormat('en-US').format(parseFloat(data.sell).toFixed(0)),
            held: new Intl.NumberFormat('en-US').format(parseFloat(data.held).toFixed(0)),
            txs: new Intl.NumberFormat('en-US').format(parseFloat(data.trade).toFixed(0)),
            avgMint: parseFloat(data.avgMint).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgMint * ethPrice).toFixed(0)) + "$)",
            avgBuy: parseFloat(data.avgBuy).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgBuy * ethPrice).toFixed(0)) + "$)",
            avgTotal: parseFloat(data.avgTotal).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgTotal * ethPrice).toFixed(0)) + "$)",
            avgSold: parseFloat(data.avgSold).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgSold * ethPrice).toFixed(0)) + "$)",
            avgHeld: parseFloat(data.avgHeld).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgHeld * ethPrice).toFixed(0)) + "$)",
            avgGas: parseFloat(data.avgGas).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgGas * ethPrice).toFixed(0)) + "$)",
            realisedPNL: parseFloat(data.realisedPNL).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(data.realisedPNL * ethPrice).toFixed(0)) + "$)",
            potentialPNL: parseFloat(data.potentialPNL).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(data.potentialPNL * ethPrice).toFixed(0)) + "$)",
            potentialROI: prettierROI,
        }

        const result = {
            collection: {
                name: collectionRaw[0].name,
                contract: collectionRaw[0].contract,
                banner: collectionRaw[0].banner,
                floor: collectionRaw[0].floor,
                slug: collectionRaw[0].links.slug
            },
            raw: data,
            prettier: prettier
        }


        return result

    } catch (error) {

        console.log(error.stack)
        return null
    }



}

async function nftProfitGlobal(wall) {

    try {

        // On récupère le wallet
        const wallet = wall.toLowerCase()

        // On envoi le call non résolu pour récupérer le prix de l'ETH
        const ethPrice = getEthPrice()

        // On fait le call à l'API
        const portfolio = (await axios.get("https://data-api.nftgo.io/eth/v2/address/metrics?address=" + wallet, { headers: nftgoHead })).data


        if (portfolio.address_tag) {
            // On vérifie que le tableau de data est présent


            const data = {
                mint: portfolio.mint_num,
                buy: portfolio.buy_num,
                airdrop: portfolio.receive_num - portfolio.send_num,
                sell: portfolio.sell_num,
                held: portfolio.nft_num,
                trade: portfolio.activity_num,
                buyValue: portfolio.total_spent.eth,
                sellValue: portfolio.total_revenue.eth,
                heldValue: portfolio.portfolio_value.eth,
                gasCost: portfolio.total_gas.eth,
                royalties: portfolio.total_royalty_expense.eth,
                avgBuy: portfolio.total_spent.eth / (portfolio.mint_num + portfolio.buy_num),
                avgSold: portfolio.total_revenue.eth / portfolio.sell_num,
                avgHeld: portfolio.portfolio_value.eth / portfolio.nft_num,
                realisedPNL: portfolio.total_revenue.eth - portfolio.total_spent.eth,
                potentialPNL: (portfolio.total_revenue.eth + portfolio.portfolio_value.eth) - portfolio.total_spent.eth,
                realisedROI: ((portfolio.total_revenue.eth - portfolio.total_spent.eth) / portfolio.total_spent.eth) * 100,
                potentialROI: (((portfolio.total_revenue.eth + portfolio.portfolio_value.eth) - portfolio.total_spent.eth) / portfolio.total_spent.eth) * 100,
            }

            const prettier = {
                buyValue: parseFloat(data.buyValue).toFixed(3) + "Ξ\n(" + new Intl.NumberFormat('en-US').format(parseFloat(data.buyValue * ethPrice).toFixed(0)) + "$)",
                sellValue: parseFloat(data.sellValue).toFixed(3) + "Ξ\n(" + new Intl.NumberFormat('en-US').format(parseFloat(data.sellValue * ethPrice).toFixed(0)) + "$)",
                heldValue: parseFloat(data.heldValue).toFixed(3) + "Ξ\n(" + new Intl.NumberFormat('en-US').format(parseFloat(data.heldValue * ethPrice).toFixed(0)) + "$)",
                mint: new Intl.NumberFormat('en-US').format(parseFloat(data.mint).toFixed(0)),
                buy: new Intl.NumberFormat('en-US').format(parseFloat(data.buy).toFixed(0)),
                airdrop: new Intl.NumberFormat('en-US').format(parseFloat(data.airdrop).toFixed(0)),
                sell: new Intl.NumberFormat('en-US').format(parseFloat(data.sell).toFixed(0)),
                held: new Intl.NumberFormat('en-US').format(parseFloat(data.held).toFixed(0)),
                trade: new Intl.NumberFormat('en-US').format(parseFloat(data.trade).toFixed(0)),
                avgBuy: parseFloat(data.avgBuy).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgBuy * ethPrice).toFixed(0)) + "$)",
                avgSold: parseFloat(data.avgSold).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgSold * ethPrice).toFixed(0)) + "$)",
                avgHeld: parseFloat(data.avgHeld).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgHeld * ethPrice).toFixed(0)) + "$)",
                gasCost: parseFloat(data.gasCost).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(data.gasCost * ethPrice).toFixed(0)) + "$)",
                royalties: parseFloat(data.royalties).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(data.royalties * ethPrice).toFixed(0)) + "$)",
                realisedPNL: parseFloat(data.realisedPNL).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(data.realisedPNL * ethPrice).toFixed(0)) + "$)",
                potentialPNL: parseFloat(data.potentialPNL).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(data.potentialPNL * ethPrice).toFixed(0)) + "$)",
                realisedROI: parseFloat(data.realisedROI).toFixed(2) + "%",
                potentialROI: parseFloat(data.potentialROI).toFixed(2) + "%",
            }

            const result = {
                user: {
                    address: wallet,
                    isWhale: portfolio.is_whale,
                    isBluechip: portfolio.is_super_blue_chip_holder,
                },
                raw: data,
                prettier: prettier
            }

            
            return result

        } else {
            // Il n'y a pas de réponse au call
            return null
        }

    } catch (error) {
        console.log(error.stack)
        return null
    }

}



module.exports = {
    coinProfitSingle,
    nftProfitSingle,
    nftProfitGlobal
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