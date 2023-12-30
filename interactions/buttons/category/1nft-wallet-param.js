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
const { accessSql, profileData, adminsql, reportsql, infra_nft, sequelize } = require('../../../events/database');
const moment = require('moment');

const encrypt = require("../../../functions/encrypt")
const decrypt = require('../../../functions/decrypt');
const { stringify } = require('csv-stringify');

const { web3CloudflarePublic } = require("../../../config/web3config")



const buttonsRowNew = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('button_infra_nft_walletsetup_import')
            .setLabel('import wallet')
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId('button_infra_nft_walletsetup_generate')
            .setLabel('generate wallet')
            .setStyle(3),

    );


const buttonsRowModify = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('button_infra_nft_walletsetup_import')
            .setLabel('modify wallet')
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId('button_infra_nft_walletsetup_export')
            .setLabel('export')
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId('button_infra_nft_walletsetup_delete')
            .setLabel('delete wallet')
            .setStyle(4)
    );

const buttonsRowConfig = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('button_infra_nft_walletsetup_gaspreset')
            .setLabel('Set Gas Preset')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('button_infra_nft_walletsetup_maxgwei')
            .setLabel('Set Max Gwei')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('button_infra_nft_walletsetup_apemode')
            .setLabel('Set Ape Mode')
            .setStyle(2),
        // new ButtonBuilder()
        //     .setCustomId('button_infra_coin_walletsetup_autoapproval')
        //     .setLabel('Set Auto Approval')
        //     .setStyle(2),
    );





