
/**
 * @file Sample button interaction
 * @author JAYZHVJ
 * @since 3.0.0
 * @version 3.2.2
 */

/**
 * @type {import('../../../typings').ButtonInteractionCommand}
 */


const { ButtonInteraction } = require('discord.js');
const { ActionRowBuilder, EmbedBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const { accessSql, interactionData, reportsql, adminsql, infra_friendTech, exe_friendTech, sequelize } = require('../../../events/database');
const moment = require('moment');

const { web3Base1RPC, web3BaseUnifra, web3BaseDRPC, web3BaseBlast } = require('../../../config/web3config');

const axios = require("axios")

const shareContractAbi = require("../../../contracts/friendtech/share.json")
const shareContractAddress = "0xcf205808ed36593aa40a44f10c7f7c2f67d4a4d4"
const shareContract = new web3BaseBlast.eth.Contract(shareContractAbi, shareContractAddress);



const decrypt = require("../../../functions/decrypt")
const encrypt = require("../../../functions/encrypt")
const reduceText = require("../../../functions/reducetext")
const getTwitterUserInfo = require("../../../functions/twitteruserinfo")
const getTimeAgo = require("../../../functions/timeago")
const addTimeount = require("../../../functions/addtimeout")

function formatWallet(input) {
    return input.length > 35 ? `${input.substring(0, 10)}…${input.substring(input.length - 10)}` : input;
}




// On instancie les bouttons


const buttonsRowNew = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('infra_friendtechnewwallet-button')
            .setLabel('import wallet')
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId('infra_friendtechgeneratewallet-button')
            .setLabel('generate wallet')
            .setStyle(3),

    );


const buttonRowChoiceNo = new ActionRowBuilder()
    .addComponents(

        new ButtonBuilder()
            .setCustomId('button_friendtech_portfolio_exec_delete')
            .setLabel('Cancel')
            .setStyle(4),

    );



