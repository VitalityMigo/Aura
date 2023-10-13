

/**
 * @file Sample modal interaction
 * @author JAYZHVJ
 * @since 3.2.0
 * @version 3.2.2
 */

/**
 * @type {import('../../../typings').ModalInteractionCommand}
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { profileData, reportsql, watchlistSql, walletsgenerated, vouchData, wallets, accessSql, interactionData, adminsql, infra_friendTech, exe_friendTech, sequelize } = require('../../../events/database');
const moment = require('moment');

const encrypt = require("../../../functions/encrypt")
const decrypt = require("../../../functions/decrypt")

const { web3BaseBlast, web3Base1RPC, web3BaseUnifra } = require('../../../config/web3config');


const axios = require("axios")

const shareContractAbi = require("../../../contracts/friendtech/share.json")
const shareContractAddress = "0xcf205808ed36593aa40a44f10c7f7c2f67d4a4d4"
const shareContract = new web3BaseBlast.eth.Contract(shareContractAbi, shareContractAddress);
const baseChainId = "8453"

const protocolFee = 5
const subjectFee = 5







const buttonRowChoice = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('friendtech_exec_confirm')
            .setLabel('Confirm')
            .setEmoji("✅")
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId('friendtech_exec_cancel')
            .setLabel('Cancel')
            .setStyle(4),

    );


const buttonRowChoiceNo = new ActionRowBuilder()
    .addComponents(

        new ButtonBuilder()
            .setCustomId('friendtech_exec_cancel')
            .setLabel('Cancel')
            .setStyle(4),

    );


const buttonsRowNew = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('infra_friendtechnewwallet-button')
            .setLabel('import wallet')
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId('infra_friendtechgeneratewallet-button')
            .setLabel('generate wallet')
            .setStyle(3),

    );





module.exports = {
    id: "button_friendtech_exec_quicksell_",

    async execute(interaction) {


        //Récupérer informations de l'utilisateur de la commande
        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id
        let botId = interaction.applicationId

        try {


            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")
            //Checkpoint
            console.log("// Step 2 : Authorization - Executed ✅")

            //Récupère le password donné par l'utilisateur

            const customId = interaction.customId


            // Utilisation d'une expression régulière pour extraire l'adresse Ethereum
            const regex = /_0x([0-9a-fA-F]{40})/;
            const matches = customId.match(regex);

            if (matches && matches[1]) {

                // On récupère l'addresse du subject et défini le quickbuy à 1
                const subject = "0x" + matches[1]
                const amount = 1
                const action = "❄️ Flash Sell"
                const value = 0


                // on récupère le set up infra du user (wallet)
                const userSetup = await infra_friendTech.findOne({ where: { authorId: authorId } })

                if (userSetup != null) {


                    const sender = decrypt(userSetup.dataValues.walletAddress)
                    const senderPK = decrypt(userSetup.dataValues.privateKey)



                    // on récupère le profil du subject
                    const subjectProfile = await axios.get('https://prod-api.kosetto.com/users/' + subject)

                    const subjectName = subjectProfile.data.twitterName
                    const supply = subjectProfile.data.shareSupply

                    const supplyHeld = await shareContract.methods.sharesBalance(subject, sender).call();

                    if (amount <= supplyHeld) {



                        if (supply > 0) {




                            // On renvoi le premier embed
                            const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Transaction Simulating <a:AuraLoading:1134068847616458792>")
                                .setDescription(">>> Displaying the transaction execution")
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Target", value: "`" + subjectName.toLowerCase() + "`", inline: true },
                                    { name: "Action", value: "`" + action + "`", inline: true },
                                    { name: " ", value: " ", inline: false },
                                    { name: "Transaction hash", value: "<a:AuraLoading:1134068847616458792>", inline: false },

                                )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.reply({ embeds: [gasTrackerEmbed2], ephemeral: true });



                            const valueWEI = await shareContract.methods.getSellPriceAfterFee(subject, amount).call();
                            const valueETH = (valueWEI / 10 ** 18)
                            const sharePrice = (valueWEI / 10 ** 18)


                            // const valueWEI = web3.utils.toWei(valueETH.toString(), 'ether');
                            let simulationState = true
                            let gasUsed = ""
                            let errorMessageFormatted = ""


                            try {
                                gasUsed = await shareContract.methods.sellShares(subject, amount).estimateGas({ from: sender.toLowerCase(), value: 0 });
                            } catch (error) {

                                simulationState = false
                                let message = error.message
                                console.log("erreur")
                                if (message.startsWith("Returned")) {
                                    errorMessageFormatted = message.replace("Returned error: ", "")
                                }
                            }

                            if (simulationState == true) {




                                const gasPrice = await web3BaseUnifra.eth.getGasPrice()
                                const gasPriceEth = gasPrice / 10 ** 18

                                const gasPayed = gasPriceEth * gasUsed
                                const expectedValue = gasPayed + valueETH



                                // On renvoi le premier embed
                                const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Transaction Pending <a:AuraLoading:1134068847616458792>")
                                    .setDescription(">>> Displaying the transaction execution")
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setTimestamp()
                                    .addFields(
                                        { name: " ", value: " ", inline: false },
                                        { name: "Target", value: "`" + subjectName.toLowerCase() + "`", inline: true },
                                        { name: "Action", value: "`" + action + "`", inline: true },
                                        { name: " ", value: "**Selling** `" + amount + "` **share for** `" + expectedValue + "Ξ`", inline: false },
                                        { name: "Transaction hash", value: "<a:AuraLoading:1134068847616458792>", inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [gasTrackerEmbed], ephemeral: true });


                                // On encode les paramètres
                                const data = await shareContract.methods.sellShares(subject, amount).encodeABI();

                                // On définit les presets de gas
                                const gasLimit = 200000; // Limite de gaz (ajustez selon vos besoins)
                                const gas = 21000

                                //On construit l'objet de transaction
                                const txInfos = {
                                    gasPrice: gasPrice,
                                    gas: gas,
                                    gasLimit: gasLimit,
                                    to: shareContractAddress,
                                    value: value,
                                    data: data,
                                    chainId: baseChainId,

                                };

                                // On signe
                                const signedTx = await web3BaseBlast.eth.accounts.signTransaction(txInfos, senderPK);
                                const rawTransaction = signedTx.rawTransaction


                                // On envoie
                                web3BaseBlast.eth.sendSignedTransaction(rawTransaction)
                                    .then(async (receipt) => {


                                        let hash = receipt.transactionHash
                                        let gasPaid = receipt.gasUsed * (receipt.effectiveGasPrice / 10 ** 18)
                                        let totalPaid = parseFloat(valueETH) + parseFloat(gasPaid)
                                        let targetPart = (totalPaid / expectedValue) * 100;
                                        let status = receipt.status



                                        if (status == true) {

                                            const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                                .setTitle("Transaction Confirmed ✅")
                                                .setDescription(">>> Displaying the transaction execution")
                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                .setTimestamp()
                                                .addFields(
                                                    { name: " ", value: " ", inline: false },
                                                    { name: "Target", value: "`" + subjectName.toLowerCase() + "`", inline: true },
                                                    { name: "Action", value: "`" + action + "`", inline: true },
                                                    { name: " ", value: " ", inline: false },
                                                    { name: " ", value: "**Sold** `" + amount + "` **share for** `" + totalPaid + "Ξ` **(" + parseFloat(targetPart).toFixed(0) + "%)**", inline: false },
                                                    { name: " ", value: " ", inline: false },
                                                    { name: "Transaction hash:", value: "```" + hash + "```∟ Transaction details [here](https://basescan.org/tx/" + hash + ")", inline: false },

                                                )
                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                            await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });




                                        } else {



                                            const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                                .setTitle("Transaction Failed ❌")
                                                .setDescription(">>> Displaying the transaction execution")
                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                .setTimestamp()
                                                .addFields(
                                                    { name: " ", value: " ", inline: false },
                                                    { name: "Target", value: "`" + subjectName.toLowerCase() + "`", inline: true },
                                                    { name: "Action", value: "`" + action + "`", inline: true },
                                                    { name: " ", value: " ", inline: false },
                                                    { name: " ", value: "**Failed to sell** `" + amount + "` **share for** `" + expectedValue + "Ξ`", inline: false },
                                                    { name: " ", value: " ", inline: false },
                                                    { name: "Transaction hash:", value: "```" + hash + "```Transaction details [here](https://basescan.org/tx/" + hash + ")", inline: false },

                                                )
                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                            await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });




                                        }

                                        await exe_friendTech.destroy({ where: { authorId: authorId, serverId: serverId, treated: null } });



                                    })
                                    .catch(async (error) => {


                                        let errorMessageFormatted = ""
                                        let message = error.message
                                        console.log("erreur")
                                        if (message.startsWith("Returned")) {
                                            errorMessageFormatted = message.replace("Returned error: ", "")
                                        }


                                        const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle("Transaction Failed ❌")
                                            .setDescription(">>> Displaying the transaction execution")
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setTimestamp()
                                            .addFields(
                                                { name: " ", value: " ", inline: false },
                                                { name: "Target", value: "`" + subjectName.toLowerCase() + "`", inline: true },
                                                { name: "Action", value: "`" + action + "`", inline: true },
                                                { name: " ", value: " ", inline: false },
                                                { name: " ", value: "**Failed to sell** `" + amount + "` **share for** `" + expectedValue + "Ξ`", inline: false },
                                                { name: " ", value: " ", inline: false },
                                                { name: "Transaction error:", value: "```The transaction failed.\n\n" + errorMessageFormatted + "```", inline: false },

                                            )
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                        await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });




                                        console.error('Erreur lors de lenvoi de la transaction signée : ', error);
                                    });





                            } else {


                                const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Buy Shares")
                                    .setDescription(">>> Displaying the simulated transaction data")
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setTimestamp()
                                    .addFields(
                                        { name: " ", value: " ", inline: false },
                                        { name: "Target", value: "`" + subjectName.toLowerCase() + "`", inline: false },
                                        { name: "Share Price", value: "`" + parseFloat(sharePrice).toFixed(3) + "Ξ`", inline: true },
                                        { name: "Amount", value: "`" + amount + "`", inline: true },
                                        { name: "Transaction Data 🚫", value: "```The transaction simulation failed.\n\n" + errorMessageFormatted + "```", inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                                await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [buttonRowChoiceNo], ephemeral: true });


                            }


                        } else {



                            const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Sell Shares")
                                .setDescription(">>> Displaying your Friend.tech transaction")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .addFields(
                                    { name: " ", value: "You can't sell this key because the last key cannot be sold.", inline: true },

                                )
                                .setTimestamp()
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.reply({ embeds: [errorNotEthereum], components: [buttonRowChoiceNo], ephemeral: true });




                        }


                    } else {



                        const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Sell Shares")
                            .setDescription(">>> Displaying your Friend.tech transaction")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .addFields(
                                { name: " ", value: "You don't have enough keys. You're trying to sell `" + amount + "` keys but you're holding only `" + supplyHeld + "`. Please enter a valid amount.", inline: true },

                            )
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.reply({ embeds: [errorNotEthereum], components: [buttonRowChoiceNo], ephemeral: true });




                    }

                } else {


                    const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Friend Tech Setup")
                        .setDescription(">>> Displaying your Friend.tech wallet setup")
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .addFields(
                            { name: " ", value: "You don't have a wallet imported in your Friend.tech portfolio. To get started, use the button below.", inline: true },

                        )
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.reply({ embeds: [errorNotEthereum], components: [buttonsRowNew], ephemeral: true });




                }


            } else {


                const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Buy Shares")
                    .setDescription("An error occured while retreiving the subject's Friend.Tech address. Please try again using `/friendtech user` or contact a team member if you need help.")
                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                    .setAuthor({ name: "Aura", iconURL: "https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png" })
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                await interaction.reply({ embeds: [gasTrackerEmbed2], ephemeral: true });




            }






            return;

        } catch (error) {



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
            let reportCommand = "/FT-quicksell"

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
