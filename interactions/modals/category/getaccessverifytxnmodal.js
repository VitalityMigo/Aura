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
const { profileData, reportsql, paymentHistory, watchlistSql, walletsgenerated, vouchData, wallets, accessSql, interactionData, adminsql, sequelize } = require('../../../events/database');
const generateRandomString = require("../../../functions/randomkey")
const moment = require('moment');


//Web3 API + Cloudfare Provider
var Web3 = require("web3")
const web3 = new Web3("https://cloudflare-eth.com")

function isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

const buttonsRow1 = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('getaccessauthentificatewallet-button')
            .setLabel('Authentificate')
            .setStyle(1),
    )



module.exports = {
    id: "getaccessverifytxnmodal",

    async execute(interaction) {


        //Récupérer informations de l'utilisateur de la commande
        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id
        let botId = interaction.applicationId

        const timeStamp = Date.now();
        const actualTimestamp = parseFloat(timeStamp / 1000).toFixed(0)

        try {


            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")
            //Checkpoint
            console.log("// Step 2 : Authorization - Executed ✅")

            //Récupère le password donné par l'utilisateur
            const txnHash = interaction.fields.getTextInputValue('getaccessverifytxnmodalR1');

if(isValidEthereumAddress(txnHash)) {

            const rcwallet = "0x862284B87b774bbEC86c4f13bA6c283C4552AfAB"
            const price = 0.02


            const txnCall = await web3.eth.getTransaction(txnHash)



            const hash = txnCall.hash
            const from = txnCall.from
            const to = txnCall.to
            const value = txnCall.value / (10 ** 18)

            const txnHistoryCall = await paymentHistory.findOne({ where: { txnHash: hash } })


            const randomKey = generateRandomString(15)


            if (to.toLowerCase() == rcwallet.toLowerCase() && value >= price && txnHistoryCall == null) {

                const isAlreadyVerified = await paymentHistory.findOne({ where: { authorId: authorId, from: from } })

                if (isAlreadyVerified === null) {

                    const walletManager = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Get Access")
                        .setDescription("Your transaction has been approved. To finalize your subscription, follow the instructions below.\n\nYou paid your subscription with this address : `" + from + "`.\n\nTo authentificate your address, please add the following key to your Opensea username : `" + randomKey + "`\n\nYou'll be able to take it out right after the verification is done.")
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.reply({ embeds: [walletManager], components: [buttonsRow1], ephemeral: true });


                    //on enregiste le payement dans la database
                    await paymentHistory.create({

                        authorId: authorId.toString(),
                        authorName: authorName.toString(),
                        userAvatar: userAvatar.toString(),
                        txnHash: hash.toString(),
                        value: value.toString(),
                        from: from.toString(),
                        to: to.toString(),
                        days: "31",
                        timestamp: actualTimestamp.toString(),
                        randomKey: randomKey.toString(),
                        treated: 'no'

                    })


                    
                } else {


                   
                    

                    const walletManager = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Get Access")
                        .setDescription("Your subscription has been confirmed !\n\nYou don't need to verify your wallet since you already did it in the past.\n\nWe'd like to thank you for your trust and hope you'll profit from Aura. Feel free to ask any question to our team if you need.\n\nYour member role has been granted 👑.")
                        .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.reply({ embeds: [walletManager], ephemeral: true });


                }



            } else if (txnHistoryCall !== null) {




                const walletManager = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Get Access")
                    .setDescription("The transaction you provided has already been treated in the past. Please provide this month's transaction.\n\nIf you need any help, feel free to open a ticket.")
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                await interaction.reply({ embeds: [walletManager], ephemeral: true });




            } else if (to.toLowerCase() !== rcwallet.toLowerCase()) {



                const walletManager = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Get Access")
                    .setDescription("The transaction you provided isn't valid because the receiver is not our team's wallet. If you need to get the right receiver, click on the one of the plan above.\n\nIf you need any help, feel free to open a ticket.")
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                await interaction.reply({ embeds: [walletManager], ephemeral: true });



            } else if (value < price) {


                const walletManager = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Get Access")
                    .setDescription("The transaction you provided isn't valid because the amount sent is `" + (price - value) + "Ξ` below the selected plan's price (0.02Ξ). \n\nIf you need any help, feel free to open a ticket.")
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                await interaction.reply({ embeds: [walletManager], ephemeral: true });

            }


        } else {

            const walletManager = new EmbedBuilder().setColor("#060A8F")
            .setTitle("Get Access")
            .setDescription("The transaction you provided isn't valid because it's not an Ethereum one. \n\nIf you need any help, feel free to open a ticket.")
            .setTimestamp()
            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

        await interaction.reply({ embeds: [walletManager], ephemeral: true });


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
            let reportCommand = "/getaccess-veririfyTxnModal"

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
