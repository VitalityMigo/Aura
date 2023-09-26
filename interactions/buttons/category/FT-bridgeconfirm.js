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
const { accessSql, profileData, adminsql, reportsql, exe_friendTech, infra_friendTech, sequelize } = require('../../../events/database');
const moment = require('moment');


//Web3 API + Cloudfare Provider
const Web3 = require("web3")
const web3Main = new Web3("https://1rpc.io/eth")


//On crée des instances des contrats
const mainnetBridgeContractAbi = require("../../../contracts/base/l1basebridge.json")
const mainnetBridgeProxyContractAddress = "0x3154cf16ccdb4c6d922629664174b904d80f2c35"
const mainnetBridgeContract = new web3Main.eth.Contract(mainnetBridgeContractAbi, mainnetBridgeProxyContractAddress);
const chainId = 1


// const mainnetBridgeContractAbi = require("../../../contracts/base/l1basebridge.json")
// const mainnetBridgeProxyContractAddress = "0xfA6D8Ee5BE770F84FC001D098C4bD604Fe01284a"
// const mainnetBridgeContract = new web3Main.eth.Contract(mainnetBridgeContractAbi, mainnetBridgeProxyContractAddress);
// const chainId = 5

const encrypt = require("../../../functions/encrypt")
const decrypt = require("../../../functions/decrypt");


function formatWallet(input) {
    return input.length > 35 ? `${input.substring(0, 5)}…${input.substring(input.length - 4)}` : input;
}






