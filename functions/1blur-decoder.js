
const blur_marketplace3_functions = [
    { name: "buy", function: "takeAskSingle", sig: "0x70bce2d6" },
    { name: "buyBulk", function: "takeAsk", sig: "0x3925c3c3" },
    { name: "acceptBid", function: "takeBidSingle", sig: "0xda815cb5" },
    { name: "acceptBidBulk", function: "takeBid", sig: "0x7034d120" },
    { name: "buyPool", function: "takeAskSinglePool", sig: "0x336d8206" },
    { name: "buyBulkPool", function: "takeAskPool", sig: "0x133ba9a6" },

]

function splitString(string, char) {
    const result = [];
    for (let i = 0; i < string.length; i += char) {
        const chunk = string.slice(i, i + char);
        result.push(chunk);
    }
    return result;
}



function decodeBlur(transaction) {

    try {

        const sig = transaction.input.substring(0, 10)
        const fctn = blur_marketplace3_functions.find(item => item.sig == sig)

        if (fctn.name == "buy") {
            return decodeSingleBuy(transaction)
        } else if (fctn.name == "buyBulk") {
            return decodeBulkBuy(transaction)
        } else if (fctn.name == "acceptBid") {
            return decodeSingleBid(transaction)
        } else if (fctn.name == "acceptBidBulk") {
            return decodeBulkBid(transaction)
        } else if (fctn.name == "buyPool") {
            return decodeBuyPool(transaction)
        } else if (fctn.name == "buyBulkPool") {
            return decodeBuyBulkPool(transaction)
        } else {
            return null
        }

    } catch (error) {

        console.log(error.stack)

        return null
    }

}


function decodeSingleBuy(transaction) {

    try {

        const action = "buy"
        const input = transaction.input
        const hash = transaction.hash

        // On decode manuellement
        const buyer = "0x" + input.substring(994, 1034).toLowerCase()
        const seller = "0x" + input.substring(162, 202).toLowerCase()
        const collection = "0x" + input.substring(226, 266).toLowerCase()
        const tokenId = parseInt("0x" + input.substring(1226, 1290), 16)
        const amount = parseInt("0x" + input.substring(1290, 1354), 16)
        const price = parseInt("0x" + input.substring(1354, 1418), 16) / 10 ** 18
        //const feeTaker = "0x" + input.substring(546, 586)

        const result = {
            action: action,
            maker: [{
                address: buyer,
                collection: collection,
                value: price,
                amount: amount,
                isBuy: true
            }],
            taker: [{
                address: seller,
                collection: collection,
                amount: amount,
                value: price,
                tokenId: [tokenId],
                isBuy: false
            }],
            traders: [
                buyer,
                seller
            ],
            marketplace: "Blur",
            hash: hash
        }

        return result

    } catch (error) {

        console.log(error.stack)

        return null

    }

}

function decodeSingleBid(transaction) {

    try {

        const action = "acceptBid"
        const input = transaction.input
        const hash = transaction.hash

        // On decode manuellement
        const seller = transaction.from.toLowerCase()
        const buyer = "0x" + input.substring(162, 202).toLowerCase()
        const collection = "0x" + input.substring(226, 266).toLowerCase()
        const price = parseInt("0x" + input.substring(1290, 1354), 16) / 10 ** 18
        const tokenId = parseInt("0x" + input.substring(1354, 1418), 16)
        const amount = parseInt("0x" + input.substring(1418, 1482), 16)

        const result = {
            action: action,
            maker: [{
                address: seller,
                collection: collection,
                value: price,
                amount: amount,
                isBuy: false
            }],
            taker: [{
                address: buyer,
                collection: collection,
                amount: amount,
                value: price,
                tokenId: [tokenId],
                isBuy: true
            }],
            traders: [
                buyer,
                seller
            ],
            marketplace: "Blur",
            hash: hash,


        }

        return result

    } catch (error) {

        console.log(error.stack)

        return null

    }

}

