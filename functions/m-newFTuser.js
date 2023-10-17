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
        channelNewFTUser1kId = "1154362080456081469"
        channelNewFTUser10kId = "1154362091566792784"
        channelNewFTUser100kId = "1154362407481786368"

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







async function newFriendtechUser(obj) {


    await addTimeout(10)


    try {

        const timeStamp = Date.now();
        const actualTimestamp = parseFloat(timeStamp / 1000).toFixed(0)

        const ethUsdPrice = await getEthPrice()



        const transaction = obj

        const hash = transaction.hash
        const userAddress = transaction.from
        const input = transaction.input
        const value = transaction.value


        const amount = parseInt("0x" + input.slice(-64), 16)
        const subject = ("0x" + input.substring(34, 74)).toLowerCase()


        if (subject.toLowerCase() == userAddress.toLowerCase() && amount == 1) {


            const cachedTUsersFile = await fs.readFile(newUserFile, 'utf8');
            const cachedUsers = JSON.parse(cachedTUsersFile)
            const user = cachedUsers.find((object) => object.address.toLowerCase() == userAddress.toLowerCase());



            if (user) {

                let userInfoCall = ""
                let isAvailable = true

                try {
                    userInfoCall = await axios.get("https://prod-api.kosetto.com/users/" + userAddress.toLowerCase())
                } catch (error) {

                    isAvailable = false
                }


                if (isAvailable == true) {

                    let twitterUsername = userInfoCall.data.twitterUsername
                    let twitterName = userInfoCall.data.twitterName

                    let holderCount = userInfoCall.data.holderCount
                    let shareSupply = userInfoCall.data.shareSupply
                    let price = userInfoCall.data.displayPrice / 10 ** 18
                    let holding = userInfoCall.data.holdingCount


                    let marketCap = shareSupply * price
                    let uniqueHolders = (holderCount / shareSupply) * 100;

                    let isSniped = "❌"
                    if (holderCount > 1) { isSniped = "✅" }




                    // On récupère les infos Twitter
                    const twitterInfos = await getTwitterUserInfo(twitterUsername)

                    let followers = twitterInfos.followers_count
                    let following = twitterInfos.friends_count
                    let pfp = twitterInfos.profile_image_url_https
                    twitterPfp = pfp.replace("_normal", "")
                    let created = Math.floor(((new Date(twitterInfos.created_at)).getTime() / 1000))


                    if (followers >= 1000) {


                        const b = await web3BaseUnifra.eth.getBalance(userAddress)
                        const balance = parseFloat(b / 10 ** 18).toFixed(3)





                        // Console log monitor
                        console.log(colors.cyan("🐇 New Friend.tech user"))
                        console.log("Twitter: @" + twitterUsername)
                        console.log("Wallet: " + userAddress)
                        console.log("Txn: " + hash)


                        const buttonRow = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('button_friendtech_user_panel_' + userAddress)
                                    .setLabel('📊 Trade panel ')
                                    .setStyle(1),

                            )



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
                                { name: " ", value: "```• Friend.Tech Metrics```", inline: true },
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
                                { name: "Links", value: '[Friendtech](https://www.friend.tech/rooms/' + userAddress + ") ∙ " + '[Twitter](https://twitter.com/' + twitterUsername.toLowerCase() + ") ∙ " + '[Basescan](https://basescan.org/address/' + userAddress + ") ∙ " + '[Holders](https://www.friend.tech/trades/' + userAddress + ") ∙ " + '[Transaction](https://basescan.org/tx/' + hash + ") ∙ " + '[Chart](https://www.degenz.finance/friendtech/portfolio?address=' + userAddress + ") ∙ " + '[Logs](https://basescan.org/tx/' + hash + "#eventlog)", inline: false }

                            )
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })



                        if (followers >= 1000 && followers < 10000) {

                            await channelNewFTUser1K.send({ embeds: [userFTEmbed], components: [buttonRow] });

                        } else if (followers >= 10000 && followers < 100000) {

                            await channelNewFTUser10K.send({ embeds: [userFTEmbed], components: [buttonRow] });

                        } else if (followers >= 100000) {

                            await channelNewFTUser100K.send({ embeds: [userFTEmbed], components: [buttonRow] });

                        }

                    }


                } else {


                    let twitterUsername = user.username
                    let twitterName = user.name

                    // On récupère les infos Twitter
                    const twitterInfos = await getTwitterUserInfo(twitterUsername)

                    let followers = twitterInfos.followers_count
                    let following = twitterInfos.friends_count
                    let pfp = twitterInfos.profile_image_url_https
                    let twitterPfp = pfp.replace("_normal", "")
                    let created = Math.floor(((new Date(twitterInfos.created_at)).getTime() / 1000))


                    if (followers >= 1000) {

                        const shareSupply = await shareContract.methods.sharesSupply(userAddress).call()
                        const price = getPrice(parseInt(shareSupply), 1) / 10 ** 18

                    
                        const holderCount = shareSupply
                        const holding = 1
                        const uniqueHolders = (holderCount / shareSupply) * 100;

                        const marketCap = shareSupply * price

                        let isSniped = "❌"
                        if (shareSupply > 3) { isSniped = "✅" }


                        const b = await web3BaseUnifra.eth.getBalance(userAddress)
                        const balance = parseFloat(b / 10 ** 18).toFixed(3)


                        // Console log monitor
                        console.log(colors.cyan("🐇 New Friend.tech user"))
                        console.log("Twitter: @" + twitterUsername)
                        console.log("Wallet: " + userAddress)
                        console.log("Txn: " + hash)


                        const buttonRow = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('button_friendtech_user_panel_' + userAddress)
                                    .setLabel('📊 Trade panel ')
                                    .setStyle(1),

                            )



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
                                { name: " ", value: "```• Friend.Tech Metrics```", inline: true },
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
                                { name: "Links", value: '[Friendtech](https://www.friend.tech/rooms/' + userAddress + ") ∙ " + '[Twitter](https://twitter.com/' + twitterUsername.toLowerCase() + ") ∙ " + '[Basescan](https://basescan.org/address/' + userAddress + ") ∙ " + '[Holders](https://www.friend.tech/trades/' + userAddress + ") ∙ " + '[Transaction](https://basescan.org/tx/' + hash + ") ∙ " + '[Chart](https://www.degenz.finance/friendtech/portfolio?address=' + userAddress + ") ∙ " + '[Logs](https://basescan.org/tx/' + hash + "#eventlog)", inline: false }

                            )
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })



                        if (followers >= 1000 && followers < 10000) {

                            await channelNewFTUser1K.send({ embeds: [userFTEmbed], components: [buttonRow] });

                        } else if (followers >= 10000 && followers < 100000) {

                            await channelNewFTUser10K.send({ embeds: [userFTEmbed], components: [buttonRow] });

                        } else if (followers >= 100000) {

                            await channelNewFTUser100K.send({ embeds: [userFTEmbed], components: [buttonRow] });

                        }

                    }





                }





            } else if (!user) {




                let userInfoCall = ""
                let isAvailable = true

                try {
                    userInfoCall = await axios.get("https://prod-api.kosetto.com/users/" + userAddress.toLowerCase())
                } catch (error) {

                    isAvailable = false
                }


                if (isAvailable == true) {

                    let twitterUsername = userInfoCall.data.twitterUsername
                    let twitterName = userInfoCall.data.twitterName

                    let holderCount = userInfoCall.data.holderCount
                    let shareSupply = userInfoCall.data.shareSupply
                    let price = userInfoCall.data.displayPrice / 10 ** 18
                    let holding = userInfoCall.data.holdingCount


                    let marketCap = shareSupply * price
                    let uniqueHolders = (holderCount / shareSupply) * 100;

                    let isSniped = "❌"
                    if (holderCount > 1) { isSniped = "✅" }




                    // On récupère les infos Twitter
                    const twitterInfos = await getTwitterUserInfo(twitterUsername)

                    let followers = twitterInfos.followers_count
                    let following = twitterInfos.friends_count
                    let pfp = twitterInfos.profile_image_url_https
                    twitterPfp = pfp.replace("_normal", "")
                    let created = Math.floor(((new Date(twitterInfos.created_at)).getTime() / 1000))


                    if (followers >= 1000) {


                        const b = await web3BaseUnifra.eth.getBalance(userAddress)
                        const balance = parseFloat(b / 10 ** 18).toFixed(3)





                        // Console log monitor
                        console.log(colors.cyan("🐇 New Friend.tech user"))
                        console.log("Twitter: @" + twitterUsername)
                        console.log("Wallet: " + userAddress)
                        console.log("Txn: " + hash)


                        const buttonRow = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('button_friendtech_user_panel_' + userAddress)
                                    .setLabel('📊 Trade panel ')
                                    .setStyle(1),

                            )



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
                                { name: " ", value: "```• Friend.Tech Metrics```", inline: true },
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
                                { name: "Links", value: '[Friendtech](https://www.friend.tech/rooms/' + userAddress + ") ∙ " + '[Twitter](https://twitter.com/' + twitterUsername.toLowerCase() + ") ∙ " + '[Basescan](https://basescan.org/address/' + userAddress + ") ∙ " + '[Holders](https://www.friend.tech/trades/' + userAddress + ") ∙ " + '[Transaction](https://basescan.org/tx/' + hash + ") ∙ " + '[Chart](https://www.degenz.finance/friendtech/portfolio?address=' + userAddress + ") ∙ " + '[Logs](https://basescan.org/tx/' + hash + "#eventlog)", inline: false }

                            )
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })



                        if (followers >= 1000 && followers < 10000) {

                            await channelNewFTUser1K.send({ embeds: [userFTEmbed], components: [buttonRow] });

                        } else if (followers >= 10000 && followers < 100000) {

                            await channelNewFTUser10K.send({ embeds: [userFTEmbed], components: [buttonRow] });

                        } else if (followers >= 100000) {

                            await channelNewFTUser100K.send({ embeds: [userFTEmbed], components: [buttonRow] });

                        }

                    }
                }
            }

        }





    } catch (error) {

        console.log("Erreur lors de la récupération de la transaction du nouveau user Friend.Tech :" + error.stack)


    }

}



module.exports = newFriendtechUser
