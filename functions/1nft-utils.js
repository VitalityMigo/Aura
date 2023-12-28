//Récupérer les clefs API
const { reservoirHead } = require("../config/web3config")

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

module.exports = {
    getCollection
}
