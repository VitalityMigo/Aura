const { magiceden, unisat } = require("../config/web3config")
const axios = require("axios")
const addTimeout = require("./addtimeout")
const colors = require('colors')

//const magiceden = { 'Authorization': `Bearer 4c035019-0512-488e-804a-2bc0fa9a44f6` };
// const magiceden = { 'Authorization': `Bearer 3892fec1-8293-4509-bae5-e438936df4a8` };
//const unisat = { 'Authorization': `Bearer 58ee790459d886e2a178ef40b51a4b981ae6faeb289210117ae21b993aeaabc3` };


async function getBtcPrice() {
    const call = await axios.get("https://blockchain.info/q/24hrprice")
    const result = call.data
    return result
}

async function getRuneMetrics(slug, btcPrice) {
    try {
        const call = await axios.get(`https://api-mainnet.magiceden.dev/v2/ord/btc/runes/market/${slug}/info`, { headers: magiceden });
        const result = call.data

        return {
            name: result.name,
            ticker: result.ticker,
            symbol: result.symbol,
            decimals: result.divisibility,
            supply: parseInt(result.totalSupply / (10 ** result.divisibility)),
            price: result.floorUnitPrice ? satsToBtc(parseFloat(result.floorUnitPrice.formatted)) : 0,
            marketcap: result.marketCap ? result.marketCap * btcPrice : 0,
            holders: result.holderCount,
            volume: result.volume,
            logo: result.imageURI,

        }
    } catch (error) {
        console.log(error.stack)
        return null
    }
}

async function getExtensiveRuneMetrics(slug) {
    try {
        const call = await axios.get(`https://api-mainnet.magiceden.dev/v2/ord/btc/runes/market/${slug}/info`, { headers: magiceden });
        const result = call.data
        return result
    } catch (error) {
        console.log(error.stack)
        return null
    }

}

async function getRuneTopCollection() {
    try {
        const result = await axios.get('https://open-api.unisat.io/v1/indexer/runes/info-list?limit=20', { headers: unisat });
        return result.data.data.detail
    } catch (error) {
        console.log(error.stack)
        return []
    }
}

async function searchRunesByName(slug) {
    try {
        const result = await axios.get(`https://open-api.unisat.io/v1/indexer/runes/info-list?rune=${slug.toUpperCase()}&limit=20`, { headers: unisat });
        return result.data.data.detail;
    } catch (error) {
        console.log(error.stack)
        return []
    }
}

async function getRuneBalance(slug, wallet) {
    try {
        const call = await axios.get(`https://api-mainnet.magiceden.dev/v2/ord/btc/runes/wallet/balances/${wallet}/${slug}`, { headers: magiceden });
        const result = parseInt(call.data.formattedBalance)
        return result
    } catch (error) {
        return null
    }
}

async function getRuneCumulativeBalance(slug, wallets) {
    try {
        let result = 0
        for (const wallet of wallets) {
            const call = await getRuneBalance(slug, wallet)
            const value = call === null ? 0 : call
            result += value
        }
        return result
    } catch (error) {
        return null
    }
}