module.exports = {
    id: 'button_friendtech_portfolio_exec_',

    async execute(interaction) {
        if (!(interaction instanceof ButtonInteraction)) return;

        //Récupérer informations de l'utilisateur de la commande
        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id
        let botId = interaction.applicationId

        try {

            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")



            //Checkpoint
            console.log("// Step 2 : Authorization - Executed ✅")

            const customId = interaction.customId

            const match = customId.match(/button_friendtech_portfolio_exec_(.+)/);

            if (match && match[1]) {

                const action = match[1];





                if (action == "myportfolio") {

                    await interaction.deferReply({ ephemeral: true })

                    const userSetup = await infra_friendTech.findOne({ where: { authorId: authorId } })


                    if (userSetup != null) {


                        const userAddress = decrypt(userSetup.dataValues.walletAddress)


                        let totalFTValue = 0
                        let totalSharesValue = 0
                        let totalFeesCollected = 0

                        let holdingCount = 0
                        let totalShares = 0

                        let holdingTable = []

                        let twitterUsername = ""
                        let twitterName = ""
                        let twitterPfp = ""


                        let findUser = []
                        let isMatch = true
                        let isExactMatch = true


                        let userSetAddress = "0x"










                        const buttonsRowNoPortfolio = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('friendtech-portfolio-first-button')
                                    .setLabel('first page')
                                    .setStyle(2)
                                    .setDisabled(true),
                                new ButtonBuilder()
                                    .setCustomId('friendtech-portfolio-previous-button')
                                    .setLabel('previous page')
                                    .setStyle(2)
                                    .setDisabled(true),
                                new ButtonBuilder()
                                    .setCustomId('friendtech-portfolio-next-button')
                                    .setLabel('next page')
                                    .setStyle(2)
                                    .setDisabled(true),
                                new ButtonBuilder()
                                    .setCustomId('friendtech-portfolio-last-button')
                                    .setLabel('last page')
                                    .setStyle(2)
                                    .setDisabled(true),
                                new ButtonBuilder()
                                    .setCustomId('button_friendtech_portfolio_exec_myportfolio')
                                    .setLabel('👝 My Portfolio')
                                    .setStyle(1)
                                    .setDisabled(true),
                            );


                        const buttonsRowPortfolio = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('friendtech-portfolio-first-button')
                                    .setLabel('first page')
                                    .setStyle(2)
                                    .setDisabled(true),
                                new ButtonBuilder()
                                    .setCustomId('friendtech-portfolio-previous-button')
                                    .setLabel('previous page')
                                    .setStyle(2)
                                    .setDisabled(true),
                                new ButtonBuilder()
                                    .setCustomId('friendtech-portfolio-next-button')
                                    .setLabel('next page')
                                    .setStyle(2),
                                new ButtonBuilder()
                                    .setCustomId('friendtech-portfolio-last-button')
                                    .setLabel('last page')
                                    .setStyle(2),
                                new ButtonBuilder()
                                    .setCustomId('button_friendtech_portfolio_exec_myportfolio')
                                    .setLabel('👝 My Portfolio')
                                    .setStyle(1)
                                    .setDisabled(true),
                            );


                        const buttonsRowPortfolioAction = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('button_friendtech_portfolio_exec_liqAll')
                                    .setLabel('💣 Liquidate All')
                                    .setStyle(4),
                                new ButtonBuilder()
                                    .setCustomId('button_friendtech_portfolio_exec_liqFew')
                                    .setLabel('🧯 Liquidate Few')
                                    .setStyle(4),
                                new ButtonBuilder()
                                    .setCustomId('button_friendtech_portfolio_exec_liqOne')
                                    .setLabel('🎯 Liquidate One')
                                    .setStyle(3),
                                new ButtonBuilder()
                                    .setCustomId('button_friendtech_portfolio_exec_liqOverOne')
                                    .setLabel('🪄 Liquidate +1')
                                    .setStyle(3),

                            );

                        const buttonsRowPortfolioAction2 = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('button_friendtech_portfolio_exec_refresh')
                                    .setLabel('🔁 Refresh')
                                    .setStyle(1),
                                new ButtonBuilder()
                                    .setCustomId('button_friendtech_portfolio_exec_userlookup')
                                    .setLabel('👁 User Lookup')
                                    .setStyle(1),
                                new ButtonBuilder()
                                    .setCustomId('button_friendtech_portfolio_exec_tutorial')
                                    .setLabel('📑 Tutorial')
                                    .setStyle(1),
                                new ButtonBuilder()
                                    .setCustomId('friendtech_exec_setup-button')
                                    .setLabel('💻 Setup')
                                    .setStyle(1),



                            );



                        const userBalance = parseFloat(await web3Base1RPC.eth.getBalance(userAddress)) / 10 ** 18
                        //{}


                        const userInfoCall = await axios.get("https://prod-api.kosetto.com/users/" + userAddress)

                        holdingCount = userInfoCall.data.holdingCount
                        totalFeesCollected = userInfoCall.data.lifetimeFeesCollectedInWei / 10 ** 18
                        twitterUsername = userInfoCall.data.twitterUsername
                        twitterName = userInfoCall.data.twitterName
                        twitterPfp = userInfoCall.data.twitterPfpUrl


                        let userHoldingCall = await axios.get("https://prod-api.kosetto.com/users/" + userAddress + "/token-holdings")

                        console.log("2")


                        if (userHoldingCall.data.nextPageStart != 50) {

                            for (const holding of userHoldingCall.data.users) {

                                let holdingAddress = holding.address.toLowerCase()

                                const holderInfo = await axios.get("https://prod-api.kosetto.com/users/" + holdingAddress)
                                let holderPrice = holderInfo.data.displayPrice / 10 ** 18


                                let obj = {}
                                obj.username = holding.twitterUsername
                                obj.address = holding.address.toLowerCase()
                                obj.pfp = holding.twitterPfpUrl.toLowerCase()
                                obj.balance = holding.balance
                                obj.price = holderPrice

                                if (!holdingTable.includes(obj)) {

                                    totalShares += parseFloat(holding.balance)
                                    totalSharesValue += parseFloat(holderPrice * holding.balance)

                                    holdingTable.push(obj)
                                }
                            }

                        } else {

                            for (const holding of userHoldingCall.data.users) {


                                let holdingAddress = holding.address.toLowerCase()

                                const holderInfo = await axios.get("https://prod-api.kosetto.com/users/" + holdingAddress)
                                let holderPrice = holderInfo.data.displayPrice / 10 ** 18


                                let obj = {}
                                obj.username = holding.twitterUsername
                                obj.address = holding.address.toLowerCase()
                                obj.pfp = holding.twitterPfpUrl.toLowerCase()
                                obj.balance = holding.balance
                                obj.price = holderPrice

                                if (!holdingTable.includes(obj)) {

                                    totalShares += parseFloat(holding.balance)
                                    totalSharesValue += parseFloat(holderPrice * holding.balance)

                                    holdingTable.push(obj)
                                }
                            }

                            let itemsNumber = 50
                            let callPage = ""

                            let continuation = userHoldingCall.data.nextPageStart

                            while (continuation != null) {




                                callPage = await axios.get("https://prod-api.kosetto.com/users/" + userAddress + "/token-holdings?pageStart=" + itemsNumber)

                                continuation = callPage.data.nextPageStart

                                if (continuation != null) {

                                    for (const holding of callPage.data.users) {

                                        let holdingAddress = holding.address.toLowerCase()

                                        const holderInfo = await axios.get("https://prod-api.kosetto.com/users/" + holdingAddress)
                                        let holderPrice = holderInfo.data.displayPrice / 10 ** 18


                                        let obj = {}
                                        obj.username = holding.twitterUsername.toLowerCase()
                                        obj.address = holding.address.toLowerCase()
                                        obj.pfp = holding.twitterPfpUrl.toLowerCase()
                                        obj.balance = holding.balance
                                        obj.price = holderPrice

                                        if (!holdingTable.includes(obj)) {

                                            totalShares += parseFloat(holding.balance)
                                            totalSharesValue += parseFloat(holderPrice * holding.balance)

                                            holdingTable.push(obj)
                                        }
                                    }


                                    itemsNumber += 50

                                } else {
                                    break
                                }
                            }
                        }


                        // Tri du tableau JSON en fonction de la valeur "floorAsk * tokenCount" de chaque objet "collection" en ordre décroissant
                        let holdingTableSorted = holdingTable.sort((a, b) => b.balance * b.price - a.balance * a.price)



                        let holdingFormatted = "Subject                  #Held        Price        Value\n\n"
                        let index = 0

                        // On construit la table d'holders
                        for (const holding of holdingTableSorted) {

                            index++

                            if (index <= 16) {

                                let holderName = reduceText(holding.username, 26).toLowerCase()
                                let holderBalance = holding.balance
                                let price = parseFloat(holding.price).toFixed(3)
                                let holderValue = parseFloat(holderBalance * holding.price).toFixed(3)


                                let part1 = holderName
                                let part2 = holderBalance
                                let part3 = parseFloat(price).toFixed(2) + "Ξ"
                                let part4 = parseFloat(holderValue).toFixed(2) + "Ξ\n"


                                let spaceSize = 30 - part2.length - part1.length
                                let spaceLenght = ""
                                for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

                                let spaceSize2 = 13 - part3.length
                                let spaceLenght2 = ""
                                for (let i = 0; i < spaceSize2; i++) { spaceLenght2 += " " }

                                let spaceSize3 = 13 - part4.length
                                let spaceLenght3 = ""
                                for (let i = 0; i < spaceSize3; i++) { spaceLenght3 += " " }


                                holdingFormatted += part1 + spaceLenght + part2 + spaceLenght2 + part3 + spaceLenght3 + part4



                            } else {
                                break
                            }
                        }

                        const itemsPerPage = 16; // Nombre d'objets par page
                        const pageIndex = Math.ceil(holdingTableSorted.length / itemsPerPage);


                        totalFTValue = totalSharesValue + userBalance

                        if (holdingFormatted == "") { holdingFormatted = "```No shares found for this user.                         ```" }


                        console.log("3")
                        const userFTEmbed = new EmbedBuilder().setColor("#060A8F")
                            .setTitle(twitterName + "'s portfolio")
                            .setDescription(">>> Displaying the friend.tech portfolio metrics.")
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            //.setThumbnail(twitterPfp)
                            .setTimestamp()
                            .addFields(
                                { name: " ", value: " ", inline: false },
                                { name: "Total Value", value: "`" + parseFloat(totalFTValue).toFixed(3) + "Ξ`", inline: true },
                                { name: "Shares Value", value: "`" + parseFloat(totalSharesValue).toFixed(3) + "Ξ`", inline: true },
                                { name: "Base ETH Value", value: "`" + parseFloat(userBalance).toFixed(3) + "Ξ`", inline: true },
                                { name: " ", value: " ", inline: false },
                                { name: "Shares:", value: "```" + holdingFormatted + "```", inline: false },
                                { name: "Links", value: '[Friendtech](https://www.friend.tech/rooms/' + userAddress + ") ∙ " + '[Twitter](https://twitter.com/' + twitterUsername.toLowerCase() + ") ∙ " + '[Basescan](https://basescan.org/address/' + userAddress + ") ∙ " + '[Holding](https://www.friend.tech/trades/' + userAddress + ") ∙ " + '[Chart](https://www.degenz.finance/friendtech/portfolio?address=' + userAddress + ")", inline: false },
                                { name: "Page:", value: "`[1/" + pageIndex + "]`", inline: false },

                            )
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                        if (pageIndex <= 1) { await interaction.editReply({ embeds: [userFTEmbed], components: [buttonsRowNoPortfolio, buttonsRowPortfolioAction, buttonsRowPortfolioAction2] }); }
                        else { await interaction.editReply({ embeds: [userFTEmbed], components: [buttonsRowPortfolio, buttonsRowPortfolioAction, buttonsRowPortfolioAction2] }); }




                        let holdingDataTable = []
                        let obj = {}
                        obj.name = twitterName
                        obj.username = twitterUsername
                        obj.address = userAddress
                        obj.totalValue = parseFloat(totalFTValue).toFixed(3) + "Ξ"
                        obj.shareValue = parseFloat(totalSharesValue).toFixed(3) + "Ξ"
                        obj.userBalance = parseFloat(userBalance).toFixed(3) + "Ξ"
                        obj.links = '[Friendtech](https://www.friend.tech/rooms/' + userAddress + ") ∙ " + '[Twitter](https://twitter.com/' + twitterUsername.toLowerCase() + ") ∙ " + '[Basescan](https://basescan.org/address/' + userAddress + ") ∙ " + '[Holding](https://www.friend.tech/trades/' + userAddress + ") ∙ " + '[Chart](https://www.degenz.finance/friendtech/portfolio?address=' + userAddress + ")"
                        holdingDataTable.push(obj)


                        //On fait le call àbn  la base SQL
                        await interactionData.destroy({ where: { authorId: authorId, commandName: "friendtech-portfolio", serverId: serverId } })

                        await interactionData.create({

                            authorId: authorId,
                            authorName: authorName,
                            serverId: serverId,
                            commandName: "friendtech-portfolio",
                            interactionId: interaction.id,
                            walletAddress: "N/A",
                            walletCategory: "N/A",
                            embed1: JSON.stringify(holdingTableSorted),
                            embed2: JSON.stringify(holdingDataTable),
                            embed3: "N/A",
                            pageIndex: pageIndex.toString(),
                            actualPage: "1",
                            walletName: "N/A",
                            selecedTimestamp: "N/A",
                            selectedCollection: "N/A",
                            collectionSlug: "N/A",
                            collectionBanner: "N/A",
                            avgDeriskPrice: "N/A",
                            floorPrice: "N/A",
                            lowerMarketlace: "N/A",
                            collectionName: "N/A",
                            buyCount: "N/A",
                            soldCount: "N/A",
                            remaining: "N/A",
                            avgBuy: "N/A",
                            avgSold: "N/A",
                            realisedProfit: "N/A",
                            potentialProfit: "N/A",
                            roi: "N/A",
                            visualTitle: "N/A",
                            userAvatar: "N/A",
                            nbMembersInvolved: "N/A",
                            totalTradeCount: "N/A",
                        })






                    } else if (userSetup == null) {




                        const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Friend Tech Setup")
                            .setDescription(">>> Displaying your Friend.tech wallet setup")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .addFields(
                                { name: " ", value: "You don't have a wallet imported in your Friend.tech portfolio. To get started, use the button below.", inline: true },

                            )
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [errorNotEthereum], components: [buttonsRowNew], ephemeral: true });


                    }



                } else if (action == "liqAll") {

                    await interaction.deferReply({ ephemeral: true })

                    const userSetup = await infra_friendTech.findOne({ where: { authorId: authorId } })


                    if (userSetup != null) {




                        const sender = decrypt(userSetup.dataValues.walletAddress)
                        const senderPK = decrypt(userSetup.dataValues.privateKey)


                        let totalShares = 0
                        let totalPrice = 0
                        let totalUser = 0
                        let totalGasPayed = 0

                        let simulationCount = 0
                        let simulationSuccess = 0
                        let isOne = false

                        const gasPriceCall = await web3BaseUnifra.eth.getGasPrice()
                        const gasPriceGwei = gasPriceCall / 10 ** 9
                        const gasPriceEth = gasPriceCall / 10 ** 18




                        const lastInteraction = await interactionData.findOne({ where: { authorId: authorId, commandName: "friendtech-portfolio", serverId: serverId } })
                        const userTableRaw = JSON.parse(lastInteraction.dataValues.embed1)
                        const userTable = userTableRaw.filter(obj => obj.address.toLowerCase() != sender.toLowerCase())
                        const userCount = userTable.length

                        const targetTable = []

                        for (const user of userTable) {

                            isOne = true

                            const subject = user.address
                            const subjectUsername = user.username
                            const subjectPfp = user.pfp
                            const balance = user.balance
                            const price = user.price

                            const valueETH = (parseFloat(price) * parseInt(balance))
                            const expectedPrice = valueETH * 0.9 // 0.9 équivaut à 10% de fees, 5 protocle et 5 subject





                            const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Liquidate Shares")
                                .setDescription(">>> Displaying the simulated transaction data")
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Targets", value: "`" + totalUser + "` of `" + userCount + "`", inline: false },
                                    { name: "Sell Price", value: "`" + parseFloat(totalPrice).toFixed(3) + "Ξ`", inline: true },
                                    { name: "Sell Amount", value: "`" + totalShares + "`", inline: true },
                                    { name: "Simulation", value: "Target: `" + subjectUsername + "`  <a:AuraLoading:1134068847616458792>", inline: false },

                                )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })



                            await interaction.editReply({ embeds: [gasTrackerEmbed], components: [], ephemeral: true });




                            let simulationState = true
                            let gasUsed = ""
                            simulationCount++

                            try {
                                gasUsed = await shareContract.methods.sellShares(subject, balance).estimateGas({ from: sender.toLowerCase(), value: "0" });
                            } catch (error) {

                                simulationState = false
                                let message = error.message
                                console.log("erreur")
                                if (message.startsWith("Returned")) {
                                    errorMessageFormatted = message.replace("Returned error: ", "")
                                }
                            }



                            if (simulationState == true) {

                                simulationSuccess++

                                const gasPayed = gasPriceEth * gasUsed
                                const totalValue = expectedPrice - gasPayed


                                totalUser++
                                totalShares += parseInt(balance)
                                totalPrice += parseFloat(totalValue)
                                totalGasPayed += parseFloat(gasPayed)



                                const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Liquidate Shares")
                                    .setDescription(">>> Displaying the simulated transaction data")
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setTimestamp()
                                    .addFields(
                                        { name: " ", value: " ", inline: false },
                                        { name: "Targets", value: "`" + totalUser + "` of `" + userCount + "`", inline: false },
                                        { name: "Sell Price", value: "`" + parseFloat(totalPrice).toFixed(3) + "Ξ`", inline: true },
                                        { name: "Sell Amount", value: "`" + totalShares + "`", inline: true },
                                        { name: "Simulation", value: "Target: `" + subjectUsername + "✅`", inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                                await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [], ephemeral: true });



                                let obj = {}
                                obj.subject = subject.toLowerCase()
                                obj.amount = balance
                                obj.username = subjectUsername
                                targetTable.push(obj)


                            } else {

                                const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Liquidate Shares")
                                    .setDescription(">>> Displaying the simulated transaction data")
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setTimestamp()
                                    .addFields(
                                        { name: " ", value: " ", inline: false },
                                        { name: "Targets", value: "`" + totalUser + "` of `" + userCount + "`", inline: false },
                                        { name: "Sell Price", value: "`" + parseFloat(totalPrice).toFixed(3) + "Ξ`", inline: true },
                                        { name: "Sell Amount", value: "`" + totalShares + "`", inline: true },
                                        { name: "Simulation", value: "Target: `" + subjectUsername + "❌`", inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [gasTrackerEmbed2], ephemeral: true });

                            }





                        }







                        if ((simulationSuccess * 2) >= simulationCount && isOne == true) {

                            const buttonRowChoice = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('friendtech_portfolio_exec_confirm_liqAll')
                                        .setLabel('Confirm')
                                        .setEmoji("✅")
                                        .setStyle(1),
                                    new ButtonBuilder()
                                        .setCustomId('button_friendtech_portfolio_exec_delete')
                                        .setLabel('Cancel')
                                        .setStyle(4),

                                );


                            const txnDataFormatted = "Sender: " + sender + "\nGas Price: " + parseFloat(gasPriceGwei).toFixed(0) + " gwei\n\nReceive: " + parseFloat(totalPrice).toFixed(5) + "Ξ (fees included)\nGas fees: " + parseFloat(totalGasPayed).toFixed(5) + "Ξ\n\nTotal Value Received: " + parseFloat(totalPrice).toFixed(5) + "Ξ"



                            const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Liquidate Shares")
                                .setDescription(">>> Displaying the simulated transaction data")
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Target", value: "`" + totalUser + "`", inline: false },
                                    { name: "Sell Price", value: "`" + parseFloat(totalPrice).toFixed(3) + "Ξ`", inline: true },
                                    { name: "Sell Amount", value: "`" + totalShares + "`", inline: true },
                                    { name: "Transaction Data ✅", value: "```" + txnDataFormatted + "```", inline: false },

                                )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                            await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [buttonRowChoice], ephemeral: true });



                            await exe_friendTech.destroy({ where: { authorId: authorId, serverId: serverId, treated: null } });

                            // On enregistre les infos
                            let table = []
                            let obj = {}
                            obj.sender = encrypt(sender)
                            obj.senderPK = encrypt(senderPK)
                            obj.subject = JSON.stringify(targetTable)
                            obj.subjectName = 'liq_all'
                            obj.action = "💣 Liquidate All"
                            obj.getSellPriceAfterFee = "0"
                            obj.amount = totalShares
                            table.push(obj)

                            await exe_friendTech.create({

                                serverId: serverId,
                                authorId: authorId,
                                authorName: authorName,
                                isBuy: "liq_all",
                                subject: JSON.stringify(table),
                                value: '0',
                                simulation: "true",
                                expectedPrice: totalPrice.toString(),

                            })

                        } else {


                            const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Liquidate Shares")
                                .setDescription(">>> Displaying the simulated transaction data")
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Target", value: "`" + totalUser + "`", inline: false },
                                    { name: "Sell Price", value: "`" + parseFloat(totalPrice).toFixed(3) + "Ξ`", inline: true },
                                    { name: "Sell Amount", value: "`" + totalShares + "`", inline: true },
                                    { name: "Transaction Data 🚫", value: "```More than half of the simulation failed. The action isn't executable.```", inline: false },

                                )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                            await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [buttonRowChoiceNo], ephemeral: true });



                        }








                    } else if (userSetup == null) {




                        const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Friend Tech Setup")
                            .setDescription(">>> Displaying your Friend.tech wallet setup")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .addFields(
                                { name: " ", value: "You don't have a wallet imported in your Friend.tech portfolio. To get started, use the button below.", inline: true },

                            )
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [errorNotEthereum], components: [buttonsRowNew], ephemeral: true });


                    }



                    // Faire simulation


                } else if (action == "liqOne") {




                    const userSetup = await infra_friendTech.findOne({ where: { authorId: authorId } })


                    if (userSetup != null) {


                        const passwordAdminDashboard = new ModalBuilder()
                            .setCustomId('modal_friendtech_portfolio_exec_liqOne')
                            .setTitle('Liquidate One');

                        // Add components to modal

                        // Create the text input components
                        const channel = new TextInputBuilder()
                            .setCustomId('modal_friendtech_portfolio_exec_liqOneR1')
                            .setLabel("Share Username")
                            .setPlaceholder("The twitter username of the share to sell")
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)




                        // An action row only holds one text input,
                        // so you need one action row per text input.
                        const firstActionRowSetProfile = new ActionRowBuilder().addComponents(channel);


                        // Add inputs to the modal
                        passwordAdminDashboard.addComponents(firstActionRowSetProfile)

                        // Show the modal to the user
                        await interaction.showModal(passwordAdminDashboard);



                    } else if (userSetup == null) {




                        const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Friend Tech Setup")
                            .setDescription(">>> Displaying your Friend.tech wallet setup")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .addFields(
                                { name: " ", value: "You don't have a wallet imported in your Friend.tech portfolio. To get started, use the button below.", inline: true },

                            )
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [errorNotEthereum], components: [buttonsRowNew], ephemeral: true });


                    }


                } else if (action == "liqFew") {




                    const userSetup = await infra_friendTech.findOne({ where: { authorId: authorId } })


                    if (userSetup != null) {


                        const passwordAdminDashboard = new ModalBuilder()
                            .setCustomId('modal_friendtech_portfolio_exec_liqFew')
                            .setTitle('Liquidate Few');

                        // Add components to modal

                        // Create the text input components
                        const channel = new TextInputBuilder()
                            .setCustomId('modal_friendtech_portfolio_exec_liqFewR1')
                            .setLabel("Username List")
                            .setPlaceholder("The list of twitter username to liquidate (i.e skayz, apedegenft etc")
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(true)




                        // An action row only holds one text input,
                        // so you need one action row per text input.
                        const firstActionRowSetProfile = new ActionRowBuilder().addComponents(channel);


                        // Add inputs to the modal
                        passwordAdminDashboard.addComponents(firstActionRowSetProfile)

                        // Show the modal to the user
                        await interaction.showModal(passwordAdminDashboard);





                    } else if (userSetup == null) {




                        const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Friend Tech Setup")
                            .setDescription(">>> Displaying your Friend.tech wallet setup")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .addFields(
                                { name: " ", value: "You don't have a wallet imported in your Friend.tech portfolio. To get started, use the button below.", inline: true },

                            )
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [errorNotEthereum], components: [buttonsRowNew], ephemeral: true });


                    }



                } else if (action == "liqOverOne") {

                    await interaction.deferReply({ ephemeral: true })

                    const userSetup = await infra_friendTech.findOne({ where: { authorId: authorId } })


                    if (userSetup != null) {




                        const sender = decrypt(userSetup.dataValues.walletAddress)
                        const senderPK = decrypt(userSetup.dataValues.privateKey)


                        let totalShares = 0
                        let totalPrice = 0
                        let totalUser = 0
                        let totalGasPayed = 0

                        let simulationCount = 0
                        let simulationSuccess = 0
                        let isOne = false

                        const gasPriceCall = await web3BaseUnifra.eth.getGasPrice()
                        const gasPriceGwei = gasPriceCall / 10 ** 9
                        const gasPriceEth = gasPriceCall / 10 ** 18




                        const lastInteraction = await interactionData.findOne({ where: { authorId: authorId, commandName: "friendtech-portfolio", serverId: serverId } })
                        const userTableRaw = JSON.parse(lastInteraction.dataValues.embed1)
                        const userTable = userTableRaw.filter(obj => obj.address.toLowerCase() != sender.toLowerCase() && parseInt(obj.balance) > 1)
                        const userCount = userTable.length

                        const targetTable = []

                        for (const user of userTable) {

                            isOne = true

                            const subject = user.address
                            const subjectUsername = user.username
                            const subjectPfp = user.pfp
                            const balance = parseInt(user.balance) - 1
                            const price = user.price

                            const valueETH = (parseFloat(price) * parseInt(balance))
                            const expectedPrice = valueETH * 0.9 // 0.9 équivaut à 10% de fees, 5 protocle et 5 subject





                            const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Liquidate Shares")
                                .setDescription(">>> Displaying the simulated transaction data")
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Targets", value: "`" + totalUser + "` of `" + userCount + "`", inline: false },
                                    { name: "Sell Price", value: "`" + parseFloat(totalPrice).toFixed(3) + "Ξ`", inline: true },
                                    { name: "Sell Amount", value: "`" + totalShares + "`", inline: true },
                                    { name: "Simulation", value: "Target: `" + subjectUsername + "`  <a:AuraLoading:1134068847616458792>", inline: false },

                                )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })



                            await interaction.editReply({ embeds: [gasTrackerEmbed], components: [], ephemeral: true });




                            let simulationState = true
                            let gasUsed = ""
                            simulationCount++

                            try {
                                gasUsed = await shareContract.methods.sellShares(subject, balance).estimateGas({ from: sender.toLowerCase(), value: "0" });
                            } catch (error) {

                                simulationState = false
                                let message = error.message
                                console.log("erreur")
                                if (message.startsWith("Returned")) {
                                    errorMessageFormatted = message.replace("Returned error: ", "")
                                }
                            }



                            if (simulationState == true) {

                                simulationSuccess++

                                const gasPayed = gasPriceEth * gasUsed
                                const totalValue = expectedPrice - gasPayed


                                totalUser++
                                totalShares += parseInt(balance)
                                totalPrice += parseFloat(totalValue)
                                totalGasPayed += parseFloat(gasPayed)



                                const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Liquidate Shares")
                                    .setDescription(">>> Displaying the simulated transaction data")
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setTimestamp()
                                    .addFields(
                                        { name: " ", value: " ", inline: false },
                                        { name: "Targets", value: "`" + totalUser + "` of `" + userCount + "`", inline: false },
                                        { name: "Sell Price", value: "`" + parseFloat(totalPrice).toFixed(3) + "Ξ`", inline: true },
                                        { name: "Sell Amount", value: "`" + totalShares + "`", inline: true },
                                        { name: "Simulation", value: "Target: `" + subjectUsername + "✅`", inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                                await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [], ephemeral: true });



                                let obj = {}
                                obj.subject = subject.toLowerCase()
                                obj.amount = balance
                                obj.username = subjectUsername
                                targetTable.push(obj)


                            } else {

                                const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Liquidate Shares")
                                    .setDescription(">>> Displaying the simulated transaction data")
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setTimestamp()
                                    .addFields(
                                        { name: " ", value: " ", inline: false },
                                        { name: "Targets", value: "`" + totalUser + "` of `" + userCount + "`", inline: false },
                                        { name: "Sell Price", value: "`" + parseFloat(totalPrice).toFixed(3) + "Ξ`", inline: true },
                                        { name: "Sell Amount", value: "`" + totalShares + "`", inline: true },
                                        { name: "Simulation", value: "Target: `" + subjectUsername + "❌`", inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [gasTrackerEmbed2], ephemeral: true });

                            }





                        }







                        if ((simulationSuccess * 2) >= simulationCount && isOne == true) {

                            const buttonRowChoice = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('friendtech_portfolio_exec_confirm_liqOverOne')
                                        .setLabel('Confirm')
                                        .setEmoji("✅")
                                        .setStyle(1),
                                    new ButtonBuilder()
                                        .setCustomId('button_friendtech_portfolio_exec_delete')
                                        .setLabel('Cancel')
                                        .setStyle(4),

                                );


                            const txnDataFormatted = "Sender: " + sender + "\nGas Price: " + parseFloat(gasPriceGwei).toFixed(0) + " gwei\n\nReceive: " + parseFloat(totalPrice).toFixed(5) + "Ξ (fees included)\nGas fees: " + parseFloat(totalGasPayed).toFixed(5) + "Ξ\n\nTotal Value Received: " + parseFloat(totalPrice).toFixed(5) + "Ξ"



                            const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Liquidate Shares")
                                .setDescription(">>> Displaying the simulated transaction data")
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Target", value: "`" + totalUser + "`", inline: false },
                                    { name: "Sell Price", value: "`" + parseFloat(totalPrice).toFixed(3) + "Ξ`", inline: true },
                                    { name: "Sell Amount", value: "`" + totalShares + "`", inline: true },
                                    { name: "Transaction Data ✅", value: "```" + txnDataFormatted + "```", inline: false },

                                )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                            await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [buttonRowChoice], ephemeral: true });



                            await exe_friendTech.destroy({ where: { authorId: authorId, serverId: serverId, treated: null } });

                            // On enregistre les infos
                            let table = []
                            let obj = {}
                            obj.sender = encrypt(sender)
                            obj.senderPK = encrypt(senderPK)
                            obj.subject = JSON.stringify(targetTable)
                            obj.subjectName = 'liq_overone'
                            obj.action = "🪄 Liquidate +1"
                            obj.getSellPriceAfterFee = "0"
                            obj.amount = totalShares
                            table.push(obj)

                            await exe_friendTech.create({

                                serverId: serverId,
                                authorId: authorId,
                                authorName: authorName,
                                isBuy: "liq_overone",
                                subject: JSON.stringify(table),
                                value: '0',
                                simulation: "true",
                                expectedPrice: totalPrice.toString(),

                            })

                        } else {


                            const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Liquidate Shares")
                                .setDescription(">>> Displaying the simulated transaction data")
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Target", value: "`" + totalUser + "`", inline: false },
                                    { name: "Sell Price", value: "`" + parseFloat(totalPrice).toFixed(3) + "Ξ`", inline: true },
                                    { name: "Sell Amount", value: "`" + totalShares + "`", inline: true },
                                    { name: "Transaction Data 🚫", value: "```More than half of the simulation failed. The action isn't executable.```", inline: false },

                                )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                            await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [buttonRowChoiceNo], ephemeral: true });



                        }








                    } else if (userSetup == null) {




                        const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Friend Tech Setup")
                            .setDescription(">>> Displaying your Friend.tech wallet setup")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .addFields(
                                { name: " ", value: "You don't have a wallet imported in your Friend.tech portfolio. To get started, use the button below.", inline: true },

                            )
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [errorNotEthereum], components: [buttonsRowNew], ephemeral: true });


                    }





                } else if (action == "userlookup") {




                    const passwordAdminDashboard = new ModalBuilder()
                        .setCustomId('modal_friendtech_portfolio_exec_userlookup')
                        .setTitle('Liquidate One');

                    // Add components to modal

                    // Create the text input components
                    const channel = new TextInputBuilder()
                        .setCustomId('modal_friendtech_portfolio_exec_userlookupR1')
                        .setLabel("Share Username")
                        .setPlaceholder("The twitter username of the share to lookup")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)




                    // An action row only holds one text input,
                    // so you need one action row per text input.
                    const firstActionRowSetProfile = new ActionRowBuilder().addComponents(channel);


                    // Add inputs to the modal
                    passwordAdminDashboard.addComponents(firstActionRowSetProfile)

                    // Show the modal to the user
                    await interaction.showModal(passwordAdminDashboard);


                } else if (action == "tutorial") {

                    const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Portfolio Manager Tutorial")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .setDescription(">>> The Friend.Tech portfolio manager has several easy-to-use features.")
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "💣 *Liquidate All*", value: "Liquidate all your portfolio. This button allows you to sell all the keys you are currently holding.", inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: "🧯 *Liquidate Few*", value: "Liquidate few share at once by giving their twitter username to the bot. This feature accepts a maximum of 20 shares.", inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: "🎯 *Liquidate One*", value: "Liquidate a sing share by giving the user's twitter username to the bot.", inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: "🪄 *Liquidate +1*", value: "Liquidate all the shares of which you own more than one, and keep only one of each.", inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: "👁 *User Lookup*", value: "Allows you to view the data of a particular user. It also opens the trading panel, similar to `/friendtech user`.", inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: " ", value: "*⚠️ Please note that your liquidation will be based on the current displayed metrics, refresh to update the execution targets. Also, every actions are simulated before being executed, and asks for a confirmation on your side.*", inline: false },

                        )
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.reply({ embeds: [setfpEmbedNotForYou], ephemeral: true });




                } else if (action == "delete") {




                    const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Deleting Liquidation")
                        .setDescription(">>> Displaying the simulated transaction data")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "Deleting Liquidation <a:AuraLoading:1134068847616458792>", value: " ", inline: false },

                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })



                    await interaction.update({ embeds: [gasTrackerEmbed], components: [], ephemeral: true });



                    await exe_friendTech.destroy({ where: { authorId: authorId, serverId: serverId, treated: null } });

                    await addTimeount(0.5)


                    const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Liquidation Cancelled")
                        .setDescription(">>> Displaying the simulated transaction data")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "Liquidation Cancelled ✅", value: "Your task has been successfully cancelled, you can recreate a new one from the portfolio manager dashboard.", inline: false },

                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })



                    await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [], ephemeral: true });








                } else if (action == "refresh") {



await interaction.deferUpdate({ ephemeral: true })

                    const userSetup = await infra_friendTech.findOne({ where: { authorId: authorId } })


                    if (userSetup != null) {


                        const userAddress = decrypt(userSetup.dataValues.walletAddress)


                        let totalFTValue = 0
                        let totalSharesValue = 0
                        let totalFeesCollected = 0

                        let holdingCount = 0
                        let totalShares = 0

                        let holdingTable = []

                        let twitterUsername = ""
                        let twitterName = ""
                        let twitterPfp = ""


                        let findUser = []
                        let isMatch = true
                        let isExactMatch = true


                        let userSetAddress = "0x"










                        const buttonsRowNoPortfolio = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('friendtech-portfolio-first-button')
                                    .setLabel('first page')
                                    .setStyle(2)
                                    .setDisabled(true),
                                new ButtonBuilder()
                                    .setCustomId('friendtech-portfolio-previous-button')
                                    .setLabel('previous page')
                                    .setStyle(2)
                                    .setDisabled(true),
                                new ButtonBuilder()
                                    .setCustomId('friendtech-portfolio-next-button')
                                    .setLabel('next page')
                                    .setStyle(2)
                                    .setDisabled(true),
                                new ButtonBuilder()
                                    .setCustomId('friendtech-portfolio-last-button')
                                    .setLabel('last page')
                                    .setStyle(2)
                                    .setDisabled(true),
                                new ButtonBuilder()
                                    .setCustomId('button_friendtech_portfolio_exec_myportfolio')
                                    .setLabel('👝 My Portfolio')
                                    .setStyle(1)
                                    .setDisabled(true),
                            );


                        const buttonsRowPortfolio = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('friendtech-portfolio-first-button')
                                    .setLabel('first page')
                                    .setStyle(2)
                                    .setDisabled(true),
                                new ButtonBuilder()
                                    .setCustomId('friendtech-portfolio-previous-button')
                                    .setLabel('previous page')
                                    .setStyle(2)
                                    .setDisabled(true),
                                new ButtonBuilder()
                                    .setCustomId('friendtech-portfolio-next-button')
                                    .setLabel('next page')
                                    .setStyle(2),
                                new ButtonBuilder()
                                    .setCustomId('friendtech-portfolio-last-button')
                                    .setLabel('last page')
                                    .setStyle(2),
                                new ButtonBuilder()
                                    .setCustomId('button_friendtech_portfolio_exec_myportfolio')
                                    .setLabel('👝 My Portfolio')
                                    .setStyle(1)
                                    .setDisabled(true),
                            );


                        const buttonsRowPortfolioAction = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('button_friendtech_portfolio_exec_liqAll')
                                    .setLabel('💣 Liquidate All')
                                    .setStyle(4),
                                new ButtonBuilder()
                                    .setCustomId('button_friendtech_portfolio_exec_liqFew')
                                    .setLabel('🧯 Liquidate Few')
                                    .setStyle(4),
                                new ButtonBuilder()
                                    .setCustomId('button_friendtech_portfolio_exec_liqOne')
                                    .setLabel('🎯 Liquidate One')
                                    .setStyle(3),
                                new ButtonBuilder()
                                    .setCustomId('button_friendtech_portfolio_exec_liqOverOne')
                                    .setLabel('🪄 Liquidate +1')
                                    .setStyle(3),

                            );

                        const buttonsRowPortfolioAction2 = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('button_friendtech_portfolio_exec_refresh')
                                    .setLabel('🔁 Refresh')
                                    .setStyle(1),
                                new ButtonBuilder()
                                    .setCustomId('button_friendtech_portfolio_exec_userlookup')
                                    .setLabel('👁 User Lookup')
                                    .setStyle(1),
                                new ButtonBuilder()
                                    .setCustomId('button_friendtech_portfolio_exec_tutorial')
                                    .setLabel('📑 Tutorial')
                                    .setStyle(1),
                                new ButtonBuilder()
                                    .setCustomId('friendtech_exec_setup-button')
                                    .setLabel('💻 Setup')
                                    .setStyle(1),



                            );



                        const userBalance = parseFloat(await web3Base1RPC.eth.getBalance(userAddress)) / 10 ** 18
                        //{}


                        const userInfoCall = await axios.get("https://prod-api.kosetto.com/users/" + userAddress)

                        holdingCount = userInfoCall.data.holdingCount
                        totalFeesCollected = userInfoCall.data.lifetimeFeesCollectedInWei / 10 ** 18
                        twitterUsername = userInfoCall.data.twitterUsername
                        twitterName = userInfoCall.data.twitterName
                        twitterPfp = userInfoCall.data.twitterPfpUrl


                        let userHoldingCall = await axios.get("https://prod-api.kosetto.com/users/" + userAddress + "/token-holdings")



                        if (userHoldingCall.data.nextPageStart != 50) {

                            for (const holding of userHoldingCall.data.users) {

                                let holdingAddress = holding.address.toLowerCase()

                                const holderInfo = await axios.get("https://prod-api.kosetto.com/users/" + holdingAddress)
                                let holderPrice = holderInfo.data.displayPrice / 10 ** 18


                                let obj = {}
                                obj.username = holding.twitterUsername
                                obj.address = holding.address.toLowerCase()
                                obj.pfp = holding.twitterPfpUrl.toLowerCase()
                                obj.balance = holding.balance
                                obj.price = holderPrice

                                if (!holdingTable.includes(obj)) {

                                    totalShares += parseFloat(holding.balance)
                                    totalSharesValue += parseFloat(holderPrice * holding.balance)

                                    holdingTable.push(obj)
                                }
                            }

                        } else {

                            for (const holding of userHoldingCall.data.users) {


                                let holdingAddress = holding.address.toLowerCase()

                                const holderInfo = await axios.get("https://prod-api.kosetto.com/users/" + holdingAddress)
                                let holderPrice = holderInfo.data.displayPrice / 10 ** 18


                                let obj = {}
                                obj.username = holding.twitterUsername
                                obj.address = holding.address.toLowerCase()
                                obj.pfp = holding.twitterPfpUrl.toLowerCase()
                                obj.balance = holding.balance
                                obj.price = holderPrice

                                if (!holdingTable.includes(obj)) {

                                    totalShares += parseFloat(holding.balance)
                                    totalSharesValue += parseFloat(holderPrice * holding.balance)

                                    holdingTable.push(obj)
                                }
                            }

                            let itemsNumber = 50
                            let callPage = ""

                            let continuation = userHoldingCall.data.nextPageStart

                            while (continuation != null) {




                                callPage = await axios.get("https://prod-api.kosetto.com/users/" + userAddress + "/token-holdings?pageStart=" + itemsNumber)

                                continuation = callPage.data.nextPageStart

                                if (continuation != null) {

                                    for (const holding of callPage.data.users) {

                                        let holdingAddress = holding.address.toLowerCase()

                                        const holderInfo = await axios.get("https://prod-api.kosetto.com/users/" + holdingAddress)
                                        let holderPrice = holderInfo.data.displayPrice / 10 ** 18


                                        let obj = {}
                                        obj.username = holding.twitterUsername.toLowerCase()
                                        obj.address = holding.address.toLowerCase()
                                        obj.pfp = holding.twitterPfpUrl.toLowerCase()
                                        obj.balance = holding.balance
                                        obj.price = holderPrice

                                        if (!holdingTable.includes(obj)) {

                                            totalShares += parseFloat(holding.balance)
                                            totalSharesValue += parseFloat(holderPrice * holding.balance)

                                            holdingTable.push(obj)
                                        }
                                    }


                                    itemsNumber += 50

                                } else {
                                    break
                                }
                            }
                        }


                        // Tri du tableau JSON en fonction de la valeur "floorAsk * tokenCount" de chaque objet "collection" en ordre décroissant
                        let holdingTableSorted = holdingTable.sort((a, b) => b.balance * b.price - a.balance * a.price)



                        let holdingFormatted = "Subject                  #Held        Price        Value\n\n"
                        let index = 0

                        // On construit la table d'holders
                        for (const holding of holdingTableSorted) {

                            index++

                            if (index <= 16) {

                                let holderName = reduceText(holding.username, 26).toLowerCase()
                                let holderBalance = holding.balance
                                let price = parseFloat(holding.price).toFixed(3)
                                let holderValue = parseFloat(holderBalance * holding.price).toFixed(3)


                                let part1 = holderName
                                let part2 = holderBalance
                                let part3 = parseFloat(price).toFixed(2) + "Ξ"
                                let part4 = parseFloat(holderValue).toFixed(2) + "Ξ\n"


                                let spaceSize = 30 - part2.length - part1.length
                                let spaceLenght = ""
                                for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

                                let spaceSize2 = 13 - part3.length
                                let spaceLenght2 = ""
                                for (let i = 0; i < spaceSize2; i++) { spaceLenght2 += " " }

                                let spaceSize3 = 13 - part4.length
                                let spaceLenght3 = ""
                                for (let i = 0; i < spaceSize3; i++) { spaceLenght3 += " " }


                                holdingFormatted += part1 + spaceLenght + part2 + spaceLenght2 + part3 + spaceLenght3 + part4



                            } else {
                                break
                            }
                        }

                        const itemsPerPage = 16; // Nombre d'objets par page
                        const pageIndex = Math.ceil(holdingTableSorted.length / itemsPerPage);


                        totalFTValue = totalSharesValue + userBalance

                        if (holdingFormatted == "") { holdingFormatted = "```No shares found for this user.                         ```" }


                        const userFTEmbed = new EmbedBuilder().setColor("#060A8F")
                            .setTitle(twitterName + "'s portfolio")
                            .setDescription(">>> Displaying the friend.tech portfolio metrics.")
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            //.setThumbnail(twitterPfp)
                            .setTimestamp()
                            .addFields(
                                { name: " ", value: " ", inline: false },
                                { name: "Total Value", value: "`" + parseFloat(totalFTValue).toFixed(3) + "Ξ`", inline: true },
                                { name: "Shares Value", value: "`" + parseFloat(totalSharesValue).toFixed(3) + "Ξ`", inline: true },
                                { name: "Base ETH Value", value: "`" + parseFloat(userBalance).toFixed(3) + "Ξ`", inline: true },
                                { name: " ", value: " ", inline: false },
                                { name: "Shares:", value: "```" + holdingFormatted + "```", inline: false },
                                { name: "Links", value: '[Friendtech](https://www.friend.tech/rooms/' + userAddress + ") ∙ " + '[Twitter](https://twitter.com/' + twitterUsername.toLowerCase() + ") ∙ " + '[Basescan](https://basescan.org/address/' + userAddress + ") ∙ " + '[Holding](https://www.friend.tech/trades/' + userAddress + ") ∙ " + '[Chart](https://www.degenz.finance/friendtech/portfolio?address=' + userAddress + ")", inline: false },
                                { name: "Page:", value: "`[1/" + pageIndex + "]`", inline: false },

                            )
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                        if (pageIndex <= 1) { await interaction.editReply({ embeds: [userFTEmbed], components: [buttonsRowNoPortfolio, buttonsRowPortfolioAction, buttonsRowPortfolioAction2] }); }
                        else { await interaction.editReply({ embeds: [userFTEmbed], components: [buttonsRowPortfolio, buttonsRowPortfolioAction, buttonsRowPortfolioAction2] }); }




                        let holdingDataTable = []
                        let obj = {}
                        obj.name = twitterName
                        obj.username = twitterUsername
                        obj.address = userAddress
                        obj.totalValue = parseFloat(totalFTValue).toFixed(3) + "Ξ"
                        obj.shareValue = parseFloat(totalSharesValue).toFixed(3) + "Ξ"
                        obj.userBalance = parseFloat(userBalance).toFixed(3) + "Ξ"
                        obj.links = '[Friendtech](https://www.friend.tech/rooms/' + userAddress + ") ∙ " + '[Twitter](https://twitter.com/' + twitterUsername.toLowerCase() + ") ∙ " + '[Basescan](https://basescan.org/address/' + userAddress + ") ∙ " + '[Holding](https://www.friend.tech/trades/' + userAddress + ") ∙ " + '[Chart](https://www.degenz.finance/friendtech/portfolio?address=' + userAddress + ")"
                        holdingDataTable.push(obj)


                        //On fait le call àbn  la base SQL
                        await interactionData.destroy({ where: { authorId: authorId, commandName: "friendtech-portfolio", serverId: serverId } })

                        await interactionData.create({

                            authorId: authorId,
                            authorName: authorName,
                            serverId: serverId,
                            commandName: "friendtech-portfolio",
                            interactionId: interaction.id,
                            walletAddress: "N/A",
                            walletCategory: "N/A",
                            embed1: JSON.stringify(holdingTableSorted),
                            embed2: JSON.stringify(holdingDataTable),
                            embed3: "N/A",
                            pageIndex: pageIndex.toString(),
                            actualPage: "1",
                            walletName: "N/A",
                            selecedTimestamp: "N/A",
                            selectedCollection: "N/A",
                            collectionSlug: "N/A",
                            collectionBanner: "N/A",
                            avgDeriskPrice: "N/A",
                            floorPrice: "N/A",
                            lowerMarketlace: "N/A",
                            collectionName: "N/A",
                            buyCount: "N/A",
                            soldCount: "N/A",
                            remaining: "N/A",
                            avgBuy: "N/A",
                            avgSold: "N/A",
                            realisedProfit: "N/A",
                            potentialProfit: "N/A",
                            roi: "N/A",
                            visualTitle: "N/A",
                            userAvatar: "N/A",
                            nbMembersInvolved: "N/A",
                            totalTradeCount: "N/A",
                        })






                    } else if (userSetup == null) {




                        const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Friend Tech Setup")
                            .setDescription(">>> Displaying your Friend.tech wallet setup")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .addFields(
                                { name: " ", value: "You don't have a wallet imported in your Friend.tech portfolio. To get started, use the button below.", inline: true },

                            )
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [errorNotEthereum], components: [buttonsRowNew], ephemeral: true });


                    }







                }









            } else {

                const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Portfolio Manager")
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .setDescription("An error occured while retrieving your request. Please try again or contact a team member if the issue persists.")
                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                await interaction.reply({ embeds: [setfpEmbedNotForYou], ephemeral: true });

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
            let reportCommand = "/admin-clientListFirstPage"

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



            console.log("//////////\n\nDetails de l'erreur :\n\n" + error.stack + "\n\n//////////")

            const reduceText = require("../../../functions/reducetext")
            const roleTag = "1121510423687090186"


            const updateEmbed = new EmbedBuilder().setColor("#060A8F")
                .setTitle("New Report")
                .setDescription(">>> A new report has just been sent.")
                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                .setAuthor({ name: "Aura", iconURL: "https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png" })
                .setTimestamp()
                .addFields(
                    { name: " ", value: " ", inline: false },
                    { name: "Content:", value: "A new `bug` has been submitted for the `" + reportCommand + "` command by `the bot report division` in `" + serverName + "`. You can use the administrator dashboard to consult it.", inline: false },
                    { name: " ", value: " ", inline: false },
                    { name: "Error:", value: "```" + reduceText(error.stack, 1024) + "```", inline: false },
                )
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


            await channel.send("<@&" + roleTag + ">");

            await channel.send({ embeds: [updateEmbed] });



            const errorAnswerUser = new EmbedBuilder().setColor("#060A8F")
                .setTitle("An error occured")
                .setDescription("An error has occurred while executing this command. These errors can occur for a variety of reasons, such as :\n∙ Unexpected traffic\n∙ API maintenance\n∙ Occasional bug\n\nPlease note that a report has already been sent to our team, who will fix the problem as soon as possible. You can still use `/report` to give more details about the error and help our team.")
                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                .setTimestamp()
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


            await interaction.reply({ embeds: [errorAnswerUser], ephemeral: true });


        }
    },
};



