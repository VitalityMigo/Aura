const { ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("discord.js");
const reduceText = require('../reducetext')
const markets = require("../../contracts/nft/config.json")

// Boutton de la confirmation ou non de la transaction
function buttonConfirmConfig(status, identifier) {

    if (status === true) {

        // Boutton pas de wallet
        const buttonsConfirm = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('button_nft_confirm_exec@' + identifier.toLowerCase())
                    .setLabel('Confirm')
                    .setEmoji("✅")
                    .setStyle(1),
                new ButtonBuilder()
                    .setCustomId('button_nft_cancel_exec_')
                    .setLabel('Cancel')
                    .setStyle(4),

            );


        return [buttonsConfirm]

    } else {

        // Boutton pas de wallet
        const buttonsCancel = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('button_nft_cancel_exec_')
                    .setLabel('Cancel')
                    .setStyle(4),

            );

        return [buttonsCancel]


    }

}

function exeRetryOrCancel(identifier) {
    //button_nft_confirm_exec

    // Boutton pas de wallet
    const buttons = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('button_nft_confirm_exec@' + identifier.toLowerCase())
                .setLabel('Retry')
                .setEmoji("🔁")
                .setStyle(1),
            new ButtonBuilder()
                .setCustomId('button_nft_cancel_exec_')
                .setLabel('Cancel')
                .setStyle(4),

        );

    return [buttons]
}


// Boutton de naviguation dans les pages de token de listing
function buttonListedTokenIndex(currentPage, totalPages, identifier) {
    // Déterminez quel bouton doit être désactivé
    const isFirstPage = parseInt(currentPage) === 1;
    const isLastPage = parseInt(currentPage) === parseInt(totalPages)

    // Boutons
    const button = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('button_nft_helper_exec_firstpage@' + identifier)
                .setLabel('First page')
                .setStyle(2)
                .setDisabled(isFirstPage),
            new ButtonBuilder()
                .setCustomId('button_nft_helper_exec_previouspage@' + identifier)
                .setLabel('Previous page')
                .setStyle(2)
                .setDisabled(isFirstPage),
            new ButtonBuilder()
                .setCustomId('button_nft_helper_exec_nextpage@' + identifier)
                .setLabel('Next page')
                .setStyle(2)
                .setDisabled(isLastPage),
            new ButtonBuilder()
                .setCustomId('button_nft_helper_exec_lastpage@' + identifier)
                .setLabel('Last page')
                .setStyle(2)
                .setDisabled(isLastPage),
        );



    // Retourne un tableau de toutes les rangées de boutons
    return button;
}

// Dropdown des tokens de la page actuelle pour listing
function dropdownListedTokenConfig(tokens, identifier) {

    const selectMenuBuilder = new StringSelectMenuBuilder()
        .setCustomId('selector_panel_exe_tokenselector')  // Changez cela en l'ID que vous préférez
        .setPlaceholder('Select a token to list');

    // On ajoute le premier objet de reset
    selectMenuBuilder.addOptions(
        new StringSelectMenuOptionBuilder()
            .setValue(identifier + '@reset')  // Utilisez le contract comme valeur
            .setLabel("Reset selection")  // Utilisez le nom comme libellé
            .setDescription(`Reset the token selection.`)
    );

    tokens.forEach(item => {
        const option = new StringSelectMenuOptionBuilder()
            .setValue(identifier + '@' + item.token.tokenId)  // Utilisez le contract comme valeur
            .setLabel(item.token.name + ' #' + item.token.tokenId)  // Utilisez le nom comme libellé
            .setDescription(`Listing: ${item.listing ? item.listing.price + 'Ξ' : '-'} | Rarity: ${item.token.rarity}`)

        selectMenuBuilder.addOptions(option);
    });

    const actionRow = new ActionRowBuilder()
        .addComponents(selectMenuBuilder);

    return actionRow;
}