function decodeBulkBuy(transaction) {

    try {

        const action = "buyBulk"

        // On a les paramètres
       const input = transaction.input
        const params = splitString(input.slice(10), 64)
        const hash = transaction.hash


        // On decode le seller et les fees
        const buyer = ("0x" + params[7].slice(24)).toLowerCase()
        let buyerValue = transaction.value.toLowerCase() / 10 ** 18
        let buyerAmount = 0
        let buyerCollection
        const feeTaker = ("0x" + params[4].slice(24)).toLowerCase()
        const fees = parseInt("0x" + params[5], 16) / 100

        // On crée le tableau d'index
        const idxArray = []

        // On analyse les bidder
        const sellers = []
        const sellerCount = parseInt(params[8], 16)
        const oneSellSize = 9
        const sellerLength = sellerCount * oneSellSize
        const sellerIdx = 9
        let index = 0

        // Boucle pour extraire les informations pour chaque bidder
        for (let i = 0; i < sellerCount; i++) {
            // Index de début des informations pour le bidder actuel
            const indexA = sellerIdx + i * oneSellSize;
            const indexB = indexA + oneSellSize

            // Extraire les 9 lignes d'informations pour le bidder actuel
            const sellerInfo = params.slice(indexA, indexB);

            const address = ("0x" + sellerInfo[0].slice(24)).toLowerCase()
            const collection = ("0x" + sellerInfo[1].slice(24)).toLowerCase()
            if (i == 0) { buyerCollection = collection }

            const sellerExist = sellers.some((obj) => obj.address === address && obj.collection === collection);

            if (!sellerExist) {
                // Si cet objet exact (collection + buyer) n'existe pas

                const obj = {
                    address: address,
                    collection: collection,
                    amount: 0,
                    value: 0,
                    tokenId: [],
                    isBuy: false
                }

                sellers.push(obj)

                // On push l'objet en question
                const idxObj = {
                    index: index,
                    form: i
                }

                idxArray.push(idxObj)

                index++
            } else {

                const existingIdx = sellers.findIndex((obj) => obj.address === address && obj.collection === collection);

                // On push l'objet en question
                const idxObj = {
                    index: existingIdx,
                    form: i
                }

                idxArray.push(idxObj)

            }


        }

        // On analyse les tokens vendus
        const tokenInfoIdx = sellerLength + sellerIdx
        const tokenCount = parseInt(params[tokenInfoIdx], 16)
        const tokenIdx = tokenInfoIdx + tokenCount + 1
        const oneTokenSize = 9
        let spaceCap = 0

        // Boucle pour extraire les informations pour chaque bidder
        for (let i = 0; i < tokenCount; i++) {
            // Index de début des informations pour le bidder actuel
            const indexA = tokenIdx + i * oneTokenSize + spaceCap
            const indexB = indexA + oneTokenSize

            // Extraire les 9 lignes d'informations pour le bidder actuel
            const tokenInfo = params.slice(indexA, indexB);

            const buyerIdx = parseInt("0x" + tokenInfo[0], 16)
            const price = parseInt("0x" + tokenInfo[5], 16) / 10 ** 18
            const tokenId = parseInt("0x" + tokenInfo[6], 16)
            const amount = parseInt("0x" + tokenInfo[7], 16)
            spaceCap += parseInt("0x" + tokenInfo[8], 16)

            // On trouve l'index réel
            const realIdx = idxArray.find(idx => idx.form == buyerIdx).index

            // On incrémente et fusionne les infos
            // buyerValue += price
            buyerAmount += amount
            sellers[realIdx].amount += amount
            sellers[realIdx].value += price
            sellers[realIdx].tokenId.push(tokenId)


        }


        const result = {
            action: action,
            maker: [{
                address: buyer,
                collection: buyerCollection,
                value: buyerValue,
                amount: buyerAmount,
                isBuy: true
            }],
            taker: sellers,
            traders: [...[buyer], ...sellers.map(item => item.address.toLowerCase())],
            marketplace: "Blur",
            hash: hash,
        }

        return result

    } catch (error) {

        console.log(error.stack)

        return null

    }

}

