/**
 * @file Sample getdata command with slash command.
 * @author Vitality Migø
 */


const fs = require('fs');


const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { profileData, accessSql, adminsql, vouchData, reportsql, usersql, sequelize } = require('../../../events/database');
const moment = require('moment');


//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const etherscanApiKey = process.env.etherscanApiKey
const reservoirApiKey = process.env.reservoirApiKey
const blockspanApiKey = process.env.blockspanApiKey
const alchemyApiKey = process.env.alchemyApiKey
const moralisApiKey = process.env.moralisApiKey
const chartApiKey = process.env.chartApiKey


const axios = require('axios')

const Moralis = require("moralis").default;
const { EvmChain } = require("@moralisweb3/common-evm-utils");
//Moralis.start({ apiKey: moralisApiKey });



module.exports = {
    data: new SlashCommandBuilder()
        .setName("sabine")
        .setDescription("Vouch for a member that helped you (call, education, skills etc)"),
        


    async execute(interaction) {


        //Récupérer informations de l'utilisateur de la commande
        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png`;
        let serverId = interaction.member.guild.id
        let member = interaction.member;


            const communityRolePerms = await accessSql.findOne({ where: { serverId: serverId } })
            let communityMemberRoleId = communityRolePerms.dataValues.memberRoleId
            let communityAdminRoleId = communityRolePerms.dataValues.adminRoleId
            let botPowerStatut = communityRolePerms.dataValues.actualPower
            let communityStatut = communityRolePerms.dataValues.statut

            const authorProfile = await profileData.findOne({ where: { authorId: authorId } })

            if (authorProfile === null) { await interaction.deferReply(); } else {
                const authorPrivacyMode = authorProfile.dataValues.privacyMode

                if (authorPrivacyMode.toLowerCase() === "private") { await interaction.deferReply({ ephemeral: true }); }
                if (authorPrivacyMode.toLowerCase() === "public") { await interaction.deferReply(); }
            }


            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")

            

                        //Checkpoint
                        console.log("// Step 2 : Authorization - Executed ✅")




                        //On enregistre le user si il est pas encore dans la database
                        const timeStamp1 = Date.now();
                        const actualTimestamp1 = parseFloat(timeStamp1 / 1000).toFixed(0)
                        const isUser = await usersql.findOne({ where: { userId: authorId, serverId: serverId } })
                        if (isUser == null) { await usersql.create({ userId: authorId, userName: authorName, userAvatar: userAvatar, serverId: serverId, timestamp: actualTimestamp1 }) }





                      



                    //     const errorAnswerUser = new EmbedBuilder().setColor("#060A8F")
                    //     .setTitle("An error occured")
                        
                    // await interaction.editReply({ embeds: [errorAnswerUser], ephemeral: true });
        
        


                        //On récupère les infos rentrés 
                       
                 


           
    }

}

