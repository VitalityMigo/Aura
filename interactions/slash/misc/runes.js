/**
 * @file Sample getdata command with slash command.
 * @author Vitality Migø
 */

const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { accessSql, interactionData, adminsql, wallets } = require('../../../events/database');
const moment = require('moment');

// Param d'infrastructure
const { authPrivacyMulti, communityInfos, freeAccess } = require("../../../functions/infra-utils")
const privateCMD = ['wallet', 'tracker', 'portfolio']
const excluded = ['profit']

// On importe les fonctions importantes
const isHttps = require('../../../functions/isHttps')
const { runesProfitSingle } = require("../../../functions/brccalulator")
const { isBRC20BitcoinWallet } = require("../../../functions/btc-utils")
const reduceText = require("../../../functions/reducetext")

// Fonction de formattage complémentaire
function formatWallet2(input) {
    return input.length > 35 ? `${input.substring(0, 4)}…${input.substring(input.length - 4)}` : input;
}


module.exports = {
    data: new SlashCommandBuilder()
        .setName("runes")
        .setDescription("Runes analytics features")
        .addSubcommand(subcommand =>
            subcommand
                .setName("profit")
                .setDescription("Display your profit on Runes")
                .addStringOption(option =>
                    option
                        .setName("token")
                        .setDescription("The token to analyse")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addStringOption(option =>
                    option
                        .setName("wallet")
                        .setDescription("The wallet to analyse")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addStringOption(option =>
                    option
                        .setName("timelapse")
                        .setDescription("The period of time to analyse")
                        .setRequired(false)
                        .setChoices(
                            {
                                name: 'All Time',
                                value: 'All Time',
                            },
                            {
                                name: '1 Day',
                                value: '1 Day',
                            },
                            {
                                name: '3 Days',
                                value: '3 Days',
                            },
                            {
                                name: '7 Days',
                                value: '7 Days',
                            },
                            {
                                name: '14 Days',
                                value: '14 Days',
                            },
                            {
                                name: '30 Days',
                                value: '30 Days',
                            },
                            {
                                name: '90 Days',
                                value: '90 Days',
                            },
                            {
                                name: '1 Year',
                                value: '1 Year',
                            }
                        )
                ),

        ),

    async execute(interaction) {


        if (interaction.guildId != null) {


            //Récupérer informations de l'utilisateur de la commande
            let authorId = interaction.user.id;
            let authorName = interaction.user.username;
            let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
            let serverId = interaction.member.guild.id
            let member = interaction.member;
            let botId = interaction.applicationId

            const subcommand = interaction.options.getSubcommand()

            try {

                console.log("Initialization: executed ✅")

                // Récupère les infos de la communauté
                const community = await communityInfos(serverId)

                //Récupère régagle de privé/ou pas de l'utilisateur
                const privacy = await authPrivacyMulti(authorId, subcommand, privateCMD)
                if (privacy) { await interaction.deferReply({ ephemeral: true }) }
                else { await interaction.deferReply() }


                // Les vérifications
                if (community.statut) {

                    if (community.tier === 's-tier' || community.tier === 'a-tier' || freeAccess(subcommand, excluded)) {

                        if (member.roles.cache.has(community.member)) {


                            if (subcommand === 'profit') {


                                // On ajoute le boutton
                                const visualBTN = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('profitvisual-button')
                                            .setLabel('visual')
                                            .setStyle(2)
                                            .setDisabled(true)
                                    );


                                //Variable pour les options
                                const wallet = interaction.options.getString("wallet").toLowerCase()
                                const slug = interaction.options.getString("token").toUpperCase()
                                const time = interaction.options.getString("timelapse");



                                // Une seule collection a été séléctionner


                                if (isBRC20BitcoinWallet(wallet)) {
                                    // Un seul wallet séléctionné



                                    const data = await runesProfitSingle(slug, wallet, time)
console.log(data)

                                    if (data) {

                                        // On sépare les data entre le raw et le prettier
                                        // Les raw sont les data non traité
                                        // Les prettier sont pour l'embed
                                        const raw = data.raw
                                        const prettier = data.prettier
                                        const token = data.token


                                        //Embed getRCprofitPrecisedAll
                                        const answer = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle(token.name)
                                            .setDescription(">>> Displaying the P&L made by `" + formatWallet2(wallet) + "`")
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setImage("https://cdn.discordapp.com/attachments/1100572519896977490/1185619758008254474/e.png?ex=65904572&is=657dd072&hm=7a51469cad88b48198c5f230d13450d50c7e2717c5acdf97a82a6eb1fb5adad4&")
                                            .addFields(
                                                { name: "Address:", value: "`" + wallet + "`", inline: false },
                                               
                                                { name: "Swap In:", value: "`" + prettier.swapIn + "`", inline: true },
                                                { name: "Swap Out:", value: "`" + prettier.swapOut + "`", inline: true },
                                                { name: "Airdrop & Mint:", value: "`" + prettier.airdrop + "`", inline: true },
                                               
                                                { name: "Token Bought:", value: "`" + prettier.buyAmount + "`", inline: true },
                                                { name: "Token Sold:", value: "`" + prettier.sellAmount + "`", inline: true },
                                                { name: "Token Held:", value: "`" + prettier.heldAmount + "`", inline: true },
                                               
                                                { name: "Buy Value:", value: "`" + prettier.buyValue + "`", inline: true },
                                                { name: "Sold Value:", value: "`" + prettier.sellValue + "`", inline: true },
                                                { name: "Held Value:", value: "`" + prettier.heldValue + "`", inline: true },
                                               
                                                { name: "AVG MC Buy:", value: "`" + prettier.avgMCBuy + "`", inline: true },
                                                { name: "AVG MC Sell:", value: "`" + prettier.avgMCSell + "`", inline: true },
                                                { name: "Current MC:", value: "`" + prettier.currentMC + "`", inline: true },
                                               
                                                { name: "Gas Cost:", value: "`" + prettier.totalGas + "`", inline: true },
                                                { name: "Avg Gas Cost:", value: "`" + prettier.avgGas + "`", inline: true },
                                                { name: " ", value: " ", inline: true },
                                               
                                                { name: "Realised P&L:", value: "`" + prettier.realizedPNL + "`", inline: true },
                                                { name: "Realised ROI:", value: "`" + prettier.realizedMLTP + " (" + prettier.realizedROI + ")`", inline: true },
                                                { name: " ", value: " ", inline: true },
                                               
                                                { name: "Potential P&L:", value: "`" + prettier.potentialPNL + "`", inline: true },
                                                { name: "Potential ROI:", value: "`" + prettier.potentialMLTP + " (" + prettier.potentialROI + ")`", inline: true },
                                                { name: " ", value: " ", inline: true },
                                               
                                                { name: "Links", value: '[Magic Eden](https://magiceden.io/runes/' + slug + ") ∙ " + '[Genii](https://geniidata.com/ordinals/runes/' + slug + ") ∙ " + '[Ordiscan](https://ordiscan.com/rune/' + slug + ") ∙ " + '[UniSat](https://unisat.io/runes/market?tick=' + token.name + ") ∙ " + '[Mempool](https://mempool.space/address/' + wallet + ')', inline: false },
                                            )
                                            .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                        await interaction.editReply({ embeds: [answer], components: [visualBTN] });


                                        // On enregistre les informations dans la base SQL
                                        // L'interaction sera récupéré pour générer le visuel de profit
                                        // await interactionData.destroy({ where: { authorId: authorId, commandName: "profit", serverId: serverId } })

                                        // await interactionData.create({

                                        //     authorId: authorId,
                                        //     authorName: authorName,
                                        //     serverId: serverId,
                                        //     commandName: "profit",
                                        //     interactionId: interaction.id,
                                        //     walletCategory: "eth",
                                        //     selectedCollection: collection.contract,
                                        //     floorPrice: collection.floor.toString(),
                                        //     collectionName: collection.name,
                                        //     mintCount: raw.mint.toString(),
                                        //     buyCount: raw.buy.toString(),
                                        //     soldCount: raw.sell.toString(),
                                        //     remaining: raw.held.toString(),
                                        //     avgBuy: parseFloat(raw.avgTotal).toFixed(3),
                                        //     avgSold: parseFloat(raw.avgSold).toFixed(3),
                                        //     realisedProfit: parseFloat(raw.realisedPNL).toFixed(3),
                                        //     potentialProfit: parseFloat(raw.potentialPNL).toFixed(3),
                                        //     roi: raw.potentialROI.toString(),
                                        //     totalTradeCount: JSON.stringify({
                                        //         buy: (raw.buyTotal + raw.mintTotal).toString(),
                                        //         sell: raw.sellTotal.toString(),
                                        //     }),
                                        //     userAvatar: userAvatar,
                                        // })




                                    } else {
                                        // Si il y'a une erreur lors de l'analyse des data

                                        const notMember = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle(`Runes Profit`)
                                            .setDescription("Aura can't analyze your wallet's profit data. Please try again or contact our team if the error persists.")
                                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                        await interaction.editReply({ embeds: [notMember] });



                                    }

                                } else if (wallet === "all") {
                                    // Tous les wallets séléctionnés

                                    X_Not_Available_X
                                    // On vérifie que c'est pas all et all, on ne prend en compte que les requêtes
                                    // qui prennent All wallet et une collection.
                                    if (contract !== 'all') {
                                        // C'est un all wallet et un seul contrat, on accepte et on commence la génération des profits
                                        // depuis la fonction NFT

                                        // On récupère les wallets de l'utilisateur, puis on les map pour pouvoir les mettre dans
                                        // un array qu'on met en lower cases.
                                        const storage = await wallets.findAll({ where: { authorId: authorId, walletCategory: "eth" } })
                                        const walletList = storage.map(i => i.dataValues.walletAddress.toLowerCase())
                                        const count = walletList.length

                                        // On vérifie que l'utilisateur a des wallets, sinon on renvoi une
                                        // erreur qui dit qu'il n'y a plus de wallets.
                                        if (count > 0) {

                                            const data = await baseNftProfitMulitWallet(contract, walletList, time)

                                            if (data) {

                                                // On sépare les data entre le raw et le prettier
                                                // Les raw sont les data non traité
                                                // Les prettier sont pour l'embed
                                                const raw = data.raw
                                                const prettier = data.prettier
                                                const collection = data.collection

                                                // On vérifie que la bannière est valide
                                                // Sinon on remplace par la bannière d'Aura
                                                if (!isHttps(collection.banner)) {
                                                    collection.banner = 'https://cdn.discordapp.com/attachments/1100572519896977490/1185619758008254474/e.png?ex=65904572&is=657dd072&hm=7a51469cad88b48198c5f230d13450d50c7e2717c5acdf97a82a6eb1fb5adad4&'
                                                }

                                                //Embed getRCprofitPrecisedAll
                                                const answer = new EmbedBuilder().setColor("#060A8F")
                                                    .setTitle(collection.name)
                                                    .setDescription(">>> Displaying the P&L made by `" + count + "` wallets")
                                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                                    .setImage(collection.banner)
                                                    .addFields(
                                                        { name: "Mint Value:", value: "`" + prettier.mintValue + "`", inline: true },
                                                        { name: "Mint Gas:", value: "`" + prettier.mintGas + "`", inline: true },
                                                        { name: "Mint Total:", value: "`" + prettier.mintTotal + "`", inline: true },

                                                        { name: "Buy Value:", value: "`" + prettier.buyValue + "`", inline: true },
                                                        { name: "Buy Gas:", value: "`" + prettier.buyGas + "`", inline: true },
                                                        { name: "Buy Total:", value: "`" + prettier.buyTotal + "`", inline: true },

                                                        { name: "Sales Value:", value: "`" + prettier.sellValue + "`", inline: true },
                                                        { name: "Sales Gas:", value: "`" + prettier.sellGas + "`", inline: true },
                                                        { name: "Sales Total:", value: "`" + prettier.sellTotal + "`", inline: true },

                                                        { name: "Tokens Minted:", value: "`" + prettier.mint + "`", inline: true },
                                                        { name: "Tokens Bought:", value: "`" + prettier.buy + "`", inline: true },
                                                        { name: "Airdrop & Transfer:", value: "`" + prettier.airdrop + "`", inline: true },

                                                        { name: "Tokens Sold:", value: "`" + prettier.sell + "`", inline: true },
                                                        { name: "Tokens Held:", value: "`" + prettier.held + "`", inline: true },
                                                        { name: "Transactions:", value: "`" + prettier.txs + "`", inline: true },

                                                        { name: "Avg Mint Value:", value: "`" + prettier.avgMint + "`", inline: true },
                                                        { name: "Avg Buy Value:", value: "`" + prettier.avgBuy + "`", inline: true },
                                                        { name: "Avg Spent Value:", value: "`" + prettier.avgTotal + "`", inline: true },

                                                        { name: "Avg Sold Value:", value: "`" + prettier.avgSold + "`", inline: true },
                                                        { name: "Avg Held Value:", value: "`" + prettier.avgHeld + "`", inline: true },
                                                        { name: "Avg Gas Value:", value: "`" + prettier.avgGas + "`", inline: true },

                                                        { name: "Current P&L:", value: "`" + prettier.realisedPNL + "`", inline: true },
                                                        { name: "Potential P&L:", value: "`" + prettier.potentialPNL + "`", inline: true },
                                                        { name: "ROI:", value: "`" + prettier.potentialROI + "`", inline: true },

                                                        { name: "Links", value: '[opensea](https://opensea.io/collection/' + collection.slug + ") ∙ " + '[blur](https://blur.io/collection/' + contract + ") ∙ " + '[magically](https://magically.gg/collection/' + contract + ") ∙ " + '[nerds](https://app.nftnerds.ai/collection/' + contract + ") ∙ " + '[basescan](https://basescan.org/address/' + contract + ')', inline: false },
                                                    )
                                                    .setTimestamp()
                                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                                await interaction.editReply({ embeds: [answer], components: [visualBTN] });


                                                // On enregistre les informations dans la base SQL
                                                // L'interaction sera récupéré pour générer le visuel de profit
                                                await interactionData.destroy({ where: { authorId: authorId, commandName: "profit", serverId: serverId } })

                                                await interactionData.create({

                                                    authorId: authorId,
                                                    authorName: authorName,
                                                    serverId: serverId,
                                                    commandName: "profit",
                                                    interactionId: interaction.id,
                                                    walletCategory: "eth",
                                                    selectedCollection: collection.contract,
                                                    floorPrice: collection.floor.toString(),
                                                    collectionName: collection.name,
                                                    mintCount: raw.mint.toString(),
                                                    buyCount: raw.buy.toString(),
                                                    soldCount: raw.sell.toString(),
                                                    remaining: raw.held.toString(),
                                                    avgBuy: parseFloat(raw.avgTotal).toFixed(3),
                                                    avgSold: parseFloat(raw.avgSold).toFixed(3),
                                                    realisedProfit: parseFloat(raw.realisedPNL).toFixed(3),
                                                    potentialProfit: parseFloat(raw.potentialPNL).toFixed(3),
                                                    roi: raw.potentialROI.toString(),
                                                    totalTradeCount: JSON.stringify({
                                                        buy: (raw.buyTotal + raw.mintTotal).toString(),
                                                        sell: raw.sellTotal.toString(),
                                                    }),
                                                    userAvatar: userAvatar,
                                                })

                                            } else {
                                                // Si il y'a une erreur lors de l'analyse des data

                                                const notMember = new EmbedBuilder().setColor("#060A8F")
                                                    .setTitle(`Base NFT Profit`)
                                                    .setDescription("Aura can't analyze your wallet's profit data. Please try again or contact our team if the error persists.")
                                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                                    .setTimestamp()
                                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                                await interaction.editReply({ embeds: [notMember] });



                                            }

                                        } else {

                                            const notMember = new EmbedBuilder().setColor("#060A8F")
                                                .setTitle(`Base NFT Profit`)
                                                .setDescription("Aura can't analyze your wallet's data because you don't have any wallet registered. Please use try again after adding wallets to your profile.")
                                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                .setTimestamp()
                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                            await interaction.editReply({ embeds: [notMember] });

                                        }

                                    } else {
                                        // Le all wallet et le all collection ont été séléctionné, on ne le
                                        // supporte pas donc on renvoi une erreur.

                                        const setwalletErrorEmbed = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle(`Not available`)
                                            .setDescription("We are currently optimising this feature. You can still use Base NFT profit on a **single** collection and multiple wallets with `/base profit`.")
                                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                        await interaction.editReply({ embeds: [setwalletErrorEmbed] });

                                    }

                                } else {
                                    // Problème dans la séléction du wallet

                                    const notMember = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle(`Runes Profit`)
                                        .setDescription("Aura can't analyze your wallet's data because the wallet you provided isn't a runes wallet. Please use try again using the appropriate form.")
                                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                    await interaction.editReply({ embeds: [notMember] });


                                }






                            }



                        } else {

                            const notMember = new EmbedBuilder().setColor("#060A8F")
                                .setTitle(`Bot Access`)
                                .setDescription(">>> Showing access data")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Status", value: "`Denied ❌`", inline: true },
                                    { name: "Required Role", value: "<@&" + community.member + ">", inline: true },
                                    { name: "Reason:", value: "Your access to the bot has been denied. You can only use the bot if you have the required role in this community.", inline: false },
                                )
                                .setTimestamp()
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                            await interaction.editReply({ embeds: [notMember] });

                        }

                    } else {

                        const botOff = new EmbedBuilder().setColor("#060A8F")
                            .setTitle(`Bot Access`)
                            .setDescription("You can't use this feature. The access tier of this community is too low. Please contact an admin of the community to upgrade the access ❌")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                        await interaction.editReply({ embeds: [botOff] });
                    }

                } else {

                    const botOff = new EmbedBuilder().setColor("#060A8F")
                        .setTitle(`Bot Access`)
                        .setDescription("You can't use this feature. Aura is currently inactive in this community. Please contact an admin of the community to sort out an access to the bot ❌")
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                    await interaction.editReply({ embeds: [botOff] });

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
                let reportCommand = "/cryptoprofit"


                const timeStamp = Date.now();
                const date = new Date(timeStamp);
                const dateLisible = date.toLocaleString();
                const date1 = moment(dateLisible, 'M/D/YYYY, h:mm:ss A');
                const formattedDate = date1.format('Do [of] MMMM YYYY');



                // //On enregistre le call
                // await reportsql.create({
                //     botId: botId,
                //     authorId: "Bot",
                //     serverName: serverName,
                //     authorRole: userHighestRole,
                //     serverId: serverId,
                //     date: formattedDate,
                //     reportType: "Bug",
                //     reportCommand: reportCommand,
                //     reportDescription: "```" + error.stack + "```",
                //     reportPriority: "5",
                //     reportState: "Not treated",
                // })



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
                        { name: "Content:", value: "A new `bug` has been submitted for the `" + reportCommand + "` command by `the bot report division` by `" + authorId + "`. You can use the administrator dashboard to consult it.", inline: false },
                        { name: " ", value: " ", inline: false },
                        { name: "Error:", value: "```" + reduceText(error.stack, 1000) + "```", inline: false },
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

        } else if (interaction.guildId == null) {

            const errorAnswerUser = new EmbedBuilder().setColor("#060A8F")
                .setTitle("Aura")
                .setDescription(`Hey ${interaction.user.username}, we hope you're doing well !\n\nAlthough this may be possible in the future, Aura cannot be used in DM at the moment. If you want to have access to the bot, go here: <#1108757700885622784>.\n\nIf you have any questions, don't hesitate to contact one of our team member, or directly on Discord here : <#1121110417368956958>.\n\nHave a nice day 👑`)
                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                .setTimestamp()
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


            await interaction.reply({ embeds: [errorAnswerUser], ephemeral: true });



        }

    }
}




// Fonctions
function createLink(slug, contract, twitter, website) {

    let baseLinks = '[opensea](https://opensea.io/collection/' + slug + ') ∙ ' +
        '[blur](https://blur.io/collection/' + contract + ') ∙ ' +
        '[magically](https://magically.gg/collection/' + contract + ') ∙ ' +
        '[nerds](https://app.nftnerds.ai/collection/' + contract + ') ∙ ' +
        //'[opensea pro](https://pro.opensea.io/collection/' + links.contract + ') ∙ ' +
        //'[tiny astro](https://tinyastro.io/en/analytics/eth/' + links.contract + ') ∙ ' +
        '[basescan](https://basescan.org/address/' + contract + ')';

    if (twitter !== null) {
        baseLinks += ' ∙ [twitter](https://twitter.com/' + twitter + ')';
    }

    if (isHttps(website)) {
        baseLinks += ' ∙ [website](' + website + ')';
    }

    return baseLinks;
}

function calculateAverage(arr, i, count) {
    const start = Math.max(0, i - Math.floor(count / 2));
    const end = Math.min(arr.length, i + Math.ceil(count / 2));
    const sum = arr.slice(start, end).reduce((acc, curr) => acc + curr.price, 0);
    return sum / (end - start);
}

function sortBigSales(array, max, min) {

    const result = array.filter(item => item.price <= max && item.price >= min)
    return result
}


function groupByTimestamp2(sales, numBars) {
    const result = [];

    // Triez les ventes par timestamp
    sales.sort((a, b) => a.timestamp - b.timestamp);

    // Calculez le gap total entre la première et la dernière vente
    const totalTimestampGap = sales[sales.length - 1].timestamp - sales[0].timestamp;

    // Calculez la taille de chaque barre en termes de timestamp
    const barTimestampSize = totalTimestampGap / numBars;

    // Initialisez les compteurs
    let currentBarIndex = 0;
    let currentBarSales = 0;
    let currentBarVolume = 0;
    let currentBarTimestamp = sales[0].timestamp;

    // Parcourez les ventes pour créer les barres de volume
    for (const sale of sales) {
        while (sale.timestamp >= currentBarTimestamp + barTimestampSize) {
            // Créez un objet représentant la barre actuelle
            result.push({
                index: currentBarIndex,
                sales: currentBarSales,
                total: currentBarVolume,
            });

            // Réinitialisez les compteurs pour la prochaine barre
            currentBarIndex++;
            currentBarSales = 0;
            currentBarVolume = 0;
            currentBarTimestamp += barTimestampSize;
        }

        // Mettez à jour les compteurs pour la vente actuelle
        currentBarSales++;
        currentBarVolume += sale.price;
    }

    return result;
}


function priceScale(priceOnCanvas, maxSaleLocation, maxSale) {

    // On définit les valeurs de base
    const places = 6
    const space = 88.5

    // On calcul le nombre de CM de différence entre la vente
    // max et la première échelle (initialGap)
    const firstLadder = 146
    const initialGap = firstLadder - maxSaleLocation

    // On calcul le nombre d'ETH dans un centimètre
    // en utilisant le priceOnCanvas (CM par ETH).
    // Puis on calcul le prix en ETH du premier gap
    const ethPerCm = 1 / priceOnCanvas

    const result = []

    for (let index = 0; index < places; index++) {

        let gap = maxSale - (initialGap + (index * space)) * ethPerCm;

        if (gap < 0.1) {
            gap = parseFloat(gap).toFixed(3)
        } else if (gap < 1 && gap >= 0.1) {
            gap = parseFloat(gap).toFixed(2)
        } else if (gap < 10 && gap >= 1) {
            gap = parseFloat(gap).toFixed(1)
        } else {
            gap = parseFloat(gap).toFixed(1)
        }

        result.push(gap)

    }
    return result
}

function getLastValidSale(sales) {
    const numSalesToConsider = 10;

    if (sales.length < numSalesToConsider) {
        // Il n'y a pas assez de ventes pour appliquer la logique, renvoie simplement la dernière vente
        return sales[sales.length - 1];
    }

    let i = sales.length - 1;

    while (i >= numSalesToConsider - 1) {
        const currentSales = sales.slice(i - (numSalesToConsider - 1), i + 1);
        const averagePrice = currentSales.slice(0, -1).reduce((sum, sale) => sum + sale.price, 0) / (numSalesToConsider - 1);

        const lastSale = currentSales[numSalesToConsider - 1];
        const priceDifference = Math.abs(lastSale.price - averagePrice);
        const priceThreshold = 1.0; // Ajustez selon vos besoins

        if (priceDifference <= priceThreshold) {
            // La dernière vente est cohérente, renvoie la dernière vente
            return lastSale.price;
        }

        i--;
    }

    // Si aucune vente cohérente n'est trouvée, renvoie simplement la dernière vente
    return sales[sales.length - 1].price;
}

function convertSecondsToTime(seconds) {
    const secondsInMinute = 60;
    const secondsInHour = 3600;
    const secondsInDay = 86400;
    const secondsInWeek = 604800;
    const secondsInMonth = 2592000;

    if (seconds < secondsInMinute) {
        return seconds + "s";
    } else if (seconds < secondsInHour) {
        const minutes = Math.round(seconds / secondsInMinute);
        return minutes + "m";
    } else if (seconds < secondsInDay) {
        const hours = Math.round(seconds / secondsInHour);
        return hours + "h";
    } else if (seconds < secondsInWeek) {
        const days = Math.round(seconds / secondsInDay);
        return days + "d";
    } else if (seconds < secondsInMonth) {
        const weeks = Math.round(seconds / secondsInWeek);
        return weeks + "w";
    } else {
        const months = Math.round(seconds / secondsInMonth);
        return months + "M";
    }
}

function timeScale(data, frameSZ) {

    // On met les valeurs de base
    const initialSpace = 146
    const space = 158
    const places = 7
    const littleGap = 11

    const frameTime = data[data.length - 1].timestamp
    const originTime = data[0].origin

    const timePerCm = frameTime / frameSZ
    const firstTime = originTime - (littleGap * timePerCm)

    const result = []

    for (let index = 0; index < places; index++) {

        let gap = firstTime + (((index) * space) * timePerCm)

        result.push(gap)

    }

    return result
}

function formatTimestamps(timestamps, data) {
    const firstSale = data[0].origin
    const lastSale = data[data.length - 1].origin

    const timeDiff = lastSale - firstSale;
    const oneHour = 3600; // en secondes
    const oneDay = 24 * oneHour;
    const oneWeek = 7 * oneDay;

    const firstTimestamp = timestamps[0];
    const lastTimestamp = timestamps[timestamps.length - 1];

    // On définit les timestamp variable
    let secondTimestamp = 0
    let currentDate = new Date(firstTimestamp * 1000);


    const formattedTimestamps = timestamps.map((timestamp, index) => {
        const date = new Date(timestamp * 1000); // convertir en millisecondes

        if (timeDiff <= oneDay * 2) {
            // Option 1: moins de 24 heures
            if (index === 0) {
                // C'est le premier timestamp
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            } else {
                if ((date.getDate() === new Date(firstTimestamp * 1000).getDate() && date.getMonth() === new Date(firstTimestamp * 1000).getMonth())
                    || (date.getDate() === new Date(secondTimestamp * 1000).getDate() && date.getMonth() === new Date(secondTimestamp * 1000).getMonth())) {
                    // Même jour que le premier timestamp
                    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' });
                } else {
                    // Autre jour
                    secondTimestamp = timestamp
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                }
            }
        } else if (timeDiff <= oneWeek) {
            // Option 2: Entre 1 et 7 jours
            const isSameDay = date.getDate() === currentDate.getDate();
            const isSameMonth = date.getMonth() === currentDate.getMonth();


            if (index === 0) {
                return ' '
            } else {

                if (isSameDay && isSameMonth && timeDiff > oneDay) {
                    // Répétition du jour, afficher heures/minutes
                    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' });
                } else {
                    // Nouveau jour, afficher mois/jour
                    currentDate = new Date(timestamp * 1000);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }

            }
        } else {
            // Option 3: Plus de 7 jours
            if (index === 0) {
                return ' '
            } else {

                // Nouveau jour, afficher jour/mois
                return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
            }
        }
    });
    return formattedTimestamps;
}

function formatBidPrice(bid) {

    if (bid === null) {
        return "-"
    } else {
        return parseFloat(bid).toFixed(2) + "Ξ"
    }

}


function formIndexButtons(currentPage, totalPages) {
    // Déterminez quel bouton doit être désactivé
    const isFirstPage = parseInt(currentPage) === 1;
    const isLastPage = parseInt(currentPage) === parseInt(totalPages)

    // Bouttons
    const buttonA = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_infra_collectionView')
                .setLabel('Global View')
                .setStyle(1),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_infra_tokenView')
                .setLabel('Token View')
                .setStyle(2),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_infra_sortbyvalue')
                .setLabel('Sort by value')
                .setStyle(1),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_infra_sortbyfloor')
                .setLabel('Sort by floor')
                .setStyle(2),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_infra_sortbyabc')
                .setLabel('Sort by abc')
                .setStyle(2),
        );

    // Boutons
    const buttonD = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_infra_firstPage')
                .setLabel('First page')
                .setStyle(2)
                .setDisabled(isFirstPage),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_infra_previousPage')
                .setLabel('Previous page')
                .setStyle(2)
                .setDisabled(isFirstPage),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_infra_nextPage')
                .setLabel('Next page')
                .setStyle(2)
                .setDisabled(isLastPage),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_infra_lastPage')
                .setLabel('Last page')
                .setStyle(2)
                .setDisabled(isLastPage),
        );


    const buttonB = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_exec_list')
                .setLabel('List')
                .setStyle(3)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_exec_bulkList')
                .setLabel('Bulk List')
                .setStyle(3)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_exec_acceptBid')
                .setLabel('Accept Bid')
                .setStyle(3)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_exec_acceptBulkBid')
                .setLabel('Accept Bulk Bid')
                .setStyle(3)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_exec_transfer')
                .setLabel('Transfer')
                .setStyle(3),
        );

    const buttonC = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_infra_refresh')
                .setLabel('🔁 Refresh')
                .setStyle(1),
            new ButtonBuilder()
                .setCustomId('button_nft_portfolio_infra_tutorial')
                .setLabel('📑 Tutorial')
                .setStyle(1),
            new ButtonBuilder()
                .setCustomId('button_nft_tradepanel_setup')
                .setLabel('💻 Setup')
                .setStyle(1),
        );

    // Retourne un tableau de toutes les rangées de boutons
    return [buttonD, buttonA, buttonB, buttonC];
}