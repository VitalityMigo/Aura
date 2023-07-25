/**
 * @file Sample autocomplete interaction
 * @author JAYZHVJ
 * @since 1.0.0
 * @version 1.0.0
 */

/**
 * @type {import("../../../typings").AutocompleteInteraction}
 */

const { apimonitorsql, reportsql, adminsql, alertsDown, alertsUp, Op, sequelize } = require('../../../events/database');
const moment = require('moment');


//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const reservoirApiKey = process.env.reservoirApiKey

const sdk = require('api')('@reservoirprotocol/v2.0#2672bklexdpsbi');
sdk.auth(reservoirApiKey);


const sdk2 = require('api')('@reservoirprotocol/v3.0#434y7jljnak92y');
sdk2.auth(reservoirApiKey);





module.exports = {
    name: "alerts",

    async execute(interaction) {


        let serverId = interaction.member.guild.id

        try {

            const selectedCollection = interaction.options.get("collection");
            const actualSubcommand = interaction.options._subcommand


            if (actualSubcommand.toLowerCase() == "set") {


                const focusedValue = interaction.options.getFocused();


                const choices = []

                if (focusedValue == "") {


                    sdk2.getCollectionsTopsellingV1({ fillType: 'sale', limit: '20', accept: '*/*' })
                        .then(({ data }) => {
                            data.collections.forEach(element => {
                                //console.log(element.name)
                                if (element) {
                                    const projectName = element.name
                                    const pjAddress = element.id
                                    choices.push({ name: projectName, value: pjAddress });
                                }
                            });


                            interaction.respond(
                                choices.map((choice) => ({ name: choice.name, value: choice.value }))
                            ).catch((err) => {
                                console.error('Erreur lors de la réponse à l\'interaction Discord:', err);
                            });


                            //On stock le call API
                            const timeStamp = Date.now();
                            apimonitorsql.create({ serverId: serverId.toString(), commandName: "/rcprofit-autocomplete", apiCallName: "getSearchCollectionsV1", apiProvider: "reservoir", timestamp: timeStamp.toString() })


                            return;

                        }).catch(err => console.error(err));


                } else {

                    sdk.getSearchCollectionsV1({ name: focusedValue, limit: '20', accept: '*/*' })
                        .then(({ data }) => {
                            data.collections.forEach(element => {
                                //console.log(element.name)
                                if (element) {
                                    const projectName = element.name
                                    const pjAddress = element.contract
                                    choices.push({ name: projectName, value: pjAddress });
                                }
                            })



                            interaction.respond(
                                choices.map((choice) => ({ name: choice.name, value: choice.value }))
                            ).catch((err) => {
                                console.error('Erreur lors de la réponse à l\'interaction Discord:', err);
                            });

                            //On stock le call API
                            const timeStamp = Date.now();
                            apimonitorsql.create({ serverId: serverId.toString(), commandName: "/getdata-autocomplete", apiCallName: "getSearchCollectionsV1", apiProvider: "reservoir", timestamp: timeStamp.toString() })

                            return;

                        }).catch(err => console.error(err));

                }



            } else if (actualSubcommand.toLowerCase() == "get") {


                // Preparation for the autocomplete request.
                //console.log(interaction)
                const focusedValue = interaction.options.getFocused();

                // Extract choices automatically from your choice array (can be dynamic too)!
                const autocompleteAlertsUp = await alertsUp.findAll({ attributes: ['collectionName'], where: { authorId: interaction.user.id }, logging: false })
                const autocompleteAlertsDown = await alertsDown.findAll({ attributes: ['collectionName'], where: { authorId: interaction.user.id }, logging: false })

                //console.log(autocompleteAlertsUp)
                const choices = ["All"];

                autocompleteAlertsUp.forEach(elem => {
                    if (!choices.includes(elem.collectionName)) {
                        choices.push(elem.collectionName);
                    }
                })

                autocompleteAlertsDown.forEach(elem => {
                    if (!choices.includes(elem.collectionName)) {
                        choices.push(elem.collectionName);
                    }
                })

                // Filter choices according to user input.

                const filtered = choices.filter((choice) =>
                    choice.startsWith(focusedValue)
                );

                // Respond the request here.
                await interaction.respond(
                    filtered.map((choice) => ({ name: choice, value: choice }))
                ).catch((err) => {
                    console.error('Erreur lors de la réponse à l\'interaction Discord:', err);
                });

                return;





            } else if (actualSubcommand.toLowerCase() == "remove") {

                // Preparation for the autocomplete request.
                //console.log(interaction)
                const focusedValue = interaction.options.getFocused();

                // Extract choices automatically from your choice array (can be dynamic too)!
                const autocompleteAlertsUp = await alertsUp.findAll({ attributes: ['collectionName'], where: { authorId: interaction.user.id }, logging: false })
                const autocompleteAlertsDown = await alertsDown.findAll({ attributes: ['collectionName'], where: { authorId: interaction.user.id }, logging: false })

                //console.log(autocompleteAlertsUp)
                const choices = ["All"];

                autocompleteAlertsUp.forEach(elem => {
                    if (!choices.includes(elem.collectionName)) {
                        choices.push(elem.collectionName);
                    }
                })

                autocompleteAlertsDown.forEach(elem => {
                    if (!choices.includes(elem.collectionName)) {
                        choices.push(elem.collectionName);
                    }
                })



                // Filter choices according to user input.

                const filtered = choices.filter((choice) =>
                    choice.startsWith(focusedValue)
                );

                // Respond the request here.
                await interaction.respond(
                    filtered.map((choice) => ({ name: choice, value: choice }))
                ).catch((err) => {
                    console.error('Erreur lors de la réponse à l\'interaction Discord:', err);
                });

                return;




            }



        } catch (error) {


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
            let reportCommand = "/alerts-autocomplete"

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



            const updateEmbed = new EmbedBuilder().setColor("#060A8F")
                .setTitle("New Report")
                .setDescription(">>> A new report has just been sent.")
                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                .setAuthor({ name: "Rolls Chasers Analytics", iconURL: "https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png" })
                .setTimestamp()
                .addFields(
                    { name: " ", value: " ", inline: false },
                    { name: "Content:", value: "A new `bug` has been submitted for the `" + reportCommand + "` command by `the bot report division` in `" + serverName + "`. You can use the administrator dashboard to consult it.", inline: false },

                )
                .setFooter({ text: 'Rolls Chasers Analytics', iconURL: 'https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png' })


            await channel.send({ embeds: [updateEmbed] });



            const errorAnswerUser = new EmbedBuilder().setColor("#060A8F")
                .setTitle("An error occured")
                .setDescription("An error has occurred while executing this command. These errors can occur for a variety of reasons, such as :\n∙ Unexpected traffic\n∙ API maintenance\n∙ Occasional bug\n\nPlease note that a report has already been sent to our team, who will fix the problem as soon as possible. You can still use `/report` to give more details about the error and help our team.")
                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                .setTimestamp()
                .setFooter({ text: 'Rolls Chasers Analytics', iconURL: 'https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png' })


            await interaction.reply({ embeds: [errorAnswerUser], ephemeral: true });


        }



    }
};
