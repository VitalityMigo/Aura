/**
 * @file Sample button interaction
 * @author JAYZHVJ
 * @since 3.0.0
 * @version 3.2.2
 */

/**
 * @type {import('../../../typings').ButtonInteractionCommand}
 */



const { ButtonInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { accessSql, profileData, walletsgenerated, wallets, reportsql, adminsql, sequelize } = require('../../../events/database');
const moment = require('moment');
const decrypt = require('../../../functions/decrypt');
const encrypt = require('../../../functions/encrypt');

const { stringify } = require('csv-stringify');





module.exports = {
  id: 'download-button',

  async execute(interaction) {
    if (!(interaction instanceof ButtonInteraction)) return;

    let authorId = interaction.user.id;
    let authorName = interaction.user.username;
    let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
    let serverId = interaction.member.guild.id
    let member = interaction.member;


    try {

    //Checkpoint
    console.log("// Step 1 : Initialization - Executed ✅")





    //Checkpoint
    console.log("// Step 2 : Authorization - Executed ✅")


    const walletsGeneratedOfAuthor = await walletsgenerated.findAll({ where: { authorId: authorId } })

    let walletsTable = []


    const header = ['Address', 'Private Key', 'Statut'];
    const dataArrays = [['Address', 'Private Key', 'Statut']];

    walletsGeneratedOfAuthor.forEach(obj => {
      const arr = [decrypt(obj.walletAddress), decrypt(obj.privateKey), "Active"];
      if (obj.authorId === authorId) {
        dataArrays.push(arr)
        walletsTable.push(decrypt(obj.walletAddress))

      }
    });

    stringify(dataArrays, {
      header,
      delimiter: ';'
    }, (err, output) => {
      if (err) {
        console.log(18, err)
        return;
      }
      const buffer = Buffer.from(output, 'utf-8');

      let csvName = authorName.split(' ')[0] + "Wallets.csv"

      member.send({
        files: [{ attachment: buffer, name: csvName }]
      });


    });




    let walletCreatedList = ""
    let generationStatut = "`Failed`"
    let walletDisplayLimit = 0





    for (const address of walletsTable) {


      if (walletDisplayLimit < 19) {

        walletCreatedList += address + ",        \n"

      } else if (walletDisplayLimit === 19) {

        walletCreatedList += "and " + (walletsTable.length - 19) + " more..."

      } else if (walletDisplayLimit > 19) {



      }
      walletDisplayLimit += 1


    }


    generationStatut = "`Succeed`"



    //On fait les settings du boutton d'ajout au portfolio


    const walletUserAll = await wallets.findAll({ where: { authorId: authorId } })

    const registeredWalletLength = walletUserAll.length
    // const walletTableLength = walletsTable.length
    // const walletLength = uniqueWalletAddresses.length
    const walletAvailable = 24 - registeredWalletLength


    let buttonsRow = ''
    let walletAvailableButton = 24 - registeredWalletLength
    if (walletsTable.length < walletAvailableButton) { walletAvailableButton = walletsTable.length }

    if (walletAvailable > 0) {

      buttonsRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('download-button')
            .setLabel('Download CSV')
            .setStyle(2),
          new ButtonBuilder()
            .setCustomId('walletgeneratoraddwallets-button')
            .setLabel('Add ' + walletAvailableButton + " wallets")
            .setStyle(2),
          // new ButtonBuilder()
          //   .setCustomId('walletmanagermenu-button')
          //   .setLabel('menu')
          //   .setStyle(2), 

        );

    } else {


      buttonsRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('download-button')
            .setLabel('Download CSV')
            .setStyle(2),
          // new ButtonBuilder()
          //   .setCustomId('walletmanagermenu-button')
          //   .setLabel('menu')
          //   .setStyle(2), 

        );

    }




    const walletGenerator = new EmbedBuilder().setColor("#060A8F")
      .setTitle("Wallet Generator")
      .setDescription(">>> `" + walletsTable.length + "` wallets have been successfully generated")
      .setAuthor({ name: authorName, iconURL: userAvatar })
      .setTimestamp()
      .addFields(
        { name: "Wallet Count", value: "`" + walletsTable.length + "`", inline: true },
        { name: "Network", value: "`Ethereum (ETH)`", inline: true },
        { name: "Generation Statut", value: generationStatut, inline: true },
        { name: "Wallets Created:", value: "```" + walletCreatedList + "```", inline: false },
        { name: " ", value: " ", inline: false },
        { name: " ", value: "✅ The wallets infos have been sent to your DMs. Private keys are not stored.", inline: false },

      )
      .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

    await interaction.update({ embeds: [walletGenerator], components: [buttonsRow] });






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
      let reportCommand = "/walletgenerator-downloadCsv"

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