// Dropdown des tokens de la page actuelle pour bids
function dropdownBiddingTokenConfig(tokens, identifier) {

    const selectMenuBuilder = new StringSelectMenuBuilder()
        .setCustomId('selector_panel_exe_tokenselector')  // Changez cela en l'ID que vous préférez
        .setPlaceholder('Select a token to sell');

    // On ajoute le premier objet de reset
    selectMenuBuilder.addOptions(
        new StringSelectMenuOptionBuilder()
            .setValue(identifier + '@reset')  // Utilisez le contract comme valeur
            .setLabel("Reset selection")  // Utilisez le nom comme libellé
            .setDescription(`Reset the token selection.`)
    );

    tokens.forEach(item => {
        const option = new StringSelectMenuOptionBuilder()
            .setValue(identifier + '@' + item.token.tokenId)  // Utilisez le contract comme valeur
            .setLabel(item.token.name + ' #' + item.token.tokenId)  // Utilisez le nom comme libellé
            .setDescription(`Bid: ${item.bid ? item.bid.price + 'Ξ' : '-'} | Floor Diff.: ${item.bid ? item.bid.gap + '%' : '-'}`) // On met la Bid

        selectMenuBuilder.addOptions(option);
    });

    const actionRow = new ActionRowBuilder()
        .addComponents(selectMenuBuilder);

    return actionRow;
}


// Permet de construire le contenu de la table des tokens a listé
// On entame la boucle
function formatListingInventory(inventory) {
    if (inventory.length > 0) {
        let result = "Token                                Rarity     Listing\n\n"
        for (const item of inventory) {

            // On définit les différentes composantes
            const token = reduceText(item.token.name, 25) + " #" + item.token.tokenId
            const rarity = item.token.rarity
            const price = item.listing ? item.listing.price + 'Ξ' : "-"

            const spaceSZA = 43 - (token.length + rarity.toString().length)
            const spaceSZB = 12 - price.toString().length
            let spaceA = ""
            let spaceB = ""
            for (let i = 0; i < spaceSZA; i++) { spaceA += " " }
            for (let i = 0; i < spaceSZB; i++) { spaceB += " " }

            result += token + spaceA + rarity + spaceB + price + "\n"
        }
        return result
    } else {
        return 'You do not own any tokens from this collection.'
    }
}

function formatBiddingInventory(inventory) {
    if (inventory.length > 0) {
        let result = "Token                                  Bids       Diff.\n\n"
        for (const item of inventory) {

            // On définit les différentes composantes
            const token = reduceText(item.token.name, 25) + " #" + item.token.tokenId
            const price = item.bid ? item.bid.price + 'Ξ' : "-"
            const gap = item.bid ? item.bid.gap + '%' : "-"

            const spaceSZA = 43 - (token.length + price.toString().length)
            const spaceSZB = 12 - gap.toString().length
            let spaceA = ""
            let spaceB = ""
            for (let i = 0; i < spaceSZA; i++) { spaceA += " " }
            for (let i = 0; i < spaceSZB; i++) { spaceB += " " }

            result += token + spaceA + price + spaceB + gap + "\n"
        }
        return result
    } else {
        return 'You do not own any tokens with a bid from this collection.'
    }
}

