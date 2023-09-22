
/**
 * @file Sample button interaction
 * @author JAYZHVJ
 * @since 3.0.0
 * @version 3.2.2
 */

/**
 * @type {import('../../../typings').ButtonInteractionCommand}
 */


const { ButtonInteraction } = require('discord.js');
const { ActionRowBuilder, EmbedBuilder, ButtonBuilder } = require("discord.js");
const { accessSql, profileData, reportsql, adminsql, interactionData, sequelize } = require('../../../events/database');
const moment = require('moment');

function reduceTextCurrent(text, maxLength) {
    if (text.length > maxLength) {
        return text.substring(0, maxLength - 3) + '…';
    }
    return text;
}

const buttonsRow = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('blurbidpfirst-button')
            .setLabel('first page')
            .setStyle(2)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId('blurbidprevious-button')
            .setLabel('previous page')
            .setStyle(2)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId('blurbidnext-button')
            .setLabel('next page')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('blurbidlast-button')
            .setLabel('last page')
            .setStyle(2),
    );





module.exports = {
    id: 'blurbidpfirst-button',

    async execute(interaction) {
        if (!(interaction instanceof ButtonInteraction)) return;

        //Récupérer informations de l'utilisateur de la commande
        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id
        let botId = interaction.applicationId

        try {

            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")


            if (interaction.message.interaction.user.id === authorId) {

                //Checkpoint
                console.log("// Step 2 : Authorization - Executed ✅")



                const lastInteraction = await interactionData.findOne({ where: { authorId: authorId, commandName: "blur-bid", serverId: serverId } })

                const commandCategory = lastInteraction.dataValues.walletCategory


                //On récupère le tableau des bids
                const bidTableFull = JSON.parse(lastInteraction.dataValues.embed1)

                // On récupère les informations gloals des bids de la collection
                const bidUserDataTable = JSON.parse(lastInteraction.dataValues.embed2)


                const pageIndex = lastInteraction.dataValues.pageIndex
                const newPage = "1"

                console.log(newPage)




                if (commandCategory == "collection") {

                    const collectionName = bidUserDataTable[0].collectionName
                    const collectionFloor = bidUserDataTable[0].collectionFloor
                    const rank = bidUserDataTable[0].rank
                    const totalBdidValue = bidUserDataTable[0].totalBdidValue
                    const totalBid = bidUserDataTable[0].totalBid
                    const totalBidders = bidUserDataTable[0].totalBidders
                    const links = bidUserDataTable[0].links


                    let bidTable = bidTableFull.slice(0, 16);


                    let bidsFormatted = "Price                              Size     Total  User\n\n"

                    for (const bid of bidTable) {

                        let price = bid.price
                        let bidderCount = bid.bidderCount
                        let bidDepth = bid.executableSize
                        let bars = bid.bars


                        let lignMaxSize = 55
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









                    const getBlurOneWallet = new EmbedBuilder().setColor("#060A8F")
                        .setTitle(collectionName + "'s bids")
                        .setDescription(">>> Displaying the Blur bid metrics of `" + collectionName + "`.")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .addFields(
                            { name: "Floor Price", value: "`" + parseFloat(collectionFloor).toFixed(3) + "Ξ`", inline: true },
                            { name: "Rank", value: "`" + rank + "`", inline: true },
                            { name: " ", value: " ", inline: true },
                            { name: "Total Bids Value", value: "`" + parseFloat(totalBdidValue).toFixed(3) + "Ξ`", inline: true },
                            { name: "Bid Count", value: "`" + totalBid + "`", inline: true },
                            { name: "Unique Bidders", value: "`" + totalBidders + "`", inline: true },
                            { name: "Bids", value: "```" + bidsFormatted + "```", inline: true },
                            { name: "Links", value: links, inline: false },
                            { name: "Page", value: "`[" + newPage + "/" + pageIndex + "]`", inline: true },

                        )
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.update({ embeds: [getBlurOneWallet], components: [buttonsRow] });


                    await interactionData.update({ actualPage: "1", }, { where: { authorId: authorId, commandName: "blur-bid", serverId: serverId } })


                } else if (commandCategory == "wallet") {

                    const walletName = bidUserDataTable[0].walletName
                    const availableLiquidity = bidUserDataTable[0].availableLiquidity
                    const bidCount = bidUserDataTable[0].bidCount
                    const uniqueContracts = bidUserDataTable[0].uniqueContracts
                    let links = bidUserDataTable[0].links

                    let bidTable = bidTableFull.slice(0, 16);


                    let bidsFormatted = "Collection               Floor    Price   Bid      Total\n\n"

                    for (const bid of bidTable) {



                        let name = await reduceTextCurrent(bid.name, 22)
                        let floor = bid.floor
                        let price = bid.price
                        let bidCount = bid.totalQuantity
                        let totalValue = bid.priceWithCount


                        let part1 = name
                        let part2 = parseFloat(floor).toFixed(2) + "Ξ"
                        let part3 = parseFloat(price).toFixed(2) + "Ξ"
                        let part4 = bidCount.toString()
                        let part5 = parseFloat(totalValue).toFixed(2) + "Ξ\n"

                        let spaceSize = 30 - part2.length - name.length
                        let spaceLenght = ""
                        for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

                        let spaceSize2 = 9 - part3.length
                        let spaceLenght2 = ""
                        for (let i = 0; i < spaceSize2; i++) { spaceLenght2 += " " }

                        let spaceSize3 = 6 - part4.length
                        let spaceLenght3 = ""
                        for (let i = 0; i < spaceSize3; i++) { spaceLenght3 += " " }

                        let spaceSize4 = 12 - part5.length
                        let spaceLenght4 = ""
                        for (let i = 0; i < spaceSize4; i++) { spaceLenght4 += " " }


                        bidsFormatted += part1 + spaceLenght + part2 + spaceLenght2 + part3 + spaceLenght3 + part4 + spaceLenght4 + part5


                    };






                    const walletAddress = lastInteraction.dataValues.walletAddress

                    if (walletAddress !== "all") {


                        const getBlurOneWallet = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Blur Bids")
                            .setDescription(">>> Displaying the Blur bid metrics of `" + walletName + "`.")
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .addFields(
                                { name: "Bid Liquidity", value: "`" + parseFloat(availableLiquidity).toFixed(3) + "Ξ`", inline: false },
                                { name: "Bid Count", value: "`" + bidCount + "`", inline: true },
                                { name: "Collection Count", value: "`" + uniqueContracts + "`", inline: true },
                                { name: "Bids", value: "```" + bidsFormatted + "```", inline: false },
                                { name: "Links", value: links, inline: false },
                                { name: "Page", value: "`[1/" + pageIndex + "]`", inline: true },

                            )
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                        await interaction.update({ embeds: [getBlurOneWallet], components: [buttonsRow] });

                    } else if (walletAddress == "all") {

                        const getBlurOneWallet = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Blur Bids")
                            .setDescription(">>> Displaying the Blur bid metrics of `" + walletName + "`.")
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .addFields(
                                { name: "Bid Liquidity", value: "`" + parseFloat(availableLiquidity).toFixed(3) + "Ξ`", inline: false },
                                { name: "Bid Count", value: "`" + bidCount + "`", inline: true },
                                { name: "Collection Count", value: "`" + uniqueContracts + "`", inline: true },
                                { name: "Bids", value: "```" + bidsFormatted + "```", inline: false },
                                { name: "Page", value: "`[1/" + pageIndex + "]`", inline: true },

                            )
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                        await interaction.update({ embeds: [getBlurOneWallet], components: [buttonsRow] });

                    }


                    await interactionData.update({ actualPage: "1", }, { where: { authorId: authorId, commandName: "blur-bid", serverId: serverId } })



                } else if (commandCategory == "wallet & collection") {

                    const walletAddress = lastInteraction.dataValues.walletAddress

                    if (walletAddress.toLowerCase() !== "all") {


                    } else if (selectedWallet.toLowerCase() == "all") {



                        const walletName = bidUserDataTable[0].walletName
                        const availableLiquidity = bidUserDataTable[0].availableLiquidity
                        const bidCount = bidUserDataTable[0].bidCount
                        const totalValue = bidUserDataTable[0].totalValue
                        const collectionName = bidUserDataTable[0].totcollectionNamealValue
                        let links = bidUserDataTable[0].links

                        let bidTable = bidTableFull.slice(0, 16);


                        let bidsFormatted = "Collection               Floor    Price   Bid      Total\n\n"

                        for (const bid of bidTable) {



                            let name = await reduceTextCurrent(bid.name, 22)
                            let floor = bid.floor
                            let price = bid.price
                            let bidCount = bid.totalQuantity
                            let totalValue = bid.priceWithCount


                            let part1 = name
                            let part2 = parseFloat(floor).toFixed(2) + "Ξ"
                            let part3 = parseFloat(price).toFixed(2) + "Ξ"
                            let part4 = bidCount.toString()
                            let part5 = parseFloat(totalValue).toFixed(2) + "Ξ\n"

                            let spaceSize = 30 - part2.length - name.length
                            let spaceLenght = ""
                            for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }

                            let spaceSize2 = 9 - part3.length
                            let spaceLenght2 = ""
                            for (let i = 0; i < spaceSize2; i++) { spaceLenght2 += " " }

                            let spaceSize3 = 6 - part4.length
                            let spaceLenght3 = ""
                            for (let i = 0; i < spaceSize3; i++) { spaceLenght3 += " " }

                            let spaceSize4 = 12 - part5.length
                            let spaceLenght4 = ""
                            for (let i = 0; i < spaceSize4; i++) { spaceLenght4 += " " }


                            bidsFormatted += part1 + spaceLenght + part2 + spaceLenght2 + part3 + spaceLenght3 + part4 + spaceLenght4 + part5


                        };









                        const getBlurOneWallet = new EmbedBuilder().setColor("#060A8F")
                            .setTitle(collectionName + "'s bids")
                            .setDescription(">>> Displaying the Blur bid metrics of `" + walletName + "` wallet on `" + collectionName + "`.")
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .addFields(
                                { name: "Total Value", value: "`" + parseFloat(totalValue).toFixed(3) + "Ξ`", inline: false },
                                { name: "Bid Liquidity", value: "`" + parseFloat(availableLiquidity).toFixed(3) + "Ξ`", inline: true },
                                { name: "Bid Count", value: "`" + bidCount + "`", inline: true },
                                { name: "Rank", value: "`" + rank + "`", inline: true },
                                { name: "Bids", value: "```" + bidsFormatted + "```", inline: false },
                                { name: "Links", value: links, inline: false },
                                { name: "Page", value: "`[1/" + pageIndex + "]`", inline: true },

                            )
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })



                        await interaction.update({ embeds: [getBlurOneWallet], components: [buttonsRow] });



                        await interactionData.update({ actualPage: "1", }, { where: { authorId: authorId, commandName: "blur-bid", serverId: serverId } })





                    }
                }
            } else {

                const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Bot Access")
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .setDescription("This button is not for you. You can only click on buttons generated by your commands. Please try again with your personal data.")
                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                await interaction.reply({ embeds: [setfpEmbedNotForYou], ephemeral: true });


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
            let reportCommand = "/admin-clientListFirstPage"

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



