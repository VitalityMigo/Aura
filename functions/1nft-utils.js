//Récupérer les clefs API
const { web3CloudflarePublic, reservoirHead, chainbaseHead, web3Infura } = require("../config/web3config")
const { infra_nft } = require('../events/database');

const decrypt = require("./decrypt")
const addTimeout = require("./addtimeout")

const axios = require("axios")
const ethers = require("ethers")

//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const reservoirExeApiKey = process.env.reservoirExeApiKey
const etherscanApiKey = process.env.etherscanApiKey

// On récupère le tableau des marketplaces
const markets = require("../contracts/nft/config.json");
const erc721 = require("../contracts/blur/erc721standard.json")


async function getCollection(contracts) {

    try {

        const table = contracts.map(address => `contract=${address}`).join('&');

        const call = await axios.get("https://api.reservoir.tools/collections/v7?" + table, { headers: reservoirHead })

        const result = []

        for (const collection of call.data.collections) {

            result.push({
                name: collection.name,
                contract: collection.id,
                floor: collection.floorAsk.price.amount.decimal,
                change1D: collection.floorSaleChange["1day"],
                supply: collection.tokenCount,
                image: collection.image,
                banner: collection.banner,
                links: {
                    slug: collection.slug,
                    contract: collection.id,
                    twitter: collection.twitterUrl,
                    discord: collection.discordUrl,
                    website: collection.externalUrl,
                },
            })

        }

        return result

    } catch (error) {

        console.log(error.stack)

        return null
    }
}

// Fonction à faire
// Besoin de bypass Cloudflare
async function getBlurPortfolio(address) {

    // On définit les endpoints de blur
    const baseBlurEP = 'https://core-api.prod.blur.io/v1/portfolio/'
    const tokensBlurEP = baseBlurEP + address + '/owned'
    const collectionsBlurEP = baseBlurEP + address + '/collections'
}

async function getPortfolio(address) {

    const endpoint = `https://api.reservoir.tools/users/${address}/collections/v3?includeTopBid=true&limit=100`
    const portfolioCALL = await axios.get(endpoint)
    const portfolio = portfolioCALL.data.collections

    const result = portfolio
        .filter(item => item.collection.floorAskPrice && item.collection.volume["30day"] > 0)
        .sort((a, b) => (b.collection.floorAskPrice.amount.decimal * b.ownership.tokenCount) - (a.collection.floorAskPrice.amount.decimal * a.ownership.tokenCount))
        .map((item) => ({
            name: item.collection.name,
            contract: item.collection.id,
            floor: item.collection.floorAskPrice.amount.decimal,
            bid: filterIfBids(item.collection),
            value: item.collection.floorAskPrice.amount.decimal * item.ownership.tokenCount,
            owned: item.ownership.tokenCount
        }))

    function filterIfBids(item) {
        if (item.topBidValue) {
            return item.topBidValue.amount.decimal
        } else {
            return null
        }
    }

    return result
}

async function getTokensByCollection(contract, address) {

    const tokensCALL = await axios.get(`https://api.chainbase.online/v1/account/nfts?chain_id=1&address=${address}&contract_address=${contract}&page=1&limit=100`, { headers: chainbaseHead })
    const tokens = tokensCALL.data.data.sort((a, b) => b.rarity_rank - a.rarity_rank).map(item => ({
        name: item.name,
        contract: item.contract_address,
        tokenId: item.token_id,
        rarity: item.rarity_rank != null ? item.rarity_rank : "-",
    }))
    return tokens
}

function encodeTransfer(sender, receiver, tokenId) {

    const inputs = ["address", "address", "uint256"]
    const sig = "0x42842e0e"

    // Encodage des paramètres pour safeTransferFrom
    const encodedParams = web3CloudflarePublic.eth.abi.encodeParameters(
        inputs,
        [sender, receiver, tokenId]
    );

    return sig + encodedParams.slice(2)

}

async function simulateTransaction(param) {

    try {
        // On tente de simuler la transaction
        const gas_used = await web3Infura.eth.estimateGas(param)

        return {
            result: gas_used,
            valid: true
        }

    } catch (error) {
        // Gestion de l'erreur en cas de simulation ratée
        let message = error.message

        if (message.startsWith("Returned")) {
            message = message.replace("Returned error: ", "")
        }

        if (message.includes("TRANSFER_FROM_FAILED")) {
            message = "Can't transfer token, probably a honeypot          "
        }
        console.log(error.stack)

        return {
            result: message,
            valid: false
        }
    }
}

async function getGasPrice() {

    const price = await web3CloudflarePublic.eth.getGasPrice()

    return {
        wei: price,
        gwei: price / 10 ** 9,
        eth: price / 10 ** 18
    }

}

async function gasOracle(gas_preset, gas_used, max_gwei) {

    const limitHitMargin = 10
    const gasMargin = 1.1

    // On set les gas price
    let gas_price = (await getGasPrice()).wei // On récupère le gasPrice
    let gas_limit = 150000 // Moyenne des gas limit

    // On s'assure que la transaction passe en boostant légèrement les gas
    // On ajoutera ensuite le gas preset
    gas_price = Math.ceil(gas_price * gasMargin)


    if (gas_used && gas_used > gas_limit) {
        gas_limit = Math.ceil(gas_used * (1 + (limitHitMargin / 100)))
    }

    if (gas_preset != null && gas_price) {
        gas_price = parseInt(gas_price * (1 + (parseFloat(gas_preset) / 100)))
    }

    const gas_price_gwei = parseFloat(await web3Infura.utils.fromWei(gas_price.toString(), "gwei"))
    const expected_fees = parseFloat(await web3Infura.utils.fromWei((gas_price * gas_used).toString(), "ether"))

    if (max_gwei == null || gas_price_gwei <= max_gwei) {

        const gasParam = {
            price: gas_price,
            gwei: gas_price_gwei,
            limit: gas_limit,
            fees: expected_fees,
            valid: true
        }

        return gasParam

    } else if (gas_price_gwei > max_gwei) {

        return {
            price: gas_price,
            valid: "Over gas limit"

        }

    } else {

        return null

    }
}

