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
const { profileData, reportsql, infra_coin, accessSql, manager_coin, interactionData, adminsql, sequelize } = require('../../../events/database');
const moment = require('moment');
const decrypt = require("../../../functions/decrypt")
const { simulateTransaction, createFactory, balanceOfToken, encodeTransfer, encodeApproval, encodeRevoke } = require('../../../functions/coin-utils')

//Web3 API + Cloudfare Provider
var Web3 = require("web3")
const web3 = new Web3("https://cloudflare-eth.com")



const buttonsRowNew = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('button_infra_coin_walletsetup_import')
            .setLabel('import wallet')
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId('button_infra_coin_walletsetup_generate')
            .setLabel('generate wallet')
            .setStyle(3),

    );


// Boutton pas de wallet
const buttonsRowConfirm = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('button_coinmanager_exec_confirm')
            .setLabel('Confirm')
            .setEmoji("✅")
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId('button_coinmanager_exec_cancel')
            .setLabel('Cancel')
            .setStyle(4),

    );

// Boutton pas de wallet
const buttonsRowCancel = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('button_coinmanager_exec_cancel')
            .setLabel('Cancel')
            .setStyle(4),

    );


module.exports = {
    id: "modal_coin_manager_exec_",

    async execute(interaction) {


        //Récupérer informations de l'utilisateur de la commande
        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id
        let botId = interaction.applicationId

        interaction.deferReply({ ephemeral: true })

        try {



            const customId = interaction.customId

            const match = customId.match(/modal_coin_manager_exec_(.+)/);

            if (match && match[1]) {

                const action = match[1]


                const user = await infra_coin.findOne({ where: { authorId: authorId } })

                if (user != null) {

                    // Infos du user decrypt
                    const sender = user.dataValues.walletAddress
                    const privateKey = user.dataValues.privateKey


                    if (action == "transferETH") {

                        //Récupère le password donné par l'utilisateur
                        const amount = interaction.fields.getTextInputValue('modal_coin_manager_exec_' + action + 'R1');
                        const addresses = interaction.fields.getTextInputValue('modal_coin_manager_exec_' + action + 'R2');


                        // Expression régulière pour extraire les adresses Ethereum
                        const addressRegex = /0x[0-9a-fA-F]{40}/g;

                        // Trouver toutes les occurrences d'adresses Ethereum dans la chaîne
                        const addressesArray1 = addresses.match(addressRegex) || [];
                        const addressesArray = addressesArray1.filter(item => item.toLowerCase() != (decrypt(sender).toLowerCase()))
                        const addressList = [...new Set(addressesArray.map(item => item.toLowerCase()))];
                        const addressCount = addressList.length


                        if (parseAndConvertToFloat(amount)) {

                            if (addressCount > 0) {

                                const balance = await web3.eth.getBalance(decrypt(sender))
                                const gasPriceRaw = await web3.eth.getGasPrice()
                                const gasMargin = 1.1
                                const gasPrice = gasPriceRaw * gasMargin
                                const valueRaw = await web3.utils.toWei(amount.toString(), 'ether');
                                const value = parseInt(valueRaw)



                                // On fait la simulation, si échec, on renvoi le message d'erreur
                                const simulation_param = {
                                    to: addressList[0],
                                    data: '0x',
                                    value: value,
                                    from: decrypt(sender)
                                }


                                // Fonction qui effectue la simulation
                                // Renvoi le nombre de gas utilisé
                                // Si erreur, renvoi soit rien soit que la limite a été atteinte
                                const simulation = await simulateTransaction(simulation_param)

                                if (simulation.valid == true) {

                                    const gasUsed = simulation.result

                                    const soloGasPrice = gasUsed * gasPrice
                                    const totalGasPrice = soloGasPrice * addressCount
                                    const totalPrice = totalGasPrice + value
                                    const totalPriceMargin = totalPrice + (totalGasPrice * 1.1)



                                    if (totalPriceMargin < balance) {


                                        const txnDataFormatted = "Sender: " + decrypt(sender) + "\nGas Price: " + parseFloat(gasPrice / 10 ** 9).toFixed(0) + " gwei\nReceivers: " + addressCount + "\n\nValue: " + parseFloat(amount).toFixed(3) + "Ξ\nGas fees: " + parseFloat(totalGasPrice / 10 ** 18).toFixed(5) + "Ξ\n\nTotal Value: " + parseFloat(totalPrice / 10 ** 18).toFixed(3) + "Ξ"

                                        const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle("Transfer ETH")
                                            .setDescription(">>> Displaying the simulated transaction data")
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setTimestamp()
                                            .addFields(
                                                { name: " ", value: " ", inline: false },
                                                { name: "Action", value: "`💌 Transfer ETH`", inline: true },
                                                { name: "Value", value: "`" + amount + "Ξ`", inline: true },
                                                { name: "Transaction Data ✅", value: "```" + txnDataFormatted + "```", inline: false },

                                            )
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                                        await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [buttonsRowConfirm], ephemeral: true });


                                        // Database destroy and create
                                        await manager_coin.destroy({ where: { authorId: authorId, serverId: serverId, treated: null } })

                                        const infos = {
                                            addresses: addressList,
                                            receivers: addressCount,
                                        }

                                        const transaction = {
                                            value: value,
                                            data: "0x",
                                            total: totalPrice.toString(),
                                            gasPrice: gasPrice.toString(),
                                            gas_fees: totalGasPrice.toString(),
                                            walletAddress: sender,
                                            privateKey: privateKey,

                                        }

                                        await manager_coin.create({
                                            authorId: authorId,
                                            authorName: authorName,
                                            serverId: serverId,
                                            action: "transferETH",
                                            value: amount.toString(),
                                            infos: JSON.stringify(infos),
                                            transaction: JSON.stringify(transaction),
                                            simulation: "true"

                                        })



                                    } else {

                                        const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle("Transfer ETH")
                                            .setDescription(">>> Displaying the simulated transaction data")
                                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setTimestamp()
                                            .addFields(
                                                { name: " ", value: " ", inline: false },
                                                { name: "Action", value: "`💌 Transfer ETH`", inline: true },
                                                { name: "Value", value: "`" + amount + "Ξ`", inline: true },
                                                { name: "Transaction Data 🚫", value: "```The transaction simulation failed.\n\nFund too low. You need a little reserve to execute a transfer (around +10% of gas).```", inline: false },

                                            )
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                        await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [buttonsRowCancel], ephemeral: true });


                                    }


                                } else {

                                    const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle("Transfer ETH")
                                        .setDescription(">>> Displaying the simulated transaction data")
                                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .addFields(
                                            { name: " ", value: " ", inline: false },
                                            { name: "Action", value: "`💌 Transfer ETH`", inline: true },
                                            { name: "Value", value: "`" + amount + "Ξ`", inline: true },
                                            { name: "Transaction Data 🚫", value: "```The transaction simulation failed.\n\n" + simulation.result + "```", inline: false },

                                        )
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                                    await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [buttonsRowCancel], ephemeral: true });

                                }



                            } else {

                                const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Transfer ETH")
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setDescription("You didn't provided any Ethereum address (except yours). Please try again or contact a team member if the issue persists.")
                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setTimestamp()
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.reply({ embeds: [setfpEmbedNotForYou], ephemeral: true });


                            }

                        } else {

                            const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Transfer ETH")
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setDescription("You didn't provided a valid ETH amount. Please try again or contact a team member if the issue persists.")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setTimestamp()
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.reply({ embeds: [setfpEmbedNotForYou], ephemeral: true });


                        }


                    } else if (action == "transferERC20") {

                        //Récupère le password donné par l'utilisateur
                        const contract = interaction.fields.getTextInputValue('modal_coin_manager_exec_' + action + 'R1');
                        const ratio = interaction.fields.getTextInputValue('modal_coin_manager_exec_' + action + 'R2');
                        const addresses = interaction.fields.getTextInputValue('modal_coin_manager_exec_' + action + 'R3');


                        // Expression régulière pour extraire les adresses Ethereum
                        const addressRegex = /0x[0-9a-fA-F]{40}/g;

                        // Trouver toutes les occurrences d'adresses Ethereum dans la chaîne
                        const addressesArray1 = addresses.match(addressRegex) || [];
                        const addressesArray = addressesArray1.filter(item => item.toLowerCase() != (decrypt(sender).toLowerCase()))
                        const addressList = [...new Set(addressesArray.map(item => item.toLowerCase()))];
                        const addressCount = addressList.length


                        if (parseAndConvertToFloat(ratio)) {

                            if (addressCount > 0) {

                                const factory = await createFactory("swap_token_to_eth", contract, decrypt(sender), 0)

                                const decimals = factory._uniswapPairFactoryContext.fromToken.decimals
                                const balance = await web3.eth.getBalance(decrypt(sender))
                                const balanceToken = await balanceOfToken(factory, decrypt(sender))
                                const amount = parseFloat(balanceToken * (1 - (ratio / 100))).toFixed(decimals)

                                const gasPriceRaw = await web3.eth.getGasPrice()
                                const gasMargin = 1.1
                                const gasPrice = gasPriceRaw * gasMargin
                                const value = 0
                                const data = encodeTransfer(decrypt(sender), amount, decimals)



                                // On fait la simulation, si échec, on renvoi le message d'erreur
                                const simulation_param = {
                                    to: addressList[0],
                                    data: data,
                                    value: value,
                                    from: decrypt(sender),
                                }

                                // Fonction qui effectue la simulation
                                // Renvoi le nombre de gas utilisé
                                // Si erreur, renvoi soit rien soit que la limite a été atteinte
                                const simulation = await simulateTransaction(simulation_param)

                                if (simulation.valid == true) {

                                    const gasUsed = simulation.result

                                    const soloGasPrice = gasUsed * gasPrice
                                    const totalGasPrice = soloGasPrice * addressCount
                                    const totalPrice = totalGasPrice + value
                                    const totalPriceMargin = totalPrice + (totalGasPrice * 1.1)


                                    if (totalPriceMargin < balance) {


                                        const txnDataFormatted = "Sender: " + decrypt(sender) + "\nGas Price: " + parseFloat(gasPrice / 10 ** 9).toFixed(0) + " gwei\nReceivers: " + addressCount + "\n\nValue: " + parseFloat(amount).toFixed(3) + "Ξ\nGas fees: " + parseFloat(totalGasPrice / 10 ** 18).toFixed(5) + "Ξ\n\nTotal Value: " + parseFloat(totalPrice / 10 ** 18).toFixed(3) + "Ξ"

                                        const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle("Transfer Token")
                                            .setDescription(">>> Displaying the simulated transaction data")
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setTimestamp()
                                            .addFields(
                                                { name: " ", value: " ", inline: false },
                                                { name: "Action", value: "`💌 Transfer ERC20`", inline: true },
                                                { name: "Value", value: "`" + amount + "`", inline: true },
                                                { name: "Transaction Data ✅", value: "```" + txnDataFormatted + "```", inline: false },

                                            )
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                                        await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [buttonsRowConfirm], ephemeral: true });


                                        // Database destroy and create
                                        await manager_coin.destroy({ where: { authorId: authorId, serverId: serverId, treated: null } })

                                        const infos = {
                                            addresses: addressList,
                                            receivers: addressCount,
                                        }

                                        const transaction = {
                                            amount_token: amount.toString(),
                                            contract: contract,
                                            data: data,
                                            total: totalPrice.toString(),
                                            gasPrice: gasPrice.toString(),
                                            gas_fees: totalGasPrice.toString(),
                                            walletAddress: sender,
                                            privateKey: privateKey,

                                        }

                                        await manager_coin.create({
                                            authorId: authorId,
                                            authorName: authorName,
                                            serverId: serverId,
                                            action: "transferERC20",
                                            value: value.toString(),
                                            infos: JSON.stringify(infos),
                                            transaction: JSON.stringify(transaction),
                                            simulation: "true"

                                        })



                                    } else {

                                        const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle("Transfer Token")
                                            .setDescription(">>> Displaying the simulated transaction data")
                                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setTimestamp()
                                            .addFields(
                                                { name: " ", value: " ", inline: false },
                                                { name: "Action", value: "`💌 Transfer ERC20`", inline: true },
                                                { name: "Value", value: "`" + amount + "`", inline: true },
                                                { name: "Transaction Data 🚫", value: "```The transaction simulation failed.\n\nFund too low. You need a little reserve to execute a transfer (around +10% of gas).```", inline: false },

                                            )
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                        await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [buttonsRowCancel], ephemeral: true });


                                    }


                                } else {

                                    const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle("Transfer Token")
                                        .setDescription(">>> Displaying the simulated transaction data")
                                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .addFields(
                                            { name: " ", value: " ", inline: false },
                                            { name: "Action", value: "`💌 Transfer ERC20`", inline: true },
                                            { name: "Value", value: "`" + amount + "`", inline: true },
                                            { name: "Transaction Data 🚫", value: "```The transaction simulation failed.\n\n" + simulation.result + "```", inline: false },

                                        )
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                                    await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [buttonsRowCancel], ephemeral: true });

                                }



                            } else {

                                const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Transfer Token")
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setDescription("You didn't provided any Ethereum address (except yours). Please try again or contact a team member if the issue persists.")
                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setTimestamp()
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.reply({ embeds: [setfpEmbedNotForYou], ephemeral: true });


                            }

                        } else {

                            const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Transfer Token")
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setDescription("You didn't provided a valid token ratio. Please try again or contact a team member if the issue persists.")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setTimestamp()
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.reply({ embeds: [setfpEmbedNotForYou], ephemeral: true });


                        }




                    } else if (action == "approveToken") {


                        //Récupère le password donné par l'utilisateur
                        const contract = interaction.fields.getTextInputValue('modal_coin_manager_exec_' + action + 'R1');
                        const spender = interaction.fields.getTextInputValue('modal_coin_manager_exec_' + action + 'R2');


                        const balance = await web3.eth.getBalance(decrypt(sender))

                        const gasPrice = await web3.eth.getGasPrice()
                        const value = 0
                        const data = encodeApproval(spender)



                        // On fait la simulation, si échec, on renvoi le message d'erreur
                        const simulation_param = {
                            to: contract,
                            data: data,
                            value: value,
                            from: decrypt(sender),
                        }

                        // Fonction qui effectue la simulation
                        // Renvoi le nombre de gas utilisé
                        // Si erreur, renvoi soit rien soit que la limite a été atteinte
                        const simulation = await simulateTransaction(simulation_param)

                        if (simulation.valid == true) {

                            const gasUsed = simulation.result

                            const soloGasPrice = gasUsed * gasPrice
                            const totalPrice = soloGasPrice + value
                            const totalPriceMargin = totalPrice + (soloGasPrice * 1.1)


                            if (totalPriceMargin < balance) {


                                const txnDataFormatted = "Sender: " + decrypt(sender) + "\nGas Price: " + parseFloat(gasPrice / 10 ** 9).toFixed(0) + " gwei\nSpender: " + spender + "\n\nValue: " + parseFloat(value).toFixed(3) + "Ξ\nGas fees: " + parseFloat(totalPrice / 10 ** 18).toFixed(5) + "Ξ\n\nTotal Value: " + parseFloat(totalPrice / 10 ** 18).toFixed(3) + "Ξ"

                                const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Approve Token")
                                    .setDescription(">>> Displaying the simulated transaction data")
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setTimestamp()
                                    .addFields(
                                        { name: " ", value: " ", inline: false },
                                        { name: "Action", value: "`✅ Approve ERC20`", inline: true },
                                        { name: "Value", value: "`Max`", inline: true },
                                        { name: "Transaction Data ✅", value: "```" + txnDataFormatted + "```", inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                                await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [buttonsRowConfirm], ephemeral: true });


                                // Database destroy and create
                                await manager_coin.destroy({ where: { authorId: authorId, serverId: serverId, treated: null } })



                                const transaction = {
                                    contract: contract,
                                    spender: spender,
                                    data: data,
                                    amount: "Max",
                                    total: totalPrice.toString(),
                                    gasPrice: gasPrice.toString(),
                                    gas_fees: soloGasPrice.toString(),
                                    walletAddress: sender,
                                    privateKey: privateKey,

                                }

                                await manager_coin.create({
                                    authorId: authorId,
                                    authorName: authorName,
                                    serverId: serverId,
                                    action: "approveToken",
                                    value: value.toString(),
                                    transaction: JSON.stringify(transaction),
                                    simulation: "true"

                                })



                            } else {

                                const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Approve Token")
                                    .setDescription(">>> Displaying the simulated transaction data")
                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setTimestamp()
                                    .addFields(
                                        { name: " ", value: " ", inline: false },
                                        { name: "Action", value: "`✅ Approve ERC20`", inline: true },
                                        { name: "Value", value: "`Max`", inline: true },
                                        { name: "Transaction Data 🚫", value: "```The transaction simulation failed.\n\nFund too low. You need a little reserve to execute a transfer (around +10% of gas).```", inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [buttonsRowCancel], ephemeral: true });


                            }


                        } else {

                            const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Approve Token")
                                .setDescription(">>> Displaying the simulated transaction data")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Action", value: "`✅ Approve ERC20`", inline: true },
                                    { name: "Value", value: "`Max`", inline: true },
                                    { name: "Transaction Data 🚫", value: "```The transaction simulation failed.\n\n" + simulation.result + "```", inline: false },

                                )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                            await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [buttonsRowCancel], ephemeral: true });

                        }









                    } else if (action == "revokeToken") {


                        //Récupère le password donné par l'utilisateur
                        const contract = interaction.fields.getTextInputValue('modal_coin_manager_exec_' + action + 'R1');
                        const spender = interaction.fields.getTextInputValue('modal_coin_manager_exec_' + action + 'R2');


                        const balance = await web3.eth.getBalance(decrypt(sender))

                        const gasPrice = await web3.eth.getGasPrice()
                        const value = 0
                        const data = encodeRevoke(spender)


                        // On fait la simulation, si échec, on renvoi le message d'erreur
                        const simulation_param = {
                            to: contract,
                            data: data,
                            value: value,
                            from: decrypt(sender),
                        }

                        // Fonction qui effectue la simulation
                        // Renvoi le nombre de gas utilisé
                        // Si erreur, renvoi soit rien soit que la limite a été atteinte
                        const simulation = await simulateTransaction(simulation_param)

                        if (simulation.valid == true) {

                            const gasUsed = simulation.result

                            const soloGasPrice = gasUsed * gasPrice
                            const totalPrice = soloGasPrice + value
                            const totalPriceMargin = totalPrice + (soloGasPrice * 1.1)


                            if (totalPriceMargin < balance) {


                                const txnDataFormatted = "Sender: " + decrypt(sender) + "\nGas Price: " + parseFloat(gasPrice / 10 ** 9).toFixed(0) + " gwei\nSpender: " + spender + "\n\nValue: " + parseFloat(value).toFixed(3) + "Ξ\nGas fees: " + parseFloat(totalPrice / 10 ** 18).toFixed(5) + "Ξ\n\nTotal Value: " + parseFloat(totalPrice / 10 ** 18).toFixed(3) + "Ξ"

                                const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Revoke Token")
                                    .setDescription(">>> Displaying the simulated transaction data")
                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setTimestamp()
                                    .addFields(
                                        { name: " ", value: " ", inline: false },
                                        { name: "Action", value: "`❌ Revoke ERC20`", inline: true },
                                        { name: "Value", value: "`Max`", inline: true },
                                        { name: "Transaction Data ✅", value: "```" + txnDataFormatted + "```", inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                                await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [buttonsRowConfirm], ephemeral: true });


                                // Database destroy and create
                                await manager_coin.destroy({ where: { authorId: authorId, serverId: serverId, treated: null } })



                                const transaction = {
                                    contract: contract,
                                    spender: spender,
                                    data: data,
                                    amount: "Max",
                                    total: totalPrice.toString(),
                                    gasPrice: gasPrice.toString(),
                                    gas_fees: soloGasPrice.toString(),
                                    walletAddress: sender,
                                    privateKey: privateKey,

                                }

                                await manager_coin.create({
                                    authorId: authorId,
                                    authorName: authorName,
                                    serverId: serverId,
                                    action: "revokeToken",
                                    value: value.toString(),
                                    transaction: JSON.stringify(transaction),
                                    simulation: "true"

                                })



                            } else {

                                const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Revoke Token")
                                    .setDescription(">>> Displaying the simulated transaction data")
                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setTimestamp()
                                    .addFields(
                                        { name: " ", value: " ", inline: false },
                                        { name: "Action", value: "`❌ Revoke ERC20`", inline: true },
                                        { name: "Value", value: "`Max`", inline: true },
                                        { name: "Transaction Data 🚫", value: "```The transaction simulation failed.\n\nFund too low. You need a little reserve to execute a transfer (around +10% of gas).```", inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [buttonsRowCancel], ephemeral: true });


                            }


                        } else {

                            const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Revoke Token")
                                .setDescription(">>> Displaying the simulated transaction data")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Action", value: "`❌ Revoke ERC20`", inline: true },
                                    { name: "Value", value: "`Max`", inline: true },
                                    { name: "Transaction Data 🚫", value: "```The transaction simulation failed.\n\n" + simulation.result + "```", inline: false },

                                )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                            await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [buttonsRowCancel], ephemeral: true });

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

                const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Coin Manager")
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


function parseAndConvertToFloat(str) {
    // Utiliser parseFloat pour essayer de convertir la chaîne en nombre flottant
    const number = parseFloat(str);

    // Vérifier si la conversion a réussi et si le résultat est un nombre fini
    if (!isNaN(number) && isFinite(number)) {
        return number;
    } else {
        // Si la conversion échoue, retourner NaN (ou une valeur par défaut selon ton besoin)
        return false;
    }
}