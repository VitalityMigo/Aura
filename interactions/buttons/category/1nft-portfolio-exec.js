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
const { ActionRowBuilder, EmbedBuilder, ButtonBuilder } = require("discord.js");
const { accessSql, profileData, adminsql, reportsql, portfolio_nft, interactionData } = require('../../../events/database');
const moment = require('moment');


// On importe les fonctions importantes
const addTimeount = require("../../../functions/addtimeout")
const decrypt = require('../../../functions/decrypt')

// On importe les fonctions utils NFT trading
const { signTransaction } = require("../../../functions/1nft-utils")
const chainId = 1

module.exports = {
    id: 'button_nft_portfolio_exec_',

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
            const match = customId.match(/button_nft_portfolio_exec_(.+)/);

            if (match && match[1]) {

                const action = match[1];

                // On defer la reply si c'est pas cancel
                if (action !== 'cancel' && action !== 'confirm') {
                    await interaction.deferReply({ ephemeral: true })
                }


                if (action === "list") {


                    // On récupère les data qui ont été store
                    const storage = await portfolio_nft.findOne({ where: { authorId: authorId, serverId: serverId, treated: null } })
                    const current = JSON.parse(storage.dataValues.current)


                    // On construit la drop down list
                    const dropdown = createDropdownList(current, action)

                    // On construit l'embed
                    const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("List an NFT")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setDescription("To begin, select the collection you want to list from the drop-down list below.\n\nThe drop-down list only contains collections that are currently displayed on the main dashboard.")
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.editReply({ embeds: [setfpEmbedNotForYou], components: [dropdown], ephemeral: true });


                } else if (action === "bulkList") {

                    // On récupère les data qui ont été store
                    const storage = await portfolio_nft.findOne({ where: { authorId: authorId, serverId: serverId, treated: null } })
                    const current = JSON.parse(storage.dataValues.current)


                    // On construit la drop down list
                    const dropdown = createDropdownList(current, action)

                    // On construit l'embed
                    const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Bulk List NFTs")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setDescription("To begin, select the collection you want to list from the drop-down list below.\n\nThe drop-down list only contains collections that are currently displayed on the main dashboard.")
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.editReply({ embeds: [setfpEmbedNotForYou], components: [dropdown], ephemeral: true });


                } else if (action === "acceptBid") {

                    // On récupère les data qui ont été store
                    const storage = await portfolio_nft.findOne({ where: { authorId: authorId, serverId: serverId, treated: null } })
                    const current = JSON.parse(storage.dataValues.current)


                    // On construit la drop down list
                    const dropdown = createDropdownList(current, action)

                    // On construit l'embed
                    const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Accept Bid")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setDescription("To begin, select the collection you want to list from the drop-down list below.\n\nThe drop-down list only contains collections that are currently displayed on the main dashboard.")
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.editReply({ embeds: [setfpEmbedNotForYou], components: [dropdown], ephemeral: true });


                } else if (action === "acceptBulkBid") {

                    // On récupère les data qui ont été store
                    const storage = await portfolio_nft.findOne({ where: { authorId: authorId, serverId: serverId, treated: null } })
                    const current = JSON.parse(storage.dataValues.current)


                    // On construit la drop down list
                    const dropdown = createDropdownList(current, action)

                    // On construit l'embed
                    const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Accept Bulk Bids")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setDescription("To begin, select the collection you want to list from the drop-down list below.\n\nThe drop-down list only contains collections that are currently displayed on the main dashboard.")
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.editReply({ embeds: [setfpEmbedNotForYou], components: [dropdown], ephemeral: true });


                } else if (action === "transfer") {

                    // On récupère les data qui ont été store
                    const storage = await portfolio_nft.findOne({ where: { authorId: authorId, serverId: serverId, treated: null } })
                    const current = JSON.parse(storage.dataValues.current)

                    // On construit la drop down list
                    const dropdown = createDropdownList(current, action)

                    // On construit l'embed
                    const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Transfer an NFT")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setDescription("To begin, select the collection you want to list from the drop-down list below.\n\nThe drop-down list only contains collections that are currently displayed on the main dashboard.")
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.editReply({ embeds: [setfpEmbedNotForYou], components: [dropdown], ephemeral: true });



                } else if (action === "cancel") {


                    const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Deleting Task")
                        .setDescription(">>> Displaying the simulated transaction data")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "Deleting Task <a:AuraLoading:1134068847616458792>", value: " ", inline: false },

                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })



                    await interaction.update({ embeds: [gasTrackerEmbed], components: [], ephemeral: true });



                    await portfolio_nft.update({ settings: null }, { where: { authorId: authorId, serverId: serverId, treated: null } });

                    await addTimeount(0.5)


                    const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Task Cancelled")
                        .setDescription(">>> Displaying the simulated transaction data")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "Task Cancelled ✅", value: "Your task has been successfully cancelled , you can recreate a new one from the various coin panels", inline: false },

                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })



                    await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [], ephemeral: true });


                } else if (action === "confirm") {

                    // On récupère les data qui ont été store
                    const session = await portfolio_nft.findOne({ where: { authorId: authorId, serverId: serverId, treated: null } })
                    const transaction = JSON.parse(session.dataValues.transaction)
                    const settings = JSON.parse(session.dataValues.settings)
                    const value = session.dataValues.value
                    const action = session.dataValues.action


                    // On vérifie quelle action est executé
                    // et on redirige le code en fonction
                    if (action === 'transfer') {

                        await interaction.deferUpdate()

                        // On envoi la première update
                        const embed1 = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Transaction Pending <a:AuraLoading:1134068847616458792>")
                            .setDescription(">>> Displaying the transaction execution")
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .addFields(
                                { name: " ", value: " ", inline: false },
                                { name: "Action", value: "`📤 Transfer`", inline: false },
                                { name: "Target", value: "`" + transaction.name + "`", inline: true },
                                { name: "Token ID", value: "`" + transaction.tokenId + "`", inline: true },
                                { name: " ", value: " ", inline: false },
                                { name: "Transaction hash", value: "<a:AuraLoading:1134068847616458792>", inline: false },

                            )
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [embed1], ephemeral: true });


                        // On récupère la clé privé
                        const privateKey = decrypt(settings.privateKey)

                        // On récupère les datas de la transaction
                        const contract = transaction.contract
                        const data = transaction.data
                        const gasLimit = Math.ceil(transaction.gasUsed * 1.1)
                        const gasPrice = Math.ceil(transaction.gasPrice * 1.1)


                        // On envoi la première update
                        const embed2 = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Transaction Pending <a:AuraLoading:1134068847616458792>")
                            .setDescription(">>> Displaying the transaction execution")
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .addFields(
                                { name: " ", value: " ", inline: false },
                                { name: "Action", value: "`📤 Transfer`", inline: false },
                                { name: "Target", value: "`" + transaction.name + "`", inline: true },
                                { name: "Token ID", value: "`" + transaction.tokenId + "`", inline: true },
                                { name: " ", value: "**Transfering** `1` **token for** `" + transaction.expected + "Ξ`", inline: false },
                                { name: "Transaction hash", value: "<a:AuraLoading:1134068847616458792>", inline: false },

                            )
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [embed2], ephemeral: true });


                        // On construit les params de la transaction
                        // grâce aux infos récupéré de l'embed
                        const txnInfos = {
                            gasLimit: gasLimit,
                            gasPrice: gasPrice,
                            to: contract,
                            value: 0,
                            data: data,
                            chainId: chainId,

                        };

                        const receipt = await signTransaction(txnInfos, privateKey)

                        // Faire la logique qui permet d'interpréter et de renvoyer le résultat de la transaction.
                        // Peut-être qu'il faut déjà envoyé un embed de loading avant dans le code, à vérifier
                        // en regardant ce qu'on a fait dans les fichier de trading de coin.

                    

                        if (receipt && receipt.status == true) {

                            // Transaction signé et exécuter avec succès
                            // Renvoi les informations avec hash de la txn réussi

                            const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Transaction Confirmed ✅")
                                .setDescription(">>> Displaying the transaction execution")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Action", value: "`📤 Transfer`", inline: false },
                                    { name: "Target", value: "`" + transaction.name + "`", inline: true },
                                    { name: "Token ID", value: "`" + transaction.tokenId + "`", inline: true },
                                    { name: " ", value: " ", inline: false },
                                    { name: " ", value: "**Transfered** `1` **token for** `" + parseFloat(receipt.gas_fees).toFixed(5) + "Ξ`", inline: false },
                                    { name: " ", value: " ", inline: false },
                                    { name: "Transaction hash:", value: "```" + receipt.hash + "```∟ Transaction details [here](https://etherscan.io/tx/" + receipt.hash + ")", inline: false },

                                )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });




                        } else {

                            // Erreur dans la transaction
                            // Erreur détaillé plus bas entre failed txn et failed execution

                            if (!receipt) {

                                const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Transaction Failed ❌")
                                    .setDescription(">>> Displaying the transaction execution")
                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setTimestamp()
                                    .addFields(
                                        { name: " ", value: " ", inline: false },
                                        { name: "Action", value: "`📤 Transfer`", inline: false },
                                        { name: "Target", value: "`" + transaction.name + "`", inline: true },
                                        { name: "Token ID", value: "`" + transaction.tokenId + "`", inline: true },
                                        { name: " ", value: " ", inline: false },
                                        { name: " ", value: "**Failed to transfer** `1` **token for** `" + transaction.expected + "Ξ`", inline: false },
                                        { name: " ", value: " ", inline: false },
                                        { name: "Transaction error:", value: "```The transaction failed.\n\nThe wallet signature didn't went through       ```", inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });


                            } else if (receipt.status == false) {

                                // Transaction signé et exécuter mais pas passé
                                // Renvoi les informations avec hash de la txn fail

                                const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Transaction Failed ❌")
                                    .setDescription(">>> Displaying the transaction execution")
                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setTimestamp()
                                    .addFields(
                                        { name: " ", value: " ", inline: false },
                                        { name: "Action", value: "`📤 Transfer`", inline: false },
                                        { name: "Target", value: "`" + transaction.name + "`", inline: true },
                                        { name: "Token ID", value: "`" + transaction.tokenId + "`", inline: true },
                                        { name: " ", value: " ", inline: false },
                                        { name: " ", value: "**Failed to transfer** `1` **token for** `" + transaction.expected + "Ξ`", inline: false },
                                        { name: " ", value: " ", inline: false },
                                        { name: "Transaction hash:", value: "```" + receipt.hash + "```∟ Transaction details [here](https://etherscan.io/tx/" + receipt.hash + ")", inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });


                            } else {

                                // Erreur catch lors de la signature ou de l'execution
                                // Renvoi une erreur avec message comme pour simulation

                                const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Transaction Failed ❌")
                                    .setDescription(">>> Displaying the transaction execution")
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setTimestamp()
                                    .addFields(
                                        { name: " ", value: " ", inline: false },
                                        { name: "Action", value: "`📤 Transfer`", inline: false },
                                        { name: "Target", value: "`" + transaction.name + "`", inline: true },
                                        { name: "Token ID", value: "`" + transaction.tokenId + "`", inline: true },
                                        { name: " ", value: " ", inline: false },
                                        { name: " ", value: "**Failed to transfer** `1` **token for** `" + transaction.expected + "Ξ`", inline: false },
                                        { name: " ", value: " ", inline: false },
                                        { name: "Transaction error:", value: "```The transaction failed.\n\n" + receipt.message + "       ```", inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });

                            }
                        }


                    } else {
                        // On rajoute ici tous les autres, à la place du else
                        // pour crée un arbre complet

                        console.log("Not available yet, only transfer...")

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