async function signTransaction(txnInfos, private_key) {

    // Sign and send a transaction using PK
    // Triggers the transaction

    try {
        // On signe

        const signedTx = await web3Infura.eth.accounts.signTransaction(txnInfos, private_key);
        const rawTransaction = signedTx.rawTransaction

        // On envoie
        return web3Infura.eth.sendSignedTransaction(rawTransaction)
            .then(async (receipt) => {

                return {
                    hash: receipt.transactionHash,
                    gas_fees: receipt.gasUsed * (receipt.effectiveGasPrice / 10 ** 18),
                    status: receipt.status,
                    message: null
                }

            })
            .catch(async (error) => {

                console.log('Erreur lors de lenvoi de la transaction signée : ', error.stack);

                let message = error.message
                if (message.startsWith("Returned")) {
                    message = message.replace("Returned error: ", "")
                }

                return {
                    hash: null,
                    gas_fees: null,
                    status: null,
                    message: message

                }


            });

    } catch (error) {

        console.log(error.stack)

        return null
    }

}

// A partir d'ici, toutes les fonctions pour encoder les achat, list, etc
// le tout sur BLUR, Opensea, et toutes les autres marketplace. Cela comprend
// aussi les authentification et autres utils pour intéragir avec Reservoir et 
// les deux marketplaces.

async function authBlur(auth, settings, authorId) {

    // On définit la partie a signé de la requête
    const sign = auth.auth.items[0].data.sign.message

    // On signe la partie signé de la requête
    const signature = web3CloudflarePublic.eth.accounts.sign(sign, decrypt(settings.privateKey)).signature

    // On définit le body de la requête
    const body = auth.auth.items[0].data.post.body

    // On ajoute la signature à l'endpoint
    const endpoint = 'https://api.reservoir.tools/execute/auth-signature/v1?signature=' + signature

    // On définit les paramètres de la transaction
    const options = {
        method: 'POST',
        headers: { accept: '*/*', 'content-type': 'application/json', 'x-api-key': 'demo-api-key' },
        body: JSON.stringify(body)
    };

    return fetch(endpoint, options)
        .then(async call => {

            const response = await call.json()
            const auth = response.auth

            // On enregistre l'auth dans la DB, dans l'entrée du user.
            await infra_nft.update({ blurAuth: auth }, { where: { authorId: authorId } })

            return auth

        })
        .catch(err => {
            console.error(err)
            return null
        });

}

async function singleBuyEncode(contract, settings) {

    // On défini l'endpoint principal de reservoir pour l'achat
    const endpoint = "https://api.reservoir.tools/execute/buy/v7"

    // On définit les paramètres de la transaction
    const options = {
        method: 'POST',
        headers: { accept: '*/*', 'content-type': 'application/json', 'x-api-key': 'demo-api-key' },
        body: JSON.stringify({
            items: [
                {
                    fillType: 'trade',
                    collection: contract,
                    quantity: 1,
                }
            ],
            normalizeRoyalties: false,
            allowInactiveOrderIds: false,
            partial: false,
            skipBalanceCheck: true,
            excludeEOA: false,
            // swapProvider: 'uniswap',
            taker: isValidEthereumAddress(settings.sender) ? settings.sender : decrypt(settings.sender), // On vérifie que l'addresse est decrypt, sinon on le fait.
            blurAuth: settings.blurAuth, // Faire un code pour générer s'il n'existe pas
            usePermit: false
        })
    };


    // On fetch la réponse en fonction de l'endpoint et des options
    // du call path, en intéragissant avec reservoir.
    // On met un return devant car sinon ça ne l'attend pas.
    return fetch(endpoint, options)
        .then(async response => {

            // On transforme la réponse raw en JSON.
            const call = await response.json()

            // On vérifie s'il y'a une erreur
            const isValid = call.error && call.code ? false : true

            if (isValid) {
                // Si c'est valide, on continu

                // On se focus sur les différents steps pour commencer.
                const steps = call.steps
                const source = call.path[0].source

                // On définit si ça vient de Blur, d'Opensea ou d'une autre marketplace
                if (source === 'blur.io') {
                    // La source est BLUR

                    // On récupère le premier objet des steps qui est toujours l'execution
                    // du auth de l'addresse du BLUR.
                    const auth = steps[0]
                    const sale = steps[1]
                    const authBlurStatus = auth.items[0].status === 'complete' && sale.id === 'sale' ? true : false // BLUR auth check.

                    if (authBlurStatus) {
                        // On vérifie que le status du sign in est bien complété,
                        // sinon on renvoi un objet avec une erreur.

                        const item = call.steps.find(item => item.id === 'sale')
                        const orderId = item.items[0].orderIds[0]

                        // On définit l'objet transaction qui constitue les éléments principaux
                        // de notre transaction
                        const data = {
                            from: item.items[0].data.from,
                            to: item.items[0].data.to,
                            data: item.items[0].data.data,
                            value: parseInt(item.items[0].data.value, 16),
                            gasUsed: item.items[0].gasEstimate,
                            gasPrice: (call.fees.gas.amount.decimal * 10 ** 18) / item.items[0].gasEstimate
                        }

                        // On map le path
                        const path = call.path.map(obj => ({
                            contract: obj.contract,
                            tokenId: obj.tokenId,
                            quantity: obj.quantity,
                            price: obj.quote,
                            source: obj.source,
                            // royalties: obj.builtInFees, // On a pas besoin des royalties, c'est un achat
                        }))

                        // On map les fees qui sont prévus
                        // Il faut rechercher le gas price mais aussi les gasUsed et plus, on évite la simulation
                        const fees = {
                            eth: call.fees.gas.amount.decimal,
                            usd: call.fees.gas.amount.usd,
                        }

                        const result = {
                            status: true,
                            requestId: call.requestId,
                            orderId: orderId,
                            source: source,
                            trade: path[0],
                            transaction: data,
                            fees: fees,
                        }

                        return result


                    } else {
                        // L'auth dans BLUR n'a pas été faite. Ici on renvoie une erreur
                        // Mais possibilité d'utiliser cela pour faire un retry en générant
                        // un nouvel auth préalablement grâce à l'endpoint reservoir.
                        console.log("Pas authentifié blur...")

                        return {
                            status: false,
                            source: source,
                            code: 'auth',
                            auth: auth,
                        }
                    }




                } else if (source === 'opensea.io') {
                    // La source est Opensea

                    // On récupère le premier objet des steps qui est toujours l'execution
                    // du auth de l'addresse du BLUR.
                    const auth = steps[0]
                    const sale = steps[1]
                    const authOpenseaStatus = auth.items.length === 0 && sale.id === 'sale' ? true : false // BLUR auth check.

                    if (authOpenseaStatus) {
                        // On vérifie que le status du sign in est bien complété,
                        // sinon on renvoi un objet avec une erreur.

                        const item = call.steps.find(item => item.id === 'sale')
                        const orderId = item.items[0].orderIds[0]

                        // On définit l'objet transaction qui constitue les éléments principaux
                        // de notre transaction
                        const data = {
                            from: item.items[0].data.from,
                            to: item.items[0].data.to,
                            data: item.items[0].data.data,
                            value: parseInt(item.items[0].data.value, 16),
                            gasUsed: item.items[0].gasEstimate,
                            gasPrice: (call.fees.gas.amount.decimal * 10 ** 18) / item.items[0].gasEstimate
                        }

                        // On map le path
                        const path = call.path.map(obj => ({
                            contract: obj.contract,
                            tokenId: obj.tokenId,
                            quantity: obj.quantity,
                            price: obj.quote,
                            source: obj.source,
                            // royalties: obj.builtInFees, // On a pas besoin des royalties, c'est un achat
                        }))

                        // On map les fees qui sont prévus
                        // Il faut rechercher le gas price mais aussi les gasUsed et plus, on évite la simulation
                        const fees = {
                            eth: call.fees.gas.amount.decimal,
                            usd: call.fees.gas.amount.usd,
                        }

                        const result = {
                            status: true,
                            requestId: call.requestId,
                            orderId: orderId,
                            source: source,
                            trade: path[0],
                            transaction: data,
                            fees: fees,
                        }

                        return result


                    } else {
                        // L'auth dans BLUR n'a pas été faite. Ici on renvoie une erreur
                        // Mais possibilité d'utiliser cela pour faire un retry en générant
                        // un nouvel auth préalablement grâce à l'endpoint reservoir.
                        console.log("Pas authentifié opensea...")

                        return {
                            status: false,
                            source: source,
                            code: 'auth',
                            auth: auth,
                        }
                    }

                } else {

                    console.log("Marketplace non supporté...")

                    return {
                        status: false,
                        code: 'marketplace',
                    }

                }

            } else {
                // On vérifie si le problème est que le user n'a pas les ETH
                const hasFund = call.errors.length > 0 && call.errors[0].message === 'Blur error: Insufficient funds' ? false : true
                if (!hasFund) {
                    // Le user n'a pas assez de fond
                    return {
                        status: false,
                        code: 'eth-funds',
                    }
                } else {
                    // C'est une erreur quelquonque
                    return {
                        status: false,
                        code: 'error',
                    }
                }
            }

        })
        .catch(err => {
            console.error(err)
            return {
                status: false,
                code: 'error',
            }
        });
}


