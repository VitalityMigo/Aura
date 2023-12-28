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
const { profileData, reportsql, infra_coin, accessSql, interactionData, adminsql, tracker_coin, infra_friendTech, sequelize } = require('../../../events/database');
const moment = require('moment');

const fs = require('fs')
const targetsJSON = 'contracts/uniswap/tracker.json';


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



module.exports = {
    id: "modal_coin_infra_tracker_",

    async execute(interaction) {


        //Récupérer informations de l'utilisateur de la commande
        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id
        let botId = interaction.applicationId

        await interaction.deferReply({ ephemeral: true })

        try {


            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")
            //Checkpoint
            console.log("// Step 2 : Authorization - Executed ✅")


            const customId = interaction.customId

            const match = customId.match(/modal_coin_infra_tracker_(.+)/);


            if (match && match[1]) {

                const action = match[1];


                if (action == "add") {

                    const addresses = interaction.fields.getTextInputValue('modal_coin_infra_tracker_' + action + 'R1');

                    // Expression régulière pour extraire les adresses Ethereum
                    const addressRegex = /0x[0-9a-fA-F]{40}/g;

                    // Trouver toutes les occurrences d'adresses Ethereum dans la chaîne
                    const addressesArray = addresses.match(addressRegex) || [];
                    const addressList = [...new Set(addressesArray.map(item => item.toLowerCase()))];
                    const addressCount = addressList.length

                    const userList = await tracker_coin.findAll({ where: { authorId: authorId } })
                    let registeredList = []
                    if (userList.length > 0) {
                        registeredList = userList.map(obj => obj.dataValues.address.toLowerCase())
                    }

                    let userListCountUpdated = userList.length
                    let confirmed = 0

                    if (userList.length < 15) {

                        if (addressCount > 0) {



                            for (const address of addressList) {

                                const add = address.toLowerCase()


                                if (!registeredList.includes(add)) {

                                    if (userListCountUpdated < 15) {

                                        await tracker_coin.create({
                                            authorId: authorId,
                                            authorName: authorName,
                                            address: add,
                                            buy: "false",
                                            sell: "false",
                                            mint: "false",
                                        })

                                        pushAddress(add, authorId)

                                        confirmed++
                                        userListCountUpdated++

                                        const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle("Coin Tracker")
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setDescription("Adding the address to your coin wallet tracker, please stand by <a:AuraLoading:1134068847616458792>")
                                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                            .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                        await interaction.editReply({ embeds: [setfpEmbedNotForYou], ephemeral: true });



                                    } else {
                                        break
                                    }
                                }

                            }


                            const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Coin Tracker")
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setDescription("Added `" + confirmed + "` address(es) to your coin wallet tracker. Refresh your dashboard to update the list ✅")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setTimestamp()
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.editReply({ embeds: [setfpEmbedNotForYou], ephemeral: true });



                        } else {

                            const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Add Address")
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setDescription("You didn't provided any Ethereum address. Please try again or contact a team member if the issue persists.")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setTimestamp()
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.editReply({ embeds: [setfpEmbedNotForYou], ephemeral: true });


                        }
                    } else {

                        const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Add Address")
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setDescription("You already reached the maximum number of wallet tracked. Please remove a wallet before adding a new one")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [setfpEmbedNotForYou], ephemeral: true });


                    }



                } else if (action == "remove") {

                    const addresses = interaction.fields.getTextInputValue('modal_coin_infra_tracker_' + action + 'R1');

                    // Expression régulière pour extraire les adresses Ethereum
                    const addressRegex = /0x[0-9a-fA-F]{40}/g;

                    // Trouver toutes les occurrences d'adresses Ethereum dans la chaîne
                    const addressesArray = addresses.match(addressRegex) || [];
                    const addressList = [...new Set(addressesArray.map(item => item.toLowerCase()))];
                    const addressCount = addressList.length

                    const userList = await tracker_coin.findAll({ where: { authorId: authorId } })
                    let registeredList = []
                    if (userList.length > 0) {
                        registeredList = userList.map(obj => obj.dataValues.address.toLowerCase())
                    }


                    if (addressCount > 0) {



                        const add = addressList[0].toLowerCase()

                        if (registeredList.includes(add)) {

                            await tracker_coin.destroy({ where: { authorId: authorId, address: add } })
                            
                            deleteAddress(add, authorId)

                            const confirmed = 1

                            const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Coin Tracker")
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setDescription("Removed `" + confirmed + "` address from your coin wallet tracker. Refresh your dashboard to update the list ✅")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setTimestamp()
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.editReply({ embeds: [setfpEmbedNotForYou], ephemeral: true });



                        } else {

                            const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                                .setTitle("Coin Tracker")
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .setDescription("The address you provided isn't registered in your coin wallet tracker. Try again with a valid address.")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setTimestamp()
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                            await interaction.editReply({ embeds: [setfpEmbedNotForYou], ephemeral: true });


                        }







                    } else {

                        const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Remove Address")
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setDescription("You didn't provided any Ethereum address. Please try again or contact a team member if the issue persists.")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                        await interaction.editReply({ embeds: [setfpEmbedNotForYou], ephemeral: true });


                    }




                }





            } else {

                const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Coin Tracker")
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

// fonctions 

function pushAddress(address, authorId) {
    let existingData = []
    if (fs.existsSync(targetsJSON)) {
        const fileContent = fs.readFileSync(targetsJSON, 'utf8');
        existingData = JSON.parse(fileContent);
    }

    if (existingData.some(item => item.address === address && item.authorId === authorId)) {
    const indexToRemove = existingData.findIndex(item => item.address === address && item.authorId === authorId);
    if (indexToRemove !== -1) {
        // L'objet a été trouvé, supprimez-le
        existingData.splice(indexToRemove, 1);
    }
}
    // Ajoutez le nouvel utilisateur à la liste existante


        let obj = {
            address: address.toLowerCase(),
            authorId: authorId
        }
        existingData.push(obj);
    

    // Écrivez le fichier JSON avec la nouvelle liste
    fs.writeFileSync(targetsJSON, JSON.stringify(existingData, null, 2));
}


function deleteAddress(address, authorId) {
    let existingData = []
    if (fs.existsSync(targetsJSON)) {
        const fileContent = fs.readFileSync(targetsJSON, 'utf8');
        existingData = JSON.parse(fileContent);
    }

    if (existingData.some(item => item.address === address && item.authorId === authorId)) {
    const indexToRemove = existingData.findIndex(item => item.address === address && item.authorId === authorId);
    if (indexToRemove !== -1) {
        // L'objet a été trouvé, supprimez-le
        existingData.splice(indexToRemove, 1);
    }
}
    // Écrivez le fichier JSON avec la nouvelle liste
    fs.writeFileSync(targetsJSON, JSON.stringify(existingData, null, 2));
}
