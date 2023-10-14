const axios = require("axios")

const reduceText = require("./reducetext")

async function formatHoldersData(userAddress, price, shareSupply) {

    let holdersFormattedEmbeds = ""

    try {


        const holderInfoCall = await axios.get(`https://prod-api.kosetto.com/users/${userAddress}/token/holders`, {
            timeout: 5000, // Timeout de 6 secondes
        });


        // On construit la table d'holders
        let index = 0

        for (const holders of holderInfoCall.data.users) {

            index++

            if (index <= 10) {

                let holderName = holders.twitterUsername
                let holderBalance = holders.balance
                let holderValue = holderBalance * price
                let holderRatio = parseFloat((holderBalance / shareSupply) * 100).toFixed(2)


                let part1 = "`" + reduceText(holderName, 30)
                let part2 = parseFloat(holderValue).toFixed(3) + "Ξ"
                let part3 = holderBalance + " (" + holderRatio + "%)`\n"
                // let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)

                let spaceSize = 38 - (part2).length - part1.length
                let spaceLenght = ""
                for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

                let spaceSize2 = 19 - (part3).length
                let spaceLenght2 = ""
                for (let i = 0; i < spaceSize2; i++) { spaceLenght2 += " " }




                holdersFormattedEmbeds += part1 + spaceLenght + part2 + spaceLenght2 + part3

            }


        }

        return holdersFormattedEmbeds

    } catch (error) {

        console.log("Erreur lors de la récupération des holders du user FT : " + error.stack)

        return holdersFormattedEmbeds



    }


}



async function formatTradesData(userAddress) {

    let tradersFormatted = ""

    try {


        // trade de l'auteur
        const tradeInfoCall = await axios.get(" https://prod-api.kosetto.com/users/" + userAddress + "/trade-activity", {
            timeout: 5000, // Timeout de 6 secondes
        });


        // lastTrade = parseFloat(tradeInfoCall.data.users[0].createdAt / 1000).toFixed(0)



        // On construit la table d'activité
        let index2 = 0

        for (const trade of tradeInfoCall.data.users) {

            index2++

            if (index2 <= 6) {

                let username = trade.twitterUsername
                let name = trade.twitterName

                let amount = trade.shareAmount
                let price = parseFloat(trade.ethAmount / 10 ** 18).toFixed(3)
                let time = parseFloat(trade.createdAt / 1000).toFixed(0)
                let isBuy = trade.isBuy

                let action = "🟢 Bought "
                if (isBuy == false) { action = "🔴 Sold " }

                tradersFormatted += "`" + action + amount + "` [" + reduceText(name, 18) + "](https://twitter.com/" + username + ") `for " + price + "Ξ` ∙ <t:" + time + ":R>\n"

            }
        }

        return tradersFormatted


    } catch (error) {

        

        console.log("Erreur lors de la récupération des trades du user FT : " + error.stack)

        return tradersFormatted

    }




}

module.exports = {
    formatHoldersData,
    formatTradesData
}