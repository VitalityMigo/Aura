//Récupérer les clefs API
const { web3CloudflarePublic, reservoirHead, chainbaseHead, web3BaseUnifra, web3Infura } = require("../config/web3config")

const axios = require("axios")

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

    const price = await web3Infura.eth.getGasPrice()

    return {
        wei: price,
        gwei: price / 10 ** 9,
        eth: price / 10 ** 18
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

module.exports = {
    getCollection,
    getBlurPortfolio,
    getPortfolio,
    getTokensByCollection,
    encodeTransfer,
    simulateTransaction,
    getGasPrice,
    signTransaction,
}



