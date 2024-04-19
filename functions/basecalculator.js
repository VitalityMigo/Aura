//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const basescanApiKey = process.env.basescanApiKey


const axios = require("axios")
const { getEthPrice } = require('../config/web3data.js')
const addTimeout = require("../functions/addtimeout.js")
const { getBaseCollection } = require("../functions/base-utils");
const getApprovalForAll = require("./getApprovalForAll")
const poolTab = require("../contracts/nft/pools.json")
const pools = poolTab.map(item => item.contract.toLowerCase())
const mintAddress = "0x0000000000000000000000000000000000000000"
const decimals = 18

async function baseNftProfitSingle(cont, wall, time) {

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
        const collectionCALL = getBaseCollection([contract])
        //const approvalsCALL = getApprovalForAll(wallet, contract)


        // On limite le call 2 (normal txn) à 3000 objet du au limitation
        const [internalTxs, normalTxs, nftTxs, tokenGlobalTxs] = await Promise.all([
            axios.get(`https://api.basescan.org/api?module=account&action=txlistinternal&address=${wallet}&startblock=0&page=1&offset=10000&sort=asc&apikey=${basescanApiKey}`).then(res => res.data.result.filter(item => parseInt(item.timeStamp) >= timestamp)),
            axios.get(`https://api.basescan.org/api?module=account&action=txlist&address=${wallet}&startblock=0&page=1&offset=3000&sort=asc&apikey=${basescanApiKey}`).then(res => res.data.result.filter(item => parseInt(item.timeStamp) >= timestamp)),
            axios.get(`https://api.basescan.org/api?module=account&action=tokennfttx&contractaddress=${contract}&address=${wallet}&page=1&offset=10000&startblock=0&sort=desc&apikey=${basescanApiKey}`).then(res => res.data.result.filter(item => parseInt(item.timeStamp) >= timestamp)),
            axios.get(`https://api.basescan.org/api?module=account&action=tokentx&address=${wallet}&page=1&offset=10000&startblock=0&sort=desc&apikey=${basescanApiKey}`).then(res => res.data.result.filter(item => parseInt(item.timeStamp) >= timestamp)),
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


        // // On récupère le tableau des approvals
        // const [approvals] = await Promise.all([approvalsCALL]);
        // for (const tx of approvals) {

        //     if (!allTxs.map(obj => obj.hash).includes((tx.transactionHash).toLowerCase())) {
        //         // On vérifie qu'on a pas déjà compter l'approval dans un buy & approve par exemple

        //         const normalLKP = await normalTxs.find(obj => obj.hash == (tx.transactionHash).toLowerCase());

        //         if (normalLKP) {

        //             const fees = parseFloat(((normalLKP.gasPrice) * (normalLKP.gasUsed))) / 10 ** 18
        //             data.sellGas += fees
        //             data.approval++

        //             // On push dans le tableau de hash
        //             allTxs.push({
        //                 hash: tx.transactionHash,
        //                 direction: "approval"
        //             })


        //         }
        //     }
        // }


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
            mintValue: parseFloat(data.mintValue).toFixed(3) + "Ξ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.mintValue * ethPrice).toFixed(0)) + ")",
            mintGas: parseFloat(data.mintGas).toFixed(3) + "Ξ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.mintGas * ethPrice).toFixed(0)) + ")",
            mintTotal: parseFloat(data.mintTotal).toFixed(3) + "Ξ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.mintTotal * ethPrice).toFixed(0)) + ")",
            buyValue: parseFloat(data.buyValue).toFixed(3) + "Ξ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.buyValue * ethPrice).toFixed(0)) + ")",
            buyGas: parseFloat(data.buyGas).toFixed(3) + "Ξ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.buyGas * ethPrice).toFixed(0)) + ")",
            buyTotal: parseFloat(data.buyTotal).toFixed(3) + "Ξ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.buyTotal * ethPrice).toFixed(0)) + ")",
            sellValue: parseFloat(data.sellValue).toFixed(3) + "Ξ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.sellValue * ethPrice).toFixed(0)) + ")",
            sellGas: parseFloat(data.sellGas).toFixed(3) + "Ξ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.sellGas * ethPrice).toFixed(0)) + ")",
            sellTotal: parseFloat(data.sellTotal).toFixed(3) + "Ξ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.sellTotal * ethPrice).toFixed(0)) + ")",
            mint: new Intl.NumberFormat('en-US').format(parseFloat(data.mint).toFixed(0)),
            buy: new Intl.NumberFormat('en-US').format(parseFloat(data.buy).toFixed(0)),
            airdrop: new Intl.NumberFormat('en-US').format(parseFloat(data.airdrop).toFixed(0)),
            sell: new Intl.NumberFormat('en-US').format(parseFloat(data.sell).toFixed(0)),
            held: new Intl.NumberFormat('en-US').format(parseFloat(data.held).toFixed(0)),
            txs: new Intl.NumberFormat('en-US').format(parseFloat(data.trade).toFixed(0)),
            avgMint: parseFloat(data.avgMint).toFixed(3) + "Ξ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgMint * ethPrice).toFixed(0)) + ")",
            avgBuy: parseFloat(data.avgBuy).toFixed(3) + "Ξ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgBuy * ethPrice).toFixed(0)) + ")",
            avgTotal: parseFloat(data.avgTotal).toFixed(3) + "Ξ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgTotal * ethPrice).toFixed(0)) + ")",
            avgSold: parseFloat(data.avgSold).toFixed(3) + "Ξ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgSold * ethPrice).toFixed(0)) + ")",
            avgHeld: parseFloat(data.avgHeld).toFixed(3) + "Ξ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgHeld * ethPrice).toFixed(0)) + ")",
            avgGas: parseFloat(data.avgGas).toFixed(3) + "Ξ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgGas * ethPrice).toFixed(0)) + ")",
            realisedPNL: parseFloat(data.realisedPNL).toFixed(3) + "Ξ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.realisedPNL * ethPrice).toFixed(0)) + ")",
            potentialPNL: parseFloat(data.potentialPNL).toFixed(3) + "Ξ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.potentialPNL * ethPrice).toFixed(0)) + ")",
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