function decodeBulkBid(transaction) {

    try {

        const action = "acceptBidBulk"

        // On a les paramètres
       const input = transaction.input
        const params = splitString(input.slice(10), 64)
        const hash = transaction.hash


        // On decode le seller et les fees
        const seller = transaction.from.toLowerCase()
        let sellerProfit = 0
        let sellerAmount = 0
        let sellerCollection
        const feeTaker = ("0x" + params[4].slice(24)).toLowerCase()
        const fees = parseInt("0x" + params[5], 16) / 100


        // On crée le tableau d'index
        const idxArray = []

        // On analyse les bidder
        const buyers = []
        const bidderCount = parseInt(params[7], 16)
        const oneBidderSize = 9
        const bidderLength = bidderCount * oneBidderSize
        const bidderIdx = 8
        let index = 0

        // Boucle pour extraire les informations pour chaque bidder
        for (let i = 0; i < bidderCount; i++) {
            // Index de début des informations pour le bidder actuel
            const indexA = bidderIdx + i * oneBidderSize;
            const indexB = indexA + oneBidderSize

            // Extraire les 9 lignes d'informations pour le bidder actuel
            const bidderInfo = params.slice(indexA, indexB);

            const address = ("0x" + bidderInfo[0].slice(24)).toLowerCase()
            const collection = ("0x" + bidderInfo[1].slice(24)).toLowerCase()
            if (i == 0) { sellerCollection = collection }

            const buyerExist = buyers.some((obj) => obj.address === address && obj.collection === collection);

            if (!buyerExist) {
                // Si cet objet exact (collection + buyer) n'existe pas

                const obj = {
                    address: address,
                    collection: collection,
                    amount: 0,
                    value: 0,
                    tokenId: [],
                    isBuy: true
                    //expire: parseInt("0x" + bidderInfo[4], 16),

                }

                buyers.push(obj)

                // On push l'objet en question
                const idxObj = {
                    index: index,
                    form: i
                }

                idxArray.push(idxObj)

                index++
            } else {

                const existingIdx = buyers.findIndex((obj) => obj.address === address && obj.collection === collection);

                // On push l'objet en question
                const idxObj = {
                    index: existingIdx,
                    form: i
                }

                idxArray.push(idxObj)

            }

        }

        // On analyse les tokens vendus
        const tokenInfoIdx = bidderLength + bidderIdx
        const tokenCount = parseInt(params[tokenInfoIdx], 16)
        const tokenIdx = tokenInfoIdx + tokenCount + 1
        const oneTokenSize = 9

        // Boucle pour extraire les informations pour chaque bidder
        for (let i = 0; i < tokenCount; i++) {
            // Index de début des informations pour le bidder actuel
            const indexA = tokenIdx + i * oneTokenSize;
            const indexB = indexA + oneTokenSize

            // Extraire les 9 lignes d'informations pour le bidder actuel
            const tokenInfo = params.slice(indexA, indexB);

            const buyerIdx = parseInt("0x" + tokenInfo[0], 16)
            const price = parseInt("0x" + tokenInfo[5], 16) / 10 ** 18
            const tokenId = parseInt("0x" + tokenInfo[6], 16)
            const amount = parseInt("0x" + tokenInfo[7], 16)

            // On trouve l'index réel
            const realIdx = idxArray.find(idx => idx.form == buyerIdx).index

            // On incrémente et fusionne les infos
            sellerProfit += price
            sellerAmount += amount
            buyers[realIdx].amount += amount
            buyers[realIdx].value += price
            buyers[realIdx].tokenId.push(tokenId)


        }

        const result = {
            action: action,
            maker: [{
                address: seller,
                collection: sellerCollection,
                value: sellerProfit,
                amount: sellerAmount,
                isBuy: false
            }],
            taker: buyers,
            traders: [...[seller], ...buyers.map(item => item.address.toLowerCase())],
            marketplace: "Blur",
            hash: hash,
        }

        return result

    } catch (error) {

        console.log(error.stack)

        return null
    }

}

function decodeBuyPool(transaction) {

    try {

        const action = "buyPool"

        // On a les paramètres
       const input = transaction.input
        const params = splitString(input.slice(10), 64)
        const hash = transaction.hash

        // On décode manuellement
        const seller = ("0x" + params[3].slice(24)).toLowerCase()
        const collection = ("0x" + params[4].slice(24)).toLowerCase()
        const buyer = ("0x" + params[16].slice(24)).toLowerCase()
        const tokenId = parseInt(params[20], 16)
        const price = parseInt(params[2], 16) / 10 ** 18
        const amount = parseInt(params[6], 16)
        const feeTaker = ("0x" + params[9].slice(24)).toLowerCase()


        const result = {
            action: action,
            maker: [{
                address: buyer,
                collection: collection,
                value: price,
                amount: amount,
                isBuy: true
            }],
            taker: [{
                address: seller,
                collection: collection,
                tokenId: tokenId,
                price: price,
                amount: amount,
                isBuy: false
            }],
            traders: [
                buyer,
                seller
            ],
            marketplace: "Blur",
            hash: hash,
        }

        return result

    } catch (error) {

        console.log(error.stack)

        return null
    }

}

