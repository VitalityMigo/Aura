
// Importer un tableau avec signature et description etc
const opensea_seaport15_functions = [
    { name: "buy", function: "fulfillOrder", sig: "0xb3a34c4c" },
    { name: "buyAdvanced", function: "fulfillAdvancedOrder", sig: "0xe7acab24" },
    { name: "buyBasic", function: "fulfillBasicOrder", sig: "0xfb0f3ee1" },
    { name: "buyEfficient", function: "fulfillBasicOrder_efficient_6GL6yc", sig: "0x00000000" },
    { name: "buyAvailable", function: "fulfillAvailableOrders", sig: "0xed98a574" },
    { name: "buyAvailableAdvanced", function: "fulfillAvailableAdvancedOrders", sig: "0x87201b41" },
    { name: "acceptBid", function: "matchOrders", sig: "0xa8174404" },
    { name: "acceptBidAdvanced", function: "matchAdvancedOrders", sig: "0xf2d12b12" },

]

function splitString(string, char) {
    const result = [];
    for (let i = 0; i < string.length; i += char) {
        const chunk = string.slice(i, i + char);
        result.push(chunk);
    }
    return result;
}



function decodeOpensea(transaction) {

    try {

        const sig = transaction.input.substring(0, 10)
        const fctn = opensea_seaport15_functions.find(item => item.sig == sig)

        if (fctn) {

            if (fctn.name == "buy") {
                return decodeBuy(transaction)
            } else if (fctn.name == "buyAdvanced") {
                return decodeBuyAdvanced(transaction)
            } else if (fctn.name == "buyBasic") {
                return decodeBuyBasic(transaction)
            } else if (fctn.name == "buyEfficient") {
                return decodeBuyEfficient(transaction)
            } else if (fctn.name == "buyAvailable") {
                return decodeAvailable(transaction)
            } else if (fctn.name == "buyAvailableAdvanced") {
                return decodeAvailableAdvanced(transaction)
            }
            // else if (fctn.name == "acceptBid") {
            //     return decodeAcceptBid(transaction)
            // } else if (fctn.name == "acceptBidAdvanced") {
            //     return decodeAvailableAdvanced(transaction)
            // } 
            else {
                return null
            }
        }
    } catch (error) {

        console.log(error.stack)

        return null
    }

}


function decodeBuy(transaction) {

    try {


        const action = "buy"

        // On a les paramètres
        const input = transaction.input
        const params = splitString(input.slice(10), 64)
        const hash = transaction.hash

        // On decode manuellement
        const buyer = transaction.from.toLowerCase()
        const seller = "0x" + (params[4].slice(24)).toLowerCase()
        const collection = "0x" + (params[17].slice(24)).toLowerCase()
        const tokenId = parseInt(params[18], 16)
        const amount = 1
        const price = transaction.value / 10 ** 18


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
            marketplace: "Opensea",
            hash: hash,
        }

        return result

    } catch (error) {

        console.log(error.stack)

        return null
    }

}

function decodeBuyAdvanced(transaction) {

    try {

        const action = "buyAdvanced"

        // On a les paramètres
        const input = transaction.input
        const params = splitString(input.slice(10), 64)
        const hash = transaction.hash

        // On decode manuellement
        // const buyer = "0x" + (params[3].slice(24)).toLowerCase()
        const buyer = transaction.from.toLowerCase()
        const seller = "0x" + (params[9].slice(24)).toLowerCase()
        const collection = "0x" + (params[22].slice(24)).toLowerCase()
        const tokenId = parseInt(params[23], 16)
        const amount = 1
        const price = transaction.value / 10 ** 18
        // const price = parseInt(params[25], 16) / 10 ** 18
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
            marketplace: "Opensea",
            hash: hash,
        }

        return result

    } catch (error) {

        console.log(error.stack)

        return null
    }

}

function decodeBuyBasic(transaction) {

    try {

        const action = "buyBasic"

        // On a les paramètres
        const input = transaction.input
        const params = splitString(input.slice(10), 64)
        const hash = transaction.hash


        // On decode manuellement
        // const buyer = "0x" + (params[3].slice(24)).toLowerCase()
        const buyer = transaction.from.toLowerCase()
        const seller = "0x" + (params[4].slice(24)).toLowerCase()
        const collection = "0x" + (params[6].slice(24)).toLowerCase()
        const tokenId = parseInt(params[7], 16)
        const amount = 1
        const price = transaction.value / 10 ** 18
        // const price = parseInt(params[25], 16) / 10 ** 18
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
            marketplace: "Opensea",
            hash: hash,
        }

        return result

    } catch (error) {

        console.log(error.stack)

        return null
    }

}

