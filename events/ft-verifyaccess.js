const { adminsql, reportsql, sequelize, access_friendtech } = require('./database');
const { EmbedBuilder } = require("discord.js");

const addTimeout = require("../functions/addtimeout")

const axios = require("axios")

const vitality_friendtech = "0x87f9ee054dfcbfe0d459143a52af81652e94173d"
const thegoldeneel_friendtech = "0x22172ea92b7078d449f9d40e18ea3e7de969c4e4"
const bigfloppa_friendtech = "0x9a503c7c3752f2749085ba51fc438f5d4ac5f532"


const guildId = '1108754348818845729';
const roleId1 = '1108761632928182424'; // Remplacez par l'ID de votre rôle
const roleId2 = '1154424757299724459'; // Remplacez par l'ID de votre rôle
const ffrole = "1121519916873433148"
const logChannelUser = "1121482045839908945"
const botId = '1074328639165964368'


async function interval_ftaccess(client) {

    try {

        const guild = await client.guilds.cache.get(guildId);
        const channel = await guild.channels.cache.get(logChannelUser);


        let holdersTableAddress = []

        // on récupère tous les users avec la clé active et accès à Aura
        const ft_access_list = await access_friendtech.findAll({ where: { active: "true" } })


        // On fait la list de tous les holders
        await holdersList(vitality_friendtech, holdersTableAddress)
        await addTimeout(3)
        await holdersList(thegoldeneel_friendtech, holdersTableAddress)
        await addTimeout(3)
        await holdersList(bigfloppa_friendtech, holdersTableAddress)

        // On enlève les doublons
        holdersTableAddress = [...new Set(holdersTableAddress)];


        // On vérifie pour chaque user avec une sub active si ils sont dans le tableau
        for (const user of ft_access_list) {


            const address = user.dataValues.friendtech_address
            const authorId = user.dataValues.authorId
            const authorName = user.dataValues.authorName

            // Si pas dans F&F on leur enlève tout et envoi un message aux user et aux admin
            if (!holdersTableAddress.includes(address.toLowerCase())) {

                try {

                    const member = await guild.members.fetch(authorId);

                    if (!member.roles.cache.has(ffrole)) {


                        member.roles.remove(roleId1)
                        member.roles.remove(roleId2)


                        //On trouve la transaction qui vient d'être faite
                        await access_friendtech.update({ active: "false" }, { where: { authorId: authorId } })





                        const memberEmbed = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Aura Analytics")
                            .setDescription("Hey " + authorName + ", we hope you are doing great 💫.\n\nYour access to Aura has been revoked after you sold the access key on Friend.Tech.\n\nWe'd like to thank you for your support and hope to see you soon. Feel free to give us feedbacks [here](https://hzzmtzmuh0y.typeform.com/to/H3zgiFPj).\n\nHave a nice day !")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                        member.send({ embeds: [memberEmbed] });



                        const updateEmbed = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Friend.Tech User Leaved 🐇")
                            .setDescription("A Friend Tech user just leaved Aura. Here are is infos:\n\nName: `" + authorName + "`\nAddress: `" + address + "`")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setAuthor({ name: "Aura", iconURL: "https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png" })
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                        channel.send({ embeds: [updateEmbed] });

                        // Sinon on enlève juste le role FT et on change la DB
                    } else {

                        await access_friendtech.update({ active: "false" }, { where: { authorId: authorId } })

                        member.roles.remove(roleId2)


                    }

                } catch (error) {

                    console.log("Erreur lors de la verif du role du user : " + authorId)
                    console.log(error.stack)
                }
            }
        }










    } catch (error) {

        console.log("//////////\n\nDetails de l'erreur :\n\n" + error.stack + "\n\n//////////")

        //On envoi une notif
        const botAdmins = adminsql.findOne({ where: { botId: botId } })
        const mainServerId = botAdmins.dataValues.mainServerId
        const logChannelId = botAdmins.dataValues.logChannelId
        const guild = interaction.client.guilds.cache.get(mainServerId);
        const channel = guild.channels.cache.get(logChannelId);


        const adminAccessInfos = accessSql.findOne({ where: { serverId: serverId } })
        let adminRoleId = adminAccessInfos.dataValues.adminRoleId
        let serverName = adminAccessInfos.dataValues.serverName
        const userRoleList = interaction.member._roles
        let userHighestRole = "Member"
        if (userRoleList.includes(adminRoleId)) { userHighestRole = "Team" }
        let reportCommand = "/interval-ft-verificationsystem"

        const timeStamp = Date.now();
        const date = new Date(timeStamp);
        const dateLisible = date.toLocaleString();
        const date1 = moment(dateLisible, 'M/D/YYYY, h:mm:ss A');
        const formattedDate = date1.format('Do [of] MMMM YYYY');



        //On enregistre le call
        reportsql.create({
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


        channel.send("<@&" + roleTag + ">");

        channel.send({ embeds: [updateEmbed] });




    }





}

module.exports = interval_ftaccess


async function holdersList(address, holdersTableAddress) {

    // on call les holders de la clé {friendtechaccount} chez FT 
    const holdersCall = await axios.get("https://prod-api.kosetto.com/users/" + address + "/token/holders")
    const holdersTable = holdersCall.data.users


    // On construit un tableau avec les addresses
    if (holdersTable.length > 0) {

        if (holdersCall.data.nextPageStart != 50) {

            for (const holding of holdersTable) {

                if (!holdersTableAddress.includes(holding.address.toLowerCase())) {

                    holdersTableAddress.push(holding.address.toLowerCase())
                }
            }

        } else {

            for (const holding of holdersTable) {

                if (!holdersTableAddress.includes(holding.address.toLowerCase())) {

                    holdersTableAddress.push(holding.address.toLowerCase())
                }
            }

            let itemsNumber = 50
            let callPage = ""

            let continuation = holdersCall.data.nextPageStart

            while (continuation != null) {




                callPage = await axios.get("https://prod-api.kosetto.com/users/" + address + "/token/holders?pageStart=" + itemsNumber)

                continuation = callPage.data.nextPageStart

                if (continuation != null) {

                    for (const holding of holdersTable) {

                        if (!holdersTableAddress.includes(holding.address.toLowerCase())) {

                            holdersTableAddress.push(holding.address.toLowerCase())
                        }
                    }


                    itemsNumber += 50

                } else {
                    break
                }
            }
        }
    }
}