function decodeBuyBulkPool(transaction) {

    try {

        const action = "buyBulkPool"

        // On a les paramètres
       const input = transaction.input
        const params = splitString(input.slice(10), 64)
        const hash = transaction.hash


        // On decode le seller et les fees
        const buyer = ('0x' + params[8].slice(24)).toLowerCase()
        const buyerValue = transaction.value.toLowerCase() / 10 ** 18
        let buyerAmount = 0
        let buyerCollection
        const feeTaker = ("0x" + params[6].slice(24)).toLowerCase()
        const fees = parseInt("0x" + params[7], 16) / 100

        // On crée le tableau d'index
        const idxArray = []

        // On analyse les bidder
        const sellers = []
        const sellerCount = parseInt(params[9], 16)
        const oneSellSize = 9
        const sellerLength = sellerCount * oneSellSize
        const sellerIdx = 10
        let index = 0

        // Boucle pour extraire les informations pour chaque bidder
        for (let i = 0; i < sellerCount; i++) {
            // Index de début des informations pour le bidder actuel
            const indexA = sellerIdx + i * oneSellSize;
            const indexB = indexA + oneSellSize

            // Extraire les 9 lignes d'informations pour le bidder actuel
            const sellerInfo = params.slice(indexA, indexB);

            const address = ("0x" + sellerInfo[0].slice(24)).toLowerCase()
            const collection = ("0x" + sellerInfo[1].slice(24)).toLowerCase()
            if (i == 0) { buyerCollection = collection }

            const buyerExist = sellers.some((obj) => obj.address === address && obj.collection === collection);

            if (!buyerExist) {
                // Si cet objet exact (collection + buyer) n'existe pas

                const obj = {
                    address: address,
                    collection: collection,
                    amount: 0,
                    value: 0,
                    tokenId: [],
                    isBuy: false
                    //expire: parseInt("0x" + bidderInfo[4], 16),

                }

                sellers.push(obj)

                // On push l'objet en question
                const idxObj = {
                    index: index,
                    form: i
                }

                idxArray.push(idxObj)

                index++
            } else {

                const existingIdx = sellers.findIndex((obj) => obj.address === address && obj.collection === collection);

                // On push l'objet en question
                const idxObj = {
                    index: existingIdx,
                    form: i
                }

                idxArray.push(idxObj)

            }

        }


        // On analyse les tokens vendus
        const tokenInfoIdx = sellerLength + sellerIdx
        const tokenCount = parseInt(params[tokenInfoIdx], 16)
        const tokenIdx = tokenInfoIdx + tokenCount + 1
        const oneTokenSize = 9
        let spaceCap = 0

        // Boucle pour extraire les informations pour chaque bidder
        for (let i = 0; i < tokenCount; i++) {
            // Index de début des informations pour le bidder actuel
            const indexA = tokenIdx + i * oneTokenSize + spaceCap
            const indexB = indexA + oneTokenSize

            // Extraire les 9 lignes d'informations pour le bidder actuel
            const tokenInfo = params.slice(indexA, indexB);

            const buyerIdx = parseInt("0x" + tokenInfo[0], 16)
            const price = parseInt("0x" + tokenInfo[5], 16) / 10 ** 18
            const tokenId = parseInt("0x" + tokenInfo[6], 16)
            const amount = parseInt("0x" + tokenInfo[7], 16)
            spaceCap += parseInt("0x" + tokenInfo[8], 16)

            // On trouve l'index réel
            const realIdx = idxArray.find(idx => idx.form == buyerIdx).index

            // On incrémente et fusionne les infos
            buyerAmount += amount
            sellers[realIdx].amount += amount
            sellers[realIdx].value += price
            sellers[realIdx].tokenId.push(tokenId)


        }

        const result = {
            action: action,
            maker: {
                address: buyer,
                collection: buyerCollection,
                value: buyerValue,
                amount: buyerAmount,
                isBuy: true
            },
            taker: sellers,
            traders: [...[buyer], ...sellers.map(item => item.address.toLowerCase())],
            marketplace: "Blur",
            hash: hash,
        }

        return result

    } catch (error) {

        console.log(error.stack)

        return null
    }

}


module.exports = decodeBlur