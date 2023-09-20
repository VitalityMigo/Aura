const { EmbedBuilder } = require("discord.js");


//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const infuraApiKey = process.env.infuraApiKey
const etherscanApiKey = process.env.etherscanApiKey

const Web3 = require('web3');
const web3Call = new Web3(new Web3.providers.HttpProvider(`https://1rpc.io/base`))

const axios = require('axios')
const colors = require('colors');


const reduceText = require("./reducetext")
const addTimeout = require("./addtimeout")



// On définit le client et charge les channels
const client = require('../bot'); // Chemin vers le fichier client.js

let serverId = ""
let channelNewFTUserId = ""
let channelNewFTUser = ""


setTimeout(() => {

    const botId = client.user.id;

    if (botId == "1074328639165964368") {
        // PROD

        serverId = "1108754348818845729"
        channelNewFTUserId = "1154110778106974259"

    } else if (botId == "1119666128411709552") {
        // DEV

        serverId = "1071576735298113667"
        channelNewFTUserId = "1104225853023461388"
    }

    const botGuild = client.guilds.cache.get(serverId);
    channelNewFTUser = botGuild.channels.cache.get(channelNewFTUserId);

}, 4000);



let ethUsdPrice = "1600"




async function newFriendtechUser(obj) {


    await addTimeout(5)


    try {

        const timeStamp = Date.now();
        const actualTimestamp = parseFloat(timeStamp / 1000).toFixed(0)


        const transaction = obj

        const hash = transaction.hash
        const userAddress = transaction.from
        const input = transaction.input

        let userInfoCall = ""
        console.log("https://prod-api.kosetto.com/users/" + userAddress.toLowerCase())
        try {
            userInfoCall = await axios.get("https://prod-api.kosetto.com/users/" + userAddress.toLowerCase())
        } catch (error) {
            console.log(userInfoCall)
            console.log(error.stack)
        }


        let id = userInfoCall.data.id
        let twitterUsername = userInfoCall.data.twitterUsername
        let twitterName = userInfoCall.data.twitterName
        let twitterPfp = userInfoCall.data.twitterPfpUrl

        let holderCount = userInfoCall.data.holderCount
        let shareSupply = userInfoCall.data.shareSupply
        let price = userInfoCall.data.displayPrice / 10 ** 18
        let holding = userInfoCall.data.holdingCount


        let marketCap = shareSupply * price
        let uniqueHolders = (holderCount / shareSupply) * 100;



        // Console log monitor
        console.log(colors.cyan("🐇 New Friend.tech user"))
        console.log("Twitter: @" + twitterUsername)
        console.log("Wallet: " + userAddress)
        console.log("Txn: " + hash)



        const userFTEmbed = new EmbedBuilder().setColor("#060A8F")
            .setTitle(twitterName)
            .setDescription(">>> A new user has joined Friend.Tech")
            .setThumbnail(twitterPfp)
            .setTimestamp()
            .addFields(
                { name: "Name", value: "`" + twitterName + "`", inline: true },
                { name: "Username", value: "`" + twitterUsername + "`", inline: true },
                { name: "FT Wallet:", value: "`" + userAddress + "`", inline: false },
                { name: " ", value: " ", inline: false },
                { name: "Price", value: "`" + parseFloat(price).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(price * ethUsdPrice).toFixed(0)) + "$)`", inline: true },
                { name: "Market Cap", value: "`" + parseFloat(marketCap).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(marketCap * ethUsdPrice).toFixed(0)) + "$)`", inline: true },
                { name: " ", value: " ", inline: true },
                { name: "Share Supply", value: "`" + shareSupply + "`", inline: true },
                { name: "Holders", value: "`" + holderCount + "`", inline: true },
                { name: "Unique Holders", value: "`" + parseFloat(uniqueHolders).toFixed(1) + "%`", inline: true },
                { name: "Holding", value: "`" + holding + "`", inline: true },
                { name: "User Rank", value: "`#" + id + "`", inline: true },
                { name: "Joined At", value: "<t:" + actualTimestamp + ":R>", inline: true },
                { name: " ", value: " ", inline: false },
                { name: "Links", value: '[Friendtech](https://www.friend.tech/rooms/' + userAddress + ") ∙ " + '[Twitter](https://twitter.com/' + twitterUsername.toLowerCase() + ") ∙ " + '[Basescan](https://basescan.org/address/' + userAddress + ") ∙ " + '[Holders](https://www.friend.tech/trades/' + userAddress + ") ∙ " + '[Transaction](https://basescan.org/tx/' + hash + ")", inline: false }

            )
            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


        await channelNewFTUser.send({ embeds: [userFTEmbed] });









    } catch (error) {

        console.log("Erreur lors de la récupération de la transaction du nouveau user Friend.Tech :" + error.stack)


    }

}



module.exports = newFriendtechUser
