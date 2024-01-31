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
const { accessSql, profileData, adminsql, reportsql, portfolio_nft, interactionData } = require('../../../events/database');

const axios = require("axios");
const reduceText = require('../../../functions/reducetext');
const { getTokensByCollection } = require("../../../functions/1nft-utils")

module.exports = {
    id: "selector_portfolio_nft_exec_",

    async execute(interaction) {


        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id

        // On récupère le customID
        const customId = interaction.customId
        const match = customId.match(/selector_portfolio_nft_exec_(.+)/);

        if (match && match[1]) {


            // On récupère l'action et le contrat
            const action = match[1];
            const contract = interaction.values[0].toLowerCase()

            if (action === "list") {




                // On récupère la session de portfolio par storage
                // On récupère les data qui ont été store
                const storage = await portfolio_nft.findOne({ where: { authorId: authorId, serverId: serverId, treated: null } })
                const address = storage.dataValues.address
                const portfolio = JSON.parse(storage.dataValues.portfolio)

                const tokens = await getTokensByCollection(contract, address)
                const filtered = tokens.slice(0, 15)

                const collection = portfolio.find(item => item.contract === contract)
                const floor = collection.floor
                const owned = collection.owned
                const name = collection.name

                // On définit le nombre de page
                const itemsPerPage = 15; // Nombre d'objets par page
                const tokenIndex = Math.ceil(tokens.length / itemsPerPage);
                const buttons = [formIndexButtonsTokens(1, tokenIndex)]


                let inventory = "ID                                     Rarity\n\n"
                let index = 0
                let currentButton = new ActionRowBuilder()

                // On construit le tableau
                for (const token of filtered) {

                    // On vérifie que c'est pas le dernier
                    const isFirst = index === 0 ? true : false

                    // On commence par construire le token
                    const id = token.tokenId
                    const rank = token.rarity

                    const part1 = reduceText(name, 30) + " #" + id
                    const part2 = rank ? rank : "-"

                    const spaceSize = 45 - (part1.length + part2.toString().length)
                    let spaceLenght = ""
                    for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

                    inventory += part1 + spaceLenght + part2 + "\n"

                    // En parallèle on construit les bouttons
                    if (index % 5 === 0 && !isFirst) {

                        // On ajoute le row à la liste des components
                        buttons.push(currentButton)
                        // On ajoute un nouveaux bouttons
                        currentButton = null
                        currentButton = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('button_nft_portfolio_infra_tokenSelection@' + id)
                                    .setLabel(id)
                                    .setStyle(1)
                            )
                    } else {

                        // On ajoute un nouveaux bouttons
                        currentButton.addComponents(
                            new ButtonBuilder()
                                .setCustomId('button_nft_portfolio_infra_tokenSelection@' + id)
                                .setLabel(id)
                                .setStyle(1)
                        )
                    }

                    // Si c'est le dernier boutton, on pousse
                    if (index + 1 === filtered.length) {
                        buttons.push(currentButton)
                    }

                    index++
                }


                // Embed de retour
                const getBlurOneWallet = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Transfer an NFT")
                    .setDescription(">>> Transfer one of your NFT")
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .addFields(
                        { name: " ", value: " ", inline: false },
                        { name: "Floor Price", value: "`" + parseFloat(floor).toFixed(3) + "Ξ`", inline: true },
                        { name: "# Held", value: "`" + owned + "`", inline: true },
                        { name: "Inventory:", value: "```" + inventory + "```", inline: false },
                        { name: "Links", value: '[Etherscan](https://etherscan.io/address/' + contract + ") ∙ " + '[Blur](https://blur.io/' + contract + ") ∙ " + '[Opensea](https://opensea.io/' + contract + ") ∙ " + `[Nansen](https://app.nansen.ai/nft-god-mode?address=${contract}&tab=overview` + ") ∙ " + '[Parsec](https://parsec.fi/address/' + address + ")", inline: false },
                        { name: "Page:", value: "`[1/" + tokenIndex + "]`", inline: true },

                    )
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                await interaction.update({ embeds: [getBlurOneWallet], components: buttons })

                // On construit l'obet transaction
                const transaction = {
                    contract: contract,
                    name: name,
                }

                // On crée l'entrée dans la database
                await portfolio_nft.update({
                    tokens: JSON.stringify(tokens),
                    currentTokens: JSON.stringify(filtered),
                    tokenPage: "1",
                    tokenIndex: tokenIndex.toString(),
                    action: action,
                    transaction: JSON.stringify(transaction)
                }, { where: { authorId: authorId, serverId: serverId, treated: null } })


            } if (action === "bulkList") {


            } if (action === "acceptBid") {



            } if (action === "acceptBulkBid") {

            } if (action === "transfer") {




                // On récupère la session de portfolio par storage
                // On récupère les data qui ont été store
                const storage = await portfolio_nft.findOne({ where: { authorId: authorId, serverId: serverId, treated: null } })
                const address = storage.dataValues.address
                const portfolio = JSON.parse(storage.dataValues.portfolio)

                const tokens = await getTokensByCollection(contract, address)
                const filtered = tokens.slice(0, 15)

                const collection = portfolio.find(item => item.contract === contract)
                const floor = collection.floor
                const owned = collection.owned
                const name = collection.name

                // On définit le nombre de page
                const itemsPerPage = 15; // Nombre d'objets par page
                const tokenIndex = Math.ceil(tokens.length / itemsPerPage);
                const buttons = [formIndexButtonsTokens(1, tokenIndex)]


                let inventory = "ID                                     Rarity\n\n"
                let index = 0
                let currentButton = new ActionRowBuilder()

                // On construit le tableau
                for (const token of filtered) {

                    // On vérifie que c'est pas le dernier
                    const isFirst = index === 0 ? true : false

                    // On commence par construire le token
                    const id = token.tokenId
                    const rank = token.rarity

                    const part1 = reduceText(name, 30) + " #" + id
                    const part2 = rank ? rank : "-"

                    const spaceSize = 45 - (part1.length + part2.toString().length)
                    let spaceLenght = ""
                    for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

                    inventory += part1 + spaceLenght + part2 + "\n"

                    // En parallèle on construit les bouttons
                    if (index % 5 === 0 && !isFirst) {

                        // On ajoute le row à la liste des components
                        buttons.push(currentButton)
                        // On ajoute un nouveaux bouttons
                        currentButton = null
                        currentButton = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('button_nft_portfolio_infra_tokenSelection@' + id)
                                    .setLabel(id)
                                    .setStyle(1)
                            )
                    } else {

                        // On ajoute un nouveaux bouttons
                        currentButton.addComponents(
                            new ButtonBuilder()
                                .setCustomId('button_nft_portfolio_infra_tokenSelection@' + id)
                                .setLabel(id)
                                .setStyle(1)
                        )
                    }

                    // Si c'est le dernier boutton, on pousse
                    if (index + 1 === filtered.length) {
                        buttons.push(currentButton)
                    }

                    index++
                }


                // Embed de retour
                const getBlurOneWallet = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Transfer an NFT")
                    .setDescription(">>> Transfer one of your NFT")
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .addFields(
                        { name: " ", value: " ", inline: false },
                        { name: "Floor Price", value: "`" + parseFloat(floor).toFixed(3) + "Ξ`", inline: true },
                        { name: "# Held", value: "`" + owned + "`", inline: true },
                        { name: "Inventory:", value: "```" + inventory + "```", inline: false },
                        { name: "Links", value: '[Etherscan](https://etherscan.io/address/' + contract + ") ∙ " + '[Blur](https://blur.io/' + contract + ") ∙ " + '[Opensea](https://opensea.io/' + contract + ") ∙ " + `[Nansen](https://app.nansen.ai/nft-god-mode?address=${contract}&tab=overview` + ") ∙ " + '[Parsec](https://parsec.fi/address/' + address + ")", inline: false },
                        { name: "Page:", value: "`[1/" + tokenIndex + "]`", inline: true },

                    )
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                await interaction.update({ embeds: [getBlurOneWallet], components: buttons })

                // On construit l'obet transaction
                const transaction = {
                    contract: contract,
                    name: name,
                }

                // On crée l'entrée dans la database
                await portfolio_nft.update({
                    tokens: JSON.stringify(tokens),
                    currentTokens: JSON.stringify(filtered),
                    tokenPage: "1",
                    tokenIndex: tokenIndex.toString(),
                    action: action,
                    transaction: JSON.stringify(transaction)
                }, { where: { authorId: authorId, serverId: serverId, treated: null } })
            }




        } else {

            const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                .setTitle("Portfolio manager")
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



function formIndexButtonsTokens(currentPage, totalPages) {
    // Déterminez quel bouton doit être désactivé
    const isFirstPage = parseInt(currentPage) === 1;
    const isLastPage = parseInt(currentPage) === parseInt(totalPages)

    // Boutons
    const buttonD = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_infra_tokenFirstPage')
                .setLabel('First page')
                .setStyle(2)
                .setDisabled(isFirstPage),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_infra_tokenPreviousPage')
                .setLabel('Previous page')
                .setStyle(2)
                .setDisabled(isFirstPage),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_infra_tokenNextPage')
                .setLabel('Next page')
                .setStyle(2)
                .setDisabled(isLastPage),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_infra_tokenLastPage')
                .setLabel('Last page')
                .setStyle(2)
                .setDisabled(isLastPage),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_infra_return@tokenSelector')
                .setLabel('↩️')
                .setStyle(2)
        );


    // Retourne un tableau de toutes les rangées de boutons
    return buttonD;
}
