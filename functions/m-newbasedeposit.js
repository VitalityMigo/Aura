const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");

const Web3 = require('web3')
const web3 = new Web3("https://1rpc.io/base")

const colors = require('colors');
const axios = require('axios')

const addTimeout = require("./addtimeout")


const shareContractAbi = require("../contracts/friendtech/share.json");
const shareContractAddress = "0xcf205808ed36593aa40a44f10c7f7c2f67d4a4d4"
const shareContract = new web3.eth.Contract(shareContractAbi, shareContractAddress);



function formatWallet(input) {
    return input.length > 35 ? `${input.substring(0, 5)}…${input.substring(input.length - 4)}` : input;
}



// Statistique des contrats
const depositBridgerL2AddressA = "0x4200000000000000000000000000000000000007"
const expectedSender = "0x3154cf16ccdb4c6d922629664174b904d80f2c35"
const expectedTarget = "0x4200000000000000000000000000000000000010"
const signature = "0xd764ad0b"
const bytes = 64
const hexEncoding = 16

const minValue = 2
const minTransfer = 4



// On définit le client et charge les channels
const client = require('../bot'); // Chemin vers le fichier client.js

let serverId = ""
let channelNewRealDepositId = ""
let channelNewRealDeposit = ""



setTimeout(() => {

    const botId = client.user.id;

    if (botId == "1074328639165964368") {
        // PROD

        serverId = "1108754348818845729"
        channelNewRealDepositId = "1156128292538171402"


    } else if (botId == "1119666128411709552") {
        // DEV

        serverId = "1071576735298113667"
        channelNewRealDepositId = "1155457483649851443"


    }

    const botGuild = client.guilds.cache.get(serverId);
    channelNewRealDeposit = botGuild.channels.cache.get(channelNewRealDepositId);

}, 4000);