async function snipeBuyEncode(contract, tokenId, settings) {

    // On défini l'endpoint principal de reservoir pour l'achat
    const endpoint = "https://api.reservoir.tools/execute/buy/v7"

    // On définit les paramètres de la transaction
    const options = {
        method: 'POST',
        headers: { accept: '*/*', 'content-type': 'application/json', 'x-api-key': 'demo-api-key' },
        body: JSON.stringify({
            items: [
                {
                    fillType: 'trade',
                    token: `${contract}:${tokenId}`,
                    quantity: 1
                }
            ],
            normalizeRoyalties: false,
            allowInactiveOrderIds: false,
            partial: false,
            skipBalanceCheck: true,
            excludeEOA: false,
            taker: isValidEthereumAddress(settings.sender) ? settings.sender : decrypt(settings.sender), // On vérifie que l'addresse est decrypt, sinon on le fait.
            blurAuth: settings.blurAuth, // Faire un code pour générer s'il n'existe pas
            usePermit: false
        })
    };

    // On fetch la réponse en fonction de l'endpoint et des options
    // du call path, en intéragissant avec reservoir.
    // On met un return devant car sinon ça ne l'attend pas.
    return fetch(endpoint, options)
        .then(async response => {

            // On transforme la réponse raw en JSON.
            const call = await response.json()

            // On vérifie s'il y'a une erreur
            const isValid = call.error && call.code ? false : true

            if (isValid) {
                // Si c'est valide, on continu

                // On se focus sur les différents steps pour commencer.
                const steps = call.steps
                const source = call.path[0].source

                // On définit si ça vient de Blur, d'Opensea ou d'une autre marketplace
                if (source === 'blur.io') {
                    // La source est BLUR

                    // On récupère le premier objet des steps qui est toujours l'execution
                    // du auth de l'addresse du BLUR.
                    const auth = steps[0]
                    const sale = steps[1]
                    const authBlurStatus = auth.items[0].status === 'complete' && sale.id === 'sale' ? true : false // BLUR auth check.


                    if (authBlurStatus) {
                        // On vérifie que le status du sign in est bien complété,
                        // sinon on renvoi un objet avec une erreur.

                        const item = call.steps.find(item => item.id === 'sale')
                        const orderId = item.items[0].orderIds[0]

                        // On définit l'objet transaction qui constitue les éléments principaux
                        // de notre transaction
                        const data = {
                            from: item.items[0].data.from,
                            to: item.items[0].data.to,
                            data: item.items[0].data.data,
                            value: parseInt(item.items[0].data.value, 16),
                            gasUsed: item.items[0].gasEstimate,
                            gasPrice: (call.fees.gas.amount.decimal * 10 ** 18) / item.items[0].gasEstimate
                        }

                        // On map le path
                        const path = call.path.map(obj => ({
                            contract: obj.contract,
                            tokenId: obj.tokenId,
                            quantity: obj.quantity,
                            price: obj.quote,
                            source: obj.source,
                            // royalties: obj.builtInFees, // On a pas besoin des royalties, c'est un achat
                        }))

                        // On map les fees qui sont prévus
                        // Il faut rechercher le gas price mais aussi les gasUsed et plus, on évite la simulation
                        const fees = {
                            eth: call.fees.gas.amount.decimal,
                            usd: call.fees.gas.amount.usd,
                        }

                        const result = {
                            status: true,
                            requestId: call.requestId,
                            orderId: orderId,
                            source: source,
                            trade: path[0],
                            transaction: data,
                            fees: fees,
                        }

                        return result


                    } else {
                        // L'auth dans BLUR n'a pas été faite. Ici on renvoie une erreur
                        // Mais possibilité d'utiliser cela pour faire un retry en générant
                        // un nouvel auth préalablement grâce à l'endpoint reservoir.
                        console.log("Pas authentifié blur...")

                        return {
                            status: false,
                            source: source,
                            code: 'auth',
                            auth: auth,
                        }
                    }




                } else if (source === 'opensea.io') {
                    // La source est Opensea

                    // On récupère le premier objet des steps qui est toujours l'execution
                    // du auth de l'addresse du BLUR.
                    const auth = steps[0]
                    const sale = steps[1]
                    const authOpenseaStatus = auth.items.length === 0 && sale.id === 'sale' ? true : false // BLUR auth check.

                    if (authOpenseaStatus) {
                        // On vérifie que le status du sign in est bien complété,
                        // sinon on renvoi un objet avec une erreur.

                        const item = call.steps.find(item => item.id === 'sale')
                        const orderId = item.items[0].orderIds[0]

                        // On définit l'objet transaction qui constitue les éléments principaux
                        // de notre transaction
                        const data = {
                            from: item.items[0].data.from,
                            to: item.items[0].data.to,
                            data: item.items[0].data.data,
                            value: parseInt(item.items[0].data.value, 16),
                            gasUsed: item.items[0].gasEstimate,
                            gasPrice: (call.fees.gas.amount.decimal * 10 ** 18) / item.items[0].gasEstimate
                        }

                        // On map le path
                        const path = call.path.map(obj => ({
                            contract: obj.contract,
                            tokenId: obj.tokenId,
                            quantity: obj.quantity,
                            price: obj.quote,
                            source: obj.source,
                            // royalties: obj.builtInFees, // On a pas besoin des royalties, c'est un achat
                        }))

                        // On map les fees qui sont prévus
                        // Il faut rechercher le gas price mais aussi les gasUsed et plus, on évite la simulation
                        const fees = {
                            eth: call.fees.gas.amount.decimal,
                            usd: call.fees.gas.amount.usd,
                        }

                        const result = {
                            status: true,
                            requestId: call.requestId,
                            orderId: orderId,
                            source: source,
                            trade: path[0],
                            transaction: data,
                            fees: fees,
                        }

                        return result


                    } else {
                        // L'auth dans BLUR n'a pas été faite. Ici on renvoie une erreur
                        // Mais possibilité d'utiliser cela pour faire un retry en générant
                        // un nouvel auth préalablement grâce à l'endpoint reservoir.
                        console.log("Pas authentifié opensea...")

                        return {
                            status: false,
                            source: source,
                            code: 'auth',
                            auth: auth,
                        }
                    }

                } else {

                    console.log("Marketplace non supporté...")

                    return {
                        status: false,
                        code: 'marketplace',
                    }
                }

            } else {
                // On vérifie si le problème est que le token n'est pas listé
                const isListed = call.message === 'Unable to fill requested quantity' ? false : true
                const hasFund = call.errors.length > 0 && call.errors[0].message === 'Blur error: Insufficient funds' ? false : true
                if (!isListed) {
                    // Le token n'est pas listé, on renvoi une erreur avec un code
                    return {
                        status: false,
                        code: 'listingAvailability',
                        token: tokenId
                    }
                } else if (!hasFund) {
                    // Le user n'a pas assez de fond
                    return {
                        status: false,
                        code: 'eth-funds',
                    }
                } else {
                    // C'est une erreur quelquonque
                    return {
                        status: false,
                        code: 'error',
                    }
                }
            }

        })
        .catch(err => {
            console.error(err)
            return {
                status: false,
                code: 'error',
            }
        });

}

