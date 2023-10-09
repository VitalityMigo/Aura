/**
 * @file Sample getdata command with slash command.
 * @author Vitality Migø
 */

// Bouh

const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { accessSql, profileData, adminsql, reportsql, usersql, sequelize } = require('../../../events/database');
const moment = require('moment');

const main = require("../../../functions/zz")


module.exports = {
    data: new SlashCommandBuilder()
        .setName("test")
        .setDescription("Display your level of access to the bot"),

    async execute(interaction) {




            //Récupérer informations de l'utilisateur de la commande
            let authorId = interaction.user.id;
            let authorName = interaction.user.username;
            let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
            let serverId = interaction.member.guild.id
            let member = interaction.member;
            let botId = interaction.applicationId



                //Checkpoint
                console.log("// Step 1 : Initialization - Executed ✅")




                    //Checkpoint
                    console.log("// Step 2 : Authorization - Executed ✅")

                    main()


    }
}

