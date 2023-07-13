//;

const { EmbedBuilder } = require("discord.js");
const { apimonitorsql, apiproviderssql, adminsql, interactionData, reportsql, accessSql, sequelize } = require('./database')

const moment = require('moment');


async function apiConstantChecker(client) {



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


        // Création d'un objet Date pour la date actuelle
        const now = new Date();

        // Récupération du jour du mois en cours
        const currentDayOfMonth = now.getDate();

        // Récupération du nombre de jours restants jusqu'au prochain mois
        const nextMonth = now.getMonth() + 1;
        const nextMonthDate = new Date(now.getFullYear(), nextMonth, 1);
        const daysUntilNextMonth = Math.round((nextMonthDate - now) / (1000 * 60 * 60 * 24));

        console.log(`Aujourd'hui, nous sommes le ${currentDayOfMonth} et il reste ${daysUntilNextMonth} jours jusqu'au prochain mois.`);


        const apiCallList = await apimonitorsql.findAll()

        let apiCallCount = apiCallList.length;
        let apiProviderCallTable = {}



        for (const apiCall of apiCallList) {

            let apiProviderCall = apiCall.dataValues.apiProvider

            if (apiProviderCallTable[apiProviderCall]) { apiProviderCallTable[apiProviderCall]++; } else { apiProviderCallTable[apiProviderCall] = 1; }

        }


        let apiProviderCallTableSorted = Object.entries(apiProviderCallTable)
            .sort((a, b) => b[1] - a[1])
            .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});




        const apiMonthlyReport = new EmbedBuilder()
            .setTitle("API Problem")
            .setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
            .setTimestamp()
            .addFields(
                { name: "API Calls:", value: "`" + apiCallCount + " calls`", inline: false },
                { name: " ", value: " ", inline: false },

            )
            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




        let isNeedToAlert = "no"
        for (let key in apiProviderCallTableSorted) {



            let keyNameSearch = key.toLowerCase()
            if (keyNameSearch === 'alchemy2') { keyNameSearch = 'alchemy' }
            const apiProviderInfos = await apiproviderssql.findOne({ where: { apiProviderName: keyNameSearch } })
            let providerMonthlyCallLimit = new Intl.NumberFormat('en-US').format(parseFloat(apiProviderInfos.dataValues.apiMonthlyCall).toFixed(0))
            if (providerMonthlyCallLimit.toLowerCase() == "nan") { providerMonthlyCallLimit = "no" }
            let limitRatio = (apiProviderCallTableSorted[key] * 100 / apiProviderInfos.dataValues.apiMonthlyCall)
            let expectedCall = (daysUntilNextMonth * apiProviderCallTableSorted[key]) / currentDayOfMonth;
            let expectedCallFormatted = new Intl.NumberFormat('en-US').format(parseFloat(expectedCall).toFixed(0))


            if ((apiProviderInfos.dataValues.apiMonthlyCall) < apiProviderCallTableSorted[key]) {



                isNeedToAlert = "yes"

                let lignMaxSize = 40
                let leftPartNfts = "`current calls count : "
                let rightPartNfts = apiProviderCallTableSorted[key] + " calls`\n"
                let leftPartNFTsLenght = leftPartNfts.length
                let rightPartNftsLenght = rightPartNfts.length
                let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                let spaceLenght = ""
                for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

                let lignMaxSize2 = 40
                let leftPartNfts2 = "`expected calls count : "
                let rightPartNfts2 = expectedCallFormatted + " calls`\n"
                let leftPartNFTsLenght2 = leftPartNfts2.length
                let rightPartNftsLenght2 = rightPartNfts2.length
                let spaceSize2 = lignMaxSize2 - (leftPartNFTsLenght2 + rightPartNftsLenght2)
                let spaceLenght2 = ""
                for (let i = 0; i < spaceSize2; i++) { spaceLenght2 += " " }


                let lignMaxSize3 = 40
                let leftPartNfts3 = "`calls limit : "
                let rightPartNfts3 = providerMonthlyCallLimit + " max`\n"
                let leftPartNFTsLenght3 = leftPartNfts3.length
                let rightPartNftsLenght3 = rightPartNfts3.length
                let spaceSize3 = lignMaxSize3 - (leftPartNFTsLenght3 + rightPartNftsLenght3)
                let spaceLenght3 = ""
                for (let i = 0; i < spaceSize3; i++) { spaceLenght3 += " " }


                let lignMaxSize4 = 40
                let leftPartNfts4 = "`limit ratio : "
                let rightPartNfts4 = parseFloat(limitRatio).toFixed(2) + "% full`\n"
                let leftPartNFTsLenght4 = leftPartNfts4.length
                let rightPartNftsLenght4 = rightPartNfts4.length
                let spaceSize4 = lignMaxSize4 - (leftPartNFTsLenght4 + rightPartNftsLenght4)
                let spaceLenght4 = ""
                for (let i = 0; i < spaceSize4; i++) { spaceLenght4 += " " }




                let apiProviderCallTableEmbed = "`current calls count : " + spaceLenght + apiProviderCallTableSorted[key] + " calls`\n"
                apiProviderCallTableEmbed += "`expected calls count : " + spaceLenght2 + expectedCallFormatted + " calls`\n"
                apiProviderCallTableEmbed += "`calls limit : " + spaceLenght3 + providerMonthlyCallLimit + " max`\n"
                apiProviderCallTableEmbed += "`limit ratio : " + spaceLenght4 + parseFloat(limitRatio).toFixed(2) + "% full`\n"



                apiMonthlyReport.addFields(
                    { name: key.toUpperCase(), value: apiProviderCallTableEmbed, inline: false },
                    { name: " ", value: " ", inline: false },

                )



            }



        }



        const cycleInfos = await interactionData.findOne({ where: { authorId: "bot", commandName: "intervalApiConstant", serverId: "bot" } })

        let isAlerted = "not alerted"
        if (cycleInfos !== null) { isAlerted = cycleInfos.dataValues.pageIndex }


        if (isNeedToAlert == "yes") {

            if (isAlerted !== "alerted") {


                //On stock le dernier mois
                await interactionData.destroy({ where: { authorId: "bot", commandName: "intervalApiConstant", serverId: "bot" } })

                await interactionData.create({

                    authorId: "bot",
                    serverId: "bot",
                    commandName: "intervalApiConstant",
                    pageIndex: "alerted"
                })


                apiMonthlyReport.setDescription(">>> One of the API provider is full")
                apiMonthlyReport.setColor("#FF0000")
                await botChannelFormatted.send("<@&" + mainRoleId + ">");
                await botChannelFormatted.send({ embeds: [apiMonthlyReport] });

            }
        } else {

            //On stock le dernier mois
            await interactionData.destroy({ where: { authorId: "bot", commandName: "intervalApiConstant", serverId: "bot" } })

            await interactionData.create({

                authorId: "bot",
                serverId: "bot",
                commandName: "intervalApiConstant",
                pageIndex: "not alerted"
            })


        }

    } catch (error) {




        //On envoi une notif
        const botId = client.user.id;
        const botAdmins = adminsql.findOne({ where: { botId: botId } })
        const mainServerId = botAdmins.dataValues.mainServerId
        const logChannelId = botAdmins.dataValues.logChannelId
        const guild = interaction.client.guilds.cache.get(mainServerId);
        const channel = guild.channels.cache.get(logChannelId);


        let reportCommand = "/interval-apiConstant"

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

module.exports = apiConstantChecker




