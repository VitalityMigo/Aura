

/**
 * @file Sample modal interaction
 * @author JAYZHVJ
 * @since 3.2.0
 * @version 3.2.2
 */

/**
 * @type {import('../../../typings').ModalInteractionCommand}
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const { profileData, reportsql, accessSql, exe_nft, infra_nft, sequelize } = require('../../../events/database');
const moment = require('moment');


const { getEthBalance, snipeBuyEncode, simulateTransaction, gasOracle, getPoolBalance, encodePoolWrapData, getGasPrice, encodeTransfer, signTransaction, isOwner } = require('../../../functions/1nft-utils');
const { errorHandler } = require("../../../functions/1nft-errors")
const decrypt = require('../../../functions/decrypt');
const reduceText = require('../../../functions/reducetext')
const generateRandomString = require('../../../functions/randomkey')
const { buttonConfirmConfig, buttonBiddingParamsConfig } = require("../../../functions/nft/helpers");
const { decodeErrorResult } = require('viem');

const markets = require("../../../contracts/nft/config.json")

const chainId = 1

module.exports = {
    id: "modal_nft_exec@",

    async execute(interaction) {


        //Récupérer informations de l'utilisateur de la commande
        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id
        let botId = interaction.applicationId

        await interaction.deferReply({ ephemeral: true })

        try {

            console.log("Initialization: executed ✅")

            // On récupère les infos dans l'ID
            const customId = interaction.customId
            const matches = customId.match(/modal_nft_exec@(.+)/);

            if (matches && matches[1]) {

                // On récupère le contrat
                const identifier = matches[1]

                // On récupère la transaction du user
                const storage = await exe_nft.findOne({ where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifier } });

                // On récupère les data dans l'entrée de la DB
                const action = storage.dataValues.action
                const name = storage.dataValues.name
                const contract = storage.dataValues.contract
                const settings = JSON.parse(storage.dataValues.settings)


                if (action === "snipe") {
                    // C'est un achat simple

                    // On récupère le token ID et on récupère la validité
                    const tokenId = parseInt(interaction.fields.getTextInputValue('modal_nft_exec_row1'))
                    const isValid = !isNaN(tokenId)

                    if (isValid) {

                        // On vérifie si le Ape Mode est activé
                        if (settings.ape_mode === "true") {
                            // Le Ape Mode est désactivé, on fait une simulation

                            // On renvoi le premier embed
                            const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Transaction Pending <a:AuraLoading:1134068847616458792>")
                                .setDescription(">>> Displaying the transaction execution")
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Target", value: "`" + name + " #" + tokenId + "`", inline: true },
                                    { name: "Action", value: "`🔫 Snipe`", inline: true },
                                    { name: " ", value: " ", inline: false },
                                    { name: "Transaction hash", value: "<a:AuraLoading:1134068847616458792>", inline: false },

                                )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.editReply({ embeds: [gasTrackerEmbed2], ephemeral: true });


                            // Puis on fait l'encodage de l'achat
                            const trade = await snipeBuyEncode(contract, tokenId, settings)

                            // On vérifie que l'encodage a réussi
                            if (trade.status) {
                                // L'encodage a réussi

                                // On définit les valeurs clés
                                const global = trade.trade
                                const transaction = trade.transaction

                                // On renvoi la seconde réponse
                                // On renvoi le premier embed
                                const gasTrackerEmbed3 = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Transaction Pending <a:AuraLoading:1134068847616458792>")
                                    .setDescription(">>> Displaying the transaction execution")
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setTimestamp()
                                    .addFields(
                                        { name: " ", value: " ", inline: false },
                                        { name: "Target", value: "`" + name + " #" + tokenId + "`", inline: true },
                                        { name: "Action", value: "`🔫 Snipe`", inline: true },
                                        { name: " ", value: "**Buying** `" + global.quantity + "` ** tokens for** `" + global.price + "Ξ`", inline: false },
                                        { name: "Transaction hash", value: "<a:AuraLoading:1134068847616458792>", inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [gasTrackerEmbed3], ephemeral: true });

                                // On définit les paramètres de simulation
                                const sim_param = {
                                    from: transaction.from,
                                    to: transaction.to,
                                    data: transaction.data,
                                    value: transaction.value,
                                }

                                // Fonction qui effectue la simulation
                                // Renvoi le nombre de gas utilisé
                                // Si erreur, renvoi soit rien soit que la limite a été atteinte
                                const simulation = await simulateTransaction(sim_param)


                                // Si la transaction est valide, on continu
                                if (simulation.valid == true) {


                                    const gas = await gasOracle(settings.gas_preset, simulation.result, settings.max_gwei)

                                    if (gas !== null && gas.valid == true) {

                                        //On construit l'objet de transaction
                                        const txnInfos = {
                                            gasPrice: gas.price,
                                            gasLimit: gas.limit,
                                            to: transaction.to,
                                            value: transaction.value,
                                            data: transaction.data,
                                            chainId: chainId,

                                        };

                                        // Signature et envoi de la transaction
                                        // Renvoi le receipt avec les infos
                                        const receipt = await signTransaction(txnInfos, decrypt(settings.privateKey))

                                        if (receipt && receipt.status == true) {

                                            // Transaction signé et exécuter avec succès
                                            // Renvoi les informations avec hash de la txn réussi

                                            const totalPaid = parseFloat(global.price / 10 ** 18) + parseFloat(receipt.gas_fees)

                                            const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                                .setTitle("Transaction Confirmed ✅")
                                                .setDescription(">>> Displaying the transaction execution")
                                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                .setTimestamp()
                                                .addFields(
                                                    { name: " ", value: " ", inline: false },
                                                    { name: "Target", value: "`" + name + " #" + tokenId + "`", inline: true },
                                                    { name: "Action", value: "`🔫 Snipe`", inline: true },
                                                    { name: " ", value: " ", inline: false },
                                                    { name: " ", value: "**Bought** `" + global.quantity + "` ** token for** `" + totalPaid + "Ξ`", inline: false },
                                                    { name: " ", value: " ", inline: false },
                                                    { name: "Transaction hash:", value: "```" + receipt.hash + "```∟ Transaction details [here](https://etherscan.io/tx/" + receipt.hash + ")", inline: false },

                                                )
                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                            await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });


                                            // On crée l'entré dans la database car l'achat est un flash buy
                                            // donc pas de session ouverte.
                                            await exe_nft.update({
                                                authorId: authorId,
                                                serverId: serverId,
                                                value: global.price.toString(),
                                                treated: "true",
                                                txn: receipt.hash,
                                            }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifier } })

                                        } else {

                                            // Erreur dans la transaction
                                            // Erreur détaillé plus bas entre failed txn et failed execution

                                            if (!receipt) {

                                                // Erreur catch lors de la signature 
                                                // Renvoi une erreur avec message comme pour simulation
                                                const expected = parseFloat(global.price / 10 ** 18) + parseFloat(gas.fees)

                                                const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                                    .setTitle("Transaction Failed ❌")
                                                    .setDescription(">>> Displaying the transaction execution")
                                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                                    .setTimestamp()
                                                    .addFields(
                                                        { name: " ", value: " ", inline: false },
                                                        { name: "Target", value: "`" + name + " #" + tokenId + "`", inline: true },
                                                        { name: "Action", value: "`🔫 Snipe`", inline: true },
                                                        { name: " ", value: " ", inline: false },
                                                        { name: " ", value: "**Failed to buy** `" + global.quantity + "` ** token for** `" + expected + "Ξ`", inline: false },
                                                        { name: " ", value: " ", inline: false },
                                                        { name: "Transaction error:", value: "```The transaction failed.\n\nThe wallet signature didn't went through       ```", inline: false },

                                                    )
                                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                                await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });


                                            } else if (receipt.status == false) {

                                                // Transaction signé et exécuter mais pas passé
                                                // Renvoi les informations avec hash de la txn fail
                                                const expected = parseFloat(global.price / 10 ** 18) + parseFloat(gas.fees)

                                                const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                                    .setTitle("Transaction Failed ❌")
                                                    .setDescription(">>> Displaying the transaction execution")
                                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                                    .setTimestamp()
                                                    .addFields(
                                                        { name: " ", value: " ", inline: false },
                                                        { name: "Target", value: "`" + name + " #" + tokenId + "`", inline: true },
                                                        { name: "Action", value: "`🔫 Snipe`", inline: true },
                                                        { name: " ", value: " ", inline: false },
                                                        { name: " ", value: "**Failed to buy** `" + global.quantity + "` ** token for** `" + expected + "Ξ`", inline: false },
                                                        { name: " ", value: " ", inline: false },
                                                        { name: "Transaction hash:", value: "```" + receipt.hash + "```∟ Transaction details [here](https://etherscan.io/tx/" + receipt.hash + ")", inline: false },

                                                    )
                                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                                await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });

                                                // On crée l'entré dans la database car l'achat est un flash buy
                                                // donc pas de session ouverte. Aussi, on save même les fails.
                                                // On crée l'entré dans la database car l'achat est un flash buy
                                                // donc pas de session ouverte.
                                                await exe_nft.update({
                                                    authorId: authorId,
                                                    serverId: serverId,
                                                    value: global.price.toString(),
                                                    treated: "true",
                                                    txn: receipt.hash,
                                                }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifier } })

                                            } else {

                                                // Erreur catch lors de la signature ou de l'execution
                                                // Renvoi une erreur avec message comme pour simulation
                                                const expected = parseFloat(global.price / 10 ** 18) + parseFloat(gas.fees)

                                                const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                                    .setTitle("Transaction Failed ❌")
                                                    .setDescription(">>> Displaying the transaction execution")
                                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                    .setTimestamp()
                                                    .addFields(
                                                        { name: " ", value: " ", inline: false },
                                                        { name: "Target", value: "`" + name + " #" + tokenId + "`", inline: true },
                                                        { name: "Action", value: "`🔫 Snipe`", inline: true },
                                                        { name: " ", value: " ", inline: false },
                                                        { name: " ", value: "**Failed to buy** `" + global.quantity + "` ** token for** `" + expected + "Ξ`", inline: false },
                                                        { name: " ", value: " ", inline: false },
                                                        { name: "Transaction error:", value: "```The transaction failed.\n\n" + receipt.message + "       ```", inline: false },

                                                    )
                                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                                await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });
                                            }
                                        }


                                    } else if (gas.valid == "Over gas limit") {
                                        // On a dépassé le max gwei
                                        // Transaction annulé sans être exécuter
                                        const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle("Snipe NFT")
                                            .setDescription(">>> Displaying the simulated transaction data")
                                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setTimestamp()
                                            .addFields(
                                                { name: " ", value: " ", inline: false },
                                                { name: "Target", value: "`" + name + " #" + tokenId + "`", inline: true },
                                                { name: "Action", value: "`🔫 Snipe`", inline: true },
                                                { name: "Value", value: "`" + global.price + "Ξ`", inline: false },
                                                { name: "Transaction Data 🚫", value: "```The transaction simulation failed.\n\nThe gas price in gwei (" + parseFloat(gas.price / 10 ** 9).toFixed(2) + " gwei) has exceeded your limit (" + parseFloat(settings.max_gwei).toFixed(2) + " gwei)```", inline: false },

                                            )
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                        await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [], ephemeral: true });


                                    } else if (gas == null) {

                                        // Erreur dans le calcul des gas fees
                                        const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle("Snipe NFT")
                                            .setDescription(">>> Displaying the simulated transaction data")
                                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setTimestamp()
                                            .addFields(
                                                { name: " ", value: " ", inline: false },
                                                { name: "Target", value: "`" + name + " #" + tokenId + "`", inline: true },
                                                { name: "Action", value: "`🔫 Snipe`", inline: true },
                                                { name: "Value", value: "`" + global.price + "Ξ`", inline: false },
                                                { name: "Transaction Data 🚫", value: "```The transaction simulation failed.\n\nThe gas oracle failed to estimate gas price.```", inline: false },

                                            )
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                        await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [], ephemeral: true });
                                    }

                                } else {

                                    // La simulation n'a pas réussi
                                    // On annule la transaction
                                    const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle("Snipe NFT")
                                        .setDescription(">>> Displaying the simulated transaction data")
                                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .addFields(
                                            { name: " ", value: " ", inline: false },
                                            { name: "Target", value: "`" + name + " #" + tokenId + "`", inline: true },
                                            { name: "Action", value: "`🔫 Snipe`", inline: true },
                                            { name: "Value", value: "`" + global.price + "Ξ`", inline: false },
                                            { name: "Transaction Data 🚫", value: "```The transaction simulation failed.\n\n" + simulation.result + "```", inline: false },

                                        )
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                    await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [], ephemeral: true });
                                }


                            } else {
                                // L'encodage a raté
                                // On va renvoyer l'erreur
                                errorHandler(interaction, trade, settings)
                            }


                        } else if (settings.ape_mode === "false") {
                            // Le Ape Mode est désactivé

                            // On commence par envoyer la première réponse
                            const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Snipe NFT")
                                .setDescription(">>> Displaying the simulated transaction data")
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Action", value: "`🔫 Snipe`", inline: false },
                                    { name: "Target", value: "`" + name + " #" + tokenId + "`", inline: true },
                                    { name: "Value", value: "`   Ξ`", inline: true },
                                    { name: "Simulation", value: "<a:AuraLoading:1134068847616458792>", inline: false },

                                )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.editReply({ embeds: [gasTrackerEmbed], components: [], ephemeral: true });


                            // Puis on fait l'encodage de l'achat
                            const trade = await snipeBuyEncode(contract, tokenId, settings)

                            // On vérifie que l'encodage a réussi
                            if (trade.status) {
                                // L'encodage a réussi

                                // On définit les valeurs clés
                                const global = trade.trade
                                const transaction = trade.transaction

                                // On définit les paramètres de simulation
                                const sim_param = {
                                    to: transaction.to,
                                    data: transaction.data,
                                    value: transaction.value,
                                    from: transaction.from
                                }

                                // Fonction qui effectue la simulation
                                // Renvoi le nombre de gas utilisé
                                // Si erreur, renvoi soit rien soit que la limite a été atteinte
                                const simulation = await simulateTransaction(sim_param)

                                // Si la transaction est valide, on continu
                                if (simulation.valid == true) {

                                    const gas = await gasOracle(settings.gas_preset, simulation.result, settings.max_gwei)

                                    if (gas !== null && gas.valid == true) {

                                        // On formatte les données
                                        const totalValue = parseFloat(global.price) + parseFloat(gas.fees)
                                        const txnDataFormatted = "Sender: " + decrypt(settings.sender) + "\nGas Price: " + parseFloat(gas.gwei).toFixed(0) + " gwei\nAmount: " + global.quantity + " (" + global.tokenId + ")\n\nValue: " + parseFloat(global.price).toFixed(3) + "Ξ\nGas fees: " + parseFloat(gas.fees).toFixed(5) + "Ξ\n\nTotal Value: " + parseFloat(totalValue).toFixed(3) + "Ξ"

                                        // On définit les bouttons
                                        const button = buttonConfirmConfig(true, identifier)

                                        const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle("Snipe NFT")
                                            .setDescription(">>> Displaying the simulated transaction data")
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setTimestamp()
                                            .addFields(
                                                { name: " ", value: " ", inline: false },
                                                { name: "Action", value: "`🔫 Snipe`", inline: false },
                                                { name: "Target", value: "`" + name + " #" + tokenId + "`", inline: true },
                                                { name: "Value", value: "`" + global.price + "Ξ`", inline: true },
                                                { name: "Transaction Data ✅", value: "```" + txnDataFormatted + "```", inline: false },

                                            )
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                        await interaction.editReply({ embeds: [gasTrackerEmbed2], components: button, ephemeral: true });

                                        // On ajoute les différents objets à la réponse initial de const trade.
                                        // Pour l'instant seulement la value expected dans le cas où la txn fail
                                        // ainsi que les gas dépensé et le prix (d'après la simulation).
                                        trade.trade.expected = totalValue
                                        trade.transaction.gasUsed = simulation.result
                                        trade.transaction.gasPrice = gas.price

                                        // On update les informations de la database avec les nouvelles data.
                                        await exe_nft.update({

                                            contract: contract.toLowerCase(),
                                            name: name,
                                            trade: JSON.stringify(trade),
                                            settings: JSON.stringify(settings),
                                            value: global.price.toString(),
                                            simulation: "true",
                                            identifier: identifier,
                                        }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifier } })


                                    } else if (gas.valid == "Over gas limit") {

                                        // On a dépassé le max gwei
                                        // Transaction annulé sans être exécuter

                                        // On définit les bouttons
                                        const button = buttonConfirmConfig(false, identifier)


                                        const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle("Snipe NFT")
                                            .setDescription(">>> Displaying the simulated transaction data")
                                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setTimestamp()
                                            .addFields(
                                                { name: " ", value: " ", inline: false },
                                                { name: "Action", value: "`🔫 Snipe`", inline: false },
                                                { name: "Target", value: "`" + name + " #" + tokenId + "`", inline: true },
                                                { name: "Value", value: "`" + global.price + "Ξ`", inline: true },
                                                { name: "Transaction Data 🚫", value: "```The transaction simulation failed.\n\nThe gas price in gwei (" + parseFloat(gas.price / 10 ** 9).toFixed(2) + " gwei) has exceeded your limit (" + parseFloat(settings.max_gwei).toFixed(2) + " gwei)```", inline: false },

                                            )
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                        await interaction.editReply({ embeds: [gasTrackerEmbed2], components: button, ephemeral: true });


                                    } else if (gas == null) {

                                        // On définit les bouttons
                                        const button = buttonConfirmConfig(false, identifier)

                                        // Erreur dans le calcul des gas fees
                                        const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle("Snipe NFT")
                                            .setDescription(">>> Displaying the simulated transaction data")
                                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setTimestamp()
                                            .addFields(
                                                { name: " ", value: " ", inline: false },
                                                { name: "Action", value: "`🔫 Snipe`", inline: false },
                                                { name: "Target", value: "`" + name + " #" + tokenId + "`", inline: true },
                                                { name: "Value", value: "`" + global.price + "Ξ`", inline: true },
                                                { name: "Transaction Data 🚫", value: "```The transaction simulation failed.\n\nThe gas oracle failed to estimate gas price.```", inline: false },

                                            )
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                        await interaction.editReply({ embeds: [gasTrackerEmbed2], components: button, ephemeral: true });

                                    }

                                } else {

                                    // On définit les bouttons
                                    const button = buttonConfirmConfig(false, identifier)

                                    // La simulation n'a pas réussi
                                    // On annule la transaction
                                    const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle("Buy NFT")
                                        .setDescription(">>> Displaying the simulated transaction data")
                                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .addFields(
                                            { name: " ", value: " ", inline: false },
                                            { name: "Action", value: "`🔫 Snipe`", inline: false },
                                            { name: "Target", value: "`" + name + " #" + tokenId + "`", inline: true },
                                            { name: "Value", value: "`" + global.price + "Ξ`", inline: true },
                                            { name: "Transaction Data 🚫", value: "```The transaction simulation failed.\n\n" + simulation.result + "```", inline: false },

                                        )
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                    await interaction.editReply({ embeds: [gasTrackerEmbed2], components: button, ephemeral: true });
                                }

                            } else {
                                // L'encodage a raté
                                // On va renvoyer 
                                errorHandler(interaction, trade, settings)
                            }
                        }

                    } else {
                        // Le token ID n'est pas valide
                        const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("NFT Trading")
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setDescription("An error occured while retrieving your data. Please try again or contact a team member if the issue persists.")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [setfpEmbedNotForYou], components: [], ephemeral: true });
                    }

                } else if (action === "bid") {

                    // On récupère le token ID et on récupère la validité
                    const price = parseFloat(interaction.fields.getTextInputValue('modal_nft_exec_row1'))
                    const amount = interaction.fields.getTextInputValue('modal_nft_exec_row2') ? parseInt(interaction.fields.getTextInputValue('modal_nft_exec_row2')) : 1 // Si il n'y a rien, on met 1
                    const isValid = !isNaN(price) && !isNaN(amount)
                    const defaultSource = markets.find(i => i.default)

                    // On vérifie que le prix est un nombre valide
                    if (isValid) {
                        // Le prix est valide, on  continu

                        // On calcul la value total ainsi que plusieurs autres valeurs
                        // qui seront utilisées lors de la construction de l'objet trade.
                        const value = price * amount
                        const balance = await getPoolBalance(decrypt(settings.sender), defaultSource.id) // decrypt(settings.sender)
                        const hasPool = value <= balance ? true : false // Assez de fond wrap ?
                        const wrapGap = hasPool ? null : value - balance // Assez de fond natif ?
                        const encodedWrap = encodePoolWrapData(defaultSource.id)

                        // On calcul deux autre données
                        const gasPrice = await getGasPrice()
                        const ethBalance = await getEthBalance(decrypt(settings.sender))
                        const expected = (gasPrice.eth * 1.1) * encodedWrap.gasLimit

                        // On construit l'enregistrement des infos qu'on a dans la 
                        // database pour les récupérer lors du confirm.
                        const trade = {
                            status: null,
                            requestId: null,
                            orderId: null,
                            source: defaultSource.id, // Source par défaut
                            trade: {
                                contract: contract,
                                name: name,
                                quantity: amount,
                                price: price,
                                value: value,
                                source: defaultSource.id,
                                expire: Math.floor(Date.now() / 1000) + 865000, // Défaut à 10j et un peu plus
                                expireDisplay: "10 days", // Défaut à une semaine
                            },
                            order: {
                                from: decrypt(settings.sender),
                                sign: null,
                                body: null,
                                signature: null,
                            },
                            swap: [
                                {
                                    id: defaultSource.id,
                                    hasPool: hasPool,
                                    balance: balance,
                                    hasEth: hasPool ? null : ethBalance > (wrapGap + expected),
                                    from: hasPool ? null : decrypt(settings.sender),
                                    to: hasPool ? null : encodedWrap.to,
                                    data: hasPool ? null : encodedWrap.data,
                                    value: hasPool ? null : wrapGap,
                                },
                                {
                                    id: 'opensea.io',
                                    hasPool: null,
                                    balance: null,
                                    hasEth: null,
                                    from: null,
                                    to: null,
                                    data: null,
                                    value: null,
                                },
                            ],
                            gas: {
                                limit: encodedWrap.gasLimit,
                                price: gasPrice.eth,
                                expected: hasPool ? 0 : expected,
                            },
                            ethBalance: ethBalance,
                        }

                        // On formatte quelques données. Une particularité pour const bids est que
                        // on fait une condition, car si le user n'a pas les fonds wrapped et peut pas 
                        // compléter avec les fonds natif (ETH), on renvoi une erreur
                        const marketplace = markets.find(i => i.id === trade.source).display
                        const hasFundAbsolute = trade.swap.find(i => i.id === defaultSource.id).hasEth !== false // On vérifie si les fonds sont dispos.
                        const bids = hasFundAbsolute ? // Si pas besoin, égal à null, si besoin et à les fonds, égal à true.
                            "Target: " + name + "\nWrapped: " + (hasPool ? 'Yes' : 'No') + "\n\nGas Fees: " + parseFloat(trade.gas.expected).toFixed(4) + "Ξ\nTotal Cost: " + parseFloat(trade.gas.expected).toFixed(4) + "Ξ                       "
                            : "Your total balance of " + defaultSource.poolSymbol + " + ETH is not sufficient to execute this bid. "  // La balance total n'est pa suffisante

                        const info = "Price: `" + parseFloat(price).toFixed(3) + "Ξ`\nSize: `" + amount + "`\nTotal: `" + parseFloat(value).toFixed(3) + "Ξ`"

                        // On définit les components
                        const buttons = buttonBiddingParamsConfig(trade, identifier, hasFundAbsolute, hasPool)

                        // On renvoi la réponse
                        const response = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Create Bid")
                            .setDescription(">>> Displaying your portfolio")
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setTimestamp()
                            .addFields(
                                { name: " ", value: " ", inline: false },
                                { name: "Target", value: "`" + name + "`", inline: true },
                                { name: "Action", value: "`✨ Bidding`", inline: true },
                                { name: " ", value: " ", inline: false },
                                { name: " ", value: " ", inline: false },
                                { name: "Bids:", value: info, inline: true },
                                { name: "Marketplace:", value: marketplace, inline: true },
                                { name: "Duration:", value: "`3 days`", inline: true },
                                { name: " ", value: " ", inline: false },
                                { name: "Data:", value: "```" + bids + "```", inline: false },
                            )
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [response], components: buttons, ephemeral: true });


                        // On ajoute l'objet trade à la sessions d'exe dans la DB
                        await exe_nft.update({ trade: JSON.stringify(trade) }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifier } })


                    } else {
                        // Le prix n'est pas valid, on renvoi une erreure
                        const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("NFT Trading")
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setDescription("An error occured while retrieving your data. Please try again or contact a team member if the issue persists.")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [setfpEmbedNotForYou], components: [], ephemeral: true });
                    }

                } else if (action === "transfer") {

                    // On récupère le token ID et on récupère la validité
                    const tokenId = parseInt(interaction.fields.getTextInputValue('modal_nft_exec_row1'))
                    const receiver = interaction.fields.getTextInputValue('modal_nft_exec_row2')
                    const isValid = !isNaN(tokenId)

                    // On vérifie que le token ID est valide
                    if (isValid) {
                        // Le token ID est valide

                        // On vérifie si le contrat est 
                        const isOwning = await isOwner(contract, tokenId, decrypt(settings.sender))

                        if (isOwning) {

                            // On récupère le gas price est défini un gas limit par défaut
                            const gasPrice = await getGasPrice()
                            const limit = 100000

                            // On commence par enregistrer un tableau trade qui sera
                            // stocké dans la DB puis ré-utiliser partout.
                            const trade = {
                                status: true,
                                trade: {
                                    name: name,
                                    contract: contract,
                                    tokenId: tokenId,
                                    quantity: 1,
                                    value: 0,
                                    receiver: receiver,
                                },
                                transaction: {
                                    from: decrypt(settings.sender),
                                    to: contract,
                                    data: encodeTransfer(decrypt(settings.sender), receiver, tokenId),
                                    value: 0
                                },
                                gas: {
                                    limit: limit,
                                    price: gasPrice.eth,
                                    expected: gasPrice.eth * (limit * 0.6)
                                }
                            }

                            // On définit les bouttons
                            const button = buttonConfirmConfig(true, identifier)

                            // On formatte les datas afin de les mettre dans la table des résultats
                            const txnDataFormatted = "Sender: " + decrypt(settings.sender) + "\nGas Price: " + parseFloat(gasPrice.gwei).toFixed(0) + " gwei\nAmount: " + 1 + " (" + tokenId + ")\n\nValue: " + parseFloat(trade.trade.value).toFixed(3) + "Ξ\nGas fees: " + parseFloat(trade.gas.expected).toFixed(5) + "Ξ\n\nTotal Value: " + parseFloat(trade.gas.expected).toFixed(3) + "Ξ"

                            const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Transfer NFT")
                                .setDescription(">>> Displaying the simulated transaction data")
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Target", value: "`" + name + "`", inline: true },
                                    { name: "Action", value: "`📤 Transfer`", inline: false },
                                    { name: " ", value: " ", inline: false },
                                    { name: "Transaction Data ✅", value: "```" + txnDataFormatted + "```", inline: false },

                                )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.editReply({ embeds: [gasTrackerEmbed2], components: button, ephemeral: true });


                            // On update les informations de la database avec les nouvelles data.
                            // On récupèrera cela dans la confirmation.
                            await exe_nft.update({
                                trade: JSON.stringify(trade),
                                value: trade.trade.value.toString(),
                                simulation: "true",
                            }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifier } })


                        } else {
                            // Le token ID n'est pas valide
                            const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("NFT Trading")
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setDescription("You don't hold the token `#" + tokenId + "` so it can't be transfered. Please try again with a valid token.")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setTimestamp()
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.editReply({ embeds: [setfpEmbedNotForYou], components: [], ephemeral: true });
                        }

                    } else {
                        // Le token ID n'est pas valide
                        const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("NFT Trading")
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setDescription("An error occured while retrieving your data. Please try again or contact a team member if the issue persists.")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [setfpEmbedNotForYou], components: [], ephemeral: true });
                    }



                }

            } else {

                const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("NFT Trading")
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .setDescription("An error occured while retrieving your data. Please try again or contact a team member if the issue persists.")
                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                await interaction.editReply({ embeds: [setfpEmbedNotForYou], components: [], ephemeral: true });


            }



            return;

        } catch (error) {


            console.log("//////////\n\nDetails de l'erreur :\n\n" + error.stack + "\n\n//////////")

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


// // On calcul la valeur total des bids, puis on vérifie que 
// // le user a assez de fonds. Si non, on peut faire une upgrade
// // en le renvoyant vers un autoswapper.
// const value = price * amount
// const balance = await getPoolBalance(decrypt(settings.sender), defaultSource)
// const hasBalance = value <= balance ? true : false

// // On vérifie que le user a la balance
// if (hasBalance) {

//     console.log(balance)


// } else {
//     // Si le user n'a pas la balance, on renvoi vers le swapper

// }
