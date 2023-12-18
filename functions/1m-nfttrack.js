const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { tracker_nft, Op, sequelize } = require('../events/database')
const colors = require("colors")
const { getCollection } = require("./1nft-utils")
const smartmoney = require("../contracts/nft/smartmoney.json")
const isHttps = require('./isHttps')

function formatWallet(input) {
    return input.length > 35 ? `${input.substring(0, 5)}…${input.substring(input.length - 4)}` : input;
}


// On définit le client et charge les channels
const client = require('../bot'); // Chemin vers le fichier client.js

let serverId = ""
let botGuild = ""

setTimeout(() => {

    const botId = client.user.id;

    if (botId == "1074328639165964368") {
        // PROD

        serverId = "1108754348818845729"

    } else if (botId == "1119666128411709552") {
        // DEV

        serverId = "1071576735298113667"

    }

    botGuild = client.guilds.cache.get(serverId);

}, 4000);


async function nftTracker(data, traders) {


    try {

        // const fctn = data.action
        const marketplace = data.marketplace
        const hash = data.hash

        // On construit le tableaux des trades
        const makers = data.maker.filter(item => traders.includes(item.address))
        const takers = data.taker.filter(item => traders.includes(item.address))
        const trades = [...makers, ...takers]

        // On construit le tableau de collections
        const contracts = [...new Set(trades.map(obj => obj.collection))];
        const collections = await getCollection(contracts)


        // On fait la liste de ceux qui ont effectivement 
        const whereClause = {
            address: {
                [Op.in]: traders,
            },
        };

        const trackList = await tracker_nft.findAll(whereClause)


        if (trackList.length > 0) {


            for (const obj of trades) {

                // On récupère les valeurs
                const address = obj.address.toLowerCase()
                const contract = obj.collection.toLowerCase()
                const value = obj.value
                const amount = obj.amount
                const isBuy = obj.isBuy

                // On formatte
                let action = "📈 Buy"
                if (isBuy == false) { action = "📉 Sell" }

                // On recherche la collection dans le tableau
                const collection = collections.find(item => item.contract === contract)
                const name = collection.name
                const supply = collection.supply
                const image = collection.banner
                const floor = collection.floor
                const change1D = collection.change1D
                const links = collection.links



                // On formatte les data du trade
                const formattedData = "Amount: " + amount + "\nValue: " + parseFloat(value).toFixed(3) + "Ξ                                                                      "
                const formattedMetrics = "Floor: `" + parseFloat(floor).toFixed(3) + "Ξ`\n1D: `" + prettierChange(change1D) + "`\nMarket: " + prettyMarketplace(marketplace)

                // On récupère les links
                const formattedLinks = createLink(links)


                // const buttonsRow = new ActionRowBuilder()
                //     .addComponents(
                //         new ButtonBuilder()
                //             .setCustomId('button_nft_openpanel_' + contract)
                //             .setLabel('📊 Trade Panel')
                //             .setStyle(1),
                //     );

              

                const userFTEmbed = new EmbedBuilder().setColor("#010616")
                    .setTitle(name)
                    .setDescription(">>> A new trade has been detected")
                    .setImage("https://cdn.discordapp.com/attachments/1100572519896977490/1185619758008254474/e.png?ex=65904572&is=657dd072&hm=7a51469cad88b48198c5f230d13450d50c7e2717c5acdf97a82a6eb1fb5adad4&")
                    .setTimestamp()
                    .addFields(
                        { name: " ", value: " ", inline: false },
                        { name: "From", value: "[" + formatWallet(address) + "](https://etherscan.io/address/" + address + ")", inline: true },
                        { name: "Action", value: "`" + action + "`", inline: true },
                        { name: "Metrics", value: formattedMetrics, inline: true },
                        { name: "Trade", value: "```js\n" + formattedData + "```", inline: false },
                        //  { name: " ", value: " ", inline: true },
                        //{ name: "Transaction", value: "```" + hash + "```", inline: true },
                        { name: "Links", value: formattedLinks, inline: false }

                    )
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                // On envoi les embeds
                const trackedAuthor = trackList.filter(item => item.dataValues.address.toLowerCase() == address).map(item => item.dataValues.authorId)
                for (const author of trackedAuthor) {

                    try {

                        const member = await botGuild.members.fetch(author);


                        await member.send({ embeds: [userFTEmbed], components: [] });

                    } catch (error) {

                        console.log("Impossible d'envoyer le tracker dans les DMs du user: " + error.stack)
                    }

                }

            }

        }

        // C'est un approval











    } catch (error) {

        console.log("Erreur global wallet tracker: " + error.stack)
    }

}

module.exports = nftTracker



function createLink(links) {

    let baseLinks = '[opensea](https://opensea.io/collection/' + links.slug + ') ∙ ' +
        '[blur](https://blur.io/collection/' + links.contract + ') ∙ ' +
        '[magically](https://magically.gg/collection/' + links.contract + ') ∙ ' +
        '[nerds](https://magically.gg/collection/' + links.contract + ') ∙ ' +
        //'[opensea pro](https://pro.opensea.io/collection/' + links.contract + ') ∙ ' +
        //'[tiny astro](https://tinyastro.io/en/analytics/eth/' + links.contract + ') ∙ ' +
        '[etherscan](https://app.nftnerds.ai/collection/' + links.contract + ')';

    if (links.twitter !== null) {
        baseLinks += ' ∙ [twitter](https://twitter.com/' + links.twitter + ')';
    }

    if (isHttps(links.website)) {
        baseLinks += ' ∙ [website](' + links.website + ')';
    }

    return baseLinks;
}


function prettyMarketplace(marketplace) {

    let logo = ""
    if (marketplace.toLowerCase() == "blur") {
        logo = "<:blur:1185534773083504690>"
    } else if (marketplace.toLowerCase() == "opensea") {
        logo = "<:os:1185534781040111708>"

    } else {
        return "`None`"
    }

    return logo

}

function prettierChange(change) {

    if (change > 1) {

        return "+" + parseFloat((change - 1) * 100).toFixed(2) + "% 📈"

    } else if (change < 1) {

        return parseFloat((change - 1) * 100).toFixed(2) + "% 📉"

    } else if (!change) {

        return "❓"

    } else {

        return "❓"

    }

}