async function singleListingEncode(order, settings) {

    // On définit l'endpoint de base
    const endpoint = 'https://api.reservoir.tools/execute/list/v5'

    // On récupère les data des marketplace pour fournir les bonnes valeurs
    const source = markets.find(i => i.id === order.source)

    const options = {
        method: 'POST',
        headers: { accept: '*/*', 'content-type': 'application/json', 'x-api-key': 'demo-api-key' },
        body: JSON.stringify({
            params: [
                {
                    orderKind: source.orderkind,
                    orderbook: source.orderbook,
                    automatedRoyalties: true,
                    currency: source.currency, // La currency donc ETH
                    token: `${order.trade.contract}:${order.trade.tokenId}`, // token
                    weiPrice: web3CloudflarePublic.utils.toWei(order.trade.price.toString(), 'ether'), // Le prix en wei
                    expirationTime: order.trade.expire.toString(), // L'expiration du listing
                    // royaltyBps: 0 // les royalties, minimum 50 sur OS
                }
            ],
            maker: isValidEthereumAddress(settings.sender) ? settings.sender : decrypt(settings.sender), // On vérifie que l'addresse est decrypt, sinon on le fait.
            blurAuth: settings.blurAuth
        })
    };

    // On fait le fetch
    return fetch(endpoint, options)
        .then(async response => {

            const call = await response.json()

            if (source.id === 'blur.io') {
                // La source est Blur

                // On récupère les différents steps, sachant que Blur contient en plus un auth
                // mais que ce auth est bypass si on a le Blur auth à l'avance en entrée.
                const steps = call.steps
                const auth = steps[0]
                const approval = steps[1]
                const listing = steps[2]

                // On vérifie que le auth est complet
                const authBlurStatus = auth.items.length === 0 || auth.items[0].status === 'complete' ? true : false
                const approvalBlurStatus = approval.items.length === 0 || approval.items[0].status === 'complete' ? true : false

                // On vérifie que le user est bien auth dans Blur
                if (authBlurStatus) {

                    // On vérifie que le user a bien approve la collection
                    if (approvalBlurStatus) {

                        // On définit les valeurs retourné par l'API
                        const signObject = listing.items[0].data.sign
                        const body = listing.items[0].data.post.body

                        // On signe le message à signé
                        const signed = await signTypedData(signObject, decrypt(settings.privateKey))

                        // On ajoute les éléments à l'objet trade de base
                        order.order.sign = signObject
                        order.order.body = body
                        order.order.signature = signed

                        // On turn le status à true
                        order.status = true

                        return order

                    } else {
                        // La collection n'est pas approved. Il faudrait mettre une fonction qui renvoi
                        // cela à l'utilisateur pour permet de faire un setApprovalForAll.
                        console.log("Pas d'approval...")

                        return {
                            status: false,
                            source: source,
                            code: 'approval',
                            auth: approval,
                        }
                    }

                } else {
                    // L'auth dans BLUR n'a pas été faite. Ici on renvoie une erreur
                    // Mais possibilité d'utiliser cela pour faire un retry en générant
                    // un nouvel auth préalablement grâce à l'endpoint reservoir.
                    console.log("Pas authentifié...")

                    return {
                        status: false,
                        source: source,
                        code: 'auth',
                        auth: auth,
                    }
                }

            } else if (source.id === 'opensea.io') {

                const steps = call.steps
                const approval = steps[0]
                const listing = steps[1]

                // On récupère le status d'approval
                const approvalOpenseaStatus = approval.items.length === 0 || approval.items[0].status === 'complete' ? true : false

                // On vérifie que le user a bien approve la collection
                if (approvalOpenseaStatus) {

                    // On définit les valeurs retourné par l'API
                    const signObject = listing.items[0].data.sign
                    const body = listing.items[0].data.post.body

                    // On signe le message à signé
                    const signed = await signTypedData(signObject, decrypt(settings.privateKey))

                    // On ajoute les éléments à l'objet trade de base
                    order.order.sign = signObject
                    order.order.body = { items: [body] }
                    order.order.signature = signed

                    // On turn le status à true
                    order.status = true

                    return order

                } else {
                    // La collection n'est pas approved. Il faudrait mettre une fonction qui renvoi
                    // cela à l'utilisateur pour permet de faire un setApprovalForAll.
                    console.log("Pas d'approval...")

                    return {
                        status: false,
                        source: source,
                        code: 'approval',
                        auth: approval,
                    }
                }

            } else {
                console.log("Marketplace non supporté...")
                return {
                    status: false,
                    code: 'marketplace',
                }
            }
        })
        .catch(err => {
            console.error(err)
            return {
                status: false,
                code: 'error',
            }
        });


}


