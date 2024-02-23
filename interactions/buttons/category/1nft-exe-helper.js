/**
 * @file Sample modal interaction
 * @author VITALITY
 * @since 3.2.0
 * @version 3.2.2
 */

const { ButtonInteraction } = require('discord.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const { profileData, reportsql, accessSql, portfolio_nft, infra_nft, exe_nft } = require('../../../events/database');
const moment = require('moment');

const decrypt = require("../../../functions/decrypt");
const { formatListingInventory, buttonListedTokenIndex, dropdownListedTokenConfig, formatBiddingInventory, dropdownBiddingTokenConfig } = require('../../../functions/nft/helpers');
const chainId = 1



module.exports = {
    id: 'button_nft_helper_exec_',

    async execute(interaction) {
        if (!(interaction instanceof ButtonInteraction)) return;


        //Récupérer informations de l'utilisateur de la commande
        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id
        let botId = interaction.applicationId

        try {

            // On récupère les infos dans l'ID
            const customId = interaction.customId
            const match = customId.match(/button_nft_helper_exec_(.+)@(.+)/);


            if (match && match[1] && match[2]) {

                const action = match[1];
                const identifier = match[2]



                // On récupère les data store dans l'exe
                const storage = await exe_nft.findOne({ where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifier } })
                const name = storage.dataValues.name
                const type = storage.dataValues.action

                // On crée un arbre de if pour orienter le code au bon endroit
                // en fonction de l'action qui est effectué
                if (type === 'list') {

                    // On récupère le tableau avec tous les tokens
                    const helper = JSON.parse(storage.dataValues.helper)

                    // On oriente l'action en fonction du boutton
                    if (action === 'firstpage') { // Aller à la première page des tokens 

                        // On récupère le tableau
                        const tokens = helper.table

                        // On récupère la pagination et défini la nouvelle page
                        const index = helper.index
                        const current = helper.current
                        const newPage = 1

                        // On utilise la fonction pour chercher la boucle
                        const filter = tokens.data.slice(0, 15)
                        const inventory = formatListingInventory(filter)

                        // On construit les components
                        const components = [buttonListedTokenIndex(1, index, identifier), dropdownListedTokenConfig(filter, identifier)]

                        // On renvoi la réponse
                        const response = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("List an NFT")
                            .setDescription(">>> Displaying your portfolio")
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .addFields(
                                { name: " ", value: " ", inline: false },
                                { name: "Target", value: "`" + name + "`", inline: false },
                                { name: "Action", value: "`📉 List`", inline: true },
                                { name: "Listed", value: "`" + tokens.listed + "/" + tokens.count + "`", inline: true },
                                { name: " ", value: " ", inline: false },
                                { name: "Inventory:", value: "```" + inventory + "```", inline: false },
                                { name: " ", value: " ", inline: false },
                                { name: "Page:", value: "`[1/" + index + "]`", inline: false },
                            )
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.update({ embeds: [response], components: components, ephemeral: true });

                        // On modifie le tableau puis on l'enregistre dans la database
                        // au sein de la valeur helper de la table d'exec NFTs.
                        helper.current = newPage
                        await exe_nft.update({ helper: JSON.stringify(helper) }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifier } })


                    } else if (action === 'previouspage') { // Aller à la page précédente des tokens 

                        // On récupère le tableau
                        const tokens = helper.table

                        // On récupère la pagination et défini la nouvelle page
                        const index = helper.index
                        const current = helper.current
                        const newPage = current - 1

                        // On définit l'interval à récupérer
                        const firstOBJ = (newPage - 1) * 15
                        const lastOBJ = firstOBJ + 15

                        // On utilise la fonction pour chercher la boucle
                        const filter = tokens.data.slice(firstOBJ, lastOBJ)
                        const inventory = formatListingInventory(filter)

                        // On construit les components
                        const components = [buttonListedTokenIndex(newPage, index, identifier), dropdownListedTokenConfig(filter, identifier)]

                        // On renvoi la réponse
                        const response = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("List an NFT")
                            .setDescription(">>> Displaying your portfolio")
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .addFields(
                                { name: " ", value: " ", inline: false },
                                { name: "Target", value: "`" + name + "`", inline: false },
                                { name: "Action", value: "`📉 List`", inline: true },
                                { name: "Listed", value: "`" + tokens.listed + "/" + tokens.count + "`", inline: true },
                                { name: " ", value: " ", inline: false },
                                { name: "Inventory:", value: "```" + inventory + "```", inline: false },
                                { name: " ", value: " ", inline: false },
                                { name: "Page:", value: "`[" + newPage + "/" + index + "]`", inline: false },
                            )
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.update({ embeds: [response], components: components, ephemeral: true });

                        // On modifie le tableau puis on l'enregistre dans la database
                        // au sein de la valeur helper de la table d'exec NFTs.
                        helper.current = newPage
                        await exe_nft.update({ helper: JSON.stringify(helper) }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifier } })



                    } else if (action === 'nextpage') { // Aller à la page suivante des tokens 

                        // On récupère le tableau
                        const tokens = helper.table

                        // On récupère la pagination et défini la nouvelle page
                        const index = helper.index
                        const current = helper.current
                        const newPage = current + 1

                        // On définit l'interval à récupérer
                        const firstOBJ = (newPage - 1) * 15
                        const lastOBJ = firstOBJ + 15

                        // On utilise la fonction pour chercher la boucle
                        const filter = tokens.data.slice(firstOBJ, lastOBJ)
                        const inventory = formatListingInventory(filter)

                        // On construit les components
                        const components = [buttonListedTokenIndex(newPage, index, identifier), dropdownListedTokenConfig(filter, identifier)]

                        // On renvoi la réponse
                        const response = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("List an NFT")
                            .setDescription(">>> Displaying your portfolio")
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .addFields(
                                { name: " ", value: " ", inline: false },
                                { name: "Target", value: "`" + name + "`", inline: false },
                                { name: "Action", value: "`📉 List`", inline: true },
                                { name: "Listed", value: "`" + tokens.listed + "/" + tokens.count + "`", inline: true },
                                { name: " ", value: " ", inline: false },
                                { name: "Inventory:", value: "```" + inventory + "```", inline: false },
                                { name: " ", value: " ", inline: false },
                                { name: "Page:", value: "`[" + newPage + "/" + index + "]`", inline: false },
                            )
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.update({ embeds: [response], components: components, ephemeral: true });

                        // On modifie le tableau puis on l'enregistre dans la database
                        // au sein de la valeur helper de la table d'exec NFTs.
                        helper.current = newPage
                        await exe_nft.update({ helper: JSON.stringify(helper) }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifier } })

                    } else if (action === 'lastpage') { // Aller à la dernière page des tokens 

                        // On récupère le tableau
                        const tokens = helper.table

                        // On récupère la pagination et défini la nouvelle page
                        const index = helper.index
                        const current = helper.current
                        const newPage = index

                        // On définit l'interval à récupérer
                        const firstOBJ = (newPage - 1) * 15
                        const lastOBJ = firstOBJ + 15

                        // On utilise la fonction pour chercher la boucle
                        const filter = tokens.data.slice(firstOBJ, lastOBJ)
                        const inventory = formatListingInventory(filter)

                        // On construit les components
                        const components = [buttonListedTokenIndex(newPage, index, identifier), dropdownListedTokenConfig(filter, identifier)]

                        // On renvoi la réponse
                        const response = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("List an NFT")
                            .setDescription(">>> Displaying your portfolio")
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .addFields(
                                { name: " ", value: " ", inline: false },
                                { name: "Target", value: "`" + name + "`", inline: false },
                                { name: "Action", value: "`📉 List`", inline: true },
                                { name: "Listed", value: "`" + tokens.listed + "/" + tokens.count + "`", inline: true },
                                { name: " ", value: " ", inline: false },
                                { name: "Inventory:", value: "```" + inventory + "```", inline: false },
                                { name: " ", value: " ", inline: false },
                                { name: "Page:", value: "`[" + newPage + "/" + index + "]`", inline: false },
                            )
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.update({ embeds: [response], components: components, ephemeral: true });

                        // On modifie le tableau puis on l'enregistre dans la database
                        // au sein de la valeur helper de la table d'exec NFTs.
                        helper.current = newPage
                        await exe_nft.update({ helper: JSON.stringify(helper) }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifier } })
                    }

                } else if (type === 'sell') {

                    // On récupère le tableau avec tous les tokens
                    const helper = JSON.parse(storage.dataValues.helper)

                    // On oriente l'action en fonction du boutton
                    if (action === 'firstpage') { // Aller à la première page des tokens 

                        // On récupère le tableau
                        const tokens = helper.table

                        // On récupère la pagination et défini la nouvelle page
                        const index = helper.index
                        const current = helper.current
                        const newPage = 1

                        // On utilise la fonction pour chercher la boucle
                        const filter = tokens.data.slice(0, 15)
                        const inventory = formatBiddingInventory(filter)

                        // On construit les components
                        const components = [buttonListedTokenIndex(1, index, identifier), dropdownBiddingTokenConfig(filter, identifier)]

                        // On renvoi la réponse
                        const response = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("List an NFT")
                            .setDescription(">>> Displaying your portfolio")
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .addFields(
                                { name: " ", value: " ", inline: false },
                                { name: "Target", value: "`" + name + "`", inline: false },
                                { name: "Action", value: "`🤝 Accept Bid`", inline: true },
                                { name: "Bids", value: "`" + tokens.count + "`", inline: true },
                                { name: " ", value: " ", inline: false },
                                { name: "Inventory:", value: "```" + inventory + "```", inline: false },
                                { name: " ", value: " ", inline: false },
                                { name: "Page:", value: "`[1/" + index + "]`", inline: false },
                            )
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.update({ embeds: [response], components: components, ephemeral: true });

                        // On modifie le tableau puis on l'enregistre dans la database
                        // au sein de la valeur helper de la table d'exec NFTs.
                        helper.current = newPage
                        await exe_nft.update({ helper: JSON.stringify(helper) }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifier } })


                    } else if (action === 'previouspage') { // Aller à la page précédente des tokens 

                        // On récupère le tableau
                        const tokens = helper.table

                        // On récupère la pagination et défini la nouvelle page
                        const index = helper.index
                        const current = helper.current
                        const newPage = current - 1

                        // On définit l'interval à récupérer
                        const firstOBJ = (newPage - 1) * 15
                        const lastOBJ = firstOBJ + 15

                        // On utilise la fonction pour chercher la boucle
                        const filter = tokens.data.slice(firstOBJ, lastOBJ)
                        const inventory = formatBiddingInventory(filter)

                        // On construit les components
                        const components = [buttonListedTokenIndex(newPage, index, identifier), dropdownBiddingTokenConfig(filter, identifier)]

                        // On renvoi la réponse
                        const response = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("List an NFT")
                            .setDescription(">>> Displaying your portfolio")
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .addFields(
                                { name: " ", value: " ", inline: false },
                                { name: "Target", value: "`" + name + "`", inline: false },
                                { name: "Action", value: "`🤝 Accept Bid`", inline: true },
                                { name: "Bids", value: "`" + tokens.count + "`", inline: true },
                                { name: " ", value: " ", inline: false },
                                { name: "Inventory:", value: "```" + inventory + "```", inline: false },
                                { name: " ", value: " ", inline: false },
                                { name: "Page:", value: "`[" + newPage + "/" + index + "]`", inline: false },
                            )
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.update({ embeds: [response], components: components, ephemeral: true });

                        // On modifie le tableau puis on l'enregistre dans la database
                        // au sein de la valeur helper de la table d'exec NFTs.
                        helper.current = newPage
                        await exe_nft.update({ helper: JSON.stringify(helper) }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifier } })



                    } else if (action === 'nextpage') { // Aller à la page suivante des tokens 

                        // On récupère le tableau
                        const tokens = helper.table

                        // On récupère la pagination et défini la nouvelle page
                        const index = helper.index
                        const current = helper.current
                        const newPage = current + 1

                        // On définit l'interval à récupérer
                        const firstOBJ = (newPage - 1) * 15
                        const lastOBJ = firstOBJ + 15

                        // On utilise la fonction pour chercher la boucle
                        const filter = tokens.data.slice(firstOBJ, lastOBJ)
                        const inventory = formatBiddingInventory(filter)

                        // On construit les components
                        const components = [buttonListedTokenIndex(newPage, index, identifier), dropdownBiddingTokenConfig(filter, identifier)]

                        // On renvoi la réponse
                        const response = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("List an NFT")
                            .setDescription(">>> Displaying your portfolio")
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .addFields(
                                { name: " ", value: " ", inline: false },
                                { name: "Target", value: "`" + name + "`", inline: false },
                                { name: "Action", value: "`🤝 Accept Bid`", inline: true },
                                { name: "Bids", value: "`" + tokens.count + "`", inline: true },
                                { name: " ", value: " ", inline: false },
                                { name: "Inventory:", value: "```" + inventory + "```", inline: false },
                                { name: " ", value: " ", inline: false },
                                { name: "Page:", value: "`[" + newPage + "/" + index + "]`", inline: false },
                            )
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.update({ embeds: [response], components: components, ephemeral: true });

                        // On modifie le tableau puis on l'enregistre dans la database
                        // au sein de la valeur helper de la table d'exec NFTs.
                        helper.current = newPage
                        await exe_nft.update({ helper: JSON.stringify(helper) }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifier } })

                    } else if (action === 'lastpage') { // Aller à la dernière page des tokens 

                        // On récupère le tableau
                        const tokens = helper.table

                        // On récupère la pagination et défini la nouvelle page
                        const index = helper.index
                        const current = helper.current
                        const newPage = index

                        // On définit l'interval à récupérer
                        const firstOBJ = (newPage - 1) * 15
                        const lastOBJ = firstOBJ + 15

                        // On utilise la fonction pour chercher la boucle
                        const filter = tokens.data.slice(firstOBJ, lastOBJ)
                        const inventory = formatBiddingInventory(filter)

                        // On construit les components
                        const components = [buttonListedTokenIndex(newPage, index, identifier), dropdownBiddingTokenConfig(filter, identifier)]

                        // On renvoi la réponse
                        const response = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("List an NFT")
                            .setDescription(">>> Displaying your portfolio")
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .addFields(
                                { name: " ", value: " ", inline: false },
                                { name: "Target", value: "`" + name + "`", inline: false },
                                { name: "Action", value: "`🤝 Accept Bid`", inline: true },
                                { name: "Bids", value: "`" + tokens.count + "`", inline: true },
                                { name: " ", value: " ", inline: false },
                                { name: "Inventory:", value: "```" + inventory + "```", inline: false },
                                { name: " ", value: " ", inline: false },
                                { name: "Page:", value: "`[" + newPage + "/" + index + "]`", inline: false },
                            )
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.update({ embeds: [response], components: components, ephemeral: true });

                        // On modifie le tableau puis on l'enregistre dans la database
                        // au sein de la valeur helper de la table d'exec NFTs.
                        helper.current = newPage
                        await exe_nft.update({ helper: JSON.stringify(helper) }, { where: { authorId: authorId, serverId: serverId, treated: null, identifier: identifier } })
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


