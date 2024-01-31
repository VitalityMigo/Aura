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
const { profileData, reportsql, accessSql, portfolio_nft, infra_nft, sequelize } = require('../../../events/database');
const moment = require('moment');

const decrypt = require("../../../functions/decrypt")
const { encodeTransfer, simulateTransaction, getGasPrice } = require("../../../functions/1nft-utils")



// Boutton pas de wallet
const buttonsRowCancel = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('button_nft_portfolio_exec_cancel')
            .setLabel('Cancel')
            .setStyle(4),

    );

// Boutton pas de wallet
const buttonsRowConfirm = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('button_nft_portfolio_exec_confirm')
            .setLabel('Confirm')
            .setEmoji("✅")
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId('button_nft_portfolio_exec_cancel')
            .setLabel('Cancel')
            .setStyle(4),

    );


module.exports = {
    id: "modal_portfolio_nft_infra_",

    async execute(interaction) {


        //Récupérer informations de l'utilisateur de la commande
        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id
        let botId = interaction.applicationId

        await interaction.deferReply({ ephemeral: true })

        try {

            console.log("Initialization: executed ✅")

            // On récupère le customID
            const customId = interaction.customId
            const match = customId.match(/modal_portfolio_nft_infra_(.+)/);

            if (match && match[1]) {

                const action = match[1];


                if (action === 'transfer') {

                    const receiver = interaction.fields.getTextInputValue('modal_portfolio_nft_infra_transferR1').toLowerCase()

                    // On récupère les infos de la DB, et on les met ensemble
                    const storage = await portfolio_nft.findOne({ where: { authorId: authorId, serverId: serverId, treated: null } })
                    const transaction = JSON.parse(storage.dataValues.transaction)
                    const profile = await infra_nft.findOne({ where: { authorId: authorId } })

                    // On enregistre quelques datas dans le tableau
                    // On commence par ajouter quelques valeurs à transaction
                    transaction.value = 0
                    transaction.target = receiver
                    // On définit l'objet settings
                    const settings = {
                        sender: profile.dataValues.walletAddress,
                        privateKey: profile.dataValues.privateKey
                    }

                    if (receiver !== decrypt(settings.sender)) {

                        // On encode les datas
                        transaction.data = encodeTransfer(decrypt(settings.sender), transaction.target, transaction.tokenId, transaction.contract)

                        // On simule la transaction
                        //Si échec, on renvoi le message d'erreur
                        const param = {
                            to: transaction.contract,
                            data: transaction.data,
                            value: 0,
                            from: decrypt(settings.sender)
                        }

                        const simulation = await simulateTransaction(param)

                        // Si la transaction est valide, on continu
                        if (simulation && simulation.valid == true) {


                            const gas = await getGasPrice()
                            const expected = gas.eth * simulation.result
                            const txnDataFormatted = "Sender: " + decrypt(settings.sender) + "\nGas Price: " + parseFloat(gas.gwei).toFixed(0) + " gwei\n\nValue: " + parseFloat(0).toFixed(3) + "Ξ\nGas fees: " + parseFloat(expected).toFixed(5) + "Ξ\n\nTotal Value: " + parseFloat(expected).toFixed(3) + "Ξ"


                            const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Transfer An NFT")
                                .setDescription(">>> Displaying the simulated transaction data")
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Action", value: "`📤 Transfer`", inline: false },
                                    { name: "Target", value: "`" + transaction.name + "`", inline: true },
                                    { name: "Token ID", value: "`" + transaction.tokenId + "`", inline: true },
                                    { name: "Transaction Data ✅", value: "```" + txnDataFormatted + "```", inline: false },

                                )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [buttonsRowConfirm], ephemeral: true });

                            // On formatte les data pour aller dans la database
                            // On commence par l'objet transaction
                            transaction.gasPrice = parseInt(gas.wei)
                            transaction.gasUsed = simulation.result
                            transaction.expected = expected
                            // On enregistre tous dans notre table exe SQL

                            // On update l'entrée dans la database
                            await portfolio_nft.update({
                                transaction: JSON.stringify(transaction),
                                settings: JSON.stringify(settings)
                            }, { where: { authorId: authorId, serverId: serverId, treated: null } })


                        } else {

                            // La simulation n'a pas réussi
                            // On annule la transaction

                            const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Sell Coin")
                                .setDescription(">>> Displaying the simulated transaction data")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Action", value: "`📤 Transfer`", inline: false },
                                    { name: "Target", value: "`" + transaction.name + "`", inline: true },
                                    { name: "Token ID", value: "`" + transaction.tokenId + "`", inline: true },
                                    { name: "Transaction Data 🚫", value: "```The transaction simulation failed.\n\n" + simulation.result + "```", inline: false },

                                )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                            await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [buttonsRowCancel], ephemeral: true });

                        }

                    } else {
                        // L'addresse du receiver et la même que celle du sender

                        const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Portfolio manager")
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setDescription("You can't send an NFT to its current owner (you). Please select a different wallet or contact a team member if you need help.")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [setfpEmbedNotForYou], ephemeral: true });


                    }

                } else if (action === 'list') {
                    console.log("List selected. Not available yet...")
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