async function acceptSingleBidEncode(token, settings) {

    // On définit l'endpoint de base
    const endpoint = 'https://api.reservoir.tools/execute/sell/v7'
    // `${token.contract}:${token.id}`

    const options = {
        method: 'POST',
        headers: { accept: '*/*', 'content-type': 'application/json', 'x-api-key': 'demo-api-key' },
        body: JSON.stringify({
            items: [
                {
                    quantity: 1,
                    token: `${token.token.contract}:${token.token.tokenId}`,
                    exactOrderSource: token.bid.source,
                }
            ],
            onlyPath: false,
            normalizeRoyalties: false,
            excludeEOA: false,
            allowInactiveOrderIds: false,
            partial: false,
            forceRouter: false,
            taker: isValidEthereumAddress(settings.sender) ? settings.sender : decrypt(settings.sender), // On vérifie que l'addresse est decrypt, sinon on le fait.
            blurAuth: settings.blurAuth
        })
    };


    // On fait le fetch
    return fetch(endpoint, options)
        .then(async response => {

            // On transforme la réponse raw en JSON.
            const call = await response.json()

            // On vérifie s'il y'a une erreur
            const isValid = call.error && call.code ? false : true

            if (isValid) {
                // Si c'est valide, on continu

                // On se focus sur les différents steps pour commencer.
                const steps = call.steps
                const source = call.path[0].source

                // On définit si ça vient de Blur, d'Opensea ou d'une autre marketplace
                if (source === 'blur.io') {
                    // La source est BLUR

                    // On récupère le premier objet des steps qui est toujours l'execution
                    // du auth de l'addresse du BLUR.
                    const auth = steps[0]
                    const approval = steps[1]
                    const item = steps[2]

                    const authBlurStatus = auth.items.length === 0 || auth.items[0].status === 'complete' ? true : false // BLUR auth check.
                    const approvalBlurStatus = approval.items.length === 0 || approval.items[0].status === 'complete' ? true : false // BLUR approval check.
                    // Bloc de développement

                    if (authBlurStatus) {
                        // On vérifie que le status du sign in est bien complété,
                        // sinon on renvoi un objet avec une erreur.

                        if (approvalBlurStatus) {
                            // L'approval a été fait donc on peut continuer

                            const orderId = call.path[0].orderId

                            // On définit l'objet transaction qui constitue les éléments principaux
                            // de notre transaction
                            const data = {
                                from: item.items[0].data.from,
                                to: item.items[0].data.to,
                                data: item.items[0].data.data,
                                value: 0,
                            }

                            // On map le path
                            const path = call.path.map(obj => ({
                                contract: obj.contract,
                                tokenId: obj.tokenId,
                                quantity: obj.quantity,
                                price: obj.quote,
                                source: obj.source,
                                // royalties: obj.builtInFees, // On a pas besoin des royalties, c'est un achat
                            }))

                            // On définira les différentes data de gas lors de la simulation que l'on va faire juste après
                            const gas = {
                                limit: null,
                                price: null,
                                expected: null,
                            }

                            const result = {
                                status: true,
                                requestId: call.requestId,
                                orderId: orderId,
                                source: source,
                                trade: path[0],
                                transaction: data,
                                gas: gas,
                            }

                            return result

                        } else {
                            // La collection n'est pas approved. Il faudrait mettre une fonction qui renvoi
                            // cela à l'utilisateur pour permet de faire un setApprovalForAll.
                            console.log("Pas d'approval...")

                            return {
                                status: false,
                                source: source,
                                code: 'approval',
                                auth: approval,
                            }
                        }

                    } else {
                        // L'auth dans BLUR n'a pas été faite. Ici on renvoie une erreur
                        // Mais possibilité d'utiliser cela pour faire un retry en générant
                        // un nouvel auth préalablement grâce à l'endpoint reservoir.
                        console.log("Pas authentifié blur...")

                        return {
                            status: false,
                            source: source,
                            code: 'auth',
                            auth: auth,
                        }
                    }




                } else if (source === 'opensea.io') {
                    // La source est Opensea

                    // On récupère le premier objet des steps qui est toujours l'execution
                    // du auth de l'addresse du BLUR.
                    const auth = steps[0]
                    const sale = steps[1]
                    const authOpenseaStatus = auth.items.length === 0 && sale.id === 'sale' ? true : false // BLUR auth check.

                    if (authOpenseaStatus) {
                        // On vérifie que le status du sign in est bien complété,
                        // sinon on renvoi un objet avec une erreur.

                        const item = call.steps.find(item => item.id === 'sale')
                        const orderId = item.items[0].orderIds[0]

                        // On définit l'objet transaction qui constitue les éléments principaux
                        // de notre transaction
                        const data = {
                            from: item.items[0].data.from,
                            to: item.items[0].data.to,
                            data: item.items[0].data.data,
                            value: parseInt(item.items[0].data.value, 16),
                            gasUsed: item.items[0].gasEstimate,
                            gasPrice: (call.fees.gas.amount.decimal * 10 ** 18) / item.items[0].gasEstimate
                        }

                        // On map le path
                        const path = call.path.map(obj => ({
                            contract: obj.contract,
                            tokenId: obj.tokenId,
                            quantity: obj.quantity,
                            price: obj.quote,
                            source: obj.source,
                            // royalties: obj.builtInFees, // On a pas besoin des royalties, c'est un achat
                        }))

                        // On map les fees qui sont prévus
                        // Il faut rechercher le gas price mais aussi les gasUsed et plus, on évite la simulation
                        const fees = {
                            eth: call.fees.gas.amount.decimal,
                            usd: call.fees.gas.amount.usd,
                        }

                        const result = {
                            status: true,
                            requestId: call.requestId,
                            orderId: orderId,
                            source: source,
                            trade: path[0],
                            transaction: data,
                            fees: fees,
                        }

                        return result


                    } else {
                        // L'auth dans BLUR n'a pas été faite. Ici on renvoie une erreur
                        // Mais possibilité d'utiliser cela pour faire un retry en générant
                        // un nouvel auth préalablement grâce à l'endpoint reservoir.
                        console.log("Pas authentifié opensea...")

                        return {
                            status: false,
                            source: source,
                            code: 'auth',
                            auth: auth,
                        }
                    }

                } else {

                    console.log("Marketplace non supporté...")

                    return {
                        status: false,
                        code: 'marketplace',
                    }

                }

            } else {
                return {
                    status: false,
                    code: 'error',
                }
            }
        })
        .catch(err => {
            console.error(err)
            return {
                status: false,
                code: 'error',
            }
        });
}

