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
const { profileData, reportsql, watchlistSql, walletsgenerated, vouchData, wallets, accessSql, interactionData, adminsql, apimonitorsql, walletManager, sequelize } = require('../../../events/database');
const moment = require('moment');
const encrypt = require('../../../functions/encrypt');
const convertTimestamp = require('../../../functions/dayago');


//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const reservoirApiKey = process.env.reservoirApiKey


//Web3 API + Cloudfare Provider
var Web3 = require("web3")
const web3 = new Web3("https://cloudflare-eth.com")

const sdk = require('api')('@reservoirprotocol/v3.0#5fxm01pliufqnan');
sdk.auth(reservoirApiKey);



const buttons2Row = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('walletmanagersetupmodifymain-button')
            .setLabel('modify main wallet')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('walletmanagersetupdeletemain-button')
            .setLabel('delete main wallet')
            .setStyle(4),
        new ButtonBuilder()
            .setCustomId('walletmanagermenu-button')
            .setLabel('menu')
            .setStyle(2),


    );



module.exports = {
    id: "walletmanager-setupsetmain",

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
        const publicKey = interaction.fields.getTextInputValue('publicKey');
        const privateKey = interaction.fields.getTextInputValue('privateKey');


        const encryptedAddress = encrypt(publicKey);
        const encryptedPK = encrypt(privateKey);

        await walletManager.create({ authorId: authorId.toString(), authorName: authorName.toString(), walletAddress: encryptedAddress.toString(), walletPK: encryptedPK.toString(), })


        //On récupère la balance de token

        const ethBalance = await web3.eth.getBalance(publicKey)
        const ethBalanceFormatted = parseFloat(web3.utils.fromWei((ethBalance).toString(), 'ether'))


        let txnHistoryEmbed = ""
        let numberOfRound = 0
        let txnType = "unknown"
        let txnDirection = "in"
        let txnDate = "today"
        let txnPrice = "0.000"

        sdk.getUsersActivityV6({ users: publicKey, accept: '*/*' })
            .then(async ({ data: userActivity }) => {


                for (const txn of userActivity.activities) {

                    numberOfRound++

                    txnType = txn.type
                    if (txn.fromAddress == publicKey && txn.toAddress == publicKey) { txnDirection = "out" }
                    txnDate = convertTimestamp(txn.timestamp)
                    if (txnType !== "transfer" && txnType !== "mint") { txnPrice = parseFloat(txn.price.amount.decimal).toFixed(3) }




                    let lignMaxSize = 55
                    let leftPartNfts = "`" + txnType + " ∙ " + txnDirection + " ∙ " + txnDate
                    let rightPartNfts = txnPrice + "Ξ`\n"
                    let leftPartNFTsLenght = leftPartNfts.length
                    let rightPartNftsLenght = rightPartNfts.length
                    let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                    let spaceLenght = ""
                    for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

                    txnHistoryEmbed += "`" + txnType + " ∙ " + txnDirection + " ∙ " + txnDate + spaceLenght + txnPrice + "Ξ`\n"

                    if (numberOfRound == 6) { break }

                }

            



        const walletManagerEmbed = new EmbedBuilder().setColor("#060A8F")
            .setTitle("Wallet Manager")
            .setDescription(">>> Your main wallet is the one that controls everything for all the module. It's also the only one that needs public address and private key. Make sure to keep it safe")
            .setImage("https://cdn.discordapp.com/attachments/949291624389816334/1122703923950665848/Pallette_8.png")
            .addFields(
                { name: " ", value: " ", inline: false },
                { name: "Public address", value: "`" + publicKey + "`", inline: true },
                { name: "Private Key", value: "`" + privateKey + "`", inline: true },
                { name: " ", value: " ", inline: false },
                { name: "Available Funds", value: "`" + parseFloat(ethBalanceFormatted).toFixed(3) + "Ξ`", inline: true },
                { name: "Txn History", value: txnHistoryEmbed, inline: false },
                { name: " ", value: " ", inline: false },
                { name: " ", value: "*✅ Your main wallet has been registered and crypted*", inline: false },



            )
            .setTimestamp()
            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

        await interaction.update({ embeds: [walletManagerEmbed], components: [buttons2Row] });



    })







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
            let reportCommand = "/team-subscribtionCancelSubPassword"

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
