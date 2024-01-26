/**
 * @file Sample button interaction
 * @author JAYZHVJ
 * @since 3.0.0
 * @version 3.2.2
 */

/**
 * @type {import('../../../typings').ButtonInteractionCommand}
 */


const { ButtonInteraction } = require('discord.js');
const { ActionRowBuilder, EmbedBuilder, ButtonBuilder } = require("discord.js");
const { accessSql, profileData, adminsql, reportsql, sequelize, interactionData } = require('../../../events/database');
const moment = require('moment');

// Fonctions
// On récupère les nodes et API
const { reservoirI } = require("../../../config/web3config")

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
            const match = customId.match(/button_nft_portfolio_infra_(.+)/);

            if (match && match[1]) {

                const action = match[1];


                if (action === "firstPage") {

                    // On récupère les data qui ont été store
                    const storage = await interactionData.findOne({ where: { authorId: authorId, commandName: 'nft-portfolio', serverId: serverId } })
                    const portfolio = JSON.parse(storage.dataValues.embed1)
                    const address = storage.dataValues.walletAddress
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
                    await interactionData.update({ actualPage: "1", }, { where: { authorId: authorId, commandName: 'nft-portfolio', serverId: serverId } });
                    await interaction.update({ embeds: [embed], components: buttons });

                } else if (action === 'lastPage') {

                    // On récupère les data qui ont été store
                    const storage = await interactionData.findOne({ where: { authorId: authorId, commandName: 'nft-portfolio', serverId: serverId } })
                    const portfolio = JSON.parse(storage.dataValues.embed1)
                    const address = storage.dataValues.walletAddress
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
                    await interactionData.update({ actualPage: index, }, { where: { authorId: authorId, commandName: 'nft-portfolio', serverId: serverId } });
                    await interaction.update({ embeds: [embed], components: buttons });

                } else if (action === 'previousPage') {

                    // On récupère les data qui ont été store
                    const storage = await interactionData.findOne({ where: { authorId: authorId, commandName: 'nft-portfolio', serverId: serverId } })
                    const portfolio = JSON.parse(storage.dataValues.embed1)
                    const address = storage.dataValues.walletAddress
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
                    await interactionData.update({ actualPage: newPage.toString(), }, { where: { authorId: authorId, commandName: 'nft-portfolio', serverId: serverId } });
                    await interaction.update({ embeds: [embed], components: buttons });

                } else if (action === 'nextPage') {

                    // On récupère les data qui ont été store
                    const storage = await interactionData.findOne({ where: { authorId: authorId, commandName: 'nft-portfolio', serverId: serverId } })
                    const portfolio = JSON.parse(storage.dataValues.embed1)
                    const address = storage.dataValues.walletAddress
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
                    await interactionData.update({ actualPage: newPage.toString(), }, { where: { authorId: authorId, commandName: 'nft-portfolio', serverId: serverId } });
                    await interaction.update({ embeds: [embed], components: buttons });

                } else if (action === 'sortbyvalue') {


                    // On récupère les data qui ont été store
                    const storage = await interactionData.findOne({ where: { authorId: authorId, commandName: 'nft-portfolio', serverId: serverId } })
                    const portfolio = JSON.parse(storage.dataValues.embed1)
                    const address = storage.dataValues.walletAddress
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
                    await interactionData.update({ embed1: JSON.stringify(portfolioByValue), }, { where: { authorId: authorId, commandName: 'nft-portfolio', serverId: serverId } });
                    await interaction.update({ embeds: [embed], components: buttons });



                } else if (action === 'sortbyfloor') {

                    // On récupère les data qui ont été store
                    const storage = await interactionData.findOne({ where: { authorId: authorId, commandName: 'nft-portfolio', serverId: serverId } })
                    const portfolio = JSON.parse(storage.dataValues.embed1)
                    const address = storage.dataValues.walletAddress
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
                    await interactionData.update({ embed1: JSON.stringify(portfolioByFloor), }, { where: { authorId: authorId, commandName: 'nft-portfolio', serverId: serverId } });
                    await interaction.update({ embeds: [embed], components: buttons });



                } else if (action === 'sortbyabc') {


                    // On récupère les data qui ont été store
                    const storage = await interactionData.findOne({ where: { authorId: authorId, commandName: 'nft-portfolio', serverId: serverId } })
                    const portfolio = JSON.parse(storage.dataValues.embed1)
                    const address = storage.dataValues.walletAddress
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
                    await interactionData.update({ embed1: JSON.stringify(portfolioByABC), }, { where: { authorId: authorId, commandName: 'nft-portfolio', serverId: serverId } });
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
                                .setStyle(3),
                            new ButtonBuilder()
                                .setCustomId('button_nft_portfolio_exec_bulkList')
                                .setLabel('Bulk List')
                                .setStyle(3),
                            new ButtonBuilder()
                                .setCustomId('button_nft_portfolio_exec_acceptBid')
                                .setLabel('Accept Bid')
                                .setStyle(3),
                            new ButtonBuilder()
                                .setCustomId('button_nft_portfolio_exec_acceptBulkBid')
                                .setLabel('Accept Bulk Bid')
                                .setStyle(3),
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
                    const storage = await interactionData.findOne({ where: { authorId: authorId, commandName: 'nft-portfolio', serverId: serverId } })
                    const address = storage.dataValues.walletAddress

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
                    await interactionData.update({
                        authorId: authorId,
                        authorName: authorName,
                        serverId: serverId,
                        commandName: "nft-portfolio",
                        interactionId: interaction.id,
                        walletAddress: address,
                        embed1: JSON.stringify(portfolio),
                        pageIndex: index.toString(),
                        actualPage: "1",
                    }, { where: { authorId: authorId, commandName: "nft-portfolio", serverId: serverId } })


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

                    // On update l'interaction
                    await interactionData.update({
                        authorId: authorId,
                        authorName: authorName,
                        serverId: serverId,
                        commandName: "nft-portfolio",
                        interactionId: interaction.id,
                        walletAddress: address,
                        embed1: JSON.stringify(portfolio),
                        pageIndex: index.toString(),
                        actualPage: "1",
                    }, { where: { authorId: authorId, commandName: "nft-portfolio", serverId: serverId } })


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
                .setStyle(3),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_exec_bulkList')
                .setLabel('Bulk List')
                .setStyle(3),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_exec_acceptBid')
                .setLabel('Accept Bid')
                .setStyle(3),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_exec_acceptBulkBid')
                .setLabel('Accept Bulk Bid')
                .setStyle(3),
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
                .setStyle(3),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_exec_bulkList')
                .setLabel('Bulk List')
                .setStyle(3),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_exec_acceptBid')
                .setLabel('Accept Bid')
                .setStyle(3),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_exec_acceptBulkBid')
                .setLabel('Accept Bulk Bid')
                .setStyle(3),
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