// acceptSingleBidEncode(
//     { contract: "0x704bf12276f5c4bc9349d0e119027ead839b081b", id: "5265" },
//     { sender: "0x34bbf3b83F82342F16AC3C5d7D3256F9BE9441bc",  },
//     //'blur.io'
// )

async function createCollectionBidEncode(bid, settings) {

    // On définit l'endpoint de base
    const endpoint = 'https://api.reservoir.tools/execute/bid/v5'

    // On récupère les data des marketplace pour fournir les bonnes valeurs
    const market = markets.find(i => i.id === bid.source)

    const options = {
        method: 'POST',
        headers: { accept: '*/*', 'content-type': 'application/json', 'x-api-key': 'demo-api-key' },
        body: JSON.stringify({
            params: [
                {
                    orderKind: market.orderkind,
                    orderbook: market.orderbook,
                    automatedRoyalties: true,
                    excludeFlaggedTokens: true,
                    currency: market.pool,
                    collection: bid.trade.contract,
                    weiPrice: web3CloudflarePublic.utils.toWei(bid.trade.price.toString(), 'ether'), // Le prix en wei,
                    expirationTime: bid.trade.expire.toString(),
                    quantity: bid.trade.quantity
                }
            ],
            maker: isValidEthereumAddress(settings.sender) ? settings.sender : decrypt(settings.sender), // On vérifie que l'addresse est decrypt, sinon on le fait.
            blurAuth: settings.blurAuth
        })
    }

    // On fait le fetch
    return fetch(endpoint, options)
        .then(async response => {

            // On parle le JSON de la réponse
            const call = await response.json()

            // On vérifie la balance
            const isBalance = call.code === 12 && call.errors[0].message === 'Maker does not have sufficient balance' ? false : true

            if (isBalance) {
                // Le user a assez de balance
                // On se focus sur les différents steps pour commencer.
                const steps = call.steps
                const source = market.id

                // On définit si ça vient de Blur, d'Opensea ou d'une autre marketplace
                if (source === 'blur.io') {
                    // La source est BLUR

                    // On récupère le premier objet des steps qui est toujours l'execution
                    // du auth de l'addresse du BLUR.
                    const auth = steps[0]
                    const wrap = steps[1]
                    const approval = steps[2]
                    const order = steps[steps.length - 1]

                    // On fait les deux verifications : auth & wrap (normalement, wrap est toujours bon)
                    const authBlurStatus = auth.items.length === 0 || auth.items[0].status === 'complete' ? true : false // BLUR auth check.
                    const wrapBlurStatus = wrap.items.length === 0 || wrap.items[0].status === 'complete' ? true : false
                    const approvalBlurStatus = approval.items.length === 0 || approval.items[0].status === 'complete' ? true : false

                    if (authBlurStatus) {

                        // On vérifie que le user a bien approve la collection
                        if (wrapBlurStatus) {

                            if (approvalBlurStatus) {

                                // On définit les valeurs retourné par l'API
                                const signObject = order.items[0].data.sign
                                const body = order.items[0].data.post.body

                                // On signe le message à signé
                                const signed = await signTypedData(signObject, decrypt(settings.privateKey))

                                // On ajoute les éléments à l'objet trade de base
                                bid.order.sign = signObject
                                bid.order.body = body
                                bid.order.signature = signed

                                // On turn le status à true
                                bid.status = true

                                return bid

                            } else {
                                // Le wrap dans OS n'a pas été faite. Ici on renvoie une erreur
                                // Mais possibilité d'utiliser cela pour faire un retry en générant
                                // un nouvel auth préalablement grâce à l'endpoint reservoir.
                                console.log("Pas d'approval sur le wrap blur...")

                                return {
                                    status: false,
                                    source: source,
                                    code: 'wrap-approval',
                                    auth: approval,
                                }
                            }

                        } else {
                            // La collection n'est pas approved. Il faudrait mettre une fonction qui renvoi
                            // cela à l'utilisateur pour permet de faire un setApprovalForAll.
                            console.log("Pas de wrap...")

                            return {
                                status: false,
                                source: source,
                                code: 'wrap',
                                auth: wrap,
                            }
                        }

                    } else {
                        // L'auth dans BLUR n'a pas été faite. Ici on renvoie une erreur
                        // Mais possibilité d'utiliser cela pour faire un retry en générant
                        // un nouvel auth préalablement grâce à l'endpoint reservoir.
                        console.log("Pas authentifié blur...")

                        return {
                            status: false,
                            source: source,
                            code: 'auth',
                            auth: auth,
                        }
                    }

                } else if (source === 'opensea.io') {

                    // du auth de l'addresse du BLUR.
                    const wrap = steps[0]
                    const approval = steps[1]
                    const auth = steps[2]
                    const order = steps[steps.length - 1]

                    const wrapOpenseaStatus = wrap.items.length === 0 || wrap.items[0].status === 'complete' ? true : false // OS wrap check.
                    const approvalOpenseaStatus = approval.items.length === 0 || approval.items[0].status === 'complete' ? true : false // OS wrap approval check.
                    const authOpenseaStatus = auth.items.length === 0 || auth.items[0].status === 'complete' ? true : false // OS auth check.

                    if (wrapOpenseaStatus) {

                        if (approvalOpenseaStatus) {

                            if (authOpenseaStatus) {

                                // On définit les valeurs retourné par l'API
                                const signObject = order.items[0].data.sign
                                const body = order.items[0].data.post.body

                                // On signe le message à signé
                                const signed = await signTypedData(signObject, decrypt(settings.privateKey))

                                // On ajoute les éléments à l'objet trade de base
                                bid.order.sign = signObject
                                bid.order.body = { items: [body] }
                                bid.order.signature = signed

                                // On turn le status à true
                                bid.status = true

                                return bid

                            } else {
                                // L'auth dans BLUR n'a pas été faite. Ici on renvoie une erreur
                                // Mais possibilité d'utiliser cela pour faire un retry en générant
                                // un nouvel auth préalablement grâce à l'endpoint reservoir.
                                console.log("Pas authentifié opensea...")

                                return {
                                    status: false,
                                    source: source,
                                    code: 'auth',
                                    auth: auth,
                                }
                            }

                        } else {
                            // Le wrap dans OS n'a pas été faite. Ici on renvoie une erreur
                            // Mais possibilité d'utiliser cela pour faire un retry en générant
                            // un nouvel auth préalablement grâce à l'endpoint reservoir.
                            console.log("Pas d'approval sur le wrap opensea...")

                            return {
                                status: false,
                                source: source,
                                code: 'wrap-approval',
                                auth: approval,
                            }
                        }

                    } else {
                        // Le wrap dans OS n'a pas été faite. Ici on renvoie une erreur
                        // Mais possibilité d'utiliser cela pour faire un retry en générant
                        // un nouvel auth préalablement grâce à l'endpoint reservoir.
                        console.log("Pas wrapped opensea...")

                        return {
                            status: false,
                            source: source,
                            code: 'wrap',
                            auth: wrap,
                        }
                    }
                }

            } else {
                // Il y'a une erreur, la balance n'est pas suffisante
                // On peut faire une implémentation pour proposer un swap.
                return {
                    status: false,
                    code: 'balance'
                }
            }

        })
        .catch(err => {
            console.error(err)
            return {
                status: false,
                code: 'error',
            }
        });
}

