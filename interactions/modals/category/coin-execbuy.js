/**
 * @file Sample modal interaction
 * @author JAYZHVJ
 * @since 3.2.0
 * @version 3.2.2
 */

/**
 * @type {import('../../../typings').ModalInteractionCommand}
 */

const { ActionRowBuilder, EmbedBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const { accessSql, profileData, reportsql, adminsql, interactionData, infra_coin, exe_coin, sequelize } = require('../../../events/database');
const moment = require('moment');

// Fonctions d'execution et de formattage
const { createFactory, generateTrade, signTransaction, gasOracle, getAllowance, setSlippage, approveMaxToken,  simulateTransaction } = require('../../../functions/coin-utils')
const decrypt = require("../../../functions/decrypt")
const formatCoinValueSign = require("../../../functions/formatNumberEmbed")
const generateRandomString = require("../../../functions/randomkey")


// Déclaration des valeur liées aux contrats V2 et V3
const uniswapV2_router2_address = "0x7a250d5630b4cf539739df2c5dacb4c659f2488d"
const chainId = 1


// Boutton pas de wallet
const buttonsRowConfirm = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('button_coin_exec_confirm')
            .setLabel('Confirm')
            .setEmoji("✅")
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId('button_coin_exec_cancel')
            .setLabel('Cancel')
            .setStyle(4),

    );

// Boutton pas de wallet
const buttonsRowCancel = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('button_coin_exec_cancel')
            .setLabel('Cancel')
            .setStyle(4),

    );



