/**
 * @file Sample modal interaction
 * @author JAYZHVJ
 * @since 3.2.0
 * @version 3.2.2
 */

/**
 * @type {import('../../../typings').ModalInteractionCommand}
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { profileData, reportsql, infra_coin, accessSql, interactionData, adminsql, sniper_friendTech, infra_friendTech, sequelize } = require('../../../events/database');
const moment = require('moment');

const encrypt = require("../../../functions/encrypt")
const decrypt = require("../../../functions/decrypt")


//Web3 API + Cloudfare Provider
const Web3 = require("web3")
const web3 = new Web3("https://cloudflare-eth.com")


function isPrivateKeyValid(privateKey) {
    // Vérifie si la clé privée a une longueur de 64 caractères.
    if (privateKey.length !== 64) {
        return false;
    }

    // Vérifie si la clé privée est composée de caractères hexadécimaux en minuscules.
    const hexRegex = /^[0-9a-f]+$/;
    return hexRegex.test(privateKey);
}


function removeCharacter(str, charToRemove) {
    return str.split(charToRemove).filter(char => char !== charToRemove).join('');
}


const buttonsRowModify = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('button_infra_coin_walletsetup_import')
            .setLabel('modify wallet')
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId('button_infra_coin_walletsetup_export')
            .setLabel('export')
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId('button_infra_coin_walletsetup_delete')
            .setLabel('delete wallet')
            .setStyle(4)
    );


const buttonsRowNew = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('button_infra_coin_walletsetup_import')
            .setLabel('import wallet')
            .setStyle(1),
        new ButtonBuilder()
            .setCustomId('button_infra_coin_walletsetup_generate')
            .setLabel('generate wallet')
            .setStyle(3),

    );


const buttonsRowConfig = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('button_infra_coin_walletsetup_valuepreset')
            .setLabel('Set Buy/Sell Preset')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('button_infra_coin_walletsetup_gaspreset')
            .setLabel('Set Gas Preset')
            .setStyle(2),
        new ButtonBuilder()
            .setCustomId('button_infra_coin_walletsetup_slippage')
            .setLabel('Set Slippage')
            .setStyle(2)
    );






module.exports = {
    id: "modal_infra_coin_walletsetup_",

    async execute(interaction) {


        //Récupérer informations de l'utilisateur de la commande
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

            const match = customId.match(/modal_infra_coin_walletsetup_(.+)/);
            console.log(match)

            if (match && match[1]) {

                const action = match[1];


                if (action == "import") {


                    //Récupère le password donné par l'utilisateur
                    const privateKey = interaction.fields.getTextInputValue('modal_infra_coin_walletsetup_importR1');


                    const userSetup = await infra_coin.findOne({ where: { authorId: authorId } })


                    if (isPrivateKeyValid(privateKey)) {

                        const account = await web3.eth.accounts.privateKeyToAccount(privateKey);

                        const walletAddress = account.address.toLowerCase()


                        const encryptWA = encrypt(walletAddress)
                        const encryptPK = encrypt(privateKey)

                        if (userSetup == null) {

                            await infra_coin.create({

                                authorId: authorId,
                                authorName: authorName,
                                walletAddress: encryptWA,
                                privateKey: encryptPK,
                                value_preset: "0.05",




                            })


                            const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Coin Setup")
                                .setDescription(">>> Displaying your coin wallet setup")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .addFields(
                                    { name: "Wallet:", value: "`" + walletAddress.toLowerCase() + "`", inline: true },
                                    { name: " ", value: " ", inline: false },
                                    { name: "Buy/Sell Preset:", value: "`0.050Ξ`", inline: true },
                                    { name: "Gas Preset:", value: "`Auto`", inline: true },
                                    { name: "Slippage:", value: "`Auto`", inline: true },
                                    { name: " ", value: " ", inline: false },
                                    { name: " ", value: "*✅ Your wallet has been succesfuly encrypted and registered to your profile.*", inline: false },


                                )
                                .setTimestamp()
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.update({ embeds: [errorNotEthereum], components: [buttonsRowModify, buttonsRowConfig] });


                        } else if (userSetup != null) {

                            let gasPreset = userSetup.dataValues.gas_preset
                            let valuePreset = parseFloat(userSetup.dataValues.value_preset).toFixed(3)
                            let slippage = userSetup.dataValues.slippage

                            if (gasPreset == null) { gasPreset = "Auto" } else { gasPreset = "+" + parseFloat(gasPreset).toFixed(0) }
                            if (slippage == null) { slippage = "Auto" } else { slippage = "+" + parseFloat(gasPreset).toFixed(0) }




                            await infra_coin.update({
                                walletAddress: encryptWA,
                                privateKey: encryptPK,
                            }, { where: { authorId: authorId } })




                            const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Coin Setup")
                                .setDescription(">>> Displaying your coin wallet setup")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .addFields(
                                    { name: "Wallet:", value: "`" + walletAddress.toLowerCase() + "`", inline: true },
                                    { name: " ", value: " ", inline: false },
                                    { name: "Buy/Sell Preset:", value: "`" + valuePreset + "Ξ`", inline: true },
                                    { name: "Gas Preset:", value: "`" + gasPreset + "`", inline: true },
                                    { name: "Slippage:", value: "`" + slippage + "`", inline: true },
                                    { name: " ", value: " ", inline: false },
                                    { name: " ", value: "*✅ Your wallet has been succesfuly encrypted and registered to your profile.*", inline: false },


                                )
                                .setTimestamp()
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.update({ embeds: [errorNotEthereum], components: [buttonsRowModify, buttonsRowConfig] });



                        }




                    } else {


                        if (userSetup != null) {

                            const walletAddress = decrypt(userSetup.dataValues.walletAddress)

                            let gasPreset = userSetup.dataValues.gas_preset
                            let valuePreset = parseFloat(userSetup.dataValues.value_preset).toFixed(3)
                            let slippage = userSetup.dataValues.slippage

                            if (gasPreset == null) { gasPreset = "Auto" } else { gasPreset = "+" + parseFloat(gasPreset).toFixed(0) }
                            if (slippage == null) { slippage = "Auto" } else { slippage = "+" + parseFloat(gasPreset).toFixed(0) }



                            const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Coin Setup")
                                .setDescription(">>> Displaying your coin wallet setup")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .addFields(
                                    { name: "Wallet:", value: "`" + walletAddress.toLowerCase() + "`", inline: true },
                                    { name: " ", value: " ", inline: false },
                                    { name: "Buy/Sell Preset:", value: "`" + valuePreset + "Ξ`", inline: true },
                                    { name: "Gas Preset:", value: "`" + gasPreset + "`", inline: true },
                                    { name: "Slippage:", value: "`" + slippage + "`", inline: true },

                                    { name: " ", value: " ", inline: false },
                                    { name: " ", value: "*❌ The private key you provided isn't valid*", inline: false },

                                )
                                .setTimestamp()
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.update({ embeds: [errorNotEthereum], components: [buttonsRowModify, buttonsRowConfig] });


                        } else if (userSetup == null) {



                            const errorNotEthereum = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Coin Setup")
                                .setDescription(">>> Displaying your coin wallet setup")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .addFields(
                                    { name: " ", value: "You don't have a wallet imported in your coin portfolio. To get started, use the button below.", inline: true },
                                    { name: " ", value: " ", inline: false },
                                    { name: "Buy/Sell Preset:", value: "`0.050Ξ`", inline: true },
                                    { name: "Gas Preset:", value: "`Auto`", inline: true },
                                    { name: "Slippage:", value: "`Auto`", inline: true },
                                    { name: " ", value: " ", inline: false },
                                    { name: " ", value: "*❌ The private key you provided isn't valid*", inline: false },

                                )
                                .setTimestamp()
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.update({ embeds: [errorNotEthereum], components: [buttonsRowNew] });

                        }


                    }


                } else if (action == "gaspreset") {



                    let gas = interaction.fields.getTextInputValue('modal_infra_coin_walletsetup_gaspresetR1');

                    gas = removeCharacter(gas, "+")
                    gas = removeCharacter(gas, "%")


                    let taskEmbed = interaction.message.embeds[0].data




                    let gasFormat = "+" + gas + "%"

                    if (gas == "" || parseFloat(gas) <= 0) { gas = null; gasFormat = 'Auto' }



                    taskEmbed.fields.find(obj => obj.name === "Gas Preset:").value = "`" + gasFormat + "`";


                    await infra_coin.update({ gas_preset: gas }, { where: { authorId: authorId } });
                    await interaction.update({ embeds: [taskEmbed], ephemeral: true });







                } else if (action == "valuepreset") {



                    let value = interaction.fields.getTextInputValue('modal_infra_coin_walletsetup_valuepresetR1');

                    value = removeCharacter(value, "+")
                    value = removeCharacter(value, "Ξ")


                    let taskEmbed = interaction.message.embeds[0].data

                    let valueFormat = value + "Ξ"

                    if (value != "" && parseFloat(value) > 0) {

                        taskEmbed.fields.find(obj => obj.name === "Buy/Sell Preset:").value = "`" + valueFormat + "`";


                        await infra_coin.update({ value_preset: value }, { where: { authorId: authorId } });
                        await interaction.update({ embeds: [taskEmbed], ephemeral: true });

                    } else {

                        await interaction.update({ embeds: [taskEmbed], ephemeral: true });


                    }

                } else if (action == "slippage") {




                    let slippage = interaction.fields.getTextInputValue('modal_infra_coin_walletsetup_slippageR1');

                    slippage = removeCharacter(slippage, "+")
                    slippage = removeCharacter(slippage, "%")


                    let taskEmbed = interaction.message.embeds[0].data

                    console.log(taskEmbed.fields)


                    let gasFormat = "+" + slippage + "%"

                    if (slippage == "" || parseFloat(slippage) <= 0) { slippage = null; gasFormat = 'Auto' }



                    taskEmbed.fields.find(obj => obj.name === "Slippage:").value = "`" + gasFormat + "`";


                    await infra_coin.update({ slippage: slippage }, { where: { authorId: authorId } });
                    await interaction.update({ embeds: [taskEmbed], ephemeral: true });



                }





            } else {

                const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Wallet Setup")
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .setDescription("An error occured while retrieving your data. Please try again or contact a team member if the issue persists.")
                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                await interaction.reply({ embeds: [setfpEmbedNotForYou], ephemeral: true });

            }


            return;

        } catch (error) {



            console.log("// Error - sent in report ❌")

            //On envoi une notif
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
            let reportCommand = "/admin-clientNew1"

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
