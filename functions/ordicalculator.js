const { magiceden } = require("../config/web3config")
const axios = require("axios")
const decimals = 8
const addTimeout = require("./addtimeout")


async function ordiProfit(slug, wallet, time) {

    // On définit les data de base
    // On incrémentera ce tableau au fur et à mesure
    // et elle se transformeront en raw data.
    const data = {
        mint: 0,
        buy: 0,
        total: 0,
        sell: 0,
        held: 0,
        transfer: 0,
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

    // On définit l'interval de temps formatter
    // par rapport au temps défini dans les arguments (string)
    const timestamp = getTimestamp(time)

    // On récupère le prix du BTC, les stats de la collection et les infos (liens etc...)
    // On les récupèrera plus tard.
    const btcPricePRM = getBtcPrice()
    const collPRM = axios.get(`https://api-mainnet.magiceden.dev/v2/ord/btc/collections/${slug}`, { headers: magiceden });
    const statPRM = axios.get(`https://api-mainnet.magiceden.dev/v2/ord/btc/stat?collectionSymbol=${slug}`, { headers: magiceden });

    // On récupère les tokens hold par l'utilisateur
    const ownRES = await axios.get(`https://api-mainnet.magiceden.dev/v2/ord/btc/tokens?collectionSymbol=${slug}&ownerAddress=${wallet}&showAll=true&sortBy=priceAsc`, { headers: magiceden });
    const ownANW = ownRES.data.tokens;
    const heldIDs = ownANW.map(i => i.id)


    // On commence par calculer tous les achats des tokens qui sont
    // hold par le wallet. 
    for (const token of heldIDs) {

        // On regarde les buy classiques, c'est à dire les buy qui sont fait sur 
        // la marketplace, indiqué par 'Buying Broadcast'.
        const tknHistoryCALL = await axios.get(`https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=buying_broadcasted&tokenId=${token}`, { headers: magiceden });
        const tknHistoryANW = await tknHistoryCALL.data.activities;
        const tknHistoryRES = tknHistoryANW.filter(activity => activity.oldOwner.toLowerCase() !== wallet.toLowerCase() && activity.newOwner.toLowerCase() == wallet.toLowerCase() && ((Date.parse(activity.createdAt)) / 1000) >= timestamp);

        // On trouve la txn, ce qui veut dire qu'il y'a un achat direct
        // fait sur la marketplace.
        if (tknHistoryRES.length > 0) {
            // On récupère les infos de la transactions
            // puis on les ajoute à l'objet data.
            const txn = await axios.get(`https://mempool.space/api/tx/${tknHistoryRES[0].txId}`)
            data.buyValue += tknHistoryRES[0].listedPrice / 10 ** decimals
            data.buyGas += txn.data.fee / 10 ** decimals
            data.buy++
            data.trade++

        } else {
            // Il n'y a pas de transaction, donc il faut rechercher dans les mints et dans les create ou autres.
            // On va rechercher dans les différentes options une par une.

            // On vérifie les liens de création de NFT, l'une des deux méthodes Ordinals.
            // On fait le call pour commencer.
            const createCALL = await axios.get(`https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=create&tokenId=${token}`, { headers: magiceden });
            const createANW = createCALL.data.activities;
            const createRES = createANW.filter(activity => activity.newOwner.toLowerCase() == wallet.toLowerCase() && ((Date.parse(activity.createdAt)) / 1000) >= timestamp);

            if (createRES.length > 0) {
                // C'est bien une création donc on récupère la transaction
                // comme ça. On vérifie quad même que c'est un airdrop.
                const txn = await axios.get(`https://mempool.space/api/tx/${createRES[0].txId}`)

                // On vérifie que c'est pas un airdrop en regardant le nombre de personne qui ont reçu des tokens dans
                // cette transaction. Si c'est plus que 1, alors on considère que c'est un airdrop. Possible de regarder combien
                // notre user a payé en particulier.
                const receivers = txn.data.vout.length
                if (receivers === 1) {
                    // Ici il y'a un receiver, on considère que c'est un mint.
                    data.mintValue += createRES[0].txValue / 10 ** decimals
                    data.mintGas += txn.data.fee / 10 ** decimals
                    data.mint++
                    data.trade++
                } else {
                    // A l'inverse, ici il y'a plusieurs receiver, on considère que c'est un airdrop.
                    data.transfer++
                }

            } else {
                // Ce n'est ni une création de NFT, ni un buy classique. Donc cela peut être un mint ou un transfer
                // et on va la récuperer en vérifiant d'abord si c'est un mint. 

                // On vérifie les mints de NFT, l'une des deux méthodes Ordinals.
                // On fait le call pour commencer.
                const mintCALL = await axios.get(`https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=mint_broadcasted&tokenId=${token}`, { headers: magiceden });
                const mintANW = mintCALL.data.activities;
                const mintRES = mintANW.filter(activity => activity.newOwner.toLowerCase() == wallet.toLowerCase() && ((Date.parse(activity.createdAt)) / 1000) >= timestamp);

                if (mintRES.length > 0) {
                    // C'est bien un mint, donc on ajoute les informations aux mints.
                    // On met tout ça dans l'objet data.
                    const txn = await axios.get(`https://mempool.space/api/tx/${mintRES[0].txId}`)
                    console.log("Mint")
                    console.log(txn.data)
                    data.mintValue += mintRES[0].listedPrice / 10 ** decimals
                    data.mintGas += txn.data.fee / 10 ** decimals
                    data.mint++
                    data.trade++

                } else {
                    // C'est un transfert ou un airdrop donc on ne peut pas les différencier, mais
                    // on peut tout de même les ajouter à la liste des transferts
                    data.transfer++
                    data.trade++
                }
            }

        }
    }


    // On passe à la seconde étape qui consiste à récupèrer l'activité du wallet.
    // Cela nous permettra d'incrémenter les valeurs du tableau facilement en récupérant le lien de la txn, puis le prix d'achat, et le prix de sell.
    const activityCALL = await axios.get(`https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=buying_broadcasted&ownerAddress=${wallet}&collectionSymbol=${slug}`, { headers: magiceden });
    const activityANW = activityCALL.data.activities;
    const activityRES = activityANW.filter(activity => activity.oldOwner.toLowerCase() == wallet.toLowerCase() && activity.newOwner.toLowerCase() !== wallet.toLowerCase() && ((Date.parse(activity.createdAt)) / 1000) >= timestamp);

    //On calcul le prix et méthode d'achat des token sold
    for (const token of activityRES) {

        // On calcule le prix de vente du token et on ajoute cela à la DB, ensuite on calculera
        // le prix d'achat du token et ça nous donnera le PnL sur le token.
        // const txn = await axios.get(`https://mempool.space/api/tx/${token.txId}`) // Pareil qu'en dessous
        // data.sellGas += txn.data.fee / 10 ** decimals // Ici on enlève car les gas sont payés par le user
        data.sellValue += token.listedPrice / 10 ** decimals
        data.sell++
        data.trade++


        //Maintenant, on calcul son prix d'achat en retrouvant la transaction qui l'a acheté grâce
        // à l'API Magic Eden, en surveillant les "Buying Broadcats"
        //Buy classic
        const buyCALL = await axios.get(`https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=buying_broadcasted&tokenId=${token.tokenId}`, { headers: magiceden });
        const buyANW = await buyCALL.data.activities;
        const buyRES = buyANW.filter(activity => activity.oldOwner.toLowerCase() !== wallet.toLowerCase() && activity.newOwner.toLowerCase() == wallet.toLowerCase() && ((Date.parse(activity.createdAt)) / 1000) >= timestamp);

        // On trouve la txn, ce qui veut dire qu'il y'a un achat direct
        // fait sur la marketplace.
        if (buyRES.length > 0) {
            // On récupère les infos de la transactions
            // puis on les ajoute à l'objet data.
            const txn = await axios.get("https://mempool.space/api/tx/" + buyRES[0].txId)
            data.buyValue += buyRES[0].listedPrice / 10 ** decimals
            data.buyGas += txn.data.fee / 10 ** decimals
            data.buy++
            data.trade++

        } else {
            // Il n'y a pas de transaction, donc il faut rechercher dans les mints et dans les create ou autres.
            // On va rechercher dans les différentes options une par une.

            // On vérifie les liens de création de NFT, l'une des deux méthodes Ordinals.
            // On fait le call pour commencer.
            const createCALL = await axios.get(`https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=create&tokenId=${token.tokenId}`, { headers: magiceden });
            const createANW = createCALL.data.activities;
            const createRES = createANW.filter(activity => activity.newOwner.toLowerCase() == wallet.toLowerCase() && ((Date.parse(activity.createdAt)) / 1000) >= timestamp);

            if (createRES.length > 0) {
                // C'est bien une création donc on récupère la transaction
                // comme ça. On vérifie quad même que c'est un airdrop.
                const txn = await axios.get(`https://mempool.space/api/tx/${createRES[0].txId}`)

                // On vérifie que c'est pas un airdrop en regardant le nombre de personne qui ont reçu des tokens dans
                // cette transaction. Si c'est plus que 1, alors on considère que c'est un airdrop. Possible de regarder combien
                // notre user a payé en particulier.
                const receivers = txn.data.vout.length

                if (receivers === 1) {
                    // Ici il y'a un receiver, on considère que c'est un mint.
                    data.mintValue += createRES[0].txValue / 10 ** decimals
                    data.mintGas += txn.data.fee / 10 ** decimals
                    data.mint++
                    data.trade++
                } else {
                    // A l'inverse, ici il y'a plusieurs receiver, on considère que c'est un airdrop.
                    data.transfer++
                }

            } else {
                // Ce n'est ni une création de NFT, ni un buy classique. Donc cela peut être un mint ou un transfer
                // et on va la récuperer en vérifiant d'abord si c'est un mint. 

                // On vérifie les mints de NFT, l'une des deux méthodes Ordinals.
                // On fait le call pour commencer.
                const mintCALL = await axios.get(`https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=mint_broadcasted&tokenId=${token.tokenId}`, { headers: magiceden });
                const mintANW = mintCALL.data.activities;
                const mintRES = mintANW.filter(activity => activity.newOwner.toLowerCase() == wallet.toLowerCase() && ((Date.parse(activity.createdAt)) / 1000) >= timestamp);

                if (mintRES.length > 0) {
                    // C'est bien un mint, donc on ajoute les informations aux mints.
                    // On met tout ça dans l'objet data.
                    const txn = await axios.get(`https://mempool.space/api/tx/${mintRES[0].txId}`)
                    data.mintValue += mintRES[0].listedPrice / 10 ** decimals
                    data.mintGas += txn.data.fee / 10 ** decimals
                    data.mint++
                    data.trade++

                } else {
                    // C'est un transfert ou un airdrop donc on ne peut pas les différencier, mais
                    // on peut tout de même les ajouter à la liste des transferts
                    data.transfer++
                    data.trade++
                }
            }
        }
    }


    // On récupère les datas de la collection, peut être enlever si on trouve un autre moyen de le faire
    // notamment en utilisant collection stats qui n'est utilisé que pour le floor price actuellement.
    const [btcPrice, collRES, statRES] = await Promise.all([btcPricePRM, collPRM, statPRM]);
    const name = collRES.data.name
    const icon = collRES.data.imageURI
    const twitter = collRES.data.twitterLink
    const discord = collRES.data.discordLink
    const website = collRES.data.websiteLink
    // Ici on récupère le floor, troisième valeur
    const floor = statRES.data.floorPrice / 10 ** decimals


    // On commence par additioner les valeurs de base pour les calculs
    data.mintTotal = data.mintValue + data.mintGas
    data.buyTotal = data.buyValue + data.buyGas
    data.sellTotal = data.sellValue - data.sellGas
    data.totalGas = data.buyGas + data.sellGas + data.mintGas
    data.totalValue = data.buyTotal + data.mintTotal

    // Puis les valeurs en plus
    data.total = data.buy + data.mint
    data.held = heldIDs.length
    data.heldValue = floor * data.held
    data.avgHeld = data.heldValue / data.held

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
        mintValue: parseFloat(data.mintValue).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.mintValue * btcPrice).toFixed(0)) + ")",
        mintGas: parseFloat(data.mintGas).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.mintGas * btcPrice).toFixed(0)) + ")",
        mintTotal: parseFloat(data.mintTotal).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.mintTotal * btcPrice).toFixed(0)) + ")",
        buyValue: parseFloat(data.buyValue).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.buyValue * btcPrice).toFixed(0)) + ")",
        buyGas: parseFloat(data.buyGas).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.buyGas * btcPrice).toFixed(0)) + ")",
        buyTotal: parseFloat(data.buyTotal).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.buyTotal * btcPrice).toFixed(0)) + ")",
        sellValue: parseFloat(data.sellValue).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.sellValue * btcPrice).toFixed(0)) + ")",
        sellGas: parseFloat(data.sellGas).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.sellGas * btcPrice).toFixed(0)) + ")",
        sellTotal: parseFloat(data.sellTotal).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.sellTotal * btcPrice).toFixed(0)) + ")",
        mint: new Intl.NumberFormat('en-US').format(parseFloat(data.mint).toFixed(0)),
        buy: new Intl.NumberFormat('en-US').format(parseFloat(data.buy).toFixed(0)),
        sell: new Intl.NumberFormat('en-US').format(parseFloat(data.sell).toFixed(0)),
        airdrop: new Intl.NumberFormat('en-US').format(parseFloat(data.transfer).toFixed(0)),
        held: new Intl.NumberFormat('en-US').format(parseFloat(data.held).toFixed(0)),
        txs: new Intl.NumberFormat('en-US').format(parseFloat(data.trade).toFixed(0)),
        avgMint: parseFloat(data.avgMint).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgMint * btcPrice).toFixed(0)) + ")",
        avgBuy: parseFloat(data.avgBuy).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgBuy * btcPrice).toFixed(0)) + ")",
        avgTotal: parseFloat(data.avgTotal).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgTotal * btcPrice).toFixed(0)) + ")",
        avgSold: parseFloat(data.avgSold).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgSold * btcPrice).toFixed(0)) + ")",
        avgHeld: parseFloat(data.avgHeld).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgHeld * btcPrice).toFixed(0)) + ")",
        avgGas: parseFloat(data.avgGas).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgGas * btcPrice).toFixed(0)) + ")",
        realisedPNL: parseFloat(data.realisedPNL).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.realisedPNL * btcPrice).toFixed(0)) + ")",
        potentialPNL: parseFloat(data.potentialPNL).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.potentialPNL * btcPrice).toFixed(0)) + ")",
        potentialROI: prettierROI,
    }

    const result = {
        collection: {
            name: name,
            slug: slug,
            icon: icon,
            floor: floor,
            twitter: twitter,
            discord: discord,
            website: website,
            btcPrice: btcPrice,
        },
        raw: data,
        prettier: prettier
    }

    return result
}

