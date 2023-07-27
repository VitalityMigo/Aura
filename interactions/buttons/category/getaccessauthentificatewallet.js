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
const { accessSql, profileData, paymentHistory, adminsql, reportsql, sequelize } = require('../../../events/database');
const moment = require('moment');

//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const openseaApiKey = process.env.openseaApiKey

const axios = require('axios')

// Configuration de l'en-tête d'autorisation
const headers = {
    'X-Api-Key': openseaApiKey
};

const addTimeout = require("../../../functions/addtimeout")

function generateProgressBar(tryCount) {
    // Limiter tryCount entre 0 et 10 pour s'assurer que la barre de progression ne dépasse pas 100%
    const progress = Math.min(Math.max(tryCount, 0), 10);

    const progressBar = '#####'.repeat(progress) + '_____'.repeat(10 - progress);
    const percentage = progress * 10;

    return `${progressBar} (${percentage}%)`;
}



module.exports = {
    id: 'getaccessauthentificatewallet-button',

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



            //On trouve la transaction qui vient d'être faite
            const txnHistoryCall = await paymentHistory.findAll({ where: { authorId: authorId } })

            const maxTimestampObj = txnHistoryCall[0]; // Accéder à l'objet payment

            for (let i = 1; i < txnHistoryCall.length; i++) {
                const currentObj = txnHistoryCall[i];
                if (currentObj.dataValues.timestamp > maxTimestampObj.dataValues.timestamp) {
                    maxTimestampObj = currentObj;
                }
            }


            const walletManager = new EmbedBuilder().setColor("#060A8F")
                .setTitle("Get Access")
                .setDescription("Please hold on, we're verifying your wallet. This operation can take up to 2 minutes maximum.\n\nThis page will be updated when it's done, don't close it.\n\nIn the meantime, you can start discovering the bot by reading the quick overview of its commands here : <#1108757530076774512>.")
                .addFields(
                    { name: " ", value: " ", inline: false },
                    { name: "Loading <a:AuraLoading:1134068847616458792>", value: "```__________________________________________________ [0%]```", inline: false },

                )
                .setTimestamp()
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

            await interaction.reply({ embeds: [walletManager], ephemeral: true });



            const randomKey = maxTimestampObj.dataValues.randomKey
            const walletAddress = maxTimestampObj.dataValues.from

            let tryCount = 0
            let isSameUsername = false
            let username = "not available"





            while (isSameUsername == false && tryCount <= 9) {


                const url = 'https://api.opensea.io/user/' + walletAddress + '?format=json'
                const response = await axios.get(url, { headers });
                const data = await response.data;

                username = data.username

                console.log(username + " / " + randomKey)


                if (username.includes(randomKey)) {

                    isSameUsername = true


                    const roleId = '1108761632928182424'; // Remplacez par l'ID de votre rôle
                    const role = interaction.guild.roles.cache.get(roleId);

                    interaction.member.roles.add(role)


                    const completeLoading = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Get Access")
                        .setDescription("Please hold on, we're verifying your wallet. This operation can take up to 2 minutes maximum. This page will be updated when it's done, don't close it.\n\nIn the meantime, you can consult our documentation [here](https://rolls-chasers.gitbook.io/aura), or start discovering the bot by reading the quick overview of its commands here : <#1108757530076774512>.")
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "Loading Completed <a:AuraCheck:1134071763588878398>", value: "```##################################################[100%]```", inline: false },

                        )
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.editReply({ embeds: [completeLoading], ephemeral: true });


                    await addTimeout(3);



                    const walletManager = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Get Access")
                        .setDescription("Your subscription has been confirmed !\n\nYou can now remove the key from your Opensea username.\n\nWe'd like to thank you for your trust and hope you'll profit from Aura. Feel free to ask any question to our team if you need.\n\nYour member role has been granted 👑.")
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.editReply({ embeds: [walletManager], ephemeral: true });

                    


                } else {


                    await addTimeout(12);


                    const walletManager = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Get Access")
                        .setDescription("Please hold on, we're verifying your wallet. This operation can take up to 2 minutes maximum.\n\nThis page will be updated when it's done, don't close it.\n\nIn the meantime, you can start discovering the bot by reading the quick overview of its commands here : <#1108757530076774512>.")
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "Loading <a:AuraLoading:1134068847616458792>", value: "```" + generateProgressBar(tryCount + 1) + "```", inline: false },

                        )
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.editReply({ embeds: [walletManager], ephemeral: true });



                }

                tryCount++


            }


            if (isSameUsername == false && tryCount == 10) {

                const completeLoading = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Get Access")
                    .setDescription("Please hold on, we're verifying your wallet. This operation can take up to 2 minutes maximum. This page will be updated when it's done, don't close it.\n\nIn the meantime, you can consult our documentation [here](https://rolls-chasers.gitbook.io/aura), or start discovering the bot by reading the quick overview of its commands here : <#1108757530076774512>.")
                    .addFields(
                        { name: " ", value: " ", inline: false },
                        { name: "Loading Completed <a:AuraCheck:1134071763588878398>", value: "```##################################################[100%]```", inline: false },

                    )
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                await interaction.editReply({ embeds: [completeLoading], ephemeral: true });


                await addTimeout(3);

                const walletManager = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Get Access")
                    .setDescription("Our verification system didn't find the key we provided you in your username. Please make sure the provided string is in your **username**, then click on the authentificate button above again.\n\n Current Opensea username : `" + username + "`")
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                await interaction.editReply({ embeds: [walletManager], ephemeral: true });


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
            let reportCommand = "getaccess-authentificatewallet"

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


            await interaction.editReply({ embeds: [errorAnswerUser], ephemeral: true });


        }
    },
};



