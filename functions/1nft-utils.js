//Récupérer les clefs API
const { web3CloudflarePublic, reservoirHead } = require("../config/web3config")

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

module.exports = {
    getCollection,
    getBlurPortfolio,
    getPortfolio,
}



