/**
 * @file Sample Select-Menu interaction
 * @author JAYZHVJ
 * @since 3.0.0
 * @version 3.2.2
 */

/**
 * @type {import('../../../typings').SelectInteractionCommand}
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { profileData, reportsql, accessSql, portfolio_nft, infra_nft, exe_nft } = require('../../../events/database');
const { ButtonInteraction } = require('discord.js');
const moment = require('moment');

const decrypt = require("../../../functions/decrypt");
const { acceptSingleBidEncode, isApprovedForAll, simulateTransaction, gasOracle, encodeSetApprovalForAll, getGasPrice } = require("../../../functions/1nft-utils")
const { buttonConfirmConfig } = require("../../../functions/nft/helpers")
const { errorHandler } = require("../../../functions/1nft-errors")

const markets = require("../../../contracts/nft/config.json")
const chainId = 1


module.exports = {
    id: "selector_panel_exe_tokenselector",

    async execute(interaction) {


        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id

        // On récupère les infos dans l'ID
        const customId = interaction.values[0].toLowerCase()
        const match = customId.match(/(.+)@(.+)/);

        if (match && match[1] && match[2]) {

            const identifier = match[1];
            const tokenId = match[2] === '0x0' ? null : parseInt(match[2]) // On vérifie que c'est pas un reset

            // On récupère les data store dans l'exe
            const storage = await exe_nft.findOne({ where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifier } })

            // On vérifie qu'il y'a bien une session
            if (storage) {

                // On récupère les informations du storage
                const type = storage.dataValues.action
                const settings = JSON.parse(storage.dataValues.settings)
                const contract = storage.dataValues.contract
                const name = storage.dataValues.name

                if (type === 'list') {

                    // On vérifie que ce n'est pas un reset
                    if (tokenId) {

                        // On récupère le tableau global et le token
                        const helper = JSON.parse(storage.dataValues.helper)
                        const token = helper.table.data.find(i => i.token.tokenId === tokenId)

                        if (token) {

                            // On récupère les prix et source du listing potentiel
                            const lPrice = token.listing ? token.listing.price : 0
                            const lSource = token.listing ? token.listing.source : null

                            // On formatte le titre de l'embed
                            const title = lSource !== null ? `(currently ${lPrice}Ξ on ${lSource})` : '(currently not listed)'

                            const modal = new ModalBuilder()
                                .setCustomId('modal_nft_listing_exec_' + tokenId + '@' + identifier)
                                .setTitle('List an NFT');


                            // Create the text input components
                            const price = new TextInputBuilder()
                                .setCustomId('firstRow')
                                .setLabel("Price " + title)
                                .setPlaceholder("The price of the listing in ETH (i.g 0.02 for 0.02Ξ)")
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true)


                            // An action row only holds one text input,
                            // so you need one action row per text input.
                            const row = new ActionRowBuilder().addComponents(price);

                            // Add inputs to the modal
                            modal.addComponents(row)

                            // Show the modal to the user
                            await interaction.showModal(modal);




                        } else {
                            // On trouve pas le token dans la liste, erreur
                            const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("NFT Trading")
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setDescription("An error occured while retrieving your data. Please try again or contact a team member if the issue persists.")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setTimestamp()
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.reply({ embeds: [setfpEmbedNotForYou], ephemeral: true });
                        }

                    } else {
                        // On retourne l'embed de base, on veut juste reset la liste.
                        const embed = interaction.message.embeds
                        await interaction.update({ embeds: embed })
                    }

                } else if (type === "sell") {
                    // C'est une bid a accepté
                    // On vérifie que ce n'est pas un reset
                    if (tokenId) {

                        // On defer la reply
                        await interaction.deferReply({ ephemeral: true })

                        // On récupère le tableau global et le token
                        const helper = JSON.parse(storage.dataValues.helper)
                        const token = helper.table.data.find(i => i.token.tokenId === tokenId)

                        if (token) {
                            // On repart de l'objet token existant pour vérifier les conditions d'approval ou non,
                            // le but va être de faire en sorte de définir une source, de vérifier l'approval dessus,
                            // puis de forcer l'acceptation de la bid sur cette source lors de la génération du trade.

                            // On commence par vérifier l'approval de la source en utilisant
                            // une fonction toute faite dans les utils NFT.
                            const isApproved = await isApprovedForAll(contract, decrypt(settings.sender), 'opensea.io')

                            if (isApproved !== null) {
                                // La vérification de l'approval

                                if (isApproved) {
                                    // C'est approve for all
                                    console.log("La collection est déjà approuvé...")

                                    // On commence par envoyer la première réponse
                                    const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle("Accept a bid")
                                        .setDescription(">>> Displaying the simulated transaction data")
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .addFields(
                                            { name: " ", value: " ", inline: false },
                                            { name: "Action", value: "`🤝 Accept Bid`", inline: false },
                                            { name: "Target", value: "`" + name + "`", inline: true },
                                            { name: "Value", value: "`" + token.bid.price + "Ξ`", inline: true },
                                            { name: "Simulation", value: "<a:AuraLoading:1134068847616458792>", inline: false },

                                        )
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                    await interaction.editReply({ embeds: [gasTrackerEmbed], components: [] });


                                    // On génère l'objet trade en imposant la source
                                    const trade = await acceptSingleBidEncode(token, settings)

                                    // On vérifie le status du trade
                                    if (trade.status) {
                                        // Le trade est valide
                                        // On définit les valeurs clés
                                        const source = trade.source
                                        const global = trade.trade
                                        const transaction = trade.transaction
                                        const gas = trade.gas


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

                                            const gas = await gasOracle(null, simulation.result, settings.max_gwei)

                                            if (gas !== null && gas.valid == true) {

                                                // On formatte les données
                                                const totalValue = parseFloat(gas.fees)
                                                const txnDataFormatted = "Sender: " + decrypt(settings.sender) + "\nGas Price: " + parseFloat(gas.gwei).toFixed(0) + " gwei\nAmount: " + global.quantity + " (#" + global.tokenId + ")\n\nValue: " + parseFloat(global.price).toFixed(3) + "Ξ\nGas fees: " + parseFloat(gas.fees).toFixed(5) + "Ξ\n\nTotal Value: " + parseFloat(totalValue).toFixed(3) + "Ξ"

                                                // On définit les bouttons
                                                const button = buttonConfirmConfig(true, identifier)

                                                const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                                    .setTitle("Accept a bid")
                                                    .setDescription(">>> Displaying the simulated transaction data")
                                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                                    .setTimestamp()
                                                    .addFields(
                                                        { name: " ", value: " ", inline: false },
                                                        { name: "Action", value: "`🤝 Accept Bid`", inline: false },
                                                        { name: "Target", value: "`" + name + "`", inline: true },
                                                        { name: "Value", value: "`" + global.price + "Ξ`", inline: true },
                                                        { name: "Transaction Data ✅", value: "```" + txnDataFormatted + "```", inline: false },

                                                    )
                                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                                await interaction.editReply({ embeds: [gasTrackerEmbed2], components: button, ephemeral: true });


                                                // On ajoute les différents objets à la réponse initial de const trade.
                                                // Pour l'instant seulement la value expected dans le cas où la txn fail
                                                // ainsi que les gas dépensé et le prix (d'après la simulation).
                                                trade.gas.expected = totalValue
                                                trade.gas.limit = simulation.result
                                                trade.gas.price = gas.price

                                                // Enregistrement dans la database en updatant ce qui 
                                                // avait déjà été enregistré.
                                                await exe_nft.update({
                                                    authorName: authorName,
                                                    authorId: authorId,
                                                    serverId: serverId,
                                                    trade: JSON.stringify(trade),
                                                    value: global.price.toString(),
                                                    simulation: "true",
                                                }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifier } })


                                            } else if (gas.valid == "Over gas limit") {

                                                // On a dépassé le max gwei
                                                // Transaction annulé sans être exécuter

                                                // On définit les bouttons
                                                const button = buttonConfirmConfig(false, identifier)


                                                const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                                    .setTitle("Accept a bid")
                                                    .setDescription(">>> Displaying the simulated transaction data")
                                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                                    .setTimestamp()
                                                    .addFields(
                                                        { name: " ", value: " ", inline: false },
                                                        { name: "Action", value: "`🤝 Accept Bid`", inline: false },
                                                        { name: "Target", value: "`" + name + "`", inline: true },
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
                                                    .setTitle("Accept a bid")
                                                    .setDescription(">>> Displaying the simulated transaction data")
                                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                                    .setTimestamp()
                                                    .addFields(
                                                        { name: " ", value: " ", inline: false },
                                                        { name: "Action", value: "`🤝 Accept Bid`", inline: false },
                                                        { name: "Target", value: "`" + name + "`", inline: true },
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
                                                .setTitle("Accept a bid")
                                                .setDescription(">>> Displaying the simulated transaction data")
                                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                .setTimestamp()
                                                .addFields(
                                                    { name: " ", value: " ", inline: false },
                                                    { name: "Action", value: "`🤝 Accept Bid`", inline: false },
                                                    { name: "Target", value: "`" + name + "`", inline: true },
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

                                } else {
                                    // C'est pas approve for all donc on fait un code pour approuve le collection,
                                    // puis on fera un code qui permettra de continuer.
                                    console.log("Pas approuvé...")

                                    // On cherche la source dans la config
                                    const source = markets.find(i => i.id === token.bid.source)

                                    const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle("NFT Trading")
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setDescription("You need to approve " + source.name + " for this collection. To continue, please see the following steps :\n\n• Go to the contract page on [Etherscan.io](https://etherscan.io/address/" + contract + ")\n• Click on the **Contract** tab, and then on the **Write Contract** one.\n• Select the **setApprovalForAll** function and enter `" + source.delegate + "` (param 1) and `true` (param 2).\n• After connecting your wallet, click on **Write** and confirm to approve.\n\n*The marketplace is now approved, you can select a token in the list above and accept a bid* ⬆️.")
                                        .setImage('https://media.discordapp.net/attachments/1100572519896977490/1209900391412801647/app.png?ex=65e89a8c&is=65d6258c&hm=7b7ea814d7e797db24bb083e1a034396b1a9eaf07ed0321faeb8e2377d1fc534&=&format=webp&quality=lossless&width=2194&height=1102')
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                    await interaction.editReply({ embeds: [setfpEmbedNotForYou], ephemeral: true });


                                    //// ICI LE CODE POUR SIMULER LE TOUT EN ONE SHOT -> APPROVAL
                                    //// & ACCEPT BID.

                                    // // On commence par envoyer la première réponse
                                    // const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                                    //     .setTitle("Accept a bid")
                                    //     .setDescription(">>> Displaying the simulated transaction data")
                                    //     .setAuthor({ name: authorName, iconURL: userAvatar })
                                    //     .setTimestamp()
                                    //     .addFields(
                                    //         { name: " ", value: " ", inline: false },
                                    //         { name: "Action", value: "`🤝 Accept Bid`", inline: false },
                                    //         { name: "Target", value: "`" + name + "`", inline: true },
                                    //         { name: "Value", value: "`" + token.bid.price + "Ξ`", inline: true },
                                    //         { name: "Simulation", value: "<a:AuraLoading:1134068847616458792>", inline: false },

                                    //     )
                                    //     .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                    // await interaction.editReply({ embeds: [gasTrackerEmbed], components: [] });


                                    // // On récupère la source pour le formattage mais aussi les gasPrice pour
                                    // // calculer l'average de valeur que l'on va utiliser.
                                    // const gasPrice = await getGasPrice()

                                    // // On calcul les estimations de gas, qui sont en faite une fausse simulation
                                    // // en terme de display.
                                    // const approvalExp = 60000
                                    // const saleExp = 180000
                                    // const expected = (approvalExp + saleExp) * gasPrice.eth

                                    // // On formatte les données
                                    // const totalValue = expected
                                    // const txnDataFormatted = "Sender: " + decrypt(settings.sender) + "\nGas Price: " + parseFloat(gasPrice.gwei).toFixed(0) + " gwei\nAmount: " + 1 + " (#" + tokenId + ")\n\nValue: " + parseFloat(token.bid.price).toFixed(3) + "Ξ\nGas fees: " + parseFloat(expected).toFixed(5) + "Ξ\n\nTotal Value: " + parseFloat(totalValue).toFixed(3) + "Ξ"

                                    // // On renvoi la réponse
                                    // const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                    //     .setTitle("Accept a bid")
                                    //     .setDescription(">>> Displaying the simulated transaction data")
                                    //     .setAuthor({ name: authorName, iconURL: userAvatar })
                                    //     .setTimestamp()
                                    //     .addFields(
                                    //         { name: " ", value: " ", inline: false },
                                    //         { name: "Action", value: "`🤝 Accept Bid`", inline: false },
                                    //         { name: "Target", value: "`" + name + "`", inline: true },
                                    //         { name: "Value", value: "`" + token.bid.price + "Ξ`", inline: true },
                                    //         { name: "Transaction Data ✅", value: "```" + txnDataFormatted + "```", inline: false },
                                    //         { name: " ", value: "*This transaction requires to approve " + source.name + ", this will be done automatically.", inline: false },
                                    //     )
                                    //     .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                    // await interaction.editReply({ embeds: [gasTrackerEmbed2], components: button, ephemeral: true });

                                    // // On ajoute les différents objets à la réponse initial de const trade.
                                    // // Pour l'instant seulement la value expected dans le cas où la txn fail
                                    // // ainsi que les gas dépensé et le prix (d'après la simulation).
                                    // trade.gas.expected = totalValue
                                    // trade.gas.limit = simulation.result
                                    // trade.gas.price = gas.price

                                    // // Enregistrement dans la database en updatant ce qui 
                                    // // avait déjà été enregistré.
                                    // await exe_nft.update({
                                    //     authorName: authorName,
                                    //     authorId: authorId,
                                    //     serverId: serverId,
                                    //     trade: JSON.stringify(trade),
                                    //     value: global.price.toString(),
                                    //     simulation: "true",
                                    // }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifier } })

                                }

                            } else {
                                // On trouve pas le token dans la liste, erreur
                                const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("NFT Trading")
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setDescription("An error occured while retrieving your data. Please try again or contact a team member if the issue persists.")
                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setTimestamp()
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [setfpEmbedNotForYou], ephemeral: true });
                            }

                        } else {
                            // On trouve pas le token dans la liste, erreur
                            const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("NFT Trading")
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setDescription("An error occured while retrieving your data. Please try again or contact a team member if the issue persists.")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setTimestamp()
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.editReply({ embeds: [setfpEmbedNotForYou], ephemeral: true });
                        }

                    } else {
                        // On retourne l'embed de base, on veut juste reset la liste.
                        const embed = interaction.message.embeds
                        await interaction.update({ embeds: embed })
                    }
                }

            } else {

                const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("NFT Trading")
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .setDescription("Your trade doesn't exist anymore, this usually happens when your trade has already been executed. Please use the 📉 *List* button again to generate a new session.")
                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                await interaction.reply({ embeds: [setfpEmbedNotForYou], ephemeral: true });
            }


        } else {

            const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                .setTitle("NFT Trading")
                .setAuthor({ name: authorName, iconURL: userAvatar })
                .setDescription("An error occured while retrieving your data. Please try again or contact a team member if the issue persists.")
                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                .setTimestamp()
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

            await interaction.reply({ embeds: [setfpEmbedNotForYou], ephemeral: true });

        }


        return;
    },
};