async function getRuneActivityByWallet(slug, wallet, time) {

    try {

        //?offset=100
        // On commence par faire le call de base
        const call = await axios.get(`https://api-mainnet.magiceden.dev/v2/ord/btc/runes/wallet/activities/${wallet}`, { headers: magiceden })
        // Puis on coupe à partir du dernier objet qui est dans notre range de timestamp
        // Si c'est undefined on le garde dans le doute. Dans le cas ou lastIndex est -1 ça
        // veut dire que tout le tableau rentre dans le champs de recherche. Sinon, on coupe car
        // cela signifie que le tableau est pas completement valide donc on coupe après.
        const index = call.data.findIndex(obj => obj.txBlockTime && (obj.txBlockTime / 1000) < time) // Cela l'index représente tous les objet dans le timestamp
        const filtered = index === -1 ? call.data.filter(i => i.rune === slug) : call.data.slice(0, index).filter(i => i.rune === slug)

        // On formatte l'objet
        let result = filtered.map((i) => ({
            name: i.rune,
            action: i.kind,
            isBuy: i.newOwner === wallet ? true : false,
            amount: parseFloat(i.formattedAmount),
            price: i.kind === 'buying_broadcasted' ? satsToBtc(i.listedPrice) : null,
            to: i.newOwner,
            txId: i.mempoolTxId,
            btcAtTime: i.btcUsdPrice,
            block: i.txBlockHeight
        }))

        // On définit l'offset de base pour la boucle et aussi l'offset
        // qu'on incrément dans la boucle
        let offset = 100
        let isFull = index == -1 && call.data.length === 100 // Le -1 représente le fait que tous soit dans la range et le 100 que l'array est full

        // On initialise la boucle
        while (isFull === true) {

            // Pareil qu'en haut
            const call = await axios.get(`https://api-mainnet.magiceden.dev/v2/ord/btc/runes/wallet/activities/${wallet}?offset=${offset}`, { headers: magiceden })
            const index = call.data.findIndex(obj => obj.txBlockTime && (obj.txBlockTime / 1000) < time) // Cela l'index représente tous les objet dans le timestamp
            const filtered = index === -1 ? call.data.filter(i => i.rune === slug) : call.data.slice(0, index).filter(i => i.rune === slug)
          
            // On formatte l'objet
            result = result.concat(filtered.map((i) => ({
                name: i.rune,
                action: i.kind,
                isBuy: i.newOwner === wallet ? true : false,
                amount: parseFloat(i.formattedAmount),
                price: i.kind === 'buying_broadcasted' ? satsToBtc(i.listedPrice) : null,
                to: i.newOwner,
                txId: i.mempoolTxId,
                btcAtTime: i.btcUsdPrice,
                block: i.txBlockHeight
            })))

            // On définit l'offset de base pour la boucle et aussi l'offset
            // qu'on incrément dans la boucle
            offset += 100
            isFull = index == -1 && call.data.length === 100 // Le -1 représente le fait que tous soit dans la range et le 100 que l'array est full
        }
 
        return result

    } catch (error) {
        console.log(error.stack)
    }
}

async function getRuneActivityMultipleWallet(slug, wallets, time) {

    let result = []

    for (const wallet of wallets) {

        //?offset=100
        // On commence par faire le call de base
        const call = await axios.get(`https://api-mainnet.magiceden.dev/v2/ord/btc/runes/wallet/activities/${wallet}`, { headers: magiceden })
        // Puis on coupe à partir du dernier objet qui est dans notre range de timestamp
        // Si c'est undefined on le garde dans le doute. Dans le cas ou lastIndex est -1 ça
        // veut dire que tout le tableau rentre dans le champs de recherche. Sinon, on coupe car
        // cela signifie que le tableau est pas completement valide donc on coupe après.
        const index = call.data.findIndex(obj => obj.txBlockTime && (obj.txBlockTime / 1000) < time) // Cela l'index représente tous les objet dans le timestamp
        const filtered = index === -1 ? call.data.filter(i => i.rune === slug) : call.data.slice(0, index).filter(i => i.rune === slug)

        // On formatte l'objet
        result = result.concat(filtered.map((i) => ({
            name: i.rune,
            action: i.kind,
            isBuy: i.newOwner === wallet ? true : false,
            amount: parseFloat(i.formattedAmount),
            price: i.kind === 'buying_broadcasted' ? satsToBtc(i.listedPrice) : null,
            to: i.newOwner,
            txId: i.mempoolTxId,
            btcAtTime: i.btcUsdPrice,
            block: i.txBlockHeight,
            wallet: wallet
        })))

        // On définit l'offset de base pour la boucle et aussi l'offset
        // qu'on incrément dans la boucle
        let offset = 100
        let isFull = index == -1 && call.data.length === 100 // Le -1 représente le fait que tous soit dans la range et le 100 que l'array est full

        // On initialise la boucle
        while (isFull === true) {

            // Pareil qu'en haut
            const call = await axios.get(`https://api-mainnet.magiceden.dev/v2/ord/btc/runes/wallet/activities/${wallet}?offset=${offset}`, { headers: magiceden })
            const index = call.data.findIndex(obj => obj.txBlockTime && (obj.txBlockTime / 1000) < time) // Cela l'index représente tous les objet dans le timestamp
            const filtered = index === -1 ? call.data.filter(i => i.rune === slug) : call.data.slice(0, index).filter(i => i.rune === slug)

            // On formatte l'objet
            result = result.concat(filtered.map((i) => ({
                name: i.rune,
                action: i.kind,
                isBuy: i.newOwner === wallet ? true : false,
                amount: parseFloat(i.formattedAmount),
                price: i.kind === 'buying_broadcasted' ? satsToBtc(i.listedPrice) : null,
                to: i.newOwner,
                txId: i.mempoolTxId,
                btcAtTime: i.btcUsdPrice,
                block: i.txBlockHeight,
                wallet: wallet
            })))

            // On définit l'offset de base pour la boucle et aussi l'offset
            // qu'on incrément dans la boucle
            offset += 100
            isFull = index == -1 && call.data.length === 100 // Le -1 représente le fait que tous soit dans la range et le 100 que l'array est full
        }

        await addTimeout(0.5)
    }

    return result
}

