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

const axios = require("axios")


//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const etherscanApiKey = process.env.etherscanApiKey
const friendtechApiKey = process.env.friendtechApiKey



const friendtechHeaders = {
    'Authorization': friendtechApiKey, // Remplacez VOTRE_TOKEN par le token d'authentification
    // Autres en-têtes si nécessaire
};





const buttonsRow1 = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('getaccessFTauthentificate-button')
            .setLabel('Authentificate')
            .setStyle(1),
    )



module.exports = {
    id: "getaccessFTtwittermodal",

    async execute(interaction) {


        //Récupérer informations de l'utilisateur de la commande
        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id
        let botId = interaction.applicationId

        await interaction.deferReply({ ephemeral: true })


        const timeStamp = Date.now();
        const actualTimestamp = parseFloat(timeStamp / 1000).toFixed(0)

        try {


            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")
            //Checkpoint
            console.log("// Step 2 : Authorization - Executed ✅")

            //Récupère le password donné par l'utilisateur
            const username = interaction.fields.getTextInputValue('getaccessFTtwittermodal-R1');


            let isMatch = true
            let findUser
            try {
                findUser = await axios.get('https://prod-api.kosetto.com/search/users?username=' + username, { headers: friendtechHeaders })
            } catch (error) {
                isMatch = false
            }


            if (isMatch == true) {

                const user = findUser.data.users.find((user) => user.twitterUsername.toLowerCase() == username.toLowerCase());


                if (user) {





                    const walletUser = user.address


                    const randomKey = "Aura-" + generateRandomString(5)

                    const timestamp = new Date() / 1000
                    const expire = Math.round(timestamp + 180)

                    const tweetText = randomKey + "\n\n" + encodeURIComponent('pic.twitter.com/FyfkKqBWZf');
                    const imageUrl = 'pic.twitter.com/FyfkKqBWZf'; // Remplace avec l'URL de ton image
                    const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&media=${encodeURIComponent(imageUrl)}`;




                    const walletManager = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Get Access")
                        .setDescription("To get access to Aura, follow the instructions below.\n\nYour authentificating this twitter : `" + username + "`.\n\nTo authentificate your Friend.Tech account, please click on this link and post this exact tweet : [here](" + twitterIntentUrl + ").\n\nYou'll be able to delete it right after the verification is done. Your authentifiaction will expire : <t:" + expire + ":R>")
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.editReply({ embeds: [walletManager], components: [buttonsRow1], ephemeral: true });




                    await interactionData.destroy({ where: { authorId: authorId, commandName: "getAccessFTAuthentificate-button", serverId: serverId } })

                    //on enregiste le payement dans la database
                    await interactionData.create({

                        authorId: authorId.toString(),
                        authorName: authorName.toString(),
                        walletAddress: walletUser,
                        walletName: username.toString(),
                        walletCategory: randomKey.toString(),
                        commandName: "getAccessFTAuthentificate-button",
                        pageIndex: (expire + 120).toString(),
                        serverId: serverId
                    })





                } else {

                    let usernameSuggestionFormatted = ""

                    let index = 0
                    for (const suggestion of findUser.data.users) {
                        index++
                        if (index <= 5) {

                            usernameSuggestionFormatted += "∙ " + suggestion.twitterUsername + "\n"
                        } else {

                            break
                        }

                    }


                    const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Friend Tech")
                        .setDescription("The exact twitter username you entered isn't registered in Friend.tech.\n\n**Maybe you are looking for:** \n\n" + usernameSuggestionFormatted)
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.editReply({ embeds: [errorNotEthereum] });





                }



            } else {


                const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Friend Tech")
                    .setDescription("The twitter username you entered isn't registered in Friend.tech. Please try again with a valid username.")
                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                await interaction.editReply({ embeds: [errorNotEthereum] });



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
            let reportCommand = "/getaccess-rcwalletaddress-modal"

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



function generateRandomTweet() {
    const phrases = [
        "I just joined @AuraAnalytics, the #1 trading bot on Friend Tech. ",
        "Excited to be a part of @AuraAnalytics, the leading trading bot on Friend Tech. ",
        "Joined the ranks at @AuraAnalytics, the premier trading bot for Friend Tech users. ",
        "I am now a member of @AuraAnalytics, the top trading bot on Friend Tech. ",
        "Proud member of @AuraAnalytics, the unmatched trading bot for Friend Tech users. ",
        "Happy to be on board with @AuraAnalytics, the ultimate trading bot on Friend Tech. ",
        "Just became a member of @AuraAnalytics, the best trading bot on Friend Tech. ",
        "Just gained access to @AuraAnalytics, the best trading bot in the Friend Tech community. ",
        "I just joined @AuraAnalytics, the leading trading bot on Friend Tech. ",
        "Joined the ranks at @AuraAnalytics, the go-to trading bot for Friend Tech users. ",
    ];

    const closeWords = [
        "Let's print ",
        "Time to print ",
        "See you at the top ",
    ];

    const emojis = ["😈", "🥷", "🐋", "🌊", "🤖"];

    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    const randomWords = closeWords[Math.floor(Math.random() * closeWords.length)];

    // Replace the default emoji in the selected phrase with a random emoji
    const tweet = randomPhrase + randomWords + randomEmoji

    return tweet;
}
