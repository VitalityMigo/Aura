/**
 * @file Sample getdata command with slash command.
 * @author Vitality Migø
 */

// Bouh

const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { accessSql, profileData, adminsql, reportsql, usersql, sequelize } = require('../../../events/database');
const moment = require('moment');

// Param d'infrastructure
const { registerFont, createCanvas, loadImage } = require('canvas');
registerFont("./visual/alphabirds/font/utmfutura.ttf", { family: "UTM Futura Extra", weight: 'extra-bold' })
registerFont("./visual/aura/font/opt.ttf", { family: "O PTIImprovNewWideNine,O" })



module.exports = {
    data: new SlashCommandBuilder()
        .setName("test")
        .setDescription("test"),

    async execute(interaction) {


        if (interaction.guildId != null) {


            //Récupérer informations de l'utilisateur de la commande
            let authorId = interaction.user.id;
            let authorName = interaction.user.username;
            let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
            let serverId = interaction.member.guild.id
            let member = interaction.member;
            let botId = interaction.applicationId

            await interaction.deferReply({ ephemeral: true})

            //Lancement du try

            try {

                console.log("Initialization: executed ✅")

                const i = await loadImage("./visual/alphabirds/permanent/profittemplate1.png")

                const canvasFormatted = createCanvas(1920, 1080);
                const ctx = canvasFormatted.getContext('2d');

                ctx.drawImage(i, 0, 0, canvasFormatted.width, canvasFormatted.height); // Ajouter l'image de fond au canvas

                const profitTXT = "SALUT JEREM"
                ctx.fillStyle = "#ffffff";
              
                //ctx.font = `88px 'O PTIImprovNewWideNine,O'`;
                ctx.font = "88px 'UTM Futura Extra'";
                ctx.fillText(profitTXT, 300, 350);

                ctx.font = `88px 'O PTIImprovNewWideNine,O'`;
                ctx.fillText(profitTXT, 300, 650);

                // Dessiner l'image de profil sur le canvas
                const buffer2 = canvasFormatted.toBuffer('image/png');

                await interaction.editReply({ files: [buffer2] })




            } catch (error) {

                console.log(error.stack)
                console.log("erreur")


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