function isHiddenRunesSplit(counterpart) {

    const received = counterpart.filter(i => i.action === "received").reduce((total, item) => total + item.amount, 0);
    const sent = counterpart.filter(i => i.action === "sent").reduce((total, item) => total + item.amount, 0);

    const result = received === sent ? true : false

    return result
}

function isHiddenRunesBuying(counterpart) {

    const isBuyTxs = counterpart.filter(i => i.action === "buying_broadcasted").length > 0

    return isBuyTxs
}

function isHiddenRuneTransfer(counterpart) {

    const isSentTxs = counterpart.filter(i => i.action === "sent").length === 1
    const isReceivedTxs = counterpart.filter(i => i.action === "received").length === 1

    return isSentTxs & isReceivedTxs
}



function satsToBtc(num) {
    return num / 10 ** 8
}

async function getTransaction(id) {
    const txn = await axios.get(`https://mempool.space/api/tx/${id}`)

    return txn.data
}

function isBRC20BitcoinWallet(wallet) {
    const regex = /^bc1[a-zA-Z0-9]{39,59}$/;

    return regex.test(wallet);
}

function isRunesUtxo(subtransactions, btcPrice) {

    // UTXO Identifié
    const knownUTXO = [546, 330]
    const limit = 1

    for (const item of subtransactions) {

        // Valeur de l'UTXO 
        const value = satsToBtc(item.value)
        const valueUsd = value * btcPrice

        // Vérifications d'indentification ou de limite
        const isKnown = knownUTXO.includes(value)
        const isUnderLimit = valueUsd <= limit ? true : false

        // On fait la condition
        if (!isKnown || !isUnderLimit) {
            // On retourne le status et la valeur
            return {
                status: false,
                value: value
            }
        }
    }

    return {
        status: true,
        value: null
    }
}

