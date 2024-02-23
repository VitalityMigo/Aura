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
const { ActionRowBuilder, EmbedBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const { accessSql, profileData, adminsql, reportsql, sequelize, exe_nft } = require('../../../events/database');
const moment = require('moment');

const markets = require("../../../contracts/nft/config.json")

const decrypt = require("../../../functions/decrypt")
const addTimeount = require("../../../functions/addtimeout")
const { buttonListingParamsConfig, buttonBiddingParamsConfig } = require("../../../functions/nft/helpers")
const { getGasPrice, encodeSetApprovalForAll, isApprovedForAll, getPoolBalance, encodePoolWrapData, getEthBalance } = require("../../../functions/1nft-utils")

module.exports = {
    id: 'button_nft_panel_order_param_exec_',


    async execute(interaction) {
        if (!(interaction instanceof ButtonInteraction)) return;

        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id
        let botId = interaction.applicationId

        try {

            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")


            // On récupère les infos dans l'ID
            const customId = interaction.customId
            const match = customId.match(/button_nft_panel_order_param_exec_(.+)@(.+)/);


            if (match && match[1] && match[2]) {

                const param = match[1];
                const identifier = match[2];


                // On va chercher les infos de storage
                const storage = await exe_nft.findOne({ where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifier } })
                const trade = JSON.parse(storage.dataValues.trade)
                const settings = JSON.parse(storage.dataValues.settings)
                const action = storage.dataValues.action

                if (action === 'list') {

                    // En premier on met les expire
                    if (param === '1day') {

                        // On définit les valeurs de temps
                        const time = Math.floor(Date.now() / 1000)
                        const sec1Day = 86400
                        const newExpire = time + sec1Day
                        const newDisplay = '1 day'

                        // On modifie les valeurs d'expiration dans l'objet trade
                        trade.trade.expire = newExpire
                        trade.trade.expireDisplay = newDisplay

                        // On définit les components
                        const buttons = buttonListingParamsConfig(trade, identifier)

                        // On récupère la réponse d'origine 
                        // On modifie le field contenant la table et le page index
                        const embed = interaction.message.embeds[0].data
                        embed.fields.find(obj => obj.name === "Duration:").value = "`" + newDisplay + "`"

                        // Pour finir on modifie l'embed ainsi que les data du trade dans la DB
                        await exe_nft.update({ trade: JSON.stringify(trade) }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifier } });
                        await interaction.update({ embeds: [embed], components: buttons });

                    } else if (param === '3day') {

                        // On définit les valeurs de temps
                        const time = Math.floor(Date.now() / 1000)
                        const sec3Day = 259200
                        const newExpire = time + sec3Day
                        const newDisplay = '3 days'

                        // On modifie les valeurs d'expiration dans l'objet trade
                        trade.trade.expire = newExpire
                        trade.trade.expireDisplay = newDisplay

                        // On définit les components
                        const buttons = buttonListingParamsConfig(trade, identifier)

                        // On récupère la réponse d'origine 
                        // On modifie le field contenant la table et le page index
                        const embed = interaction.message.embeds[0].data
                        embed.fields.find(obj => obj.name === "Duration:").value = "`" + newDisplay + "`"

                        // Pour finir on modifie l'embed ainsi que les data du trade dans la DB
                        await exe_nft.update({ trade: JSON.stringify(trade) }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifier } });
                        await interaction.update({ embeds: [embed], components: buttons });

                    } else if (param === '7day') {

                        // On définit les valeurs de temps
                        const time = Math.floor(Date.now() / 1000)
                        const sec7Day = 604800
                        const newExpire = time + sec7Day
                        const newDisplay = '7 days'

                        // On modifie les valeurs d'expiration dans l'objet trade
                        trade.trade.expire = newExpire
                        trade.trade.expireDisplay = newDisplay

                        // On définit les components
                        const buttons = buttonListingParamsConfig(trade, identifier)

                        // On récupère la réponse d'origine 
                        // On modifie le field contenant la table et le page index
                        const embed = interaction.message.embeds[0].data
                        embed.fields.find(obj => obj.name === "Duration:").value = "`" + newDisplay + "`"

                        // Pour finir on modifie l'embed ainsi que les data du trade dans la DB
                        await exe_nft.update({ trade: JSON.stringify(trade) }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifier } });
                        await interaction.update({ embeds: [embed], components: buttons });

                    } else if (param === '30day') {

                        // On définit les valeurs de temps
                        const time = Math.floor(Date.now() / 1000)
                        const sec30Day = 2592000
                        const newExpire = time + sec30Day
                        const newDisplay = '30 days'

                        // On modifie les valeurs d'expiration dans l'objet trade
                        trade.trade.expire = newExpire
                        trade.trade.expireDisplay = newDisplay

                        // On définit les components
                        const buttons = buttonListingParamsConfig(trade, identifier)

                        // On récupère la réponse d'origine 
                        // On modifie le field contenant la table et le page index
                        const embed = interaction.message.embeds[0].data
                        embed.fields.find(obj => obj.name === "Duration:").value = "`" + newDisplay + "`"

                        // Pour finir on modifie l'embed ainsi que les data du trade dans la DB
                        await exe_nft.update({ trade: JSON.stringify(trade) }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifier } });
                        await interaction.update({ embeds: [embed], components: buttons });
                    } else if (param === 'marketplace') {

                        // On définit les infos de la nouvelle source
                        const currSource = trade.source
                        const source = markets.find(i => i.id !== currSource)

                        // On regarde ce que ça change en terme d'approval et
                        // effectue les actions néscessaires en cas de besoin d'approval
                        // notamment générer les datas
                        const sourceApp = trade.approval.find(i => i.id === source.id)
                        let isApproved = sourceApp.isApproved
                        if (sourceApp.isApproved === null) {
                            // On commence par vérifier si la source est approuver
                            isApproved = await isApprovedForAll(trade.trade.contract, decrypt(settings.sender), source.id)
                            trade.approval.find(i => i.id === source.id).isApproved = isApproved
                            trade.approval.find(i => i.id === source.id).from = isApproved ? null : decrypt(settings.sender)
                            trade.approval.find(i => i.id === source.id).to = isApproved ? null : trade.trade.contract
                            trade.approval.find(i => i.id === source.id).data = isApproved ? null : encodeSetApprovalForAll(source.id, true)
                        }

                        // On modifie les informations du tableau trade actuel
                        trade.source = source.id
                        trade.trade.source = source.id
                        trade.gas.expected = isApproved ? 0 : trade.gas.price * trade.gas.average * 0.6

                        // On définit la value du tableau listing
                        const listing = "Target: " + trade.trade.name + " #" + trade.trade.tokenId + "\nApproved: " + (isApproved ? 'Yes' : 'No') + "\n\nGas Fees: " + parseFloat(trade.gas.expected).toFixed(4) + "Ξ\nTotal Cost: " + parseFloat(trade.gas.expected).toFixed(4) + "Ξ                       "

                        // On définit les components
                        const buttons = buttonListingParamsConfig(trade, identifier)

                        // On récupère la réponse d'origine 
                        // On modifie le field contenant la table et le page index
                        const embed = interaction.message.embeds[0].data
                        embed.fields.find(obj => obj.name === "Marketplace:").value = source.display
                        embed.fields.find(obj => obj.name === "Listing:").value = "```" + listing + "```"

                        // Pour finir on modifie l'embed ainsi que les data du trade dans la DB
                        await exe_nft.update({ trade: JSON.stringify(trade) }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifier } });
                        await interaction.update({ embeds: [embed], components: buttons });

                    } else if (param === 'price') {

                        const modal = new ModalBuilder()
                            .setCustomId('modal_nft_panel_order_param_exec_price@' + identifier)
                            .setTitle('Modify Price');

                        // Add components to modal

                        // Create the text input components
                        const field = new TextInputBuilder()
                            .setCustomId('rowA')
                            .setLabel("New Price")
                            .setPlaceholder("The listing's price in ETH (i.g 0.02 for 0.02 ETH)")
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)

                        // An action row only holds one text input,
                        // so you need one action row per text input.
                        const actionRow = new ActionRowBuilder().addComponents(field);

                        // Add inputs to the modal
                        modal.addComponents(actionRow)

                        // Show the modal to the user
                        await interaction.showModal(modal);



                    }

                } else if (action === 'bid') {

                    if (param === '10day') {

                        // On définit les valeurs de temps
                        const time = Math.floor(Date.now() / 1000)
                        const sec10Day = 865000 // On set à 10 jour et un peu plus
                        const newExpire = time + sec10Day
                        const newDisplay = '10 days'

                        // On modifie les valeurs d'expiration dans l'objet trade
                        trade.trade.expire = newExpire
                        trade.trade.expireDisplay = newDisplay

                        // On cherche les valeurs complémentaires pour faire les bouttons
                        const currSource = trade.swap.find(i => i.id === trade.source)
                        const hasFundAbsolute = currSource.hasEth !== false
                        const hasPool = currSource.hasPool

                        // On définit les components
                        const buttons = buttonBiddingParamsConfig(trade, identifier, hasFundAbsolute, hasPool)

                        // On récupère la réponse d'origine 
                        // On modifie le field contenant la table et le page index
                        const embed = interaction.message.embeds[0].data
                        embed.fields.find(obj => obj.name === "Duration:").value = "`" + newDisplay + "`"

                        // Pour finir on modifie l'embed ainsi que les data du trade dans la DB
                        await exe_nft.update({ trade: JSON.stringify(trade) }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifier } });
                        await interaction.update({ embeds: [embed], components: buttons });

                    } else if (param === '15day') {

                        // On définit les valeurs de temps
                        const time = Math.floor(Date.now() / 1000)
                        const sec15Day = (864000 * 1.5) // On set à 15 jour
                        const newExpire = time + sec15Day
                        const newDisplay = '15 days'

                        // On modifie les valeurs d'expiration dans l'objet trade
                        trade.trade.expire = newExpire
                        trade.trade.expireDisplay = newDisplay

                        // On cherche les valeurs complémentaires pour faire les bouttons
                        const currSource = trade.swap.find(i => i.id === trade.source)
                        const hasFundAbsolute = currSource.hasEth !== false
                        const hasPool = currSource.hasPool

                        // On définit les components
                        const buttons = buttonBiddingParamsConfig(trade, identifier, hasFundAbsolute, hasPool)


                        // On récupère la réponse d'origine 
                        // On modifie le field contenant la table et le page index
                        const embed = interaction.message.embeds[0].data
                        embed.fields.find(obj => obj.name === "Duration:").value = "`" + newDisplay + "`"

                        // Pour finir on modifie l'embed ainsi que les data du trade dans la DB
                        await exe_nft.update({ trade: JSON.stringify(trade) }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifier } });
                        await interaction.update({ embeds: [embed], components: buttons });

                    } else if (param === '20day') {

                        // On définit les valeurs de temps
                        const time = Math.floor(Date.now() / 1000)
                        const sec20Day = (864000 * 2) // On set à 20 jour
                        const newExpire = time + sec20Day
                        const newDisplay = '20 days'

                        // On modifie les valeurs d'expiration dans l'objet trade
                        trade.trade.expire = newExpire
                        trade.trade.expireDisplay = newDisplay

                       // On cherche les valeurs complémentaires pour faire les bouttons
                       const currSource = trade.swap.find(i => i.id === trade.source)
                       const hasFundAbsolute = currSource.hasEth !== false
                       const hasPool = currSource.hasPool

                       // On définit les components
                       const buttons = buttonBiddingParamsConfig(trade, identifier, hasFundAbsolute, hasPool)


                        // On récupère la réponse d'origine 
                        // On modifie le field contenant la table et le page index
                        const embed = interaction.message.embeds[0].data
                        embed.fields.find(obj => obj.name === "Duration:").value = "`" + newDisplay + "`"

                        // Pour finir on modifie l'embed ainsi que les data du trade dans la DB
                        await exe_nft.update({ trade: JSON.stringify(trade) }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifier } });
                        await interaction.update({ embeds: [embed], components: buttons });

                    } else if (param === '30day') {

                        // On définit les valeurs de temps
                        const time = Math.floor(Date.now() / 1000)
                        const sec30Day = (864000 * 3) // On set à 30 jour
                        const newExpire = time + sec30Day
                        const newDisplay = '30 days'

                        // On modifie les valeurs d'expiration dans l'objet trade
                        trade.trade.expire = newExpire
                        trade.trade.expireDisplay = newDisplay

                        // On cherche les valeurs complémentaires pour faire les bouttons
                        const currSource = trade.swap.find(i => i.id === trade.source)
                        const hasFundAbsolute = currSource.hasEth !== false
                        const hasPool = currSource.hasPool

                        // On définit les components
                        const buttons = buttonBiddingParamsConfig(trade, identifier, hasFundAbsolute, hasPool)

                        // On récupère la réponse d'origine 
                        // On modifie le field contenant la table et le page index
                        const embed = interaction.message.embeds[0].data
                        embed.fields.find(obj => obj.name === "Duration:").value = "`" + newDisplay + "`"

                        // Pour finir on modifie l'embed ainsi que les data du trade dans la DB
                        await exe_nft.update({ trade: JSON.stringify(trade) }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifier } });
                        await interaction.update({ embeds: [embed], components: buttons });
                    } else if (param === 'marketplace') {

                        // On définit les infos de la nouvelle source
                        const currSource = trade.source
                        const source = markets.find(i => i.id !== currSource)

                        // On regarde ce que ça change en terme de fond et
                        // effectue les actions néscessaires en cas de besoin de wrap
                        // notamment générer les datas
                        const sourceApp = trade.swap.find(i => i.id === source.id)
                        let hasPool = sourceApp.hasPool
                        if (sourceApp.hasPool === null) {
                            // On commence par vérifier si le user a les fonds de la source
                            const balance = await getPoolBalance(decrypt(settings.sender), source.id) 
                            hasPool = trade.trade.value <= balance ? true : false // Assez de fond wrap ?
                            const wrapGap = trade.trade.value - balance // Assez de fond natif ?
                            const encoded = encodePoolWrapData(source.id)

                            // On modifie les valeurs
                            trade.swap.find(i => i.id === source.id).hasPool = hasPool
                            trade.swap.find(i => i.id === source.id).balance = balance
                            trade.swap.find(i => i.id === source.id).hasEth = hasPool ? null : trade.ethBalance > (wrapGap + trade.gas.expected)
                            trade.swap.find(i => i.id === source.id).from = hasPool ? null : decrypt(settings.sender)
                            trade.swap.find(i => i.id === source.id).to = hasPool ? null : encoded.to
                            trade.swap.find(i => i.id === source.id).data = hasPool ? null : encoded.data
                            trade.swap.find(i => i.id === source.id).value = hasPool ? null : wrapGap
                        }

                        // On modifie les informations du tableau trade actuel
                        trade.source = source.id
                        trade.trade.source = source.id
                        trade.gas.expected = hasPool ? 0 : trade.gas.price * trade.gas.limit

                        // On formatte quelques données. Une particularité pour const bids est que
                        // on fait une condition, car si le user n'a pas les fonds wrapped et peut pas 
                        // compléter avec les fonds natif (ETH), on renvoi une erreur
                        const hasFundAbsolute = trade.swap.find(i => i.id === source.id).hasEth !== false // On vérifie si les fonds sont dispos.
                        const bids = hasFundAbsolute ? // Si pas besoin, égal à null, si besoin et à les fonds, égal à true.
                            "Target: " + trade.trade.name + "\nWrapped: " + (hasPool ? 'Yes' : 'No') + "\n\nGas Fees: " + parseFloat(trade.gas.expected).toFixed(4) + "Ξ\nTotal Cost: " + parseFloat(trade.gas.expected).toFixed(4) + "Ξ                       "
                            : "Your total balance of " + source.poolSymbol + " + ETH is not sufficient to execute this bid. "  // La balance total n'est pa suffisante

                        // On définit les components
                        const buttons = buttonBiddingParamsConfig(trade, identifier, hasFundAbsolute, hasPool)

                        // On récupère la réponse d'origine 
                        // On modifie le field contenant la table et le page index
                        const embed = interaction.message.embeds[0].data
                        embed.fields.find(obj => obj.name === "Marketplace:").value = source.display
                        embed.fields.find(obj => obj.name === "Data:").value = "```" + bids + "```"

                        // Pour finir on modifie l'embed ainsi que les data du trade dans la DB
                        await exe_nft.update({ trade: JSON.stringify(trade) }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifier } });
                        await interaction.update({ embeds: [embed], components: buttons });

                    } else if (param === 'price') {

                        const modal = new ModalBuilder()
                            .setCustomId('modal_nft_panel_order_param_exec_price@' + identifier)
                            .setTitle('Modify Price');

                        // Add components to modal

                        // Create the text input components
                        const field = new TextInputBuilder()
                            .setCustomId('rowA')
                            .setLabel("New Price")
                            .setPlaceholder("The bid's price in ETH (i.g 0.02 for 0.02 ETH)")
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)

                        // An action row only holds one text input,
                        // so you need one action row per text input.
                        const actionRow = new ActionRowBuilder().addComponents(field);

                        // Add inputs to the modal
                        modal.addComponents(actionRow)

                        // Show the modal to the user
                        await interaction.showModal(modal);

                    } else if (param === 'amount') {

                        const modal = new ModalBuilder()
                            .setCustomId('modal_nft_panel_order_param_exec_amount@' + identifier)
                            .setTitle('Modify Amount');

                        // Add components to modal

                        // Create the text input components
                        const field = new TextInputBuilder()
                            .setCustomId('rowA')
                            .setLabel("New Amount")
                            .setPlaceholder("The amount of bid to post")
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)

                        // An action row only holds one text input,
                        // so you need one action row per text input.
                        const actionRow = new ActionRowBuilder().addComponents(field);

                        // Add inputs to the modal
                        modal.addComponents(actionRow)

                        // Show the modal to the user
                        await interaction.showModal(modal);



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



