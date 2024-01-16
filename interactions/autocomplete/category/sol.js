/**
 * @file Sample autocomplete interaction
 * @author VITALITYMIGO
 * @since 1.0.0
 * @version 1.0.0
 */

/**
 * @type {import("../../../typings").AutocompleteInteraction}
 */

const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { apimonitorsql, accessSql, adminsql, reportsql, wallets, sequelize } = require('../../../events/database');
const moment = require('moment');
const axios = require('axios')

const reduceText = require("../../../functions/reducetext")
function isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}
function firstLetterCap(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

const wSOL = "So11111111111111111111111111111111111111112"

module.exports = {
    name: "sol",

    async execute(interaction) {


        let serverId = interaction.member.guild.id

        try {

            const actualSubcommand = interaction.options._subcommand


            if (actualSubcommand.toLowerCase() == "profit") {


                const focused = interaction.options.getFocused(true);
                const focusedOption = focused.name
                const focusedValue = focused.value

                const choices = []

                // Si on veut ajouter les wallets enregistré, cliquez ici
                // Il faudrait prévoir une séction pour les wallets SOL.
                // if (focusedOption === "wallet") {




                //     let authorId = interaction.user.id;

                //     // Retrieve the wallets for the authorID
                //     const walletsFilter = await wallets.findAll({ where: { authorId: authorId } });

                //     const choices = [{ name: "All", value: "All" }]
                //     walletsFilter.forEach(elem => {

                //         if (isValidEthereumAddress(elem.walletAddress)) {

                //             choices.push({ name: elem.walletName + " (" + elem.walletAddress.substring(0, 5) + "..." + elem.walletAddress.substring(elem.walletAddress.length - 4, elem.walletAddress.length) + ")", value: elem.walletAddress })
                //         }
                //     })


                //     // Filter the wallet names based on the focused value
                //     const filtered = choices.filter((blaze) => blaze.name.startsWith(focusedValue));

                //     // Respond with the filtered wallet names as autocomplete choices
                //     await interaction.respond(

                //         filtered.map((choice) => ({ name: choice.name, value: choice.value }))


                //     ).catch((err) => {
                //         console.error('Erreur lors de la réponse à l\'interaction Discord:', err);
                //     });

                //     return;

                // } else 


                if (focusedOption == "token") {

                    if (focusedValue == "") {

                        try {


                        } catch (error) {

                            console.log(error)
                        }
                    } else {

                        try {

                            const callFocus = await axios.get("https://api.dexscreener.com/latest/dex/search?q=" + focusedValue)
                            const pairWeth = callFocus.data.pairs.filter((item) => item.quoteToken.address === wSOL && item.chainId == "solana");


                            //  console.log(pairWeth)
                            console.log(focusedValue)

                            let index = 0


                            pairWeth.forEach(element => {

                                index++

                                if (element && index <= 20) {

                                        const dexName = firstLetterCap(element.dexId)
                            
                                        const projectName = reduceText(element.baseToken.symbol, 25) + " (" + dexName + ")"
                                        const pjAddress = element.baseToken.address
                                        const volume = element.volume.h24

                                        choices.push({ name: projectName, value: pjAddress });


                                        // const existingCollection = choices.find(c => c.name === element.name);
                                        // if (existingCollection) {
                                        //     console.log(element.name + " = " + existingCollection.name)
                                        //     console.log(element.allTimeVolume + " = " + existingCollection.volume)

                                        //     if (obj.volume > existingCollection.volume) {
                                        //         existingCollection.name = obj.name;
                                        //         existingCollection.id = obj.id;
                                        //         existingCollection.volume = obj.volume;
                                        //     }
                                        // } else {
                                        //     choices.push({ name: projectName, value: pjAddress });
                                        // }

                                    
                                }
                            });



                            console.log(choices)


                            interaction.respond(
                                choices.map((choice) => ({ name: choice.name, value: choice.value }))
                            ).catch((err) => {
                                console.error('Erreur lors de la réponse à l\'interaction Discord:', err);
                            });



                            //On stock le call API
                            // const timeStamp = Date.now();
                            // apimonitorsql.create({ serverId: serverId.toString(), commandName: "/profit-autocomplete", apiCallName: "getSearchCollectionsV1", apiProvider: "reservoir", timestamp: timeStamp.toString() })
                            return;


                        } catch (error) {

                            console.log(error)

                        }
                    }
                }



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
            let reportCommand = "/sol-autocomplete"

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
