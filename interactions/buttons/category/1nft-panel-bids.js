/**
 * @file Sample getdata command with slash command.
 * @author Vitality Migø
 */



const { EmbedBuilder, SlashCommandBuilder, ButtonInteraction } = require("discord.js");
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { profileData, accessSql, reportsql, adminsql } = require('../../../events/database');
const moment = require('moment');

// On appelle le node
const { reservoirG } = require("../../../config/web3config")


// Fonctions
function isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}


module.exports = {
    id: 'button_nft_tradepanel_bidsDepth_',

    async execute(interaction) {
        if (!(interaction instanceof ButtonInteraction)) return;

        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id
        let botId = interaction.applicationId


        try {

            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")




            //Checkpoint
            console.log("// Step 2 : Authorization - Executed ✅")



            const customId = interaction.customId


            // Utilisation d'une expression régulière pour extraire l'adresse Ethereum
            const regex = /_0x([0-9a-fA-F]{40})/;
            const matches = customId.match(regex);

            if (matches && matches[1]) {

                await interaction.deferReply({ ephemeral: true })


                // On récupère l'addresse du subject et défini le quickbuy à 1
                const selectedCollection = "0x" + matches[1]


                if (isValidEthereumAddress(selectedCollection)) {



                    // Premier Call API Reservoir : Stats et infos sur la collection
                    await reservoirG.getOrdersBidsV6({
                        collection: selectedCollection,
                        sources: 'blur.io',
                        includeCriteriaMetadata: 'true',
                        includeRawData: 'true',
                        includeDepth: 'true',
                        accept: '*/*'
                    })
                        .then(async ({ data: bidData }) => {


                            const dataTable = bidData.orders[0]
                            let bidsFormatted = ""

                            if (bidData.orders.length) {

                                let bidTableFull = dataTable.rawData.pricePoints


                                let totalBidders = await bidTableFull.reduce((total, item) => total + item.bidderCount, 0);
                                let totalBdidValue = await bidTableFull.reduce((total, item) => total + parseFloat(item.price) * item.executableSize, 0);
                                let totalBid = await bidTableFull.reduce((total, item) => total + item.executableSize, 0);




                                const maxTotalBidValue = Math.max(...bidTableFull.map(item => parseFloat(item.price) * item.executableSize));


                                // Calculer le nombre de ❚ en fonction de la valeur de "price x executableSize" et normaliser à une limite maximum de 25
                                await bidTableFull.forEach(item => {
                                    const normalizedBars = Math.ceil((parseFloat(item.price) * item.executableSize) / maxTotalBidValue * 25);
                                    item.bars = "❚".repeat(normalizedBars);
                                });

                                let bidTable = bidTableFull.slice(0, 16);


                                bidsFormatted = "Price                              Size     Total  User\n\n"

                                for (const bid of bidTable) {

                                    let price = bid.price
                                    let bidderCount = bid.bidderCount
                                    let bidDepth = bid.executableSize
                                    let bars = bid.bars


                                    // let lignMaxSize = 55
                                    let part1 = parseFloat(price).toFixed(2) + "Ξ " + bars
                                    let part2 = bidDepth
                                    let part3 = parseFloat(price * bidDepth).toFixed(2) + "Ξ"
                                    let part4 = bidderCount + "\n"
                                    // let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)

                                    let spaceSize = 39 - (bidDepth.toString()).length - part1.length
                                    let spaceLenght = ""
                                    for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

                                    let spaceSize2 = 10 - ((parseFloat(price * bidDepth).toFixed(2) + "Ξ").toString()).length
                                    let spaceLenght2 = ""
                                    for (let i = 0; i < spaceSize2; i++) { spaceLenght2 += " " }

                                    let spaceSize3 = 7 - ((bidderCount + "\n").toString()).length
                                    let spaceLenght3 = ""
                                    for (let i = 0; i < spaceSize3; i++) { spaceLenght3 += " " }


                                    bidsFormatted += part1 + spaceLenght + part2 + spaceLenght2 + part3 + spaceLenght3 + part4


                                };



                                const bidRowCount = bidTableFull.length
                                const itemsPerPage = 16; // Nombre d'objets par page
                                let pageIndex = Math.ceil(bidRowCount / itemsPerPage);


                                if (bidTable.length <= 0) { bidsFormatted = "No bids found for this collection." }


                                const linksFormatted = interaction.message.embeds[0].data.fields.find(obj => obj.name === "Links").value



                                const getBlurOneWallet = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Bids Depth")
                                    .setDescription(">>> Displaying the top bids")
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .addFields(
                                        { name: " ", value: " ", inline: false },
                                        { name: "Total Bids Value", value: "`" + parseFloat(totalBdidValue).toFixed(3) + "Ξ`", inline: true },
                                        { name: "Bid Count", value: "`" + totalBid + "`", inline: true },
                                        { name: "Unique Bidders", value: "`" + totalBidders + "`", inline: true },
                                        { name: " ", value: " ", inline: false },
                                        { name: "Bids", value: "```" + bidsFormatted + "```", inline: true },
                                        { name: "Links", value: linksFormatted, inline: false },
                                        // { name: "Page", value: "`[1/" + pageIndex + "]`", inline: true },

                                    )
                                    .setTimestamp()
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [getBlurOneWallet], components: [] })




                            } else {

                                const linksFormatted = interaction.message.embeds[0].data.fields.find(obj => obj.name === "Links").value

                                const getBlurOneWallet = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Bids Depth")
                                    .setDescription(">>> Displaying the top bids")
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .addFields(
                                        { name: " ", value: " ", inline: false },
                                        { name: "Total Bids Value", value: "`0.000Ξ`", inline: true },
                                        { name: "Bid Count", value: "`0`", inline: true },
                                        { name: "Unique Bidders", value: "`0`", inline: true },
                                        { name: " ", value: " ", inline: false },
                                        { name: "Bids", value: "```No bids found for this collection                        ```", inline: true },
                                        { name: "Links", value: linksFormatted, inline: false },
                                        // { name: "Page", value: "`[1/" + pageIndex + "]`", inline: true },

                                    )
                                    .setTimestamp()
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [getBlurOneWallet], components: [] })


                            }
                        })

                }

            } else {


                const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("NFT Data")
                    .setDescription("An error occured while retreiving the NFT address. Please try again using `/nft data` or contact a team member if you need help.")
                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                    .setAuthor({ name: "Aura", iconURL: "https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png" })
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                await interaction.reply({ embeds: [gasTrackerEmbed2], ephemeral: true });




            }









        } catch (error) {


            console.log("// Error - sent in report ❌")

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
            let reportCommand = "/nft-refresh"

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



            console.log("//////////\n\nDetails de l'erreur :\n\n" + error.stack + "\n\n//////////")

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



            const errorAnswerUser = new EmbedBuilder().setColor("#060A8F")
                .setTitle("An error occured")
                .setDescription("An error has occurred while executing this command. These errors can occur for a variety of reasons, such as :\n∙ Unexpected traffic\n∙ API maintenance\n∙ Occasional bug\n\nPlease note that a report has already been sent to our team, who will fix the problem as soon as possible. You can still use `/report` to give more details about the error and help our team.")
                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                .setTimestamp()
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


            await interaction.reply({ embeds: [errorAnswerUser], ephemeral: true });


        }
    },
};



