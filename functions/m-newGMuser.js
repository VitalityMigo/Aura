const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");


//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const infuraApiKey = process.env.infuraApiKey
const etherscanApiKey = process.env.etherscanApiKey

const { web3Base1RPC, web3BaseUnifra, web3BaseDRPC } = require('../config/web3config');

const axios = require('axios')
const colors = require('colors');
const fs = require('fs').promises;


const shareContractAbi = require("../contracts/friendtech/share.json");
const shareContractAddress = "0xcf205808ed36593aa40a44f10c7f7c2f67d4a4d4"
const shareContract = new web3BaseDRPC.eth.Contract(shareContractAbi, shareContractAddress);


const newUserFile = "contracts/friendtech/newuser.json"


const reduceText = require("./reducetext")
const addTimeout = require("./addtimeout")
const getTwitterUserInfo = require("../functions/twitteruserinfo")
const getEthPrice = require("./getethprice")
const getPrice = require("./FT-getprice")



// On définit le client et charge les channels
const client = require('../bot'); // Chemin vers le fichier client.js

let serverId = ""
let channelNewFTUser1kId = ""
let channelNewFTUser1K = ""

let channelNewFTUser10kId = ""
let channelNewFTUser10K = ""

let channelNewFTUser100kId = ""
let channelNewFTUser100K = ""


setTimeout(() => {

    const botId = client.user.id;

    if (botId == "1074328639165964368") {
        // PROD

        serverId = "1108754348818845729"
        channelNewFTUser1kId = "1167611823642660995"
        channelNewFTUser10kId = "1167610354763833404"
        channelNewFTUser100kId = "1167610435789402163"

    } else if (botId == "1119666128411709552") {
        // DEV

        serverId = "1071576735298113667"
        channelNewFTUser1kId = "1104225853023461388"
        channelNewFTUser10kId = "1104225853023461388"
        channelNewFTUser100kId = "1104225853023461388"

    }

    const botGuild = client.guilds.cache.get(serverId);
    channelNewFTUser1K = botGuild.channels.cache.get(channelNewFTUser1kId);
    channelNewFTUser10K = botGuild.channels.cache.get(channelNewFTUser10kId);
    channelNewFTUser100K = botGuild.channels.cache.get(channelNewFTUser100kId);

}, 4000);







