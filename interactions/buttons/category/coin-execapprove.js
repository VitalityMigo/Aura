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
const { accessSql, profileData, adminsql, reportsql, exe_coin, infra_coin, sequelize } = require('../../../events/database');
const moment = require('moment');
const decrypt = require("../../../functions/decrypt")

const { createFactory, generateTrade, encodeSwapExactETHForTokens, signTransaction, getGasPrice, gasOracle, balanceOfToken, setSlippage, simulateTransaction } = require('../../../functions/coin-utils')
const chainId = 1


// Boutton pas de wallet
const buttonsRowCancel = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('button_coin_exec_cancel')
            .setLabel('Cancel')
            .setStyle(4),

    );

// Boutton pas de wallet
const buttonsRowConfirm = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('button_coin_exec_confirm')
            .setLabel('Confirm')
            .setEmoji("✅")
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId('button_coin_exec_cancel')
            .setLabel('Cancel')
            .setStyle(4),

    );


module.exports = {
    id: 'button_coin_exec_approve_',

    async execute(interaction) {
        if (!(interaction instanceof ButtonInteraction)) return;

        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id
        let botId = interaction.applicationId

        await interaction.deferReply({ ephemeral: true })

        try {

            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")


            const userSetup = await exe_coin.findOne({ where: { authorId: authorId, serverId: serverId, treated: null } })

            if (userSetup != null) {


                // on récupère les infos de la DB
                // Infos sur le trade, le user, et de formattage
                const isBuy = userSetup.dataValues.isBuy
                const toSymbol = userSetup.dataValues.symbol
                const trade = JSON.parse(userSetup.dataValues.trade)
                const setup = JSON.parse(userSetup.dataValues.setup)




                if (isBuy == "false") {


                    const approvalEmbed = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Approving Token <a:AuraLoading:1134068847616458792>")
                        .setDescription("The token is being approved, this message will auto update once it's done <a:AuraLoading:1134068847616458792>")
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.editReply({ embeds: [approvalEmbed], components: [buttonsRowCancel], ephemeral: true });



                    // Infos du trade
                    // Infos pour approve spéciiquement
                    const router = trade[0].router
                    const data = trade[0].data
                    const valueHex = trade[0].value
                    const expected_value = trade[0].expected_value
                    const expected_amount = trade[0].expected_amount
                    const amountOutMin = trade[0].amountOutMin
                    const approve_txn = trade[0].approve_txn


                    // Infos du sender
                    const auto_approval = setup[0].auto_approval
                    const gas_preset = setup[0].gas_preset
                    const max_gwei = setup[0].max_gwei
                    const sender = setup[0].sender
                    const privateKey = setup[0].privateKey



                    const gas_limit = 50000
                    const gasPrice = await getGasPrice()

                    // On construit la txn
                    const txnInfos = {
                        gasLimit: gas_limit,
                        gasPrice: Math.ceil(gasPrice * 1.2),
                        to: approve_txn.to,
                        value: approve_txn.value,
                        data: approve_txn.data,
                        chainId: chainId,

                    };


                    


                    const receipt = await signTransaction(txnInfos, decrypt(privateKey))


                    if (receipt && receipt.status == true) {

                        const approvalEmbed = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Token Approved ✅")
                            .setDescription("The token has been successfully approved for maximum allowance. The transaction is available [here](https://etherscan.io/tx/" + receipt.hash + ")")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [approvalEmbed], components: [buttonsRowCancel], ephemeral: true });





                        // On fait la simulation, si échec, on renvoi le message d'erreur
                        const simulation_param = {
                            to: router,
                            data: data,
                            value: "0x00",
                            from: decrypt(sender)
                        }


                        // Fonction qui effectue la simulation
                        // Renvoi le nombre de gas utilisé
                        // Si erreur, renvoi soit rien soit que la limite a été atteinte
                        const simulation = await simulateTransaction(simulation_param)


                        // Si la transaction est valide, on continu
                        if (simulation.valid == true) {


                            const gas = await gasOracle(gas_preset, simulation.result, max_gwei)

                            if (gas !== null && gas.valid == true) {
                                //On construit l'objet de transaction


                                const totalValue = parseFloat(amountOutMin) - parseFloat(gas.fees)
                                const txnDataFormatted = "Sender: " + decrypt(sender) + "\nGas Price: " + parseFloat(gas.gwei).toFixed(0) + " gwei\nMin. Received: " + parseFloat(amountOutMin).toFixed(5) + " (including slippage)\n\nValue: " + parseFloat(0).toFixed(3) + "Ξ\nGas fees: " + parseFloat(gas.fees).toFixed(5) + "Ξ\n\nValue Received: " + parseFloat(totalValue).toFixed(3) + "Ξ"


                                const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Sell Coin")
                                    .setDescription(">>> Displaying the simulated transaction data")
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setTimestamp()
                                    .addFields(
                                        { name: " ", value: " ", inline: false },
                                        { name: "Target", value: "`" + toSymbol.toUpperCase() + "`", inline: true },
                                        { name: "Action", value: "`📉 Sell`", inline: true },
                                        { name: "Value", value: "`" + expected_amount + "Ξ`", inline: false },
                                        { name: "Transaction Data ✅", value: "```" + txnDataFormatted + "```", inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                                await interaction.followUp({ embeds: [gasTrackerEmbed2], components: [buttonsRowConfirm], ephemeral: true });


                                // On formatte les data pour aller dans la database
                                // On enregistre tous dans notre table exe SQL


                            } else if (gas.valid == "Over gas limit") {

                                // On a dépassé le max gwei
                                // Transaction annulé sans être exécuter

                                const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Sell Coin")
                                    .setDescription(">>> Displaying the simulated transaction data")
                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setTimestamp()
                                    .addFields(
                                        { name: " ", value: " ", inline: false },
                                        { name: "Target", value: "`" + toSymbol.toUpperCase() + "`", inline: true },
                                        { name: "Action", value: "`📉 Sell`", inline: true },
                                        { name: "Value", value: "`" + expected_amount + "Ξ`", inline: false },
                                        { name: "Transaction Data 🚫", value: "```The transaction simulation failed.\n\nThe gas price in gwei (" + parseFloat(gas.price / 10 ** 9).toFixed(2) + " gwei) has exceeded your limit (" + parseFloat(max_gwei).toFixed(2) + ")```", inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.followUp({ embeds: [gasTrackerEmbed2], components: [buttonsRowCancel], ephemeral: true });

                                exe_coin.destroy({ where: { authorId: authorId, serverId: serverId, treated: null } });


                            } else if (gas == null) {

                                // Erreur dans le calcul des gas fees
                                const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Sell Coin")
                                    .setDescription(">>> Displaying the simulated transaction data")
                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setTimestamp()
                                    .addFields(
                                        { name: " ", value: " ", inline: false },
                                        { name: "Target", value: "`" + toSymbol.toUpperCase() + "`", inline: true },
                                        { name: "Action", value: "`📉 Sell`", inline: true },
                                        { name: "Value", value: "`" + expected_amount + "Ξ`", inline: false },
                                        { name: "Transaction Data 🚫", value: "```The transaction simulation failed.\n\nThe gas oracle failed to estimate gas price.```", inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.followUp({ embeds: [gasTrackerEmbed2], components: [buttonsRowCancel], ephemeral: true });

                                exe_coin.destroy({ where: { authorId: authorId, serverId: serverId, treated: null } });


                            }

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
                                    { name: "Target", value: "`" + toSymbol.toUpperCase() + "`", inline: true },
                                    { name: "Action", value: "`📉 Sell`", inline: true },
                                    { name: "Value", value: "`" + expected_amount + "Ξ`", inline: false },
                                    { name: "Transaction Data 🚫", value: "```The transaction simulation failed.\n\n" + simulation.result + "```", inline: false },

                                )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                            await interaction.followUp({ embeds: [gasTrackerEmbed2], components: [buttonsRowCancel], ephemeral: true });

                            exe_coin.destroy({ where: { authorId: authorId, serverId: serverId, treated: null } });


                        }









                    } else {


                        const approvalEmbed = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Token Approval Failed ❌")
                            .setDescription("The token approval for maximum allowance has failed. The transaction is available [here](https://etherscan.io/tx/" + receipt.hash + ")")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [approvalEmbed], components: [buttonsRowCancel], ephemeral: true });

                        exe_coin.destroy({ where: { authorId: authorId, serverId: serverId, treated: null } });

                    }






                }


            } else {


                const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Approve Token")
                    .setDescription("An error occured while retreiving the your approval setup. Please try again using `/coin data` or contact a team member if you need help.")
                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                    .setAuthor({ name: "Aura", iconURL: "https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png" })
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                await interaction.editReply({ embeds: [gasTrackerEmbed2] });




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
            let reportCommand = "/coin-approve"

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