module.exports = {
    id: 'button_infra_nft_walletsetup_',

    async execute(interaction) {
        if (!(interaction instanceof ButtonInteraction)) return;

        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id
        let botId = interaction.applicationId
        let member = interaction.member;

        try {

            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")




            //Checkpoint
            console.log("// Step 2 : Authorization - Executed ✅")



            const customId = interaction.customId

            const match = customId.match(/button_infra_nft_walletsetup_(.+)/);


            if (match && match[1]) {

                const action = match[1];


                if (action === "import") {



                    //Checkpoint
                    console.log("// Step 1 : Initialization - Executed ✅")



                    //Checkpoint
                    console.log("// Step 2 : Authorization - Executed ✅")


                    const passwordAdminDashboard = new ModalBuilder()
                        .setCustomId('modal_infra_nft_walletsetup_import')
                        .setTitle('New NFT Wallet');

                    // Add components to modal

                    // Create the text input components
                    const channel = new TextInputBuilder()
                        .setCustomId('modal_infra_nft_walletsetup_importR1')
                        .setLabel("Private Key")
                        .setPlaceholder("The nft wallet private key")
                        .setStyle(TextInputStyle.Short)
                        .setMinLength(40)






                    // An action row only holds one text input,
                    // so you need one action row per text input.
                    const firstActionRowSetProfile = new ActionRowBuilder().addComponents(channel);


                    // Add inputs to the modal
                    passwordAdminDashboard.addComponents(firstActionRowSetProfile)

                    // Show the modal to the user
                    await interaction.showModal(passwordAdminDashboard);




                } else if (action === "generate") {




                    const account = await web3CloudflarePublic.eth.accounts.create();

                    const walletAddress = account.address
                    const privateKey = (account.privateKey).replace("0x", "")

                    const encryptWA = encrypt(walletAddress)
                    const encryptPK = encrypt(privateKey)



                    await infra_nft.destroy({ where: { authorId: authorId } })

                    await infra_nft.create({

                        authorId: authorId,
                        authorName: authorName,
                        walletAddress: encryptWA,
                        privateKey: encryptPK,
                        ape_mode: 'false',
                        auto_approval: 'false',


                    })



                    const balance = 0

                    const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("NFT Setup")
                        .setDescription(">>> Displaying your NFT wallet setup")
                        .setImage('https://cdn.discordapp.com/attachments/949291624389816334/1122703923950665848/Pallette_8.png')
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .addFields(
                            { name: "Wallet:", value: "`" + walletAddress.toLowerCase() + "`\n∟ Balance: " + parseFloat(balance).toFixed(3) + "Ξ", inline: true },
                            { name: " ", value: " ", inline: false },
                            { name: "Default Gas:", value: "`Auto`", inline: true },
                            { name: "Default Max Gwei:", value: "`Auto`", inline: true },
                            { name: "Ape Mode", value: "`❌`", inline: true },
                            { name: " ", value: " ", inline: false },
                            { name: " ", value: "*✅ Your wallet has been succesfuly generated, encrypted and registered to your profile. Use export to donwload the private key.*", inline: false },



                        )
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.update({ embeds: [errorNotEthereum], components: [buttonsRowModify, buttonsRowConfig,] });






                } else if (action === "delete") {


                    await infra_nft.destroy({ where: { authorId: authorId } })


                    const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("NFT Setup")
                        .setDescription(">>> Displaying your NFT wallet setup")
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .addFields(
                            { name: " ", value: "You're wallet have been completely deleted from the database. You can use the button below to set a new one. All your tasks are now inactive.", inline: true },

                        )
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.update({ embeds: [errorNotEthereum], components: [buttonsRowNew] });



                } else if (action === "export") {


                    const userSetup = await infra_nft.findOne({ where: { authorId: authorId } })

                    // On définit les valeurs de l'embed
                    const walletAddress = decrypt(userSetup.dataValues.walletAddress)
                    const privateKey = decrypt(userSetup.dataValues.privateKey)

                  
                    let gasPreset = userSetup.dataValues.gas_preset
                    let max_gwei = userSetup.dataValues.max_gwei
                    let slippage = userSetup.dataValues.slippage

                    let ape_mode = userSetup.dataValues.ape_mode

                    if (gasPreset == null) { gasPreset = "Auto" } else { gasPreset = "+" + parseFloat(gasPreset).toFixed(0) + "%" }
                    if (slippage == null) { slippage = "Auto" } else { slippage = parseFloat(gasPreset).toFixed(0) + "%" }
                    if (max_gwei == null) { max_gwei = "Auto" } else { max_gwei = parseFloat(max_gwei).toFixed(0) + " gwei" }

                    if (ape_mode == "true") { ape_mode = "✅" } else { ape_mode = "❌" }



                    const exportTable = []
                    let obj = {}
                    obj.walletAddress = walletAddress
                    obj.privateKey = privateKey
                    exportTable.push(obj)

                    let isDMOpen = true
                    let messageSent = false


                    const header = ['Address', 'Private Key', 'Chain'];
                    const dataArrays = [['Address', 'Private Key', 'Chain']];

                    exportTable.forEach(obj => {
                        const arr = [obj.walletAddress, obj.privateKey, "Ethereum"];
                        dataArrays.push(arr)

                    });

                    const sendMessage = async () => {
                        try {
                            const output = await new Promise((resolve, reject) => {
                                stringify(dataArrays, {
                                    header,
                                    delimiter: ';'
                                }, (err, output) => {
                                    if (err) {
                                        console.log(18, err);
                                        reject(err);
                                    } else {
                                        resolve(output);
                                    }
                                });
                            });

                            const buffer = Buffer.from(output, 'utf-8');
                            const csvName = authorName.split(' ')[0] + "nft_wallet_setup.csv";

                            await member.send({
                                files: [{ attachment: buffer, name: csvName }]
                            });

                            console.log("Message envoyé avec succès !");
                        } catch (error) {
                            console.error("Une erreur s'est produite :", error);

                            if (error.message.includes("Cannot send messages to this user") || error.message.includes("Impossible d'envoyer un message à cet utilisateur.")) {
                                isDMOpen = false;
                            }
                        }
                    };


                    await sendMessage();




                    if (isDMOpen == true) {

                        const balance = await web3CloudflarePublic.eth.getBalance(walletAddress) / 10 ** 18

                        const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("NFT Setup")
                            .setDescription(">>> Displaying your NFT wallet setup")
                            .setImage('https://cdn.discordapp.com/attachments/949291624389816334/1122703923950665848/Pallette_8.png')
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .addFields(
                                { name: "Wallet:", value: "`" + walletAddress.toLowerCase() + "`\n∟ Balance: " + parseFloat(balance).toFixed(3) + "Ξ", inline: true },
                                { name: " ", value: " ", inline: false },
                                { name: "Default Gas:", value: "`" + gasPreset + "`", inline: true },
                                { name: "Default Max Gwei:", value: "`" + max_gwei + "`", inline: true },
                                { name: "Ape Mode", value: "`" + ape_mode + "`", inline: true },
                                { name: " ", value: " ", inline: false },
                                { name: " ", value: "*✅ The wallets infos have been sent to your DMs. Private keys are crypted.*", inline: false },

                            )
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.update({ embeds: [errorNotEthereum], components: [buttonsRowModify, buttonsRowConfig,] });





                    } else if (isDMOpen == false) {

                        const balance = await web3CloudflarePublic.eth.getBalance(walletAddress) / 10 ** 18

                        const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("NFT Setup")
                            .setDescription(">>> Displaying your NFT wallet setup")
                            .setImage('https://cdn.discordapp.com/attachments/949291624389816334/1122703923950665848/Pallette_8.png')
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .addFields(
                                { name: "Wallet:", value: "`" + walletAddress.toLowerCase() + "`\n∟ Balance: " + parseFloat(balance).toFixed(3) + "Ξ", inline: true },
                                { name: " ", value: " ", inline: false },
                                { name: "Default Gas:", value: "`" + gasPreset + "`", inline: true },
                                { name: "Default Max Gwei:", value: "`" + max_gwei + "`", inline: true },
                                { name: "Ape Mode", value: "`" + ape_mode + "`", inline: true },
                                { name: " ", value: " ", inline: false },
                                { name: " ", value: "*❌ Your DMs are closed. Please unable server DMs to receive your wallets.*", inline: false },

                            )
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.update({ embeds: [errorNotEthereum], components: [buttonsRowModify, buttonsRowConfig,] });

                    }


                } else if (action === "gaspreset") {




                    const passwordAdminDashboard = new ModalBuilder()
                        .setCustomId('modal_infra_nft_walletsetup_gaspreset')
                        .setTitle('Set Gas Preset');

                    // Add components to modal

                    // Create the text input components
                    const channel = new TextInputBuilder()
                        .setCustomId('modal_infra_nft_walletsetup_gaspresetR1')
                        .setLabel("Gas Ratio")
                        .setPlaceholder("The percentage of gas to use in addition to the base (in %)")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)




                    // An action row only holds one text input,
                    // so you need one action row per text input.
                    const firstActionRowSetProfile = new ActionRowBuilder().addComponents(channel);


                    // Add inputs to the modal
                    passwordAdminDashboard.addComponents(firstActionRowSetProfile)

                    // Show the modal to the user
                    await interaction.showModal(passwordAdminDashboard);



                } else if (action === "maxgwei") {



                    const passwordAdminDashboard = new ModalBuilder()
                        .setCustomId('modal_infra_nft_walletsetup_maxgwei')
                        .setTitle('Set Max Gwei');

                    // Add components to modal

                    // Create the text input components
                    const channel = new TextInputBuilder()
                        .setCustomId('modal_infra_nft_walletsetup_maxgweiR1')
                        .setLabel("Gwei Limit")
                        .setPlaceholder("The maximum Gwei the bot is allowed to use")
                        .setStyle(TextInputStyle.Short)



                    // An action row only holds one text input,
                    // so you need one action row per text input.
                    const firstActionRowSetProfile = new ActionRowBuilder().addComponents(channel);


                    // Add inputs to the modal
                    passwordAdminDashboard.addComponents(firstActionRowSetProfile)

                    // Show the modal to the user
                    await interaction.showModal(passwordAdminDashboard);




                } else if (action === "apemode") {



                    let taskEmbed = interaction.message.embeds[0].data


                    if (taskEmbed.fields.find(obj => obj.name === "Ape Mode").value == "`✅`") {

                        taskEmbed.fields.find(obj => obj.name === "Ape Mode").value = "`❌`";

                        await infra_nft.update({ ape_mode: "false", }, { where: { authorId: authorId } });
                        await interaction.update({ embeds: [taskEmbed], ephemeral: true });

                    } else {

                        taskEmbed.fields.find(obj => obj.name === "Ape Mode").value = "`✅`";

                        await infra_nft.update({ ape_mode: "true", }, { where: { authorId: authorId } });
                        await interaction.update({ embeds: [taskEmbed], ephemeral: true });

                    }



                }


            } else {

                const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Wallet Setup")
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
            let reportCommand = "/nft-setup-buttons"

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



