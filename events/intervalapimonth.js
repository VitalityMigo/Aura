//;

const { EmbedBuilder } = require("discord.js");
const { apimonitorsql, apiproviderssql, adminsql, accessSql, interactionData, reportsql, sequelize } = require('./database')

const moment = require('moment');


//let tagSent

async function apiMonthlyChecker(client) {

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
        //const monthTimestamp = actualTimestamp - 2635200

        let riskAlertEmbed = "Safe 🟢"



        const apiCallList = await apimonitorsql.findAll()

        let apiCallCount = apiCallList.length;
        let serverApiCallTable = {}
        let apiProviderCallTable = {}
        let commandNameCallTable = {}
        let apiCallNameCallTable = {}


        for (const apiCall of apiCallList) {

            let serverIdCall = apiCall.dataValues.serverId
            let apiProviderCall = apiCall.dataValues.apiProvider
            let commandNameCall = apiCall.dataValues.commandName
            let apiCallNameCall = apiCall.dataValues.apiCallName

            const communityInfos = await accessSql.findOne({ where: { serverId: serverIdCall } })
            let serverIdNameCall = communityInfos.dataValues.serverName

            if (serverApiCallTable[serverIdNameCall]) { serverApiCallTable[serverIdNameCall]++; } else { serverApiCallTable[serverIdNameCall] = 1; }
            if (apiProviderCallTable[apiProviderCall]) { apiProviderCallTable[apiProviderCall]++; } else { apiProviderCallTable[apiProviderCall] = 1; }
            if (commandNameCallTable[commandNameCall]) { commandNameCallTable[commandNameCall]++; } else { commandNameCallTable[commandNameCall] = 1; }
            if (apiCallNameCallTable[apiCallNameCall]) { apiCallNameCallTable[apiCallNameCall]++; } else { apiCallNameCallTable[apiCallNameCall] = 1; }

        }



        let serverApiCallTableSorted = Object.entries(serverApiCallTable)
            .sort((a, b) => b[1] - a[1])
            .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

        let apiProviderCallTableSorted = Object.entries(apiProviderCallTable)
            .sort((a, b) => b[1] - a[1])
            .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

        let commandNameCallTableSorted = Object.entries(commandNameCallTable)
            .sort((a, b) => b[1] - a[1])
            .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});


        let apiCallNameCallTableSorted = Object.entries(apiCallNameCallTable)
            .sort((a, b) => b[1] - a[1])
            .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});



        let serverApiCallTableEmbed = ""
        let count1 = 0
        for (let key in serverApiCallTableSorted) {

            count1++
            if (count1 > 15) {
                break;
            }

            let lignMaxSize = 55
            let leftPartNfts = "`" + key
            let rightPartNfts = serverApiCallTableSorted[key] + " calls`\n"
            let leftPartNFTsLenght = leftPartNfts.length
            let rightPartNftsLenght = rightPartNfts.length
            let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
            let spaceLenght = ""
            for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }



            serverApiCallTableEmbed += "`" + key + spaceLenght + serverApiCallTableSorted[key] + " calls`\n"

        }


        let apiProviderCallTableEmbed = ""
        let count2 = 0
        for (let key in apiProviderCallTableSorted) {

            count2++
            if (count2 > 15) {
                break;
            }

            let keyNameSearch = key.toLowerCase()
            if (keyNameSearch === 'alchemy2') { keyNameSearch = 'alchemy' }
            const apiProviderInfos = await apiproviderssql.findOne({ where: { apiProviderName: keyNameSearch } })
            let providerMonthlyCallLimit = new Intl.NumberFormat('en-US').format(parseFloat(apiProviderInfos.dataValues.apiMonthlyCall).toFixed(0))
            if (providerMonthlyCallLimit.toLowerCase() == "nan") { providerMonthlyCallLimit = "no" }
            if (((apiProviderInfos.dataValues.apiMonthlyCall / 10) * 9) < apiProviderCallTableSorted[key]) { riskAlertEmbed = "Risky 🔴" }


            let lignMaxSize = 55
            let leftPartNfts = "`" + key + " ∙ " + providerMonthlyCallLimit + " max"
            let rightPartNfts = apiProviderCallTableSorted[key] + " calls`\n"
            let leftPartNFTsLenght = leftPartNfts.length
            let rightPartNftsLenght = rightPartNfts.length
            let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
            let spaceLenght = ""
            for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }



            apiProviderCallTableEmbed += "`" + key + " ∙ " + providerMonthlyCallLimit + " max" + spaceLenght + apiProviderCallTableSorted[key] + " calls`\n"


        }



        let commandNameCallTableEmbed = ""
        let count3 = 0
        for (let key in commandNameCallTableSorted) {

            count3++
            if (count3 > 15) {
                break;
            }

            let lignMaxSize = 55
            let leftPartNfts = "`" + key
            let rightPartNfts = commandNameCallTableSorted[key] + " calls`\n"
            let leftPartNFTsLenght = leftPartNfts.length
            let rightPartNftsLenght = rightPartNfts.length
            let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
            let spaceLenght = ""
            for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }



            commandNameCallTableEmbed += "`" + key + spaceLenght + commandNameCallTableSorted[key] + " calls`\n"

        }


        let apiCallNameCallTableEmbed = ""
        let count4 = 0
        for (let key in apiCallNameCallTableSorted) {

            count4++
            if (count4 > 15) {
                break;
            }

            let lignMaxSize = 55
            let leftPartNfts = "`" + key
            let rightPartNfts = apiCallNameCallTableSorted[key] + " calls`\n"
            let leftPartNFTsLenght = leftPartNfts.length
            let rightPartNftsLenght = rightPartNfts.length
            let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
            let spaceLenght = ""
            for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }


            apiCallNameCallTableEmbed += "`" + key + spaceLenght + apiCallNameCallTableSorted[key] + " calls`\n"
        }



        const apiMonthlyReport = new EmbedBuilder().setColor("#060A8F")
            .setTitle("Monthly API Report")
            .setDescription(">>> Showing the bot's monthly API report.")
            .setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
            .setTimestamp()
            .addFields(
                { name: "API Calls:", value: "`" + apiCallCount + " calls`", inline: false },
                { name: "Statut", value: "`Available`", inline: true },
                { name: "Risk Alert:", value: "`" + riskAlertEmbed + "`", inline: true },
                { name: " ", value: " ", inline: false },
                { name: "Providers:", value: apiProviderCallTableEmbed, inline: false },
                { name: "Commands:", value: commandNameCallTableEmbed, inline: false },
                { name: "Calls:", value: apiCallNameCallTableEmbed, inline: false },
                { name: "Servers:", value: serverApiCallTableEmbed, inline: false },

            )
            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

        await botChannelFormatted.send({ embeds: [apiMonthlyReport] });




        //On stock le dernier mois
        await interactionData.destroy({ where: { authorId: "bot", commandName: "intervalApiMonth", serverId: "bot" } })

        await interactionData.create({

            authorId: "bot",
            serverId: "bot",
            commandName: "intervalApiMonth",
            embed1: JSON.stringify(apiMonthlyReport),
        })


        apimonitorsql.destroy({ truncate: true })


    } catch (error) {




        //On envoi une notif
        const botId = client.user.id;
        const botAdmins = await adminsql.findOne({ where: { botId: botId } })
        const mainServerId = botAdmins.dataValues.mainServerId
        const logChannelId = botAdmins.dataValues.logChannelId
        const guild = client.guilds.cache.get(mainServerId);
        const channel = guild.channels.cache.get(logChannelId);


        let reportCommand = "/interval-apiMonthly"

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

module.exports = apiMonthlyChecker