function buttonListingParamsConfig(trade, identifier) {

    const source = markets.find(i => i.id !== trade.source)

    const buttonParams = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('button_nft_panel_order_param_exec_price@' + identifier)
                .setLabel('Modify listing price')
                .setStyle(2),
            new ButtonBuilder()
                .setCustomId('button_nft_panel_order_param_exec_marketplace@' + identifier)
                .setLabel('Switch to ' + source.name)
                .setEmoji(source.logo)
                .setStyle(3),
        );

    // On définit les constantes qui se transformeront en vrai ou faux
    const is1day = trade.trade.expireDisplay == '1 day' ? 1 : 2
    const is3days = trade.trade.expireDisplay == '3 days' ? 1 : 2
    const is7days = trade.trade.expireDisplay == '7 days' ? 1 : 2
    const is30days = trade.trade.expireDisplay == '30 days' ? 1 : 2


    // Temps de listing
    const buttonExpire = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('button_nft_panel_order_param_exec_1day@' + identifier)
                .setLabel('1 Day')
                .setStyle(is1day),
            new ButtonBuilder()
                .setCustomId('button_nft_panel_order_param_exec_3day@' + identifier)
                .setLabel('3 Days')
                .setStyle(is3days),
            new ButtonBuilder()
                .setCustomId('button_nft_panel_order_param_exec_7day@' + identifier)
                .setLabel('7 Days')
                .setStyle(is7days),
            new ButtonBuilder()
                .setCustomId('button_nft_panel_order_param_exec_30day@' + identifier)
                .setLabel('30 Days')
                .setStyle(is30days),
        );


    // Le dernier bouttons est un boutton de confirmation, toujours true
    const buttonExecute = buttonConfirmConfig(true, identifier)

    return [buttonParams, buttonExpire, buttonExecute[0]]
}

function buttonBiddingParamsConfig(trade, identifier, status, wrapped) {

    const source = markets.find(i => i.id !== trade.source)

    const buttonParams = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('button_nft_panel_order_param_exec_price@' + identifier)
                .setLabel('Modify price')
                .setStyle(2),
            new ButtonBuilder()
                .setCustomId('button_nft_panel_order_param_exec_amount@' + identifier)
                .setLabel('Modify size')
                .setStyle(2),
            new ButtonBuilder()
                .setCustomId('button_nft_panel_order_param_exec_marketplace@' + identifier)
                .setLabel('Switch to ' + source.name)
                .setEmoji(source.logo)
                .setStyle(3),
        );

    // On définit les constantes qui se transformeront en vrai ou faux
    const is1day = trade.trade.expireDisplay == '10 days' ? 1 : 2
    const is3days = trade.trade.expireDisplay == '15 days' ? 1 : 2
    const is7days = trade.trade.expireDisplay == '20 days' ? 1 : 2
    const is30days = trade.trade.expireDisplay == '30 days' ? 1 : 2


    // Temps de listing
    const buttonExpire = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('button_nft_panel_order_param_exec_10day@' + identifier)
                .setLabel('10 Days')
                .setStyle(is1day),
            new ButtonBuilder()
                .setCustomId('button_nft_panel_order_param_exec_15day@' + identifier)
                .setLabel('15 Days')
                .setStyle(is3days),
            new ButtonBuilder()
                .setCustomId('button_nft_panel_order_param_exec_20day@' + identifier)
                .setLabel('20 Days')
                .setStyle(is7days),
            new ButtonBuilder()
                .setCustomId('button_nft_panel_order_param_exec_30day@' + identifier)
                .setLabel('30 Days')
                .setStyle(is30days),
        );


    // Le dernier bouttons est un boutton de confirmation, toujours true
    let buttonExecute
    if (status === true) {

        const confirmName = wrapped ? 'Confirm' : 'Wrap & Confirm'

        // Boutton pas de wallet
        buttonExecute = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('button_nft_confirm_exec@' + identifier.toLowerCase())
                    .setLabel(confirmName)
                    .setEmoji("✅")
                    .setStyle(1),
                new ButtonBuilder()
                    .setCustomId('button_nft_cancel_exec_')
                    .setLabel('Cancel')
                    .setStyle(4),

            );



    } else {

        // Boutton pas de wallet
        buttonExecute = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('button_nft_cancel_exec_')
                    .setLabel('Cancel')
                    .setStyle(4),

            );



    }
    
    return [buttonParams, buttonExpire, buttonExecute]
}



module.exports = {
    buttonConfirmConfig,
    buttonListedTokenIndex,
    dropdownListedTokenConfig,
    dropdownBiddingTokenConfig,
    formatListingInventory,
    formatBiddingInventory,
    buttonListingParamsConfig,
    exeRetryOrCancel,
    buttonBiddingParamsConfig
}