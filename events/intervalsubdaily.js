//;

const { EmbedBuilder } = require("discord.js");
const { apimonitorsql, apiproviderssql, adminsql, paymentHistory, accessSql, interactionData, reportsql, sequelize } = require('./database')

const moment = require('moment');
const { random } = require("giflib/lib/mka");


//let tagSent

async function intervalSubDaily(client) {

    console.log("Execution de l'API checker monthly")


     try {

    const botId = client.user.id;
    const botInfos = await adminsql.findOne({ where: { botId: botId } })
    const botServer = botInfos.mainServerId
    const botChannelId = botInfos.logChannelId
    const botGuild = client.guilds.cache.get(botServer);
    const botChannelFormatted = botGuild.channels.cache.get(botChannelId);

    const timeStamp = Date.now();
    const actualTimestamp = parseFloat(timeStamp / 1000).toFixed(0)
    const secondsInDay = 86400;
    const secondsInMonth = secondsInDay * 30.5
    const monthTimestamp = actualTimestamp - secondsInMonth


    const txnHistoryCall = await paymentHistory.findAll({ where: { treated: "no" } })



    // Filtrer les objets ayant une valeur `dataValues.timestamp` inférieure à `xxx`
    const filteredPaymentHistory = txnHistoryCall.filter(obj => obj.dataValues.timestamp < monthTimestamp);
    const filteredPaymentHistory2 = txnHistoryCall.filter(obj => obj.dataValues.timestamp >= monthTimestamp && obj.dataValues.timestamp < (monthTimestamp - secondsInDay));



    for (const paymentTxn of filteredPaymentHistory2) {


        let userId = paymentTxn.dataValues.authorId
        let authorName = paymentTxn.dataValues.authorName
        let txnHash = paymentTxn.dataValues.txnHash
        let timestamp = paymentTxn.dataValues.timestamp
        let randomKey = paymentTxn.dataValues.randomKey


        const guildId1 = "1108754348818845729"
        const roleId1 = '1108761632928182424'; // Remplacez par l'ID de votre rôle
        const guildCache = await client.guilds.cache.get(guildId1)
        const memberCache = await guildCache.members.fetch(userId)
        memberCache.roles.remove(roleId1)

        const walletManager = new EmbedBuilder().setColor("#060A8F")
            .setTitle("Subscription Ended")
            .setDescription("Hey " + authorName + ", we hope you are doing well !\n\nWe'd like to inform you that your individual subscription to Aura will end in around 24 hours. You will be able to subscribe again here in around 24 hours : <#1108757700885622784>.\n\nIf you need any help, feel free to open a ticket in our discord server, right here : <#1121110417368956958>.\n\nHave a nice day 👑")
            .setTimestamp()
            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

        memberCache.send({ embeds: [walletManager] });




    }






    for (const paymentTxn of filteredPaymentHistory) {


        let userId = paymentTxn.dataValues.authorId
        let authorName = paymentTxn.dataValues.authorName
        let txnHash = paymentTxn.dataValues.txnHash
        let timestamp = paymentTxn.dataValues.timestamp
        let randomKey = paymentTxn.dataValues.randomKey


        const guildId1 = "1108754348818845729"
        const roleId1 = '1108761632928182424'; // Remplacez par l'ID de votre rôle
        const guildCache = await client.guilds.cache.get(guildId1)
        const memberCache = await guildCache.members.fetch(userId)
        memberCache.roles.remove(roleId1)

        const walletManager = new EmbedBuilder().setColor("#060A8F")
            .setTitle("Subscription Ended")
            .setDescription("Hey " + authorName + ", we hope you are doing well !\n\nWe'd like to inform you that your individual subscription to Aura has ended today. You can subscribe again here : <#1108757700885622784>.\n\nIf you need any help, feel free to open a ticket in our discord server, right here : <#1121110417368956958>.\n\nHave a nice day 👑")
            .setTimestamp()
            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


        memberCache.send({ embeds: [walletManager] });




        await paymentHistory.update({ treated: "yes", }, { where: { treated: "no", authorId: userId, randomKey: randomKey, txnHash: txnHash } })


    }









    } catch (error) {




        //On envoi une notif
        const botId = client.user.id;
        const botAdmins = await adminsql.findOne({ where: { botId: botId } })
        const mainServerId = botAdmins.dataValues.mainServerId
        const logChannelId = botAdmins.dataValues.logChannelId
        const guild = client.guilds.cache.get(mainServerId);
        const channel = guild.channels.cache.get(logChannelId);


        let reportCommand = "/interval-subDaily"

        const timeStamp = Date.now();
        const date = new Date(timeStamp);
        const dateLisible = date.toLocaleString();
        const date1 = moment(dateLisible, 'M/D/YYYY, h:mm:ss A');
        const formattedDate = date1.format('Do [of] MMMM YYYY');



        //On enregistre le call
        reportsql.create({
            botId: botId,
            authorId: "Bot",
            serverName: "Back End System",
            authorRole: "Bot",
            serverId: "Back End System",
            date: formattedDate,
            reportType: "Bug",
            reportCommand: reportCommand,
            reportDescription: "```" + error.stack + "```",
            reportPriority: "5",
            reportState: "Not treated",
        })



        const updateEmbed = new EmbedBuilder().setColor("#060A8F")
            .setTitle("New Report")
            .setDescription(">>> A new report has just been sent.")
            .setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
            .setAuthor({ name: "Rolls Chasers Analytics", iconURL: "https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg" })
            .setTimestamp()
            .addFields(
                { name: " ", value: " ", inline: false },
                { name: "Content:", value: "A new `bug` has been submitted for the `" + reportCommand + "` command by `the bot report division` in `Back End System`. You can use the administrator dashboard to consult it.", inline: false },

            )
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


        channel.send({ embeds: [updateEmbed] });


    }


}

module.exports = intervalSubDaily