module.exports = {
    id: "modal_coin_exec_buy_",

    async execute(interaction) {

        console.log("ici")

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


            // On identifie la partie intéressante
            const customId = interaction.customId
            const regex = /_0x([0-9a-fA-F]{40})/;
            const matches = customId.match(regex);


            if (matches && matches[1]) {

                const contract = "0x" + matches[1]

                //Récupère le password donné par l'utilisateur
                const amount_string = interaction.fields.getTextInputValue('modal_coin_exec_buy_' + contract + "@xETHR1");


                if (!isNaN(amount_string)) {

                    const userSetup = await infra_coin.findOne({ where: { authorId: authorId } })

                    if (userSetup != null) {

                        // On récupère les informations coin de l'utilisateur
                        const ape_mode = userSetup.dataValues.ape_mode
                        const gas_preset = userSetup.dataValues.gas_preset
                        const slippage_preset = userSetup.dataValues.slippage
                        const auto_approval = userSetup.dataValues.auto_approval
                        const max_gwei = userSetup.dataValues.max_gwei
                        const mev_protection = userSetup.dataValues.mev_protection
                        const sender = userSetup.dataValues.walletAddress
                        const privateKey = userSetup.dataValues.privateKey


                        if (ape_mode == "true") {

                            // On convertir l'amount en format flottant
                            const amount = parseFloat(amount_string);

                            // On définit le slippage (Auto en fonction du prix pas de la pool)
                            const slippage = setSlippage(slippage_preset, amount)

                            // On crée la paire grâce à la factory
                            const factory = await createFactory(
                                "swap_eth_to_token",
                                contract,
                                decrypt(sender),
                                slippage
                            )

                            // Informations du token
                            const toSymbol = factory._uniswapPairFactoryContext.toToken.symbol;


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



                            // On génère le trade
                            const trade = await generateTrade(
                                "swap_eth_to_token",
                                factory,
                                amount.toString(),
                            )


                            if (trade != null) {

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
                                        { name: " ", value: "**Buying** `" + formatCoinValueSign(trade.amountExpected) + "` ** tokens for** `" + amount + "Ξ`", inline: false },
                                        { name: "Transaction hash", value: "<a:AuraLoading:1134068847616458792>", inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [gasTrackerEmbed3], ephemeral: true });


                                // On vérifie que la balance de l'utitilisateur est suffisante
                                if (trade.hasEnough == true) {

                                    // Possibilité de rechercher quelle router est utilisé pour encoder les datas en built-in
                                    // Fonction d'encodage dépend du router
                                    // UNI V2 : encodage complet built-in
                                    // UNI V3 : encodage et remplaçage 


                                    // On fait la simulation, si échec, on renvoi le message d'erreur
                                    const simulation_param = {
                                        to: trade.router,
                                        data: trade.data,
                                        value: trade.value,
                                        from: decrypt(sender)
                                    }


                                    // Fonction qui effectue la simulation
                                    // Renvoi le nombre de gas utilisé
                                    // Si erreur, renvoi soit rien soit que la limite a été atteinte
                                    const simulation = await simulateTransaction(simulation_param)


                                    // Si la transaction est valide, on continu
                                    if (simulation.valid == true) {


                                        const gas = await gasOracle(gas_preset, simulation.result, max_gwei)

                                        if (gas !== null && gas.valid == true) {


                                            //On construit l'objet de transaction
                                            const txnInfos = {
                                                gasPrice: gas.price,
                                                gasLimit: gas.limit,
                                                to: trade.router,
                                                value: trade.value,
                                                data: trade.data,
                                                chainId: chainId,

                                            };


                                            // Signature et envoi de la transaction
                                            // Renvoi le receipt avec les infos
                                            const receipt = await signTransaction(txnInfos, decrypt(privateKey), mev_protection)



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
                                                        { name: " ", value: "**Bought** `" + formatCoinValueSign(trade.amountExpected) + "` ** tokens for** `" + totalPaid + "Ξ`", inline: false },
                                                        { name: " ", value: " ", inline: false },
                                                        { name: "Transaction hash:", value: "```" + receipt.hash + "```∟ Transaction details [here](https://basescan.org/tx/" + receipt.hash + ")", inline: false },

                                                    )
                                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                                await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });


                                                // On check si le user a l'auto approval 
                                                // Si il l'a on envoi la fonction
                                                if (auto_approval == "true") {

                                                    // On regarde combien le user a de jeton approve pour ce token et ce router
                                                    const allowance = await getAllowance(factory, decrypt(sender), trade.router, "to_token")

                                                    // On vérifie si il y'a assez d'allowance par rapport à la quantité de token prévu
                                                    if (allowance < parseFloat(trade.amountExpected)) {

                                                        // On lance la transaction d'approval Max
                                                        const approval = await approveMaxToken(contract, trade.router, decrypt(privateKey))

                                                        if (approval) {

                                                            if (approval.status == true) {

                                                                // Si la txn est passée

                                                                const approvalEmbed = new EmbedBuilder().setColor("#060A8F")
                                                                    .setTitle("Token Approved ✅")
                                                                    .setDescription("The token has been successfully auto-approved for maximum allowance. The transaction is available [here](https://etherscan.io/tx/" + approval.hash + ")")
                                                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                                                    .setTimestamp()
                                                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                                                await interaction.followUp({ embeds: [approvalEmbed], ephemeral: true });


                                                            } if (approval.status == false) {

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


                                                        } else {

                                                            // Si la txn est pas passé et pas partie

                                                            const approvalEmbed = new EmbedBuilder().setColor("#060A8F")
                                                                .setTitle("Token Approval Failed ❌")
                                                                .setDescription("The token approval for maximum allowance has failed. No transaction has been launched, you didn't payed gas fees.")
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

                                                    const totalExpected = parseFloat(amount) + parseFloat(gas.fees)

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
                                                            { name: " ", value: "**Failed to buy** `" + formatCoinValueSign(trade.amountExpected) + "` ** tokens for** `" + totalExpected + "Ξ`", inline: false },
                                                            { name: " ", value: " ", inline: false },
                                                            { name: "Transaction error:", value: "```The transaction failed.\n\nThe wallet signature didn't went through       ```", inline: false },

                                                        )
                                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                                    await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });


                                                } else if (receipt.status == false) {

                                                    // Transaction signé et exécuter mais pas passé
                                                    // Renvoi les informations avec hash de la txn fail


                                                    const totalExpected = parseFloat(amount) + parseFloat(gas.fees)

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
                                                            { name: " ", value: "**Failed to buy** `" + formatCoinValueSign(trade.amountExpected) + "` ** tokens for** `" + totalExpected + "Ξ`", inline: false },
                                                            { name: " ", value: " ", inline: false },
                                                            { name: "Transaction hash:", value: "```" + receipt.hash + "```∟ Transaction details [here](https://basescan.org/tx/" + receipt.hash + ")", inline: false },

                                                        )
                                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                                    await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });



                                                } else {

                                                    // Erreur catch lors de la signature ou de l'execution
                                                    // Renvoi une erreur avec message comme pour simulation

                                                    const totalExpected = parseFloat(amount) + parseFloat(gas.fees)

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
                                                            { name: " ", value: "**Failed to buy** `" + formatCoinValueSign(trade.amountExpected) + "` ** tokens for** `" + totalExpected + "Ξ`", inline: false },
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

                                    } else {

                                        // La simulation n'a pas réussi
                                        // On annule la transaction

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
                                                { name: "Transaction Data 🚫", value: "```The transaction simulation failed.\n\n" + simulation.result + "```", inline: false },

                                            )
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                                        await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [], ephemeral: true });


                                    }

                                } else {


                                    // Fond insuffisant
                                    // Simulation annulé 

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
                                            { name: "Transaction Data 🚫", value: "```The transaction simulation failed.\n\nYour balance is insufficient: " + parseFloat(trade.balance).toFixed(5) + "Ξ       ```", inline: false },

                                        )
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                                    await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [], ephemeral: true });


                                }

                            } else {

                                const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Buy Coin")
                                    .setDescription(">>> Displaying your transaction simulation")
                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .addFields(
                                        { name: " ", value: "Aura didn't found a route to execute your trade. This can happen if the pool has insufficient liquidity, if the number of tokens received is far too low or if the contract has been blocked.", inline: true },

                                    )
                                    .setTimestamp()
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [errorNotEthereum], components: [], ephemeral: true });


                            }


                        } else if (ape_mode == "false") {



                            // On convertir l'amount en format flottant
                            const amount = parseFloat(amount_string);


                            // On définit le slippage (Auto en fonction du prix pas de la pool)
                            const slippage = setSlippage(slippage_preset, amount)
                            console.log(slippage)
                            // On crée la paire grâce à la factory
                            const factory = await createFactory(
                                "swap_eth_to_token",
                                contract,
                                decrypt(sender),
                                slippage
                            )

                            // Informations du token
                            const toSymbol = factory._uniswapPairFactoryContext.toToken.symbol;



                            const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Buy Coin")
                                .setDescription(">>> Displaying the simulated transaction data")
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Target", value: "`" + toSymbol.toUpperCase() + "`", inline: true },
                                    { name: "Action", value: "`📈 Buy`", inline: true },
                                    { name: "Value", value: "`" + amount + "Ξ`", inline: false },
                                    { name: "Simulation", value: "<a:AuraLoading:1134068847616458792>", inline: false },

                                )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })



                            await interaction.editReply({ embeds: [gasTrackerEmbed], components: [], ephemeral: true });



                            // On génère le trade
                            const trade = await generateTrade(
                                "swap_eth_to_token",
                                factory,
                                amount.toString(),
                            )


                            // On vérifie si le trade a été trouvé
                            if (trade != null) {

                                // On vérifie que la balance de l'utitilisateur est suffisante
                                if (trade.hasEnough == true) {





                                    // Possibilité de rechercher quelle router est utilisé pour encoder les datas en built-in
                                    // Fonction d'encodage dépend du router
                                    // UNI V2 : encodage complet built-in
                                    // UNI V3 : encodage et remplaçage 


                                    // On fait la simulation, si échec, on renvoi le message d'erreur
                                    const simulation_param = {
                                        to: trade.router,
                                        data: trade.data,
                                        value: trade.value,
                                        from: decrypt(sender)
                                    }


                                    // Fonction qui effectue la simulation
                                    // Renvoi le nombre de gas utilisé
                                    // Si erreur, renvoi soit rien soit que la limite a été atteinte
                                    const simulation = await simulateTransaction(simulation_param)


                                    // Si la transaction est valide, on continu
                                    if (simulation.valid == true) {


                                        const gas = await gasOracle(gas_preset, simulation.result, max_gwei)

                                        if (gas !== null && gas.valid == true) {

                                            
                                            // On regarde si auto approval est activé
                                            // On vérifie si le user a assez d'allowance
                                            // Si non, on met en faux
                                            let hasAllowance = true
                                            if (auto_approval == 'true') {
                                                const allowance = await getAllowance(factory, decrypt(sender), trade.router, "to_token")
                                                if (allowance < trade.amountExpected) { hasAllowance == false }
                                            }

                                            const totalValue = parseFloat(amount) + parseFloat(gas.fees)
                                            const txnDataFormatted = "Sender: " + decrypt(sender) + "\nGas Price: " + parseFloat(gas.gwei).toFixed(0) + " gwei\nMin. Received: " + formatCoinValueSign(trade.amountOutMin) + " (including slippage)\n\nValue: " + parseFloat(amount).toFixed(3) + "Ξ\nGas fees: " + parseFloat(gas.fees).toFixed(5) + "Ξ\n\nTotal Value: " + parseFloat(totalValue).toFixed(3) + "Ξ"


                                            const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                                .setTitle("Buy Coin")
                                                .setDescription(">>> Displaying the simulated transaction data")
                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                .setTimestamp()
                                                .addFields(
                                                    { name: " ", value: " ", inline: false },
                                                    { name: "Target", value: "`" + toSymbol.toUpperCase() + "`", inline: true },
                                                    { name: "Action", value: "`📈 Buy`", inline: true },
                                                    { name: "Value", value: "`" + amount + "Ξ`", inline: false },
                                                    { name: "Transaction Data ✅", value: "```" + txnDataFormatted + "```", inline: false },

                                                )
                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                                            await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [buttonsRowConfirm], ephemeral: true });


                                            // On formatte les data pour aller dans la database
                                            // On enregistre tous dans notre table exe SQL

                                            // On supprime les datas précédentes
                                            exe_coin.destroy({ where: { authorId: authorId, serverId: serverId, treated: null } });

                                            // Données sur le user setup
                                            const setupTable = []
                                            const setup = {
                                                ape_mode: 'false',
                                                slippage: slippage,
                                                auto_approval: auto_approval,
                                                gas_preset: gas_preset,
                                                max_gwei: max_gwei,
                                                mev_protection: mev_protection,
                                                sender: sender,
                                                privateKey: privateKey,

                                            }
                                            setupTable.push(setup)

                                            // Données sur la target
                                            const tradeTable = []
                                            const tradeObj = {
                                                router: trade.router,
                                                value: trade.value,
                                                data: trade.data,
                                                expected_value: totalValue,
                                                expected_amount: trade.amountExpected,
                                                amountOutMin: trade.amountOutMin,
                                                hasAllowance: hasAllowance,

                                            }
                                            tradeTable.push(tradeObj)

                                            // Enregistrement dans la database
                                            await exe_coin.create({
                                                authorName: authorName,
                                                authorId: authorId,
                                                serverId: serverId,
                                                isBuy: "true",
                                                contract: contract.toLowerCase(),
                                                symbol: toSymbol.toUpperCase(),
                                                trade: JSON.stringify(tradeTable),
                                                setup: JSON.stringify(setupTable),
                                                value: amount.toString(),
                                                simulation: "true",
                                                //   randomId: generateRandomString(15)
                                            })


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

                                            await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [buttonsRowCancel], ephemeral: true });


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

                                            await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [buttonsRowCancel], ephemeral: true });



                                        }

                                    } else {

                                        // La simulation n'a pas réussi
                                        // On annule la transaction

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
                                                { name: "Transaction Data 🚫", value: "```The transaction simulation failed.\n\n" + simulation.result + "```", inline: false },

                                            )
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                                        await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [buttonsRowCancel], ephemeral: true });


                                    }

                                } else {


                                    // Fond insuffisant
                                    // Simulation annulé 

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
                                            { name: "Transaction Data 🚫", value: "```The transaction simulation failed.\n\nYour balance is insufficient: " + parseFloat(trade.balance).toFixed(5) + "Ξ       ```", inline: false },

                                        )
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                                    await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [buttonsRowCancel], ephemeral: true });


                                }

                            } else {

                                const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Buy Coin")
                                    .setDescription(">>> Displaying your transaction simulation")
                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .addFields(
                                        { name: " ", value: "Aura didn't found a route to execute your trade. This can happen if the pool has insufficient liquidity, if the number of tokens received is far too low or if the contract has been blocked.", inline: true },

                                    )
                                    .setTimestamp()
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [errorNotEthereum], components: [], ephemeral: true });


                            }

                        }






                    } else {




                        const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Coin Setup")
                            .setDescription(">>> Displaying your coin wallet setup")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .addFields(
                                { name: " ", value: "You don't have a wallet imported in your coin portfolio. To get started, use the button below.", inline: true },

                            )
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [errorNotEthereum], components: [buttonsRowNew], ephemeral: true });


                    }


                } else {

                    const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Buy Coin")
                        .setDescription("An error occured while retreiving the amount you provided. Amount to buy should be in Ethereum (1.5 for 1.5 ETH). Please try again using `/coin data` or contact a team member if you need help.")
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .setAuthor({ name: "Aura", iconURL: "https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png" })
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                    await interaction.editReply({ embeds: [gasTrackerEmbed2] });


                }



            } else {

                const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Coin Data")
                    .setDescription("An error occured while retreiving the coin address. Please try again using `/coin data` or contact a team member if you need help.")
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
