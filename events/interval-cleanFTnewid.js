//;

const { EmbedBuilder } = require("discord.js");
//const { adminsql, interactionData, reportsql, walletsgenerated, sequelize } = require('./database')

const moment = require('moment');

const fs = require('fs').promises
const newUserFile = "contracts/friendtech/newuser.json"

const axios = require("axios")
const addTimeout = require("../functions/addtimeout")


async function intervalCleanFTnewId(client) {



    try {

        const botId = client.user.id;
        const botInfos = await adminsql.findOne({ where: { botId: botId } })
        const botServer = botInfos.mainServerId
        const botChannelId = botInfos.logChannelId
        const mainRoleId = botInfos.mainRoleId
        const botGuild = client.guilds.cache.get(botServer);
        const botChannelFormatted = botGuild.channels.cache.get(botChannelId);

        const timeStamp = Date.now();
        const actualTimestamp = parseFloat(timeStamp / 1000).toFixed(0)




        const cachedTUsersFile = await fs.readFile(newUserFile, 'utf8');
        const cachedUsers = JSON.parse(cachedTUsersFile)



        for (const newUsers of cachedUsers) {

            let userInfoCall = ""
            let isAvailable = true
            let status = 404

            try {
                userInfoCall = await axios.get("https://prod-api.kosetto.com/users/" + newUsers.address)
                status = userInfoCall.status
            } catch (error) {
                isAvailable = false
                console.log("Erreur dans la récupération des infos du user FT " + error.stack)
            }

            if (isAvailable == true || status == 200) {

                deleteInArray(newUsers.address)
                console.log(newUsers.address)

                await addTimeout(1)

            }
            await addTimeout(0.5)

        }








        const apiMonthlyReport = new EmbedBuilder().setColor("#060A8F")
            .setTitle("Daily Friend.Tech New ID Cleaning")
            .setDescription("The new Friend.Tech user ID table has been cleaned. It's now ready to be fill again")
            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
            .setTimestamp()

            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

        await botChannelFormatted.send({ embeds: [apiMonthlyReport] });




    } catch (error) {

        console.log("//////////\n\nDetails de l'erreur :\n\n" + error.stack + "\n\n//////////")



        //On envoi une notif
        const botId = client.user.id;
        const botAdmins = adminsql.findOne({ where: { botId: botId } })
        const mainServerId = botAdmins.dataValues.mainServerId
        const logChannelId = botAdmins.dataValues.logChannelId
        const guild = interaction.client.guilds.cache.get(mainServerId);
        const channel = guild.channels.cache.get(logChannelId);


        let reportCommand = "/interval-cleanFTnewId"

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



    }


}

module.exports = intervalCleanFTnewId




async function deleteInArray(subjectAddress) {

    const jsonData = JSON.parse(await fs.readFile(newUserFile, 'utf-8'));

    // Étape 2 : Rechercher et supprimer l'objet
    const indexToRemove = jsonData.findIndex(item => item.address.toLowerCase() == subjectAddress.toLowerCase());

    if (indexToRemove !== -1) {
        // L'objet a été trouvé, supprimez-le
        jsonData.splice(indexToRemove, 1);

        // Étape 3 : Enregistrez le fichier JSON mis à jour
        fs.writeFile(newUserFile, JSON.stringify(jsonData, null, 2), 'utf-8');

    }

}