function decodeBuyEfficient(transaction) {

    try {

        const action = "buyEfficient"

        // On a les paramètres
        const input = transaction.input
        const params = splitString(input.slice(10), 64)
        const hash = transaction.hash

        // On decode manuellement
        // const buyer = "0x" + (params[3].slice(24)).toLowerCase()
        const buyer = transaction.from.toLowerCase()
        const seller = "0x" + (params[4].slice(24)).toLowerCase()
        const collection = "0x" + (params[6].slice(24)).toLowerCase()
        const tokenId = parseInt(params[7], 16)
        const amount = 1
        let price = transaction.value / 10 ** 18
        if (price == 0) { price = parseInt(params[8], 16) / 10 ** 18 }
        // const price = parseInt(params[25], 16) / 10 ** 18
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
            marketplace: "Opensea",
            hash: hash,
        }


        return result

    } catch (error) {

        console.log(error.stack)

        return null
    }
}

function decodeAvailable(transaction) {

    try {

        const action = "buyAvailable"

        // On a les paramètres
        const input = transaction.input
        const params = splitString(input.slice(10), 64)
        const hash = transaction.hash


        const buyer = transaction.from.toLowerCase()
        const buyerValue = transaction.value / 10 ** 18
        let buyerCollection

        const sellers = []
        const initialIdx = 8
        const tradeCount = parseInt(params[4], 16)
        const tradeIdx = tradeCount + initialIdx



        let oneTradeSize = (parseInt(params[tradeIdx - 1], 16) / 32) - 1
        let totalTradeSizes = 0

        // Boucle pour extraire les informations pour chaque bidder
        for (let i = 0; i < tradeCount; i++) {
            console.log("Round " + (i + 1))
            // Index de début des informations pour le bidder actuel


            const indexA = tradeIdx + totalTradeSizes
            const indexB = indexA + oneTradeSize

            // Extraire les 9 lignes d'informations pour le bidder actuel
            const sellersInfo = params.slice(indexA, indexB);

            function countTriplet(param) {
                let countTriplets = 0;
                const base = "0"
                const paramToSearch = base.repeat(64)
                for (let i = 0; i < param.length - 2; i++) {
                    if (
                        param[i] === paramToSearch &&
                        param[i + 1] === paramToSearch &&
                        param[i + 2] === paramToSearch
                    ) {
                        countTriplets++;
                    }
                }
                const baseTriplet = 1

                return countTriplets - baseTriplet
            }
            const feeObj = countTriplet(sellersInfo)

            // On va chercher les valeurs
            const address = ("0x" + sellersInfo[0].slice(24)).toLowerCase()
            const collection = ("0x" + sellersInfo[13].slice(24)).toLowerCase()
            const tokenId = parseInt(sellersInfo[14], 16)
            const rawPrice = parseInt(sellersInfo[21], 16) / 10 ** 18
            let fees = 0
            if (feeObj == 1) { fees = (parseInt(sellersInfo[27], 16)) / 10 ** 18 }
            else if (feeObj == 2) { fees = (parseInt(sellersInfo[27], 16) + parseInt(sellersInfo[33], 16)) / 10 ** 18 }
            if (i == 0) { buyerCollection = collection }

            const price = rawPrice + fees
            const amount = 1

            const sigSize = Math.ceil(parseInt(params[indexB - 1], 16) / 32)
            totalTradeSizes += oneTradeSize + 2 + sigSize
            oneTradeSize = (parseInt(params[indexB + sigSize + 1], 16) / 32) - 1
            console.log(oneTradeSize)

            const buyerExist = sellers.some((obj) => obj.address === address && obj.collection === collection);

            if (!buyerExist) {
                // Si cet objet exact (collection + buyer) n'existe pas

                const obj = {
                    address: address,
                    collection: collection,
                    amount: amount,
                    value: price,
                    tokenId: [tokenId],
                    isBuy: false
                }

                sellers.push(obj)

            } else {

                const objectIdx = sellers.findIndex((obj) => obj.address === address && obj.collection === collection);

                // On incrémente et fusionne les infos
                sellers[objectIdx].amount += amount
                sellers[objectIdx].value += price
                sellers[objectIdx].tokenId.push(tokenId)

            }

        }

        const result = {
            action: action,
            maker: [{
                address: buyer,
                collection: buyerCollection,
                value: buyerValue,
                amount: tradeCount,
                isBuy: true
            }],
            taker: sellers,
            traders: [...[buyer], ...sellers.map(item => item.address.toLowerCase())],
            marketplace: "Opensea",
            hash: hash,

        }

        return result

    } catch (error) {

        console.log(error.stack)

        return null
    }

}

