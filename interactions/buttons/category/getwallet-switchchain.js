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
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { accessSql, profileData, interactionData, adminsql, reportsql, sequelize } = require('../../../events/database');
const moment = require('moment');


function formatString(input) {
    return input.length > 42 ? `${input.substring(0, 19)}...${input.substring(input.length - 20)}` : input;
}


const buttonAllAvailable = new ActionRowBuilder()
.addComponents(
    new ButtonBuilder()
        .setCustomId('zzzgetwalletfirstpage-button')
        .setLabel('first page')
        .setStyle(2)
        .setDisabled(true),
    new ButtonBuilder()
        .setCustomId('zzzgetwalletpreviouspage-button')
        .setLabel('previous page')
        .setStyle(2)
        .setDisabled(true),
    new ButtonBuilder()
        .setCustomId('zzzgetwalletnextpage-button')
        .setLabel('next page')
        .setStyle(2),
    new ButtonBuilder()
        .setCustomId('zzzgetwalletlastpage-button')
        .setLabel('last page')
        .setStyle(2),
    new ButtonBuilder()
        .setCustomId('getwalletsswitchchain-button')
        .setEmoji("<:RCETH:1123226220075700244>")
        .setStyle(3),

);

const buttonOnePage = new ActionRowBuilder()
.addComponents(
    new ButtonBuilder()
        .setCustomId('zzzgetwalletfirstpage-button')
        .setLabel('first page')
        .setStyle(2)
        .setDisabled(true),
    new ButtonBuilder()
        .setCustomId('zzzgetwalletpreviouspage-button')
        .setLabel('previous page')
        .setStyle(2)
        .setDisabled(true),
    new ButtonBuilder()
        .setCustomId('zzzgetwalletnextpage-button')
        .setLabel('next page')
        .setStyle(2)
        .setDisabled(true),
    new ButtonBuilder()
        .setCustomId('zzzgetwalletlastpage-button')
        .setLabel('last page')
        .setStyle(2)
        .setDisabled(true),
    new ButtonBuilder()
        .setCustomId('getwalletsswitchchain-button')
        .setEmoji("<:RCETH:1123226220075700244>")
        .setStyle(3),

);

const buttonAllAvailable1 = new ActionRowBuilder()
.addComponents(
    new ButtonBuilder()
        .setCustomId('zzzgetwalletfirstpage-button')
        .setLabel('first page')
        .setStyle(2)
        .setDisabled(true),
    new ButtonBuilder()
        .setCustomId('zzzgetwalletpreviouspage-button')
        .setLabel('previous page')
        .setStyle(2)
        .setDisabled(true),
    new ButtonBuilder()
        .setCustomId('zzzgetwalletnextpage-button')
        .setLabel('next page')
        .setStyle(2),
    new ButtonBuilder()
        .setCustomId('zzzgetwalletlastpage-button')
        .setLabel('last page')
        .setStyle(2),
    new ButtonBuilder()
        .setCustomId('getwalletsswitchchain-button')
        .setEmoji("<:RCBTC:1123219824282189834>")
        .setStyle(3),

);

const buttonOnePage1 = new ActionRowBuilder()
.addComponents(
    new ButtonBuilder()
        .setCustomId('zzzgetwalletfirstpage-button')
        .setLabel('first page')
        .setStyle(2)
        .setDisabled(true),
    new ButtonBuilder()
        .setCustomId('zzzgetwalletpreviouspage-button')
        .setLabel('previous page')
        .setStyle(2)
        .setDisabled(true),
    new ButtonBuilder()
        .setCustomId('zzzgetwalletnextpage-button')
        .setLabel('next page')
        .setStyle(2)
        .setDisabled(true),
    new ButtonBuilder()
        .setCustomId('zzzgetwalletlastpage-button')
        .setLabel('last page')
        .setStyle(2)
        .setDisabled(true),
    new ButtonBuilder()
        .setCustomId('getwalletsswitchchain-button')
        .setEmoji("<:RCBTC:1123219824282189834>")
        .setStyle(3),

);


const buttonShowName = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('getwalletshowname-button')
            .setLabel('show wallet names')
            .setStyle(1)


    );


