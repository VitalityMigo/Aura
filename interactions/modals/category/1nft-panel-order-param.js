

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

const decrypt = require("../../../functions/decrypt")
const { encodePoolWrapData } = require("../../../functions/1nft-utils")
const { buttonBiddingParamsConfig } = require("../../../functions/nft/helpers")

const markets = require("../../../contracts/nft/config.json")

module.exports = {
    id: "modal_nft_panel_order_param_exec_",

    async execute(interaction) {


        //Récupérer informations de l'utilisateur de la commande
        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id
        let botId = interaction.applicationId

        try {

            console.log("Initialization: executed ✅")

            // On récupère les infos dans l'ID
            const customId = interaction.customId
            const match = customId.match(/modal_nft_panel_order_param_exec_(.+)@(.+)/);

            if (match && match[1] && match[2]) {

                // On récupère les infos dans l'ID
                const param = match[1]
                const identifier = match[2]

                // On va chercher les infos de storage
                const storage = await exe_nft.findOne({ where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifier } })
                const action = storage.dataValues.action
                const trade = JSON.parse(storage.dataValues.trade)
                const settings = JSON.parse(storage.dataValues.settings)

                if (action === "list") {
                    // C'est un listing
                    // On defer l'update pour laisser plus de temps à la réponse
                    await interaction.deferUpdate({ ephemeral: true })

                    if (param === 'price') {

                        // On récupère et vérifie la validité du prix
                        const price = parseFloat(interaction.fields.getTextInputValue('rowA'))
                        const isValid = !isNaN(price)

                        if (isValid) {

                            // On met à jour le prix dans l'objet trade
                            trade.trade.price = price

                            // On récupère la réponse d'origine 
                            // On modifie le field contenant la table et le page index
                            const embed = interaction.message.embeds[0].data
                            embed.fields.find(obj => obj.name === "Price:").value = "`" + parseFloat(price).toFixed(3) + "Ξ`"

                            // Pour finir on modifie l'embed ainsi que les data du trade dans la DB
                            await exe_nft.update({ trade: JSON.stringify(trade) }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifier } });
                            await interaction.editReply({ embeds: [embed] });

                        } else {

                            const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("NFT Trading")
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setDescription("The price provided isn't valid, please make sure it's a listing price. Please try again or contact a team member if you need any help.")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setTimestamp()
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.reply({ embeds: [setfpEmbedNotForYou], ephemeral: true });

                        }

                    } else {
                        console.log("Paramêtre non trouvé...")
                    }

                } else if (action === "bid") {
                    // C'est une bid

                    await interaction.deferUpdate({ ephemeral: true })

                    if (param === 'price') {
                        // On modifie le prix

                        // On récupère et vérifie la validité du prix
                        const price = parseFloat(interaction.fields.getTextInputValue('rowA'))
                        const isValid = !isNaN(price)

                        if (isValid) {

                            // On met à jour le prix dans l'objet trade
                            trade.trade.price = price
                            trade.trade.value = price * trade.trade.quantity

                            // On fait la verif des values par rapport au wrap de token pour les
                            // marketplaces possible (actuellement Opensea et Blur)
                            for (const market of trade.swap) {
                                // On récupère l'ID
                                const id = market.id

                                // On vérifie que la pool a été calculé, sinon cela se fera au moment
                                // du changement de marketplace dans les params de la bid.
                                if (market.hasPool !== null) {
                                    // On définit les values de base
                                    const poolBalance = market.balance // La balance actuelle de token de pool
                                    const hasPool = trade.trade.value <= poolBalance ? true : false // Assez de wrap ?
                                    const wrapGap = trade.trade.value - poolBalance // L'écart nescessaire
                                    const expected = hasPool ? 0 : trade.gas.limit * (trade.gas.price * 1.1)

                                    // On calcul le wrap potentiel
                                    const hasEth = trade.ethBalance > (wrapGap + expected) // A assez de fond ?
                                    const encoded = encodePoolWrapData(id)

                                    // On update les value dans le tableau trade
                                    trade.swap.find(i => i.id === id).hasPool = hasPool
                                    trade.swap.find(i => i.id === id).balance = poolBalance
                                    trade.swap.find(i => i.id === id).hasEth = hasPool ? null : hasEth
                                    trade.swap.find(i => i.id === id).from = hasPool ? null : decrypt(settings.sender)
                                    trade.swap.find(i => i.id === id).to = hasPool ? null : encoded.to
                                    trade.swap.find(i => i.id === id).data = hasPool ? null : encoded.data
                                    trade.swap.find(i => i.id === id).value = hasPool ? null : wrapGap
                                }
                            }

                            // On formatte quelques données. Une particularité pour const bids est que
                            // on fait une condition, car si le user n'a pas les fonds wrapped et peut pas 
                            // compléter avec les fonds natif (ETH), on renvoi une erreur
                            const source = markets.find(i => i.id === trade.source)
                            const currSwap = trade.swap.find(i => i.id === trade.source)

                            const hasPool = currSwap.hasPool // On vérifie si les fonds sont dispos.
                            const hasFundAbsolute = currSwap.hasEth !== false // On vérifie si les fonds sont dispos.

                            // On modifie les valeurs de gas expected
                            trade.gas.expected = hasPool ? 0 : (trade.gas.price * 1.1) * trade.gas.limit

                            // On formatte la valeur de l'embed info et data
                            const bids = hasFundAbsolute ? // Si pas besoin, égal à null, si besoin et à les fonds, égal à true.
                                "Target: " + trade.trade.name + "\nWrapped: " + (hasPool ? 'Yes' : 'No') + "\n\nGas Fees: " + parseFloat(trade.gas.expected).toFixed(4) + "Ξ\nTotal Cost: " + parseFloat(trade.gas.expected).toFixed(4) + "Ξ                       "
                                : "Your total balance of " + source.poolSymbol + " + ETH is not sufficient to execute this bid. "  // La balance total n'est pa suffisante
                            const info = "Price: `" + parseFloat(price).toFixed(3) + "Ξ`\nSize: `" + trade.trade.quantity + "`\nTotal: `" + parseFloat(trade.trade.value).toFixed(3) + "Ξ`"

                            // On définit les components
                            const buttons = buttonBiddingParamsConfig(trade, identifier, hasFundAbsolute, hasPool)

                            // On récupère la réponse d'origine 
                            // On modifie le field contenant la table et le page index
                            const embed = interaction.message.embeds[0].data
                            embed.fields.find(obj => obj.name === "Bids:").value = info
                            embed.fields.find(obj => obj.name === "Data:").value = "```" + bids + "```"

                            // Pour finir on modifie l'embed ainsi que les data du trade dans la DB
                            await exe_nft.update({ trade: JSON.stringify(trade) }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifier } });
                            await interaction.editReply({ embeds: [embed], components: buttons });

                        } else {

                            const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("NFT Trading")
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setDescription("The price provided isn't valid, please make sure it's a listing price. Please try again or contact a team member if you need any help.")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setTimestamp()
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.reply({ embeds: [setfpEmbedNotForYou], ephemeral: true });

                        }

                    } else if (param === 'amount') {
                        // On modifie le prix

                        // On récupère et vérifie la validité du prix
                        const amount = parseInt(interaction.fields.getTextInputValue('rowA'))
                        const isValid = !isNaN(amount)

                        if (isValid) {

                            // On met à jour le prix dans l'objet trade
                            trade.trade.quantity = amount
                            trade.trade.value = amount * trade.trade.price

                            // On fait la verif des values par rapport au wrap de token pour les
                            // marketplaces possible (actuellement Opensea et Blur)
                            for (const market of trade.swap) {
                                // On récupère l'ID
                                const id = market.id

                                // On vérifie que la pool a été calculé, sinon cela se fera au moment
                                // du changement de marketplace dans les params de la bid.
                                if (market.hasPool !== null) {
                                    // On définit les values de base
                                    const poolBalance = market.balance // La balance actuelle de token de pool
                                    const hasPool = trade.trade.value <= poolBalance ? true : false // Assez de wrap ?
                                    const wrapGap = trade.trade.value - poolBalance // L'écart nescessaire
                                    const expected = hasPool ? 0 : trade.gas.limit * (trade.gas.price * 1.1)

                                    // On calcul le wrap potentiel
                                    const hasEth = trade.ethBalance > (wrapGap + expected) // A assez de fond ?
                                    const encoded = encodePoolWrapData(id)

                                    // On update les value dans le tableau trade
                                    trade.swap.find(i => i.id === id).hasPool = hasPool
                                    trade.swap.find(i => i.id === id).balance = poolBalance
                                    trade.swap.find(i => i.id === id).hasEth = hasPool ? null : hasEth
                                    trade.swap.find(i => i.id === id).from = hasPool ? null : decrypt(settings.sender)
                                    trade.swap.find(i => i.id === id).to = hasPool ? null : encoded.to
                                    trade.swap.find(i => i.id === id).data = hasPool ? null : encoded.data
                                    trade.swap.find(i => i.id === id).value = hasPool ? null : wrapGap
                                }
                            }

                            // On formatte quelques données. Une particularité pour const bids est que
                            // on fait une condition, car si le user n'a pas les fonds wrapped et peut pas 
                            // compléter avec les fonds natif (ETH), on renvoi une erreur
                            const source = markets.find(i => i.id === trade.source)
                            const currSwap = trade.swap.find(i => i.id === trade.source)

                            const hasPool = currSwap.hasPool // On vérifie si les fonds sont dispos.
                            const hasFundAbsolute = currSwap.hasEth !== false // On vérifie si les fonds sont dispos.

                            // On modifie les valeurs de gas expected
                            trade.gas.expected = hasPool ? 0 : (trade.gas.price * 1.1) * trade.gas.limit

                            // On formatte la valeur de l'embed info et data
                            const bids = hasFundAbsolute ? // Si pas besoin, égal à null, si besoin et à les fonds, égal à true.
                                "Target: " + trade.trade.name + "\nWrapped: " + (hasPool ? 'Yes' : 'No') + "\n\nGas Fees: " + parseFloat(trade.gas.expected).toFixed(4) + "Ξ\nTotal Cost: " + parseFloat(trade.gas.expected).toFixed(4) + "Ξ                       "
                                : "Your total balance of " + source.poolSymbol + " + ETH is not sufficient to execute this bid. "  // La balance total n'est pa suffisante
                            const info = "Price: `" + parseFloat(trade.trade.price).toFixed(3) + "Ξ`\nSize: `" + amount + "`\nTotal: `" + parseFloat(trade.trade.value).toFixed(3) + "Ξ`"

                            // On définit les components
                            const buttons = buttonBiddingParamsConfig(trade, identifier, hasFundAbsolute, hasPool)

                            // On récupère la réponse d'origine 
                            // On modifie le field contenant la table et le page index
                            const embed = interaction.message.embeds[0].data
                            embed.fields.find(obj => obj.name === "Bids:").value = info
                            embed.fields.find(obj => obj.name === "Data:").value = "```" + bids + "```"

                            // Pour finir on modifie l'embed ainsi que les data du trade dans la DB
                            await exe_nft.update({ trade: JSON.stringify(trade) }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifier } });
                            await interaction.editReply({ embeds: [embed], components: buttons });

                        } else {

                            const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("NFT Trading")
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setDescription("The price provided isn't valid, please make sure it's a listing price. Please try again or contact a team member if you need any help.")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setTimestamp()
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.reply({ embeds: [setfpEmbedNotForYou], ephemeral: true });

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

                await interaction.reply({ embeds: [setfpEmbedNotForYou], ephemeral: true });
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
