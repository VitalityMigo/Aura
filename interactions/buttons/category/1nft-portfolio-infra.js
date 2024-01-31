/**
 * @file Sample button interaction
 * @author JAYZHVJ
 * @since 3.0.0
 * @version 3.2.2
 */

/**
 * @type {import('../../../typings').ButtonInteractionCommand}
 */


const { ButtonInteraction, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const { ActionRowBuilder, EmbedBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const { accessSql, profileData, adminsql, reportsql, sequelize, portfolio_nft } = require('../../../events/database');
const moment = require('moment');


// On importe les fonctions importantes
const { getPortfolio } = require("../../../functions/1nft-utils")
const reduceText = require("../../../functions/reducetext")


module.exports = {
    id: 'button_nft_portfolio_infra_',

    async execute(interaction) {
        if (!(interaction instanceof ButtonInteraction)) return;

        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id
        let botId = interaction.applicationId

        try {

            console.log("Initialization: executed ✅")

            // On récupère le customID
            const customId = interaction.customId
            const match = customId.match(/button_nft_portfolio_infra_([^_@]+)(?:@|$)/);

            if (match && match[1]) {

                const action = match[1];


                if (action === "firstPage") {

                    // On récupère les data qui ont été store
                    const storage = await portfolio_nft.findOne({ where: { authorId: authorId, serverId: serverId, treated: null } })
                    const portfolio = JSON.parse(storage.dataValues.portfolio)
                    const address = storage.dataValues.address
                    const index = storage.dataValues.pageIndex
                    const current = storage.dataValues.actualPage


                    // On modifie le tableau
                    const filtered = portfolio.slice(0, 16)
                    let inventory = "Name                       # Held      Floor       Value\n\n"

                    for (const coll of filtered) {

                        let part1 = reduceText(coll.name, 23)
                        let part2 = coll.owned
                        let part3 = parseFloat(coll.floor).toFixed(3) + "Ξ"
                        let part4 = parseFloat(coll.value).toFixed(3) + "Ξ"

                        //  let part3 = formatBidPrice(coll.bid)
                        //  let part4 = parseFloat(coll.floor).toFixed(3) + "Ξ"

                        let spaceSize = 33 - part1.length - part2.length
                        let spaceLenght = ""
                        for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

                        let spaceSize2 = 11 - part3.length
                        let spaceLenght2 = ""
                        for (let i = 0; i < spaceSize2; i++) { spaceLenght2 += " " }

                        let spaceSize3 = 12 - part4.length
                        let spaceLenght3 = ""
                        for (let i = 0; i < spaceSize3; i++) { spaceLenght3 += " " }


                        inventory += part1 + spaceLenght + part2 + spaceLenght2 + part3 + spaceLenght3 + part4 + "\n"
                    }

                    // On récupère la réponse d'origine 
                    // On modifie le field contenant la table et le page index
                    let embed = interaction.message.embeds[0].data
                    embed.fields.find(obj => obj.name === "Inventory:").value = "```" + inventory + "```"
                    embed.fields.find(obj => obj.name === "Page:").value = "`[1/" + index + "]`"

                    // On modifie le status les deux premiers bouttons (ils deviennent inactif)
                    const buttonsB = interaction.message.components[1]
                    const buttons = formIndexButtons(1, index, buttonsB)

                    // Pour finir on modifie l'embed ainsi que les data de l'interaction
                    await portfolio_nft.update({ actualPage: "1", current: JSON.stringify(filtered) }, { where: { authorId: authorId, serverId: serverId, treated: null } });
                    await interaction.update({ embeds: [embed], components: buttons });

                } else if (action === 'lastPage') {

                    // On récupère les data qui ont été store
                    const storage = await portfolio_nft.findOne({ where: { authorId: authorId, serverId: serverId, treated: null } })
                    const portfolio = JSON.parse(storage.dataValues.portfolio)
                    const address = storage.dataValues.address
                    const index = storage.dataValues.pageIndex
                    const current = storage.dataValues.actualPage

                    // On définit l'interval à récupérer
                    const itemsPerPage = 16; // Nombre d'objets par page
                    const firstObject = (index - 1) * itemsPerPage
                    const lastObject = firstObject + itemsPerPage

                    // On modifie le tableau
                    const filtered = portfolio.slice(firstObject, lastObject)
                    let inventory = "Name                       # Held      Floor       Value\n\n"

                    for (const coll of filtered) {

                        let part1 = reduceText(coll.name, 23)
                        let part2 = coll.owned
                        let part3 = parseFloat(coll.floor).toFixed(3) + "Ξ"
                        let part4 = parseFloat(coll.value).toFixed(3) + "Ξ"

                        //  let part3 = formatBidPrice(coll.bid)
                        //  let part4 = parseFloat(coll.floor).toFixed(3) + "Ξ"

                        let spaceSize = 33 - part1.length - part2.length
                        let spaceLenght = ""
                        for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

                        let spaceSize2 = 11 - part3.length
                        let spaceLenght2 = ""
                        for (let i = 0; i < spaceSize2; i++) { spaceLenght2 += " " }

                        let spaceSize3 = 12 - part4.length
                        let spaceLenght3 = ""
                        for (let i = 0; i < spaceSize3; i++) { spaceLenght3 += " " }


                        inventory += part1 + spaceLenght + part2 + spaceLenght2 + part3 + spaceLenght3 + part4 + "\n"
                    }

                    // On récupère la réponse d'origine 
                    // On modifie le field contenant la table et le page index
                    let embed = interaction.message.embeds[0].data
                    embed.fields.find(obj => obj.name === "Inventory:").value = "```" + inventory + "```"
                    embed.fields.find(obj => obj.name === "Page:").value = "`[" + index + "/" + index + "]`"

                    // On modifie le status les deux premiers bouttons (ils deviennent inactif)
                    const buttonsB = interaction.message.components[1]
                    const buttons = formIndexButtons(index, index, buttonsB)

                    // Pour finir on modifie l'embed ainsi que les data de l'interaction
                    await portfolio_nft.update({ actualPage: index, current: JSON.stringify(filtered) }, { where: { authorId: authorId, serverId: serverId, treated: null } });
                    await interaction.update({ embeds: [embed], components: buttons });

                } else if (action === 'previousPage') {

                    // On récupère les data qui ont été store
                    const storage = await portfolio_nft.findOne({ where: { authorId: authorId, serverId: serverId, treated: null } })
                    const portfolio = JSON.parse(storage.dataValues.portfolio)
                    const address = storage.dataValues.address
                    const index = storage.dataValues.pageIndex
                    const current = storage.dataValues.actualPage

                    // On définit l'interval à récupérer
                    const itemsPerPage = 16; // Nombre d'objets par page
                    const newPage = current - 1
                    const firstObject = (newPage - 1) * itemsPerPage
                    const lastObject = firstObject + itemsPerPage

                    // On modifie le tableau
                    const filtered = portfolio.slice(firstObject, lastObject)
                    let inventory = "Name                       # Held      Floor       Value\n\n"

                    for (const coll of filtered) {

                        let part1 = reduceText(coll.name, 23)
                        let part2 = coll.owned
                        let part3 = parseFloat(coll.floor).toFixed(3) + "Ξ"
                        let part4 = parseFloat(coll.value).toFixed(3) + "Ξ"

                        //  let part3 = formatBidPrice(coll.bid)
                        //  let part4 = parseFloat(coll.floor).toFixed(3) + "Ξ"

                        let spaceSize = 33 - part1.length - part2.length
                        let spaceLenght = ""
                        for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

                        let spaceSize2 = 11 - part3.length
                        let spaceLenght2 = ""
                        for (let i = 0; i < spaceSize2; i++) { spaceLenght2 += " " }

                        let spaceSize3 = 12 - part4.length
                        let spaceLenght3 = ""
                        for (let i = 0; i < spaceSize3; i++) { spaceLenght3 += " " }


                        inventory += part1 + spaceLenght + part2 + spaceLenght2 + part3 + spaceLenght3 + part4 + "\n"
                    }

                    // On récupère la réponse d'origine 
                    // On modifie le field contenant la table et le page index
                    let embed = interaction.message.embeds[0].data
                    embed.fields.find(obj => obj.name === "Inventory:").value = "```" + inventory + "```"
                    embed.fields.find(obj => obj.name === "Page:").value = "`[" + newPage + "/" + index + "]`"

                    // On modifie le status les deux premiers bouttons (ils deviennent inactif)
                    const buttonsB = interaction.message.components[1]
                    const buttons = formIndexButtons(newPage, index, buttonsB)

                    // Pour finir on modifie l'embed ainsi que les data de l'interaction
                    await portfolio_nft.update({ actualPage: newPage.toString(), current: JSON.stringify(filtered) }, { where: { authorId: authorId, serverId: serverId, treated: null } });
                    await interaction.update({ embeds: [embed], components: buttons });

                } else if (action === 'nextPage') {

                    // On récupère les data qui ont été store
                    const storage = await portfolio_nft.findOne({ where: { authorId: authorId, serverId: serverId, treated: null } })
                    const portfolio = JSON.parse(storage.dataValues.portfolio)
                    const address = storage.dataValues.address
                    const index = storage.dataValues.pageIndex
                    const current = storage.dataValues.actualPage

                    // On définit l'interval à récupérer
                    const itemsPerPage = 16; // Nombre d'objets par page
                    const newPage = parseInt(current) + 1
                    const firstObject = (newPage - 1) * itemsPerPage
                    const lastObject = firstObject + itemsPerPage

                    // On modifie le tableau
                    const filtered = portfolio.slice(firstObject, lastObject)
                    let inventory = "Name                       # Held      Floor       Value\n\n"

                    for (const coll of filtered) {

                        let part1 = reduceText(coll.name, 23)
                        let part2 = coll.owned
                        let part3 = parseFloat(coll.floor).toFixed(3) + "Ξ"
                        let part4 = parseFloat(coll.value).toFixed(3) + "Ξ"

                        //  let part3 = formatBidPrice(coll.bid)
                        //  let part4 = parseFloat(coll.floor).toFixed(3) + "Ξ"

                        let spaceSize = 33 - part1.length - part2.length
                        let spaceLenght = ""
                        for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

                        let spaceSize2 = 11 - part3.length
                        let spaceLenght2 = ""
                        for (let i = 0; i < spaceSize2; i++) { spaceLenght2 += " " }

                        let spaceSize3 = 12 - part4.length
                        let spaceLenght3 = ""
                        for (let i = 0; i < spaceSize3; i++) { spaceLenght3 += " " }


                        inventory += part1 + spaceLenght + part2 + spaceLenght2 + part3 + spaceLenght3 + part4 + "\n"
                    }

                    // On récupère la réponse d'origine 
                    // On modifie le field contenant la table et le page index
                    let embed = interaction.message.embeds[0].data
                    embed.fields.find(obj => obj.name === "Inventory:").value = "```" + inventory + "```"
                    embed.fields.find(obj => obj.name === "Page:").value = "`[" + newPage + "/" + index + "]`"

                    // On modifie le status les deux premiers bouttons (ils deviennent inactif)
                    const buttonsB = interaction.message.components[1]
                    const buttons = formIndexButtons(newPage, index, buttonsB)

                    // Pour finir on modifie l'embed ainsi que les data de l'interaction
                    await portfolio_nft.update({ actualPage: newPage.toString(), current: JSON.stringify(filtered) }, { where: { authorId: authorId, serverId: serverId, treated: null } });
                    await interaction.update({ embeds: [embed], components: buttons });

                } else if (action === 'sortbyvalue') {


                    // On récupère les data qui ont été store
                    const storage = await portfolio_nft.findOne({ where: { authorId: authorId, serverId: serverId, treated: null } })
                    const portfolio = JSON.parse(storage.dataValues.portfolio)
                    const address = storage.dataValues.address
                    const index = storage.dataValues.pageIndex
                    const current = storage.dataValues.actualPage


                    // On modifie le tableau
                    const portfolioByValue = portfolio.sort((a, b) => (b.value - a.value))
                    const filtered = portfolioByValue.slice(0, 16)
                    let inventory = "Name                       # Held      Floor       Value\n\n"

                    for (const coll of filtered) {

                        let part1 = reduceText(coll.name, 23)
                        let part2 = coll.owned
                        let part3 = parseFloat(coll.floor).toFixed(3) + "Ξ"
                        let part4 = parseFloat(coll.value).toFixed(3) + "Ξ"

                        //  let part3 = formatBidPrice(coll.bid)
                        //  let part4 = parseFloat(coll.floor).toFixed(3) + "Ξ"

                        let spaceSize = 33 - part1.length - part2.length
                        let spaceLenght = ""
                        for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

                        let spaceSize2 = 11 - part3.length
                        let spaceLenght2 = ""
                        for (let i = 0; i < spaceSize2; i++) { spaceLenght2 += " " }

                        let spaceSize3 = 12 - part4.length
                        let spaceLenght3 = ""
                        for (let i = 0; i < spaceSize3; i++) { spaceLenght3 += " " }


                        inventory += part1 + spaceLenght + part2 + spaceLenght2 + part3 + spaceLenght3 + part4 + "\n"
                    }

                    // On récupère la réponse d'origine 
                    // On modifie le field contenant la table et le page index
                    let embed = interaction.message.embeds[0].data
                    embed.fields.find(obj => obj.name === "Inventory:").value = "```" + inventory + "```"
                    embed.fields.find(obj => obj.name === "Page:").value = "`[1/" + index + "]`"

                    // On modifie le status les deux premiers bouttons (ils deviennent inactif)
                    const buttonsD = interaction.message.components[0]
                    const buttons = forSortButtons(action, buttonsD)

                    // Pour finir on modifie l'embed ainsi que les data de l'interaction
                    await portfolio_nft.update({ portfolio: JSON.stringify(portfolioByValue), current: JSON.stringify(filtered), sort: 'byValue' }, { where: { authorId: authorId, serverId: serverId, treated: null } });
                    await interaction.update({ embeds: [embed], components: buttons });



                } else if (action === 'sortbyfloor') {

                    // On récupère les data qui ont été store
                    const storage = await portfolio_nft.findOne({ where: { authorId: authorId, serverId: serverId, treated: null } })
                    const portfolio = JSON.parse(storage.dataValues.portfolio)
                    const address = storage.dataValues.address
                    const index = storage.dataValues.pageIndex
                    const current = storage.dataValues.actualPage


                    // On modifie le tableau
                    const portfolioByFloor = portfolio.sort((a, b) => (b.floor - a.floor))
                    const filtered = portfolioByFloor.slice(0, 16)
                    let inventory = "Name                       # Held      Floor       Value\n\n"

                    for (const coll of filtered) {

                        let part1 = reduceText(coll.name, 23)
                        let part2 = coll.owned
                        let part3 = parseFloat(coll.floor).toFixed(3) + "Ξ"
                        let part4 = parseFloat(coll.value).toFixed(3) + "Ξ"

                        //  let part3 = formatBidPrice(coll.bid)
                        //  let part4 = parseFloat(coll.floor).toFixed(3) + "Ξ"

                        let spaceSize = 33 - part1.length - part2.length
                        let spaceLenght = ""
                        for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

                        let spaceSize2 = 11 - part3.length
                        let spaceLenght2 = ""
                        for (let i = 0; i < spaceSize2; i++) { spaceLenght2 += " " }

                        let spaceSize3 = 12 - part4.length
                        let spaceLenght3 = ""
                        for (let i = 0; i < spaceSize3; i++) { spaceLenght3 += " " }


                        inventory += part1 + spaceLenght + part2 + spaceLenght2 + part3 + spaceLenght3 + part4 + "\n"
                    }

                    // On récupère la réponse d'origine 
                    // On modifie le field contenant la table et le page index
                    let embed = interaction.message.embeds[0].data
                    embed.fields.find(obj => obj.name === "Inventory:").value = "```" + inventory + "```"
                    embed.fields.find(obj => obj.name === "Page:").value = "`[1/" + index + "]`"

                    // On modifie le status les deux premiers bouttons (ils deviennent inactif)
                    const buttonsD = interaction.message.components[0]
                    const buttons = forSortButtons(action, buttonsD)

                    // Pour finir on modifie l'embed ainsi que les data de l'interaction
                    await portfolio_nft.update({ portfolio: JSON.stringify(portfolioByFloor), current: JSON.stringify(filtered), sort: 'byFloor' }, { where: { authorId: authorId, serverId: serverId, treated: null } });
                    await interaction.update({ embeds: [embed], components: buttons });



                } else if (action === 'sortbyabc') {


                    // On récupère les data qui ont été store
                    const storage = await portfolio_nft.findOne({ where: { authorId: authorId, serverId: serverId, treated: null } })
                    const portfolio = JSON.parse(storage.dataValues.portfolio)
                    const address = storage.dataValues.address
                    const index = storage.dataValues.pageIndex
                    const current = storage.dataValues.actualPage


                    // On modifie le tableau
                    const portfolioByABC = portfolio.sort((a, b) => a.name.localeCompare(b.name))
                    const filtered = portfolioByABC.slice(0, 16)
                    let inventory = "Name                       # Held      Floor       Value\n\n"

                    for (const coll of filtered) {

                        let part1 = reduceText(coll.name, 23)
                        let part2 = coll.owned
                        let part3 = parseFloat(coll.floor).toFixed(3) + "Ξ"
                        let part4 = parseFloat(coll.value).toFixed(3) + "Ξ"

                        //  let part3 = formatBidPrice(coll.bid)
                        //  let part4 = parseFloat(coll.floor).toFixed(3) + "Ξ"

                        let spaceSize = 33 - part1.length - part2.length
                        let spaceLenght = ""
                        for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

                        let spaceSize2 = 11 - part3.length
                        let spaceLenght2 = ""
                        for (let i = 0; i < spaceSize2; i++) { spaceLenght2 += " " }

                        let spaceSize3 = 12 - part4.length
                        let spaceLenght3 = ""
                        for (let i = 0; i < spaceSize3; i++) { spaceLenght3 += " " }


                        inventory += part1 + spaceLenght + part2 + spaceLenght2 + part3 + spaceLenght3 + part4 + "\n"
                    }

                    // On récupère la réponse d'origine 
                    // On modifie le field contenant la table et le page index
                    let embed = interaction.message.embeds[0].data
                    embed.fields.find(obj => obj.name === "Inventory:").value = "```" + inventory + "```"
                    embed.fields.find(obj => obj.name === "Page:").value = "`[1/" + index + "]`"

                    // On modifie le status les deux premiers bouttons (ils deviennent inactif)
                    const buttonsD = interaction.message.components[0]
                    const buttons = forSortButtons(action, buttonsD)


                    // Pour finir on modifie l'embed ainsi que les data de l'interaction
                    await portfolio_nft.update({ portfolio: JSON.stringify(portfolioByABC), current: JSON.stringify(filtered), sort: 'byAbc' }, { where: { authorId: authorId, serverId: serverId, treated: null } });
                    await interaction.update({ embeds: [embed], components: buttons });



                } else if (action === 'refresh') {

                    // Bouttons
                    const buttonA = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('button_nft_portfolio_infra_collectionView')
                                .setLabel('Global View')
                                .setStyle(1),
                            new ButtonBuilder()
                                .setCustomId('button_nft_portfolio_infra_tokenView')
                                .setLabel('Token View')
                                .setStyle(2),
                            new ButtonBuilder()
                                .setCustomId('button_nft_portfolio_infra_sortbyvalue')
                                .setLabel('Sort by value')
                                .setStyle(1),
                            new ButtonBuilder()
                                .setCustomId('button_nft_portfolio_infra_sortbyfloor')
                                .setLabel('Sort by floor')
                                .setStyle(2),
                            new ButtonBuilder()
                                .setCustomId('button_nft_portfolio_infra_sortbyabc')
                                .setLabel('Sort by abc')
                                .setStyle(2),
                        );

                    const buttonB = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('button_nft_portfolio_exec_list')
                                .setLabel('List')
                                .setStyle(3)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('button_nft_portfolio_exec_bulkList')
                                .setLabel('Bulk List')
                                .setStyle(3)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('button_nft_portfolio_exec_acceptBid')
                                .setLabel('Accept Bid')
                                .setStyle(3)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('button_nft_portfolio_exec_acceptBulkBid')
                                .setLabel('Accept Bulk Bid')
                                .setStyle(3)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('button_nft_portfolio_exec_transfer')
                                .setLabel('Transfer')
                                .setStyle(3),
                        );

                    const buttonC = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('button_nft_portfolio_infra_refresh')
                                .setLabel('🔁 Refresh')
                                .setStyle(1),
                            new ButtonBuilder()
                                .setCustomId('button_nft_portfolio_infra_tutorial')
                                .setLabel('📑 Tutorial')
                                .setStyle(1),
                            new ButtonBuilder()
                                .setCustomId('button_nft_tradepanel_setup')
                                .setLabel('💻 Setup')
                                .setStyle(1),
                        );

                    const buttonD = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('button_nft_portfolio_infra_firstPage')
                                .setLabel('First page')
                                .setStyle(2)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('button_nft_portfolio_infra_previousPage')
                                .setLabel('Previous page')
                                .setStyle(2)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('button_nft_portfolio_infra_nextPage')
                                .setLabel('Next page')
                                .setStyle(2),
                            new ButtonBuilder()
                                .setCustomId('button_nft_portfolio_infra_lastPage')
                                .setLabel('Last page')
                                .setStyle(2),
                        );

                    // On récupère les data qui ont été store
                    const storage = await portfolio_nft.findOne({ where: { authorId: authorId, serverId: serverId, treated: null } })
                    const address = storage.dataValues.address

                    // On récupère les infos du portfolio
                    const portfolio = await getPortfolio(address)

                    // On calcul les datas global
                    const data = portfolio.reduce((acc, item) => {
                        acc.totalOwned = (acc.totalOwned || 0) + parseInt(item.owned);
                        acc.totalValue = (acc.totalValue || 0) + item.value;
                        return acc;
                    }, {});


                    const portfolioFiltered = portfolio.slice(0, 16)
                    let inventory = "Name                       # Held      Floor       Value\n\n"

                    for (const coll of portfolioFiltered) {

                        let part1 = reduceText(coll.name, 23)
                        let part2 = coll.owned
                        let part3 = parseFloat(coll.floor).toFixed(3) + "Ξ"
                        let part4 = parseFloat(coll.value).toFixed(3) + "Ξ"

                        //  let part3 = formatBidPrice(coll.bid)
                        //  let part4 = parseFloat(coll.floor).toFixed(3) + "Ξ"

                        let spaceSize = 33 - part1.length - part2.length
                        let spaceLenght = ""
                        for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

                        let spaceSize2 = 11 - part3.length
                        let spaceLenght2 = ""
                        for (let i = 0; i < spaceSize2; i++) { spaceLenght2 += " " }

                        let spaceSize3 = 12 - part4.length
                        let spaceLenght3 = ""
                        for (let i = 0; i < spaceSize3; i++) { spaceLenght3 += " " }


                        inventory += part1 + spaceLenght + part2 + spaceLenght2 + part3 + spaceLenght3 + part4 + "\n"
                    }

                    // On définit le nombre de page
                    const itemsPerPage = 16; // Nombre d'objets par page
                    const index = Math.ceil(portfolio.length / itemsPerPage);


                    const notMember = new EmbedBuilder().setColor("#060A8F")
                        .setTitle(`Portfolio Manager`)
                        .setDescription(">>> Manage your NFTs")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "Value:", value: "`" + parseFloat(data.totalValue).toFixed(3) + "Ξ`", inline: true },
                            { name: "# Held:", value: "`" + data.totalOwned + "`", inline: true },
                            { name: "Inventory:", value: "```" + inventory + "```", inline: false },
                            { name: "Links", value: '[Etherscan](https://etherscan.io/address/' + address + ") ∙ " + '[Blur](https://blur.io/' + address + ") ∙ " + '[Opensea](https://opensea.io/' + address + ") ∙ " + '[Nansen](https://portfolio.nansen.ai/dashboard/' + address + ") ∙ " + '[Parsec](https://parsec.fi/address/' + address + ")", inline: false },
                            { name: "Page:", value: "`[1/" + index + "]`", inline: false },

                        )
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                    await interaction.update({ embeds: [notMember], components: [buttonD, buttonA, buttonB, buttonC] });

                    // On update l'interaction
                    await portfolio_nft.update({
                        authorId: authorId,
                        authorName: authorName,
                        serverId: serverId,
                        address: address,
                        portfolio: JSON.stringify(portfolio),
                        current: JSON.stringify(portfolioFiltered),
                        pageIndex: index.toString(),
                        actualPage: "1",
                        sort: 'byValue'
                    }, { where: { authorId: authorId, serverId: serverId, treated: null } })



                } else if (action === 'tutorial') {



                    const notMember = new EmbedBuilder().setColor("#060A8F")
                        .setTitle(`Portfolio Manager`)
                        .setDescription(">>> The NFT portfolio manager has several easy-to-use features.")
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "List", value: "```XXX```", inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: "Bulk List", value: "```XXX```", inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: "Accept Bid", value: "```XXX```", inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: "Accept Bulk Bid", value: "```XXX```", inline: false },

                        )
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                    await interaction.reply({ embeds: [notMember], ephemeral: true });


                } else if (action === 'collectionView') {

                    const embed = interaction.message.embeds[0].data
                    await interaction.update({ embeds: [embed] })

                } else if (action === 'tokenView') {

                    const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Not available")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setDescription("The token view isn't available yet, you can still use the portfolio in collection view")
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.reply({ embeds: [setfpEmbedNotForYou], ephemeral: true });

                } else if (action === "tokenFirstPage") {

                    // On récupère les data qui ont été store
                    const storage = await portfolio_nft.findOne({ where: { authorId: authorId, serverId: serverId, treated: null } })
                    const tokens = JSON.parse(storage.dataValues.tokens)
                    const address = storage.dataValues.address
                    const index = storage.dataValues.tokenIndex
                    const current = storage.dataValues.tokenPage

                    // On filtre le tableau
                    const filtered = tokens.slice(0, 15)

                    const buttons = [formIndexButtonsTokens(1, index)]
                    let inventory = "ID                                     Rarity\n\n"
                    let i = 0
                    let currentButton = new ActionRowBuilder()

                    // On construit le tableau
                    for (const token of filtered) {

                        // On vérifie que c'est pas le dernier
                        const isFirst = i === 0 ? true : false

                        // On commence par construire le token
                        const id = token.tokenId
                        const rank = token.rarity
                        const name = token.name

                        const part1 = reduceText(name, 30) + " #" + id
                        const part2 = rank ? rank : "-"

                        const spaceSize = 45 - (part1.length + part2.toString().length)
                        let spaceLenght = ""
                        for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

                        inventory += part1 + spaceLenght + part2 + "\n"

                        // En parallèle on construit les bouttons
                        if (i % 5 === 0 && !isFirst) {

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
                        if (i + 1 === filtered.length) {
                            buttons.push(currentButton)
                        }

                        i++
                    }

                    // On récupère la réponse d'origine 
                    // On modifie le field contenant la table et le page index
                    let embed = interaction.message.embeds[0].data
                    embed.fields.find(obj => obj.name === "Inventory:").value = "```" + inventory + "```"
                    embed.fields.find(obj => obj.name === "Page:").value = "`[1/" + index + "]`"

                    // Pour finir on modifie l'embed ainsi que les data de l'interaction
                    await portfolio_nft.update({ tokenPage: "1", currentTokens: JSON.stringify(filtered) }, { where: { authorId: authorId, serverId: serverId, treated: null } });
                    await interaction.update({ embeds: [embed], components: buttons });

                } else if (action === 'tokenLastPage') {

                    // On récupère les data qui ont été store
                    const storage = await portfolio_nft.findOne({ where: { authorId: authorId, serverId: serverId, treated: null } })
                    const tokens = JSON.parse(storage.dataValues.tokens)
                    const address = storage.dataValues.address
                    const index = storage.dataValues.tokenIndex
                    const current = storage.dataValues.tokenPage

                    // On définit l'interval à récupérer
                    const itemsPerPage = 15; // Nombre d'objets par page
                    const firstObject = (index - 1) * itemsPerPage
                    const lastObject = firstObject + itemsPerPage

                    // On filtre le token
                    const filtered = tokens.slice(firstObject, lastObject)

                    // On formatte les bouttons
                    const buttons = [formIndexButtonsTokens(index, index)]
                    let inventory = "ID                                     Rarity\n\n"
                    let i = 0
                    let currentButton = new ActionRowBuilder()

                    // On construit le tableau
                    for (const token of filtered) {

                        // On vérifie que c'est pas le dernier
                        const isFirst = i === 0 ? true : false

                        // On commence par construire le token
                        const id = token.tokenId
                        const rank = token.rarity
                        const name = token.name

                        const part1 = reduceText(name, 30) + " #" + id
                        const part2 = rank ? rank : "-"

                        const spaceSize = 45 - (part1.length + part2.toString().length)
                        let spaceLenght = ""
                        for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

                        inventory += part1 + spaceLenght + part2 + "\n"

                        // En parallèle on construit les bouttons
                        if (i % 5 === 0 && !isFirst) {

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
                        if (i + 1 === filtered.length) {
                            buttons.push(currentButton)
                        }

                        i++
                    }

                    // On récupère la réponse d'origine 
                    // On modifie le field contenant la table et le page index
                    let embed = interaction.message.embeds[0].data
                    embed.fields.find(obj => obj.name === "Inventory:").value = "```" + inventory + "```"
                    embed.fields.find(obj => obj.name === "Page:").value = "`[" + index + "/" + index + "]`"

                    // Pour finir on modifie l'embed ainsi que les data de l'interaction
                    await portfolio_nft.update({ tokenPage: "1", currentTokens: JSON.stringify(filtered) }, { where: { authorId: authorId, serverId: serverId, treated: null } });
                    await interaction.update({ embeds: [embed], components: buttons });

                } else if (action === 'tokenPreviousPage') {

                    // On récupère les data qui ont été store
                    const storage = await portfolio_nft.findOne({ where: { authorId: authorId, serverId: serverId, treated: null } })
                    const tokens = JSON.parse(storage.dataValues.tokens)
                    const address = storage.dataValues.address
                    const index = storage.dataValues.tokenIndex
                    const current = storage.dataValues.tokenPage

                    // On définit l'interval à récupérer
                    const itemsPerPage = 15; // Nombre d'objets par page
                    const newPage = parseInt(current) - 1
                    const firstObject = (newPage - 1) * itemsPerPage
                    const lastObject = firstObject + itemsPerPage

                    // On filtre le token
                    const filtered = tokens.slice(firstObject, lastObject)

                    // On formatte les bouttons
                    const buttons = [formIndexButtonsTokens(newPage, index)]
                    let inventory = "ID                                     Rarity\n\n"
                    let i = 0
                    let currentButton = new ActionRowBuilder()

                    // On construit le tableau
                    for (const token of filtered) {

                        // On vérifie que c'est pas le dernier
                        const isFirst = i === 0 ? true : false

                        // On commence par construire le token
                        const id = token.tokenId
                        const rank = token.rarity
                        const name = token.name

                        const part1 = reduceText(name, 30) + " #" + id
                        const part2 = rank ? rank : "-"

                        const spaceSize = 45 - (part1.length + part2.toString().length)
                        let spaceLenght = ""
                        for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

                        inventory += part1 + spaceLenght + part2 + "\n"

                        // En parallèle on construit les bouttons
                        if (i % 5 === 0 && !isFirst) {

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
                        if (i + 1 === filtered.length) {
                            buttons.push(currentButton)
                        }

                        i++
                    }

                    // On récupère la réponse d'origine 
                    // On modifie le field contenant la table et le page index
                    let embed = interaction.message.embeds[0].data
                    embed.fields.find(obj => obj.name === "Inventory:").value = "```" + inventory + "```"
                    embed.fields.find(obj => obj.name === "Page:").value = "`[" + newPage + "/" + index + "]`"

                    // Pour finir on modifie l'embed ainsi que les data de l'interaction
                    await portfolio_nft.update({ tokenPage: newPage.toString(), currentTokens: JSON.stringify(filtered) }, { where: { authorId: authorId, serverId: serverId, treated: null } });
                    await interaction.update({ embeds: [embed], components: buttons });

                } else if (action === 'tokenNextPage') {

                    // On récupère les data qui ont été store
                    const storage = await portfolio_nft.findOne({ where: { authorId: authorId, serverId: serverId, treated: null } })
                    const tokens = JSON.parse(storage.dataValues.tokens)
                    const address = storage.dataValues.address
                    const index = storage.dataValues.tokenIndex
                    const current = storage.dataValues.tokenPage

                    // On définit l'interval à récupérer
                    const itemsPerPage = 15; // Nombre d'objets par page
                    const newPage = parseInt(current) + 1
                    const firstObject = (newPage - 1) * itemsPerPage
                    const lastObject = firstObject + itemsPerPage

                    // On filtre le token
                    const filtered = tokens.slice(firstObject, lastObject)

                    // On formatte les bouttons
                    const buttons = [formIndexButtonsTokens(newPage, index)]
                    let inventory = "ID                                     Rarity\n\n"
                    let i = 0
                    let currentButton = new ActionRowBuilder()

                    // On construit le tableau
                    for (const token of filtered) {

                        // On vérifie que c'est pas le dernier
                        const isFirst = i === 0 ? true : false

                        // On commence par construire le token
                        const id = token.tokenId
                        const rank = token.rarity
                        const name = token.name

                        const part1 = reduceText(name, 30) + " #" + id
                        const part2 = rank ? rank : "-"

                        const spaceSize = 45 - (part1.length + part2.toString().length)
                        let spaceLenght = ""
                        for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

                        inventory += part1 + spaceLenght + part2 + "\n"

                        // En parallèle on construit les bouttons
                        if (i % 5 === 0 && !isFirst) {

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
                        if (i + 1 === filtered.length) {
                            buttons.push(currentButton)
                        }

                        i++
                    }

                    // On récupère la réponse d'origine 
                    // On modifie le field contenant la table et le page index
                    let embed = interaction.message.embeds[0].data
                    embed.fields.find(obj => obj.name === "Inventory:").value = "```" + inventory + "```"
                    embed.fields.find(obj => obj.name === "Page:").value = "`[" + newPage + "/" + index + "]`"

                    // Pour finir on modifie l'embed ainsi que les data de l'interaction
                    await portfolio_nft.update({ tokenPage: newPage.toString(), currentTokens: JSON.stringify(filtered) }, { where: { authorId: authorId, serverId: serverId, treated: null } });
                    await interaction.update({ embeds: [embed], components: buttons });

                } else if (action === 'tokenSelection') {

                    // On commence par récupérer le token
                    const matchB = customId.match(/@(\d+)?/);
                    const token = matchB[1] || null

                    // On récupère les infos de la DB, et on les modifie
                    const storage = await portfolio_nft.findOne({ where: { authorId: authorId, serverId: serverId, treated: null } })
                    const transaction = JSON.parse(storage.dataValues.transaction)

                    // on enregistre le token
                    transaction.tokenId = token

                    // On update l'entrée dans la database
                    await portfolio_nft.update({
                        transaction: JSON.stringify(transaction)
                    }, { where: { authorId: authorId, serverId: serverId, treated: null } })



                    const modal = new ModalBuilder()
                        .setCustomId('modal_portfolio_nft_infra_transfer')
                        .setTitle('Transfer an NFT');

                    // Add components to modal

                    // Create the text input components
                    const fieldA = new TextInputBuilder()
                        .setCustomId('modal_portfolio_nft_infra_transferR1')
                        .setLabel("Receiver address:")
                        .setPlaceholder("0x...")
                        .setStyle(TextInputStyle.Short)
                        .setMinLength(42)
                        .setMaxLength(42)
                        .setRequired(true)


                    // An action row only holds one text input,
                    // so you need one action row per text input.
                    const rowA = new ActionRowBuilder().addComponents(fieldA);

                    // Add inputs to the modal
                    modal.addComponents(rowA)

                    // Show the modal to the user
                    await interaction.showModal(modal);


                } else if (action === 'return') {

                    // On commence par récupérer le token
                    const matchB = customId.match(/@(.+)?/);
                    const id = matchB[1] || null

                    if (id === 'tokenSelector') {

                        // On récupère les infos de la DB, et on les modifie
                        const storage = await portfolio_nft.findOne({ where: { authorId: authorId, serverId: serverId, treated: null } })
                        const current = JSON.parse(storage.dataValues.current)
                        const action = storage.dataValues.action

                        // On construit la drop down list
                        const dropdown = createDropdownList(current, action)

                        // On construit l'embed
                        const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Transfer an NFT")
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setDescription("To begin, select the collection you want to list from the drop-down list below.\n\nThe drop-down list only contains collections that are currently displayed on the main dashboard.")
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.update({ embeds: [setfpEmbedNotForYou], components: [dropdown], ephemeral: true });

                    }


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
            let reportCommand = "/admin-botOff"

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



function formIndexButtons(currentPage, totalPages, buttonA) {
    // Déterminez quel bouton doit être désactivé
    const isFirstPage = parseInt(currentPage) === 1;
    const isLastPage = parseInt(currentPage) === parseInt(totalPages)

    // Boutons
    const buttonD = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_infra_firstPage')
                .setLabel('First page')
                .setStyle(2)
                .setDisabled(isFirstPage),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_infra_previousPage')
                .setLabel('Previous page')
                .setStyle(2)
                .setDisabled(isFirstPage),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_infra_nextPage')
                .setLabel('Next page')
                .setStyle(2)
                .setDisabled(isLastPage),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_infra_lastPage')
                .setLabel('Last page')
                .setStyle(2)
                .setDisabled(isLastPage),
        );


    const buttonB = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_exec_list')
                .setLabel('List')
                .setStyle(3)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_exec_bulkList')
                .setLabel('Bulk List')
                .setStyle(3)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_exec_acceptBid')
                .setLabel('Accept Bid')
                .setStyle(3)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_exec_acceptBulkBid')
                .setLabel('Accept Bulk Bid')
                .setStyle(3)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_exec_transfer')
                .setLabel('Transfer')
                .setStyle(3),
        );

    const buttonC = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_infra_refresh')
                .setLabel('🔁 Refresh')
                .setStyle(1),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_infra_tutorial')
                .setLabel('📑 Tutorial')
                .setStyle(1),
            new ButtonBuilder()
                .setCustomId('button_nft_tradepanel_setup')
                .setLabel('💻 Setup')
                .setStyle(1),
        );

    // Retourne un tableau de toutes les rangées de boutons
    return [buttonD, buttonA, buttonB, buttonC];
}

function forSortButtons(sort, buttonD) {

    let byABC = 2
    let byFloor = 2
    let byValue = 2

    if (sort === 'sortbyabc') { byABC = 1 }
    else if (sort === 'sortbyfloor') { byFloor = 1 }
    else if (sort === 'sortbyvalue') { byValue = 1 }


    // Bouttons
    const buttonA = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_infra_collectionView')
                .setLabel('Global View')
                .setStyle(1),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_infra_tokenView')
                .setLabel('Token View')
                .setStyle(2),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_infra_sortbyvalue')
                .setLabel('Sort by value')
                .setStyle(byValue),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_infra_sortbyfloor')
                .setLabel('Sort by floor')
                .setStyle(byFloor),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_infra_sortbyabc')
                .setLabel('Sort by abc')
                .setStyle(byABC),
        );


    const buttonB = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_exec_list')
                .setLabel('List')
                .setStyle(3)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_exec_bulkList')
                .setLabel('Bulk List')
                .setStyle(3)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_exec_acceptBid')
                .setLabel('Accept Bid')
                .setStyle(3)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_exec_acceptBulkBid')
                .setLabel('Accept Bulk Bid')
                .setStyle(3)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_exec_transfer')
                .setLabel('Transfer')
                .setStyle(3),
        );

    const buttonC = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_infra_refresh')
                .setLabel('🔁 Refresh')
                .setStyle(1),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_infra_tutorial')
                .setLabel('📑 Tutorial')
                .setStyle(1),
            new ButtonBuilder()
                .setCustomId('button_nft_tradepanel_setup')
                .setLabel('💻 Setup')
                .setStyle(1),
        );

    // Retourne un tableau de toutes les rangées de boutons
    return [buttonD, buttonA, buttonB, buttonC];

}

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
        );


    // Retourne un tableau de toutes les rangées de boutons
    return buttonD;
}


function createDropdownList(collectionArray, action) {

    function formatWallet(input) {
        return input.length > 35 ? `${input.substring(0, 5)}…${input.substring(input.length - 4)}` : input;
    }

    const selectMenuBuilder = new StringSelectMenuBuilder()
        .setCustomId('selector_portfolio_nft_exec_' + action)  // Changez cela en l'ID que vous préférez
        .setPlaceholder('Select a collection to list');

    collectionArray.forEach(coll => {
        const option = new StringSelectMenuOptionBuilder()
            .setValue(coll.contract)  // Utilisez le contract comme valeur
            .setLabel(coll.name)  // Utilisez le nom comme libellé
            .setDescription(`CA: ${formatWallet(coll.contract)} | Floor: ${coll.floor} | Held: ${coll.owned}`)
        // .setEmoji('📜')  // Facultatif: ajoutez une emoji
        //.setDefault(collection.owned === '1')  // Facultatif: sélectionnez par défaut les collections possédées
        // .build();

        selectMenuBuilder.addOptions(option);
    });

    const actionRow = new ActionRowBuilder()
        .addComponents(selectMenuBuilder);

    return actionRow;
}