module.exports = {
    id: 'friendtech_exec_bridgeconfirm',


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



            if (interaction.message.interaction.user.id === authorId) {


                // On récupère les infos du trade simulé
                const userSetup = await exe_friendTech.findOne({ where: { authorId: authorId, serverId: serverId, treated: null, isBuy: "bridge" } })


                if (userSetup != null) {


                    const table = JSON.parse(userSetup.dataValues.subject)

                    const sender = decrypt(table[0].sender).toLowerCase()
                    const senderPK = decrypt(table[0].senderPK)

                    const receiver = sender

                    const type = table[0].type
                    const action = table[0].action

                    const valueWEI = userSetup.dataValues.value
                    const valueETH = userSetup.dataValues.value / 10 ** 18
                    const gasUnitsSimulation = userSetup.gasUnits 


                    const inputData = "0x"
                    const deaultGas = 0

                    if (type === "mainnet_to_base") {


                        // On renvoi le premier embed
                        const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Transaction Pending <a:AuraLoading:1134068847616458792>")
                            .setDescription(">>> Displaying the transaction execution")
                            
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .addFields(
                                { name: " ", value: " ", inline: false },
                                { name: "From", value: "`" + formatWallet(sender) + "`\n∟ Mainnet", inline: true },
                                { name: "To", value: "`" + formatWallet(sender) + "`\n∟ Base", inline: true },
                                { name: "Action", value: "`" + action + "`", inline: true },
                                { name: " ", value: " ", inline: false },
                                { name: " ", value: "**Bridging** `" + parseFloat(valueETH).toFixed(4) + "Ξ` **from the `Mainnet` to `Base`**", inline: false },
                                { name: "Transaction hash", value: "<a:AuraLoading:1134068847616458792>", inline: false },

                            )
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.reply({ embeds: [gasTrackerEmbed], ephemeral: true });


                        // On encode les paramètres
                        const data = await await mainnetBridgeContract.methods.depositETHTo(receiver, deaultGas, inputData).encodeABI();


                        // On définit les presets de gas
                        const averageGasLimit = 200000; // Limite de gaz (ajustez selon vos besoins)
                        let gasLimit = averageGasLimit
                        if (gasUnitsSimulation > averageGasLimit) { gasLimit = gasUnitsSimulation}
                        const maxPriorityGas = 0.3 * (10**9)

                        //On construit l'objet de transaction
                        const txInfos = {
                            gas: gasLimit,
                            maxPriorityFeePerGas: maxPriorityGas,
                            to: mainnetBridgeProxyContractAddress,
                            value: valueWEI,
                            data: data,
                            chainId: chainId,

                        };

                        // On signe
                        const signedTx = await web3Main.eth.accounts.signTransaction(txInfos, senderPK);
                        const rawTransaction = signedTx.rawTransaction

                        console.log(rawTransaction)

                        
                    
                        // On envoie
                        web3Main.eth.sendSignedTransaction(rawTransaction)
                            .then(async (receipt) => {
                                console.log(receipt)

                                let hash = receipt.transactionHash
                                let gasPaid = receipt.gasUsed * (receipt.effectiveGasPrice / 10 ** 18)
                                let totalPaid = parseFloat(valueETH) + parseFloat(gasPaid)
                                let status = receipt.status



                                if (status == true) {

                                    const gasConfirm = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle("Bridge Confirmed ✅")
                                        .setDescription(">>> Displaying the transaction execution")
                                        
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .addFields(
                                            { name: " ", value: " ", inline: false },
                                            { name: "From", value: "`" + formatWallet(sender) + "`\n∟ Mainnet", inline: true },
                                            { name: "To", value: "`" + formatWallet(sender) + "`\n∟ Base", inline: true },
                                            { name: "Action", value: "`" + action + "`", inline: true },
                                            { name: " ", value: " ", inline: false },
                                            { name: " ", value: "**Bridged** `" + parseFloat(valueETH).toFixed(4) + "Ξ` **from the `Mainnet` to `Base` with** " + parseFloat(gasPaid).toFixed(3) + "Ξ **of fees**", inline: false },
                                            { name: " ", value: " ", inline: false },
                                            { name: "Transaction hash:", value: "```" + hash + "```∟ Transaction details [here](https://etherscan.io/tx/" + hash + ")", inline: false },

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
                                            { name: "From", value: "`" + formatWallet(sender) + "`\n∟ Mainnet", inline: true },
                                            { name: "To", value: "`" + formatWallet(sender) + "`\n∟ Base", inline: true },
                                            { name: "Action", value: "`" + action + "`", inline: true },
                                            { name: " ", value: " ", inline: false },
                                            { name: " ", value: "**Failed to bridge** `" + parseFloat(valueETH).toFixed(4) + "Ξ` **from the `Mainnet` to `Base`**", inline: false },
                                            { name: " ", value: " ", inline: false },
                                            { name: "Transaction hash:", value: "```" + hash + "```Transaction details [here](https://basescan.org/tx/" + hash + ")", inline: false },

                                        )
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                    await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });




                                }

                                await exe_friendTech.update({ treated: "yes", txn: hash.toString() }, { where: { authorId: authorId, serverId: serverId, treated: null, isBuy: "bridge" } });


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
                                        { name: "From", value: "`" + formatWallet(sender) + "`\n∟ Mainnet", inline: true },
                                        { name: "To", value: "`" + formatWallet(sender) + "`\n∟ Base", inline: true },
                                        { name: "Action", value: "`" + action + "`", inline: true },
                                        { name: " ", value: " ", inline: false },
                                        { name: " ", value: "**Failed to bridge** `" + parseFloat(valueETH).toFixed(4) + "Ξ` **from the `Mainnet` to `Base`**", inline: false },
                                        { name: " ", value: " ", inline: false },
                                        { name: "Transaction error:", value: "```The transaction failed.\n\n" + errorMessageFormatted + "```", inline: false },

                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [gasConfirm], ephemeral: true });


                                await exe_friendTech.destroy({ where: { authorId: authorId, serverId: serverId, treated: null, isBuy: "bridge" } });


                                console.error('Erreur lors de lenvoi de la transaction signée : ', error);
                            });

                    } else if (type === "base_to_mainnet") {


                    }



                } else {


                    const errorAnswerUser = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Friend.Tech")
                        .setDescription("You don't have any ongoing task. Please do the buy steps again or contact a team member if you need any help.")
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                    await interaction.reply({ embeds: [errorAnswerUser], ephemeral: true });




                }








            } else {

                const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Bot Access")
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .setDescription("This button is not for you. You can only click on buttons generated by your commands. Please try again with your personal data.")
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