async function newFTDeposit(obj) {

    await addTimeout(2)

    try {


        let twitterName = ""
        let twitterUsername = ""
        let twitterPfp = ""
        let displayPrice = 0

        const transaction = obj

        const from = transaction.mainnetAddress.toLowerCase()
        const userAddress = transaction.baseAddress.toLowerCase()
        const value = transaction.value
        const hash = transaction.hash
        const action = transaction.type



        if (action == "🌐 Bridge") {


            if (value >= minValue) {



                const price = await shareContract.methods.getBuyPrice(userAddress, 1).call();
                console.log(price)
                // Donc l'utilisateur est bien sur Friend.Tech
                if (price > 0) {




                    let userInfoCall = ""
                    try {
                        userInfoCall = await axios.get("https://prod-api.kosetto.com/users/" + userAddress.toLowerCase())
                    } catch (error) {

                        isFTUser = false
                        console.log("Erreur dans la récupération des infos du user FT " + error.stack)
                    }




                    twitterUsername = userInfoCall.data.twitterUsername
                    twitterName = userInfoCall.data.twitterName
                    twitterPfp = userInfoCall.data.twitterPfpUrl
                    displayPrice = price / 10 ** 18


                    const balance = (await web3.eth.getBalance(userAddress)) / 10 ** 18
                    const userBalance = balance + value

                    const bridgeInfosFormatted = "Amount: " + parseFloat(value).toFixed(4) + "Ξ\nNew balance:" + parseFloat(userBalance).toFixed(4) + "Ξ"


                    console.log(colors.brightGreen("📥 New Friend.Tech Deposit"))
                    console.log("To: @" + twitterUsername + " (" + userAddress + ")")
                    console.log("Value: " + value)
                    console.log("Txn: " + hash)


                    // on renvoi l'embed
                    const buttonRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('button_friendtech_user_panel_' + userAddress)
                                .setLabel('📊 Trade panel ')
                                .setStyle(1),

                        )


                    const userFTEmbed = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("New Deposit")
                        .setDescription(">>> A new Friend.Tech deposit has been detected")
                        .setThumbnail(twitterPfp)
                        .setTimestamp()
                        .addFields(
                            { name: "Name", value: "`" + twitterName + "`", inline: true },
                            { name: "Price", value: "`" + parseFloat(displayPrice).toFixed(4) + "Ξ`", inline: true },
                            { name: " ", value: " ", inline: false },
                            { name: "From", value: "`" + formatWallet(from) + "`\n∟ Mainnet", inline: true },
                            { name: "To", value: "`" + formatWallet(userAddress) + "`\n∟ Base", inline: true },
                            { name: "Action", value: "`" + action + "`", inline: true },
                            { name: " ", value: "```css\n" + bridgeInfosFormatted + "```", inline: false },
                            { name: "Links", value: '[Friendtech](https://www.friend.tech/rooms/' + userAddress + ") ∙ " + '[Twitter](https://twitter.com/' + twitterUsername.toLowerCase() + ") ∙ " + '[Basescan](https://basescan.org/address/' + userAddress + ") ∙ " + '[Transaction](https://etherscan.io/tx/' + hash + ") ∙ " + '[Chart](https://www.degenz.finance/friendtech/portfolio?address=' + userAddress + ")", inline: false }

                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                    await channelNewRealDeposit.send({ embeds: [userFTEmbed], components: [buttonRow] });







                }
            }


            // Else if pas bridge mais transfert
        } else if (action == "📥 Transfer") {


            if (value >= minTransfer) {



                const price = await shareContract.methods.getBuyPrice(userAddress, 1).call();

                // Donc l'utilisateur est bien sur Friend.Tech
                if (price > 0) {




                    let userInfoCall = ""
                    try {
                        userInfoCall = await axios.get("https://prod-api.kosetto.com/users/" + userAddress.toLowerCase())
                    } catch (error) {

                        isFTUser = false
                        console.log("Erreur dans la récupération des infos du user FT " + error.stack)
                    }




                    twitterUsername = userInfoCall.data.twitterUsername
                    twitterName = userInfoCall.data.twitterName
                    twitterPfp = userInfoCall.data.twitterPfpUrl
                    displayPrice = price / 10 ** 18


                    const balance = (await web3.eth.getBalance(userAddress)) / 10 ** 18
                    const userBalance = balance + value

                    const bridgeInfosFormatted = "Amount: " + parseFloat(value).toFixed(4) + "Ξ\nNew balance:" + parseFloat(userBalance).toFixed(4) + "Ξ"


                    console.log(colors.brightGreen("📥 New Friend.Tech Deposit"))
                    console.log("To: @" + twitterUsername + " (" + userAddress + ")")
                    console.log("Value: " + value)
                    console.log("Txn: " + hash)


                    // on renvoi l'embed
                    const buttonRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('button_friendtech_user_panel_' + userAddress)
                                .setLabel('📊 Trade panel ')
                                .setStyle(1),

                        )


                    const userFTEmbed = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("New Deposit")
                        .setDescription(">>> A new Friend.Tech deposit has been detected")
                        .setThumbnail(twitterPfp)
                        .setTimestamp()
                        .addFields(
                            { name: "Name", value: "`" + twitterName + "`", inline: true },
                            { name: "Price", value: "`" + parseFloat(displayPrice).toFixed(4) + "Ξ`", inline: true },
                            { name: " ", value: " ", inline: false },
                            { name: "From", value: "`" + formatWallet(from) + "`\n∟ Base", inline: true },
                            { name: "To", value: "`" + formatWallet(userAddress) + "`\n∟ Base", inline: true },
                            { name: "Action", value: "`" + action + "`", inline: true },
                            { name: " ", value: "```css\n" + bridgeInfosFormatted + "```", inline: false },
                            { name: "Links", value: '[Friendtech](https://www.friend.tech/rooms/' + userAddress + ") ∙ " + '[Twitter](https://twitter.com/' + twitterUsername.toLowerCase() + ") ∙ " + '[Basescan](https://basescan.org/address/' + userAddress + ") ∙ " + '[Transaction](https://etherscan.io/tx/' + hash + ") ∙ " + '[Chart](https://www.degenz.finance/friendtech/portfolio?address=' + userAddress + ")", inline: false }

                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                    await channelNewRealDeposit.send({ embeds: [userFTEmbed], components: [buttonRow] });







                }
            }


        }


    } catch (error) {


        console.log("Error when retreiving the new deposit informations : " + error.stack)



    }


}

module.exports = newFTDeposit

