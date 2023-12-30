/**
 * @file Sample getdata command with slash command.
 * @author Vitality Migø
 */



const { EmbedBuilder, SlashCommandBuilder, ButtonInteraction } = require("discord.js");
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { profileData, accessSql, reportsql, interactionData, wallets, apimonitorsql, adminsql, usersql, sequelize, infra_coin, tracker_coin, infra_nft } = require('../../../events/database');
const moment = require('moment');

// On appelle le node
const { reservoirG } = require("../../../config/web3config")


// Fonctions
function isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}


module.exports = {
    id: 'button_nft_tradepanel_listingDepth_',

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
                    await reservoirG.getOrdersDepthV1({
                        side: 'sell',
                        collection: selectedCollection,
                        accept: '*/*'
                    })
                        .then(async ({ data: listingsTable }) => {


                            const listings = listingsTable.depth

                            if (listings.length > 0) {


                                const priceRanges = generatePriceRanges(listings)

                                const slicedRanges = priceRanges.slice(0, 15)
                                const maxQuantity = Math.max(...slicedRanges.map(item => parseFloat(item.amount)));

                                slicedRanges.forEach(item => {
                                    const normalizedBars = Math.ceil(parseFloat(item.amount) / maxQuantity * 28);
                                    item.bars = "❚".repeat(normalizedBars);
                                });


                                let listingFormatted = "Price                                 Amount     Total\n\n"
                                let total = 0

                                for (const listing of slicedRanges) {

                                    let price = listing.price
                                    let amount = listing.amount
                                    let bars = listing.bars
                                    total += amount



                                    // let lignMaxSize = 55
                                    let part1 = parseFloat(price).toFixed(2) + "Ξ " + bars
                                    let part2 = amount
                                    let part3 = total + "\n"
                                    // let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)

                                    let spaceSize = 44 - (part2.toString()).length - part1.length
                                    let spaceLenght = ""
                                    for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

                                    let spaceSize2 = 11 - (part3.toString()).length
                                    let spaceLenght2 = ""
                                    for (let i = 0; i < spaceSize2; i++) { spaceLenght2 += " " }



                                    listingFormatted += part1 + spaceLenght + part2 + spaceLenght2 + part3


                                };




                                if (listings.length <= 0) { listingFormatted = "No bids found for this collection." }


                                const linksFormatted = interaction.message.embeds[0].data.fields.find(obj => obj.name === "Links").value



                                const getBlurOneWallet = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Listings Depth")
                                    .setDescription(">>> Displaying the listing distribution")
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .addFields(
                                        { name: " ", value: " ", inline: false },
                                        // { name: "Total Bids Value", value: "`" + parseFloat(totalBdidValue).toFixed(3) + "Ξ`", inline: true },
                                        // { name: "Bid Count", value: "`" + totalBid + "`", inline: true },
                                        // { name: "Unique Bidders", value: "`" + totalBidders + "`", inline: true },
                                        // { name: " ", value: " ", inline: false },
                                        { name: "Listings", value: "```" + listingFormatted + "```", inline: true },
                                        { name: "Links", value: linksFormatted, inline: false },
                                        // { name: "Page", value: "`[1/" + pageIndex + "]`", inline: true },

                                    )
                                    .setTimestamp()
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [getBlurOneWallet], components: [] })




                            } else {

                                const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("NFT Data")
                                    .setDescription("An error occured while retreiving the bids data. Please try again using `/nft data` or contact a team member if you need help.")
                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setAuthor({ name: "Aura", iconURL: "https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png" })
                                    .setTimestamp()
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                                await interaction.editReply({ embeds: [gasTrackerEmbed2], ephemeral: true });


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



function generatePriceRanges(prices) {

    const floor = prices[0].price
    const rangeAmount = 15



    let threshold = 0.02
    if (floor >= 0.1 && floor < 1) { threshold = 0.05 }
    if (floor >= 1 && floor < 10) { threshold = 0.15 }
    if (floor >= 10) { threshold = 0.5 }

    function getFirstRange(floor, threshold) {

        const div = floor % threshold

        if (div !== 0) {
            const diff = threshold - div
            const result = floor + diff
            return result
        } else {
            const result = floor + threshold
            return result
        }

    }

    function generateBase(initialPrice, step, count) {
        const result = [];

        for (let i = 0; i <= count; i++) {
            const price = initialPrice + i * step;
            result.push({ price, amount: 0 });
        }

        return result;
    }

    const firstRange = getFirstRange(floor, threshold)
    const table = generateBase(firstRange, threshold, (rangeAmount - 1))

    console.log(table)
    let index = 0

    for (const obj of prices) {


        const price = obj.price
        const amount = obj.quantity
        const range = table[index].price

        if (price <= range) {
            table[index].amount += amount
        } else {

            while (price > table[index].price) {
                console.log(table[index].amount)
                index++

                if (index == (rangeAmount - 1)) {
                    console.log(table)
                    return table
                }
            }

            table[index].amount += amount

            if (index == (rangeAmount - 1)) {
                console.log(table)
                return table
            }

        }




    }



}

