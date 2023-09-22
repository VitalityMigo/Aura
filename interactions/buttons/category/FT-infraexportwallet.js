
const { ButtonInteraction } = require('discord.js');
const { ActionRowBuilder, EmbedBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const { accessSql, profileData, adminsql, reportsql, infra_friendTech, sequelize } = require('../../../events/database');
const moment = require('moment');

const decrypt = require('../../../functions/decrypt');
const { stringify } = require('csv-stringify');



const buttonsRowModify = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('infra_friendtechmodifywallet-button')
            .setLabel('modify wallet')
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId('infra_friendtechexportwallet-button')
            .setLabel('export')
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId('infra_friendtechdeletewallet-button')
            .setLabel('delete wallet')
            .setStyle(4)
    );




module.exports = {
    id: 'infra_friendtechexportwallet-button',

    async execute(interaction) {
        if (!(interaction instanceof ButtonInteraction)) return;

        //Récupérer informations de l'utilisateur de la commande
        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id
        let botId = interaction.applicationId
        let member = interaction.member;


        try {

            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")

            if (interaction.message.interaction.user.id === authorId) {


                const userSetup = await infra_friendTech.findOne({ where: { authorId: authorId } })

                const walletAddress = decrypt(userSetup.dataValues.walletAddress)
                const privateKey = decrypt(userSetup.dataValues.privateKey)

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
                    const arr = [obj.walletAddress, obj.privateKey, "Base"];
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
                        const csvName = authorName.split(' ')[0] + "friendtech_wallet_setup.csv";

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

                    const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Friend Tech Setup")
                        .setDescription(">>> Displaying your Friend.tech wallet setup")
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .addFields(
                            { name: "Wallet:", value: "`" + walletAddress.toLowerCase() + "`", inline: true },
                            { name: " ", value: " ", inline: false },
                            { name: " ", value: "*✅ The wallets infos have been sent to your DMs. Private keys are not stored.*", inline: false },

                        )
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.update({ embeds: [errorNotEthereum], components: [buttonsRowModify] });





                } else if (isDMOpen == false) {

                    const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Friend Tech Setup")
                        .setDescription(">>> Displaying your Friend.tech wallet setup")
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .addFields(
                            { name: "Wallet:", value: "`" + walletAddress.toLowerCase() + "`", inline: true },
                            { name: " ", value: " ", inline: false },
                            { name: " ", value: "*❌ Your DMs are closed. Please unable server DMs to receive your wallets.*", inline: false },

                        )
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.update({ embeds: [errorNotEthereum], components: [buttonsRowModify] });

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
                .setAuthor({ name: "Rolls Chasers Analytics", iconURL: "https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png" })
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




