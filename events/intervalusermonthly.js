//;

const { EmbedBuilder } = require("discord.js");
const { apimonitorsql, apiproviderssql, adminsql, accessSql, interactionData, reportsql, usersql, sequelize } = require('./database')

const moment = require('moment');


//let tagSent

async function userMonthlyChecker(client) {

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


        //////////

        //Nombre de user unique
        const userList = await usersql.findAll()

        const uniqueUserNames = [...new Set(userList.map(user => user.dataValues.userName))];
        const countUniqueUserNames = uniqueUserNames.length;

        //Nombre de serveur par user
        const userNameCounts = {};
        userList.forEach(user => {
            const userName = user.dataValues.userName;
            userNameCounts[userName] = (userNameCounts[userName] || 0) + 1;
        });

        const sortedUserNameCounts = Object.entries(userNameCounts)
            .sort((a, b) => b[1] - a[1])
            .reduce((acc, [userName, count]) => {
                acc[userName] = count;
                return acc;
            }, {});



        // Nombre de personne par communauté
        const serverIdCounts = {};
        userList.forEach(user => {
            const serverId = user.dataValues.serverId;
            serverIdCounts[serverId] = (serverIdCounts[serverId] || 0) + 1;
        });

        const sortedServerIdCounts = Object.entries(serverIdCounts)
            .sort((a, b) => b[1] - a[1])
            .reduce((acc, [serverId, count]) => {
                acc[serverId] = count;
                return acc;
            }, {});



        // Nombre de commu unique
        const uniqueServerIds = [...new Set(userList.map(user => user.dataValues.serverId))];
        const countUniqueServerIds = uniqueServerIds.length;

        /////////////

        //Communauté par user
        const usernames = Object.keys(sortedUserNameCounts);
        const communityCounts = Object.values(sortedUserNameCounts);
        const sum = communityCounts.reduce((acc, count) => acc + count, 0);
        const average = (sum / usernames.length).toFixed(1)




        let usersReportFormatted = ""
        let count2 = 0
        for (let key in sortedUserNameCounts) {

            count2++
            if (count2 > 15) {
                break;
            }

            let lignMaxSize = 55
            let leftPartNfts = "`" + key.toLowerCase()
            let rightPartNfts = sortedUserNameCounts[key] + " communities`\n"
            let leftPartNFTsLenght = leftPartNfts.length
            let rightPartNftsLenght = rightPartNfts.length
            let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
            let spaceLenght = ""
            for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }



            usersReportFormatted += "`" + key.toLowerCase() + spaceLenght + sortedUserNameCounts[key] + " communities`\n"


        }


        let communitiesReportFormatted = ""
        let overLimitServerTable = []
        let count1 = 0
        for (let key in sortedServerIdCounts) {

            count1++
            if (count1 > 15) {
                break;
            }




            const serverInfos = await accessSql.findOne({ where: { serverId: key } })
            const serverName = serverInfos.dataValues.serverName
            const serverLimitMembers = serverInfos.dataValues.userCount
            let serverLimitFormatted = serverLimitMembers


            if (serverLimitMembers.toLowerCase() == "unlimited") { serverLimitFormatted = "no limit" } else {

                if (sortedServerIdCounts[key] > serverLimitMembers) {

                    const serverAdminRole = serverInfos.dataValues.adminRoleId
                    const serverAdminChannel = serverInfos.dataValues.adminUpdateChannel

                    let obj = {}
                    obj.serverId = key
                    obj.serverName = serverName
                    obj.limit = serverLimitMembers
                    obj.users = sortedServerIdCounts[key]
                    obj.serverAdminRole = serverAdminRole
                    obj.serverAdminChannel = serverAdminChannel
                    overLimitServerTable.push(obj)
                }
            }


            let lignMaxSize = 55
            let leftPartNfts = "`" + serverName + " ∙ " + serverLimitFormatted + " max"
            let rightPartNfts = sortedServerIdCounts[key] + " users`\n"
            let leftPartNFTsLenght = leftPartNfts.length
            let rightPartNftsLenght = rightPartNfts.length
            let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
            let spaceLenght = ""
            for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }



            communitiesReportFormatted += "`" + serverName + " ∙ " + serverLimitFormatted + " max" + spaceLenght + sortedServerIdCounts[key] + " users`\n"


        }






        const apiMonthlyReport = new EmbedBuilder().setColor("#060A8F")
            .setTitle("Monthly User Report")
            .setDescription(">>> Showing the bot's monthly user report.")
            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
            .setTimestamp()
            .addFields(
                { name: " ", value: " ", inline: false },
                { name: "Unique Users:", value: "`" + countUniqueUserNames + " users`", inline: false },
                { name: "Community Count", value: "`" + countUniqueServerIds + " communities`", inline: true },
                { name: "Community/User", value: "`" + average + " communities`", inline: true },
                { name: " ", value: " ", inline: false },
                { name: "Users", value: usersReportFormatted, inline: false },
                { name: "Communities", value: communitiesReportFormatted, inline: false },


            )
            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

        await botChannelFormatted.send({ embeds: [apiMonthlyReport] });


        if (overLimitServerTable.length > 0) {

            console.log(overLimitServerTable)
            let overLimitServerEmbed = " "



            for (const servers of overLimitServerTable) {


                let serverName = servers.serverName
                let limit = servers.limit
                let users = servers.users
                let extraUsers = users - limit


                let lignMaxSize = 55
                let leftPartNfts = "`" + serverName + " ∙ " + limit + " max" + " ∙ " + users + " users"
                let rightPartNfts = extraUsers + " extra`\n"
                let leftPartNFTsLenght = leftPartNfts.length
                let rightPartNftsLenght = rightPartNfts.length
                let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                let spaceLenght = ""
                for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }



                overLimitServerEmbed += "`" + serverName + " ∙ " + limit + " max" + " ∙ " + users + " users" + spaceLenght + extraUsers + " extra`\n"

                //On envoi une notif
                let selectedServerId = servers.serverId
                let selectedChannelId = servers.serverAdminChannel
                let selectedRoleId = servers.serverAdminRole
                const guild = client.guilds.cache.get(selectedServerId);
                const channel = guild.channels.cache.get(selectedChannelId);



                channel.send("<@&" + selectedRoleId + ">")

                const errorUser = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("User Problem")
                    .setDescription(">>> A problem occured with your monthly user count")
                    .setTimestamp()
                    .addFields(
                        { name: "Content", value: "Good morning " + serverName + " team. We woulds like to let you know that you broke the limit of " + limit + " users this month, with " + users + " users.\n\nTo fix this issue, you can either limit the access to the bot in your server or contact one of our team member to expand your subscribtion.\n\nWe wish you a nice day.", inline: false },
                    )
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                channel.send({ embeds: [errorUser] });




                //On envoi une notif aux admin
                const botId = client.user.id;
                const botAdmins = await adminsql.findOne({ where: { botId: botId } })
                const mainServerId = botAdmins.dataValues.mainServerId
                const logChannelId = botAdmins.dataValues.logChannelId
                const guild2 = client.guilds.cache.get(mainServerId);
                const channel2 = guild.channels.cache.get(logChannelId);

                const errorUser2 = new EmbedBuilder().setColor("#FF0000")
                    .setTitle("User Limit Problem")
                    .setDescription(">>> A problem occured with a community user limit")
                    .setTimestamp()
                    .addFields(
                        { name: "Content", value: "The limit of `" + limit + "` users of `" + serverName + "` has been break this month, with " + users + " users.", inline: false },
                    )
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                channel2.send({ embeds: [errorUser2] });



            }



        }


        //On stock le dernier mois
        await interactionData.destroy({ where: { authorId: "bot", commandName: "intervalUserMonth", serverId: "bot" } })

        await interactionData.create({

            authorId: "bot",
            serverId: "bot",
            commandName: "intervalUserMonth",
            embed1: JSON.stringify(apiMonthlyReport),
        })


        usersql.destroy({ truncate: true })


    } catch (error) {




        //On envoi une notif
        const botId = client.user.id;
        const botAdmins = await adminsql.findOne({ where: { botId: botId } })
        const mainServerId = botAdmins.dataValues.mainServerId
        const logChannelId = botAdmins.dataValues.logChannelId
        const guild = client.guilds.cache.get(mainServerId);
        const channel = guild.channels.cache.get(logChannelId);


        let reportCommand = "/interval-usermontly"

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


    }


}

module.exports = userMonthlyChecker