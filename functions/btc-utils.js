const { magiceden, unisat } = require("../config/web3config")
const axios = require("axios")
const addTimeout = require("./addtimeout")


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
       result += call === null ? 0 : call
      }
    } catch (error) {
        return null
    }
}

async function getRuneActivityByWallet(slug, wallet, time) {


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
        btcAtTime: i.btcUsdPrice
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
            btcAtTime: i.btcUsdPrice
        })))

        // On définit l'offset de base pour la boucle et aussi l'offset
        // qu'on incrément dans la boucle
        offset += 100
        isFull = index == -1 && call.data.length === 100 // Le -1 représente le fait que tous soit dans la range et le 100 que l'array est full
    }
    return result
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
    isRunesUtxo
}