async function signTypedData(data, pk) {

    const walletClient = new ethers.Wallet(pk);

    const signature = await walletClient.signTypedData(data.domain, data.types, data.value);

    return signature

}


async function postOrder(data, signature) {

    const endpoint = 'https://api.reservoir.tools/order/v4?signature=' + signature

    const options = {
        method: 'POST',
        headers: { accept: '*/*', 'content-type': 'application/json', 'x-api-key': 'demo-api-key' },
        body: JSON.stringify(data)
    };

    // On fait le fetch
    return fetch(endpoint, options)
        .then(async response => {

            // On parse la réponse
            const call = await response.json()

            // On définit le résultat
            const result = {
                status: call.results[0].message === 'success' ? true : false,
                orderId: call.results[0].orderId,
                checker: call.results[0].crossPostingOrderId
            }

            // Retourne le résultat
            return result
        })
        .catch(err => {
            console.error(err)
            return {
                status: false,
                code: 'error',
            }
        });

}

async function getSettings(authorId) {

    const settings = await infra_nft.findOne({ where: { authorId: authorId } })

    if (settings !== null) {

        const result = {
            sender: settings.dataValues.walletAddress,
            privateKey: settings.dataValues.privateKey,
            gas_preset: settings.dataValues.gas_preset,
            max_gwei: settings.dataValues.max_gwei,
            ape_mode: settings.dataValues.ape_mode,
            blurAuth: settings.dataValues.blurAuth
        }

        return result

    } else {
        return false
    }
}

function isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}


function encodeListingRoot(listing) {

    const dataToHash = web3CloudflarePublic.eth.abi.encodeParameters(
        ['uint256', 'uint256', 'uint256', 'uint256'],
        [listing.index, listing.tokenId, listing.amount, listing.price]
    );

    return web3CloudflarePublic.utils.soliditySha3(dataToHash);

}

async function getListedTokensByCollection(contract, address) {

    try {
        // On commence par définir les différentes valeurs liés aux tokens.
        // Puis, on call l'endpoint et récupère les data importantes.
        // Pour cela on fait une boucle et on ajoute une page s'il y'en a une par une boucle while.
        // On définit les valeurs de base
        let tokens = [];
        let page = 1;

        // On définit l'endpoint qu'on call en boucle dans le while.
        // Puis on continu en récupérant tous les tokens en un tableau
        while (page) {
            const endpoint = `https://api.chainbase.online/v1/account/nfts?chain_id=1&address=${address}&contract_address=${contract}&page=${page}&limit=100`
            const result = await axios.get(endpoint, { headers: chainbaseHead })
            const localTokens = result.data.data
            page = result.data.next_page ? result.data.next_page : false

            // On vérifie qu'il y'a bien des tokens
            if (localTokens !== null && localTokens.length > 0) {
                // Il y'en a effectivement, on ajoute le token
                // mais on prend que certaines data qu'on formatte.
                tokens = tokens.concat(localTokens.sort((a, b) => b.rarity_rank - a.rarity_rank).map(item => ({
                    token: {
                        name: item.name,
                        contract: item.contract_address,
                        tokenId: parseInt(item.token_id),
                        rarity: item.rarity_rank != null ? item.rarity_rank : "-",
                    },
                    listing: null
                })));
            } else {
                // On sort de la boucle, pas de token.
                break;
            }
        }


        // On vérifie qu'il y'a bien des tokens de cette 
        // collection dans le wallet du user.
        if (tokens.length > 0) {

            // On a la liste des tokens, maintenant il faut réussir a call les tokens listé
            // par Reservoir pour pouvoir ajouter leur data de listing.
            const endpoint = `https://api.reservoir.tools/orders/asks/v5?maker=${address}&contracts=${contract}&sortBy=price&limit=1000`
            const orders = await axios.get(endpoint, { headers: reservoirHead })
            const localListing = orders.data.orders

            // On fait la boucle qui place les listing pour chaque token
            for (const listing of localListing) {

                // On définit les data principales pour trouver l'objet.
                // Puis on cherche l'objet.
                const localTokenId = parseInt(listing.criteria.data.token.tokenId)
                const object = tokens.find(i => i.token.tokenId === localTokenId)

                // On vérifie que l'objet est bien présent
                // S'il ne l'ai pas, alors on passe le token
                if (object) {
                    // Si l'objet est présent, on ajoute les datas correspondantes
                    tokens.find(i => i.token.tokenId === localTokenId).listing = {
                        price: listing.price.amount.decimal,
                        currency: listing.price.currency.contract,
                        source: listing.source.name,
                        fees: listing.feeBps,
                        root: listing.id
                    }

                }
            }

            // On formatte le tableau afin qu'il soit parfait.
            // Aussi, on rajoute des datas global 
            const result = {
                count: tokens.length,
                listed: tokens.filter(i => i.listing !== null).length,
                data: tokens.sort((a, b) => a.token.tokenId - b.token.tokenId)
            }

            return result

        } else {
            // On retourne le compte de token et le nombre
            // de personne listé.
            return {
                count: 0,
                listed: 0,
                data: []
            }
        }

    } catch (error) {
        console.log(error.stack)
        return null
    }
}

