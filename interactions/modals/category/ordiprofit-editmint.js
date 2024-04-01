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
const { profileData, accessSql, adminsql, reportsql, interactionData, sequelize } = require('../../../events/database');
const moment = require('moment');


module.exports = {
    id: "ordiprofit-edit-mintvalue-modal",

    async execute(interaction) {


        //Récupérer informations de l'utilisateur de la commande
        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let botId = interaction.applicationId

        try {

            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")
            //Checkpoint
            console.log("// Step 2 : Authorization - Executed ✅")

            // On commence par vérifier les datas donné par le user.
            const v = interaction.fields.getTextInputValue('ordiprofit-edit-mintvalue-modalR1');
            const value = isValidNumber(v) ? parseFloat(v) : null

            if (value) {

                // On commende par defer l'update pour avoir plus de marge.
                await interaction.deferUpdate()

                // On commence par récupérer l'intéraction avec les datas dedans
                //RECUPERER STATS PROFIT LAST INTERACTION
                const storage = await interactionData.findOne({ where: { authorId: authorId, commandName: "profit", serverId: serverId } })
                const btcPrice = parseFloat(storage.dataValues.embed1)
                const data = JSON.parse(storage.dataValues.embed3)
                const raw = data.raw
                const prettier = data.prettier

                // On s'occupe maintenant d'enregistrer les nouvelles infos dans la database pour la génération du visuel
                // qui viendra récupérer ses infos. Étant donné que le visuel donne seulement le average et le total, c'est
                // ce qu'on va modifier. On commence par faire les calculs.
                // On commence par les valeurs de base.
                raw.mintValue = value
                raw.mintGas = 0
                raw.mintTotal = value
                raw.totalGas = data.buyGas + data.sellGas + data.mintGas
                raw.totalValue = raw.mintTotal + raw.buyTotal

                // Puis on fait les valeurs d'average
                if (raw.mintTotal) { raw.avgMint = raw.mintTotal / raw.mint }
                if (raw.totalValue) { raw.avgTotal = (raw.totalValue) / raw.total }
                if (raw.totalGas && raw.trade) { raw.avgGas = raw.totalGas / raw.trade }

                // Enfin, on calcul les valeurs de PNL 
                // On calcul les valeurs de profit
                raw.realisedPNL = raw.sellTotal - raw.totalValue
                raw.potentialPNL = (raw.sellTotal + raw.heldValue) - raw.totalValue

                // On calcul le ROI
                if ((raw.sellTotal + raw.heldValue) - (raw.totalValue)) {
                    raw.potentialROI = (((raw.sellTotal + raw.heldValue) - (raw.totalValue)) / (raw.totalValue)) * 100
                }

                // On formatte le ROI
                // Le ROI doit être formatter ici car il peut être infinity
                let prettierROI = parseFloat(raw.potentialROI).toFixed(2) + "%"
                if (raw.potentialROI == Infinity) {
                    prettierROI = "∞ %"
                }

                // On formatte les data avant de les renvoyer
                prettier.mintValue = parseFloat(raw.mintValue).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(raw.mintValue * btcPrice).toFixed(0)) + ")"
                prettier.mintGas = parseFloat(raw.mintGas).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(raw.mintGas * btcPrice).toFixed(0)) + ")"
                prettier.mintTotal = parseFloat(raw.mintTotal).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(raw.mintTotal * btcPrice).toFixed(0)) + ")"
                prettier.avgMint = parseFloat(raw.avgMint).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(raw.avgMint * btcPrice).toFixed(0)) + ")"
                prettier.avgTotal = parseFloat(raw.avgTotal).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(raw.avgTotal * btcPrice).toFixed(0)) + ")"
                prettier.avgGas = parseFloat(raw.avgGas).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(raw.avgGas * btcPrice).toFixed(0)) + ")"
                prettier.realisedPNL = parseFloat(raw.realisedPNL).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(raw.realisedPNL * btcPrice).toFixed(0)) + ")"
                prettier.potentialPNL = parseFloat(raw.potentialPNL).toFixed(3) + "₿ ($" + new Intl.NumberFormat('en-US').format(parseFloat(raw.potentialPNL * btcPrice).toFixed(0)) + ")"
                prettier.potentialROI = prettierROI


                // On modifie les data dans l'embed field par field avant de tout renvoyé
                let nativeEmbed = interaction.message.embeds[0].data
                nativeEmbed.fields.find(obj => obj.name === "Mint Value:").value = "`" + prettier.mintValue + "`";
                nativeEmbed.fields.find(obj => obj.name === "Mint Gas:").value = "`" + prettier.mintGas + "`";
                nativeEmbed.fields.find(obj => obj.name === "Mint Total:").value = "`" + prettier.mintTotal + "`";
                nativeEmbed.fields.find(obj => obj.name === "Avg Mint Value:").value = "`" + prettier.avgMint + "`";
                nativeEmbed.fields.find(obj => obj.name === "Avg Spent Value:").value = "`" + prettier.avgTotal + "`";
                nativeEmbed.fields.find(obj => obj.name === "Avg Gas Value:").value = "`" + prettier.avgGas + "`";
                nativeEmbed.fields.find(obj => obj.name === "Current P&L:").value = "`" + prettier.realisedPNL + "`";
                nativeEmbed.fields.find(obj => obj.name === "Potential P&L:").value = "`" + prettier.potentialPNL + "`";
                nativeEmbed.fields.find(obj => obj.name === "ROI:").value = "`" + prettier.potentialROI + "`";


                // On restock toutes les data dans le champs data
                data.raw = raw
                data.prettier = prettier


                await interactionData.update({
                    avgBuy: parseFloat(raw.avgTotal).toFixed(3),
                    realisedProfit: parseFloat(raw.realisedPNL).toFixed(3),
                    potentialProfit: parseFloat(raw.potentialPNL).toFixed(3),
                    roi: raw.potentialROI.toString(),
                    embed3: JSON.stringify(data),
                }, { where: { authorId: authorId, commandName: "profit", serverId: serverId } })

                await interaction.editReply({ embeds: [nativeEmbed], ephemeral: true });



            } else {

                const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Invalid Input")
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .setDescription("The value provided isn't valid, make sure it's in Bitcoin and it doesn't contain anything except the value itself. If the error pesists, feel free to contact our team.")
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
            let reportCommand = "/profileset"

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


function isValidNumber(entry) {
    // Utilisation de la fonction isNaN pour vérifier si l'entrée n'est pas NaN
    if (!isNaN(entry)) {
        // Utilisation de la fonction isFinite pour vérifier si l'entrée n'est pas infinie
        if (isFinite(entry)) {
            return true; // Si l'entrée est un nombre fini, retourne true
        }
    }
    return false; // Si l'entrée n'est pas un nombre fini, retourne false
}