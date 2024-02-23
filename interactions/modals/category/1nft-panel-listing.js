

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
const { profileData, reportsql, accessSql, portfolio_nft, infra_nft, exe_nft } = require('../../../events/database');
const moment = require('moment');

const { isApprovedForAll, encodeSetApprovalForAll, getGasPrice } = require("../../../functions/1nft-utils")
const { buttonListingParamsConfig } = require("../../../functions/nft/helpers")
const decrypt = require("../../../functions/decrypt")

const markets = require("../../../contracts/nft/config.json")

module.exports = {
    id: "modal_nft_listing_exec_",

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
            const match = customId.match(/modal_nft_listing_exec_(.+)@(.+)/);

            if (match && match[1] && match[2]) {

                // On defer la reply
                await interaction.deferReply({ ephemeral: true })

                // On récupère les infos dans l'ID
                const tokenId = parseInt(match[1])
                const identifier = match[2]

                // On récupère le prix
                const price = parseFloat(interaction.fields.getTextInputValue('firstRow'))

                // On va chercher les infos de storage
                const storage = await exe_nft.findOne({ where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifier } })
                const helper = JSON.parse(storage.dataValues.helper)
                const contract = storage.dataValues.contract
                const name = storage.dataValues.name
                const settings = JSON.parse(storage.dataValues.settings)
                const defaultSource = markets.find(i => i.default === true).id

                // On récupère les informations de listing du token
                const token = helper.table.data.find(i => i.token.tokenId === tokenId)
                const currentPrice = token.listing ? token.listing.price : false
                const currentSource = token.listing ? token.listing.source : false

                // On vérifie que le prix actuel et supérieur au nouveaux
                // prix auquel le listing est fait. 
                if (!currentPrice || currentPrice > price) {

                    // On regarde la nescessité d'un approval
                    const isApproved = await isApprovedForAll(contract, decrypt(settings.sender), defaultSource)

                    // On définit les data de gas principales
                    const gasPrice = (await getGasPrice()).eth
                    const defaultLimit = 100000

                    // On construit l'enregistrement des infos qu'on a dans la 
                    // database pour les récupérer lors du confirm.
                    const trade = {
                        status: null,
                        requestId: null,
                        orderId: null,
                        source: defaultSource, // Source par défaut
                        trade: {
                            contract: contract,
                            name: name,
                            tokenId: tokenId,
                            quantity: 1,
                            price: price,
                            source: defaultSource,
                            expire: Math.floor(Date.now() / 1000) + 604800, // Défaut à une semaine
                            expireDisplay: "7 days", // Défaut à une semaine
                        },
                        order: {
                            from: decrypt(settings.sender),
                            sign: null,
                            body: null,
                            signature: null,
                        },
                        approval: [
                            {
                                id: defaultSource,
                                isApproved: isApproved,
                                from: isApproved ? null : decrypt(settings.sender),
                                to: isApproved ? null : contract,
                                data: isApproved ? null : encodeSetApprovalForAll(defaultSource, true),
                            },
                            {
                                id: 'opensea.io',
                                isApproved: null,
                                from: null,
                                to: null,
                                data: null,
                            },
                        ],
                        gas:{
                            limit: defaultLimit,
                            average: 60000,
                            price: gasPrice,
                            expected: isApproved ? 0 : gasPrice * (defaultLimit * 0.6),
                        }
                    }

                    // On formatte quelques données
                    const marketplace = markets.find(i => i.id === trade.source).display
                    const listing = "Target: " + name + " #" + tokenId + "\nApproved: " + (isApproved ? 'Yes' : 'No') + "\n\nGas Fees: " + parseFloat(trade.gas.expected).toFixed(4) + "Ξ\nTotal Cost: " + parseFloat(trade.gas.expected).toFixed(4) + "Ξ                       "

                    // On définit les components
                    const buttons = buttonListingParamsConfig(trade, identifier)

                    // On renvoi la réponse
                    const response = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("List an NFT")
                        .setDescription(">>> Displaying your portfolio")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .setTimestamp()
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "Target", value: "`" + name + " #" + tokenId + "`", inline: true },
                            { name: "Action", value: "`📉 List`", inline: true },
                            { name: " ", value: " ", inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: "Price:", value: "`" + parseFloat(price).toFixed(3) + 'Ξ`', inline: true },
                            { name: "Marketplace:", value: marketplace, inline: true },
                            { name: "Duration:", value: "`7 days`", inline: true },
                            { name: " ", value: " ", inline: false },
                            { name: "Listing:", value: "```" + listing + "```", inline: false },
                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.editReply({ embeds: [response], components: buttons, ephemeral: true });


                    // On ajoute l'objet trade à la sessions d'exe dans la DB
                    await exe_nft.update({ trade: JSON.stringify(trade) }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifier } })


                } else {
                    // On trouve pas les match, renvoi une erreur
                    const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("List an NFT")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setDescription("You can't list a token above its current price. If you want to do so, you need to cancel the current listing before.\n\n➔ `" + name + ' #' + tokenId + "` is currently listed at `" + currentPrice + "` on " + currentSource + ".")
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.editReply({ embeds: [setfpEmbedNotForYou], ephemeral: true });
                }


            } else {
                // On trouve pas les match, renvoi une erreur
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
