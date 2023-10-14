
/**
 * @file Sample button interaction
 * @author JAYZHVJ
 * @since 3.0.0
 * @version 3.2.2
 */

/**
 * @type {import('../../../typings').ButtonInteractionCommand}
 */


const { ButtonInteraction, GuildChannelManager } = require('discord.js');
const { ActionRowBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const { accessSql, profileData, adminsql, reportsql, access_friendtech, sequelize } = require('../../../events/database');
const moment = require('moment');

const { web3BaseDRPC, web3Base1RPC, web3BaseUnifra } = require('../../../config/web3config');


const shareContractAbi = require("../../../contracts/friendtech/share.json")
const shareContractAddress = "0xcf205808ed36593aa40a44f10c7f7c2f67d4a4d4"
const shareContract = new web3BaseDRPC.eth.Contract(shareContractAbi, shareContractAddress);

const friendtechaccount = "0x87F9Ee054Dfcbfe0d459143A52Af81652e94173D"


module.exports = {
    id: 'getaccessFTech-button',

    async execute(interaction) {
        if (!(interaction instanceof ButtonInteraction)) return;

        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id

        try {

            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")

            //Checkpoint
            console.log("// Step 2 : Authorization - Executed ✅")


            const ft_access_list = await access_friendtech.findOne({ where: { authorId: authorId } })


            if (ft_access_list == null) {


            const walletAddress = new ModalBuilder()
                .setCustomId('getaccessFTtwittermodal')
                .setTitle('Friend.Tech Authentification');

            // Add components to modal

            // Create the text input components
            const txnHash = new TextInputBuilder()
                .setCustomId('getaccessFTtwittermodal-R1')
                .setLabel("Friend.Tech Twitter username")
                .setPlaceholder("The username of the twitter linked to your Friend.Tech")
                .setStyle(TextInputStyle.Short)
                .setMaxLength(100);




            // An action row only holds one text input,
            // so you need one action row per text input.
            const zeroActionRowSetProfile = new ActionRowBuilder().addComponents(txnHash);

            // Add inputs to the modal
            walletAddress.addComponents(zeroActionRowSetProfile)

            // Show the modal to the user
            await interaction.showModal(walletAddress);

        } else {

            await interaction.deferReply({ ephemeral: true })

            if (ft_access_list.dataValues.active == "false") {

                const userAddress = ft_access_list.dataValues.friendtech_address


                const supply = await shareContract.methods.sharesBalance(friendtechaccount, userAddress).call();

                if (parseInt(supply) > 0) {

                    const roleId1 = '1108761632928182424'; // Remplacez par l'ID de votre rôle
                    const role1 = interaction.guild.roles.cache.get(roleId1);
                    interaction.member.roles.add(role1)

                    const roleId2 = '1154424757299724459'; // Remplacez par l'ID de votre rôle
                    const role2 = interaction.guild.roles.cache.get(roleId2);
                    interaction.member.roles.add(role2)




                    const walletManager = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Get Access")
                        .setDescription("Welcome to Aura and to the Friend Tech Council " + authorName + " !\n\nWe'd like to thank you for your trust and hope you'll profit from Aura. Feel free to ask any question to our team if you need.\n\nYour member and Friend.Tech role have been granted 👑.")
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.editReply({ embeds: [walletManager], ephemeral: true });



                    const timeStamp = Math.round(Date.now() / 1000)

                    await access_friendtech.create({

                        serverId: serverId.toString(),
                        authorId: authorId.toString(),
                        authorName: authorName.toString(),
                        friendtech_address: userAddress,
                        twitterUsername: username.toString(),
                        user_key: randomKey,
                        active: "true",
                        timetamp: timeStamp.toString()
                    })


                    const guild = interaction.client.guilds.cache.get("1108754348818845729");
                    const channel = guild.channels.cache.get("1121482045839908945");
                    
                    

                    const updateEmbed = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Friend.Tech User Leaved")
                    .setDescription("A Friend Tech user just leaved Aura. Here are is infos:\n\nName: `" + authorName + "`\nAddress: `" + userAddress + "`")
                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                    .setAuthor({ name: "Aura", iconURL: "https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png" })
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                channel.send({ embeds: [updateEmbed] });



                } else {

                    const walletManager = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Get Access")
                    .setDescription("Our verification system didn't find any `@Vitalitymigo` key in the Friend.Tech account you provided. Please try again using the twitter that owns the key. If you need any help, feel free to open a ticket")
                    .setTimestamp()
                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                await interaction.editReply({ embeds: [walletManager], ephemeral: true });

                  

                }



            } else {


                const walletManager = new EmbedBuilder().setColor("#060A8F")
                .setTitle("Get Access")
                .setDescription("You are already verified as a Friend.Tech member of Aura. You can already use the full bot features. If you need help, feel free to ask to our team.")
                .setTimestamp()
                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

            await interaction.editReply({ embeds: [walletManager], ephemeral: true });




            }



        }



        } catch (error) {

            await interaction.deferReply({ ephemeral: true })

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
            let reportCommand = "getaccess-RCPage"

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


            await interaction.editReply({ embeds: [errorAnswerUser], ephemeral: true });


        }

    },
};




