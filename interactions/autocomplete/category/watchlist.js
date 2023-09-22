/**
 * @file Sample autocomplete interaction
 * @author JAYZHVJ
 * @since 1.0.0
 * @version 1.0.0
 */

/**
 * @type {import("../../../typings").AutocompleteInteraction}
 */

const { apimonitorsql, accessSql, adminsql, reportsql, watchlistSql, sequelize } = require('../../../events/database');
const moment = require('moment');
const calculateSimilarity = require('../../../functions/similarity')

//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const reservoirApiKey = process.env.reservoirApiKey
const magicedenApiKey = process.env.magicedenApiKey

// Configuration de l'en-tête d'autorisation
const headers = {
    'Authorization': `Bearer ${magicedenApiKey}`
};

const sdk = require('api')('@reservoirprotocol/v2.0#2672bklexdpsbi');
sdk.auth(reservoirApiKey);

const sdk2 = require('api')('@reservoirprotocol/v3.0#434y7jljnak92y');
sdk2.auth(reservoirApiKey);

const axios = require('axios')

function isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function isValidInput(input) {
    return /^(\w+|-)+$/.test(input);
}



module.exports = {
    name: "watchlist",

    async execute(interaction) {


        let serverId = interaction.member.guild.id

        try {

            const selectedCollection = interaction.options.get("collection");
            const actualSubcommand = interaction.options._subcommand


            if (actualSubcommand.toLowerCase() == "set") {

                const focusedValue = interaction.options.getFocused();
                const choices = []
                const collectionTable = []


                // //BUG FIX 11/09/2023 - API ME BUG
                //const popularCollectionsLink = "https://api-mainnet.magiceden.dev/v2/ord/btc/popular_collections?window=7d&limit=600"
                //const popularCollectionsCall = await axios.get(popularCollectionsLink, { headers });
               // const result = await popularCollectionsCall.data;
               const result = []

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

                    let index = 0

                    sdk.getSearchCollectionsV1({ name: focusedValue, limit: '50', accept: '*/*' })
                        .then(async ({ data }) => {
                            data.collections.forEach(element => {


                                index++

                                if (element && index <= 20) {


                                    let obj = {}


                                    obj.name = element.name
                                    obj.id = element.collectionId
                                    obj.volume = element.allTimeVolume



                                    if (isValidEthereumAddress(element.collectionId)) {

                                        const existingCollection = collectionTable.find(c => c.name === element.name);
                                        if (existingCollection) {
                                            console.log(element.name + " = " + existingCollection.name)
                                            console.log(element.allTimeVolume + " = " + existingCollection.volume)

                                            if (obj.volume > existingCollection.volume) {
                                                existingCollection.name = obj.name;
                                                existingCollection.id = obj.id;
                                                existingCollection.volume = obj.volume;
                                            }
                                        } else {
                                            collectionTable.push(obj);
                                        }

                                    }
                                }
                            });

                            console.log(collectionTable)

                            result.forEach(element => {
                                //console.log(element.name)
                                if (element) {

                                    if (((element.name).toLowerCase()).includes(focusedValue.toLowerCase())) {
                                        let obj = {}

                                        obj.name = element.name + ' [BTC]'
                                        obj.id = element.symbol
                                        collectionTable.push(obj)
                                    }
                                }
                            });


                            // Fonction de comparaison pour trier les objets en fonction de la ressemblance de leur champ "name" avec focusedValue
                            const compareNames = (a, b) => {
                                const similarityA = calculateSimilarity(a.name, focusedValue);
                                const similarityB = calculateSimilarity(b.name, focusedValue);
                                return similarityB - similarityA; // Triez par ordre décroissant de similarité
                            };





                            // Limiter les résultats aux 20 premiers objets
                            const sortedCollections = collectionTable.sort(compareNames);

                            const sliceArray = sortedCollections.slice(0, 20);

                            sliceArray.forEach(element => {
                                //console.log(element.name)
                                if (element) {
                                    //console.log("element :" + element.name + element.id)

                                    let projectName = element.name
                                    const pjAddress = element.id

                                    let hasName = false
                                    for (let i = 0; i < choices.length; i++) {
                                        if (choices[i].name === projectName) {
                                            hasName = true;
                                            break;
                                        }
                                    }

                                    // if (hasName) { projectName = element.name + " (BTC)" }

                                    if (isValidInput(pjAddress)) {

                                        choices.push({ name: projectName, value: pjAddress });
                                    }
                                }
                            })


                            interaction.respond(
                                choices.map((choice) => ({ name: choice.name, value: choice.value }))
                            ).catch((err) => {
                                console.error('Erreur lors de la réponse à l\'interaction Discord:', err);
                            });



                            //On stock le call API
                            // const timeStamp = Date.now();
                            // apimonitorsql.create({ serverId: serverId.toString(), commandName: "/profit-autocomplete", apiCallName: "getSearchCollectionsV1", apiProvider: "reservoir", timestamp: timeStamp.toString() })
                            return;



                        }).catch(err => console.error(err));

                }

            } else if (actualSubcommand == "remove") {


                // Extract the focused value from the interaction options
                const focusedValue = interaction.options.getFocused();

                let authorId = interaction.user.id;

                // Retrieve the wallets for the authorID
                const watchlistAuthor = await watchlistSql.findAll({ where: { authorId: authorId } });


                const choices = [{ name: "All", value: "All" }]

                for (const elem of watchlistAuthor) {

                    console.log(elem.dataValues)

                    choices.push({ name: elem.dataValues.collectionName, value: elem.dataValues.selectedCollection })

                }

                // Filter the wallet names based on the focused value
                const filtered = choices.filter((blaze) => blaze.name.startsWith(focusedValue));

                // Respond with the filtered wallet names as autocomplete choices
                await interaction.respond(

                    filtered.map((choice) => ({ name: choice.name, value: choice.value }))


                ).catch((err) => {
                    console.error('Erreur lors de la réponse à l\'interaction Discord:', err);
                });

                return;





            }
        } catch (error) {

            console.log(error.stack)
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
            let reportCommand = "/watchlist-autocomplete"

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



    }
};
