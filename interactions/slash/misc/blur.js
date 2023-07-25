/**
 * @file Sample getdata command with slash command.
 * @author Vitality Migø
 */



const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { profileData, accessSql, wallets, apimonitorsql, adminsql, reportsql, usersql, sequelize } = require('../../../events/database');
const moment = require('moment');


//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const etherscanApiKey = process.env.etherscanApiKey

//HTTPS requests
const axios = require('axios')

//Web3 API + Cloudfare Provider
var Web3 = require("web3")
const web3 = new Web3("https://cloudflare-eth.com")




function isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}


function isBRC20BitcoinWallet(wallet) {
    const regex = /^bc1[a-zA-Z0-9]{39,59}$/;

    return regex.test(wallet);
}


module.exports = {
    data: new SlashCommandBuilder()
        .setName("blur")
        .setDescription("Display your portfolio metrics regarding Blur tokens")
        .addStringOption(option =>
            option
                .setName("wallet")
                .setDescription("The wallet you want to display")
                .setRequired(true)
                .setAutocomplete(true)
        ),





    async execute(interaction) {


        if (interaction.guildId != null) {


            //Récupérer informations de l'utilisateur de la commande
            let authorId = interaction.user.id;
            let authorName = interaction.user.username;
            let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
            let serverId = interaction.member.guild.id
            let member = interaction.member;




            try {


                const communityRolePerms = await accessSql.findOne({ where: { serverId: serverId } })
                let communityMemberRoleId = communityRolePerms.dataValues.memberRoleId
                let communityAdminRoleId = communityRolePerms.dataValues.adminRoleId
                let botPowerStatut = communityRolePerms.dataValues.actualPower
                let communityStatut = communityRolePerms.dataValues.statut

                //Récupère régagle de privé/ou pas de l'utilisateur
                const authorProfile = await profileData.findOne({ where: { authorId: authorId } })

                if (authorProfile === null) { await interaction.deferReply(); } else {
                    const authorPrivacyMode = authorProfile.dataValues.privacyMode

                    if (authorPrivacyMode.toLowerCase() === "private") { await interaction.deferReply({ ephemeral: true }); }
                    if (authorPrivacyMode.toLowerCase() === "public") { await interaction.deferReply(); }
                }

                //Checkpoint
                console.log("// Step 1 : Initialization - Executed ✅")

                if (communityStatut.toLowerCase() === "active") {


                    if (botPowerStatut.toLowerCase() === "on") {


                        if (member.roles.cache.has(communityMemberRoleId)) {

                            //Checkpoint
                            console.log("// Step 2 : Authorization - Executed ✅")


                            //On enregistre le user si il est pas encore dans la database
                            const timeStamp = Date.now();
                            const actualTimestamp = parseFloat(timeStamp / 1000).toFixed(0)
                            const isUser = await usersql.findOne({ where: { userId: authorId, serverId: serverId } })
                            if (isUser == null) { await usersql.create({ userId: authorId, userName: authorName, userAvatar: userAvatar, serverId: serverId, timestamp: actualTimestamp }) }


                            //Récupérer liste des wallets
                            let allWalletAddressOfAuthorTable = []
                            const allWalletsOfAuthor = await wallets.findAll({ where: { authorId: authorId, walletCategory: "eth" } });
                            for (let i = 0; i < allWalletsOfAuthor.length; i++) { allWalletAddressOfAuthorTable.push(allWalletsOfAuthor[i].dataValues.walletAddress); }


                            //Variable pour les options
                            const selectedWallet = interaction.options.getString("wallet");



                            if (selectedWallet.toLowerCase() !== "all") {


                                if (isValidEthereumAddress(selectedWallet)) {


                                    const WalletofAuthor = await wallets.findOne({ where: { authorId: authorId, walletAddress: selectedWallet } });
                                    let precisedWalletNameofAuthor = ""
                                    if (WalletofAuthor !== null) {
                                        precisedWalletNameofAuthor = WalletofAuthor.dataValues.walletName
                                    } else { precisedWalletNameofAuthor = selectedWallet.substring(0, 5) + "..." + selectedWallet.substring(selectedWallet.length - 4, selectedWallet.length) }


                                    //On récupère la balance de token
                                    const blurWalletBalance = await axios.get('https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0x5283D291DBCF85356A21bA090E6db59121208b44&address=' + selectedWallet + '&tag=latest&apikey=' + etherscanApiKey)
                                    const blurPoolWalletBalance = await axios.get('https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0x0000000000A39bb272e79075ade125fd351887Ac&address=' + selectedWallet + '&tag=latest&apikey=' + etherscanApiKey)
                                    const blurPoolContractBalance = await web3.eth.getBalance("0x0000000000A39bb272e79075ade125fd351887Ac")

                                    const blurBalanceFormatted = blurWalletBalance.data.result / (10 ** 18)
                                    const blurPoolBalanceFormatted = blurPoolWalletBalance.data.result / (10 ** 18)
                                    const blurPoolContractBalanceFormatted = parseFloat(web3.utils.fromWei((blurPoolContractBalance).toString(), 'ether'))


                                    // On récupère le prix USD des différentes cryptos
                                    const ethUsdPrice = await axios.get('https://api.etherscan.io/api?module=stats&action=ethprice&apikey=' + etherscanApiKey)
                                    const cryptoUsdtPrice = await axios.get('https://api-testnet.bybit.com/v5/market/tickers?category=linear')
                                    const blurUsdTPrice = cryptoUsdtPrice.data.result.list.find(obj => obj.symbol === "BLURUSDT").lastPrice;




                                    let lignMaxSize = 70
                                    let leftPartNfts = "`" + selectedWallet
                                    let rightPartNfts = blurPoolBalanceFormatted.toFixed(4) + "Ξ`\n"
                                    let leftPartNFTsLenght = leftPartNfts.length
                                    let rightPartNftsLenght = rightPartNfts.length
                                    let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                                    let spaceLenght = ""
                                    for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }



                                    // CODE POUR METTRE EN VERSION US (897,897.88$)           
                                    //new Intl.NumberFormat('en-US').format(


                                    const getBlurOneWallet = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle(`${authorName}'s Blur portfolio`)
                                        .setDescription(">>> Showing `" + precisedWalletNameofAuthor + "` data on Blur")
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .addFields(
                                            { name: "Blur Wallet Balance", value: "`" + blurBalanceFormatted.toFixed(3) + " BLUR (" + (blurUsdTPrice * blurBalanceFormatted).toFixed(3) + "$)`", inline: true },
                                            { name: "Blur Pool Wallet Balance", value: "`" + blurPoolBalanceFormatted.toFixed(3) + "Ξ (" + (ethUsdPrice.data.result.ethusd * blurPoolBalanceFormatted).toFixed(3) + "$)`", inline: true },
                                            { name: "Pool Share Held Ratio", value: "`" + ((blurPoolBalanceFormatted * 100) / blurPoolContractBalanceFormatted).toFixed(10) + "% `", inline: true },
                                            { name: "Blur Pool Contract Balance", value: "`" + blurPoolContractBalanceFormatted.toFixed(3) + "Ξ (" + (ethUsdPrice.data.result.ethusd * blurPoolContractBalanceFormatted).toFixed(3) + "$)`", inline: false },
                                            { name: "Wallet", value: "`" + selectedWallet + spaceLenght + blurPoolBalanceFormatted.toFixed(4) + "Ξ`", inline: false },

                                        )
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                    await interaction.editReply({ embeds: [getBlurOneWallet] });


                                    //On enregistre le call API dans la database
                                    const timeStamp = Date.now();
                                    await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/blur", apiCallName: "blurWalletBalance", apiProvider: "etherscan", timestamp: timeStamp.toString() })
                                    await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/blur", apiCallName: "blurPoolWalletBalance", apiProvider: "etherscan", timestamp: timeStamp.toString() })
                                    await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/blur", apiCallName: "blurPoolContractBalance", apiProvider: "web3.eth", timestamp: timeStamp.toString() })
                                    await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/blur", apiCallName: "ethUsdPrice", apiProvider: "etherscan", timestamp: timeStamp.toString() })
                                    await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/blur", apiCallName: "blurUsdPrice", apiProvider: "etherscan", timestamp: timeStamp.toString() })


                                } else if (isBRC20BitcoinWallet(selectedWallet)) {


                                    const notMember = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle(`Blur Data`)
                                        .setDescription("Aura can't analyze your wallet's data because the wallet you provided isn't an Ethereum wallet but a Bitcoin wallet. Please use try again using the appropriate form.")
                                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                    await interaction.editReply({ embeds: [notMember] });




                                } else {

                                    const notMember = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle(`Blur Data`)
                                        .setDescription("Aura can't analyze your wallet's data because the wallet you provided isn't valid. Please use try again using the appropriate form.")
                                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                    await interaction.editReply({ embeds: [notMember] });



                                }



                            } else if (selectedWallet.toLowerCase() == "all") {


                                if (allWalletAddressOfAuthorTable.length > 0) {


                                    const promises = [];
                                    const sleep = require('sleep-promise');


                                    let blurBalanceFormatted = 0
                                    let blurPoolBalanceFormatted = 0
                                    let blurPoolContractBalanceFormatted = 0
                                    let blurPoolContractBalanceFormattedTable = []

                                    let walletsValue = ""

                                    const blurPoolContractBalance = await web3.eth.getBalance("0x0000000000A39bb272e79075ade125fd351887Ac")

                                    // On récupère le prix USD des différentes cryptos
                                    const ethUsdPrice = await axios.get('https://api.etherscan.io/api?module=stats&action=ethprice&apikey=' + etherscanApiKey)
                                    const cryptoUsdtPrice = await axios.get('https://api-testnet.bybit.com/v5/market/tickers?category=linear')
                                    const blurUsdTPrice = cryptoUsdtPrice.data.result.list.find(obj => obj.symbol === "BLURUSDT").lastPrice;


                                    for (const wallet of allWalletAddressOfAuthorTable) {

                                        promises.push((async () => {

                                            await Promise.all(promises);

                                            //On récupère la balance de token
                                            const blurWalletBalance = await axios.get('https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0x5283D291DBCF85356A21bA090E6db59121208b44&address=' + wallet + '&tag=latest&apikey=' + etherscanApiKey)
                                            const blurPoolWalletBalance = await axios.get('https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0x0000000000A39bb272e79075ade125fd351887Ac&address=' + wallet + '&tag=latest&apikey=' + etherscanApiKey)



                                            blurBalanceFormatted += blurWalletBalance.data.result / (10 ** 18)
                                            blurPoolBalanceFormatted += blurPoolWalletBalance.data.result / (10 ** 18)
                                            blurPoolContractBalanceFormatted += parseFloat(web3.utils.fromWei((blurPoolContractBalance).toString(), 'ether'))




                                            let obj = {}
                                            obj.walletAddress = wallet
                                            obj.walletPoolBalance = blurPoolWalletBalance.data.result / (10 ** 18)
                                            blurPoolContractBalanceFormattedTable.push(obj)

                                            await sleep(500);
                                        })());
                                    }

                                    await Promise.all(promises);



                                    let blurPoolContractBalanceFormattedTableSorted = blurPoolContractBalanceFormattedTable.sort((a, b) => b.walletPoolBalance - a.walletPoolBalance);

                                    let blurPoolContractBalanceFormattedTableSortedFormatted = blurPoolContractBalanceFormattedTableSorted.slice(0, 13);



                                    blurPoolContractBalanceFormattedTableSortedFormatted.forEach(wallet => {

                                        let lignMaxSize = 70
                                        let leftPartNfts = "`" + wallet.walletAddress
                                        let rightPartNfts = wallet.walletPoolBalance.toFixed(4) + "Ξ`\n"
                                        let leftPartNFTsLenght = leftPartNfts.length
                                        let rightPartNftsLenght = rightPartNfts.length
                                        let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                                        let spaceLenght = ""
                                        for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }


                                        walletsValue += "`" + wallet.walletAddress + spaceLenght + wallet.walletPoolBalance.toFixed(4) + "Ξ`\n"





                                    })



                                    const getBlurAllWallet = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle(`${authorName}'s Blur portfolio`)
                                        .setDescription(">>> Display Blur data for `" + allWalletAddressOfAuthorTable.length + "` wallets of " + authorName)
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .addFields(
                                            { name: "Blur Wallet Balance", value: "`" + blurBalanceFormatted.toFixed(3) + " BLUR (" + (blurUsdTPrice * blurBalanceFormatted).toFixed(3) + "$)`", inline: true },
                                            { name: "Blur Pool Wallet Balance", value: "`" + blurPoolBalanceFormatted.toFixed(3) + "Ξ (" + (ethUsdPrice.data.result.ethusd * blurPoolBalanceFormatted).toFixed(3) + "$)`", inline: true },
                                            { name: "Blur Pool Contract Balance", value: "`" + blurPoolContractBalanceFormatted.toFixed(3) + "Ξ (" + (ethUsdPrice.data.result.ethusd * blurPoolContractBalanceFormatted).toFixed(3) + "$)`", inline: false },
                                            { name: "Wallets", value: walletsValue, inline: false },

                                        )
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                    await interaction.editReply({ embeds: [getBlurAllWallet] });



                                    //On enregistre le call API dans la database
                                    for (let i = 0; i < allWalletsOfAuthor.length; i++) {

                                        const timeStamp = Date.now();
                                        await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/blur", apiCallName: "blurWalletBalance", apiProvider: "etherscan", timestamp: timeStamp.toString() })
                                        await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/blur", apiCallName: "blurPoolWalletBalance", apiProvider: "etherscan", timestamp: timeStamp.toString() })
                                        await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/blur", apiCallName: "blurPoolContractBalance", apiProvider: "web3.eth", timestamp: timeStamp.toString() })
                                        await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/blur", apiCallName: "ethUsdPrice", apiProvider: "etherscan", timestamp: timeStamp.toString() })
                                        await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/blur", apiCallName: "blurUsdPrice", apiProvider: "etherscan", timestamp: timeStamp.toString() })

                                    }



                                } else {

                                    const setwalletErrorEmbed = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle(`No wallet`)
                                        .setDescription("Aura can't analyze your wallet's data because you don't have any wallet registered in your portfolio. Please use `/setwallet` to register a wallet in your portfolio then try again.")
                                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                    await interaction.editReply({ embeds: [setwalletErrorEmbed] });





                                }
                            }


                        } else if (!member.roles.cache.has(communityMemberRoleId)) {



                            const notMember = new EmbedBuilder().setColor("#060A8F")
                                .setTitle(`Bot Access`)
                                .setDescription(">>> Showing access data")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Statut", value: "`Access Denied ❌`", inline: true },
                                    { name: "Required Role", value: "<@&" + communityMemberRoleId + ">", inline: true },
                                    { name: "Problem Detected", value: "Your access to the bot has been denied. You can only use the bot if you have the required role in this community. If you usually have access to the bot, make sure you're in the right community or contact an admin.", inline: false },
                                )
                                .setTimestamp()
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                            await interaction.editReply({ embeds: [notMember] });


                        }

                    } else if (botPowerStatut.toLowerCase() === "off") {


                        const botOff = new EmbedBuilder().setColor("#060A8F")
                            .setTitle(`Bot statut`)
                            .setDescription(">>> Showing the bot statut")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .addFields(
                                { name: 'Global Statut', value: "`Inactive 🔴`", inline: true },
                                { name: 'Commands', value: "`Not available`", inline: true },
                                { name: "Problem Detected", value: "The bot is currently inactive in this community. The community's administrator are the only who are able to switch the bot on, contact them for any inquiries.", inline: false },
                            )
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                        await interaction.editReply({ embeds: [botOff] });




                    }

                } else {


                    const botOff = new EmbedBuilder().setColor("#060A8F")
                        .setTitle(`Bot Access`)
                        .setDescription(">>> Showing the community's bot access")
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .addFields(
                            { name: 'Access Statut', value: "`Denied 🔴`", inline: true },
                            { name: 'Commands', value: "`Not available`", inline: true },
                            { name: "Problem Detected", value: "The bot access is currently inactive in this community. The community's administrator are the only one who can make it active or not, contact them for any inquiries.", inline: false },
                        )
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                    await interaction.editReply({ embeds: [botOff] });



                }



            } catch (error) {

                console.log("// Error - sent in report ❌")

                //On envoi une notif
                let botId = interaction.applicationId
                const botAdmins = await adminsql.findOne({ where: { botId: botId } })
                const mainServerId = botAdmins.dataValues.mainServerId
                const logChannelId = botAdmins.dataValues.logChannelId
                const guild = interaction.client.guilds.cache.get(mainServerId);
                const channel = guild.channels.cache.get(logChannelId);


                const adminAccessInfos = await accessSql.findOne({ where: { serverId: serverId } })
                let adminRoleId = adminAccessInfos.dataValues.adminRoleId
                let serverName = adminAccessInfos.dataValues.serverName
                const userRoleList = interaction.member._roles
                let userHighestRole = "Member"
                if (userRoleList.includes(adminRoleId)) { userHighestRole = "Team" }
                let reportCommand = "/blur"

                const timeStamp = Date.now();
                const date = new Date(timeStamp);
                const dateLisible = date.toLocaleString();
                const date1 = moment(dateLisible, 'M/D/YYYY, h:mm:ss A');
                const formattedDate = date1.format('Do [of] MMMM YYYY');



                //On enregistre le call
                await reportsql.create({
                    botId: botId,
                    authorId: "Bot",
                    serverName: serverName,
                    authorRole: userHighestRole,
                    serverId: serverId,
                    date: formattedDate,
                    reportType: "Bug",
                    reportCommand: reportCommand,
                    reportDescription: "```" + error.stack + "```",
                    reportPriority: "5",
                    reportState: "Not treated",
                })



                const updateEmbed = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("New Report")
                    .setDescription(">>> A new report has just been sent.")
                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                    .setAuthor({ name: "Rolls Chasers Analytics", iconURL: "https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png" })
                    .setTimestamp()
                    .addFields(
                        { name: " ", value: " ", inline: false },
                        { name: "Content:", value: "A new `bug` has been submitted for the `" + reportCommand + "` command by `the bot report division` in `" + serverName + "`. You can use the administrator dashboard to consult it.", inline: false },

                    )
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                await channel.send({ embeds: [updateEmbed] });



                const errorAnswerUser = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("An error occured")
                    .setDescription("An error has occurred while executing this command. These errors can occur for a variety of reasons, such as :\n∙ Unexpected traffic\n∙ API maintenance\n∙ Occasional bug\n\nPlease note that a report has already been sent to our team, who will fix the problem as soon as possible. You can still use `/report` to give more details about the error and help our team.")
                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                await interaction.editReply({ embeds: [errorAnswerUser], ephemeral: true });


            }


        } else if (interaction.guildId == null) {

            const errorAnswerUser = new EmbedBuilder().setColor("#060A8F")
                .setTitle("Aura")
                .setDescription(`Hey ${interaction.user.username}, we hope you're doing well !\n\nAlthough this may be possible in the future, Aura cannot be used in DM at the moment. If you want to have access to the bot, go here: <#1108757700885622784>.\n\nIf you have any questions, don't hesitate to contact one of our team member, or directly on Discord here : <#1121110417368956958>.\n\nHave a nice day 👑`)
                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                .setTimestamp()
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


            await interaction.reply({ embeds: [errorAnswerUser], ephemeral: true });



        }


    }
}