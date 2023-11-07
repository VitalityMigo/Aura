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
const { accessSql, profileData, adminsql, reportsql, sequelize } = require('../../../events/database');
const moment = require('moment');

const axios = require('axios')


function removeCharacter(str, charToRemove) {
    return str.split(charToRemove).filter(char => char !== charToRemove).join('');
}

function isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}


function formatWallet(input) {
    return input.length > 35 ? `${input.substring(0, 5)}…${input.substring(input.length - 4)}` : input;
}



module.exports = {
    id: 'coin_infra_tradepanel_audit-button',

    async execute(interaction) {
        if (!(interaction instanceof ButtonInteraction)) return;

        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id
        let botId = interaction.applicationId

        await interaction.deferReply({ ephemeral: true })

        try {

            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")


            const baseEmbed = interaction.message.embeds[0].data.fields
            const contract = removeCharacter(baseEmbed.find(obj => obj.name == "Contract").value, "`")

            console.log(contract)


            if (isValidEthereumAddress(contract)) {






                try {

                    const goPlusCallPromise = axios.get("https://api.gopluslabs.io/api/v1/token_security/1?contract_addresses=" + contract)



                    let securityAuditFormatted = "∙ Honeypot: `" + "   " + "`\n∙ Renounced: `" + "   " + "` | Take Back: `" + "   " + "`\n∙ Can Buy: `" + "   " + "` | Can Sell: `" + "   " + "`\n∙ Cooldown: `" + "   " + "` | Pausable: `" + "   " + "`\n∙ Blacklist: `" + "   " + "` | Whitelist: `" + "   " + "`\n∙ Tax: `" + "   " + "` | Modifiable: `" + "   " + "`\n∙ Anti Whale Protection:`" + "   " + "`"

                    let developerFormatted = "∙ Creator: `" + "   " + "` | Balance: `" + "   " + "`\n∙ Owner: `" + "   " + "` | Balance: `" + "   " + "`\n∙ Hidden Owner: `" + "   " + "`\n∙ Serial Rugger: `" + "   " + "`"

                    let poolFormatted = "∙ Liquidity: `" + "   " + "`\n∙ LP Holders: `" + "   " + "` | Team LP: `" + "   " + "`\n∙ Locked: `" + "   " + "`"



                    const gasTrackerEmbedBase = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Coin Audit")
                        .setDescription(">>> Displayng the coin audit")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "💻 SECURITY <a:AuraLoading:1134068847616458792>", value: " ", inline: false },
                            { name: " ", value: securityAuditFormatted, inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: "🥷 DEVELOPER", value: " ", inline: false },
                            { name: " ", value: developerFormatted, inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: "💸 POOL", value: " ", inline: false },
                            { name: " ", value: poolFormatted, inline: false },
                            { name: "Links", value: '[Etherscan](https://etherscan.io/address/' + contract + ") ∙ " + '[DexScreener](https://dexscreener.com/ethereum/' + contract + ") ∙ " + '[DexSpy](https://dexspy.io/eth/token/' + contract + ") ∙ " + '[Uniswap](https://app.uniswap.org/#/tokens/ethereum/' + contract + ") ∙ " + '[Honeypot](   https://honeypot.is/ethereum?address=' + contract + ")", inline: false },


                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                    await interaction.editReply({ embeds: [gasTrackerEmbedBase], components: [], ephemeral: true });






                    const [goPlusCall] = await Promise.all([goPlusCallPromise]);

                    const contractAudit = goPlusCall.data.result


                    const values = Object.values(contractAudit)

                    console.log(values)

                    // Security
                    let owner = values[0].owner_address;
                    let deployerBalance = values[0].creator_percent;
                    let deployer = values[0].creator_address
                    let ownerBalance = values[0].owner_percent
                    let honeypot = values[0].is_honeypot
                    let takeBack = values[0].can_take_back_ownership
                    let can_buy = values[0].cannot_buy
                    let can_sell = values[0].cannot_sell_all
                    let cooldown = values[0].trading_cooldown
                    let pausable = values[0].transfer_pausable
                    let blacklist = values[0].is_blacklisted
                    let whitelist = values[0].is_whitelisted
                    let buy_tax = values[0].buy_tax
                    let sell_tax = values[0].sell_tax
                    let modifiable_tax = values[0].slippage_modifiable
                    let anti_whale = values[0].is_anti_whale


                    // On formatte
                    if (honeypot == "0") { honeypot = "No ✅" }
                    else if (honeypot == "1") { honeypot = "Yes ❌" }
                    else { honeypot = "❓" }

                    let ownership = "No ❌"
                    if (owner.toLowerCase() == "0x0000000000000000000000000000000000000000" || owner.toLowerCase() == "0x000000000000000000000000000000000000dead") { ownership = "Yes ✅ " }

                    if (takeBack == "0") { takeBack = "No ✅" }
                    else if (takeBack == "1") { takeBack = "Yes ❌" }
                    else { takeBack = "❓" }

                    if (can_buy == "0") { can_buy = "Yes ✅" }
                    else if (can_buy == "1") { can_buy = "No ❌" }
                    else { can_buy = "❓" }

                    if (can_sell == "0") { can_sell = "Yes ✅" }
                    else if (can_sell == "1") { can_sell = "No ❌" }
                    else { can_sell = "❓" }

                    if (cooldown == "0") { cooldown = "No ✅" }
                    else if (cooldown == "1") { cooldown = "Yes ❌" }
                    else { cooldown = "❓" }

                    if (pausable == "0") { pausable = "No ✅" }
                    else if (pausable == "1") { pausable = "Yes ❌" }
                    else { pausable = "❓" }

                    if (blacklist == "0") { blacklist = "No ✅" }
                    else if (blacklist == "1") { blacklist = "Yes ❌" }
                    else { blacklist = "❓" }

                    if (whitelist == "0") { whitelist = "No ✅" }
                    else if (whitelist == "1") { whitelist = "Yes ❌" }
                    else { whitelist = "❓" }

                    if (modifiable_tax == "0") { modifiable_tax = "No ✅" }
                    else if (modifiable_tax == "1") { modifiable_tax = "Yes ❌" }
                    else { modifiable_tax = "❓" }

                    if (anti_whale == "0") { anti_whale = "No ❌" }
                    else if (anti_whale == "1") { anti_whale = "Yes ✅" }
                    else { anti_whale = "❓" }

                    if (buy_tax) { buy_tax = parseFloat(buy_tax) * 100 + "%"}
                    if (sell_tax) { sell_tax = parseFloat(sell_tax) * 100  + "%" }

                    if (!owner) { owner = "❓" }
                    if (!deployer) { deployer = "❓" }

                    


                    //while (true) { }

                    // On envoi la réponse
                    securityAuditFormatted = "∙ Honeypot: `" + honeypot + "`\n∙ Renounced: `" + ownership + "` | Take Back: `" + takeBack + "`\n∙ Can Buy: `" + can_buy + "` | Can Sell: `" + can_sell + "`\n∙ Cooldown: `" + cooldown + "` | Pausable: `" + pausable + "`\n∙ Blacklist: `" + blacklist + "` | Whitelist: `" + whitelist + "`\n∙ Tax: `" + buy_tax + " / " + sell_tax + "` | Modifiable: `" + modifiable_tax + "`\n∙ Anti Whale Protection: `" + anti_whale + "`"


                    const gasTrackerEmbed0 = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Coin Audit")
                        .setDescription(">>> Displayng the coin audit")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .setTimestamp()
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "💻 SECURITY", value: " ", inline: false },
                            { name: " ", value: securityAuditFormatted, inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: "🥷 DEVELOPER <a:AuraLoading:1134068847616458792>", value: " ", inline: false },
                            { name: " ", value: developerFormatted, inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: "💸 POOL", value: " ", inline: false },
                            { name: " ", value: poolFormatted, inline: false },
                            { name: "Links", value: '[Etherscan](https://etherscan.io/address/' + contract + ") ∙ " + '[DexScreener](https://dexscreener.com/ethereum/' + contract + ") ∙ " + '[DexSpy](https://dexspy.io/eth/token/' + contract + ") ∙ " + '[Uniswap](https://app.uniswap.org/#/tokens/ethereum/' + contract + ") ∙ " + '[Honeypot](   https://honeypot.is/ethereum?address=' + contract + ")", inline: false },


                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                    await interaction.editReply({ embeds: [gasTrackerEmbed0], components: [], ephemeral: true });



                    let hidden_owner = values[0].hidden_owner
                    let serial_rugger = values[0].honeypot_with_same_creator

                    if (hidden_owner == "0") { hidden_owner = "No ✅" }
                    else if (hidden_owner == "1") { hidden_owner = "Yes ❌" }
                    else { hidden_owner = "❓" }

                    if (serial_rugger == "0") { serial_rugger = "No ✅" }
                    else if (serial_rugger == "1") { serial_rugger = "Yes ❌" }
                    else { serial_rugger = "❓" }

                    if (deployerBalance) { deployerBalance = parseFloat(deployerBalance).toFixed(2) }
                    if (ownerBalance) { ownerBalance = parseFloat(ownerBalance).toFixed(2) }


                    //On edit avec les infos
                    developerFormatted = "∙ Creator: `" + formatWallet(deployer).toLowerCase() + "` | Balance: `" + deployerBalance + "%` [here](https://etherscan.io/address/" + deployer + ")\n∙ Owner: `" + formatWallet(owner).toLowerCase() + "` | Balance: `" + ownerBalance + "%` [here](https://etherscan.io/address/" + owner + ")\n∙ Hidden Owner: `" + hidden_owner + "`\n∙ Serial Rugger: `" + serial_rugger + "`"

                    const gasTrackerEmbed1 = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Coin Audit")
                        .setDescription(">>> Displayng the coin audit")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .setTimestamp()
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "💻 SECURITY", value: " ", inline: false },
                            { name: " ", value: securityAuditFormatted, inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: "🥷 DEVELOPER", value: " ", inline: false },
                            { name: " ", value: developerFormatted, inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: "💸 POOL <a:AuraLoading:1134068847616458792>", value: " ", inline: false },
                            { name: " ", value: poolFormatted, inline: false },
                            { name: "Links", value: '[Etherscan](https://etherscan.io/address/' + contract + ") ∙ " + '[DexScreener](https://dexscreener.com/ethereum/' + contract + ") ∙ " + '[DexSpy](https://dexspy.io/eth/token/' + contract + ") ∙ " + '[Uniswap](https://app.uniswap.org/#/tokens/ethereum/' + contract + ") ∙ " + '[Honeypot](   https://honeypot.is/ethereum?address=' + contract + ")", inline: false },


                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                    await interaction.editReply({ embeds: [gasTrackerEmbed1], components: [], ephemeral: true });



                    // LP token holders
                    let lp_holders = values[0].lp_holder_count
                    let lp_teamSupply = 0

                    if (lp_holders) {

                        let lp_teamTable = values[0].lp_holders.filter(obj => obj.address.toLowerCase() == owner.toLowerCase() || obj.address.toLowerCase() == deployer.toLowerCase())

                        if (lp_teamTable.length > 0) {

                            for (const team of lp_teamTable) {

                                lp_teamSupply += parseFloat(team.percent) * 100

                            }
                        }
                    }


                    // Locked liquidity
                    let lp_holder = values[0].holders
                    let lp_locked = 0

                    if (lp_holder) {
                       
                        let lp_lockedTable = lp_holder.filter(obj => obj.is_locked == 1)
                        
                        if (lp_lockedTable.length > 0) {

                            for (const lock of lp_lockedTable) {

                                lp_locked += parseFloat(lock.percent) * 100

                            }
                        }
                    }

                    let liquidity = interaction.message.embeds[0].data.fields.find(obj => obj.name == "Liquidity").value



                    poolFormatted = "∙ Liquidity: `" + liquidity + "`\n∙ LP Holders: `" + lp_holders + "` | Team LP: `" + parseFloat(lp_teamSupply).toFixed(2) + "%`\n∙ Locked: `" + parseFloat(lp_locked).toFixed(2) + "%`"


                    const gasTrackerEmbed2 = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Coin Audit")
                        .setDescription(">>> Displayng the coin audit")
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "💻 SECURITY", value: " ", inline: false },
                            { name: " ", value: securityAuditFormatted, inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: "🥷 DEVELOPER", value: " ", inline: false },
                            { name: " ", value: developerFormatted, inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: "💸 POOL", value: " ", inline: false },
                            { name: " ", value: poolFormatted, inline: false },
                            { name: "Links", value: '[Etherscan](https://etherscan.io/address/' + contract + ") ∙ " + '[DexScreener](https://dexscreener.com/ethereum/' + contract + ") ∙ " + '[DexSpy](https://dexspy.io/eth/token/' + contract + ") ∙ " + '[Uniswap](https://app.uniswap.org/#/tokens/ethereum/' + contract + ") ∙ " + '[Honeypot](   https://honeypot.is/ethereum?address=' + contract + ")", inline: false },


                        )
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                    await interaction.editReply({ embeds: [gasTrackerEmbed2], components: [], ephemeral: true });






                } catch (error) {

                    console.log(error)
                    const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Friend Tech")
                        .setDescription("An error occured whil retreiving the Coin profile. Please try again or feel free to contact a team member if you need help.")
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                    await interaction.editReply({ embeds: [errorNotEthereum], ephemeral: true });


                }





            } else {

                console.log(error)
                const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Coin Audit")
                    .setDescription("An error occured while auditing the token. Please try again or feel free to contact a team member if you need help.")
                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                await interaction.editReply({ embeds: [errorNotEthereum], ephemeral: true });


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
            let reportCommand = "/coin-audit"

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



