/**
 * @file Sample getdata command with slash command.
 * @author Vitality Migø
 */

// Bouh

const { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { accessSql, profileData, adminsql, interactionData, reportsql, usersql, sequelize } = require('../../../events/database');
const moment = require('moment');

// Param d'infrastructure

const { authPrivacyMulti, communityInfos, freeAccess } = require("../../../functions/infra-utils")
const privateCMD = []
const excluded = ['profit']

// Fonctions de calcul SOL
const { solCoinProfit } = require("../../../functions/solcalculator")
const { isValidSolanaAddress } = require("../../../functions/sol-utils")
const reduceText = require("../../../functions/reducetext")


const buttonsRow = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('solprofitvisual-button')
            .setLabel('visual')
            .setStyle(2)
    );


module.exports = {
    data: new SlashCommandBuilder()
        .setName("sol")
        .setDescription("Various solana coin features")
        .addSubcommand(subcommand =>
            subcommand
                .setName("coin")
                .setDescription("Display various data of a collection")
                .addStringOption(option =>
                    option
                        .setName("contract")
                        .setDescription("The coin's contract address")
                        .setRequired(true)
                    //.setAutocomplete(true)

                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("profit")
                .setDescription("Display your profit on a specific coin")
                .addStringOption(option =>
                    option
                        .setName("token")
                        .setDescription("The token address of the coin")
                        .setRequired(true)
                        .setAutocomplete(true)

                )
                .addStringOption(option =>
                    option
                        .setName("wallet")
                        .setDescription("The wallet to analyze")
                        .setRequired(true)
                    // .setAutocomplete(true)
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

                    if (community.tier === 's-tier' || freeAccess(subcommand, excluded)) {

                        if (member.roles.cache.has(community.member)) {



                            if (subcommand == 'coin') {

                                const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Solana Coin")
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setDescription("This feature isn't available yet. In the meantime, you can use `/sol profit` to display your P&L. Stay tuned, you will be able to use it soon.")
                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                    .setTimestamp()
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [setfpEmbedNotForYou] });



                            } else if (subcommand == 'profit') {

                                //Variable pour les options
                                // on récupère chacun d'entre eux
                                const contract = interaction.options.getString("token")
                                const wallet = interaction.options.getString("wallet");
                                const time = interaction.options.getString("timelapse");


                                if (isValidSolanaAddress(contract)) {


                                    if (wallet.toLowerCase() !== 'all') {



                                        if (isValidSolanaAddress(wallet)) {


                                            // On calcul les profits grâce à notre fonction
                                            const data = await solCoinProfit(contract, wallet, time)

                                            console.log(data)

                                            if (data) {

                                                // On sépare les data entre le raw et le prettier
                                                // Les raw sont les data non traité
                                                // Les prettier sont pour l'embed
                                                const raw = data.raw
                                                const prettier = data.prettier
                                                const token = data.token


                                                const cryptoProfitOneWallet = new EmbedBuilder().setColor("#060A8F")
                                                    .setTitle(reduceText(token.name, 35) + " (" + token.symbol + ")")
                                                    .setDescription(">>> Displaying your P&L on `$" + token.symbol + "`.")
                                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                                    .setImage("https://cdn.discordapp.com/attachments/1100572519896977490/1185619758008254474/e.png?ex=65904572&is=657dd072&hm=7a51469cad88b48198c5f230d13450d50c7e2717c5acdf97a82a6eb1fb5adad4&")
                                                    .addFields(
                                                        { name: "Contract:", value: "`" + token.contract + "`", inline: false },
                                                        { name: "Swap In:", value: "`" + prettier.swapIn + "`", inline: true },
                                                        { name: "Swap Out:", value: "`" + prettier.swapOut + "`", inline: true },
                                                        { name: "Airdrop & Transfer:", value: "`" + prettier.transfer + "`", inline: true },
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
                                                        { name: "Links", value: '[Etherscan](https://etherscan.io/address/' + contract + ") ∙ " + '[DexScreener](https://dexscreener.com/ethereum/' + contract + ") ∙ " + '[DexSpy](https://dexspy.io/eth/token/' + contract + ") ∙ " + '[DexAnalyzer](https://www.dexanalyzer.io/token/' + contract + ") ∙ " + '[Shuriken](https://app.shuriken.trade)', inline: false },
                                                    )
                                                    .setTimestamp()
                                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                                await interaction.editReply({ embeds: [cryptoProfitOneWallet], components: [buttonsRow] });





                                                // On stock les data d'interaction pour le visuel
                                                await interactionData.destroy({ where: { authorId: authorId, commandName: "solprofit", serverId: serverId } })

                                                await interactionData.create({
                                                    authorId: authorId,
                                                    authorName: authorName,
                                                    serverId: serverId,
                                                    walletAddress: wallet,
                                                    commandName: "solprofit",
                                                    interactionId: interaction.id,
                                                    //selecedTimestamp: time.toString(),
                                                    selectedCollection: contract,
                                                    floorPrice: token.priceSOL.toString(),
                                                    collectionName: token.name + " (" + token.symbol + ")",
                                                    collectionSlug: token.symbol,
                                                    mintCount: raw.transfer.toString(),
                                                    buyCount: raw.buyAmount.toString(),
                                                    soldCount: raw.sellAmount.toString(),
                                                    remaining: raw.heldAmount.toString(),
                                                    avgBuy: parseFloat(raw.avgMCBuy).toFixed(3),
                                                    avgSold: parseFloat(raw.avgMCSell).toFixed(3),
                                                    realisedProfit: parseFloat(raw.realizedPNL).toFixed(3),
                                                    potentialProfit: parseFloat(raw.potentialPNL).toFixed(3),
                                                    roi: raw.potentialROI.toString(),
                                                    totalTradeCount: JSON.stringify({
                                                        buy: (raw.buyValue + raw.buyGas).toString(),
                                                        sell: (raw.sellValue - raw.sellGas).toString(),
                                                    }),
                                                    userAvatar: userAvatar,
                                                    embed1: token.sol.toString()
                                                })

                                            } else {

                                                const notMember = new EmbedBuilder().setColor("#060A8F")
                                                    .setTitle(`Coin Profit`)
                                                    .setDescription("Aura can't analyze your wallet's profit data. Please try again or contact our team if the error persists.")
                                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                                    .setTimestamp()
                                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                                await interaction.editReply({ embeds: [notMember] });



                                            }



                                        } else {

                                            const notMember = new EmbedBuilder().setColor("#060A8F")
                                                .setTitle(`Coin Profit`)
                                                .setDescription("Aura can't analyze your wallet's data because the wallet you provided isn't valid. Please use try again using the appropriate form.")
                                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                .setTimestamp()
                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                            await interaction.editReply({ embeds: [notMember] });



                                        }



                                    } else if (wallet.toLowerCase() === 'all') {

                                        const setwalletErrorEmbed = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle(`Not available`)
                                            .setDescription("We are currently optimising this feature. You can still use coin profit on a **single** wallet with `/sol profit`.")
                                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                        await interaction.editReply({ embeds: [setwalletErrorEmbed] });


                                    }


                                } else {

                                    const setwalletErrorEmbed = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle(`Invalid Token Address`)
                                        .setDescription("The token address you provided isn't a valid Solana contract address. Please try again using the appropriate form.")
                                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                    await interaction.editReply({ embeds: [setwalletErrorEmbed] });



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
                console.log("//////////\n\nDetails de l'erreur :\n\n" + error.stack + "\n\n//////////")

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
                let reportCommand = "/access"

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


                await interaction.editReply({ embeds: [errorAnswerUser], ephemeral: true });


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

