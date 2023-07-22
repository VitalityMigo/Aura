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
const { profileData, reportsql, watchlistSql, walletsgenerated, vouchData, wallets, accessSql, interactionData, adminsql, apimonitorsql, sequelize } = require('../../../events/database');
const moment = require('moment');


//Web3 API + Cloudfare Provider
var Web3 = require("web3")
const web3 = new Web3("https://cloudflare-eth.com")






module.exports = {
    id: "walletmanager-generate",

    async execute(interaction) {


        //Récupérer informations de l'utilisateur de la commande
        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png`;
        let serverId = interaction.member.guild.id
        let botId = interaction.applicationId

        //try {

        //Checkpoint
        console.log("// Step 1 : Initialization - Executed ✅")
        //Checkpoint
        console.log("// Step 2 : Authorization - Executed ✅")




        //Récupère le password donné par l'utilisateur
        const walletNumber = interaction.fields.getTextInputValue('nbWallets');


        let walletTable = []
        let walletCreatedList = ""
        let generationStatut = "`Failed`"





        for (let i = 0; i < walletNumber; i++) {

            const wallet = web3.eth.accounts.create();

            walletTable.push(wallet);


        }


        const filteredWalletTable = walletTable.map(obj => ({ address: obj.address, privateKey: obj.privateKey, authorId: authorId }));
        const filteredWalletAddresses = walletTable.map(obj => obj.address);

        await walletsgenerated.destroy({ where: { authorId: authorId } })

        for (let i = 0; i < filteredWalletTable.length; i++) {

            await walletsgenerated.create({

                authorId: filteredWalletTable[i].authorId,
                walletAddress: filteredWalletTable[i].address,
                privateKey: filteredWalletTable[i].privateKey,

            })

        }

        let walletDisplayLimit = 0

        console.log(filteredWalletAddresses)

        for (const address of filteredWalletAddresses) {


            if (walletDisplayLimit < 19) {

                walletCreatedList += address + ",        \n"

            } else if (walletDisplayLimit === 19) {

                walletCreatedList += "and " + (walletNumber - 19) + " more..."

            } else if (walletDisplayLimit > 19) {



            }
            walletDisplayLimit += 1


        }


        generationStatut = "`Succeed`"





        const buttonCSV = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('download-button')
                    .setLabel('Download CSV')
                    .setStyle(2),
                new ButtonBuilder()
                    .setCustomId('walletGenerator-button')
                    .setLabel('menu')
                    .setStyle(2)
            );


        const walletGenerator = new EmbedBuilder().setColor("#060A8F")
            .setTitle("Wallet Generator")
            .setDescription(">>> `" + walletNumber + "` wallets have been successfully generated")
            .setAuthor({ name: authorName, iconURL: userAvatar })
            .setTimestamp()
            .addFields(
                { name: "Wallet Count", value: "`" + walletNumber + "`", inline: true },
                { name: "Network", value: "`Ethereum (ETH)`", inline: true },
                { name: "Generation Statut", value: generationStatut, inline: true },
                { name: "Wallets Created:", value: "```" + walletCreatedList + "```", inline: false },
            )
            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

        await interaction.update({ embeds: [walletGenerator], components: [buttonCSV]});




        //On enregistre le call API dans la database
        const timeStamp = Date.now();
        await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/walletgenerator", apiCallName: "walletCreate", apiProvider: "web3.eth", timestamp: timeStamp.toString() })







        return;

        // } catch (error) {



        //     console.log("// Error - sent in report ❌")

        //     //On envoi une notif
        //     const botAdmins = await adminsql.findOne({ where: { botId: botId } })
        //     const mainServerId = botAdmins.dataValues.mainServerId
        //     const logChannelId = botAdmins.dataValues.logChannelId
        //     const guild = interaction.client.guilds.cache.get(mainServerId);
        //     const channel = guild.channels.cache.get(logChannelId);


        //     const adminAccessInfos = await accessSql.findOne({ where: { serverId: serverId } })
        //     let adminRoleId = adminAccessInfos.dataValues.adminRoleId
        //     let serverName = adminAccessInfos.dataValues.serverName
        //     const userRoleList = interaction.member._roles
        //     let userHighestRole = "Member"
        //     if (userRoleList.includes(adminRoleId)) { userHighestRole = "Team" }
        //     let reportCommand = "/team-subscribtionCancelSubPassword"

        //     const timeStamp = Date.now();
        //     const date = new Date(timeStamp);
        //     const dateLisible = date.toLocaleString();
        //     const date1 = moment(dateLisible, 'M/D/YYYY, h:mm:ss A');
        //     const formattedDate = date1.format('Do [of] MMMM YYYY');



        //     //On enregistre le call
        //     await reportsql.create({
        //         botId: botId,
        //         authorId: "Bot",
        //         serverName: serverName,
        //         authorRole: userHighestRole,
        //         serverId: serverId,
        //         date: formattedDate,
        //         reportType: "Bug",
        //         reportCommand: reportCommand,
        //         reportDescription: "```" + error.stack + "```",
        //         reportPriority: "5",
        //         reportState: "Not treated",
        //     })


        //     const updateEmbed = new EmbedBuilder().setColor("#060A8F")
        //         .setTitle("New Report")
        //         .setDescription(">>> A new report has just been sent.")
        //         .setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
        //         .setAuthor({ name: "Rolls Chasers Analytics", iconURL: "https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg" })
        //         .setTimestamp()
        //         .addFields(
        //             { name: " ", value: " ", inline: false },
        //             { name: "Content:", value: "A new `bug` has been submitted for the `" + reportCommand + "` command by `the bot report division` in `" + serverName + "`. You can use the administrator dashboard to consult it.", inline: false },

        //         )
        //                             .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


        //     await channel.send({ embeds: [updateEmbed] });


        //     const errorAnswerUser = new EmbedBuilder().setColor("#060A8F")
        //         .setTitle("An error occured")
        //         .setDescription("An error has occurred while executing this command. These errors can occur for a variety of reasons, such as :\n∙ Unexpected traffic\n∙ API maintenance\n∙ Occasional bug\n\nPlease note that a report has already been sent to our team, who will fix the problem as soon as possible. You can still use `/report` to give more details about the error and help our team.")
        //         .setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
        //         .setTimestamp()
        //                             .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


        //     await interaction.reply({ embeds: [errorAnswerUser], ephemeral: true });


        // }
    },
};