const buttonShowName1 = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('getwalletshowname-button')
            .setLabel('hide wallet names')
            .setStyle(1)


    );

module.exports = {
    id: 'getwalletsswitchchain-button',

    async execute(interaction, message) {
        if (!(interaction instanceof ButtonInteraction)) return;

        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png`;
        let serverId = interaction.member.guild.id


       try {

            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")



            if (interaction.message.interaction.user.id === authorId) {


                //Checkpoint
                console.log("// Step 2 : Authorization - Executed ✅")


                const lastInteraction = await interactionData.findOne({ where: { authorId: authorId, commandName: "getwallet", serverId: serverId } })

                const selectedChain = lastInteraction.dataValues.walletCategory
                const allWalletAddressOfAuthorTable = JSON.parse(lastInteraction.dataValues.embed1)
                const globalInfos = JSON.parse(lastInteraction.dataValues.embed2)
                const walletShow = lastInteraction.dataValues.walletName


                if (selectedChain.toLowerCase() == "eth") {




                    const filteredByWalletETH = allWalletAddressOfAuthorTable.filter(item => item.walletChain == 'btc');

                    const totalWalletETH = globalInfos[0].walletCountBTC
                    const totalValueEth = globalInfos[0].valueBTC
                    const priceETH = globalInfos[0].priceBTC


                    let pageIndex = 1
                    let walletCount = filteredByWalletETH.length
                    
                    if (walletCount / 8 <= 1) { pageIndex = 1 }
                    if (walletCount / 8 > 1) { pageIndex = 2 }
                    if (walletCount / 8 > 2) { pageIndex = 3 }






                    //On définit la base de l'embed
                    const getwalletsAllEmbed = new EmbedBuilder().setColor("#060A8F")
                        .setTitle(`${authorName}'s portfolio`)
                        .setDescription(`>>> All the Bitcoin wallets registered in ${authorName}'s portfolio`)
                        .addFields(
                            { name: ' ', value: " ", inline: false },
                            { name: 'BTC Wallets', value: "`" + totalWalletETH + " addresses`", inline: true },
                            { name: 'Total Balance', value: "`" + parseFloat(totalValueEth).toFixed(3) + "₿ (" + new Intl.NumberFormat('en-US').format(parseFloat(totalValueEth * priceETH).toFixed(2)) + "$)`", inline: true },
                        ).setTimestamp()
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                    let fieldCount = 0
                    let embed1Field = ""

                    for (const object of allWalletAddressOfAuthorTable) {

                        if (object.walletChain == "btc") {

                            let sign = "₿"

                            if (fieldCount < 8) {


                                
if (walletShow == "no") {

    let lignMaxSize = 70
    let leftPartNfts = "`" + (formatString(object.walletAddress)).toLowerCase()
    let rightPartNfts = object.balance + sign + "`\n"
    let leftPartNFTsLenght = leftPartNfts.length
    let rightPartNftsLenght = rightPartNfts.length
    let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
    let spaceLenght = ""
    for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }


    embed1Field += "`" + (formatString(object.walletAddress)).toLowerCase() + spaceLenght + object.balance + sign + "`\n"




 } else if (walletShow == "yes") {


    let lignMaxSize = 73
let leftPartNfts = "`" + (object.walletAddress).substring(0, 8) + "…" + (object.walletAddress).substring((object.walletAddress).length - 9, (object.walletAddress).length)
let middlePartNfts = (object.walletName).toLowerCase()
let rightPartNfts = object.balance + sign + "`\n"
let leftPartNFTsLenght = leftPartNfts.length
let rightPartNftsLenght = rightPartNfts.length
let middlePartNftsLenght = middlePartNfts.length
let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght + middlePartNftsLenght)
let spaceLenght = ""
let spaceLenght2 = ""
for (let i = 0; i < (spaceSize / 2) - 5; i++) { spaceLenght += " " }
for (let i = 0; i < (spaceSize / 2); i++) { spaceLenght2 += " " }


embed1Field += "`" + (object.walletAddress).substring(0, 8) + "…" + (object.walletAddress).substring((object.walletAddress).length - 9, (object.walletAddress).length) + spaceLenght + (object.walletName).toLowerCase() + spaceLenght2 + object.balance + sign + "`\n"


}



                                if (fieldCount == 7 || fieldCount === (walletCount - 1)) {

                                    console.log("ici")

                                    if (embed1Field == "") { embed1Field = "```No Bitcoin wallet are registered```" }

                                    getwalletsAllEmbed.addFields(
                                        { name: 'Wallets:', value: embed1Field, inline: false },

                                    );


                                    getwalletsAllEmbed.addFields(
                                        { name: 'Page', value: "`[1/" + pageIndex + "]`", inline: false },
                                    )

                                }


                            }
                            fieldCount++
                        }
                    }

                    if (embed1Field == "") {
                        embed1Field = "```No Bitcoin wallet is registered in your portfolio.```"

                        getwalletsAllEmbed.addFields(
                            { name: 'Wallets:', value: embed1Field, inline: false },

                        );


                        getwalletsAllEmbed.addFields(
                            { name: 'Page', value: "`[1/" + pageIndex + "]`", inline: false },
                        )
                    }




                    /////
                    //Faire les boutons inactifs ici 


                    

                    if (walletShow == "no") {

                        if (pageIndex == 1) {

                            await interaction.update({ embeds: [getwalletsAllEmbed], components: [buttonOnePage, buttonShowName] })
    
                        } else if (pageIndex > 1) {
    
                            await interaction.update({ embeds: [getwalletsAllEmbed], components: [buttonAllAvailable, buttonShowName] })
    
                        }    
                    } else if (walletShow == "yes") {
    
                        if (pageIndex == 1) {

                            await interaction.update({ embeds: [getwalletsAllEmbed], components: [buttonOnePage, buttonShowName1] })
    
                        } else if (pageIndex > 1) {
    
                            await interaction.update({ embeds: [getwalletsAllEmbed], components: [buttonAllAvailable, buttonShowName1] })
    
                        }    
                    }


                    await interactionData.update({ actualPage: "1", walletCategory: "btc" }, { where: { commandName: "getwallet", authorId: authorId, serverId: serverId } })





                } else if (selectedChain.toLowerCase() == "btc") {



                    const filteredByWalletETH = allWalletAddressOfAuthorTable.filter(item => item.walletChain == 'eth');

                    const totalWalletETH = globalInfos[0].walletCountETH
                    const totalValueEth = globalInfos[0].valueETH
                    const priceETH = globalInfos[0].priceETH


                    let pageIndex = 1
                    let walletCount = filteredByWalletETH.length
                    
                    if (walletCount / 8 <= 1) { pageIndex = 1 }
                    if (walletCount / 8 > 1) { pageIndex = 2 }
                    if (walletCount / 8 > 2) { pageIndex = 3 }






                    //On définit la base de l'embed
                    const getwalletsAllEmbed = new EmbedBuilder().setColor("#060A8F")
                        .setTitle(`${authorName}'s portfolio`)
                        .setDescription(`>>> All the Ethereum wallets registered in ${authorName}'s portfolio`)
                        .addFields(
                            { name: ' ', value: " ", inline: false },
                            { name: 'ETH Wallets', value: "`" + totalWalletETH + " addresses`", inline: true },
                            { name: 'Total Balance', value: "`" + parseFloat(totalValueEth).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(totalValueEth * priceETH).toFixed(2)) + "$)`", inline: true },
                        ).setTimestamp()
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




                    let fieldCount = 0
                    let embed1Field = ""

                    for (const object of allWalletAddressOfAuthorTable) {

                        if (object.walletChain == "eth") {

                            let sign = "Ξ"

                            if (fieldCount < 8) {


                               
if (walletShow == "no") {

    let lignMaxSize = 70
    let leftPartNfts = "`" + (formatString(object.walletAddress)).toLowerCase()
    let rightPartNfts = object.balance + sign + "`\n"
    let leftPartNFTsLenght = leftPartNfts.length
    let rightPartNftsLenght = rightPartNfts.length
    let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
    let spaceLenght = ""
    for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }


    embed1Field += "`" + (formatString(object.walletAddress)).toLowerCase() + spaceLenght + object.balance + sign + "`\n"




 } else if (walletShow == "yes") {


    let lignMaxSize = 73
let leftPartNfts = "`" + (object.walletAddress).substring(0, 8) + "…" + (object.walletAddress).substring((object.walletAddress).length - 9, (object.walletAddress).length)
let middlePartNfts = (object.walletName).toLowerCase()
let rightPartNfts = object.balance + sign + "`\n"
let leftPartNFTsLenght = leftPartNfts.length
let rightPartNftsLenght = rightPartNfts.length
let middlePartNftsLenght = middlePartNfts.length
let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght + middlePartNftsLenght)
let spaceLenght = ""
let spaceLenght2 = ""
for (let i = 0; i < (spaceSize / 2) - 5; i++) { spaceLenght += " " }
for (let i = 0; i < (spaceSize / 2); i++) { spaceLenght2 += " " }


embed1Field += "`" + (object.walletAddress).substring(0, 8) + "…" + (object.walletAddress).substring((object.walletAddress).length - 9, (object.walletAddress).length) + spaceLenght + (object.walletName).toLowerCase() + spaceLenght2 + object.balance + sign + "`\n"


}


                                if (fieldCount == 7 || fieldCount === (walletCount - 1)) {

                                    console.log("ici")

                                    if (embed1Field == "") { embed1Field = "```No Ethereum wallet are registered```" }

                                    getwalletsAllEmbed.addFields(
                                        { name: 'Wallets:', value: embed1Field, inline: false },

                                    );


                                    getwalletsAllEmbed.addFields(
                                        { name: 'Page', value: "`[1/" + pageIndex + "]`", inline: false },
                                    )

                                }


                            }
                            fieldCount++
                        }
                    }

                    if (embed1Field == "") {
                        embed1Field = "```No Ethereum wallet is registered in your portfolio.```"

                        getwalletsAllEmbed.addFields(
                            { name: 'Wallets:', value: embed1Field, inline: false },

                        );


                        getwalletsAllEmbed.addFields(
                            { name: 'Page', value: "`[1/" + pageIndex + "]`", inline: false },
                        )
                    }




                    /////
                    //Faire les boutons inactifs ici 


                    




                    if (walletShow == "no") {

                        if (pageIndex == 1) {

                            await interaction.update({ embeds: [getwalletsAllEmbed], components: [buttonOnePage1, buttonShowName] })
    
                        } else if (pageIndex > 1) {
    
                            await interaction.update({ embeds: [getwalletsAllEmbed], components: [buttonAllAvailable1, buttonShowName] })
    
                        }  
                    } else if (walletShow == "yes") {
    
                        if (pageIndex == 1) {

                            await interaction.update({ embeds: [getwalletsAllEmbed], components: [buttonOnePage1, buttonShowName1] })
    
                        } else if (pageIndex > 1) {
    
                            await interaction.update({ embeds: [getwalletsAllEmbed], components: [buttonAllAvailable1, buttonShowName1] })
    
                        }
                        
                    }


                    await interactionData.update({ actualPage: "1", walletCategory: "eth" }, { where: { commandName: "getwallet", authorId: authorId, serverId: serverId } })







                }

                


            } else {

                const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Bot Access")
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .setDescription("This button is not for you. You can only click on buttons generated by your commands. Please try again with your personal data.")
                    .setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
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
            let reportCommand = "/getwallet-switchChain"

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
                .setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
                .setAuthor({ name: "Rolls Chasers Analytics", iconURL: "https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg" })
                .setTimestamp()
                .addFields(
                    { name: " ", value: " ", inline: false },
                    { name: "Content:", value: "A new `bug` has been submitted for the `" + reportCommand + "` command by `the bot report division` in `" + serverName + "`. You can use the administrator dashboard to consult it.", inline: false },

                )
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


            await channel.send({ embeds: [updateEmbed] });



            const errorAnswerUser = new EmbedBuilder().setColor("#060A8F")
                .setTitle("An error occured")
                .setDescription("An error has occurred while executing this command. These errors can occur for a variety of reasons, such as :\n∙ Unexpected traffic\n∙ API maintenance\n∙ Occasional bug\n\nPlease note that a report has already been sent to our team, who will fix the problem as soon as possible. You can still use `/report` to give more details about the error and help our team.")
                .setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
                .setTimestamp()
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


            await interaction.reply({ embeds: [errorAnswerUser], ephemeral: true });


        }
    }
}