async function getBiddedTokensByCollection(contract, address) {

    try {
        // On commence par définir les différentes valeurs liés aux tokens.
        // Puis, on call l'endpoint et récupère les data importantes.
        // Pour cela on fait une boucle et on ajoute une page s'il y'en a une par une boucle while.
        // On définit les valeurs de base
        let tokens = [];
        let pageKey = "0"; // La page key est une clé ici, pas une pagination

        // On définit l'endpoint qu'on call en boucle dans le while.
        // Puis on continu en récupérant tous les tokens en un tableau
        while (pageKey) {
            const endpoint = `https://api.reservoir.tools/orders/users/${address}/top-bids/v4?collection=${contract}&limit=100&sortBy=topBidValue&continuation=${pageKey}`
            const result = await axios.get(endpoint, { headers: reservoirHead })
            const bids = result.data.topBids
            pageKey = result.data.continuation ? result.data.continuation : false


            // On vérifie qu'il y'a bien des bids
            if (bids.length > 0) {
                // Il y'en a effectivement, on ajoute le token
                // mais on prend que certaines data qu'on formatte.
                tokens = tokens.concat(bids.map(item => ({
                    token: {
                        name: item.token.collection.name,
                        tokenId: parseInt(item.token.tokenId),
                        contract: item.token.contract.toLowerCase()
                    },
                    bid: {
                        price: item.price.amount.decimal,
                        netPrice: item.price.netAmount.decimal,
                        gap: item.floorDifferencePercentage,
                        source: item.source.domain,
                        orderId: item.id
                    }
                })));
            } else {
                // On sort de la boucle, pas de token.
                break;
            }
        }

        // On met le résultat ici
        const result = {
            count: tokens.length,
            data: tokens
        }

        return result

    } catch (error) {
        console.log(error.stack)
        return null
    }
}

async function isApprovedForAll(contract, address, market) {

    try {

        // ABI de la fonction
        const abi = [erc721.find(i => i.name === 'isApprovedForAll')]

        // On recherche la source
        const source = markets.find(i => i.id === market)
        const delegate = source.delegate

        // On crée l'instance du contrat
        const CInstance = new web3CloudflarePublic.eth.Contract(abi, contract);

        // On call la fonction du contrat
        const isApproved = await CInstance.methods.isApprovedForAll(address, delegate).call()

        // On formatte le résultat
        const result = typeof isApproved === 'boolean' ? isApproved : null

        return result

    } catch (error) {
        console.log(error.stack)
        return null
    }
}

function encodeSetApprovalForAll(source, approve) {

    // On réunit les types à partir de l'ABI ERC721
    // et on récupère la signature
    const sig = "0xa22cb465"
    const inputs = erc721.find(i => i.name === 'setApprovalForAll').inputs // .map(i => i.type) pour map les types seulement
    const operator = markets.find(i => i.id === source).delegate


    // On encode les params
    const params = web3CloudflarePublic.eth.abi.encodeParameters(inputs, [operator, approve]);

    // On ajoute la signature au résultat
    const result = sig + params.slice(2)

    return result
}

async function getPoolBalance(address, market) {

    try {

        // On définit la source et les infos de son token de pool
        const source = markets.find(i => i.id === market)
        const pool = source.pool
        const decimals = source.poolDecimals

        // On définit l'endpoint
        const endpoint = `https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=${pool}&address=${address}&tag=latest&apikey=${etherscanApiKey}`

        // On fait le call
        const raw = await axios.get(endpoint)

        if (raw.data.status === '1') {

            // On formatte à la décimals
            const result = parseInt(raw.data.result) / 10 ** decimals

            // On retourne le résultat
            return result

        } else {
            // Le code est mauvais, on renvoi 0
            return 0
        }

    } catch (error) {
        // Erreur, on renvoi 0
        return 0
    }
}

function encodePoolWrapData(market) {

    const source = markets.find(i => i.id === market)

    // On cherche la source
    if (market === 'blur.io') {

        // Id de la fonction et contrat d'arrivé
        const data = "0xd0e30db0"
        const to = source.pool.toLowerCase()
        const gasLimit = 60000 // Moyenne haute des gas limit

        // On construit l'objet du résultat
        const result = {
            data: data,
            to: to,
            gasLimit: gasLimit
        }

        // On retourne le résultat
        return result

    } else if (market === 'opensea.io') {

        // Id de la fonction et contrat d'arrivé
        const data = "0xd0e30db0"
        const to = source.pool.toLowerCase()
        const gasLimit = 60000 // Moyenne haute des gas limit

        // On construit l'objet du résultat
        const result = {
            data: data,
            to: to,
            gasLimit: gasLimit
        }

        // On retourne le résultat
        return result
    }

}


async function getEthBalance(address) {
    // On envoi le call
    const raw = await web3CloudflarePublic.eth.getBalance(address)

    // On formatte la balance
    const balance = web3CloudflarePublic.utils.fromWei(raw.toString(), 'ether') // Le prix en wei,

    // On retourne la balance
    return parseFloat(balance)
}

async function isOwner(contract, tokenId, address) {

    // On réunit les types à partir de l'ABI ERC721
    // et on récupère la signature

    try {

        // Création de l'instance des contrats
        const abi = erc721.find(i => i.name === 'ownerOf') // .map(i => i.type) pour map les types seulement
        const instance = new web3CloudflarePublic.eth.Contract([abi], contract);

        // On effectue le call au contrat
        const owner = await instance.methods.ownerOf(tokenId).call()

        const result = address.toLowerCase() === owner.toLowerCase() ? true : false

        return result

    } catch (error) {
        // Il hold pas le token
        return false
    }
}


module.exports = {
    getCollection,
    getBlurPortfolio,
    getPortfolio,
    getTokensByCollection,
    encodeTransfer,
    simulateTransaction,
    getGasPrice,
    signTransaction,
    singleBuyEncode,
    singleListingEncode,
    snipeBuyEncode,
    acceptSingleBidEncode,
    createCollectionBidEncode,
    getSettings,
    gasOracle,
    authBlur,
    getListedTokensByCollection,
    getBiddedTokensByCollection,
    isApprovedForAll,
    encodeSetApprovalForAll,
    postOrder,
    getPoolBalance,
    encodePoolWrapData,
    getEthBalance,
    isOwner
}



