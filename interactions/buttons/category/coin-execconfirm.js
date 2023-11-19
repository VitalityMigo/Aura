/**
 * @file Sample modal interaction
 * @author JAYZHVJ
 * @since 3.2.0
 * @version 3.2.2
 */

/**
 * @type {import('../../../typings').ModalInteractionCommand}
 */

const { ButtonInteraction } = require('discord.js');
const { ActionRowBuilder, EmbedBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const { accessSql, profileData, reportsql, adminsql, interactionData, infra_coin, exe_coin, sequelize } = require('../../../events/database');
const moment = require('moment');

// Fonctions d'execution et de formattage
const { signTransaction, gasPreset, approveMaxToken } = require('../../../functions/coin-utils')
const decrypt = require("../../../functions/decrypt")
const formatCoinValueSign = require("../../../functions/formatNumberEmbed")


// Déclaration des valeur liées aux contrats V2 et V3
const chainId = 1


module.exports = {
    id: "button_coin_exec_confirm",

    async execute(interaction) {


        //Récupérer informations de l'utilisateur de la commande
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

            // On récupère les infos du trade simulé
            const userSetup = await exe_coin.findOne({ where: { authorId: authorId, serverId: serverId, treated: null } })

            if (userSetup != null) {


                // on récupère les infos de la DB
                // Infos sur le trade, le user, et de formattage
                const contract = userSetup.dataValues.contract
                const toSymbol = userSetup.dataValues.symbol
                const amount = userSetup.dataValues.value
                const isBuy = userSetup.dataValues.isBuy
                const trade = JSON.parse(userSetup.dataValues.trade)
                const setup = JSON.parse(userSetup.dataValues.setup)


                if (isBuy == "true") {

                    // Infos du trade
                    const router = trade[0].router
                    const data = trade[0].data
                    const valueHex = trade[0].value
                    const expected_value = trade[0].expected_value
                    const expected_amount = trade[0].expected_amount
                    const amountOutMin = trade[0].amountOutMin
                    const hasAllowance = trade[0].hasAllowance

                    
                    // Infos du sender
                    const auto_approval = setup[0].auto_approval
                    const gas_preset = setup[0].gas_preset
                    const max_gwei = setup[0].max_gwei
                    const sender = setup[0].sender
                    const privateKey = setup[0].privateKey


                    // On renvoi le premier embed
                    const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Transaction Pending <a:AuraLoading:1134068847616458792>")
                        .setDescription(">>> Displaying the transaction execution")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "Target", value: "`" + toSymbol.toUpperCase() + "`", inline: true },
                            { name: "Action", value: "`📈 Buy`", inline: true },
                            { name: " ", value: " ", inline: false },
                            { name: "Transaction hash", value: "<a:AuraLoading:1134068847616458792>", inline: false },

                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.editReply({ embeds: [gasTrackerEmbed2], ephemeral: true });




                    const gas = await gasPreset(gas_preset, max_gwei)

                    if (gas != null && gas.valid == true) {


                        // On renvoi le premier embed
                        const gasTrackerEmbed3 = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Transaction Pending <a:AuraLoading:1134068847616458792>")
                            .setDescription(">>> Displaying the transaction execution")
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .addFields(
                                { name: " ", value: " ", inline: false },
                                { name: "Target", value: "`" + toSymbol.toUpperCase() + "`", inline: true },
                                { name: "Action", value: "`📈 Buy`", inline: true },
                                { name: " ", value: "**Buying** `" + formatCoinValueSign(expected_amount) + "` ** tokens for** `" + expected_value + "Ξ`", inline: false },
                                { name: "Transaction hash", value: "<a:AuraLoading:1134068847616458792>", inline: false },

                            )
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [gasTrackerEmbed3], ephemeral: true });


                        //On construit l'objet de transaction
                        // C'est cette objet qu'on signe avec la PK
                        const txnInfos = {
                            gasPrice: gas.price,
                            gasLimit: gas.limit,
                            to: router,
                            value: valueHex,
                            data: data,
                            chainId: chainId,

                        };

                        // Signature et envoi de la transaction
                        // Renvoi le receipt avec les infos
                        const receipt = await signTransaction(txnInfos, decrypt(privateKey))

                        // POUR LES TESTS
                        // const receipt = {
                        //     status: true,
                        //     hash: "hhehehehey"
                        // }


                        if (receipt && receipt.status == true) {

                            // Transaction signé et exécuter avec succès
                            // Renvoi les informations avec hash de la txn réussi

                            const totalPaid = parseFloat(amount) + parseFloat(receipt.gas_fees)

                            const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Transaction Confirmed ✅")
                                .setDescription(">>> Displaying the transaction execution")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Target", value: "`" + toSymbol.toUpperCase() + "`", inline: true },
                                    { name: "Action", value: "`📈 Buy`", inline: true },
                                    { name: " ", value: " ", inline: false },
                                    { name: " ", value: "**Bought** `" + formatCoinValueSign(expected_amount) + "` ** tokens for** `" + totalPaid + "Ξ`", inline: false },
                                    { name: " ", value: " ", inline: false },
                                    { name: "Transaction hash:", value: "```" + receipt.hash + "```∟ Transaction details [here](https://etherscan.io/tx/" + receipt.hash + ")", inline: false },

                                )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });


                            // On enregistre l'exec dans la database
                            await exe_coin.update({ treated: "yes", txn: receipt.hash.toString() }, { where: { authorId: authorId, serverId: serverId, treated: null } });


                            // On check si le user a l'auto approval 
                            // Si il l'a on envoi la fonction
                            if (auto_approval == "true") {

                                // On vérifie que y'a assez d'allowance
                                // Vérification faite au préalable de la simulation (file: /coin-execbuy)
                                if (hasAllowance == false) {

                                    // On lance la transaction d'approval Max
                                    const approval = await approveMaxToken(contract, router, privateKey)

                                    if (approval && approval.status == true) {


                                        // Si la txn est passée

                                        const approvalEmbed = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle("Token Approved ✅")
                                            .setDescription("The token has been successfully auto-approved for maximum allowance. The transaction is available [here](https://etherscan.io/tx/" + approval.hash + ")")
                                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                        await interaction.followUp({ embeds: [approvalEmbed], ephemeral: true });


                                    } if (approval) {

                                        // Si la txn est pas passé mais est partie

                                        const approvalEmbed = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle("Token Approval Failed ❌")
                                            .setDescription("The token approval for maximum allowance has failed. The transaction is available [here](https://etherscan.io/tx/" + approval.hash + ")")
                                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                        await interaction.followUp({ embeds: [approvalEmbed], ephemeral: true });


                                    }



                                }

                            }

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
                                        { name: "Target", value: "`" + toSymbol.toUpperCase() + "`", inline: true },
                                        { name: "Action", value: "`📈 Buy`", inline: true },
                                        { name: " ", value: " ", inline: false },
                                        { name: " ", value: "**Failed to buy** `" + formatCoinValueSign(expected_amount) + "` ** tokens for** `" + expected_value + "Ξ`", inline: false },
                                        { name: " ", value: " ", inline: false },
                                        { name: "Transaction error:", value: "```The transaction failed.\n\nThe wallet signature didn't went through       ```", inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });

                                await exe_coin.destroy({ where: { authorId: authorId, serverId: serverId, treated: null } });


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
                                        { name: "Target", value: "`" + toSymbol.toUpperCase() + "`", inline: true },
                                        { name: "Action", value: "`📈 Buy`", inline: true },
                                        { name: " ", value: " ", inline: false },
                                        { name: " ", value: "**Failed to buy** `" + formatCoinValueSign(expected_amount) + "` ** tokens for** `" + expected_value + "Ξ`", inline: false },
                                        { name: " ", value: " ", inline: false },
                                        { name: "Transaction hash:", value: "```" + receipt.hash + "```∟ Transaction details [here](https://etherscan.io/tx/" + receipt.hash + ")", inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });

                                await exe_coin.update({ treated: "yes", txn: receipt.hash.toString() }, { where: { authorId: authorId, serverId: serverId, treated: null } });


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
                                        { name: "Target", value: "`" + toSymbol.toUpperCase() + "`", inline: true },
                                        { name: "Action", value: "`📈 Buy`", inline: true },
                                        { name: " ", value: " ", inline: false },
                                        { name: " ", value: "**Failed to buy** `" + formatCoinValueSign(expected_amount) + "` ** tokens for** `" + expected_value + "Ξ`", inline: false },
                                        { name: " ", value: " ", inline: false },
                                        { name: "Transaction error:", value: "```The transaction failed.\n\n" + receipt.message + "       ```", inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });

                                await exe_coin.destroy({ where: { authorId: authorId, serverId: serverId, treated: null } });



                            }

                        }




                    } else if (gas.valid == "Over gas limit") {

                        // On a dépassé le max gwei
                        // Transaction annulé sans être exécuter

                        const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Buy Coin")
                            .setDescription(">>> Displaying the simulated transaction data")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .addFields(
                                { name: " ", value: " ", inline: false },
                                { name: "Target", value: "`" + toSymbol.toUpperCase() + "`", inline: true },
                                { name: "Action", value: "`📈 Buy`", inline: true },
                                { name: "Value", value: "`" + amount + "Ξ`", inline: false },
                                { name: "Transaction Data 🚫", value: "```The transaction simulation failed.\n\nThe gas price in gwei (" + parseFloat(gas.price / 10 ** 9).toFixed(2) + " gwei) has exceeded your limit (" + parseFloat(max_gwei).toFixed(2) + ")```", inline: false },

                            )
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [], ephemeral: true });


                    } else if (gas == null) {

                        // Erreur dans le calcul des gas fees
                        const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Buy Coin")
                            .setDescription(">>> Displaying the simulated transaction data")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .addFields(
                                { name: " ", value: " ", inline: false },
                                { name: "Target", value: "`" + toSymbol.toUpperCase() + "`", inline: true },
                                { name: "Action", value: "`📈 Buy`", inline: true },
                                { name: "Value", value: "`" + amount + "Ξ`", inline: false },
                                { name: "Transaction Data 🚫", value: "```The transaction simulation failed.\n\nThe gas oracle failed to estimate gas price.```", inline: false },

                            )
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [], ephemeral: true });



                    }


                } else if (isBuy == 'false') {




                    // Infos du trade
                    const router = trade[0].router
                    const data = trade[0].data
                    const valueHex = trade[0].value
                    const expected_value = trade[0].expected_value
                    const expected_amount = trade[0].expected_amount
                    const tokenIn = trade[0].tokenIn




                    // Infos du sender
                    const gas_preset = setup[0].gas_preset
                    const max_gwei = setup[0].max_gwei
                    const privateKey = setup[0].privateKey


                    // On renvoi le premier embed
                    const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Transaction Pending <a:AuraLoading:1134068847616458792>")
                        .setDescription(">>> Displaying the transaction execution")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "Target", value: "`" + toSymbol.toUpperCase() + "`", inline: true },
                            { name: "Action", value: "`📉 Sell`", inline: true },
                            { name: " ", value: " ", inline: false },
                            { name: "Transaction hash", value: "<a:AuraLoading:1134068847616458792>", inline: false },

                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.editReply({ embeds: [gasTrackerEmbed2], ephemeral: true });




                    const gas = await gasPreset(gas_preset, max_gwei)

                    if (gas != null && gas.valid == true) {


                        // On renvoi le premier embed
                        const gasTrackerEmbed3 = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Transaction Pending <a:AuraLoading:1134068847616458792>")
                            .setDescription(">>> Displaying the transaction execution")
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .addFields(
                                { name: " ", value: " ", inline: false },
                                { name: "Target", value: "`" + toSymbol.toUpperCase() + "`", inline: true },
                                { name: "Action", value: "`📉 Sell`", inline: true },
                                { name: " ", value: "**Selling** `" + formatCoinValueSign(tokenIn) + "` ** tokens for** `" + expected_value + "Ξ`", inline: false },
                                { name: "Transaction hash", value: "<a:AuraLoading:1134068847616458792>", inline: false },

                            )
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [gasTrackerEmbed3], ephemeral: true });


                        //On construit l'objet de transaction
                        // C'est cette objet qu'on signe avec la PK
                        const txnInfos = {
                            gasPrice: gas.price,
                            gasLimit: gas.limit,
                            to: router,
                            value: valueHex,
                            data: data,
                            chainId: chainId,

                        };

                        // Signature et envoi de la transaction
                        // Renvoi le receipt avec les infos
                        const receipt = await signTransaction(txnInfos, decrypt(privateKey))


                        if (receipt && receipt.status == true) {

                            // Transaction signé et exécuter avec succès
                            // Renvoi les informations avec hash de la txn réussi

                            const totalPaid = parseFloat(amount) + parseFloat(receipt.gas_fees)

                            const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Transaction Confirmed ✅")
                                .setDescription(">>> Displaying the transaction execution")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Target", value: "`" + toSymbol.toUpperCase() + "`", inline: true },
                                    { name: "Action", value: "`📉 Sell`", inline: true },
                                    { name: " ", value: " ", inline: false },
                                    { name: " ", value: "**Sold** `" + formatCoinValueSign(tokenIn) + "` ** tokens for** `" + totalPaid + "Ξ`", inline: false },
                                    { name: " ", value: " ", inline: false },
                                    { name: "Transaction hash:", value: "```" + receipt.hash + "```∟ Transaction details [here](https://etherscan.io/tx/" + receipt.hash + ")", inline: false },

                                )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });


                            // On enregistre l'exec dans la database
                            await exe_coin.update({ treated: "yes", txn: receipt.hash.toString() }, { where: { authorId: authorId, serverId: serverId, treated: null } });



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
                                        { name: "Target", value: "`" + toSymbol.toUpperCase() + "`", inline: true },
                                        { name: "Action", value: "`📉 Sell`", inline: true },
                                        { name: " ", value: " ", inline: false },
                                        { name: " ", value: "**Failed to sell** `" + formatCoinValueSign(tokenIn) + "` ** tokens for** `" + expected_value + "Ξ`", inline: false },
                                        { name: " ", value: " ", inline: false },
                                        { name: "Transaction error:", value: "```The transaction failed.\n\nThe wallet signature didn't went through       ```", inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });

                                await exe_coin.destroy({ where: { authorId: authorId, serverId: serverId, treated: null } });


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
                                        { name: "Target", value: "`" + toSymbol.toUpperCase() + "`", inline: true },
                                        { name: "Action", value: "`📉 Sell`", inline: true },
                                        { name: " ", value: " ", inline: false },
                                        { name: " ", value: "**Failed to sell** `" + formatCoinValueSign(tokenIn) + "` ** tokens for** `" + expected_value + "Ξ`", inline: false },
                                        { name: " ", value: " ", inline: false },
                                        { name: "Transaction hash:", value: "```" + receipt.hash + "```∟ Transaction details [here](https://etherscan.io/tx/" + receipt.hash + ")", inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });

                                await exe_coin.update({ treated: "yes", txn: receipt.hash.toString() }, { where: { authorId: authorId, serverId: serverId, treated: null } });


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
                                        { name: "Target", value: "`" + toSymbol.toUpperCase() + "`", inline: true },
                                        { name: "Action", value: "`📉 Sell`", inline: true },
                                        { name: " ", value: " ", inline: false },
                                        { name: " ", value: "**Failed to sell** `" + formatCoinValueSign(tokenIn) + "` ** tokens for** `" + expected_value + "Ξ`", inline: false },
                                        { name: " ", value: " ", inline: false },
                                        { name: "Transaction error:", value: "```The transaction failed.\n\n" + receipt.message + "       ```", inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });

                                await exe_coin.destroy({ where: { authorId: authorId, serverId: serverId, treated: null } });



                            }

                        }




                    } else if (gas.valid == "Over gas limit") {

                        // On a dépassé le max gwei
                        // Transaction annulé sans être exécuter

                        const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Buy Coin")
                            .setDescription(">>> Displaying the simulated transaction data")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .addFields(
                                { name: " ", value: " ", inline: false },
                                { name: "Target", value: "`" + toSymbol.toUpperCase() + "`", inline: true },
                                { name: "Action", value: "`📉 Sell`", inline: true },
                                { name: "Value", value: "`" + amount + "Ξ`", inline: false },
                                { name: "Transaction Data 🚫", value: "```The transaction simulation failed.\n\nThe gas price in gwei (" + parseFloat(gas.price / 10 ** 9).toFixed(2) + " gwei) has exceeded your limit (" + parseFloat(max_gwei).toFixed(2) + ")```", inline: false },

                            )
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [], ephemeral: true });


                    } else if (gas == null) {

                        // Erreur dans le calcul des gas fees
                        const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Buy Coin")
                            .setDescription(">>> Displaying the simulated transaction data")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .addFields(
                                { name: " ", value: " ", inline: false },
                                { name: "Target", value: "`" + toSymbol.toUpperCase() + "`", inline: true },
                                { name: "Action", value: "`📉 Sell`", inline: true },
                                { name: "Value", value: "`" + amount + "Ξ`", inline: false },
                                { name: "Transaction Data 🚫", value: "```The transaction simulation failed.\n\nThe gas oracle failed to estimate gas price.```", inline: false },

                            )
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [], ephemeral: true });



                    }



                }

            } else {

                const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Buy Coin")
                    .setDescription("An error occured while retreiving the your trade setup. Please try again using `/coin data` or contact a team member if you need help.")
                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                    .setAuthor({ name: "Aura", iconURL: "https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png" })
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                await interaction.editReply({ embeds: [gasTrackerEmbed2] });


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
            let reportCommand = "/admin-clientNew1"

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