async function ordiProfitMultiple(slug, wallets, time) {

    // On définit les data de base
    // On incrémentera ce tableau au fur et à mesure
    // et elle se transformeront en raw data.
    const data = {
        mint: 0,
        buy: 0,
        total: 0,
        sell: 0,
        held: 0,
        transfer: 0,
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

    // On définit l'interval de temps formatter
    // par rapport au temps défini dans les arguments (string)
    const timestamp = getTimestamp(time)

    // On récupère le prix du BTC, les stats de la collection et les infos (liens etc...)
    // On les récupèrera plus tard.
    const btcPricePRM = getBtcPrice()
    const collPRM = axios.get(`https://api-mainnet.magiceden.dev/v2/ord/btc/collections/${slug}`, { headers: magiceden });
    const statPRM = axios.get(`https://api-mainnet.magiceden.dev/v2/ord/btc/stat?collectionSymbol=${slug}`, { headers: magiceden });


    // On fait une boucle avec tous les wallets du user puis
    // dedans on calcul les différentes data à chaque fois
    for (const wallet of wallets) {

        // On récupère les tokens hold par l'utilisateur
        const ownRES = await axios.get(`https://api-mainnet.magiceden.dev/v2/ord/btc/tokens?collectionSymbol=${slug}&ownerAddress=${wallet}&showAll=true&sortBy=priceAsc`, { headers: magiceden });
        const ownANW = ownRES.data.tokens;
        const heldIDs = ownANW.map(i => i.id)
        data.held += heldIDs.length



        // On commence par calculer tous les achats des tokens qui sont
        // hold par le wallet. 
        for (const token of heldIDs) {

            // On regarde les buy classiques, c'est à dire les buy qui sont fait sur 
            // la marketplace, indiqué par 'Buying Broadcast'.
            const tknHistoryCALL = await axios.get(`https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=buying_broadcasted&tokenId=${token}`, { headers: magiceden });
            const tknHistoryANW = await tknHistoryCALL.data.activities;
            const tknHistoryRES = tknHistoryANW.filter(activity => activity.oldOwner.toLowerCase() !== wallet.toLowerCase() && activity.newOwner.toLowerCase() == wallet.toLowerCase() && ((Date.parse(activity.createdAt)) / 1000) >= timestamp);

            // On trouve la txn, ce qui veut dire qu'il y'a un achat direct
            // fait sur la marketplace.
            if (tknHistoryRES.length > 0) {
                // On récupère les infos de la transactions
                // puis on les ajoute à l'objet data.
                const txn = await axios.get(`https://mempool.space/api/tx/${tknHistoryRES[0].txId}`)
                data.buyValue += tknHistoryRES[0].listedPrice / 10 ** decimals
                data.buyGas += txn.data.fee / 10 ** decimals
                data.buy++
                data.trade++

            } else {
                // Il n'y a pas de transaction, donc il faut rechercher dans les mints et dans les create ou autres.
                // On va rechercher dans les différentes options une par une.

                // On vérifie les liens de création de NFT, l'une des deux méthodes Ordinals.
                // On fait le call pour commencer.
                const createCALL = await axios.get(`https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=create&tokenId=${token}`, { headers: magiceden });
                const createANW = createCALL.data.activities;
                const createRES = createANW.filter(activity => activity.newOwner.toLowerCase() == wallet.toLowerCase() && ((Date.parse(activity.createdAt)) / 1000) >= timestamp);

                if (createRES.length > 0) {
                    // C'est bien une création donc on récupère la transaction
                    // comme ça. On vérifie quad même que c'est un airdrop.
                    const txn = await axios.get(`https://mempool.space/api/tx/${createRES[0].txId}`)

                    // On vérifie que c'est pas un airdrop en regardant le nombre de personne qui ont reçu des tokens dans
                    // cette transaction. Si c'est plus que 1, alors on considère que c'est un airdrop. Possible de regarder combien
                    // notre user a payé en particulier.
                    const receivers = txn.data.vout.length
                    if (receivers === 1) {
                        // Ici il y'a un receiver, on considère que c'est un mint.
                        data.mintValue += createRES[0].txValue / 10 ** decimals
                        data.mintGas += txn.data.fee / 10 ** decimals
                        data.mint++
                        data.trade++
                    } else {
                        // A l'inverse, ici il y'a plusieurs receiver, on considère que c'est un airdrop.
                        data.transfer++
                    }

                } else {
                    // Ce n'est ni une création de NFT, ni un buy classique. Donc cela peut être un mint ou un transfer
                    // et on va la récuperer en vérifiant d'abord si c'est un mint. 

                    // On vérifie les mints de NFT, l'une des deux méthodes Ordinals.
                    // On fait le call pour commencer.
                    const mintCALL = await axios.get(`https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=mint_broadcasted&tokenId=${token}`, { headers: magiceden });
                    const mintANW = mintCALL.data.activities;
                    const mintRES = mintANW.filter(activity => activity.newOwner.toLowerCase() == wallet.toLowerCase() && ((Date.parse(activity.createdAt)) / 1000) >= timestamp);

                    if (mintRES.length > 0) {
                        // C'est bien un mint, donc on ajoute les informations aux mints.
                        // On met tout ça dans l'objet data.
                        const txn = await axios.get(`https://mempool.space/api/tx/${mintRES[0].txId}`)
                        data.mintValue += mintRES[0].listedPrice / 10 ** decimals
                        data.mintGas += txn.data.fee / 10 ** decimals
                        data.mint++
                        data.trade++

                    } else {
                        // C'est un transfert ou un airdrop donc on ne peut pas les différencier, mais
                        // on peut tout de même les ajouter à la liste des transferts
                        data.transfer++
                        data.trade++
                    }
                }

            }
        }

        // On passe à la seconde étape qui consiste à récupèrer l'activité du wallet.
        // Cela nous permettra d'incrémenter les valeurs du tableau facilement en récupérant le lien de la txn, puis le prix d'achat, et le prix de sell.
        const activityCALL = await axios.get(`https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=buying_broadcasted&ownerAddress=${wallet}&collectionSymbol=${slug}`, { headers: magiceden });
        const activityANW = activityCALL.data.activities;
        const activityRES = activityANW.filter(activity => activity.oldOwner.toLowerCase() == wallet.toLowerCase() && activity.newOwner.toLowerCase() !== wallet.toLowerCase() && ((Date.parse(activity.createdAt)) / 1000) >= timestamp);

        //On calcul le prix et méthode d'achat des token sold
        for (const token of activityRES) {

            // On calcule le prix de vente du token et on ajoute cela à la DB, ensuite on calculera
            // le prix d'achat du token et ça nous donnera le PnL sur le token.
            // const txn = await axios.get(`https://mempool.space/api/tx/${token.txId}`) // Pareil qu'en dessous
            // data.sellGas += txn.data.fee / 10 ** decimals // Ici on enlève car les gas sont payés par le user
            data.sellValue += token.listedPrice / 10 ** decimals
            data.sell++
            data.trade++


            //Maintenant, on calcul son prix d'achat en retrouvant la transaction qui l'a acheté grâce
            // à l'API Magic Eden, en surveillant les "Buying Broadcats"
            //Buy classic
            const buyCALL = await axios.get(`https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=buying_broadcasted&tokenId=${token.tokenId}`, { headers: magiceden });
            const buyANW = await buyCALL.data.activities;
            const buyRES = buyANW.filter(activity => activity.oldOwner.toLowerCase() !== wallet.toLowerCase() && activity.newOwner.toLowerCase() == wallet.toLowerCase() && ((Date.parse(activity.createdAt)) / 1000) >= timestamp);

            // On trouve la txn, ce qui veut dire qu'il y'a un achat direct
            // fait sur la marketplace.
            if (buyRES.length > 0) {
                // On récupère les infos de la transactions
                // puis on les ajoute à l'objet data.
                const txn = await axios.get("https://mempool.space/api/tx/" + buyRES[0].txId)
                data.buyValue += buyRES[0].listedPrice / 10 ** decimals
                data.buyGas += txn.data.fee / 10 ** decimals
                data.buy++
                data.trade++

            } else {
                // Il n'y a pas de transaction, donc il faut rechercher dans les mints et dans les create ou autres.
                // On va rechercher dans les différentes options une par une.

                // On vérifie les liens de création de NFT, l'une des deux méthodes Ordinals.
                // On fait le call pour commencer.
                const createCALL = await axios.get(`https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=create&tokenId=${token.tokenId}`, { headers: magiceden });
                const createANW = createCALL.data.activities;
                const createRES = createANW.filter(activity => activity.newOwner.toLowerCase() == wallet.toLowerCase() && ((Date.parse(activity.createdAt)) / 1000) >= timestamp);

                if (createRES.length > 0) {
                    // C'est bien une création donc on récupère la transaction
                    // comme ça. On vérifie quad même que c'est un airdrop.
                    const txn = await axios.get(`https://mempool.space/api/tx/${createRES[0].txId}`)

                    // On vérifie que c'est pas un airdrop en regardant le nombre de personne qui ont reçu des tokens dans
                    // cette transaction. Si c'est plus que 1, alors on considère que c'est un airdrop. Possible de regarder combien
                    // notre user a payé en particulier.
                    const receivers = txn.data.vout.length
                    if (receivers === 1) {
                        // Ici il y'a un receiver, on considère que c'est un mint.
                        data.mintValue += createRES[0].txValue / 10 ** decimals
                        data.mintGas += txn.data.fee / 10 ** decimals
                        data.mint++
                        data.trade++
                    } else {
                        // A l'inverse, ici il y'a plusieurs receiver, on considère que c'est un airdrop.
                        data.transfer++
                    }

                } else {
                    // Ce n'est ni une création de NFT, ni un buy classique. Donc cela peut être un mint ou un transfer
                    // et on va la récuperer en vérifiant d'abord si c'est un mint. 

                    // On vérifie les mints de NFT, l'une des deux méthodes Ordinals.
                    // On fait le call pour commencer.
                    const mintCALL = await axios.get(`https://api-mainnet.magiceden.dev/v2/ord/btc/activities?kind=mint_broadcasted&tokenId=${token.tokenId}`, { headers: magiceden });
                    const mintANW = mintCALL.data.activities;
                    const mintRES = mintANW.filter(activity => activity.newOwner.toLowerCase() == wallet.toLowerCase() && ((Date.parse(activity.createdAt)) / 1000) >= timestamp);

                    if (mintRES.length > 0) {
                        // C'est bien un mint, donc on ajoute les informations aux mints.
                        // On met tout ça dans l'objet data.
                        const txn = await axios.get(`https://mempool.space/api/tx/${mintRES[0].txId}`)
                        data.mintValue += mintRES[0].listedPrice / 10 ** decimals
                        data.mintGas += txn.data.fee / 10 ** decimals
                        data.mint++
                        data.trade++

                    } else {
                        // C'est un transfert ou un airdrop donc on ne peut pas les différencier, mais
                        // on peut tout de même les ajouter à la liste des transferts
                        data.transfer++
                        data.trade++
                    }
                }
            }
        }
    }


    // On récupère les datas de la collection, peut être enlever si on trouve un autre moyen de le faire
    // notamment en utilisant collection stats qui n'est utilisé que pour le floor price actuellement.
    const [btcPrice, collRES, statRES] = await Promise.all([btcPricePRM, collPRM, statPRM]);
    const name = collRES.data.name
    const icon = collRES.data.imageURI
    const twitter = collRES.data.twitterLink
    const discord = collRES.data.discordLink
    const website = collRES.data.websiteLink
    // Ici on récupère le floor, troisième valeur
    const floor = statRES.data.floorPrice / 10 ** decimals


    // On commence par additioner les valeurs de base pour les calculs
    data.mintTotal = data.mintValue + data.mintGas
    data.buyTotal = data.buyValue + data.buyGas
    data.sellTotal = data.sellValue - data.sellGas
    data.totalGas = data.buyGas + data.sellGas + data.mintGas
    data.totalValue = data.buyTotal + data.mintTotal

    // Puis les valeurs en plus
    data.total = data.buy + data.mint
    data.heldValue = floor * data.held
    data.avgHeld = data.heldValue / data.held

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
        mintValue: parseFloat(data.mintValue).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.mintValue * btcPrice).toFixed(0)) + ")",
        mintGas: parseFloat(data.mintGas).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.mintGas * btcPrice).toFixed(0)) + ")",
        mintTotal: parseFloat(data.mintTotal).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.mintTotal * btcPrice).toFixed(0)) + ")",
        buyValue: parseFloat(data.buyValue).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.buyValue * btcPrice).toFixed(0)) + ")",
        buyGas: parseFloat(data.buyGas).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.buyGas * btcPrice).toFixed(0)) + ")",
        buyTotal: parseFloat(data.buyTotal).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.buyTotal * btcPrice).toFixed(0)) + ")",
        sellValue: parseFloat(data.sellValue).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.sellValue * btcPrice).toFixed(0)) + ")",
        sellGas: parseFloat(data.sellGas).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.sellGas * btcPrice).toFixed(0)) + ")",
        sellTotal: parseFloat(data.sellTotal).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.sellTotal * btcPrice).toFixed(0)) + ")",
        mint: new Intl.NumberFormat('en-US').format(parseFloat(data.mint).toFixed(0)),
        buy: new Intl.NumberFormat('en-US').format(parseFloat(data.buy).toFixed(0)),
        sell: new Intl.NumberFormat('en-US').format(parseFloat(data.sell).toFixed(0)),
        airdrop: new Intl.NumberFormat('en-US').format(parseFloat(data.transfer).toFixed(0)),
        held: new Intl.NumberFormat('en-US').format(parseFloat(data.held).toFixed(0)),
        txs: new Intl.NumberFormat('en-US').format(parseFloat(data.trade).toFixed(0)),
        avgMint: parseFloat(data.avgMint).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgMint * btcPrice).toFixed(0)) + ")",
        avgBuy: parseFloat(data.avgBuy).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgBuy * btcPrice).toFixed(0)) + ")",
        avgTotal: parseFloat(data.avgTotal).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgTotal * btcPrice).toFixed(0)) + ")",
        avgSold: parseFloat(data.avgSold).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgSold * btcPrice).toFixed(0)) + ")",
        avgHeld: parseFloat(data.avgHeld).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgHeld * btcPrice).toFixed(0)) + ")",
        avgGas: parseFloat(data.avgGas).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgGas * btcPrice).toFixed(0)) + ")",
        realisedPNL: parseFloat(data.realisedPNL).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.realisedPNL * btcPrice).toFixed(0)) + ")",
        potentialPNL: parseFloat(data.potentialPNL).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.potentialPNL * btcPrice).toFixed(0)) + ")",
        potentialROI: prettierROI,
    }

    const result = {
        collection: {
            name: name,
            slug: slug,
            icon: icon,
            floor: floor,
            twitter: twitter,
            discord: discord,
            website: website,
        },
        raw: data,
        prettier: prettier
    }

    return result
}

async function getBtcPrice() {
    const call = await axios.get("https://blockchain.info/q/24hrprice")
    const result = call.data
    return result
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

module.exports = {
    ordiProfit,
    ordiProfitMultiple
}


