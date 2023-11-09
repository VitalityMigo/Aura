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
const { accessSql, profileData, adminsql, reportsql, sniper_friendTech, order_friendTech, farmer_friendTech, sequelize } = require('../../../events/database');
const moment = require('moment');



function removeCharacter(str, charToRemove) {
    return str.split(charToRemove).filter(char => char !== charToRemove).join('');
}





module.exports = {
    id: "modal-friendtechtasksinfra-farmer-param-",

    async execute(interaction) {


        //Récupérer informations de l'utilisateur de la commande
        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let botId = interaction.applicationId
        let serverId = interaction.member.guild.id


        try {

            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")
            //Checkpoint
            console.log("// Step 2 : Authorization - Executed ✅")





            const customId = interaction.customId
            const action = customId.split("-").pop()




            if (action == "maxprice") {

                let max_price = interaction.fields.getTextInputValue('modal-friendtechtasksinfra-farmer-param-maxpriceR1');

                max_price = removeCharacter(max_price, "+")
                max_price = removeCharacter(max_price, " ")


                let max_price_formmated = parseFloat(max_price).toFixed(3) + "Ξ"

                if (max_price == "") { max_price = null, max_price_formmated = "Any" }

                let taskEmbed = interaction.message.embeds[0].data
                taskEmbed.fields.find(obj => obj.name === "Max. Buy Value").value = "`" + max_price_formmated + "`";

                await farmer_friendTech.update({ max_key_price: max_price }, { where: { authorId: authorId } });
                await interaction.update({ embeds: [taskEmbed], ephemeral: true });


            } else if (action == "minprice") {


                let min_price = interaction.fields.getTextInputValue('modal-friendtechtasksinfra-farmer-param-minpriceR1');

                min_price = removeCharacter(min_price, "+")
                min_price = removeCharacter(min_price, " ")


                let min_price_formmated = parseFloat(min_price).toFixed(3) + "Ξ"

                if (min_price == "") { min_price = null, min_price_formmated = "Any" }

                let taskEmbed = interaction.message.embeds[0].data
                taskEmbed.fields.find(obj => obj.name === "Min. Sell Value").value = "`" + min_price_formmated + "`";

                await farmer_friendTech.update({ min_key_price: min_price }, { where: { authorId: authorId } });
                await interaction.update({ embeds: [taskEmbed], ephemeral: true });


            } else if (action == "gaspreset") {



                let gas = interaction.fields.getTextInputValue('modal-friendtechtasksinfra-farmer-param-gaspresetR1');

                gas = removeCharacter(gas, "%")




                let gasFormat = "+" + gas + "%"

                if (gas == "" || parseFloat(gas) <= 0) { gas = null; gasFormat = 'Classic' }

                let taskEmbed = interaction.message.embeds[0].data
                taskEmbed.fields.find(obj => obj.name === "Gas Preset").value = "`" + gasFormat + "`";


                await farmer_friendTech.update({ gas_preset: gas }, { where: { authorId: authorId } });
                await interaction.update({ embeds: [taskEmbed], ephemeral: true });




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
            let reportCommand = "/ft-farmer-parammodal"

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