function isRunesBlaster(transactions) {
    // Les txs sont triées par amount d'office et même Runes

    try {

        const txId = []
        const chains = []

        for (const tx of transactions) {

            // console.log("    ")
            // console.log("    ")
            // console.log(colors.green(" ------- Début de chaine ------"))
            // console.log(colors.blue("Transaction"))
            // console.log(tx)

            if (!tx.treated) {

                // console.log(colors.blue("Pas traité"))
                // console.log(tx)

                // Y a t il une paire
                const counterpart = transactions.find(i => i.action === (tx.action === 'received' ? 'sent' : 'received') && i.amount === tx.amount && !i.treated)

                // console.log(colors.yellow("Counterpart"))
                // console.log(counterpart)

                if (counterpart) {
                    // Début de la chaine potentielle

                    // On définit la raison, la current chain et le last amount et le satus
                    const reason = tx.amount
                    const currentChain = [tx, counterpart]
                    let lastAmount = tx.amount
                    let isInChain = true

                    counterpart.treated = true
                    tx.treated = true


                    while (isInChain) {

                        // console.log(colors.cyan("Current Chain"))
                        // console.log(currentChain)

                        // Devient la txn de référence (la seconde)
                        const nextTx = transactions.find(i => (i.action === 'sent' || 'received') && (i.amount === lastAmount + reason) && !i.treated)

                        // console.log(colors.magenta("R : ", reason))
                        // console.log(colors.blue("Next Transaction"))
                        // console.log(nextTx)

                        if (nextTx) {

                            // On push nextTx
                            currentChain.push(nextTx)

                            const counterpart = transactions.find(i => i.action === (nextTx.action === 'received' ? 'sent' : 'received') && i.amount === nextTx.amount && !i.treated)

                            // console.log(colors.yellow("Counterpart"))
                            // console.log(counterpart)

                            if (counterpart) {

                                lastAmount = nextTx.amount

                                counterpart.treated = true
                                nextTx.treated = true

                                currentChain.push(counterpart)

                            } else {
                                // Possiblement la fin de la loop
                                if (nextTx.action === "received") {

                                    for (const chainTx of currentChain) {
                                        chainTx.treated = true
                                    }
                                    chains.push(currentChain)

                                    //console.log(colors.rainbow("Fin de la chaine"))

                                } else {
                                    //console.log(colors.red("Cas spécial"))
                                }
                                // Fin de la chaine
                                isInChain = false
                            }

                        } else {
                            // Fin de la chaine
                            //console.log(colors.red("Pas de dernière Txn trouvé"))
                            isInChain = false
                        }

                    }

                } else {
                    //console.log(colors.red("Pas de counterpart"))
                }
            }
        }
        //console.log(transactions)
        //console.log("  ")
        //console.log("Résultat:")


        const validChains = chains.filter(chain => {
            return chain.length >= 3 && chain[chain.length - 1].action === 'received' && chain.filter(tx => tx.action === 'sent').length === chain.filter(tx => tx.action === 'received').length - 1;
        });

        // On récupère les différentes datas
        const chainCount = validChains.length
        const mints = validChains.reduce((acc, table) => acc + table.filter(txn => txn.action === "received").length, 0);
        const totalTokens = validChains.reduce((sum, chain) => sum + chain[chain.length - 1].amount, 0);
        const txs = [...new Set(validChains.flatMap(subArray => subArray.map(tx => tx.txId)))]

        const result = chainCount > 0 ? { chains: chainCount, mints: mints, amount: totalTokens, count: txs.length, txs: txs } : null

        return result

    } catch (error) {
        console.log(error.stack)
        return null
    }
}


module.exports = {
    getBtcPrice,
    getRuneMetrics,
    getExtensiveRuneMetrics,
    getRuneActivityByWallet,
    getRuneActivityMultipleWallet,
    getRuneCumulativeBalance,
    getTransaction,
    getRuneBalance,
    satsToBtc,
    isHiddenRunesBuying,
    isHiddenRunesSplit,
    isHiddenRuneTransfer,
    isBRC20BitcoinWallet,
    searchRunesByName,
    getRuneTopCollection,
    isRunesUtxo,
    isRunesBlaster
}


// // 1e objet index et delete
// const indexA = filtered.findIndex(i => i == counterpart)
// filtered = filtered.splice(indexA, 1)

// // 2e objet index et delete
// const indexB = filtered.findIndex(i => i == tx)
// filtered = filtered.splice(indexB, 1)
