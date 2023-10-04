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
const { accessSql, profileData, adminsql, reportsql, sniper_friendTech, infra_friendTech, sequelize } = require('../../../events/database');
const moment = require('moment');


function removeCharacter(str, char) {
    const regex = new RegExp(char, 'g');
    return str.replace(regex, '');
}





module.exports = {
    id: "modal-friendtechtasksinfra-sniper-param-",

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

            const parts = customId.split("@");
            const action = parts[0].split("-").pop() || null;
            const uniqueId = parts[1] || null;





            if (action == "amount") {

                const amount = interaction.fields.getTextInputValue('modal-friendtechtasksinfra-sniper-param-amount@' + uniqueId + 'R1');

                if (amount > 0) {

                
                let taskEmbed = interaction.message.embeds[0].data


                taskEmbed.fields.find(obj => obj.name === "Amount/Txn").value = "`" + amount.toString() + "`";


                await sniper_friendTech.update({ amount: amount.toString(), }, { where: { authorId: authorId, randomId: uniqueId } });
                await interaction.update({ embeds: [taskEmbed], ephemeral: true });

            } else {

                const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                .setTitle("Sniper Setup")
                .setDescription("The minimum amount value is `1`, you can't snipe `0` key per snipe. Please try again.")
                .setAuthor({ name: authorName, iconURL: userAvatar })
                .setTimestamp()
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


            await interaction.reply({ embeds: [gasTrackerEmbed], ephemeral: true });


            }


            } else if (action == "target") {

                const target = interaction.fields.getTextInputValue('modal-friendtechtasksinfra-sniper-param-target@' + uniqueId + 'R1');

                const givenUsername = removeCharacter(target, "@")

                let taskEmbed = interaction.message.embeds[0].data

                if (givenUsername != "") {

                    taskEmbed.fields.find(obj => obj.name === "Target").value = "`" + givenUsername + "`";

                    await sniper_friendTech.update({ target: givenUsername, }, { where: { authorId: authorId, randomId: uniqueId } });
                    await interaction.update({ embeds: [taskEmbed], ephemeral: true });

                } else {


                    taskEmbed.fields.find(obj => obj.name === "Target").value = "`Any`";

                    await sniper_friendTech.update({ target: null, }, { where: { authorId: authorId, randomId: uniqueId } });
                    await interaction.update({ embeds: [taskEmbed], ephemeral: true });


                }





            } else if (action == "totaltask") {

                const totalTask = interaction.fields.getTextInputValue('modal-friendtechtasksinfra-sniper-param-totaltask@' + uniqueId + 'R1');

                let taskEmbed = interaction.message.embeds[0].data

                if (totalTask != "") {



                    taskEmbed.fields.find(obj => obj.name === "Total Task").value = "`" + totalTask.toString() + "`";


                    await sniper_friendTech.update({ repeat: totalTask.toString(), }, { where: { authorId: authorId, randomId: uniqueId } });
                    await interaction.update({ embeds: [taskEmbed], ephemeral: true });

                } else {


                    taskEmbed.fields.find(obj => obj.name === "Total Task").value = "`No Limit`";


                    await sniper_friendTech.update({ repeat: null, }, { where: { authorId: authorId, randomId: uniqueId } });
                    await interaction.update({ embeds: [taskEmbed], ephemeral: true });



                }


            } else if (action == "price") {


                let min = interaction.fields.getTextInputValue('modal-friendtechtasksinfra-sniper-param-price@' + uniqueId + 'R1');
                let max = interaction.fields.getTextInputValue('modal-friendtechtasksinfra-sniper-param-price@' + uniqueId + 'R2');


                min = removeCharacter(min, "Ξ")
                max = removeCharacter(max, "Ξ")



                if (max >= min || max == "") {

                    let taskEmbed = interaction.message.embeds[0].data


                    let minFormat = parseFloat(min).toFixed(3) + "Ξ"
                    let maxFormat = parseFloat(max).toFixed(3) + "Ξ"


                    if (min == "") { min = null, minFormat = "Any" }
                    if (max == "") { max = null, maxFormat = "Any" }


                    taskEmbed.fields.find(obj => obj.name === "Min. Key Price").value = "`" + minFormat + "`";
                    taskEmbed.fields.find(obj => obj.name === "Max. Key Price").value = "`" + maxFormat + "`";


                    await sniper_friendTech.update({ min_total_price: min, max_total_price: max }, { where: { authorId: authorId, randomId: uniqueId } });
                    await interaction.update({ embeds: [taskEmbed], ephemeral: true });

                } else {

                    const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Sniper Setup")
                        .setDescription("The minimum key price `(" + min + "Ξ)` cannot exceed the maximum key price `(" + max + "Ξ)`. Please try again.")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                    await interaction.reply({ embeds: [gasTrackerEmbed], ephemeral: true });


                }




            } else if (action == "supply") {


                let min = interaction.fields.getTextInputValue('modal-friendtechtasksinfra-sniper-param-supply@' + uniqueId + 'R1');
                let max = interaction.fields.getTextInputValue('modal-friendtechtasksinfra-sniper-param-supply@' + uniqueId + 'R2');


                if (max >= min || max == "") {


                    let taskEmbed = interaction.message.embeds[0].data



                    let minFormat = min
                    let maxFormat = max


                    if (min == "") { min = null, minFormat = "Any" }
                    if (max == "") { max = null, maxFormat = "Any" }


                    taskEmbed.fields.find(obj => obj.name === "Min. Supply").value = "`" + minFormat + "`";
                    taskEmbed.fields.find(obj => obj.name === "Max. Supply").value = "`" + maxFormat + "`";


                    await sniper_friendTech.update({ min_supply: min, max_supply: max }, { where: { authorId: authorId, randomId: uniqueId } });
                    await interaction.update({ embeds: [taskEmbed], ephemeral: true });

                } else {

                    const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Sniper Setup")
                        .setDescription("The minimum supply `(" + min + ")` cannot exceed the maximum supply `(" + max + ")`. Please try again.")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                    await interaction.reply({ embeds: [gasTrackerEmbed], ephemeral: true });


                }



            } else if (action == "followers") {



                let min = interaction.fields.getTextInputValue('modal-friendtechtasksinfra-sniper-param-followers@' + uniqueId + 'R1');
                let max = interaction.fields.getTextInputValue('modal-friendtechtasksinfra-sniper-param-followers@' + uniqueId + 'R2');

                if (max >= min || max == "") {

                    let taskEmbed = interaction.message.embeds[0].data

                    let minFormat = min
                    let maxFormat = max


                    if (min == "") { min = null, minFormat = "Any" }
                    if (max == "") { max = null, maxFormat = "Any" }


                    taskEmbed.fields.find(obj => obj.name === "Min. Followers").value = "`" + minFormat + "`";
                    taskEmbed.fields.find(obj => obj.name === "Max. Followers").value = "`" + maxFormat + "`";


                    await sniper_friendTech.update({ min_followers: min, max_followers: max }, { where: { authorId: authorId, randomId: uniqueId } });
                    await interaction.update({ embeds: [taskEmbed], ephemeral: true });

                } else {

                    const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Sniper Setup")
                        .setDescription("The minimum number of followers `(" + min + ")` cannot exceed the maximum number of followers `(" + max + ")`. Please try again.")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                    await interaction.reply({ embeds: [gasTrackerEmbed], ephemeral: true });


                }







            } else if (action == "twitterscore") {



                let min = interaction.fields.getTextInputValue('modal-friendtechtasksinfra-sniper-param-twitterscore@' + uniqueId + 'R1');
                let max = interaction.fields.getTextInputValue('modal-friendtechtasksinfra-sniper-param-twitterscore@' + uniqueId + 'R2');

                min = removeCharacter(min, "%")
                max = removeCharacter(max, "%")


                if (min != "") {
                    if (min > 100) { min = "100" }
                    if (min < 0) { min = "0" }
                }
                if (max != "") {
                    if (max > 100) { max = "100" }
                    if (max < 0) { max = "0" }
                }


                if (max >= min || max == "") {

                    let taskEmbed = interaction.message.embeds[0].data


                    let minFormat = min + "%"
                    let maxFormat = max + "%"


                    if (min == "") { min = null, minFormat = "Any" }
                    if (max == "") { max = null, maxFormat = "Any" }


                    taskEmbed.fields.find(obj => obj.name === "Min. Twitter Score").value = "`" + minFormat + "`";
                    taskEmbed.fields.find(obj => obj.name === "Max. Twitter Score").value = "`" + maxFormat + "`";


                    await sniper_friendTech.update({ min_twitter_score: min, max_twitter_score: max }, { where: { authorId: authorId, randomId: uniqueId } });
                    await interaction.update({ embeds: [taskEmbed], ephemeral: true });

                } else {

                    const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Sniper Setup")
                        .setDescription("The minimum twitter score `(" + min + "%)` cannot exceed the maximum twitter score `(" + max + "%)`. Please try again.")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                    await interaction.reply({ embeds: [gasTrackerEmbed], ephemeral: true });


                }





            } else if (action == "uniqueholders") {

                let min = interaction.fields.getTextInputValue('modal-friendtechtasksinfra-sniper-param-uniqueholders@' + uniqueId + 'R1');
                let max = interaction.fields.getTextInputValue('modal-friendtechtasksinfra-sniper-param-uniqueholders@' + uniqueId + 'R2');

                min = removeCharacter(min, "%")
                max = removeCharacter(max, "%")

                if (min != "") {
                    if (min > 100) { min = "100" }
                    if (min < 0) { min = "0" }
                }
                if (max != "") {
                    if (max > 100) { max = "100" }
                    if (max < 0) { max = "0" }
                }


                if (max >= min || max == "") {

                    let taskEmbed = interaction.message.embeds[0].data


                    let minFormat = min + "%"
                    let maxFormat = max + "%"


                    if (min == "") { min = null, minFormat = "Any" }
                    if (max == "") { max = null, maxFormat = "Any" }


                    taskEmbed.fields.find(obj => obj.name === "Min. Unique Holders").value = "`" + minFormat + "`";
                    taskEmbed.fields.find(obj => obj.name === "Max. Unique Holders").value = "`" + maxFormat + "`";


                    await sniper_friendTech.update({ min_unique_holders: min, max_unique_holders: max }, { where: { authorId: authorId, randomId: uniqueId } });
                    await interaction.update({ embeds: [taskEmbed], ephemeral: true });

                } else {

                    const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Sniper Setup")
                        .setDescription("The minimum ratio of unique holders `(" + min + "%)` cannot exceed the maximum ratio of unique holders `(" + max + "%)`. Please try again.")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                    await interaction.reply({ embeds: [gasTrackerEmbed], ephemeral: true });


                }



            } else if (action == "gaspreset") {


                let gas = interaction.fields.getTextInputValue('modal-friendtechtasksinfra-sniper-param-gaspreset@' + uniqueId + 'R1');

                let taskEmbed = interaction.message.embeds[0].data

                gas = removeCharacter(gas, "%")


                let gasFormat = "+" + gas + "%"

                if (gas <= 0) { gas = null; gasFormat = 'Classic' }



                taskEmbed.fields.find(obj => obj.name === "Gas Preset").value = "`" + gasFormat + "`";


                await sniper_friendTech.update({ gas_preset: gas }, { where: { authorId: authorId, randomId: uniqueId } });
                await interaction.update({ embeds: [taskEmbed], ephemeral: true });





            } else if (action == "depositamount") {


                let min = interaction.fields.getTextInputValue('modal-friendtechtasksinfra-sniper-param-depositamount@' + uniqueId + 'R1');
                let max = interaction.fields.getTextInputValue('modal-friendtechtasksinfra-sniper-param-depositamount@' + uniqueId + 'R2');


                min = removeCharacter(min, "Ξ")
                max = removeCharacter(max, "Ξ")

                if (min >= 2) {

                    if (max >= min || max == "") {

                        let taskEmbed = interaction.message.embeds[0].data


                        let minFormat = parseFloat(min).toFixed(3) + "Ξ"
                        let maxFormat = parseFloat(max).toFixed(3) + "Ξ"


                        if (min == "") { min = null, minFormat = "Any" }
                        if (max == "") { max = null, maxFormat = "Any" }


                        taskEmbed.fields.find(obj => obj.name === "Min. Deposit Value").value = "`" + minFormat + "`";
                        taskEmbed.fields.find(obj => obj.name === "Max. Deposit Value").value = "`" + maxFormat + "`";


                        await sniper_friendTech.update({ min_deposit_value: min, max_deposit_value: max }, { where: { authorId: authorId, randomId: uniqueId } });
                        await interaction.update({ embeds: [taskEmbed], ephemeral: true });

                    } else {

                        const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                            .setTitle("Sniper Setup")
                            .setDescription("The minimum deposit value `(" + min + "Ξ)` cannot exceed the maximum deposit value `(" + max + "Ξ)`. Please try again.")
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                        await interaction.reply({ embeds: [gasTrackerEmbed], ephemeral: true });


                    }

                } else {

                    const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                        .setTitle("Sniper Setup")
                        .setDescription("The minimum deposit value detected by Aura is 2Ξ, which is also the minimum value you can use on your filters (default value is 2Ξ but shows any). Please try again.")
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


                    await interaction.reply({ embeds: [gasTrackerEmbed], ephemeral: true });


                }


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
