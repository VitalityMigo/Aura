const { ButtonInteraction } = require('discord.js');
const { ActionRowBuilder, EmbedBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const { accessSql, profileData, reportsql, adminsql, interactionData, infra_coin, manager_coin, sequelize } = require('../../../events/database');
const moment = require('moment');

// Fonctions d'execution et de formattage
const { createFactory, generateTrade, encodeSwapExactETHForTokens, signTransaction, gasOracle, gasPreset, quoteToWei, setSlippage, simulateTransaction } = require('../../../functions/coin-utils')
const decrypt = require("../../../functions/decrypt")
const formatCoinValueSign = require("../../../functions/formatNumberEmbed")
const addTimeount = require("../../../functions/addtimeout")

// Déclaration des valeur liées aux contrats V2 et V3
const chainId = 1


//Web3 API + Cloudfare Provider
var Web3 = require("web3")
const web3 = new Web3("https://cloudflare-eth.com")


function formatWallet(input) {
    return input.length > 35 ? `${input.substring(0, 5)}…${input.substring(input.length - 4)}` : input;
}

module.exports = {
    id: 'button_coinmanager_exec_confirm',

    async execute(interaction) {
        if (!(interaction instanceof ButtonInteraction)) return;

        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id
        let botId = interaction.applicationId

        await interaction.deferReply({ ephemeral: true })

        try {

            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")




            //Checkpoint
            console.log("// Step 2 : Authorization - Executed ✅")


            const setup = await manager_coin.findOne({ where: { authorId, authorId, serverId: serverId, treated: null } })

            if (setup != null) {



                const action = setup.dataValues.action

                if (action == "transferETH") {


                    const amount = setup.dataValues.value

                    const infoTable = JSON.parse(setup.dataValues.infos)
                    const txnTable = JSON.parse(setup.dataValues.transaction)

                    const receiverCount = infoTable.receivers
                    const data = txnTable.data
                    const value = txnTable.value
                    const addresses = infoTable.addresses

                    const gasExpected = txnTable.gas_fees / 10 ** 18

                    const private_key = txnTable.privateKey

                    // On renvoi le premier embed
                    const gasTrackerEmbed3 = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Transaction Pending <a:AuraLoading:1134068847616458792>")
                        .setDescription(">>> Displaying the transaction execution")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "Receiver(s)", value: "`" + receiverCount + "`", inline: true },
                            { name: "Action", value: "`💌 Transfer ETH`", inline: true },
                            { name: " ", value: "**Transfering** `" + amount + "` ** ETH for** `" + gasExpected + "Ξ`", inline: false },
                            { name: "Transaction hash", value: "<a:AuraLoading:1134068847616458792>", inline: false },

                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.editReply({ embeds: [gasTrackerEmbed3], ephemeral: true });



                    if (receiverCount == 1) {

                        // Setting de gas
                        const gasLimit = 21000

                        const address = addresses[0]


                        //On construit l'objet de transaction
                        const txn_param = {
                            gasLimit: gasLimit,
                            to: address,
                            value: value,
                            data: data,
                            chainId: chainId,

                        };


                        // On signe

                        const receipt = await signTransaction(txn_param, decrypt(private_key))


                        if (receipt && receipt.status == true) {

                            // Transaction signé et exécuter avec succès
                            // Renvoi les informations avec hash de la txn réussi


                            const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Transaction Confirmed ✅")
                                .setDescription(">>> Displaying the transaction execution")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Receiver(s)", value: "`" + receiverCount + "`", inline: true },
                                    { name: "Action", value: "`💌 Transfer ETH`", inline: true },
                                    { name: " ", value: " ", inline: false },
                                    { name: " ", value: "**Transfered** `" + amount + "` ** ETH for** `" + receipt.gas_fees + "Ξ`", inline: false },
                                    { name: " ", value: " ", inline: false },
                                    { name: "Transaction hash:", value: "```" + receipt.hash + "```∟ Transaction details [here](https://etherscan.io/tx/" + receipt.hash + ")", inline: false },

                                )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });

                            await manager_coin.update({ treated: "yes", txn: receipt.hash.toString() }, { where: { authorId: authorId, serverId: serverId, treated: null } });



                        } else {

                            // Erreur dans la transaction
                            // Erreur détaillé plus bas entre failed txn et failed execution

                            if (!receipt) {


                                // Erreur catch lors de la signature 
                                // Renvoi une erreur avec message comme pour simulation


                                const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Transaction Failed ❌")
                                    .setDescription(">>> Displaying the transaction execution")
                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setTimestamp()
                                    .addFields(
                                        { name: " ", value: " ", inline: false },
                                        { name: "Receiver(s)", value: "`" + receiverCount + "`", inline: true },
                                        { name: "Action", value: "`💌 Transfer ETH`", inline: true },
                                        { name: " ", value: " ", inline: false },
                                        { name: " ", value: "**Failed to transfer** `" + amount + "` ** ETH for** `" + gasExpected + "Ξ`", inline: false },
                                        { name: " ", value: " ", inline: false },
                                        { name: "Transaction error:", value: "```The transaction failed.\n\nThe wallet signature didn't went through       ```", inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });

                                await manager_coin.destroy({ where: { authorId, authorId, serverId: serverId, treated: null } })


                            } else if (receipt.status == false) {

                                // Transaction signé et exécuter mais pas passé
                                // Renvoi les informations avec hash de la txn fail



                                const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Transaction Failed ❌")
                                    .setDescription(">>> Displaying the transaction execution")
                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setTimestamp()
                                    .addFields(
                                        { name: " ", value: " ", inline: false },
                                        { name: "Receiver(s)", value: "`" + receiverCount + "`", inline: true },
                                        { name: "Action", value: "`💌 Transfer ETH`", inline: true },
                                        { name: " ", value: " ", inline: false },
                                        { name: " ", value: "**Failed to transfer** `" + amount + "` ** ETH for** `" + receipt.gas_fees + "Ξ`", inline: false },
                                        { name: " ", value: " ", inline: false },
                                        { name: "Transaction hash:", value: "```" + receipt.hash + "```∟ Transaction details [here](https://etherscan.io/tx/" + receipt.hash + ")", inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });

                                await manager_coin.destroy({ where: { authorId, authorId, serverId: serverId, treated: null } })


                            } else {

                                // Erreur catch lors de la signature ou de l'execution
                                // Renvoi une erreur avec message comme pour simulation


                                const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Transaction Failed ❌")
                                    .setDescription(">>> Displaying the transaction execution")
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setTimestamp()
                                    .addFields(
                                        { name: " ", value: " ", inline: false },
                                        { name: "Receiver(s)", value: "`" + receiverCount + "`", inline: true },
                                        { name: "Action", value: "`💌 Transfer ETH`", inline: true },
                                        { name: " ", value: " ", inline: false },
                                        { name: " ", value: "**Failed to transfer** `" + amount + "` ** ETH for** `" + gasExpected + "Ξ`", inline: false },
                                        { name: " ", value: " ", inline: false },
                                        { name: "Transaction error:", value: "```The transaction failed.\n\n" + receipt.message + "       ```", inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });

                                await manager_coin.destroy({ where: { authorId, authorId, serverId: serverId, treated: null } })



                            }



                        }


                    } else if (receiverCount > 1) {


                        const errorAnswerUser = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Not Available")
                            .setDescription("The batch transfer isn't available and will be soon. In the meantime, you can use the single wallet ETH transfer.")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                        await interaction.editReply({ embeds: [errorAnswerUser], ephemeral: true });



                    }



                } else if (action == "transferERC20") {




                    const value = setup.dataValues.value

                    const infoTable = JSON.parse(setup.dataValues.infos)
                    const txnTable = JSON.parse(setup.dataValues.transaction)

                    const receiverCount = infoTable.receivers
                    const data = txnTable.data
                    const contract = txnTable.contract
                    const tokenAmount = txnTable.amount_token
                    const addresses = infoTable.addresses

                    const gasExpected = txnTable.gas_fees / 10 ** 18

                    const private_key = txnTable.privateKey

                    // On renvoi le premier embed
                    const gasTrackerEmbed3 = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Transaction Pending <a:AuraLoading:1134068847616458792>")
                        .setDescription(">>> Displaying the transaction execution")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "Receiver(s)", value: "`" + receiverCount + "`", inline: true },
                            { name: "Action", value: "`💌 Transfer ERC20`", inline: true },
                            { name: " ", value: "**Transfering** `" + formatCoinValueSign(tokenAmount) + "` ** tokens for** `" + gasExpected + "Ξ`", inline: false },
                            { name: "Transaction hash", value: "<a:AuraLoading:1134068847616458792>", inline: false },

                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.editReply({ embeds: [gasTrackerEmbed3], ephemeral: true });



                    if (receiverCount == 1) {

                        // Setting de gas
                        const gasLimit = 21000

                        const address = addresses[0]


                        //On construit l'objet de transaction
                        const txn_param = {
                            gasLimit: gasLimit,
                            to: contract,
                            value: value,
                            data: data,
                            chainId: chainId,

                        };


                        // On signe

                        const receipt = await signTransaction(txn_param, decrypt(private_key))


                        if (receipt && receipt.status == true) {

                            // Transaction signé et exécuter avec succès
                            // Renvoi les informations avec hash de la txn réussi


                            const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Transaction Confirmed ✅")
                                .setDescription(">>> Displaying the transaction execution")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Receiver(s)", value: "`" + receiverCount + "`", inline: true },
                                    { name: "Action", value: "`💌 Transfer ERC20`", inline: true },
                                    { name: " ", value: " ", inline: false },
                                    { name: " ", value: "**Transfered** `" + formatCoinValueSign(tokenAmount) + "` ** tokens for** `" + receipt.gas_fees + "Ξ`", inline: false },
                                    { name: " ", value: " ", inline: false },
                                    { name: "Transaction hash:", value: "```" + receipt.hash + "```∟ Transaction details [here](https://etherscan.io/tx/" + receipt.hash + ")", inline: false },

                                )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });

                            await manager_coin.update({ treated: "yes", txn: receipt.hash.toString() }, { where: { authorId: authorId, serverId: serverId, treated: null } });



                        } else {

                            // Erreur dans la transaction
                            // Erreur détaillé plus bas entre failed txn et failed execution

                            if (!receipt) {


                                // Erreur catch lors de la signature 
                                // Renvoi une erreur avec message comme pour simulation


                                const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Transaction Failed ❌")
                                    .setDescription(">>> Displaying the transaction execution")
                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setTimestamp()
                                    .addFields(
                                        { name: " ", value: " ", inline: false },
                                        { name: "Receiver(s)", value: "`" + receiverCount + "`", inline: true },
                                        { name: "Action", value: "`💌 Transfer ERC20`", inline: true },
                                        { name: " ", value: " ", inline: false },
                                        { name: " ", value: "**Failed to transfer** `" + formatCoinValueSign(tokenAmount) + "` ** tokens for** `" + gasExpected + "Ξ`", inline: false },
                                        { name: " ", value: " ", inline: false },
                                        { name: "Transaction error:", value: "```The transaction failed.\n\nThe wallet signature didn't went through       ```", inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });

                                await manager_coin.destroy({ where: { authorId, authorId, serverId: serverId, treated: null } })


                            } else if (receipt.status == false) {

                                // Transaction signé et exécuter mais pas passé
                                // Renvoi les informations avec hash de la txn fail



                                const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Transaction Failed ❌")
                                    .setDescription(">>> Displaying the transaction execution")
                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setTimestamp()
                                    .addFields(
                                        { name: " ", value: " ", inline: false },
                                        { name: "Receiver(s)", value: "`" + receiverCount + "`", inline: true },
                                        { name: "Action", value: "`💌 Transfer ERC20`", inline: true },
                                        { name: " ", value: " ", inline: false },
                                        { name: " ", value: "**Failed to transfer** `" + formatCoinValueSign(tokenAmount) + "` ** tokens for** `" + receipt.gas_fees + "Ξ`", inline: false },
                                        { name: " ", value: " ", inline: false },
                                        { name: "Transaction hash:", value: "```" + receipt.hash + "```∟ Transaction details [here](https://etherscan.io/tx/" + receipt.hash + ")", inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });

                                await manager_coin.destroy({ where: { authorId, authorId, serverId: serverId, treated: null } })


                            } else {

                                // Erreur catch lors de la signature ou de l'execution
                                // Renvoi une erreur avec message comme pour simulation


                                const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Transaction Failed ❌")
                                    .setDescription(">>> Displaying the transaction execution")
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setTimestamp()
                                    .addFields(
                                        { name: " ", value: " ", inline: false },
                                        { name: "Receiver(s)", value: "`" + receiverCount + "`", inline: true },
                                        { name: "Action", value: "`💌 Transfer ERC20`", inline: true },
                                        { name: " ", value: " ", inline: false },
                                        { name: " ", value: "**Failed to transfer** `" + formatCoinValueSign(tokenAmount) + "` ** tokens for** `" + gasExpected + "Ξ`", inline: false },
                                        { name: " ", value: " ", inline: false },
                                        { name: "Transaction error:", value: "```The transaction failed.\n\n" + receipt.message + "       ```", inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });

                                await manager_coin.destroy({ where: { authorId, authorId, serverId: serverId, treated: null } })



                            }



                        }


                    } else if (receiverCount > 1) {


                        const errorAnswerUser = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Not Available")
                            .setDescription("The batch transfer isn't available and will be soon. In the meantime, you can use the single wallet ETH transfer.")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                        await interaction.editReply({ embeds: [errorAnswerUser], ephemeral: true });



                    }




                } else if (action == "approveToken") {


                    const value = setup.dataValues.value

                    const txnTable = JSON.parse(setup.dataValues.transaction)

                    const data = txnTable.data
                    const contract = txnTable.contract
                    const amount = txnTable.amount
                    const spender = txnTable.spender
                    const gasPriceRaw = txnTable.gasPrice

                    const gasExpected = txnTable.gas_fees / 10 ** 18

                    const private_key = txnTable.privateKey

                    // On renvoi le premier embed
                    const gasTrackerEmbed3 = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Transaction Pending <a:AuraLoading:1134068847616458792>")
                        .setDescription(">>> Displaying the transaction execution")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "Spender", value: "`" + formatWallet(spender) + "`", inline: true },
                            { name: "Action", value: "`✅ Approve ERC20`", inline: true },
                            { name: " ", value: "**Approving** `" + amount.toLowerCase() + "` ** tokens for** `" + gasExpected + "Ξ`", inline: false },
                            { name: "Transaction hash", value: "<a:AuraLoading:1134068847616458792>", inline: false },

                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.editReply({ embeds: [gasTrackerEmbed3], ephemeral: true });




                    // Setting de gas
                    const gasLimit = 50000
                    const gasMargin = 1.1
                    const gasPrice = Math.ceil(gasPriceRaw * gasMargin)



                    //On construit l'objet de transaction
                    const txn_param = {
                        gasLimit: gasLimit,
                        gasPrice: gasPrice ,
                        to: contract,
                        value: value,
                        data: data,
                        chainId: chainId,

                    };


                    // On signe

                    const receipt = await signTransaction(txn_param, decrypt(private_key))


                    if (receipt && receipt.status == true) {

                        // Transaction signé et exécuter avec succès
                        // Renvoi les informations avec hash de la txn réussi


                        const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Transaction Confirmed ✅")
                            .setDescription(">>> Displaying the transaction execution")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .addFields(
                                { name: " ", value: " ", inline: false },
                                { name: "Spender", value: "`" + formatWallet(spender) + "`", inline: true },
                                { name: "Action", value: "`✅ Approve ERC20`", inline: true },
                                { name: " ", value: " ", inline: false },
                                { name: " ", value: "**Approved** `" + amount.toLowerCase() + "` ** tokens for** `" + gasExpected + "Ξ`", inline: false },
                                { name: " ", value: " ", inline: false },
                                { name: "Transaction hash:", value: "```" + receipt.hash + "```∟ Transaction details [here](https://etherscan.io/tx/" + receipt.hash + ")", inline: false },

                            )
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });

                        await manager_coin.update({ treated: "yes", txn: receipt.hash.toString() }, { where: { authorId: authorId, serverId: serverId, treated: null } });



                    } else {

                        // Erreur dans la transaction
                        // Erreur détaillé plus bas entre failed txn et failed execution

                        if (!receipt) {


                            // Erreur catch lors de la signature 
                            // Renvoi une erreur avec message comme pour simulation


                            const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Transaction Failed ❌")
                                .setDescription(">>> Displaying the transaction execution")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Spender", value: "`" + formatWallet(spender) + "`", inline: true },
                                    { name: "Action", value: "`✅ Approve ERC20`", inline: true },
                                    { name: " ", value: " ", inline: false },
                                    { name: " ", value: "**Failed to approve** `" + amount.toLowerCase() + "` ** tokens for** `" + gasExpected + "Ξ`", inline: false },
                                    { name: " ", value: " ", inline: false },
                                    { name: "Transaction error:", value: "```The transaction failed.\n\nThe wallet signature didn't went through       ```", inline: false },

                                )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });

                            await manager_coin.destroy({ where: { authorId, authorId, serverId: serverId, treated: null } })


                        } else if (receipt.status == false) {

                            // Transaction signé et exécuter mais pas passé
                            // Renvoi les informations avec hash de la txn fail



                            const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Transaction Failed ❌")
                                .setDescription(">>> Displaying the transaction execution")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Spender", value: "`" + formatWallet(spender) + "`", inline: true },
                                    { name: "Action", value: "`✅ Approve ERC20`", inline: true },
                                    { name: " ", value: " ", inline: false },
                                    { name: " ", value: "**Failed to approve** `" + amount.toLowerCase() + "` ** tokens for** `" + gasExpected + "Ξ`", inline: false },
                                    { name: " ", value: " ", inline: false },
                                    { name: "Transaction hash:", value: "```" + receipt.hash + "```∟ Transaction details [here](https://etherscan.io/tx/" + receipt.hash + ")", inline: false },

                                )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });

                            await manager_coin.destroy({ where: { authorId, authorId, serverId: serverId, treated: null } })


                        } else {

                            // Erreur catch lors de la signature ou de l'execution
                            // Renvoi une erreur avec message comme pour simulation


                            const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Transaction Failed ❌")
                                .setDescription(">>> Displaying the transaction execution")
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setTimestamp()
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Spender", value: "`" + formatWallet(spender) + "`", inline: true },
                                    { name: "Action", value: "`✅ Approve ERC20`", inline: true },
                                    { name: " ", value: " ", inline: false },
                                    { name: " ", value: "**Failed to approve** `" + amount.toLowerCase() + "` ** tokens for** `" + gasExpected + "Ξ`", inline: false },
                                    { name: " ", value: " ", inline: false },
                                    { name: "Transaction error:", value: "```The transaction failed.\n\n" + receipt.message + "       ```", inline: false },

                                )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });

                            await manager_coin.destroy({ where: { authorId, authorId, serverId: serverId, treated: null } })



                        }



                    }




                } else if (action == "revokeToken") {



                    const value = setup.dataValues.value

                    const txnTable = JSON.parse(setup.dataValues.transaction)

                    const data = txnTable.data
                    const contract = txnTable.contract
                    const amount = txnTable.amount
                    const spender = txnTable.spender
                    const gasPriceRaw = txnTable.gasPrice

                    const gasExpected = txnTable.gas_fees / 10 ** 18

                    const private_key = txnTable.privateKey

                    // On renvoi le premier embed
                    const gasTrackerEmbed3 = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Transaction Pending <a:AuraLoading:1134068847616458792>")
                        .setDescription(">>> Displaying the transaction execution")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "Spender", value: "`" + formatWallet(spender) + "`", inline: true },
                            { name: "Action", value: "`❌ Revoke ERC20`", inline: true },
                            { name: " ", value: "**Revoking** `" + amount.toLowerCase() + "` ** tokens for** `" + gasExpected + "Ξ`", inline: false },
                            { name: "Transaction hash", value: "<a:AuraLoading:1134068847616458792>", inline: false },

                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.editReply({ embeds: [gasTrackerEmbed3], ephemeral: true });




                    // Setting de gas
                    const gasLimit = 50000
                    const gasMargin = 1.1
                    const gasPrice = Math.ceil(gasPriceRaw * gasMargin)



                    //On construit l'objet de transaction
                    const txn_param = {
                        gasLimit: gasLimit,
                        gasPrice: gasPrice,
                        to: contract,
                        value: value,
                        data: data,
                        chainId: chainId,

                    };


                    // On signe

                    const receipt = await signTransaction(txn_param, decrypt(private_key))


                    if (receipt && receipt.status == true) {

                        // Transaction signé et exécuter avec succès
                        // Renvoi les informations avec hash de la txn réussi


                        const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Transaction Confirmed ✅")
                            .setDescription(">>> Displaying the transaction execution")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .addFields(
                                { name: " ", value: " ", inline: false },
                                { name: "Spender", value: "`" + formatWallet(spender) + "`", inline: true },
                                { name: "Action", value: "`❌ Revoke ERC20`", inline: true },
                                { name: " ", value: " ", inline: false },
                                { name: " ", value: "**Revoked** `" + amount.toLowerCase() + "` ** tokens for** `" + gasExpected + "Ξ`", inline: false },
                                { name: " ", value: " ", inline: false },
                                { name: "Transaction hash:", value: "```" + receipt.hash + "```∟ Transaction details [here](https://etherscan.io/tx/" + receipt.hash + ")", inline: false },

                            )
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });

                        await manager_coin.update({ treated: "yes", txn: receipt.hash.toString() }, { where: { authorId: authorId, serverId: serverId, treated: null } });



                    } else {

                        // Erreur dans la transaction
                        // Erreur détaillé plus bas entre failed txn et failed execution

                        if (!receipt) {


                            // Erreur catch lors de la signature 
                            // Renvoi une erreur avec message comme pour simulation


                            const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Transaction Failed ❌")
                                .setDescription(">>> Displaying the transaction execution")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Spender", value: "`" + formatWallet(spender) + "`", inline: true },
                                    { name: "Action", value: "`❌ Revoke ERC20`", inline: true },
                                    { name: " ", value: " ", inline: false },
                                    { name: " ", value: "**Failed to revoke** `" + amount.toLowerCase() + "` ** tokens for** `" + gasExpected + "Ξ`", inline: false },
                                    { name: " ", value: " ", inline: false },
                                    { name: "Transaction error:", value: "```The transaction failed.\n\nThe wallet signature didn't went through       ```", inline: false },

                                )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });

                            await manager_coin.destroy({ where: { authorId, authorId, serverId: serverId, treated: null } })


                        } else if (receipt.status == false) {

                            // Transaction signé et exécuter mais pas passé
                            // Renvoi les informations avec hash de la txn fail



                            const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Transaction Failed ❌")
                                .setDescription(">>> Displaying the transaction execution")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Spender", value: "`" + formatWallet(spender) + "`", inline: true },
                                    { name: "Action", value: "`❌ Revoke ERC20`", inline: true },
                                    { name: " ", value: " ", inline: false },
                                    { name: " ", value: "**Failed to revoke** `" + amount.toLowerCase() + "` ** tokens for** `" + gasExpected + "Ξ`", inline: false },
                                    { name: " ", value: " ", inline: false },
                                    { name: "Transaction hash:", value: "```" + receipt.hash + "```∟ Transaction details [here](https://etherscan.io/tx/" + receipt.hash + ")", inline: false },

                                )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });

                            await manager_coin.destroy({ where: { authorId, authorId, serverId: serverId, treated: null } })


                        } else {

                            // Erreur catch lors de la signature ou de l'execution
                            // Renvoi une erreur avec message comme pour simulation


                            const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Transaction Failed ❌")
                                .setDescription(">>> Displaying the transaction execution")
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setTimestamp()
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Spender", value: "`" + formatWallet(spender) + "`", inline: true },
                                    { name: "Action", value: "`❌ Revoke ERC20`", inline: true },
                                    { name: " ", value: " ", inline: false },
                                    { name: " ", value: "**Failed to revoke** `" + amount.toLowerCase() + "` ** tokens for** `" + gasExpected + "Ξ`", inline: false },
                                    { name: " ", value: " ", inline: false },
                                    { name: "Transaction error:", value: "```The transaction failed.\n\n" + receipt.message + "       ```", inline: false },

                                )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });

                            await manager_coin.destroy({ where: { authorId, authorId, serverId: serverId, treated: null } })



                        }



                    }






                } else {



                    const errorAnswerUser = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Not Available")
                        .setDescription("The batch transfer isn't available and will be soon. In the meantime, you can use the single wallet ETH transfer.")
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                    await interaction.editReply({ embeds: [errorAnswerUser], ephemeral: true });


                }

                // LE RESTE DES ACTIONS

            } else {



                const errorAnswerUser = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("An error occured")
                    .setDescription("An error occured while gathering your transaction data. Please try again or contact a team member to get help.")
                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                await interaction.editReply({ embeds: [errorAnswerUser], ephemeral: true });


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
            let reportCommand = "/coin-refresh"

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



