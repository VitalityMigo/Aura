/**
 * @file Sample modal interaction
 * @author VITALITY
 * @since 3.2.0
 * @version 3.2.2
 */

const { ButtonInteraction } = require('discord.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const { profileData, reportsql, accessSql, portfolio_nft, infra_nft, exe_nft } = require('../../../events/database');
const moment = require('moment');

const decrypt = require("../../../functions/decrypt")
const { signTransaction, getGasPrice, gasOracle, singleListingEncode, postOrder, createCollectionBidEncode } = require("../../../functions/1nft-utils")
const { errorHandler } = require("../../../functions/1nft-errors")
const { exeRetryOrCancel } = require("../../../functions/nft/helpers")

const markets = require("../../../contracts/nft/config.json")
const chainId = 1



module.exports = {
    id: 'button_nft_confirm_exec',

    async execute(interaction) {
        if (!(interaction instanceof ButtonInteraction)) return;


        //Récupérer informations de l'utilisateur de la commande
        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id
        let botId = interaction.applicationId

        await interaction.deferUpdate({ ephemeral: true })

        try {

            // On récupère les infos dans l'ID
            const customId = interaction.customId
            const matches = customId.match(/button_nft_confirm_exec@(.+)/);

            if (matches && matches[1]) {

                // On récupère le contrat
                const identifer = matches[1]

                // On récupère la transaction du user
                const storage = await exe_nft.findOne({ where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifer } });

                // On récupère les data dans l'entrée de la DB
                const action = storage.dataValues.action
                const name = storage.dataValues.name
                const contract = storage.dataValues.contract
                const trade = JSON.parse(storage.dataValues.trade)
                const settings = JSON.parse(storage.dataValues.settings)


                if (action === "buy") {
                    // C'est un achat simple

                    // On renvoi le premier embed de chargement
                    const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Transaction Pending <a:AuraLoading:1134068847616458792>")
                        .setDescription(">>> Displaying the transaction execution")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "Target", value: "`" + name + "`", inline: true },
                            { name: "Action", value: "`📈 Buy`", inline: true },
                            { name: " ", value: " ", inline: false },
                            { name: "Transaction hash", value: "<a:AuraLoading:1134068847616458792>", inline: false },

                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [], ephemeral: true });

                    // On définit les valeurs clés
                    const source = trade.source
                    const global = trade.trade
                    const transaction = trade.transaction
                    const fees = trade.fees


                    // On renvoi la seconde réponse
                    const gasTrackerEmbed3 = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Transaction Pending <a:AuraLoading:1134068847616458792>")
                        .setDescription(">>> Displaying the transaction execution")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "Target", value: "`" + name + "`", inline: true },
                            { name: "Action", value: "`📈 Buy`", inline: true },
                            { name: " ", value: "**Buying** `" + global.quantity + "` ** tokens for** `" + global.price + "Ξ`", inline: false },
                            { name: "Transaction hash", value: "<a:AuraLoading:1134068847616458792>", inline: false },

                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.editReply({ embeds: [gasTrackerEmbed3], ephemeral: true });


                    const gas = await gasOracle(settings.gas_preset, transaction.gasUsed, settings.max_gwei)

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
                                    { name: "Target", value: "`" + name + "`", inline: true },
                                    { name: "Action", value: "`📈 Buy`", inline: true },
                                    { name: " ", value: " ", inline: false },
                                    { name: " ", value: "**Bought** `" + global.quantity + "` ** token for** `" + totalPaid + "Ξ`", inline: false },
                                    { name: " ", value: " ", inline: false },
                                    { name: "Transaction hash:", value: "```" + receipt.hash + "```∟ Transaction details [here](https://etherscan.io/tx/" + receipt.hash + ")", inline: false },

                                )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });

                            // On update dans la database
                            await exe_nft.update({ treated: "true", txn: receipt.hash }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifer } })

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
                                        { name: "Target", value: "`" + name + "`", inline: true },
                                        { name: "Action", value: "`📈 Buy`", inline: true },
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
                                        { name: "Target", value: "`" + name + "`", inline: true },
                                        { name: "Action", value: "`📈 Buy`", inline: true },
                                        { name: " ", value: " ", inline: false },
                                        { name: " ", value: "**Failed to buy** `" + global.quantity + "` ** token for** `" + expected + "Ξ`", inline: false },
                                        { name: " ", value: " ", inline: false },
                                        { name: "Transaction hash:", value: "```" + receipt.hash + "```∟ Transaction details [here](https://etherscan.io/tx/" + receipt.hash + ")", inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });

                                // On update dans la database
                                await exe_nft.update({ treated: "true", txn: receipt.hash }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifer } })

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
                                        { name: "Target", value: "`" + name + "`", inline: true },
                                        { name: "Action", value: "`📈 Buy`", inline: true },
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
                            .setTitle("Buy NFT")
                            .setDescription(">>> Displaying the simulated transaction data")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .addFields(
                                { name: " ", value: " ", inline: false },
                                { name: "Target", value: "`" + name + "`", inline: true },
                                { name: "Action", value: "`📈 Buy`", inline: true },
                                { name: "Value", value: "`" + global.price + "Ξ`", inline: false },
                                { name: "Transaction Data 🚫", value: "```The transaction simulation failed.\n\nThe gas price in gwei (" + parseFloat(gas.price / 10 ** 9).toFixed(2) + " gwei) has exceeded your limit (" + parseFloat(settings.max_gwei).toFixed(2) + " gwei)```", inline: false },

                            )
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [], ephemeral: true });


                    } else if (gas == null) {

                        // Erreur dans le calcul des gas fees
                        const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Buy NFT")
                            .setDescription(">>> Displaying the simulated transaction data")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .addFields(
                                { name: " ", value: " ", inline: false },
                                { name: "Target", value: "`" + name + "`", inline: true },
                                { name: "Action", value: "`📈 Buy`", inline: true },
                                { name: "Value", value: "`" + global.price + "Ξ`", inline: false },
                                { name: "Transaction Data 🚫", value: "```The transaction simulation failed.\n\nThe gas oracle failed to estimate gas price.```", inline: false },

                            )
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [], ephemeral: true });



                    }

                } else if (action === "list") {

                    console.log("Starting listing...")

                    // On vérifie que le trade existe bien
                    if (trade) {

                        // On renvoi la première partie de l'embed
                        // On renvoi le premier embed de chargement
                        const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Order Pending <a:AuraLoading:1134068847616458792>")
                            .setDescription(">>> Displaying the order execution")
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .addFields(
                                { name: " ", value: " ", inline: false },
                                { name: "Target", value: "`" + name + " #" + trade.trade.tokenId + "`", inline: true },
                                { name: "Action", value: "`📉 List`", inline: true },
                                { name: " ", value: " ", inline: false },
                                { name: "Order ID", value: "<a:AuraLoading:1134068847616458792>", inline: false },

                            )
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [], ephemeral: true });


                        // On check s'il y'a des approvals à faire en allant chercher
                        // l'approval désiré dans la liste
                        const sourceApp = trade.approval.find(i => i.id === trade.source)
                        const isApproved = sourceApp.isApproved

                        // On récupère le logo et le nom de la marketplace, pour du formattage
                        const srcLogo = markets.find(i => i.id === trade.source).logo
                        const srcName = markets.find(i => i.id === trade.source).name

                        // On vérifie si c'est approved ou non
                        if (isApproved) {
                            // La collection a déjà été approuvé
                            // On envoi le deuxième embed de chargement
                            const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Order Pending <a:AuraLoading:1134068847616458792>")
                                .setDescription(">>> Displaying the order execution")
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Target", value: "`" + name + " #" + trade.trade.tokenId + "`", inline: true },
                                    { name: "Action", value: "`📉 List`", inline: true },
                                    { name: " ", value: " ", inline: false },
                                    { name: " ", value: "**Listing** `" + trade.trade.quantity + "` ** token at** `" + trade.trade.price + "Ξ` **on " + srcName + "** " + srcLogo, inline: false },
                                    { name: " ", value: " ", inline: false },
                                    { name: "Order ID", value: "<a:AuraLoading:1134068847616458792>", inline: false },

                                )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.editReply({ embeds: [gasTrackerEmbed2], ephemeral: true });


                            // On encode l'order et on ajoute le tout à trade
                            const order = await singleListingEncode(trade, settings)

                            // On vérifie que la signature a bien été faite
                            // et si oui on POST l'answer.
                            if (order.status) {

                                // On POST l'order, cela renvoi le receipt
                                const result = await postOrder(order.order.body, order.order.signature)

                                // On vérifie le status du POST
                                if (result.status) {
                                    // Le status est positif

                                    const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle("Order Confirmed ✅")
                                        .setDescription(">>> Displaying the order execution")
                                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .addFields(
                                            { name: " ", value: " ", inline: false },
                                            { name: "Target", value: "`" + name + " #" + trade.trade.tokenId + "`", inline: true },
                                            { name: "Action", value: "`📉 List`", inline: true },
                                            { name: " ", value: " ", inline: false },
                                            { name: " ", value: "**Listed** `" + trade.trade.quantity + "` ** token at** `" + trade.trade.price + "Ξ` **on " + srcName + "** " + srcLogo, inline: false },
                                            { name: " ", value: " ", inline: false },
                                            { name: "Order ID:", value: "```" + result.orderId + "```∟ Listing details [here](https://blur.io/asset/" + trade.trade.contract + "/" + trade.trade.tokenId + ")", inline: false },

                                        )
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                    await interaction.editReply({ embeds: [gasConfirm], components: [], ephemeral: true });

                                    // On update dans la database
                                    await exe_nft.update({ treated: "true", txn: result.checker }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifer } })

                                } else {
                                    // On définit le boutton qui permet de retry
                                    const retryButton = exeRetryOrCancel(identifer)

                                    // On définit le boutton d'annulation
                                    const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle("Order Failed ❌")
                                        .setDescription(">>> Displaying the order execution")
                                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .addFields(
                                            { name: " ", value: " ", inline: false },
                                            { name: "Target", value: "`" + name + " #" + trade.trade.tokenId + "`", inline: true },
                                            { name: "Action", value: "`📉 List`", inline: true },
                                            { name: " ", value: " ", inline: false },
                                            { name: " ", value: "**Failed to list** `" + trade.trade.quantity + "` ** token at** `" + trade.trade.price + "Ξ` **on " + srcName + "** " + srcLogo, inline: false },
                                            { name: " ", value: " ", inline: false },
                                            { name: "Order error:", value: "```The listing failed.\n\nThe approval transaction didn't went through, the token can't be listed.       ```", inline: false },

                                        )
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                    await interaction.editReply({ embeds: [gasConfirm], components: retryButton, ephemeral: true });
                                }

                            } else {
                                // On envoi la réponse à l'error handler. Cela peut venir 
                                // de la marketplace, de l'auth, ou d'une erreur classique.
                                errorHandler(interaction, order, settings)
                            }

                        } else {
                            // La collection n'est pas approuvé, donc on approve d'abord puis on lache l'order
                            console.log("Ce n'est pas apprové")

                            // On envoi le deuxième embed de chargement
                            const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Order Pending <a:AuraLoading:1134068847616458792>")
                                .setDescription(">>> Displaying the order execution")
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Target", value: "`" + name + " #" + trade.trade.tokenId + "`", inline: true },
                                    { name: "Action", value: "`📉 List`", inline: true },
                                    { name: " ", value: " ", inline: false },
                                    { name: " ", value: "**Listing** `" + trade.trade.quantity + "` ** token at** `" + trade.trade.price + "Ξ` **on " + srcName + "** " + srcLogo, inline: false },
                                    { name: " ", value: " ", inline: false },
                                    { name: "Order ID", value: "Step 1 of 2 (approving) <a:AuraLoading:1134068847616458792>", inline: false },

                                )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.editReply({ embeds: [gasTrackerEmbed2], ephemeral: true });

                            // On récupère les data d'approval dans sourceApp dont le from,
                            // le to, les data, ainsi que les gas expected et average dans l'objet gas.
                            const txInfos = {
                                gasPrice: Math.ceil((await getGasPrice()).wei * 1.05), // On boost le gasPrice de 5%
                                gasLimit: trade.gas.limit, // On set le gas limit à 100k
                                to: sourceApp.to, // On prend le to du tab trade
                                value: 0, // La valeur est de 0
                                data: sourceApp.data, // On prend les data du tab trade
                                chainId: chainId, // la chain ID est définir en haut
                            }

                            // On envoi la transaction
                            const receiptApp = await signTransaction(txInfos, decrypt(settings.privateKey))

                            if (receiptApp && receiptApp.status) {
                                // Transaction signé et exécuter avec succès
                                // Renvoi les informations avec hash de la txn réussi

                                const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Order Pending <a:AuraLoading:1134068847616458792>")
                                    .setDescription(">>> Displaying the transaction execution")
                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setTimestamp()
                                    .addFields(
                                        { name: " ", value: " ", inline: false },
                                        { name: "Target", value: "`" + name + " #" + trade.trade.tokenId + "`", inline: true },
                                        { name: "Action", value: "`📉 List`", inline: true },
                                        { name: " ", value: " ", inline: false },
                                        { name: " ", value: "**Listing** `" + trade.trade.quantity + "` ** token at** `" + trade.trade.price + "Ξ` **on " + srcName + "** " + srcLogo, inline: false },
                                        { name: " ", value: " ", inline: false },
                                        { name: "Order ID", value: "Step 2 of 2 (listing) <a:AuraLoading:1134068847616458792>", inline: false },
                                        { name: " ", value: " ", inline: false },
                                        { name: " ", value: "*The approval transaction can be found [here](https://etherscan.io/tx/" + receiptApp.hash + ").*", inline: false },
                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });

                                // L'approval a été fait, on fait les changements dans le tableau
                                // On enregistrera que si la txn est raté. On fait ça pour que si le
                                // user fasse un retry, on est les nouvelles data enregistrées.
                                trade.approval.find(i => i.id === trade.source).isApproved = true


                                // Une fois la transaction apprové, on passe à l'order
                                // On encode l'order et on ajoute le tout à trade
                                const order = await singleListingEncode(trade, settings)

                                // On vérifie que la signature a bien été faite
                                // et si oui on POST l'answer.

                                if (order.status) {

                                    // On POST l'order, cela renvoi le receipt
                                    const result = await postOrder(order.order.body, order.order.signature)

                                    // On vérifie le status du POST
                                    if (result.status) {
                                        // Le status est positif

                                        const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle("Order Confirmed ✅")
                                            .setDescription(">>> Displaying the order execution")
                                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setTimestamp()
                                            .addFields(
                                                { name: " ", value: " ", inline: false },
                                                { name: "Target", value: "`" + name + " #" + trade.trade.tokenId + "`", inline: true },
                                                { name: "Action", value: "`📉 List`", inline: true },
                                                { name: " ", value: " ", inline: false },
                                                { name: " ", value: "**Listed** `" + trade.trade.quantity + "` ** token at** `" + trade.trade.price + "Ξ` **on " + srcName + "** " + srcLogo, inline: false },
                                                { name: " ", value: " ", inline: false },
                                                { name: "Order ID:", value: "```" + result.orderId + "```∟ Listing details [here](https://blur.io/asset/" + trade.trade.contract + "/" + trade.trade.tokenId + ")", inline: false },
                                                { name: " ", value: " ", inline: false },
                                                { name: " ", value: "*The approval transaction can be found [here](https://etherscan.io/tx/" + receiptApp.hash + ").*", inline: false },
                                            )
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                        await interaction.editReply({ embeds: [gasConfirm], components: [], ephemeral: true });

                                        // On update dans la database
                                        await exe_nft.update({ treated: "true", txn: result.checker }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifer } })

                                    } else {
                                        // On définit le boutton qui permet de retry
                                        const retryButton = exeRetryOrCancel(identifer)

                                        // On définit le boutton d'annulation
                                        const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle("Order Failed ❌")
                                            .setDescription(">>> Displaying the order execution")
                                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setTimestamp()
                                            .addFields(
                                                { name: " ", value: " ", inline: false },
                                                { name: "Target", value: "`" + name + " #" + trade.trade.tokenId + "`", inline: true },
                                                { name: "Action", value: "`📉 List`", inline: true },
                                                { name: " ", value: " ", inline: false },
                                                { name: " ", value: "**Failed to list** `" + trade.trade.quantity + "` ** token at** `" + trade.trade.price + "Ξ` **on " + srcName + "** " + srcLogo, inline: false },
                                                { name: " ", value: " ", inline: false },
                                                { name: "Order error:", value: "```The listing failed.\n\nThe approval transaction didn't went through, the token can't be listed.       ```", inline: false },

                                            )
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                        await interaction.editReply({ embeds: [gasConfirm], components: retryButton, ephemeral: true });

                                        await exe_nft.update({ trade: JSON.stringify(trade) }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifer } })
                                    }

                                } else {
                                    // On envoi la réponse à l'error handler. Cela peut venir 
                                    // de la marketplace, de l'auth, ou d'une erreur classique.
                                    errorHandler(interaction, order, settings)
                                }

                            } else {
                                // On définit le boutton qui permet de retry
                                const retryButton = exeRetryOrCancel(identifer)

                                // Erreur dans la transaction d'approval
                                const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Transaction Failed ❌")
                                    .setDescription(">>> Displaying the transaction execution")
                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setTimestamp()
                                    .addFields(
                                        { name: " ", value: " ", inline: false },
                                        { name: "Target", value: "`" + name + "`", inline: true },
                                        { name: "Action", value: "`📉 List`", inline: true },
                                        { name: " ", value: " ", inline: false },
                                        { name: " ", value: "**Failed to list** `" + trade.trade.quantity + "` ** token at** `" + trade.trade.price + "Ξ` **on " + srcName + "** " + srcLogo, inline: false },
                                        { name: " ", value: " ", inline: false },
                                        { name: "Transaction error:", value: "```The order failed.\n\nThe approval transaction didn't went through, the token can't be listed.       ```", inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [gasConfirm], components: retryButton, ephemeral: true });
                            }
                        }

                    } else {
                        // L'objet trade n'existe pas
                        const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("NFT Trading")
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setDescription("An error occured while retrieving your data. Please try again or contact a team member if the issue persists.")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [setfpEmbedNotForYou], components: [], ephemeral: true });
                    }

                } else if (action === "snipe") {


                    // C'est un achat simple
                    // On renvoi le premier embed de chargement
                    const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Transaction Pending <a:AuraLoading:1134068847616458792>")
                        .setDescription(">>> Displaying the transaction execution")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "Target", value: "`" + name + " #" + trade.trade.tokenId + "`", inline: true },
                            { name: "Action", value: "`🔫 Snipe`", inline: true },
                            { name: " ", value: " ", inline: false },
                            { name: "Transaction hash", value: "<a:AuraLoading:1134068847616458792>", inline: false },

                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [], ephemeral: true });

                    // On définit les valeurs clés
                    const source = trade.source
                    const global = trade.trade
                    const transaction = trade.transaction
                    const fees = trade.fees


                    // On renvoi la seconde réponse
                    const gasTrackerEmbed3 = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Transaction Pending <a:AuraLoading:1134068847616458792>")
                        .setDescription(">>> Displaying the transaction execution")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "Target", value: "`" + name + " #" + global.tokenId + "`", inline: true },
                            { name: "Action", value: "`🔫 Snipe`", inline: true },
                            { name: " ", value: "**Buying** `" + global.quantity + "` ** tokens for** `" + global.price + "Ξ`", inline: false },
                            { name: "Transaction hash", value: "<a:AuraLoading:1134068847616458792>", inline: false },

                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.editReply({ embeds: [gasTrackerEmbed3], ephemeral: true });


                    const gas = await gasOracle(settings.gas_preset, transaction.gasUsed, settings.max_gwei)

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
                                    { name: "Target", value: "`" + name + " #" + global.tokenId + "`", inline: true },
                                    { name: "Action", value: "`🔫 Snipe`", inline: true },
                                    { name: " ", value: " ", inline: false },
                                    { name: " ", value: "**Bought** `" + global.quantity + "` ** token for** `" + totalPaid + "Ξ`", inline: false },
                                    { name: " ", value: " ", inline: false },
                                    { name: "Transaction hash:", value: "```" + receipt.hash + "```∟ Transaction details [here](https://etherscan.io/tx/" + receipt.hash + ")", inline: false },

                                )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });

                            // On update dans la database
                            await exe_nft.update({ treated: "true", txn: receipt.hash }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifer } })

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
                                        { name: "Target", value: "`" + name + " #" + global.tokenId + "`", inline: true },
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
                                        { name: "Target", value: "`" + name + " #" + global.tokenId + "`", inline: true },
                                        { name: "Action", value: "`🔫 Snipe`", inline: true },
                                        { name: " ", value: " ", inline: false },
                                        { name: " ", value: "**Failed to buy** `" + global.quantity + "` ** token for** `" + expected + "Ξ`", inline: false },
                                        { name: " ", value: " ", inline: false },
                                        { name: "Transaction hash:", value: "```" + receipt.hash + "```∟ Transaction details [here](https://etherscan.io/tx/" + receipt.hash + ")", inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });

                                // On update dans la database
                                await exe_nft.update({ treated: "true", txn: receipt.hash }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifer } })

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
                                        { name: "Target", value: "`" + name + " #" + global.tokenId + "`", inline: true },
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
                                { name: "Target", value: "`" + name + " #" + global.tokenId + "`", inline: true },
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
                                { name: "Target", value: "`" + name + " #" + global.tokenId + "`", inline: true },
                                { name: "Action", value: "`🔫 Snipe`", inline: true },
                                { name: "Value", value: "`" + global.price + "Ξ`", inline: false },
                                { name: "Transaction Data 🚫", value: "```The transaction simulation failed.\n\nThe gas oracle failed to estimate gas price.```", inline: false },

                            )
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [], ephemeral: true });

                    }
                } else if (action === "bid") {

                    console.log("Starting bidding...")

                    // On vérifie que le trade existe bien
                    if (trade) {

                        // On renvoi la première partie de l'embed
                        // On renvoi le premier embed de chargement
                        const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Order Pending <a:AuraLoading:1134068847616458792>")
                            .setDescription(">>> Displaying the order execution")
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .addFields(
                                { name: " ", value: " ", inline: false },
                                { name: "Target", value: "`" + name + "`", inline: true },
                                { name: "Action", value: "`✨ Bidding`", inline: true },
                                { name: " ", value: " ", inline: false },
                                { name: "Order ID", value: "<a:AuraLoading:1134068847616458792>", inline: false },

                            )
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [], ephemeral: true });


                        // On check s'il y'a des approvals à faire en allant chercher
                        // l'approval désiré dans la liste
                        const sourceApp = trade.swap.find(i => i.id === trade.source)
                        const hasPool = sourceApp.hasPool

                        // On récupère le logo et le nom de la marketplace, pour du formattage
                        const source = markets.find(i => i.id === trade.source)
                        const srcLogo = source.logo
                        const srcName = source.name

                        // On vérifie si c'est approved ou non
                        if (hasPool) {

                            // La collection a déjà été approuvé
                            // On envoi le deuxième embed de chargement
                            const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Order Pending <a:AuraLoading:1134068847616458792>")
                                .setDescription(">>> Displaying the order execution")
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Target", value: "`" + name + "`", inline: true },
                                    { name: "Action", value: "`✨ Bidding`", inline: true },
                                    { name: " ", value: " ", inline: false },
                                    { name: " ", value: "**Creating ** `" + trade.trade.quantity + "` ** bid at** `" + trade.trade.price + "Ξ` **on " + srcName + "** " + srcLogo, inline: false },
                                    { name: " ", value: " ", inline: false },
                                    { name: "Order ID", value: "<a:AuraLoading:1134068847616458792>", inline: false },

                                )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.editReply({ embeds: [gasTrackerEmbed2], ephemeral: true });


                            // On encode l'order et on ajoute le tout à trade
                            const order = await createCollectionBidEncode(trade, settings)

                            // On vérifie que la signature a bien été faite
                            // et si oui on POST l'answer.
                            if (order.status) {

                                // On POST l'order, cela renvoi le receipt
                                const result = await postOrder(order.order.body, order.order.signature)

                                // On vérifie le status du POST
                                if (result.status) {
                                    // Le status est positif

                                    const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle("Order Confirmed ✅")
                                        .setDescription(">>> Displaying the order execution")
                                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .addFields(
                                            { name: " ", value: " ", inline: false },
                                            { name: "Target", value: "`" + name + "`", inline: true },
                                            { name: "Action", value: "`✨ Bidding`", inline: true },
                                            { name: " ", value: " ", inline: false },
                                            { name: " ", value: "**Created** `" + trade.trade.quantity + "` ** bid(s) at** `" + trade.trade.price + "Ξ` **on " + srcName + "** " + srcLogo, inline: false },
                                            { name: " ", value: " ", inline: false },
                                            { name: "Order ID:", value: "```" + result.orderId + "```∟ Bid details [here](https://blur.io/portfolio/bids)", inline: false },

                                        )
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                    await interaction.editReply({ embeds: [gasConfirm], components: [], ephemeral: true });

                                    // On update dans la database
                                    await exe_nft.update({ treated: "true", txn: result.checker }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifer } })

                                } else {
                                    // On définit le boutton qui permet de retry
                                    const retryButton = exeRetryOrCancel(identifer)

                                    // On définit le boutton d'annulation
                                    const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle("Order Failed ❌")
                                        .setDescription(">>> Displaying the order execution")
                                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .addFields(
                                            { name: " ", value: " ", inline: false },
                                            { name: "Target", value: "`" + name + "`", inline: true },
                                            { name: "Action", value: "`✨ Bidding`", inline: true },
                                            { name: " ", value: " ", inline: false },
                                            { name: " ", value: "**Failed to create** `" + trade.trade.quantity + "` ** bid(s) at** `" + trade.trade.price + "Ξ` **on " + srcName + "** " + srcLogo, inline: false },
                                            { name: " ", value: " ", inline: false },
                                            { name: "Order error:", value: "```The bid creation failed.\n\nThe wallet signature didn't went through, the bid can't be created.       ```", inline: false },

                                        )
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                    await interaction.editReply({ embeds: [gasConfirm], components: retryButton, ephemeral: true });
                                }

                            } else {
                                // On envoi la réponse à l'error handler. Cela peut venir 
                                // de la marketplace, de l'auth, ou d'une erreur classique.
                                errorHandler(interaction, order, settings)
                            }

                        } else {
                            // La collection n'est pas approuvé, donc on approve d'abord puis on lache l'order

                            // On envoi le deuxième embed de chargement
                            const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Order Pending <a:AuraLoading:1134068847616458792>")
                                .setDescription(">>> Displaying the order execution")
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Target", value: "`" + name + "`", inline: true },
                                    { name: "Action", value: "`✨ Bidding`", inline: true },
                                    { name: " ", value: " ", inline: false },
                                    { name: " ", value: "**Creating ** `" + trade.trade.quantity + "` ** bid(s) at** `" + trade.trade.price + "Ξ` **on " + srcName + "** " + srcLogo, inline: false },
                                    { name: " ", value: " ", inline: false },
                                    { name: "Order ID", value: "Step 1 of 2 (wrapping) <a:AuraLoading:1134068847616458792>", inline: false },

                                )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.editReply({ embeds: [gasTrackerEmbed2], ephemeral: true });

                            // On récupère les data d'approval dans sourceApp dont le from,
                            // le to, les data, ainsi que les gas expected et average dans l'objet gas.
                            const txInfos = {
                                gasPrice: Math.ceil((await getGasPrice()).wei * 1.05), // On boost le gasPrice de 5%
                                gasLimit: trade.gas.limit, // On set le gas limit à 100k
                                to: sourceApp.to, // On prend le to du tab trade
                                value: sourceApp.value, // La valeur est de 0
                                data: sourceApp.data, // On prend les data du tab trade
                                chainId: chainId, // la chain ID est définir en haut
                            }

                            // On envoi la transaction
                            const receiptApp = await signTransaction(txInfos, decrypt(settings.privateKey))

                            if (receiptApp && receiptApp.status) {
                                // Transaction signé et exécuter avec succès
                                // Renvoi les informations avec hash de la txn réussi

                                const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Order Pending <a:AuraLoading:1134068847616458792>")
                                    .setDescription(">>> Displaying the transaction execution")
                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setTimestamp()
                                    .addFields(
                                        { name: " ", value: " ", inline: false },
                                        { name: "Target", value: "`" + name + "`", inline: true },
                                        { name: "Action", value: "`✨ Bidding`", inline: true },
                                        { name: " ", value: " ", inline: false },
                                        { name: " ", value: "**Creating ** `" + trade.trade.quantity + "` ** bid(s) at** `" + trade.trade.price + "Ξ` **on " + srcName + "** " + srcLogo, inline: false },
                                        { name: " ", value: " ", inline: false },
                                        { name: "Order ID", value: "Step 2 of 2 (bidding) <a:AuraLoading:1134068847616458792>", inline: false },
                                        { name: " ", value: " ", inline: false },
                                        { name: " ", value: "*The wrap transaction can be found [here](https://etherscan.io/tx/" + receiptApp.hash + ").*", inline: false },
                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });

                                // Le wrap a été fait, on fait les changements dans le tableau
                                // On enregistrera que si la txn est raté. On fait ça pour que si le
                                // user fasse un retry, on est les nouvelles data enregistrées.
                                trade.swap.find(i => i.id === trade.source).hasPool = true
                                trade.swap.find(i => i.id === trade.source).balance = sourceApp.balance + sourceApp.value

                                // Une fois les tokens wrappé apprové, on passe à l'order
                                // On encode l'order et on ajoute le tout à trade
                                const order = await createCollectionBidEncode(trade, settings)

                                // On vérifie que la signature a bien été faite
                                // et si oui on POST l'answer.
                                if (order.status) {

                                    // On POST l'order, cela renvoi le receipt
                                    const result = await postOrder(order.order.body, order.order.signature)

                                    // On vérifie le status du POST
                                    if (result.status) {
                                        // Le status est positif

                                        const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle("Order Confirmed ✅")
                                            .setDescription(">>> Displaying the order execution")
                                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setTimestamp()
                                            .addFields(
                                                { name: " ", value: " ", inline: false },
                                                { name: "Target", value: "`" + name + "`", inline: true },
                                                { name: "Action", value: "`✨ Bidding`", inline: true },
                                                { name: " ", value: " ", inline: false },
                                                { name: " ", value: "**Created** `" + trade.trade.quantity + "` ** bid(s) at** `" + trade.trade.price + "Ξ` **on " + srcName + "** " + srcLogo, inline: false },
                                                { name: " ", value: " ", inline: false },
                                                { name: "Order ID:", value: "```" + result.orderId + "```∟ Bid details [here](https://blur.io/portfolio/bids)", inline: false },
                                                { name: " ", value: " ", inline: false },
                                                { name: " ", value: "*The wrap transaction can be found [here](https://etherscan.io/tx/" + receiptApp.hash + ").*", inline: false },
                                            )
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                        await interaction.editReply({ embeds: [gasConfirm], components: [], ephemeral: true });

                                        // On update dans la database
                                        await exe_nft.update({ treated: "true", txn: result.checker }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifer } })

                                    } else {
                                        // On définit le boutton qui permet de retry
                                        const retryButton = exeRetryOrCancel(identifer)

                                        // On définit le boutton d'annulation
                                        const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle("Order Failed ❌")
                                            .setDescription(">>> Displaying the order execution")
                                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setTimestamp()
                                            .addFields(
                                                { name: " ", value: " ", inline: false },
                                                { name: "Target", value: "`" + name + "`", inline: true },
                                                { name: "Action", value: "`✨ Bidding`", inline: true },
                                                { name: " ", value: " ", inline: false },
                                                { name: " ", value: "**Failed to create** `" + trade.trade.quantity + "` ** bid(s) at** `" + trade.trade.price + "Ξ` **on " + srcName + "** " + srcLogo, inline: false },
                                                { name: " ", value: " ", inline: false },
                                                { name: "Order error:", value: "```The bid creation failed.\n\nThe wallet signature didn't went through, the bid can't be created.       ```", inline: false },

                                            )
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                        await interaction.editReply({ embeds: [gasConfirm], components: retryButton, ephemeral: true });

                                        await exe_nft.update({ trade: JSON.stringify(trade) }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifer } })
                                    }

                                } else {
                                    // On envoi la réponse à l'error handler. Cela peut venir 
                                    // de la marketplace, de l'auth, ou d'une erreur classique.
                                    errorHandler(interaction, order, settings)
                                }

                            } else {
                                // On définit le boutton qui permet de retry
                                const retryButton = exeRetryOrCancel(identifer)

                                // Erreur dans la transaction d'approval
                                const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Transaction Failed ❌")
                                    .setDescription(">>> Displaying the transaction execution")
                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setTimestamp()
                                    .addFields(
                                        { name: " ", value: " ", inline: false },
                                        { name: "Target", value: "`" + name + "`", inline: true },
                                        { name: "Action", value: "`✨ Bidding`", inline: true },
                                        { name: " ", value: " ", inline: false },
                                        { name: " ", value: "**Failed to create** `" + trade.trade.quantity + "` ** bid(s) at** `" + trade.trade.price + "Ξ` **on " + srcName + "** " + srcLogo, inline: false },
                                        { name: " ", value: " ", inline: false },
                                        { name: "Transaction error:", value: "```The order failed.\n\nThe wrap transaction didn't went through, the bid can't be created.       ```", inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [gasConfirm], components: retryButton, ephemeral: true });
                            }
                        }

                    } else {
                        // L'objet trade n'existe pas
                        const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("NFT Trading")
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setDescription("An error occured while retrieving your data. Please try again or contact a team member if the issue persists.")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [setfpEmbedNotForYou], components: [], ephemeral: true });
                    }
                } else if (action === "sell") {

                    // On renvoi le premier embed de chargement
                    const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Transaction Pending <a:AuraLoading:1134068847616458792>")
                        .setDescription(">>> Displaying the transaction execution")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "Target", value: "`" + name + "`", inline: true },
                            { name: "Action", value: "`🤝 Accept Bid", inline: true },
                            { name: " ", value: " ", inline: false },
                            { name: "Transaction hash", value: "<a:AuraLoading:1134068847616458792>", inline: false },

                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [], ephemeral: true });

                    // On définit les valeurs clés
                    const source = trade.source
                    const global = trade.trade
                    const transaction = trade.transaction
                    const fees = trade.gas


                    // On renvoi la seconde réponse
                    const gasTrackerEmbed3 = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Transaction Pending <a:AuraLoading:1134068847616458792>")
                        .setDescription(">>> Displaying the transaction execution")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "Target", value: "`" + name + "`", inline: true },
                            { name: "Action", value: "`🤝 Accept Bid`", inline: true },
                            { name: " ", value: "**Selling** `" + global.quantity + "` ** token for** `" + global.price + "Ξ`", inline: false },
                            { name: "Transaction hash", value: "<a:AuraLoading:1134068847616458792>", inline: false },

                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.editReply({ embeds: [gasTrackerEmbed3], ephemeral: true });

                    // On met le gas preset a null, 
                    const gas = await gasOracle(null, fees.limit, settings.max_gwei)

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

                            const totalPaid = global.price - parseFloat(receipt.gas_fees)

                            const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Transaction Confirmed ✅")
                                .setDescription(">>> Displaying the transaction execution")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Target", value: "`" + name + "`", inline: true },
                                    { name: "Action", value: "`🤝 Accept Bid`", inline: true },
                                    { name: " ", value: " ", inline: false },
                                    { name: " ", value: "**Sold** `" + global.quantity + "` ** token for** `" + totalPaid + "Ξ`", inline: false },
                                    { name: " ", value: " ", inline: false },
                                    { name: "Transaction hash:", value: "```" + receipt.hash + "```∟ Transaction details [here](https://etherscan.io/tx/" + receipt.hash + ")", inline: false },

                                )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });

                            // On update dans la database
                            await exe_nft.update({ treated: "true", txn: receipt.hash }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifer } })

                        } else {

                            // Erreur dans la transaction
                            // Erreur détaillé plus bas entre failed txn et failed execution

                            if (!receipt) {

                                // Erreur catch lors de la signature 
                                // Renvoi une erreur avec message comme pour simulation
                                const expected = global.price - parseFloat(receipt.gas_fees)

                                const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Transaction Failed ❌")
                                    .setDescription(">>> Displaying the transaction execution")
                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setTimestamp()
                                    .addFields(
                                        { name: " ", value: " ", inline: false },
                                        { name: "Target", value: "`" + name + "`", inline: true },
                                        { name: "Action", value: "`🤝 Accept Bid`", inline: true },
                                        { name: " ", value: " ", inline: false },
                                        { name: " ", value: "**Failed to sell** `" + global.quantity + "` ** token for** `" + expected + "Ξ`", inline: false },
                                        { name: " ", value: " ", inline: false },
                                        { name: "Transaction error:", value: "```The transaction failed.\n\nThe wallet signature didn't went through       ```", inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });


                            } else if (receipt.status == false) {

                                // Transaction signé et exécuter mais pas passé
                                // Renvoi les informations avec hash de la txn fail
                                const expected = global.price - parseFloat(gas.fees)

                                const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Transaction Failed ❌")
                                    .setDescription(">>> Displaying the transaction execution")
                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setTimestamp()
                                    .addFields(
                                        { name: " ", value: " ", inline: false },
                                        { name: "Target", value: "`" + name + "`", inline: true },
                                        { name: "Action", value: "`🤝 Accept Bid`", inline: true },
                                        { name: " ", value: " ", inline: false },
                                        { name: " ", value: "**Failed to sell** `" + global.quantity + "` ** token for** `" + expected + "Ξ`", inline: false },
                                        { name: " ", value: " ", inline: false },
                                        { name: "Transaction hash:", value: "```" + receipt.hash + "```∟ Transaction details [here](https://etherscan.io/tx/" + receipt.hash + ")", inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });

                                // On update dans la database
                                await exe_nft.update({ treated: "true", txn: receipt.hash }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifer } })

                            } else {

                                // Erreur catch lors de la signature ou de l'execution
                                // Renvoi une erreur avec message comme pour simulation
                                const expected = global.price - parseFloat(gas.fees)

                                const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Transaction Failed ❌")
                                    .setDescription(">>> Displaying the transaction execution")
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setTimestamp()
                                    .addFields(
                                        { name: " ", value: " ", inline: false },
                                        { name: "Target", value: "`" + name + "`", inline: true },
                                        { name: "Action", value: "`🤝 Accept Bid`", inline: true },
                                        { name: " ", value: " ", inline: false },
                                        { name: " ", value: "**Failed to sell** `" + global.quantity + "` ** token for** `" + expected + "Ξ`", inline: false },
                                        { name: " ", value: " ", inline: false },
                                        { name: "Transaction error:", value: "```The transaction failed.\n\n" + receipt.message + "       ```", inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });
                            }
                        }
                    }

                } else if (action === "transfer") {


                    // On renvoi le premier embed de chargement
                    const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Transaction Pending <a:AuraLoading:1134068847616458792>")
                        .setDescription(">>> Displaying the transaction execution")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "Target", value: "`" + name + "`", inline: true },
                            { name: "Action", value: "`📤 Transfer`", inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: "Transaction hash", value: "<a:AuraLoading:1134068847616458792>", inline: false },

                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [], ephemeral: true });

                    // On définit les valeurs clés
                    const global = trade.trade
                    const transaction = trade.transaction
                    const gas = trade.gas


                    // On renvoi la seconde réponse
                    const gasTrackerEmbed3 = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Transaction Pending <a:AuraLoading:1134068847616458792>")
                        .setDescription(">>> Displaying the transaction execution")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "Target", value: "`" + name + "`", inline: true },
                            { name: "Action", value: "`📤 Transfer`", inline: false },
                            { name: " ", value: "**Transfering** `" + global.quantity + "` ** token for** `" + gas.expected + "Ξ`", inline: false },
                            { name: "Transaction hash", value: "<a:AuraLoading:1134068847616458792>", inline: false },

                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.editReply({ embeds: [gasTrackerEmbed3], ephemeral: true });


                    //On construit l'objet de transaction
                    const txnInfos = {
                        gasPrice: (await getGasPrice()).wei,
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

                        const totalPaid = parseFloat(receipt.gas_fees)

                        const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Transaction Confirmed ✅")
                            .setDescription(">>> Displaying the transaction execution")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .addFields(
                                { name: " ", value: " ", inline: false },
                                { name: "Target", value: "`" + name + "`", inline: true },
                                { name: "Action", value: "`📤 Transfer`", inline: false },
                                { name: " ", value: " ", inline: false },
                                { name: " ", value: "**Bought** `" + global.quantity + "` ** token for** `" + totalPaid + "Ξ`", inline: false },
                                { name: " ", value: " ", inline: false },
                                { name: "Transaction hash:", value: "```" + receipt.hash + "```∟ Transaction details [here](https://etherscan.io/tx/" + receipt.hash + ")", inline: false },

                            )
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });

                        // On update dans la database
                        await exe_nft.update({ treated: "true", txn: receipt.hash }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifer } })

                    } else {

                        // Erreur dans la transaction
                        // Erreur détaillé plus bas entre failed txn et failed execution

                        if (!receipt) {

                            // Erreur catch lors de la signature 
                            // Renvoi une erreur avec message comme pour simulation
                            const expected = parseFloat(gas.expected)

                            const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Transaction Failed ❌")
                                .setDescription(">>> Displaying the transaction execution")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Target", value: "`" + name + "`", inline: true },
                                    { name: "Action", value: "`📤 Transfer`", inline: false },
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
                            const totalPaid = parseFloat(receipt.gas_fees)

                            const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Transaction Failed ❌")
                                .setDescription(">>> Displaying the transaction execution")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Target", value: "`" + name + "`", inline: true },
                                    { name: "Action", value: "`📤 Transfer`", inline: false },
                                    { name: " ", value: " ", inline: false },
                                    { name: " ", value: "**Failed to buy** `" + global.quantity + "` ** token for** `" + totalPaid + "Ξ`", inline: false },
                                    { name: " ", value: " ", inline: false },
                                    { name: "Transaction hash:", value: "```" + receipt.hash + "```∟ Transaction details [here](https://etherscan.io/tx/" + receipt.hash + ")", inline: false },

                                )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });

                            // On update dans la database
                            await exe_nft.update({ treated: "true", txn: receipt.hash }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifer } })

                        } else {

                            // Erreur catch lors de la signature ou de l'execution
                            // Renvoi une erreur avec message comme pour simulation
                            const expected = parseFloat(gas.expected)

                            const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Transaction Failed ❌")
                                .setDescription(">>> Displaying the transaction execution")
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setTimestamp()
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Target", value: "`" + name + "`", inline: true },
                                    { name: "Action", value: "`📤 Transfer`", inline: false },
                                    { name: " ", value: " ", inline: false },
                                    { name: " ", value: "**Failed to buy** `" + global.quantity + "` ** token for** `" + expected + "Ξ`", inline: false },
                                    { name: " ", value: " ", inline: false },
                                    { name: "Transaction error:", value: "```The transaction failed.\n\n" + receipt.message + "       ```", inline: false },

                                )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });
                        }
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


