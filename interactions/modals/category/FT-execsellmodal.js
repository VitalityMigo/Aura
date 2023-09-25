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

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(`https://1rpc.io/base`))
const web3Eth = new Web3("https://cloudflare-eth.com")


const axios = require("axios")

const shareContractAbi = require("../../../contracts/friendtech/share.json")
const shareContractAddress = "0xcf205808ed36593aa40a44f10c7f7c2f67d4a4d4"
const shareContract = new web3.eth.Contract(shareContractAbi, shareContractAddress);

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
    id: "modal_friendtech_exec_sell_",

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

                const subject = "0x" + matches[1]

                const amount = interaction.fields.getTextInputValue('modal_friendtech_exec_sell_' + subject + "_amountR1");

                const userSetup = await infra_friendTech.findOne({ where: { authorId: authorId } })

                if (userSetup != null) {

                    const sender = decrypt(userSetup.dataValues.walletAddress)
                    const senderPK = decrypt(userSetup.dataValues.privateKey)

                    const supplyHeld = await shareContract.methods.sharesBalance(subject, sender).call();




                    if (amount <= supplyHeld) {

                        const subjectProfile = await axios.get('https://prod-api.kosetto.com/users/' + subject)

                        const valueWEI = await shareContract.methods.getSellPriceAfterFee(subject, amount).call();
                        const valueETH = (valueWEI / 10 ** 18)
                        const shareValue = (valueWEI / 10 ** 18) / amount

                        const subjectName = subjectProfile.data.twitterName
                        const supply = subjectProfile.data.shareSupply
                        const newSupply = parseFloat(supply) - parseFloat(amount)



                        if (newSupply > 0) {


                            const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Sell Shares")
                                .setDescription(">>> Displaying the simulated transaction data")
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setTimestamp()
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Target", value: "`" + subjectName.toLowerCase() + "`", inline: false },
                                    { name: "Sell Price", value: "`" + parseFloat(shareValue).toFixed(3) + "Ξ`", inline: true },
                                    { name: "Sell Amount", value: "`" + amount + "`", inline: true },
                                    { name: "Simulation", value: "<a:AuraLoading:1134068847616458792>", inline: false },

                                )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })



                            await interaction.reply({ embeds: [gasTrackerEmbed], components: [buttonRowChoice], ephemeral: true });




                            // const valueWEI = web3.utils.toWei(valueETH.toString(), 'ether');
                            let simulationState = true
                            let gasUsed = ""
                            let errorMessageFormatted = ""

                            try {
                                gasUsed = await shareContract.methods.sellShares(subject, amount).estimateGas({ from: sender.toLowerCase(), value: "0" });
                            } catch (error) {

                                simulationState = false
                                let message = error.message
                                console.log("erreur")
                                if (message.startsWith("Returned")) {
                                    errorMessageFormatted = message.replace("Returned error: ", "")
                                }
                            }

                            if (simulationState == true) {


                                const gasPriceCall = await web3.eth.getGasPrice()
                                const gasPriceGwei = gasPriceCall / 10 ** 9
                                const gasPriceEth = gasPriceCall / 10 ** 18

                                const gasPayed = gasPriceEth * gasUsed
                                const totalValue = valueETH - gasPayed

                                const txnDataFormatted = "Sender: " + sender + "\nGas Price: " + parseFloat(gasPriceGwei).toFixed(0) + " gwei\n\nReceive: " + parseFloat(valueETH).toFixed(5) + "Ξ (fees included)\nGas fees: " + parseFloat(gasPayed).toFixed(5) + "Ξ\n\nTotal Value Received: " + parseFloat(totalValue).toFixed(5) + "Ξ"


                                const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Sell Shares")
                                    .setDescription(">>> Displaying the simulated transaction data")
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setTimestamp()
                                    .addFields(
                                        { name: " ", value: " ", inline: false },
                                        { name: "Target", value: "`" + subjectName.toLowerCase() + "`", inline: false },
                                        { name: "Sell Price", value: "`" + parseFloat(shareValue).toFixed(3) + "Ξ`", inline: true },
                                        { name: "Sell Amount", value: "`" + amount + "`", inline: true },
                                        { name: "Transaction Data ✅", value: "```" + txnDataFormatted + "```", inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                                await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [buttonRowChoice], ephemeral: true });



                                exe_friendTech.destroy({ where: { authorId: authorId, serverId: serverId, treated: null } });

                                // On enregistre les infos
                                let table = []
                                let obj = {}
                                obj.sender = encrypt(sender)
                                obj.senderPK = encrypt(senderPK)
                                obj.subject = subject.toLowerCase()
                                obj.subjectName = subjectName
                                obj.action = "📉 Sell"
                                obj.getSellPriceAfterFee = valueETH
                                obj.amount = amount
                                table.push(obj)

                                await exe_friendTech.create({

                                    serverId: serverId,
                                    authorId: authorId,
                                    authorName: authorName,
                                    isBuy: "false",
                                    subject: JSON.stringify(table),
                                    value: '0',
                                    simulation: "true",
                                    expectedPrice: totalValue.toString(),

                                })




                            } else {

                                const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Sell Shares")
                                    .setDescription(">>> Displaying the simulated transaction data")
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setTimestamp()
                                    .addFields(
                                        { name: " ", value: " ", inline: false },
                                        { name: "Target", value: "`" + subjectName.toLowerCase() + "`", inline: false },
                                        { name: "Share Price", value: "`" + parseFloat(shareValue).toFixed(3) + "Ξ`", inline: true },
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
