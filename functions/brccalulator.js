const { magiceden } = require("../config/web3config")
//3892fec1-8293-4509-bae5-e438936df4a8
//const magiceden = { 'Authorization': `Bearer 4c035019-0512-488e-804a-2bc0fa9a44f6` };
//const magicedenRunes = { 'Authorization': `Bearer 3892fec1-8293-4509-bae5-e438936df4a8` };
const unisate = { 'Authorization': 'Bearer 58ee790459d886e2a178ef40b51a4b981ae6faeb289210117ae21b993aeaabc3' }
const axios = require("axios")
const decimals = 8

const { getRuneMetrics, getRuneActivityByWallet, getTransaction, getRuneBalance, satsToBtc, isHiddenRunesBuying, isHiddenRunesSplit } = require("./btc-utils")
const { getBtcPrice } = require('../config/web3data.js')
const addTimeout = require("./addtimeout")
const formatCoinValueSign = require("./formatNumberEmbed")



/// BRC20

async function brcProfit(slug, wallet, time) {

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


    const token = await axios.get(`
    https://api-mainnet.magiceden.dev/v2/ord/brc20/tokens/ordi`, { headers: magiceden });
    jjj
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
                const receivers = [...new Set(txn.data.vout.map(item => item.scriptpubkey_address.toLowerCase()))].length;

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
                const receivers = [...new Set(txn.data.vout.map(item => item.scriptpubkey_address.toLowerCase()))].length;

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
    if (data.held) { data.avgHeld = data.heldValue / data.held }

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
        mintValue: parseFloat(data.mintValue).toFixed(4) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.mintValue * btcPrice).toFixed(0)) + ")",
        mintGas: parseFloat(data.mintGas).toFixed(4) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.mintGas * btcPrice).toFixed(0)) + ")",
        mintTotal: parseFloat(data.mintTotal).toFixed(4) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.mintTotal * btcPrice).toFixed(0)) + ")",
        buyValue: parseFloat(data.buyValue).toFixed(4) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.buyValue * btcPrice).toFixed(0)) + ")",
        buyGas: parseFloat(data.buyGas).toFixed(4) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.buyGas * btcPrice).toFixed(0)) + ")",
        buyTotal: parseFloat(data.buyTotal).toFixed(4) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.buyTotal * btcPrice).toFixed(0)) + ")",
        sellValue: parseFloat(data.sellValue).toFixed(4) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.sellValue * btcPrice).toFixed(0)) + ")",
        sellGas: parseFloat(data.sellGas).toFixed(4) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.sellGas * btcPrice).toFixed(0)) + ")",
        sellTotal: parseFloat(data.sellTotal).toFixed(4) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.sellTotal * btcPrice).toFixed(0)) + ")",
        mint: new Intl.NumberFormat('en-US').format(parseFloat(data.mint).toFixed(0)),
        buy: new Intl.NumberFormat('en-US').format(parseFloat(data.buy).toFixed(0)),
        sell: new Intl.NumberFormat('en-US').format(parseFloat(data.sell).toFixed(0)),
        airdrop: new Intl.NumberFormat('en-US').format(parseFloat(data.transfer).toFixed(0)),
        held: new Intl.NumberFormat('en-US').format(parseFloat(data.held).toFixed(0)),
        txs: new Intl.NumberFormat('en-US').format(parseFloat(data.trade).toFixed(0)),
        avgMint: parseFloat(data.avgMint).toFixed(4) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgMint * btcPrice).toFixed(0)) + ")",
        avgBuy: parseFloat(data.avgBuy).toFixed(4) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgBuy * btcPrice).toFixed(0)) + ")",
        avgTotal: parseFloat(data.avgTotal).toFixed(4) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgTotal * btcPrice).toFixed(0)) + ")",
        avgSold: parseFloat(data.avgSold).toFixed(4) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgSold * btcPrice).toFixed(0)) + ")",
        avgHeld: parseFloat(data.avgHeld).toFixed(4) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgHeld * btcPrice).toFixed(0)) + ")",
        avgGas: parseFloat(data.avgGas).toFixed(4) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.avgGas * btcPrice).toFixed(0)) + ")",
        realisedPNL: parseFloat(data.realisedPNL).toFixed(4) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.realisedPNL * btcPrice).toFixed(0)) + ")",
        potentialPNL: parseFloat(data.potentialPNL).toFixed(4) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(data.potentialPNL * btcPrice).toFixed(0)) + ")",
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
        const slug = cont
        const wallet = wall.toLowerCase()
        const timestamp = getTimestamp(time)

        // On lance tous les calls du début (résolu plus bas)
        const btcPrice = getBtcPrice()
        const tokenPRM = getRuneMetrics(slug, btcPrice)
        const heldPRM = getRuneBalance(slug, wallet)

        // On récupère les metrics du token et le nombre de token held. On peut opti en récupérant le nombre 
        // de token held plus tard et même peut être les metrics du token
        ////\\\\
        // const [token, held2] = await Promise.all([
        //     getRuneMetrics(slug, btcPrice),
        //     getRuneBalance(slug, wallet)
        // ]);
        ////\\\\

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
                // && item.txId === "667aae821390b9a9ec6f823346a0f1d240ab7fb68d63a1ffadb21e3f3976c6f1"
                // On fait une arborécence en identifiant le type de transaction
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
                            // C'est un airdrop ou un transfer car il n'y a pas de split associé
                            // mais ça peut ausis être un mint donc on vérifie.
                            const txn = await getTransaction(item.txId)
                            //   const inflow = txn.vin // On utilise le flux pour déterminer si c'est un mint ou un airdrop
                            const outflow = txn.vout // On utilise le flux pour déterminer si c'est un mint ou un airdrop

                            // On surveille les flow out et in et on regroupe les receiver et 
                            // senders en deux liste de wallet uniques
                            //   const valueIn = satsToBtc(inflow.filter(i => i.scriptpubkey_address === wallet).reduce((total, transaction) => total + transaction.value, 0));
                            //   const senders = [...new Set(inflow.filter(i => i.scriptpubkey_address).map(i => i.scriptpubkey_address))].length
                            //   const valueOut = satsToBtc(outflow.filter(i => i.scriptpubkey_address === wallet).reduce((total, transaction) => total + transaction.value, 0));
                            const receivers = [...new Set(outflow.filter(i => i.scriptpubkey_address).map(i => i.scriptpubkey_address))].length


                            if (receivers === 1) {
                                data.mint++
                                //data.buyValue += value
                                data.buyAmount = item.amount
                                data.buyGas += satsToBtc(txn.fee)
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