async function baseNftProfitMulitWallet(cont, wall, time) {

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
        const wallets = wall.map(i => i.toLowerCase())
        const timestamp = getTimestamp(time)


        // On lance les calls en synchrone
        // Ils seront résolu plus bas pour gagner du temps
        const ethPrice = getEthPrice()
        const collectionCALL = getBaseCollection([contract])
        // const approvalsCALL = getApprovalForAll(wallet, contract)

        const allTxs = []

        for (const wallet of wallets) {

            // On limite le call 2 (normal txn) à 3000 objet du au limitation
            const [internalTxs, normalTxs, nftTxs, tokenGlobalTxs] = await Promise.all([
                axios.get(`https://api.basescan.org/api?module=account&action=txlistinternal&address=${wallet}&startblock=0&page=1&offset=10000&sort=asc&apikey=${basescanApiKey}`).then(res => res.data.result.filter(item => parseInt(item.timeStamp) >= timestamp)),
                axios.get(`https://api.basescan.org/api?module=account&action=txlist&address=${wallet}&startblock=0&page=1&offset=3000&sort=asc&apikey=${basescanApiKey}`).then(res => res.data.result.filter(item => parseInt(item.timeStamp) >= timestamp)),
                axios.get(`https://api.basescan.org/api?module=account&action=tokennfttx&contractaddress=${contract}&address=${wallet}&page=1&offset=10000&startblock=0&sort=desc&apikey=${basescanApiKey}`).then(res => res.data.result.filter(item => parseInt(item.timeStamp) >= timestamp)),
                axios.get(`https://api.basescan.org/api?module=account&action=tokentx&address=${wallet}&page=1&offset=10000&startblock=0&sort=desc&apikey=${basescanApiKey}`).then(res => res.data.result.filter(item => parseInt(item.timeStamp) >= timestamp)),
            ]);
            const tokenTxs = tokenGlobalTxs.filter(item => pools.includes(item.contractAddress.toLowerCase()))

            // On intialise le tableau avec les hash
            // D'abord celui avec tous les hashs
            // Puis celui avec les hash des contreparties, pour ne pas qu'il soit compter deux fois
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

            await addTimeout(1)
        }

        // // On récupère le tableau des approvals
        // const [approvals] = await Promise.all([approvalsCALL]);
        // for (const tx of approvals) {

        //     if (!allTxs.map(obj => obj.hash).includes((tx.transactionHash).toLowerCase())) {
        //         // On vérifie qu'on a pas déjà compter l'approval dans un buy & approve par exemple

        //         const normalLKP = await normalTxs.find(obj => obj.hash == (tx.transactionHash).toLowerCase());

        //         if (normalLKP) {

        //             const fees = parseFloat(((normalLKP.gasPrice) * (normalLKP.gasUsed))) / 10 ** 18
        //             data.sellGas += fees
        //             data.approval++

        //             // On push dans le tableau de hash
        //             allTxs.push({
        //                 hash: tx.transactionHash,
        //                 direction: "approval"
        //             })


        //         }
        //     }
        // }


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
            mintValue: parseFloat(data.mintValue).toFixed(3) + "Ξ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.mintValue * ethPrice).toFixed(0)) + ")",
            mintGas: parseFloat(data.mintGas).toFixed(3) + "Ξ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.mintGas * ethPrice).toFixed(0)) + ")",
            mintTotal: parseFloat(data.mintTotal).toFixed(3) + "Ξ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.mintTotal * ethPrice).toFixed(0)) + ")",
            buyValue: parseFloat(data.buyValue).toFixed(3) + "Ξ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.buyValue * ethPrice).toFixed(0)) + ")",
            buyGas: parseFloat(data.buyGas).toFixed(3) + "Ξ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.buyGas * ethPrice).toFixed(0)) + ")",
            buyTotal: parseFloat(data.buyTotal).toFixed(3) + "Ξ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.buyTotal * ethPrice).toFixed(0)) + ")",
            sellValue: parseFloat(data.sellValue).toFixed(3) + "Ξ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.sellValue * ethPrice).toFixed(0)) + ")",
            sellGas: parseFloat(data.sellGas).toFixed(3) + "Ξ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.sellGas * ethPrice).toFixed(0)) + ")",
            sellTotal: parseFloat(data.sellTotal).toFixed(3) + "Ξ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.sellTotal * ethPrice).toFixed(0)) + ")",
            mint: new Intl.NumberFormat('en-US').format(parseFloat(data.mint).toFixed(0)),
            buy: new Intl.NumberFormat('en-US').format(parseFloat(data.buy).toFixed(0)),
            airdrop: new Intl.NumberFormat('en-US').format(parseFloat(data.airdrop).toFixed(0)),
            sell: new Intl.NumberFormat('en-US').format(parseFloat(data.sell).toFixed(0)),
            held: new Intl.NumberFormat('en-US').format(parseFloat(data.held).toFixed(0)),
            txs: new Intl.NumberFormat('en-US').format(parseFloat(data.trade).toFixed(0)),
            avgMint: parseFloat(data.avgMint).toFixed(3) + "Ξ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgMint * ethPrice).toFixed(0)) + ")",
            avgBuy: parseFloat(data.avgBuy).toFixed(3) + "Ξ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgBuy * ethPrice).toFixed(0)) + ")",
            avgTotal: parseFloat(data.avgTotal).toFixed(3) + "Ξ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgTotal * ethPrice).toFixed(0)) + ")",
            avgSold: parseFloat(data.avgSold).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgSold * ethPrice).toFixed(0)) + ")",
            avgHeld: parseFloat(data.avgHeld).toFixed(3) + "Ξ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgHeld * ethPrice).toFixed(0)) + ")",
            avgGas: parseFloat(data.avgGas).toFixed(3) + "Ξ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgGas * ethPrice).toFixed(0)) + ")",
            realisedPNL: parseFloat(data.realisedPNL).toFixed(3) + "Ξ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.realisedPNL * ethPrice).toFixed(0)) + ")",
            potentialPNL: parseFloat(data.potentialPNL).toFixed(3) + "Ξ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.potentialPNL * ethPrice).toFixed(0)) + ")",
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



module.exports = {
    baseNftProfitSingle,
    baseNftProfitMulitWallet,
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