function decodeAvailableAdvanced(transaction) {

    try {

        const action = "buyAvailableAdvance"

        // On a les paramètres
        const input = transaction.input
        const params = splitString(input.slice(10), 64)
        const hash = transaction.hash

        const buyer = transaction.from.toLowerCase()
        const buyerValue = transaction.value / 10 ** 18
        let buyerCollection

        const sellers = []
        const initialIdx = 13
        const tradeCount = parseInt(params[6], 16)
        const tradeIdx = tradeCount + initialIdx

        let oneTradeSize = parseInt(params[tradeIdx - 1], 16) / 32
        let totalTradeSizes = 0

        // Boucle pour extraire les informations pour chaque bidder
        for (let i = 0; i < tradeCount; i++) {
            console.log("Round " + (i + 1))
            // Index de début des informations pour le bidder actuel


            const indexA = tradeIdx + totalTradeSizes
            const indexB = indexA + oneTradeSize

            // Extraire les 9 lignes d'informations pour le bidder actuel
            const sellersInfo = params.slice(indexA, indexB);

            function countTriplet(param) {
                let countTriplets = 0;
                const base = "0"
                const paramToSearch = base.repeat(64)
                for (let i = 0; i < param.length - 2; i++) {
                    if (
                        param[i] === paramToSearch &&
                        param[i + 1] === paramToSearch &&
                        param[i + 2] === paramToSearch
                    ) {
                        countTriplets++;
                    }
                }
                const baseTriplet = 1

                return countTriplets - baseTriplet
            }
            const feeObj = countTriplet(sellersInfo)

            // On va chercher les valeurs
            const address = ("0x" + sellersInfo[0].slice(24)).toLowerCase()
            const collection = ("0x" + sellersInfo[13].slice(24)).toLowerCase()
            const tokenId = parseInt(sellersInfo[14], 16)
            const rawPrice = parseInt(sellersInfo[21], 16) / 10 ** 18
            let fees = 0
            if (feeObj == 1) { fees = (parseInt(sellersInfo[27], 16)) / 10 ** 18 }
            else if (feeObj == 2) { fees = (parseInt(sellersInfo[27], 16) + parseInt(sellersInfo[33], 16)) / 10 ** 18 }
            if (i == 0) { buyerCollection = collection }

            const price = rawPrice + fees
            const amount = 1

            totalTradeSizes += oneTradeSize + 1
            oneTradeSize = parseInt(params[indexB], 16) / 32


            const buyerExist = sellers.some((obj) => obj.address === address && obj.collection === collection);

            if (!buyerExist) {
                // Si cet objet exact (collection + buyer) n'existe pas

                const obj = {
                    address: address,
                    collection: collection,
                    amount: amount,
                    value: price,
                    tokenId: [tokenId],
                    isBuy: false
                }

                sellers.push(obj)

            } else {

                const objectIdx = sellers.findIndex((obj) => obj.address === address && obj.collection === collection);

                // On incrémente et fusionne les infos
                sellers[objectIdx].amount += amount
                sellers[objectIdx].value += price
                sellers[objectIdx].tokenId.push(tokenId)

            }

        }

        const result = {
            action: action,
            buyer: [{
                address: buyer,
                collection: buyerCollection,
                value: buyerValue,
                amount: tradeCount,
                isBuy: true
            }],
            seller: sellers,
            traders: [...[buyer], ...sellers.map(item => item.address.toLowerCase())],
            marketplace: "Opensea",
            hash: hash,
        }


        return result

    } catch (error) {

        console.log(error.stack)

        return null
    }

}

function decodeAcceptBid(transaction) {
}

function decodeAcceptBidAdvanced(transaction) {
}


module.exports = decodeOpensea