async function newGMUser(obj) {


    await addTimeout(60)


    try {

        console.log("starting...")
        const timeStamp = Date.now();
        const actualTimestamp = parseFloat(timeStamp / 1000).toFixed(0)


        const transaction = obj

        const hash = transaction.hash
        const input = transaction.input
        const value = transaction.value


        const userAddress = ("0x" + input.substring(226, 266)).toLowerCase()


        let userInfoCall = ""
        let isAvailable = true

        try {
            userInfoCall = await axios.get("https://api.gm.io/twitter/profile/" + userAddress.toLowerCase())
        } catch (error) {
console.log(error)
            isAvailable = false
        }


        if (isAvailable == true) {

            let twitterUsername = userInfoCall.data.socialProfiles.twitter.screen_name
            let twitterName = userInfoCall.data.socialProfiles.twitter.name
            let testFollower = userInfoCall.data.socialProfiles.twitter.followers_count

            let holderCount = Object.keys(userInfoCall.data.sharesInfo.holdersOfUserShares).length
            let shareSupply = userInfoCall.data.sharesInfo.totalSupplyOfUserShares
            let price = userInfoCall.data.sharesInfo.sharePriceInETH
            let holding = 1

            let marketCap = shareSupply * price
            let uniqueHolders = (holderCount / shareSupply) * 100;

            let isSniped = "❌"
            if (holderCount > 5) { isSniped = "✅" }


          //  if (testFollower >= 1000) {


                // On récupère les infos Twitter
                const twitterInfos = await getTwitterUserInfo(twitterUsername)

                let followers = twitterInfos.followers_count
                let following = twitterInfos.friends_count
                let pfp = twitterInfos.profile_image_url_https
                twitterPfp = pfp.replace("_normal", "")
                let created = Math.floor(((new Date(twitterInfos.created_at)).getTime() / 1000))




                const b = await web3BaseUnifra.eth.getBalance(userAddress)
                const balance = parseFloat(b / 10 ** 18).toFixed(3)





                // Console log monitor
                console.log(colors.yellow("☀️ New GM user"))
                console.log("Twitter: @" + twitterUsername)
                console.log("Wallet: " + userAddress)
                console.log("Txn: " + hash)


                // const buttonRow = new ActionRowBuilder()
                //     .addComponents(
                //         new ButtonBuilder()
                //             .setCustomId('button_friendtech_user_panel_' + userAddress)
                //             .setLabel('📊 Trade panel ')
                //             .setStyle(1),

                //     )

                const ethUsdPrice = await getEthPrice()


                const userFTEmbed = new EmbedBuilder().setColor("#060A8F")
                    .setTitle(twitterName)
                    .setDescription(">>> A new user has joined Friend.Tech")
                    .setThumbnail(twitterPfp)
                    .setTimestamp()
                    .addFields(
                        { name: " ", value: '```• Twitter Informations```', inline: true },
                        { name: " ", value: " ", inline: false },
                        { name: "Name", value: "`" + twitterName + "`", inline: true },
                        { name: "Username", value: "`" + twitterUsername + "`", inline: true },
                        { name: " ", value: " ", inline: true },
                        { name: " ", value: "`" + new Intl.NumberFormat('en-US').format(followers) + "` followers", inline: true },
                        { name: " ", value: "`" + new Intl.NumberFormat('en-US').format(following) + "` following", inline: true },
                        { name: " ", value: "created <t:" + created + ":R>", inline: true },
                        { name: " ", value: "```• GM Metrics```", inline: true },
                        { name: " ", value: " ", inline: false },
                        { name: "Price", value: "`" + parseFloat(price).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(price * ethUsdPrice).toFixed(0)) + "$)`", inline: true },
                        { name: "Market Cap", value: "`" + parseFloat(marketCap).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(marketCap * ethUsdPrice).toFixed(0)) + "$)`", inline: true },
                        { name: " ", value: " ", inline: true },
                        { name: "Share Supply", value: "`" + shareSupply + "`", inline: true },
                        { name: "Holders", value: "`" + holderCount + "`", inline: true },
                        { name: "Unique Holders", value: "`" + parseFloat(uniqueHolders).toFixed(1) + "%`", inline: true },
                        { name: "Holding", value: "`" + holding + "`", inline: true },
                        { name: "Balance", value: "`" + balance + "Ξ`", inline: true },
                        { name: "Joined At", value: "<t:" + actualTimestamp + ":R>", inline: true },
                        { name: " ", value: "```• Transaction Details```", inline: true },
                        { name: " ", value: " ", inline: false },
                        { name: "Value", value: "`" + parseFloat(value).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(price * ethUsdPrice).toFixed(0)) + "$)`", inline: true },
                        { name: "Sniped", value: "`" + isSniped + "`", inline: true },
                        { name: "FT Wallet:", value: "`" + userAddress + "`", inline: false },
                        { name: "Links", value: '[GM.io](https://gm.io/' + twitterUsername + ") ∙ " + '[Twitter](https://twitter.com/' + twitterUsername.toLowerCase() + ") ∙ " + '[Basescan](https://basescan.org/address/' + userAddress + ") ∙ " + '[Transaction](https://basescan.org/tx/' + hash + ") ∙ " + '[Logs](https://basescan.org/tx/' + hash + "#eventlog)", inline: false }

                    )
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })



               // if (followers >= 1000 && followers < 10000) {

                    await channelNewFTUser1K.send({ embeds: [userFTEmbed], components: [] });

                // } else if (followers >= 10000 && followers < 100000) {

                //     await channelNewFTUser10K.send({ embeds: [userFTEmbed], components: [] });

                // } else if (followers >= 100000) {

                //     await channelNewFTUser100K.send({ embeds: [userFTEmbed], components: [] });

                // }

            //}
        }








    } catch (error) {

        console.log("Erreur lors de la récupération de la transaction du nouveau user Friend.Tech :" + error.stack)


    }

}



module.exports = newGMUser
