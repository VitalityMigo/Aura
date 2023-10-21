/**
 * @file Sample modal interaction
 * @author JAYZHVJ
 * @since 3.2.0
 * @version 3.2.2
 */

/**
 * @type {import('../../../typings').ModalInteractionCommand}
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { accessSql, profileData, adminsql, reportsql, exe_friendTech, infra_friendTech, interactionData, sequelize } = require('../../../events/database');
const fs = require('fs');
const moment = require('moment');


const { web3Base1RPC, web3BaseUnifra, web3BaseDRPC, web3BaseBlast } = require('../../../config/web3config');

const axios = require("axios")

const shareContractAbi = require("../../../contracts/friendtech/share.json")
const shareContractAddress = "0xcf205808ed36593aa40a44f10c7f7c2f67d4a4d4"
const shareContract = new web3BaseBlast.eth.Contract(shareContractAbi, shareContractAddress);




const getTwitterUserInfo = require("../../../functions/twitteruserinfo")
const ethPrice = require("../../../functions/getethprice")
const { formatHoldersData, formatTradesData } = require('../../../functions/FT-useraccelerator');
const decrypt = require("../../../functions/decrypt")
const encrypt = require("../../../functions/encrypt")


function removeCharacter(str, char) {
    const regex = new RegExp(char, 'g');
    return str.replace(regex, '');
}



const buttonRowChoiceNo = new ActionRowBuilder()
    .addComponents(

        new ButtonBuilder()
            .setCustomId('button_friendtech_portfolio_exec_delete')
            .setLabel('Cancel')
            .setStyle(4),

    );



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




module.exports = {
    id: "modal_friendtech_portfolio_exec_",

    async execute(interaction) {


        //Récupérer informations de l'utilisateur de la commande
        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let botId = interaction.applicationId
        let serverId = interaction.member.guild.id


        try {

            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")
            //Checkpoint
            console.log("// Step 2 : Authorization - Executed ✅")




            const customId = interaction.customId

            const match = customId.match(/modal_friendtech_portfolio_exec_(.+)/);



            if (match && match[1]) {

                const action = match[1];

                

                if (action == "liqOne") {

                    await interaction.deferReply({ ephemeral: true })


                    const userSetup = await infra_friendTech.findOne({ where: { authorId: authorId } })


                    if (userSetup != null) {


                        const sender = decrypt(userSetup.dataValues.walletAddress)
                        const senderPK = decrypt(userSetup.dataValues.privateKey)


                        const usernameProvided = interaction.fields.getTextInputValue('modal_friendtech_portfolio_exec_liqOneR1')
                        const givenUsername = removeCharacter(usernameProvided, "@").toLowerCase()


                        const lastInteraction = await interactionData.findOne({ where: { authorId: authorId, commandName: "friendtech-portfolio", serverId: serverId } })
                        const userTable = JSON.parse(lastInteraction.dataValues.embed1)
                        const user = userTable.find(obj => obj.username.toLowerCase() == givenUsername)

                        if (user) {


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
                                    { name: "Target", value: "`" + subjectUsername.toLowerCase() + "`", inline: false },
                                    { name: "Sell Price", value: "`" + parseFloat(valueETH).toFixed(3) + "Ξ`", inline: true },
                                    { name: "Sell Amount", value: "`" + balance + "`", inline: true },
                                    { name: "Simulation", value: "<a:AuraLoading:1134068847616458792>", inline: false },

                                )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })



                            await interaction.editReply({ embeds: [gasTrackerEmbed], components: [], ephemeral: true });



                            let simulationState = true
                            let gasUsed = ""
                            let errorMessageFormatted = ""

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


                                const gasPriceCall = await web3BaseUnifra.eth.getGasPrice()
                                const gasPriceGwei = gasPriceCall / 10 ** 9
                                const gasPriceEth = gasPriceCall / 10 ** 18

                                const gasPayed = gasPriceEth * gasUsed
                                const totalValue = expectedPrice - gasPayed

                                const txnDataFormatted = "Sender: " + sender + "\nGas Price: " + parseFloat(gasPriceGwei).toFixed(0) + " gwei\n\nReceive: " + parseFloat(valueETH).toFixed(5) + "Ξ (fees included)\nGas fees: " + parseFloat(gasPayed).toFixed(5) + "Ξ\n\nTotal Value Received: " + parseFloat(totalValue).toFixed(5) + "Ξ"




                                const buttonRowChoice = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('friendtech_portfolio_exec_confirm_liqOne')
                                            .setLabel('Confirm')
                                            .setEmoji("✅")
                                            .setStyle(1),
                                        new ButtonBuilder()
                                            .setCustomId('button_friendtech_portfolio_exec_delete')
                                            .setLabel('Cancel')
                                            .setStyle(4),

                                    );




                                const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Liquidate Shares")
                                    .setDescription(">>> Displaying the simulated transaction data")
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setTimestamp()
                                    .addFields(
                                        { name: " ", value: " ", inline: false },
                                        { name: "Target", value: "`" + subjectUsername.toLowerCase() + "`", inline: false },
                                        { name: "Sell Price", value: "`" + parseFloat(price).toFixed(3) + "Ξ`", inline: true },
                                        { name: "Sell Amount", value: "`" + balance + "`", inline: true },
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
                                obj.subject = subject.toLowerCase()
                                obj.subjectName = subjectUsername
                                obj.action = "🎯 Liquidate One"
                                obj.getSellPriceAfterFee = valueETH
                                obj.amount = balance
                                table.push(obj)

                                await exe_friendTech.create({

                                    serverId: serverId,
                                    authorId: authorId,
                                    authorName: authorName,
                                    isBuy: "liq_one",
                                    subject: JSON.stringify(table),
                                    value: '0',
                                    simulation: "true",
                                    expectedPrice: totalValue.toString(),

                                })




                            } else {

                                const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Liquidate Shares")
                                    .setDescription(">>> Displaying the simulated transaction data")
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setTimestamp()
                                    .addFields(
                                        { name: " ", value: " ", inline: false },
                                        { name: "Target", value: "`" + subjectUsername.toLowerCase() + "`", inline: false },
                                        { name: "Share Price", value: "`" + parseFloat(price).toFixed(3) + "Ξ`", inline: true },
                                        { name: "Amount", value: "`" + balance + "`", inline: true },
                                        { name: "Transaction Data 🚫", value: "```The transaction simulation failed.\n\n" + errorMessageFormatted + "```", inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                                await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [buttonRowChoiceNo], ephemeral: true });

                            }








                        } else {


                            const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Portfolio Manager")
                                .setDescription("The username provided isn't in your holding list. You can only liquidate a Friend Tech key that you are holding. Please try again with a valid username.")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.editReply({ embeds: [errorNotEthereum] });

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



                } else if (action == "liqFew") {



                    await interaction.deferReply({ ephemeral: true })


                    const userSetup = await infra_friendTech.findOne({ where: { authorId: authorId } })


                    if (userSetup != null) {


                        const sender = decrypt(userSetup.dataValues.walletAddress)
                        const senderPK = decrypt(userSetup.dataValues.privateKey)


                        const inputRawUsernames = interaction.fields.getTextInputValue('modal_friendtech_portfolio_exec_liqFewR1')

                        const separators = /[,\/:;-\s]/;  // Ajout de \s pour représenter l'espace
                        const usernameListRaw1 = inputRawUsernames.split(separators);
                        const usernameListRaw2 = usernameListRaw1.filter(item => item !== '');
                        const usernameList = [...new Set(usernameListRaw2.map(item => item.toLowerCase()))];
                        const userCount = usernameList.length

                        
                        if (userCount <= 20) {


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

                            const targetTable = []

                            for (const targetedUser of usernameList) {

                                const givenUsername = removeCharacter(targetedUser, "@").toLowerCase()

                                const lastInteraction = await interactionData.findOne({ where: { authorId: authorId, commandName: "friendtech-portfolio", serverId: serverId } })
                                const userTable = JSON.parse(lastInteraction.dataValues.embed1)
                                const user = userTable.find(obj => obj.username.toLowerCase() == givenUsername)


                                if (user) {

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




                            }


                            if ((simulationSuccess * 2) >= simulationCount && isOne == true) {

                            const buttonRowChoice = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('friendtech_portfolio_exec_confirm_liqFew')
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
                            obj.subjectName = 'liq_few'
                            obj.action = "🧯 Liquidate Few"
                            obj.getSellPriceAfterFee = "0"
                            obj.amount = totalShares
                            table.push(obj)

                            await exe_friendTech.create({

                                serverId: serverId,
                                authorId: authorId,
                                authorName: authorName,
                                isBuy: "liq_few",
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


                        } else {




                            const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Portfolio Manager")
                                .setDescription("The multiple liquidation feature allows a maximum of 20 users to be liquidated at once. Please try again using the appropriate form.")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.editReply({ embeds: [errorNotEthereum], components: [buttonsRowNew], ephemeral: true });


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


                    await interaction.deferReply({ ephemeral: true })




                    let id = ""
                    let address = ""
                    let twitterUsername = ""
                    let twitterName = ""
                    let twitterPfp = ""
                    let twitterUserId = ""

                    let holderCount = 0
                    let shareSupply = 0
                    let price = 0
                    let totalFeesCollected = 0
                    let marketCap = 0

                    // let holdersFormattedEmbeds = ""
                    let uniqueHolders = 0

                    let lastTrade = 0
                    let lastMessage = 0
                    let lastOnlineTimestamp = 0
                    let joinedAt = 0

                    let airdropTier = "UNRANKED"
                    let airdropPoints = 0

                    let watchlistCount = 0
                    let holdingCount = 0

                    let volume6h = 0
                    let volume1d = 0
                    let volume7d = 0

                    //  let tradersFormatted = ""

                    let followers = "`None`"
                    let following = "`None`"
                    let created = "`Unknwon`"

                    let userAddress = ""


                    let pfp2 = ""



                    const usernameProvided = interaction.fields.getTextInputValue('modal_friendtech_portfolio_exec_userlookupR1');
                    const givenUsername = removeCharacter(usernameProvided, "@")


                    const lastInteraction = await interactionData.findOne({ where: { authorId: authorId, commandName: "friendtech-portfolio", serverId: serverId } })
                    const userTable = JSON.parse(lastInteraction.dataValues.embed1)
                    const user = userTable.find(obj => obj.username.toLowerCase() == givenUsername.toLowerCase())


                    if (user) {


                        const ethUsdPricePromise = ethPrice()

                        userAddress = user.address




                        try {

                            const twitterPromise = getTwitterUserInfo(user.username)
                            const tradersPromise = formatTradesData(userAddress)
                            // const airdropInfoCall = axios.get("https://prod-api.kosetto.com/points/" + userAddress, { headers: friendtechHeaders })
                            const balanceCall = web3BaseDRPC.eth.getBalance(userAddress)


                            const userInfoCall = await axios.get("https://prod-api.kosetto.com/users/" + userAddress)



                            address = userInfoCall.data.address
                            id = userInfoCall.data.id
                            twitterUsername = userInfoCall.data.twitterUsername
                            twitterName = userInfoCall.data.twitterName
                            twitterUserId = userInfoCall.data.twitterUserId
                            lastOnlineTimestamp = parseFloat(userInfoCall.data.lastOnline / 1000).toFixed(0)
                            lastMessage = parseFloat(userInfoCall.data.lastMessageTime / 1000).toFixed(0)
                            joinedAt = 1
                            holderCount = userInfoCall.data.holderCount
                            shareSupply = userInfoCall.data.shareSupply
                            price = userInfoCall.data.displayPrice / 10 ** 18
                            totalFeesCollected = userInfoCall.data.lifetimeFeesCollectedInWei / 10 ** 18
                            pfp2 = userInfoCall.data.twitterPfpUrl
                            watchlistCount = userInfoCall.data.watchlistCount
                            holdingCount = userInfoCall.data.holdingCount




                            const holdersPromise = formatHoldersData(userAddress, price, shareSupply)


                            // On renvoi le premier embed
                            const loadingEmbed = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Panel Loading <a:AuraLoading:1134068847616458792>")
                                .setDescription(">>> Displaying Friend Tech user")
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                // .setThumbnail(twitterPfp)
                                .setTimestamp()
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Target", value: "`" + twitterName + "`", inline: true },
                                    { name: "Action", value: "`📊 Trade Panel`", inline: true },
                                    { name: " ", value: " ", inline: false },
                                    { name: " ", value: "**Trade Panel** <a:AuraLoading:1134068847616458792>", inline: false },

                                )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.editReply({ embeds: [loadingEmbed], ephemeral: true });




                            // Calcul des dernières valeurs
                            marketCap = price * shareSupply
                            uniqueHolders = (holderCount / shareSupply) * 100;




                            const buttonRow = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('button_friendtech_exec_buy_' + userAddress)
                                        .setLabel('📈 Buy')
                                        .setStyle(3),
                                    new ButtonBuilder()
                                        .setCustomId('button_friendtech_exec_quickbuy_' + userAddress)
                                        .setLabel('💫 Flash Buy')
                                        .setStyle(3),
                                    new ButtonBuilder()
                                        .setCustomId('button_friendtech_exec_sell_' + userAddress)
                                        .setLabel('📉 Sell')
                                        .setStyle(4),
                                    new ButtonBuilder()
                                        .setCustomId('button_friendtech_exec_quicksell_' + userAddress)
                                        .setLabel('❄️ Flash Sell')
                                        .setStyle(4),
                                    new ButtonBuilder()
                                        .setCustomId('friendtech_exec_setup-button')
                                        .setLabel('💻 Setup')
                                        .setStyle(1),

                                )


                            const buttonRow2 = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('button_friendtech_user_refresh_' + userAddress)
                                        .setLabel('🔄 Refresh')
                                        .setStyle(1),
                                    new ButtonBuilder()
                                        .setCustomId('friendtech_infra_help-button')
                                        .setLabel('📑 Tutorial')
                                        .setStyle(1),
                                    new ButtonBuilder()
                                        .setCustomId('button_friendtech_infra_security_' + userAddress)
                                        .setLabel('📡 Audit')
                                        .setStyle(1),


                                )


                            let [balanceRaw, twitterInfos] = await Promise.all([balanceCall, twitterPromise]);

                            if (twitterInfos) {
                                followers = twitterInfos.followers_count
                                following = twitterInfos.friends_count
                                let pfp = twitterInfos.profile_image_url_https
                                twitterPfp = pfp.replace("_normal", "")

                                created = "<t:" + Math.floor(((new Date(twitterInfos.created_at)).getTime() / 1000)) + ":R>"
                            } else {
                                twitterPfp = pfp2
                            }


                            const balance = balanceRaw / 10 ** 18
                            // On récup les points d'airdrops
                            //  airdropTier = airdropInfos.data.tier.toUpperCase()
                            //  airdropPoints = airdropInfos.data.totalPoints
                            //  let airdropRank = airdropInfos.data.leaderboard


                            let [holdersFormattedEmbeds, tradersFormatted, ethUsdPrice] = await Promise.all([holdersPromise, tradersPromise, ethUsdPricePromise]);


                            if (holdersFormattedEmbeds == "") { holdersFormattedEmbeds = "```No holders found for this share.                         ```" }
                            if (tradersFormatted == "") { tradersFormatted = "```No recent trade found for this share.                    ```" }


                            const userFTEmbed = new EmbedBuilder().setColor("#060A8F")
                                .setTitle(twitterName)
                                .setDescription(">>> Displaying the friend.tech metrics of `" + twitterName + "`.")
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setThumbnail(twitterPfp)
                                .setTimestamp()
                                .addFields(
                                    { name: "Name", value: "`" + twitterName + "`", inline: true },
                                    { name: "Username", value: "`" + twitterUsername + "`", inline: true },
                                    { name: " ", value: " ", inline: true },
                                    { name: "Followers", value: "`" + followers + "`", inline: true },
                                    { name: "Following", value: "`" + following + "`", inline: true },
                                    { name: "Created", value: created, inline: true },
                                    { name: " ", value: " ", inline: false },
                                    { name: "Price", value: "`" + parseFloat(price).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(price * ethUsdPrice).toFixed(0)) + "$)`", inline: true },
                                    { name: "Market Cap", value: "`" + parseFloat(marketCap).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(marketCap * ethUsdPrice).toFixed(0)) + "$)`", inline: true },
                                    { name: " ", value: " ", inline: true },
                                    { name: "Share Supply", value: "`" + shareSupply + "`", inline: true },
                                    { name: "Holders", value: "`" + holderCount + "`", inline: true },
                                    { name: "Unique Holders", value: "`" + parseFloat(uniqueHolders).toFixed(1) + "%`", inline: true },
                                    { name: "Holding", value: "`" + holdingCount + "`", inline: true },
                                    { name: "Watchlist", value: "`" + watchlistCount + "`", inline: true },
                                    { name: "Balance", value: "`" + parseFloat(balance).toFixed(3) + "Ξ`", inline: true },
                                    { name: " ", value: " ", inline: false },
                                    { name: "Last Online", value: "<t:" + lastOnlineTimestamp + ":R>", inline: true },
                                    { name: "Last Message", value: "<t:" + lastMessage + ":R>", inline: true },
                                    { name: "Joined At", value: "<t:" + joinedAt + ":R>", inline: true },
                                    { name: "Holders:", value: holdersFormattedEmbeds, inline: false },
                                    { name: "Last Trades:", value: tradersFormatted, inline: false },
                                    { name: "FT Wallet:", value: "```" + userAddress + "```", inline: false },
                                    { name: "Links", value: '[Friendtech](https://www.friend.tech/rooms/' + userAddress + ") ∙ " + '[Twitter](https://twitter.com/' + twitterUsername.toLowerCase() + ") ∙ " + '[Basescan](https://basescan.org/address/' + userAddress + ") ∙ " + '[Holders](https://www.friend.tech/trades/' + userAddress + ") ∙ " + '[Chart](https://www.degenz.finance/friendtech/portfolio?address=' + userAddress + ")", inline: false }

                                )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.editReply({ embeds: [userFTEmbed], components: [buttonRow, buttonRow2] });



                        } catch (error) {

                            console.log(error)
                            const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Friend Tech")
                                .setDescription("An error occured whil retreiving the Friend.tech profile. Please try again or feel free to contact a team member if you need help.")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.editReply({ embeds: [errorNotEthereum] });


                        }







                    } else {


                        const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Friend Tech Lookup")
                            .setDescription("The username provided isn't in your holding list. If you want to find any Friend Tech user, please use `/friendtech user` instead. The user lookup button only accepts keys you are holding.")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [errorNotEthereum] });





                    }






                } else {

                    const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Portfolio Manager")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setDescription("An error occured while retrieving your data. Please try again or contact a team member if the issue persists.")
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.reply({ embeds: [setfpEmbedNotForYou], ephemeral: true });

                }


            } else {

                const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Portfolio Manager")
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .setDescription("An error occured while retrieving your data. Please try again or contact a team member if the issue persists.")
                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                await interaction.reply({ embeds: [setfpEmbedNotForYou], ephemeral: true });

            }







            return;

        } catch (error) {



            console.log("// Error - sent in report ❌")

            //On envoi une notif
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
            let reportCommand = "/profileset"

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





