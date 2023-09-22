/**
 * @file Sample autocomplete interaction for wallet names removal by authorID
 * @version 1.0.0
 */

/**
 * @type {import("../../../typings").AutocompleteInteraction}
 */

/**
 * Retrieve the wallets for a given author ID from the JSON data
 * @param {string} authorId The ID of the author to retrieve wallets for
 * @returns {Array} The wallets for the author
 */

const fs = require('fs');

const { wallets, apimonitorsql, adminsql, reportsql, accessSql, sequelize } = require('../../../events/database');
const moment = require('moment');



//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const reservoirApiKey = process.env.reservoirApiKey



//Reservoir API
const sdk = require('api')('@reservoirprotocol/v2.0#2672bklexdpsbi');
sdk.auth(reservoirApiKey);


const sdk2 = require('api')('@reservoirprotocol/v3.0#2n2re32lkmyg6l7');
sdk2.auth(reservoirApiKey);



function isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}



module.exports = {
    name: "blur",

    async execute(interaction) {


        let serverId = interaction.member.guild.id


        try {

            const actualSubcommand = interaction.options._subcommand




            if (actualSubcommand.toLowerCase() == "data") {


                // Extract the focused value from the interaction options
                const focusedValue = interaction.options.getFocused();

                let authorId = interaction.user.id;

                // Retrieve the wallets for the authorID
                const walletsFilter = await wallets.findAll({ where: { authorId: authorId } });

                const choices = [{ name: "All", value: "All" }]
                walletsFilter.forEach(elem => {

                    if (isValidEthereumAddress(elem.walletAddress)) {

                        choices.push({ name: elem.walletName + " (" + elem.walletAddress.substring(0, 5) + "..." + elem.walletAddress.substring(elem.walletAddress.length - 4, elem.walletAddress.length) + ")", value: elem.walletAddress })

                    }
                })


                // Filter the wallet names based on the focused value
                const filtered = choices.filter((blaze) => blaze.name.startsWith(focusedValue));

                // Respond with the filtered wallet names as autocomplete choices
                await interaction.respond(

                    filtered.map((choice) => ({ name: choice.name, value: choice.value }))


                ).catch((err) => {
                    console.error('Erreur lors de la réponse à l\'interaction Discord:', err);
                });

                return;



            } else if (actualSubcommand.toLowerCase() == "bids") {



                const focused = interaction.options.getFocused(true);
                const focusedOption = focused.name
                const focusedValue = focused.value


                if (focusedOption === "wallet") {




                    let authorId = interaction.user.id;

                    // Retrieve the wallets for the authorID
                    const walletsFilter = await wallets.findAll({ where: { authorId: authorId, walletCategory: "eth" } });

                    const choices = [{ name: "All", value: "all" }]
                    walletsFilter.forEach(elem => {

                        choices.push({ name: elem.walletName + " (" + elem.walletAddress.substring(0, 5) + "..." + elem.walletAddress.substring(elem.walletAddress.length - 4, elem.walletAddress.length) + ")", value: elem.walletAddress })

                    })


                    // Filter the wallet names based on the focused value
                    const filtered = choices.filter((blaze) => blaze.name.startsWith(focusedValue));

                    // Respond with the filtered wallet names as autocomplete choices
                    await interaction.respond(

                        filtered.map((choice) => ({ name: choice.name, value: choice.value }))


                    ).catch((err) => {
                        console.error('Erreur lors de la réponse à l\'interaction Discord:', err);
                    });

                    return;



                } if (focusedOption === "collection") {



                    const choices = []
                    const collectionTable = []



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

                }




            } else if (actualSubcommand.toLowerCase() == "holders") {


                const focused = interaction.options.getFocused(true);
                const focusedOption = focused.name
                const focusedValue = focused.value





                const choices = []
                const collectionTable = []



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
            let reportCommand = "/blur-autocomplete"

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
                .setAuthor({ name: "Aura", iconURL: "https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png" })
                .setTimestamp()
                .addFields(
                    { name: " ", value: " ", inline: false },
                    { name: "Content:", value: "A new `bug` has been submitted for the `" + reportCommand + "` command by `the bot report division` in `" + serverName + "`. You can use the administrator dashboard to consult it.", inline: false },

                )
                .setFooter({ text: 'Aura', iconURL: 'https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png' })


            await channel.send({ embeds: [updateEmbed] });



            const errorAnswerUser = new EmbedBuilder().setColor("#060A8F")
                .setTitle("An error occured")
                .setDescription("An error has occurred while executing this command. These errors can occur for a variety of reasons, such as :\n∙ Unexpected traffic\n∙ API maintenance\n∙ Occasional bug\n\nPlease note that a report has already been sent to our team, who will fix the problem as soon as possible. You can still use `/report` to give more details about the error and help our team.")
                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                .setTimestamp()
                .setFooter({ text: 'Aura', iconURL: 'https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png' })


            await interaction.reply({ embeds: [errorAnswerUser], ephemeral: true });


        }
    },
};
//(elem.walletName + elem.walletAddress.substring(0, 5) + "..." + elem.walletAddress.substring(elem.walletAddress.length - 4, elem.walletAddress.length))